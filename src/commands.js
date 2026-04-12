// This file defines the commands that are available in the command palette.

const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { sendCommandToTerminal, getFirstWorkspaceFolder } = require("./utils");
const { waitAndSetInterpreter } = require("./interpreter");
const { getTerminalCommands } = require("./terminalCommands");
const { deleteEnvIcon, updatePythonVersion } = require("./statusBarItems");
const { getConfig } = require("./config");

/**
 * Deletes a UV environment by removing the .venv directory.
 */
async function removeEnv() {
    try {
        const confirm = await vscode.window.showWarningMessage(
            'Are you sure you want to delete the virtual environment? This cannot be undone.',
            { modal: true },
            'Delete'
        );
        if (confirm !== 'Delete') return;

        const cmds = getTerminalCommands();
        vscode.window.showInformationMessage("Deleting UV environment...");
        sendCommandToTerminal(cmds.removeDir);
        deleteEnvIcon.displayDefault();
        setTimeout(() => updatePythonVersion(), 2000);
    } catch (error) {
        vscode.window.showErrorMessage("Error deleting environment");
        console.error(error);
    }
}

/**
 * Initializes a new UV project.
 */
async function initProject() {
    try {
        const cmds = getTerminalCommands();
        sendCommandToTerminal(cmds.initProject);
        vscode.window.showInformationMessage('Initialized UV project');
    } catch (error) {
        vscode.window.showErrorMessage("Error initializing UV project");
        console.error(error);
    }
}

/**
 * Creates and activates a new UV environment.
 */
async function createEnv() {
    try {
        const cmds = getTerminalCommands();
        sendCommandToTerminal(cmds.createVenv);
        sendCommandToTerminal(cmds.activateVenv);
        vscode.window.showInformationMessage('Created and activated UV environment');
        setTimeout(() => updatePythonVersion(), 3000);

        // Automatically set the Python interpreter after environment creation
        if (getConfig().autoSetInterpreter) {
            const workspaceFolder = getFirstWorkspaceFolder();
            if (workspaceFolder) {
                waitAndSetInterpreter(workspaceFolder).catch(err => {
                    console.error('Failed to auto-set interpreter after environment creation:', err);
                });
            }
        }
    } catch (error) {
        vscode.window.showErrorMessage("Error creating UV environment");
        console.error(error);
    }
}

/**
 * Syncs UV dependencies with pyproject.toml.
 */
async function syncDependencies() {
    try {
        const cmds = getTerminalCommands();
        // Offer the user a preview (dry-run) before running actual sync
        const choice = await vscode.window.showQuickPick(
            ['Preview changes', 'Run sync now', 'Cancel'],
            { placeHolder: 'Preview the changes that `uv sync` will perform or run sync now' }
        );

        if (!choice || choice === 'Cancel') {
            return;
        }

        if (choice === 'Preview changes') {
            // send a dry-run variant of uv sync to the terminal
            sendCommandToTerminal(`${cmds.syncDeps} --dry-run`);
            vscode.window.showInformationMessage('Previewing UV sync (dry-run) in terminal');
        } else {
            sendCommandToTerminal(cmds.syncDeps);
            vscode.window.showInformationMessage('Synced UV dependencies');
        }

        // Auto-set interpreter after sync (in case environment was just created)
        if (getConfig().autoSetInterpreter) {
            const workspaceFolder = getFirstWorkspaceFolder();
            if (workspaceFolder) {
                waitAndSetInterpreter(workspaceFolder).catch(err => {
                    console.error('Failed to auto-set interpreter after sync:', err);
                });
            }
        }
    } catch (error) {
        vscode.window.showErrorMessage("Error syncing UV dependencies");
        console.error(error);
    }
}

/**
 * Activates an existing UV environment.
 */
async function activateEnv() {
    try {
        const cmds = getTerminalCommands();
        sendCommandToTerminal(cmds.activateVenv);
        vscode.window.showInformationMessage("UV environment activated");
        setTimeout(() => updatePythonVersion(), 2000);

        // Automatically set the Python interpreter when activating
        if (getConfig().autoSetInterpreter) {
            const workspaceFolder = getFirstWorkspaceFolder();
            if (workspaceFolder) {
                waitAndSetInterpreter(workspaceFolder).catch(err => {
                    console.error('Failed to auto-set interpreter on activation:', err);
                });
            }
        }
    } catch (error) {
        vscode.window.showErrorMessage("Failed to activate UV environment");
        console.error(error);
    }
}

/**
 * Adds a package to the project using uv add.
 */
async function addPackage() {
    try {
        const input = await vscode.window.showInputBox({
            prompt: 'Package to add',
            placeHolder: 'e.g., requests, flask>=2.0, numpy',
        });
        if (!input) return;

        sendCommandToTerminal(`uv add ${input}`);
        vscode.window.showInformationMessage(`Adding ${input}...`);

        setTimeout(() => updatePythonVersion(), 3000);
    } catch (error) {
        vscode.window.showErrorMessage("Error adding package");
        console.error(error);
    }
}

/**
 * Removes a package from the project using uv remove.
 * Can be invoked from command palette (shows QuickPick) or tree context menu (receives item directly).
 */
async function removePackage() {
    try {
        const deps = readDependencyNames();
        if (deps.length === 0) {
            vscode.window.showInformationMessage('No dependencies found in pyproject.toml');
            return;
        }
        const packageName = await vscode.window.showQuickPick(deps, {
            placeHolder: 'Select package to remove',
        });

        if (!packageName) return;

        sendCommandToTerminal(`uv remove ${packageName}`);
        vscode.window.showInformationMessage(`Removing ${packageName}...`);

    } catch (error) {
        vscode.window.showErrorMessage("Error removing package");
        console.error(error);
    }
}

/**
 * Reads dependency names from pyproject.toml for QuickPick.
 */
function readDependencyNames() {
    const { parsePyprojectDependencies } = require('./tomlParser');
    const folder = getFirstWorkspaceFolder();
    if (!folder) return [];

    const pyproject = path.join(folder.uri.fsPath, 'pyproject.toml');
    if (!fs.existsSync(pyproject)) return [];

    try {
        const text = fs.readFileSync(pyproject, 'utf8');
        const { main } = parsePyprojectDependencies(text);
        return main.map(d => d.name);
    } catch {
        return [];
    }
}

/**
 * Shows available scripts from pyproject.toml and runs the selected one.
 */
async function runScript() {
    try {
        const folder = getFirstWorkspaceFolder();
        if (!folder) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        const pyproject = path.join(folder.uri.fsPath, 'pyproject.toml');
        if (!fs.existsSync(pyproject)) {
            vscode.window.showErrorMessage('No pyproject.toml found');
            return;
        }

        const text = fs.readFileSync(pyproject, 'utf8');

        const { parsePyprojectScripts } = require('./tomlParser');
        const scripts = parsePyprojectScripts(text);
        if (scripts.length === 0) {
            vscode.window.showInformationMessage('No scripts found in pyproject.toml [project.scripts]');
            return;
        }

        const choice = await vscode.window.showQuickPick(scripts, {
            placeHolder: 'Select script to run with uv run',
        });
        if (!choice) return;

        sendCommandToTerminal(`uv run ${choice}`);
        vscode.window.showInformationMessage(`Running ${choice}...`);
    } catch (error) {
        vscode.window.showErrorMessage("Error running script");
        console.error(error);
    }
}

/**
 * Runs uv lock to update the lock file.
 */
async function lock() {
    try {
        const cmds = getTerminalCommands();
        sendCommandToTerminal(cmds.lock);
        vscode.window.showInformationMessage('Running uv lock...');
    } catch (error) {
        vscode.window.showErrorMessage("Error running uv lock");
        console.error(error);
    }
}

module.exports = {
    removeEnv,
    initProject,
    createEnv,
    syncDependencies,
    activateEnv,
    addPackage,
    removePackage,
    runScript,
    lock,
};

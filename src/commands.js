// This file defines the commands that are available in the command palette.

const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { sendCommandToTerminal, getFirstWorkspaceFolder } = require("./utils");
const { waitAndSetInterpreter } = require("./interpreter");
const { getTerminalCommands } = require("./terminalCommands");
const { deleteEnvIcon, updatePythonVersion } = require("./statusBarItems");
const { getConfig } = require("./config");
const { parsePyprojectDependencies, parsePyprojectScripts } = require('./tomlParser');

/**
 * Fire-and-forget: sets the workspace Python interpreter if enabled in config.
 */
function tryAutoSetInterpreter() {
    if (!getConfig().autoSetInterpreter) return;
    const folder = getFirstWorkspaceFolder();
    if (folder) {
        waitAndSetInterpreter(folder).catch(() => {});
    }
}

async function removeEnv() {
    const confirm = await vscode.window.showWarningMessage(
        'Are you sure you want to delete the virtual environment? This cannot be undone.',
        { modal: true },
        'Delete'
    );
    if (confirm !== 'Delete') return;

    const cmds = getTerminalCommands();
    sendCommandToTerminal(cmds.removeDir);
    deleteEnvIcon.displayDefault();
    setTimeout(() => updatePythonVersion(), 2000);
}

function initProject() {
    const cmds = getTerminalCommands();
    sendCommandToTerminal(cmds.initProject);
    vscode.window.showInformationMessage('Initialized UV project');
}

function createEnv() {
    const cmds = getTerminalCommands();
    sendCommandToTerminal(cmds.createVenv);
    sendCommandToTerminal(cmds.activateVenv);
    vscode.window.showInformationMessage('Created and activated UV environment');
    setTimeout(() => updatePythonVersion(), 3000);
    tryAutoSetInterpreter();
}

async function syncDependencies() {
    const cmds = getTerminalCommands();
    const choice = await vscode.window.showQuickPick(
        ['Run sync now', 'Preview changes (dry-run)', 'Cancel'],
        { placeHolder: 'Sync UV dependencies with pyproject.toml' }
    );

    if (!choice || choice === 'Cancel') return;

    if (choice === 'Preview changes (dry-run)') {
        sendCommandToTerminal(`${cmds.syncDeps} --dry-run`);
        vscode.window.showInformationMessage('Previewing UV sync (dry-run) in terminal');
    } else {
        sendCommandToTerminal(cmds.syncDeps);
        vscode.window.showInformationMessage('Synced UV dependencies');
    }

    tryAutoSetInterpreter();
}

function activateEnv() {
    const cmds = getTerminalCommands();
    sendCommandToTerminal(cmds.activateVenv);
    vscode.window.showInformationMessage("UV environment activated");
    setTimeout(() => updatePythonVersion(), 2000);
    tryAutoSetInterpreter();
}

async function addPackage() {
    const input = await vscode.window.showInputBox({
        prompt: 'Package to add',
        placeHolder: 'e.g., requests, flask>=2.0, numpy',
    });
    if (!input) return;

    sendCommandToTerminal(`uv add ${input}`);
    vscode.window.showInformationMessage(`Adding ${input}...`);
    setTimeout(() => updatePythonVersion(), 3000);
}

async function removePackage() {
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
}

function readDependencyNames() {
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

async function runScript() {
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
}

function lock() {
    const cmds = getTerminalCommands();
    sendCommandToTerminal(cmds.lock);
    vscode.window.showInformationMessage('Running uv lock...');
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

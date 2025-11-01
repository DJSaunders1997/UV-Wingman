// This file defines the commands that are available in the command palette.

const vscode = require("vscode");
const { sendCommandToTerminal, getFirstWorkspaceFolder } = require("./utils");
const { waitAndSetInterpreter, getVenvInterpreterPath, setWorkspacePythonInterpreter } = require("./interpreter");
const { getTerminalCommands } = require("./terminalCommands");
const { deleteEnvIcon } = require("./statusBarItems");

/**
 * Deletes a UV environment by removing the .venv directory.
 */
async function removeEnv() {
    try {
        const cmds = getTerminalCommands();
        vscode.window.showInformationMessage("Deleting UV environment...");
        sendCommandToTerminal(cmds.removeDir);
        deleteEnvIcon.displayDefault();
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
        
        // Automatically set the Python interpreter after environment creation
        const workspaceFolder = getFirstWorkspaceFolder();
        if (workspaceFolder) {
            // Fire-and-forget: don't block the command, but set interpreter in background
            waitAndSetInterpreter(workspaceFolder).catch(err => {
                console.error('Failed to auto-set interpreter after environment creation:', err);
            });
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
        sendCommandToTerminal(cmds.syncDeps);
        vscode.window.showInformationMessage('Synced UV dependencies');
        
        // Auto-set interpreter after sync (in case environment was just created)
        const workspaceFolder = getFirstWorkspaceFolder();
        if (workspaceFolder) {
            waitAndSetInterpreter(workspaceFolder).catch(err => {
                console.error('Failed to auto-set interpreter after sync:', err);
            });
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
        
        // Automatically set the Python interpreter when activating
        const workspaceFolder = getFirstWorkspaceFolder();
        if (workspaceFolder) {
            const interpreter = getVenvInterpreterPath(workspaceFolder);
            if (interpreter) {
                // Fire-and-forget: don't block the command, but set interpreter in background
                setWorkspacePythonInterpreter(interpreter).then(success => {
                    if (success) {
                        vscode.window.showInformationMessage(
                            'Python interpreter automatically set to .venv interpreter',
                            { timeout: 3000 }
                        );
                    }
                }).catch(err => {
                    console.error('Failed to auto-set interpreter on activation:', err);
                });
            }
        }
    } catch (error) {
        vscode.window.showErrorMessage("Failed to activate UV environment");
        console.error(error);
    }
}

module.exports = {
    removeEnv,
    initProject,
    createEnv,
    syncDependencies,
    activateEnv
};

// This file defines the commands that are available in the command palette.

const vscode = require("vscode");
const { sendCommandToTerminal } = require("./utils");
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

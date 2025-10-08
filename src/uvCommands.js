// This file contains JS functions that call UV commands in the terminal

const vscode = require("vscode");

const {
  sendCommandToTerminal
} = require("./utils");
const { getTerminalCommands } = require("./terminalCommands");

/**
 * Deletes a UV environment.
 */
function uvRemoveEnv() {
    try {
        const cmds = getTerminalCommands();
        const envName = ".venv";
        vscode.window.showInformationMessage(`Deleting environment: ${envName}.`);
        console.log(`Deleting environment: ${envName}.`);
        sendCommandToTerminal(cmds.removeDir);
    } catch (error) {
        vscode.window.showErrorMessage("Error deleting environment.");
        console.log("Error deleting environment.");
        console.error(error);
    }
}

/**
 * Initializes a new UV project.
 */
async function uvInitProject() {
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
 * Creates a new UV environment.
 */
async function uvCreateEnv() {
    try {
        const cmds = getTerminalCommands();
        sendCommandToTerminal(cmds.activateVenv);
        vscode.window.showInformationMessage('Activated UV environment');
    } catch (error) {
        vscode.window.showErrorMessage("Error activating UV environment");
        console.error(error);
    }
}

/**
 * Syncs UV dependencies.
 */
async function uvSyncDependencies() {
    try {
        const cmds = getTerminalCommands();
        sendCommandToTerminal(cmds.syncDeps);
        vscode.window.showInformationMessage('Synced UV dependencies');
    } catch (error) {
        vscode.window.showErrorMessage("Error syncing UV dependencies");
        console.error(error);
    }
}

module.exports = {
    uvRemoveEnv,
    uvInitProject,
    uvCreateEnv,
    uvSyncDependencies,
};
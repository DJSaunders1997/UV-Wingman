// Centralized configuration reader for UV Wingman settings

const vscode = require('vscode');

/**
 * Reads UV Wingman extension settings from workspace configuration.
 * @returns {{ envName: string, showStatusBarItems: boolean, autoSetInterpreter: boolean }}
 */
function getConfig() {
    const config = vscode.workspace.getConfiguration('uvWingman');
    return {
        envName: config.get('envName', '.venv'),
        showStatusBarItems: config.get('showStatusBarItems', true),
        autoSetInterpreter: config.get('autoSetInterpreter', true),
    };
}

module.exports = { getConfig };

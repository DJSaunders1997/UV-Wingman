// This file handles Python interpreter management for UV environments

const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const { getFirstWorkspaceFolder } = require('./utils');
const { getConfig } = require('./config');

/**
 * Return the Python interpreter path for the configured env directory (or null).
 * Uses the uvWingman.envName setting to determine the env folder.
 */
function getVenvInterpreterPath(workspaceFolder) {
    let folder = workspaceFolder;
    if (!folder) {
        folder = getFirstWorkspaceFolder();
    }
    if (!folder) {
        return null;
    }

    const base = folder.uri.fsPath;
    const { envName } = getConfig();

    let candidates;

    if (process.platform === 'win32') {
      candidates = [
        path.join(base, envName, 'Scripts', 'python.exe'),
        path.join(base, envName, 'Scripts', 'python')
      ];
    } else {
      candidates = [
        path.join(base, envName, 'bin', 'python'),
        path.join(base, envName, 'bin', 'python3')
      ];
    }

    for (const p of candidates) {
        if (fs.existsSync(p)) {
            return p;
        }
    }

    return null;
}

/**
 * Update workspace Python interpreter settings to point to the given interpreter path.
 * Uses the modern "python.defaultInterpreterPath" setting.
 */
async function setWorkspacePythonInterpreter(interpreterPath) {
    if (!interpreterPath) return false;
    try {
        const pythonConfig = vscode.workspace.getConfiguration('python');
        // modern setting
        await pythonConfig.update('defaultInterpreterPath', interpreterPath, vscode.ConfigurationTarget.Workspace);
        console.log(`Successfully set workspace Python interpreter to: ${interpreterPath}`);
        return true;
    } catch (err) {
        console.error('Failed to set workspace interpreter:', err);
        return false;
    }
}

/**
 * Polls for the .venv Python interpreter and sets it once found.
 * Retries up to maxAttempts times with intervalMs between each check,
 * because terminal commands (uv venv, uv sync) run asynchronously.
 * @param {vscode.WorkspaceFolder} workspaceFolder - The workspace folder to check
 * @param {number} [maxAttempts=15] - Maximum number of polling attempts
 * @param {number} [intervalMs=1000] - Milliseconds between attempts
 * @returns {Promise<boolean>} True if interpreter was set, false otherwise
 */
async function waitAndSetInterpreter(workspaceFolder, maxAttempts = 15, intervalMs = 1000) {
    for (let i = 0; i < maxAttempts; i++) {
        const interpreter = getVenvInterpreterPath(workspaceFolder);
        if (interpreter) {
            const success = await setWorkspacePythonInterpreter(interpreter);
            if (success) {
                vscode.window.showInformationMessage(
                    'Python interpreter set to .venv'
                );
                return true;
            }
            return false;
        }
        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    console.warn('waitAndSetInterpreter: interpreter not found after polling');
    return false;
}

module.exports = {
    getVenvInterpreterPath,
    setWorkspacePythonInterpreter,
    waitAndSetInterpreter,
};


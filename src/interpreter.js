// This file handles Python interpreter management for UV environments

const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const { getFirstWorkspaceFolder } = require('./utils');

/**
 * Return the .venv python interpreter path for the given workspace folder (or null).
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

    // Build a list of file paths to check for the python executable inside .venv.
    let candidates;

    // On Windows virtualenv python is usually under .venv\Scripts.
    // We check both python.exe and a plain 'python' in case of different setups.
    if (process.platform === 'win32') {
      candidates = [
        path.join(base, '.venv', 'Scripts', 'python.exe'),
        path.join(base, '.venv', 'Scripts', 'python')
      ];
    } else {
      // On macOS/Linux it's usually under .venv/bin.
      // Check both 'python' and 'python3' so we handle venvs created with different python versions.
      candidates = [
        path.join(base, '.venv', 'bin', 'python'),
        path.join(base, '.venv', 'bin', 'python3')
      ];
    }

    // Return the first existing candidate.
    for (const p of candidates) {
        if (fs.existsSync(p)) {
            return p;
        }
    }

    return null;
}

/**
 * Update workspace Python interpreter settings to point to the given interpreter path.
 * Updates both "python.defaultInterpreterPath" and legacy "python.pythonPath" for compatibility.
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
 * Sets the Python interpreter if the .venv directory exists.
 * @param {vscode.WorkspaceFolder} workspaceFolder - The workspace folder to check
 * @returns {Promise<boolean>} True if interpreter was set, false otherwise
 */
async function waitAndSetInterpreter(workspaceFolder) {
    const interpreter = getVenvInterpreterPath(workspaceFolder);
    if (interpreter) {
        const success = await setWorkspacePythonInterpreter(interpreter);
        if (success) {
            vscode.window.showInformationMessage(
                `Python interpreter automatically set to .venv interpreter`,
                { timeout: 3000 }
            );
            return true;
        }
        return false;
    }
    return false;
}

module.exports = {
    getVenvInterpreterPath,
    setWorkspacePythonInterpreter,
    waitAndSetInterpreter,
};


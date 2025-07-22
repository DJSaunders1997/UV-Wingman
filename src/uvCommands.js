// This file contains JS functions that call UV commands in the terminal

const vscode = require("vscode");

const {
  sendCommandToTerminal
} = require("./utils");
const { getTerminalCommands } = require("./terminalCommands");

/**
 * builds a UV environment using a requirements.txt file.
 * @param {string} filename Path to the requirements.txt file.
 */
async function uvBuildEnv(filename) {
    try {
        const pythonVersion = await vscode.window.showInputBox({
            placeHolder: "Enter Python version (e.g., 3.13)",
            value: "", // Default value
            validateInput: (text) => {
                if (!text) return "Python version cannot be empty!";
                if (!/^\d+\.\d+$/.test(text)) return "Invalid Python version format!";
            },
        });

        if (!pythonVersion) {
            vscode.window.showErrorMessage("Python version is required to create the environment.");
            return;
        }

        const cmds = getTerminalCommands();

        vscode.window.showInformationMessage(`Activating environment from ${filename} with Python ${pythonVersion}.`);
        console.log(`Activating environment from ${filename} with Python ${pythonVersion}.`);

        sendCommandToTerminal(cmds.removeDir);
        sendCommandToTerminal(cmds.createVenv(pythonVersion));
        sendCommandToTerminal(cmds.activateVenv);

        uvInstallPackages(filename);
    } catch (error) {
        vscode.window.showErrorMessage("Error activating environment from requirements file.");
        console.log("Error activating environment from requirements file.");
        console.error(error);
    }
}

/**
 * builds a UV environment using a requirements.txt file.
 * @param {string} filename Path to the requirements.txt file.
 */
function uvInstallPackages(filename) {
    try {
        const cmds = getTerminalCommands();
        vscode.window.showInformationMessage(`Installing packages from ${filename}.`);
        console.log(`Installing packages from ${filename}.`);
        sendCommandToTerminal(cmds.pipInstall(filename));
    } catch (error) {
        vscode.window.showErrorMessage("Error installing packages from requirements file.");
        console.log("Error installing packages from requirements file.");
        console.error(error);
    }
}

/**
 * Shows an input box to create a requirements.txt file.
 * @param {string} defaultValue Default name for the requirements.txt file.
 */
async function uvWriteRequirements(defaultValue) {
    const result = await vscode.window.showInputBox({
        value: defaultValue,
        placeHolder: "Name of the requirements.txt file",
        validateInput: (text) => {
            if (!text) return "You cannot leave this empty!";
            if (!text.toLowerCase().endsWith(".txt")) {
                return "Only .txt files are supported!";
            }
        },
    });

    if (!result) {
        vscode.window.showErrorMessage("Cannot create requirements file without a name.");
        return;
    }

    const cmds = getTerminalCommands();
    vscode.window.showInformationMessage(`Creating requirements file: '${result}'.`);
    console.log(`Creating requirements file: '${result}'.`);
    sendCommandToTerminal(cmds.freeze(result));
}

/**
 * Deletes a UV environment.
 * @param {string} envName Name of the environment to delete.
 */
function uvRemoveEnv(envName) {
    try {
        const cmds = getTerminalCommands();
        envName = ".venv"; // TODO: Make user customisable
        vscode.window.showInformationMessage(`Deleting environment: ${envName}.`);
        console.log(`Deleting environment: ${envName}.`);
        sendCommandToTerminal(cmds.removeDir);
    } catch (error) {
        vscode.window.showErrorMessage("Error deleting environment.");
        console.log("Error deleting environment.");
        console.error(error);
    }
}

module.exports = {
    uvBuildEnv,
    uvInstallPackages,
    uvWriteRequirements,
    uvRemoveEnv,
};
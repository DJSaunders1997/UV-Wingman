const vscode = require("vscode");
const fs = require("fs");

/**
 * Sends a command to the terminal.
 * If no terminal exists, creates a new one.
 * @param {string} command Command to send to the terminal
 */
function sendCommandToTerminal(command) {
  let terminal = vscode.window.activeTerminal;

  if (!terminal) {
    vscode.window.showInformationMessage(
      "No active terminal found. Creating new terminal."
    );
    console.log("No active terminal found. Creating new terminal.");
    terminal = vscode.window.createTerminal();
  }

  terminal.show();
  terminal.sendText(command);

  console.log(`Command '${command}' sent to terminal.`);
}

/**
 * Checks if the active file matches "requirements*.txt".
 * @returns {boolean} True if the active file matches the pattern.
 */
function activeFileIsRequirementsTxt() {
  const editor = vscode.window.activeTextEditor;

  if (!editor) return false;

  const activeFilename = editor.document.fileName.split(/[/\\]/).pop();
  const pattern = /^requirements.*\.txt$/i;

  return pattern.test(activeFilename);
}

/**
 * Gets the file path of the open document, formatted for all operating systems.
 * @returns {string} The formatted file path of the open document.
 */
function getOpenDocumentPath() {
  const activeEditor = vscode.window.activeTextEditor;

  if (!activeEditor) return null;

  let filename = activeEditor.document.fileName;
  console.log(`Filename is: ${filename}`);

  // Normalize file path for all OS
  filename = filename.replace(/\\/g, "/");
  console.log(`Amended filename is: ${filename}`);

  return filename;
}

/**
 * builds a UV environment using a requirements.txt file.
 * @param {string} filename Path to the requirements.txt file.
 */
function buildEnv(filename) {
  try {
    vscode.window.showInformationMessage(`Activating environment from ${filename}.`);
    console.log(`Activating environment from ${filename}.`);
    // TODO: Have python version as input box
    // https://docs.astral.sh/uv/pip/environments/#creating-a-virtual-environment
    sendCommandToTerminal(`uv venv`);

    sendCommandToTerminal(`source .venv/bin/activate`);

    // https://docs.astral.sh/uv/pip/packages/#installing-packages-from-files
    sendCommandToTerminal(`uv pip install -r ${filename}`);
  } catch (error) {
    vscode.window.showErrorMessage("Error activating environment from requirements file.");
    console.log("Error activating environment from requirements file.");
    console.error(error);
  }
}

/**
 * Deletes a UV environment.
 * @param {string} envName Name of the environment to delete.
 */
function deleteEnvByName(envName) {
  try {
    vscode.window.showInformationMessage(`Deleting environment: ${envName}.`);
    console.log(`Deleting environment: ${envName}.`);

    // Ensure no environment is active
    sendCommandToTerminal("uv debuild");

    const command = `uv delete-env --name ${envName}`;
    sendCommandToTerminal(command);
  } catch (error) {
    vscode.window.showErrorMessage("Error deleting environment.");
    console.log("Error deleting environment.");
    console.error(error);
  }
}

/**
 * Shows an input box to create a requirements.txt file.
 * @param {string} defaultValue Default name for the requirements.txt file.
 */
async function createRequirementsInputBox(defaultValue) {
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

  vscode.window.showInformationMessage(`Creating requirements file: '${result}'.`);
  console.log(`Creating requirements file: '${result}'.`);

  const command = `uv pip freeze > "${result}"`;
  sendCommandToTerminal(command);
}

/**
 * Reads the environment name from a requirements.txt file.
 * @param {string} filename Path to the requirements.txt file.
 * @returns {string} The name of the environment.
 */
function getEnvName(filename) {
  // Assume the environment name is derived from the filename for simplicity.
  const envName = filename.split(/[/\\]/).pop().replace(".txt", "");
  console.log(`Environment name derived from requirements file: ${envName}`);
  return envName;
}

module.exports = {
  sendCommandToTerminal,
  activeFileIsRequirementsTxt,
  getOpenDocumentPath,
  buildEnv,
  createRequirementsInputBox,
  deleteEnvByName,
};

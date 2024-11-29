// This file contains helpful utility funcitons

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
};

// This file contains helpful utility functions

const vscode = require("vscode");

/**
 * Sends a command to the terminal.
 * If no terminal exists, creates a new one.
 * Detects the terminal type and adjusts commands accordingly.
 * @param {string} command Command to send to the terminal
 */
function sendCommandToTerminal(command) {
  let terminal = vscode.window.activeTerminal;

  if (!terminal) {
    vscode.window.showInformationMessage(
      "No active terminal found. Creating new terminal."
    );
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

module.exports = {
  sendCommandToTerminal,
  activeFileIsRequirementsTxt,
  getOpenDocumentPath,
};

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

module.exports = {
  sendCommandToTerminal,
};

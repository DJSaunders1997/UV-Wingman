// This file contains JS functions that call UV commands in the terminal

const vscode = require("vscode");

const {
  sendCommandToTerminal
} = require("./utils");

/**
 * builds a UV environment using a requirements.txt file.
 * @param {string} filename Path to the requirements.txt file.
 */
function uvBuildEnv(filename) {
    try {
      vscode.window.showInformationMessage(`Activating environment from ${filename}.`);
      console.log(`Activating environment from ${filename}.`);
      
      // Deactivate any current environment
      sendCommandToTerminal(`deactivate`);
  
      // TODO: Have python version as input box
      // https://docs.astral.sh/uv/pip/environments/#creating-a-virtual-environment
      sendCommandToTerminal(`uv venv`);
  
      sendCommandToTerminal(`source .venv/bin/activate`);
  
      // Call existing function to install packages
      uvInstallPackages(filename)
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
      vscode.window.showInformationMessage(`Installing packages from ${filename}.`);
      console.log(`Installing packages from ${filename}.`);
  
      // https://docs.astral.sh/uv/pip/packages/#installing-packages-from-files
      sendCommandToTerminal(`uv pip install -r ${filename}`);
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
  
    vscode.window.showInformationMessage(`Creating requirements file: '${result}'.`);
    console.log(`Creating requirements file: '${result}'.`);
  
    const command = `uv pip freeze > "${result}"`;
    sendCommandToTerminal(command);
  }

  /**
   * Deletes a UV environment.
   * @param {string} envName Name of the environment to delete.
   */
  function uvRemoveEnv(envName) {
    try {
      var envName = ".venv" // TODO: Make user customisable
      vscode.window.showInformationMessage(`Deleting environment: ${envName}.`);
      console.log(`Deleting environment: ${envName}.`);
  
      // Ensure no environment is active
      // TODO: Need to think about windows too
      sendCommandToTerminal("deactivate");
    
      // TODO: Paramatise with ${envName}
      const command = `rm -rf .venv`;
      sendCommandToTerminal(command);
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
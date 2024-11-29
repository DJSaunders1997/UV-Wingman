// This file initialises the extension

const vscode = require("vscode"); // The module 'vscode' contains the VS Code extensibility API

// Import VSCode command functions, utility/helper functions, and custom status bar.
const {
  buildEnv,
  installPackages,
  writeRequirements,
  removeEnv
} = require("./commands");
const {
  createEnvIcon,
  installPackagesIcon,
  writeEnvIcon,
  deleteEnvIcon,
} = require("./statusBarItems"); // Import initialized status bar items

/**
 * Function that is run on activation of the extension.
 * Main functionality and setup are defined here.
 */
function activate(context) {
  console.log('Congratulations, your extension "uv Wingman" is now active!');

  // Setup listener to update status bar items when the active file changes.
  const listener = (event) => {
    console.log("Active window changed", event);

    // Update the status bar items based on the active file.
    createEnvIcon.displayDefault();
    installPackagesIcon.displayDefault();
    writeEnvIcon.displayDefault();
    deleteEnvIcon.displayDefault();
  };

  const fileChangeSubscription = vscode.window.onDidChangeActiveTextEditor(listener);

  // Register VSCode commands as functions defined in other files.
  const buildCommand = vscode.commands.registerCommand(
    "uv-wingman.buildEnvironment",
    buildEnv
  );
  const installPackagesCommand = vscode.commands.registerCommand(
    "uv-wingman.installPackages",
    installPackages
  );
  const writeCommand = vscode.commands.registerCommand(
    "uv-wingman.writeRequirementsFile",
    writeRequirements
  );
  const deleteCommand = vscode.commands.registerCommand(
    "uv-wingman.deleteEnvironment",
    removeEnv
  );

  // Add subscriptions to the extension context to ensure cleanup on deactivation.
  context.subscriptions.push(
    fileChangeSubscription,
    buildCommand,
    installPackagesCommand,
    writeCommand,
    deleteCommand
  );
}

/**
 * This method is called when the extension is deactivated.
 */
function deactivate() {
  console.log('Extension "uv Wingman" has been deactivated.');
}

module.exports = {
  activate,
  deactivate,
};

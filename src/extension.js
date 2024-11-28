// This file contains the main logic for the extension

const vscode = require("vscode"); // The module 'vscode' contains the VS Code extensibility API

// Import my VSCode command functions, utility/helper functions, and custom status bar.
const {
  buildCondaYAML,
  activateCondaYAML,
  writeRequirementsFile,
  deleteCondaEnv,
} = require("./commands");
const { activeFileIsYAML } = require("./utils");
const {
  createEnvIcon,
  activateEnvIcon,
  writeEnvIcon,
  deleteEnvIcon,
} = require("./statusBarItems"); // Import initialised status bar items, because I can't pass them as arguments to command function

/**
 * Function that is run on activation of extension.
 * Here the main functionality of the function is defined.
 *
 */
function activate(context) {
  console.log('Congratulations, your extension "Conda Wingman" is now active!');

  // Setup listener to see when active file is not YAML
  // TODO: Can I move this to a different file?
  var listener = function (event) {
    console.log("Active window changed", event);

    // Check whether to display the status bar items every time the active file changes.
    // Logic to check if the active file is a YAML file is in the status bar item class.
    createEnvIcon.displayDefault();
    activateEnvIcon.displayDefault();
    writeEnvIcon.displayDefault();
    deleteEnvIcon.displayDefault();
  };

  var fileChangeSubscription =
    vscode.window.onDidChangeActiveTextEditor(listener);
  //subscription.dispose(); // stop listening for more active file changes

  // Register VSCODE commands as functions defined in other files.
  // TODO: Add icons to the function here as arguments somehow instead of using global variables?
  const buildCommand = vscode.commands.registerCommand(
    "conda-wingman.buildCondaYAML",
    buildCondaYAML
  );
  const activateCommand = vscode.commands.registerCommand(
    "conda-wingman.activateCondaYAML",
    activateCondaYAML
  );
  const writeCommand = vscode.commands.registerCommand(
    "conda-wingman.writeRequirementsFile",
    writeRequirementsFile
  );
  const deleteCommand = vscode.commands.registerCommand(
    "conda-wingman.deleteCondaEnv",
    deleteCondaEnv
  );

  context.subscriptions.push(buildCommand, activateCommand, writeCommand, deleteCommand);
}

// this method is called when your extension is deactivated
function deactivate() {
  //fileChangeSubscription.dispose(); // stop listening for more active file changes
}

module.exports = {
  activate,
  deactivate,
};

// This file initialises the extension

const vscode = require("vscode"); 

// Import VSCode command functions and status bar items
const {
  removeEnv,
  initProject,
  createEnv,
  syncDependencies
} = require("./commands");

const {
  initProjectIcon,
  createEnvIcon,
  syncDepsIcon,
  deleteEnvIcon,
} = require("./statusBarItems");

/**
 * Function that is run on activation of the extension.
 * Main functionality and setup are defined here.
 */
function activate(context) {
  console.log('Checking for pyproject.toml in workspace...');

  // Find all pyproject.toml files in the workspace
  vscode.workspace.findFiles('**/pyproject.toml').then(files => {
    if (files.length === 0) {
      console.log('No pyproject.toml found, extension will remain inactive');
      return;
    }

    console.log('pyproject.toml found, activating UV Wingman...');

    // Setup listener to update status bar items when the active file changes
    const listener = vscode.window.onDidChangeActiveTextEditor(() => {
      initProjectIcon.displayDefault();
      createEnvIcon.displayDefault();
      syncDepsIcon.displayDefault();
      deleteEnvIcon.displayDefault();
    });

    // Register VSCode commands
    const initCommand = vscode.commands.registerCommand(
      "uv-wingman.initProject",
      initProject
    );

    const createCommand = vscode.commands.registerCommand(
      "uv-wingman.createEnvironment",
      createEnv
    );

    const syncCommand = vscode.commands.registerCommand(
      "uv-wingman.syncDependencies",
      syncDependencies
    );

    const deleteCommand = vscode.commands.registerCommand(
      "uv-wingman.deleteEnvironment",
      removeEnv
    );

    // Add subscriptions to the extension context
    context.subscriptions.push(
      listener,
      initCommand,
      createCommand,
      syncCommand,
      deleteCommand
    );

    // Show status bar items initially
    initProjectIcon.displayDefault();
    createEnvIcon.displayDefault();
    syncDepsIcon.displayDefault();
    deleteEnvIcon.displayDefault();

    console.log('UV Wingman activated successfully');
  });
}

/**
 * This method is called when the extension is deactivated.
 */
function deactivate() {
  console.log('Extension "UV Wingman" has been deactivated.');
}

module.exports = {
  activate,
  deactivate,
};

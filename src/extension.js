// This file initialises the extension

const vscode = require("vscode");
const { execSync } = require("child_process");

const {
  removeEnv,
  initProject,
  createEnv,
  syncDependencies,
  activateEnv,
  addPackage,
  removePackage,
  runScript,
  lock,
} = require("./commands");

const {
  showAllStatusBarItems,
  hideAllStatusBarItems,
  updatePythonVersion,
} = require("./statusBarItems");

const { getFirstWorkspaceFolder } = require('./utils');
const { getVenvInterpreterPath, setWorkspacePythonInterpreter } = require('./interpreter');
const { getConfig } = require('./config');
const { registerDocumentLinks } = require('./documentLinks');

/**
 * Checks whether the `uv` CLI is available on PATH.
 * Shows a warning with install link if not found.
 */
function checkUvAvailability() {
    try {
        const cmd = process.platform === 'win32' ? 'where uv' : 'which uv';
        execSync(cmd, { stdio: 'ignore' });
    } catch {
        vscode.window.showWarningMessage(
            'UV Wingman: `uv` CLI not found on PATH. Install it to use this extension.',
            'Install UV'
        ).then(choice => {
            if (choice === 'Install UV') {
                vscode.env.openExternal(vscode.Uri.parse('https://docs.astral.sh/uv/getting-started/installation/'));
            }
        });
    }
}

/**
 * Function that is run on activation of the extension.
 */
function activate(context) {
  console.log('Checking for pyproject.toml in workspace...');

  vscode.workspace.findFiles('**/pyproject.toml').then(files => {
    if (files.length === 0) {
      console.log('No pyproject.toml found, extension will remain inactive');
      return;
    }

    console.log('pyproject.toml found, activating UV Wingman...');

    // Check uv is installed
    checkUvAvailability();

    const config = getConfig();

    // Setup listener to update status bar items when the active file changes
    const listener = vscode.window.onDidChangeActiveTextEditor(() => {
      if (getConfig().showStatusBarItems) {
        showAllStatusBarItems();
      }
    });

    // Register VSCode commands
    const initCommand = vscode.commands.registerCommand("uv-wingman.initProject", initProject);
    const createCommand = vscode.commands.registerCommand("uv-wingman.createEnvironment", createEnv);
    const syncCommand = vscode.commands.registerCommand("uv-wingman.syncDependencies", syncDependencies);
    const deleteCommand = vscode.commands.registerCommand("uv-wingman.deleteEnvironment", removeEnv);
    const activateCommand = vscode.commands.registerCommand("uv-wingman.activateEnvironment", activateEnv);
    const addPkgCommand = vscode.commands.registerCommand("uv-wingman.addPackage", addPackage);
    const removePkgCommand = vscode.commands.registerCommand("uv-wingman.removePackage", removePackage);
    const runScriptCommand = vscode.commands.registerCommand("uv-wingman.runScript", runScript);
    const lockCommand = vscode.commands.registerCommand("uv-wingman.lock", lock);

    context.subscriptions.push(
      listener,
      initCommand,
      createCommand,
      syncCommand,
      deleteCommand,
      activateCommand,
      addPkgCommand,
      removePkgCommand,
      runScriptCommand,
      lockCommand,
    );

    // Show or hide status bar based on setting
    if (config.showStatusBarItems) {
      showAllStatusBarItems();
    }

    // Listen for configuration changes
    const configListener = vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('uvWingman.showStatusBarItems')) {
        if (getConfig().showStatusBarItems) {
          showAllStatusBarItems();
        } else {
          hideAllStatusBarItems();
        }
      }
    });
    context.subscriptions.push(configListener);

    // Auto-set interpreter on activation
    if (config.autoSetInterpreter) {
      const workspaceFolder = getFirstWorkspaceFolder();
      if (workspaceFolder) {
        const interpreter = getVenvInterpreterPath(workspaceFolder);
        if (interpreter) {
          setWorkspacePythonInterpreter(interpreter).catch(() => { /* ignore */ });
        }
      }
    }

    // Update Python version display
    updatePythonVersion();

    console.log('UV Wingman activated successfully');

    // Register clickable PyPI links in pyproject.toml and uv.lock
    registerDocumentLinks(context);
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

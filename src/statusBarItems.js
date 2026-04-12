// This file configures the status bar items

const vscode = require("vscode");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const { getConfig } = require("./config");

/**
 * Class to extend the vscode createStatusBarItem with additional functionality.
 * Choose symbols from this list https://code.visualstudio.com/api/references/icons-in-labels#icon-listing
 */
class CustomStatusBarItem {
  constructor(defaultText, tooltip, command, priority) {
    this.defaultText = defaultText;
    this.loadingText = this.defaultText + " $(loading~spin)";

    this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, priority);
    this.statusBar.text = defaultText;
    this.statusBar.tooltip = tooltip;
    this.statusBar.command = command;
  }

  displayDefault() {
    this.statusBar.text = this.defaultText;
    this.statusBar.show();
  }

  displayLoading() {
    this.statusBar.text = this.loadingText;
    this.statusBar.show();
  }

  show() {
    this.statusBar.show();
  }

  hide() {
    this.statusBar.hide();
  }

  setText(text) {
    this.statusBar.text = text;
  }
}

// Priorities control left-to-right order: higher = further left.
// All values are close together so the items stay grouped.
const pythonVersionItem = new CustomStatusBarItem(
  "$(snake) Activate UV: --",
  "Click to activate UV environment",
  "uv-wingman.activateEnvironment",
  5
);

const initProjectIcon = new CustomStatusBarItem(
  "$(repo) UV Init",
  "Initialize new UV project",
  "uv-wingman.initProject",
  4
);

const syncDepsIcon = new CustomStatusBarItem(
  "$(sync) UV Sync",
  "Sync dependencies with pyproject.toml",
  "uv-wingman.syncDependencies",
  3
);

const addPkgIcon = new CustomStatusBarItem(
  "$(add) UV Add",
  "Add a package with uv add",
  "uv-wingman.addPackage",
  2
);

const deleteEnvIcon = new CustomStatusBarItem(
  "$(trashcan) UV Remove",
  "Delete UV environment",
  "uv-wingman.deleteEnvironment",
  1
);

/** All status bar items in display order (excludes initProjectIcon, which is shown only when no pyproject.toml exists) */
const allItems = [pythonVersionItem, syncDepsIcon, addPkgIcon, deleteEnvIcon];

function showAllStatusBarItems() {
  for (const item of allItems) {
    item.displayDefault();
  }
}

function hideAllStatusBarItems() {
  for (const item of allItems) {
    item.hide();
  }
}

/**
 * Detects the Python version from the configured env and updates the status bar item.
 */
function updatePythonVersion() {
  try {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) return;

    const base = folders[0].uri.fsPath;
    const { envName } = getConfig();

    let pythonPath;
    if (process.platform === 'win32') {
      pythonPath = path.join(base, envName, 'Scripts', 'python.exe');
    } else {
      pythonPath = path.join(base, envName, 'bin', 'python');
    }

    if (!fs.existsSync(pythonPath)) {
      pythonVersionItem.setText('$(snake) Activate UV: No env');
      return;
    }

    const version = execSync(`"${pythonPath}" --version`, { encoding: 'utf8', timeout: 5000 }).trim();
    // Output is like "Python 3.12.1"
    const short = version.replace('Python ', '');
    pythonVersionItem.setText(`$(snake) Activate UV: ${short}`);
  } catch {
    pythonVersionItem.setText('$(snake) Activate UV: No env');
  }
}

module.exports = {
  initProjectIcon,
  syncDepsIcon,
  deleteEnvIcon,
  addPkgIcon,
  pythonVersionItem,
  showAllStatusBarItems,
  hideAllStatusBarItems,
  updatePythonVersion,
};

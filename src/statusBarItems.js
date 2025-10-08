// This file configures the status bar items

const vscode = require("vscode");

/**
 * Class to extend the vscode createStatusBarItem with additional functionality.
 * Represents the status bar that allows users to easily manage environments.
 * Choose symbols from this list https://code.visualstudio.com/api/references/icons-in-labels#icon-listing
 */
class CustomStatusBarItem {
  constructor(defaultText, tooltip, command) {
    this.defaultText = defaultText;
    this.loadingText = this.defaultText + " $(loading~spin)";

    this.statusBar = vscode.window.createStatusBarItem();
    this.statusBar.text = defaultText;
    this.statusBar.tooltip = tooltip;
    this.statusBar.command = command;

    this.displayDefault();
  }

  /***
   * Returning text to the default state.
   */
  displayDefault() {
    this.statusBar.text = this.defaultText;
    this.statusBar.show();
  }

  /**
   * To be displayed when action is running from the button being selected.
   * Currently not implemented as the terminal API does not allow us to view status.
   * TODO: Implement loading if the terminal API allows us to view status in future.
   */
  displayLoading() {
    this.statusBar.text = this.loadingText;
    this.statusBar.show();
  }
}

// Create custom status bar items
const initProjectIcon = new CustomStatusBarItem(
  "$(repo) Init UV Project",
  "Initialize new UV project",
  "uv-wingman.initProject"
);

const syncDepsIcon = new CustomStatusBarItem(
  "$(sync) Sync Dependencies",
  "Sync dependencies with pyproject.toml",
  "uv-wingman.syncDependencies"
);

const deleteEnvIcon = new CustomStatusBarItem(
  "$(trashcan) Remove UV Env",
  "Delete UV environment by removing .venv directory",
  "uv-wingman.deleteEnvironment"
);

module.exports = {
  initProjectIcon,
  syncDepsIcon,
  deleteEnvIcon
};

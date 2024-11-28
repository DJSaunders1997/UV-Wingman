const vscode = require("vscode");
const { activeFileIsRequirementsTxt } = require("./utils");

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

    if (activeFileIsRequirementsTxt()) {
      this.statusBar.show();
    } else {
      this.statusBar.hide();
    }
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
const createEnvIcon = new CustomStatusBarItem(
  "$(tools) Build UV Env",
  "Build environment from open requirements.txt file",
  "uv-wingman.buildEnvironment"
);
const installPackagesIcon = new CustomStatusBarItem(
  "$(symbol-event) build UV Env",
  "build environment referenced in open requirements.txt file",
  "uv-wingman.installPackages"
);
const writeEnvIcon = new CustomStatusBarItem(
  "$(book) Write Requirements File",
  "Write the current environment to a requirements.txt file",
  "uv-wingman.writeRequirementsFile"
);
const deleteEnvIcon = new CustomStatusBarItem(
  "$(trashcan) Delete UV Env",
  "Delete environment using the name derived from the requirements.txt file",
  "uv-wingman.deleteEnvironment"
);

module.exports = { createEnvIcon, installPackagesIcon, writeEnvIcon, deleteEnvIcon };

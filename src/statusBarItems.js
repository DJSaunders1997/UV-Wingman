const vscode = require("vscode");
const { activeFileIsYAML } = require("./utils");

/**
 * Class to extend the vscode createStatusBarItem with additional functionality.
 * Represents the status bar that allows users to easily create environments.
 * Choose symbols from this list https://code.visualstudio.com/api/references/icons-in-labels#icon-listing
 */
class CustomStatusBarItem {
  constructor(defaultText, tooltip, command) {
    this.defaultText = defaultText;
    this.loadingText = this.defaultText + " $(loading~spin)";

    this.statusBar = vscode.window.createStatusBarItem(); // createStatusBarItem('createEnvStatusBar',1)
    this.statusBar.text = defaultText;
    this.statusBar.tooltip = tooltip;
    this.statusBar.command = command;

    this.displayDefault();
  }

  /***
   * Returning text to default state.
   */
  displayDefault() {
    this.statusBar.text = this.defaultText;

    if (activeFileIsYAML()) {
      this.statusBar.show();
    } else {
      this.statusBar.hide();
    }
  }
  /**
   * To be displayed when action is running from the button being selected.
   * Currently not implemented as the terminal api does not allow us to view status.
   * TODO: Implement loading if the terminal api allows us to view status in future.
   */
  displayLoading() {
    this.statusBar.text = this.loadingText;
    this.statusBar.show();
  }
}

// Use CustomStatusBarItem class to create status bar items
// Export the object instances and not the class
// Create custom status bar items
var createEnvIcon = new CustomStatusBarItem(
  (defaultText = "$(tools) Build Env from YAML"),
  (tooltip = "Build conda environment from open YAML file"),
  (command = "conda-wingman.buildCondaYAML")
);
var activateEnvIcon = new CustomStatusBarItem(
  (defaultText = "$(symbol-event) Activate Env from YAML"),
  (tooltip = "Activate conda environment referenced in open YAML file"),
  (command = "conda-wingman.activateCondaYAML")
);
var writeEnvIcon = new CustomStatusBarItem(
  (defaultText = "$(book) Write Requirements File"),
  (tooltip = "Write active conda environment to a YAML file"),
  (command = "conda-wingman.writeRequirementsFile")
);
//create custom status bar item to delete env
var deleteEnvIcon = new CustomStatusBarItem(
  (defaultText = "$(trashcan) Delete Env from YAML"),
  (tooltip = "Delete conda environment referenced in open YAML file"),
  (command = "conda-wingman.deleteCondaEnv")
);

module.exports = { createEnvIcon, activateEnvIcon, writeEnvIcon, deleteEnvIcon };

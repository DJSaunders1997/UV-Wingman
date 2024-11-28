const vscode = require("vscode");
var path = require("path");

const {
  sendCommandToTerminal,
  activeFileIsYAML,
  getOpenDocumentPath,
  activateEnvFromYAML,
  deleteEnvFromYAML,
  createYAMLInputBox,
} = require("./utils");
const {
  createEnvIcon,
  activateEnvIcon,
  writeEnvIcon,
  deleteEnvIcon,
} = require("./statusBarItems"); // TODO: Make these arguments to the functions

function buildCondaYAML() {
  const filenameForwardSlash = getOpenDocumentPath();

  if (activeFileIsYAML()) {
    vscode.window.showInformationMessage(
      `Creating Env from ${filenameForwardSlash}\n This may take up to a minute...`
    );
    console.log(
      `Creating Env from ${filenameForwardSlash}\n This may take up to a minute...`
    );

    const createEnvCommand = `conda env create -f "${filenameForwardSlash}"`;
    sendCommandToTerminal(createEnvCommand);

    activateEnvFromYAML(filenameForwardSlash);
  } else {
    const activeFilename = vscode.window.activeTextEditor.document.fileName;
    const fileExt = activeFilename.split(".").pop();
    vscode.window.showErrorMessage(
      `Cannot build conda env from a ${fileExt} file. Only YAML files are supported.`
    );
  }
}

function activateCondaYAML() {
  const filenameForwardSlash = getOpenDocumentPath();

  var activeFilename = vscode.window.activeTextEditor.document.fileName;

  // Validate open file is YAML
  if (activeFileIsYAML()) {
    activateEnvFromYAML(filenameForwardSlash);

    //Remove loading icon from bar
    activateEnvIcon.displayDefault();
  } else {
    // split string by . and return last array element to get extension
    var fileExt = activeFilename.split(".").pop();
    vscode.window.showErrorMessage(
      `Cannot read conda env info from a ${fileExt} file. Only YAML files are supported.`
    );
  }
}

/**
 * Deletes a Conda environment.
 * @function deleteCondaEnv
 * @description This function deletes a Conda environment. It checks if the active file is a YAML file and deletes the environment from the YAML file. If the active file is not a YAML file, it displays an error message indicating that only YAML files are supported.
 */
function deleteCondaEnv() {
  const filenameForwardSlash = getOpenDocumentPath();

  var activeFilename = vscode.window.activeTextEditor.document.fileName;

  // Validate open file is YAML
  if (activeFileIsYAML()) {
    deleteEnvFromYAML(filenameForwardSlash);

    //Remove loading icon from bar
    deleteEnvIcon.displayDefault();
  } else {
    // split string by . and return last array element to get extension
    var fileExt = activeFilename.split(".").pop();
    vscode.window.showErrorMessage(
      `Cannot read conda env info from a ${fileExt} file. Only YAML files are supported.`
    );
  }
}

// Command: "Conda Wingman: Create a YAML file from the active Conda Environment"
// This command will create a requirements yaml to with a name input from the user.
// TODO: Ask user for input and save as input.yaml.
async function writeRequirementsFile() {
  // Use current filename as default value if possible.
  var filepath = vscode.window.activeTextEditor.document.fileName;
  var filename = path.parse(filepath).base;

  if (filepath == "undefined" || !activeFileIsYAML()) {
    filename = "requirements.yml";
  }

  // Get response from user as to what to call their env.
  var response = createYAMLInputBox(filename);
  console.log("Response: ", response);

  console.log(
    `While the writeRequirementsFileFunct has finished running.
        The createYAMLInputBox function is still running in the background.`
  );

  writeEnvIcon.displayDefault();
}

module.exports = {
  buildCondaYAML,
  activateCondaYAML,
  writeRequirementsFile,
  deleteCondaEnv,
};

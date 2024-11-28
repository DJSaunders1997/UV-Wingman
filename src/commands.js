const vscode = require("vscode");
const path = require("path");

const {
  sendCommandToTerminal,
  activeFileIsRequirementsTxt,
  getOpenDocumentPath,
  buildEnv,
  deleteEnvByName,
  createRequirementsInputBox,
} = require("./utils");
const {
  createEnvIcon,
  installPackagesIcon,
  writeEnvIcon,
  deleteEnvIcon,
} = require("./statusBarItems"); // TODO: Make these arguments to the functions

/**
 * builds an environment from a requirements.txt file.
 */
function buildEnvironment() {
  const filenameForwardSlash = getOpenDocumentPath();

  const activeFilename = vscode.window.activeTextEditor.document.fileName;

  if (activeFileIsRequirementsTxt()) {
    buildEnv(filenameForwardSlash);

    // Remove loading icon from bar
    installPackagesIcon.displayDefault();
  } else {
    const fileExt = activeFilename.split(".").pop();
    vscode.window.showErrorMessage(
      `Cannot build environment from a ${fileExt} file. Only requirements.txt files are supported.`
    );
  }
}

/**
 * Deletes an environment by its name.
 */
function deleteEnvironment() {
  const activeFilename = vscode.window.activeTextEditor.document.fileName;

  if (activeFileIsRequirementsTxt()) {
    const envName = path.parse(activeFilename).name; // Derive environment name from the file name
    deleteEnvByName(envName);

    // Remove loading icon from bar
    deleteEnvIcon.displayDefault();
  } else {
    const fileExt = activeFilename.split(".").pop();
    vscode.window.showErrorMessage(
      `Cannot delete environment from a ${fileExt} file. Only requirements.txt files are supported.`
    );
  }
}

/**
 * Writes a requirements.txt file from the active environment.
 */
async function writeRequirementsFile() {
  const filepath = vscode.window.activeTextEditor
    ? vscode.window.activeTextEditor.document.fileName
    : undefined;
  let filename = filepath ? path.parse(filepath).base : "requirements.txt";

  if (!activeFileIsRequirementsTxt()) {
    filename = "requirements.txt";
  }

  // Prompt the user for the name of the requirements.txt file
  const response = await createRequirementsInputBox(filename);
  console.log("Response: ", response);

  console.log(
    `While the writeRequirementsFile function has finished running,
     the createRequirementsInputBox function might still be processing.`
  );

  writeEnvIcon.displayDefault();
}

module.exports = {
  buildEnvironment,
  writeRequirementsFile,
  deleteEnvironment,
};

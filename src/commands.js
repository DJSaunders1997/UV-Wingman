// This file defines the commands that are available in the command palette.

const vscode = require("vscode");
const path = require("path");

const {
  activeFileIsRequirementsTxt,
  getOpenDocumentPath,
} = require("./utils");
const {
  uvBuildEnv,
  uvInstallPackages,
  uvWriteRequirements,
  uvRemoveEnv
} = require("./uv_commands")
const {
  createEnvIcon,
  installPackagesIcon,
  writeEnvIcon,
  deleteEnvIcon,
} = require("./statusBarItems"); // TODO: Make these arguments to the functions

/**
 * builds an environment from a requirements.txt file.
 */
function buildEnv() {
  const filenameForwardSlash = getOpenDocumentPath();

  const activeFilename = vscode.window.activeTextEditor.document.fileName;

  if (activeFileIsRequirementsTxt()) {
    uvBuildEnv(filenameForwardSlash);

    // Remove loading icon from bar
    createEnvIcon.displayDefault();
  } else {
    const fileExt = activeFilename.split(".").pop();
    vscode.window.showErrorMessage(
      `Cannot build environment from a ${fileExt} file. Only requirements.txt files are supported.`
    );
  }
}

/**
 * builds an environment from a requirements.txt file.
 */
function installPackages() {
  const filenameForwardSlash = getOpenDocumentPath();

  const activeFilename = vscode.window.activeTextEditor.document.fileName;

  if (activeFileIsRequirementsTxt()) {
    uvInstallPackages(filenameForwardSlash);

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
 * Writes a requirements.txt file from the active environment.
 */
async function writeRequirements() {
  const filepath = vscode.window.activeTextEditor
    ? vscode.window.activeTextEditor.document.fileName
    : undefined;
  let filename = filepath ? path.parse(filepath).base : "requirements.txt";

  if (!activeFileIsRequirementsTxt()) {
    filename = "requirements.txt";
  }

  // Prompt the user for the name of the requirements.txt file
  const response = await uvWriteRequirements(filename);
  console.log("Response: ", response);

  console.log(
    `While the writeRequirements function has finished running,
     the uvWriteRequirements function might still be processing.`
  );

  writeEnvIcon.displayDefault();
}

/**
 * Deletes an environment by its name.
 */
function removeEnv() {
  const activeFilename = vscode.window.activeTextEditor.document.fileName;

  if (activeFileIsRequirementsTxt()) {
    const envName = path.parse(activeFilename).name; // Derive environment name from the file name
    uvRemoveEnv(envName);

    // Remove loading icon from bar
    deleteEnvIcon.displayDefault();
  } else {
    const fileExt = activeFilename.split(".").pop();
    vscode.window.showErrorMessage(
      `Cannot delete environment from a ${fileExt} file. Only requirements.txt files are supported.`
    );
  }
}

module.exports = {
  buildEnv,
  installPackages,
  writeRequirements,
  removeEnv
};

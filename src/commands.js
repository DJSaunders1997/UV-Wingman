// This file defines the commands that are available in the command palette.

const vscode = require("vscode");
const { uvRemoveEnv, uvInitProject, uvCreateEnv, uvSyncDependencies } = require("./uvCommands");
const { deleteEnvIcon } = require("./statusBarItems");

/**
 * Deletes an environment by its name.
 */
function removeEnv() {
  uvRemoveEnv();
  deleteEnvIcon.displayDefault();
}

/**
 * Initializes a project using UV.
 */
function initProject() {
  uvInitProject();
}

/**
 * Creates an environment using UV.
 */
function createEnv() {
  uvCreateEnv();
}

/**
 * Syncs dependencies in the project.
 */
function syncDependencies() {
  uvSyncDependencies();
}

module.exports = {
  removeEnv,
  initProject,
  createEnv,
  syncDependencies,
};

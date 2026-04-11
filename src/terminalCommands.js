const vscode = require("vscode");
const { getConfig } = require("./config");

/**
 * Builds command templates for POSIX-like shells (bash, zsh, wsl, gitbash, default).
 * @param {string} envName - Virtual environment directory name
 */
function getPosixCommands(envName) {
    return {
        activateVenv: `source ${envName}/bin/activate`,
        removeDir: `rm -rf ${envName}`,
        initProject: 'uv init',
        syncDeps: 'uv sync',
        createVenv: 'uv venv',
        lock: 'uv lock',
    };
}

/**
 * Builds command templates for Fish shell (unique activate path).
 * @param {string} envName - Virtual environment directory name
 */
function getFishCommands(envName) {
    return {
        ...getPosixCommands(envName),
        activateVenv: `source ${envName}/bin/activate.fish`,
    };
}

/**
 * Builds command templates for PowerShell.
 * @param {string} envName - Virtual environment directory name
 */
function getPowershellCommands(envName) {
    return {
        activateVenv: `.\\${envName}\\Scripts\\Activate.ps1`,
        removeDir: `Remove-Item -Recurse -Force ${envName}`,
        initProject: 'uv init',
        syncDeps: 'uv sync',
        createVenv: 'uv venv',
        lock: 'uv lock',
    };
}

/**
 * Builds command templates for Windows Command Prompt.
 * @param {string} envName - Virtual environment directory name
 */
function getCmdCommands(envName) {
    return {
        activateVenv: `.\\${envName}\\Scripts\\activate.bat`,
        removeDir: `rmdir /s /q ${envName}`,
        initProject: 'uv init',
        syncDeps: 'uv sync',
        createVenv: 'uv venv',
        lock: 'uv lock',
    };
}

/**
 * Terminal command set builders keyed by shell type.
 */
const commandBuilders = {
    powershell: getPowershellCommands,
    cmd: getCmdCommands,
    gitbash: getPosixCommands,
    wsl: getPosixCommands,
    bash: getPosixCommands,
    zsh: getPosixCommands,
    fish: getFishCommands,
    default: getPosixCommands,
};

/**
 * Detects the current terminal type.
 * @returns {'powershell'|'cmd'|'gitbash'|'wsl'|'bash'|'zsh'|'fish'|'default'}
 */
function detectTerminalType() {
    const terminal = vscode.window.activeTerminal;
    if (!terminal) return 'default';
    const name = terminal.name.toLowerCase();
    if (name.includes('powershell')) return 'powershell';
    if (name.includes('cmd')) return 'cmd';
    if (name.includes('git bash')) return 'gitbash';
    if (name.includes('wsl') || name.includes('ubuntu') || name.includes('debian')) return 'wsl';
    if (name.includes('zsh')) return 'zsh';
    if (name.includes('fish')) return 'fish';
    if (name.includes('bash')) return 'bash';
    return 'default';
}

/**
 * Gets the command set for the current terminal, using the configured env name.
 */
function getTerminalCommands() {
    const { envName } = getConfig();
    const type = detectTerminalType();
    const builder = commandBuilders[type] || commandBuilders.default;
    return builder(envName);
}

module.exports = {
    getTerminalCommands,
    detectTerminalType,
};

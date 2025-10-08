const vscode = require("vscode");
const { activate } = require("./extension");

/**
 * Shared command templates for POSIX-like shells (bash, zsh, wsl, gitbash, default).
 */
const posixCommands = {
    activateVenv: 'source .venv/bin/activate',
    removeDir: 'rm -rf .venv',
    initProject: 'uv init',
    syncDeps: 'uv sync',
};

/**
 * Fish shell has a unique activate command.
 */
const fishCommands = {
    ...posixCommands,
    activateVenv: 'source .venv/bin/activate.fish',
};

/**
 * Terminal command templates for different shells.
 */
const TerminalCommandSets = {
    powershell: {
        activateVenv: '.\\.venv\\Scripts\\Activate.ps1',
        removeDir: 'Remove-Item -Recurse -Force .venv',
        initProject: 'uv init',
        syncDeps: 'uv sync',
        createVenv: 'uv pip install .',
    },
    cmd: {
        activateVenv: '.\\.venv\\Scripts\\activate.bat',
        removeDir: 'rmdir /s /q .venv',
        initProject: 'uv init',
        syncDeps: 'uv sync',
        createVenv: 'uv pip install .',
    },
    gitbash: posixCommands,
    wsl: posixCommands,
    bash: posixCommands,
    zsh: posixCommands,
    fish: fishCommands,
    default: posixCommands,
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
 * Gets the command set for the current terminal.
 */
function getTerminalCommands() {
    const type = detectTerminalType();
    return TerminalCommandSets[type] || TerminalCommandSets.default;
}

module.exports = {
    getTerminalCommands,
};
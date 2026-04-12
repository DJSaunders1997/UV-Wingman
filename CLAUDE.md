# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A VS Code extension that wraps the `uv` Python package manager, providing status bar buttons, Command Palette commands, a dependency tree view, and inline PyPI links. Written in vanilla JavaScript (no TypeScript, no bundler). Activates only when `pyproject.toml` exists in the workspace.

## Commands

```bash
npm test          # Lint + run tests (via @vscode/test-electron, needs VS Code or headless X)
npm run lint      # ESLint only
```

There is no build step. The extension runs directly from the JS source files.

To debug interactively, use the VS Code launch configs in `.vscode/launch.json`: "Run Extension" or "Extension Tests".

## Architecture

```
extension.js  (activate: check uv, register commands, wire status bar, set up file watchers)
  ├── commands.js          (9 command handlers: init, create, sync, lock, add, remove, run, delete, activate)
  ├── terminalCommands.js  (shell-specific command builders + terminal type detection)
  ├── statusBarItems.js    (CustomStatusBarItem class, 5 items, Python version display)
  ├── interpreter.js       (find venv Python path, set python.defaultInterpreterPath at workspace scope)
  ├── dependencyTree.js    (TreeDataProvider parsing pyproject.toml sections, PyPI context links)
  ├── documentLinks.js     (DocumentLinkProvider for pyproject.toml and uv.lock PyPI hyperlinks)
  ├── config.js            (reads uvWingman.* settings)
  └── utils.js             (sendCommandToTerminal with undefined guard, getFirstWorkspaceFolder)
```

**Data flow for a typical command:** User clicks status bar or palette -> `commands.js` handler calls `getTerminalCommands()` which reads config and detects shell type -> returns the right command string -> `sendCommandToTerminal()` sends it to the active terminal -> optionally fires `waitAndSetInterpreter()` (non-blocking poll, up to 15s) and `_uvWingmanDepProvider.refresh()` via setTimeout.

## Key Patterns

- **Terminal commands are builder functions** in `terminalCommands.js` that accept `envName`. There are four builders (POSIX, Fish, PowerShell, cmd). When adding a new shell action, add the key to all four builders.
- **Interpreter auto-set is fire-and-forget**: gated behind `getConfig().autoSetInterpreter`, called with `.catch()` to swallow failures. Sets `python.defaultInterpreterPath` at workspace scope only.
- **Status bar visibility** is managed through `showAllStatusBarItems()`/`hideAllStatusBarItems()` controlled by the `showStatusBarItems` setting. The `allItems` array in `statusBarItems.js` controls which items participate.
- **Dependency tree refresh** happens via `global._uvWingmanDepProvider.refresh()` after add/remove commands, delayed with `setTimeout`.
- **No TOML library**: dependency parsing uses simple text/regex parsing of pyproject.toml sections.

## Adding a New Command

1. Add entry to `package.json` under `contributes.commands` (and menus if needed)
2. Implement handler in `src/commands.js`, export it
3. Register in `src/extension.js` via `vscode.commands.registerCommand`, push to `context.subscriptions`
4. If it needs a terminal command, add to all builder functions in `src/terminalCommands.js`
5. If it needs a status bar item, add in `src/statusBarItems.js` and include in `allItems`
6. Add tests under `test/suite/`

## What Not to Change Lightly

- `activationEvents` in `package.json` (controls when extension loads)
- `python.defaultInterpreterPath` update scope (must stay workspace scope)
- Polling logic in `waitAndSetInterpreter` (handles terminal command async timing)
- The `allItems` array in `statusBarItems.js` (controls show/hide grouping)

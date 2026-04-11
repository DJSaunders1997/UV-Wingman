## UV Wingman — Copilot / Agent Instructions

Purpose: Give an AI coding agent the minimum, high-value knowledge to be immediately productive in this codebase.

Keep this short, concrete, and code-referenced. Prefer editing the exact files named below rather than making broad architectural changes.

1) Big picture (what this extension does)
- Activation: the extension activates when a `pyproject.toml` exists in the workspace (see `package.json` -> `activationEvents`).
- Goal: provide one-click UV package manager workflows (init, create env, activate, sync, lock, add/remove packages, run scripts, delete env) via the status bar, command palette, and dependency tree view.
- Main flow: `extension.js` (activate) registers commands -> `commands.js` implements command handlers -> `terminalCommands.js` supplies shell-specific templates -> `utils.js` sends text to the terminal. `interpreter.js` implements auto-setting the workspace Python interpreter. `config.js` reads extension settings. `dependencyTree.js` provides the tree view.

2) Key files to reference (single-line purpose)
- `src/extension.js` — extension entrypoint, activation, command registration, status-bar wiring, uv availability check.
- `src/commands.js` — implementations for all commands (create/init/sync/lock/add/remove/run/delete/activate).
- `src/config.js` — centralized settings reader (envName, showStatusBarItems, autoSetInterpreter).
- `src/interpreter.js` — finds env interpreter paths and updates `python.defaultInterpreterPath`; polls with retry.
- `src/terminalCommands.js` — shell command template builders (functions accepting envName) and terminal detection.
- `src/utils.js` — terminal helper (`sendCommandToTerminal` with undefined guard) and `getFirstWorkspaceFolder()`.
- `src/statusBarItems.js` — status bar UI, Python version display, show/hide helpers.
- `src/dependencyTree.js` — tree view provider showing main deps, optional deps, and dependency groups with PyPI links.
- `package.json` — scripts, `contributes.commands`, `contributes.configuration`, `contributes.menus`, must be updated when adding new commands or settings.
- `test/` — mocha tests and the VS Code test runner harness.

3) Important behaviors & constraints
- Activation is file-based: the extension only becomes active when `pyproject.toml` exists.
- All settings are read via `src/config.js:getConfig()`. The env name defaults to `.venv` but is configurable via `uvWingman.envName`.
- Terminal command templates are **functions** that accept `envName` — don't add static command objects.
- Interpreter auto-set is non-blocking: uses fire-and-forget with polling (up to 15 attempts, 1s apart).
- The extension writes the interpreter using `python.defaultInterpreterPath` at **workspace scope**.
- `sendCommandToTerminal` guards against undefined commands — it will show an error message and return early.
- The dependency tree auto-refreshes via a file watcher on `pyproject.toml`.

4) How terminal commands are handled (pattern to follow)
- All commands are built via builder functions in `src/terminalCommands.js` (e.g., `getPosixCommands(envName)`).
- `getTerminalCommands()` reads the env name from config and returns the correct set.
- When adding a new shell action: add the key to all builder functions, then use `cmds.<name>` in command handlers.

5) Adding a new user command (concrete steps)
1. Add an entry to `package.json.contributes.commands` (id and title).
2. Implement the handler in `src/commands.js` and export it.
3. Register the command in `src/extension.js` using `vscode.commands.registerCommand` and push it into `context.subscriptions`.
4. If it needs a status bar item, add or reuse code in `src/statusBarItems.js` and add to `allItems` array.
5. If it needs a terminal command template, add to all builder functions in `src/terminalCommands.js`.
6. Add or update tests under `test/` and run `npm test`.

6) Build / test / debug commands
- Run unit & integration tests: `npm test` (this triggers `npm run lint` via `pretest`).
- Lint: `npm run lint` (uses ESLint with ecmaVersion 2020).
- Extension tests use `@vscode/test-electron` (see `test/runTest.js`).

7) Conventions and patterns to preserve
- Error handling: command handlers wrap work in try/catch and call `vscode.window.showErrorMessage`.
- Non-blocking behavior: interpreter setting and tree refresh are fire-and-forget.
- Delete confirmation: `removeEnv` shows a modal warning before proceeding.
- Settings gating: auto-interpreter calls are gated behind `getConfig().autoSetInterpreter`.
- Status bar: managed through `showAllStatusBarItems()`/`hideAllStatusBarItems()`, respects `showStatusBarItems` setting.
- Dependency tree refresh: after add/remove commands, a `setTimeout` fires `global._uvWingmanDepProvider.refresh()`.

8) What NOT to change lightly
- `activationEvents` in `package.json` — changing this alters when the extension loads.
- `python.defaultInterpreterPath` update scope — keep workspace scope.
- The polling logic in `waitAndSetInterpreter` — it handles terminal command async timing.
- The `allItems` array in `statusBarItems.js` — controls which items show/hide together.

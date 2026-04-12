# Change Log

All notable changes to the "UV Wingman" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [2.0.0]

### Added
- **Add Package** command — add packages via `uv add` from an input box
- **Remove Package** command — remove packages via quick pick or right-click in the dependency tree
- **Run Script** command — pick and run scripts from `[project.scripts]` via `uv run`
- **Lock Dependencies** command — run `uv lock` from the command palette or status bar
- **Configurable environment name** — new `uvWingman.envName` setting (defaults to `.venv`)
- **Settings** — `uvWingman.showStatusBarItems` and `uvWingman.autoSetInterpreter` settings
- **uv CLI availability check** — warns on activation if `uv` is not found on PATH
- **Delete confirmation** — modal confirmation dialog before deleting an environment
- **Python version in status bar** — shows the Python version from the active environment
- **Dependency groups** — tree view now shows `[project.optional-dependencies]` and `[dependency-groups]`
- **Click-to-PyPI** — click any dependency in the tree to open it on pypi.org
- **Tree context menu** — right-click dependencies to remove them
- **Auto-refresh** — dependency tree auto-refreshes when `pyproject.toml` changes
- **Activate command in palette** — `uv-wingman.activateEnvironment` now appears in the Command Palette

### Fixed
- **Create Environment broken on POSIX** — `createVenv` command was missing from bash/zsh/fish/WSL/Git Bash shell templates, causing the command to silently fail on non-Windows systems
- **Interpreter polling** — `waitAndSetInterpreter` now actually polls (up to 15 seconds) instead of checking once immediately, fixing the race condition with terminal commands
- **Undefined command guard** — `sendCommandToTerminal` now shows an error instead of sending "undefined" to the terminal

### Changed
- Bumped version to 2.0.0
- Terminal command templates are now functions that accept the configured env name
- Status bar items use shorter labels for a cleaner look
- Removed stale `conda-wingman` test file
- Rewrote README with full feature documentation, settings reference, and troubleshooting guide

## [1.0.3] - 2024-11-01
- Added automatic VS Code Python interpreter setting when environment is created or activated
- Refactored interpreter logic into separate `interpreter.js` module for better code organization
- Added `getFirstWorkspaceFolder()` utility to reduce code duplication

## [1.0.2] - 2024-11
- Update package to v1.0.2

## [1.0.1] - 2024-11
- Bump version to 1.0.1

## [0.0.3] - 2024-11
- Small docs improvements

## [0.0.2] - 2024-11
- Implemented basic features for installing packages, and removing environments.

## [0.0.1] - 2024-11
- Tiny readme fixes.

## [0.0.0] - 2024-11
- Initial release of extension to VSCode Extension Marketplace

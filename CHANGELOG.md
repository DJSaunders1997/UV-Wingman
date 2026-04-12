# Change Log

All notable changes to the "UV Wingman" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [2.0.0]

### Added
- **Inline PyPI links** — Ctrl/Cmd+click any dependency in `pyproject.toml` or `uv.lock` to open it on PyPI
- **Inline version hints** — greyed-out latest version at end of dependency lines with green/yellow freshness indicators
- **Hover tooltips** — package description and PyPI link on hover in both `pyproject.toml` and `uv.lock`
- **Interactive dependency graph** — D3.js force-directed graph in a webview panel with colour-coded nodes, zoom/pan/drag, and click-through to PyPI
- **Add Package** command — add packages via `uv add` from an input box
- **Remove Package** command — remove packages via quick-pick list
- **Run Script** command — pick and run scripts from `[project.scripts]` via `uv run`
- **Lock Dependencies** command — run `uv lock` from the command palette
- **Sync dry-run preview** — option to preview changes before running `uv sync`
- **Python version in status bar** — shows the Python version from the active environment
- **Configurable environment name** — new `uvWingman.envName` setting (defaults to `.venv`)
- **Settings** — `uvWingman.showStatusBarItems` and `uvWingman.autoSetInterpreter`
- **uv CLI availability check** — warns on activation if `uv` is not found on PATH
- **Activate command in palette** — was missing from `package.json` contributes

### Fixed
- **Create Environment broken on POSIX** — `createVenv` key was missing from shell templates, causing silent failure on Linux/Mac/WSL
- **Interpreter polling** — `waitAndSetInterpreter` now polls up to 15 times instead of checking once immediately
- **Undefined command guard** — `sendCommandToTerminal` now shows an error instead of sending "undefined" to the terminal

### Changed
- TOML parsing now uses `@iarna/toml` instead of manual regex
- Terminal command templates refactored to functions accepting configurable env name
- Removed noisy `showInformationMessage` popups for routine actions
- Rewrote README

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

# UV Wingman

[![GitHub license](https://img.shields.io/badge/license-MIT-purple.svg)](https://github.com/DJSaunders1997/UV-Wingman/blob/main/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-purple.svg)]()
[![Release](https://github.com/DJSaunders1997/UV-Wingman/actions/workflows/release.yml/badge.svg)](https://github.com/DJSaunders1997/UV-Wingman/actions/workflows/release.yml)

![Banner](images/Logo-512x512.png)

[![Version](https://vsmarketplacebadges.dev/version-short/djsaunders1997.uv-wingman.png?style=for-the-badge&colorA=252525&colorB=8A2BE2)](https://marketplace.visualstudio.com/items?itemName=djsaunders1997.uv-wingman)
[![Downloads](https://vsmarketplacebadges.dev/downloads-short/djsaunders1997.uv-wingman.png?style=for-the-badge&colorA=252525&colorB=8A2BE2)](https://marketplace.visualstudio.com/items?itemName=djsaunders1997.uv-wingman)
[![Ratings](https://vsmarketplacebadges.dev/rating-short/djsaunders1997.uv-wingman.png?style=for-the-badge&colorA=252525&colorB=8A2BE2)](https://marketplace.visualstudio.com/items?itemName=djsaunders1997.uv-wingman)

This is the README for the extension [UV Wingman](https://marketplace.visualstudio.com/items?itemName=DJSaunders19997.uv-wingman).

This extension aims to help VSCode users manage and interact with UV environments.
UV Wingman aims to add QoL improvements that help programmers use environments without having to memorize all of the UV commands.

## Features

UV Wingman detects a pyproject.toml in your workspace and exposes common UV package-manager tasks through both the status bar and the Command Palette so you can manage environments without memorizing commands.

Key capabilities:
- Automatic activation when a `pyproject.toml` is present — the extension wires up status bar actions and commands on activation.
- One-click actions from the status bar and Command Palette for:
  - Initializing a project (`uv init`)
  - Activating the environment with shell specific activation command e.g. (` source.venv\activate`)
  - Syncing dependencies (`uv sync`)
  - Removing the `.venv` directory
- Cross-shell support with templates for PowerShell, cmd, Git Bash, WSL, Bash, Zsh, and Fish.
- Sends commands into the active VS Code terminal or creates a terminal when needed.

Why this helps:
- Reduces context switching by running UV commands directly from VS Code UI.
- Handles shell differences so activation and install commands work across environments.
- Lightweight — focuses on the most common UV workflows (init, create, activate, sync, delete).

These commands can be accessed from the VSCode command palette:

![VSCode Screenshot](images/VSCode-Screenshot.png)

The supported commands are:

### Project Initialization
- **Command:** `uv init`
- **VS Code Command Palette:** `>UV Wingman: Initialize UV Project`
- **Description:** Creates a new UV project in the current directory

### Creating Environments 
- **Command:** `uv pip install .`
- **VS Code Command Palette:** `>UV Wingman: Create Environment from pyproject.toml`
- **Description:** Creates a new virtual environment and installs dependencies

### Activating Environments
- **Command:** `source .venv/bin/activate` (or shell equivalent)
- **VS Code Command Palette:** `>UV Wingman: Activate UV Environment`
- **Description:** Activates the UV virtual environment

### Syncing Dependencies
- **Command:** `uv sync`
- **VS Code Command Palette:** `>UV Wingman: Sync Dependencies with pyproject.toml`
- **Description:** Updates environment to match pyproject.toml dependencies

### Deleting Environments
- **Command:** Removes `.venv` directory
- **VS Code Command Palette:** `>UV Wingman: Delete UV Environment`
- **Description:** Deletes the UV virtual environment

## Example pyproject.toml
```toml
[project]
name = "your-project"
version = "0.1.0"
description = "Your project description"
requires-python = ">=3.12"
dependencies = [
    "package1>=1.0",
    "package2>=2.0",
]
```

## Project Structure

- **src/commands.js**  
  Implements all command palette actions and UV operations.

- **src/extension.js**  
  Main entry point that activates when a pyproject.toml is found.

- **src/statusBarItems.js**  
  Manages the status bar items for quick access to UV commands.

- **src/utils.js**  
  Provides utility functions for terminal operations.

- **src/terminalCommands.js**  
  Handles shell-specific command templates and terminal detection.

## Release Notes

See [CHANGELOG](CHANGELOG.md) for more information.

## Contributing

All contributions are welcome! 
Please feel free to fork the repository and create a pull request.

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

## Author

David Saunders - 2024

## Roadmap

| Feature | What | Why | Priority | Effort |
|---|---|---:|---:|---:|
| Auto-set VS Code Python interpreter | When an environment is created or activated, automatically set the workspace interpreter to the .venv Python. | Ensures editor features (linting, run/debug) use the created env without manual steps. | High | Small / Medium |
| Sync preview & diff | Show a preview of changes (added/updated/removed packages) before running `uv sync`. | Lets users confirm changes before modifying environments. | Medium | Moderate |
| Dependency graph / tree view | Add a side panel showing installed packages and a dependency tree for quick navigation and inspection. | Improves dependency visibility and debugging. | Medium | Larger |
| Quick package search & install | Quick-pick UI to search PyPI (or configured index) and install selected packages into the active env. | Speeds up adding packages without leaving VS Code. | Medium | Moderate |

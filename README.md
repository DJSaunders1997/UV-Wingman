# UV Wingman

[![GitHub license](https://img.shields.io/badge/license-MIT-purple.svg)](https://github.com/DJSaunders1997/UV-Wingman/blob/main/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-purple.svg)]()
[![Release](https://github.com/DJSaunders1997/UV-Wingman/actions/workflows/release.yml/badge.svg)](https://github.com/DJSaunders1997/UV-Wingman/actions/workflows/release.yml)

![Banner](images/Logo-512x512.png)

[![Version](https://vsmarketplacebadges.dev/version-short/djsaunders1997.uv-wingman.png?style=for-the-badge&colorA=252525&colorB=8A2BE2)](https://marketplace.visualstudio.com/items?itemName=djsaunders1997.uv-wingman)
[![Downloads](https://vsmarketplacebadges.dev/downloads-short/djsaunders1997.uv-wingman.png?style=for-the-badge&colorA=252525&colorB=8A2BE2)](https://marketplace.visualstudio.com/items?itemName=djsaunders1997.uv-wingman)
[![Ratings](https://vsmarketplacebadges.dev/rating-short/djsaunders1997.uv-wingman.png?style=for-the-badge&colorA=252525&colorB=8A2BE2)](https://marketplace.visualstudio.com/items?itemName=djsaunders1997.uv-wingman)

**UV Wingman** brings [uv](https://docs.astral.sh/uv/) package management into VS Code so you can manage Python environments without leaving your editor or memorizing commands.

## Features

UV Wingman activates automatically when a `pyproject.toml` is detected in your workspace and exposes common UV workflows through the status bar, Command Palette, and an explorer tree view.

### Environment Management

| Command | Palette Title | Description |
|---------|--------------|-------------|
| `uv init` | **UV Wingman: Initialize UV Project** | Scaffold a new UV project |
| `uv venv` | **UV Wingman: Create Environment** | Create a virtual environment and activate it |
| `source .venv/bin/activate` | **UV Wingman: Activate UV Environment** | Activate the environment (shell-aware) |
| `uv sync` | **UV Wingman: Sync Dependencies** | Sync environment with pyproject.toml (with dry-run preview) |
| `uv lock` | **UV Wingman: Lock Dependencies** | Update the lock file |
| `rm -rf .venv` | **UV Wingman: Delete Environment** | Remove the virtual environment (with confirmation) |

### Package Management

| Command | Palette Title | Description |
|---------|--------------|-------------|
| `uv add <pkg>` | **UV Wingman: Add Package** | Add a package via input box |
| `uv remove <pkg>` | **UV Wingman: Remove Package** | Remove a package via picker or tree right-click |

### Scripts

| Command | Palette Title | Description |
|---------|--------------|-------------|
| `uv run <script>` | **UV Wingman: Run Script** | Pick and run a script from `[project.scripts]` |

### Inline PyPI Links

Package names in `pyproject.toml` and `uv.lock` are **clickable hyperlinks** that open the package on PyPI. No separate panel needed -- just Ctrl/Cmd+click any dependency name in the files you're already editing.

### Inline Version Hints

Dependencies in `pyproject.toml` show the **latest PyPI version** as greyed-out text at the end of each line (similar to GitLens inline blame). Color-coded freshness indicators show whether your specifier allows the latest version or is pinned behind. Hover over any dependency for a description and PyPI link.

### Dependency Graph

Open `uv.lock` and click the **Visualise Dependencies** button in the editor toolbar to see an interactive dependency graph. The graph shows your full resolved dependency tree with:
- **Color-coded nodes**: project root (yellow), direct dependencies (blue), transitive dependencies (green)
- **Hierarchical layout**: dependencies flow top-to-bottom from your project root
- **Interactivity**: zoom, pan, drag nodes, hover to highlight connections, click for package details and PyPI links

### Status Bar

Quick-access buttons in the status bar:
- **Python version** (click to activate environment) -- shows "No env" when missing
- Init, Sync, Add Package, Remove Environment

### Smart Defaults

- **Auto interpreter**: Automatically sets the VS Code Python interpreter to the environment's Python after create/activate/sync
- **Shell detection**: Uses the correct activation and remove commands for PowerShell, cmd, Git Bash, WSL, Bash, Zsh, and Fish
- **uv availability check**: Warns on activation if `uv` is not installed, with a link to install it

## Settings

Configure via VS Code Settings (`Ctrl+,`) or `settings.json`:

| Setting | Default | Description |
|---------|---------|-------------|
| `uvWingman.envName` | `.venv` | Virtual environment directory name |
| `uvWingman.showStatusBarItems` | `true` | Show/hide status bar buttons |
| `uvWingman.autoSetInterpreter` | `true` | Auto-set Python interpreter on env create/activate |

## Example pyproject.toml

```toml
[project]
name = "your-project"
version = "0.1.0"
description = "Your project description"
requires-python = ">=3.12"
dependencies = [
    "requests>=2.31",
    "click>=8.0",
]

[project.optional-dependencies]
dev = ["pytest>=7.0", "ruff>=0.1"]

[project.scripts]
serve = "your_project:main"

[dependency-groups]
test = ["pytest>=7.0", "coverage>=7.0"]
```

## Troubleshooting

### Extension not activating
UV Wingman requires a `pyproject.toml` in your workspace root. If the file exists in a subdirectory, open that directory directly in VS Code.

### `uv` not found
Install uv following the [official guide](https://docs.astral.sh/uv/getting-started/installation/). Make sure the `uv` binary is on your `PATH`. Restart VS Code after installing.

### Python interpreter not being set
- Check that `uvWingman.autoSetInterpreter` is enabled in settings
- Ensure a `.venv` directory (or your configured `uvWingman.envName`) exists with a Python binary inside
- The interpreter is set to `python.defaultInterpreterPath` at workspace scope

### Custom environment name
If your project uses `venv` or `env` instead of `.venv`, set `uvWingman.envName` in your workspace settings:
```json
{
    "uvWingman.envName": "venv"
}
```

## Project Structure

| File | Purpose |
|------|---------|
| `src/extension.js` | Entry point: activation, command registration, status bar wiring |
| `src/commands.js` | All command handlers (init, create, sync, add, remove, run, lock, delete) |
| `src/terminalCommands.js` | Shell-specific command templates and terminal detection |
| `src/statusBarItems.js` | Status bar UI items and Python version display |
| `src/interpreter.js` | Python interpreter detection and workspace setting |
| `src/documentLinks.js` | Inline PyPI hyperlinks for pyproject.toml and uv.lock |
| `src/config.js` | Centralized settings reader |
| `src/utils.js` | Terminal and workspace utilities |

## Contributing

All contributions are welcome! Please feel free to fork the repository and create a pull request.

## Release Notes

See [CHANGELOG](CHANGELOG.md) for full version history.

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

## Author

David Saunders - 2024-2026

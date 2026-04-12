const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { getFirstWorkspaceFolder } = require('./utils');
const { parsePyprojectDependencies } = require('./tomlParser');

class DependencyItem extends vscode.TreeItem {
  /**
   * @param {string} label - Package name
   * @param {string} version - Version specifier
   * @param {'dependencyItem'|'dependencyGroup'} contextValue
   * @param {vscode.TreeItemCollapsibleState} collapsibleState
   */
  constructor(label, version, contextValue = 'dependencyItem', collapsibleState = vscode.TreeItemCollapsibleState.None) {
    super(label, collapsibleState);
    this.description = version || '';
    this.contextValue = contextValue;

    if (contextValue === 'dependencyItem') {
      // Click to open on PyPI
      this.command = {
        command: 'vscode.open',
        title: 'Open on PyPI',
        arguments: [vscode.Uri.parse(`https://pypi.org/project/${label}/`)]
      };
      this.tooltip = `${label}${version ? ' ' + version : ''} — click to open on PyPI`;
    }
  }
}

class DependencyGroupItem extends vscode.TreeItem {
  /**
   * @param {string} groupName - Group name (e.g., "dev", "test")
   * @param {DependencyItem[]} children - Child dependency items
   */
  constructor(groupName, children) {
    super(groupName, vscode.TreeItemCollapsibleState.Collapsed);
    this.children = children;
    this.contextValue = 'dependencyGroup';
    this.iconPath = new vscode.ThemeIcon('folder');
    this.tooltip = `${groupName} dependencies (${children.length})`;
  }
}

class DependencyProvider {
  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element) {
    return element;
  }

  getChildren(element) {
    if (element instanceof DependencyGroupItem) {
      return element.children;
    }

    const folder = getFirstWorkspaceFolder();
    if (!folder) return [];

    const pyproject = path.join(folder.uri.fsPath, 'pyproject.toml');
    if (!fs.existsSync(pyproject)) return [];

    try {
      const text = fs.readFileSync(pyproject, 'utf8');
      const { main, optionalGroups, dependencyGroups } = parsePyprojectDependencies(text);
      const items = main.map(d => new DependencyItem(d.name, d.versionSpec));

      for (const [groupName, deps] of Object.entries(optionalGroups)) {
        const children = deps.map(d => new DependencyItem(d.name, d.versionSpec));
        items.push(new DependencyGroupItem(groupName, children));
      }

      for (const [groupName, deps] of Object.entries(dependencyGroups)) {
        const children = deps.map(d => new DependencyItem(d.name, d.versionSpec));
        items.push(new DependencyGroupItem(groupName, children));
      }

      return items;
    } catch (err) {
      console.error('Failed to read pyproject.toml for dependencies', err);
      return [];
    }
  }
}

module.exports = {
  DependencyProvider,
  DependencyItem,
};

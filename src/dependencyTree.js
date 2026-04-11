const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { getFirstWorkspaceFolder } = require('./utils');

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
    // If we're asked for children of a group, return its children
    if (element instanceof DependencyGroupItem) {
      return element.children;
    }

    // Top level: return main deps + groups
    const folder = getFirstWorkspaceFolder();
    if (!folder) return [];

    const pyproject = path.join(folder.uri.fsPath, 'pyproject.toml');
    if (!fs.existsSync(pyproject)) return [];

    try {
      const text = fs.readFileSync(pyproject, 'utf8');
      const items = [];

      // Parse main [project] dependencies
      const mainDeps = this._parseDependenciesArray(text, '[project]', 'dependencies');
      items.push(...mainDeps);

      // Parse [project.optional-dependencies]
      const optionalGroups = this._parseOptionalDependencies(text);
      items.push(...optionalGroups);

      // Parse [dependency-groups] (PEP 735)
      const depGroups = this._parseDependencyGroups(text);
      items.push(...depGroups);

      return items;
    } catch (err) {
      console.error('Failed to read pyproject.toml for dependencies', err);
      return [];
    }
  }

  /**
   * Parses a dependencies = [...] array from a TOML section.
   */
  _parseDependenciesArray(text, sectionHeader, key) {
    const sectionIdx = text.indexOf(sectionHeader);
    if (sectionIdx === -1) return [];

    const sectionSlice = text.slice(sectionIdx);
    // Stop at the next section header to avoid matching wrong section
    const nextSection = sectionSlice.slice(1).search(/^\[/m);
    const bounded = nextSection !== -1 ? sectionSlice.slice(0, nextSection + 1) : sectionSlice;

    const regex = new RegExp(`${key}\\s*=\\s*\\[([\\s\\S]*?)\\]`, 'm');
    const match = bounded.match(regex);
    if (!match || !match[1]) return [];

    return this._extractDeps(match[1]);
  }

  /**
   * Extracts dependency items from the content inside a [...] array.
   */
  _extractDeps(depsText) {
    const deps = [];
    const depRegex = /"([^"]+)"|'([^']+)'/g;
    let m;
    while ((m = depRegex.exec(depsText)) !== null) {
      const raw = m[1] || m[2];
      const parts = raw.split(/\s*(?:>=|==|<=|~=|!=|>|<|\[)/);
      const name = parts[0] || raw;
      const version = raw.slice(name.length).trim() || '';
      deps.push(new DependencyItem(name, version));
    }
    return deps;
  }

  /**
   * Parses [project.optional-dependencies] into groups.
   */
  _parseOptionalDependencies(text) {
    const header = '[project.optional-dependencies]';
    const idx = text.indexOf(header);
    if (idx === -1) return [];

    const afterHeader = text.slice(idx + header.length);
    const nextSection = afterHeader.search(/^\[/m);
    const bounded = nextSection !== -1 ? afterHeader.slice(0, nextSection) : afterHeader;

    return this._parseGroupedDeps(bounded);
  }

  /**
   * Parses [dependency-groups] (PEP 735) into groups.
   */
  _parseDependencyGroups(text) {
    const header = '[dependency-groups]';
    const idx = text.indexOf(header);
    if (idx === -1) return [];

    const afterHeader = text.slice(idx + header.length);
    const nextSection = afterHeader.search(/^\[/m);
    const bounded = nextSection !== -1 ? afterHeader.slice(0, nextSection) : afterHeader;

    return this._parseGroupedDeps(bounded);
  }

  /**
   * Parses "groupname = [...]" entries from a TOML section body.
   */
  _parseGroupedDeps(sectionBody) {
    const groups = [];
    const groupRegex = /^(\w[\w-]*)\s*=\s*\[([\s\S]*?)\]/gm;
    let match;
    while ((match = groupRegex.exec(sectionBody)) !== null) {
      const groupName = match[1];
      const children = this._extractDeps(match[2]);
      if (children.length > 0) {
        groups.push(new DependencyGroupItem(groupName, children));
      }
    }
    return groups;
  }
}

module.exports = {
  DependencyProvider,
  DependencyItem,
};

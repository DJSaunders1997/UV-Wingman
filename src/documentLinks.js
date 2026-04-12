// Provides clickable PyPI hyperlinks for package names in pyproject.toml and uv.lock files

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { findPyprojectDepPositions, buildLockVersionMap, findLockNamePositions } = require('./tomlParser');

const PYPI_BASE = 'https://pypi.org/project/';

/**
 * Reads uv.lock from the same directory as the given document and builds
 * a map of package name -> resolved version.
 */
function getVersionMap(document) {
    const dir = path.dirname(document.uri.fsPath);
    const lockPath = path.join(dir, 'uv.lock');

    try {
        if (!fs.existsSync(lockPath)) return new Map();
        const text = fs.readFileSync(lockPath, 'utf8');
        return buildLockVersionMap(text);
    } catch {
        return new Map();
    }
}

/**
 * Returns a PyPI URL for a package, using the resolved version if available.
 */
function pypiUrl(pkgName, versionMap) {
    const version = versionMap.get(pkgName);
    if (version) {
        return `${PYPI_BASE}${pkgName}/${version}/`;
    }
    return `${PYPI_BASE}${pkgName}/`;
}

class PyProjectLinkProvider {
    provideDocumentLinks(document) {
        const text = document.getText();
        const versionMap = getVersionMap(document);
        const deps = findPyprojectDepPositions(text);

        return deps.map(dep => {
            const range = new vscode.Range(
                new vscode.Position(dep.lineNum, dep.colStart),
                new vscode.Position(dep.lineNum, dep.colEnd)
            );
            const uri = vscode.Uri.parse(pypiUrl(dep.name, versionMap));
            return new vscode.DocumentLink(range, uri);
        });
    }
}

class UvLockLinkProvider {
    provideDocumentLinks(document) {
        const text = document.getText();
        const versionMap = buildLockVersionMap(text);
        const positions = findLockNamePositions(text);

        return positions.map(pos => {
            const range = new vscode.Range(
                new vscode.Position(pos.lineNum, pos.colStart),
                new vscode.Position(pos.lineNum, pos.colEnd)
            );
            const uri = vscode.Uri.parse(pypiUrl(pos.name, versionMap));
            return new vscode.DocumentLink(range, uri);
        });
    }
}

/**
 * Registers document link providers for pyproject.toml and uv.lock files.
 * @param {vscode.ExtensionContext} context
 */
function registerDocumentLinks(context) {
    const tomlSelector = { language: '*', pattern: '**/pyproject.toml' };
    const lockSelector = { language: '*', pattern: '**/uv.lock' };

    context.subscriptions.push(
        vscode.languages.registerDocumentLinkProvider(tomlSelector, new PyProjectLinkProvider()),
        vscode.languages.registerDocumentLinkProvider(lockSelector, new UvLockLinkProvider()),
    );
}

module.exports = { registerDocumentLinks };

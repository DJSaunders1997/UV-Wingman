// Provides clickable PyPI hyperlinks for package names in pyproject.toml and uv.lock files

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const PYPI_BASE = 'https://pypi.org/project/';

/**
 * Reads uv.lock from the same directory as the given document and builds
 * a map of package name -> resolved version.
 */
function buildVersionMap(document) {
    const dir = path.dirname(document.uri.fsPath);
    const lockPath = path.join(dir, 'uv.lock');
    const map = new Map();

    try {
        if (!fs.existsSync(lockPath)) return map;
        const text = fs.readFileSync(lockPath, 'utf8');
        const lines = text.split('\n');

        let currentName = null;
        for (const line of lines) {
            const nameMatch = line.match(/^name\s*=\s*"([^"]+)"/);
            if (nameMatch) {
                currentName = nameMatch[1];
                continue;
            }
            const versionMatch = line.match(/^version\s*=\s*"([^"]+)"/);
            if (versionMatch && currentName) {
                map.set(currentName, versionMatch[1]);
                currentName = null;
            }
        }
    } catch {
        // If we can't read uv.lock, just return empty map — links will go to latest
    }

    return map;
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
        const links = [];
        const versionMap = buildVersionMap(document);

        // Match dependency strings inside arrays: "package>=1.0" or 'package>=1.0'
        const depStringRegex = /["']([a-zA-Z0-9][\w.-]*)\s*(?:[><=!~\[].*?)?["']/g;

        const lines = text.split('\n');
        let inDepSection = false;
        let bracketDepth = 0;

        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const line = lines[lineNum];
            const trimmed = line.trim();

            // Detect start of dependency sections
            if (trimmed.match(/^(?:dependencies\s*=|[\w-]+\s*=\s*\[)/) ||
                trimmed.match(/^\[(?:project\.(?:optional-)?dependencies|dependency-groups|project\.scripts)\]/)) {
                inDepSection = true;
            }

            // Track bracket depth for array boundaries
            if (inDepSection) {
                for (const ch of line) {
                    if (ch === '[') bracketDepth++;
                    if (ch === ']') bracketDepth--;
                }
                if (bracketDepth <= 0 && trimmed.startsWith('[') && !trimmed.match(/^\[(?:project|dependency)/)) {
                    inDepSection = false;
                    bracketDepth = 0;
                    continue;
                }
            }

            if (!inDepSection) continue;

            // Find quoted package names on this line
            depStringRegex.lastIndex = 0;
            let match;
            while ((match = depStringRegex.exec(line)) !== null) {
                const pkgName = match[1];
                if (pkgName.startsWith('.') || pkgName.length < 2) continue;

                const nameStart = match.index + 1; // skip opening quote
                const nameEnd = nameStart + pkgName.length;

                const range = new vscode.Range(
                    new vscode.Position(lineNum, nameStart),
                    new vscode.Position(lineNum, nameEnd)
                );
                const uri = vscode.Uri.parse(pypiUrl(pkgName, versionMap));
                links.push(new vscode.DocumentLink(range, uri));
            }
        }

        return links;
    }
}

class UvLockLinkProvider {
    provideDocumentLinks(document) {
        const text = document.getText();
        const links = [];
        const lines = text.split('\n');

        // First pass: build name -> version map from [[package]] sections
        const versionMap = new Map();
        let currentName = null;
        for (const line of lines) {
            const nameMatch = line.match(/^name\s*=\s*"([^"]+)"/);
            if (nameMatch) {
                currentName = nameMatch[1];
                continue;
            }
            const versionMatch = line.match(/^version\s*=\s*"([^"]+)"/);
            if (versionMatch && currentName) {
                versionMap.set(currentName, versionMatch[1]);
                currentName = null;
            }
        }

        // Second pass: find every package name reference and create links
        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const line = lines[lineNum];

            // Pattern 1: top-level name = "package"
            const topLevel = line.match(/^name\s*=\s*"([a-zA-Z0-9][\w.-]*)"/);
            if (topLevel) {
                const pkgName = topLevel[1];
                const nameStart = line.indexOf('"') + 1;
                const range = new vscode.Range(
                    new vscode.Position(lineNum, nameStart),
                    new vscode.Position(lineNum, nameStart + pkgName.length)
                );
                const uri = vscode.Uri.parse(pypiUrl(pkgName, versionMap));
                links.push(new vscode.DocumentLink(range, uri));
                continue;
            }

            // Pattern 2: { name = "package" } in dependency arrays (can appear multiple times per line)
            const inlineRegex = /\{\s*name\s*=\s*"([a-zA-Z0-9][\w.-]*)"/g;
            let inlineMatch;
            while ((inlineMatch = inlineRegex.exec(line)) !== null) {
                const pkgName = inlineMatch[1];
                // Find the position of the package name within the match
                const quotePos = line.indexOf('"', inlineMatch.index + inlineMatch[0].indexOf('name'));
                const nameStart = quotePos + 1;
                const range = new vscode.Range(
                    new vscode.Position(lineNum, nameStart),
                    new vscode.Position(lineNum, nameStart + pkgName.length)
                );
                const uri = vscode.Uri.parse(pypiUrl(pkgName, versionMap));
                links.push(new vscode.DocumentLink(range, uri));
            }
        }

        return links;
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

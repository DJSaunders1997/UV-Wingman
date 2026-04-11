// Provides clickable PyPI hyperlinks for package names in pyproject.toml and uv.lock files

const vscode = require('vscode');

const PYPI_BASE = 'https://pypi.org/project/';

class PyProjectLinkProvider {
    provideDocumentLinks(document) {
        const text = document.getText();
        const links = [];

        // Match dependency strings inside arrays: "package>=1.0" or 'package>=1.0'
        // Works for [project.dependencies], [project.optional-dependencies], [dependency-groups]
        const depStringRegex = /["']([a-zA-Z0-9][\w.-]*)\s*(?:[><=!~\[].*?)?["']/g;

        // Only match inside dependency-like sections
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
                // Skip things that are clearly not package names
                if (pkgName.startsWith('.') || pkgName.length < 2) continue;

                // Find the position of the package name (after the opening quote)
                const nameStart = match.index + 1; // skip opening quote
                const nameEnd = nameStart + pkgName.length;

                const startPos = new vscode.Position(lineNum, nameStart);
                const endPos = new vscode.Position(lineNum, nameEnd);
                const range = new vscode.Range(startPos, endPos);
                const uri = vscode.Uri.parse(`${PYPI_BASE}${pkgName}/`);

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

        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const line = lines[lineNum];

            // Match: name = "package-name"
            const match = line.match(/^name\s*=\s*"([a-zA-Z0-9][\w.-]*)"/);
            if (!match) continue;

            const pkgName = match[1];
            const nameStart = line.indexOf('"') + 1;
            const nameEnd = nameStart + pkgName.length;

            const startPos = new vscode.Position(lineNum, nameStart);
            const endPos = new vscode.Position(lineNum, nameEnd);
            const range = new vscode.Range(startPos, endPos);
            const uri = vscode.Uri.parse(`${PYPI_BASE}${pkgName}/`);

            links.push(new vscode.DocumentLink(range, uri));
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

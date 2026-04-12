// Provides inline decoration annotations at the end of dependency lines in pyproject.toml,
// showing latest PyPI version and package description (similar to GitLens inline blame).

const vscode = require('vscode');
const https = require('https');

/** Simple in-memory cache: pkgName -> { version, summary, fetchedAt } */
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** Decoration type for the greyed-out inline hints */
const inlineDecorationType = vscode.window.createTextEditorDecorationType({
    after: {
        color: new vscode.ThemeColor('editorCodeLens.foreground'),
        fontStyle: 'italic',
        margin: '0 0 0 2em',
    },
    isWholeLine: false,
});

/** Invisible decoration type used only to attach hover tooltips to dependency text */
const hoverDecorationType = vscode.window.createTextEditorDecorationType({});

/**
 * Fetches package info from the PyPI JSON API.
 * Returns { version, summary } or null on failure.
 */
function fetchPypiInfo(pkgName) {
    return new Promise(resolve => {
        const url = `https://pypi.org/pypi/${encodeURIComponent(pkgName)}/json`;
        const req = https.get(url, { timeout: 5000 }, res => {
            if (res.statusCode !== 200) {
                res.resume();
                resolve(null);
                return;
            }
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({
                        version: json.info.version,
                        summary: json.info.summary || '',
                    });
                } catch {
                    resolve(null);
                }
            });
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
    });
}

/**
 * Returns cached PyPI info or fetches it, with TTL-based expiry.
 */
async function getPypiInfo(pkgName) {
    const cached = cache.get(pkgName);
    if (cached && (Date.now() - cached.fetchedAt) < CACHE_TTL_MS) {
        return cached;
    }
    const info = await fetchPypiInfo(pkgName);
    if (info) {
        cache.set(pkgName, { ...info, fetchedAt: Date.now() });
    }
    return info;
}

/** Freshness indicators for inline decorations */
const stale = { icon: '\u2191', color: '#E5C07B' };   // ↑ yellow — blocks latest
const fresh = { icon: '\u2713', color: '#98C379' };    // ✓ green — allows latest

/**
 * Compares a version specifier against the latest PyPI version.
 *
 * Green (✓): specifier allows the latest version (>=, ~=, no pin, or ==latest).
 * Yellow (↑): specifier blocks the latest version (==old, <, <=, !=latest).
 */
function getVersionFreshness(versionSpec, latestVersion) {

    if (!versionSpec) return fresh; // no constraint, pip/uv will pick latest

    // ==X.Y.Z — exact pin
    const exactMatch = versionSpec.match(/^==\s*(.+)/);
    if (exactMatch) {
        return exactMatch[1].trim() === latestVersion ? fresh : stale;
    }

    // !=X.Y.Z — if it excludes exactly the latest
    const neMatch = versionSpec.match(/^!=\s*(.+)/);
    if (neMatch) {
        return neMatch[1].trim() === latestVersion ? stale : fresh;
    }

    // <X.Y.Z or <=X.Y.Z — upper bound caps the version
    const ltMatch = versionSpec.match(/^<=?\s*([^,\s]+)/);
    if (ltMatch) {
        return ltMatch[1].trim() === latestVersion ? fresh : stale;
    }

    // >=, >, ~= — all allow newer versions, so latest is reachable
    return fresh;
}

const { findPyprojectDepPositions } = require('./tomlParser');

/**
 * Parses dependency lines from a pyproject.toml document.
 * Returns array of { lineNum, pkgName, versionSpec, depStart, depEnd }.
 */
function parseDependencyLines(document) {
    return findPyprojectDepPositions(document.getText()).map(dep => ({
        lineNum: dep.lineNum,
        pkgName: dep.name,
        versionSpec: dep.versionSpec,
        depStart: dep.colStart,
        depEnd: dep.colEnd,
    }));
}

/** Track the current update so we can cancel stale runs */
let updateCounter = 0;

/**
 * Updates inline decorations for the given text editor.
 * Fetches are done in parallel; decorations appear progressively as results arrive.
 */
async function updateDecorations(editor) {
    if (!editor || !editor.document.uri.path.endsWith('pyproject.toml')) {
        return;
    }

    const thisUpdate = ++updateCounter;
    const deps = parseDependencyLines(editor.document);

    if (deps.length === 0) {
        editor.setDecorations(inlineDecorationType, []);
        return;
    }

    // Fetch all PyPI info in parallel
    const results = await Promise.all(
        deps.map(async ({ lineNum, pkgName, versionSpec, depStart, depEnd }) => {
            const info = await getPypiInfo(pkgName);
            return { lineNum, pkgName, versionSpec, depStart, depEnd, info };
        })
    );

    // If a newer update started while we were fetching, discard these results
    if (thisUpdate !== updateCounter) return;
    // Editor may have been closed
    if (editor !== vscode.window.activeTextEditor) return;

    const inlineDecorations = [];
    const hoverDecorations = [];
    for (const { lineNum, pkgName, versionSpec, depStart, depEnd, info } of results) {
        if (!info) continue;

        const line = editor.document.lineAt(lineNum);
        const freshness = getVersionFreshness(versionSpec, info.version);
        const versionLabel = freshness === stale
            ? `newer available: ${info.version}`
            : `latest: ${info.version}`;

        const hoverMarkdown = info.summary
            ? `${info.summary}\n\n[View on PyPI](https://pypi.org/project/${pkgName}/)`
            : `[View on PyPI](https://pypi.org/project/${pkgName}/)`;

        // Inline version text at end of line
        inlineDecorations.push({
            range: new vscode.Range(lineNum, line.text.length, lineNum, line.text.length),
            renderOptions: {
                after: {
                    contentText: `  ${freshness.icon} ${versionLabel}`,
                    color: freshness.color,
                },
            },
        });

        // Hover tooltip covering the dependency text
        hoverDecorations.push({
            range: new vscode.Range(lineNum, depStart, lineNum, depEnd),
            hoverMessage: new vscode.MarkdownString(hoverMarkdown),
        });
    }

    editor.setDecorations(inlineDecorationType, inlineDecorations);
    editor.setDecorations(hoverDecorationType, hoverDecorations);
}

/** Debounce timer for document changes */
let debounceTimer;

/**
 * Registers inline PyPI decorations for pyproject.toml files.
 * @param {vscode.ExtensionContext} context
 */
function registerCodeLens(context) {
    // Decorate the active editor if it's a pyproject.toml
    if (vscode.window.activeTextEditor) {
        updateDecorations(vscode.window.activeTextEditor);
    }

    // Re-decorate when switching editors
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                updateDecorations(editor);
            }
        })
    );

    // Re-decorate on document changes (debounced)
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(e => {
            const editor = vscode.window.activeTextEditor;
            if (editor && e.document === editor.document) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => updateDecorations(editor), 1000);
            }
        })
    );
}

module.exports = { registerCodeLens };

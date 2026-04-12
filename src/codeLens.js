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

const { findPyprojectDepPositions, findLockNamePositions, buildLockVersionMap } = require('./tomlParser');

/**
 * Returns package positions from pyproject.toml or uv.lock.
 * Normalised to a common shape: { lineNum, colStart, colEnd, name, versionSpec }.
 */
function getPackagePositions(document) {
    const text = document.getText();
    if (document.uri.path.endsWith('pyproject.toml')) {
        return findPyprojectDepPositions(text).map(dep => ({
            lineNum: dep.lineNum,
            colStart: dep.colStart,
            colEnd: dep.colEnd,
            name: dep.name,
            versionSpec: dep.versionSpec,
        }));
    }
    const versionMap = buildLockVersionMap(text);
    return findLockNamePositions(text).map(pos => ({
        ...pos,
        versionSpec: null,
        lockedVersion: versionMap.get(pos.name),
    }));
}

/** Track the current update so we can cancel stale runs */
let updateCounter = 0;

/**
 * Updates inline decorations for the given text editor.
 * Works on both pyproject.toml (inline hints + hovers) and uv.lock (hovers only).
 */
async function updateDecorations(editor) {
    if (!editor) return;

    const filePath = editor.document.uri.path;
    const isPyproject = filePath.endsWith('pyproject.toml');
    const isLock = filePath.endsWith('uv.lock');
    if (!isPyproject && !isLock) return;

    const thisUpdate = ++updateCounter;
    const positions = getPackagePositions(editor.document);

    if (positions.length === 0) {
        editor.setDecorations(inlineDecorationType, []);
        editor.setDecorations(hoverDecorationType, []);
        return;
    }

    const results = await Promise.all(
        positions.map(async (pos) => {
            const info = await getPypiInfo(pos.name);
            return { ...pos, info };
        })
    );

    if (thisUpdate !== updateCounter) return;
    if (editor !== vscode.window.activeTextEditor) return;

    const inlineDecorations = [];
    const hoverDecorations = [];

    for (const { lineNum, colStart, colEnd, name, versionSpec, lockedVersion, info } of results) {
        if (!info) continue;

        // Hover tooltip (both file types)
        const parts = [];
        if (info.summary) parts.push(info.summary);
        if (lockedVersion) parts.push(`**Locked version:** ${lockedVersion}`);
        parts.push(`[View on PyPI](https://pypi.org/project/${name}/)`);

        hoverDecorations.push({
            range: new vscode.Range(lineNum, colStart, lineNum, colEnd),
            hoverMessage: new vscode.MarkdownString(parts.join('\n\n')),
        });

        // Inline version hints (pyproject.toml only)
        if (isPyproject) {
            const line = editor.document.lineAt(lineNum);
            const freshness = getVersionFreshness(versionSpec, info.version);
            const versionLabel = freshness === stale
                ? `newer available: ${info.version}`
                : `latest: ${info.version}`;

            inlineDecorations.push({
                range: new vscode.Range(lineNum, line.text.length, lineNum, line.text.length),
                renderOptions: {
                    after: {
                        contentText: `  ${freshness.icon} ${versionLabel}`,
                        color: freshness.color,
                    },
                },
            });
        }
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

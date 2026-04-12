// Manages the webview panel for the interactive dependency graph visualization.

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { buildDependencyGraph } = require('./dependencyGraph');
const { getFirstWorkspaceFolder } = require('./utils');

let currentPanel;

/**
 * Creates or reveals the dependency graph webview panel.
 * @param {vscode.ExtensionContext} context
 */
function createOrShowPanel(context) {
    if (currentPanel) {
        currentPanel.reveal(vscode.ViewColumn.Beside);
        refreshGraph(context);
        return;
    }

    const mediaUri = vscode.Uri.joinPath(context.extensionUri, 'media');
    const d3Uri = vscode.Uri.joinPath(context.extensionUri, 'node_modules', 'd3', 'dist');

    currentPanel = vscode.window.createWebviewPanel(
        'uvWingmanDepGraph',
        'UV Wingman: Dependency Graph',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            localResourceRoots: [mediaUri, d3Uri],
            retainContextWhenHidden: true,
        }
    );

    currentPanel.onDidDispose(() => {
        currentPanel = undefined;
    }, null, context.subscriptions);

    refreshGraph(context);
}

/**
 * Reads project files and updates the webview content.
 */
function refreshGraph(context) {
    if (!currentPanel) return;

    const folder = getFirstWorkspaceFolder();
    if (!folder) {
        currentPanel.webview.html = errorHtml('No workspace folder open.');
        return;
    }

    const lockPath = path.join(folder.uri.fsPath, 'uv.lock');
    const pyprojectPath = path.join(folder.uri.fsPath, 'pyproject.toml');

    if (!fs.existsSync(lockPath)) {
        currentPanel.webview.html = errorHtml('No uv.lock file found. Run <code>uv lock</code> first.');
        return;
    }
    if (!fs.existsSync(pyprojectPath)) {
        currentPanel.webview.html = errorHtml('No pyproject.toml file found.');
        return;
    }

    try {
        const lockText = fs.readFileSync(lockPath, 'utf8');
        const pyprojectText = fs.readFileSync(pyprojectPath, 'utf8');
        const graphData = buildDependencyGraph(lockText, pyprojectText);

        currentPanel.webview.html = getWebviewContent(currentPanel.webview, context.extensionUri, graphData);
    } catch (err) {
        currentPanel.webview.html = errorHtml(`Failed to parse files: ${err.message}`);
    }
}

function errorHtml(message) {
    return `<!DOCTYPE html><html><body style="padding:2em;font-family:var(--vscode-font-family);color:var(--vscode-editor-foreground);background:var(--vscode-editor-background)"><h2>UV Dependency Graph</h2><p>${message}</p></body></html>`;
}

/**
 * Reads the HTML template and injects dynamic values.
 */
function getWebviewContent(webview, extensionUri, graphData) {
    const d3Uri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, 'node_modules', 'd3', 'dist', 'd3.min.js')
    );
    const nonce = crypto.randomBytes(16).toString('hex');

    const templatePath = path.join(extensionUri.fsPath, 'media', 'dependencyGraph.html');
    let html = fs.readFileSync(templatePath, 'utf8');

    html = html.replace(/\{\{NONCE\}\}/g, nonce);
    html = html.replace(/\{\{D3_URI\}\}/g, d3Uri.toString());
    html = html.replace(/\{\{GRAPH_DATA\}\}/g, JSON.stringify(graphData));

    return html;
}

module.exports = { createOrShowPanel };

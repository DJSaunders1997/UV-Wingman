# media/

Static assets served to VS Code webviews.

- `dependencyGraph.html` — HTML template for the dependency graph panel (placeholders `{{NONCE}}`, `{{D3_URI}}`, `{{GRAPH_DATA}}` are substituted at runtime by `src/dependencyGraphPanel.js`). D3.js is loaded from `node_modules/d3` at runtime.

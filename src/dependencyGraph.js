// Builds a dependency graph data structure from uv.lock and pyproject.toml
// for rendering in the webview.

const TOML = require('@iarna/toml');
const { parsePyprojectDependencies } = require('./tomlParser');

/**
 * Normalizes a Python package name for comparison.
 * PyPI names are case-insensitive and treat -, _, . as equivalent.
 */
function normalizeName(name) {
    return name.toLowerCase().replace(/[-_.]+/g, '-');
}

/**
 * Builds a dependency graph from uv.lock and pyproject.toml text.
 *
 * @param {string} lockText - Contents of uv.lock
 * @param {string} pyprojectText - Contents of pyproject.toml
 * @returns {{ nodes: Array, edges: Array, projectName: string }}
 */
function buildDependencyGraph(lockText, pyprojectText) {
    const parsed = TOML.parse(lockText);
    const packages = parsed.package || [];

    // Collect all direct dependency names from pyproject.toml
    const { main, optionalGroups, dependencyGroups } = parsePyprojectDependencies(pyprojectText);
    const directNames = new Set();
    for (const dep of main) directNames.add(normalizeName(dep.name));
    for (const deps of Object.values(optionalGroups)) {
        for (const dep of deps) directNames.add(normalizeName(dep.name));
    }
    for (const deps of Object.values(dependencyGroups)) {
        for (const dep of deps) directNames.add(normalizeName(dep.name));
    }

    const nodes = [];
    const edges = [];
    let projectName = 'project';

    for (const pkg of packages) {
        if (!pkg.name) continue;

        const id = normalizeName(pkg.name);
        const isRoot = pkg.source?.virtual === '.';
        const isDirect = directNames.has(id);

        if (isRoot) projectName = pkg.name;

        nodes.push({
            id,
            name: pkg.name,
            version: pkg.version || '',
            isDirect,
            isRoot,
        });

        // Runtime dependencies
        for (const dep of pkg.dependencies || []) {
            if (dep.name) {
                edges.push({ source: id, target: normalizeName(dep.name) });
            }
        }

        // Optional dependencies
        const optDeps = pkg['optional-dependencies'];
        if (optDeps && typeof optDeps === 'object') {
            for (const deps of Object.values(optDeps)) {
                for (const dep of deps || []) {
                    if (dep.name) {
                        edges.push({ source: id, target: normalizeName(dep.name) });
                    }
                }
            }
        }

        // Dev dependencies (dependency groups resolved in lock)
        for (const dep of pkg['dev-dependencies'] || []) {
            if (dep.name) {
                edges.push({ source: id, target: normalizeName(dep.name) });
            }
        }
    }

    return { nodes, edges, projectName };
}

module.exports = { buildDependencyGraph };

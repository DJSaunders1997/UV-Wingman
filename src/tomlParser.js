// Shared TOML parsing utilities for pyproject.toml and uv.lock files.
// Uses @iarna/toml for proper parsing instead of manual regex/bracket-depth tracking.

const TOML = require('@iarna/toml');

/**
 * Splits a dependency string like "requests>=2.28" into { name, versionSpec }.
 */
function splitDep(raw) {
    const parts = raw.split(/\s*(?:>=|==|<=|~=|!=|>|<|\[)/);
    const name = (parts[0] || raw).trim();
    const versionSpec = raw.slice(name.length).trim();
    return { name, versionSpec };
}

/**
 * Extracts dependency entries from a TOML array value.
 * Handles both strings ("requests>=2.0") and include-group objects ({include-group = "dev"}).
 */
function extractDepsFromArray(arr) {
    if (!Array.isArray(arr)) return [];
    return arr
        .filter(entry => typeof entry === 'string')
        .map(splitDep);
}

/**
 * Parses pyproject.toml text and returns structured dependency data.
 *
 * Returns {
 *   main: [{ name, versionSpec }],
 *   optionalGroups: { groupName: [{ name, versionSpec }] },
 *   dependencyGroups: { groupName: [{ name, versionSpec }] },
 * }
 */
function parsePyprojectDependencies(text) {
    const empty = { main: [], optionalGroups: {}, dependencyGroups: {} };
    try {
        const parsed = TOML.parse(text);

        const main = extractDepsFromArray(parsed.project?.dependencies);

        const optionalGroups = {};
        const optDeps = parsed.project?.['optional-dependencies'];
        if (optDeps && typeof optDeps === 'object') {
            for (const [group, arr] of Object.entries(optDeps)) {
                const deps = extractDepsFromArray(arr);
                if (deps.length > 0) optionalGroups[group] = deps;
            }
        }

        const dependencyGroups = {};
        const depGroups = parsed['dependency-groups'];
        if (depGroups && typeof depGroups === 'object') {
            for (const [group, arr] of Object.entries(depGroups)) {
                const deps = extractDepsFromArray(arr);
                if (deps.length > 0) dependencyGroups[group] = deps;
            }
        }

        return { main, optionalGroups, dependencyGroups };
    } catch {
        return empty;
    }
}

/**
 * Parses script names from [project.scripts] in pyproject.toml.
 * Returns an array of script name strings.
 */
function parsePyprojectScripts(text) {
    try {
        const parsed = TOML.parse(text);
        return Object.keys(parsed.project?.scripts || {});
    } catch {
        return [];
    }
}

/**
 * Collects all dependency names from parsed pyproject data into a Set.
 * Applies an optional transform (e.g. normalizeName) to each name.
 */
function collectAllDepNames({ main, optionalGroups, dependencyGroups }, transform) {
    const names = new Set();
    const add = transform ? (n) => names.add(transform(n)) : (n) => names.add(n);
    for (const dep of main) add(dep.name);
    for (const deps of Object.values(optionalGroups)) {
        for (const dep of deps) add(dep.name);
    }
    for (const deps of Object.values(dependencyGroups)) {
        for (const dep of deps) add(dep.name);
    }
    return names;
}

/**
 * Finds the positions of dependency strings in a pyproject.toml document.
 * Uses the TOML parser to determine which names are real dependencies,
 * then scans the text to find their line/column positions.
 *
 * Returns [{ lineNum, colStart, colEnd, name, versionSpec }]
 */
function findPyprojectDepPositions(text) {
    const deps = parsePyprojectDependencies(text);
    const depNames = collectAllDepNames(deps);

    if (depNames.size === 0) return [];

    // Scan lines for quoted strings containing known dependency names
    const results = [];
    const lines = text.split('\n');
    const depStringRegex = /["']([a-zA-Z0-9][\w.-]*)\s*((?:[><=!~\[].*?)?)["']/g;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        depStringRegex.lastIndex = 0;
        let match;
        while ((match = depStringRegex.exec(line)) !== null) {
            const name = match[1];
            if (!depNames.has(name)) continue;

            const colStart = match.index + 1; // skip opening quote
            const colEnd = match.index + match[0].length - 1; // before closing quote
            const versionSpec = match[2] ? match[2].trim() : '';

            results.push({ lineNum: i, colStart, colEnd, name, versionSpec });
        }
    }

    return results;
}

/**
 * Parses a uv.lock file and returns a Map of package name -> version.
 */
function buildLockVersionMap(text) {
    const map = new Map();
    try {
        const parsed = TOML.parse(text);
        for (const pkg of parsed.package || []) {
            if (pkg.name && pkg.version) {
                map.set(pkg.name, pkg.version);
            }
        }
    } catch {
        // Fall back to empty map if lock file can't be parsed
    }
    return map;
}

/**
 * Finds positions of package name references in a uv.lock file.
 * Uses the TOML parser to get all known package names,
 * then scans the text for their positions.
 *
 * Returns [{ lineNum, colStart, colEnd, name }]
 */
function findLockNamePositions(text) {
    const versionMap = buildLockVersionMap(text);
    if (versionMap.size === 0) return [];

    const allNames = new Set(versionMap.keys());

    // Also collect dependency names from within packages
    try {
        const parsed = TOML.parse(text);
        for (const pkg of parsed.package || []) {
            // dependencies and optional-dependencies contain { name = "..." } objects
            for (const dep of pkg.dependencies || []) {
                if (dep.name) allNames.add(dep.name);
            }
            const optDeps = pkg['optional-dependencies'];
            if (optDeps && typeof optDeps === 'object') {
                for (const deps of Object.values(optDeps)) {
                    for (const dep of deps || []) {
                        if (dep.name) allNames.add(dep.name);
                    }
                }
            }
        }
    } catch {
        // Use only the names we already have
    }

    const results = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Pattern 1: name = "package"
        const topLevel = line.match(/^name\s*=\s*"([a-zA-Z0-9][\w.-]*)"/);
        if (topLevel && allNames.has(topLevel[1])) {
            const colStart = line.indexOf('"') + 1;
            results.push({
                lineNum: i,
                colStart,
                colEnd: colStart + topLevel[1].length,
                name: topLevel[1],
            });
            continue;
        }

        // Pattern 2: { name = "package" } in dependency arrays
        const inlineRegex = /\{\s*name\s*=\s*"([a-zA-Z0-9][\w.-]*)"/g;
        let inlineMatch;
        while ((inlineMatch = inlineRegex.exec(line)) !== null) {
            const pkgName = inlineMatch[1];
            if (!allNames.has(pkgName)) continue;
            const quotePos = line.indexOf('"', inlineMatch.index + inlineMatch[0].indexOf('name'));
            const colStart = quotePos + 1;
            results.push({
                lineNum: i,
                colStart,
                colEnd: colStart + pkgName.length,
                name: pkgName,
            });
        }
    }

    return results;
}

module.exports = {
    parsePyprojectDependencies,
    parsePyprojectScripts,
    findPyprojectDepPositions,
    buildLockVersionMap,
    findLockNamePositions,
    collectAllDepNames,
};

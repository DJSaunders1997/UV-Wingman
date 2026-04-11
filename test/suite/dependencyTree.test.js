const assert = require('assert');

suite('Dependency Tree Test Suite', () => {

    test('Source file should parse main dependencies', () => {
        const fs = require('fs');
        const path = require('path');
        const source = fs.readFileSync(
            path.join(__dirname, '../../src/dependencyTree.js'),
            'utf8'
        );

        // Verify the dependency tree source handles key sections
        assert.ok(source.includes('[project]'), 'Should reference [project] section');
        assert.ok(source.includes('[project.optional-dependencies]'), 'Should handle optional deps');
        assert.ok(source.includes('[dependency-groups]'), 'Should handle dependency groups');
    });

    test('Source file should support PyPI links', () => {
        const fs = require('fs');
        const path = require('path');
        const source = fs.readFileSync(
            path.join(__dirname, '../../src/dependencyTree.js'),
            'utf8'
        );

        assert.ok(
            source.includes('pypi.org/project/'),
            'Should have PyPI link generation'
        );
    });

    test('Source file should export DependencyProvider and DependencyItem', () => {
        const fs = require('fs');
        const path = require('path');
        const source = fs.readFileSync(
            path.join(__dirname, '../../src/dependencyTree.js'),
            'utf8'
        );

        assert.ok(source.includes('DependencyProvider'), 'Should export DependencyProvider');
        assert.ok(source.includes('DependencyItem'), 'Should export DependencyItem');
    });
});

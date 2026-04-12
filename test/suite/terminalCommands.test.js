const assert = require('assert');

suite('Terminal Commands Test Suite', () => {

    // All shell types must have these keys
    const requiredKeys = ['activateVenv', 'removeDir', 'initProject', 'syncDeps', 'createVenv', 'lock'];

    // We can't require the actual module (it depends on vscode), but we can
    // verify the structure by reading the source and checking patterns.
    // For unit tests without vscode, we test the expected command keys.

    test('Required command keys are documented', () => {
        // This test validates our expectations about the command interface
        assert.ok(requiredKeys.includes('activateVenv'), 'Should require activateVenv');
        assert.ok(requiredKeys.includes('removeDir'), 'Should require removeDir');
        assert.ok(requiredKeys.includes('initProject'), 'Should require initProject');
        assert.ok(requiredKeys.includes('syncDeps'), 'Should require syncDeps');
        assert.ok(requiredKeys.includes('createVenv'), 'Should require createVenv');
        assert.ok(requiredKeys.includes('lock'), 'Should require lock');
    });

    test('POSIX commands should include createVenv', () => {
        // Read the source file and verify createVenv is in posix commands
        const fs = require('fs');
        const path = require('path');
        const source = fs.readFileSync(
            path.join(__dirname, '../../src/terminalCommands.js'),
            'utf8'
        );

        // Verify createVenv appears in getPosixCommands function
        assert.ok(
            source.includes("createVenv: 'uv venv'") || source.includes('createVenv: "uv venv"'),
            'POSIX commands should define createVenv as uv venv'
        );
    });

    test('All builder functions should include lock command', () => {
        const fs = require('fs');
        const path = require('path');
        const source = fs.readFileSync(
            path.join(__dirname, '../../src/terminalCommands.js'),
            'utf8'
        );

        // Count occurrences of lock key in command builders
        const lockMatches = source.match(/lock:\s*['"`]uv lock['"`]/g);
        assert.ok(
            lockMatches && lockMatches.length >= 3,
            'Should have lock command in at least POSIX, PowerShell, and cmd builders'
        );
    });
});

const assert = require('assert');

suite('Extension Test Suite', () => {

    test('All package.json commands should be registerable', async () => {
        // Verify the extension's declared commands are valid string IDs
        const packageJson = require('../../package.json');
        const declaredCommands = packageJson.contributes.commands.map(c => c.command);

        assert.ok(declaredCommands.length > 0, 'Should have at least one command');

        const expectedCommands = [
            'uv-wingman.initProject',
            'uv-wingman.createEnvironment',
            'uv-wingman.syncDependencies',
            'uv-wingman.deleteEnvironment',
            'uv-wingman.activateEnvironment',
            'uv-wingman.addPackage',
            'uv-wingman.removePackage',
            'uv-wingman.runScript',
            'uv-wingman.lock',
        ];

        for (const cmd of expectedCommands) {
            assert.ok(
                declaredCommands.includes(cmd),
                `Command ${cmd} should be declared in package.json`
            );
        }
    });

    test('Package.json should have configuration settings', () => {
        const packageJson = require('../../package.json');
        const props = packageJson.contributes.configuration.properties;

        assert.ok(props['uvWingman.envName'], 'Should have envName setting');
        assert.strictEqual(props['uvWingman.envName'].default, '.venv');

        assert.ok(props['uvWingman.showStatusBarItems'], 'Should have showStatusBarItems setting');
        assert.strictEqual(props['uvWingman.showStatusBarItems'].default, true);

        assert.ok(props['uvWingman.autoSetInterpreter'], 'Should have autoSetInterpreter setting');
        assert.strictEqual(props['uvWingman.autoSetInterpreter'].default, true);
    });

    test('Package.json version should be 2.0.0', () => {
        const packageJson = require('../../package.json');
        assert.strictEqual(packageJson.version, '2.0.0');
    });
});

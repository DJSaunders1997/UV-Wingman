const assert = require('assert');
const vscode = require('vscode');
const sinon = require('sinon');
const { buildCondaYAML } = require('../../src/commands');
const { sendCommandToTerminal } = require('../../src/utils');

suite('Build Conda YAML Tests', () => {
    let sandbox;

    // Setup a sandbox for sinon before each test to manage stubs/spies
    // Sandbox: Using a sandbox from sinon helps manage multiple stubs and spies, ensuring that after each test, all modifications are reset.
    // This prevents tests from interfering with each other.
    setup(() => {
        sandbox = sinon.createSandbox();
    });

    // Restore the sandbox to clean up all stubs/spies after each test
    teardown(() => {
        sandbox.restore();
    });

    test('Build Conda Environment Command with YAML file', async () => {
        // Stub the activeTextEditor to simulate a YAML file being open
        // Stubbing vscode.window.activeTextEditor: This is crucial for simulating the environment where a YAML file is supposedly open in the editor,
        // which is a dependency for the command to execute correctly.
        const fakeEditor = {
            document: {
                fileName: 'path/to/environment.yaml'
            }
        };
        sandbox.stub(vscode.window, 'activeTextEditor').value(fakeEditor);

        // Stub the sendCommandToTerminal function to prevent it from executing actual terminal commands
        // Stubbing sendCommandToTerminal: This prevents the function from actually running terminal commands on your development machine,
        // which is important for not altering your local development environment during testing.
        const terminalStub = sandbox.stub(sendCommandToTerminal, 'sendCommandToTerminal');

        // Execute the command to test if it correctly handles a YAML file
        await vscode.commands.executeCommand('conda-wingman.buildCondaYAML');

        // Assert that the terminal command was called with the correct command to create a Conda environment
        // Assertions: These check that the expected terminal command is formed and that the appropriate user feedback is provided,
        // validating the functionality of the command under test conditions.
        assert.ok(terminalStub.calledWith(`conda env create -f "${fakeEditor.document.fileName}"`));

        // Optionally, check for any UI feedback that should have been triggered
        const spyInfo = sandbox.spy(vscode.window, 'showInformationMessage');
        assert.ok(spyInfo.calledWithMatch(/Creating Env from/));
    });
});
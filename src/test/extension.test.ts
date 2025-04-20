import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	// Log when the test suite starts
	console.log('Starting Extension Test Suite');
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		// Log when the sample test starts
		console.log('Starting Sample test');
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
		// Log when the sample test ends
		console.log('Finished Sample test');
	});

	// Log when the test suite finishes
	suiteTeardown(() => {
		console.log('Finished Extension Test Suite');
	});
});

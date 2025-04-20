// This file is the entry point for the test runner.
// It collects all tests from the current directory and runs them.

import * as path from 'path';
import Mocha from 'mocha'; // Corrected import
import { glob } from 'glob'; // Corrected import

export function run(): Promise<void> {
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd', // Use the TDD interface
		color: true // Colored output
	});

	const testsRoot = path.resolve(__dirname, '.');

	return new Promise(async (c, e) => { // Added async here
		try {
			const files = await glob('**/**.test.js', { cwd: testsRoot }); // Use await with glob

			// Add files to the test suite
			files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

			// Run the mocha test
			mocha.run(failures => {
				if (failures > 0) {
					e(new Error(`${failures} tests failed.`));
				} else {
					c();
				}
			});
		} catch (err) {
			console.error(err);
			e(err);
		}
	});
}

/**
 * Entry point for E2E tests
 * Sets up the Mocha test environment and imports all test files
 */

import * as path from "path";
import { glob } from "glob";
import Mocha from "mocha";

/**
 * Determines which test files to run based on the test configuration
 * @returns A pattern to match the test files to run
 */
function getTestPattern(): string {
    // Check for test configuration in environment variables
    const testConfig = process.env.TEST_CONFIG || "clean-project"; // Default to clean project
    
    console.log(`Running tests for configuration: ${testConfig}`);
    
    switch (testConfig) {
        case "clean-project":
            // Only run the clean project tests
            return "**/clean-project.test.js";
            
        case "standard-project":
            // Only run the standard project tests
            return "**/!(clean-project).test.js";
            
        default:
            // Run all tests by default
            return "**/**.test.js";
    }
}

export async function run(): Promise<void> {
    // Create the mocha test
    const mocha = new Mocha({
        ui: "bdd",
        color: true,
        timeout: 60000
    });

    const testsRoot = path.resolve(__dirname, "./");
    
    return new Promise<void>(async (resolve, reject) => {
        try {
            // Determine which tests to run
            const testPattern = getTestPattern();
            console.log(`Using test pattern: ${testPattern}`);
            
            // Find all test files
            const files = await glob(testPattern, { cwd: testsRoot });
            
            console.log(`Found ${files.length} test files to run:`, files);
            
            // Add files to the test suite
            files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

            try {
                // Run the mocha test
                mocha.run((failures: number) => {
                    if (failures > 0) {
                        reject(new Error(`${failures} tests failed.`));
                    } else {
                        resolve();
                    }
                });
            } catch (err) {
                console.error("Error running tests:", err);
                reject(err);
            }
        } catch (err) {
            console.error("Error finding test files:", err);
            reject(err);
        }
    });
}
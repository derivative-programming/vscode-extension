"use strict";
/**
 * Entry point for E2E tests
 * Sets up the Mocha test environment and imports all test files
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const path = __importStar(require("path"));
const glob_1 = require("glob");
const mocha_1 = __importDefault(require("mocha"));
/**
 * Determines which test files to run based on the test configuration
 * @returns A pattern to match the test files to run
 */
function getTestPattern() {
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
async function run() {
    // Create the mocha test
    const mocha = new mocha_1.default({
        ui: "bdd",
        color: true,
        timeout: 60000
    });
    const testsRoot = path.resolve(__dirname, "./");
    return new Promise(async (resolve, reject) => {
        try {
            // Determine which tests to run
            const testPattern = getTestPattern();
            console.log(`Using test pattern: ${testPattern}`);
            // Find all test files
            const files = await (0, glob_1.glob)(testPattern, { cwd: testsRoot });
            console.log(`Found ${files.length} test files to run:`, files);
            // Add files to the test suite
            files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));
            try {
                // Run the mocha test
                mocha.run((failures) => {
                    if (failures > 0) {
                        reject(new Error(`${failures} tests failed.`));
                    }
                    else {
                        resolve();
                    }
                });
            }
            catch (err) {
                console.error("Error running tests:", err);
                reject(err);
            }
        }
        catch (err) {
            console.error("Error finding test files:", err);
            reject(err);
        }
    });
}
//# sourceMappingURL=index.js.map
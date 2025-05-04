"use strict";
/**
 * E2E test runner for AppDNA extension
 * Uses @vscode/test-electron instead of WebdriverIO to avoid chromedriver issues
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
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const test_electron_1 = require("@vscode/test-electron");
// Clean project test - no app-dna files exist
const cleanProjectTest = {
    name: "clean-project",
    setupTestWorkspace: (workspacePath) => {
        // For clean project test, we don't copy any app-dna files
        // We ensure no app-dna files exist in the workspace
        console.log("Setting up clean project test workspace - no app-dna files will be created");
    }
};
// Standard project test - has app-dna.schema.json and app-dna.json
const standardProjectTest = {
    name: "standard-project",
    setupTestWorkspace: (workspacePath) => {
        // Copy schema file
        copyFileToTestWorkspace(path.join(rootDir, "app-dna.schema.json"), workspacePath);
        // Create a sample app-dna.json file in the test workspace
        const sampleAppDnaJson = {
            "root": {
                "name": "TestApp",
                "appName": "TestApp",
                "companyLegalName": "Test Company",
                "companyDomain": "testcompany.com",
                "namespace": [],
                "databaseName": "TestDb"
            }
        };
        fs.writeFileSync(path.join(workspacePath, "app-dna.json"), JSON.stringify(sampleAppDnaJson, null, 2), "utf8");
        console.log("Created sample app-dna.json file in test workspace");
    }
};
// Use explicit paths to avoid resolution issues
const rootDir = "C:\\VR\\Source\\DP\\vscode-extension";
const testE2eDir = path.join(rootDir, "test-e2e");
/**
 * Copies a file to the test workspace
 * @param sourcePath Source file path
 * @param testWorkspaceDir Destination test workspace directory
 */
function copyFileToTestWorkspace(sourcePath, testWorkspaceDir) {
    if (fs.existsSync(sourcePath)) {
        const fileName = path.basename(sourcePath);
        const destPath = path.join(testWorkspaceDir, fileName);
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Copied ${fileName} to test workspace`);
    }
    else {
        console.warn(`Warning: Source file not found: ${sourcePath}`);
    }
}
/**
 * Run a specific test configuration
 */
async function runTestConfiguration(config) {
    try {
        // The folder containing the Extension Manifest package.json (main project root)
        const extensionDevelopmentPath = rootDir;
        // The path to the extension test runner script
        const extensionTestsPath = path.join(testE2eDir, "out", "src", "index");
        console.log(`Starting E2E tests for configuration: ${config.name}...`);
        console.log(`Root directory: ${rootDir}`);
        console.log(`Test-E2E directory: ${testE2eDir}`);
        console.log(`Extension development path: ${extensionDevelopmentPath}`);
        console.log(`Extension tests path: ${extensionTestsPath}`);
        // Make sure the extension is built before running tests
        const distFolder = path.join(extensionDevelopmentPath, "dist");
        console.log(`Checking for extension build at: ${distFolder}`);
        if (!fs.existsSync(distFolder)) {
            console.error("Extension is not built. Please run 'npm run compile' first.");
            process.exit(1);
        }
        else {
            console.log("Extension build found.");
            // Check for the extension.js file within the dist folder
            const extensionJsPath = path.join(distFolder, "extension.js");
            if (fs.existsSync(extensionJsPath)) {
                console.log("Extension entry point found.");
            }
            else {
                console.error("Extension entry point not found. Make sure the extension is properly built.");
                process.exit(1);
            }
        }
        // Create a clean test workspace directory with a timestamp and config name
        const testWorkspaceDir = path.join(os.tmpdir(), `vscode-test-${config.name}-${Date.now()}`);
        console.log(`Creating test workspace at: ${testWorkspaceDir}`);
        // Create the directory if it doesn't exist
        if (!fs.existsSync(testWorkspaceDir)) {
            fs.mkdirSync(testWorkspaceDir, { recursive: true });
        }
        // Setup test workspace according to the configuration
        config.setupTestWorkspace(testWorkspaceDir);
        // Set environment variables to indicate which test we're running
        const testEnv = {
            TEST_CONFIG: config.name,
            TEST_WORKSPACE: testWorkspaceDir
        };
        // Run the extension test in the clean workspace
        await (0, test_electron_1.runTests)({
            // Load the extension from the main project directory
            extensionDevelopmentPath,
            // Point to our test files
            extensionTestsPath,
            // Use the clean test workspace
            launchArgs: [testWorkspaceDir],
            // Pass environment variables to the test process
            extensionTestsEnv: testEnv,
            // Specify the VS Code executable path
            vscodeExecutablePath: "C:\\Users\\vince\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe"
        });
        // Clean up the test workspace
        console.log(`Cleaning up test workspace at: ${testWorkspaceDir}`);
        // Uncomment the following line to enable automatic cleanup
        // fs.rmSync(testWorkspaceDir, { recursive: true, force: true });
    }
    catch (err) {
        console.error(`Failed to run E2E tests for configuration ${config.name}:`, err);
        process.exit(1);
    }
}
/**
 * Main function to run tests
 */
async function main() {
    // Determine which test configuration to run based on command line arguments
    const args = process.argv.slice(2);
    let testConfig = cleanProjectTest; // Default to clean project test
    if (args.includes("--standard")) {
        testConfig = standardProjectTest;
    }
    await runTestConfiguration(testConfig);
}
main();
//# sourceMappingURL=runTest.js.map
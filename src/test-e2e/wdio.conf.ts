import path from 'path';

// Use __dirname directly as we're in a Node.js environment
export const config = {
    // WebdriverIO config for VS Code extension testing
    runner: 'local',
    autoCompileOpts: {
        autoCompile: true,
        tsNodeOpts: {
            transpileOnly: true,
            project: path.join(__dirname, '../../tsconfig.json')
        }
    },
    specs: [
        path.join(__dirname, './specs/**/*.ts')
    ],
    exclude: [],
    maxInstances: 1, // Run tests sequentially
    capabilities: [{
        browserName: 'vscode',
        'wdio:vscodeOptions': {
            // Path to the extension folder
            extensionPath: path.join(__dirname, '../..'),
            // Use the local VS Code installation - replace with your VS Code path
            binary: 'C:\\Program Files\\Microsoft VS Code\\Code.exe',
            // Optionally specify a workspace to open
            // workspacePath: path.join(__dirname, '../../../testWorkspace')
        }
    }],
    logLevel: 'info',
    bail: 0,
    baseUrl: '',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    services: [
        ['vscode', {
            // Force a specific chromedriver version to avoid 404 errors
            chromeDriverVersion: '114.0.5735.90'
        }]
    ],
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    }
};
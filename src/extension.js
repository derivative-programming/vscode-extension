"use strict";
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const extensionContext_1 = require("./utils/extensionContext");
const fileUtils_1 = require("./utils/fileUtils");
const jsonTreeDataProvider_1 = require("./providers/jsonTreeDataProvider");
const registerCommands_1 = require("./commands/registerCommands");
/**
 * Activates the extension
 * @param context The extension context
 */
function activate(context) {
    console.log('Congratulations, your extension "AppDNA" is now active!');
    // Set the extension context for use throughout the extension
    (0, extensionContext_1.setExtensionContext)(context);
    // Get the workspace folder and app-dna.json file path
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const appDNAFilePath = workspaceFolder ? path.join(workspaceFolder, 'app-dna.json') : null;
    // Set initial context based on file existence
    (0, fileUtils_1.updateFileExistsContext)(appDNAFilePath);
    // Load the objectDetailsView module safely
    try {
        console.log('objectDetailsView loaded successfully');
    }
    catch (err) {
        console.error('Failed to load objectDetailsView module:', err);
        // Create a fallback implementation in case of error
    }
    // Create the tree data provider and tree view
    const jsonTreeDataProvider = new jsonTreeDataProvider_1.JsonTreeDataProvider(appDNAFilePath);
    const treeView = vscode.window.createTreeView('appdna', { treeDataProvider: jsonTreeDataProvider });
    context.subscriptions.push(treeView);
    // Set up file system watcher for the app-dna.json file
    if (workspaceFolder) {
        const fileWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspaceFolder, 'app-dna.json'));
        // Watch for file creation
        fileWatcher.onDidCreate(() => {
            console.log('app-dna.json file was created');
            (0, fileUtils_1.updateFileExistsContext)(appDNAFilePath);
            jsonTreeDataProvider.refresh();
        });
        // Watch for file deletion
        fileWatcher.onDidDelete(() => {
            console.log('app-dna.json file was deleted');
            (0, fileUtils_1.updateFileExistsContext)(appDNAFilePath);
            jsonTreeDataProvider.refresh();
        });
        // Watch for file changes
        fileWatcher.onDidChange(() => {
            console.log('app-dna.json file was changed');
            jsonTreeDataProvider.refresh();
        });
        // Make sure to dispose of the watcher when the extension is deactivated
        context.subscriptions.push(fileWatcher);
    }
    // Register all commands
    (0, registerCommands_1.registerCommands)(context, jsonTreeDataProvider, appDNAFilePath);
}
/**
 * Called when the extension is deactivated
 */
function deactivate() {
    console.log('Extension deactivated.');
}
//# sourceMappingURL=extension.js.map
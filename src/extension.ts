import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { setExtensionContext } from './utils/extensionContext';
import { updateFileExistsContext } from './utils/fileUtils';
import { JsonTreeDataProvider } from './providers/jsonTreeDataProvider';
import { registerCommands } from './commands/registerCommands';
import * as objectDetailsView from './webviews/objectDetailsView';
import { ModelService } from './services/modelService';

/**
 * Activates the extension
 * @param context The extension context
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "AppDNA" is now active!');
    
    // Set the extension context for use throughout the extension
    setExtensionContext(context);

    // Get the workspace folder and app-dna.json file path
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const appDNAFilePath = workspaceFolder ? path.join(workspaceFolder, 'app-dna.json') : null;
    
    // Set initial context based on file existence
    updateFileExistsContext(appDNAFilePath);
    
    // Load the objectDetailsView module safely
    try {
        console.log('objectDetailsView loaded successfully');
    } catch (err) {
        console.error('Failed to load objectDetailsView module:', err);
        // Create a fallback implementation in case of error
    }

    // Initialize ModelService
    const modelService = ModelService.getInstance();
    // Load model if app-dna.json exists
    if (appDNAFilePath && fs.existsSync(appDNAFilePath)) {
        modelService.loadFile(appDNAFilePath).catch(err => {
            console.error("Failed to load model:", err);
        });
    }

    // Create the tree data provider (now with ModelService) and tree view
    const jsonTreeDataProvider = new JsonTreeDataProvider(appDNAFilePath, modelService);
    const treeView = vscode.window.createTreeView('appdna', { treeDataProvider: jsonTreeDataProvider });
    
    context.subscriptions.push(treeView);

    // Set up file system watcher for the app-dna.json file
    if (workspaceFolder) {
        const fileWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(workspaceFolder, 'app-dna.json')
        );
        
        // Watch for file creation
        fileWatcher.onDidCreate(() => {
            console.log('app-dna.json file was created');
            updateFileExistsContext(appDNAFilePath);
            // Load the model when file is created
            if (appDNAFilePath) {
                modelService.loadFile(appDNAFilePath).catch(err => {
                    console.error("Failed to load model:", err);
                });
            }
            jsonTreeDataProvider.refresh();
        });
        
        // Watch for file deletion
        fileWatcher.onDidDelete(() => {
            console.log('app-dna.json file was deleted');
            updateFileExistsContext(appDNAFilePath);
            // Clear the model cache when file is deleted
            modelService.clearCache();
            jsonTreeDataProvider.refresh();
        });
        
        // Watch for file changes
        fileWatcher.onDidChange(() => {
            console.log('app-dna.json file was changed');
            // Reload the model when file changes
            if (appDNAFilePath) {
                modelService.loadFile(appDNAFilePath).catch(err => {
                    console.error("Failed to load model:", err);
                });
            }
            jsonTreeDataProvider.refresh();
        });
        
        // Make sure to dispose of the watcher when the extension is deactivated
        context.subscriptions.push(fileWatcher);
    }

    // Register all commands
    registerCommands(context, jsonTreeDataProvider, appDNAFilePath, modelService);
}

/**
 * Called when the extension is deactivated
 */
export function deactivate() {
    console.log('Extension deactivated.');
    // Clear model service cache on deactivation
    ModelService.getInstance().clearCache();
}

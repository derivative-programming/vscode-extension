// SEARCH_TAG: extension entry point for VS Code extension
// This is the main entry for the extension.

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { setExtensionContext } from './utils/extensionContext';
import { updateFileExistsContext, updateConfigExistsContext } from './utils/fileUtils';
import { JsonTreeDataProvider } from './providers/jsonTreeDataProvider';
import { registerCommands } from './commands/registerCommands';
import * as objectDetailsView from './webviews/objectDetailsView';
import { ModelService } from './services/modelService';
import { AuthService } from './services/authService';
import { showWelcomeView } from './webviews/welcomeView';
import { showLexiconView } from './webviews/lexiconView';
import { initializeStdioServer } from './mcp/stdioBridge';
import { AppDNAMcpProvider } from './mcp/mcpProvider';

// Track whether welcome view has been shown in this session
let hasShownWelcomeView = false;

/**
 * Activates the extension
 * @param context The extension context
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "AppDNA" is now active!');
    
    // Check if this is a stdio MCP server request and initialize if needed
    initializeStdioServer();
    
    // Set the extension context for use throughout the extension
    setExtensionContext(context);

    // Initialize the authentication service
    const authService = AuthService.getInstance();
    authService.initialize(context);

    // TODO: Register the official MCP server definition provider when API is available
    // The vscode.lm.registerMcpServerDefinitionProvider API is not yet available in VS Code 1.99.0
    // Uncomment when upgrading to a newer VS Code version that supports MCP registration
    /*
    try {
        const mcpProvider = new AppDNAMcpProvider();
        const mcpRegistration = vscode.lm.registerMcpServerDefinitionProvider('appDNAMcpProvider', mcpProvider);
        context.subscriptions.push(mcpRegistration);
        context.subscriptions.push(mcpProvider);
        console.log('MCP server definition provider registered successfully');
    } catch (error) {
        console.error('Failed to register MCP server definition provider:', error);
        // Continue without MCP support if registration fails
    }
    */

    // Get the workspace folder and model file path from config
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const modelFileName = workspaceFolder ? require('./utils/fileUtils').getModelFileNameFromConfig(workspaceFolder) : "app-dna.json";
    const appDNAFilePath = workspaceFolder ? path.join(workspaceFolder, modelFileName) : null;
    
    // Set initial context based on file existence
    const fileExists = appDNAFilePath && fs.existsSync(appDNAFilePath);
    updateFileExistsContext(appDNAFilePath);
    updateConfigExistsContext(workspaceFolder);
    
    // Load the objectDetailsView module safely
    try {
        console.log('objectDetailsView loaded successfully');
    } catch (err) {
        console.error('Failed to load objectDetailsView module:', err);
        // Create a fallback implementation in case of error
    }

    // Add a flag to track if a save is in progress
    let isSaving = false;

    // Patch ModelService.saveToFile to set/reset the flag
    const modelService = ModelService.getInstance();
    const originalSaveToFile = modelService.saveToFile.bind(modelService);
    modelService.saveToFile = async function(...args) {
        isSaving = true;
        try {
            const result = await originalSaveToFile(...args);
            return result;
        } finally {
            // Use a short timeout to ensure the file watcher sees the change
            setTimeout(() => { isSaving = false; }, 500);
        }
    };

    // Load model if model file exists
    if (appDNAFilePath && fs.existsSync(appDNAFilePath)) {
        modelService.loadFile(appDNAFilePath).then(() => {
            // Check if we should auto-expand nodes on load
            if (workspaceFolder) {
                const { getExpandNodesOnLoadFromConfig } = require('./utils/fileUtils');
                const shouldExpand = getExpandNodesOnLoadFromConfig(workspaceFolder);
                if (shouldExpand) {
                    // Small delay to ensure tree view is ready, then execute expand command
                    setTimeout(() => {
                        vscode.commands.executeCommand('appdna.expandAllTopLevel');
                    }, 100);
                }
            }
        }).catch(err => {
            console.error("Failed to load model:", err);
        });
    }    // Create the tree data provider (now with ModelService) and tree view
    const jsonTreeDataProvider = new JsonTreeDataProvider(appDNAFilePath, modelService);
    const treeView = vscode.window.createTreeView('appdna', { treeDataProvider: jsonTreeDataProvider });
    
    // Set the tree view in the tree data provider to enable title updates
    jsonTreeDataProvider.setTreeView(treeView);
    
    context.subscriptions.push(treeView);

    // Set up file system watcher for the model file
    if (workspaceFolder) {
        const fileWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(workspaceFolder, modelFileName)
        );
        
        // Watch for file creation
        fileWatcher.onDidCreate(() => {
            console.log(modelFileName + ' file was created');
            updateFileExistsContext(appDNAFilePath);
            vscode.commands.executeCommand("appdna.refreshView");
        });
        
        // Watch for file deletion
        fileWatcher.onDidDelete(() => {
            console.log(modelFileName + ' file was deleted');
            updateFileExistsContext(appDNAFilePath);
            vscode.commands.executeCommand("appdna.refreshView");
        });
        
        // Watch for file changes
        fileWatcher.onDidChange(() => {
            if (isSaving) {
                console.log("[DEBUG] Ignoring file change event triggered by our own save.");
                return;
            }
            console.log(modelFileName + ' file was changed');
            vscode.commands.executeCommand("appdna.refreshView");
        });
        
        // Make sure to dispose of the watcher when the extension is deactivated
        context.subscriptions.push(fileWatcher);
        
        // Set up file system watcher for the config file
        const configFileWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(workspaceFolder, 'app-dna.config.json')
        );
        
        // Watch for config file creation
        configFileWatcher.onDidCreate(() => {
            console.log('app-dna.config.json file was created');
            vscode.commands.executeCommand("appdna.reloadConfig");
        });
        
        // Watch for config file deletion
        configFileWatcher.onDidDelete(() => {
            console.log('app-dna.config.json file was deleted');
            vscode.commands.executeCommand("appdna.reloadConfig");
        });
        
        // Watch for config file changes
        configFileWatcher.onDidChange(() => {
            console.log('app-dna.config.json file was changed');
            vscode.commands.executeCommand("appdna.reloadConfig");
        });
        
        // Make sure to dispose of the config watcher when the extension is deactivated
        context.subscriptions.push(configFileWatcher);
    }

    // Register all commands
    registerCommands(context, jsonTreeDataProvider, appDNAFilePath, modelService);

    // Show welcome view if the AppDNA file doesn't exist and welcome view hasn't been shown yet
    if (!fileExists && !hasShownWelcomeView) {
        hasShownWelcomeView = true;
        
        // Small delay to allow VS Code to initialize properly before showing welcome view
        setTimeout(() => {
            showWelcomeView(context);
        }, 1000);
    }

    // Add command to show AppDNA panel when extension is activated
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.focus', () => {
            // If no file exists, show welcome view
            if (!fileExists && !hasShownWelcomeView) {
                hasShownWelcomeView = true;
                showWelcomeView(context);
            } else {
                treeView.reveal(undefined, { focus: true, expand: true });
            }
        })
    );
}

/**
 * Called when the extension is deactivated
 */
export function deactivate() {
    console.log('Extension deactivated.');
    // Reset welcome view shown flag
    hasShownWelcomeView = false;
    
    // Clear model service cache on deactivation
    ModelService.getInstance().clearCache();
}

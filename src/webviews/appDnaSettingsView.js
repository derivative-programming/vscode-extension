// AppDNA Settings view component for editing app-dna.config.json
// Created: June 29, 2025

"use strict";
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");

/**
 * Shows the AppDNA settings view for editing config file properties
 * @param {vscode.ExtensionContext} context The extension context
 */
function showAppDNASettingsView(context) {
    // Check if the panel is already open
    if (AppDNASettingsPanel.currentPanel) {
        AppDNASettingsPanel.currentPanel.reveal();
        return;
    }

    // Create and show the settings panel
    const panel = new AppDNASettingsPanel(context.extensionUri);
}

/**
 * Manages the AppDNA settings view panel
 */
class AppDNASettingsPanel {
    static currentPanel = undefined;
    static viewType = "appDnaSettings";
    
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
        this.panel = vscode.window.createWebviewPanel(
            AppDNASettingsPanel.viewType,
            "AppDNA Settings",
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );

        // Set the HTML content
        this.panel.webview.html = this._getWebviewContent();

        // Set up message handling
        this.panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case "loadConfig":
                        this._loadConfig();
                        break;
                    case "saveConfig":
                        this._saveConfig(message.config);
                        break;
                }
            },
            undefined,
            []
        );

        // Clean up resources when panel is disposed
        this.panel.onDidDispose(
            () => {
                AppDNASettingsPanel.currentPanel = undefined;
            },
            null,
            []
        );

        // Set the current panel
        AppDNASettingsPanel.currentPanel = this;
        
        // Load initial config
        this._loadConfig();
    }
    
    /**
     * Reveals the settings panel
     */
    reveal() {
        this.panel.reveal();
    }
    
    /**
     * Reloads the configuration data in the settings panel
     */
    reload() {
        this._loadConfig();
    }

    /**
     * Loads the current config file and sends it to the webview
     * Creates a default config file if it doesn't exist or is incomplete
     */
    _loadConfig() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found.');
            return;
        }

        const configPath = path.join(workspaceFolder, 'app-dna.config.json');
        
        try {
            let config;
            let needsUpdate = false;
            
            if (fs.existsSync(configPath)) {
                const configRaw = fs.readFileSync(configPath, 'utf8');
                config = JSON.parse(configRaw);
                
                // Check if config has the complete structure
                if (!config.version || !config.settings || !config.settings.codeGeneration || !config.settings.editor) {
                    console.log('Incomplete config detected, updating to full structure');
                    needsUpdate = true;
                }
            } else {
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                // Create or update to full config structure
                const defaultConfig = this._createDefaultConfig(workspaceFolder);
                
                // Preserve existing values if they exist
                if (config) {
                    defaultConfig.modelFile = config.modelFile || defaultConfig.modelFile;
                    if (config.settings) {
                        if (config.settings.codeGeneration) {
                            defaultConfig.settings.codeGeneration.outputPath = config.settings.codeGeneration.outputPath || defaultConfig.settings.codeGeneration.outputPath;
                        }
                        if (config.settings.editor) {
                            defaultConfig.settings.editor.showAdvancedProperties = config.settings.editor.showAdvancedProperties ?? defaultConfig.settings.editor.showAdvancedProperties;
                            defaultConfig.settings.editor.expandNodesOnLoad = config.settings.editor.expandNodesOnLoad || defaultConfig.settings.editor.expandNodesOnLoad;
                        }
                    }
                }
                
                config = defaultConfig;
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
                console.log('Created/updated AppDNA config file at:', configPath);
                
                // Update the context to show that config now exists
                vscode.commands.executeCommand('setContext', 'appDnaConfigExists', true);
            }
            
            this.panel.webview.postMessage({
                command: "configLoaded",
                config: config
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load config: ${error.message}`);
        }
    }

    /**
     * Creates a default configuration object
     * @param {string} workspaceFolder The workspace folder path
     * @returns {object} Default configuration object
     */
    _createDefaultConfig(workspaceFolder) {
        // Try to find an existing model file
        let modelFileName = 'app-dna.json';
        const possibleModelFiles = ['app-dna.json', 'app-dna.new.json'];
        
        for (const fileName of possibleModelFiles) {
            const modelPath = path.join(workspaceFolder, fileName);
            if (fs.existsSync(modelPath)) {
                modelFileName = fileName;
                break;
            }
        }
        
        return {
            version: "1.0.0",
            modelFile: modelFileName,
            settings: { 
                codeGeneration: {
                    outputPath: "./fabrication_results"
                },
                editor: {
                    showAdvancedProperties: true,
                    expandNodesOnLoad: false
                }
            }
        };
    }

    /**
     * Saves the config file with new settings
     */
    _saveConfig(config) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found.');
            return;
        }

        const configPath = path.join(workspaceFolder, 'app-dna.config.json');
        
        try {
            // Validate the config structure
            if (!config.version || !config.modelFile || !config.settings) {
                throw new Error('Invalid config structure');
            }

            // Write the updated config
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
            
            vscode.window.showInformationMessage('AppDNA settings saved successfully.');
            
            this.panel.webview.postMessage({
                command: "configSaved"
            });
            
            // Refresh the tree view to apply the new settings
            vscode.commands.executeCommand('appdna.refreshView');
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save config: ${error.message}`);
        }
    }

    /**
     * Generates the HTML content for the settings view
     * @returns {string} HTML content
     */
    _getWebviewContent() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AppDNA Settings</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
        }
        h1 {
            color: var(--vscode-editor-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        .setting-group {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .setting-group h2 {
            margin-top: 0;
            color: var(--vscode-editor-foreground);
            font-size: 16px;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 8px;
        }
        .setting-item {
            margin-bottom: 15px;
        }
        .setting-item:last-child {
            margin-bottom: 0;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: var(--vscode-editor-foreground);
        }
        input[type="text"], input[type="checkbox"] {
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            padding: 6px 8px;
            border-radius: 2px;
        }
        input[type="text"] {
            width: 100%;
            box-sizing: border-box;
        }
        input[type="checkbox"] {
            margin-right: 8px;
        }
        .checkbox-container {
            display: flex;
            align-items: center;
        }
        .button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 13px;
            margin-right: 10px;
        }
        .button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        .button-container {
            margin-top: 30px;
            text-align: right;
        }
        .description {
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
            margin-top: 5px;
        }
        .readonly-note {
            font-style: italic;
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>AppDNA Settings</h1>
        
        <div class="setting-group">
            <h2>Model Fabrication</h2>
            <div class="setting-item">
                <label for="outputPath">Output Folder</label>
                <input type="text" id="outputPath" placeholder="./fabrication_results">
                <div class="description">The folder where generated files (code, documentation, etc.) will be saved, relative to the workspace root.</div>
            </div>
        </div>

        <div class="setting-group">
            <h2>Editor Settings</h2>
            <div class="setting-item">
                <div class="checkbox-container">
                    <input type="checkbox" id="showAdvancedProperties">
                    <label for="showAdvancedProperties">Show Advanced Properties</label>
                </div>
                <div class="description">When enabled, shows advanced tree view items like Lexicon, User Stories, MCP Servers, and Reports.</div>
            </div>
            <div class="setting-item">
                <div class="checkbox-container">
                    <input type="checkbox" id="expandNodesOnLoad">
                    <label for="expandNodesOnLoad">Expand Nodes on Load</label>
                </div>
                <div class="description">When enabled, automatically expands all tree view nodes when a model is loaded.</div>
            </div>
        </div>

        <div class="button-container">
            <button id="saveButton" class="button">Save Settings</button>
        </div>
    </div>

    <script>
        (function() {
            const vscode = acquireVsCodeApi();
            
            let currentConfig = null;
            
            // DOM elements
            const outputPathInput = document.getElementById('outputPath');
            const showAdvancedPropertiesInput = document.getElementById('showAdvancedProperties');
            const expandNodesOnLoadInput = document.getElementById('expandNodesOnLoad');
            const saveButton = document.getElementById('saveButton');
            
            // Request initial config load
            vscode.postMessage({ command: 'loadConfig' });
            
            // Handle messages from the extension
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'configLoaded':
                        currentConfig = message.config;
                        loadConfigIntoForm(currentConfig);
                        break;
                    case 'configSaved':
                        // Optionally close the panel or show success message
                        break;
                }
            });
            
            // Load config data into form
            function loadConfigIntoForm(config) {
                // Set default values if settings don't exist
                outputPathInput.value = config.settings?.codeGeneration?.outputPath || './fabrication_results';
                showAdvancedPropertiesInput.checked = config.settings?.editor?.showAdvancedProperties ?? true;
                expandNodesOnLoadInput.checked = config.settings?.editor?.expandNodesOnLoad || false;
            }
            
            // Save button click handler
            saveButton.addEventListener('click', () => {
                if (!currentConfig) {
                    return;
                }
                
                // Update config with form values (excluding modelFile)
                const updatedConfig = {
                    ...currentConfig,
                    settings: {
                        ...(currentConfig.settings || {}),
                        codeGeneration: {
                            ...(currentConfig.settings?.codeGeneration || {}),
                            outputPath: outputPathInput.value || './fabrication_results'
                        },
                        editor: {
                            ...(currentConfig.settings?.editor || {}),
                            showAdvancedProperties: showAdvancedPropertiesInput.checked,
                            expandNodesOnLoad: expandNodesOnLoadInput.checked
                        }
                    }
                };
                
                vscode.postMessage({
                    command: 'saveConfig',
                    config: updatedConfig
                });
            });
        })();
    </script>
</body>
</html>`;
    }
}

/**
 * Reloads the AppDNA settings panel if it's currently open
 */
function reloadAppDNASettingsPanel() {
    if (AppDNASettingsPanel.currentPanel) {
        AppDNASettingsPanel.currentPanel.reload();
    }
}

module.exports = {
    showAppDNASettingsView,
    AppDNASettingsPanel,
    reloadAppDNASettingsPanel
};

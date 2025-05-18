// Description: Handles registration of model feature catalog related commands.
// Created: October 12, 2023

import * as vscode from 'vscode';
import { ModelService } from '../services/modelService';
import { AuthService } from '../services/authService';
import { ModelFeatureModel } from '../data/models/modelFeatureModel';
import { handleApiError } from '../utils/apiErrorHandler';

// Track active panels to avoid duplicates
const activePanels = new Map<string, vscode.WebviewPanel>();

// Track panel reference for the feature catalog view
const featureCatalogPanel = {
    panel: null as vscode.WebviewPanel | null,
    context: null as vscode.ExtensionContext | null,
    modelService: null as ModelService | null
};

/**
 * Gets the reference to the model feature catalog panel if it's open
 * @returns The model feature catalog panel info or null if not open
 */
export function getModelFeatureCatalogPanel(): { 
    type: string; 
    context: vscode.ExtensionContext; 
    modelService: ModelService 
} | null {
    if (activePanels.has('modelFeatureCatalog') && featureCatalogPanel.context && featureCatalogPanel.modelService) {
        return {
            type: 'modelFeatureCatalog',
            context: featureCatalogPanel.context,
            modelService: featureCatalogPanel.modelService
        };
    }
    return null;
}

/**
 * Closes the model feature catalog panel if it's open
 */
export function closeModelFeatureCatalogPanel(): void {
    console.log(`Closing model feature catalog panel if open`);
    const panel = activePanels.get('modelFeatureCatalog');
    if (panel) {
        panel.dispose();
        activePanels.delete('modelFeatureCatalog');
    }
    // Clean up panel reference
    featureCatalogPanel.panel = null;
}

export function registerModelFeatureCatalogCommands(
    context: vscode.ExtensionContext,
    appDNAFilePath: string | null,
    modelService: ModelService
): void {    // Register model feature catalog command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.modelFeatureCatalog', async () => {
            // Store references to context and modelService
            featureCatalogPanel.context = context;
            featureCatalogPanel.modelService = modelService;
            
            // Create a consistent panel ID
            const panelId = 'modelFeatureCatalog';
            console.log(`modelFeatureCatalog command called (panelId: ${panelId})`);
            
            // Check if panel already exists
            if (activePanels.has(panelId)) {
                console.log(`Panel already exists for model feature catalog, revealing existing panel`);
                // Panel exists, reveal it instead of creating a new one
                activePanels.get(panelId)?.reveal(vscode.ViewColumn.One);
                return;
            }
            
            // Create new panel if one doesn't exist
            const panel = vscode.window.createWebviewPanel(
                'modelFeatureCatalog',
                'Model Feature Catalog',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                }
            );
            
            // Track this panel
            console.log(`Adding new panel to activePanels with id: ${panelId}`);
            activePanels.set(panelId, panel);
            featureCatalogPanel.panel = panel;
            
            // Remove from tracking when disposed
            panel.onDidDispose(() => {
                console.log(`Panel disposed, removing from tracking: ${panelId}`);
                activePanels.delete(panelId);
                featureCatalogPanel.panel = null;
            });
            const scriptUri = panel.webview.asWebviewUri(
                vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'modelFeatureCatalogView.js')
            );
            panel.webview.html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-eval' 'unsafe-inline' ${panel.webview.cspSource}; style-src 'unsafe-inline' ${panel.webview.cspSource};">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Model Feature Catalog</title>                    <style>                        body { font-family: var(--vscode-font-family); margin: 0; padding: 10px; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
                        .validation-header {
                            padding: 10px 0;
                            border-bottom: 1px solid var(--vscode-panel-border);
                            margin-bottom: 15px;
                        }
                        .validation-header h2 {
                            margin: 0;
                            font-size: 1.3em;
                            font-weight: normal;
                            color: var(--vscode-editor-foreground);
                        }                        table { border-collapse: collapse; width: 100%; margin-top: 1em; }
                        th, td { border: 1px solid var(--vscode-editorWidget-border); padding: 8px 12px; text-align: left; }
                        th { background: var(--vscode-sideBar-background); cursor: pointer; font-weight: bold; }
                        tr:nth-child(even) { background: var(--vscode-sideBarSectionHeader-background); }
                        tr:hover { background-color: var(--vscode-list-hoverBackground); }
                        tbody tr { cursor: pointer; }
                        #paging { margin: 1em 0; padding: 10px 0; text-align: center; }
                        button { 
                            margin: 0 4px; 
                            background-color: var(--vscode-button-background);
                            color: var(--vscode-button-foreground);
                            border: none;
                            padding: 4px 8px;
                            cursor: pointer;
                            border-radius: 2px;
                        }
                        button:disabled {
                            opacity: 0.6;
                            cursor: not-allowed;
                        }
                        button:hover:not(:disabled) {
                            background-color: var(--vscode-button-hoverBackground);
                        }
                        .checkbox-container { text-align: center; }
                        input[type="checkbox"] { cursor: pointer; }
                        input[type="checkbox"]:disabled { cursor: not-allowed; opacity: 0.6; }
                        select {
                            padding: 4px;
                            background-color: var(--vscode-dropdown-background);
                            color: var(--vscode-dropdown-foreground);
                            border: 1px solid var(--vscode-dropdown-border);
                            border-radius: 2px;
                        }
                        .spinner {
                            border: 4px solid rgba(0, 0, 0, 0.1);
                            width: 36px;
                            height: 36px;
                            border-radius: 50%;
                            border-left-color: var(--vscode-progressBar-background);
                            animation: spin 1s linear infinite;
                            position: fixed;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            z-index: 1000;
                        }
                        .spinner-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background-color: rgba(0, 0, 0, 0.2);
                            z-index: 999;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }                        .refresh-button {
                            background-color: var(--vscode-button-background);
                            color: var(--vscode-button-foreground);
                            border: none;
                            padding: 4px 8px;
                            cursor: pointer;
                            border-radius: 3px;
                            display: flex;
                            align-items: center;
                        }
                        .refresh-button:hover {
                            background-color: var(--vscode-button-hoverBackground);
                        }
                        .header-actions {
                            display: flex;
                            justify-content: flex-end;
                            margin-bottom: 10px;
                        }
                    </style>
                </head>                <body>
                    <div class="validation-header">
                        <h2>Model Feature Catalog</h2>
                    </div>
                    <div class="header-actions">
                        <button id="refreshButton" class="refresh-button" title="Refresh Table">
                            Refresh
                        </button>
                    </div>
                    <div id="paging"></div>
                    <table id="featureCatalogTable"></table>
                    <div id="spinner-overlay" class="spinner-overlay" style="display: none;">
                        <div class="spinner"></div>
                    </div>
                    <script src="${scriptUri}"></script>
                </body>
                </html>
            `;
              // Handler for messages from the webview
            async function fetchAndSend(pageNumber: number, itemCountPerPage: number, orderByColumnName: string, orderByDescending: boolean) {
                const authService = require('../services/authService').AuthService.getInstance();
                const apiKey = await authService.getApiKey();
                if (!apiKey) {
                    panel.webview.postMessage({ command: 'setFeatureData', data: { items: [], pageNumber: 1, itemCountPerPage: 100, recordsTotal: 0 } });
                    vscode.window.showErrorMessage('You must be logged in to use Model Feature Catalog.');
                    return;
                }
                
                const params = [
                    'PageNumber=' + encodeURIComponent(pageNumber || 1),
                    'ItemCountPerPage=' + encodeURIComponent(itemCountPerPage || 100),
                    'OrderByDescending=' + encodeURIComponent(orderByDescending ? 'true' : 'false')
                ];
                if (orderByColumnName) {
                    params.push('OrderByColumnName=' + encodeURIComponent(orderByColumnName));
                }
                const url = 'https://modelservicesapi.derivative-programming.com/api/v1_0/model-features?' + params.join('&');
                // Log the API call details
                console.log("[DEBUG] Model Feature Catalog API called. URL:", url, "Options:", { headers: { 'Api-Key': '[REDACTED]' } });                try {
                    const res = await fetch(url, {
                        headers: { 'Api-Key': apiKey }
                    });
                    
                    // Check for unauthorized errors
                    if (await handleApiError(context, res, 'Failed to fetch model features')) {
                        // If true, the error was handled (was a 401)
                        panel.webview.postMessage({ 
                            command: 'setFeatureData', 
                            data: { items: [], pageNumber: 1, itemCountPerPage: 100, recordsTotal: 0 } 
                        });
                        return;
                    }
                    
                    const data = await res.json();
                    panel.webview.postMessage({ command: 'setFeatureData', data });
                } catch (err) {
                    panel.webview.postMessage({ command: 'setFeatureData', data: { items: [], pageNumber: 1, itemCountPerPage: 100, recordsTotal: 0 } });
                    vscode.window.showErrorMessage('Failed to fetch model features: ' + (err && err.message ? err.message : err));
                }
            }
            
            panel.webview.onDidReceiveMessage(async (msg) => {
                console.log("[Extension] Received message from webview:", msg.command);
                if (msg.command === 'ModelFeatureCatalogWebviewReady') {
                    console.log("[Extension] Handling ModelFeatureCatalogWebviewReady");
                    await fetchAndSend(1, 100, 'displayName', false);
                } else if (msg.command === 'ModelFeatureCatalogRequestPage') {
                    console.log("[Extension] Handling ModelFeatureCatalogRequestPage:", msg.pageNumber, msg.itemCountPerPage, msg.orderByColumnName, msg.orderByDescending);
                    await fetchAndSend(msg.pageNumber, msg.itemCountPerPage, msg.orderByColumnName, msg.orderByDescending);
                } else if (msg.command === 'ModelFeatureCatalogGetSelectedFeatures') {
                    // Provide the current selected feature information to the webview
                    if (modelService && modelService.isFileLoaded()) {
                        const rootModel = modelService.getCurrentModel();
                        
                        // Collect all model features from all namespaces
                        const selectedFeatures: Array<{name: string, isCompleted?: string}> = [];
                        
                        if (rootModel && rootModel.namespace) {
                            for (const namespace of rootModel.namespace) {
                                if (namespace.modelFeature && Array.isArray(namespace.modelFeature)) {
                                    namespace.modelFeature.forEach(feature => {
                                        if (feature.name) {
                                            selectedFeatures.push({
                                                name: feature.name,
                                                isCompleted: feature.isCompleted
                                            });
                                        }
                                    });
                                }
                            }
                        }
                        
                        panel.webview.postMessage({
                            command: 'ModelFeatureCatalogSetSelectedFeatures',
                            selectedFeatures
                        });
                    } else {
                        panel.webview.postMessage({
                            command: 'ModelFeatureCatalogSetSelectedFeatures',
                            selectedFeatures: []
                        });
                    }
                } else if (msg.command === 'ModelFeatureCatalogToggleFeature') {
                    console.log("[Extension] Handling ModelFeatureCatalogToggleFeature:", msg.featureName, msg.selected);
                    
                    // Verify we have a loaded model
                    if (!modelService || !modelService.isFileLoaded()) {
                        vscode.window.showErrorMessage('No model file is loaded. Please load a model file first.');
                        return;
                    }
                    
                    const rootModel = modelService.getCurrentModel();
                    if (!rootModel) {
                        vscode.window.showErrorMessage('Failed to get current model.');
                        return;
                    }
                    
                    try {
                        // If selected is true, add the feature to the model
                        if (msg.selected) {
                            // Find or create a namespace to put the feature in
                            if (!rootModel.namespace || !Array.isArray(rootModel.namespace) || rootModel.namespace.length === 0) {
                                // Create a new namespace if none exists
                                rootModel.namespace = [{
                                    name: "Default",
                                    modelFeature: []
                                }];
                            }
                            
                            // Use the first namespace
                            const namespace = rootModel.namespace[0];
                            
                            // Ensure namespace has a modelFeature array
                            if (!namespace.modelFeature) {
                                namespace.modelFeature = [];
                            }
                            
                            // Check if this feature already exists
                            const existingFeatureIndex = namespace.modelFeature.findIndex(f => f.name === msg.featureName);
                            
                            if (existingFeatureIndex === -1) {                                // Feature doesn't exist, add it
                                const newFeature = new ModelFeatureModel({
                                    name: msg.featureName,
                                    description: msg.description || "",
                                    version: msg.version || ""
                                    // Don't add isCompleted property, let AI processing add it
                                });
                                
                                namespace.modelFeature.push(newFeature);
                                console.log(`[Extension] Added feature ${msg.featureName} to namespace ${namespace.name}`);
                            } else {
                                // Feature exists but might have been marked as completed, no action needed
                                console.log(`[Extension] Feature ${msg.featureName} already exists in namespace ${namespace.name}`);
                            }
                        } else {
                            // If selected is false, remove the feature from the model if it's not completed
                            if (rootModel.namespace && Array.isArray(rootModel.namespace)) {
                                for (const namespace of rootModel.namespace) {
                                    if (namespace.modelFeature && Array.isArray(namespace.modelFeature)) {
                                        const featureIndex = namespace.modelFeature.findIndex(f => f.name === msg.featureName);
                                        
                                        if (featureIndex !== -1) {
                                            // Check if feature is marked as completed
                                            if (namespace.modelFeature[featureIndex].isCompleted === "true") {
                                                vscode.window.showWarningMessage(`Cannot remove feature ${msg.featureName} because it is marked as completed.`);
                                                
                                                // Send refresh to update the UI
                                                panel.webview.postMessage({
                                                    command: 'ModelFeatureCatalogFeatureUpdateFailed',
                                                    featureName: msg.featureName,
                                                    reason: 'completed'
                                                });
                                            } else {
                                                // Remove the feature
                                                namespace.modelFeature.splice(featureIndex, 1);
                                                console.log(`[Extension] Removed feature ${msg.featureName} from namespace ${namespace.name}`);
                                            }
                                        }
                                    }
                                }
                            }
                        }                        // Don't save the model yet, just keep changes in memory
                        // Since we're modifying the object returned by getCurrentModel() directly,
                        // the changes are already in memory in the ModelService
                        console.log("[Extension] Model updated in memory after feature toggle");
                        
                        // Notify the webview of success
                        panel.webview.postMessage({
                            command: 'ModelFeatureCatalogFeatureUpdateSuccess',
                            featureName: msg.featureName,
                            selected: msg.selected
                        });
                    } catch (error) {
                        console.error("[Extension] Error updating model feature:", error);
                        vscode.window.showErrorMessage(`Failed to update model feature: ${error instanceof Error ? error.message : String(error)}`);
                        
                        // Notify the webview of failure
                        panel.webview.postMessage({
                            command: 'ModelFeatureCatalogFeatureUpdateFailed',
                            featureName: msg.featureName,
                            reason: 'error'
                        });
                    }
                }
            });
        })
    );
}

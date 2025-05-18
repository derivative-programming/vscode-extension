// Description: Handles registration of fabrication blueprint catalog related commands.
// Created: May 11, 2025

import * as vscode from 'vscode';
import { ModelService } from '../services/modelService';
import { AuthService } from '../services/authService';
import { TemplateSetModel } from '../data/models/templateSetModel';

// Track active panels to avoid duplicates
const activePanels = new Map<string, vscode.WebviewPanel>();

// Track panel reference for the fabrication blueprint catalog view
const fabricationBlueprintPanel = {
    panel: null as vscode.WebviewPanel | null,
    context: null as vscode.ExtensionContext | null,
    modelService: null as ModelService | null
};

/**
 * Gets the reference to the fabrication blueprint catalog panel if it's open
 * @returns The fabrication blueprint catalog panel info or null if not open
 */
export function getFabricationBlueprintCatalogPanel(): { 
    type: string; 
    context: vscode.ExtensionContext; 
    modelService: ModelService 
} | null {
    if (activePanels.has('fabricationBlueprintCatalog') && fabricationBlueprintPanel.context && fabricationBlueprintPanel.modelService) {
        return {
            type: 'fabricationBlueprintCatalog',
            context: fabricationBlueprintPanel.context,
            modelService: fabricationBlueprintPanel.modelService
        };
    }
    return null;
}

/**
 * Closes the fabrication blueprint catalog panel if it's open
 */
export function closeFabricationBlueprintCatalogPanel(): void {
    console.log(`Closing fabrication blueprint catalog panel if open`);
    const panel = activePanels.get('fabricationBlueprintCatalog');
    if (panel) {
        panel.dispose();
        activePanels.delete('fabricationBlueprintCatalog');
    }
    // Clean up panel reference
    fabricationBlueprintPanel.panel = null;
}

export function registerFabricationBlueprintCatalogCommands(
    context: vscode.ExtensionContext,
    appDNAFilePath: string | null,
    modelService: ModelService
): void {    // Register fabrication blueprint catalog command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.fabricationBlueprintCatalog', async () => {
            // Store references to context and modelService
            fabricationBlueprintPanel.context = context;
            fabricationBlueprintPanel.modelService = modelService;
            
            // Create a consistent panel ID
            const panelId = 'fabricationBlueprintCatalog';
            console.log(`fabricationBlueprintCatalog command called (panelId: ${panelId})`);
            
            // Check if panel already exists
            if (activePanels.has(panelId)) {
                console.log(`Panel already exists for fabrication blueprint catalog, revealing existing panel`);
                // Panel exists, reveal it instead of creating a new one
                activePanels.get(panelId)?.reveal(vscode.ViewColumn.One);
                return;
            }
            
            // Create new panel if one doesn't exist
            const panel = vscode.window.createWebviewPanel(
                'fabricationBlueprintCatalog',
                'Fabrication Blueprint Catalog',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                }
            );
            
            // Track this panel
            console.log(`Adding new panel to activePanels with id: ${panelId}`);
            activePanels.set(panelId, panel);
            fabricationBlueprintPanel.panel = panel;
            
            // Remove from tracking when disposed
            panel.onDidDispose(() => {
                console.log(`Panel disposed, removing from tracking: ${panelId}`);
                activePanels.delete(panelId);
                fabricationBlueprintPanel.panel = null;
            });
            const scriptUri = panel.webview.asWebviewUri(
                vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'fabricationBlueprintCatalogView.js')
            );
            panel.webview.html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-eval' 'unsafe-inline' ${panel.webview.cspSource}; style-src 'unsafe-inline' ${panel.webview.cspSource};">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Fabrication Blueprint Catalog</title>                    <style>
                        body { font-family: var(--vscode-font-family); margin: 0; padding: 10px; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
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
                        }
                        table { border-collapse: collapse; width: 100%; margin-top: 1em; }
                        th, td { border: 1px solid var(--vscode-editorWidget-border); padding: 8px 12px; text-align: left; }
                        th { background: var(--vscode-sideBar-background); cursor: pointer; font-weight: bold; }
                        tr:nth-child(even) { background: var(--vscode-sideBarSectionHeader-background); }
                        tr:hover { background-color: var(--vscode-list-hoverBackground); }
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
                        }                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        .refresh-button {
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
                    </style>                </head>
                <body>
                    <div class="validation-header">
                        <h2>Fabrication Blueprint Catalog</h2>
                    </div>
                    <p style="margin-top: -5px; margin-bottom: 15px; color: var(--vscode-descriptionForeground);">
                        Select blueprints to define the types of files you want to fabricate. Selected blueprints will be included in your model.
                    </p>
                    <div class="header-actions">
                        <button id="refreshButton" class="refresh-button" title="Refresh Table">
                            Refresh
                        </button>
                    </div>
                    <div id="paging"></div>
                    <table id="blueprintCatalogTable"></table>
                    <div id="spinner-overlay" class="spinner-overlay" style="display: none;">
                        <div class="spinner"></div>
                    </div>
                    <script src="${scriptUri}"></script>
                </body>
                </html>
            `;
            
            // Handler for messages from the webview
            async function fetchAndSend(pageNumber: number, itemCountPerPage: number, orderByColumnName: string, orderByDescending: boolean) {
                const authService = AuthService.getInstance();
                const apiKey = await authService.getApiKey();
                if (!apiKey) {
                    panel.webview.postMessage({ command: 'setTemplateSetData', data: { items: [], pageNumber: 1, itemCountPerPage: 100, recordsTotal: 0 } });
                    vscode.window.showErrorMessage('You must be logged in to use Fabrication Blueprint Catalog.');
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
                const url = 'https://modelservicesapi.derivative-programming.com/api/v1_0/template-sets?' + params.join('&');
                
                // Log the API call details
                console.log("[DEBUG] Template Set Catalog API called. URL:", url, "Options:", { headers: { 'Api-Key': '[REDACTED]' } });
                try {
                    const res = await fetch(url, {
                        headers: { 'Api-Key': apiKey }
                    });
                    const data = await res.json();
                    panel.webview.postMessage({ command: 'setTemplateSetData', data });
                } catch (err) {
                    panel.webview.postMessage({ command: 'setTemplateSetData', data: { items: [], pageNumber: 1, itemCountPerPage: 100, recordsTotal: 0 } });
                    vscode.window.showErrorMessage('Failed to fetch blueprint templates: ' + (err && err.message ? err.message : err));
                }
            }
            
            panel.webview.onDidReceiveMessage(async (msg) => {
                console.log("[Extension] Received message from webview:", msg.command);
                if (msg.command === 'FabricationBlueprintCatalogWebviewReady') {
                    console.log("[Extension] Handling FabricationBlueprintCatalogWebviewReady");
                    await fetchAndSend(1, 100, 'title', false);
                } else if (msg.command === 'FabricationBlueprintCatalogRequestPage') {
                    console.log("[Extension] Handling FabricationBlueprintCatalogRequestPage:", msg.pageNumber, msg.itemCountPerPage, msg.orderByColumnName, msg.orderByDescending);
                    await fetchAndSend(msg.pageNumber, msg.itemCountPerPage, msg.orderByColumnName, msg.orderByDescending);
                } else if (msg.command === 'FabricationBlueprintCatalogGetSelectedTemplates') {
                    // Provide the current selected template information to the webview
                    if (modelService && modelService.isFileLoaded()) {
                        const rootModel = modelService.getCurrentModel();
                        
                        // Collect all template sets
                        const selectedTemplates: Array<{name: string, isDisabled?: string}> = [];
                        
                        if (rootModel && rootModel.templateSet && Array.isArray(rootModel.templateSet)) {
                            rootModel.templateSet.forEach(template => {
                                if (template.name) {
                                    selectedTemplates.push({
                                        name: template.name,
                                        isDisabled: template.isDisabled
                                    });
                                }
                            });
                        }
                        
                        panel.webview.postMessage({
                            command: 'FabricationBlueprintCatalogSetSelectedTemplates',
                            selectedTemplates
                        });
                    } else {
                        panel.webview.postMessage({
                            command: 'FabricationBlueprintCatalogSetSelectedTemplates',
                            selectedTemplates: []
                        });
                    }
                } else if (msg.command === 'FabricationBlueprintCatalogToggleTemplate') {
                    console.log("[Extension] Handling FabricationBlueprintCatalogToggleTemplate:", msg.templateName, msg.selected);
                    
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
                        // If selected is true, add the template to the model
                        if (msg.selected) {
                            // Ensure the root has a templateSet array
                            if (!rootModel.templateSet || !Array.isArray(rootModel.templateSet)) {
                                rootModel.templateSet = [];
                            }
                            
                            // Check if this template already exists
                            const existingTemplateIndex = rootModel.templateSet.findIndex(t => t.name === msg.templateName);
                            
                            if (existingTemplateIndex === -1) {
                                // Template doesn't exist, add it
                                const newTemplate = new TemplateSetModel({
                                    name: msg.templateName,
                                    title: msg.title || "",
                                    version: msg.version || "",
                                    isDisabled: "false"
                                });
                                
                                rootModel.templateSet.push(newTemplate);
                                console.log(`[Extension] Added template ${msg.templateName} to model`);
                            } else {
                                // Template exists but might be disabled
                                if (rootModel.templateSet[existingTemplateIndex].isDisabled === "true") {
                                    rootModel.templateSet[existingTemplateIndex].isDisabled = "false";
                                    console.log(`[Extension] Re-enabled template ${msg.templateName}`);
                                } else {
                                    console.log(`[Extension] Template ${msg.templateName} already exists and is enabled`);
                                }
                            }
                        } else {
                            // If selected is false, remove the template from the model
                            if (rootModel.templateSet && Array.isArray(rootModel.templateSet)) {
                                const templateIndex = rootModel.templateSet.findIndex(t => t.name === msg.templateName);
                                
                                if (templateIndex !== -1) {
                                    // Remove the template
                                    rootModel.templateSet.splice(templateIndex, 1);
                                    console.log(`[Extension] Removed template ${msg.templateName} from model`);
                                }
                            }
                        }
                        
                        // Don't save the model yet, just keep changes in memory
                        // Since we're modifying the object returned by getCurrentModel() directly,
                        // the changes are already in memory in the ModelService
                        console.log("[Extension] Model updated in memory after template toggle");
                        
                        // Notify the webview of success
                        panel.webview.postMessage({
                            command: 'FabricationBlueprintCatalogTemplateUpdateSuccess',
                            templateName: msg.templateName,
                            selected: msg.selected
                        });
                    } catch (error) {
                        console.error("[Extension] Error updating blueprint template:", error);
                        vscode.window.showErrorMessage(`Failed to update blueprint template: ${error instanceof Error ? error.message : String(error)}`);
                        
                        // Notify the webview of failure
                        panel.webview.postMessage({
                            command: 'FabricationBlueprintCatalogTemplateUpdateFailed',
                            templateName: msg.templateName,
                            reason: 'error'
                        });
                    }
                }
            });
        })
    );
}

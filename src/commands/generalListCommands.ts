// Description: Handles registration of general list view related commands.
// Created: January 25, 2025

import * as vscode from 'vscode';
import { ModelService } from '../services/modelService';

// Track active panels to avoid duplicates
const activePanels = new Map<string, vscode.WebviewPanel>();

// Track panel reference for the general list view
const generalListPanel = {
    panel: null as vscode.WebviewPanel | null,
    context: null as vscode.ExtensionContext | null,
    modelService: null as ModelService | null
};

/**
 * Gets the reference to the general list panel if it's open
 * @returns The general list panel info or null if not open
 */
export function getGeneralListPanel(): { 
    type: string; 
    context: vscode.ExtensionContext; 
    modelService: ModelService 
} | null {
    if (activePanels.has('generalList') && generalListPanel.context && generalListPanel.modelService) {
        return {
            type: 'generalList',
            context: generalListPanel.context,
            modelService: generalListPanel.modelService
        };
    }
    return null;
}

/**
 * Closes the general list panel if it's open
 */
export function closeGeneralListPanel(): void {
    console.log(`Closing general list panel if open`);
    const panel = activePanels.get('generalList');
    if (panel) {
        panel.dispose();
        activePanels.delete('generalList');
    }
    // Clean up panel reference
    generalListPanel.panel = null;
}

export function registerGeneralListCommands(
    context: vscode.ExtensionContext,
    appDNAFilePath: string | null,
    modelService: ModelService
): void {
    // Register general list command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.generalList', async () => {
            // Store references to context and modelService
            generalListPanel.context = context;
            generalListPanel.modelService = modelService;
            
            // Create a consistent panel ID
            const panelId = 'generalList';
            console.log(`generalList command called (panelId: ${panelId})`);
            
            // Check if panel already exists
            if (activePanels.has(panelId)) {
                console.log(`Panel already exists for general list, revealing existing panel`);
                // Panel exists, reveal it instead of creating a new one
                activePanels.get(panelId)?.reveal(vscode.ViewColumn.One);
                return;
            }
            
            // Create new panel if one doesn't exist
            const panel = vscode.window.createWebviewPanel(
                'generalList',
                'General List',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                }
            );
            
            // Track this panel
            console.log(`Adding new panel to activePanels with id: ${panelId}`);
            activePanels.set(panelId, panel);
            generalListPanel.panel = panel;
            
            // Remove from tracking when disposed
            panel.onDidDispose(() => {
                console.log(`Panel disposed, removing from tracking: ${panelId}`);
                activePanels.delete(panelId);
                generalListPanel.panel = null;
            });

            const scriptUri = panel.webview.asWebviewUri(
                vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'generalListView.js')
            );
            const codiconsUri = panel.webview.asWebviewUri(
                vscode.Uri.joinPath(context.extensionUri, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css')
            );

            // Set the HTML content for the webview
            panel.webview.html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>General List</title>
                    <link href="${codiconsUri}" rel="stylesheet" />
                    <style>
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
                            margin-bottom: 15px;
                        }
                        table { border-collapse: collapse; width: 100%; margin-top: 1em; }
                        th, td { border: 1px solid var(--vscode-editorWidget-border); padding: 8px 12px; text-align: left; }
                        th { background: var(--vscode-sideBar-background); cursor: pointer; font-weight: bold; }
                        tr:nth-child(even) { background: var(--vscode-sideBarSectionHeader-background); }
                        tr:hover { background-color: var(--vscode-list-hoverBackground); }
                        tbody tr { cursor: pointer; }
                        #paging { margin: 1em 0; padding: 10px 0; text-align: center; }
                        button { 
                            margin: 0 4px; 
                            background-color: var(--vscode-button-secondaryBackground);
                            color: var(--vscode-button-secondaryForeground);
                            border: none;
                            padding: 4px 8px;
                            cursor: pointer;
                            border-radius: 2px;
                        }
                        button:disabled {
                            opacity: 0.6;
                            cursor: not-allowed;
                        }
                        button:hover:not(:disabled):not(.filter-button-secondary) {
                            background-color: var(--vscode-button-hoverBackground);
                        }
                        .action-button {
                            background-color: var(--vscode-button-background);
                            color: var(--vscode-button-foreground);
                            border: none;
                            padding: 4px 8px;
                            cursor: pointer;
                            border-radius: 2px;
                        }
                        .action-button:hover {
                            background-color: var(--vscode-button-hoverBackground);
                        }
                        .hidden { display: none; }
                        .filter-section {
                            margin-bottom: 20px;
                            background: var(--vscode-sideBarSectionHeader-background);
                            border-radius: 4px;
                            border: 1px solid var(--vscode-panel-border);
                        }
                        .filter-header {
                            padding: 8px 12px;
                            cursor: pointer;
                            border-bottom: 1px solid var(--vscode-panel-border);
                            display: flex;
                            align-items: center;
                            background: var(--vscode-sideBar-background);
                            border-radius: 4px 4px 0 0;
                        }
                        .filter-header:hover {
                            background: var(--vscode-list-hoverBackground);
                        }
                        .filter-header .codicon {
                            margin-right: 8px;
                            transition: transform 0.2s;
                        }
                        .filter-header.collapsed .codicon {
                            transform: rotate(-90deg);
                        }
                        .filter-content {
                            padding: 12px;
                        }
                        .filter-content.collapsed {
                            display: none;
                        }
                        .filter-row {
                            display: flex;
                            gap: 15px;
                            margin-bottom: 10px;
                            align-items: center;
                            flex-wrap: wrap;
                        }
                        .filter-group {
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        }
                        .filter-group label {
                            font-weight: bold;
                            min-width: 80px;
                        }
                        .filter-group input, .filter-group select {
                            padding: 4px 8px;
                            background: var(--vscode-input-background);
                            color: var(--vscode-input-foreground);
                            border: 1px solid var(--vscode-input-border);
                            border-radius: 2px;
                            font-family: var(--vscode-font-family);
                            min-width: 150px;
                        }
                        .filter-group input:focus, .filter-group select:focus {
                            outline: 1px solid var(--vscode-focusBorder);
                            border-color: var(--vscode-focusBorder);
                        }
                        .filter-actions {
                            display: flex;
                            gap: 8px;
                            margin-top: 10px;
                        }
                        .filter-button {
                            background-color: var(--vscode-button-background);
                            color: var(--vscode-button-foreground);
                            border: none;
                            padding: 6px 12px;
                            cursor: pointer;
                            border-radius: 2px;
                        }
                        .filter-button:hover {
                            background-color: var(--vscode-button-hoverBackground);
                        }
                        .filter-button-secondary {
                            background-color: var(--vscode-button-secondaryBackground);
                            color: var(--vscode-button-secondaryForeground);
                            border: none;
                            padding: 6px 12px;
                            cursor: pointer;
                            border-radius: 2px;
                        }
                        .filter-button-secondary:hover {
                            background-color: var(--vscode-button-secondaryHoverBackground, var(--vscode-toolbar-hoverBackground)) !important;
                        }
                        .table-container {
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 3px;
                            overflow: auto;
                            background-color: var(--vscode-editor-background);
                        }
                        .table-footer {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            padding: 10px;
                            background: var(--vscode-sideBarSectionHeader-background);
                            border-top: 1px solid var(--vscode-panel-border);
                            margin-top: 0;
                        }
                        .table-footer-left {
                            flex: 1;
                        }
                        .table-footer-right {
                            color: var(--vscode-descriptionForeground);
                            font-size: 0.9em;
                        }
                        .header-actions {
                            display: flex;
                            gap: 8px;
                            margin-bottom: 10px;
                            justify-content: flex-end;
                        }
                        .icon-button {
                            background-color: var(--vscode-button-secondaryBackground);
                            color: var(--vscode-button-secondaryForeground);
                            border: none;
                            padding: 6px 8px;
                            cursor: pointer;
                            border-radius: 2px;
                            display: flex;
                            align-items: center;
                            gap: 4px;
                        }
                        .icon-button:hover {
                            background-color: var(--vscode-button-secondaryHoverBackground, var(--vscode-toolbar-hoverBackground));
                        }
                        .refresh-button {
                            background-color: var(--vscode-button-background);
                            color: var(--vscode-button-foreground);
                            border: none;
                            padding: 6px 12px;
                            cursor: pointer;
                            border-radius: 2px;
                        }
                        .refresh-button:hover {
                            background-color: var(--vscode-button-hoverBackground);
                        }
                        .refresh-button::before {
                            content: "$(refresh)";
                            font-family: codicon;
                            margin-right: 4px;
                        }
                        .full-page-container {
                            height: 100vh;
                            display: flex;
                            flex-direction: column;
                            overflow: hidden;
                            background-color: var(--vscode-editor-background);
                        }
                    </style>
                </head>
                <body>
                    <div class="validation-header">
                        <h2>General List</h2>
                        <p style="margin-top: -5px; margin-bottom: 15px; color: var(--vscode-descriptionForeground);">
                            Browse all general workflow flows in your model with filtering and sorting capabilities.
                        </p>
                    </div>
                    
                    <div class="filter-section">
                        <div class="filter-header" onclick="toggleFilterSection()">
                            <span class="codicon codicon-chevron-down" id="filterChevron"></span>
                            <span>Filters</span>
                        </div>
                        <div class="filter-content" id="filterContent">
                            <div class="filter-row">
                                <div class="filter-group">
                                    <label>Name:</label>
                                    <input type="text" id="nameFilter" placeholder="Filter by name..." />
                                </div>
                                <div class="filter-group">
                                    <label>Object:</label>
                                    <input type="text" id="objectFilter" placeholder="Filter by object..." />
                                </div>
                            </div>
                            <div class="filter-actions">
                                <button onclick="clearFilters()" class="filter-button-secondary">Clear All</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="header-actions">
                        <button id="exportButton" class="icon-button" title="Download CSV">
                            <i class="codicon codicon-cloud-download"></i>
                        </button>
                        <button id="refreshButton" class="refresh-button" title="Refresh Table">
                        </button>
                    </div>
                    
                    <div class="table-container">
                        <table id="generalListTable"></table>
                    </div>
                    
                    <div class="table-footer">
                        <div class="table-footer-left">
                            <div id="paging"></div>
                        </div>
                        <div class="table-footer-right">
                            <span id="record-info"></span>
                        </div>
                    </div>
                    
                    <script src="${scriptUri}"></script>
                </body>
                </html>
            `;

            // Handle messages from the webview
            panel.webview.onDidReceiveMessage(async (message) => {
                switch (message.command) {
                    case 'GeneralListWebviewReady':
                        try {
                            // Get current model data
                            const modelData = await modelService.getModel();
                            if (modelData && modelData.objects) {
                                const allObjects = Object.values(modelData.objects) as any[];
                                
                                // Extract general flows from all objects
                                let generalFlows: any[] = [];
                                for (const obj of allObjects) {
                                    if (obj.objectWorkflows) {
                                        for (const workflow of obj.objectWorkflows) {
                                            // Only include general workflows (not page workflows)
                                            if (workflow.isPage !== true && !workflow.isPage) {
                                                const displayName = workflow.titleText || workflow.name;
                                                generalFlows.push({
                                                    name: workflow.name,
                                                    displayName: displayName,
                                                    objectName: obj.name || 'Unknown',
                                                    description: workflow.description || '',
                                                    isActive: workflow.isActive !== false
                                                });
                                            }
                                        }
                                    }
                                }
                                
                                // Sort by display name
                                generalFlows.sort((a, b) => a.displayName.localeCompare(b.displayName));
                                
                                // Send data to webview
                                panel.webview.postMessage({
                                    command: 'loadGeneralFlows',
                                    data: generalFlows
                                });
                            }
                        } catch (error) {
                            console.error('Error loading general flows:', error);
                            vscode.window.showErrorMessage('Error loading general flows: ' + error);
                        }
                        break;
                        
                    case 'refresh':
                        try {
                            // Refresh the data by re-sending the general flows
                            const modelData = await modelService.getModel();
                            if (modelData && modelData.objects) {
                                const allObjects = Object.values(modelData.objects) as any[];
                                
                                // Extract general flows from all objects
                                let generalFlows: any[] = [];
                                for (const obj of allObjects) {
                                    if (obj.objectWorkflows) {
                                        for (const workflow of obj.objectWorkflows) {
                                            // Only include general workflows (not page workflows)
                                            if (workflow.isPage !== true && !workflow.isPage) {
                                                const displayName = workflow.titleText || workflow.name;
                                                generalFlows.push({
                                                    name: workflow.name,
                                                    displayName: displayName,
                                                    objectName: obj.name || 'Unknown',
                                                    description: workflow.description || '',
                                                    isActive: workflow.isActive !== false
                                                });
                                            }
                                        }
                                    }
                                }
                                
                                // Sort by display name
                                generalFlows.sort((a, b) => a.displayName.localeCompare(b.displayName));
                                
                                // Send refreshed data to webview
                                panel.webview.postMessage({
                                    command: 'loadGeneralFlows',
                                    data: generalFlows
                                });
                            }
                        } catch (error) {
                            console.error('Error refreshing general flows:', error);
                            vscode.window.showErrorMessage('Error refreshing general flows: ' + error);
                        }
                        break;
                        
                    case 'sortGenerals':
                        // Handle sorting - this would be managed by the webview's client-side code
                        break;
                        
                    case 'viewDetails':
                        // Handle viewing general flow details
                        if (message.generalName && message.objectName) {
                            vscode.window.showInformationMessage(`View details for general flow: ${message.generalName} in object: ${message.objectName}`);
                            // TODO: Implement general flow details view when available
                        }
                        break;
                }
            });
        })
    );
}
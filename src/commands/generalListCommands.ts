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
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 3px;
                            margin-bottom: 15px;
                            background-color: var(--vscode-sideBar-background);
                        }
                        .filter-header {
                            padding: 8px 12px;
                            cursor: pointer;
                            user-select: none;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            background-color: var(--vscode-list-hoverBackground);
                            border-radius: 3px 3px 0 0;
                        }
                        .filter-header:hover {
                            background-color: var(--vscode-list-activeSelectionBackground);
                        }
                        .filter-content {
                            padding: 15px;
                            border-top: 1px solid var(--vscode-panel-border);
                        }
                        .filter-content.collapsed {
                            display: none;
                        }
                        .filter-row {
                            display: flex;
                            gap: 15px;
                            margin-bottom: 10px;
                            flex-wrap: wrap;
                        }
                        .filter-group {
                            display: flex;
                            flex-direction: column;
                            min-width: 150px;
                            flex: 1;
                        }
                        .filter-group label {
                            font-weight: 600;
                            margin-bottom: 4px;
                            font-size: 12px;
                            color: var(--vscode-foreground);
                        }
                        .filter-group input, .filter-group select {
                            padding: 4px 8px;
                            border: 1px solid var(--vscode-input-border);
                            background-color: var(--vscode-input-background);
                            color: var(--vscode-input-foreground);
                            border-radius: 2px;
                            font-size: 13px;
                        }
                        .filter-group input:focus, .filter-group select:focus {
                            outline: 1px solid var(--vscode-focusBorder);
                            outline-offset: -1px;
                        }
                        .filter-actions {
                            display: flex;
                            gap: 10px;
                            margin-top: 15px;
                            padding-top: 10px;
                            border-top: 1px solid var(--vscode-panel-border);
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
                            background: transparent;
                            color: var(--vscode-foreground);
                            border: none;
                            padding: 6px 8px;
                            cursor: pointer;
                            border-radius: 4px;
                            display: flex;
                            align-items: center;
                            gap: 4px;
                            transition: background 0.15s;
                        }
                        .icon-button:hover {
                            background: var(--vscode-toolbar-hoverBackground);
                        }
                        .edit-button {
                            background: transparent !important;
                            background-color: transparent !important;
                            border: none;
                            color: var(--vscode-foreground);
                            cursor: pointer;
                            padding: 6px;
                            border-radius: 4px;
                            transition: background 0.15s;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-width: 28px;
                            height: 28px;
                            margin: 0 2px;
                        }
                        .edit-button:hover {
                            background: var(--vscode-toolbar-hoverBackground) !important;
                            background-color: var(--vscode-toolbar-hoverBackground) !important;
                        }
                        .edit-button:active {
                            background: var(--vscode-toolbar-activeBackground);
                            transform: scale(0.95);
                        }
                        .edit-button .codicon {
                            font-size: 16px;
                        }
                        .actions-container {
                            display: flex;
                            gap: 4px;
                            align-items: center;
                            justify-content: center;
                        }
                        .refresh-button {
                            /* Base styles will be set by JavaScript */
                        }
                        .header-actions {
                            display: flex;
                            justify-content: flex-end;
                            margin-bottom: 10px;
                        }
                        .full-page-container {
                            height: 100vh;
                            display: flex;
                            flex-direction: column;
                            overflow: hidden;
                            background-color: var(--vscode-editor-background);
                        }
                        .spinner {
                            border: 4px solid rgba(255, 255, 255, 0.1);
                            border-radius: 50%;
                            border-top: 4px solid var(--vscode-progressBar-background);
                            border-left-color: var(--vscode-progressBar-background);
                            animation: spin 1s linear infinite;
                            position: fixed;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            z-index: 1000;
                            width: 40px;
                            height: 40px;
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
                            0% { transform: translate(-50%, -50%) rotate(0deg); }
                            100% { transform: translate(-50%, -50%) rotate(360deg); }
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
                                    <input type="text" id="nameFilter" placeholder="Filter by name...">
                                </div>
                                <div class="filter-group">
                                    <label>Object:</label>
                                    <input type="text" id="objectFilter" placeholder="Filter by object...">
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
                    
                    <div id="spinner-overlay" class="spinner-overlay" style="display: none;">
                        <div class="spinner"></div>
                    </div>
                    
                    <script src="${scriptUri}"></script>
                </body>
                </html>
            `;

            // Handle messages from the webview
            panel.webview.onDidReceiveMessage(async (message) => {
                switch (message.command) {
                    case 'GeneralListWebviewReady':
                        console.log("[Extension] GeneralList webview ready");
                        // Load initial general flow data
                        loadGeneralFlowData(panel, modelService);
                        break;
                        
                    case 'refresh':
                        console.log("[Extension] GeneralList refresh requested");
                        loadGeneralFlowData(panel, modelService);
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
                        
                    case 'exportToCSV':
                        console.log("[Extension] GeneralList CSV export requested");
                        try {
                            const csvContent = await saveGeneralFlowsToCSV(message.data.items, modelService);
                            const now = new Date();
                            const pad = (n: number) => n.toString().padStart(2, '0');
                            const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
                            const filename = `general-flows-${timestamp}.csv`;
                            
                            panel.webview.postMessage({
                                command: 'csvExportReady',
                                csvContent: csvContent,
                                filename: filename,
                                success: true
                            });
                        } catch (error) {
                            console.error('[Extension] Error exporting CSV:', error);
                            panel.webview.postMessage({
                                command: 'csvExportReady',
                                success: false,
                                error: error.message
                            });
                        }
                        break;
                        
                    case 'saveCsvToWorkspace':
                        try {
                            const fs = require('fs');
                            const path = require('path');
                            const workspaceFolders = vscode.workspace.workspaceFolders;
                            
                            if (!workspaceFolders || workspaceFolders.length === 0) {
                                vscode.window.showErrorMessage('No workspace folder is open');
                                return;
                            }
                            
                            const workspaceRoot = workspaceFolders[0].uri.fsPath;
                            const filePath = path.join(workspaceRoot, message.data.filename);
                            
                            fs.writeFileSync(filePath, message.data.content, 'utf8');
                            vscode.window.showInformationMessage(`CSV file saved to workspace: ${message.data.filename}`);
                            
                            // Open the file in VS Code
                            const fileUri = vscode.Uri.file(filePath);
                            vscode.window.showTextDocument(fileUri);
                        } catch (error) {
                            console.error('[Extension] Error saving CSV to workspace:', error);
                            vscode.window.showErrorMessage(`Failed to save CSV: ${error.message}`);
                        }
                        break;
                }
            });
        })
    );
}

function loadGeneralFlowData(panel: vscode.WebviewPanel, modelService: ModelService, sortColumn?: string, sortDescending?: boolean) {
    try {
        if (!modelService || !modelService.isFileLoaded()) {
            panel.webview.postMessage({ 
                command: 'loadGeneralFlows', 
                data: [] 
            });
            return;
        }

        const allObjects = modelService.getAllObjects();
        if (!allObjects || allObjects.length === 0) {
            panel.webview.postMessage({ 
                command: 'loadGeneralFlows', 
                data: [] 
            });
            return;
        }

        // Extract general flows from all objects
        let generalFlows: any[] = [];
        for (const obj of allObjects) {
            if (obj.objectWorkflow) {
                for (const workflow of obj.objectWorkflow) {
                    if (workflow.name) {
                        const workflowName = workflow.name.toLowerCase();
                        
                        // Check all criteria (same as tree view):
                        // 1. isDynaFlow property does not exist or is false
                        const isDynaFlowOk = !workflow.isDynaFlow || workflow.isDynaFlow === "false";
                        
                        // 2. isDynaFlowTask property does not exist or is false
                        const isDynaFlowTaskOk = !workflow.isDynaFlowTask || workflow.isDynaFlowTask === "false";
                        
                        // 3. isPage property is false
                        const isPageOk = workflow.isPage === "false";
                        
                        // 4. name does not end with initobjwf
                        const notInitObjWf = !workflowName.endsWith('initobjwf');
                        
                        // 5. name does not end with initreport
                        const notInitReport = !workflowName.endsWith('initreport');
                        
                        // All criteria must be true
                        if (isDynaFlowOk && isDynaFlowTaskOk && isPageOk && notInitObjWf && notInitReport) {
                            const displayName = workflow.titleText || workflow.name;
                            generalFlows.push({
                                name: workflow.name,
                                displayName: displayName,
                                objectName: obj.name || 'Unknown',
                                description: workflow.codeDescription || '',
                                isActive: true // All workflows are considered active for display
                            });
                        }
                    }
                }
            }
        }

        // Apply sorting - default to sorting by displayName if no specific sort is requested
        if (generalFlows.length > 0) {
            if (sortColumn) {
                generalFlows.sort((a, b) => {
                    let aValue = a[sortColumn] || '';
                    let bValue = b[sortColumn] || '';
                    
                    if (typeof aValue === 'string') {
                        aValue = aValue.toLowerCase();
                    }
                    if (typeof bValue === 'string') {
                        bValue = bValue.toLowerCase();
                    }
                    
                    let result;
                    if (aValue < bValue) {
                        result = -1;
                    } else if (aValue > bValue) {
                        result = 1;
                    } else {
                        result = 0;
                    }
                    
                    return sortDescending ? -result : result;
                });
            } else {
                // Default sort by display name
                generalFlows.sort((a, b) => a.displayName.localeCompare(b.displayName));
            }
        }

        console.log(`Found ${generalFlows.length} general flows`);
        panel.webview.postMessage({
            command: 'loadGeneralFlows',
            data: generalFlows
        });

    } catch (error) {
        console.error('Error loading general flows:', error);
        panel.webview.postMessage({ 
            command: 'loadGeneralFlows', 
            data: [] 
        });
        vscode.window.showErrorMessage('Error loading general flows: ' + error);
    }
}

async function saveGeneralFlowsToCSV(items: any[], modelService: ModelService): Promise<string> {
    // Define CSV headers
    const headers = ['Name', 'Display Name', 'Object Name'];
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    // Add data rows
    items.forEach(item => {
        const row = [
            item.name || '',
            item.displayName || '',
            item.objectName || ''
        ];
        
        // Escape and quote values that contain commas, quotes, or newlines
        const escapedRow = row.map(value => {
            let escapedValue = String(value || '');
            if (escapedValue.includes(',') || escapedValue.includes('"') || escapedValue.includes('\n')) {
                escapedValue = '"' + escapedValue.replace(/"/g, '""') + '"';
            }
            return escapedValue;
        });
        
        csvContent += escapedRow.join(',') + '\n';
    });
    
    return csvContent;
}
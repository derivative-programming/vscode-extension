// Description: Handles registration of page init list view related commands.
// Created: January 25, 2025

import * as vscode from 'vscode';
import { ModelService } from '../services/modelService';

// Track active panels to avoid duplicates
const activePanels = new Map<string, vscode.WebviewPanel>();

// Track panel reference for the page init list view
const pageInitListPanel = {
    panel: null as vscode.WebviewPanel | null,
    context: null as vscode.ExtensionContext | null,
    modelService: null as ModelService | null
};

/**
 * Gets the reference to the page init list panel if it's open
 * @returns The page init list panel info or null if not open
 */
export function getPageInitListPanel(): { 
    type: string; 
    context: vscode.ExtensionContext; 
    modelService: ModelService 
} | null {
    if (activePanels.has('pageInitList') && pageInitListPanel.context && pageInitListPanel.modelService) {
        return {
            type: 'pageInitList',
            context: pageInitListPanel.context,
            modelService: pageInitListPanel.modelService
        };
    }
    return null;
}

/**
 * Closes the page init list panel if it's open
 */
export function closePageInitListPanel(): void {
    console.log(`Closing page init list panel if open`);
    const panel = activePanels.get('pageInitList');
    if (panel) {
        panel.dispose();
        activePanels.delete('pageInitList');
    }
    // Clean up panel reference
    pageInitListPanel.panel = null;
}

export function registerPageInitListCommands(
    context: vscode.ExtensionContext,
    appDNAFilePath: string | null,
    modelService: ModelService
): void {
    // Register page init list command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.pageInitList', async () => {
            // Store references to context and modelService
            pageInitListPanel.context = context;
            pageInitListPanel.modelService = modelService;
            
            // Create a consistent panel ID
            const panelId = 'pageInitList';
            console.log(`pageInitList command called (panelId: ${panelId})`);
            
            // Check if panel already exists
            if (activePanels.has(panelId)) {
                console.log(`Panel already exists for page init list, revealing existing panel`);
                // Panel exists, reveal it instead of creating a new one
                activePanels.get(panelId)?.reveal(vscode.ViewColumn.One);
                return;
            }
            
            // Create new panel if one doesn't exist
            const panel = vscode.window.createWebviewPanel(
                'pageInitList',
                'Page Init Flow List',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                }
            );
            
            // Track this panel
            console.log(`Adding new panel to activePanels with id: ${panelId}`);
            activePanels.set(panelId, panel);
            pageInitListPanel.panel = panel;
            
            // Remove from tracking when disposed
            panel.onDidDispose(() => {
                console.log(`Panel disposed, removing from tracking: ${panelId}`);
                activePanels.delete(panelId);
                pageInitListPanel.panel = null;
            });

            const scriptUri = panel.webview.asWebviewUri(
                vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'pageInitListView.js')
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
                    <title>Page Init Flow List</title>
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
                            margin: 0 2px;
                        }
                        .action-button:hover {
                            background-color: var(--vscode-button-hoverBackground);
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
                            gap: 4px;
                        }
                        .refresh-button:hover {
                            background-color: var(--vscode-button-hoverBackground);
                        }
                        .icon-button {
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
                        .icon-button:hover {
                            background: var(--vscode-toolbar-hoverBackground) !important;
                            background-color: var(--vscode-toolbar-hoverBackground) !important;
                        }
                        .icon-button:active {
                            background: var(--vscode-toolbar-activeBackground);
                            transform: scale(0.95);
                        }
                        .icon-button .codicon {
                            font-size: 16px;
                        }
                        .header-actions {
                            display: flex;
                            justify-content: flex-end;
                            margin-bottom: 10px;
                        }
                        .table-footer {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-top: 10px;
                        }
                        .table-footer-left {
                            display: flex;
                            align-items: center;
                        }
                        .table-footer-right {
                            display: flex;
                            align-items: center;
                        }
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
                            overflow: hidden;
                            background-color: var(--vscode-editor-background);
                        }
                    </style>
                </head>
                <body>
                    <div class="validation-header">
                        <h2>Page Init Flow List</h2>
                        <p style="margin-top: -5px; margin-bottom: 15px; color: var(--vscode-descriptionForeground);">
                            Browse all page initialization flows in your model with filtering and sorting capabilities.
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
                                    <input type="text" id="filterName" placeholder="Filter by name...">
                                </div>
                                <div class="filter-group">
                                    <label>Owner Object:</label>
                                    <input type="text" id="filterOwnerObject" placeholder="Filter by owner object...">
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
                        <table id="pageInitListTable"></table>
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
            panel.webview.onDidReceiveMessage(
                async message => {
                    switch (message.command) {
                        case 'PageInitListWebviewReady':
                            console.log("[Extension] PageInitList webview ready");
                            // Load initial page init data
                            loadPageInitData(panel, modelService);
                            break;
                            
                        case 'refresh':
                            console.log("[Extension] PageInitList refresh requested");
                            loadPageInitData(panel, modelService);
                            break;

                        case 'sortPageInits':
                            console.log("[Extension] PageInitList sort requested:", message.column, message.descending);
                            loadPageInitData(panel, modelService, message.column, message.descending);
                            break;

                        case 'viewDetails':
                            console.log("[Extension] PageInitList view details requested for:", message.workflowName);
                            try {
                                const pageInitDetailsView = require('../webviews/pageInitDetailsView.js');
                                const mockTreeItem = { label: message.workflowName } as any;
                                if (pageInitDetailsView && typeof pageInitDetailsView.showPageInitDetails === 'function') {
                                    pageInitDetailsView.showPageInitDetails(mockTreeItem, modelService, context);
                                } else {
                                    vscode.window.showErrorMessage('Page Init Details view is not available.');
                                }
                            } catch (err: any) {
                                console.error('[Extension] Error opening Page Init Details:', err);
                                vscode.window.showErrorMessage(`Failed to open Page Init Details: ${err?.message || err}`);
                            }
                            break;

                        case 'exportToCSV':
                            console.log("[Extension] PageInitList CSV export requested");
                            try {
                                const csvContent = await savePageInitsToCSV(message.data.items, modelService);
                                const now = new Date();
                                const pad = (n: number) => n.toString().padStart(2, '0');
                                const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
                                const filename = `page-init-flows-${timestamp}.csv`;
                                
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
                },
                undefined,
                context.subscriptions
            );
        })
    );
}

/**
 * Loads page init data from the model and sends it to the webview
 * @param panel The webview panel
 * @param modelService The model service
 * @param sortColumn The column to sort by (optional)
 * @param sortDescending Whether to sort descending (optional)
 */
function loadPageInitData(panel: vscode.WebviewPanel, modelService: ModelService, sortColumn?: string, sortDescending?: boolean) {
    try {
        if (!modelService || !modelService.isFileLoaded()) {
            panel.webview.postMessage({ 
                command: 'setPageInitData', 
                data: { 
                    items: [], 
                    totalRecords: 0 
                } 
            });
            return;
        }

        const allObjects = modelService.getAllObjects();
        const pageInitItems: any[] = [];

        // Extract all page init workflows (ending with 'initreport' or 'initobjwf')
        allObjects.forEach(obj => {
            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                obj.objectWorkflow.forEach((workflow: any) => {
                    if (workflow.name) {
                        const workflowName = workflow.name.toLowerCase();
                        // Check if name ends with 'initreport' or 'initobjwf'
                        if (workflowName.endsWith('initreport') || workflowName.endsWith('initobjwf')) {
                            pageInitItems.push({
                                name: workflow.name || 'Unnamed Workflow',
                                ownerObject: obj.name || 'Unknown',
                                workflowType: workflowName.endsWith('initreport') ? 'Init Report' : 'Init Object Workflow'
                            });
                        }
                    }
                });
            }
        });

        // Sort the data if requested
        if (sortColumn) {
            pageInitItems.sort((a, b) => {
                let aVal = a[sortColumn] || '';
                let bVal = b[sortColumn] || '';
                
                // Convert to lowercase for string comparison
                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                }
                if (typeof bVal === 'string') {
                    bVal = bVal.toLowerCase();
                }
                
                let comparison = 0;
                if (aVal < bVal) {
                    comparison = -1;
                }
                if (aVal > bVal) {
                    comparison = 1;
                }
                
                return sortDescending ? -comparison : comparison;
            });
        } else {
            // Default sort by name
            pageInitItems.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
        }

        // Send data to webview
        panel.webview.postMessage({
            command: 'setPageInitData',
            data: {
                items: pageInitItems,
                totalRecords: pageInitItems.length,
                sortColumn: sortColumn || 'name',
                sortDescending: sortDescending || false
            }
        });

    } catch (error) {
        console.error("[Extension] Error loading page init data:", error);
        panel.webview.postMessage({ 
            command: 'setPageInitData', 
            data: { 
                items: [], 
                totalRecords: 0 
            } 
        });
    }
}

/**
 * Saves page init flows data to CSV format
 * @param items The page init items to export
 * @param modelService The model service
 * @returns CSV content as string
 */
async function savePageInitsToCSV(items: any[], modelService: ModelService): Promise<string> {
    // Define CSV headers
    const headers = ['Name', 'Owner Object', 'Workflow Type'];
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    // Add data rows
    items.forEach(item => {
        const row = [
            item.name || '',
            item.ownerObject || '',
            item.workflowType || ''
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
// Description: Handles registration of page list view related commands.
// Created: August 3, 2025

import * as vscode from 'vscode';
import { ModelService } from '../services/modelService';

// Track active panels to avoid duplicates
const activePanels = new Map<string, vscode.WebviewPanel>();

// Track panel reference for the page list view
const pageListPanel = {
    panel: null as vscode.WebviewPanel | null,
    context: null as vscode.ExtensionContext | null,
    modelService: null as ModelService | null
};

/**
 * Gets the reference to the page list panel if it's open
 * @returns The page list panel info or null if not open
 */
export function getPageListPanel(): { 
    type: string; 
    context: vscode.ExtensionContext; 
    modelService: ModelService 
} | null {
    if (activePanels.has('pageList') && pageListPanel.context && pageListPanel.modelService) {
        return {
            type: 'pageList',
            context: pageListPanel.context,
            modelService: pageListPanel.modelService
        };
    }
    return null;
}

/**
 * Closes the page list panel if it's open
 */
export function closePageListPanel(): void {
    console.log(`Closing page list panel if open`);
    const panel = activePanels.get('pageList');
    if (panel) {
        panel.dispose();
        activePanels.delete('pageList');
    }
    // Clean up panel reference
    pageListPanel.panel = null;
}

export function registerPageListCommands(
    context: vscode.ExtensionContext,
    appDNAFilePath: string | null,
    modelService: ModelService
): void {
    // Register page list command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.pageList', async () => {
            // Store references to context and modelService
            pageListPanel.context = context;
            pageListPanel.modelService = modelService;
            
            // Create a consistent panel ID
            const panelId = 'pageList';
            console.log(`pageList command called (panelId: ${panelId})`);
            
            // Check if panel already exists
            if (activePanels.has(panelId)) {
                console.log(`Panel already exists for page list, revealing existing panel`);
                // Panel exists, reveal it instead of creating a new one
                activePanels.get(panelId)?.reveal(vscode.ViewColumn.One);
                return;
            }
            
            // Create new panel if one doesn't exist
            const panel = vscode.window.createWebviewPanel(
                'pageList',
                'Page List',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                }
            );
            
            // Track this panel
            console.log(`Adding new panel to activePanels with id: ${panelId}`);
            activePanels.set(panelId, panel);
            pageListPanel.panel = panel;
            
            // Remove from tracking when disposed
            panel.onDidDispose(() => {
                console.log(`Panel disposed, removing from tracking: ${panelId}`);
                activePanels.delete(panelId);
                pageListPanel.panel = null;
            });

            const scriptUri = panel.webview.asWebviewUri(
                vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'pageListView.js')
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
                    <title>Page List</title>
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
                        .preview-button {
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
                        .preview-button:hover {
                            background: var(--vscode-toolbar-hoverBackground) !important;
                            background-color: var(--vscode-toolbar-hoverBackground) !important;
                        }
                        .preview-button:active {
                            background: var(--vscode-toolbar-activeBackground);
                            transform: scale(0.95);
                        }
                        .preview-button .codicon {
                            font-size: 16px;
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
                        <h2>Page List</h2>
                        <p style="margin-top: -5px; margin-bottom: 15px; color: var(--vscode-descriptionForeground);">
                            Browse all pages (forms and reports) in your model with filtering and sorting capabilities.
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
                                    <label>Title:</label>
                                    <input type="text" id="filterTitle" placeholder="Filter by title...">
                                </div>
                                <div class="filter-group">
                                    <label>Type:</label>
                                    <select id="filterType">
                                        <option value="">All Types</option>
                                        <option value="Form">Form</option>
                                        <option value="Report">Report</option>
                                    </select>
                                </div>
                            </div>
                            <div class="filter-row">
                                <div class="filter-group">
                                    <label>Report Type:</label>
                                    <select id="filterReportType">
                                        <option value="">All Report Types</option>
                                        <option value="Grid">Grid</option>
                                        <option value="Three Column">Three Column</option>
                                        <option value="Navigation">Navigation</option>
                                    </select>
                                </div>
                                <div class="filter-group">
                                    <label>Owner Object:</label>
                                    <select id="filterOwnerObject">
                                        <option value="">All Objects</option>
                                    </select>
                                </div>
                                <div class="filter-group">
                                    <label>Role Required:</label>
                                    <select id="filterRoleRequired">
                                        <option value="">All Roles</option>
                                    </select>
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
                        <table id="pageListTable"></table>
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
                        case 'PageListWebviewReady':
                            console.log("[Extension] PageList webview ready");
                            // Load initial page data
                            loadPageData(panel, modelService);
                            break;
                            
                        case 'refresh':
                            console.log("[Extension] PageList refresh requested");
                            loadPageData(panel, modelService);
                            break;

                        case 'sortPages':
                            console.log("[Extension] PageList sort requested:", message.column, message.descending);
                            loadPageData(panel, modelService, message.column, message.descending);
                            break;

                        case 'previewPage':
                            console.log("[Extension] PageList preview requested for:", message.pageName);
                            // Open page preview and select the specific page
                            vscode.commands.executeCommand('appdna.showPagePreview').then(() => {
                                // Wait a brief moment for the page preview to open, then select the page
                                setTimeout(() => {
                                    try {
                                        const { getPagePreviewPanel } = require("../webviews/pagepreview/pagePreviewView");
                                        const pagePreviewResult = getPagePreviewPanel();
                                        const pagePreviewPanel = pagePreviewResult ? pagePreviewResult.panel : null;
                                        
                                        if (pagePreviewPanel && pagePreviewPanel.webview && message.pageName) {
                                            console.log('[DEBUG] PageList - Sending select page message to opened page preview for:', message.pageName);
                                            pagePreviewPanel.webview.postMessage({
                                                command: 'selectPageAndShowPreview',
                                                data: { pageName: message.pageName }
                                            });
                                        } else {
                                            console.warn('[WARN] PageList - Page preview panel not available after opening');
                                        }
                                    } catch (error) {
                                        console.error('[ERROR] PageList - Failed to select page in page preview:', error);
                                    }
                                }, 1000); // Wait 1 second for page preview to fully load
                            }, (error: any) => {
                                console.error('[ERROR] PageList - Failed to open page preview via command:', error);
                                vscode.window.showErrorMessage(`Failed to open page preview: ${error.message}`);
                            });
                            break;

                        case 'exportToCSV':
                            try {
                                console.log('[Extension] PageList CSV export requested');
                                const csvContent = await savePagesToCSV(message.data.items, modelService);
                                const now = new Date();
                                const pad = (n: number) => n.toString().padStart(2, '0');
                                const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
                                const filename = `pages-${timestamp}.csv`;
                                
                                panel.webview.postMessage({
                                    command: 'csvExportReady',
                                    csvContent: csvContent,
                                    filename: filename,
                                    success: true
                                });
                            } catch (error) {
                                console.error('[Extension] Error exporting pages CSV:', error);
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
                                vscode.window.showErrorMessage(`Failed to save CSV file: ${error.message}`);
                            }
                            break;

                        case 'viewDetails':
                            console.log("[Extension] PageList view details requested for:", message.pageName, message.pageType);
                            if (message.pageType === 'Form') {
                                // Open form details view
                                const mockTreeItem = {
                                    label: message.pageName,
                                    contextValue: 'form',
                                    tooltip: `${message.pageName} (${message.ownerObject})`
                                };
                                try {
                                    const { showFormDetails } = require('../webviews/formDetailsView');
                                    showFormDetails(mockTreeItem, modelService, context);
                                } catch (error) {
                                    console.error('[ERROR] PageList - Failed to open form details:', error);
                                    vscode.window.showErrorMessage(`Failed to open form details: ${error.message}`);
                                }
                            } else if (message.pageType === 'Report') {
                                // Open report details view
                                const mockTreeItem = {
                                    label: message.pageName,
                                    contextValue: 'report',
                                    tooltip: `${message.pageName} (${message.ownerObject})`
                                };
                                try {
                                    const { showReportDetails } = require('../webviews/reports/reportDetailsView');
                                    showReportDetails(mockTreeItem, modelService, context);
                                } catch (error) {
                                    console.error('[ERROR] PageList - Failed to open report details:', error);
                                    vscode.window.showErrorMessage(`Failed to open report details: ${error.message}`);
                                }
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
 * Loads page data from the model and sends it to the webview
 * @param panel The webview panel
 * @param modelService The model service
 * @param sortColumn The column to sort by (optional)
 * @param sortDescending Whether to sort descending (optional)
 */
function loadPageData(panel: vscode.WebviewPanel, modelService: ModelService, sortColumn?: string, sortDescending?: boolean) {
    try {
        if (!modelService || !modelService.isFileLoaded()) {
            panel.webview.postMessage({ 
                command: 'setPageData', 
                data: { 
                    items: [], 
                    totalRecords: 0 
                } 
            });
            return;
        }

        const allObjects = modelService.getAllObjects();
        const pageItems: any[] = [];

        // Extract all forms and reports that are pages
        allObjects.forEach(obj => {
            // Process forms
            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                obj.objectWorkflow.forEach((form: any) => {
                    if (form.isPage === 'true') {
                        pageItems.push({
                            name: form.name || 'Unnamed Form',
                            titleText: form.titleText || form.name || 'Unnamed Form',
                            type: 'Form',
                            reportType: '',
                            ownerObject: obj.name || 'Unknown',
                            roleRequired: form.roleRequired || 'Public',
                            isPage: form.isPage
                        });
                    }
                });
            }

            // Process reports
            if (obj.report && Array.isArray(obj.report)) {
                obj.report.forEach((report: any) => {
                    if (report.isPage === 'true'|| report.isPage === undefined) {
                        let reportType = '';
                        if (report.visualizationType) {
                            const vizType = report.visualizationType.toLowerCase();
                            if (vizType === 'grid') {
                                reportType = 'Grid';
                            } else if (vizType === 'detailtwocolumn') {
                                reportType = 'Navigation';
                            } else if (vizType === 'detailthreecolumn') {
                                reportType = 'Three Column';
                            } else {
                                reportType = report.visualizationType;
                            }
                        }

                        pageItems.push({
                            name: report.name || 'Unnamed Report',
                            titleText: report.titleText || report.name || 'Unnamed Report',
                            type: 'Report',
                            reportType: reportType,
                            ownerObject: obj.name || 'Unknown',
                            roleRequired: report.roleRequired || 'Public',
                            isPage: report.isPage
                        });
                    }
                });
            }
        });

        // Sort the data if requested
        if (sortColumn) {
            pageItems.sort((a, b) => {
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
            pageItems.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
        }

        // Send data to webview
        panel.webview.postMessage({
            command: 'setPageData',
            data: {
                items: pageItems,
                totalRecords: pageItems.length,
                sortColumn: sortColumn || 'name',
                sortDescending: sortDescending || false
            }
        });

    } catch (error) {
        console.error("[Extension] Error loading page data:", error);
        panel.webview.postMessage({ 
            command: 'setPageData', 
            data: { 
                items: [], 
                totalRecords: 0 
            } 
        });
    }
}

/**
 * Save pages data to CSV file
 */
async function savePagesToCSV(items: any[], modelService: ModelService): Promise<string> {
    try {
        // Create CSV content
        const csvHeader = 'Name,Title Text,Type,Report Type,Owner Object,Role Required\n';
        const csvRows = items.map(item => {
            const name = (item.name || '').replace(/"/g, '""');
            const titleText = (item.titleText || '').replace(/"/g, '""');
            const type = (item.type || '').replace(/"/g, '""');
            const reportType = (item.reportType || '').replace(/"/g, '""');
            const ownerObject = (item.ownerObject || '').replace(/"/g, '""');
            const roleRequired = (item.roleRequired || '').replace(/"/g, '""');
            return `"${name}","${titleText}","${type}","${reportType}","${ownerObject}","${roleRequired}"`;
        }).join('\n');
        
        const csvContent = csvHeader + csvRows;
        
        return csvContent;
    } catch (error) {
        console.error("[Extension] Error creating pages CSV:", error);
        throw error;
    }
}

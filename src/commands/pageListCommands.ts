// Description: Handles registration of page list view related commands.
// Created: August 3, 2025

import * as vscode from 'vscode';
import * as path from 'path';
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
                    <script src="https://d3js.org/d3.v7.min.js"></script>
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
                        .validation-header p {
                            margin: 0;
                            color: var(--vscode-descriptionForeground);
                            font-size: 14px;
                        }
                        
                        /* Tab styling following metrics analysis pattern */
                        .tabs {
                            display: flex;
                            border-bottom: 1px solid var(--vscode-panel-border);
                            margin-bottom: 20px;
                        }
                        
                        .tab {
                            padding: 8px 16px;
                            cursor: pointer;
                            background-color: var(--vscode-tab-inactiveBackground);
                            border: none;
                            outline: none;
                            color: var(--vscode-tab-inactiveForeground);
                            margin-right: 4px;
                            border-top-left-radius: 3px;
                            border-top-right-radius: 3px;
                            user-select: none;
                        }
                        
                        .tab.active {
                            background-color: var(--vscode-tab-activeBackground);
                            color: var(--vscode-tab-activeForeground);
                            border-bottom: 2px solid var(--vscode-focusBorder);
                        }
                        
                        .tab-content {
                            display: none;
                            padding: 15px;
                            background-color: var(--vscode-editor-background);
                            border: 1px solid var(--vscode-panel-border);
                            border-top: none;
                            border-radius: 0 0 3px 3px;
                        }
                        
                        .tab-content.active {
                            display: block;
                        }
                        table { border-collapse: collapse; width: 100%; margin-top: 1em; min-width: 1200px; }
                        th, td { border: 1px solid var(--vscode-editorWidget-border); padding: 8px 12px; text-align: left; white-space: nowrap; }
                        th { background: var(--vscode-sideBar-background); cursor: pointer; font-weight: bold; }
                        td { max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
                        td:hover { overflow: visible; white-space: normal; word-wrap: break-word; }
                        tr:nth-child(even) { background: var(--vscode-sideBarSectionHeader-background); }
                        tr:hover { background-color: var(--vscode-list-hoverBackground); }
                        tbody tr { cursor: pointer; }
                        /* Column-specific widths for better table layout */
                        th:nth-child(1), td:nth-child(1) { min-width: 120px; max-width: 180px; } /* Name */
                        th:nth-child(2), td:nth-child(2) { min-width: 90px; max-width: 150px; } /* Title Text */
                        th:nth-child(3), td:nth-child(3) { min-width: 80px; max-width: 100px; } /* Type */
                        th:nth-child(4), td:nth-child(4) { min-width: 100px; max-width: 140px; } /* Report Type */
                        th:nth-child(5), td:nth-child(5) { min-width: 120px; max-width: 180px; } /* Owner Object */
                        th:nth-child(6), td:nth-child(6) { min-width: 90px; max-width: 120px; } /* Target Child Object */
                        th:nth-child(7), td:nth-child(7) { min-width: 96px; max-width: 128px; } /* Role Required */
                        th:nth-child(8), td:nth-child(8) { min-width: 80px; max-width: 100px; } /* Total Items */
                        th:nth-child(9), td:nth-child(9) { min-width: 100px; max-width: 100px; } /* Actions */
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
                        .filter-group-roles {
                            flex: 1 1 100%;
                            max-width: 100%;
                        }
                        .role-filter-checkboxes {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 12px;
                            padding: 8px 0;
                        }
                        .role-checkbox-item {
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            font-size: 12px;
                            cursor: pointer;
                            min-width: 120px;
                        }
                        .role-checkbox-item input[type="checkbox"] {
                            margin: 0;
                            cursor: pointer;
                        }
                        .role-checkbox-item label {
                            cursor: pointer;
                            color: var(--vscode-editor-foreground);
                            user-select: none;
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
                            overflow-x: auto;
                            overflow-y: hidden;
                            background-color: var(--vscode-editor-background);
                        }

                        /* Treemap visualization styles */
                        .treemap-container {
                            padding: 15px;
                        }
                        
                        .treemap-header {
                            margin-bottom: 20px;
                        }
                        
                        .treemap-header-content {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            gap: 15px;
                        }
                        
                        .treemap-title {
                            flex: 1;
                        }
                        
                        .treemap-actions {
                            display: flex;
                            gap: 10px;
                            align-items: flex-start;
                        }
                        
                        .treemap-header h3 {
                            margin: 0 0 5px 0;
                            color: var(--vscode-foreground);
                            font-size: 16px;
                        }
                        
                        .treemap-header p {
                            margin: 0;
                            color: var(--vscode-descriptionForeground);
                            font-size: 12px;
                        }
                        
                        .treemap-viz {
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 4px;
                            margin-bottom: 15px;
                            overflow: hidden;
                        }
                        
                        .treemap-legend {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 15px;
                            font-size: 12px;
                            color: var(--vscode-foreground);
                        }
                        
                        .legend-item {
                            display: flex;
                            align-items: center;
                            gap: 5px;
                        }
                        
                        .legend-color {
                            width: 16px;
                            height: 16px;
                            border-radius: 2px;
                            border: 1px solid var(--vscode-panel-border);
                        }
                        
                        .legend-color.large-complexity {
                            background-color: #d73a49;
                        }
                        
                        .legend-color.medium-complexity {
                            background-color: #f66a0a;
                        }
                        
                        .legend-color.small-complexity {
                            background-color: #28a745;
                        }
                        
                        .legend-color.tiny-complexity {
                            background-color: #6c757d;
                        }
                        
                        .treemap-rect {
                            stroke: var(--vscode-panel-border);
                            stroke-width: 1px;
                            cursor: pointer;
                            transition: opacity 0.2s;
                        }
                        
                        .treemap-rect:hover {
                            opacity: 0.8;
                            stroke-width: 2px;
                        }
                        
                        .treemap-text {
                            font-family: var(--vscode-font-family);
                            font-size: 11px;
                            fill: white;
                            text-anchor: middle;
                            dominant-baseline: middle;
                            pointer-events: none;
                            text-shadow: 1px 1px 1px rgba(0,0,0,0.8);
                        }
                        
                        .treemap-tooltip {
                            position: absolute;
                            background: var(--vscode-editorHoverWidget-background);
                            border: 1px solid var(--vscode-editorHoverWidget-border);
                            border-radius: 4px;
                            padding: 8px;
                            font-size: 12px;
                            color: var(--vscode-editorHoverWidget-foreground);
                            pointer-events: none;
                            z-index: 1000;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        }
                        
                        .loading {
                            text-align: center;
                            padding: 40px;
                            color: var(--vscode-descriptionForeground);
                        }
                        
                        .hidden {
                            display: none;
                        }
                        
                        /* Refresh button spin animation */
                        .codicon.refresh-spinning,
                        .refresh-spinning {
                            animation: refresh-spin 1s linear infinite !important;
                            display: inline-block !important;
                            transform-origin: center center !important;
                        }
                        
                        @keyframes refresh-spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }

                        /* Histogram specific styles */
                        .histogram-container {
                            padding: 15px;
                        }
                        
                        .histogram-header {
                            margin-bottom: 20px;
                        }
                        
                        .histogram-header-content {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            gap: 15px;
                        }
                        
                        .histogram-title {
                            flex: 1;
                        }
                        
                        .histogram-actions {
                            display: flex;
                            gap: 10px;
                            align-items: flex-start;
                        }
                        
                        .histogram-header h3 {
                            margin: 0 0 5px 0;
                            color: var(--vscode-foreground);
                            font-size: 16px;
                        }
                        
                        .histogram-header p {
                            margin: 0;
                            color: var(--vscode-descriptionForeground);
                            font-size: 12px;
                        }
                        
                        .histogram-viz {
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 4px;
                            margin-bottom: 15px;
                            overflow: hidden;
                        }
                        
                        .histogram-legend {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 15px;
                            font-size: 12px;
                            color: var(--vscode-foreground);
                        }
                        
                        /* Histogram bar styles */
                        .histogram-bar {
                            cursor: pointer;
                            transition: opacity 0.2s;
                        }
                        
                        .histogram-bar:hover {
                            opacity: 0.8;
                        }
                        
                        .histogram-label {
                            font-family: var(--vscode-font-family);
                            font-size: 12px;
                            fill: var(--vscode-foreground);
                            text-anchor: middle;
                        }
                        
                        .histogram-value {
                            font-family: var(--vscode-font-family);
                            font-size: 11px;
                            fill: var(--vscode-foreground);
                            text-anchor: middle;
                            font-weight: bold;
                        }
                        
                        .histogram-tooltip {
                            position: absolute;
                            background: var(--vscode-editorHoverWidget-background);
                            border: 1px solid var(--vscode-editorHoverWidget-border);
                            border-radius: 4px;
                            padding: 8px;
                            font-size: 12px;
                            color: var(--vscode-editorHoverWidget-foreground);
                            pointer-events: none;
                            z-index: 1000;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        }

                    </style>
                </head>
                <body>
                    <div class="validation-header">
                        <h2>Page List</h2>
                        <p>Browse all pages (forms and reports) in your model with filtering and analysis capabilities.</p>
                    </div>
                    
                    <div class="tabs">
                        <button class="tab active" data-tab="pages">Pages</button>
                        <button class="tab" data-tab="visualization">Complexity Visualization</button>
                        <button class="tab" data-tab="distribution">Complexity Distribution</button>
                    </div>
                    
                    <div id="pages-tab" class="tab-content active">
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
                                    <input type="text" id="filterOwnerObject" placeholder="Filter by owner object...">
                                </div>
                                <div class="filter-group">
                                    <label>Target Child Object:</label>
                                    <input type="text" id="filterTargetChildObject" placeholder="Filter by target child object...">
                                </div>
                            </div>
                            <div class="filter-row">
                                <div class="filter-group filter-group-roles">
                                    <label>Role Required:</label>
                                    <div id="filterRoleRequired" class="role-filter-checkboxes"></div>
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
                    </div>
                    
                    <div id="visualization-tab" class="tab-content">
                        <div class="filter-section">
                        <div class="filter-header" onclick="toggleFilterSection()">
                            <span class="codicon codicon-chevron-down" id="filterChevronVisualization"></span>
                            <span>Filters</span>
                        </div>
                        <div class="filter-content" id="filterContentVisualization">
                            <div class="filter-row">
                                <div class="filter-group">
                                    <label>Name:</label>
                                    <input type="text" id="filterNameVisualization" placeholder="Filter by name...">
                                </div>
                                <div class="filter-group">
                                    <label>Title:</label>
                                    <input type="text" id="filterTitleVisualization" placeholder="Filter by title...">
                                </div>
                                <div class="filter-group">
                                    <label>Type:</label>
                                    <select id="filterTypeVisualization">
                                        <option value="">All Types</option>
                                        <option value="Form">Form</option>
                                        <option value="Report">Report</option>
                                    </select>
                                </div>
                            </div>
                            <div class="filter-row">
                                <div class="filter-group">
                                    <label>Report Type:</label>
                                    <select id="filterReportTypeVisualization">
                                        <option value="">All Report Types</option>
                                        <option value="Grid">Grid</option>
                                        <option value="Three Column">Three Column</option>
                                        <option value="Navigation">Navigation</option>
                                    </select>
                                </div>
                                <div class="filter-group">
                                    <label>Owner Object:</label>
                                    <input type="text" id="filterOwnerObjectVisualization" placeholder="Filter by owner object...">
                                </div>
                                <div class="filter-group">
                                    <label>Target Child Object:</label>
                                    <input type="text" id="filterTargetChildObjectVisualization" placeholder="Filter by target child object...">
                                </div>
                            </div>
                            <div class="filter-row">
                                <div class="filter-group filter-group-roles">
                                    <label>Role Required:</label>
                                    <div id="filterRoleRequiredVisualization" class="role-filter-checkboxes"></div>
                                </div>
                            </div>
                            <div class="filter-actions">
                                <button onclick="clearFilters()" class="filter-button-secondary">Clear All</button>
                            </div>
                        </div>
                    </div>
                    
                        <div class="treemap-container">
                            <div class="treemap-header">
                                <div class="treemap-header-content">
                                    <div class="treemap-title">
                                        <h3>Page Complexity Proportions</h3>
                                        <p>Size represents total element count (buttons + inputs/columns + outputs/params). Hover for details.</p>
                                    </div>
                                    <div class="treemap-actions">
                                        <button id="refreshPageTreemapButton" class="icon-button" title="Refresh Data">
                                            <i class="codicon codicon-refresh"></i>
                                        </button>
                                        <button id="generatePageTreemapPngBtn" class="svg-export-btn">
                                            <span class="codicon codicon-device-camera"></span>
                                            Generate PNG
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div id="page-treemap-loading" class="loading">Loading page complexity visualization...</div>
                            <div id="page-treemap-visualization" class="treemap-viz hidden"></div>
                            <div class="treemap-legend">
                                <div class="legend-item">
                                    <span class="legend-color large-complexity"></span>
                                    <span>High Complexity (>20 elements)</span>
                                </div>
                                <div class="legend-item">
                                    <span class="legend-color medium-complexity"></span>
                                    <span>Medium Complexity (10-20 elements)</span>
                                </div>
                                <div class="legend-item">
                                    <span class="legend-color small-complexity"></span>
                                    <span>Low Complexity (5-10 elements)</span>
                                </div>
                                <div class="legend-item">
                                    <span class="legend-color tiny-complexity"></span>
                                    <span>Very Low Complexity (<5 elements)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="distribution-tab" class="tab-content">
                        <div class="filter-section">
                        <div class="filter-header" onclick="toggleFilterSection()">
                            <span class="codicon codicon-chevron-down" id="filterChevronDistribution"></span>
                            <span>Filters</span>
                        </div>
                        <div class="filter-content" id="filterContentDistribution">
                            <div class="filter-row">
                                <div class="filter-group">
                                    <label>Name:</label>
                                    <input type="text" id="filterNameDistribution" placeholder="Filter by name...">
                                </div>
                                <div class="filter-group">
                                    <label>Title:</label>
                                    <input type="text" id="filterTitleDistribution" placeholder="Filter by title...">
                                </div>
                                <div class="filter-group">
                                    <label>Type:</label>
                                    <select id="filterTypeDistribution">
                                        <option value="">All Types</option>
                                        <option value="Form">Form</option>
                                        <option value="Report">Report</option>
                                    </select>
                                </div>
                            </div>
                            <div class="filter-row">
                                <div class="filter-group">
                                    <label>Report Type:</label>
                                    <select id="filterReportTypeDistribution">
                                        <option value="">All Report Types</option>
                                        <option value="Grid">Grid</option>
                                        <option value="Three Column">Three Column</option>
                                        <option value="Navigation">Navigation</option>
                                    </select>
                                </div>
                                <div class="filter-group">
                                    <label>Owner Object:</label>
                                    <input type="text" id="filterOwnerObjectDistribution" placeholder="Filter by owner object...">
                                </div>
                                <div class="filter-group">
                                    <label>Target Child Object:</label>
                                    <input type="text" id="filterTargetChildObjectDistribution" placeholder="Filter by target child object...">
                                </div>
                            </div>
                            <div class="filter-row">
                                <div class="filter-group filter-group-roles">
                                    <label>Role Required:</label>
                                    <div id="filterRoleRequiredDistribution" class="role-filter-checkboxes"></div>
                                </div>
                            </div>
                            <div class="filter-actions">
                                <button onclick="clearFilters()" class="filter-button-secondary">Clear All</button>
                            </div>
                        </div>
                    </div>
                    
                        <div class="histogram-container">
                            <div class="histogram-header">
                                <div class="histogram-header-content">
                                    <div class="histogram-title">
                                        <h3>Complexity Distribution</h3>
                                        <p>Distribution of pages across element count categories</p>
                                    </div>
                                    <div class="histogram-actions">
                                        <button id="refreshPageHistogramButton" class="icon-button" title="Refresh Data">
                                            <i class="codicon codicon-refresh"></i>
                                        </button>
                                        <button id="generatePageHistogramPngBtn" class="svg-export-btn">
                                            <span class="codicon codicon-device-camera"></span>
                                            Generate PNG
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div id="page-histogram-loading" class="loading">Loading element distribution...</div>
                            <div id="page-histogram-visualization" class="histogram-viz hidden"></div>
                            <div class="histogram-legend">
                                <div class="legend-item">
                                    <span class="legend-color large-complexity"></span>
                                    <span>High Complexity (>20 elements)</span>
                                </div>
                                <div class="legend-item">
                                    <span class="legend-color medium-complexity"></span>
                                    <span>Medium Complexity (10-20 elements)</span>
                                </div>
                                <div class="legend-item">
                                    <span class="legend-color small-complexity"></span>
                                    <span>Low Complexity (5-10 elements)</span>
                                </div>
                                <div class="legend-item">
                                    <span class="legend-color tiny-complexity"></span>
                                    <span>Very Low Complexity (<5 elements)</span>
                                </div>
                            </div>
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

                        case 'exportToCSV':
                            console.log("[Extension] PageList CSV export requested");
                            try {
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

                        case 'savePngToWorkspace':
                            try {
                                const fs = require('fs');
                                const path = require('path');
                                const workspaceFolders = vscode.workspace.workspaceFolders;
                                
                                if (!workspaceFolders || workspaceFolders.length === 0) {
                                    panel.webview.postMessage({
                                        command: 'pngSaveResult',
                                        success: false,
                                        error: 'No workspace folder is open'
                                    });
                                    return;
                                }
                                
                                const workspaceRoot = workspaceFolders[0].uri.fsPath;
                                const filePath = path.join(workspaceRoot, message.data.filename);
                                
                                // Convert base64 to buffer and save
                                const base64Data = message.data.base64.replace(/^data:image\/png;base64,/, '');
                                const buffer = Buffer.from(base64Data, 'base64');
                                
                                fs.writeFileSync(filePath, buffer);
                                
                                panel.webview.postMessage({
                                    command: 'pngSaveResult',
                                    success: true,
                                    filename: message.data.filename
                                });
                                
                                vscode.window.showInformationMessage(`PNG file saved to workspace: ${message.data.filename}`);
                                
                                // Open the PNG file immediately
                                const fileUri = vscode.Uri.file(filePath);
                                vscode.commands.executeCommand('vscode.open', fileUri);
                                
                            } catch (error) {
                                console.error('[Extension] Error saving PNG to workspace:', error);
                                panel.webview.postMessage({
                                    command: 'pngSaveResult',
                                    success: false,
                                    error: error.message
                                });
                                vscode.window.showErrorMessage(`Failed to save PNG: ${error.message}`);
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
                        // Calculate total elements for forms
                        const buttons = (form.objectWorkflowButton && Array.isArray(form.objectWorkflowButton)) ? form.objectWorkflowButton.length : 0;
                        const inputs = (form.objectWorkflowParam && Array.isArray(form.objectWorkflowParam)) ? form.objectWorkflowParam.length : 0;
                        const outputVars = (form.objectWorkflowOutputVar && Array.isArray(form.objectWorkflowOutputVar)) ? form.objectWorkflowOutputVar.length : 0;
                        const totalElements = buttons + inputs + outputVars;

                        pageItems.push({
                            name: form.name || 'Unnamed Form',
                            titleText: form.titleText || form.name || 'Unnamed Form',
                            type: 'Form',
                            reportType: '',
                            ownerObject: obj.name || 'Unknown',
                            targetChildObject: form.targetChildObject || '',
                            roleRequired: form.roleRequired || 'Public',
                            totalElements: totalElements,
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

                        // Calculate total elements for reports
                        const buttons = (report.reportButton && Array.isArray(report.reportButton)) ? report.reportButton.length : 0;
                        const columns = (report.reportColumn && Array.isArray(report.reportColumn)) ? report.reportColumn.length : 0;
                        const params = (report.reportParam && Array.isArray(report.reportParam)) ? report.reportParam.length : 0;
                        const totalElements = buttons + columns + params;

                        pageItems.push({
                            name: report.name || 'Unnamed Report',
                            titleText: report.titleText || report.name || 'Unnamed Report',
                            type: 'Report',
                            reportType: reportType,
                            ownerObject: obj.name || 'Unknown',
                            targetChildObject: report.targetChildObject || '',
                            roleRequired: report.roleRequired || 'Public',
                            totalElements: totalElements,
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
 * Saves pages data to CSV format
 * @param items The page items to export
 * @param modelService The model service
 * @returns CSV content as string
 */
async function savePagesToCSV(items: any[], modelService: ModelService): Promise<string> {
    // Define CSV headers
    const headers = ['Name', 'Type', 'Owner Object', 'Target Child Object', 'Report Type', 'Role Required', 'Total Items'];
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    // Add data rows
    items.forEach(item => {
        const row = [
            item.name || '',
            item.type || '',
            item.ownerObject || '',
            item.targetChildObject || '',
            item.reportType || '',
            item.roleRequired || '',
            String(item.totalElements || 0)
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

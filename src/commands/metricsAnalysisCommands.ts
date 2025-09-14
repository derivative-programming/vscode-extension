// Description: Handles registration of metrics analysis view related commands.
// Created: September 14, 2025

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ModelService } from '../services/modelService';

// Track active panels to avoid duplicates
const activePanels = new Map<string, vscode.WebviewPanel>();

// Track panel reference for the metrics analysis view
const metricsAnalysisPanel = {
    panel: null as vscode.WebviewPanel | null,
    context: null as vscode.ExtensionContext | null,
    modelService: null as ModelService | null
};

/**
 * Gets the reference to the metrics analysis panel if it's open
 */
export function getMetricsAnalysisPanel(): { 
    type: string; 
    context: vscode.ExtensionContext; 
    modelService: ModelService 
} | null {
    if (activePanels.has('metricsAnalysis') && metricsAnalysisPanel.context && metricsAnalysisPanel.modelService) {
        return {
            type: 'metricsAnalysis',
            context: metricsAnalysisPanel.context,
            modelService: metricsAnalysisPanel.modelService
        };
    }
    return null;
}

/**
 * Closes the metrics analysis panel if it's open
 */
export function closeMetricsAnalysisPanel(): void {
    console.log(`Closing metrics analysis panel if open`);
    const panel = activePanels.get('metricsAnalysis');
    if (panel) {
        panel.dispose();
        activePanels.delete('metricsAnalysis');
    }
    // Clean up panel reference
    metricsAnalysisPanel.panel = null;
}

/**
 * Registers the metrics analysis command
 */
export function registerMetricsAnalysisCommands(context: vscode.ExtensionContext, modelService: ModelService) {
    
    // Register the show metrics analysis command
    const metricsAnalysisCommand = vscode.commands.registerCommand('appdna.metricsAnalysis', () => {
        console.log('Metrics analysis command executed');
        
        // Check if we already have a metrics analysis panel open
        if (activePanels.has('metricsAnalysis')) {
            // Focus the existing panel
            const existingPanel = activePanels.get('metricsAnalysis');
            if (existingPanel) {
                existingPanel.reveal();
                return;
            }
        }
        
        // Create and show new panel
        const panel = vscode.window.createWebviewPanel(
            'metricsAnalysis',
            'Analysis - Metrics',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'media')),
                    vscode.Uri.file(path.join(context.extensionPath, 'src')),
                    vscode.Uri.file(path.join(context.extensionPath, 'node_modules', '@vscode', 'codicons'))
                ]
            }
        );

        // Store references
        activePanels.set('metricsAnalysis', panel);
        metricsAnalysisPanel.panel = panel;
        metricsAnalysisPanel.context = context;
        metricsAnalysisPanel.modelService = modelService;

        // Set the HTML content
        panel.webview.html = getMetricsAnalysisWebviewContent(panel.webview, context.extensionPath);

        // Handle dispose
        panel.onDidDispose(() => {
            activePanels.delete('metricsAnalysis');
            metricsAnalysisPanel.panel = null;
            metricsAnalysisPanel.context = null;
            metricsAnalysisPanel.modelService = null;
        });

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(async (message) => {
            console.log('Metrics analysis received message:', message);
            
            switch (message.command) {
                case 'getCurrentMetrics':
                    // Get current metrics data
                    const currentMetrics = getCurrentMetricsData(modelService);
                    panel.webview.postMessage({
                        command: 'currentMetricsData',
                        data: currentMetrics
                    });
                    break;
                
                case 'getHistoryMetrics':
                    // Get historical metrics data (placeholder for now)
                    const historyMetrics = getHistoryMetricsData();
                    panel.webview.postMessage({
                        command: 'historyMetricsData',
                        data: historyMetrics
                    });
                    break;
            }
        });
    });

    context.subscriptions.push(metricsAnalysisCommand);
}

/**
 * Gets current metrics data from the model
 */
function getCurrentMetricsData(modelService: ModelService): any[] {
    const metrics = [];
    
    // Data Object Count metric
    const dataObjectCount = modelService.getAllObjects().length;
    metrics.push({
        name: 'Data Object Count',
        value: dataObjectCount.toString()
    });
    
    // Add more metrics here as needed
    
    return metrics;
}

/**
 * Gets historical metrics data (placeholder)
 */
function getHistoryMetricsData(): any[] {
    // Placeholder for historical data
    return [];
}

/**
 * Creates the HTML content for the metrics analysis webview
 */
function getMetricsAnalysisWebviewContent(webview: vscode.Webview, extensionPath: string): string {
    // Get the local path to main script run in the webview
    const scriptPathOnDisk = vscode.Uri.file(path.join(extensionPath, 'src', 'webviews', 'metricsAnalysisView.js'));
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
    
    // Get the local path to codicons
    const codiconsPath = vscode.Uri.file(path.join(extensionPath, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css'));
    const codiconsUri = webview.asWebviewUri(codiconsPath);
    
    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${codiconsUri}" rel="stylesheet">
    <title>Analysis - Metrics</title>
    
    <style nonce="${nonce}">
        body {
            margin: 0;
            padding: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
        }
        
        .validation-header {
            margin-bottom: 20px;
        }
        
        .validation-header h2 {
            margin: 0 0 10px 0;
            color: var(--vscode-foreground);
            font-size: 24px;
        }
        
        .validation-header p {
            margin: 0;
            color: var(--vscode-descriptionForeground);
            font-size: 14px;
        }
        
        /* Tab styling following form details pattern */
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
        
        /* Filter section styling following user journey pattern */
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
        
        .filter-button-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 6px 14px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 13px;
        }
        
        .filter-button-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        /* Header actions */
        .header-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-bottom: 15px;
        }
        
        .icon-button {
            background: var(--vscode-toolbar-activeBackground);
            border: 1px solid var(--vscode-input-border);
            color: var(--vscode-foreground);
            padding: 6px 8px;
            border-radius: 3px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .icon-button:hover {
            background: var(--vscode-toolbar-hoverBackground);
            color: var(--vscode-foreground);
        }
        
        /* Table styling */
        .table-container {
            overflow-x: auto;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 3px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            background-color: var(--vscode-editor-background);
        }
        
        th, td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        th {
            background-color: var(--vscode-list-hoverBackground);
            font-weight: 600;
            cursor: pointer;
            user-select: none;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        th:hover {
            background-color: var(--vscode-list-activeSelectionBackground);
        }
        
        tr:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        
        .sort-indicator {
            margin-left: 5px;
            opacity: 0.5;
            font-size: 12px;
        }
        
        .sort-indicator.active {
            opacity: 1;
            color: var(--vscode-focusBorder);
        }
        
        /* Table footer */
        .table-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            margin-top: 10px;
            border-top: 1px solid var(--vscode-panel-border);
        }
        
        .table-footer-right {
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
        }
        
        .loading {
            text-align: center;
            padding: 40px 20px;
            color: var(--vscode-descriptionForeground);
        }
        
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: var(--vscode-descriptionForeground);
        }
        
        /* Utility classes for show/hide */
        .hidden {
            display: none !important;
        }
        
        .show-block {
            display: block !important;
        }
        
        .show-flex {
            display: flex !important;
        }
        
        /* Spinner overlay */
        .spinner-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.3);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid var(--vscode-panel-border);
            border-top: 4px solid var(--vscode-focusBorder);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="validation-header">
        <h2>Analysis - Metrics</h2>
        <p>Model metrics and measurement data with current and historical views</p>
    </div>
    
    <div class="tabs">
        <button class="tab active" data-tab="current">Current</button>
        <button class="tab" data-tab="history">History</button>
    </div>
    
    <div id="current-tab" class="tab-content active">
        <div class="filter-section">
            <div class="filter-header" onclick="toggleFilterSection()">
                <span class="codicon codicon-chevron-down" id="filterChevron"></span>
                <span>Filters</span>
            </div>
            <div class="filter-content" id="filterContent">
                <div class="filter-row">
                    <div class="filter-group">
                        <label>Metric Name:</label>
                        <input type="text" id="filterMetricName" placeholder="Filter by metric name...">
                    </div>
                    <div class="filter-group">
                        <label>Value:</label>
                        <input type="text" id="filterMetricValue" placeholder="Filter by value...">
                    </div>
                </div>
                <div class="filter-actions">
                    <button onclick="clearFilters()" class="filter-button-secondary">Clear All</button>
                </div>
            </div>
        </div>
        
        <div class="header-actions">
            <button id="exportButton" class="icon-button" title="Export to CSV">
                <i class="codicon codicon-cloud-download"></i>
                Export
            </button>
            <button id="refreshButton" class="icon-button" title="Refresh Data">
                <i class="codicon codicon-refresh"></i>
                Refresh
            </button>
        </div>
        
        <div id="current-loading" class="loading">Loading current metrics...</div>
        <div class="table-container hidden" id="current-table-container">
            <table id="current-metrics-table">
                <thead>
                    <tr>
                        <th data-column="name">Metric Name <span class="sort-indicator">▼</span></th>
                        <th data-column="value">Value <span class="sort-indicator">▼</span></th>
                    </tr>
                </thead>
                <tbody id="current-metrics-body">
                </tbody>
            </table>
        </div>
        
        <div class="table-footer">
            <div class="table-footer-left"></div>
            <div class="table-footer-right">
                <span id="current-record-info"></span>
            </div>
        </div>
    </div>
    
    <div id="history-tab" class="tab-content">
        <div id="history-loading" class="loading">Loading historical metrics...</div>
        <div class="table-container hidden" id="history-table-container">
            <table id="history-metrics-table">
                <thead>
                    <tr>
                        <th data-column="date">Date <span class="sort-indicator">▼</span></th>
                        <th data-column="name">Metric Name <span class="sort-indicator">▼</span></th>
                        <th data-column="value">Value <span class="sort-indicator">▼</span></th>
                    </tr>
                </thead>
                <tbody id="history-metrics-body">
                </tbody>
            </table>
        </div>
        
        <div class="table-footer">
            <div class="table-footer-left"></div>
            <div class="table-footer-right">
                <span id="history-record-info"></span>
            </div>
        </div>
    </div>
    
    <div id="spinner-overlay" class="spinner-overlay hidden">
        <div class="spinner"></div>
    </div>
    
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
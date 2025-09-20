// Description: Handles registration of data object size analysis view related commands.
// Created: September 19, 2025

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ModelService } from '../services/modelService';

// Track active panels to avoid duplicates
const activePanels = new Map<string, vscode.WebviewPanel>();

// Track panel reference for the data object size analysis view
const dataObjectSizeAnalysisPanel = {
    panel: null as vscode.WebviewPanel | null,
    context: null as vscode.ExtensionContext | null,
    modelService: null as ModelService | null
};

/**
 * Gets the reference to the data object size analysis panel if it's open
 */
export function getDataObjectSizeAnalysisPanel(): { 
    type: string; 
    context: vscode.ExtensionContext; 
    modelService: ModelService 
} | null {
    if (activePanels.has('dataObjectSizeAnalysis') && dataObjectSizeAnalysisPanel.context && dataObjectSizeAnalysisPanel.modelService) {
        return {
            type: 'dataObjectSizeAnalysis',
            context: dataObjectSizeAnalysisPanel.context,
            modelService: dataObjectSizeAnalysisPanel.modelService
        };
    }
    return null;
}

/**
 * Closes the data object size analysis panel if it's open
 */
export function closeDataObjectSizeAnalysisPanel(): void {
    console.log(`Closing data object size analysis panel if open`);
    const panel = activePanels.get('dataObjectSizeAnalysis');
    if (panel) {
        panel.dispose();
        activePanels.delete('dataObjectSizeAnalysis');
    }
    // Clean up panel reference
    dataObjectSizeAnalysisPanel.panel = null;
}

/**
 * Registers the data object size analysis command
 */
export function registerDataObjectSizeAnalysisCommands(context: vscode.ExtensionContext, modelService: ModelService) {
    
    // Register the show data object size analysis command
    const dataObjectSizeAnalysisCommand = vscode.commands.registerCommand('appdna.dataObjectSizeAnalysis', () => {
        console.log('Data Object Size Analysis command executed');
        
        // Check if we already have a data object size analysis panel open
        if (activePanels.has('dataObjectSizeAnalysis')) {
            // Focus the existing panel
            const existingPanel = activePanels.get('dataObjectSizeAnalysis');
            if (existingPanel) {
                existingPanel.reveal();
                return;
            }
        }
        
        // Create and show new panel
        const panel = vscode.window.createWebviewPanel(
            'dataObjectSizeAnalysis',
            'Data Object Size Analysis',
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
        activePanels.set('dataObjectSizeAnalysis', panel);
        dataObjectSizeAnalysisPanel.panel = panel;
        dataObjectSizeAnalysisPanel.context = context;
        dataObjectSizeAnalysisPanel.modelService = modelService;

        // Set the HTML content
        panel.webview.html = getDataObjectSizeAnalysisWebviewContent(panel.webview, context.extensionPath);

        // Handle dispose
        panel.onDidDispose(() => {
            activePanels.delete('dataObjectSizeAnalysis');
            dataObjectSizeAnalysisPanel.panel = null;
            dataObjectSizeAnalysisPanel.context = null;
            dataObjectSizeAnalysisPanel.modelService = null;
        });

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'getSummaryData':
                    try {
                        const summaryData = getSizeSummaryData(modelService);
                        panel.webview.postMessage({
                            command: 'summaryDataResponse',
                            data: summaryData
                        });
                    } catch (error) {
                        console.error('[ERROR] Data Object Size Analysis - Failed to get summary data:', error);
                        vscode.window.showErrorMessage(`Failed to get size summary data: ${error.message}`);
                    }
                    break;
                    
                case 'getDetailsData':
                    try {
                        const detailsData = getSizeDetailsData(modelService);
                        panel.webview.postMessage({
                            command: 'detailsDataResponse',
                            data: detailsData
                        });
                    } catch (error) {
                        console.error('[ERROR] Data Object Size Analysis - Failed to get details data:', error);
                        vscode.window.showErrorMessage(`Failed to get size details data: ${error.message}`);
                    }
                    break;
                    
                case 'exportToCSV':
                    try {
                        const exportData = message.data;
                        exportSizeDataToCSV(exportData, context);
                    } catch (error) {
                        console.error('[ERROR] Data Object Size Analysis - Failed to export CSV:', error);
                        vscode.window.showErrorMessage(`Failed to export CSV: ${error.message}`);
                    }
                    break;
                    
                case 'exportDetailsToCSV':
                    try {
                        const exportData = message.data;
                        exportDetailsDataToCSV(exportData, context);
                    } catch (error) {
                        console.error('[ERROR] Data Object Size Analysis - Failed to export details CSV:', error);
                        vscode.window.showErrorMessage(`Failed to export details CSV: ${error.message}`);
                    }
                    break;
                    
                case 'showError':
                    vscode.window.showErrorMessage(message.error);
                    break;
                    
                case 'generateSVG':
                    try {
                        const svgData = message.data;
                        saveTreemapSVG(svgData, context);
                    } catch (error) {
                        console.error('[ERROR] Data Object Size Analysis - Failed to save SVG:', error);
                        vscode.window.showErrorMessage(`Failed to save SVG: ${error.message}`);
                    }
                    break;
                    
                case 'generatePNG':
                    try {
                        const pngData = message.data;
                        savePNG(pngData, context);
                    } catch (error) {
                        console.error('[ERROR] Data Object Size Analysis - Failed to save PNG:', error);
                        vscode.window.showErrorMessage(`Failed to save PNG: ${error.message}`);
                    }
                    break;
            }
        });
    });

    context.subscriptions.push(dataObjectSizeAnalysisCommand);
}

/**
 * Gets summary data showing total size calculations for each data object
 */
function getSizeSummaryData(modelService: ModelService): any[] {
    const summaryData: any[] = [];
    
    try {
        if (!modelService || !modelService.isFileLoaded()) {
            console.log('No model service or file loaded');
            return summaryData;
        }
        
        const allObjects = modelService.getAllObjects();
        console.log('Found objects for size analysis:', allObjects.length);
        
        allObjects.forEach(dataObject => {
            if (!dataObject.name) {
                return;
            }
            
            console.log(`Calculating size for object: ${dataObject.name}`);
            
            let totalSizeBytes = 0;
            let propertyCount = 0;
            const sizeBreakdown: { [key: string]: number } = {};
            
            // Calculate size for each property
            if (dataObject.prop && Array.isArray(dataObject.prop)) {
                propertyCount = dataObject.prop.length;
                
                dataObject.prop.forEach((prop: any) => {
                    const propSize = calculatePropertySize(prop);
                    totalSizeBytes += propSize;
                    
                    // Track size by data type for breakdown
                    const dataType = prop.sqlServerDBDataType || 'unknown';
                    sizeBreakdown[dataType] = (sizeBreakdown[dataType] || 0) + propSize;
                });
            }
            
            // Convert bytes to more readable format
            const sizeInKB = totalSizeBytes / 1024;
            const sizeInMB = sizeInKB / 1024;
            
            console.log(`Object ${dataObject.name}: ${propertyCount} properties, ${totalSizeBytes} bytes (${sizeInKB.toFixed(2)} KB)`);
            
            summaryData.push({
                dataObjectName: dataObject.name,
                totalSizeBytes: totalSizeBytes,
                totalSizeKB: Math.round(sizeInKB * 100) / 100, // Round to 2 decimal places
                totalSizeMB: Math.round(sizeInMB * 100) / 100,
                propertyCount: propertyCount,
                sizeBreakdown: sizeBreakdown
            });
        });
        
        // Sort by total size (descending)
        summaryData.sort((a, b) => b.totalSizeBytes - a.totalSizeBytes);
        
    } catch (error) {
        console.error('Error getting size summary data:', error);
    }
    
    return summaryData;
}

/**
 * Gets detailed property-level size data for each property in all data objects
 */
function getSizeDetailsData(modelService: ModelService): any[] {
    const detailsData: any[] = [];
    
    try {
        if (!modelService || !modelService.isFileLoaded()) {
            console.log('No model service or file loaded');
            return detailsData;
        }
        
        const allObjects = modelService.getAllObjects();
        console.log('Found objects for detailed size analysis:', allObjects.length);
        
        allObjects.forEach(dataObject => {
            if (!dataObject.name) {
                return;
            }
            
            console.log(`Processing properties for object: ${dataObject.name}`);
            
            // Process each property
            if (dataObject.prop && Array.isArray(dataObject.prop)) {
                dataObject.prop.forEach((prop: any) => {
                    const propSize = calculatePropertySize(prop);
                    const dataType = prop.sqlServerDBDataType || 'unknown';
                    
                    detailsData.push({
                        dataObjectName: dataObject.name,
                        propName: prop.name || 'Unnamed Property',
                        sizeBytes: propSize,
                        dataType: dataType,
                        dataTypeSize: prop.sqlServerDBDataTypeSize || '',
                        description: prop.description || ''
                    });
                });
            }
        });
        
        // Sort by data object name, then by property name
        detailsData.sort((a, b) => {
            const objCompare = a.dataObjectName.localeCompare(b.dataObjectName);
            if (objCompare !== 0) { return objCompare; }
            return a.propName.localeCompare(b.propName);
        });
        
    } catch (error) {
        console.error('Error getting size details data:', error);
    }
    
    return detailsData;
}

/**
 * Calculates the storage size in bytes for a single property based on its SQL Server data type
 */
function calculatePropertySize(prop: any): number {
    const dataType = prop.sqlServerDBDataType?.toLowerCase();
    const dataSize = prop.sqlServerDBDataTypeSize;
    
    if (!dataType) {
        return 0; // Unknown type, assume no size
    }
    
    switch (dataType) {
        case 'text':
            return 10000; // As specified: text props count as 10,000 bytes
            
        case 'nvarchar':
            // Unicode string - 2 bytes per character, default 100 characters
            const nvarcharSize = dataSize ? parseInt(dataSize) : 100;
            return nvarcharSize * 2;
            
        case 'varchar':
            // ASCII string - 1 byte per character, default 100 characters
            const varcharSize = dataSize ? parseInt(dataSize) : 100;
            return varcharSize;
            
        case 'bit':
            return 1; // 1 bit, but minimum storage is 1 byte
            
        case 'datetime':
            return 8; // 8 bytes for datetime
            
        case 'date':
            return 3; // 3 bytes for date only
            
        case 'int':
            return 4; // 4 bytes for integer
            
        case 'bigint':
            return 8; // 8 bytes for big integer
            
        case 'uniqueidentifier':
            return 16; // 16 bytes for GUID
            
        case 'money':
            return 8; // 8 bytes for money
            
        case 'float':
            return 8; // 8 bytes for float (double precision)
            
        case 'decimal':
            // Decimal size varies by precision - approximate based on precision
            if (dataSize) {
                const precision = parseInt(dataSize.split(',')[0]) || 18;
                if (precision <= 9) { return 5; }
                if (precision <= 19) { return 9; }
                if (precision <= 28) { return 13; }
                return 17;
            }
            return 9; // Default for decimal(18,0)
            
        default:
            console.warn(`Unknown data type for size calculation: ${dataType}`);
            return 0;
    }
}

/**
 * Exports size data to CSV file
 */
async function exportSizeDataToCSV(data: any, context: vscode.ExtensionContext): Promise<void> {
    try {
        const items = data.items || [];
        if (items.length === 0) {
            vscode.window.showWarningMessage('No data to export.');
            return;
        }

        // Generate CSV content
        let csvContent = 'Data Object Name,Total Size (Bytes),Total Size (KB),Total Size (MB),Property Count\n';
        
        items.forEach((item: any) => {
            csvContent += `"${item.dataObjectName}",${item.totalSizeBytes},${item.totalSizeKB},${item.totalSizeMB},${item.propertyCount}\n`;
        });

        // Get save location from user
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const defaultFilename = `data-object-size-analysis-${timestamp}.csv`;
        
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(defaultFilename),
            filters: {
                'CSV Files': ['csv'],
                'All Files': ['*']
            }
        });

        if (saveUri) {
            // Write the file
            await vscode.workspace.fs.writeFile(saveUri, Buffer.from(csvContent, 'utf8'));
            vscode.window.showInformationMessage(`Size analysis data exported to ${saveUri.fsPath}`);
        }
    } catch (error) {
        console.error('Error exporting CSV:', error);
        vscode.window.showErrorMessage(`Failed to export CSV: ${error.message}`);
    }
}

/**
 * Exports detailed property-level size data to CSV file
 */
async function exportDetailsDataToCSV(data: any, context: vscode.ExtensionContext): Promise<void> {
    try {
        const items = data.items || [];
        if (items.length === 0) {
            vscode.window.showWarningMessage('No data to export.');
            return;
        }

        // Generate CSV content
        let csvContent = 'Data Object Name,Property Name,Size (Bytes),Data Type,Data Type Size,Description\n';
        
        items.forEach((item: any) => {
            csvContent += `"${item.dataObjectName}","${item.propName}",${item.sizeBytes},"${item.dataType}","${item.dataTypeSize || ''}","${(item.description || '').replace(/"/g, '""')}"\n`;
        });

        // Get save location from user
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const defaultFilename = `data-object-size-details-${timestamp}.csv`;
        
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(defaultFilename),
            filters: {
                'CSV Files': ['csv'],
                'All Files': ['*']
            }
        });

        if (saveUri) {
            // Write the file
            await vscode.workspace.fs.writeFile(saveUri, Buffer.from(csvContent, 'utf8'));
            vscode.window.showInformationMessage(`Size details data exported to ${saveUri.fsPath}`);
        }
    } catch (error) {
        console.error('Error exporting details CSV:', error);
        vscode.window.showErrorMessage(`Failed to export details CSV: ${error.message}`);
    }
}

/**
 * Saves treemap SVG file
 */
async function saveTreemapSVG(data: any, context: vscode.ExtensionContext): Promise<void> {
    try {
        const { svgString, filename } = data;
        
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(filename || 'data-object-size-treemap.svg'),
            filters: {
                'SVG Files': ['svg'],
                'All Files': ['*']
            }
        });

        if (saveUri) {
            await vscode.workspace.fs.writeFile(saveUri, Buffer.from(svgString, 'utf8'));
            vscode.window.showInformationMessage(`Treemap SVG saved to ${saveUri.fsPath}`);
        }
    } catch (error) {
        console.error('Error saving SVG:', error);
        vscode.window.showErrorMessage(`Failed to save SVG: ${error.message}`);
    }
}

/**
 * Saves PNG file
 */
async function savePNG(data: any, context: vscode.ExtensionContext): Promise<void> {
    try {
        const { pngDataUrl, filename } = data;
        
        // Convert data URL to buffer
        const base64Data = pngDataUrl.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(filename || 'data-object-size-chart.png'),
            filters: {
                'PNG Files': ['png'],
                'All Files': ['*']
            }
        });

        if (saveUri) {
            await vscode.workspace.fs.writeFile(saveUri, buffer);
            vscode.window.showInformationMessage(`Chart PNG saved to ${saveUri.fsPath}`);
        }
    } catch (error) {
        console.error('Error saving PNG:', error);
        vscode.window.showErrorMessage(`Failed to save PNG: ${error.message}`);
    }
}

/**
 * Creates the HTML content for the data object size analysis webview
 */
function getDataObjectSizeAnalysisWebviewContent(webview: vscode.Webview, extensionPath: string): string {
    // Get URIs for the codicons
    const codiconsUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css')));
    
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Object Size Analysis</title>
    <link href="${codiconsUri}" rel="stylesheet">
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-foreground);
        }
        
        .container {
            padding: 15px;
        }
        
        .tabs {
            display: flex;
            border-bottom: 1px solid var(--vscode-panel-border);
            margin-bottom: 15px;
        }
        
        .tab {
            padding: 10px 20px;
            cursor: pointer;
            border: none;
            background: none;
            color: var(--vscode-foreground);
            border-bottom: 2px solid transparent;
        }
        
        .tab.active {
            border-bottom-color: var(--vscode-focusBorder);
            background-color: var(--vscode-tab-activeBackground);
        }
        
        .tab:hover:not(.active) {
            background-color: var(--vscode-tab-hoverBackground);
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        /* Summary tab styles */
        .filter-section {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            margin-bottom: 15px;
            overflow: hidden;
        }
        
        .filter-header {
            padding: 10px 15px;
            background: var(--vscode-list-activeSelectionBackground);
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
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
            align-items: center;
        }
        
        .filter-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .filter-group label {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
        
        .filter-group input {
            padding: 6px;
            border: 1px solid var(--vscode-input-border);
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 2px;
            min-width: 200px;
        }
        
        .filter-actions {
            display: flex;
            gap: 10px;
        }
        
        .filter-button-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 6px 12px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .header-actions {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .icon-button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: 1px solid var(--vscode-button-border);
            border-radius: 2px;
            padding: 6px 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
        }
        
        .icon-button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground);
        }
        
        .hidden {
            display: none !important;
        }
        
        /* Table styles */
        .table-container {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            overflow: hidden;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            background: var(--vscode-editor-background);
        }
        
        th, td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        th {
            background: var(--vscode-list-activeSelectionBackground);
            font-weight: 600;
            cursor: pointer;
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
        
        /* Treemap styles */
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
        
        .svg-export-btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: 1px solid var(--vscode-button-border);
            border-radius: 2px;
            padding: 6px 12px;
            font-size: 13px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
        }
        
        .svg-export-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .svg-export-btn .codicon {
            font-size: 14px;
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
        
        .legend-color.large-size {
            background-color: #d73a49;
        }
        
        .legend-color.medium-size {
            background-color: #f66a0a;
        }
        
        .legend-color.small-size {
            background-color: #28a745;
        }
        
        .legend-color.tiny-size {
            background-color: #6c757d;
        }
        
        /* Treemap rectangle styles */
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
    </style>
</head>
<body>
    <div class="container">
        <h1>Data Object Size Analysis</h1>
        
        <div class="tabs">
            <button class="tab active" data-tab="summary">Summary</button>
            <button class="tab" data-tab="details">Details</button>
            <button class="tab" data-tab="treemap">Size Visualization</button>
        </div>
        
        <div id="summary-tab" class="tab-content active">
            <div class="filter-section">
                <div class="filter-header" data-action="toggle-filter">
                    <span class="codicon codicon-chevron-down" id="filterChevron"></span>
                    <span>Filters</span>
                </div>
                <div class="filter-content" id="filterContent">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label>Data Object Name:</label>
                            <input type="text" id="summaryFilter" placeholder="Filter by data object name...">
                        </div>
                    </div>
                    <div class="filter-actions">
                        <button data-action="clear-filters" class="filter-button-secondary">Clear All</button>
                    </div>
                </div>
            </div>
            
            <div class="header-actions">
                <button id="exportSummaryBtn" class="icon-button" title="Export to CSV">
                    <i class="codicon codicon-cloud-download"></i>
                    Export CSV
                </button>
                <button id="refreshSummaryButton" class="icon-button" title="Refresh Data">
                    <i class="codicon codicon-refresh"></i>
                    Refresh
                </button>
            </div>
            
            <div id="summary-loading" class="loading">Loading size analysis...</div>
            <div class="table-container hidden" id="summary-table-container">
                <table id="summary-table">
                    <thead>
                        <tr>
                            <th data-sort-column="0" data-table="summary-table">Data Object Name <span class="sort-indicator">▼</span></th>
                            <th data-sort-column="1" data-table="summary-table">Total Size (Bytes) <span class="sort-indicator">▼</span></th>
                            <th data-sort-column="2" data-table="summary-table">Total Size (KB) <span class="sort-indicator">▼</span></th>
                            <th data-sort-column="3" data-table="summary-table">Total Size (MB) <span class="sort-indicator">▼</span></th>
                            <th data-sort-column="4" data-table="summary-table">Property Count <span class="sort-indicator">▼</span></th>
                        </tr>
                    </thead>
                    <tbody id="summaryTableBody">
                    </tbody>
                </table>
            </div>
            
            <div class="table-footer">
                <div class="table-footer-left"></div>
                <div class="table-footer-right">
                    <span id="summary-record-info"></span>
                </div>
            </div>
        </div>
        
        <div id="details-tab" class="tab-content">
            <div class="filter-section">
                <div class="filter-header" data-action="toggle-details-filter">
                    <span class="codicon codicon-chevron-down" id="detailsFilterChevron"></span>
                    <span>Filters</span>
                </div>
                <div class="filter-content" id="detailsFilterContent">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label>Data Object Name:</label>
                            <input type="text" id="detailsDataObjectFilter" placeholder="Filter by data object name...">
                        </div>
                        <div class="filter-group">
                            <label>Property Name:</label>
                            <input type="text" id="detailsPropertyFilter" placeholder="Filter by property name...">
                        </div>
                        <div class="filter-group">
                            <label>Data Type:</label>
                            <input type="text" id="detailsDataTypeFilter" placeholder="Filter by data type...">
                        </div>
                    </div>
                    <div class="filter-actions">
                        <button data-action="clear-details-filters" class="filter-button-secondary">Clear All</button>
                    </div>
                </div>
            </div>
            
            <div class="header-actions">
                <button id="exportDetailsBtn" class="icon-button" title="Export to CSV">
                    <i class="codicon codicon-cloud-download"></i>
                    Export CSV
                </button>
                <button id="refreshDetailsButton" class="icon-button" title="Refresh Data">
                    <i class="codicon codicon-refresh"></i>
                    Refresh
                </button>
            </div>
            
            <div id="details-loading" class="loading">Loading property details...</div>
            <div class="table-container hidden" id="details-table-container">
                <table id="details-table">
                    <thead>
                        <tr>
                            <th data-sort-column="0" data-table="details-table">Data Object Name <span class="sort-indicator">▼</span></th>
                            <th data-sort-column="1" data-table="details-table">Property Name <span class="sort-indicator">▼</span></th>
                            <th data-sort-column="2" data-table="details-table">Size (Bytes) <span class="sort-indicator">▼</span></th>
                            <th data-sort-column="3" data-table="details-table">Data Type <span class="sort-indicator">▼</span></th>
                            <th data-sort-column="4" data-table="details-table">Data Type Size <span class="sort-indicator">▼</span></th>
                        </tr>
                    </thead>
                    <tbody id="detailsTableBody">
                    </tbody>
                </table>
            </div>
            
            <div class="table-footer">
                <div class="table-footer-left"></div>
                <div class="table-footer-right">
                    <span id="details-record-info"></span>
                </div>
            </div>
        </div>
        
        <div id="treemap-tab" class="tab-content">
            <div class="treemap-container">
                <div class="treemap-header">
                    <div class="treemap-header-content">
                        <div class="treemap-title">
                            <h3>Data Object Size Proportions</h3>
                            <p>Size represents total storage requirement in bytes. Hover for details.</p>
                        </div>
                        <div class="treemap-actions">
                            <button id="generateTreemapPngBtn" class="svg-export-btn">
                                <span class="codicon codicon-device-camera"></span>
                                Generate PNG
                            </button>
                        </div>
                    </div>
                </div>
                <div id="treemap-loading" class="loading">Loading treemap...</div>
                <div id="treemap-visualization" class="treemap-viz hidden"></div>
                <div class="treemap-legend">
                    <div class="legend-item">
                        <span class="legend-color large-size"></span>
                        <span>Large Size (>10MB)</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color medium-size"></span>
                        <span>Medium Size (1MB-10MB)</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color small-size"></span>
                        <span>Small Size (100KB-1MB)</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color tiny-size"></span>
                        <span>Tiny Size (<100KB)</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script src="${webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'src', 'webviews', 'dataObjectSizeAnalysisView.js')))}"></script>
</body>
</html>`;
}
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
        panel.webview.onDidReceiveMessage(async message => {
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
                    console.log("[Extension] Data Object Size CSV export requested");
                    try {
                        const csvContent = generateSizeSummaryCSV(message.data.items);
                        const now = new Date();
                        const pad = (n: number) => n.toString().padStart(2, '0');
                        const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
                        const filename = `data-object-size-analysis-${timestamp}.csv`;
                        
                        panel.webview.postMessage({
                            command: 'csvExportReady',
                            csvContent: csvContent,
                            filename: filename,
                            success: true
                        });
                    } catch (error) {
                        console.error('[Extension] Error exporting data object size CSV:', error);
                        panel.webview.postMessage({
                            command: 'csvExportReady',
                            success: false,
                            error: error.message
                        });
                    }
                    break;
                    
                case 'exportDetailsToCSV':
                    console.log("[Extension] Data Object Size Details CSV export requested");
                    try {
                        const csvContent = generateSizeDetailsCSV(message.data.items);
                        const now = new Date();
                        const pad = (n: number) => n.toString().padStart(2, '0');
                        const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
                        const filename = `data-object-size-details-${timestamp}.csv`;
                        
                        panel.webview.postMessage({
                            command: 'csvExportReady',
                            csvContent: csvContent,
                            filename: filename,
                            success: true
                        });
                    } catch (error) {
                        console.error('[Extension] Error exporting data object size details CSV:', error);
                        panel.webview.postMessage({
                            command: 'csvExportReady',
                            success: false,
                            error: error.message
                        });
                    }
                    break;
                    
                case 'saveCsvToWorkspace':
                    try {
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
                    
                case 'savePngToWorkspace':
                    try {
                        const workspaceFolders = vscode.workspace.workspaceFolders;
                        if (!workspaceFolders || workspaceFolders.length === 0) {
                            vscode.window.showErrorMessage('No workspace folder is open');
                            panel.webview.postMessage({
                                command: 'pngSaveComplete',
                                success: false,
                                error: 'No workspace folder is open'
                            });
                            return;
                        }
                        const workspaceRoot = workspaceFolders[0].uri.fsPath;
                        const filePath = path.join(workspaceRoot, message.data.filename);
                        const buffer = Buffer.from(message.data.base64.replace(/^data:image\/png;base64,/, ''), 'base64');
                        fs.writeFileSync(filePath, buffer);
                        vscode.window.showInformationMessage(`PNG file saved to workspace: ${message.data.filename}`);
                        panel.webview.postMessage({
                            command: 'pngSaveComplete',
                            success: true,
                            filePath: message.data.filename,
                            type: message.data.type
                        });
                        const fileUri = vscode.Uri.file(filePath);
                        vscode.commands.executeCommand('vscode.open', fileUri);
                    } catch (error) {
                        console.error('[ERROR] Data Object Size Analysis - Error saving PNG to workspace:', error);
                        vscode.window.showErrorMessage(`Failed to save PNG: ${error.message}`);
                        panel.webview.postMessage({
                            command: 'pngSaveComplete',
                            success: false,
                            error: error.message
                        });
                    }
                    break;
                    
                case 'viewDetails':
                    // Handle opening detail view for the data object
                    try {
                        const { itemType, itemName } = message.data;
                        
                        if (itemType === 'dataObject') {
                            // Open data object details
                            const mockTreeItem = {
                                label: itemName,
                                contextValue: 'dataObjectItem',
                                tooltip: `${itemName}`
                            };
                            const { showObjectDetails } = require('../webviews/objects/objectDetailsView');
                            showObjectDetails(mockTreeItem, modelService, dataObjectSizeAnalysisPanel.context);
                        }
                    } catch (error) {
                        console.error('[ERROR] Data Object Size Analysis - Failed to open details:', error);
                        vscode.window.showErrorMessage(`Failed to open details: ${error.message}`);
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
                
                dataObject.prop.forEach((prop: any, index: number) => {
                    const propSize = calculatePropertySize(prop);
                    if (isNaN(propSize)) {
                        console.warn(`Object ${dataObject.name}, property ${index} (${prop.name}) returned NaN size. DataType: ${prop.sqlServerDBDataType}, Size: ${prop.sqlServerDBDataTypeSize}`);
                    }
                    totalSizeBytes += propSize;
                    
                    // Track size by data type for breakdown
                    const dataType = prop.sqlServerDBDataType || 'unknown';
                    sizeBreakdown[dataType] = (sizeBreakdown[dataType] || 0) + propSize;
                });
            } else {
                console.log(`Object ${dataObject.name} has no properties or prop is not an array`);
            }
            
            // Convert bytes to more readable format
            const sizeInKB = totalSizeBytes / 1024;
            const sizeInMB = sizeInKB / 1024;
            
            console.log(`Object ${dataObject.name}: ${propertyCount} properties, ${totalSizeBytes} bytes (${sizeInKB.toFixed(2)} KB)`);
            
            // Ensure all values are valid numbers
            const safeTotalSizeBytes = isNaN(totalSizeBytes) ? 0 : totalSizeBytes;
            const safeSizeInKB = isNaN(sizeInKB) ? 0 : sizeInKB;
            const safeSizeInMB = isNaN(sizeInMB) ? 0 : sizeInMB;
            const safePropertyCount = isNaN(propertyCount) ? 0 : propertyCount;
            
            if (safeTotalSizeBytes !== totalSizeBytes) {
                console.warn(`Object ${dataObject.name} had invalid totalSizeBytes (${totalSizeBytes}), using 0`);
            }
            
            summaryData.push({
                dataObjectName: dataObject.name,
                totalSizeBytes: safeTotalSizeBytes,
                totalSizeKB: Math.round(safeSizeInKB * 100) / 100, // Round to 2 decimal places
                totalSizeMB: Math.round(safeSizeInMB * 100) / 100,
                propertyCount: safePropertyCount,
                sizeBreakdown: sizeBreakdown
            });
        });
        
        // Let frontend handle sorting - no default sort applied here
        
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
                    
                    // Ensure all values are safe
                    const safePropSize = isNaN(propSize) ? 0 : propSize;
                    
                    if (safePropSize !== propSize) {
                        console.warn(`Object ${dataObject.name}, property ${prop.name} had invalid size (${propSize}), using 0`);
                    }
                    
                    detailsData.push({
                        dataObjectName: dataObject.name,
                        propName: prop.name || 'Unnamed Property',
                        sizeBytes: safePropSize,
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
            return 20000; // As specified: text props count as 20,000 bytes
            
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
 * Generates CSV content for size summary data
 */
function generateSizeSummaryCSV(items: any[]): string {
    if (!items || items.length === 0) {
        throw new Error('No data to export');
    }

    let csvContent = 'Data Object Name,Total Size (Bytes),Total Size (KB),Total Size (MB),Property Count\n';
    
    items.forEach((item: any) => {
        csvContent += `"${item.dataObjectName}",${item.totalSizeBytes},${item.totalSizeKB},${item.totalSizeMB},${item.propertyCount}\n`;
    });

    return csvContent;
}

/**
 * Generates CSV content for size details data
 */
function generateSizeDetailsCSV(items: any[]): string {
    if (!items || items.length === 0) {
        throw new Error('No data to export');
    }

    let csvContent = 'Data Object Name,Property Name,Size (Bytes),Data Type,Data Type Size\n';
    
    items.forEach((item: any) => {
        csvContent += `"${item.dataObjectName}","${item.propName}",${item.sizeBytes},"${item.dataType}","${item.dataTypeSize || ''}"\n`;
    });

    return csvContent;
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
        let csvContent = 'Data Object Name,Property Name,Size (Bytes),Data Type,Data Type Size\n';
        
        items.forEach((item: any) => {
            csvContent += `"${item.dataObjectName}","${item.propName}",${item.sizeBytes},"${item.dataType}","${item.dataTypeSize || ''}"\n`;
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
        
        .tab:hover:not(.active) {
            background-color: var(--vscode-tab-hoverBackground);
        }
        
        /* Tab content */
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
        
        .filter-group input {
            padding: 4px 8px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 3px;
            font-size: var(--vscode-font-size);
            font-family: var(--vscode-font-family);
        }
        
        .filter-group input:focus {
            outline: 1px solid var(--vscode-focusBorder);
            border-color: var(--vscode-focusBorder);
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
            padding: 6px 12px;
            cursor: pointer;
            border-radius: 2px;
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
            background: none;
            border: none;
            color: var(--vscode-foreground);
            padding: 5px;
            border-radius: 3px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }
        
        .icon-button:hover {
            background: var(--vscode-toolbar-hoverBackground);
            color: var(--vscode-foreground);
        }
        
        .icon-button:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: 2px;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground);
        }
        
        .hidden {
            display: none !important;
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
        
        .svg-export-btn:active {
            background: var(--vscode-button-activeBackground);
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
        
        /* Action buttons in table */
        .action-cell {
            text-align: center;
            width: 140px;
        }
        
        .edit-data-object-btn {
            background: transparent;
            border: none;
            color: var(--vscode-foreground);
            cursor: pointer;
            padding: 6px;
            border-radius: 2px;
            font-size: 13px;
            margin-right: 8px;
            transition: background 0.15s;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        
        .edit-data-object-btn:hover {
            background: var(--vscode-toolbar-hoverBackground);
        }
        
        .edit-data-object-btn:active {
            background: var(--vscode-toolbar-activeBackground);
            transform: scale(0.95);
        }
        
        /* View Details button styling to match filter button */
        .view-details-btn {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 6px 12px;
            cursor: pointer;
            border-radius: 2px;
            font-size: 13px;
        }
        
        .view-details-btn:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
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
    <div class="container">
        <h1>Data Object Size Analysis</h1>
        
        <div class="tabs">
            <button class="tab active" data-tab="summary">Summary</button>
            <button class="tab" data-tab="details">Detail</button>
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
                </button>
                <button id="refreshSummaryButton" class="icon-button" title="Refresh Data">
                    <i class="codicon codicon-refresh"></i>
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
                            <th>Actions</th>
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
                </button>
                <button id="refreshDetailsButton" class="icon-button" title="Refresh Data">
                    <i class="codicon codicon-refresh"></i>
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
                            <button id="refreshTreemapButton" class="icon-button" title="Refresh Data">
                                <i class="codicon codicon-refresh"></i>
                            </button>
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
                        <span>Large Size (>100KB)</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color medium-size"></span>
                        <span>Medium Size (10KB-100KB)</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color small-size"></span>
                        <span>Small Size (1KB-10KB)</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color tiny-size"></span>
                        <span>Tiny Size (<1KB)</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div id="spinner-overlay" class="spinner-overlay hidden">
        <div class="spinner"></div>
    </div>
    
    <script src="${webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'src', 'webviews', 'dataObjectSizeAnalysisView.js')))}"></script>
</body>
</html>`;
}
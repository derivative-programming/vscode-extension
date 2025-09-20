// Description: Handles registration of database size forecast view related commands.
// Created: September 20, 2025

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ModelService } from '../services/modelService';

// Track active panels to avoid duplicates
const activePanels = new Map<string, vscode.WebviewPanel>();

// Track panel reference for the database size forecast view
const databaseSizeForecastPanel = {
    panel: null as vscode.WebviewPanel | null,
    context: null as vscode.ExtensionContext | null,
    modelService: null as ModelService | null
};

/**
 * Gets the reference to the database size forecast panel if it's open
 */
export function getDatabaseSizeForecastPanel(): { 
    type: string; 
    context: vscode.ExtensionContext; 
    modelService: ModelService 
} | null {
    if (activePanels.has('databaseSizeForecast') && databaseSizeForecastPanel.context && databaseSizeForecastPanel.modelService) {
        return {
            type: 'databaseSizeForecast',
            context: databaseSizeForecastPanel.context,
            modelService: databaseSizeForecastPanel.modelService
        };
    }
    return null;
}

/**
 * Closes the database size forecast panel if it's open
 */
export function closeDatabaseSizeForecastPanel(): void {
    console.log(`Closing database size forecast panel if open`);
    const panel = activePanels.get('databaseSizeForecast');
    if (panel) {
        panel.dispose();
        activePanels.delete('databaseSizeForecast');
    }
    // Clean up panel reference
    databaseSizeForecastPanel.panel = null;
}

/**
 * Registers the database size forecast command
 */
export function registerDatabaseSizeForecastCommands(context: vscode.ExtensionContext, modelService: ModelService) {
    
    // Register the show database size forecast command
    const databaseSizeForecastCommand = vscode.commands.registerCommand('appdna.databaseSizeForecast', () => {
        console.log('Database Size Forecast command executed');
        
        // Check if we already have a database size forecast panel open
        if (activePanels.has('databaseSizeForecast')) {
            // Focus the existing panel
            const existingPanel = activePanels.get('databaseSizeForecast');
            if (existingPanel) {
                existingPanel.reveal();
                return;
            }
        }
        
        // Create and show new panel
        const panel = vscode.window.createWebviewPanel(
            'databaseSizeForecast',
            'Database Size Forecast',
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
        activePanels.set('databaseSizeForecast', panel);
        databaseSizeForecastPanel.panel = panel;
        databaseSizeForecastPanel.context = context;
        databaseSizeForecastPanel.modelService = modelService;

        // Set the HTML content
        panel.webview.html = getDatabaseSizeForecastWebviewContent(panel.webview, context.extensionPath);

        // Handle dispose
        panel.onDidDispose(() => {
            activePanels.delete('databaseSizeForecast');
            databaseSizeForecastPanel.panel = null;
            databaseSizeForecastPanel.context = null;
            databaseSizeForecastPanel.modelService = null;
        });

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'loadConfig':
                        handleLoadConfig(panel);
                        break;
                    case 'saveConfig':
                        handleSaveConfig(panel, message.data);
                        break;
                    case 'calculateForecast':
                        handleCalculateForecast(panel);
                        break;
                    case 'loadForecast':
                        handleLoadForecast(panel);
                        break;
                    case 'refreshData':
                        handleRefreshData(panel);
                        break;
                }
            },
            undefined,
            context.subscriptions
        );

        // Send initial data
        setTimeout(() => {
            handleLoadConfig(panel);
        }, 100);
    });

    context.subscriptions.push(databaseSizeForecastCommand);
}

/**
 * Handles loading configuration data
 */
function handleLoadConfig(panel: vscode.WebviewPanel) {
    try {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            panel.webview.postMessage({
                command: 'configLoaded',
                data: { config: [], dataObjects: [] }
            });
            return;
        }

        // Load config file if it exists
        const configPath = path.join(workspaceRoot, 'app-config-database-size-forecast-config.json');
        let config = [];
        if (fs.existsSync(configPath)) {
            const configContent = fs.readFileSync(configPath, 'utf8');
            config = JSON.parse(configContent);
        }

        // Get data objects from model service and calculate their sizes
        const panelInfo = getDatabaseSizeForecastPanel();
        if (panelInfo && panelInfo.modelService) {
            const dataObjects = panelInfo.modelService.getAllObjects();
            
            // Calculate size for each data object using the same logic as data object size analysis
            const dataObjectsWithSizes = dataObjects.map(obj => {
                const calculatedSize = calculateDataObjectSizeInKB(obj);
                
                // Find existing config for this object
                const existingConfig = config.find((c: any) => c.dataObjectName === obj.name);
                
                return {
                    name: obj.name,
                    calculatedSizeKB: calculatedSize,
                    parentObjectName: obj.parentObjectName || null,
                    properties: obj.prop || [],
                    // Include existing config values if they exist
                    configuredSizeKB: existingConfig?.dataSizeKb || calculatedSize,
                    expectedInstances: existingConfig?.expectedInstances || 10,
                    growthPercentage: existingConfig?.growthPercentage || 0.0
                };
            });
            
            panel.webview.postMessage({
                command: 'configLoaded',
                data: { 
                    config: config,
                    dataObjects: dataObjectsWithSizes
                }
            });
        }
    } catch (error) {
        console.error('Error loading config:', error);
        panel.webview.postMessage({
            command: 'error',
            data: { message: 'Failed to load configuration data.' }
        });
    }
}

/**
 * Handles saving configuration data
 */
function handleSaveConfig(panel: vscode.WebviewPanel, configData: any[]) {
    try {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            panel.webview.postMessage({
                command: 'error',
                data: { message: 'No workspace folder found.' }
            });
            return;
        }

        const configPath = path.join(workspaceRoot, 'app-config-database-size-forecast-config.json');
        fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
        
        panel.webview.postMessage({
            command: 'configSaved',
            data: { message: 'Configuration saved successfully.' }
        });
    } catch (error) {
        console.error('Error saving config:', error);
        panel.webview.postMessage({
            command: 'error',
            data: { message: 'Failed to save configuration data.' }
        });
    }
}

/**
 * Handles calculating forecast data
 */
function handleCalculateForecast(panel: vscode.WebviewPanel) {
    try {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            panel.webview.postMessage({
                command: 'error',
                data: { message: 'No workspace folder found.' }
            });
            return;
        }

        // Load config
        const configPath = path.join(workspaceRoot, 'app-config-database-size-forecast-config.json');
        if (!fs.existsSync(configPath)) {
            panel.webview.postMessage({
                command: 'error',
                data: { message: 'Configuration file not found. Please save configuration first.' }
            });
            return;
        }

        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);

        // Calculate forecast for next 5 years (60 months)
        const forecast = calculateForecastData(config);

        // Save forecast
        const forecastPath = path.join(workspaceRoot, 'app-config-database-size-forecast.json');
        fs.writeFileSync(forecastPath, JSON.stringify(forecast, null, 2));

        panel.webview.postMessage({
            command: 'forecastCalculated',
            data: { 
                message: 'Forecast calculated and saved successfully.',
                forecast: forecast
            }
        });
    } catch (error) {
        console.error('Error calculating forecast:', error);
        panel.webview.postMessage({
            command: 'error',
            data: { message: 'Failed to calculate forecast data.' }
        });
    }
}

/**
 * Handles loading forecast data
 */
function handleLoadForecast(panel: vscode.WebviewPanel) {
    try {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            panel.webview.postMessage({
                command: 'forecastLoaded',
                data: { forecast: null }
            });
            return;
        }

        const forecastPath = path.join(workspaceRoot, 'app-config-database-size-forecast.json');
        let forecast = null;
        if (fs.existsSync(forecastPath)) {
            const forecastContent = fs.readFileSync(forecastPath, 'utf8');
            forecast = JSON.parse(forecastContent);
        }

        panel.webview.postMessage({
            command: 'forecastLoaded',
            data: { forecast: forecast }
        });
    } catch (error) {
        console.error('Error loading forecast:', error);
        panel.webview.postMessage({
            command: 'error',
            data: { message: 'Failed to load forecast data.' }
        });
    }
}

/**
 * Handles refreshing all data
 */
function handleRefreshData(panel: vscode.WebviewPanel) {
    handleLoadConfig(panel);
    handleLoadForecast(panel);
}

/**
 * Calculate forecast data based on configuration
 */
function calculateForecastData(config: any[]) {
    const months = [];
    const currentDate = new Date();
    
    // Generate monthly data for next 5 years (60 months)
    for (let month = 0; month < 60; month++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + month, 1);
        const monthData = {
            month: date.toISOString().substring(0, 7), // YYYY-MM format
            totalSize: 0,
            dataObjects: {} as any
        };
        
        config.forEach(item => {
            if (item.dataObjectName && item.dataSizeKb && item.expectedInstances && item.growthPercentage !== undefined) {
                // Calculate growth multiplier
                const growthMultiplier = Math.pow(1 + (item.growthPercentage / 100), month);
                
                // Calculate number of instances for this month
                const instances = Math.round(item.expectedInstances * growthMultiplier);
                
                // Calculate total size for this data object
                const objectSize = instances * item.dataSizeKb;
                
                monthData.dataObjects[item.dataObjectName] = {
                    instances: instances,
                    sizeKb: objectSize,
                    sizeMb: Math.round(objectSize / 1024 * 100) / 100,
                    sizeGb: Math.round(objectSize / (1024 * 1024) * 100) / 100
                };
                
                monthData.totalSize += objectSize;
            }
        });
        
        // Convert total size to different units
        monthData.totalSize = Math.round(monthData.totalSize * 100) / 100; // Round to 2 decimal places
        
        months.push(monthData);
    }
    
    return {
        generatedAt: new Date().toISOString(),
        config: config,
        months: months,
        summary: {
            totalMonths: 60,
            initialSizeKb: months[0]?.totalSize || 0,
            finalSizeKb: months[59]?.totalSize || 0,
            growthFactor: months[0]?.totalSize > 0 ? (months[59]?.totalSize || 0) / months[0].totalSize : 0
        }
    };
}

/**
 * Generates the HTML content for the database size forecast webview
 */
function getDatabaseSizeForecastWebviewContent(webview: vscode.Webview, extensionPath: string): string {
    const scriptPath = vscode.Uri.file(path.join(extensionPath, 'src', 'webviews', 'databaseSizeForecastView.js'));
    const scriptUri = webview.asWebviewUri(scriptPath);
    
    const codiconsPath = vscode.Uri.file(path.join(extensionPath, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css'));
    const codiconsUri = webview.asWebviewUri(codiconsPath);

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Database Size Forecast</title>
        <link href="${codiconsUri}" rel="stylesheet" />
        <style>
            body {
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                margin: 0;
                padding: 20px;
                line-height: 1.5;
            }
            .container {
                max-width: 100%;
                margin: 0 auto;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 1px solid var(--vscode-panel-border);
            }
            .tabs {
                display: flex;
                margin-bottom: 20px;
                border-bottom: 1px solid var(--vscode-panel-border);
            }
            .tab {
                padding: 10px 20px;
                cursor: pointer;
                border: none;
                background: none;
                color: var(--vscode-foreground);
                border-bottom: 2px solid transparent;
                font-size: var(--vscode-font-size);
            }
            .tab.active {
                border-bottom-color: var(--vscode-focusBorder);
                font-weight: bold;
            }
            .tab:hover {
                background-color: var(--vscode-toolbar-hoverBackground);
            }
            .tab-content {
                display: none;
            }
            .tab-content.active {
                display: block;
            }
            .button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 16px;
                cursor: pointer;
                border-radius: 2px;
                font-size: var(--vscode-font-size);
                margin-right: 10px;
                margin-bottom: 10px;
            }
            .button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            .button.secondary {
                background-color: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
            }
            .button.secondary:hover {
                background-color: var(--vscode-button-secondaryHoverBackground);
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                background-color: var(--vscode-editor-background);
            }
            th, td {
                padding: 8px 12px;
                text-align: left;
                border-bottom: 1px solid var(--vscode-panel-border);
            }
            th {
                background-color: var(--vscode-editor-inactiveSelectionBackground);
                font-weight: bold;
                position: relative;
            }
            .sort-icon {
                display: inline-block;
                margin-left: 5px;
                font-size: 0.8em;
                color: var(--vscode-descriptionForeground);
            }
            .sort-icon:after {
                content: '↕';
            }
            .sort-icon.asc:after {
                content: '↑';
            }
            .sort-icon.desc:after {
                content: '↓';
            }
            tr:hover {
                background-color: var(--vscode-list-hoverBackground);
            }
            input, select {
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                padding: 4px 8px;
                border-radius: 2px;
                font-size: var(--vscode-font-size);
                width: 100%;
                box-sizing: border-box;
            }
            input:focus, select:focus {
                outline: 1px solid var(--vscode-focusBorder);
            }
            .error {
                color: var(--vscode-errorForeground);
                background-color: var(--vscode-inputValidation-errorBackground);
                border: 1px solid var(--vscode-inputValidation-errorBorder);
                padding: 10px;
                border-radius: 2px;
                margin: 10px 0;
            }
            .success {
                color: var(--vscode-notificationsInfoIcon-foreground);
                background-color: var(--vscode-inputValidation-infoBackground);
                border: 1px solid var(--vscode-inputValidation-infoBorder);
                padding: 10px;
                border-radius: 2px;
                margin: 10px 0;
            }
            .chart-container {
                margin: 20px 0;
                height: 400px;
                border: 1px solid var(--vscode-panel-border);
                padding: 20px;
                border-radius: 2px;
            }
            .loading {
                text-align: center;
                padding: 20px;
                color: var(--vscode-descriptionForeground);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1><i class="codicon codicon-graph-line"></i> Database Size Forecast</h1>
                <div>
                    <button class="button secondary" onclick="refreshData()">
                        <i class="codicon codicon-refresh"></i> Refresh
                    </button>
                </div>
            </div>

            <div class="tabs">
                <button class="tab active" onclick="showTab('config')">Config</button>
                <button class="tab" onclick="showTab('forecast')">Forecast</button>
            </div>

            <div id="config-tab" class="tab-content active">
                <div style="margin-bottom: 20px;">
                    <button class="button" onclick="saveConfig()">
                        <i class="codicon codicon-save"></i> Save Configuration
                    </button>
                    <button class="button" onclick="calculateForecast()">
                        <i class="codicon codicon-graph-line"></i> Calculate Forecast
                    </button>
                </div>
                
                <table id="config-table">
                    <thead>
                        <tr>
                            <th onclick="sortConfigTable(0)" style="cursor: pointer;">
                                Data Object Name <span id="sort-icon-0" class="sort-icon"></span>
                            </th>
                            <th onclick="sortConfigTable(1)" style="cursor: pointer;">
                                Data Size (KB) <span id="sort-icon-1" class="sort-icon"></span>
                            </th>
                            <th onclick="sortConfigTable(2)" style="cursor: pointer;">
                                Parent Data Object <span id="sort-icon-2" class="sort-icon"></span>
                            </th>
                            <th onclick="sortConfigTable(3)" style="cursor: pointer;">
                                Expected Instances per Parent <span id="sort-icon-3" class="sort-icon"></span>
                            </th>
                            <th onclick="sortConfigTable(4)" style="cursor: pointer;">
                                Growth per Month (%) <span id="sort-icon-4" class="sort-icon"></span>
                            </th>
                        </tr>
                    </thead>
                    <tbody id="config-tbody">
                        <tr class="loading">
                            <td colspan="5">Loading data objects...</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div id="forecast-tab" class="tab-content">
                <div id="forecast-content">
                    <div class="loading">
                        <p>No forecast data available. Please configure data objects and calculate forecast.</p>
                    </div>
                </div>
            </div>

            <div id="messages"></div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="${scriptUri}"></script>
    </body>
    </html>`;
}

/**
 * Calculate the size of a data object in KB using the same logic as data object size analysis
 */
function calculateDataObjectSizeInKB(dataObject: any): number {
    let totalSizeBytes = 0;
    
    if (dataObject.prop && Array.isArray(dataObject.prop)) {
        dataObject.prop.forEach((prop: any) => {
            const propSize = calculatePropertySize(prop);
            totalSizeBytes += propSize;
        });
    }
    
    // Convert bytes to KB
    const sizeInKB = totalSizeBytes / 1024;
    return Math.round(sizeInKB * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate the size of a single property in bytes using the same logic as data object size analysis
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
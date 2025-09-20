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
                    seedCount: existingConfig?.seedCount || 1,
                    expectedInstances: existingConfig?.expectedInstances || 1,
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
        const configData = JSON.parse(configContent);

        // The config file contains an array of config items
        // Each item should have: dataObjectName, dataSizeKb, expectedInstances, growthPercentage
        console.log('Config data loaded:', configData.length, 'items');
        
        // Calculate forecast for next 5 years (60 months)
        const forecast = calculateForecastData(configData);

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
    console.log('Calculating forecast data for config:', config.length, 'items');
    if (config.length > 0) {
        console.log('First config item structure:', Object.keys(config[0]));
        console.log('First config item:', config[0]);
        console.log('Using seedCount values for initial instance calculations');
    }
    
    const months = [];
    const currentDate = new Date();
    
    // Generate monthly data for next 5 years (60 months)
    for (let month = 0; month < 60; month++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + month, 1);
        const monthData = {
            month: month + 1, // Month number (1-60)
            monthDate: date.toISOString().substring(0, 7), // YYYY-MM format
            totalSize: 0,
            dataObjects: {} as any
        };
        
        // Process objects in dependency order: parents first, then children
        // First, process objects with no parent (top-level objects)
        const processedObjects = new Set();
        
        config.forEach(item => {
            if (item.dataObjectName && item.dataSizeKb && item.expectedInstances && item.growthPercentage !== undefined) {
                // Only process top-level objects (no parent) in this pass
                if (!item.parentDataObjectName) {
                    // The growthPercentage is monthly growth rate for the object itself
                    const monthlyGrowthRate = item.growthPercentage / 100;
                    
                    // Calculate growth multiplier for this month
                    const growthMultiplier = Math.pow(1 + monthlyGrowthRate, month);
                    
                    // Use seedCount as the initial instance count for month 0
                    const seedCount = item.seedCount || 1;
                    const instances = Math.round(seedCount * growthMultiplier);
                    
                    if (month === 0) { // Log only for month 0 to show initial values
                        console.log(`${item.dataObjectName}: seedCount=${seedCount}, monthlyGrowth=${item.growthPercentage}%, instances=${instances}`);
                    }
                    
                    // Calculate total size for this data object
                    const objectSize = instances * item.dataSizeKb;

                    monthData.dataObjects[item.dataObjectName] = {
                        instances: instances,
                        sizeKb: objectSize,
                        sizeMb: Math.round(objectSize / 1024 * 100) / 100,
                        sizeGb: Math.round(objectSize / (1024 * 1024) * 100) / 100
                    };

                    monthData.totalSize += objectSize;
                    processedObjects.add(item.dataObjectName);
                }
            }
        });
        
        // Second pass: process child objects based on their parent's current instance count
        let remainingObjects = config.filter(item => 
            item.dataObjectName && item.dataSizeKb && item.expectedInstances && 
            item.growthPercentage !== undefined && item.parentDataObjectName &&
            !processedObjects.has(item.dataObjectName)
        );
        
        // Keep processing until all child objects are calculated
        while (remainingObjects.length > 0) {
            const processedInThisPass = [];
            
            remainingObjects.forEach(item => {
                // Check if parent has been processed
                if (monthData.dataObjects[item.parentDataObjectName]) {
                    const parentInstances = monthData.dataObjects[item.parentDataObjectName].instances;
                    
                    // For child objects, expectedInstances represents "instances per parent"
                    // Child growth is applied to the "instances per parent" ratio, not to the total
                    const monthlyGrowthRate = item.growthPercentage / 100;
                    const growthMultiplier = Math.pow(1 + monthlyGrowthRate, month);
                    
                    // Calculate instances based on parent relationship
                    const instancesPerParent = Math.round(item.expectedInstances * growthMultiplier);
                    const calculatedInstances = Math.round(parentInstances * instancesPerParent);
                    
                    let instances = calculatedInstances;
                    
                    // At month 0, use seed count if it's greater than calculated instances
                    if (month === 0) {
                        const seedCount = item.seedCount || 1;
                        instances = Math.max(calculatedInstances, seedCount);
                        if (seedCount > calculatedInstances) {
                            console.log(`${item.dataObjectName}: Using seedCount (${seedCount}) over calculated (${calculatedInstances}) for month 0`);
                        }
                    } else {
                        // For months > 0, check if previous month's value with growth is higher
                        const previousMonth = months[month - 1];
                        if (previousMonth && previousMonth.dataObjects[item.dataObjectName]) {
                            const previousInstances = previousMonth.dataObjects[item.dataObjectName].instances;
                            const growthBasedInstances = Math.round(previousInstances * (1 + monthlyGrowthRate));
                            
                            if (growthBasedInstances > calculatedInstances) {
                                instances = growthBasedInstances;
                                if (month <= 2) { // Log for first few months to show the logic
                                    console.log(`${item.dataObjectName} month ${month}: Using growth-based (${growthBasedInstances}) over parent-based (${calculatedInstances})`);
                                }
                            }
                        }
                    }
                    
                    // Calculate total size for this data object
                    const objectSize = instances * item.dataSizeKb;

                    monthData.dataObjects[item.dataObjectName] = {
                        instances: instances,
                        sizeKb: objectSize,
                        sizeMb: Math.round(objectSize / 1024 * 100) / 100,
                        sizeGb: Math.round(objectSize / (1024 * 1024) * 100) / 100
                    };

                    monthData.totalSize += objectSize;
                    processedObjects.add(item.dataObjectName);
                    processedInThisPass.push(item.dataObjectName);
                }
            });
            
            // Remove processed objects from remaining list
            remainingObjects = remainingObjects.filter(item => 
                !processedInThisPass.includes(item.dataObjectName)
            );
            
            // If no objects were processed in this pass, break to avoid infinite loop
            if (processedInThisPass.length === 0) {
                console.warn('Circular dependency or missing parent detected for remaining objects:', 
                    remainingObjects.map(item => `${item.dataObjectName} -> ${item.parentDataObjectName}`));
                break;
            }
        }
        
        // Handle any remaining objects that couldn't be processed (missing parents, etc.)
        config.forEach(item => {
            if (item.dataObjectName && item.dataSizeKb && item.expectedInstances && 
                item.growthPercentage !== undefined && !processedObjects.has(item.dataObjectName)) {
                
                if (month === 0) { // Only log once per item
                    console.log('Processing orphaned object (missing parent):', {
                        dataObjectName: item.dataObjectName,
                        parentDataObjectName: item.parentDataObjectName
                    });
                }
                
                // Treat as top-level object
                const monthlyGrowthRate = item.growthPercentage / 100;
                const growthMultiplier = Math.pow(1 + monthlyGrowthRate, month);
                const seedCount = item.seedCount || 1;
                const instances = Math.round(seedCount * growthMultiplier);
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
    
    console.log('Generated', months.length, 'months of data');
    console.log('First month:', months[0]);
    console.log('Last month:', months[59]);
    
    const result = {
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
    
    console.log('Forecast summary:', result.summary);
    return result;
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
        <title>Analysis - Database Size Forecast</title>
        <link href="${codiconsUri}" rel="stylesheet" />
        <style>
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
            
            /* Filter section styling */
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
                justify-content: space-between;
                align-items: center;
                gap: 8px;
                margin-bottom: 15px;
            }
            
            /* Header actions for config tab - right justified buttons */
            .header-actions-right {
                display: flex;
                justify-content: flex-end;
                align-items: center;
                gap: 8px;
                margin-bottom: 15px;
            }
            
            .display-mode-group {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .display-mode-group label {
                font-size: 12px;
                color: var(--vscode-foreground);
                margin: 0;
                white-space: nowrap;
            }
            
            .display-mode-group select {
                background: var(--vscode-dropdown-background);
                color: var(--vscode-dropdown-foreground);
                border: 1px solid var(--vscode-dropdown-border);
                border-radius: 2px;
                padding: 4px 8px;
                font-size: 12px;
                min-width: 120px;
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
            
            .primary-button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 6px 14px;
                border-radius: 2px;
                cursor: pointer;
                font-size: 13px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .primary-button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            
            .secondary-button {
                background-color: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
                border: none;
                padding: 6px 14px;
                border-radius: 2px;
                cursor: pointer;
                font-size: 13px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .secondary-button:hover {
                background-color: var(--vscode-button-secondaryHoverBackground);
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
            
            /* Processing animation */
            .processing {
                opacity: 0.6;
                pointer-events: none;
                position: relative;
            }
            
            .spinner {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid var(--vscode-button-foreground);
                border-radius: 50%;
                border-top-color: transparent;
                animation: spin 1s ease-in-out infinite;
                margin-right: 6px;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .button-processing {
                opacity: 0.6;
                pointer-events: none;
            }
            
            /* Data table specific styling */
            .data-table-container {
                overflow: auto;
                max-height: 70vh;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 3px;
                margin-top: 15px;
            }
            
            .data-table {
                width: 100%;
                border-collapse: collapse;
                background-color: var(--vscode-editor-background);
                min-width: max-content;
            }
            
            .data-table th {
                background-color: var(--vscode-list-hoverBackground);
                font-weight: 600;
                padding: 8px 10px;
                text-align: center;
                border-bottom: 1px solid var(--vscode-panel-border);
                border-right: 1px solid var(--vscode-panel-border);
                position: sticky;
                top: 0;
                z-index: 10;
                white-space: nowrap;
                min-width: 80px;
            }
            
            .data-table th:first-child {
                position: sticky;
                left: 0;
                z-index: 20;
                background-color: var(--vscode-list-hoverBackground);
                min-width: 180px;
                text-align: left;
            }
            
            .data-table td {
                padding: 6px 10px;
                text-align: center;
                border-bottom: 1px solid var(--vscode-panel-border);
                border-right: 1px solid var(--vscode-panel-border);
                white-space: nowrap;
                font-size: 12px;
            }
            
            .data-table td:first-child {
                position: sticky;
                left: 0;
                background-color: var(--vscode-editor-background);
                z-index: 5;
                text-align: left;
                font-weight: 500;
                min-width: 180px;
            }
            
            .data-table tr:hover td {
                background-color: var(--vscode-list-hoverBackground);
            }
            
            .data-table tr:hover td:first-child {
                background-color: var(--vscode-list-hoverBackground);
            }
            
            .data-table .total-row {
                font-weight: 600;
                border-top: 2px solid var(--vscode-panel-border);
            }
            
            .data-table .total-row td {
                background-color: var(--vscode-list-activeSelectionBackground);
                font-weight: 600;
            }
            
            .data-table .total-row td:first-child {
                background-color: var(--vscode-list-activeSelectionBackground);
            }
        </style>
    </head>
    <body>
        <div class="validation-header">
            <h2><i class="codicon codicon-graph-line"></i> Database Size Forecast</h2>
            <p>Configure and forecast database growth based on data object sizes and usage patterns</p>
        </div>

        <div class="tabs">
            <button class="tab active" data-tab="config">Config</button>
            <button class="tab" data-tab="forecast">Forecast</button>
            <button class="tab" data-tab="data">Data</button>
        </div>

        <div id="config-tab" class="tab-content active">
            <div class="filter-section">
                <div class="filter-header" onclick="toggleFilterSection()">
                    <span class="codicon codicon-chevron-down" id="filterChevron"></span>
                    <span>Filters</span>
                </div>
                <div class="filter-content" id="filterContent">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label>Data Object Name:</label>
                            <input type="text" id="filterDataObjectName" placeholder="Filter by data object name...">
                        </div>
                        <div class="filter-group">
                            <label>Parent Object:</label>
                            <input type="text" id="filterParentObject" placeholder="Filter by parent object...">
                        </div>
                        <div class="filter-group">
                            <label>Size Range (KB):</label>
                            <div style="display: flex; gap: 5px; align-items: center;">
                                <input type="number" id="filterMinSize" placeholder="Min" style="width: 80px;">
                                <span>-</span>
                                <input type="number" id="filterMaxSize" placeholder="Max" style="width: 80px;">
                            </div>
                        </div>
                    </div>
                    <div class="filter-actions">
                        <button onclick="clearFilters()" class="filter-button-secondary">Clear All</button>
                    </div>
                </div>
            </div>
            
            <div class="header-actions-right">
                <button class="secondary-button" onclick="refreshData()">
                    <i class="codicon codicon-refresh"></i> Refresh
                </button>
                <button class="secondary-button" onclick="resetConfig()">
                    <i class="codicon codicon-discard"></i> Reset
                </button>
                <button class="primary-button" onclick="saveConfig()">
                    <i class="codicon codicon-save"></i> Save Configuration
                </button>
                <button class="primary-button" onclick="calculateForecast()">
                    <i class="codicon codicon-graph-line"></i> Calculate Forecast
                </button>
            </div>
            
            <div class="table-container">
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
                                Seed Count <span id="sort-icon-3" class="sort-icon"></span>
                            </th>
                            <th onclick="sortConfigTable(4)" style="cursor: pointer;">
                                Expected Instances per Parent <span id="sort-icon-4" class="sort-icon"></span>
                            </th>
                            <th onclick="sortConfigTable(5)" style="cursor: pointer;">
                                Growth per Month (%) <span id="sort-icon-5" class="sort-icon"></span>
                            </th>
                        </tr>
                    </thead>
                    <tbody id="config-tbody">
                        <tr class="loading">
                            <td colspan="6">Loading data objects...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div id="forecast-tab" class="tab-content">
            <div class="header-actions">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <label for="period-select" style="font-size: 13px; color: var(--vscode-foreground);">Display Period:</label>
                    <select id="period-select" onchange="changeForecastPeriod()" style="width: auto; min-width: 150px;">
                        <option value="6">Next 6 Months</option>
                        <option value="12">Next Year</option>
                        <option value="36">Next 3 Years</option>
                        <option value="60" selected>Next 5 Years</option>
                    </select>
                </div>
                <button class="secondary-button" onclick="refreshData()">
                    <i class="codicon codicon-refresh"></i> Refresh
                </button>
            </div>
            
            <div id="forecast-content">
                <div class="loading">
                    <p>No forecast data available. Please configure data objects and calculate forecast.</p>
                </div>
            </div>
        </div>

        <div id="data-tab" class="tab-content">
            <div class="filter-section">
                <div class="filter-header" onclick="toggleDataFilterSection()">
                    <span class="codicon codicon-chevron-down" id="dataFilterChevron"></span>
                    <span>Filters</span>
                </div>
                <div class="filter-content" id="dataFilterContent">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label>Data Object Name:</label>
                            <input type="text" id="filterDataName" placeholder="Filter by data object name...">
                        </div>
                        <div class="filter-group">
                            <label>Time Period:</label>
                            <select id="dataTimeFilter">
                                <option value="all">All Months</option>
                                <option value="6">Next 6 Months</option>
                                <option value="12">Next Year</option>
                                <option value="36">Next 3 Years</option>
                                <option value="60">Next 5 Years</option>
                            </select>
                        </div>
                    </div>
                    <div class="filter-actions">
                        <button onclick="clearDataFilters()" class="filter-button-secondary">Clear All</button>
                    </div>
                </div>
            </div>
            
            <div class="header-actions">
                <div class="display-mode-group">
                    <label for="dataDisplayMode">Display Mode:</label>
                    <select id="dataDisplayMode">
                        <option value="size">Size (bytes)</option>
                        <option value="instances">Instance Count</option>
                    </select>
                </div>
                <button class="secondary-button" onclick="refreshData()">
                    <i class="codicon codicon-refresh"></i> Refresh
                </button>
            </div>
            
            <div id="data-content">
                <div class="loading">
                    <p>No forecast data available. Please configure data objects and calculate forecast.</p>
                </div>
            </div>
        </div>

        <div id="messages"></div>

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
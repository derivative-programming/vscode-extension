// Description: Handles registration of user stories user journey view related commands.
// Created: August 6, 2025

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ModelService } from '../services/modelService';

// Track active panels to avoid duplicates
const activePanels = new Map<string, vscode.WebviewPanel>();

// Track panel reference for the user stories journey view
const userStoriesJourneyPanel = {
    panel: null as vscode.WebviewPanel | null,
    context: null as vscode.ExtensionContext | null,
    modelService: null as ModelService | null
};

/**
 * Gets the reference to the user stories journey panel if it's open
 */
export function getUserStoriesJourneyPanel(): { 
    type: string; 
    context: vscode.ExtensionContext; 
    modelService: ModelService 
} | null {
    if (activePanels.has('userStoriesJourney') && userStoriesJourneyPanel.context && userStoriesJourneyPanel.modelService) {
        return {
            type: 'userStoriesJourney',
            context: userStoriesJourneyPanel.context,
            modelService: userStoriesJourneyPanel.modelService
        };
    }
    return null;
}

/**
 * Closes the user stories journey panel if it's open
 */
export function closeUserStoriesJourneyPanel(): void {
    console.log(`Closing user stories journey panel if open`);
    const panel = activePanels.get('userStoriesJourney');
    if (panel) {
        panel.dispose();
        activePanels.delete('userStoriesJourney');
    }
    // Clean up panel reference
    userStoriesJourneyPanel.panel = null;
}

/**
 * Load user stories journey data from both model and page mapping file
 */
async function loadUserStoriesJourneyData(panel: vscode.WebviewPanel, modelService: ModelService, sortColumn?: string, sortDescending?: boolean): Promise<void> {
    try {
        console.log("[Extension] Loading user stories journey data");
        const model = modelService.getCurrentModel();
        if (!model) {
            console.error("[Extension] No model available");
            panel.webview.postMessage({
                command: "setUserStoriesJourneyData",
                data: { items: [], totalRecords: 0, sortColumn: sortColumn || 'storyNumber', sortDescending: sortDescending || false }
            });
            return;
        }

        // Get all user stories from model - only processed ones
        const userStories: any[] = [];
        if (model.namespace && Array.isArray(model.namespace) && model.namespace.length > 0) {
            const namespace = model.namespace[0];
            if (namespace.userStory && Array.isArray(namespace.userStory)) {
                // Filter for processed stories only
                const processedStories = namespace.userStory.filter(story => 
                    story.isStoryProcessed === "true" && story.isIgnored !== "true"
                );
                userStories.push(...processedStories);
            }
        }

        // Load existing page mapping data from separate file
        let existingPageMappingData: any = { pageMappings: {} };
        let pageMappingFilePath = '';
        const modelFilePath = modelService.getCurrentFilePath();
        if (modelFilePath) {
            const modelDir = path.dirname(modelFilePath);
            pageMappingFilePath = path.join(modelDir, 'user-story-page-mapping.json');
            try {
                if (fs.existsSync(pageMappingFilePath)) {
                    const mappingContent = fs.readFileSync(pageMappingFilePath, 'utf8');
                    existingPageMappingData = JSON.parse(mappingContent);
                }
            } catch (error) {
                console.warn("[Extension] Could not load existing page mapping file:", error);
                existingPageMappingData = { pageMappings: {} };
            }
        }

        console.log(`[Extension] Found ${userStories.length} user stories`);

        // Build combined data array with page mapping
        const combinedData: any[] = [];
        userStories.forEach(story => {
            const storyId = story.name || '';
            const storyNumber = story.storyNumber || '';
            const existingMapping = existingPageMappingData.pageMappings[storyNumber];

            // Get pages from mapping (stored as array in pageMapping field)
            const pages = existingMapping?.pageMapping || [];
            
            if (pages.length > 0) {
                // Create a row for each page that fulfils the story
                pages.forEach((page: string) => {
                    combinedData.push({
                        storyId: storyId,
                        storyNumber: story.storyNumber || '',
                        storyText: story.storyText || '',
                        page: page,
                        pageMappingFilePath: pageMappingFilePath,
                        selected: false // For checkbox functionality
                    });
                });
            } else {
                // If no pages mapped, still show the story but with empty page
                combinedData.push({
                    storyId: storyId,
                    storyNumber: story.storyNumber || '',
                    storyText: story.storyText || '',
                    page: '',
                    pageMappingFilePath: pageMappingFilePath,
                    selected: false // For checkbox functionality
                });
            }
        });

        // Sort the data
        if (sortColumn) {
            combinedData.sort((a, b) => {
                let aVal = a[sortColumn] || '';
                let bVal = b[sortColumn] || '';
                
                // Handle string comparison
                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }
                
                let result = 0;
                if (aVal < bVal) {
                    result = -1;
                } else if (aVal > bVal) {
                    result = 1;
                }
                
                return sortDescending ? -result : result;
            });
        }

        console.log(`[Extension] Sending ${combinedData.length} journey items to webview`);

        // Send data to webview
        panel.webview.postMessage({
            command: "setUserStoriesJourneyData",
            data: {
                items: combinedData,
                totalRecords: combinedData.length,
                sortColumn: sortColumn || 'storyNumber',
                sortDescending: sortDescending || false
            }
        });

    } catch (error) {
        console.error("[Extension] Error loading user stories journey data:", error);
        panel.webview.postMessage({
            command: "setUserStoriesJourneyData",
            data: { items: [], totalRecords: 0, sortColumn: 'storyNumber', sortDescending: false, error: error.message }
        });
    }
}

/**
 * Save journey data to CSV file
 */
async function saveJourneyDataToCSV(items: any[], modelService: ModelService): Promise<string> {
    try {
        // Create CSV content
        const csvHeader = 'Story Number,Story Text,Page\n';
        const csvRows = items.map(item => {
            const storyNumber = (item.storyNumber || '').toString().replace(/"/g, '""');
            const storyText = (item.storyText || '').toString().replace(/"/g, '""');
            const page = (item.page || '').toString().replace(/"/g, '""');
            return `"${storyNumber}","${storyText}","${page}"`;
        }).join('\n');

        const csvContent = csvHeader + csvRows;

        return csvContent;
    } catch (error) {
        console.error("[Extension] Error creating CSV:", error);
        throw error;
    }
}

/**
 * Load journey start data including roles and existing journey start pages
 */
async function loadJourneyStartData(modelService: ModelService): Promise<any> {
    try {
        const model = modelService.getCurrentModel();
        if (!model) {
            throw new Error('No model available');
        }

        // Extract roles from Role data objects
        const roles: string[] = [];
        if (model.namespace && Array.isArray(model.namespace) && model.namespace.length > 0) {
            const namespace = model.namespace[0];
            if (namespace.object && Array.isArray(namespace.object)) {
                namespace.object.forEach((obj: any) => {
                    if (obj.name && obj.name.toLowerCase() === 'role') {
                        if (obj.lookupItem && Array.isArray(obj.lookupItem)) {
                            obj.lookupItem.forEach((lookupItem: any) => {
                                if (lookupItem.name) {
                                    roles.push(lookupItem.name);
                                }
                            });
                        }
                    }
                });
            }
        }

        // Load existing journey start pages from mapping file
        let existingJourneyStartPages: any = {};
        const modelFilePath = modelService.getCurrentFilePath();
        if (modelFilePath) {
            const modelDir = path.dirname(modelFilePath);
            const mappingFilePath = path.join(modelDir, 'user-story-page-mapping.json');
            try {
                if (fs.existsSync(mappingFilePath)) {
                    const mappingContent = fs.readFileSync(mappingFilePath, 'utf8');
                    const mappingData = JSON.parse(mappingContent);
                    existingJourneyStartPages = mappingData.journeyStartPages || {};
                }
            } catch (error) {
                console.warn("[Extension] Could not load journey start pages from mapping file:", error);
            }
        }

        return {
            roles: roles.sort(),
            journeyStartPages: existingJourneyStartPages
        };
    } catch (error) {
        console.error("[Extension] Error loading journey start data:", error);
        throw error;
    }
}

/**
 * Get page list for journey start selection
 */
async function getPageListForJourneyStart(modelService: ModelService): Promise<any[]> {
    try {
        const model = modelService.getCurrentModel();
        if (!model) {
            throw new Error('No model available');
        }

        const pages: any[] = [];
        
        if (model.namespace && Array.isArray(model.namespace) && model.namespace.length > 0) {
            const namespace = model.namespace[0];
            
            // Get pages from objects (data objects)
            if (namespace.object && Array.isArray(namespace.object)) {
                namespace.object.forEach((obj: any) => {
                    // Get pages from object reports
                    if (obj.report && Array.isArray(obj.report)) {
                        obj.report.forEach((report: any) => {
                            if (report.isPage === "true" && report.name) {
                                pages.push({
                                    name: report.name,
                                    type: 'Report',
                                    titleText: report.titleText || '',
                                    visualizationType: report.visualizationType || 'N/A',
                                    ownerObject: obj.name || 'N/A'
                                });
                            }
                        });
                    }
                    
                    // Get pages from object objectWorkflows (forms)
                    if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                        obj.objectWorkflow.forEach((workflow: any) => {
                            if (workflow.isPage === "true" && workflow.name) {
                                pages.push({
                                    name: workflow.name,
                                    type: 'Form',
                                    titleText: workflow.titleText || '',
                                    visualizationType: 'Form',
                                    ownerObject: obj.name || 'N/A'
                                });
                            }
                        });
                    }
                });
            }
        }

        // Sort pages alphabetically by name
        return pages.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error("[Extension] Error getting page list:", error);
        throw error;
    }
}

/**
 * Save journey start data to the mapping file
 */
async function saveJourneyStartData(journeyStartPages: any, modelService: ModelService): Promise<void> {
    try {
        const modelFilePath = modelService.getCurrentFilePath();
        if (!modelFilePath) {
            throw new Error('No model file path available');
        }

        const modelDir = path.dirname(modelFilePath);
        const mappingFilePath = path.join(modelDir, 'user-story-page-mapping.json');

        // Load existing mapping data or create new structure
        let mappingData: any = { pageMappings: {}, journeyStartPages: {} };
        try {
            if (fs.existsSync(mappingFilePath)) {
                const mappingContent = fs.readFileSync(mappingFilePath, 'utf8');
                mappingData = JSON.parse(mappingContent);
                
                // Ensure journeyStartPages property exists
                if (!mappingData.journeyStartPages) {
                    mappingData.journeyStartPages = {};
                }
            }
        } catch (error) {
            console.warn("[Extension] Could not load existing mapping file, creating new one:", error);
        }

        // Update journey start pages
        mappingData.journeyStartPages = journeyStartPages;

        // Save back to file
        const content = JSON.stringify(mappingData, null, 2);
        fs.writeFileSync(mappingFilePath, content, 'utf8');
        
        console.log(`[Extension] Journey start pages saved to ${mappingFilePath}`);
    } catch (error) {
        console.error("[Extension] Error saving journey start data:", error);
        throw error;
    }
}

/**
 * Register user stories journey commands
 */
export function registerUserStoriesJourneyCommands(context: vscode.ExtensionContext, modelService: ModelService): void {
    console.log("Registering user stories journey commands");

    // Register the main user stories journey command
    const userStoriesJourneyCommand = vscode.commands.registerCommand(
        'appdna.userStoriesJourney',
        async () => {
            console.log("User Stories Journey command triggered");

            try {
                // Check if panel already exists
                if (activePanels.has('userStoriesJourney')) {
                    const existingPanel = activePanels.get('userStoriesJourney');
                    if (existingPanel) {
                        existingPanel.reveal();
                        return;
                    }
                }

                // Create webview panel
                const panel = vscode.window.createWebviewPanel(
                    'userStoriesJourney',
                    'User Stories Journey',
                    vscode.ViewColumn.One,
                    {
                        enableScripts: true,
                        retainContextWhenHidden: true,
                    }
                );

                // Store panel reference
                activePanels.set('userStoriesJourney', panel);
                userStoriesJourneyPanel.panel = panel;
                userStoriesJourneyPanel.context = context;
                userStoriesJourneyPanel.modelService = modelService;

                // Clean up when panel is disposed
                panel.onDidDispose(() => {
                    activePanels.delete('userStoriesJourney');
                    userStoriesJourneyPanel.panel = null;
                });

                // Get the webview script URI
                const scriptUri = panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoriesJourneyView.js')
                );

                // Get the codicons CSS URI
                const codiconsUri = panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css')
                );

                // Set the webview HTML content
                panel.webview.html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>User Stories Journey</title>
                    <link href="${codiconsUri}" rel="stylesheet">
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
                        button:hover:not(:disabled) {
                            background-color: var(--vscode-button-hoverBackground);
                        }
                        
                        .icon-button {
                            background: none;
                            border: none;
                            color: var(--vscode-foreground);
                            cursor: pointer;
                            padding: 5px;
                            margin-left: 5px;
                            border-radius: 3px;
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
                            padding: 6px 12px;
                            cursor: pointer;
                            border-radius: 2px;
                        }
                        .filter-button-secondary:hover {
                            background-color: var(--vscode-button-secondaryHoverBackground);
                        }
                        .table-container {
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 3px;
                            overflow: hidden;
                            background-color: var(--vscode-editor-background);
                        }
                        
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            background-color: var(--vscode-editor-background);
                        }
                        
                        th, td {
                            text-align: left;
                            padding: 8px 12px;
                            border-bottom: 1px solid var(--vscode-panel-border);
                        }
                        
                        th {
                            background-color: var(--vscode-sideBar-background);
                            font-weight: 600;
                            position: sticky;
                            top: 0;
                            z-index: 1;
                        }
                        
                        th.sortable {
                            cursor: pointer;
                        }
                        
                        th.sortable:hover {
                            background-color: var(--vscode-list-hoverBackground);
                        }
                        
                        tr:hover {
                            background-color: var(--vscode-list-hoverBackground);
                        }
                        
                        .checkbox-column {
                            width: 40px;
                            text-align: center;
                            padding: 4px 8px;
                        }
                        .row-checkbox, .select-all-checkbox {
                            cursor: pointer;
                            margin: 0;
                        }
                        .checkbox-header {
                            text-align: center;
                            padding: 4px 8px;
                        }
                        
                        .story-number-column {
                            width: 120px;
                        }
                        
                        .story-text-column {
                            max-width: 300px;
                            word-wrap: break-word;
                        }
                        
                        .page-column {
                            width: 200px;
                        }
                        
                        .header-actions {
                            display: flex;
                            gap: 8px;
                            justify-content: flex-end;
                            margin-bottom: 10px;
                        }
                        
                        .refresh-button {
                            background-color: var(--vscode-button-secondaryBackground);
                            color: var(--vscode-button-secondaryForeground);
                            border: 1px solid var(--vscode-button-border);
                            padding: 4px 8px;
                            cursor: pointer;
                            border-radius: 2px;
                            font-size: 13px;
                            display: flex;
                            align-items: center;
                            gap: 4px;
                        }
                        
                        .refresh-button:hover {
                            background-color: var(--vscode-button-secondaryHoverBackground);
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
                        
                        .spinner-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background-color: rgba(0, 0, 0, 0.5);
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            z-index: 1000;
                        }
                        
                        .spinner {
                            border: 4px solid var(--vscode-progressBar-background);
                            border-top: 4px solid var(--vscode-progressBar-foreground);
                            border-radius: 50%;
                            width: 40px;
                            height: 40px;
                            animation: spin 1s linear infinite;
                        }
                        
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        
                        /* Journey Start Modal Styles */
                        .journey-start-modal {
                            position: fixed;
                            z-index: 1000;
                            left: 0;
                            top: 0;
                            width: 100%;
                            height: 100%;
                            background-color: rgba(0, 0, 0, 0.5);
                            display: none;
                        }
                        
                        .journey-start-modal-content {
                            background-color: var(--vscode-editor-background);
                            margin: 5% auto;
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 6px;
                            width: 80%;
                            max-width: 800px;
                            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                        }
                        
                        .journey-start-header {
                            padding: 16px 20px;
                            border-bottom: 1px solid var(--vscode-panel-border);
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            background-color: var(--vscode-sideBar-background);
                            border-radius: 6px 6px 0 0;
                        }
                        
                        .journey-start-header h3 {
                            margin: 0;
                            color: var(--vscode-editor-foreground);
                            font-size: 16px;
                            font-weight: 600;
                        }
                        
                        .journey-start-close {
                            background: none;
                            border: none;
                            color: var(--vscode-editor-foreground);
                            cursor: pointer;
                            padding: 4px;
                            border-radius: 3px;
                            font-size: 16px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        
                        .journey-start-close:hover {
                            background-color: var(--vscode-toolbar-hoverBackground);
                        }
                        
                        .journey-start-body {
                            padding: 20px;
                            max-height: 400px;
                            overflow-y: auto;
                        }
                        
                        .journey-start-table-container {
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 3px;
                            overflow: hidden;
                        }
                        
                        #journeyStartTable {
                            width: 100%;
                            border-collapse: collapse;
                            background-color: var(--vscode-editor-background);
                        }
                        
                        #journeyStartTable th {
                            background-color: var(--vscode-sideBar-background);
                            color: var(--vscode-editor-foreground);
                            font-weight: 600;
                            padding: 10px 12px;
                            text-align: left;
                            border-bottom: 1px solid var(--vscode-panel-border);
                        }
                        
                        #journeyStartTable td {
                            padding: 8px 12px;
                            border-bottom: 1px solid var(--vscode-panel-border);
                            vertical-align: middle;
                        }
                        
                        #journeyStartTable tr:hover {
                            background-color: var(--vscode-list-hoverBackground);
                        }
                        
                        .journey-start-page-input {
                            width: calc(100% - 35px);
                            margin-right: 5px;
                            padding: 4px 8px;
                            border: 1px solid var(--vscode-input-border);
                            background-color: var(--vscode-input-background);
                            color: var(--vscode-input-foreground);
                            border-radius: 2px;
                        }
                        
                        .journey-start-page-input:focus {
                            outline: 1px solid var(--vscode-focusBorder);
                            outline-offset: -1px;
                        }
                        
                        .journey-start-lookup-btn {
                            background: none;
                            border: 1px solid var(--vscode-button-border);
                            color: var(--vscode-editor-foreground);
                            cursor: pointer;
                            padding: 4px 6px;
                            border-radius: 2px;
                            font-size: 12px;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                        }
                        
                        .journey-start-lookup-btn:hover {
                            background-color: var(--vscode-toolbar-hoverBackground);
                        }
                        
                        .journey-start-footer {
                            padding: 16px 20px;
                            border-top: 1px solid var(--vscode-panel-border);
                            display: flex;
                            justify-content: flex-end;
                            gap: 10px;
                            background-color: var(--vscode-sideBar-background);
                            border-radius: 0 0 6px 6px;
                        }
                        
                        .journey-start-save-button {
                            background-color: var(--vscode-button-background);
                            color: var(--vscode-button-foreground);
                            border: 1px solid var(--vscode-button-border);
                            padding: 6px 14px;
                            cursor: pointer;
                            border-radius: 2px;
                            font-weight: 600;
                        }
                        
                        .journey-start-save-button:hover {
                            background-color: var(--vscode-button-hoverBackground);
                        }
                        
                        .journey-start-cancel-button {
                            background-color: var(--vscode-button-secondaryBackground);
                            color: var(--vscode-button-secondaryForeground);
                            border: 1px solid var(--vscode-button-border);
                            padding: 6px 14px;
                            cursor: pointer;
                            border-radius: 2px;
                        }
                        
                        .journey-start-cancel-button:hover {
                            background-color: var(--vscode-button-secondaryHoverBackground);
                        }
                        
                        /* Page Lookup Modal Styles */
                        .page-lookup-modal {
                            position: fixed;
                            z-index: 1001;
                            left: 0;
                            top: 0;
                            width: 100%;
                            height: 100%;
                            background-color: rgba(0, 0, 0, 0.5);
                            display: none;
                        }
                        
                        .page-lookup-modal-content {
                            background-color: var(--vscode-editor-background);
                            margin: 5% auto;
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 6px;
                            width: 70%;
                            max-width: 600px;
                            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                        }
                        
                        .page-lookup-header {
                            padding: 16px 20px;
                            border-bottom: 1px solid var(--vscode-panel-border);
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            background-color: var(--vscode-sideBar-background);
                            border-radius: 6px 6px 0 0;
                        }
                        
                        .page-lookup-header h3 {
                            margin: 0;
                            color: var(--vscode-editor-foreground);
                            font-size: 16px;
                            font-weight: 600;
                        }
                        
                        .page-lookup-close {
                            background: none;
                            border: none;
                            color: var(--vscode-editor-foreground);
                            cursor: pointer;
                            padding: 4px;
                            border-radius: 3px;
                            font-size: 16px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        
                        .page-lookup-close:hover {
                            background-color: var(--vscode-toolbar-hoverBackground);
                        }
                        
                        .page-lookup-body {
                            padding: 20px;
                        }
                        
                        .page-filter-container {
                            margin-bottom: 15px;
                        }
                        
                        .page-filter-input {
                            width: 100%;
                            padding: 8px 12px;
                            border: 1px solid var(--vscode-input-border);
                            background-color: var(--vscode-input-background);
                            color: var(--vscode-input-foreground);
                            border-radius: 2px;
                            font-size: 13px;
                        }
                        
                        .page-filter-input:focus {
                            outline: 1px solid var(--vscode-focusBorder);
                            outline-offset: -1px;
                        }
                        
                        .page-list-container {
                            max-height: 300px;
                            overflow-y: auto;
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 3px;
                        }
                        
                        .page-list-item {
                            padding: 8px 12px;
                            border-bottom: 1px solid var(--vscode-panel-border);
                            cursor: pointer;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        }
                        
                        .page-list-item:last-child {
                            border-bottom: none;
                        }
                        
                        .page-list-item:hover {
                            background-color: var(--vscode-list-hoverBackground);
                        }
                        
                        .page-list-item:focus {
                            outline: 1px solid var(--vscode-focusBorder);
                            outline-offset: -1px;
                            background-color: var(--vscode-list-hoverBackground);
                        }
                        
                        .page-list-item.selected {
                            background-color: var(--vscode-list-activeSelectionBackground);
                            color: var(--vscode-list-activeSelectionForeground);
                        }
                        
                        .page-list-item-main {
                            flex: 1;
                        }
                        
                        .page-list-item-name {
                            font-weight: 600;
                            margin-bottom: 2px;
                        }
                        
                        .page-list-item-details {
                            font-size: 12px;
                            color: var(--vscode-descriptionForeground);
                        }
                        
                        .page-lookup-footer {
                            padding: 16px 20px;
                            border-top: 1px solid var(--vscode-panel-border);
                            display: flex;
                            justify-content: flex-end;
                            gap: 10px;
                            background-color: var(--vscode-sideBar-background);
                            border-radius: 0 0 6px 6px;
                        }
                        
                        .page-lookup-select-button {
                            background-color: var(--vscode-button-background);
                            color: var(--vscode-button-foreground);
                            border: 1px solid var(--vscode-button-border);
                            padding: 6px 14px;
                            cursor: pointer;
                            border-radius: 2px;
                            font-weight: 600;
                        }
                        
                        .page-lookup-select-button:hover {
                            background-color: var(--vscode-button-hoverBackground);
                        }
                        
                        .page-lookup-select-button:disabled {
                            opacity: 0.6;
                            cursor: not-allowed;
                        }
                        
                        .page-lookup-cancel-button {
                            background-color: var(--vscode-button-secondaryBackground);
                            color: var(--vscode-button-secondaryForeground);
                            border: 1px solid var(--vscode-button-border);
                            padding: 6px 14px;
                            cursor: pointer;
                            border-radius: 2px;
                        }
                        
                        .page-lookup-cancel-button:hover {
                            background-color: var(--vscode-button-secondaryHoverBackground);
                        }
                    </style>
                </head>
                <body>
                    <div class="validation-header">
                        <h2>User Stories - User Journey</h2>
                        <p style="margin-top: -5px; margin-bottom: 15px; color: var(--vscode-descriptionForeground);">
                            Shows each user story and the page that fulfils it. Only stories that have completed 'Model AI Processing' are listed.
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
                                    <label>Story Number:</label>
                                    <input type="text" id="filterStoryNumber" placeholder="Filter by story number...">
                                </div>
                                <div class="filter-group">
                                    <label>Story Text:</label>
                                    <input type="text" id="filterStoryText" placeholder="Filter by story text...">
                                </div>
                                <div class="filter-group">
                                    <label>Page:</label>
                                    <input type="text" id="filterPage" placeholder="Filter by page...">
                                </div>
                            </div>
                            <div class="filter-actions">
                                <button onclick="clearFilters()" class="filter-button-secondary">Clear All</button>
                            </div>
                        </div>
                    </div>

                    <div class="header-actions">
                        <button id="defineJourneyStartButton" class="icon-button" title="Define Journey Start Pages">
                            <i class="codicon codicon-location"></i>
                        </button>
                        <button id="exportButton" class="icon-button" title="Download CSV">
                            <i class="codicon codicon-cloud-download"></i>
                        </button>
                        <button id="refreshButton" class="refresh-button" title="Refresh Table">
                        </button>
                    </div>

                    <div class="table-container">
                        <table id="journeyTable">
                            <thead id="journeyTableHead">
                                <!-- Table headers will be dynamically generated -->
                            </thead>
                            <tbody id="journeyTableBody">
                                <!-- Table rows will be dynamically generated -->
                            </tbody>
                        </table>
                    </div>

                    <div class="table-footer">
                        <div class="table-footer-left">
                            <!-- Left side content if needed -->
                        </div>
                        <div class="table-footer-right">
                            <span id="record-info"></span>
                        </div>
                    </div>

                    <div id="spinner-overlay" class="spinner-overlay" style="display: none;">
                        <div class="spinner"></div>
                    </div>

                    <!-- Journey Start Pages Modal -->
                    <div id="journeyStartModal" class="journey-start-modal">
                        <div class="journey-start-modal-content">
                            <div class="journey-start-header">
                                <h3>Define Journey Start Pages for Roles</h3>
                                <button class="journey-start-close" onclick="closeJourneyStartModal()">
                                    <span class="codicon codicon-close"></span>
                                </button>
                            </div>
                            <div class="journey-start-body">
                                <div class="journey-start-table-container">
                                    <table id="journeyStartTable">
                                        <thead>
                                            <tr>
                                                <th style="width: 40%;">Role Name</th>
                                                <th style="width: 60%;">Journey Start Page</th>
                                            </tr>
                                        </thead>
                                        <tbody id="journeyStartTableBody">
                                            <!-- Table rows will be dynamically generated -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="journey-start-footer">
                                <button onclick="saveJourneyStartPages()" class="journey-start-save-button">Save</button>
                                <button onclick="closeJourneyStartModal()" class="journey-start-cancel-button">Cancel</button>
                            </div>
                        </div>
                    </div>

                    <!-- Page Lookup Modal for Journey Start -->
                    <div id="journeyStartPageLookupModal" class="page-lookup-modal">
                        <div class="page-lookup-modal-content">
                            <div class="page-lookup-header">
                                <h3>Select Journey Start Page</h3>
                                <button class="page-lookup-close" onclick="closeJourneyStartPageLookupModal()">
                                    <span class="codicon codicon-close"></span>
                                </button>
                            </div>
                            <div class="page-lookup-body">
                                <div class="page-filter-container">
                                    <input type="text" 
                                           id="journeyStartPageFilterInput" 
                                           class="page-filter-input" 
                                           placeholder="Filter pages by name or title..." 
                                           onkeyup="filterJourneyStartPageList()" 
                                           onkeydown="handleJourneyStartPageFilterKeydown(event)">
                                </div>
                                <div class="page-list-container">
                                    <div id="journeyStartPageListContent">
                                        <!-- Page list will be populated dynamically -->
                                    </div>
                                </div>
                            </div>
                            <div class="page-lookup-footer">
                                <button onclick="applySelectedJourneyStartPage()" class="page-lookup-select-button">Select</button>
                                <button onclick="closeJourneyStartPageLookupModal()" class="page-lookup-cancel-button">Cancel</button>
                            </div>
                        </div>
                    </div>

                    <script src="${scriptUri}"></script>
                </body>
                </html>
            `;

                // Handle messages from the webview
                panel.webview.onDidReceiveMessage(
                    async message => {
                        switch (message.command) {
                            case 'UserStoriesJourneyWebviewReady':
                                console.log("[Extension] UserStoriesJourney webview ready");
                                // Load initial journey data
                                await loadUserStoriesJourneyData(panel, modelService);
                                break;

                            case 'refresh':
                                console.log("[Extension] UserStoriesJourney refresh requested");
                                await loadUserStoriesJourneyData(panel, modelService);
                                break;

                            case 'sortUserStoriesJourney':
                                console.log("[Extension] UserStoriesJourney sort requested:", message.column, message.descending);
                                await loadUserStoriesJourneyData(panel, modelService, message.column, message.descending);
                                break;

                            case 'exportToCSV':
                                console.log("[Extension] UserStoriesJourney CSV export requested");
                                try {
                                    const csvContent = await saveJourneyDataToCSV(message.data.items, modelService);
                                    
                                    // Generate timestamped filename
                                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                                                     new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
                                    const filename = `user-stories-journey-${timestamp}.csv`;

                                    panel.webview.postMessage({
                                        command: 'csvExportReady',
                                        csvContent: csvContent,
                                        filename: filename
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
                                    // Use the actual workspace root, not extensionPath
                                    const workspaceFolders = vscode.workspace.workspaceFolders;
                                    if (!workspaceFolders || workspaceFolders.length === 0) {
                                        throw new Error('No workspace folder is open');
                                    }
                                    const workspaceRoot = workspaceFolders[0].uri.fsPath;
                                    const reportDir = path.join(workspaceRoot, 'user_story_reports');
                                    if (!fs.existsSync(reportDir)) {
                                        fs.mkdirSync(reportDir, { recursive: true });
                                    }
                                    const filePath = path.join(reportDir, message.data.filename);
                                    fs.writeFileSync(filePath, message.data.content, 'utf8');
                                    vscode.window.showInformationMessage('CSV file saved to workspace: ' + filePath);
                                    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
                                } catch (error) {
                                    console.error('Error saving CSV to workspace:', error);
                                    vscode.window.showErrorMessage('Failed to save CSV to workspace: ' + error.message);
                                }
                                break;

                            case 'getJourneyStartData':
                                console.log("[Extension] Getting journey start data");
                                try {
                                    const journeyStartData = await loadJourneyStartData(modelService);
                                    panel.webview.postMessage({
                                        command: 'journeyStartDataReady',
                                        data: journeyStartData
                                    });
                                } catch (error) {
                                    console.error('[Extension] Error getting journey start data:', error);
                                    panel.webview.postMessage({
                                        command: 'journeyStartDataReady',
                                        success: false,
                                        error: error.message
                                    });
                                }
                                break;

                            case 'getPageListForJourneyStart':
                                console.log("[Extension] Getting page list for journey start");
                                try {
                                    const pages = await getPageListForJourneyStart(modelService);
                                    panel.webview.postMessage({
                                        command: 'journeyStartPageListReady',
                                        pages: pages
                                    });
                                } catch (error) {
                                    console.error('[Extension] Error getting page list:', error);
                                    panel.webview.postMessage({
                                        command: 'journeyStartPageListReady',
                                        success: false,
                                        error: error.message
                                    });
                                }
                                break;

                            case 'saveJourneyStartPages':
                                console.log("[Extension] Saving journey start pages");
                                try {
                                    await saveJourneyStartData(message.data.journeyStartPages, modelService);
                                    panel.webview.postMessage({
                                        command: 'journeyStartPagesSaved',
                                        success: true
                                    });
                                    vscode.window.showInformationMessage('Journey start pages saved successfully');
                                } catch (error) {
                                    console.error('[Extension] Error saving journey start pages:', error);
                                    panel.webview.postMessage({
                                        command: 'journeyStartPagesSaved',
                                        success: false,
                                        message: error.message
                                    });
                                    vscode.window.showErrorMessage('Failed to save journey start pages: ' + error.message);
                                }
                                break;

                            default:
                                console.log("[Extension] Unknown message command:", message.command);
                                break;
                        }
                    },
                    undefined,
                    context.subscriptions
                );

            } catch (error) {
                console.error("Error opening user stories journey view:", error);
                vscode.window.showErrorMessage(`Failed to open User Stories Journey view: ${error.message}`);
            }
        }
    );

    context.subscriptions.push(userStoriesJourneyCommand);
}

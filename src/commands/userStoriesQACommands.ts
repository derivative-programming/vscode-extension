// Description: Handles registration of user stories QA view related commands.
// Created: August 4, 2025

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ModelService } from '../services/modelService';

// Track active panels to avoid duplicates
const activePanels = new Map<string, vscode.WebviewPanel>();

// Track panel reference for the user stories QA view
const userStoriesQAPanel = {
    panel: null as vscode.WebviewPanel | null,
    context: null as vscode.ExtensionContext | null,
    modelService: null as ModelService | null
};

/**
 * Gets the reference to the user stories QA panel if it's open
 */
export function getUserStoriesQAPanel(): { 
    type: string; 
    context: vscode.ExtensionContext; 
    modelService: ModelService 
} | null {
    if (activePanels.has('userStoriesQA') && userStoriesQAPanel.context && userStoriesQAPanel.modelService) {
        return {
            type: 'userStoriesQA',
            context: userStoriesQAPanel.context,
            modelService: userStoriesQAPanel.modelService
        };
    }
    return null;
}

/**
 * Closes the user stories QA panel if it's open
 */
export function closeUserStoriesQAPanel(): void {
    console.log(`Closing user stories QA panel if open`);
    const panel = activePanels.get('userStoriesQA');
    if (panel) {
        panel.dispose();
        activePanels.delete('userStoriesQA');
    }
    // Clean up panel reference
    userStoriesQAPanel.panel = null;
}

/**
 * Load user stories QA data from both model and separate QA file
 */
async function loadUserStoriesQAData(panel: vscode.WebviewPanel, modelService: ModelService, sortColumn?: string, sortDescending?: boolean): Promise<void> {
    try {
        console.log("[Extension] Loading user stories QA data");
        const model = modelService.getCurrentModel();
        if (!model) {
            console.error("[Extension] No model available");
            panel.webview.postMessage({
                command: "setUserStoriesQAData",
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

        // Load existing QA data from separate file
        let existingQAData: any = { qaData: [] };
        let qaFilePath = '';
        const modelFilePath = modelService.getCurrentFilePath();
        if (modelFilePath) {
            const modelDir = path.dirname(modelFilePath);
            qaFilePath = path.join(modelDir, 'app-dna-user-story-qa.json');
            try {
                if (fs.existsSync(qaFilePath)) {
                    const qaContent = fs.readFileSync(qaFilePath, 'utf8');
                    existingQAData = JSON.parse(qaContent);
                }
            } catch (error) {
                console.warn("[Extension] Could not load existing QA file:", error);
                existingQAData = { qaData: [] };
            }
        }

        // Create lookup for existing QA data
        const qaLookup = new Map<string, any>();
        if (existingQAData.qaData) {
            existingQAData.qaData.forEach((qa: any) => {
                qaLookup.set(qa.storyId, qa);
            });
        }

        // Load existing dev data from separate file to get actualEndDate
        let existingDevData: any = { devData: [] };
        if (modelFilePath) {
            const modelDir = path.dirname(modelFilePath);
            const devFilePath = path.join(modelDir, 'app-dna-user-story-dev.json');
            try {
                if (fs.existsSync(devFilePath)) {
                    const devContent = fs.readFileSync(devFilePath, 'utf8');
                    existingDevData = JSON.parse(devContent);
                }
            } catch (error) {
                console.warn("[Extension] Could not load existing dev file:", error);
                existingDevData = { devData: [] };
            }
        }

        // Create lookup for existing dev data
        const devLookup = new Map<string, any>();
        if (existingDevData.devData) {
            existingDevData.devData.forEach((dev: any) => {
                devLookup.set(dev.storyId, dev);
            });
        }

        console.log(`[Extension] Found ${userStories.length} user stories`);

        // Load page mapping data
        let pageMappingData: any = { pageMappings: {} };
        if (modelFilePath) {
            const modelDir = path.dirname(modelFilePath);
            const pageMappingFilePath = path.join(modelDir, 'app-dna-user-story-page-mapping.json');
            try {
                if (fs.existsSync(pageMappingFilePath)) {
                    const mappingContent = fs.readFileSync(pageMappingFilePath, 'utf8');
                    pageMappingData = JSON.parse(mappingContent);
                }
            } catch (error) {
                console.warn("[Extension] Could not load page mapping file:", error);
            }
        }

        // Get all pages from model to find start page and role information
        const allPages: any[] = [];
        const allObjects = modelService.getAllObjects();
        allObjects.forEach((obj: any) => {
            // Extract workflows with isPage=true
            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                obj.objectWorkflow.forEach((workflow: any) => {
                    if (workflow.isPage === 'true') {
                        allPages.push({
                            name: workflow.name,
                            roleRequired: workflow.roleRequired,
                            isStartPage: workflow.isStartPage === 'true'
                        });
                    }
                });
            }
            // Extract reports with isPage=true
            if (obj.report && Array.isArray(obj.report)) {
                obj.report.forEach((report: any) => {
                    if (report.isPage === 'true' || report.isPage === undefined) {
                        allPages.push({
                            name: report.name,
                            roleRequired: report.roleRequired,
                            isStartPage: report.isStartPage === 'true'
                        });
                    }
                });
            }
        });

        // Build combined data array
        const combinedData: any[] = [];
        userStories.forEach(story => {
            const storyId = story.name || '';
            const storyNumber = story.storyNumber || '';
            const existingQA = qaLookup.get(storyId);

            // Get pages from mapping
            const mapping = pageMappingData.pageMappings[storyNumber];
            const mappedPages = mapping?.pageMapping || [];
            
            // Enrich page data with role and start page info
            const pageDetails = mappedPages.map((pageName: string) => {
                const pageInfo = allPages.find(p => p.name === pageName);
                return {
                    name: pageName,
                    roleRequired: pageInfo?.roleRequired || '',
                    isStartPage: pageInfo?.isStartPage || false
                };
            });

            // Get dev completed date from dev data
            const existingDev = devLookup.get(storyId);
            const devCompletedDate = existingDev?.actualEndDate || '';

            combinedData.push({
                storyId: storyId,
                storyNumber: storyNumber,
                storyText: story.storyText || '',
                devCompletedDate: devCompletedDate, // From dev file
                qaStatus: existingQA?.qaStatus || 'pending',
                qaNotes: existingQA?.qaNotes || '',
                dateVerified: existingQA?.dateVerified || '',
                qaFilePath: qaFilePath,
                mappedPages: pageDetails, // Array of page objects with name, role, isStartPage
                selected: false // For checkbox functionality
            });
        });

        // Sort the data
        if (sortColumn) {
            combinedData.sort((a, b) => {
                let aVal = a[sortColumn] || '';
                let bVal = b[sortColumn] || '';
                
                // Handle numeric comparison for storyNumber
                if (sortColumn === 'storyNumber') {
                    const aNum = typeof aVal === 'number' ? aVal : (aVal === '' ? 0 : parseInt(aVal) || 0);
                    const bNum = typeof bVal === 'number' ? bVal : (bVal === '' ? 0 : parseInt(bVal) || 0);
                    
                    const result = aNum - bNum;
                    return sortDescending ? -result : result;
                }
                
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

        console.log(`[Extension] Sending ${combinedData.length} QA items to webview`);

        // Send data to webview
        panel.webview.postMessage({
            command: "setUserStoriesQAData",
            data: {
                items: combinedData,
                totalRecords: combinedData.length,
                sortColumn: sortColumn || 'storyNumber',
                sortDescending: sortDescending || false
            }
        });

    } catch (error) {
        console.error("[Extension] Error loading user stories QA data:", error);
        panel.webview.postMessage({
            command: "setUserStoriesQAData",
            data: { items: [], totalRecords: 0, sortColumn: 'storyNumber', sortDescending: false, error: error.message }
        });
    }
}

/**
 * Save QA data to separate JSON file
 */
async function saveQAData(qaDataArray: any[], filePath: string): Promise<void> {
    try {
        const data = { qaData: qaDataArray };
        const content = JSON.stringify(data, null, 2);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[Extension] QA data saved to ${filePath}`);
    } catch (error) {
        console.error(`[Extension] Error saving QA data:`, error);
        throw error;
    }
}

/**
 * Register user stories QA commands
 */
export function registerUserStoriesQACommands(context: vscode.ExtensionContext, modelService: ModelService): void {
    // Register user stories QA command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.userStoriesQA', async (initialTab?: string) => {
            // Store references to context and modelService
            userStoriesQAPanel.context = context;
            userStoriesQAPanel.modelService = modelService;

            // Create a consistent panel ID
            const panelId = 'userStoriesQA';
            console.log(`userStoriesQA command called (panelId: ${panelId}, initialTab: ${initialTab})`);

            // Check if panel already exists
            if (activePanels.has(panelId)) {
                console.log(`Panel already exists for user stories QA, revealing existing panel`);
                // Panel exists, reveal it instead of creating a new one
                const existingPanel = activePanels.get(panelId);
                existingPanel?.reveal(vscode.ViewColumn.One);
                
                // If initialTab is specified, send message to switch to that tab
                if (initialTab && existingPanel) {
                    existingPanel.webview.postMessage({
                        command: 'switchToTab',
                        data: { tabName: initialTab }
                    });
                }
                return;
            }

            // Create new panel if one doesn't exist
            const panel = vscode.window.createWebviewPanel(
                'userStoriesQA',
                'User Stories - QA',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                }
            );

            // Track this panel
            console.log(`Adding new panel to activePanels with id: ${panelId}`);
            activePanels.set(panelId, panel);
            userStoriesQAPanel.panel = panel;

            // Cleanup when panel is disposed
            panel.onDidDispose(() => {
                console.log(`Panel disposed, removing from tracking: ${panelId}`);
                activePanels.delete(panelId);
                userStoriesQAPanel.panel = null;
            });

            // Get the VS Code CSS and JS URI for the webview
            const codiconsUri = panel.webview.asWebviewUri(
                vscode.Uri.joinPath(context.extensionUri, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css')
            );
            const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoriesQAView.js'));
            const qaCostTabTemplateUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'qaCostTabTemplate.js'));
            const qaCostAnalysisFunctionsUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'qaCostAnalysisFunctions.js'));

            // Set the HTML content for the webview
            panel.webview.html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>User Stories QA</title>
                    <link href="${codiconsUri}" rel="stylesheet">
                    <style>
                        body { font-family: var(--vscode-font-family); margin: 0; padding: 20px; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
                        
                        /* Tab styling following metrics analysis pattern */
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
                        
                        .tab:hover {
                            background-color: var(--vscode-tab-inactiveBackground);
                            color: var(--vscode-tab-inactiveForeground);
                        }
                        
                        .tab.active {
                            background-color: var(--vscode-tab-activeBackground);
                            color: var(--vscode-tab-activeForeground);
                            border-bottom: 2px solid var(--vscode-focusBorder);
                        }
                        
                        .tab.active:hover {
                            background-color: var(--vscode-tab-activeBackground);
                            color: var(--vscode-tab-activeForeground);
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
                        
                        /* Empty state styling for analysis tab */
                        .empty-state {
                            text-align: center;
                            padding: 40px 20px;
                            color: var(--vscode-descriptionForeground);
                        }
                        
                        .empty-state h3 {
                            color: var(--vscode-foreground);
                            margin-bottom: 10px;
                        }
                        
                        .empty-state ul {
                            list-style-position: inside;
                            color: var(--vscode-foreground);
                            text-align: left;
                            display: inline-block;
                        }
                        
                        /* Histogram container styles */
                        .histogram-container {
                            padding: 20px;
                            background: var(--vscode-editor-background);
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
                        
                        .histogram-title h3 {
                            margin: 0 0 5px 0;
                            color: var(--vscode-foreground);
                            font-size: 18px;
                            font-weight: 500;
                        }
                        
                        .histogram-title p {
                            margin: 0;
                            color: var(--vscode-descriptionForeground);
                            font-size: 13px;
                        }
                        
                        .histogram-actions {
                            display: flex;
                            gap: 8px;
                            align-items: center;
                        }
                        
                        .chart-type-toggle {
                            display: flex;
                            gap: 2px;
                            border: 1px solid var(--vscode-button-border);
                            border-radius: 4px;
                            overflow: hidden;
                            background: var(--vscode-button-secondaryBackground);
                        }
                        
                        .chart-type-button {
                            padding: 6px 10px;
                            background: var(--vscode-button-secondaryBackground);
                            color: var(--vscode-button-secondaryForeground);
                            border: none;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.2s;
                        }
                        
                        .chart-type-button:hover {
                            background: var(--vscode-button-secondaryHoverBackground);
                        }
                        
                        .chart-type-button.active {
                            background: var(--vscode-button-background);
                            color: var(--vscode-button-foreground);
                        }
                        
                        .chart-type-button i {
                            font-size: 16px;
                        }
                        
                        .histogram-refresh-button {
                            background: none !important;
                        }
                        
                        .histogram-viz {
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 4px;
                            margin-bottom: 20px;
                            padding: 10px;
                            background: var(--vscode-editor-background);
                        }
                        
                        .histogram-viz.hidden {
                            display: none;
                        }
                        
                        .loading {
                            text-align: center;
                            padding: 40px;
                            color: var(--vscode-descriptionForeground);
                            font-style: italic;
                        }
                        
                        .loading.hidden {
                            display: none;
                        }
                        
                        /* QA Distribution Summary Stats */
                        .qa-distribution-summary {
                            margin-top: 20px;
                            padding: 15px;
                            background: var(--vscode-editor-inactiveSelectionBackground);
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 4px;
                        }
                        
                        .summary-stats {
                            display: flex;
                            gap: 30px;
                            flex-wrap: wrap;
                        }
                        
                        .stat-item {
                            display: flex;
                            flex-direction: column;
                            gap: 5px;
                        }
                        
                        .stat-label {
                            font-size: 12px;
                            color: var(--vscode-descriptionForeground);
                            font-weight: 500;
                        }
                        
                        .stat-value {
                            font-size: 20px;
                            color: var(--vscode-foreground);
                            font-weight: 600;
                        }
                        
                        .stat-value.success {
                            color: #28a745;
                        }
                        
                        /* QA Distribution tooltip */
                        .qa-distribution-tooltip {
                            position: absolute;
                            background: var(--vscode-editorHoverWidget-background);
                            border: 1px solid var(--vscode-editorHoverWidget-border);
                            border-radius: 4px;
                            padding: 10px;
                            font-size: 12px;
                            color: var(--vscode-editorHoverWidget-foreground);
                            pointer-events: none;
                            z-index: 1000;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                            line-height: 1.5;
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
                        button:hover:not(:disabled):not(.filter-button-secondary):not(.tab) {
                            background-color: var(--vscode-button-hoverBackground);
                        }
                        .qa-status-select {
                            width: 100%;
                            padding: 2px 4px;
                            border: 1px solid var(--vscode-input-border);
                            background-color: var(--vscode-input-background);
                            color: var(--vscode-input-foreground);
                            border-radius: 2px;
                        }
                        .qa-status-select:focus {
                            outline: 1px solid var(--vscode-focusBorder);
                            outline-offset: -1px;
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
                            outline: none;
                        }
                        
                        .icon-button:active {
                            outline: none;
                            border: none;
                        }
                        
                        /* Override PNG button hover to prevent blue background */
                        #generateQADistributionPngBtn:hover {
                            background: var(--vscode-toolbar-hoverBackground) !important;
                        }
                        
                        /* Processing overlay for histogram refresh */
                        .histogram-processing-overlay {
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: rgba(0, 0, 0, 0.3);
                            display: none;
                            align-items: center;
                            justify-content: center;
                            z-index: 1000;
                            border-radius: 4px;
                        }
                        
                        .histogram-processing-overlay.active {
                            display: flex;
                        }
                        
                        .histogram-processing-spinner {
                            width: 40px;
                            height: 40px;
                            border: 4px solid rgba(255, 255, 255, 0.3);
                            border-top: 4px solid var(--vscode-progressBar-background);
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                        }
                        
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
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
                            background-color: var(--vscode-button-secondaryHoverBackground, var(--vscode-toolbar-hoverBackground)) !important;
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
                        
                        .dev-completed-date-column {
                            width: 180px;
                            text-align: center;
                        }
                        
                        .qa-status-column {
                            width: 120px;
                        }
                        
                        .qa-notes-column {
                            width: 200px;
                        }
                        
                        .date-verified-column {
                            width: 120px;
                        }
                        
                        .qa-by-column {
                            width: 120px;
                        }
                        
                        .bulk-actions {
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            gap: 10px;
                            margin-bottom: 10px;
                        }
                        
                        .bulk-actions-left {
                            display: flex;
                            align-items: center;
                            gap: 10px;
                        }
                        
                        .bulk-status-dropdown {
                            background-color: var(--vscode-input-background);
                            color: var(--vscode-input-foreground);
                            border: 1px solid var(--vscode-input-border);
                            border-radius: 2px;
                            padding: 4px 8px;
                            font-size: 13px;
                            min-width: 120px;
                        }
                        
                        .bulk-status-dropdown:focus {
                            outline: 1px solid var(--vscode-focusBorder);
                            outline-offset: -1px;
                        }
                        
                        .apply-button {
                            background-color: var(--vscode-button-background);
                            color: var(--vscode-button-foreground);
                            border: none;
                            padding: 4px 12px;
                            cursor: pointer;
                            border-radius: 2px;
                            font-size: 13px;
                        }
                        
                        .apply-button:hover {
                            background-color: var(--vscode-button-hoverBackground);
                        }
                        
                        .apply-button:disabled {
                            opacity: 0.4;
                            cursor: not-allowed;
                            background-color: var(--vscode-input-background);
                            color: var(--vscode-descriptionForeground);
                            border: 1px solid var(--vscode-input-border);
                        }
                        
                        .header-actions {
                            display: flex;
                            gap: 8px;
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
                        
                        .qa-status-select {
                            width: 100%;
                            padding: 2px 4px;
                            border: 1px solid var(--vscode-input-border);
                            background-color: var(--vscode-input-background);
                            color: var(--vscode-input-foreground);
                            border-radius: 2px;
                        }
                        
                        .qa-notes-input {
                            width: 100%;
                            padding: 2px 4px;
                            border: 1px solid var(--vscode-input-border);
                            background-color: var(--vscode-input-background);
                            color: var(--vscode-input-foreground);
                            border-radius: 2px;
                            min-height: 60px;
                            resize: vertical;
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
                        
                        /* Board Header Actions */
                        .board-header-actions {
                            display: flex;
                            justify-content: flex-end;
                            gap: 8px;
                            margin-bottom: 10px;
                        }
                        
                        /* Kanban Board Styles */
                        .kanban-board {
                            display: flex;
                            gap: 15px;
                            overflow-x: auto;
                            padding: 10px 0;
                            min-height: 500px;
                        }
                        
                        .kanban-column {
                            flex: 1;
                            min-width: 250px;
                            background: var(--vscode-sideBar-background);
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 4px;
                            display: flex;
                            flex-direction: column;
                        }
                        
                        .kanban-column-header {
                            padding: 12px;
                            background: var(--vscode-list-hoverBackground);
                            border-bottom: 1px solid var(--vscode-panel-border);
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            font-weight: 600;
                            position: sticky;
                            top: 0;
                            z-index: 1;
                        }
                        
                        .kanban-column-title {
                            font-size: 14px;
                            color: var(--vscode-foreground);
                        }
                        
                        .kanban-column-count {
                            background: var(--vscode-badge-background);
                            color: var(--vscode-badge-foreground);
                            padding: 2px 8px;
                            border-radius: 10px;
                            font-size: 12px;
                            font-weight: 600;
                        }
                        
                        .kanban-column-content {
                            flex: 1;
                            padding: 10px;
                            overflow-y: auto;
                            min-height: 100px;
                        }
                        
                        .kanban-column-content.drag-over {
                            background: var(--vscode-list-dropBackground);
                            border: 2px dashed var(--vscode-focusBorder);
                        }
                        
                        .kanban-card {
                            background: var(--vscode-editor-background);
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 4px;
                            padding: 10px;
                            margin-bottom: 8px;
                            cursor: move;
                            transition: all 0.2s ease;
                        }
                        
                        .kanban-card:hover {
                            border-color: var(--vscode-focusBorder);
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                            transform: translateY(-2px);
                        }
                        
                        .kanban-card.dragging {
                            opacity: 0.5;
                            transform: rotate(2deg);
                        }
                        
                        .kanban-card-number {
                            font-size: 12px;
                            font-weight: 600;
                            color: var(--vscode-textLink-foreground);
                            margin-bottom: 6px;
                        }
                        
                        .kanban-card-text {
                            font-size: 13px;
                            color: var(--vscode-foreground);
                            line-height: 1.4;
                            word-wrap: break-word;
                            max-height: 4.2em;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            display: -webkit-box;
                            -webkit-line-clamp: 3;
                            -webkit-box-orient: vertical;
                        }
                        
                        .kanban-card-footer {
                            margin-top: 8px;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            font-size: 11px;
                            color: var(--vscode-descriptionForeground);
                        }
                        
                        .kanban-card-has-notes {
                            display: inline-flex;
                            align-items: center;
                            gap: 3px;
                        }
                        
                        .kanban-card-has-notes .codicon {
                            font-size: 12px;
                        }
                        
                        .kanban-card-date {
                            display: inline-flex;
                            align-items: center;
                            gap: 3px;
                        }
                        
                        .kanban-card-date .codicon {
                            font-size: 12px;
                        }
                        
                        /* Status-specific column colors */
                        .kanban-column[data-status="pending"] .kanban-column-header {
                            border-left: 3px solid #858585;
                        }
                        
                        .kanban-column[data-status="ready-to-test"] .kanban-column-header {
                            border-left: 3px solid #0078d4;
                        }
                        
                        .kanban-column[data-status="started"] .kanban-column-header {
                            border-left: 3px solid #f39c12;
                        }
                        
                        .kanban-column[data-status="success"] .kanban-column-header {
                            border-left: 3px solid #28a745;
                        }
                        
                        .kanban-column[data-status="failure"] .kanban-column-header {
                            border-left: 3px solid #d73a49;
                        }
                        
                        /* Modal Styles */
                        .modal-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: rgba(0, 0, 0, 0.6);
                            display: none;
                            align-items: center;
                            justify-content: center;
                            z-index: 2000;
                        }
                        
                        .modal-overlay.active {
                            display: flex;
                        }
                        
                        .modal-content {
                            background: var(--vscode-editor-background);
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 4px;
                            width: 90%;
                            max-width: 600px;
                            max-height: 80vh;
                            overflow-y: auto;
                            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
                        }
                        
                        .modal-header {
                            padding: 15px 20px;
                            background: var(--vscode-sideBar-background);
                            border-bottom: 1px solid var(--vscode-panel-border);
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        }
                        
                        .modal-title {
                            font-size: 16px;
                            font-weight: 600;
                            color: var(--vscode-foreground);
                            margin: 0;
                        }
                        
                        .modal-close {
                            background: none;
                            border: none;
                            color: var(--vscode-foreground);
                            cursor: pointer;
                            padding: 4px 8px;
                            border-radius: 4px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 16px;
                        }
                        
                        .modal-close:hover {
                            background: var(--vscode-toolbar-hoverBackground);
                        }
                        
                        .modal-body {
                            padding: 20px;
                        }
                        
                        .modal-field {
                            margin-bottom: 20px;
                        }
                        
                        .modal-field label {
                            display: block;
                            font-weight: 600;
                            margin-bottom: 8px;
                            font-size: 13px;
                            color: var(--vscode-foreground);
                        }
                        
                        .modal-field-value {
                            padding: 8px 12px;
                            background: var(--vscode-input-background);
                            border: 1px solid var(--vscode-input-border);
                            border-radius: 3px;
                            color: var(--vscode-input-foreground);
                            font-size: 13px;
                            line-height: 1.5;
                        }
                        
                        .modal-field select {
                            width: 100%;
                            padding: 6px 8px;
                            background: var(--vscode-input-background);
                            border: 1px solid var(--vscode-input-border);
                            border-radius: 3px;
                            color: var(--vscode-input-foreground);
                            font-size: 13px;
                        }
                        
                        .modal-field select:focus {
                            outline: 1px solid var(--vscode-focusBorder);
                            outline-offset: -1px;
                        }
                        
                        .modal-field textarea {
                            width: 100%;
                            min-height: 100px;
                            padding: 8px 12px;
                            background: var(--vscode-input-background);
                            border: 1px solid var(--vscode-input-border);
                            border-radius: 3px;
                            color: var(--vscode-input-foreground);
                            font-size: 13px;
                            font-family: var(--vscode-font-family);
                            resize: vertical;
                            box-sizing: border-box;
                        }
                        
                        .modal-field textarea:focus {
                            outline: 1px solid var(--vscode-focusBorder);
                            outline-offset: -1px;
                        }
                        
                        /* Page list styles */
                        .page-list-container {
                            display: flex;
                            flex-direction: column;
                            gap: 6px;
                        }
                        
                        .page-list-item {
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            padding: 6px 10px;
                            background: var(--vscode-list-hoverBackground);
                            border-radius: 3px;
                            font-size: 12px;
                        }
                        
                        .page-list-item .page-name {
                            flex: 1;
                            font-weight: 500;
                            color: var(--vscode-foreground);
                        }
                        
                        .page-list-item .page-action-button {
                            background: none;
                            border: none;
                            color: var(--vscode-editor-foreground);
                            padding: 4px 6px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            border-radius: 3px;
                            transition: background 0.15s;
                        }
                        
                        .page-list-item .page-action-button:hover {
                            background: var(--vscode-button-secondaryHoverBackground);
                        }
                        
                        .page-list-item .page-badge {
                            padding: 2px 6px;
                            border-radius: 3px;
                            font-size: 10px;
                            font-weight: 600;
                            text-transform: uppercase;
                        }
                        
                        .page-list-item .start-page-badge {
                            background: var(--vscode-charts-green);
                            color: #000;
                        }
                        
                        .page-list-item .role-badge {
                            background: var(--vscode-button-secondaryBackground);
                            color: var(--vscode-button-secondaryForeground);
                        }
                        
                        .modal-footer {
                            padding: 15px 20px;
                            background: var(--vscode-sideBar-background);
                            border-top: 1px solid var(--vscode-panel-border);
                            display: flex;
                            justify-content: flex-end;
                            gap: 10px;
                        }
                        
                        .modal-button {
                            padding: 6px 14px;
                            border-radius: 3px;
                            font-size: 13px;
                            cursor: pointer;
                            border: none;
                        }
                        
                        .modal-button-primary {
                            background: var(--vscode-button-background);
                            color: var(--vscode-button-foreground);
                        }
                        
                        .modal-button-primary:hover {
                            background: var(--vscode-button-hoverBackground);
                        }
                        
                        .modal-button-secondary {
                            background: var(--vscode-button-secondaryBackground);
                            color: var(--vscode-button-secondaryForeground);
                        }
                        
                        .modal-button-secondary:hover {
                            background: var(--vscode-button-secondaryHoverBackground);
                        }
                        
                        /* Forecast Tab Styles */
                        .forecast-header-actions {
                            display: flex;
                            justify-content: flex-end;
                            gap: 8px;
                            margin-bottom: 15px;
                        }
                        
                        /* QA Project Overview Styles */
                        .qa-project-overview {
                            margin-bottom: 20px;
                        }
                        
                        .forecast-stats-content {
                            padding: 15px;
                            background: var(--vscode-editor-inactiveSelectionBackground);
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 4px;
                        }
                        
                        .forecast-stats-title {
                            margin: 0 0 15px 0;
                            font-size: 16px;
                            font-weight: 600;
                            color: var(--vscode-foreground);
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        }
                        
                        .project-overview-details {
                            display: block;
                        }
                        
                        .forecast-metric {
                            background: var(--vscode-editor-background);
                            border: 2px solid var(--vscode-panel-border);
                            border-radius: 6px;
                            padding: 12px;
                            display: flex;
                            align-items: center;
                            gap: 12px;
                            transition: all 0.2s ease;
                        }
                        
                        .forecast-metric:hover {
                            background: var(--vscode-list-hoverBackground);
                            border-color: var(--vscode-focusBorder);
                        }
                        
                        .forecast-metric.risk-low {
                            border-color: var(--vscode-testing-iconPassed);
                        }
                        
                        .forecast-metric.risk-medium {
                            border-color: var(--vscode-editorWarning-foreground);
                        }
                        
                        .forecast-metric.risk-high {
                            border-color: var(--vscode-editorError-foreground);
                        }
                        
                        .forecast-metric-icon {
                            font-size: 24px;
                            color: var(--vscode-symbolIcon-variableForeground);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        
                        .forecast-metric-content {
                            flex: 1;
                        }
                        
                        .forecast-metric-label {
                            font-size: 11px;
                            color: var(--vscode-descriptionForeground);
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            margin-bottom: 4px;
                        }
                        
                        .forecast-metric-value {
                            font-size: 18px;
                            font-weight: 600;
                            color: var(--vscode-foreground);
                        }
                        
                        .forecast-risk-section {
                            margin-top: 20px;
                            padding: 15px;
                            border-radius: 6px;
                            background: var(--vscode-editor-background);
                            border-left: 4px solid var(--vscode-panel-border);
                        }
                        
                        .forecast-risk-section.risk-low {
                            border-left-color: var(--vscode-testing-iconPassed);
                        }
                        
                        .forecast-risk-section.risk-medium {
                            border-left-color: var(--vscode-editorWarning-foreground);
                        }
                        
                        .forecast-risk-section.risk-high {
                            border-left-color: var(--vscode-editorError-foreground);
                        }
                        
                        .forecast-risk-title {
                            margin: 0 0 10px 0;
                            font-size: 14px;
                            font-weight: 600;
                            color: var(--vscode-foreground);
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        }
                        
                        .risk-level {
                            color: var(--vscode-editorWarning-foreground);
                        }
                        
                        .forecast-risk-section.risk-high .risk-level {
                            color: var(--vscode-editorError-foreground);
                        }
                        
                        .forecast-risk-section.risk-low .risk-level {
                            color: var(--vscode-testing-iconPassed);
                        }
                        
                        .risk-description {
                            margin: 0 0 10px 0;
                            font-size: 13px;
                            color: var(--vscode-descriptionForeground);
                        }
                        
                        .bottleneck-list {
                            list-style: none;
                            padding: 0;
                            margin: 0;
                        }
                        
                        .bottleneck-item {
                            display: flex;
                            align-items: flex-start;
                            gap: 8px;
                            padding: 8px;
                            margin-bottom: 6px;
                            background: var(--vscode-input-background);
                            border-radius: 4px;
                            font-size: 13px;
                        }
                        
                        .bottleneck-item i {
                            margin-top: 2px;
                            color: var(--vscode-editorWarning-foreground);
                        }
                        
                        .bottleneck-item.high i {
                            color: var(--vscode-editorError-foreground);
                        }
                        
                        .forecast-recommendations-section {
                            margin-top: 20px;
                            padding: 15px;
                            border-radius: 6px;
                            background: var(--vscode-editor-background);
                            border: 1px solid var(--vscode-panel-border);
                        }
                        
                        .forecast-recommendations-title {
                            margin: 0 0 10px 0;
                            font-size: 14px;
                            font-weight: 600;
                            color: var(--vscode-foreground);
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        }
                        
                        .recommendations-list {
                            list-style: none;
                            padding: 0;
                            margin: 0;
                        }
                        
                        .recommendation-item {
                            display: flex;
                            align-items: flex-start;
                            gap: 8px;
                            padding: 8px;
                            margin-bottom: 6px;
                            background: var(--vscode-input-background);
                            border-radius: 4px;
                            font-size: 13px;
                        }
                        
                        .recommendation-item i {
                            margin-top: 2px;
                            color: var(--vscode-symbolIcon-variableForeground);
                        }
                        
                        .recommendation-item.priority-high {
                            border-left: 3px solid var(--vscode-editorError-foreground);
                        }
                        
                        .recommendation-item.priority-medium {
                            border-left: 3px solid var(--vscode-editorWarning-foreground);
                        }
                        
                        .recommendation-item.priority-low {
                            border-left: 3px solid var(--vscode-testing-iconPassed);
                        }
                        
                        /* Timeline Controls Styles */
                        .timeline-controls {
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            padding: 12px;
                            margin-bottom: 15px;
                            background: var(--vscode-editor-background);
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 4px;
                        }
                        
                        .timeline-controls-left {
                            display: flex;
                            align-items: center;
                            gap: 10px;
                        }
                        
                        .timeline-controls-right {
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        }
                        
                        .timeline-control-label {
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            font-size: 13px;
                            color: var(--vscode-foreground);
                            font-weight: 500;
                            margin-right: 8px;
                        }
                        
                        .timeline-control-label .codicon {
                            font-size: 14px;
                        }
                        
                        .timeline-btn {
                            background: var(--vscode-button-secondaryBackground);
                            color: var(--vscode-button-secondaryForeground);
                            border: 1px solid var(--vscode-button-border, transparent);
                            border-radius: 3px;
                            padding: 6px 10px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.2s ease;
                            min-width: 32px;
                            min-height: 28px;
                        }
                        
                        .timeline-btn:hover {
                            background: var(--vscode-button-secondaryHoverBackground);
                        }
                        
                        .timeline-btn:active {
                            transform: translateY(1px);
                        }
                        
                        .timeline-btn .codicon {
                            font-size: 14px;
                        }
                        
                        .gantt-container {
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 4px;
                            padding: 20px;
                            background: var(--vscode-editor-background);
                            min-height: 400px;
                            position: relative;
                        }
                        
                        .gantt-viz {
                            overflow-x: auto;
                            overflow-y: auto;
                        }
                        
                        /* Forecast processing overlay */
                        .forecast-processing-overlay {
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: rgba(0, 0, 0, 0.3);
                            display: none;
                            align-items: center;
                            justify-content: center;
                            z-index: 1000;
                            border-radius: 4px;
                        }
                        
                        .forecast-processing-overlay.active {
                            display: flex;
                        }
                        
                        .forecast-processing-spinner {
                            width: 40px;
                            height: 40px;
                            border: 4px solid rgba(255, 255, 255, 0.3);
                            border-top: 4px solid var(--vscode-progressBar-background);
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                        }
                        
                        .gantt-tooltip {
                            position: absolute;
                            background: var(--vscode-editorHoverWidget-background);
                            border: 1px solid var(--vscode-editorHoverWidget-border);
                            border-radius: 4px;
                            padding: 10px;
                            font-size: 12px;
                            color: var(--vscode-editorHoverWidget-foreground);
                            pointer-events: none;
                            z-index: 1000;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                            line-height: 1.5;
                        }
                        
                        /* Config Modal Styles */
                        .config-section {
                            margin-bottom: 25px;
                        }
                        
                        .config-section h4 {
                            margin: 0 0 12px 0;
                            font-size: 14px;
                            font-weight: 600;
                            color: var(--vscode-foreground);
                            border-bottom: 1px solid var(--vscode-panel-border);
                            padding-bottom: 8px;
                        }
                        
                        .config-table {
                            width: 100%;
                            border-collapse: collapse;
                        }
                        
                        .config-table th {
                            text-align: left;
                            padding: 8px;
                            background: var(--vscode-sideBar-background);
                            border: 1px solid var(--vscode-panel-border);
                            font-size: 12px;
                            font-weight: 600;
                        }
                        
                        .config-table td {
                            padding: 6px 8px;
                            border: 1px solid var(--vscode-panel-border);
                        }
                        
                        .config-table input[type="checkbox"] {
                            cursor: pointer;
                        }
                        
                        .config-table input[type="time"] {
                            width: 100%;
                            padding: 4px;
                            background: var(--vscode-input-background);
                            border: 1px solid var(--vscode-input-border);
                            color: var(--vscode-input-foreground);
                            border-radius: 2px;
                        }
                        
                        .config-summary {
                            display: flex;
                            flex-direction: column;
                            gap: 8px;
                            padding: 12px;
                            background: var(--vscode-sideBar-background);
                            border-radius: 4px;
                            font-size: 13px;
                        }
                        
                        .modal-field input[type="number"] {
                            width: 100%;
                            padding: 6px 8px;
                            background: var(--vscode-input-background);
                            border: 1px solid var(--vscode-input-border);
                            border-radius: 3px;
                            color: var(--vscode-input-foreground);
                            font-size: 13px;
                            box-sizing: border-box;
                        }
                        
                        .modal-field input[type="number"]:focus {
                            outline: 1px solid var(--vscode-focusBorder);
                            outline-offset: -1px;
                        }

                        /* Cost Tab Styles */
                        .cost-tab-container {
                            padding: 0;
                        }

                        .cost-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 20px;
                        }

                        .cost-header h3 {
                            margin: 0;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        }

                        .cost-actions {
                            display: flex;
                            gap: 8px;
                        }

                        .cost-filters {
                            display: flex;
                            gap: 20px;
                            margin-bottom: 20px;
                            padding: 12px;
                            background: var(--vscode-editor-background);
                            border-radius: 4px;
                        }

                        .cost-filters label {
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            cursor: pointer;
                        }

                        .cost-table-wrapper {
                            overflow-x: auto;
                            margin-bottom: 24px;
                        }

                        .cost-table {
                            width: 100%;
                            border-collapse: collapse;
                            font-size: 13px;
                        }

                        .cost-table thead th {
                            position: sticky;
                            top: 0;
                            background: var(--vscode-editor-background);
                            padding: 12px 16px;
                            text-align: left;
                            border-bottom: 2px solid var(--vscode-panel-border);
                            font-weight: 600;
                            z-index: 10;
                        }

                        .cost-table .tester-column {
                            min-width: 150px;
                            position: sticky;
                            left: 0;
                            background: var(--vscode-editor-background);
                            z-index: 11;
                        }

                        .cost-table thead .tester-column {
                            z-index: 12;
                        }

                        .cost-table .month-column {
                            min-width: 120px;
                            text-align: right;
                        }

                        .cost-table .month-column.current-month {
                            background: var(--vscode-list-hoverBackground);
                        }

                        .cost-table .current-badge {
                            display: block;
                            font-size: 10px;
                            font-weight: normal;
                            color: var(--vscode-charts-blue);
                            margin-top: 2px;
                        }

                        .cost-table tbody tr {
                            border-bottom: 1px solid var(--vscode-panel-border);
                        }

                        .cost-table tbody tr:hover {
                            background: var(--vscode-list-hoverBackground);
                        }

                        .cost-table .tester-row td {
                            padding: 12px 16px;
                        }

                        .cost-table .tester-name {
                            font-weight: 500;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            position: sticky;
                            left: 0;
                            background: inherit;
                        }

                        .cost-table .total-row {
                            background: var(--vscode-editor-background);
                            border-top: 2px solid var(--vscode-panel-border);
                            font-weight: 600;
                        }

                        .cost-cell {
                            text-align: right;
                        }

                        .cost-cell.current-month {
                            background: var(--vscode-list-hoverBackground);
                        }

                        .cost-cell.has-cost {
                            color: var(--vscode-charts-green);
                        }

                        .cost-summary {
                            display: flex;
                            gap: 20px;
                            padding: 20px;
                            background: var(--vscode-editor-background);
                            border-radius: 4px;
                        }

                        .summary-card {
                            flex: 1;
                            padding: 16px;
                            background: var(--vscode-input-background);
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 4px;
                        }

                        .summary-label {
                            font-size: 11px;
                            text-transform: uppercase;
                            color: var(--vscode-descriptionForeground);
                            margin-bottom: 8px;
                        }

                        .summary-value {
                            font-size: 24px;
                            font-weight: 600;
                            color: var(--vscode-charts-green);
                        }
                    </style>
                </head>
                <body>
                    <div class="validation-header">
                        <h2>User Stories - QA</h2>
                        <p>Track and manage quality assurance testing for user stories with multiple views</p>
                    </div>

                    <div class="tabs">
                        <button class="tab ${initialTab === 'analysis' ? '' : (initialTab === 'board' ? '' : (initialTab === 'forecast' ? '' : (initialTab === 'cost' ? '' : 'active')))}" data-tab="details">Details</button>
                        <button class="tab ${initialTab === 'board' ? 'active' : ''}" data-tab="board">Board</button>
                        <button class="tab ${initialTab === 'analysis' ? 'active' : ''}" data-tab="analysis">Status Distribution</button>
                        <button class="tab ${initialTab === 'forecast' ? 'active' : ''}" data-tab="forecast">Forecast</button>
                        <button class="tab ${initialTab === 'cost' ? 'active' : ''}" data-tab="cost">Cost</button>
                    </div>

                    <div id="details-tab" class="tab-content ${initialTab === 'analysis' || initialTab === 'board' || initialTab === 'forecast' ? '' : 'active'}">
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
                                    <label>QA Status:</label>
                                    <select id="filterQAStatus">
                                        <option value="">All Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="ready-to-test">Ready to Test</option>
                                        <option value="started">Started</option>
                                        <option value="success">Success</option>
                                        <option value="failure">Failure</option>
                                    </select>
                                </div>
                            </div>
                            <div class="filter-actions">
                                <button onclick="clearFilters()" class="filter-button-secondary">Clear All</button>
                            </div>
                        </div>
                    </div>

                    <div class="bulk-actions">
                        <div class="bulk-actions-left">
                            <select id="bulkStatusDropdown" class="bulk-status-dropdown">
                                <option value="">Select Status</option>
                                <option value="pending">Pending</option>
                                <option value="ready-to-test">Ready to Test</option>
                                <option value="started">Started</option>
                                <option value="success">Success</option>
                                <option value="failure">Failure</option>
                            </select>
                            <button id="applyButton" class="apply-button" disabled>Apply to Selected</button>
                        </div>
                        <div class="header-actions">
                            <button id="exportButton" class="icon-button" title="Download CSV">
                                <i class="codicon codicon-cloud-download"></i>
                            </button>
                            <button id="refreshButton" class="refresh-button" title="Refresh Table">
                            </button>
                        </div>
                    </div>

                    <div class="table-container">
                        <table id="qaTable">
                            <thead id="qaTableHead">
                                <!-- Table headers will be dynamically generated -->
                            </thead>
                            <tbody id="qaTableBody">
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
                    </div>

                    <div id="board-tab" class="tab-content ${initialTab === 'board' ? 'active' : ''}">
                        <div class="filter-section">
                            <div class="filter-header" onclick="toggleBoardFilterSection()">
                                <span class="codicon codicon-chevron-down" id="boardFilterChevron"></span>
                                <span>Filters</span>
                            </div>
                            <div class="filter-content" id="boardFilterContent">
                                <div class="filter-row">
                                    <div class="filter-group">
                                        <label>Story Number:</label>
                                        <input type="text" id="boardFilterStoryNumber" placeholder="Filter by story number...">
                                    </div>
                                    <div class="filter-group">
                                        <label>Story Text:</label>
                                        <input type="text" id="boardFilterStoryText" placeholder="Filter by story text...">
                                    </div>
                                </div>
                                <div class="filter-actions">
                                    <button onclick="clearBoardFilters()" class="filter-button-secondary">Clear All</button>
                                </div>
                            </div>
                        </div>

                        <div class="board-header-actions">
                            <button id="boardExportButton" class="icon-button" title="Download CSV">
                                <i class="codicon codicon-cloud-download"></i>
                            </button>
                            <button id="boardRefreshButton" class="icon-button" title="Refresh Board">
                                <i class="codicon codicon-refresh"></i>
                            </button>
                        </div>

                        <div class="kanban-board" id="kanbanBoard">
                            <div class="kanban-column" data-status="pending">
                                <div class="kanban-column-header">
                                    <span class="kanban-column-title">Pending</span>
                                    <span class="kanban-column-count" id="count-pending">0</span>
                                </div>
                                <div class="kanban-column-content" id="column-pending" data-status="pending">
                                    <!-- Cards will be dynamically generated -->
                                </div>
                            </div>
                            
                            <div class="kanban-column" data-status="ready-to-test">
                                <div class="kanban-column-header">
                                    <span class="kanban-column-title">Ready to Test</span>
                                    <span class="kanban-column-count" id="count-ready-to-test">0</span>
                                </div>
                                <div class="kanban-column-content" id="column-ready-to-test" data-status="ready-to-test">
                                    <!-- Cards will be dynamically generated -->
                                </div>
                            </div>
                            
                            <div class="kanban-column" data-status="started">
                                <div class="kanban-column-header">
                                    <span class="kanban-column-title">Started</span>
                                    <span class="kanban-column-count" id="count-started">0</span>
                                </div>
                                <div class="kanban-column-content" id="column-started" data-status="started">
                                    <!-- Cards will be dynamically generated -->
                                </div>
                            </div>
                            
                            <div class="kanban-column" data-status="success">
                                <div class="kanban-column-header">
                                    <span class="kanban-column-title">Success</span>
                                    <span class="kanban-column-count" id="count-success">0</span>
                                </div>
                                <div class="kanban-column-content" id="column-success" data-status="success">
                                    <!-- Cards will be dynamically generated -->
                                </div>
                            </div>
                            
                            <div class="kanban-column" data-status="failure">
                                <div class="kanban-column-header">
                                    <span class="kanban-column-title">Failure</span>
                                    <span class="kanban-column-count" id="count-failure">0</span>
                                </div>
                                <div class="kanban-column-content" id="column-failure" data-status="failure">
                                    <!-- Cards will be dynamically generated -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="analysis-tab" class="tab-content ${initialTab === 'analysis' ? 'active' : ''}">
                        <div class="histogram-container" style="position: relative;">
                            <div class="histogram-header">
                                <div class="histogram-header-content">
                                    <div class="histogram-title">
                                        <h3>QA Status Distribution</h3>
                                        <p>Distribution of user stories across QA testing statuses</p>
                                    </div>
                                    <div class="histogram-actions">
                                        <div class="chart-type-toggle">
                                            <button id="chartTypeBar" class="chart-type-button active" title="Bar Chart">
                                                <i class="codicon codicon-graph"></i>
                                            </button>
                                            <button id="chartTypePie" class="chart-type-button" title="Pie Chart">
                                                <i class="codicon codicon-pie-chart"></i>
                                            </button>
                                        </div>
                                        <button id="refreshQADistributionButton" class="icon-button histogram-refresh-button" title="Refresh Distribution">
                                            <i class="codicon codicon-refresh"></i>
                                        </button>
                                        <button id="generateQADistributionPngBtn" class="icon-button" title="Export as PNG">
                                            <i class="codicon codicon-device-camera"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="qa-distribution-processing" class="histogram-processing-overlay">
                                <div class="histogram-processing-spinner"></div>
                            </div>
                            
                            <div id="qa-distribution-loading" class="loading">Loading QA status distribution...</div>
                            <div id="qa-distribution-visualization" class="histogram-viz hidden"></div>
                            
                            <div class="qa-distribution-summary">
                                <div class="summary-stats">
                                    <div class="stat-item">
                                        <span class="stat-label">Total Stories:</span>
                                        <span class="stat-value" id="totalQAStories">0</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Success Rate:</span>
                                        <span class="stat-value success" id="qaSuccessRate">0%</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Completion Rate:</span>
                                        <span class="stat-value" id="qaCompletionRate">0%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="spinner-overlay" class="spinner-overlay" style="display: none;">
                        <div class="spinner"></div>
                    </div>

                    <div id="forecast-tab" class="tab-content ${initialTab === 'forecast' ? 'active' : ''}">
                        <div class="forecast-header-actions">
                            <button id="configForecastButton" class="icon-button" title="Configure Forecast">
                                <i class="codicon codicon-settings-gear"></i>
                            </button>
                            <button id="forecastRefreshButton" class="icon-button" title="Refresh Forecast">
                                <i class="codicon codicon-refresh"></i>
                            </button>
                            <button id="forecastExportButton" class="icon-button" title="Download CSV">
                                <i class="codicon codicon-cloud-download"></i>
                            </button>
                        </div>

                        <div id="qa-project-overview" class="qa-project-overview">
                            <!-- Project Overview will be dynamically generated -->
                        </div>

                        <div class="timeline-controls">
                            <div class="timeline-controls-left">
                            </div>
                            
                            <div class="timeline-controls-right">
                                <label class="timeline-control-label">
                                    <span class="codicon codicon-calendar"></span>
                                    Zoom:
                                </label>
                                <button class="timeline-btn" onclick="zoomQAGanttChart('hour')" title="Hour view">
                                    <span class="codicon codicon-watch"></span>
                                </button>
                                <button class="timeline-btn" onclick="zoomQAGanttChart('day')" title="Day view">
                                    <span class="codicon codicon-dash"></span>
                                </button>
                                <button class="timeline-btn" onclick="zoomQAGanttChart('week')" title="Week view">
                                    <span class="codicon codicon-menu"></span>
                                </button>
                                <button class="timeline-btn" onclick="zoomQAGanttChart('month')" title="Month view">
                                    <span class="codicon codicon-three-bars"></span>
                                </button>
                                <button class="timeline-btn" onclick="zoomQAGanttChart('reset')" title="Reset zoom">
                                    <span class="codicon codicon-screen-normal"></span>
                                </button>
                            </div>
                        </div>

                        <div class="gantt-container">
                            <div id="forecast-processing" class="forecast-processing-overlay">
                                <div class="forecast-processing-spinner"></div>
                            </div>
                            <div id="gantt-loading" class="loading">Loading forecast...</div>
                            <div id="forecast-gantt" class="gantt-viz"></div>
                            <div id="forecast-empty-state" class="empty-state" style="display: none;">
                                <h3>No Stories to Forecast</h3>
                                <p>There are no stories in "Ready to Test" status.</p>
                                <p>Move stories to "Ready to Test" in the Board or Details tab to see the forecast.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Cost Tab -->
                    <div id="cost-tab" class="tab-content ${initialTab === 'cost' ? 'active' : ''}">
                        <div id="qaCostAnalysisContainer">
                            <div class="empty-state">
                                <i class="codicon codicon-credit-card" style="font-size: 48px; opacity: 0.5;"></i>
                                <h3>Cost Analysis</h3>
                                <p>Loading QA cost breakdown by tester...</p>
                            </div>
                        </div>
                    </div>

                    <!-- Card Detail Modal -->
                    <div id="cardDetailModal" class="modal-overlay">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3 class="modal-title" id="modalTitle">Story Details</h3>
                                <button class="modal-close" onclick="closeCardModal()">
                                    <i class="codicon codicon-close"></i>
                                </button>
                            </div>
                            <div class="modal-body">
                                <div class="modal-field">
                                    <label>Story Number:</label>
                                    <div class="modal-field-value" id="modalStoryNumber"></div>
                                </div>
                                <div class="modal-field">
                                    <label>Story Text:</label>
                                    <div class="modal-field-value" id="modalStoryText"></div>
                                </div>
                                <div class="modal-field">
                                    <label>Page Mapping:</label>
                                    <div class="modal-field-value" id="modalPageMapping">
                                        <div id="modalPageList" class="page-list-container"></div>
                                        <div id="modalNoPages" class="no-pages-message" style="display:none; color: var(--vscode-descriptionForeground); font-style: italic;">
                                            No pages mapped to this story
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-field">
                                    <label>QA Status:</label>
                                    <select id="modalQAStatus">
                                        <option value="pending">Pending</option>
                                        <option value="ready-to-test">Ready to Test</option>
                                        <option value="started">Started</option>
                                        <option value="success">Success</option>
                                        <option value="failure">Failure</option>
                                    </select>
                                </div>
                                <div class="modal-field">
                                    <label>QA Notes:</label>
                                    <textarea id="modalQANotes" placeholder="Enter QA notes..."></textarea>
                                </div>
                                <div class="modal-field">
                                    <label>Date Verified:</label>
                                    <div class="modal-field-value" id="modalDateVerified">Not yet verified</div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button class="modal-button modal-button-secondary" onclick="closeCardModal()">Cancel</button>
                                <button class="modal-button modal-button-primary" onclick="saveCardModal()">Save</button>
                            </div>
                        </div>
                    </div>

                    <!-- QA Configuration Modal -->
                    <div id="qaConfigModal" class="modal-overlay">
                        <div class="modal-content" style="max-width: 700px;">
                            <div class="modal-header">
                                <h3 class="modal-title">QA Forecast Configuration</h3>
                                <button class="modal-close" onclick="closeQAConfigModal()">
                                    <i class="codicon codicon-close"></i>
                                </button>
                            </div>
                            <div class="modal-body">
                                <div class="config-section">
                                    <h4>Testing Parameters</h4>
                                    <div class="modal-field">
                                        <label>Average Test Time per Story (hours):</label>
                                        <input type="number" id="configAvgTestTime" min="0.5" max="40" step="0.5" value="4" />
                                    </div>
                                    <div class="modal-field">
                                        <label>Available QA Resources (testers):</label>
                                        <input type="number" id="configQAResources" min="1" max="20" step="1" value="2" />
                                    </div>
                                    <div class="modal-field">
                                        <label>Default QA Rate ($/hr):</label>
                                        <input type="number" id="configDefaultQARate" min="0" max="500" step="1" value="50" />
                                    </div>
                                </div>

                                <div class="config-section">
                                    <h4>Working Hours</h4>
                                    <table class="config-table">
                                        <thead>
                                            <tr>
                                                <th style="width: 80px;">Enabled</th>
                                                <th style="width: 100px;">Day</th>
                                                <th>Start Time</th>
                                                <th>End Time</th>
                                                <th style="width: 80px;">Hours</th>
                                            </tr>
                                        </thead>
                                        <tbody id="workingHoursTable">
                                            <!-- Will be populated dynamically -->
                                        </tbody>
                                    </table>
                                </div>

                                <div class="config-section">
                                    <h4>Display Options</h4>
                                    <div class="modal-field">
                                        <label style="display: flex; align-items: center; cursor: pointer;">
                                            <input type="checkbox" id="configHideNonWorkingHours" style="margin-right: 8px;" />
                                            <span>Hide non-working hours in Gantt chart timeline</span>
                                        </label>
                                    </div>
                                </div>

                                <div class="config-section">
                                    <h4>Summary</h4>
                                    <div class="config-summary">
                                        <div><strong>Working Days per Week:</strong> <span id="configWorkingDays">5</span></div>
                                        <div><strong>Hours per Day:</strong> <span id="configHoursPerDay">8</span></div>
                                        <div><strong>Total Capacity per Day:</strong> <span id="configDailyCapacity">16 hours</span></div>
                                        <div><strong>Stories per Day:</strong> <span id="configStoriesPerDay">~4</span></div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button class="modal-button modal-button-secondary" onclick="closeQAConfigModal()">Cancel</button>
                                <button class="modal-button modal-button-primary" onclick="saveQAConfigModal()">Save Configuration</button>
                            </div>
                        </div>
                    </div>

                    <script src="https://d3js.org/d3.v7.min.js"></script>
                    <script src="${qaCostTabTemplateUri}"></script>
                    <script src="${qaCostAnalysisFunctionsUri}"></script>
                    <script src="${scriptUri}"></script>
                </body>
                </html>
            `;

            // Handle messages from the webview
            panel.webview.onDidReceiveMessage(
                async message => {
                    switch (message.command) {
                        case 'UserStoriesQAWebviewReady':
                            console.log("[Extension] UserStoriesQA webview ready");
                            // Load initial QA data
                            await loadUserStoriesQAData(panel, modelService);
                            
                            // If initialTab is specified, send message to switch to that tab
                            if (initialTab) {
                                console.log(`[Extension] Switching to initial tab: ${initialTab}`);
                                panel.webview.postMessage({
                                    command: 'switchToTab',
                                    data: { tabName: initialTab }
                                });
                            }
                            break;

                        case 'refresh':
                            console.log("[Extension] UserStoriesQA refresh requested");
                            await loadUserStoriesQAData(panel, modelService);
                            break;

                        case 'sortUserStoriesQA':
                            console.log("[Extension] UserStoriesQA sort requested:", message.column, message.descending);
                            await loadUserStoriesQAData(panel, modelService, message.column, message.descending);
                            break;

                        case 'saveQAChange':
                            console.log("[Extension] UserStoriesQA change:", message.data);
                            try {
                                // Load current QA data
                                const filePath = message.data.qaFilePath;
                                let qaData: any = { qaData: [] };
                                if (fs.existsSync(filePath)) {
                                    const content = fs.readFileSync(filePath, 'utf8');
                                    qaData = JSON.parse(content);
                                }
                                if (!qaData.qaData) {
                                    qaData.qaData = [];
                                }

                                // Find and update or add the QA record
                                const existingIndex = qaData.qaData.findIndex((qa: any) =>
                                    qa.storyId === message.data.storyId
                                );

                                const qaRecord = {
                                    storyId: message.data.storyId,
                                    qaStatus: message.data.qaStatus,
                                    qaNotes: message.data.qaNotes,
                                    dateVerified: (message.data.qaStatus === 'success' || message.data.qaStatus === 'failure') 
                                        ? new Date().toISOString().split('T')[0] 
                                        : (message.data.dateVerified || '') // Keep existing date if not success/failure
                                };

                                if (existingIndex >= 0) {
                                    qaData.qaData[existingIndex] = qaRecord;
                                } else {
                                    qaData.qaData.push(qaRecord);
                                }

                                // Save to file
                                await saveQAData(qaData.qaData, filePath);

                                // Send success message
                                panel.webview.postMessage({
                                    command: 'qaChangeSaved',
                                    success: true
                                });

                            } catch (error) {
                                console.error("[Extension] Error saving QA change:", error);
                                panel.webview.postMessage({
                                    command: 'qaChangeSaved',
                                    success: false,
                                    error: error.message
                                });
                            }
                            break;

                        case 'bulkUpdateQAStatus':
                            console.log("[Extension] UserStoriesQA bulk update:", message.data);
                            try {
                                // Load current QA data
                                const filePath = message.data.qaFilePath;
                                let qaData: any = { qaData: [] };
                                if (fs.existsSync(filePath)) {
                                    const content = fs.readFileSync(filePath, 'utf8');
                                    qaData = JSON.parse(content);
                                }
                                if (!qaData.qaData) {
                                    qaData.qaData = [];
                                }

                                // Update multiple QA records
                                const selectedStoryIds = message.data.selectedStoryIds;
                                const newStatus = message.data.qaStatus;
                                let updatedCount = 0;

                                selectedStoryIds.forEach((storyId: string) => {
                                    const existingIndex = qaData.qaData.findIndex((qa: any) => qa.storyId === storyId);
                                    
                                    const qaRecord = {
                                        storyId: storyId,
                                        qaStatus: newStatus,
                                        qaNotes: '', // Keep existing notes if any
                                        dateVerified: (newStatus === 'success' || newStatus === 'failure') 
                                            ? new Date().toISOString().split('T')[0] 
                                            : ''
                                    };

                                    // Try to preserve existing notes if record exists
                                    if (existingIndex >= 0) {
                                        qaRecord.qaNotes = qaData.qaData[existingIndex].qaNotes || '';
                                        qaRecord.dateVerified = (newStatus === 'success' || newStatus === 'failure') 
                                            ? new Date().toISOString().split('T')[0] 
                                            : (qaData.qaData[existingIndex].dateVerified || '');
                                        qaData.qaData[existingIndex] = qaRecord;
                                    } else {
                                        qaData.qaData.push(qaRecord);
                                    }
                                    updatedCount++;
                                });

                                // Save to file
                                await saveQAData(qaData.qaData, filePath);
                                console.log(`[Extension] Bulk updated ${updatedCount} QA records`);

                            } catch (error) {
                                console.error("[Extension] Error bulk updating QA status:", error);
                            }
                            break;

                        case 'exportToCSV':
                            console.log("[Extension] UserStoriesQA export requested");
                            try {
                                // Generate CSV content
                                const items = message.data.items || [];
                                const csvHeaders = ['Story Number', 'Story Text', 'Development Completed Date', 'Status', 'Notes', 'Date Verified'];
                                const csvRows = [csvHeaders.join(',')];
                                
                                items.forEach((item: any) => {
                                    const row = [
                                        `"${(item.storyNumber || '').replace(/"/g, '""')}"`,
                                        `"${(item.storyText || '').replace(/"/g, '""')}"`,
                                        `"${(item.devCompletedDate || '').replace(/"/g, '""')}"`,
                                        `"${(item.qaStatus || '').replace(/"/g, '""')}"`,
                                        `"${(item.qaNotes || '').replace(/"/g, '""')}"`,
                                        `"${(item.dateVerified || '').replace(/"/g, '""')}"`
                                    ];
                                    csvRows.push(row.join(','));
                                });

                                const csvContent = csvRows.join('\n');

                                // Send CSV content back to webview for download
                                panel.webview.postMessage({
                                    command: 'csvExportReady',
                                    csvContent: csvContent,
                                    filename: `user-stories-qa-${new Date().toISOString().split('T')[0]}.csv`
                                });

                            } catch (error) {
                                console.error("[Extension] Error exporting QA data:", error);
                                panel.webview.postMessage({
                                    command: 'csvExportReady',
                                    success: false,
                                    error: error.message
                                });
                            }
                            break;

                        case 'saveCsvToWorkspace':
                            try {
                                console.log("[Extension] UserStoriesQA saveCsvToWorkspace requested");
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
                                console.error("[Extension] Error saving CSV to workspace:", error);
                                vscode.window.showErrorMessage('Failed to save CSV to workspace: ' + error.message);
                            }
                            break;

                        case 'saveQADistributionPNG':
                            try {
                                console.log("[Extension] UserStoriesQA saveQADistributionPNG requested");
                                const workspaceFolders = vscode.workspace.workspaceFolders;
                                if (!workspaceFolders || workspaceFolders.length === 0) {
                                    throw new Error('No workspace folder is open');
                                }
                                const workspaceRoot = workspaceFolders[0].uri.fsPath;
                                const reportDir = path.join(workspaceRoot, 'user_story_reports');
                                if (!fs.existsSync(reportDir)) {
                                    fs.mkdirSync(reportDir, { recursive: true });
                                }
                                
                                // Extract base64 data
                                const base64Data = message.data.base64.replace(/^data:image\/png;base64,/, '');
                                const buffer = Buffer.from(base64Data, 'base64');
                                
                                // Generate filename
                                const timestamp = new Date().toISOString().split('T')[0];
                                const filename = `qa-status-distribution-${timestamp}.png`;
                                const filePath = path.join(reportDir, filename);
                                
                                // Write file
                                fs.writeFileSync(filePath, buffer);
                                
                                // Show success message and open file
                                vscode.window.showInformationMessage('PNG file saved to workspace: ' + filePath);
                                vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
                                
                                console.log("[Extension] PNG saved successfully to", filePath);
                            } catch (error) {
                                console.error("[Extension] Error saving PNG to workspace:", error);
                                vscode.window.showErrorMessage('Failed to save PNG to workspace: ' + error.message);
                            }
                            break;

                        case 'loadQAConfig':
                            console.log("[Extension] UserStoriesQA loadQAConfig requested");
                            try {
                                const workspaceFolders = vscode.workspace.workspaceFolders;
                                if (!workspaceFolders || workspaceFolders.length === 0) {
                                    throw new Error('No workspace folder is open');
                                }
                                const workspaceRoot = workspaceFolders[0].uri.fsPath;
                                const configFilePath = path.join(workspaceRoot, 'app-dna-qa-config.json');
                                
                                let config: any;
                                if (fs.existsSync(configFilePath)) {
                                    const content = fs.readFileSync(configFilePath, 'utf8');
                                    config = JSON.parse(content);
                                } else {
                                    // Default config
                                    config = {
                                        avgTestTime: 4,
                                        qaResources: 2,
                                        defaultQARate: 50,
                                        hideNonWorkingHours: false,
                                        workingHours: {
                                            monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
                                            tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
                                            wednesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
                                            thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
                                            friday: { enabled: true, startTime: '09:00', endTime: '17:00' },
                                            saturday: { enabled: false, startTime: '09:00', endTime: '17:00' },
                                            sunday: { enabled: false, startTime: '09:00', endTime: '17:00' }
                                        }
                                    };
                                }
                                
                                panel.webview.postMessage({
                                    command: 'qaConfigLoaded',
                                    config: config
                                });
                            } catch (error) {
                                console.error("[Extension] Error loading QA config:", error);
                                // Send default config on error
                                panel.webview.postMessage({
                                    command: 'qaConfigLoaded',
                                    config: {
                                        avgTestTime: 4,
                                        qaResources: 2,
                                        defaultQARate: 50,
                                        hideNonWorkingHours: false,
                                        workingHours: {
                                            monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
                                            tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
                                            wednesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
                                            thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
                                            friday: { enabled: true, startTime: '09:00', endTime: '17:00' },
                                            saturday: { enabled: false, startTime: '09:00', endTime: '17:00' },
                                            sunday: { enabled: false, startTime: '09:00', endTime: '17:00' }
                                        }
                                    }
                                });
                            }
                            break;

                        case 'saveQAConfig':
                            console.log("[Extension] UserStoriesQA saveQAConfig requested:", message.config);
                            try {
                                const workspaceFolders = vscode.workspace.workspaceFolders;
                                if (!workspaceFolders || workspaceFolders.length === 0) {
                                    throw new Error('No workspace folder is open');
                                }
                                const workspaceRoot = workspaceFolders[0].uri.fsPath;
                                const configFilePath = path.join(workspaceRoot, 'app-dna-qa-config.json');
                                
                                // Save config to file
                                fs.writeFileSync(configFilePath, JSON.stringify(message.config, null, 2), 'utf8');
                                
                                vscode.window.showInformationMessage('QA configuration saved');
                                
                                panel.webview.postMessage({
                                    command: 'qaConfigSaved',
                                    success: true,
                                    config: message.config
                                });
                            } catch (error) {
                                console.error("[Extension] Error saving QA config:", error);
                                vscode.window.showErrorMessage('Failed to save QA configuration: ' + error.message);
                                panel.webview.postMessage({
                                    command: 'qaConfigSaved',
                                    success: false,
                                    error: error.message
                                });
                            }
                            break;

                        case 'exportForecastCSV':
                            console.log("[Extension] UserStoriesQA exportForecastCSV requested");
                            try {
                                const workspaceFolders = vscode.workspace.workspaceFolders;
                                if (!workspaceFolders || workspaceFolders.length === 0) {
                                    throw new Error('No workspace folder is open');
                                }
                                const workspaceRoot = workspaceFolders[0].uri.fsPath;
                                const reportDir = path.join(workspaceRoot, 'user_story_reports');
                                if (!fs.existsSync(reportDir)) {
                                    fs.mkdirSync(reportDir, { recursive: true });
                                }
                                
                                const timestamp = new Date().toISOString().split('T')[0];
                                const filename = `qa-forecast-${timestamp}.csv`;
                                const filePath = path.join(reportDir, filename);
                                
                                fs.writeFileSync(filePath, message.csvContent, 'utf8');
                                
                                vscode.window.showInformationMessage('Forecast CSV saved to workspace: ' + filePath);
                                vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
                            } catch (error) {
                                console.error("[Extension] Error exporting forecast CSV:", error);
                                vscode.window.showErrorMessage('Failed to export forecast CSV: ' + error.message);
                            }
                            break;

                        case 'openUserJourneyForPage':
                            console.log("[Extension] Opening User Journey for page:", message.targetPage, "with role:", message.pageRole);
                            try {
                                // Load journey start data to find the start page for this role
                                let startPage = null;
                                if (message.pageRole) {
                                    const modelFilePath = modelService.getCurrentFilePath();
                                    if (modelFilePath) {
                                        const modelDir = path.dirname(modelFilePath);
                                        const journeyFilePath = path.join(modelDir, 'app-dna-user-story-user-journey.json');
                                        
                                        if (fs.existsSync(journeyFilePath)) {
                                            const journeyContent = fs.readFileSync(journeyFilePath, 'utf8');
                                            const journeyData = JSON.parse(journeyContent);
                                            const journeyStartPages = journeyData.journeyStartPages || {};
                                            startPage = journeyStartPages[message.pageRole];
                                            console.log("[Extension] Found start page for role", message.pageRole, ":", startPage);
                                        }
                                    }
                                }
                                
                                // Import the page flow view function
                                const { showPageFlowWithUserJourney } = require('../webviews/pageflow/pageFlowDiagramView');
                                
                                // Open Page Flow with User Journey tab, target page, and start page
                                await showPageFlowWithUserJourney(context, modelService, message.targetPage, startPage);
                            } catch (error) {
                                console.error('[Extension] Error opening User Journey:', error);
                                vscode.window.showErrorMessage('Failed to open User Journey: ' + error.message);
                            }
                            break;

                        case 'showErrorMessage':
                            vscode.window.showErrorMessage(message.message);
                            break;

                        case 'showInfoMessage':
                            vscode.window.showInformationMessage(message.message);
                            break;

                        default:
                            console.log("[Extension] Unknown command:", message.command);
                            break;
                    }
                }
            );
        })
    );
}

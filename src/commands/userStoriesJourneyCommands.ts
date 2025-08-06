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

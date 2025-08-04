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

        console.log(`[Extension] Found ${userStories.length} user stories`);

        // Build combined data array
        const combinedData: any[] = [];
        userStories.forEach(story => {
            const storyId = story.name || '';
            const existingQA = qaLookup.get(storyId);

            combinedData.push({
                storyId: storyId,
                storyNumber: story.storyNumber || '',
                storyText: story.storyText || '',
                qaStatus: existingQA?.qaStatus || 'pending',
                qaNotes: existingQA?.qaNotes || '',
                dateVerified: existingQA?.dateVerified || '',
                qaFilePath: qaFilePath,
                selected: false // For checkbox functionality
            });
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
        vscode.commands.registerCommand('appdna.userStoriesQA', async () => {
            // Store references to context and modelService
            userStoriesQAPanel.context = context;
            userStoriesQAPanel.modelService = modelService;

            // Create a consistent panel ID
            const panelId = 'userStoriesQA';
            console.log(`userStoriesQA command called (panelId: ${panelId})`);

            // Check if panel already exists
            if (activePanels.has(panelId)) {
                console.log(`Panel already exists for user stories QA, revealing existing panel`);
                // Panel exists, reveal it instead of creating a new one
                activePanels.get(panelId)?.reveal(vscode.ViewColumn.One);
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
                        body {
                            font-family: var(--vscode-font-family);
                            font-size: var(--vscode-font-size);
                            font-weight: var(--vscode-font-weight);
                            color: var(--vscode-foreground);
                            background-color: var(--vscode-editor-background);
                            margin: 0;
                            padding: 20px;
                        }
                        
                        .header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 20px;
                            padding-bottom: 10px;
                            border-bottom: 1px solid var(--vscode-panel-border);
                        }
                        
                        .header h1 {
                            margin: 0;
                            font-size: 18px;
                            font-weight: 600;
                        }
                        
                        .header .actions {
                            display: flex;
                            gap: 10px;
                        }
                        
                        .btn {
                            background-color: var(--vscode-button-background);
                            color: var(--vscode-button-foreground);
                            border: none;
                            padding: 6px 12px;
                            cursor: pointer;
                            border-radius: 2px;
                            font-size: 12px;
                        }
                        
                        .btn:hover {
                            background-color: var(--vscode-button-hoverBackground);
                        }
                        
                        .btn-secondary {
                            background-color: var(--vscode-button-secondaryBackground);
                            color: var(--vscode-button-secondaryForeground);
                        }
                        
                        .btn-secondary:hover {
                            background-color: var(--vscode-button-secondaryHoverBackground);
                        }
                        
                        .filter-section {
                            background-color: var(--vscode-sidebar-background);
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 4px;
                            margin-bottom: 20px;
                        }
                        
                        .filter-header {
                            padding: 10px 15px;
                            background-color: var(--vscode-sideBar-background);
                            border-bottom: 1px solid var(--vscode-panel-border);
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            font-weight: 600;
                        }
                        
                        .filter-content {
                            padding: 15px;
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                            gap: 15px;
                        }
                        
                        .filter-content.collapsed {
                            display: none;
                        }
                        
                        .filter-group {
                            display: flex;
                            flex-direction: column;
                            gap: 5px;
                        }
                        
                        .filter-group label {
                            font-size: 12px;
                            font-weight: 600;
                            color: var(--vscode-foreground);
                        }
                        
                        .filter-group input,
                        .filter-group select {
                            padding: 4px 8px;
                            border: 1px solid var(--vscode-input-border);
                            background-color: var(--vscode-input-background);
                            color: var(--vscode-input-foreground);
                            border-radius: 2px;
                            font-size: 13px;
                        }
                        
                        .filter-actions {
                            display: flex;
                            gap: 10px;
                            align-items: end;
                        }
                        
                        .table-container {
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 4px;
                            overflow: auto;
                            max-height: 600px;
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
                        }
                        
                        .story-number-column {
                            width: 120px;
                        }
                        
                        .story-text-column {
                            max-width: 300px;
                            word-wrap: break-word;
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
                        
                        .export-button,
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
                        
                        .export-button:hover,
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
                            padding: 10px;
                            background-color: var(--vscode-sideBar-background);
                            border: 1px solid var(--vscode-panel-border);
                            border-top: none;
                            border-radius: 0 0 4px 4px;
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
                    <div class="header">
                        <h1>User Stories - QA</h1>
                    </div>

                    <div class="filter-section">
                        <div class="filter-header" onclick="toggleFilterSection()">
                            <i id="filterChevron" class="codicon codicon-chevron-down"></i>
                            <span>Filters</span>
                        </div>
                        <div id="filterContent" class="filter-content">
                            <div class="filter-group">
                                <label for="filterStoryNumber">Story Number:</label>
                                <input type="text" id="filterStoryNumber" placeholder="Filter by story number...">
                            </div>
                            <div class="filter-group">
                                <label for="filterStoryText">Story Text:</label>
                                <input type="text" id="filterStoryText" placeholder="Filter by story text...">
                            </div>
                            <div class="filter-group">
                                <label for="filterQAStatus">QA Status:</label>
                                <select id="filterQAStatus">
                                    <option value="">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="started">Started</option>
                                    <option value="success">Success</option>
                                    <option value="failure">Failure</option>
                                </select>
                            </div>
                            <div class="filter-actions">
                                <button class="btn btn-secondary" onclick="clearFilters()">Clear Filters</button>
                            </div>
                        </div>
                    </div>

                    <div class="bulk-actions">
                        <div class="bulk-actions-left">
                            <select id="bulkStatusDropdown" class="bulk-status-dropdown">
                                <option value="">Select Status</option>
                                <option value="pending">Pending</option>
                                <option value="started">Started</option>
                                <option value="success">Success</option>
                                <option value="failure">Failure</option>
                            </select>
                            <button id="applyButton" class="apply-button" disabled>Apply to Selected</button>
                        </div>
                        <div class="header-actions">
                            <button id="exportButton" class="export-button" title="Export to CSV">
                                <i class="codicon codicon-export"></i> Export
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
                        case 'UserStoriesQAWebviewReady':
                            console.log("[Extension] UserStoriesQA webview ready");
                            // Load initial QA data
                            await loadUserStoriesQAData(panel, modelService);
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
                                const csvHeaders = ['Story Number', 'Story Text', 'Status', 'Notes', 'Date Verified'];
                                const csvRows = [csvHeaders.join(',')];
                                
                                items.forEach((item: any) => {
                                    const row = [
                                        `"${(item.storyNumber || '').replace(/"/g, '""')}"`,
                                        `"${(item.storyText || '').replace(/"/g, '""')}"`,
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

                        default:
                            console.log("[Extension] Unknown command:", message.command);
                            break;
                    }
                }
            );
        })
    );
}

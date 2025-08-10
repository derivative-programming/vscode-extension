// Description: Handles registration of requirements fulfillment view related commands.
// Created: August 10, 2025

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ModelService } from '../services/modelService';

// Track active panels to avoid duplicates
const activePanels = new Map<string, vscode.WebviewPanel>();

// Track panel reference for the requirements fulfillment view
const requirementsFulfillmentPanel = {
    panel: null as vscode.WebviewPanel | null,
    context: null as vscode.ExtensionContext | null,
    modelService: null as ModelService | null
};

/**
 * Gets the reference to the requirements fulfillment panel if it's open
 */
export function getRequirementsFulfillmentPanel(): { 
    type: string; 
    context: vscode.ExtensionContext; 
    modelService: ModelService 
} | null {
    if (activePanels.has('requirementsFulfillment') && requirementsFulfillmentPanel.context && requirementsFulfillmentPanel.modelService) {
        return {
            type: 'requirementsFulfillment',
            context: requirementsFulfillmentPanel.context,
            modelService: requirementsFulfillmentPanel.modelService
        };
    }
    return null;
}

/**
 * Closes the requirements fulfillment panel if it's open
 */
export function closeRequirementsFulfillmentPanel(): void {
    console.log(`Closing requirements fulfillment panel if open`);
    const panel = activePanels.get('requirementsFulfillment');
    if (panel) {
        panel.dispose();
        activePanels.delete('requirementsFulfillment');
    }
    // Clean up panel reference
    requirementsFulfillmentPanel.panel = null;
}

/**
 * Load requirements fulfillment data - only "Required" and "Not Allowed" items
 */
async function loadRequirementsFulfillmentData(panel: vscode.WebviewPanel, modelService: ModelService, sortColumn?: string, sortDescending?: boolean): Promise<void> {
    try {
        console.log("[Extension] Loading requirements fulfillment data");
        
        const model = modelService.getCurrentModel();
        if (!model) {
            console.error("[Extension] No model available");
            panel.webview.postMessage({
                command: "setRequirementsFulfillmentData",
                data: { items: [], totalRecords: 0, sortColumn: sortColumn || 'role', sortDescending: sortDescending || false, userStories: [] }
            });
            return;
        }

        // Get all roles from model - comprehensive extraction
        const roles = new Set<string>();
        
        // Extract roles from the Role data object's lookup items
        const allObjects = modelService.getAllObjects();
        allObjects.forEach((obj: any) => {
            console.log(`[Extension] Checking data object: ${obj.name}, isLookup: ${obj.isLookup}`);
            if (obj.name && obj.name.toLowerCase() === 'role') {
                console.log(`[Extension] Found Role data object with lookupItems:`, obj.lookupItem);
                // Get roles from the Role data object's lookup items
                if (obj.lookupItem && Array.isArray(obj.lookupItem)) {
                    obj.lookupItem.forEach((lookupItem: any) => {
                        if (lookupItem.name) {
                            console.log(`[Extension] Adding role from lookup: ${lookupItem.name}`);
                            roles.add(lookupItem.name);
                        }
                    });
                }
            }
        });
        
        // Extract roles from forms and reports that have roleRequired
        const extractRolesFromPages = (pages: any[]) => {
            if (pages) {
                pages.forEach((page: any) => {
                    if (page.roleRequired) {
                        roles.add(page.roleRequired);
                    }
                });
            }
        };
        
        const allForms = modelService.getAllForms();
        extractRolesFromPages(allForms);
        
        const allReports = modelService.getAllReports();
        extractRolesFromPages(allReports);
        
        // Add common default roles if no roles found
        if (roles.size === 0) {
            roles.add('Admin');
            roles.add('User');
        }

        // Get all data objects (exclude lookup objects)
        const dataObjects: any[] = [];
        allObjects.forEach((obj: any) => {
            console.log(`[Extension] Checking data object for inclusion: ${obj.name}, isLookup: ${obj.isLookup}`);
            if (obj.name && obj.isLookup !== true && obj.isLookup !== "true") {
                console.log(`[Extension] Including data object: ${obj.name}`);
                dataObjects.push(obj);
            } else {
                console.log(`[Extension] Excluding data object: ${obj.name} (isLookup: ${obj.isLookup})`);
            }
        });

        // Actions array
        const actions = ['View All', 'View', 'Add', 'Update', 'Delete'];

        // Load existing role requirements from separate file
        const modelFilePath = modelService.getCurrentFilePath();
        let requirementsFilePath = '';
        let existingRequirements: any = { roleRequirements: [] };
        
        if (modelFilePath) {
            const modelDir = path.dirname(modelFilePath);
            requirementsFilePath = path.join(modelDir, 'app-dna-user-story-role-requirements.json');
            
            try {
                if (fs.existsSync(requirementsFilePath)) {
                    const requirementsContent = fs.readFileSync(requirementsFilePath, 'utf8');
                    existingRequirements = JSON.parse(requirementsContent);
                }
            } catch (error) {
                console.warn("[Extension] Could not load existing requirements file:", error);
                existingRequirements = { roleRequirements: [] };
            }
        }

        // Create lookup for existing requirements
        const requirementsLookup = new Map<string, string>();
        if (existingRequirements.roleRequirements) {
            existingRequirements.roleRequirements.forEach((req: any) => {
                const key = `${req.role}|${req.dataObject}|${req.action}`;
                requirementsLookup.set(key, req.access);
            });
        }

        console.log(`[Extension] Found ${roles.size} roles:`, Array.from(roles));
        console.log(`[Extension] Found ${dataObjects.length} data objects:`, dataObjects.map(obj => obj.name));
        console.log(`[Extension] Actions:`, actions);

        // Generate all combinations but filter to only "Required" and "Not Allowed"
        const items: any[] = [];
        Array.from(roles).forEach(role => {
            // Skip 'Unknown' roles
            if (role && role.toLowerCase() === 'unknown') {
                console.log(`[Extension] Skipping 'Unknown' role`);
                return;
            }
            
            dataObjects.forEach(dataObject => {
                actions.forEach(action => {
                    const key = `${role}|${dataObject.name}|${action}`;
                    const access = requirementsLookup.get(key) || 'Unassigned';
                    
                    // Only include items that are "Required" or "Not Allowed"
                    if (access === 'Required' || access === 'Not Allowed') {
                        items.push({
                            role: role,
                            dataObject: dataObject.name,
                            action: action,
                            access: access,
                            dataObjectId: dataObject.id || dataObject.name || '',
                            requirementsFilePath: requirementsFilePath
                        });
                    }
                });
            });
        });

        // Sort items
        if (sortColumn) {
            items.sort((a, b) => {
                let aVal = a[sortColumn] || '';
                let bVal = b[sortColumn] || '';
                
                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                }
                if (typeof bVal === 'string') {
                    bVal = bVal.toLowerCase();
                }
                
                if (sortDescending) {
                    return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
                } else {
                    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                }
            });
        }

        console.log(`[Extension] Sending ${items.length} filtered requirements fulfillment items to webview`);

        // Get user stories from the model for validation
        const userStories: any[] = [];
        try {
            if (model.namespace && Array.isArray(model.namespace) && model.namespace.length > 0) {
                const namespace = model.namespace[0];
                if (namespace.userStory && Array.isArray(namespace.userStory)) {
                    userStories.push(...namespace.userStory);
                }
            }
        } catch (error) {
            console.warn("[Extension] Error extracting user stories:", error);
        }

        console.log(`[Extension] Found ${userStories.length} user stories for validation`);

        // Load page mapping data for mapping status validation
        let pageMappings: any = {};
        try {
            if (modelFilePath) {
                const modelDir = path.dirname(modelFilePath);
                const mappingFilePath = path.join(modelDir, 'app-dna-user-story-page-mapping.json');
                
                if (fs.existsSync(mappingFilePath)) {
                    const mappingContent = fs.readFileSync(mappingFilePath, 'utf8');
                    const mappingData = JSON.parse(mappingContent);
                    pageMappings = mappingData.pageMappings || {};
                }
            }
        } catch (error) {
            console.warn("[Extension] Error loading page mapping data:", error);
        }

        console.log(`[Extension] Found ${Object.keys(pageMappings).length} page mappings for validation`);

        // Load user journey data for journey existence validation
        let userJourneyData: any[] = [];
        try {
            if (modelFilePath) {
                const modelDir = path.dirname(modelFilePath);
                const journeyFilePath = path.join(modelDir, 'app-dna-user-story-user-journey.json');
                
                if (fs.existsSync(journeyFilePath)) {
                    const journeyContent = fs.readFileSync(journeyFilePath, 'utf8');
                    const journeyDataFromFile = JSON.parse(journeyContent);
                    console.log(`[Extension] Loaded journey data structure:`, Object.keys(journeyDataFromFile));
                    console.log(`[Extension] PageDistances sample:`, journeyDataFromFile.pageDistances?.slice(0, 2));
                    
                    // Create user journey data similar to userStoriesJourneyCommands
                    userStories.forEach((story: any) => {
                        const storyNumber = story.storyNumber;
                        const existingMapping = pageMappings[storyNumber];
                        
                        if (existingMapping?.pageMapping) {
                            const pages = Array.isArray(existingMapping.pageMapping) ? existingMapping.pageMapping : [existingMapping.pageMapping];
                            
                            pages.forEach((page: string) => {
                                if (page && page.trim()) {
                                    // Find page distance from journey data
                                    const pageDistanceData = journeyDataFromFile.pageDistances?.find((pd: any) => pd.destinationPage === page);
                                    const journeyPageDistance = pageDistanceData ? pageDistanceData.distance : -1;
                                    console.log(`[Extension] Page: ${page}, Distance found: ${journeyPageDistance}`);
                                    
                                    userJourneyData.push({
                                        storyNumber: storyNumber,
                                        page: page,
                                        journeyPageDistance: journeyPageDistance
                                    });
                                }
                            });
                        }
                    });
                }
            }
        } catch (error) {
            console.warn("[Extension] Error loading user journey data:", error);
        }

        console.log(`[Extension] Found ${userJourneyData.length} user journey items for validation`);

        // Send data to webview
        panel.webview.postMessage({
            command: "setRequirementsFulfillmentData",
            data: {
                items: items,
                totalRecords: items.length,
                sortColumn: sortColumn || 'role',
                sortDescending: sortDescending || false,
                userStories: userStories,
                pageMappings: pageMappings,
                userJourneyData: userJourneyData
            }
        });

    } catch (error) {
        console.error("[Extension] Error loading requirements fulfillment data:", error);
        panel.webview.postMessage({
            command: "setRequirementsFulfillmentData",
            data: { items: [], totalRecords: 0, sortColumn: sortColumn || 'role', sortDescending: sortDescending || false, userStories: [], pageMappings: {}, userJourneyData: [] }
        });
    }
}

/**
 * Shows the requirements fulfillment view
 */
export function showRequirementsFulfillment(context: vscode.ExtensionContext, modelService: ModelService): void {
    if (!modelService || !modelService.isFileLoaded()) {
        vscode.window.showErrorMessage("No project is currently loaded.");
        return;
    }

    // Create a consistent panel ID
    const panelId = 'requirementsFulfillment';
    console.log(`showRequirementsFulfillment called (panelId: ${panelId})`);
    
    // Store reference to context and modelService
    requirementsFulfillmentPanel.context = context;
    requirementsFulfillmentPanel.modelService = modelService;
    
    // Check if panel already exists
    if (activePanels.has(panelId)) {
        console.log(`Panel already exists for requirements fulfillment view, revealing existing panel`);
        // Panel exists, reveal it instead of creating a new one
        activePanels.get(panelId)!.reveal(vscode.ViewColumn.One);
        return;
    }
    
    // Create the webview panel
    const panel = vscode.window.createWebviewPanel(
        'requirementsFulfillment',
        'User Story Requirements Fulfillment',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );
    
    // Track this panel
    console.log(`Adding new panel to activePanels with id: ${panelId}`);
    activePanels.set(panelId, panel);
    requirementsFulfillmentPanel.panel = panel;
    
    // Remove from tracking when disposed
    panel.onDidDispose(() => {
        console.log(`Panel disposed, removing from tracking: ${panelId}`);
        activePanels.delete(panelId);
        requirementsFulfillmentPanel.panel = null;
    });

    // Set up message handling
    panel.webview.onDidReceiveMessage(
        async message => {
            console.log("[Extension] Received message from requirements fulfillment webview:", message.command);
            
            switch (message.command) {
                case 'RequirementsFulfillmentWebviewReady':
                    console.log("[Extension] Requirements fulfillment webview ready, loading data");
                    await loadRequirementsFulfillmentData(panel, modelService);
                    break;
                    
                case 'sortRequirementsFulfillment':
                    console.log(`[Extension] Sorting requirements fulfillment by ${message.column}, descending: ${message.descending}`);
                    await loadRequirementsFulfillmentData(panel, modelService, message.column, message.descending);
                    break;
                    
                case 'refresh':
                    console.log("[Extension] Refreshing requirements fulfillment data");
                    await loadRequirementsFulfillmentData(panel, modelService);
                    break;
                    
                case 'showError':
                    vscode.window.showErrorMessage(message.message);
                    break;
                    
                default:
                    console.log(`[Extension] Unknown command from requirements fulfillment webview: ${message.command}`);
                    break;
            }
        }
    );

    // Set the initial webview content
    panel.webview.html = getWebviewContent(context, panel);
}

/**
 * Gets the webview HTML content
 */
function getWebviewContent(context: vscode.ExtensionContext, panel: vscode.WebviewPanel): string {
    // Get proper webview URIs for script and codicons
    const scriptUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'requirementsFulfillmentView.js')
    );
    const codiconsUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css')
    );
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Story Requirements Fulfillment</title>
    <link href="${codiconsUri}" rel="stylesheet" />
    <style>
        body {
            font-family: var(--vscode-font-family);
            margin: 0;
            padding: 10px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        
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
        
        .record-info-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            margin-bottom: 10px;
        }
        
        .record-info {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin: 0;
        }
        
        .refresh-button {
            background-color: transparent;
            color: var(--vscode-foreground);
            border: none;
            padding: 4px 8px;
            cursor: pointer;
            border-radius: 3px;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .refresh-button:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        
        table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-top: 1em; 
        }
        
        th, td { 
            border: 1px solid var(--vscode-editorWidget-border); 
            padding: 8px 12px; 
            text-align: left; 
        }
        
        th { 
            background: var(--vscode-sideBar-background); 
            cursor: pointer; 
            font-weight: bold; 
        }
        
        tr:nth-child(even) { 
            background: var(--vscode-sideBarSectionHeader-background); 
        }
        
        tr:hover { 
            background-color: var(--vscode-list-hoverBackground); 
        }
        
        tbody tr { 
            cursor: pointer; 
        }
        
        .access-display {
            display: inline;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .access-required {
            color: var(--vscode-foreground);
        }
        
        .access-not-allowed {
            color: var(--vscode-foreground);
        }
        
        .data-object {
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .user-story-status {
            display: inline;
            font-size: 12px;
            font-weight: 500;
        }
        
        .status-good {
            color: var(--vscode-testing-iconPassed);
        }
        
        .status-bad {
            color: var(--vscode-testing-iconFailed);
        }
        
        .mapping-status {
            display: inline;
            font-size: 12px;
            font-weight: 500;
        }
        
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
            border: 4px solid var(--vscode-progressBar-background);
            border-top: 4px solid var(--vscode-progressBar-foreground);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .no-data {
            text-align: center;
            padding: 40px 20px;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="validation-header">
        <h2>User Story Requirements Fulfillment</h2>
        <p style="margin-top: -5px; margin-bottom: 15px; color: var(--vscode-descriptionForeground);">
            Shows only role requirements marked as "Required" or "Not Allowed" - read-only view
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
                        <label>Role:</label>
                        <select id="filterRole">
                            <option value="">All Roles</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Data Object:</label>
                        <input type="text" id="filterDataObject" placeholder="Filter by data object...">
                    </div>
                    <div class="filter-group">
                        <label>Action:</label>
                        <select id="filterAction">
                            <option value="">All Actions</option>
                            <option value="View All">View All</option>
                            <option value="View">View</option>
                            <option value="Add">Add</option>
                            <option value="Update">Update</option>
                            <option value="Delete">Delete</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Access:</label>
                        <select id="filterAccess">
                            <option value="">All Access Levels</option>
                            <option value="Required">Required</option>
                            <option value="Not Allowed">Not Allowed</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Fulfillment Status:</label>
                        <select id="filterFulfillmentStatus">
                            <option value="">All Status</option>
                            <option value="Pass">Pass</option>
                            <option value="Fail">Fail</option>
                        </select>
                    </div>
                </div>
                <div class="filter-actions">
                    <button onclick="clearFilters()" class="filter-button-secondary">Clear All</button>
                </div>
            </div>
        </div>
        
        <div class="record-info-section">
            <div id="record-info" class="record-info">
                Loading requirements...
            </div>
            <button id="refreshButton" class="refresh-button" title="Refresh Table">
                <span class="codicon codicon-refresh"></span>
            </button>
        </div>
        
        <table id="requirementsFulfillmentTable">
            <!-- Table content will be generated by JavaScript -->
        </table>
    
    <div id="spinner-overlay" class="spinner-overlay" style="display: none;">
        <div class="spinner"></div>
    </div>

    <script src="${scriptUri}"></script>
</body>
</html>`;
}

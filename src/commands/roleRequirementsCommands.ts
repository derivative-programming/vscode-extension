// Description: Handles registration of role requirements view related commands.
// Created: August 3, 2025

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ModelService } from '../services/modelService';

// Track active panels to avoid duplicates
const activePanels = new Map<string, vscode.WebviewPanel>();

// Track panel reference for the role requirements view
const roleRequirementsPanel = {
    panel: null as vscode.WebviewPanel | null,
    context: null as vscode.ExtensionContext | null,
    modelService: null as ModelService | null
};

/**
 * Gets the reference to the role requirements panel if it's open
 */
export function getRoleRequirementsPanel(): { 
    type: string; 
    context: vscode.ExtensionContext; 
    modelService: ModelService 
} | null {
    if (activePanels.has('roleRequirements') && roleRequirementsPanel.context && roleRequirementsPanel.modelService) {
        return {
            type: 'roleRequirements',
            context: roleRequirementsPanel.context,
            modelService: roleRequirementsPanel.modelService
        };
    }
    return null;
}

/**
 * Closes the role requirements panel if it's open
 */
export function closeRoleRequirementsPanel(): void {
    console.log(`Closing role requirements panel if open`);
    const panel = activePanels.get('roleRequirements');
    if (panel) {
        panel.dispose();
        activePanels.delete('roleRequirements');
    }
    // Clean up panel reference
    roleRequirementsPanel.panel = null;
}

/**
 * Load role requirements data from both model and separate requirements file
 */
async function loadRoleRequirementsData(panel: vscode.WebviewPanel, modelService: ModelService, sortColumn?: string, sortDescending?: boolean): Promise<void> {
    try {
        console.log("[Extension] Loading role requirements data");
        
        const model = modelService.getCurrentModel();
        if (!model) {
            console.error("[Extension] No model available");
            panel.webview.postMessage({
                command: "setRoleRequirementsData",
                data: { items: [], totalRecords: 0, sortColumn: sortColumn || 'role', sortDescending: sortDescending || false }
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

        // If no roles or data objects found, show debug info
        if (roles.size === 0) {
            console.warn(`[Extension] No roles found! All objects:`, allObjects.map(obj => ({ name: obj.name, isLookup: obj.isLookup, hasLookupItems: !!obj.lookupItem })));
        }
        if (dataObjects.length === 0) {
            console.warn(`[Extension] No data objects found! All objects:`, allObjects.map(obj => ({ name: obj.name, isLookup: obj.isLookup })));
        }

        // Generate all combinations
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
                    
                    items.push({
                        role: role,
                        dataObject: dataObject.name,
                        action: action,
                        access: access,
                        dataObjectId: dataObject.id || dataObject.name || '',
                        requirementsFilePath: requirementsFilePath
                    });
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
                    return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
                } else {
                    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                }
            });
        }

        console.log(`[Extension] Generated ${items.length} role requirement items`);

        // Send data to webview
        panel.webview.postMessage({
            command: "setRoleRequirementsData",
            data: {
                items: items,
                totalRecords: items.length,
                sortColumn: sortColumn || 'role',
                sortDescending: sortDescending || false
            }
        });

    } catch (error) {
        console.error("[Extension] Error loading role requirements data:", error);
        panel.webview.postMessage({
            command: "setRoleRequirementsData",
            data: { items: [], totalRecords: 0, sortColumn: sortColumn || 'role', sortDescending: sortDescending || false }
        });
    }
}

/**
 * Save role requirements data to separate JSON file
 */
async function saveRoleRequirementsData(requirements: any[], filePath: string): Promise<void> {
    try {
        const data = {
            roleRequirements: requirements,
            lastUpdated: new Date().toISOString()
        };
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log("[Extension] Saved role requirements to:", filePath);
        
    } catch (error) {
        console.error("[Extension] Error saving role requirements:", error);
        throw error;
    }
}

export function registerRoleRequirementsCommands(
    context: vscode.ExtensionContext,
    appDNAFilePath: string | null,
    modelService: ModelService
): void {
    // Register role requirements command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.roleRequirements', async () => {
            // Store references to context and modelService
            roleRequirementsPanel.context = context;
            roleRequirementsPanel.modelService = modelService;
            
            // Create a consistent panel ID
            const panelId = 'roleRequirements';
            console.log(`roleRequirements command called (panelId: ${panelId})`);
            
            // Check if panel already exists
            if (activePanels.has(panelId)) {
                console.log(`Panel already exists for role requirements, revealing existing panel`);
                // Panel exists, reveal it instead of creating a new one
                activePanels.get(panelId)?.reveal(vscode.ViewColumn.One);
                return;
            }
            
            // Create new panel if one doesn't exist
            const panel = vscode.window.createWebviewPanel(
                'roleRequirements',
                'User Stories - Role Requirements',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                }
            );
            
            // Track this panel
            console.log(`Adding new panel to activePanels with id: ${panelId}`);
            activePanels.set(panelId, panel);
            roleRequirementsPanel.panel = panel;
            
            // Remove from tracking when disposed
            panel.onDidDispose(() => {
                console.log(`Panel disposed, removing from tracking: ${panelId}`);
                activePanels.delete(panelId);
                roleRequirementsPanel.panel = null;
            });

            const scriptUri = panel.webview.asWebviewUri(
                vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'roleRequirementsView.js')
            );
            const codiconsUri = panel.webview.asWebviewUri(
                vscode.Uri.joinPath(context.extensionUri, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css')
            );

            // Set the HTML content for the webview
            panel.webview.html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>User Stories - Role Requirements</title>
                    <link href="${codiconsUri}" rel="stylesheet" />
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
                        .access-dropdown {
                            background-color: var(--vscode-input-background);
                            color: var(--vscode-input-foreground);
                            border: 1px solid var(--vscode-input-border);
                            border-radius: 2px;
                            padding: 2px 4px;
                            font-size: 12px;
                            width: 100px;
                        }
                        .access-dropdown:focus {
                            outline: 1px solid var(--vscode-focusBorder);
                            outline-offset: -1px;
                        }
                        .spinner {
                            border: 4px solid rgba(0, 0, 0, 0.1);
                            width: 36px;
                            height: 36px;
                            border-radius: 50%;
                            border-left-color: var(--vscode-progressBar-background);
                            animation: spin 1s linear infinite;
                            position: fixed;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            z-index: 1000;
                        }
                        .spinner-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background-color: rgba(0, 0, 0, 0.2);
                            z-index: 999;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        .refresh-button {
                            background-color: var(--vscode-button-background);
                            color: var(--vscode-button-foreground);
                            border: none;
                            padding: 4px 8px;
                            cursor: pointer;
                            border-radius: 3px;
                            display: flex;
                            align-items: center;
                            gap: 4px;
                        }
                        .refresh-button:hover {
                            background-color: var(--vscode-button-hoverBackground);
                        }
                        .header-actions {
                            display: flex;
                            justify-content: flex-end;
                            margin-bottom: 10px;
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
                            background-color: var(--vscode-button-secondaryHoverBackground);
                        }
                        .table-container {
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 3px;
                            overflow: hidden;
                            background-color: var(--vscode-editor-background);
                        }
                        .data-object {
                            max-width: 200px;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        }
                    </style>
                </head>
                <body>
                    <div class="validation-header">
                        <h2>User Stories - Role Requirements</h2>
                        <p style="margin-top: -5px; margin-bottom: 15px; color: var(--vscode-descriptionForeground);">
                            Configure role-based access permissions for data objects with different actions.
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
                                        <option value="Unassigned">Unassigned</option>
                                        <option value="Allowed">Allowed</option>
                                        <option value="Required">Required</option>
                                        <option value="Not Allowed">Not Allowed</option>
                                    </select>
                                </div>
                            </div>
                            <div class="filter-actions">
                                <button onclick="clearFilters()" class="filter-button-secondary">Clear All</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="header-actions">
                        <button id="refreshButton" class="refresh-button" title="Refresh Table">
                        </button>
                    </div>
                    
                    <div class="table-container">
                        <table id="roleRequirementsTable"></table>
                    </div>
                    
                    <div class="table-footer">
                        <div class="table-footer-left">
                            <div id="paging"></div>
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
                        case 'RoleRequirementsWebviewReady':
                            console.log("[Extension] RoleRequirements webview ready");
                            // Load initial role requirements data
                            await loadRoleRequirementsData(panel, modelService);
                            break;
                            
                        case 'refresh':
                            console.log("[Extension] RoleRequirements refresh requested");
                            await loadRoleRequirementsData(panel, modelService);
                            break;

                        case 'sortRoleRequirements':
                            console.log("[Extension] RoleRequirements sort requested:", message.column, message.descending);
                            await loadRoleRequirementsData(panel, modelService, message.column, message.descending);
                            break;

                        case 'saveAccessChange':
                            console.log("[Extension] RoleRequirements access change:", message.data);
                            try {
                                // Load current requirements
                                const filePath = message.data.requirementsFilePath;
                                let requirements: any = { roleRequirements: [] };
                                
                                if (fs.existsSync(filePath)) {
                                    const content = fs.readFileSync(filePath, 'utf8');
                                    requirements = JSON.parse(content);
                                }
                                
                                if (!requirements.roleRequirements) {
                                    requirements.roleRequirements = [];
                                }
                                
                                // Find and update or add the requirement
                                const existingIndex = requirements.roleRequirements.findIndex((req: any) =>
                                    req.role === message.data.role &&
                                    req.dataObject === message.data.dataObject &&
                                    req.action === message.data.action
                                );
                                
                                const requirement = {
                                    role: message.data.role,
                                    dataObject: message.data.dataObject,
                                    action: message.data.action,
                                    access: message.data.access
                                };
                                
                                if (existingIndex >= 0) {
                                    requirements.roleRequirements[existingIndex] = requirement;
                                } else {
                                    requirements.roleRequirements.push(requirement);
                                }
                                
                                // Save to file
                                await saveRoleRequirementsData(requirements.roleRequirements, filePath);
                                
                                // Send success message
                                panel.webview.postMessage({
                                    command: 'accessChangeSaved',
                                    success: true
                                });
                                
                            } catch (error) {
                                console.error("[Extension] Error saving access change:", error);
                                panel.webview.postMessage({
                                    command: 'accessChangeSaved',
                                    success: false,
                                    error: error instanceof Error ? error.message : 'Unknown error'
                                });
                            }
                            break;
                    }
                },
                undefined,
                context.subscriptions
            );

            // Load initial data
            await loadRoleRequirementsData(panel, modelService);
        })
    );
}

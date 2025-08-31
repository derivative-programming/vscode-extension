// SEARCH_TAG: JSON tree data provider for VS Code extension
// Provides tree data for the AppDNA JSON structure.

import * as vscode from 'vscode';
import * as fs from 'fs';
import { JsonTreeItem, AppDNAData, TreeDataChange } from '../models/types';
import { ModelService } from '../services/modelService';
import { AuthService } from '../services/authService';
import { MCPServer } from '../mcp/server';
import { MCPHttpServer } from '../mcp/httpServer';
import { getShowAdvancedPropertiesFromConfig } from '../utils/fileUtils';

/**
 * TreeDataProvider for managing JSON structure in the AppDNA extension
 * Uses ModelService to access and manipulate the model data
 */
export class JsonTreeDataProvider implements vscode.TreeDataProvider<JsonTreeItem> {

    private readonly _onDidChangeTreeData: vscode.EventEmitter<TreeDataChange> = new vscode.EventEmitter<TreeDataChange>();
    readonly onDidChangeTreeData: vscode.Event<TreeDataChange> = this._onDidChangeTreeData.event;    private readonly jsonStructure: any = {
        "root": {
            "namespace": [],
            "object": []
        }
    };
    // Auth service instance to manage login state
    private authService: AuthService;
    // MCP server instance to check server status
    private mcpServer: MCPServer;
    // MCP HTTP server instance to check HTTP server status
    private mcpHttpServer: MCPHttpServer;
    // Reference to the tree view
    private treeView?: vscode.TreeView<JsonTreeItem>;
    // Original tree view title (without unsaved changes indicator)
    private originalTitle?: string;    // Current filter text for tree view items
    private filterText: string = "";
    // Current filter text for report items only
    private reportFilterText: string = "";
    // Current filter text for form items only
    private formFilterText: string = "";
    // Current filter text for data object items only
    private dataObjectFilterText: string = "";
    // Current filter text for page init items only
    private pageInitFilterText: string = "";
    // Current filter text for workflows items only
    private workflowsFilterText: string = "";
    // Current filter text for workflow tasks items only
    private workflowTasksFilterText: string = "";
    // Current filter text for general items only
    private generalFilterText: string = "";
      constructor(
        private readonly appDNAFilePath: string | null,
        private readonly modelService: ModelService
    ) { 
        this.authService = AuthService.getInstance();
        this.mcpServer = MCPServer.getInstance();
        this.mcpHttpServer = MCPHttpServer.getInstance();
          // Initialize context values
        vscode.commands.executeCommand('setContext', 'appDnaReportFilterActive', false);
        vscode.commands.executeCommand('setContext', 'appDnaDataObjectFilterActive', false);
        vscode.commands.executeCommand('setContext', 'appDnaFormFilterActive', false);
        vscode.commands.executeCommand('setContext', 'appDnaPageInitFilterActive', false);
        vscode.commands.executeCommand('setContext', 'appDnaWorkflowsFilterActive', false);
        vscode.commands.executeCommand('setContext', 'appDnaWorkflowTasksFilterActive', false);
        vscode.commands.executeCommand('setContext', 'appDnaGeneralFilterActive', false);
        
        // Register to server status changes to update the tree view
        this.mcpServer.onStatusChange(isRunning => {
            // Refresh the tree view when server status changes
            this.refresh();
        });
          // Register to HTTP server status changes as well
        this.mcpHttpServer.onStatusChange(isRunning => {
            // Refresh the tree view when HTTP server status changes
            this.refresh();
        });
          // Set up a timer to check for unsaved changes and update UI when status changes
        setInterval(() => {
            this.updateUnsavedChangesContext();
        }, 1000);
    }    
    
    // Track the last check result to avoid unnecessary refreshes
    private _hasUnsavedChangesLastCheck: boolean = false;    /**
     * Sets the tree view reference for future operations
     * @param treeView The TreeView instance from VS Code
     */
    setTreeView(treeView: vscode.TreeView<JsonTreeItem>): void {
        this.treeView = treeView;
        // Initial refresh and check for unsaved changes
        this.refresh();
        this.updateUnsavedChangesContext();
    }
    
    /**
     * Checks if the model has unsaved changes
     * @returns True if there are unsaved changes
     */
    private hasUnsavedChanges(): boolean {
        return this.modelService.hasUnsavedChangesInMemory();
    }
      /**
     * Update the context for showing unsaved changes indicator
     */
    private updateUnsavedChangesContext(): void {
        const hasUnsavedChanges = this.hasUnsavedChanges();
        
        if (hasUnsavedChanges !== this._hasUnsavedChangesLastCheck) {
            this._hasUnsavedChangesLastCheck = hasUnsavedChanges;
            vscode.commands.executeCommand('setContext', 'appDnaHasUnsavedChanges', hasUnsavedChanges);
            console.log(`[JsonTreeDataProvider] Updated unsaved changes context to: ${hasUnsavedChanges}`);
              // Update the tree view title to include/remove the circle indicator
            if (this.treeView) {
                if (!this.originalTitle) {
                    this.originalTitle = "AppDNA"; // Store original title first time
                }                // Use ThemeIcon with label for the title instead of string interpolation
                if (hasUnsavedChanges) {
                    this.treeView.title = "●";
                } else {
                    this.treeView.title = "";
                }
            }
        }
    }

    getTreeItem(element: JsonTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: JsonTreeItem): Thenable<JsonTreeItem[]> {
        // Check if the file exists and a model is loaded
        const fileExists = this.appDNAFilePath && fs.existsSync(this.appDNAFilePath);
        const modelLoaded = this.modelService.isFileLoaded();        // If no element is provided (root level request)
        if (!element) {
            if (fileExists) {
                // Create tree items for root level
                // Create PROJECT item that will be the top-level item
                const projectItem = new JsonTreeItem(
                    'PROJECT',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'project'
                );
                
                // Set a project icon for the PROJECT item
                projectItem.iconPath = new vscode.ThemeIcon('project');
                projectItem.tooltip = "Project settings and configuration";                  const dataObjectsItem = new JsonTreeItem(
                    'DATA OBJECTS',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'dataObjects showHierarchy showDataObjectFilter showDataObjectList'
                );
                
                // Set a database icon for the DATA OBJECTS item
                dataObjectsItem.iconPath = new vscode.ThemeIcon('database');
                
                dataObjectsItem.tooltip = "Data Objects (click to expand, right-click for options)";// Create MODEL SERVICES item with appropriate icon based on login status
              
                const isLoggedIn = this.authService.isLoggedIn();
                const modelServicesItem = new JsonTreeItem(
                    'MODEL SERVICES',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'modelServices'
                );
                
                // Use different icons based on authentication status
                if (isLoggedIn) {
                    // Unlocked icon for logged-in state
                    modelServicesItem.iconPath = new vscode.ThemeIcon('globe');
                } else {                // Locked icon for logged-out state
                    modelServicesItem.iconPath = new vscode.ThemeIcon('lock');
                }
                
                // Set tooltip to show login status
                modelServicesItem.tooltip = isLoggedIn ? 
                    "Connected to Model Services API" : 
                    "Authentication required to access Model Services";
                
                // Check if advanced properties should be shown for conditional tree items
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                const showAdvancedProperties = workspaceFolder ? getShowAdvancedPropertiesFromConfig(workspaceFolder) : false;
                
                // Create USER STORIES as a top-level item
                const userStoriesItem = new JsonTreeItem(
                    'USER STORIES',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'userStories'
                );
                
                // Set a book icon for the USER STORIES item
                userStoriesItem.iconPath = new vscode.ThemeIcon('book');
                userStoriesItem.tooltip = "User stories and requirements";

                // Order adjusted: move DATA OBJECTS above USER STORIES per user request
                const items = [projectItem, dataObjectsItem, userStoriesItem];
                
                // Create PAGES as a top-level item (only if advanced properties are enabled)
                if (showAdvancedProperties) {
                    const pagesItem = new JsonTreeItem(
                        'PAGES',
                        vscode.TreeItemCollapsibleState.Collapsed,
                        'pages showPageFlow showPagePreview showPageList'
                    );
                    pagesItem.iconPath = new vscode.ThemeIcon('browser');
                    pagesItem.tooltip = "User interface pages containing forms and reports";
                    console.log('[DEBUG] Created PAGES item with contextValue:', pagesItem.contextValue);
                    items.push(pagesItem);
                    
                    // Create FLOWS as a top-level item (only if advanced properties are enabled)
                    const flowsItem = new JsonTreeItem(
                        'FLOWS',
                        vscode.TreeItemCollapsibleState.Collapsed,
                        'flows'
                    );
                    flowsItem.iconPath = new vscode.ThemeIcon('type-hierarchy-sub');
                    flowsItem.tooltip = "Business logic";
                    console.log('[DEBUG] Created FLOWS item with contextValue:', flowsItem.contextValue);
                    items.push(flowsItem);
                    
                    // Create APIS as a top-level item (only if advanced properties are enabled)
                    const apisItem = new JsonTreeItem(
                        'APIS',
                        vscode.TreeItemCollapsibleState.Collapsed,
                        'apis'
                    );
                    apisItem.iconPath = new vscode.ThemeIcon('globe');
                    apisItem.tooltip = "API sites from all namespaces";
                    console.log('[DEBUG] Created APIS item with contextValue:', apisItem.contextValue);
                    items.push(apisItem);
                }
                
                items.push(modelServicesItem);
                
                // Return tree items in order: PROJECT, DATA OBJECTS, USER STORIES, [PAGES], [FLOWS], [APIS], MODEL SERVICES
                // (PAGES, FLOWS, and APIS only shown when advanced properties are enabled)
                return Promise.resolve(items);
            } else {
                // File doesn't exist, show empty tree
                return Promise.resolve([]);
            }
        }
          // Handle PROJECT children
        if (element?.contextValue === 'project' && fileExists) {
            try {
                // Check if advanced properties should be shown
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                const showAdvancedProperties = workspaceFolder ? getShowAdvancedPropertiesFromConfig(workspaceFolder) : false;
                
                const items = [];
                
                // Create Settings item under PROJECT (always shown)
                const settingsItem = new JsonTreeItem(
                    'Settings',
                    vscode.TreeItemCollapsibleState.None,
                    'projectSettings'
                );
                
                settingsItem.iconPath = new vscode.ThemeIcon('settings-gear');
                settingsItem.tooltip = "Project configuration settings";
                settingsItem.command = {
                    command: 'appdna.showProjectSettings',
                    title: 'Show Project Settings',
                    arguments: []
                };
                items.push(settingsItem);
                
                // Only show advanced items if setting is enabled
                if (showAdvancedProperties) {
                    // Create Lexicon item under PROJECT
                    const lexiconItem = new JsonTreeItem(
                        'Lexicon',
                        vscode.TreeItemCollapsibleState.None,
                        'projectLexicon'
                    );
                    
                    lexiconItem.iconPath = new vscode.ThemeIcon('symbol-string');
                    lexiconItem.tooltip = "Manage lexicon entries";
                    lexiconItem.command = {
                        command: 'appdna.showLexicon',
                        title: 'Show Lexicon',
                        arguments: []
                    };
                    items.push(lexiconItem);
                    
                    // Create MCP Server item with status indicator
                    const isServerRunning = this.mcpServer.isServerRunning();
                    const mcpServerItem = new JsonTreeItem(
                        `MCP Server (${isServerRunning ? 'Running' : 'Stopped'})`,
                        vscode.TreeItemCollapsibleState.None,
                        'projectMCPServer'
                    );

                    // Use different icons based on server status
                    if (isServerRunning) {
                        // Server running icon
                        mcpServerItem.iconPath = new vscode.ThemeIcon('server-environment');
                        mcpServerItem.tooltip = "MCP Server is currently running. Click to stop.";
                        mcpServerItem.command = {
                            command: 'appdna.stopMCPServer',
                            title: 'Stop MCP Server',
                            arguments: []
                        };
                    } else {
                        // Server stopped icon
                        mcpServerItem.iconPath = new vscode.ThemeIcon('server-process');
                        mcpServerItem.tooltip = "MCP Server is currently stopped. Click to start.";
                        mcpServerItem.command = {
                            command: 'appdna.startMCPServer',
                            title: 'Start MCP Server',
                            arguments: []
                        };
                    }
                    items.push(mcpServerItem);
                    
                    // Create MCP HTTP Server item with status indicator
                    const isHttpServerRunning = this.mcpHttpServer.isServerRunning();
                    
                    const mcpHttpServerItem = new JsonTreeItem(
                        `MCP HTTP Server (${isHttpServerRunning ? 'Running' : 'Stopped'})`,
                        vscode.TreeItemCollapsibleState.None,
                        'projectMCPHttpServer'
                    );
                    
                    // Use different icons based on server status
                    if (isHttpServerRunning) {
                        // HTTP Server running icon - use same icon as MCP Server
                        mcpHttpServerItem.iconPath = new vscode.ThemeIcon('server-environment');
                        mcpHttpServerItem.tooltip = "MCP HTTP Server is currently running. Click to stop.";
                        mcpHttpServerItem.command = {
                            command: 'appdna.stopMCPHttpServer',
                            title: 'Stop MCP HTTP Server',
                            arguments: []
                        };
                    } else {
                        // HTTP Server stopped icon - use same icon as MCP Server
                        mcpHttpServerItem.iconPath = new vscode.ThemeIcon('server-process');
                        mcpHttpServerItem.tooltip = "MCP HTTP Server is currently stopped. Click to start.";
                        mcpHttpServerItem.command = {
                            command: 'appdna.startMCPHttpServer',
                            title: 'Start MCP HTTP Server',
                            arguments: []
                        };
                    }
                    items.push(mcpHttpServerItem);
                }
                
                return Promise.resolve(items);
            } catch (error) {
                console.error('Error reading project settings:', error);
                return Promise.resolve([]);
            }
        }
        
        // Handle USER STORIES children
        if (element?.contextValue === 'userStories' && fileExists) {
            try {
                const items = [];
                
                // Create Roles item under USER STORIES - opens the Role data object details
                const rolesItem = new JsonTreeItem(
                    'Roles',
                    vscode.TreeItemCollapsibleState.None,
                    'dataObjectItem'
                );
                
                rolesItem.tooltip = "Role data object details";
                // Create a temporary item with 'Role' as label to pass to the command
                const roleDataObjectItem = new JsonTreeItem(
                    'Role',
                    vscode.TreeItemCollapsibleState.None,
                    'dataObjectItem'
                );
                rolesItem.command = {
                    command: 'appdna.showDetails',
                    title: 'Show Details',
                    arguments: [roleDataObjectItem, 'lookupItems']
                };
                items.push(rolesItem);
                
                // Create Role Requirements item under USER STORIES
                const roleRequirementsItem = new JsonTreeItem(
                    'Role Requirements',
                    vscode.TreeItemCollapsibleState.None,
                    'userStoriesRoleRequirements'
                );
                
                roleRequirementsItem.tooltip = "Manage role requirements and permissions for data objects";
                roleRequirementsItem.command = {
                    command: 'appdna.showRoleRequirements',
                    title: 'Show Role Requirements',
                    arguments: []
                };
                items.push(roleRequirementsItem);
                
                // Create Stories item under USER STORIES
                const storiesItem = new JsonTreeItem(
                    'Stories',
                    vscode.TreeItemCollapsibleState.None,
                    'userStoriesStories'
                );
                
                storiesItem.tooltip = "Manage user stories";
                storiesItem.command = {
                    command: 'appdna.showUserStories',
                    title: 'Show User Stories',
                    arguments: []
                };
                items.push(storiesItem);
                
                // Create Page Mapping item under USER STORIES
                const pageMappingItem = new JsonTreeItem(
                    'Page Mapping',
                    vscode.TreeItemCollapsibleState.None,
                    'userStoriesPageMapping'
                );
                
                pageMappingItem.tooltip = "Page mapping and requirements management";
                pageMappingItem.command = {
                    command: 'appdna.userStoriesPageMapping',
                    title: 'User Stories Page Mapping',
                    arguments: []
                };
                items.push(pageMappingItem);
                
                // Create User Journey item under USER STORIES
                const userJourneyItem = new JsonTreeItem(
                    'User Journey',
                    vscode.TreeItemCollapsibleState.None,
                    'userStoriesJourney'
                );
                
                userJourneyItem.tooltip = "View user story journey showing pages that fulfill each story";
                userJourneyItem.command = {
                    command: 'appdna.userStoriesJourney',
                    title: 'User Stories Journey',
                    arguments: []
                };
                items.push(userJourneyItem);
                
                // Create Requirements Fulfillment item under USER STORIES
                const requirementsFulfillmentItem = new JsonTreeItem(
                    'Requirements Fulfillment',
                    vscode.TreeItemCollapsibleState.None,
                    'userStoriesRequirementsFulfillment'
                );
                
                requirementsFulfillmentItem.tooltip = "View required and not allowed role requirements";
                requirementsFulfillmentItem.command = {
                    command: 'appdna.showRequirementsFulfillment',
                    title: 'User Story Requirements Fulfillment',
                    arguments: []
                };
                items.push(requirementsFulfillmentItem);
                
                // Create QA item under USER STORIES
                const qaItem = new JsonTreeItem(
                    'QA',
                    vscode.TreeItemCollapsibleState.None,
                    'userStoriesQA'
                );
                
                qaItem.tooltip = "Track QA status of user stories";
                qaItem.command = {
                    command: 'appdna.userStoriesQA',
                    title: 'User Stories QA',
                    arguments: []
                };
                items.push(qaItem);
                
                return Promise.resolve(items);
            } catch (error) {
                console.error('Error reading user stories:', error);
                return Promise.resolve([]);
            }
        }
        
        // Handle PAGES as a parent item - show FORMS and REPORTS as children
        if (element?.contextValue?.startsWith('pages') && fileExists) {
            try {
                const items: JsonTreeItem[] = [];
                
                // Create FORMS as a child of PAGES
                const formsItem = new JsonTreeItem(
                    'FORMS',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'forms showFormFilter'
                );
                formsItem.iconPath = new vscode.ThemeIcon('edit');
                formsItem.tooltip = "Model forms (object workflows with isPage=true)";
                items.push(formsItem);
                
                // Create REPORTS as a child of PAGES
                const reportsItem = new JsonTreeItem(
                    'REPORTS',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'reports showReportFilter'
                );
                reportsItem.iconPath = new vscode.ThemeIcon('book');
                reportsItem.tooltip = "Model reports from all objects (click to expand, right-click for options)";
                items.push(reportsItem);
                
                return Promise.resolve(items);
            } catch (error) {
                console.error('Error reading pages:', error);
                return Promise.resolve([]);
            }
        }

        // Handle FLOWS as a parent item - show PAGE_INIT, GENERAL, WORKFLOWS, and WORKFLOW_TASKS as children
        if (element?.contextValue?.startsWith('flows') && fileExists) {
            try {
                const items: JsonTreeItem[] = [];
                
                // Create PAGE_INIT as a child of FLOWS
                const pageInitItem = new JsonTreeItem(
                    'PAGE_INIT',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'pageInit showPageInitFilter showPageInitList'
                );
                pageInitItem.tooltip = "Page initialization flows";
                items.push(pageInitItem);
                
                // Create GENERAL as a child of FLOWS
                const generalItem = new JsonTreeItem(
                    'GENERAL',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'general showGeneralFilter showGeneralList'
                );
                generalItem.tooltip = "General workflow flows";
                items.push(generalItem);
                
                // Only show WORKFLOWS if DynaFlow data object exists
                if (modelLoaded && this.modelService.hasDynaFlowDataObject()) {
                    const workflowsItem = new JsonTreeItem(
                        'WORKFLOWS',
                        vscode.TreeItemCollapsibleState.Collapsed,
                        'workflows showWorkflowsFilter showWorkflowsList'
                    );
                    workflowsItem.tooltip = "DynaFlow workflows (requires DynaFlow data object)";
                    items.push(workflowsItem);
                }
                
                // Only show WORKFLOW_TASKS if both DynaFlow and DynaFlowTask data objects exist
                if (modelLoaded && this.modelService.hasDynaFlowDataObject() && this.modelService.hasDynaFlowTaskDataObject()) {
                    const workflowTasksItem = new JsonTreeItem(
                        'WORKFLOW_TASKS',
                        vscode.TreeItemCollapsibleState.Collapsed,
                        'workflowTasks showWorkflowTasksFilter'
                    );
                    workflowTasksItem.tooltip = "DynaFlow task workflows (requires DynaFlow and DynaFlowTask data objects)";
                    items.push(workflowTasksItem);
                }
                
                return Promise.resolve(items);
            } catch (error) {
                console.error('Error reading flows:', error);
                return Promise.resolve([]);
            }
        }

        // Handle APIS as a parent item - show individual API site items from all namespaces
        if (element?.contextValue?.startsWith('apis') && fileExists) {
            try {
                const items: JsonTreeItem[] = [];
                
                // Get all API sites from all namespaces
                const allApiSites = this.modelService.getAllApiSites();
                
                // Create a tree item for each API site
                for (const apiSite of allApiSites) {
                    if (apiSite.name) {
                        const apiSiteItem = new JsonTreeItem(
                            apiSite.name,
                            vscode.TreeItemCollapsibleState.None,
                            'apiSiteItem'
                        );
                        
                        // Set tooltip with API site details
                        let tooltip = `API Site: ${apiSite.name}`;
                        if (apiSite.title) {
                            tooltip += `\nTitle: ${apiSite.title}`;
                        }
                        if (apiSite.description) {
                            tooltip += `\nDescription: ${apiSite.description}`;
                        }
                        if (apiSite.versionNumber) {
                            tooltip += `\nVersion: ${apiSite.versionNumber}`;
                        }
                        apiSiteItem.tooltip = tooltip;
                        
                        items.push(apiSiteItem);
                    }
                }
                
                // Sort items alphabetically by label
                items.sort((a, b) => a.label!.toString().localeCompare(b.label!.toString()));
                
                // If no items found, show message
                if (items.length === 0) {
                    return Promise.resolve([
                        new JsonTreeItem(
                            'No API sites found',
                            vscode.TreeItemCollapsibleState.None,
                            'noApiSites'
                        )
                    ]);
                }
                
                return Promise.resolve(items);
            } catch (error) {
                console.error('Error reading API sites:', error);
                return Promise.resolve([]);
            }
        }

        // Handle GENERAL as a parent item - show general objectWorkflow items
        if (element?.contextValue?.includes('general') && fileExists) {
            try {
                const items: JsonTreeItem[] = [];
                
                if (modelLoaded) {
                    // Use ModelService to get all objects
                    const allObjects = this.modelService.getAllObjects();
                    
                    // Collect all objectWorkflow items from all objects that meet the criteria
                    const seenNames = new Set<string>();
                    allObjects.forEach((obj: any) => {
                        if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                            obj.objectWorkflow.forEach((workflow: any) => {
                                if (workflow.name) {
                                    const workflowName = workflow.name.toLowerCase();
                                    
                                    // Check all criteria:
                                    // 1. isDynaFlow property does not exist or is false
                                    const isDynaFlowOk = !workflow.isDynaFlow || workflow.isDynaFlow === "false";
                                    
                                    // 2. isDynaFlowTask property does not exist or is false
                                    const isDynaFlowTaskOk = !workflow.isDynaFlowTask || workflow.isDynaFlowTask === "false";
                                    
                                    // 3. isPage property is false
                                    const isPageOk = workflow.isPage === "false";
                                    
                                    // 4. name does not end with initobjwf
                                    const notInitObjWf = !workflowName.endsWith('initobjwf');
                                    
                                    // 5. name does not end with initreport
                                    const notInitReport = !workflowName.endsWith('initreport');
                                    
                                    // All criteria must be true
                                    if (isDynaFlowOk && isDynaFlowTaskOk && isPageOk && notInitObjWf && notInitReport) {
                                        const displayName = workflow.titleText || workflow.name;
                                        const objectName = obj.name || 'Unknown Object';
                                        
                                        // Apply filters (global and general specific)
                                        if (this.applyFilter(displayName) && this.applyGeneralFilter(displayName)) {
                                            // Check for duplicates and log them
                                            if (seenNames.has(displayName)) {
                                                console.error(`[GENERAL] Duplicate workflow found: "${displayName}" from object "${objectName}". Previous workflow with same display name already exists.`);
                                            } else {
                                                seenNames.add(displayName);
                                            }
                                            
                                            console.log(`[GENERAL] Creating workflow item: "${displayName}" from object "${objectName}" (workflow name: "${workflow.name}")`);
                                            
                                            const workflowItem = new JsonTreeItem(
                                                displayName,
                                                vscode.TreeItemCollapsibleState.None,
                                                'generalWorkflowItem'
                                            );
                                            
                                            // Set tooltip with workflow details
                                            workflowItem.tooltip = `${workflow.name} (from ${objectName}) - General Workflow`;
                                            
                                            items.push(workflowItem);
                                        }
                                    }
                                }
                            });
                        }
                    });
                    
                    // Sort items alphabetically by label
                    items.sort((a, b) => a.label!.toString().localeCompare(b.label!.toString()));
                    
                    // If filtering is active and no results found, show message
                    if ((this.filterText || this.generalFilterText) && items.length === 0) {
                        return Promise.resolve([
                            new JsonTreeItem(
                                'No general workflows match filter',
                                vscode.TreeItemCollapsibleState.None,
                                'generalEmpty'
                            )
                        ]);
                    }
                    
                    // If no items found and no filter active, show original message
                    if (items.length === 0) {
                        return Promise.resolve([
                            new JsonTreeItem(
                                'No general workflows found',
                                vscode.TreeItemCollapsibleState.None,
                                'generalEmpty'
                            )
                        ]);
                    }
                }
                
                return Promise.resolve(items);
            } catch (error) {
                console.error('Error reading general workflows:', error);
                return Promise.resolve([]);
            }
        }

        // Handle PAGE_INIT as a parent item - show objectWorkflow items ending with 'initreport' or 'initobjwf'
        if (element?.contextValue?.includes('pageInit') && fileExists) {
            console.log('PAGE_INIT: Handler triggered, contextValue:', element?.contextValue);
            try {
                const items: JsonTreeItem[] = [];
                
                if (modelLoaded) {
                    console.log('PAGE_INIT: Model is loaded, getting all objects...');
                    // Use ModelService to get all objects
                    const allObjects = this.modelService.getAllObjects();
                    console.log('PAGE_INIT: Found', allObjects.length, 'objects');
                    
                    // Collect all objectWorkflow items from all objects
                    allObjects.forEach((obj: any) => {
                        if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                            console.log('PAGE_INIT: Object', obj.name, 'has', obj.objectWorkflow.length, 'workflows');
                            obj.objectWorkflow.forEach((workflow: any) => {
                                if (workflow.name) {
                                    const workflowName = workflow.name.toLowerCase();
                                    console.log('PAGE_INIT: Checking workflow:', workflow.name, 'ends with initreport?', workflowName.endsWith('initreport'), 'ends with initobjwf?', workflowName.endsWith('initobjwf'));
                                    // Check if name ends with 'initreport' or 'initobjwf'
                                    if (workflowName.endsWith('initreport') || workflowName.endsWith('initobjwf')) {
                                        console.log('PAGE_INIT: Found matching workflow:', workflow.name);
                                        const displayName = workflow.name; // Use actual workflow name, not titleText
                                        // Apply filters (global and page init specific)
                                        if (this.applyFilter(displayName) && this.applyPageInitFilter(displayName)) {
                                            console.log('PAGE_INIT: Workflow passed filters, adding:', displayName);
                                            const workflowItem = new JsonTreeItem(
                                                displayName,
                                                vscode.TreeItemCollapsibleState.None,
                                                'pageInitWorkflowItem'
                                            );
                                            
                                            // Set tooltip with workflow details
                                            const objectName = obj.name || 'Unknown Object';
                                            workflowItem.tooltip = `${workflow.name} (from ${objectName})`;
                                            
                                            items.push(workflowItem);
                                        } else {
                                            console.log('PAGE_INIT: Workflow filtered out:', displayName, 'global filter result:', this.applyFilter(displayName), 'pageInit filter result:', this.applyPageInitFilter(displayName));
                                        }
                                    }
                                }
                            });
                        }
                    });
                    
                    console.log('PAGE_INIT: Total items found:', items.length);
                    // Sort items alphabetically by label
                    items.sort((a, b) => a.label!.toString().localeCompare(b.label!.toString()));
                    
                    // If filtering is active and no results found, show message
                    if ((this.filterText || this.pageInitFilterText) && items.length === 0) {
                        console.log('PAGE_INIT: No items found with active filter');
                        return Promise.resolve([
                            new JsonTreeItem(
                                'No page init workflows match filter',
                                vscode.TreeItemCollapsibleState.None,
                                'pageInitEmpty'
                            )
                        ]);
                    }
                    
                    // If no items found and no filter active, show original message
                    if (items.length === 0) {
                        console.log('PAGE_INIT: No items found, no filter active');
                        return Promise.resolve([
                            new JsonTreeItem(
                                'No page initialization workflows found',
                                vscode.TreeItemCollapsibleState.None,
                                'pageInitEmpty'
                            )
                        ]);
                    }
                } else {
                    console.log('PAGE_INIT: Model not loaded');
                }
                
                console.log('PAGE_INIT: Returning', items.length, 'items');
                return Promise.resolve(items);
            } catch (error) {
                console.error('PAGE_INIT: Error reading page init workflows:', error);
                return Promise.resolve([]);
            }
        }

        // Handle WORKFLOWS as a parent item - show objectWorkflow items where isDynaFlow is true
        if (element?.contextValue?.includes('workflows') && fileExists) {
            try {
                const items: JsonTreeItem[] = [];
                
                if (modelLoaded) {
                    // Use ModelService to get all objects
                    const allObjects = this.modelService.getAllObjects();
                    
                    // Collect all objectWorkflow items from all objects where isDynaFlow is true
                    allObjects.forEach((obj: any) => {
                        if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                            obj.objectWorkflow.forEach((workflow: any) => {
                                if (workflow.name && workflow.isDynaFlow === "true") {
                                    const displayName = workflow.titleText || workflow.name;
                                    
                                    // Apply filters (global and workflows specific)
                                    if (this.applyFilter(displayName) && this.applyWorkflowsFilter(displayName)) {
                                        const workflowItem = new JsonTreeItem(
                                            displayName,
                                            vscode.TreeItemCollapsibleState.None,
                                            'dynaFlowWorkflowItem'
                                        );
                                        
                                        // Set tooltip with workflow details
                                        const objectName = obj.name || 'Unknown Object';
                                        workflowItem.tooltip = `${workflow.name} (from ${objectName}) - DynaFlow`;
                                        
                                        items.push(workflowItem);
                                    }
                                }
                            });
                        }
                    });
                    
                    // Sort items alphabetically by label
                    items.sort((a, b) => a.label!.toString().localeCompare(b.label!.toString()));
                    
                    // If filtering is active and no results found, show message
                    if ((this.filterText || this.workflowsFilterText) && items.length === 0) {
                        return Promise.resolve([
                            new JsonTreeItem(
                                'No workflows match filter',
                                vscode.TreeItemCollapsibleState.None,
                                'workflowsEmpty'
                            )
                        ]);
                    }
                    
                    // If no items found and no filter active, show original message
                    if (items.length === 0) {
                        return Promise.resolve([
                            new JsonTreeItem(
                                'No DynaFlow workflows found',
                                vscode.TreeItemCollapsibleState.None,
                                'workflowsEmpty'
                            )
                        ]);
                    }
                }
                
                return Promise.resolve(items);
            } catch (error) {
                console.error('Error reading DynaFlow workflows:', error);
                return Promise.resolve([]);
            }
        }

        // Handle WORKFLOW_TASKS as a parent item - show objectWorkflow items where isDynaFlowTask is true
        if (element?.contextValue?.includes('workflowTasks') && fileExists) {
            try {
                const items: JsonTreeItem[] = [];
                
                if (modelLoaded) {
                    // Use ModelService to get all objects
                    const allObjects = this.modelService.getAllObjects();
                    
                    // Collect all objectWorkflow items from all objects where isDynaFlowTask is true
                    allObjects.forEach((obj: any) => {
                        if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                            obj.objectWorkflow.forEach((workflow: any) => {
                                if (workflow.name && workflow.isDynaFlowTask === "true") {
                                    const displayName = workflow.titleText || workflow.name;
                                    
                                    // Apply filters (global and workflow tasks specific)
                                    if (this.applyFilter(displayName) && this.applyWorkflowTasksFilter(displayName)) {
                                        const workflowItem = new JsonTreeItem(
                                            displayName,
                                            vscode.TreeItemCollapsibleState.None,
                                            'dynaFlowTaskWorkflowItem'
                                        );
                                        
                                        // Set tooltip with workflow details
                                        const objectName = obj.name || 'Unknown Object';
                                        workflowItem.tooltip = `${workflow.name} (from ${objectName}) - DynaFlow Task`;
                                        
                                        items.push(workflowItem);
                                    }
                                }
                            });
                        }
                    });
                    
                    // Sort items alphabetically by label
                    items.sort((a, b) => a.label!.toString().localeCompare(b.label!.toString()));
                    
                    // If filtering is active and no results found, show message
                    if ((this.filterText || this.workflowTasksFilterText) && items.length === 0) {
                        return Promise.resolve([
                            new JsonTreeItem(
                                'No workflow tasks match filter',
                                vscode.TreeItemCollapsibleState.None,
                                'workflowTasksEmpty'
                            )
                        ]);
                    }
                    
                    // If no items found, show message
                    if (items.length === 0) {
                        return Promise.resolve([
                            new JsonTreeItem(
                                'No DynaFlow task workflows found',
                                vscode.TreeItemCollapsibleState.None,
                                'workflowTasksEmpty'
                            )
                        ]);
                    }
                }
                
                return Promise.resolve(items);
            } catch (error) {
                console.error('Error reading DynaFlow task workflows:', error);
                return Promise.resolve([]);
            }
        }

        // Handle child elements
        if (element?.contextValue?.includes('dataObjects') && fileExists) {
            try {
                if (modelLoaded) {
                    // Use ModelService to get all objects
                    const allObjects = this.modelService.getAllObjects();
                      // Apply filtering to objects (both global filter and data object-specific filter)
                    const filteredObjects = allObjects.filter(obj => {
                        const objectName = obj.name || `Object ${allObjects.indexOf(obj) + 1}`;
                        return this.applyFilter(objectName) && this.applyDataObjectFilter(objectName);
                    });
                    
                    // Check if we need to expand this when filter is active
                    const collapsibleState = (this.filterText || this.dataObjectFilterText)
                        ? vscode.TreeItemCollapsibleState.Expanded
                        : vscode.TreeItemCollapsibleState.Collapsed;
                    
                    // If filtering is active and no results found, show message
                    if ((this.filterText || this.dataObjectFilterText) && filteredObjects.length === 0) {
                        return Promise.resolve([
                            new JsonTreeItem(
                                'No objects match filter',
                                vscode.TreeItemCollapsibleState.None,
                                'dataObjectsEmpty'
                            )
                        ]);
                    }
                    
                    // Sort objects alphabetically by name
                    const sortedObjects = filteredObjects.slice().sort((a, b) => {
                        const nameA = (a.name || `Object ${allObjects.indexOf(a) + 1}`).toLowerCase();
                        const nameB = (b.name || `Object ${allObjects.indexOf(b) + 1}`).toLowerCase();
                        return nameA.localeCompare(nameB);
                    });
                    
                    return Promise.resolve(
                        sortedObjects.map((obj: any, index: number) => {
                            const item = new JsonTreeItem(
                                obj.name || `Object ${allObjects.indexOf(obj) + 1}`,
                                vscode.TreeItemCollapsibleState.None,
                                'dataObjectItem'
                            );
                            // Add command to open data object details view with settings tab
                            item.command = {
                                command: 'appdna.showDetails',
                                title: 'Show Details',
                                arguments: [item]
                            };
                            return item;
                        })
                    );
                } else {
                    // Fallback to direct file reading if model isn't loaded
                    console.log("Model not loaded, reading from file directly");
                    const fileContent = fs.readFileSync(this.appDNAFilePath!, 'utf-8');
                    const jsonData = JSON.parse(fileContent);
                    let objects: any[] = [];
                    if (jsonData.root.namespace && Array.isArray(jsonData.root.namespace)) {
                        jsonData.root.namespace.forEach((ns: any) => {
                            if (!ns.object) {
                                return;
                            }
                            if (Array.isArray(ns.object)) {
                                objects.push(...ns.object);
                            }
                        });
                    }
                    
                    // Sort objects alphabetically by name
                    const sortedObjects = objects.slice().sort((a, b) => {
                        const nameA = (a.name || `Object ${objects.indexOf(a) + 1}`).toLowerCase();
                        const nameB = (b.name || `Object ${objects.indexOf(b) + 1}`).toLowerCase();
                        return nameA.localeCompare(nameB);
                    });
                    
                    return Promise.resolve(
                        sortedObjects.map((obj: any, index: number) => {
                            const item = new JsonTreeItem(
                                obj.name || `Object ${index + 1}`,
                                vscode.TreeItemCollapsibleState.None,
                                'dataObjectItem'
                            );
                            // Add command to open data object details view with settings tab
                            item.command = {
                                command: 'appdna.showDetails',
                                title: 'Show Details',
                                arguments: [item]
                            };
                            return item;
                        })
                    );
                }
            } catch (error) {
                console.error('Error reading objects:', error);
                return Promise.resolve([]);
            }        }
          // Handle REPORTS as a top-level item
        if (element?.contextValue?.includes('reports') && fileExists) {
            try {
                if (modelLoaded) {
                    // Use ModelService to get all reports
                    const allReports = this.modelService.getAllReports();
                    if (allReports.length === 0) {
                        return Promise.resolve([
                            new JsonTreeItem(
                                'No reports found',
                                vscode.TreeItemCollapsibleState.None,
                                'reportsEmpty'
                            )
                        ]);
                    }
                    
                    // Apply filtering to reports (both global filter and report-specific filter)
                    const filteredReports = allReports.filter(report => {
                        const reportName = report.name || `Report ${allReports.indexOf(report) + 1}`;
                        return this.applyFilter(reportName) && this.applyReportFilter(reportName);
                    });
                    
                    // Check if we need to expand this when filter is active
                    const collapsibleState = (this.filterText || this.reportFilterText)
                        ? vscode.TreeItemCollapsibleState.Expanded
                        : vscode.TreeItemCollapsibleState.Collapsed;
                    
                    // If filtering is active and no results found, show message
                    if ((this.filterText || this.reportFilterText) && filteredReports.length === 0) {
                        return Promise.resolve([
                            new JsonTreeItem(
                                'No reports match filter',
                                vscode.TreeItemCollapsibleState.None,
                                'reportsEmpty'
                            )
                        ]);
                    }
                    
                    // Sort reports alphabetically by name
                    const sortedReports = filteredReports.slice().sort((a, b) => {
                        const nameA = (a.name || `Report ${allReports.indexOf(a) + 1}`).toLowerCase();
                        const nameB = (b.name || `Report ${allReports.indexOf(b) + 1}`).toLowerCase();
                        return nameA.localeCompare(nameB);
                    });
                    
                    return Promise.resolve(
                        sortedReports.map((report: any, index: number) =>
                            new JsonTreeItem(
                                report.name || `Report ${allReports.indexOf(report) + 1}`,
                                vscode.TreeItemCollapsibleState.None,
                                'reportItem'
                            )
                        )
                    );
                } else {
                    // If model isn't loaded, show placeholder
                    return Promise.resolve([
                        new JsonTreeItem(
                            'Model not loaded',
                            vscode.TreeItemCollapsibleState.None,
                            'reportsEmpty'
                        )
                    ]);
                }
            } catch (error) {
                console.error('Error reading reports:', error);
                return Promise.resolve([]);
            }
        }
        
        // Handle MODEL SERVICES children - show login/logout option and services when logged in
        if (element?.contextValue === 'modelServices' && fileExists) {
            try {
                const items: JsonTreeItem[] = [];
                const isLoggedIn = this.authService.isLoggedIn();
                
                // First item is always Login/Logout based on current state
                if (isLoggedIn) {                    // When logged in, add service items first
                    const serviceItems = [
                        { name: "Model Feature Catalog", description: "Browse and select model features" },
                        { name: "Model AI Processing", description: "Submit models for AI processing" },
                        { name: "Model Validation", description: "Validate models against best practices" },
                        { name: "Fabrication Blueprint Catalog", description: "Browse and select fabrication blueprints" },
                        { name: "Model Fabrication", description: "Generate fabrication code from models" }
                    ];
                    serviceItems.forEach(service => {
                        const serviceItem = new JsonTreeItem(
                            service.name,
                            vscode.TreeItemCollapsibleState.None,
                            'modelServiceItem'
                        );
                        serviceItem.tooltip = service.description;
                        serviceItem.iconPath = new vscode.ThemeIcon('cloud');
                        
                        // Set the appropriate command for each service
                        if (service.name === "Model Feature Catalog") {
                            serviceItem.command = {
                                command: 'appdna.modelFeatureCatalog',
                                title: 'Show Model Feature Catalog',
                                arguments: []
                            };
                        } else if (service.name === "Model Validation") {
                            serviceItem.command = {
                                command: 'appdna.modelValidation',
                                title: 'Show Model Validation Requests',
                                arguments: []
                            };
                        } else if (service.name === "Model AI Processing") {
                            serviceItem.command = {
                                command: 'appdna.modelAIProcessing',
                                title: 'Show Model AI Processing Requests',
                                arguments: []
                            };                        } else if (service.name === "Fabrication Blueprint Catalog") {
                            serviceItem.command = {
                                command: 'appdna.fabricationBlueprintCatalog',
                                title: 'Show Fabrication Blueprint Catalog',
                                arguments: []
                            };
                        } else if (service.name === "Model Fabrication") {
                            serviceItem.command = {
                                command: 'appdna.modelFabrication',
                                title: 'Show Model Fabrication Requests',
                                arguments: []
                            };
                        }
                        
                        items.push(serviceItem);
                    });
                    
                    // Add logout option last
                    const logoutItem = new JsonTreeItem(
                        "Logout",
                        vscode.TreeItemCollapsibleState.None,
                        'modelServiceLogout'
                    );
                    logoutItem.iconPath = new vscode.ThemeIcon('sign-out');
                    logoutItem.command = {
                        command: 'appdna.logoutModelServices',
                        title: 'Logout from Model Services',
                        arguments: []
                    };
                    items.push(logoutItem);
                } else {
                    // Add login option
                    const loginItem = new JsonTreeItem(
                        "Login",
                        vscode.TreeItemCollapsibleState.None,
                        'modelServiceLogin'
                    );
                    
                    loginItem.iconPath = new vscode.ThemeIcon('sign-in');
                    loginItem.command = {
                        command: 'appdna.loginModelServices',
                        title: 'Login',
                        arguments: []
                    };
                    
                    items.push(loginItem);
                    
                    // Add register option
                    const registerItem = new JsonTreeItem(
                        "Register",
                        vscode.TreeItemCollapsibleState.None,
                        'modelServiceRegister'
                    );
                    
                    registerItem.iconPath = new vscode.ThemeIcon('person-add');
                    registerItem.command = {
                        command: 'appdna.registerModelServices',
                        title: 'Register',
                        arguments: []
                    };
                    
                    items.push(registerItem);
                }
                
                return Promise.resolve(items);
            } catch (error) {
                console.error('Error loading model services:', error);
                return Promise.resolve([]);
            }
        }
        
        // Handle FORMS as a top-level item
        if (element?.contextValue?.includes('forms') && fileExists) {
            try {
                if (modelLoaded) {
                    // Use ModelService to get all page object workflows
                    const allPageWorkflows = this.modelService.getAllPageObjectWorkflows();
                    if (allPageWorkflows.length === 0) {
                        return Promise.resolve([
                            new JsonTreeItem(
                                'No forms found',
                                vscode.TreeItemCollapsibleState.None,
                                'formsEmpty'
                            )
                        ]);
                    }
                    
                    // Apply filtering to forms (both global filter and form-specific filter)
                    const filteredForms = allPageWorkflows.filter(workflow => {
                        const workflowName = workflow.name || workflow.titleText || 'Unnamed Form';
                        return this.applyFilter(workflowName) && this.applyFormFilter(workflowName);
                    });
                    
                    // Check if we need to expand this when filter is active
                    const collapsibleState = (this.filterText || this.formFilterText)
                        ? vscode.TreeItemCollapsibleState.Expanded
                        : vscode.TreeItemCollapsibleState.Collapsed;
                    
                    // If filtering is active and no results found, show message
                    if ((this.filterText || this.formFilterText) && filteredForms.length === 0) {
                        return Promise.resolve([
                            new JsonTreeItem(
                                'No forms match filter',
                                vscode.TreeItemCollapsibleState.None,
                                'formsEmpty'
                            )
                        ]);
                    }
                    
                    // Sort forms alphabetically by display name
                    const sortedForms = filteredForms.slice().sort((a, b) => {
                        const nameA = (a.name || a.titleText || 'Unnamed Form').toLowerCase();
                        const nameB = (b.name || b.titleText || 'Unnamed Form').toLowerCase();
                        return nameA.localeCompare(nameB);
                    });
                    
                    return Promise.resolve(
                        sortedForms.map((workflow: any, index: number) => {
                            const displayName = workflow.name || workflow.titleText || `Form ${index + 1}`;
                            const formItem = new JsonTreeItem(
                                displayName,
                                vscode.TreeItemCollapsibleState.None,
                                'formItem'
                            );
                            formItem.tooltip = `Form: ${displayName}${workflow.titleText ? ` (${workflow.titleText})` : ''}`;
                            return formItem;
                        })
                    );
                } else {
                    // If model isn't loaded, show placeholder
                    return Promise.resolve([
                        new JsonTreeItem(
                            'Model not loaded',
                            vscode.TreeItemCollapsibleState.None,
                            'formsEmpty'
                        )
                    ]);
                }
            } catch (error) {
                console.error('Error reading forms:', error);
                return Promise.resolve([]);
            }
        }
        
        return Promise.resolve([]);
    }    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Expands all top-level items in the tree view
     * Used by the expandAllTopLevel command
     */    expandAllItems(): void {
        try {
            // Get the top-level items from the model
            const topLevelItems = [
                'PROJECT',
                'USER STORIES',
                'DATA OBJECTS',
                'REPORTS',
                'MODEL SERVICES'
            ];
            
            // The trick is to create a special change event that will
            // both refresh the tree and expand all items
            this._onDidChangeTreeData.fire();
            
            console.log("Fired tree data change event for expansion");
            
            // After the tree refreshes, we need to manually reveal/expand each item
            // This is handled by the command itself
        } catch (error) {
            console.error("Error expanding all items:", error);
        }
    }

    /**
     * Gets the parent of a given tree item
     * Required for the treeView.reveal() method to work correctly
     * @param element The tree item to get the parent for
     * @returns The parent tree item or null if the element is a root item
     */
    getParent(element: JsonTreeItem): Thenable<JsonTreeItem | null> {
        // Check if this is one of our root-level items
        if (!element) {
            return Promise.resolve(null);
        }
          // Root-level items (PROJECT, USER STORIES, DATA OBJECTS, REPORTS, MODEL SERVICES) have no parent
        if (['PROJECT', 'USER STORIES', 'DATA OBJECTS', 'REPORTS', 'MODEL SERVICES'].includes(element.label)) {
            return Promise.resolve(null);
        }
        
        // Check context values to determine hierarchy
        if (element.contextValue === 'dataObjectItem') {
            // If this is a data object, its parent is the DATA OBJECTS item
            return Promise.resolve(new JsonTreeItem(
                'DATA OBJECTS',
                vscode.TreeItemCollapsibleState.Collapsed,
                'dataObjects showHierarchy'
            ));
        }
          if (element.contextValue?.startsWith('report')) {
            // If this is a report item, its parent is the REPORTS item
            return Promise.resolve(new JsonTreeItem(
                'REPORTS',
                vscode.TreeItemCollapsibleState.Collapsed,
                'reports showReportFilter'
            ));
        }
        
        if (element.contextValue?.startsWith('project')) {
            // If this is a project-related item, its parent is the PROJECT item
            return Promise.resolve(new JsonTreeItem(
                'PROJECT',
                vscode.TreeItemCollapsibleState.Collapsed,
                'project'
            ));
        }
        
        if (element.contextValue?.startsWith('userStories')) {
            // If this is a user stories-related item, its parent is the USER STORIES item
            return Promise.resolve(new JsonTreeItem(
                'USER STORIES',
                vscode.TreeItemCollapsibleState.Collapsed,
                'userStories'
            ));
        }
        
        if (element.contextValue?.startsWith('modelService')) {
            // If this is a model service-related item, its parent is the MODEL SERVICES item
            return Promise.resolve(new JsonTreeItem(
                'MODEL SERVICES',
                vscode.TreeItemCollapsibleState.Collapsed,
                'modelServices'
            ));
        }
        
        // Default case - can't determine parent
        return Promise.resolve(null);
    }

    addObject(name: string, namespace: string = "Default"): void {
        if (!this.appDNAFilePath || !fs.existsSync(this.appDNAFilePath)) {
            vscode.window.showErrorMessage('AppDNA file not found. Cannot add object.');
            return;
        }

        try {
            // Get the current model or read from file if model is not loaded
            let model;
            if (this.modelService.isFileLoaded()) {
                model = this.modelService.getCurrentModel();
                if (!model) {
                    throw new Error("Failed to get current model");
                }
            } else {
                // Read the current file content as fallback
                const fileContent = fs.readFileSync(this.appDNAFilePath, 'utf-8');
                model = JSON.parse(fileContent) as AppDNAData;
            }

            // Ensure root and namespace structure exists
            if (!model.root) {
                model.root = { namespace: [] };
            }
            if (!Array.isArray(model.root.namespace)) {
                model.root.namespace = [];
            }

            // Find or create the target namespace
            let targetNs = model.root.namespace.find((ns: any) => ns.name === namespace);
            if (!targetNs) {
                targetNs = { name: namespace, object: [] };
                model.root.namespace.push(targetNs);
            }
            if (!Array.isArray(targetNs.object)) {
                targetNs.object = [];
            }

            // Create the new object
            const newObj: any = {
                name: name,
                id: `obj_${Date.now()}`,
                properties: []
            };

            // Add the object to the namespace
            targetNs.object.push(newObj);

            // Save the updated model
            if (this.modelService.isFileLoaded()) {
                this.modelService.saveToFile(model);
            } else {
                // Write directly to file as fallback
                fs.writeFileSync(this.appDNAFilePath, JSON.stringify(model, null, 2), 'utf-8');
                // Load the model after writing
                this.modelService.loadFile(this.appDNAFilePath);
            }
            
            // Refresh the view
            this.refresh();
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to add object: ${errorMessage}`);
        }
    }

    reset(): void {
        if (this.modelService.isFileLoaded()) {
            const model = this.modelService.getCurrentModel();
            if (model && model.namespace) {
                // Clear all objects in all namespaces
                model.namespace.forEach(ns => {
                    if (ns.object) {
                        ns.object = [];
                    }
                });
                this.modelService.saveToFile(model);
            }
        }
        this.jsonStructure.root.object = [];
        this.refresh();
    }

    loadProject(projectData: any): void {
        if (this.modelService.isFileLoaded()) {
            this.modelService.saveToFile(projectData);
        } else {
            this.jsonStructure.root.object = projectData.root.object;
        }
        this.refresh();
    }

    getProject(): any {
        if (this.modelService.isFileLoaded()) {
            return this.modelService.getCurrentModel();
        }
        return this.jsonStructure;
    }

    /**
     * Sets a filter for the tree view items
     * @param filterText The text to filter nodes by
     */
    setFilter(filterText: string): void {
        // Convert to lowercase for case-insensitive comparison
        this.filterText = filterText.toLowerCase();
        // Update context to indicate filter is active
        vscode.commands.executeCommand('setContext', 'appDnaTreeViewFilterActive', !!this.filterText);
        // Refresh the tree to apply the filter
        this.refresh();
    }

    /**
     * Clears the current filter
     */
    clearFilter(): void {
        this.filterText = "";
        // Update context to indicate filter is not active
        vscode.commands.executeCommand('setContext', 'appDnaTreeViewFilterActive', false);
        // Refresh the tree to show all items
        this.refresh();
    }

    /**
     * Checks if an item's label matches the current filter
     * @param label The label to check against the filter
     * @returns True if the label matches the filter or no filter is set
     */
    private applyFilter(label: string): boolean {
        // If no filter is set, all items match
        if (!this.filterText) {
            return true;
        }
        
        // Case-insensitive match of filter text within the label
        return label.toLowerCase().includes(this.filterText);
    }

    /**
     * Sets a filter for only the report items
     * @param filterText The text to filter report nodes by
     */
    setReportFilter(filterText: string): void {
        // Convert to lowercase for case-insensitive comparison
        this.reportFilterText = filterText.toLowerCase();
        // Update context to indicate report filter is active
        vscode.commands.executeCommand('setContext', 'appDnaReportFilterActive', !!this.reportFilterText);
        // Refresh the tree to apply the filter
        this.refresh();
    }

    /**
     * Clears the current report filter
     */
    clearReportFilter(): void {
        this.reportFilterText = "";
        // Update context to indicate report filter is not active
        vscode.commands.executeCommand('setContext', 'appDnaReportFilterActive', false);
        // Refresh the tree to show all reports
        this.refresh();
    }    /**
     * Checks if a report's label matches the current report filter
     * @param label The label to check against the report filter
     * @returns True if the label matches the report filter or no report filter is set
     */
    private applyReportFilter(label: string): boolean {
        // If no report filter is set, all reports match
        if (!this.reportFilterText) {
            return true;
        }
        
        // Case-insensitive match of report filter text within the label
        return label.toLowerCase().includes(this.reportFilterText);
    }

    /**
     * Sets a filter for only the data object items
     * @param filterText The text to filter data object nodes by
     */
    setDataObjectFilter(filterText: string): void {
        // Convert to lowercase for case-insensitive comparison
        this.dataObjectFilterText = filterText.toLowerCase();
        // Update context to indicate data object filter is active
        vscode.commands.executeCommand('setContext', 'appDnaDataObjectFilterActive', !!this.dataObjectFilterText);
        // Refresh the tree to apply the filter
        this.refresh();
    }

    /**
     * Clears the current data object filter
     */
    clearDataObjectFilter(): void {
        this.dataObjectFilterText = "";
        // Update context to indicate data object filter is not active
        vscode.commands.executeCommand('setContext', 'appDnaDataObjectFilterActive', false);
        // Refresh the tree to show all data objects
        this.refresh();
    }

    /**
     * Checks if a data object's label matches the current data object filter
     * @param label The label to check against the data object filter
     * @returns True if the label matches the data object filter or no data object filter is set
     */
    private applyDataObjectFilter(label: string): boolean {
        // If no data object filter is set, all data objects match
        if (!this.dataObjectFilterText) {
            return true;
        }
        
        // Case-insensitive match of data object filter text within the label
        return label.toLowerCase().includes(this.dataObjectFilterText);
    }

    /**
     * Sets a filter for only the form items
     * @param filterText The text to filter form nodes by
     */
    setFormFilter(filterText: string): void {
        // Convert to lowercase for case-insensitive comparison
        this.formFilterText = filterText.toLowerCase();
        // Update context to indicate form filter is active
        vscode.commands.executeCommand('setContext', 'appDnaFormFilterActive', !!this.formFilterText);
        // Refresh the tree to apply the filter
        this.refresh();
    }

    /**
     * Clears the current form filter
     */
    clearFormFilter(): void {
        this.formFilterText = "";
        // Update context to indicate form filter is not active
        vscode.commands.executeCommand('setContext', 'appDnaFormFilterActive', false);
        // Refresh the tree to show all forms
        this.refresh();
    }

    /**
     * Checks if a form's label matches the current form filter
     * @param label The label to check against the form filter
     * @returns True if the label matches the form filter or no form filter is set
     */
    private applyFormFilter(label: string): boolean {
        // If no form filter is set, all forms match
        if (!this.formFilterText) {
            return true;
        }
        
        // Case-insensitive match of form filter text within the label
        return label.toLowerCase().includes(this.formFilterText);
    }

    /**
     * Sets a filter for only the page init items
     * @param filterText The text to filter page init nodes by
     */
    setPageInitFilter(filterText: string): void {
        // Convert to lowercase for case-insensitive comparison
        this.pageInitFilterText = filterText.toLowerCase();
        // Update context to indicate page init filter is active
        vscode.commands.executeCommand('setContext', 'appDnaPageInitFilterActive', !!this.pageInitFilterText);
        // Refresh the tree to apply the filter
        this.refresh();
    }

    /**
     * Clears the current page init filter
     */
    clearPageInitFilter(): void {
        this.pageInitFilterText = "";
        // Update context to indicate page init filter is not active
        vscode.commands.executeCommand('setContext', 'appDnaPageInitFilterActive', false);
        // Refresh the tree to show all page init items
        this.refresh();
    }

    /**
     * Checks if a page init item's label matches the current page init filter
     * @param label The label to check against the page init filter
     * @returns True if the label matches the page init filter or no page init filter is set
     */
    private applyPageInitFilter(label: string): boolean {
        // If no page init filter is set, all page init items match
        if (!this.pageInitFilterText) {
            return true;
        }
        
        // Case-insensitive match of page init filter text within the label
        return label.toLowerCase().includes(this.pageInitFilterText);
    }

    /**
     * Sets a filter for only the workflows items
     * @param filterText The text to filter workflows nodes by
     */
    setWorkflowsFilter(filterText: string): void {
        // Convert to lowercase for case-insensitive comparison
        this.workflowsFilterText = filterText.toLowerCase();
        // Update context to indicate workflows filter is active
        vscode.commands.executeCommand('setContext', 'appDnaWorkflowsFilterActive', !!this.workflowsFilterText);
        // Refresh the tree to apply the filter
        this.refresh();
    }

    /**
     * Clears the current workflows filter
     */
    clearWorkflowsFilter(): void {
        this.workflowsFilterText = "";
        // Update context to indicate workflows filter is not active
        vscode.commands.executeCommand('setContext', 'appDnaWorkflowsFilterActive', false);
        // Refresh the tree to show all workflows items
        this.refresh();
    }

    /**
     * Checks if a workflows item's label matches the current workflows filter
     * @param label The label to check against the workflows filter
     * @returns True if the label matches the workflows filter or no workflows filter is set
     */
    private applyWorkflowsFilter(label: string): boolean {
        // If no workflows filter is set, all workflows items match
        if (!this.workflowsFilterText) {
            return true;
        }
        
        // Case-insensitive match of workflows filter text within the label
        return label.toLowerCase().includes(this.workflowsFilterText);
    }

    /**
     * Sets a filter for only the workflow tasks items
     * @param filterText The text to filter workflow tasks nodes by
     */
    setWorkflowTasksFilter(filterText: string): void {
        // Convert to lowercase for case-insensitive comparison
        this.workflowTasksFilterText = filterText.toLowerCase();
        // Update context to indicate workflow tasks filter is active
        vscode.commands.executeCommand('setContext', 'appDnaWorkflowTasksFilterActive', !!this.workflowTasksFilterText);
        // Refresh the tree to apply the filter
        this.refresh();
    }

    /**
     * Clears the current workflow tasks filter
     */
    clearWorkflowTasksFilter(): void {
        this.workflowTasksFilterText = "";
        // Update context to indicate workflow tasks filter is not active
        vscode.commands.executeCommand('setContext', 'appDnaWorkflowTasksFilterActive', false);
        // Refresh the tree to show all workflow tasks items
        this.refresh();
    }

    /**
     * Checks if a workflow tasks item's label matches the current workflow tasks filter
     * @param label The label to check against the workflow tasks filter
     * @returns True if the label matches the workflow tasks filter or no workflow tasks filter is set
     */
    private applyWorkflowTasksFilter(label: string): boolean {
        // If no workflow tasks filter is set, all workflow tasks items match
        if (!this.workflowTasksFilterText) {
            return true;
        }
        
        // Case-insensitive match of workflow tasks filter text within the label
        return label.toLowerCase().includes(this.workflowTasksFilterText);
    }

    /**
     * Sets the general filter to show only general items containing the specified text
     * @param filterText The text to filter general nodes by
     */
    setGeneralFilter(filterText: string): void {
        // Convert to lowercase for case-insensitive comparison
        this.generalFilterText = filterText.toLowerCase();
        // Update context to indicate general filter is active
        vscode.commands.executeCommand('setContext', 'appDnaGeneralFilterActive', !!this.generalFilterText);
        // Refresh the tree to apply the filter
        this.refresh();
    }

    /**
     * Clears the current general filter
     */
    clearGeneralFilter(): void {
        this.generalFilterText = "";
        // Update context to indicate general filter is not active
        vscode.commands.executeCommand('setContext', 'appDnaGeneralFilterActive', false);
        // Refresh the tree to show all general items
        this.refresh();
    }

    /**
     * Checks if a general item's label matches the current general filter
     * @param label The label to check against the general filter
     * @returns True if the label matches the general filter or no general filter is set
     */
    private applyGeneralFilter(label: string): boolean {
        // If no general filter is set, all general items match
        if (!this.generalFilterText) {
            return true;
        }
        
        // Case-insensitive match of general filter text within the label
        return label.toLowerCase().includes(this.generalFilterText);
    }

    /**
     * Selects a data object in the tree view by name
     * @param objectName The name of the object to select
     */
    async selectDataObject(objectName: string): Promise<void> {
        if (!this.treeView) {
            console.error('Tree view not available for selection');
            return;
        }

        try {
            // First, ensure the DATA OBJECTS section is expanded
            const dataObjectsItem = new JsonTreeItem(
                'DATA OBJECTS',
                vscode.TreeItemCollapsibleState.Collapsed,
                'dataObjects showHierarchy'
            );

            // Expand the DATA OBJECTS section
            await this.treeView.reveal(dataObjectsItem, { 
                select: false, 
                focus: false, 
                expand: 1 
            });

            // Small delay to allow expansion to complete
            await new Promise(resolve => setTimeout(resolve, 100));

            // Create the tree item for the specific object
            const objectItem = new JsonTreeItem(
                objectName,
                vscode.TreeItemCollapsibleState.None,
                'dataObjectItem'
            );

            // Select and reveal the object
            await this.treeView.reveal(objectItem, { 
                select: true, 
                focus: true, 
                expand: false 
            });

            console.log(`Successfully selected object '${objectName}' in tree view`);
        } catch (error) {
            console.error(`Failed to select object '${objectName}' in tree view:`, error);
        }
    }
}
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
                    'dataObjects showHierarchy showDataObjectFilter'
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
                
                const items = [projectItem, dataObjectsItem];
                
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
                }
                
                items.push(modelServicesItem);
                
                // Return tree items in order: PROJECT, DATA OBJECTS, [PAGES], MODEL SERVICES
                // (PAGES only shown when advanced properties are enabled)
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
                    
                    // Create User Stories item under PROJECT
                    const userStoriesItem = new JsonTreeItem(
                        'User Stories',
                        vscode.TreeItemCollapsibleState.None,
                        'projectUserStories'
                    );
                    
                    userStoriesItem.iconPath = new vscode.ThemeIcon('book');
                    userStoriesItem.tooltip = "Manage user stories";
                    userStoriesItem.command = {
                        command: 'appdna.showUserStories',
                        title: 'Show User Stories',
                        arguments: []
                    };
                    items.push(userStoriesItem);
                    
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
                    
                    return Promise.resolve(
                        filteredObjects.map((obj: any, index: number) =>
                            new JsonTreeItem(
                                obj.name || `Object ${allObjects.indexOf(obj) + 1}`,
                                vscode.TreeItemCollapsibleState.None,
                                'dataObjectItem'
                            )
                        )
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
                    return Promise.resolve(
                        objects.map((obj: any, index: number) =>
                            new JsonTreeItem(
                                obj.name || `Object ${index + 1}`,
                                vscode.TreeItemCollapsibleState.None,
                                'dataObjectItem'
                            )
                        )
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
                    
                    return Promise.resolve(
                        filteredReports.map((report: any, index: number) =>
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
                    
                    return Promise.resolve(
                        filteredForms.map((workflow: any, index: number) => {
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
          // Root-level items (PROJECT, DATA OBJECTS, REPORTS, MODEL SERVICES) have no parent
        if (['PROJECT', 'DATA OBJECTS', 'REPORTS', 'MODEL SERVICES'].includes(element.label)) {
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
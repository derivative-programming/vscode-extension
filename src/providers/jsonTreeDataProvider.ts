// SEARCH_TAG: JSON tree data provider for VS Code extension
// Provides tree data for the AppDNA JSON structure.

import * as vscode from 'vscode';
import * as fs from 'fs';
import { JsonTreeItem, AppDNAData, TreeDataChange } from '../models/types';
import { ModelService } from '../services/modelService';
import { AuthService } from '../services/authService';
import { MCPServer } from '../mcp/server';
import { MCPHttpServer } from '../mcp/httpServer';

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
    private originalTitle?: string;
    // Current filter text for tree view items
    private filterText: string = "";
    // Current filter text for report items only
    private reportFilterText: string = "";
      constructor(
        private readonly appDNAFilePath: string | null,
        private readonly modelService: ModelService
    ) { 
        this.authService = AuthService.getInstance();
        this.mcpServer = MCPServer.getInstance();
        this.mcpHttpServer = MCPHttpServer.getInstance();
        
        // Initialize context values
        vscode.commands.executeCommand('setContext', 'appDnaReportFilterActive', false);
        
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
                projectItem.tooltip = "Project settings and configuration";
                
                const dataObjectsItem = new JsonTreeItem(
                    'DATA OBJECTS',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'dataObjects showHierarchy'
                );
                
                // Set a database icon for the DATA OBJECTS item
                dataObjectsItem.iconPath = new vscode.ThemeIcon('database');
                
                // Set tooltip for DATA OBJECTS
                dataObjectsItem.tooltip = "Data Objects (click to expand, right-click for options)";                // Create MODEL SERVICES item with appropriate icon based on login status
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
                
                // Create REPORTS as a top-level item
                const reportsItem = new JsonTreeItem(
                    'REPORTS',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'reports showFilter'
                );
                reportsItem.iconPath = new vscode.ThemeIcon('book');
                reportsItem.tooltip = "Model reports from all objects (click to expand, right-click for options)";
                
                // Return tree items in order: PROJECT, DATA OBJECTS, REPORTS, MODEL SERVICES
                return Promise.resolve([projectItem, dataObjectsItem, reportsItem, modelServicesItem]);
            } else {
                // File doesn't exist, show empty tree
                return Promise.resolve([]);
            }
        }
          // Handle PROJECT children
        if (element?.contextValue === 'project' && fileExists) {
            try {
                // Create Settings item under PROJECT
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
                };                // Create MCP Server item with status indicator
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
                    };                  }                // Create MCP HTTP Server item with status indicator
                // Now that we fixed the TypeScript error, we can use the proper method
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
                
                return Promise.resolve([settingsItem, lexiconItem, userStoriesItem, mcpServerItem, mcpHttpServerItem]);
            } catch (error) {
                console.error('Error reading project settings:', error);
                return Promise.resolve([]);
            }
        }
          // Handle child elements
        if (element?.contextValue === 'dataObjects' && fileExists) {
            try {
                if (modelLoaded) {
                    // Use ModelService to get all objects
                    const allObjects = this.modelService.getAllObjects();
                    
                    // Apply filtering to objects
                    const filteredObjects = allObjects.filter(obj => 
                        this.applyFilter(obj.name || `Object ${allObjects.indexOf(obj) + 1}`)
                    );
                    
                    // Check if we need to expand this when filter is active
                    const collapsibleState = this.filterText
                        ? vscode.TreeItemCollapsibleState.Expanded
                        : vscode.TreeItemCollapsibleState.Collapsed;
                    
                    // If filtering is active and no results found, show message
                    if (this.filterText && filteredObjects.length === 0) {
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
            }
        }
          // Handle REPORTS as a top-level item
        if (element?.contextValue === 'reports' && fileExists) {
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
                }
                
                return Promise.resolve(items);
            } catch (error) {
                console.error('Error loading model services:', error);
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
                'reports showFilter'
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
    }

    /**
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
}
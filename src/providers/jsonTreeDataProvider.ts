// SEARCH_TAG: JSON tree data provider for VS Code extension
// Provides tree data for the AppDNA JSON structure.

import * as vscode from 'vscode';
import * as fs from 'fs';
import { JsonTreeItem, AppDNAData, TreeDataChange } from '../models/types';
import { ModelService } from '../services/modelService';
import { AuthService } from '../services/authService';

/**
 * TreeDataProvider for managing JSON structure in the AppDNA extension
 * Uses ModelService to access and manipulate the model data
 */
export class JsonTreeDataProvider implements vscode.TreeDataProvider<JsonTreeItem> {

    private readonly _onDidChangeTreeData: vscode.EventEmitter<TreeDataChange> = new vscode.EventEmitter<TreeDataChange>();
    readonly onDidChangeTreeData: vscode.Event<TreeDataChange> = this._onDidChangeTreeData.event;

    private readonly jsonStructure: any = {
        "root": {
            "namespace": [],
            "object": []
        }
    };
    
    // Auth service instance to manage login state
    private authService: AuthService;

    constructor(
        private readonly appDNAFilePath: string | null,
        private readonly modelService: ModelService
    ) { 
        this.authService = AuthService.getInstance();
    }

    getTreeItem(element: JsonTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: JsonTreeItem): Thenable<JsonTreeItem[]> {
        // Check if the file exists and a model is loaded
        const fileExists = this.appDNAFilePath && fs.existsSync(this.appDNAFilePath);
        const modelLoaded = this.modelService.isFileLoaded();

        // If no element is provided (root level request)
        if (!element) {
            if (fileExists) {
                // Create tree items for root level
                const dataObjectsItem = new JsonTreeItem(
                    'DATA OBJECTS',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'dataObjects'
                );
                
                // Set a database icon for the DATA OBJECTS item
                dataObjectsItem.iconPath = new vscode.ThemeIcon('database');
                
                // Create MODEL SERVICES item with appropriate icon based on login status
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
                } else {
                    // Locked icon for logged-out state
                    modelServicesItem.iconPath = new vscode.ThemeIcon('lock');
                }
                
                // Set tooltip to show login status
                modelServicesItem.tooltip = isLoggedIn ? 
                    "Connected to Model Services API" : 
                    "Authentication required to access Model Services";
                
                // Return both tree items
                return Promise.resolve([dataObjectsItem, modelServicesItem]);
            } else {
                // File doesn't exist, show empty tree
                return Promise.resolve([]);
            }
        }
        
        // Handle child elements
        if (element?.contextValue === 'dataObjects' && fileExists) {
            try {
                if (modelLoaded) {
                    // Use ModelService to get all objects
                    const allObjects = this.modelService.getAllObjects();
                    
                    return Promise.resolve(
                        allObjects.map((obj: any, index: number) =>
                            new JsonTreeItem(
                                obj.name || `Object ${index + 1}`,
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
        
        // Handle MODEL SERVICES children - show login/logout option and services when logged in
        if (element?.contextValue === 'modelServices' && fileExists) {
            try {
                const items: JsonTreeItem[] = [];
                const isLoggedIn = this.authService.isLoggedIn();
                
                // First item is always Login/Logout based on current state
                if (isLoggedIn) {
                    // When logged in, add service items first
                    const serviceItems = [
                        { name: "Model Validation", description: "Validate models against best practices" }
                        // Removed Code Generation API
                    ];
                    serviceItems.forEach(service => {
                        const serviceItem = new JsonTreeItem(
                            service.name,
                            vscode.TreeItemCollapsibleState.None,
                            'modelServiceItem'
                        );
                        serviceItem.tooltip = service.description;
                        serviceItem.iconPath = new vscode.ThemeIcon('cloud');
                        serviceItem.command = {
                            command: 'appdna.modelValidation',
                            title: 'Show Model Validation Requests',
                            arguments: []
                        };
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
                        "Login to AppDNA Model Services",
                        vscode.TreeItemCollapsibleState.None,
                        'modelServiceLogin'
                    );
                    
                    loginItem.iconPath = new vscode.ThemeIcon('sign-in');
                    loginItem.command = {
                        command: 'appdna.loginModelServices',
                        title: 'Login to AppDNA Model Services',
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
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
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
}
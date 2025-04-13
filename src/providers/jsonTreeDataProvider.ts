import * as vscode from 'vscode';
import * as fs from 'fs';
import { JsonTreeItem, AppDNAData, TreeDataChange } from '../models/types';
import { ModelService } from '../services/modelService';

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
            "object": [],
            "lookupItem": []
        }
    };

    constructor(
        private readonly appDNAFilePath: string | null,
        private readonly modelService: ModelService
    ) { }

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
                // File exists, show 'Data Objects'
                return Promise.resolve([
                    new JsonTreeItem('Data Objects', vscode.TreeItemCollapsibleState.Collapsed, 'dataObjects')
                ]);
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
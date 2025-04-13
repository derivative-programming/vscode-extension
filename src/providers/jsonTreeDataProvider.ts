import * as vscode from 'vscode';
import * as fs from 'fs';
import { JsonTreeItem, AppDNAData, TreeDataChange } from '../models/types';

/**
 * TreeDataProvider for managing JSON structure in the AppDNA extension
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

    constructor(private readonly appDNAFilePath: string | null) { }

    getTreeItem(element: JsonTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: JsonTreeItem): Thenable<JsonTreeItem[]> {
        // Check if the file exists
        const fileExists = this.appDNAFilePath && fs.existsSync(this.appDNAFilePath);

        // If no element is provided (root level request)
        if (!element) {
            if (fileExists) {
                // File exists, show 'Data Objects'
                return Promise.resolve([
                    new JsonTreeItem('Data Objects', vscode.TreeItemCollapsibleState.Collapsed, 'dataObjects')
                ]);
            } else {
                // File doesn't exist, show empty tree instead of 'Add File'
                return Promise.resolve([]);
            }
        }
        
        // Handle child elements
        if (element?.contextValue === 'dataObjects' && fileExists) {
            try {
                const fileContent = fs.readFileSync(this.appDNAFilePath!, 'utf-8');
                const jsonData = JSON.parse(fileContent);
                let objects: any[] = [];
                if (jsonData.root.namespace && Array.isArray(jsonData.root.namespace)) {
                    jsonData.root.namespace.forEach((ns: any) => {
                        if (!ns.object) {
                            // Skip processing this namespace if 'object' is not defined
                            return;
                        }
                        if (Array.isArray(ns.object)) {
                            objects.push(...ns.object);
                        }
                    });
                }
                return Promise.resolve(
                    objects.map((obj: any, index: number) =>
                        new JsonTreeItem(obj.name || `Object ${index + 1}`,
                                          vscode.TreeItemCollapsibleState.None,
                                          'dataObjectItem')
                    )
                );
            } catch (error) {
                console.error('Error reading app-dna.json:', error);
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
            // Read the current file content
            const fileContent = fs.readFileSync(this.appDNAFilePath, 'utf-8');
            const jsonData = JSON.parse(fileContent) as AppDNAData;

            // Ensure root and namespace structure exists
            if (!jsonData.root) {
                jsonData.root = { namespace: [] };
            }
            if (!Array.isArray(jsonData.root.namespace)) {
                jsonData.root.namespace = [];
            }

            // Find or create the target namespace
            let targetNs = jsonData.root.namespace.find(ns => ns.name === namespace);
            if (!targetNs) {
                targetNs = { name: namespace, object: [] };
                jsonData.root.namespace.push(targetNs);
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

            // Write the updated content back to the file
            fs.writeFileSync(this.appDNAFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');
            
            // Refresh the view
            this.refresh();
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to add object: ${errorMessage}`);
        }
    }

    reset(): void {
        this.jsonStructure.root.object = [];
        this.refresh();
    }

    loadProject(projectData: any): void {
        this.jsonStructure.root.object = projectData.root.object;
        this.refresh();
    }

    getProject(): any {
        return this.jsonStructure;
    }
}
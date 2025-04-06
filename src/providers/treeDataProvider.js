"use strict";
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * Tree data provider for displaying JSON structure in a VS Code tree view
 */
class JsonTreeDataProvider {
    /**
     * Creates a new JsonTreeDataProvider
     * @param {string} appDNAFilePath Path to the app-dna.json file
     */
    constructor(appDNAFilePath) {
        this.appDNAFilePath = appDNAFilePath;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.jsonStructure = {
            "root": {
                "namespace": [],
                "object": [],
                "lookupItem": []
            }
        };
    }

    /**
     * Gets the tree item for a given element
     * @param {JsonTreeItem} element The tree item to get
     * @returns {vscode.TreeItem} The tree item
     */
    getTreeItem(element) {
        return element;
    }

    /**
     * Gets the children of a given element in the tree view
     * @param {JsonTreeItem} element The parent element
     * @returns {Promise<JsonTreeItem[]>} The child elements
     */
    getChildren(element) {
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
                // File doesn't exist, show empty tree
                return Promise.resolve([]);
            }
        }

        // Handle child elements
        if (element?.contextValue === 'dataObjects' && fileExists) {
            try {
                const fileContent = fs.readFileSync(this.appDNAFilePath, 'utf-8');
                const jsonData = JSON.parse(fileContent);
                let objects = [];
                if (jsonData.root.namespace && Array.isArray(jsonData.root.namespace)) {
                    jsonData.root.namespace.forEach((ns) => {
                        if (Array.isArray(ns.object)) {
                            objects.push(...ns.object);
                        }
                    });
                }
                return Promise.resolve(objects.map((obj, index) => 
                    new JsonTreeItem(obj.name || `Object ${index + 1}`, 
                                    vscode.TreeItemCollapsibleState.None, 
                                    'dataObjectItem')));
            } catch (error) {
                console.error('Error reading app-dna.json:', error);
                return Promise.resolve([]);
            }
        }
        return Promise.resolve([]);
    }

    /**
     * Refreshes the tree view
     */
    refresh() {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Adds a new object to the app-dna.json file
     * @param {string} name Name of the object to add
     * @param {string} namespace Namespace to add the object to
     */
    addObject(name, namespace = "Default") {
        if (!this.appDNAFilePath || !fs.existsSync(this.appDNAFilePath)) {
            vscode.window.showErrorMessage('AppDNA file not found. Cannot add object.');
            return;
        }
        try {
            // Read the current file content
            const fileContent = fs.readFileSync(this.appDNAFilePath, 'utf-8');
            const jsonData = JSON.parse(fileContent);
            
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
            const newObj = {
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

    /**
     * Resets the tree view
     */
    reset() {
        this.jsonStructure.root.object = [];
        this.refresh();
    }

    /**
     * Loads project data into the tree view
     * @param {Object} projectData The project data to load
     */
    loadProject(projectData) {
        this.jsonStructure.root.object = projectData.root.object;
        this.refresh();
    }

    /**
     * Gets the current project data
     * @returns {Object} The project data
     */
    getProject() {
        return this.jsonStructure;
    }
}

/**
 * Tree item for the JSON tree data provider
 */
class JsonTreeItem extends vscode.TreeItem {
    /**
     * Creates a new JsonTreeItem
     * @param {string} label Label for the tree item
     * @param {vscode.TreeItemCollapsibleState} collapsibleState Collapsible state for the tree item
     * @param {string} contextValue Context value for the tree item
     */
    constructor(label, collapsibleState, contextValue) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.contextValue = contextValue;
        
        // If the item represents a data object, attach a command to show details.
        if (contextValue === 'dataObjectItem') {
            this.command = {
                title: 'Show Details',
                command: 'appdna.showDetails',
                arguments: [this]
            };
        }
    }
}

/**
 * Updates the file existence context in the VS Code window
 * @param {string} appDNAFilePath Path to the app-dna.json file
 * @returns {boolean} Whether the file exists
 */
function updateFileExistsContext(appDNAFilePath) {
    const fileExists = appDNAFilePath && fs.existsSync(appDNAFilePath);
    vscode.commands.executeCommand('setContext', 'appDnaFileExists', fileExists);
    return fileExists;
}

module.exports = {
    JsonTreeDataProvider,
    JsonTreeItem,
    updateFileExistsContext
};
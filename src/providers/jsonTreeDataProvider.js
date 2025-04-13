"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonTreeDataProvider = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const types_1 = require("../models/types");
/**
 * TreeDataProvider for managing JSON structure in the AppDNA extension
 */
class JsonTreeDataProvider {
    appDNAFilePath;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    jsonStructure = {
        "root": {
            "namespace": [],
            "object": [],
            "lookupItem": []
        }
    };
    constructor(appDNAFilePath) {
        this.appDNAFilePath = appDNAFilePath;
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        // Check if the file exists
        const fileExists = this.appDNAFilePath && fs.existsSync(this.appDNAFilePath);
        // If no element is provided (root level request)
        if (!element) {
            if (fileExists) {
                // File exists, show 'Data Objects'
                return Promise.resolve([
                    new types_1.JsonTreeItem('Data Objects', vscode.TreeItemCollapsibleState.Collapsed, 'dataObjects')
                ]);
            }
            else {
                // File doesn't exist, show empty tree instead of 'Add File'
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
                        if (!ns.object) {
                            // Skip processing this namespace if 'object' is not defined
                            return;
                        }
                        if (Array.isArray(ns.object)) {
                            objects.push(...ns.object);
                        }
                    });
                }
                return Promise.resolve(objects.map((obj, index) => new types_1.JsonTreeItem(obj.name || `Object ${index + 1}`, vscode.TreeItemCollapsibleState.None, 'dataObjectItem')));
            }
            catch (error) {
                console.error('Error reading app-dna.json:', error);
                return Promise.resolve([]);
            }
        }
        return Promise.resolve([]);
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to add object: ${errorMessage}`);
        }
    }
    reset() {
        this.jsonStructure.root.object = [];
        this.refresh();
    }
    loadProject(projectData) {
        this.jsonStructure.root.object = projectData.root.object;
        this.refresh();
    }
    getProject() {
        return this.jsonStructure;
    }
}
exports.JsonTreeDataProvider = JsonTreeDataProvider;
//# sourceMappingURL=jsonTreeDataProvider.js.map
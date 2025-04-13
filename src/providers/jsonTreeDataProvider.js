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
 * Uses ModelService to access and manipulate the model data
 */
class JsonTreeDataProvider {
    appDNAFilePath;
    modelService;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    jsonStructure = {
        "root": {
            "namespace": [],
            "object": [],
            "lookupItem": []
        }
    };
    constructor(appDNAFilePath, modelService) {
        this.appDNAFilePath = appDNAFilePath;
        this.modelService = modelService;
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        // Check if the file exists and a model is loaded
        const fileExists = this.appDNAFilePath && fs.existsSync(this.appDNAFilePath);
        const modelLoaded = this.modelService.isFileLoaded();
        // If no element is provided (root level request)
        if (!element) {
            if (fileExists) {
                // File exists, show 'Data Objects'
                return Promise.resolve([
                    new types_1.JsonTreeItem('Data Objects', vscode.TreeItemCollapsibleState.Collapsed, 'dataObjects')
                ]);
            }
            else {
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
                    return Promise.resolve(allObjects.map((obj, index) => new types_1.JsonTreeItem(obj.name || `Object ${index + 1}`, vscode.TreeItemCollapsibleState.None, 'dataObjectItem')));
                }
                else {
                    // Fallback to direct file reading if model isn't loaded
                    console.log("Model not loaded, reading from file directly");
                    const fileContent = fs.readFileSync(this.appDNAFilePath, 'utf-8');
                    const jsonData = JSON.parse(fileContent);
                    let objects = [];
                    if (jsonData.root.namespace && Array.isArray(jsonData.root.namespace)) {
                        jsonData.root.namespace.forEach((ns) => {
                            if (!ns.object) {
                                return;
                            }
                            if (Array.isArray(ns.object)) {
                                objects.push(...ns.object);
                            }
                        });
                    }
                    return Promise.resolve(objects.map((obj, index) => new types_1.JsonTreeItem(obj.name || `Object ${index + 1}`, vscode.TreeItemCollapsibleState.None, 'dataObjectItem')));
                }
            }
            catch (error) {
                console.error('Error reading objects:', error);
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
            // Get the current model or read from file if model is not loaded
            let model;
            if (this.modelService.isFileLoaded()) {
                model = this.modelService.getCurrentModel();
                if (!model) {
                    throw new Error("Failed to get current model");
                }
            }
            else {
                // Read the current file content as fallback
                const fileContent = fs.readFileSync(this.appDNAFilePath, 'utf-8');
                model = JSON.parse(fileContent);
            }
            // Ensure root and namespace structure exists
            if (!model.root) {
                model.root = { namespace: [] };
            }
            if (!Array.isArray(model.root.namespace)) {
                model.root.namespace = [];
            }
            // Find or create the target namespace
            let targetNs = model.root.namespace.find((ns) => ns.name === namespace);
            if (!targetNs) {
                targetNs = { name: namespace, object: [] };
                model.root.namespace.push(targetNs);
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
            // Save the updated model
            if (this.modelService.isFileLoaded()) {
                this.modelService.saveToFile(model);
            }
            else {
                // Write directly to file as fallback
                fs.writeFileSync(this.appDNAFilePath, JSON.stringify(model, null, 2), 'utf-8');
                // Load the model after writing
                this.modelService.loadFile(this.appDNAFilePath);
            }
            // Refresh the view
            this.refresh();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to add object: ${errorMessage}`);
        }
    }
    reset() {
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
    loadProject(projectData) {
        if (this.modelService.isFileLoaded()) {
            this.modelService.saveToFile(projectData);
        }
        else {
            this.jsonStructure.root.object = projectData.root.object;
        }
        this.refresh();
    }
    getProject() {
        if (this.modelService.isFileLoaded()) {
            return this.modelService.getCurrentModel();
        }
        return this.jsonStructure;
    }
}
exports.JsonTreeDataProvider = JsonTreeDataProvider;
//# sourceMappingURL=jsonTreeDataProvider.js.map
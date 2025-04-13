"use strict";
/**
 * ModelService - Provides high-level operations for loading and saving model data
 * This service acts as a facade over the ModelDataProvider to simplify working with App DNA files
 */
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
exports.ModelService = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const ModelDataProvider_1 = require("../data/models/ModelDataProvider");
/**
 * Service responsible for loading, validating, and saving App DNA model data
 */
class ModelService {
    static instance;
    dataProvider;
    currentFilePath = null;
    /**
     * Private constructor to enforce singleton pattern
     */
    constructor() {
        this.dataProvider = ModelDataProvider_1.ModelDataProvider.getInstance();
    }
    /**
     * Get the singleton instance of ModelService
     */
    static getInstance() {
        if (!ModelService.instance) {
            ModelService.instance = new ModelService();
        }
        return ModelService.instance;
    }
    /**
     * Load a model from a file
     * @param filePath Path to the App DNA JSON file to load
     * @returns Promise resolving to the loaded RootModel
     * @throws Error if the file cannot be loaded or validated
     */
    async loadFile(filePath) {
        try {
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }
            // Load and validate the model
            const rootModel = await this.dataProvider.loadRootModel(filePath);
            // Store the current file path for future save operations
            this.currentFilePath = filePath;
            // Notify that file was loaded
            vscode.window.showInformationMessage(`Successfully loaded ${path.basename(filePath)}`);
            return rootModel;
        }
        catch (error) {
            // Log and re-throw the error
            console.error("Error loading file:", error);
            vscode.window.showErrorMessage(`Failed to load file: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Save a model to a file
     * @param model The RootModel to save
     * @param filePath Optional path to save to. If not provided, saves to the previously loaded file path
     * @returns Promise resolving to the saved file path
     * @throws Error if the model cannot be saved
     */
    async saveToFile(model, filePath) {
        try {
            // If no file path is provided, use the current file path
            const targetPath = filePath || this.currentFilePath;
            // Ensure we have a file path to save to
            if (!targetPath) {
                throw new Error("No file path specified for save operation");
            }
            // Save the model
            await this.dataProvider.saveRootModel(targetPath, model);
            // Update the current file path
            this.currentFilePath = targetPath;
            // Notify that file was saved
            vscode.window.showInformationMessage(`Successfully saved to ${path.basename(targetPath)}`);
            return targetPath;
        }
        catch (error) {
            // Log and re-throw the error
            console.error("Error saving file:", error);
            vscode.window.showErrorMessage(`Failed to save file: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Save a model to a new file
     * @param model The RootModel to save
     * @returns Promise resolving to the saved file path
     * @throws Error if the model cannot be saved
     */
    async saveToNewFile(model) {
        try {
            // Show save dialog to get the new file path
            const uri = await vscode.window.showSaveDialog({
                defaultUri: this.currentFilePath ? vscode.Uri.file(this.currentFilePath) : undefined,
                filters: {
                    "JSON Files": ["json"],
                    "All Files": ["*"]
                },
                title: "Save App DNA File"
            });
            // Return if dialog was cancelled
            if (!uri) {
                return undefined;
            }
            const filePath = uri.fsPath;
            // Save the model to the new path
            return await this.saveToFile(model, filePath);
        }
        catch (error) {
            // Log and re-throw the error
            console.error("Error saving to new file:", error);
            vscode.window.showErrorMessage(`Failed to save to new file: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Create a backup of a file before making changes
     * @param filePath Path to the file to back up
     * @returns Promise resolving to the backup file path or undefined if no backup was created
     */
    async createBackup(filePath) {
        try {
            // Ensure file exists
            if (!fs.existsSync(filePath)) {
                return undefined;
            }
            // Create backups directory if it doesn't exist
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                return undefined;
            }
            const backupDir = path.join(workspaceFolders[0].uri.fsPath, "backups");
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            // Generate backup file name with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const fileName = path.basename(filePath);
            const backupPath = path.join(backupDir, `${fileName}.${timestamp}.bak`);
            // Copy the file
            fs.copyFileSync(filePath, backupPath);
            console.log(`Created backup: ${backupPath}`);
            return backupPath;
        }
        catch (error) {
            console.error("Error creating backup:", error);
            return undefined;
        }
    }
    /**
     * Get the current file path
     * @returns The current file path or null if no file is loaded
     */
    getCurrentFilePath() {
        return this.currentFilePath;
    }
    /**
     * Check if a file is currently loaded
     * @returns True if a file is loaded, false otherwise
     */
    isFileLoaded() {
        return this.currentFilePath !== null;
    }
    /**
     * Get the currently loaded model
     * @returns The currently loaded RootModel or null if no model is loaded
     */
    getCurrentModel() {
        return this.dataProvider.getRootModel();
    }
    /**
     * Get all objects from all namespaces in the model
     * @returns Array containing references to the actual object instances from all namespaces or empty array if no model is loaded
     */
    getAllObjects() {
        const rootModel = this.getCurrentModel();
        if (!rootModel || !rootModel.namespace) {
            return [];
        }
        // Flatten the arrays of objects from all namespaces
        const allObjects = [];
        for (const namespace of rootModel.namespace) {
            if (namespace.object && Array.isArray(namespace.object)) {
                allObjects.push(...namespace.object);
            }
        }
        return allObjects;
    }
    /**
     * Get all reports from all objects in the model
     * @returns Array containing references to the actual report instances from all objects or empty array if no model is loaded
     */
    getAllReports() {
        // Get all objects from all namespaces
        const allObjects = this.getAllObjects();
        if (!allObjects || allObjects.length === 0) {
            return [];
        }
        // Flatten the arrays of reports from all objects
        const allReports = [];
        for (const object of allObjects) {
            if (object.report && Array.isArray(object.report)) {
                allReports.push(...object.report);
            }
        }
        return allReports;
    }
    /**
     * Clear the cached model data
     */
    clearCache() {
        this.dataProvider.clearCache();
        this.currentFilePath = null;
    }
}
exports.ModelService = ModelService;
//# sourceMappingURL=modelService.js.map
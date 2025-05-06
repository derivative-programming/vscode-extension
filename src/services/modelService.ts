// SEARCH_TAG: model service for VS Code extension
// Handles model-related logic and data operations.

/**
 * ModelService - Provides high-level operations for loading and saving model data
 * This service acts as a facade over the ModelDataProvider to simplify working with App DNA files
 */

import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { ModelDataProvider } from "../data/models/ModelDataProvider";
import { RootModel } from "../data/models/rootModel";
import { ObjectSchema } from "../data/interfaces";
import { ReportSchema } from "../data/interfaces/report.interface";

/**
 * Service responsible for loading, validating, and saving App DNA model data
 */
export class ModelService {
    private static instance: ModelService;
    private dataProvider: ModelDataProvider;
    private currentFilePath: string | null = null;

    /**
     * Private constructor to enforce singleton pattern
     */
    private constructor() {
        this.dataProvider = ModelDataProvider.getInstance();
    }

    /**
     * Get the singleton instance of ModelService
     */
    public static getInstance(): ModelService {
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
    public async loadFile(filePath: string): Promise<RootModel> {
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
        } catch (error) {
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
    public async saveToFile(model: RootModel, filePath?: string): Promise<string> {
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
        } catch (error) {
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
    public async saveToNewFile(model: RootModel): Promise<string | undefined> {
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
        } catch (error) {
            // Log and re-throw the error
            console.error("Error saving to new file:", error);
            vscode.window.showErrorMessage(`Failed to save to new file: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Get the current file path
     * @returns The current file path or null if no file is loaded
     */
    public getCurrentFilePath(): string | null {
        return this.currentFilePath;
    }

    /**
     * Check if a file is currently loaded
     * @returns True if a file is loaded, false otherwise
     */
    public isFileLoaded(): boolean {
        return this.currentFilePath !== null;
    }

    /**
     * Get the currently loaded model
     * @returns The currently loaded RootModel or null if no model is loaded
     */
    public getCurrentModel(): RootModel | null {
        return this.dataProvider.getRootModel();
    }

    /**
     * Get all objects from all namespaces in the model
     * @returns Array containing references to the actual object instances from all namespaces or empty array if no model is loaded
     */
    public getAllObjects(): ObjectSchema[] {
        const rootModel = this.getCurrentModel();
        if (!rootModel || !rootModel.namespace) {
            return [];
        }

        // Flatten the arrays of objects from all namespaces
        const allObjects: ObjectSchema[] = [];
        
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
    public getAllReports(): ReportSchema[] {
        // Get all objects from all namespaces
        const allObjects = this.getAllObjects();
        if (!allObjects || allObjects.length === 0) {
            return [];
        }

        // Flatten the arrays of reports from all objects
        const allReports: ReportSchema[] = [];
        
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
    public clearCache(): void {
        this.dataProvider.clearCache();
        this.currentFilePath = null;
    }

    /**
     * Update the current model from a JSON object
     * This method provides a way to modify the model from a JSON representation
     * @param modelJson The JSON object containing the model data (with a 'root' property)
     * @returns Promise resolving to the updated RootModel
     * @throws Error if the model cannot be updated
     */
    public async updateModelFromJson(modelJson: any): Promise<RootModel> {
        try {
            // Validate we have a root property
            if (!modelJson || !modelJson.root) {
                throw new Error("Invalid model JSON structure: missing root property");
            }
            
            // Get the current model path
            const currentPath = this.currentFilePath;
            if (!currentPath) {
                throw new Error("No model file is currently loaded");
            }
            
            // Save the JSON data to a temporary file
            const tempPath = `${currentPath}.temp`;
            fs.writeFileSync(tempPath, JSON.stringify(modelJson, null, 2), 'utf8');
            
            try {
                // Load this temp file to create a proper model instance
                const updatedModel = await this.dataProvider.loadRootModel(tempPath);
                
                // Save the model back to the original file
                await this.dataProvider.saveRootModel(currentPath, updatedModel);
                
                // Update the cached model
                this.currentFilePath = currentPath;
                
                // Clean up the temp file
                if (fs.existsSync(tempPath)) {
                    fs.unlinkSync(tempPath);
                }
                
                // Log success
                console.log(`[ModelService] Successfully updated model from JSON and saved to ${path.basename(currentPath)}`);
                
                return updatedModel;
            } finally {
                // Ensure temp file is cleaned up even if an error occurs
                if (fs.existsSync(tempPath)) {
                    fs.unlinkSync(tempPath);
                }
            }
        } catch (error) {
            // Log and re-throw the error
            console.error("Error updating model from JSON:", error);
            vscode.window.showErrorMessage(`Failed to update model: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
}
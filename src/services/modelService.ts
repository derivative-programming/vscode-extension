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
import { ObjectWorkflowSchema } from "../data/interfaces/objectWorkflow.interface";

/**
 * Service responsible for loading, validating, and saving App DNA model data
 */
export class ModelService {
    private static instance: ModelService;
    private dataProvider: ModelDataProvider;
    private currentFilePath: string | null = null;
    private hasUnsavedChanges: boolean = false;

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
            
            // Reset unsaved changes flag
            this.hasUnsavedChanges = false;
            
            // don't Notify that file was loaded
            // vscode.window.showInformationMessage(`Successfully loaded ${path.basename(filePath)}`);
            
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
            
            // Reset unsaved changes flag after successful save
            this.hasUnsavedChanges = false;
            
            // don't Notify that file was saved
            // vscode.window.showInformationMessage(`Successfully saved to ${path.basename(targetPath)}`);
            
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
     * Get all forms (objectWorkflow with isPage=true) from all objects across all namespaces
     * @returns Array of all form objects
     */
    public getAllForms(): any[] {
        // Get all objects from all namespaces
        const allObjects = this.getAllObjects();
        if (!allObjects || allObjects.length === 0) {
            return [];
        }

        // Flatten the arrays of forms from all objects
        const allForms: any[] = [];
        
        for (const object of allObjects) {
            if (object.objectWorkflow && Array.isArray(object.objectWorkflow)) {
                // Filter for forms (objectWorkflow with isPage=true)
                const forms = object.objectWorkflow.filter((workflow: any) => workflow.isPage === "true");
                allForms.push(...forms);
            }
        }
        
        return allForms;
    }

    /**
     * Clear the cached model data
     */
    public clearCache(): void {
        this.dataProvider.clearCache();
        this.currentFilePath = null;
        this.hasUnsavedChanges = false;
    }

    /**
     * Update the current model from a JSON object
     * This method provides a way to modify the model from a JSON representation
     * @param modelJson The JSON object containing the model data (with a 'root' property)
     * @returns Promise resolving to the updated RootModel
     * @throws Error if the model cannot be updated
     */    public async updateModelFromJson(modelJson: any): Promise<RootModel> {
        console.log("[ModelService] updateModelFromJson called");
        try {
            // Validate we have a root property
            if (!modelJson) {
                console.error("[ModelService] modelJson is null or undefined");
                throw new Error("Invalid model JSON structure: missing model data");
            }
            
            console.log("[ModelService] Model JSON keys:", Object.keys(modelJson));
            
            if (!modelJson.root) {
                console.error("[ModelService] Missing root property in model JSON");
                throw new Error("Invalid model JSON structure: missing root property");
            }
            
            // Get the current model path
            const currentPath = this.currentFilePath;
            console.log("[ModelService] Current file path:", currentPath);
            
            if (!currentPath) {
                console.error("[ModelService] No current file path available");
                throw new Error("No model file is currently loaded");
            }
            
            // Save the JSON data to a temporary file
            const tempPath = `${currentPath}.temp`;
            console.log("[ModelService] Creating temp file:", tempPath);
            
            try {
                // Pretty print the JSON for better debugging
                const jsonString = JSON.stringify(modelJson, null, 2);
                console.log("[ModelService] JSON string length:", jsonString.length);
                fs.writeFileSync(tempPath, jsonString, 'utf8');
                console.log("[ModelService] Temp file written successfully");
            } catch (writeError) {
                console.error("[ModelService] Error writing temp file:", writeError);
                throw new Error(`Failed to write temp file: ${writeError.message}`);
            }
            
            try {
                // Load this temp file to create a proper model instance
                console.log("[ModelService] Loading model from temp file");
                const updatedModel = await this.dataProvider.loadRootModel(tempPath);
                console.log("[ModelService] Model loaded from temp file successfully");
                  // Save the model back to the original file
                console.log("[ModelService] Saving model to original file:", currentPath);
                await this.dataProvider.saveRootModel(currentPath, updatedModel);
                console.log("[ModelService] Model saved to original file successfully");
                
                // Update the cached model
                this.currentFilePath = currentPath;
                
                // Reset unsaved changes flag since we just saved
                this.hasUnsavedChanges = false;
                
                // Clean up the temp file
                if (fs.existsSync(tempPath)) {
                    console.log("[ModelService] Cleaning up temp file");
                    fs.unlinkSync(tempPath);
                }
                
                // Log success
                console.log(`[ModelService] Successfully updated model from JSON and saved to ${path.basename(currentPath)}`);
                
                return updatedModel;
            } finally {
                // Ensure temp file is cleaned up even if an error occurs
                if (fs.existsSync(tempPath)) {
                    console.log("[ModelService] Cleaning up temp file in finally block");
                    fs.unlinkSync(tempPath);
                }
            }
        } catch (error) {
            // Log and re-throw the error
            console.error("[ModelService] Error updating model from JSON:", error);
            console.error("[ModelService] Error stack:", error.stack);
            vscode.window.showErrorMessage(`Failed to update model: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Get the schema path for validation and UI generation
     * @returns The path to the schema file
     */
    public getSchemaPath(): string {
        // Look for schema in the workspace first
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            const workspaceSchemaPath = path.join(workspaceFolders[0].uri.fsPath, 'app-dna.schema.json');
            if (fs.existsSync(workspaceSchemaPath)) {
                return workspaceSchemaPath;
            }
        }

        // Try to use extension context utility for more robust path resolution
        try {
            const { getExtensionResourcePath } = require('../utils/extensionContext');
            return getExtensionResourcePath('app-dna.schema.json');
        } catch (error) {
            console.warn('Could not get extension resource path, falling back to extension API:', error);
            
            // Fall back to the extension's schema file using VS Code API
            const extensionPath = vscode.extensions.getExtension('derivative-programming.appdna')?.extensionPath;
            if (!extensionPath) {
                throw new Error('Could not find extension path for derivative-programming.appdna');
            }
            return path.join(extensionPath, 'app-dna.schema.json');
        }
    }
    
    /**
     * Mark that the model has unsaved changes
     * This should be called whenever the model is modified in memory
     */
    public markUnsavedChanges(): void {
        this.hasUnsavedChanges = true;
        console.log("[ModelService] Model has been marked as having unsaved changes");
    }
    
    /**
     * Check if the model has unsaved changes
     * @returns True if the model has unsaved changes, false otherwise
     */
    public hasUnsavedChangesInMemory(): boolean {
        return this.hasUnsavedChanges;
    }

    /**
     * Get all object workflows from all objects in the model that have isPage=true
     * @returns Array containing references to the actual object workflow instances that are pages
     */
    public getAllPageObjectWorkflows(): ObjectWorkflowSchema[] {
        // Get all objects from all namespaces
        const allObjects = this.getAllObjects();
        if (!allObjects || allObjects.length === 0) {
            return [];
        }

        // Flatten the arrays of object workflows from all objects, filter for pages
        const allPageWorkflows: ObjectWorkflowSchema[] = [];
        
        for (const object of allObjects) {
            if (object.objectWorkflow && Array.isArray(object.objectWorkflow)) {
                // Filter for workflows that have isPage=true
                const pageWorkflows = object.objectWorkflow.filter(workflow => 
                    workflow.isPage === "true"
                );
                allPageWorkflows.push(...pageWorkflows);
            }
        }
        
        return allPageWorkflows;
    }
}
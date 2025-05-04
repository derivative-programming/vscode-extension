// SEARCH_TAG: object commands for VS Code extension
// Contains commands related to object manipulation.

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { JsonTreeItem } from '../models/types';
import { validateAgainstSchema } from '../utils/schemaValidator';
import { generateObjectCode } from '../generators/codeGenerator';
import { ModelService } from '../services/modelService';

/**
 * Command handler for adding an object to the AppDNA JSON
 * @param appDNAFilePath Path to the app-dna.json file
 * @param jsonTreeDataProvider The tree data provider
 * @param modelService Optional ModelService instance
 */
export async function addObjectCommand(
    appDNAFilePath: string | null, 
    jsonTreeDataProvider: any,
    modelService?: ModelService
): Promise<void> {
    if (!appDNAFilePath || !fs.existsSync(appDNAFilePath)) {
        vscode.window.showErrorMessage('AppDNA file not found. Please create the file first.');
        return;
    }
    
    try {
        // Get model service if not provided
        if (!modelService) {
            modelService = ModelService.getInstance();
        }
        
        // Ensure model is loaded
        if (!modelService.isFileLoaded()) {
            await modelService.loadFile(appDNAFilePath);
        }
        
        // Get the current model
        const model = modelService.getCurrentModel();
        if (!model) {
            throw new Error("Failed to get current model");
        }
        
        // Prompt for new object name
        const objectName = await vscode.window.showInputBox({
            placeHolder: 'Enter object name',
            prompt: 'Enter a name for the new data object',
            validateInput: (value) => value ? null : 'Object name cannot be empty'
        });
        if (!objectName) { return; }
        
        // Ensure root exists
        if (!model.namespace) {
            model.namespace = [];
        }
        
        // If no namespaces exist, create a default namespace
        if (model.namespace.length === 0) {
            model.namespace.push({ name: "Default", object: [] });
        }
        
        // Ensure each namespace has an "object" array
        model.namespace.forEach((ns: any) => {
            if (!ns.object) {
                ns.object = [];
            }
        });

        // Build list of existing objects from all namespaces
        const parentCandidates: { label: string; nsIndex: number }[] = [];
        model.namespace.forEach((ns: any, nsIndex: number) => {
            if (ns.object) {
                ns.object.forEach((obj: any) => {
                    if (obj.name) {
                        parentCandidates.push({ label: `${obj.name} (in ${ns.name})`, nsIndex });
                    }
                });
            }
        });
        
        // Remove the "None" option and use parentCandidates directly
        const parentOptions = parentCandidates;
        const selectedParent = await vscode.window.showQuickPick<{ label: string; nsIndex: number }>(
            parentOptions,
            { placeHolder: 'Select a parent object' }
        );
        
        let targetNsIndex: number;
        if (selectedParent) {
            targetNsIndex = selectedParent.nsIndex;
        } else {
            // No parent selected: if only one namespace exists, choose it;
            // otherwise, prompt user to choose a namespace.
            if (model.namespace.length === 1) {
                targetNsIndex = 0;
            } else {
                const nsSelection = await vscode.window.showQuickPick<{ label: string; nsIndex: number }>(
                    model.namespace.map((ns: any, index: number) => ({ label: ns.name || `Namespace ${index+1}`, nsIndex: index })),
                    { placeHolder: 'Select the target namespace to add the object' }
                );
                targetNsIndex = nsSelection ? nsSelection.nsIndex : 0;
            }
        }
        
        // Create new object following the schema; include parentObjectName if applicable.
        const newObject: any = { name: objectName };
        newObject.parentObjectName = (selectedParent && selectedParent.nsIndex !== -1) ? selectedParent.label.split(' (in ')[0] : "";
        
        // Add the new object into the chosen namespace's object array
        model.namespace[targetNsIndex].object.push(newObject);
        
        // Save the updated model
        await modelService.saveToFile(model);
        
        vscode.window.showInformationMessage(`Added new object: ${objectName}`);
        jsonTreeDataProvider.refresh();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to add object: ${errorMessage}`);
    }
}

/**
 * Command handler for removing an object from the AppDNA JSON
 * @param node The tree item representing the object to remove
 * @param appDNAFilePath Path to the app-dna.json file
 * @param jsonTreeDataProvider The tree data provider
 * @param modelService Optional ModelService instance
 */
export async function removeObjectCommand(
    node: JsonTreeItem, 
    appDNAFilePath: string | null, 
    jsonTreeDataProvider: any,
    modelService?: ModelService
): Promise<void> {
    if (!appDNAFilePath || !fs.existsSync(appDNAFilePath)) {
        vscode.window.showErrorMessage('AppDNA file not found.');
        return;
    }

    // Confirm deletion
    const confirmed = await vscode.window.showWarningMessage(
        `Are you sure you want to remove "${node.label}"?`, 
        { modal: true },
        'Yes', 'No'
    );
    
    if (confirmed !== 'Yes') {
        return;
    }

    try {
        // Get model service if not provided
        if (!modelService) {
            modelService = ModelService.getInstance();
        }
        
        // Ensure model is loaded
        if (!modelService.isFileLoaded()) {
            await modelService.loadFile(appDNAFilePath);
        }
        
        // Get the current model
        const model = modelService.getCurrentModel();
        if (!model) {
            throw new Error("Failed to get current model");
        }
        
        let objectRemoved = false;

        // Look through each namespace to find and remove the object
        if (model.namespace) {
            for (const ns of model.namespace) {
                if (!ns.object) {
                    continue;
                }
                
                const objectIndex = ns.object.findIndex((obj: any) => obj.name === node.label);
                if (objectIndex > -1) {
                    // Remove the object
                    ns.object.splice(objectIndex, 1);
                    objectRemoved = true;
                    break;
                }
            }
        }

        if (objectRemoved) {
            // Save the updated model
            await modelService.saveToFile(model);
            
            vscode.window.showInformationMessage(`Removed object: ${node.label}`);
            jsonTreeDataProvider.refresh();
        } else {
            vscode.window.showWarningMessage(`Object "${node.label}" not found.`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to remove object: ${errorMessage}`);
    }
}

/**
 * Command handler for adding a new AppDNA file
 * @param context Extension context
 * @param appDNAFilePath Path to the app-dna.json file
 * @param jsonTreeDataProvider The tree data provider
 * @param modelService Optional ModelService instance
 */
export async function addFileCommand(
    context: vscode.ExtensionContext, 
    appDNAFilePath: string | null, 
    jsonTreeDataProvider: any,
    modelService?: ModelService
): Promise<void> {
    if (!appDNAFilePath) {
        vscode.window.showErrorMessage('Workspace folder not found. Cannot create JSON file.');
        return;
    }

    try {
        // Get model service if not provided
        if (!modelService) {
            modelService = ModelService.getInstance();
        }
        
        // Get the workspace folder
        const workspaceFolder = path.dirname(appDNAFilePath);
        
        // First try to use template from extension directory
        const extensionTemplatePath = path.join(context.extensionPath, 'app-dna.new.json');
        // Fallback to workspace template if it exists
        const workspaceTemplatePath = path.join(workspaceFolder, 'app-dna.new.json');
        let defaultContent: string;
        
        // Try to load the template from the extension directory first
        if (fs.existsSync(extensionTemplatePath)) {
            defaultContent = fs.readFileSync(extensionTemplatePath, 'utf-8');
        } 
        // Then try the workspace template
        else if (fs.existsSync(workspaceTemplatePath)) {
            defaultContent = fs.readFileSync(workspaceTemplatePath, 'utf-8');
        } 
        // Otherwise use default structure
        else {
            defaultContent = JSON.stringify({ 
                root: { 
                    name: "DefaultApp",
                    databaseName: "DefaultDatabase",
                    namespace: [] 
                } 
            }, null, 2);
        }
        
        // Validate content against schema
        const jsonData = JSON.parse(defaultContent);
        const validationResult = await validateAgainstSchema(jsonData, context);
        
        if (!validationResult.valid) {
            const errors = validationResult.errors?.map(e => e.message).join(', ');
            vscode.window.showErrorMessage(`Template JSON does not match schema: ${errors}`);
            return;
        }
        
        // Create the model file
        await vscode.workspace.fs.writeFile(vscode.Uri.file(appDNAFilePath), Buffer.from(defaultContent, 'utf-8'));

        // Create the config file alongside the model file
        const configFileName = createConfigFileName(appDNAFilePath);
        const configContent = generateConfigFileContent(path.basename(appDNAFilePath));
        await vscode.workspace.fs.writeFile(vscode.Uri.file(configFileName), Buffer.from(configContent, 'utf-8'));
        
        vscode.window.showInformationMessage('New AppDNA file and configuration created.');
        
        // Load the model from the newly created file
        await modelService.loadFile(appDNAFilePath);
        
        // Refresh the tree view to display the empty 'Data Objects' node
        jsonTreeDataProvider.refresh();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to create AppDNA file: ${errorMessage}`);
    }
}

/**
 * Creates the config file name based on the model file path
 * @param modelFilePath Path to the model file
 * @returns Path to the config file
 */
function createConfigFileName(modelFilePath: string): string {
    const dir = path.dirname(modelFilePath);
    const baseName = path.basename(modelFilePath, '.json');
    return path.join(dir, `${baseName}.config.json`);
}

/**
 * Generates the content for the config file
 * @param modelFileName Name of the model file
 * @returns Config file content as JSON string
 */
function generateConfigFileContent(modelFileName: string): string {
    const config = {
        version: "1.0.0",
        modelFile: modelFileName,
        settings: {
            validateOnSave: true,
            codeGeneration: {
                outputPath: "./generated",
                languages: ["typescript", "csharp"],
                generateComments: true
            },
            editor: {
                showAdvancedProperties: false,
                defaultView: "tree",
                expandNodesOnLoad: true
            }
        }
    };
    
    return JSON.stringify(config, null, 2);
}

/**
 * Command handler for generating code
 * @param appDNAFilePath Path to the app-dna.json file
 * @param modelService Optional ModelService instance
 */
export async function generateCodeCommand(
    appDNAFilePath: string | null,
    modelService?: ModelService
): Promise<void> {
    if (!appDNAFilePath || !fs.existsSync(appDNAFilePath)) {
        vscode.window.showErrorMessage('AppDNA file not found. Please create the file first.');
        return;
    }
    
    try {
        // Get model service if not provided
        if (!modelService) {
            modelService = ModelService.getInstance();
        }
        
        // Ensure model is loaded
        if (!modelService.isFileLoaded()) {
            await modelService.loadFile(appDNAFilePath);
        }
        
        // Get the current model
        const model = modelService.getCurrentModel();
        if (!model) {
            throw new Error("Failed to get current model");
        }
        
        // Ask user for output folder
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            title: 'Select output folder for generated code'
        });

        if (!folderUri || folderUri.length === 0) {
            return;
        }
        
        const outputFolder = folderUri[0].fsPath;
        
        // Show progress during code generation
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating code...",
            cancellable: false
        }, async (progress) => {
            
            // Process each namespace in the data
            if (model.namespace) {
                for (let i = 0; i < model.namespace.length; i++) {
                    const namespace = model.namespace[i];
                    progress.report({ 
                        increment: (i / model.namespace.length) * 100, 
                        message: `Processing namespace ${namespace.name}` 
                    });
                    
                    // Create namespace folder
                    const namespacePath = path.join(outputFolder, namespace.name);
                    if (!fs.existsSync(namespacePath)) {
                        fs.mkdirSync(namespacePath, { recursive: true });
                    }
                    
                    // Generate files for each object in this namespace
                    if (namespace.object) {
                        for (const obj of namespace.object) {
                            await generateObjectCode(obj, namespacePath, namespace.name);
                        }
                    }
                }
            }
        });
        
        vscode.window.showInformationMessage(`Code generation completed successfully in: ${outputFolder}`);
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Code generation failed: ${errorMessage}`);
    }
}
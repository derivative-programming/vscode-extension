import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { JsonTreeItem } from '../models/types';
import { validateAgainstSchema } from '../utils/schemaValidator';
import { generateObjectCode } from '../generators/codeGenerator';

/**
 * Command handler for adding an object to the AppDNA JSON
 * @param appDNAFilePath Path to the app-dna.json file
 * @param jsonTreeDataProvider The tree data provider
 */
export async function addObjectCommand(appDNAFilePath: string | null, jsonTreeDataProvider: any): Promise<void> {
    if (!appDNAFilePath || !fs.existsSync(appDNAFilePath)) {
        vscode.window.showErrorMessage('AppDNA file not found. Please create the file first.');
        return;
    }
    try {
        // Prompt for new object name
        const objectName = await vscode.window.showInputBox({
            placeHolder: 'Enter object name',
            prompt: 'Enter a name for the new data object',
            validateInput: (value) => value ? null : 'Object name cannot be empty'
        });
        if (!objectName) { return; }
        
        // Read the existing file content
        const fileContent = fs.readFileSync(appDNAFilePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);

        // Ensure root exists
        if (!jsonData.root) {
            jsonData.root = {};
        }
        // Ensure namespace exists as an array; if missing, create a default namespace
        if (!Array.isArray(jsonData.root.namespace) || jsonData.root.namespace.length === 0) {
            jsonData.root.namespace = [{ name: "Default", object: [] }];
        }
        // Ensure each namespace has an "object" array
        jsonData.root.namespace.forEach((ns: any) => {
            if (!ns.object) {
                ns.object = [];
            }
        });

        // Build list of existing objects from all namespaces
        const parentCandidates: { label: string; nsIndex: number }[] = [];
        jsonData.root.namespace.forEach((ns: any, nsIndex: number) => {
            ns.object.forEach((obj: any) => {
                if (obj.name) {
                    parentCandidates.push({ label: `${obj.name} (in ${ns.name})`, nsIndex });
                }
            });
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
            if (jsonData.root.namespace.length === 1) {
                targetNsIndex = 0;
            } else {
                const nsSelection = await vscode.window.showQuickPick<{ label: string; nsIndex: number }>(
                    jsonData.root.namespace.map((ns: any, index: number) => ({ label: ns.name || `Namespace ${index+1}`, nsIndex: index })),
                    { placeHolder: 'Select the target namespace to add the object' }
                );
                targetNsIndex = nsSelection ? nsSelection.nsIndex : 0;
            }
        }
        
        // Create new object following the schema; include parentObjectName if applicable.
        const newObject: any = { name: objectName };
        newObject.parentObjectName = (selectedParent && selectedParent.nsIndex !== -1) ? selectedParent.label.split(' (in ')[0] : "";
        
        // Add the new object into the chosen namespace's object array
        jsonData.root.namespace[targetNsIndex].object.push(newObject);
        
        // Write the updated content back to the file
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(appDNAFilePath),
            Buffer.from(JSON.stringify(jsonData, null, 2), 'utf-8')
        );
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
 */
export async function removeObjectCommand(node: JsonTreeItem, appDNAFilePath: string | null, jsonTreeDataProvider: any): Promise<void> {
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
        // Read the current file content
        const fileContent = fs.readFileSync(appDNAFilePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);

        let objectRemoved = false;

        // Look through each namespace to find and remove the object
        if (jsonData.root.namespace) {
            for (const ns of jsonData.root.namespace) {
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
            // Write the updated content back to the file
            await vscode.workspace.fs.writeFile(
                vscode.Uri.file(appDNAFilePath),
                Buffer.from(JSON.stringify(jsonData, null, 2), 'utf-8')
            );
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
 */
export async function addFileCommand(context: vscode.ExtensionContext, appDNAFilePath: string | null, jsonTreeDataProvider: any): Promise<void> {
    if (!appDNAFilePath) {
        vscode.window.showErrorMessage('Workspace folder not found. Cannot create JSON file.');
        return;
    }

    try {
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
        
        // Create the file
        await vscode.workspace.fs.writeFile(vscode.Uri.file(appDNAFilePath), Buffer.from(defaultContent, 'utf-8'));
        vscode.window.showInformationMessage('New AppDNA file created.');
        
        // Refresh the tree view to display the empty 'Data Objects' node
        jsonTreeDataProvider.refresh();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to create AppDNA file: ${errorMessage}`);
    }
}

/**
 * Command handler for generating code
 * @param appDNAFilePath Path to the app-dna.json file
 */
export async function generateCodeCommand(appDNAFilePath: string | null): Promise<void> {
    if (!appDNAFilePath || !fs.existsSync(appDNAFilePath)) {
        vscode.window.showErrorMessage('AppDNA file not found. Please create the file first.');
        return;
    }
    
    try {
        // Read the current file content
        const fileContent = fs.readFileSync(appDNAFilePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);
        
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
            if (jsonData.root.namespace) {
                for (let i = 0; i < jsonData.root.namespace.length; i++) {
                    const namespace = jsonData.root.namespace[i];
                    progress.report({ 
                        increment: (i / jsonData.root.namespace.length) * 100, 
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
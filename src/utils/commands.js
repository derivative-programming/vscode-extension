"use strict";
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

// Import modules we extracted earlier
const { showObjectDetails } = require('../webviews/objectDetailsView');
const { updateFileExistsContext } = require('../providers/treeDataProvider');
const { generateObjectCode, validateAgainstSchema } = require('./codeGenerator');

/**
 * Register all commands for the extension
 * @param {vscode.ExtensionContext} context Extension context
 * @param {Object} params Additional parameters needed for command registration
 * @returns {Array} Array of registered command disposables
 */
function registerCommands(context, { appDNAFilePath, jsonTreeDataProvider }) {
    const commands = [];
    
    // Register command to refresh tree view
    const refreshCommand = vscode.commands.registerCommand('appdna.refresh', () => {
        jsonTreeDataProvider.refresh();
    });
    commands.push(refreshCommand);
    
    // Register command to show object details
    const showDetailsCommand = vscode.commands.registerCommand('appdna.showDetails', (node) => {
        showObjectDetails(node, appDNAFilePath);
    });
    commands.push(showDetailsCommand);
    
    // Register command to edit JSON object
    const editCommand = vscode.commands.registerCommand('appdna.editObject', (node) => {
        openJsonEditor(context, node.label);
    });
    commands.push(editCommand);
    
    // Register command to add a new file
    const addFileCommand = vscode.commands.registerCommand('appdna.addFile', async () => {
        await addFile(appDNAFilePath, jsonTreeDataProvider);
    });
    commands.push(addFileCommand);
    
    // Register command to add a new object
    const addObjectCommand = vscode.commands.registerCommand('appdna.addObject', async () => {
        await addObject(appDNAFilePath, jsonTreeDataProvider);
    });
    commands.push(addObjectCommand);
    
    // Register command to remove an object
    const removeObjectCommand = vscode.commands.registerCommand('appdna.removeObject', async (node) => {
        await removeObject(node, appDNAFilePath, jsonTreeDataProvider);
    });
    commands.push(removeObjectCommand);
    
    // Register command to create a new project
    const newProjectCommand = vscode.commands.registerCommand('appdna.newProject', async () => {
        await newProject(jsonTreeDataProvider);
    });
    commands.push(newProjectCommand);
    
    // Register command to open a project
    const openProjectCommand = vscode.commands.registerCommand('appdna.openProject', async () => {
        await openProject(jsonTreeDataProvider);
    });
    commands.push(openProjectCommand);
    
    // Register command to save a project
    const saveProjectCommand = vscode.commands.registerCommand('appdna.saveProject', async () => {
        await saveProject(jsonTreeDataProvider);
    });
    commands.push(saveProjectCommand);
    
    // Register command to generate code
    const generateCodeCommand = vscode.commands.registerCommand('appdna.generateCode', async () => {
        await generateCode(appDNAFilePath);
    });
    commands.push(generateCodeCommand);
    
    return commands;
}

/**
 * Open JSON editor for an object
 * @param {vscode.ExtensionContext} context Extension context
 * @param {string} nodeLabel Label of the object to edit
 */
function openJsonEditor(context, nodeLabel) {
    const panel = vscode.window.createWebviewPanel('jsonEditor', `Edit JSON: ${nodeLabel}`, vscode.ViewColumn.One, {
        enableScripts: true
    });
    
    // Set the HTML content for the webview
    panel.webview.html = getWebviewContent(nodeLabel);
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(message => {
        if (message.command === 'save') {
            vscode.window.showInformationMessage(`Saved: ${JSON.stringify(message.data)}`);
        }
    }, undefined, context.subscriptions);
}

/**
 * Get HTML content for JSON editor webview
 * @param {string} nodeLabel Label of the object being edited
 * @returns {string} HTML content
 */
function getWebviewContent(nodeLabel) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" width="device-width, initial-scale=1.0">
    <title>Edit JSON</title>
</head>
<body>
    <h1>Edit JSON: ${nodeLabel}</h1>
    <form id="jsonForm">
        <label for="key">Key:</label>
        <input type="text" id="key" name="key" value="${nodeLabel}"><br><br>
        <label for="value">Value:</label>
        <input type="text" id="value" name="value"><br><br>
        <button type="button" onclick="saveData()">Save</button>
    </form>
    <script>
        const vscode = acquireVsCodeApi();
        function saveData() {
            const form = document.getElementById('jsonForm');
            const data = {
                key: form.key.value,
                value: form.value.value
            };
            vscode.postMessage({ command: 'save', data });
        }
    </script>
</body>
</html>`;
}

/**
 * Add a new app-dna.json file
 * @param {string} appDNAFilePath Path where the file will be created
 * @param {Object} jsonTreeDataProvider Tree data provider to refresh after creation
 */
async function addFile(appDNAFilePath, jsonTreeDataProvider) {
    if (!appDNAFilePath) {
        vscode.window.showErrorMessage('Workspace folder not found. Cannot create JSON file.');
        return;
    }
    
    try {
        const workspaceFolder = path.dirname(appDNAFilePath);
        
        // Use a template file as the starting point
        const templatePath = path.join(workspaceFolder, 'app-dna.new.json');
        let defaultContent;
        
        if (fs.existsSync(templatePath)) {
            // Use template if available
            defaultContent = fs.readFileSync(templatePath, 'utf-8');
        } else {
            // Otherwise use default structure
            defaultContent = JSON.stringify({ root: { namespace: [{ name: "Default", object: [] }] } }, null, 2);
        }
        
        // Validate content against schema
        const jsonData = JSON.parse(defaultContent);
        const schemaPath = path.join(workspaceFolder, 'app-dna.schema.json');
        
        if (fs.existsSync(schemaPath)) {
            const validationResult = await validateAgainstSchema(jsonData, schemaPath);
            if (!validationResult.valid) {
                const errors = validationResult.errors?.map(e => e.message).join(', ');
                vscode.window.showErrorMessage(`Template JSON does not match schema: ${errors}`);
                return;
            }
        }
        
        // Create the file
        await vscode.workspace.fs.writeFile(vscode.Uri.file(appDNAFilePath), Buffer.from(defaultContent, 'utf-8'));
        vscode.window.showInformationMessage('New AppDNA file created.');
        
        // Update the file exists context
        updateFileExistsContext(appDNAFilePath);
        
        // Refresh the tree view to display the empty 'Data Objects' node
        jsonTreeDataProvider.refresh();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to create AppDNA file: ${errorMessage}`);
    }
}

/**
 * Add a new object to the app-dna.json file
 * @param {string} appDNAFilePath Path to the app-dna.json file
 * @param {Object} jsonTreeDataProvider Tree data provider to refresh after adding
 */
async function addObject(appDNAFilePath, jsonTreeDataProvider) {
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
        
        if (!objectName) {
            return;
        }
        
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
        jsonData.root.namespace.forEach((ns) => {
            if (!Array.isArray(ns.object)) {
                ns.object = [];
            }
        });
        
        // Build list of existing objects from all namespaces
        const parentCandidates = [];
        jsonData.root.namespace.forEach((ns, nsIndex) => {
            ns.object.forEach((obj) => {
                if (obj.name) {
                    parentCandidates.push({ label: `${obj.name} (in ${ns.name})`, nsIndex });
                }
            });
        });
        
        // Remove the "None" option and use parentCandidates directly
        const parentOptions = parentCandidates;
        const selectedParent = await vscode.window.showQuickPick(parentOptions, { placeHolder: 'Select a parent object' });
        
        let targetNsIndex;
        if (selectedParent) {
            targetNsIndex = selectedParent.nsIndex;
        } else {
            // No parent selected: if only one namespace exists, choose it;
            // otherwise, prompt user to choose a namespace.
            if (jsonData.root.namespace.length === 1) {
                targetNsIndex = 0;
            } else {
                const nsSelection = await vscode.window.showQuickPick(
                    jsonData.root.namespace.map((ns, index) => ({ 
                        label: ns.name || `Namespace ${index + 1}`, 
                        nsIndex: index 
                    })), 
                    { placeHolder: 'Select the target namespace to add the object' }
                );
                targetNsIndex = nsSelection ? nsSelection.nsIndex : 0;
            }
        }
        
        // Create new object following the schema; include parentObjectName if applicable.
        const newObject = { name: objectName };
        newObject.parentObjectName = (selectedParent && selectedParent.nsIndex !== -1) ? selectedParent.label.split(' (in ')[0] : "";
        
        // Add the new object into the chosen namespace's object array
        jsonData.root.namespace[targetNsIndex].object.push(newObject);
        
        // Write the updated content back to the file
        await vscode.workspace.fs.writeFile(vscode.Uri.file(appDNAFilePath), Buffer.from(JSON.stringify(jsonData, null, 2), 'utf-8'));
        
        vscode.window.showInformationMessage(`Added new object: ${objectName}`);
        jsonTreeDataProvider.refresh();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to add object: ${errorMessage}`);
    }
}

/**
 * Remove an object from the app-dna.json file
 * @param {Object} node TreeView node representing the object to remove
 * @param {string} appDNAFilePath Path to the app-dna.json file
 * @param {Object} jsonTreeDataProvider Tree data provider to refresh after removal
 */
async function removeObject(node, appDNAFilePath, jsonTreeDataProvider) {
    if (!appDNAFilePath || !fs.existsSync(appDNAFilePath)) {
        vscode.window.showErrorMessage('AppDNA file not found.');
        return;
    }
    
    // Confirm deletion
    const confirmed = await vscode.window.showWarningMessage(
        `Are you sure you want to remove "${node.label}"?`,
        { modal: true },
        'Yes',
        'No'
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
                if (!ns.object) continue;
                
                const objectIndex = ns.object.findIndex(obj => obj.name === node.label);
                
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
 * Create a new project
 * @param {Object} jsonTreeDataProvider Tree data provider to reset for new project
 */
async function newProject(jsonTreeDataProvider) {
    const projectName = await vscode.window.showInputBox({
        placeHolder: 'Project name',
        prompt: 'Enter a name for the new project'
    });
    
    if (projectName) {
        jsonTreeDataProvider.reset();
        vscode.window.showInformationMessage(`Created new project: ${projectName}`);
    }
}

/**
 * Open an existing project file
 * @param {Object} jsonTreeDataProvider Tree data provider to load project into
 */
async function openProject(jsonTreeDataProvider) {
    const fileUri = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: {
            'JSON Files': ['json']
        },
        title: 'Open AppDNA Project'
    });
    
    if (fileUri && fileUri.length > 0) {
        try {
            // Read file and parse JSON
            const fileContent = await vscode.workspace.fs.readFile(fileUri[0]);
            const projectData = JSON.parse(Buffer.from(fileContent).toString('utf-8'));
            
            // Load project data
            jsonTreeDataProvider.loadProject(projectData);
            vscode.window.showInformationMessage(`Opened project: ${fileUri[0].fsPath}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open project: ${error}`);
        }
    }
}

/**
 * Save the current project to a file
 * @param {Object} jsonTreeDataProvider Tree data provider containing project data
 */
async function saveProject(jsonTreeDataProvider) {
    const fileUri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file('app_project.json'),
        filters: {
            'JSON Files': ['json']
        },
        title: 'Save AppDNA Project'
    });
    
    if (fileUri) {
        try {
            // Get project data and save to file
            const projectData = jsonTreeDataProvider.getProject();
            const jsonString = JSON.stringify(projectData, null, 2);
            
            await vscode.workspace.fs.writeFile(fileUri, Buffer.from(jsonString, 'utf-8'));
            vscode.window.showInformationMessage(`Project saved to: ${fileUri.fsPath}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to save project: ${errorMessage}`);
        }
    }
}

/**
 * Generate code from the app-dna.json file
 * @param {string} appDNAFilePath Path to the app-dna.json file
 */
async function generateCode(appDNAFilePath) {
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

module.exports = {
    registerCommands
};
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import Ajv from 'ajv';
import * as objectDetailsView from './webviews/objectDetailsView'; // Import objectDetailsView
import { setExtensionContext } from './utils/extensionContext'; // Import the context utility

// Define interfaces for type safety
interface NamespaceObject {
    name: string;
    parentObjectName?: string;
    properties?: Property[];
    [key: string]: any; // Allow for additional properties
}

interface Namespace {
    name: string;
    object: NamespaceObject[];
}

interface Property {
    name: string;
    type: string;
    value?: any;
}

interface AppDNARoot {
    namespace: Namespace[];
    object?: any[]; // Legacy support
    lookupItem?: any[]; // Legacy support
}

interface AppDNAData {
    root: AppDNARoot;
}

// TreeDataProvider for managing JSON structure
class JsonTreeDataProvider implements vscode.TreeDataProvider<JsonTreeItem> {

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
            const newObj: NamespaceObject = {
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

class JsonTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue?: string
    ) {
        super(label, collapsibleState);
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

// Add a function to update the file existence context
function updateFileExistsContext(appDNAFilePath: string | null) {
    const fileExists = appDNAFilePath && fs.existsSync(appDNAFilePath);
    vscode.commands.executeCommand('setContext', 'appDnaFileExists', fileExists);
    return fileExists;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "AppDNA" is now active!');
    
    // Set the extension context for use throughout the extension
    setExtensionContext(context);

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const appDNAFilePath = workspaceFolder ? path.join(workspaceFolder, 'app-dna.json') : null;
    
    // Set initial context based on file existence
    updateFileExistsContext(appDNAFilePath);
    
    // Load the objectDetailsView module safely
    try {
        console.log('objectDetailsView loaded successfully');
    } catch (err) {
        console.error('Failed to load objectDetailsView module:', err);
        // Create a fallback implementation
        objectDetailsView = {
            showObjectDetails: (item: JsonTreeItem, appDNAPath: string) => {
                vscode.window.showInformationMessage(`Details for ${item.label} (fallback implementation)`);
            }
        };
    }

    // The TreeDataProvider creates a tree view with id "appdna"
    const jsonTreeDataProvider = new JsonTreeDataProvider(appDNAFilePath);
    const treeView = vscode.window.createTreeView('appdna', { treeDataProvider: jsonTreeDataProvider });
    
    context.subscriptions.push(treeView);

    // Set up file system watcher for the app-dna.json file
    if (workspaceFolder) {
        const fileWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(workspaceFolder, 'app-dna.json')
        );
        
        // Watch for file creation
        fileWatcher.onDidCreate(() => {
            console.log('app-dna.json file was created');
            updateFileExistsContext(appDNAFilePath);
            jsonTreeDataProvider.refresh();
        });
        
        // Watch for file deletion
        fileWatcher.onDidDelete(() => {
            console.log('app-dna.json file was deleted');
            updateFileExistsContext(appDNAFilePath);
            jsonTreeDataProvider.refresh();
        });
        
        // Watch for file changes (optional, for completeness)
        fileWatcher.onDidChange(() => {
            console.log('app-dna.json file was changed');
            jsonTreeDataProvider.refresh();
        });
        
        // Make sure to dispose of the watcher when the extension is deactivated
        context.subscriptions.push(fileWatcher);
    }

    const refreshCommand = vscode.commands.registerCommand('appdna.refresh', () => {
        jsonTreeDataProvider.refresh();
    });

    context.subscriptions.push(refreshCommand);

    // Register command to open the editor
    const editCommand = vscode.commands.registerCommand('appdna.editObject', (node: JsonTreeItem) => {
        openJsonEditor(context, node.label);
    });

    context.subscriptions.push(editCommand); 

    // Add schema validation function
    async function validateAgainstSchema(jsonData: any): Promise<{valid: boolean; errors: any[] | null}> {
        try {
            // Load schema from extension directory instead of workspace
            const schemaPath = path.join(context.extensionPath, 'app-dna.schema.json');
            const schemaContent = await vscode.workspace.fs.readFile(vscode.Uri.file(schemaPath));
            const schema = JSON.parse(Buffer.from(schemaContent).toString('utf-8'));
            
            // Create validator with options to support draft-04
            const ajv = new Ajv({
                allErrors: true,
                schemaId: 'id', // Important for draft-04 compatibility
                meta: false // Disable default metaschemas
            });
            
            // Add draft-04 metaschema for validation
            ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));
            
            const validate = ajv.compile(schema);
            const valid = validate(jsonData);
            
            return {
                valid: !!valid,
                errors: validate.errors || null
            };
        } catch (error) {
            console.error('Schema validation error:', error);
            return {
                valid: false, 
                errors: [{message: `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`}]
            };
        }
    }

    vscode.commands.registerCommand('appdna.addFile', async () => {
        if (!appDNAFilePath) {
            vscode.window.showErrorMessage('Workspace folder not found. Cannot create JSON file.');
            return;
        }

        try {
            // First try to use template from extension directory
            const extensionTemplatePath = path.join(context.extensionPath, 'app-dna.new.json');
            // Fallback to workspace template if it exists
            const workspaceTemplatePath = path.join(workspaceFolder!, 'app-dna.new.json');
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
            const validationResult = await validateAgainstSchema(jsonData);
            
            if (!validationResult.valid) {
                const errors = validationResult.errors?.map(e => e.message).join(', ');
                vscode.window.showErrorMessage(`Template JSON does not match schema: ${errors}`);
                return;
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
    });

    vscode.commands.registerCommand('appdna.addObject', async () => {
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
    });

    const removeObjectCommand = vscode.commands.registerCommand('appdna.removeObject', async (node: JsonTreeItem) => {
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
            const jsonData = JSON.parse(fileContent) as AppDNAData;

            let objectRemoved = false;

            // Look through each namespace to find and remove the object
            if (jsonData.root.namespace) {
                for (const ns of jsonData.root.namespace) {
                    if (!ns.object) {
                        continue;
                    }
                    
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
    });

    context.subscriptions.push(removeObjectCommand);

    // Implement menu bar commands
    const newProjectCommand = vscode.commands.registerCommand('appdna.newProject', async () => {
        const projectName = await vscode.window.showInputBox({
            placeHolder: 'Project name',
            prompt: 'Enter a name for the new project'
        });
        
        if (projectName) {
            jsonTreeDataProvider.reset();
            vscode.window.showInformationMessage(`Created new project: ${projectName}`);
        }
    });
    context.subscriptions.push(newProjectCommand);

    const openProjectCommand = vscode.commands.registerCommand('appdna.openProject', async () => {
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
    });
    context.subscriptions.push(openProjectCommand);

    const saveProjectCommand = vscode.commands.registerCommand('appdna.saveProject', async () => {
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
    });
    context.subscriptions.push(saveProjectCommand);

    const generateCodeCommand = vscode.commands.registerCommand('appdna.generateCode', async () => {
        if (!appDNAFilePath || !fs.existsSync(appDNAFilePath)) {
            vscode.window.showErrorMessage('AppDNA file not found. Please create the file first.');
            return;
        }
        
        try {
            // Read the current file content
            const fileContent = fs.readFileSync(appDNAFilePath, 'utf-8');
            const jsonData = JSON.parse(fileContent) as AppDNAData;
            
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
    });
    
    // Add the command to context.subscriptions
    context.subscriptions.push(generateCodeCommand);

    // Register the command that opens a details view for a data object.
    const showDetailsCommand = vscode.commands.registerCommand('appdna.showDetails', (node: JsonTreeItem) => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        const appDNAPath = workspaceFolder ? path.join(workspaceFolder, 'app-dna.json') : '';
        
        // Ensure the objectDetailsView module is loaded correctly
        if (!objectDetailsView || typeof objectDetailsView.showObjectDetails !== 'function') {
            vscode.window.showErrorMessage('Failed to load objectDetailsView module. Please check the extension setup.');
            return;
        }

        // Use the objectDetailsView implementation
        objectDetailsView.showObjectDetails(node, appDNAPath);
    });
    context.subscriptions.push(showDetailsCommand);
}

// Helper function to open a webview panel with details about the data object.
function showObjectDetails(item: JsonTreeItem, appDNAPath: string) {
    // Get the path to the app-dna.json file
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const appDNAFilePath = workspaceFolder ? path.join(workspaceFolder, 'app-dna.json') : null;
    
    if (!appDNAFilePath) {
        vscode.window.showErrorMessage('AppDNA file not found. Cannot show object details.');
        return;
    }
    
    // Use the objectDetailsView implementation
    try {
        objectDetailsView.showObjectDetails(item, appDNAPath);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Error displaying object details: ${errorMessage}`);
        console.error('Error in showObjectDetails:', error);
    }
}

function openJsonEditor(context: vscode.ExtensionContext, nodeLabel: string) {
    const panel = vscode.window.createWebviewPanel(
        'jsonEditor',
        `Edit JSON: ${nodeLabel}`,
        vscode.ViewColumn.One,
        {
            enableScripts: true
        }
    );

    // Set the HTML content for the webview
    panel.webview.html = getWebviewContent(nodeLabel);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        message => {
            if (message.command === 'save') {
                vscode.window.showInformationMessage(`Saved: ${JSON.stringify(message.data)}`);
            }
        },
        undefined,
        context.subscriptions
    );
}

function getWebviewContent(nodeLabel: string): string {
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

export function deactivate() {
    console.log('Extension deactivated.');
}

type TreeDataChange = JsonTreeItem | undefined | void;

/**
 * Generate code files for a single object by calling external model services
 */
async function generateObjectCode(obj: NamespaceObject, outputFolder: string, namespaceName: string): Promise<void> {
    if (!obj.name) {
        return;
    }
    
    // Generate a model class for this object
    const className = obj.name.charAt(0).toUpperCase() + obj.name.slice(1);
    
    try {
        // Call external API for TypeScript model generation
        const tsContent = await callExternalModelService('typescript', obj, namespaceName);
        const tsFilePath = path.join(outputFolder, `${className}.ts`);
        fs.writeFileSync(tsFilePath, tsContent);
        
        // Call external API for C# model generation
        const csharpContent = await callExternalModelService('csharp', obj, namespaceName);
        const csharpFilePath = path.join(outputFolder, `${className}.cs`);
        fs.writeFileSync(csharpFilePath, csharpContent);
        
        // Log success
        console.log(`Generated code for ${className} in ${namespaceName}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to generate code for ${className}: ${errorMessage}`);
        throw error;
    }
}

/**
 * Call external model service API to generate code
 * @param language Target language for the generated code
 * @param obj Object structure to generate code for
 * @param namespace Namespace for the generated code
 * @returns Generated code as string
 */
async function callExternalModelService(language: string, obj: NamespaceObject, namespace: string): Promise<string> {
    // Get service URL from configuration
    const config = vscode.workspace.getConfiguration('appDNA');
    const serviceBaseUrl = config.get<string>('modelServiceUrl') || 'https://modelservicesapi.derivative-programming.com';
    
    console.log(`Calling external model service for ${language} code generation at ${serviceBaseUrl}`);
    
    try {
        // Create the request payload according to the API specification
        const payload = {
            modelData: JSON.stringify({
                object: obj,
                namespace: namespace,
                language: language
            }),
            targetLanguage: language,
            options: {
                includeComments: true,
                generateConstructor: true,
                generateProperties: true
            }
        };
        
        // Use node-fetch or browser fetch API with a polyfill in web extensions
        // This approach works in both desktop and web extensions
        const endpoint = '/api/v1_0/fabrication-requests';
        const url = `${serviceBaseUrl}${endpoint}`;
        
        // Show status in the UI while API call is in progress
        vscode.window.setStatusBarMessage(`Generating ${language} code...`, 2000);
        
        try {
            // Make the API request
            const data = await vscode.workspace.fs.readFile(
                vscode.Uri.parse(`${url}?${new URLSearchParams({
                    data: JSON.stringify(payload)
                })}`)
            );
            
            // Parse the response
            const responseText = Buffer.from(data).toString('utf-8');
            try {
                const response = JSON.parse(responseText);
                // Extract the generated code from the response
                if (response && response.generatedCode) {
                    return response.generatedCode;
                } else {
                    throw new Error('Missing generatedCode in API response');
                }
            } catch (parseError) {
                console.error('Error parsing API response:', parseError);
                throw new Error('Invalid response from model service');
            }
        } catch (requestError) {
            console.error('API request failed:', requestError);
            throw requestError;
        }
    } catch (error) {
        console.error('Error in callExternalModelService:', error);
        vscode.window.showWarningMessage(`Failed to generate ${language} code from service: ${error instanceof Error ? error.message : 'Unknown error'}. Using fallback code.`);
        return generateFallbackCode(language, obj, namespace);
    }
}

/**
 * Generate fallback code when the API call fails
 */
function generateFallbackCode(language: string, obj: NamespaceObject, namespace: string): string {
    const className = obj.name.charAt(0).toUpperCase() + obj.name.slice(1);
    
    if (language === 'typescript') {
        return `/*
 * Generated by AppDNA (Fallback) - ${new Date().toISOString()}
 * Namespace: ${namespace}
 * Note: This is fallback code generated when the external API couldn't be reached
 */
export class ${className} {
    // Properties would be generated based on the object definition
    ${obj.properties ? obj.properties.map(prop => {
        // Determine TypeScript type from property type
        let tsType = 'any';
        switch (prop.type?.toLowerCase()) {
            case 'string': tsType = 'string'; break;
            case 'number': case 'int': case 'float': tsType = 'number'; break;
            case 'boolean': tsType = 'boolean'; break;
            case 'date': case 'datetime': tsType = 'Date'; break;
            default: tsType = 'any';
        }
        return `${prop.name}: ${tsType};`;
    }).join('\n    ') : '// No properties defined'}
    
    constructor(data?: Partial<${className}>) {
        Object.assign(this, data || {});
    }
}`;
    } else if (language === 'csharp') {
        return `/*
 * Generated by AppDNA (Fallback) - ${new Date().toISOString()}
 * Namespace: ${namespace}
 * Note: This is fallback code generated when the external API couldn't be reached
 */
using System;

namespace ${namespace}
{
    public class ${className}
    {
        // Properties would be generated based on the object definition
        ${obj.properties ? obj.properties.map(prop => {
            // Determine C# type from property type
            let csharpType = 'object';
            switch (prop.type?.toLowerCase()) {
                case 'string': csharpType = 'string'; break;
                case 'number': case 'float': csharpType = 'double'; break;
                case 'int': csharpType = 'int'; break;
                case 'boolean': csharpType = 'bool'; break;
                case 'date': case 'datetime': csharpType = 'DateTime'; break;
                default: csharpType = 'object';
            }
            return `public ${csharpType} ${prop.name} { get; set; }`;
        }).join('\n        ') : '// No properties defined'}
    }
}`; 
    } else {
        return `// Code generation for ${language} not implemented yet`;
    }
}

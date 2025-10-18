// mcpBridge.ts
// HTTP bridge for MCP server to access extension data and execute commands
// Created on: October 15, 2025
// This file implements both data bridge (port 3001) and command bridge (port 3002)

import * as http from 'http';
import * as vscode from 'vscode';
import { ModelService } from './modelService';
import { validateUserStory } from './validation/userStoryValidation';

/**
 * MCP Bridge Service
 * Provides HTTP endpoints for MCP server to:
 * 1. Read data from the extension (data bridge)
 * 2. Execute commands in the extension (command bridge)
 */
export class McpBridge {
    private dataServer: http.Server | null = null;
    private commandServer: http.Server | null = null;
    private dataPort: number = 3001;
    private commandPort: number = 3002;
    private outputChannel: vscode.OutputChannel;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('MCP Bridge');
    }

    /**
     * Start both data and command bridges
     */
    public start(context: vscode.ExtensionContext): void {
        this.startDataBridge();
        this.startCommandBridge(context);
        this.outputChannel.appendLine('[MCP Bridge] Started successfully (data + command)');
        console.log('[MCP Bridge] Data bridge on port 3001, Command bridge on port 3002');
    }

    /**
     * Data Bridge - Serves data to MCP
     * Port: 3001
     * Methods: GET, POST
     */
    private startDataBridge(): void {
        this.dataServer = http.createServer((req, res) => {
            // Set CORS headers for local access
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            // Handle OPTIONS preflight
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            const logMessage = `[Data Bridge] ${req.method} ${req.url}`;
            this.outputChannel.appendLine(logMessage);
            console.log(logMessage);

            try {
                const modelService = ModelService.getInstance();
                const model = modelService.getCurrentModel();

                if (req.url === '/api/user-stories') {
                    // Get all user stories from all namespaces
                    const stories = model?.namespace?.flatMap(ns => ns.userStory || []) || [];
                    
                    this.outputChannel.appendLine(`[Data Bridge] Returning ${stories.length} user stories`);
                    
                    res.writeHead(200);
                    res.end(JSON.stringify(stories));
                }
                else if (req.url === '/api/objects') {
                    // Get all objects from all namespaces
                    const objects = modelService.getAllObjects();
                    
                    this.outputChannel.appendLine(`[Data Bridge] Returning ${objects.length} objects`);
                    
                    res.writeHead(200);
                    res.end(JSON.stringify(objects));
                }
                else if (req.url === '/api/data-objects' && req.method === 'GET') {
                    // Get all data objects with name, isLookup, parentObjectName, and codeDescription
                    const objects = modelService.getAllObjects();
                    const dataObjects = objects.map((obj: any) => ({
                        name: obj.name || "",
                        isLookup: obj.isLookup === "true",
                        parentObjectName: obj.parentObjectName || null,
                        codeDescription: obj.codeDescription || ""
                    }));
                    
                    this.outputChannel.appendLine(`[Data Bridge] Returning ${dataObjects.length} data objects (filtered)`);
                    
                    res.writeHead(200);
                    res.end(JSON.stringify(dataObjects));
                }
                else if (req.url === '/api/data-objects' && req.method === 'POST') {
                    // Create a new data object
                    let body = '';
                    
                    req.on('data', (chunk: any) => {
                        body += chunk.toString();
                    });
                    
                    req.on('end', () => {
                        try {
                            const { name, parentObjectName, isLookup, codeDescription } = JSON.parse(body);
                            
                            // Get the current model
                            const model = modelService.getCurrentModel();
                            if (!model) {
                                throw new Error("Failed to get current model");
                            }
                            
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
                            
                            // Determine which namespace to use
                            let targetNsIndex = 0; // Default to first namespace
                            
                            // For non-lookup objects, find the namespace containing the parent object
                            const isLookupBool = isLookup === 'true';
                            if (!isLookupBool && parentObjectName) {
                                for (let i = 0; i < model.namespace.length; i++) {
                                    const ns = model.namespace[i];
                                    if (ns.object && ns.object.some((obj: any) => obj.name === parentObjectName)) {
                                        targetNsIndex = i;
                                        break;
                                    }
                                }
                            }
                            
                            // Create new object structure (following wizard pattern)
                            const newObject: any = {
                                name: name,
                                parentObjectName: parentObjectName || "",
                                propSubscription: [],
                                modelPkg: [],
                                lookupItem: [],
                                isLookup: isLookup || "false"
                            };
                            
                            // Add codeDescription if provided
                            if (codeDescription) {
                                newObject.codeDescription = codeDescription;
                            }
                            
                            // If lookup object, add default lookup item
                            if (newObject.isLookup === "true") {
                                newObject.lookupItem = [
                                    {
                                        "description": "",
                                        "displayName": "",
                                        "isActive": "true",
                                        "name": "Unknown"
                                    }
                                ];
                            }
                            
                            // Add properties based on the parent
                            if (parentObjectName) {
                                const parentObjectIDProp: any = {
                                    name: parentObjectName + "ID",
                                    sqlServerDBDataType: "int",
                                    isFK: "true",
                                    isNotPublishedToSubscriptions: "true",
                                    isFKConstraintSuppressed: "false"
                                };
                                
                                if (newObject.isLookup === "true") {
                                    parentObjectIDProp.isFKLookup = "true";
                                }
                                
                                newObject.prop = [parentObjectIDProp];
                            } else {
                                newObject.prop = [];
                            }
                            
                            // Add the object to the namespace
                            model.namespace[targetNsIndex].object.push(newObject);
                            
                            // Mark that there are unsaved changes
                            modelService.markUnsavedChanges();
                            
                            // Refresh the tree view
                            setTimeout(() => {
                                try {
                                    require('vscode').commands.executeCommand("appdna.refresh");
                                } catch (e) {
                                    // Ignore errors if vscode commands not available
                                }
                            }, 100);
                            
                            this.outputChannel.appendLine(`[Data Bridge] Created data object: ${name}`);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({
                                success: true,
                                object: {
                                    name: newObject.name,
                                    parentObjectName: newObject.parentObjectName,
                                    isLookup: newObject.isLookup === "true",
                                    codeDescription: newObject.codeDescription || ""
                                },
                                message: `Data object "${name}" created successfully`
                            }));
                            
                        } catch (error) {
                            this.outputChannel.appendLine(`[Data Bridge] Error creating data object: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({
                                success: false,
                                error: error instanceof Error ? error.message : 'Invalid request body'
                            }));
                        }
                    });
                }
                else if (req.url === '/api/model') {
                    // Return the entire model
                    this.outputChannel.appendLine('[Data Bridge] Returning full model');
                    
                    res.writeHead(200);
                    res.end(JSON.stringify(model || {}));
                }
                else if (req.url === '/api/roles') {
                    // Get all roles from Role data object lookup items
                    const roles = new Set<string>();
                    
                    // Extract roles from Role data objects
                    const allObjects = modelService.getAllObjects();
                    allObjects.forEach((obj: any) => {
                        if (obj.name && obj.name.toLowerCase() === 'role') {
                            if (obj.lookupItem && Array.isArray(obj.lookupItem)) {
                                obj.lookupItem.forEach((lookupItem: any) => {
                                    if (lookupItem.name) {
                                        roles.add(lookupItem.name);
                                    }
                                });
                            }
                        }
                    });
                    
                    const rolesArray = Array.from(roles).sort();
                    
                    this.outputChannel.appendLine(`[Data Bridge] Returning ${rolesArray.length} roles`);
                    
                    res.writeHead(200);
                    res.end(JSON.stringify(rolesArray));
                }
                else if (req.method === 'POST' && req.url === '/api/user-stories') {
                    // Add a new user story with full validation
                    let body = '';
                    
                    req.on('data', chunk => {
                        body += chunk.toString();
                    });

                    req.on('end', async () => {
                        try {
                            const { storyText, storyNumber } = JSON.parse(body);
                            
                            if (!storyText) {
                                res.writeHead(400);
                                res.end(JSON.stringify({ 
                                    success: false,
                                    error: 'storyText is required'
                                }));
                                return;
                            }

                            // Get namespace
                            if (!model || !model.namespace || !Array.isArray(model.namespace) || model.namespace.length === 0) {
                                res.writeHead(400);
                                res.end(JSON.stringify({ 
                                    success: false,
                                    error: 'Model structure is invalid or namespace not found'
                                }));
                                return;
                            }

                            const namespace = model.namespace[0];
                            if (!namespace.userStory || !Array.isArray(namespace.userStory)) {
                                namespace.userStory = [];
                            }

                            // Validate user story using validation module
                            const validation = validateUserStory(storyText, modelService);
                            if (!validation.valid) {
                                res.writeHead(400);
                                res.end(JSON.stringify({ 
                                    success: false,
                                    error: validation.error
                                }));
                                return;
                            }

                            const roleName = validation.role!;
                            const dataObjects = validation.dataObjects || [];

                            // Check for duplicate
                            const existingStory = namespace.userStory.find((story: any) => story.storyText === storyText);
                            if (existingStory) {
                                res.writeHead(409);
                                res.end(JSON.stringify({ 
                                    success: false,
                                    error: 'Duplicate story text already exists'
                                }));
                                return;
                            }

                            // Generate GUID for name
                            const generateGuid = (): string => {
                                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                                    const r = Math.random() * 16 | 0;
                                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
                                    return v.toString(16);
                                });
                            };

                            // Create new story
                            const newStory = {
                                name: generateGuid(),
                                storyText: storyText,
                                ...(storyNumber ? { storyNumber } : {})
                            };

                            // Add to model
                            namespace.userStory.push(newStory);

                            // Mark unsaved changes
                            modelService.markUnsavedChanges();

                            this.outputChannel.appendLine(`[Data Bridge] User story created: ${newStory.name}`);
                            
                            res.writeHead(201);
                            res.end(JSON.stringify({ 
                                success: true,
                                story: newStory,
                                message: 'User story added successfully (unsaved changes)'
                            }));
                        } catch (error) {
                            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                            this.outputChannel.appendLine(`[Data Bridge] Error creating story: ${errorMessage}`);
                            
                            res.writeHead(500);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: errorMessage
                            }));
                        }
                    });
                }
                else if (req.url === '/api/health') {
                    // Health check endpoint
                    res.writeHead(200);
                    res.end(JSON.stringify({
                        status: 'healthy',
                        bridge: 'data',
                        port: this.dataPort,
                        modelLoaded: !!model
                    }));
                }
                else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ 
                        error: 'Not found',
                        availableEndpoints: [
                            'GET /api/user-stories',
                            'POST /api/user-stories',
                            'GET /api/objects',
                            'GET /api/data-objects',
                            'GET /api/roles',
                            'GET /api/model',
                            'GET /api/health'
                        ]
                    }));
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.outputChannel.appendLine(`[Data Bridge] Error: ${errorMessage}`);
                console.error('[Data Bridge] Error:', error);
                
                res.writeHead(500);
                res.end(JSON.stringify({ 
                    error: errorMessage
                }));
            }
        });

        this.dataServer.listen(this.dataPort, 'localhost', () => {
            this.outputChannel.appendLine(`[Data Bridge] Listening on http://localhost:${this.dataPort}`);
            console.log(`[Data Bridge] Listening on port ${this.dataPort}`);
        });

        this.dataServer.on('error', (error) => {
            this.outputChannel.appendLine(`[Data Bridge] Server error: ${error.message}`);
            console.error('[Data Bridge] Server error:', error);
        });
    }

    /**
     * Command Bridge - Executes commands for MCP
     * Port: 3002
     * Methods: POST
     */
    private startCommandBridge(context: vscode.ExtensionContext): void {
        this.commandServer = http.createServer((req, res) => {
            // Set CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            // Handle OPTIONS preflight
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            const logMessage = `[Command Bridge] ${req.method} ${req.url}`;
            this.outputChannel.appendLine(logMessage);
            console.log(logMessage);

            if (req.method === 'POST' && req.url === '/api/execute-command') {
                let body = '';
                
                req.on('data', chunk => {
                    body += chunk.toString();
                });

                req.on('end', async () => {
                    try {
                        const { command, args } = JSON.parse(body);
                        
                        this.outputChannel.appendLine(`[Command Bridge] Executing command: ${command}`);
                        if (args && args.length > 0) {
                            this.outputChannel.appendLine(`[Command Bridge] Arguments: ${JSON.stringify(args)}`);
                        }
                        console.log(`[Command Bridge] Executing: ${command}`, args);

                        // Execute the VS Code command
                        const result = await vscode.commands.executeCommand(command, ...(args || []));

                        const response = {
                            success: true,
                            command: command,
                            result: result,
                            message: `Command '${command}' executed successfully`
                        };

                        this.outputChannel.appendLine(`[Command Bridge] Command executed successfully`);
                        
                        res.writeHead(200);
                        res.end(JSON.stringify(response));
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        this.outputChannel.appendLine(`[Command Bridge] Error: ${errorMessage}`);
                        console.error('[Command Bridge] Error:', error);
                        
                        res.writeHead(500);
                        res.end(JSON.stringify({
                            success: false,
                            error: errorMessage
                        }));
                    }
                });
            } 
            else if (req.url === '/api/health') {
                // Health check endpoint
                res.writeHead(200);
                res.end(JSON.stringify({
                    status: 'healthy',
                    bridge: 'command',
                    port: this.commandPort
                }));
            }
            else {
                res.writeHead(404);
                res.end(JSON.stringify({ 
                    error: 'Not found',
                    availableEndpoints: [
                        'POST /api/execute-command',
                        'GET /api/health'
                    ]
                }));
            }
        });

        this.commandServer.listen(this.commandPort, 'localhost', () => {
            this.outputChannel.appendLine(`[Command Bridge] Listening on http://localhost:${this.commandPort}`);
            console.log(`[Command Bridge] Listening on port ${this.commandPort}`);
        });

        this.commandServer.on('error', (error) => {
            this.outputChannel.appendLine(`[Command Bridge] Server error: ${error.message}`);
            console.error('[Command Bridge] Server error:', error);
        });
    }

    /**
     * Stop both bridges
     */
    public stop(): void {
        if (this.dataServer) {
            this.dataServer.close();
            this.dataServer = null;
            this.outputChannel.appendLine('[Data Bridge] Stopped');
        }
        if (this.commandServer) {
            this.commandServer.close();
            this.commandServer = null;
            this.outputChannel.appendLine('[Command Bridge] Stopped');
        }
        console.log('[MCP Bridge] Stopped');
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        this.stop();
        this.outputChannel.dispose();
    }

}

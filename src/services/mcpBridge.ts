// mcpBridge.ts
// HTTP bridge for MCP server to access extension data and execute commands
// Created on: October 15, 2025
// This file implements both data bridge (port 3001) and command bridge (port 3002)

import * as http from 'http';
import * as vscode from 'vscode';
import { ModelService } from './modelService';
import { validateUserStory } from './validation/userStoryValidation';
import { getUsageDetailData, findAllDataObjectReferences } from '../commands/dataObjectUsageAnalysisCommands';

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
                    // Get all data objects with name, isLookup, parentObjectName, and codeDescription (summary only)
                    const objects = modelService.getAllObjects();
                    const dataObjects = objects.map((obj: any) => ({
                        name: obj.name || "",
                        isLookup: obj.isLookup === "true",
                        parentObjectName: obj.parentObjectName || null,
                        codeDescription: obj.codeDescription || "",
                        propCount: (obj.prop && Array.isArray(obj.prop)) ? obj.prop.length : 0
                    }));
                    
                    this.outputChannel.appendLine(`[Data Bridge] Returning ${dataObjects.length} data objects (summary)`);
                    
                    res.writeHead(200);
                    res.end(JSON.stringify(dataObjects));
                }
                else if (req.url === '/api/data-objects-full' && req.method === 'GET') {
                    // Get all data objects with full details (including prop array)
                    const objects = modelService.getAllObjects();
                    const fullDataObjects = objects.map((obj: any) => {
                        // Create a filtered copy of each data object
                        // Only include prop array if it has items, exclude propSubscription, modelPkg, and lookupItem
                        const filteredObject: any = {
                            name: obj.name || "",
                            parentObjectName: obj.parentObjectName || "",
                            isLookup: obj.isLookup || "false"
                        };
                        
                        // Add optional properties if they exist
                        if (obj.codeDescription) {
                            filteredObject.codeDescription = obj.codeDescription;
                        }
                        
                        // Add prop array only if it has items
                        if (obj.prop && Array.isArray(obj.prop) && obj.prop.length > 0) {
                            filteredObject.prop = obj.prop;
                        }
                        
                        return filteredObject;
                    });
                    
                    this.outputChannel.appendLine(`[Data Bridge] Returning ${fullDataObjects.length} data objects (full details)`);
                    
                    res.writeHead(200);
                    res.end(JSON.stringify(fullDataObjects));
                }
                else if (req.url && req.url.startsWith('/api/data-objects/') && req.method === 'GET') {
                    // Get a specific data object by name (complete details)
                    const objectName = decodeURIComponent(req.url.substring('/api/data-objects/'.length));
                    
                    try {
                        const objects = modelService.getAllObjects();
                        const dataObject = objects.find((obj: any) => obj.name === objectName);
                        
                        if (!dataObject) {
                            res.writeHead(404);
                            res.end(JSON.stringify({ 
                                error: `Data object "${objectName}" not found` 
                            }));
                            return;
                        }
                        
                        // Create a filtered copy of the data object
                        // Only include prop array if it has items, exclude propSubscription, modelPkg, and lookupItem
                        const filteredObject: any = {
                            name: dataObject.name || "",
                            parentObjectName: dataObject.parentObjectName || "",
                            isLookup: dataObject.isLookup || "false"
                        };
                        
                        // Add optional properties if they exist
                        if (dataObject.codeDescription) {
                            filteredObject.codeDescription = dataObject.codeDescription;
                        }
                        
                        // Add prop array only if it has items
                        if (dataObject.prop && Array.isArray(dataObject.prop) && dataObject.prop.length > 0) {
                            filteredObject.prop = dataObject.prop;
                        }
                        
                        this.outputChannel.appendLine(`[Data Bridge] Returning complete data object: ${objectName}`);
                        
                        res.writeHead(200);
                        res.end(JSON.stringify(filteredObject));
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        this.outputChannel.appendLine(`[Data Bridge] Error getting data object: ${errorMessage}`);
                        
                        res.writeHead(500);
                        res.end(JSON.stringify({ 
                            error: errorMessage 
                        }));
                    }
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
                else if (req.url === '/api/data-objects/update' && req.method === 'POST') {
                    // Update an existing data object
                    let body = '';
                    req.on('data', (chunk: Buffer) => {
                        body += chunk.toString();
                    });
                    
                    req.on('end', () => {
                        try {
                            const { name, codeDescription } = JSON.parse(body);
                            
                            // Validate required parameters
                            if (!name) {
                                throw new Error('Parameter "name" is required');
                            }
                            
                            if (codeDescription === undefined) {
                                throw new Error('Parameter "codeDescription" is required');
                            }
                            
                            // Get the current model
                            const model = modelService.getCurrentModel();
                            if (!model || !model.namespace) {
                                throw new Error("Failed to get current model");
                            }
                            
                            // Find the data object
                            let foundObject: any = null;
                            for (const ns of model.namespace) {
                                if (ns.object && Array.isArray(ns.object)) {
                                    foundObject = ns.object.find((obj: any) => obj.name === name);
                                    if (foundObject) {
                                        break;
                                    }
                                }
                            }
                            
                            if (!foundObject) {
                                throw new Error(`Data object "${name}" not found`);
                            }
                            
                            // Update the codeDescription
                            foundObject.codeDescription = codeDescription;
                            
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
                            
                            this.outputChannel.appendLine(`[Data Bridge] Updated data object: ${name}`);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({
                                success: true,
                                object: {
                                    name: foundObject.name,
                                    parentObjectName: foundObject.parentObjectName,
                                    isLookup: foundObject.isLookup === "true",
                                    codeDescription: foundObject.codeDescription || ""
                                },
                                message: `Data object "${name}" updated successfully`
                            }));
                            
                        } catch (error) {
                            this.outputChannel.appendLine(`[Data Bridge] Error updating data object: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({
                                success: false,
                                error: error instanceof Error ? error.message : 'Invalid request body'
                            }));
                        }
                    });
                }
                else if (req.url === '/api/data-objects/add-props' && req.method === 'POST') {
                    // Add properties to an existing data object
                    let body = '';
                    req.on('data', (chunk: Buffer) => {
                        body += chunk.toString();
                    });
                    
                    req.on('end', () => {
                        try {
                            const { objectName, props } = JSON.parse(body);
                            
                            // Validate required parameters
                            if (!objectName) {
                                throw new Error('Parameter "objectName" is required');
                            }
                            
                            if (!props || !Array.isArray(props) || props.length === 0) {
                                throw new Error('Parameter "props" must be a non-empty array');
                            }
                            
                            // Get the current model
                            const model = modelService.getCurrentModel();
                            if (!model || !model.namespace) {
                                throw new Error("Failed to get current model");
                            }
                            
                            // Find the data object
                            let foundObject: any = null;
                            for (const ns of model.namespace) {
                                if (ns.object && Array.isArray(ns.object)) {
                                    foundObject = ns.object.find((obj: any) => obj.name === objectName);
                                    if (foundObject) {
                                        break;
                                    }
                                }
                            }
                            
                            if (!foundObject) {
                                throw new Error(`Data object "${objectName}" not found`);
                            }
                            
                            // Initialize prop array if it doesn't exist
                            if (!foundObject.prop) {
                                foundObject.prop = [];
                            }
                            
                            // Check for duplicate property names
                            const existingPropNames = foundObject.prop.map((p: any) => p.name.toLowerCase());
                            const duplicates: string[] = [];
                            
                            props.forEach((newProp: any) => {
                                if (existingPropNames.includes(newProp.name.toLowerCase())) {
                                    duplicates.push(newProp.name);
                                }
                            });
                            
                            if (duplicates.length > 0) {
                                throw new Error(`Properties already exist: ${duplicates.join(', ')}`);
                            }
                            
                            // Add each property to the object
                            let addedCount = 0;
                            props.forEach((propDef: any) => {
                                // Create property object with only defined fields
                                const newProp: any = {
                                    name: propDef.name
                                };
                                
                                // Add optional fields only if provided
                                if (propDef.codeDescription !== undefined) { newProp.codeDescription = propDef.codeDescription; }
                                if (propDef.defaultValue !== undefined) { newProp.defaultValue = propDef.defaultValue; }
                                if (propDef.fkObjectName !== undefined) { newProp.fkObjectName = propDef.fkObjectName; }
                                if (propDef.fkObjectPropertyName !== undefined) { newProp.fkObjectPropertyName = propDef.fkObjectPropertyName; }
                                if (propDef.forceDBColumnIndex !== undefined) { newProp.forceDBColumnIndex = propDef.forceDBColumnIndex; }
                                if (propDef.isEncrypted !== undefined) { newProp.isEncrypted = propDef.isEncrypted; }
                                if (propDef.isFK !== undefined) { newProp.isFK = propDef.isFK; }
                                if (propDef.isFKConstraintSuppressed !== undefined) { newProp.isFKConstraintSuppressed = propDef.isFKConstraintSuppressed; }
                                if (propDef.isFKLookup !== undefined) { newProp.isFKLookup = propDef.isFKLookup; }
                                if (propDef.isNotPublishedToSubscriptions !== undefined) { newProp.isNotPublishedToSubscriptions = propDef.isNotPublishedToSubscriptions; }
                                if (propDef.isQueryByAvailable !== undefined) { newProp.isQueryByAvailable = propDef.isQueryByAvailable; }
                                if (propDef.labelText !== undefined) { newProp.labelText = propDef.labelText; }
                                if (propDef.sqlServerDBDataType !== undefined) { newProp.sqlServerDBDataType = propDef.sqlServerDBDataType; }
                                if (propDef.sqlServerDBDataTypeSize !== undefined) { newProp.sqlServerDBDataTypeSize = propDef.sqlServerDBDataTypeSize; }
                                
                                foundObject.prop.push(newProp);
                                addedCount++;
                            });
                            
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
                            
                            this.outputChannel.appendLine(`[Data Bridge] Added ${addedCount} properties to data object: ${objectName}`);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({
                                success: true,
                                object: {
                                    name: foundObject.name,
                                    parentObjectName: foundObject.parentObjectName,
                                    isLookup: foundObject.isLookup === "true",
                                    codeDescription: foundObject.codeDescription || "",
                                    propCount: foundObject.prop.length
                                },
                                addedCount,
                                message: `Added ${addedCount} ${addedCount === 1 ? 'property' : 'properties'} to "${objectName}"`
                            }));
                            
                        } catch (error) {
                            this.outputChannel.appendLine(`[Data Bridge] Error adding properties: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({
                                success: false,
                                error: error instanceof Error ? error.message : 'Invalid request body'
                            }));
                        }
                    });
                }
                else if (req.url === '/api/data-objects/update-prop' && req.method === 'POST') {
                    // Update an existing property in a data object
                    let body = '';
                    req.on('data', (chunk: Buffer) => {
                        body += chunk.toString();
                    });
                    
                    req.on('end', () => {
                        try {
                            const { objectName, propName, updateFields } = JSON.parse(body);
                            
                            // Validate required parameters
                            if (!objectName) {
                                throw new Error('Parameter "objectName" is required');
                            }
                            
                            if (!propName) {
                                throw new Error('Parameter "propName" is required');
                            }
                            
                            if (!updateFields || typeof updateFields !== 'object' || Object.keys(updateFields).length === 0) {
                                throw new Error('Parameter "updateFields" must be a non-empty object');
                            }
                            
                            // Get the current model
                            const model = modelService.getCurrentModel();
                            if (!model || !model.namespace) {
                                throw new Error("Failed to get current model");
                            }
                            
                            // Find the data object
                            let foundObject: any = null;
                            for (const ns of model.namespace) {
                                if (ns.object && Array.isArray(ns.object)) {
                                    foundObject = ns.object.find((obj: any) => obj.name === objectName);
                                    if (foundObject) {
                                        break;
                                    }
                                }
                            }
                            
                            if (!foundObject) {
                                throw new Error(`Data object "${objectName}" not found`);
                            }
                            
                            if (!foundObject.prop || !Array.isArray(foundObject.prop)) {
                                throw new Error(`Data object "${objectName}" has no properties`);
                            }
                            
                            // Find the property (case-sensitive match)
                            const propIndex = foundObject.prop.findIndex((p: any) => p.name === propName);
                            
                            if (propIndex === -1) {
                                const availableProps = foundObject.prop.map((p: any) => p.name).join(', ');
                                throw new Error(`Property "${propName}" not found in object "${objectName}". Available properties: ${availableProps}`);
                            }
                            
                            const property = foundObject.prop[propIndex];
                            
                            // Update the property fields
                            Object.keys(updateFields).forEach(key => {
                                property[key] = updateFields[key];
                            });
                            
                            // Validate FK requirements
                            if (property.isFK === 'true' && !property.fkObjectName) {
                                throw new Error('fkObjectName is required when isFK is "true"');
                            }
                            
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
                            
                            this.outputChannel.appendLine(`[Data Bridge] Updated property "${propName}" in data object: ${objectName}`);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({
                                success: true,
                                property: property,
                                message: `Property "${propName}" updated successfully in "${objectName}"`
                            }));
                            
                        } catch (error) {
                            this.outputChannel.appendLine(`[Data Bridge] Error updating property: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
                    const roles: any[] = [];
                    
                    // Extract roles from Role data objects
                    const allObjects = modelService.getAllObjects();
                    allObjects.forEach((obj: any) => {
                        if (obj.name && obj.name.toLowerCase() === 'role') {
                            if (obj.lookupItem && Array.isArray(obj.lookupItem)) {
                                obj.lookupItem.forEach((lookupItem: any) => {
                                    if (lookupItem.name) {
                                        roles.push({
                                            name: lookupItem.name,
                                            displayName: lookupItem.displayName || '',
                                            description: lookupItem.description || '',
                                            isActive: lookupItem.isActive || 'true'
                                        });
                                    }
                                });
                            }
                        }
                    });
                    
                    // Sort by name
                    roles.sort((a, b) => a.name.localeCompare(b.name));
                    
                    this.outputChannel.appendLine(`[Data Bridge] Returning ${roles.length} roles`);
                    
                    res.writeHead(200);
                    res.end(JSON.stringify(roles));
                }
                else if (req.url === '/api/data-object-usage' && req.method === 'GET') {
                    // Get detailed usage data for all data objects
                    try {
                        const usageData = getUsageDetailData(modelService);
                        
                        this.outputChannel.appendLine(`[Data Bridge] Returning ${usageData.length} data object usage references`);
                        
                        res.writeHead(200);
                        res.end(JSON.stringify(usageData));
                    } catch (error) {
                        this.outputChannel.appendLine(`[Data Bridge] Error getting usage data: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        res.writeHead(500);
                        res.end(JSON.stringify({
                            error: error instanceof Error ? error.message : 'Failed to get usage data'
                        }));
                    }
                }
                else if (req.url && req.url.startsWith('/api/data-object-usage/') && req.method === 'GET') {
                    // Get usage data for a specific data object
                    const objectName = decodeURIComponent(req.url.substring('/api/data-object-usage/'.length));
                    
                    try {
                        const references = findAllDataObjectReferences(objectName, modelService);
                        const usageData = references.map(ref => ({
                            dataObjectName: objectName,
                            referenceType: ref.type,
                            referencedBy: ref.referencedBy,
                            itemType: ref.itemType
                        }));
                        
                        this.outputChannel.appendLine(`[Data Bridge] Returning ${usageData.length} usage references for "${objectName}"`);
                        
                        res.writeHead(200);
                        res.end(JSON.stringify(usageData));
                    } catch (error) {
                        this.outputChannel.appendLine(`[Data Bridge] Error getting usage data for "${objectName}": ${error instanceof Error ? error.message : 'Unknown error'}`);
                        res.writeHead(500);
                        res.end(JSON.stringify({
                            error: error instanceof Error ? error.message : 'Failed to get usage data'
                        }));
                    }
                }
                else if (req.url && req.url.startsWith('/api/pages')) {
                    // Get all pages with optional filtering
                    try {
                        // Parse query parameters if present
                        const url = new URL(req.url, `http://${req.headers.host}`);
                        const filters: any = {};
                        
                        const pageName = url.searchParams.get('page_name');
                        const pageType = url.searchParams.get('page_type');
                        const ownerObject = url.searchParams.get('owner_object');
                        const targetChildObject = url.searchParams.get('target_child_object');
                        const roleRequired = url.searchParams.get('role_required');
                        
                        if (pageName) { filters.pageName = pageName; }
                        if (pageType) { filters.pageType = pageType; }
                        if (ownerObject) { filters.ownerObject = ownerObject; }
                        if (targetChildObject) { filters.targetChildObject = targetChildObject; }
                        if (roleRequired) { filters.roleRequired = roleRequired; }
                        
                        // Use ModelService's new getPagesWithDetails method
                        const pages = modelService.getPagesWithDetails(Object.keys(filters).length > 0 ? filters : undefined);
                        
                        this.outputChannel.appendLine(`[Data Bridge] Returning ${pages.length} pages (filtered: ${Object.keys(filters).length > 0})`);
                        
                        res.writeHead(200);
                        res.end(JSON.stringify(pages));
                    } catch (error) {
                        this.outputChannel.appendLine(`[Data Bridge] Error getting pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        res.writeHead(500);
                        res.end(JSON.stringify({
                            error: error instanceof Error ? error.message : 'Failed to get pages'
                        }));
                    }
                }
                else if (req.url && req.url.startsWith('/api/forms')) {
                    // Get forms (objectWorkflow) with optional filtering by form_name or owner_object_name (case-insensitive)
                    try {
                        const url = new URL(req.url, `http://${req.headers.host}`);
                        const formName = url.searchParams.get('form_name');
                        const ownerObjectName = url.searchParams.get('owner_object_name');
                        
                        const allObjects = modelService.getAllObjects();
                        const forms: any[] = [];
                        
                        for (const obj of allObjects) {
                            // Skip if owner_object_name filter specified and doesn't match (case-insensitive)
                            if (ownerObjectName && obj.name.toLowerCase() !== ownerObjectName.toLowerCase()) {
                                continue;
                            }
                            
                            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                                for (const workflow of obj.objectWorkflow) {
                                    // Skip if form_name filter specified and doesn't match (case-insensitive)
                                    if (formName && workflow.name.toLowerCase() !== formName.toLowerCase()) {
                                        continue;
                                    }
                                    
                                    // Add owner object name to each form for context
                                    forms.push({
                                        ...workflow,
                                        _ownerObjectName: obj.name
                                    });
                                    
                                    // If searching for specific form name, we can stop after finding it
                                    if (formName && workflow.name.toLowerCase() === formName.toLowerCase()) {
                                        this.outputChannel.appendLine(`[Data Bridge] Found form "${workflow.name}" in owner object "${obj.name}"`);
                                        res.writeHead(200);
                                        res.end(JSON.stringify(forms));
                                        return;
                                    }
                                }
                            }
                        }
                        
                        this.outputChannel.appendLine(`[Data Bridge] Returning ${forms.length} forms`);
                        res.writeHead(200);
                        res.end(JSON.stringify(forms));
                    } catch (error) {
                        this.outputChannel.appendLine(`[Data Bridge] Error getting forms: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        res.writeHead(500);
                        res.end(JSON.stringify({
                            error: error instanceof Error ? error.message : 'Failed to get forms'
                        }));
                    }
                }
                else if (req.url === '/api/create-form' && req.method === 'POST') {
                    // Create a new form (objectWorkflow) in an owner data object
                    let body = '';
                    
                    req.on('data', (chunk: any) => {
                        body += chunk.toString();
                    });
                    
                    req.on('end', () => {
                        try {
                            const { ownerObjectName, form, pageInitFlow } = JSON.parse(body);
                            
                            // Get the current model
                            const model = modelService.getCurrentModel();
                            if (!model) {
                                throw new Error("Failed to get current model");
                            }
                            
                            // Find the owner object
                            if (!model.namespace || !Array.isArray(model.namespace)) {
                                throw new Error("Invalid model structure");
                            }
                            
                            let ownerObject: any = null;
                            for (const ns of model.namespace) {
                                if (ns.object && Array.isArray(ns.object)) {
                                    ownerObject = ns.object.find((obj: any) => obj.name === ownerObjectName);
                                    if (ownerObject) {
                                        break;
                                    }
                                }
                            }
                            
                            if (!ownerObject) {
                                throw new Error(`Owner object "${ownerObjectName}" not found`);
                            }
                            
                            // Ensure objectWorkflow array exists
                            if (!ownerObject.objectWorkflow) {
                                ownerObject.objectWorkflow = [];
                            }
                            
                            // Add form and page init flow
                            ownerObject.objectWorkflow.push(form);
                            ownerObject.objectWorkflow.push(pageInitFlow);
                            
                            // Mark model as having unsaved changes
                            modelService.markUnsavedChanges();
                            
                            this.outputChannel.appendLine(`[Data Bridge] Created form "${form.name}" and page init flow "${pageInitFlow.name}" in owner object "${ownerObjectName}"`);
                            
                            res.writeHead(200);
                            res.end(JSON.stringify({
                                success: true,
                                form: form,
                                pageInitFlow: pageInitFlow,
                                ownerObjectName: ownerObjectName
                            }));
                            
                        } catch (error) {
                            this.outputChannel.appendLine(`[Data Bridge] Error creating form: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            res.writeHead(500);
                            res.end(JSON.stringify({
                                error: error instanceof Error ? error.message : 'Failed to create form'
                            }));
                        }
                    });
                }
                else if (req.url === '/api/update-form' && req.method === 'POST') {
                    // Update an existing form (objectWorkflow)
                    let body = '';
                    
                    req.on('data', (chunk: any) => {
                        body += chunk.toString();
                    });
                    
                    req.on('end', () => {
                        try {
                            const { form_name, updates } = JSON.parse(body);
                            
                            if (!form_name) {
                                throw new Error('form_name is required');
                            }
                            
                            if (!updates || Object.keys(updates).length === 0) {
                                throw new Error('At least one property to update is required');
                            }
                            
                            // Get the current model
                            const model = modelService.getCurrentModel();
                            if (!model) {
                                throw new Error("Failed to get current model");
                            }
                            
                            // Find the form across all objects (case-sensitive exact match)
                            if (!model.namespace || !Array.isArray(model.namespace)) {
                                throw new Error("Invalid model structure");
                            }
                            
                            let foundForm: any = null;
                            let ownerObjectName: string = '';
                            
                            for (const ns of model.namespace) {
                                if (ns.object && Array.isArray(ns.object)) {
                                    for (const obj of ns.object) {
                                        if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                                            const form = obj.objectWorkflow.find((wf: any) => wf.name === form_name);
                                            if (form) {
                                                foundForm = form;
                                                ownerObjectName = obj.name;
                                                break;
                                            }
                                        }
                                    }
                                    if (foundForm) {
                                        break;
                                    }
                                }
                            }
                            
                            if (!foundForm) {
                                throw new Error(`Form "${form_name}" not found in any data object`);
                            }
                            
                            // Update the form properties
                            for (const [key, value] of Object.entries(updates)) {
                                foundForm[key] = value;
                            }
                            
                            // Mark model as having unsaved changes
                            modelService.markUnsavedChanges();
                            
                            this.outputChannel.appendLine(`[Data Bridge] Updated form "${form_name}" in owner object "${ownerObjectName}"`);
                            
                            res.writeHead(200);
                            res.end(JSON.stringify({
                                success: true,
                                form: foundForm,
                                owner_object_name: ownerObjectName
                            }));
                            
                        } catch (error) {
                            this.outputChannel.appendLine(`[Data Bridge] Error updating form: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            res.writeHead(500);
                            res.end(JSON.stringify({
                                success: false,
                                error: error instanceof Error ? error.message : 'Failed to update form'
                            }));
                        }
                    });
                }
                else if (req.url === '/api/add-form-param' && req.method === 'POST') {
                    // Add a new parameter to an existing form
                    let body = '';
                    
                    req.on('data', (chunk: any) => {
                        body += chunk.toString();
                    });
                    
                    req.on('end', () => {
                        try {
                            const { form_name, param } = JSON.parse(body);
                            
                            if (!form_name) {
                                throw new Error('form_name is required');
                            }
                            
                            if (!param || !param.name) {
                                throw new Error('param with name property is required');
                            }
                            
                            // Get the current model
                            const model = modelService.getCurrentModel();
                            if (!model) {
                                throw new Error("Failed to get current model");
                            }
                            
                            // Find the form across all objects (case-sensitive exact match)
                            if (!model.namespace || !Array.isArray(model.namespace)) {
                                throw new Error("Invalid model structure");
                            }
                            
                            let foundForm: any = null;
                            let ownerObjectName: string = '';
                            
                            for (const ns of model.namespace) {
                                if (ns.object && Array.isArray(ns.object)) {
                                    for (const obj of ns.object) {
                                        if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                                            const form = obj.objectWorkflow.find((wf: any) => wf.name === form_name);
                                            if (form) {
                                                foundForm = form;
                                                ownerObjectName = obj.name;
                                                break;
                                            }
                                        }
                                    }
                                    if (foundForm) {
                                        break;
                                    }
                                }
                            }
                            
                            if (!foundForm) {
                                throw new Error(`Form "${form_name}" not found in any data object`);
                            }
                            
                            // Ensure objectWorkflowParam array exists
                            if (!foundForm.objectWorkflowParam) {
                                foundForm.objectWorkflowParam = [];
                            }
                            
                            // Check for duplicate parameter name
                            const existingParam = foundForm.objectWorkflowParam.find((p: any) => p.name === param.name);
                            if (existingParam) {
                                throw new Error(`Parameter "${param.name}" already exists in form "${form_name}"`);
                            }
                            
                            // Add the parameter
                            foundForm.objectWorkflowParam.push(param);
                            
                            // Mark model as having unsaved changes
                            modelService.markUnsavedChanges();
                            
                            this.outputChannel.appendLine(`[Data Bridge] Added parameter "${param.name}" to form "${form_name}" in owner object "${ownerObjectName}"`);
                            
                            res.writeHead(200);
                            res.end(JSON.stringify({
                                success: true,
                                param: param,
                                owner_object_name: ownerObjectName
                            }));
                            
                        } catch (error) {
                            this.outputChannel.appendLine(`[Data Bridge] Error adding form parameter: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            res.writeHead(500);
                            res.end(JSON.stringify({
                                success: false,
                                error: error instanceof Error ? error.message : 'Failed to add form parameter'
                            }));
                        }
                    });
                }
                else if (req.url === '/api/update-form-param' && req.method === 'POST') {
                    // Update an existing parameter in a form
                    let body = '';
                    
                    req.on('data', (chunk: any) => {
                        body += chunk.toString();
                    });
                    
                    req.on('end', () => {
                        try {
                            const { form_name, param_name, updates } = JSON.parse(body);
                            
                            if (!form_name) {
                                throw new Error('form_name is required');
                            }
                            
                            if (!param_name) {
                                throw new Error('param_name is required');
                            }
                            
                            if (!updates || Object.keys(updates).length === 0) {
                                throw new Error('At least one property to update is required');
                            }
                            
                            // Get the current model
                            const model = modelService.getCurrentModel();
                            if (!model) {
                                throw new Error("Failed to get current model");
                            }
                            
                            // Find the form across all objects (case-sensitive exact match)
                            if (!model.namespace || !Array.isArray(model.namespace)) {
                                throw new Error("Invalid model structure");
                            }
                            
                            let foundForm: any = null;
                            let ownerObjectName: string = '';
                            
                            for (const ns of model.namespace) {
                                if (ns.object && Array.isArray(ns.object)) {
                                    for (const obj of ns.object) {
                                        if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                                            const form = obj.objectWorkflow.find((wf: any) => wf.name === form_name);
                                            if (form) {
                                                foundForm = form;
                                                ownerObjectName = obj.name;
                                                break;
                                            }
                                        }
                                    }
                                    if (foundForm) {
                                        break;
                                    }
                                }
                            }
                            
                            if (!foundForm) {
                                throw new Error(`Form "${form_name}" not found in any data object`);
                            }
                            
                            // Find the parameter
                            if (!foundForm.objectWorkflowParam || !Array.isArray(foundForm.objectWorkflowParam)) {
                                throw new Error(`Form "${form_name}" has no parameters`);
                            }
                            
                            const foundParam = foundForm.objectWorkflowParam.find((p: any) => p.name === param_name);
                            if (!foundParam) {
                                throw new Error(`Parameter "${param_name}" not found in form "${form_name}"`);
                            }
                            
                            // Update the parameter properties
                            for (const [key, value] of Object.entries(updates)) {
                                foundParam[key] = value;
                            }
                            
                            // Mark model as having unsaved changes
                            modelService.markUnsavedChanges();
                            
                            this.outputChannel.appendLine(`[Data Bridge] Updated parameter "${param_name}" in form "${form_name}" in owner object "${ownerObjectName}"`);
                            
                            res.writeHead(200);
                            res.end(JSON.stringify({
                                success: true,
                                param: foundParam,
                                owner_object_name: ownerObjectName
                            }));
                            
                        } catch (error) {
                            this.outputChannel.appendLine(`[Data Bridge] Error updating form parameter: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            res.writeHead(500);
                            res.end(JSON.stringify({
                                success: false,
                                error: error instanceof Error ? error.message : 'Failed to update form parameter'
                            }));
                        }
                    });
                }
                else if (req.url?.startsWith('/api/lookup-values?')) {
                    // Get all lookup values from a specific lookup data object
                    // Extract lookupObjectName from query string
                    const url = new URL(req.url, `http://${req.headers.host}`);
                    const lookupObjectName = url.searchParams.get('lookupObjectName');
                    
                    if (!lookupObjectName) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: false,
                            error: 'lookupObjectName query parameter is required'
                        }));
                        return;
                    }

                    const lookupValues: any[] = [];
                    
                    // Find the lookup data object by exact name (case-sensitive)
                    const allObjects = modelService.getAllObjects();
                    const lookupObject = allObjects.find((obj: any) => obj.name === lookupObjectName);
                    
                    if (!lookupObject) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: false,
                            error: `Lookup object "${lookupObjectName}" not found`
                        }));
                        return;
                    }

                    // Verify it's a lookup object
                    if (lookupObject.isLookup !== 'true') {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: false,
                            error: `Object "${lookupObjectName}" is not a lookup object (isLookup must be "true")`
                        }));
                        return;
                    }

                    // Extract lookup items
                    if (lookupObject.lookupItem && Array.isArray(lookupObject.lookupItem)) {
                        lookupObject.lookupItem.forEach((item: any) => {
                            if (item.name) {
                                lookupValues.push({
                                    name: item.name,
                                    displayName: item.displayName || '',
                                    description: item.description || '',
                                    isActive: item.isActive || 'true'
                                });
                            }
                        });
                    }
                    
                    // Sort by name
                    lookupValues.sort((a, b) => a.name.localeCompare(b.name));
                    
                    this.outputChannel.appendLine(`[Data Bridge] Returning ${lookupValues.length} lookup values from ${lookupObjectName}`);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(lookupValues));
                }
                else if (req.method === 'POST' && req.url === '/api/roles') {
                    // Add a new role to the Role data object
                    let body = '';
                    
                    req.on('data', (chunk: any) => {
                        body += chunk.toString();
                    });
                    
                    req.on('end', () => {
                        try {
                            const { name } = JSON.parse(body);
                            
                            // Get the current model
                            const model = modelService.getCurrentModel();
                            if (!model) {
                                throw new Error("Failed to get current model");
                            }
                            
                            // Find the Role data object
                            let roleObject: any = null;
                            let targetNsIndex = 0;
                            
                            if (model.namespace && Array.isArray(model.namespace)) {
                                for (let i = 0; i < model.namespace.length; i++) {
                                    const ns = model.namespace[i];
                                    if (ns.object && Array.isArray(ns.object)) {
                                        const foundRole = ns.object.find((obj: any) => 
                                            obj.name && obj.name.toLowerCase() === 'role'
                                        );
                                        if (foundRole) {
                                            roleObject = foundRole;
                                            targetNsIndex = i;
                                            break;
                                        }
                                    }
                                }
                            }
                            
                            // If Role object doesn't exist, return error
                            if (!roleObject) {
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({
                                    success: false,
                                    error: 'Role data object not found in model. Please create a "Role" lookup object first.'
                                }));
                                return;
                            }
                            
                            // Initialize lookupItem array if it doesn't exist
                            if (!roleObject.lookupItem) {
                                roleObject.lookupItem = [];
                            }
                            
                            // Create new lookup item for the role
                            const newLookupItem: any = {
                                name: name,
                                displayName: this.generateDisplayText(name),
                                description: this.generateDisplayText(name),
                                isActive: "true"
                            };
                            
                            // Add the lookup item to the Role object
                            roleObject.lookupItem.push(newLookupItem);
                            
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
                            
                            this.outputChannel.appendLine(`[Data Bridge] Added role: ${name}`);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({
                                success: true,
                                role: {
                                    name: newLookupItem.name,
                                    displayName: newLookupItem.displayName,
                                    description: newLookupItem.description,
                                    isActive: newLookupItem.isActive
                                },
                                message: `Role "${name}" added successfully`
                            }));
                            
                        } catch (error) {
                            this.outputChannel.appendLine(`[Data Bridge] Error adding role: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({
                                success: false,
                                error: error instanceof Error ? error.message : 'Invalid request body'
                            }));
                        }
                    });
                }
                else if (req.method === 'POST' && req.url === '/api/roles/update') {
                    // Update an existing role in the Role data object
                    let body = '';
                    
                    req.on('data', (chunk: any) => {
                        body += chunk.toString();
                    });
                    
                    req.on('end', () => {
                        try {
                            const { name, displayName, description, isActive } = JSON.parse(body);
                            
                            // Get the current model
                            const model = modelService.getCurrentModel();
                            if (!model) {
                                throw new Error("Failed to get current model");
                            }
                            
                            // Find the Role data object and the specific lookup item
                            let roleObject: any = null;
                            let lookupItem: any = null;
                            
                            if (model.namespace && Array.isArray(model.namespace)) {
                                for (let i = 0; i < model.namespace.length; i++) {
                                    const ns = model.namespace[i];
                                    if (ns.object && Array.isArray(ns.object)) {
                                        const foundRole = ns.object.find((obj: any) => 
                                            obj.name && obj.name.toLowerCase() === 'role'
                                        );
                                        if (foundRole) {
                                            roleObject = foundRole;
                                            // Find the specific lookup item by name
                                            if (roleObject.lookupItem && Array.isArray(roleObject.lookupItem)) {
                                                lookupItem = roleObject.lookupItem.find((item: any) => 
                                                    item.name === name
                                                );
                                            }
                                            break;
                                        }
                                    }
                                }
                            }
                            
                            // If Role object doesn't exist, return error
                            if (!roleObject) {
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({
                                    success: false,
                                    error: 'Role data object not found in model.'
                                }));
                                return;
                            }
                            
                            // If lookup item doesn't exist, return error
                            if (!lookupItem) {
                                res.writeHead(404, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({
                                    success: false,
                                    error: `Role "${name}" not found.`
                                }));
                                return;
                            }
                            
                            // Update the lookup item properties
                            if (displayName !== undefined) {
                                lookupItem.displayName = displayName;
                            }
                            if (description !== undefined) {
                                lookupItem.description = description;
                            }
                            if (isActive !== undefined) {
                                lookupItem.isActive = isActive;
                            }
                            
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
                            
                            this.outputChannel.appendLine(`[Data Bridge] Updated role: ${name}`);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({
                                success: true,
                                role: {
                                    name: lookupItem.name,
                                    displayName: lookupItem.displayName,
                                    description: lookupItem.description,
                                    isActive: lookupItem.isActive
                                },
                                message: `Role "${name}" updated successfully`
                            }));
                            
                        } catch (error) {
                            this.outputChannel.appendLine(`[Data Bridge] Error updating role: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({
                                success: false,
                                error: error instanceof Error ? error.message : 'Invalid request body'
                            }));
                        }
                    });
                }
                else if (req.method === 'POST' && req.url === '/api/lookup-values/update') {
                    // Update an existing lookup value in any lookup data object
                    let body = '';
                    
                    req.on('data', (chunk: any) => {
                        body += chunk.toString();
                    });
                    
                    req.on('end', () => {
                        try {
                            const { lookupObjectName, name, displayName, description, isActive } = JSON.parse(body);
                            
                            // Get the current model
                            const model = modelService.getCurrentModel();
                            if (!model) {
                                throw new Error("Failed to get current model");
                            }
                            
                            // Find the specified lookup data object and the specific lookup item
                            let lookupObject: any = null;
                            let lookupItem: any = null;
                            
                            if (model.namespace && Array.isArray(model.namespace)) {
                                for (let i = 0; i < model.namespace.length; i++) {
                                    const ns = model.namespace[i];
                                    if (ns.object && Array.isArray(ns.object)) {
                                        const foundObject = ns.object.find((obj: any) => 
                                            obj.name === lookupObjectName
                                        );
                                        if (foundObject) {
                                            lookupObject = foundObject;
                                            // Find the specific lookup item by name (case-sensitive)
                                            if (lookupObject.lookupItem && Array.isArray(lookupObject.lookupItem)) {
                                                lookupItem = lookupObject.lookupItem.find((item: any) => 
                                                    item.name === name
                                                );
                                            }
                                            break;
                                        }
                                    }
                                }
                            }
                            
                            // If lookup object doesn't exist, return error
                            if (!lookupObject) {
                                res.writeHead(404, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({
                                    success: false,
                                    error: `Lookup object "${lookupObjectName}" not found in model.`
                                }));
                                return;
                            }
                            
                            // Verify it's a lookup object
                            if (lookupObject.isLookup !== 'true') {
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({
                                    success: false,
                                    error: `Object "${lookupObjectName}" is not a lookup object (isLookup must be "true").`
                                }));
                                return;
                            }
                            
                            // If lookup item doesn't exist, return error
                            if (!lookupItem) {
                                res.writeHead(404, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({
                                    success: false,
                                    error: `Lookup value "${name}" not found in ${lookupObjectName}.`
                                }));
                                return;
                            }
                            
                            // Update the lookup item properties
                            if (displayName !== undefined) {
                                lookupItem.displayName = displayName;
                            }
                            if (description !== undefined) {
                                lookupItem.description = description;
                            }
                            if (isActive !== undefined) {
                                lookupItem.isActive = isActive;
                            }
                            
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
                            
                            this.outputChannel.appendLine(`[Data Bridge] Updated lookup value: ${name} in ${lookupObjectName}`);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({
                                success: true,
                                lookupValue: {
                                    name: lookupItem.name,
                                    displayName: lookupItem.displayName,
                                    description: lookupItem.description,
                                    isActive: lookupItem.isActive
                                },
                                message: `Lookup value "${name}" updated successfully in ${lookupObjectName}`
                            }));
                            
                        } catch (error) {
                            this.outputChannel.appendLine(`[Data Bridge] Error updating lookup value: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({
                                success: false,
                                error: error instanceof Error ? error.message : 'Invalid request body'
                            }));
                        }
                    });
                }
                else if (req.method === 'POST' && req.url === '/api/lookup-values') {
                    // Add a new lookup value to any lookup data object
                    let body = '';
                    
                    req.on('data', (chunk: any) => {
                        body += chunk.toString();
                    });
                    
                    req.on('end', () => {
                        try {
                            const { lookupObjectName, name, displayName, description, isActive } = JSON.parse(body);
                            
                            // Get the current model
                            const model = modelService.getCurrentModel();
                            if (!model) {
                                throw new Error("Failed to get current model");
                            }
                            
                            // Find the specified lookup data object
                            let lookupObject: any = null;
                            let targetNsIndex = 0;
                            
                            if (model.namespace && Array.isArray(model.namespace)) {
                                for (let i = 0; i < model.namespace.length; i++) {
                                    const ns = model.namespace[i];
                                    if (ns.object && Array.isArray(ns.object)) {
                                        const foundObject = ns.object.find((obj: any) => 
                                            obj.name === lookupObjectName
                                        );
                                        if (foundObject) {
                                            lookupObject = foundObject;
                                            targetNsIndex = i;
                                            break;
                                        }
                                    }
                                }
                            }
                            
                            // If lookup object doesn't exist, return error
                            if (!lookupObject) {
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({
                                    success: false,
                                    error: `Lookup data object "${lookupObjectName}" not found in model. Please use exact case-sensitive name.`
                                }));
                                return;
                            }
                            
                            // Verify it's a lookup object
                            if (lookupObject.isLookup !== 'true') {
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({
                                    success: false,
                                    error: `Data object "${lookupObjectName}" is not a lookup object (isLookup must be "true").`
                                }));
                                return;
                            }
                            
                            // Initialize lookupItem array if it doesn't exist
                            if (!lookupObject.lookupItem) {
                                lookupObject.lookupItem = [];
                            }
                            
                            // Check for duplicate lookup item name
                            const duplicateExists = lookupObject.lookupItem.some((item: any) => 
                                item.name && item.name.toLowerCase() === name.toLowerCase()
                            );
                            
                            if (duplicateExists) {
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({
                                    success: false,
                                    error: `A lookup value with name "${name}" already exists in "${lookupObjectName}".`
                                }));
                                return;
                            }
                            
                            // Create new lookup item
                            const newLookupItem: any = {
                                name: name,
                                displayName: displayName || this.generateDisplayText(name),
                                description: description || this.generateDisplayText(name),
                                isActive: isActive || "true"
                            };
                            
                            // Add the lookup item to the object
                            lookupObject.lookupItem.push(newLookupItem);
                            
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
                            
                            this.outputChannel.appendLine(`[Data Bridge] Added lookup value "${name}" to ${lookupObjectName}`);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({
                                success: true,
                                lookupValue: {
                                    name: newLookupItem.name,
                                    displayName: newLookupItem.displayName,
                                    description: newLookupItem.description,
                                    isActive: newLookupItem.isActive
                                },
                                message: `Lookup value "${name}" added successfully to "${lookupObjectName}"`
                            }));
                            
                        } catch (error) {
                            this.outputChannel.appendLine(`[Data Bridge] Error adding lookup value: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({
                                success: false,
                                error: error instanceof Error ? error.message : 'Invalid request body'
                            }));
                        }
                    });
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
                else if (req.method === 'POST' && req.url === '/api/user-stories/update') {
                    // Update an existing user story (isIgnored property only)
                    let body = '';
                    
                    req.on('data', chunk => {
                        body += chunk.toString();
                    });

                    req.on('end', async () => {
                        try {
                            const { name, isIgnored } = JSON.parse(body);
                            
                            if (!name) {
                                res.writeHead(400);
                                res.end(JSON.stringify({ 
                                    success: false,
                                    error: 'name is required to identify the user story'
                                }));
                                return;
                            }

                            if (isIgnored === undefined) {
                                res.writeHead(400);
                                res.end(JSON.stringify({ 
                                    success: false,
                                    error: 'isIgnored is required. Story text cannot be changed.'
                                }));
                                return;
                            }

                            if (isIgnored !== 'true' && isIgnored !== 'false') {
                                res.writeHead(400);
                                res.end(JSON.stringify({ 
                                    success: false,
                                    error: 'isIgnored must be "true" or "false"'
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
                                res.writeHead(404);
                                res.end(JSON.stringify({ 
                                    success: false,
                                    error: 'No user stories found in model'
                                }));
                                return;
                            }

                            // Find the user story by name
                            const storyToUpdate = namespace.userStory.find((story: any) => story.name === name);
                            
                            if (!storyToUpdate) {
                                res.writeHead(404);
                                res.end(JSON.stringify({ 
                                    success: false,
                                    error: `User story with name "${name}" not found`
                                }));
                                return;
                            }

                            // Update isIgnored property only
                            storyToUpdate.isIgnored = isIgnored;

                            // Mark unsaved changes and refresh tree view
                            modelService.markUnsavedChanges();
                            
                            // Refresh the tree view
                            setTimeout(() => {
                                try {
                                    require('vscode').commands.executeCommand("appdna.refresh");
                                } catch (e) {
                                    // Ignore errors if vscode commands not available
                                }
                            }, 100);

                            this.outputChannel.appendLine(`[Data Bridge] User story updated: ${name}`);
                            
                            res.writeHead(200);
                            res.end(JSON.stringify({ 
                                success: true,
                                story: storyToUpdate,
                                message: 'User story updated successfully (unsaved changes)'
                            }));
                        } catch (error) {
                            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                            this.outputChannel.appendLine(`[Data Bridge] Error updating user story: ${errorMessage}`);
                            
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
                            'POST /api/user-stories/update',
                            'GET /api/objects',
                            'GET /api/data-objects',
                            'GET /api/data-objects-full',
                            'GET /api/data-objects/:name',
                            'GET /api/data-object-usage',
                            'GET /api/data-object-usage/:name',
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
                        const requestData = JSON.parse(body);
                        const { command, args, featureName, version } = requestData;
                        
                        // Handle special MCP commands
                        if (command === 'select_model_feature') {
                            this.outputChannel.appendLine(`[Command Bridge] Selecting model feature: ${featureName} v${version}`);
                            
                            const modelService = ModelService.getInstance();
                            if (!modelService || !modelService.isFileLoaded()) {
                                res.writeHead(400);
                                res.end(JSON.stringify({
                                    success: false,
                                    error: 'No model file is loaded. Please load a model file first.',
                                    featureName: featureName,
                                    version: version
                                }));
                                return;
                            }
                            
                            const rootModel = modelService.getCurrentModel();
                            if (!rootModel) {
                                res.writeHead(500);
                                res.end(JSON.stringify({
                                    success: false,
                                    error: 'Failed to get current model.',
                                    featureName: featureName,
                                    version: version
                                }));
                                return;
                            }
                            
                            // Add the feature to the model
                            const { ModelFeatureModel } = require('../data/models/modelFeatureModel');
                            
                            // Find or create a namespace
                            if (!rootModel.namespace || !Array.isArray(rootModel.namespace) || rootModel.namespace.length === 0) {
                                rootModel.namespace = [{
                                    name: "Default",
                                    modelFeature: []
                                }];
                            }
                            
                            const namespace = rootModel.namespace[0];
                            if (!namespace.modelFeature) {
                                namespace.modelFeature = [];
                            }
                            
                            // Check if feature already exists (match on name AND version)
                            const existingFeatureIndex = namespace.modelFeature.findIndex(f => 
                                f.name === featureName && f.version === version
                            );
                            
                            if (existingFeatureIndex === -1) {
                                // Add the feature
                                const newFeature = new ModelFeatureModel({
                                    name: featureName,
                                    description: "",
                                    version: version
                                });
                                
                                namespace.modelFeature.push(newFeature);
                                modelService.markUnsavedChanges();
                                
                                this.outputChannel.appendLine(`[Command Bridge] Added feature ${featureName} v${version} to namespace ${namespace.name}`);
                                
                                res.writeHead(200);
                                res.end(JSON.stringify({
                                    success: true,
                                    message: `Feature '${featureName}' version '${version}' added to model successfully`,
                                    featureName: featureName,
                                    version: version,
                                    alreadyExists: false
                                }));
                            } else {
                                // Feature already exists
                                this.outputChannel.appendLine(`[Command Bridge] Feature ${featureName} v${version} already exists`);
                                
                                res.writeHead(200);
                                res.end(JSON.stringify({
                                    success: true,
                                    message: `Feature '${featureName}' version '${version}' is already in the model`,
                                    featureName: featureName,
                                    version: version,
                                    alreadyExists: true
                                }));
                            }
                            return;
                        }
                        else if (command === 'unselect_model_feature') {
                            this.outputChannel.appendLine(`[Command Bridge] Unselecting model feature: ${featureName} v${version}`);
                            
                            const modelService = ModelService.getInstance();
                            if (!modelService || !modelService.isFileLoaded()) {
                                res.writeHead(400);
                                res.end(JSON.stringify({
                                    success: false,
                                    error: 'No model file is loaded. Please load a model file first.',
                                    featureName: featureName,
                                    version: version
                                }));
                                return;
                            }
                            
                            const rootModel = modelService.getCurrentModel();
                            if (!rootModel) {
                                res.writeHead(500);
                                res.end(JSON.stringify({
                                    success: false,
                                    error: 'Failed to get current model.',
                                    featureName: featureName,
                                    version: version
                                }));
                                return;
                            }
                            
                            // Remove the feature from the model if not completed (match on name AND version)
                            let found = false;
                            let wasCompleted = false;
                            
                            if (rootModel.namespace && Array.isArray(rootModel.namespace)) {
                                for (const namespace of rootModel.namespace) {
                                    if (namespace.modelFeature && Array.isArray(namespace.modelFeature)) {
                                        const featureIndex = namespace.modelFeature.findIndex(f => 
                                            f.name === featureName && f.version === version
                                        );
                                        
                                        if (featureIndex !== -1) {
                                            found = true;
                                            
                                            // Check if feature is completed
                                            if (namespace.modelFeature[featureIndex].isCompleted === "true") {
                                                wasCompleted = true;
                                                this.outputChannel.appendLine(`[Command Bridge] Cannot remove completed feature ${featureName} v${version}`);
                                                
                                                res.writeHead(400);
                                                res.end(JSON.stringify({
                                                    success: false,
                                                    error: `Cannot remove feature '${featureName}' version '${version}' because it is marked as completed. Completed features have been processed by AI and cannot be removed.`,
                                                    featureName: featureName,
                                                    version: version,
                                                    wasCompleted: true
                                                }));
                                                return;
                                            } else {
                                                // Remove the feature
                                                namespace.modelFeature.splice(featureIndex, 1);
                                                modelService.markUnsavedChanges();
                                                
                                                this.outputChannel.appendLine(`[Command Bridge] Removed feature ${featureName} v${version} from namespace ${namespace.name}`);
                                                
                                                res.writeHead(200);
                                                res.end(JSON.stringify({
                                                    success: true,
                                                    message: `Feature '${featureName}' version '${version}' removed from model successfully`,
                                                    featureName: featureName,
                                                    version: version,
                                                    wasCompleted: false,
                                                    notFound: false
                                                }));
                                                return;
                                            }
                                        }
                                    }
                                }
                            }
                            
                            if (!found) {
                                this.outputChannel.appendLine(`[Command Bridge] Feature ${featureName} v${version} not found in model`);
                                
                                res.writeHead(404);
                                res.end(JSON.stringify({
                                    success: false,
                                    error: `Feature '${featureName}' version '${version}' not found in the model`,
                                    featureName: featureName,
                                    version: version,
                                    notFound: true
                                }));
                                return;
                            }
                        }
                        else if (command === 'select_fabrication_blueprint') {
                            const { blueprintName, version } = requestData;
                            this.outputChannel.appendLine(`[Command Bridge] Selecting fabrication blueprint: ${blueprintName} v${version}`);
                            
                            const modelService = ModelService.getInstance();
                            if (!modelService || !modelService.isFileLoaded()) {
                                res.writeHead(400);
                                res.end(JSON.stringify({
                                    success: false,
                                    error: 'No model file is loaded. Please load a model file first.',
                                    blueprintName: blueprintName,
                                    version: version
                                }));
                                return;
                            }
                            
                            const rootModel = modelService.getCurrentModel();
                            if (!rootModel) {
                                res.writeHead(500);
                                res.end(JSON.stringify({
                                    success: false,
                                    error: 'Failed to get current model.',
                                    blueprintName: blueprintName,
                                    version: version
                                }));
                                return;
                            }
                            
                            // Add the blueprint to the model
                            const { TemplateSetModel } = require('../data/models/templateSetModel');
                            
                            // Ensure the root has a templateSet array
                            if (!rootModel.templateSet || !Array.isArray(rootModel.templateSet)) {
                                rootModel.templateSet = [];
                            }
                            
                            // Check if blueprint already exists (match on name AND version)
                            const existingBlueprintIndex = rootModel.templateSet.findIndex(t => 
                                t.name === blueprintName && t.version === version
                            );
                            
                            if (existingBlueprintIndex === -1) {
                                // Add the blueprint
                                const newBlueprint = new TemplateSetModel({
                                    name: blueprintName,
                                    title: "",
                                    version: version,
                                    isDisabled: "false"
                                });
                                
                                rootModel.templateSet.push(newBlueprint);
                                modelService.markUnsavedChanges();
                                
                                this.outputChannel.appendLine(`[Command Bridge] Added blueprint ${blueprintName} v${version} to model`);
                                
                                res.writeHead(200);
                                res.end(JSON.stringify({
                                    success: true,
                                    message: `Blueprint '${blueprintName}' version '${version}' added to model successfully`,
                                    blueprintName: blueprintName,
                                    version: version,
                                    alreadyExists: false
                                }));
                            } else {
                                // Blueprint already exists, re-enable if disabled
                                if (rootModel.templateSet[existingBlueprintIndex].isDisabled === "true") {
                                    rootModel.templateSet[existingBlueprintIndex].isDisabled = "false";
                                    modelService.markUnsavedChanges();
                                    this.outputChannel.appendLine(`[Command Bridge] Re-enabled blueprint ${blueprintName} v${version}`);
                                    
                                    res.writeHead(200);
                                    res.end(JSON.stringify({
                                        success: true,
                                        message: `Blueprint '${blueprintName}' version '${version}' was re-enabled in the model`,
                                        blueprintName: blueprintName,
                                        version: version,
                                        alreadyExists: true
                                    }));
                                } else {
                                    this.outputChannel.appendLine(`[Command Bridge] Blueprint ${blueprintName} v${version} already exists and is enabled`);
                                    
                                    res.writeHead(200);
                                    res.end(JSON.stringify({
                                        success: true,
                                        message: `Blueprint '${blueprintName}' version '${version}' is already in the model`,
                                        blueprintName: blueprintName,
                                        version: version,
                                        alreadyExists: true
                                    }));
                                }
                            }
                            return;
                        }
                        else if (command === 'unselect_fabrication_blueprint') {
                            const { blueprintName, version } = requestData;
                            this.outputChannel.appendLine(`[Command Bridge] Unselecting fabrication blueprint: ${blueprintName} v${version}`);
                            
                            const modelService = ModelService.getInstance();
                            if (!modelService || !modelService.isFileLoaded()) {
                                res.writeHead(400);
                                res.end(JSON.stringify({
                                    success: false,
                                    error: 'No model file is loaded. Please load a model file first.',
                                    blueprintName: blueprintName,
                                    version: version
                                }));
                                return;
                            }
                            
                            const rootModel = modelService.getCurrentModel();
                            if (!rootModel) {
                                res.writeHead(500);
                                res.end(JSON.stringify({
                                    success: false,
                                    error: 'Failed to get current model.',
                                    blueprintName: blueprintName,
                                    version: version
                                }));
                                return;
                            }
                            
                            // Remove the blueprint from the model (match on name AND version)
                            let found = false;
                            
                            if (rootModel.templateSet && Array.isArray(rootModel.templateSet)) {
                                const blueprintIndex = rootModel.templateSet.findIndex(t => 
                                    t.name === blueprintName && t.version === version
                                );
                                
                                if (blueprintIndex !== -1) {
                                    found = true;
                                    
                                    // Remove the blueprint
                                    rootModel.templateSet.splice(blueprintIndex, 1);
                                    modelService.markUnsavedChanges();
                                    
                                    this.outputChannel.appendLine(`[Command Bridge] Removed blueprint ${blueprintName} v${version} from model`);
                                    
                                    res.writeHead(200);
                                    res.end(JSON.stringify({
                                        success: true,
                                        message: `Blueprint '${blueprintName}' version '${version}' removed from model successfully`,
                                        blueprintName: blueprintName,
                                        version: version,
                                        notFound: false
                                    }));
                                    return;
                                }
                            }
                            
                            if (!found) {
                                this.outputChannel.appendLine(`[Command Bridge] Blueprint ${blueprintName} v${version} not found in model`);
                                
                                res.writeHead(404);
                                res.end(JSON.stringify({
                                    success: false,
                                    error: `Blueprint '${blueprintName}' version '${version}' not found in the model`,
                                    blueprintName: blueprintName,
                                    version: version,
                                    notFound: true
                                }));
                                return;
                            }
                        }
                        
                        // Handle regular VS Code commands
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
            else if (req.url === '/api/auth-status') {
                // Auth status check endpoint
                try {
                    const { AuthService } = require('./authService');
                    const authService = AuthService.getInstance();
                    const isLoggedIn = authService.isLoggedIn();
                    
                    res.writeHead(200);
                    res.end(JSON.stringify({
                        success: true,
                        isLoggedIn: isLoggedIn
                    }));
                } catch (error: any) {
                    res.writeHead(500);
                    res.end(JSON.stringify({
                        success: false,
                        error: error.message
                    }));
                }
            }
            else if (req.url?.startsWith('/api/model-services/model-features')) {
                // Proxy to Model Services API - Model Feature Catalog
                // Uses the same code as the Model Feature Catalog view
                let body = '';
                
                req.on('data', (chunk: any) => {
                    body += chunk.toString();
                });
                
                req.on('end', async () => {
                    try {
                        const { pageNumber = 1, itemCountPerPage = 10, orderByColumnName = 'displayName', orderByDescending = false } = body ? JSON.parse(body) : {};
                        
                        const { AuthService } = require('./authService');
                        const authService = AuthService.getInstance();
                        const apiKey = await authService.getApiKey();

                        if (!apiKey) {
                            res.writeHead(401);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: 'Authentication required. Please log in to Model Services.'
                            }));
                            return;
                        }
                        
                        // Build URL with query parameters (same as modelFeatureCatalogCommands.ts)
                        const params = [
                            'PageNumber=' + encodeURIComponent(pageNumber || 1),
                            'ItemCountPerPage=' + encodeURIComponent(itemCountPerPage || 10),
                            'OrderByDescending=' + encodeURIComponent(orderByDescending ? 'true' : 'false')
                        ];
                        if (orderByColumnName) {
                            params.push('OrderByColumnName=' + encodeURIComponent(orderByColumnName));
                        }
                        const url = 'https://modelservicesapi.derivative-programming.com/api/v1_0/model-features?' + params.join('&');
                        
                        // Make the API call (same as modelFeatureCatalogCommands.ts)
                        const response = await fetch(url, {
                            headers: { 'Api-Key': apiKey }
                        });
                        
                        // Check for unauthorized errors
                        if (response.status === 401) {
                            // Log the user out
                            await authService.logout();
                            res.writeHead(401);
                            res.end(JSON.stringify({
                                success: false,
                                error: 'Your session has expired. Please log in again.'
                            }));
                            return;
                        }
                        
                        if (!response.ok) {
                            throw new Error(`API returned status ${response.status}`);
                        }
                        
                        const data = await response.json();
                        
                        // Get selected features from model (same as modelFeatureCatalogCommands.ts)
                        const modelService = ModelService.getInstance();
                        const selectedFeatures: Array<{name: string, isCompleted?: string}> = [];
                        
                        if (modelService && modelService.isFileLoaded()) {
                            const rootModel = modelService.getCurrentModel();
                            
                            if (rootModel && rootModel.namespace) {
                                for (const namespace of rootModel.namespace) {
                                    if (namespace.modelFeature && Array.isArray(namespace.modelFeature)) {
                                        namespace.modelFeature.forEach((feature: any) => {
                                            if (feature.name) {
                                                selectedFeatures.push({
                                                    name: feature.name,
                                                    isCompleted: feature.isCompleted
                                                });
                                            }
                                        });
                                    }
                                }
                            }
                        }
                        
                        // Enhance catalog items with 'selected' and 'isCompleted' properties
                        if (data.items && Array.isArray(data.items)) {
                            data.items = data.items.map((item: any) => {
                                const selectedFeature = selectedFeatures.find(f => f.name === item.name);
                                return {
                                    ...item,
                                    selected: !!selectedFeature,
                                    isCompleted: selectedFeature?.isCompleted || 'false'
                                };
                            });
                        }
                        
                        res.writeHead(200);
                        res.end(JSON.stringify({
                            success: true,
                            data: data
                        }));
                        
                    } catch (error: any) {
                        this.outputChannel.appendLine(`[Command Bridge] Error fetching model features: ${error.message}`);
                        res.writeHead(500);
                        res.end(JSON.stringify({
                            success: false,
                            error: error.message || 'Failed to fetch model features'
                        }));
                    }
                });
            }
            else if (req.url?.startsWith('/api/model-services/prep-requests')) {
                // Proxy to Model Services API - AI Processing Requests
                let body = '';
                
                req.on('data', (chunk: any) => {
                    body += chunk.toString();
                });
                
                req.on('end', async () => {
                    try {
                        const { pageNumber = 1, itemCountPerPage = 10, orderByColumnName = 'modelPrepRequestRequestedUTCDateTime', orderByDescending = true } = body ? JSON.parse(body) : {};
                        
                        const { AuthService } = require('./authService');
                        const authService = AuthService.getInstance();
                        const apiKey = await authService.getApiKey();

                        if (!apiKey) {
                            res.writeHead(401);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: 'Authentication required. Please log in to Model Services.'
                            }));
                            return;
                        }
                        
                        // Build URL with query parameters
                        const params = [
                            'PageNumber=' + encodeURIComponent(pageNumber || 1),
                            'ItemCountPerPage=' + encodeURIComponent(itemCountPerPage || 10),
                            'OrderByDescending=' + encodeURIComponent(orderByDescending ? 'true' : 'false')
                        ];
                        if (orderByColumnName) {
                            params.push('OrderByColumnName=' + encodeURIComponent(orderByColumnName));
                        }
                        const url = 'https://modelservicesapi.derivative-programming.com/api/v1_0/prep-requests?' + params.join('&');
                        
                        // Make the API call
                        const response = await fetch(url, {
                            headers: { 'Api-Key': apiKey }
                        });
                        
                        // Check for unauthorized errors
                        if (response.status === 401) {
                            await authService.logout();
                            res.writeHead(401);
                            res.end(JSON.stringify({
                                success: false,
                                error: 'Your session has expired. Please log in again.'
                            }));
                            return;
                        }
                        
                        if (!response.ok) {
                            throw new Error(`API returned status ${response.status}`);
                        }
                        
                        const data = await response.json();
                        
                        res.writeHead(200);
                        res.end(JSON.stringify({
                            success: true,
                            data: data
                        }));
                        
                    } catch (error: any) {
                        this.outputChannel.appendLine(`[Command Bridge] Error fetching AI processing requests: ${error.message}`);
                        res.writeHead(500);
                        res.end(JSON.stringify({
                            success: false,
                            error: error.message || 'Failed to fetch AI processing requests'
                        }));
                    }
                });
            }
            else if (req.url?.startsWith('/api/model-services/prep-request-details')) {
                // Proxy to Model Services API - Get Single AI Processing Request Details
                let body = '';
                
                req.on('data', (chunk: any) => {
                    body += chunk.toString();
                });
                
                req.on('end', async () => {
                    try {
                        const { requestCode } = body ? JSON.parse(body) : {};
                        
                        if (!requestCode) {
                            res.writeHead(400);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: 'Request code is required'
                            }));
                            return;
                        }
                        
                        const { AuthService } = require('./authService');
                        const authService = AuthService.getInstance();
                        const apiKey = await authService.getApiKey();

                        if (!apiKey) {
                            res.writeHead(401);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: 'Authentication required. Please log in to Model Services.'
                            }));
                            return;
                        }
                        
                        // Build URL with query parameter for specific request
                        const url = `https://modelservicesapi.derivative-programming.com/api/v1_0/prep-requests?modelPrepRequestCode=${encodeURIComponent(requestCode)}`;
                        
                        // Make the API call
                        const response = await fetch(url, {
                            headers: { 'Api-Key': apiKey }
                        });
                        
                        // Check for unauthorized errors
                        if (response.status === 401) {
                            await authService.logout();
                            res.writeHead(401);
                            res.end(JSON.stringify({
                                success: false,
                                error: 'Your session has expired. Please log in again.'
                            }));
                            return;
                        }
                        
                        if (!response.ok) {
                            throw new Error(`API returned status ${response.status}`);
                        }
                        
                        const data = await response.json();
                        
                        // Extract the first item from the items array if it exists
                        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
                            res.writeHead(200);
                            res.end(JSON.stringify({
                                success: true,
                                item: data.items[0]
                            }));
                        } else {
                            res.writeHead(404);
                            res.end(JSON.stringify({
                                success: false,
                                error: `No AI processing request found with code: ${requestCode}`
                            }));
                        }
                        
                    } catch (error: any) {
                        this.outputChannel.appendLine(`[Command Bridge] Error fetching AI processing request details: ${error.message}`);
                        res.writeHead(500);
                        res.end(JSON.stringify({
                            success: false,
                            error: error.message || 'Failed to fetch AI processing request details'
                        }));
                    }
                });
            }
            else if (req.url?.startsWith('/api/model-services/create-prep-request')) {
                // Proxy to Model Services API - Create AI Processing Request
                let body = '';
                
                req.on('data', (chunk: any) => {
                    body += chunk.toString();
                });
                
                req.on('end', async () => {
                    try {
                        const { description } = body ? JSON.parse(body) : {};
                        
                        if (!description) {
                            res.writeHead(400);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: 'Description is required'
                            }));
                            return;
                        }
                        
                        const { AuthService } = require('./authService');
                        const authService = AuthService.getInstance();
                        const apiKey = await authService.getApiKey();

                        if (!apiKey) {
                            res.writeHead(401);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: 'Authentication required. Please log in to Model Services.'
                            }));
                            return;
                        }
                        
                        // Get model file path from ModelService
                        const { ModelService } = require('./modelService');
                        const modelService = ModelService.getInstance();
                        const modelFilePath = modelService.getCurrentFilePath();
                        
                        if (!modelFilePath) {
                            res.writeHead(400);
                            res.end(JSON.stringify({
                                success: false,
                                error: 'No model file is loaded. Please open a model file first.'
                            }));
                            return;
                        }
                        
                        // Read and zip the model file
                        const fs = require('fs');
                        const JSZip = require('jszip');
                        
                        let modelFileData: string;
                        try {
                            const fileContent = fs.readFileSync(modelFilePath, 'utf8');
                            const zip = new JSZip();
                            zip.file('model.json', fileContent);
                            const archive = await zip.generateAsync({ type: 'nodebuffer' });
                            modelFileData = archive.toString('base64');
                        } catch (error: any) {
                            this.outputChannel.appendLine(`[Command Bridge] Failed to read or zip model file: ${error.message}`);
                            res.writeHead(500);
                            res.end(JSON.stringify({
                                success: false,
                                error: 'Failed to read or zip model file: ' + error.message
                            }));
                            return;
                        }
                        
                        // Build the payload
                        const payload = {
                            description: description,
                            modelFileData: modelFileData
                        };
                        
                        const url = 'https://modelservicesapi.derivative-programming.com/api/v1_0/prep-requests';
                        
                        // Make the API call
                        const response = await fetch(url, {
                            method: 'POST',
                            headers: { 
                                'Api-Key': apiKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(payload)
                        });
                        
                        // Check for unauthorized errors
                        if (response.status === 401) {
                            await authService.logout();
                            res.writeHead(401);
                            res.end(JSON.stringify({
                                success: false,
                                error: 'Your session has expired. Please log in again.'
                            }));
                            return;
                        }
                        
                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`API returned status ${response.status}: ${errorText}`);
                        }
                        
                        const data = await response.json();
                        
                        // Extract request code from response
                        let requestCode = null;
                        if (data && data.modelPrepRequestCode) {
                            requestCode = data.modelPrepRequestCode;
                        }
                        
                        res.writeHead(200);
                        res.end(JSON.stringify({
                            success: true,
                            requestCode: requestCode,
                            message: 'AI processing request created successfully'
                        }));
                        
                    } catch (error: any) {
                        this.outputChannel.appendLine(`[Command Bridge] Error creating AI processing request: ${error.message}`);
                        res.writeHead(500);
                        res.end(JSON.stringify({
                            success: false,
                            error: error.message || 'Failed to create AI processing request'
                        }));
                    }
                });
            }
            else if (req.url?.startsWith('/api/model-services/create-validation-request')) {
                // Proxy to Model Services API - Create Validation Request
                let body = '';
                
                req.on('data', (chunk: any) => {
                    body += chunk.toString();
                });
                
                req.on('end', async () => {
                    try {
                        const { description } = body ? JSON.parse(body) : {};
                        
                        if (!description) {
                            res.writeHead(400);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: 'Description is required'
                            }));
                            return;
                        }
                        
                        const { AuthService } = require('./authService');
                        const authService = AuthService.getInstance();
                        const apiKey = await authService.getApiKey();

                        if (!apiKey) {
                            res.writeHead(401);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: 'Authentication required. Please log in to Model Services.'
                            }));
                            return;
                        }
                        
                        // Get model file path from ModelService
                        const { ModelService } = require('./modelService');
                        const modelService = ModelService.getInstance();
                        const modelFilePath = modelService.getCurrentFilePath();
                        
                        if (!modelFilePath) {
                            res.writeHead(400);
                            res.end(JSON.stringify({
                                success: false,
                                error: 'No model file is loaded. Please open a model file first.'
                            }));
                            return;
                        }
                        
                        // Read and zip the model file
                        const fs = require('fs');
                        const JSZip = require('jszip');
                        
                        let modelFileData: string;
                        try {
                            const fileContent = fs.readFileSync(modelFilePath, 'utf8');
                            const zip = new JSZip();
                            zip.file('model.json', fileContent);
                            const archive = await zip.generateAsync({ type: 'nodebuffer' });
                            modelFileData = archive.toString('base64');
                        } catch (error: any) {
                            this.outputChannel.appendLine(`[Command Bridge] Failed to read or zip model file: ${error.message}`);
                            res.writeHead(500);
                            res.end(JSON.stringify({
                                success: false,
                                error: 'Failed to read or zip model file: ' + error.message
                            }));
                            return;
                        }
                        
                        // Build the payload
                        const payload = {
                            description: description,
                            modelFileData: modelFileData
                        };
                        
                        const url = 'https://modelservicesapi.derivative-programming.com/api/v1_0/validation-requests';
                        
                        // Make the API call
                        const response = await fetch(url, {
                            method: 'POST',
                            headers: { 
                                'Api-Key': apiKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(payload)
                        });
                        
                        // Check for unauthorized errors
                        if (response.status === 401) {
                            await authService.logout();
                            res.writeHead(401);
                            res.end(JSON.stringify({
                                success: false,
                                error: 'Your session has expired. Please log in again.'
                            }));
                            return;
                        }
                        
                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`API returned status ${response.status}: ${errorText}`);
                        }
                        
                        const data = await response.json();
                        
                        // Extract request code from response
                        let requestCode = null;
                        if (data && data.modelValidationRequestCode) {
                            requestCode = data.modelValidationRequestCode;
                        }
                        
                        res.writeHead(200);
                        res.end(JSON.stringify({
                            success: true,
                            requestCode: requestCode,
                            message: 'Validation request created successfully'
                        }));
                        
                    } catch (error: any) {
                        this.outputChannel.appendLine(`[Command Bridge] Error creating validation request: ${error.message}`);
                        res.writeHead(500);
                        res.end(JSON.stringify({
                            success: false,
                            error: error.message || 'Failed to create validation request'
                        }));
                    }
                });
            }
            else if (req.url?.startsWith('/api/model-services/create-fabrication-request')) {
                // Proxy to Model Services API - Create Fabrication Request
                let body = '';
                
                req.on('data', (chunk: any) => {
                    body += chunk.toString();
                });
                
                req.on('end', async () => {
                    try {
                        const { description } = body ? JSON.parse(body) : {};
                        
                        if (!description) {
                            res.writeHead(400);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: 'Description is required'
                            }));
                            return;
                        }
                        
                        const { AuthService } = require('./authService');
                        const authService = AuthService.getInstance();
                        const apiKey = await authService.getApiKey();

                        if (!apiKey) {
                            res.writeHead(401);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: 'Authentication required. Please log in to Model Services.'
                            }));
                            return;
                        }
                        
                        // Get model file path from ModelService
                        const { ModelService } = require('./modelService');
                        const modelService = ModelService.getInstance();
                        const modelFilePath = modelService.getCurrentFilePath();
                        
                        if (!modelFilePath) {
                            res.writeHead(400);
                            res.end(JSON.stringify({
                                success: false,
                                error: 'No model file is loaded. Please open a model file first.'
                            }));
                            return;
                        }
                        
                        // Read and zip the model file
                        const fs = require('fs');
                        const JSZip = require('jszip');
                        
                        let modelFileData: string;
                        try {
                            const fileContent = fs.readFileSync(modelFilePath, 'utf8');
                            const zip = new JSZip();
                            zip.file('model.json', fileContent);
                            const archive = await zip.generateAsync({ type: 'nodebuffer' });
                            modelFileData = archive.toString('base64');
                        } catch (error: any) {
                            this.outputChannel.appendLine(`[Command Bridge] Failed to read or zip model file: ${error.message}`);
                            res.writeHead(500);
                            res.end(JSON.stringify({
                                success: false,
                                error: 'Failed to read or zip model file: ' + error.message
                            }));
                            return;
                        }
                        
                        // Build the payload
                        const payload = {
                            description: description,
                            modelFileData: modelFileData
                        };
                        
                        const url = 'https://modelservicesapi.derivative-programming.com/api/v1_0/fabrication-requests';
                        
                        // Make the API call
                        const response = await fetch(url, {
                            method: 'POST',
                            headers: { 
                                'Api-Key': apiKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(payload)
                        });
                        
                        // Check for unauthorized errors
                        if (response.status === 401) {
                            await authService.logout();
                            res.writeHead(401);
                            res.end(JSON.stringify({
                                success: false,
                                error: 'Your session has expired. Please log in again.'
                            }));
                            return;
                        }
                        
                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`API returned status ${response.status}: ${errorText}`);
                        }
                        
                        const data = await response.json();
                        
                        // Extract request code from response
                        let requestCode = null;
                        if (data && data.modelFabricationRequestCode) {
                            requestCode = data.modelFabricationRequestCode;
                        }
                        
                        res.writeHead(200);
                        res.end(JSON.stringify({
                            success: true,
                            requestCode: requestCode,
                            message: 'Fabrication request created successfully'
                        }));
                        
                    } catch (error: any) {
                        this.outputChannel.appendLine(`[Command Bridge] Error creating fabrication request: ${error.message}`);
                        res.writeHead(500);
                        res.end(JSON.stringify({
                            success: false,
                            error: error.message || 'Failed to create fabrication request'
                        }));
                    }
                });
            }
            else if (req.url?.startsWith('/api/model-services/merge-ai-processing-results')) {
                // Proxy to Model Services API - Merge AI Processing Results
                let body = '';
                
                req.on('data', (chunk: any) => {
                    body += chunk.toString();
                });
                
                req.on('end', async () => {
                    try {
                        const { requestCode } = body ? JSON.parse(body) : {};
                        
                        if (!requestCode) {
                            res.writeHead(400);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: 'Request code is required'
                            }));
                            return;
                        }
                        
                        const { AuthService } = require('./authService');
                        const authService = AuthService.getInstance();
                        const apiKey = await authService.getApiKey();

                        if (!apiKey) {
                            res.writeHead(401);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: 'Authentication required. Please log in to Model Services.'
                            }));
                            return;
                        }
                        
                        // Get model file path from ModelService
                        const { ModelService } = require('./modelService');
                        const modelService = ModelService.getInstance();
                        const modelFilePath = modelService.getCurrentFilePath();
                        
                        if (!modelFilePath) {
                            res.writeHead(400);
                            res.end(JSON.stringify({
                                success: false,
                                error: 'No model file is loaded. Please open a model file first.'
                            }));
                            return;
                        }
                        
                        // First, get the AI processing request details to get the result model URL
                        const detailsUrl = `https://modelservicesapi.derivative-programming.com/api/v1_0/prep-requests?modelPrepRequestCode=${encodeURIComponent(requestCode)}`;
                        const detailsResponse = await fetch(detailsUrl, {
                            method: 'GET',
                            headers: { 'Api-Key': apiKey }
                        });
                        
                        if (!detailsResponse.ok) {
                            if (detailsResponse.status === 401) {
                                await authService.logout();
                                res.writeHead(401);
                                res.end(JSON.stringify({
                                    success: false,
                                    error: 'Your session has expired. Please log in again.'
                                }));
                                return;
                            }
                            throw new Error(`Failed to get request details: ${detailsResponse.status}: ${detailsResponse.statusText}`);
                        }
                        
                        const detailsData = await detailsResponse.json();
                        
                        // Extract the first item from the items array
                        if (!detailsData.items || !Array.isArray(detailsData.items) || detailsData.items.length === 0) {
                            res.writeHead(404);
                            res.end(JSON.stringify({
                                success: false,
                                error: `No AI processing request found with code: ${requestCode}`
                            }));
                            return;
                        }
                        
                        const requestDetails = detailsData.items[0];
                        
                        // Check if the request is complete and successful
                        if (!requestDetails.modelPrepRequestIsCompleted) {
                            res.writeHead(400);
                            res.end(JSON.stringify({
                                success: false,
                                error: 'The AI processing request is not yet complete. Please wait for it to finish.'
                            }));
                            return;
                        }
                        
                        if (!requestDetails.modelPrepRequestIsSuccessful) {
                            res.writeHead(400);
                            res.end(JSON.stringify({
                                success: false,
                                error: 'The AI processing request failed. Cannot merge results.'
                            }));
                            return;
                        }
                        
                        if (!requestDetails.modelPrepRequestResultModelUrl) {
                            res.writeHead(400);
                            res.end(JSON.stringify({
                                success: false,
                                error: 'No result model URL available for this request.'
                            }));
                            return;
                        }
                        
                        // Read and zip the current model file
                        const fs = require('fs');
                        const JSZip = require('jszip');
                        
                        let modelFileData: string;
                        try {
                            const fileContent = fs.readFileSync(modelFilePath, 'utf8');
                            const zip = new JSZip();
                            zip.file('model.json', fileContent);
                            const archive = await zip.generateAsync({ type: 'nodebuffer' });
                            modelFileData = archive.toString('base64');
                        } catch (error: any) {
                            this.outputChannel.appendLine(`[Command Bridge] Failed to read or zip model file: ${error.message}`);
                            res.writeHead(500);
                            res.end(JSON.stringify({
                                success: false,
                                error: 'Failed to read or zip model file: ' + error.message
                            }));
                            return;
                        }
                        
                        // Build the payload for merge API
                        const payload = {
                            modelFileData: modelFileData,
                            additionsModelUrl: requestDetails.modelPrepRequestResultModelUrl
                        };
                        
                        const mergeUrl = 'https://modelservicesapi.derivative-programming.com/api/v1_0/model-merge';
                        
                        // Call the merge API
                        const mergeResponse = await fetch(mergeUrl, {
                            method: 'POST',
                            headers: { 
                                'Api-Key': apiKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(payload)
                        });
                        
                        if (mergeResponse.status === 401) {
                            await authService.logout();
                            res.writeHead(401);
                            res.end(JSON.stringify({
                                success: false,
                                error: 'Your session has expired. Please log in again.'
                            }));
                            return;
                        }
                        
                        if (!mergeResponse.ok) {
                            const errorText = await mergeResponse.text();
                            throw new Error(`Merge API returned status ${mergeResponse.status}: ${errorText}`);
                        }
                        
                        const mergeResult = await mergeResponse.json();
                        
                        // Check if the merge operation was successful
                        if (mergeResult.success === false) {
                            let errorMessage = 'Merge operation failed';
                            if (mergeResult.message) {
                                errorMessage += ': ' + mergeResult.message;
                            }
                            throw new Error(errorMessage);
                        }
                        
                        if (!mergeResult.resultModelUrl) {
                            throw new Error('No result model URL returned from merge operation');
                        }
                        
                        // Download the merged model
                        const modelResponse = await fetch(mergeResult.resultModelUrl, {
                            headers: { 'Api-Key': apiKey }
                        });
                        
                        if (!modelResponse.ok) {
                            throw new Error(`Failed to download merged model: ${modelResponse.status}: ${modelResponse.statusText}`);
                        }
                        
                        const mergedModelData = await modelResponse.json();
                        
                        // Update the model in memory
                        await modelService.updateModelFromJson(mergedModelData);
                        
                        res.writeHead(200);
                        res.end(JSON.stringify({
                            success: true,
                            message: 'AI processing results merged successfully into model'
                        }));
                        
                    } catch (error: any) {
                        this.outputChannel.appendLine(`[Command Bridge] Error merging AI processing results: ${error.message}`);
                        res.writeHead(500);
                        res.end(JSON.stringify({
                            success: false,
                            error: error.message || 'Failed to merge AI processing results'
                        }));
                    }
                });
            }
            else if (req.url?.startsWith('/api/model-services/validation-request-details')) {
                // Proxy to Model Services API - Get Single Validation Request Details
                let body = '';
                
                req.on('data', (chunk: any) => {
                    body += chunk.toString();
                });
                
                req.on('end', async () => {
                    try {
                        const { requestCode } = body ? JSON.parse(body) : {};
                        
                        if (!requestCode) {
                            res.writeHead(400);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: 'Request code is required'
                            }));
                            return;
                        }
                        
                        const { AuthService } = require('./authService');
                        const authService = AuthService.getInstance();
                        const apiKey = await authService.getApiKey();

                        if (!apiKey) {
                            res.writeHead(401);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: 'Authentication required. Please log in to Model Services.'
                            }));
                            return;
                        }
                        
                        // Build URL with query parameter for specific request
                        const url = `https://modelservicesapi.derivative-programming.com/api/v1_0/validation-requests?modelValidationRequestCode=${encodeURIComponent(requestCode)}`;
                        
                        // Make the API call
                        const response = await fetch(url, {
                            headers: { 'Api-Key': apiKey }
                        });
                        
                        // Check for unauthorized errors
                        if (response.status === 401) {
                            await authService.logout();
                            res.writeHead(401);
                            res.end(JSON.stringify({
                                success: false,
                                error: 'Your session has expired. Please log in again.'
                            }));
                            return;
                        }
                        
                        if (!response.ok) {
                            throw new Error(`API returned status ${response.status}`);
                        }
                        
                        const data = await response.json();
                        
                        // Extract the first item from the items array if it exists
                        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
                            res.writeHead(200);
                            res.end(JSON.stringify({
                                success: true,
                                item: data.items[0]
                            }));
                        } else {
                            res.writeHead(404);
                            res.end(JSON.stringify({
                                success: false,
                                error: `No validation request found with code: ${requestCode}`
                            }));
                        }
                        
                    } catch (error: any) {
                        this.outputChannel.appendLine(`[Command Bridge] Error fetching validation request details: ${error.message}`);
                        res.writeHead(500);
                        res.end(JSON.stringify({
                            success: false,
                            error: error.message || 'Failed to fetch validation request details'
                        }));
                    }
                });
            }
            else if (req.url?.startsWith('/api/model-services/fabrication-request-details')) {
                // Proxy to Model Services API - Get Single Fabrication Request Details
                let body = '';
                
                req.on('data', (chunk: any) => {
                    body += chunk.toString();
                });
                
                req.on('end', async () => {
                    try {
                        const { requestCode } = body ? JSON.parse(body) : {};
                        
                        if (!requestCode) {
                            res.writeHead(400);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: 'Request code is required'
                            }));
                            return;
                        }
                        
                        const { AuthService } = require('./authService');
                        const authService = AuthService.getInstance();
                        const apiKey = await authService.getApiKey();

                        if (!apiKey) {
                            res.writeHead(401);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: 'Authentication required. Please log in to Model Services.'
                            }));
                            return;
                        }
                        
                        // Build URL with query parameter for specific request
                        const url = `https://modelservicesapi.derivative-programming.com/api/v1_0/fabrication-requests?modelFabricationRequestCode=${encodeURIComponent(requestCode)}`;
                        
                        // Make the API call
                        const response = await fetch(url, {
                            headers: { 'Api-Key': apiKey }
                        });
                        
                        // Check for unauthorized errors
                        if (response.status === 401) {
                            await authService.logout();
                            res.writeHead(401);
                            res.end(JSON.stringify({
                                success: false,
                                error: 'Your session has expired. Please log in again.'
                            }));
                            return;
                        }
                        
                        if (!response.ok) {
                            throw new Error(`API returned status ${response.status}`);
                        }
                        
                        const data = await response.json();
                        
                        // Extract the first item from the items array if it exists
                        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
                            res.writeHead(200);
                            res.end(JSON.stringify({
                                success: true,
                                item: data.items[0]
                            }));
                        } else {
                            res.writeHead(404);
                            res.end(JSON.stringify({
                                success: false,
                                error: `No fabrication request found with code: ${requestCode}`
                            }));
                        }
                        
                    } catch (error: any) {
                        this.outputChannel.appendLine(`[Command Bridge] Error fetching fabrication request details: ${error.message}`);
                        res.writeHead(500);
                        res.end(JSON.stringify({
                            success: false,
                            error: error.message || 'Failed to fetch fabrication request details'
                        }));
                    }
                });
            }
            else if (req.url?.startsWith('/api/model-services/validation-requests')) {
                // Proxy to Model Services API - Validation Requests
                let body = '';
                
                req.on('data', (chunk: any) => {
                    body += chunk.toString();
                });
                
                req.on('end', async () => {
                    try {
                        const { pageNumber = 1, itemCountPerPage = 10, orderByColumnName = 'modelValidationRequestRequestedUTCDateTime', orderByDescending = true } = body ? JSON.parse(body) : {};
                        
                        const { AuthService } = require('./authService');
                        const authService = AuthService.getInstance();
                        const apiKey = await authService.getApiKey();

                        if (!apiKey) {
                            res.writeHead(401);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: 'Authentication required. Please log in to Model Services.'
                            }));
                            return;
                        }
                        
                        // Build URL with query parameters
                        const params = [
                            'PageNumber=' + encodeURIComponent(pageNumber || 1),
                            'ItemCountPerPage=' + encodeURIComponent(itemCountPerPage || 10),
                            'OrderByDescending=' + encodeURIComponent(orderByDescending ? 'true' : 'false')
                        ];
                        if (orderByColumnName) {
                            params.push('OrderByColumnName=' + encodeURIComponent(orderByColumnName));
                        }
                        const url = 'https://modelservicesapi.derivative-programming.com/api/v1_0/validation-requests?' + params.join('&');
                        
                        // Make the API call
                        const response = await fetch(url, {
                            headers: { 'Api-Key': apiKey }
                        });
                        
                        // Check for unauthorized errors
                        if (response.status === 401) {
                            await authService.logout();
                            res.writeHead(401);
                            res.end(JSON.stringify({
                                success: false,
                                error: 'Your session has expired. Please log in again.'
                            }));
                            return;
                        }
                        
                        if (!response.ok) {
                            throw new Error(`API returned status ${response.status}`);
                        }
                        
                        const data = await response.json();
                        
                        res.writeHead(200);
                        res.end(JSON.stringify({
                            success: true,
                            data: data
                        }));
                        
                    } catch (error: any) {
                        this.outputChannel.appendLine(`[Command Bridge] Error fetching validation requests: ${error.message}`);
                        res.writeHead(500);
                        res.end(JSON.stringify({
                            success: false,
                            error: error.message || 'Failed to fetch validation requests'
                        }));
                    }
                });
            }
            else if (req.url?.startsWith('/api/model-services/template-sets')) {
                // Proxy to Model Services API - Fabrication Blueprint Catalog (Template Sets)
                let body = '';
                
                req.on('data', (chunk: any) => {
                    body += chunk.toString();
                });
                
                req.on('end', async () => {
                    try {
                        const { pageNumber = 1, itemCountPerPage = 10, orderByColumnName = 'displayName', orderByDescending = false } = body ? JSON.parse(body) : {};
                        
                        const { AuthService } = require('./authService');
                        const authService = AuthService.getInstance();
                        const apiKey = await authService.getApiKey();

                        if (!apiKey) {
                            res.writeHead(401);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: 'Authentication required. Please log in to Model Services.'
                            }));
                            return;
                        }
                        
                        // Build URL with query parameters
                        const params = [
                            'PageNumber=' + encodeURIComponent(pageNumber || 1),
                            'ItemCountPerPage=' + encodeURIComponent(itemCountPerPage || 10),
                            'OrderByDescending=' + encodeURIComponent(orderByDescending ? 'true' : 'false')
                        ];
                        if (orderByColumnName) {
                            params.push('OrderByColumnName=' + encodeURIComponent(orderByColumnName));
                        }
                        const url = 'https://modelservicesapi.derivative-programming.com/api/v1_0/template-sets?' + params.join('&');
                        
                        // Make the API call
                        const response = await fetch(url, {
                            headers: { 'Api-Key': apiKey }
                        });
                        
                        // Check for unauthorized errors
                        if (response.status === 401) {
                            await authService.logout();
                            res.writeHead(401);
                            res.end(JSON.stringify({
                                success: false,
                                error: 'Your session has expired. Please log in again.'
                            }));
                            return;
                        }
                        
                        if (!response.ok) {
                            throw new Error(`API returned status ${response.status}`);
                        }
                        
                        const data = await response.json();
                        
                        // Get selected templates from model (similar to fabricationBlueprintCatalogCommands.ts)
                        const modelService = ModelService.getInstance();
                        const selectedTemplates: Array<{name: string}> = [];
                        
                        if (modelService && modelService.isFileLoaded()) {
                            const rootModel = modelService.getCurrentModel();
                            
                            if (rootModel && rootModel.templateSet && Array.isArray(rootModel.templateSet)) {
                                rootModel.templateSet.forEach((template: any) => {
                                    if (template.name) {
                                        selectedTemplates.push({
                                            name: template.name
                                        });
                                    }
                                });
                            }
                        }
                        
                        // Enhance catalog items with 'selected' property
                        if (data.items && Array.isArray(data.items)) {
                            data.items = data.items.map((item: any) => {
                                const isSelected = selectedTemplates.some(t => t.name === item.name);
                                return {
                                    ...item,
                                    selected: isSelected
                                };
                            });
                        }
                        
                        res.writeHead(200);
                        res.end(JSON.stringify({
                            success: true,
                            data: data
                        }));
                        
                    } catch (error: any) {
                        this.outputChannel.appendLine(`[Command Bridge] Error fetching fabrication blueprints: ${error.message}`);
                        res.writeHead(500);
                        res.end(JSON.stringify({
                            success: false,
                            error: error.message || 'Failed to fetch fabrication blueprints'
                        }));
                    }
                });
            }
            else if (req.url?.startsWith('/api/model-services/fabrication-requests')) {
                // Proxy to Model Services API - Fabrication Requests
                let body = '';
                
                req.on('data', (chunk: any) => {
                    body += chunk.toString();
                });
                
                req.on('end', async () => {
                    try {
                        const { pageNumber = 1, itemCountPerPage = 10, orderByColumnName = 'modelFabricationRequestRequestedUTCDateTime', orderByDescending = true } = body ? JSON.parse(body) : {};
                        
                        const { AuthService } = require('./authService');
                        const authService = AuthService.getInstance();
                        const apiKey = await authService.getApiKey();

                        if (!apiKey) {
                            res.writeHead(401);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: 'Authentication required. Please log in to Model Services.'
                            }));
                            return;
                        }
                        
                        // Build URL with query parameters
                        const params = [
                            'PageNumber=' + encodeURIComponent(pageNumber || 1),
                            'ItemCountPerPage=' + encodeURIComponent(itemCountPerPage || 10),
                            'OrderByDescending=' + encodeURIComponent(orderByDescending ? 'true' : 'false')
                        ];
                        if (orderByColumnName) {
                            params.push('OrderByColumnName=' + encodeURIComponent(orderByColumnName));
                        }
                        const url = 'https://modelservicesapi.derivative-programming.com/api/v1_0/fabrication-requests?' + params.join('&');
                        
                        // Make the API call
                        const response = await fetch(url, {
                            headers: { 'Api-Key': apiKey }
                        });
                        
                        // Check for unauthorized errors
                        if (response.status === 401) {
                            await authService.logout();
                            res.writeHead(401);
                            res.end(JSON.stringify({
                                success: false,
                                error: 'Your session has expired. Please log in again.'
                            }));
                            return;
                        }
                        
                        if (!response.ok) {
                            throw new Error(`API returned status ${response.status}`);
                        }
                        
                        const data = await response.json();
                        
                        res.writeHead(200);
                        res.end(JSON.stringify({
                            success: true,
                            data: data
                        }));
                        
                    } catch (error: any) {
                        this.outputChannel.appendLine(`[Command Bridge] Error fetching fabrication requests: ${error.message}`);
                        res.writeHead(500);
                        res.end(JSON.stringify({
                            success: false,
                            error: error.message || 'Failed to fetch fabrication requests'
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

    /**
     * Helper function to generate display text from PascalCase name
     * Converts "AdministratorRole" to "Administrator Role"
     * @param name PascalCase name
     * @returns Display text with spaces
     */
    private generateDisplayText(name: string): string {
        if (!name) {
            return '';
        }
        
        // Insert space before capital letters (except first letter)
        return name
            .replace(/([A-Z])/g, ' $1')
            .trim()
            // Handle consecutive capital letters (e.g., "XMLParser" -> "XML Parser")
            .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
    }

}

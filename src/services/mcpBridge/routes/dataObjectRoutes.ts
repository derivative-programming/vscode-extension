// dataObjectRoutes.ts
// Route handlers for data object operations
// Created on: November 30, 2025

import * as http from "http";
import { ModelService } from "../../modelService";
import {
    parseRequestBody,
    sendJsonResponse,
    sendErrorResponse,
    ensureModelLoaded,
    logRequest
} from "../utils/routeUtils";
import { RouteContext } from "../types/routeTypes";

/**
 * GET /api/data-objects
 * Get all data objects (summary only - no prop array)
 */
export async function getDataObjectsSummary(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    const modelService = ModelService.getInstance();
    const objects = modelService.getAllObjects();
    const dataObjects = objects.map((obj: any) => ({
        name: obj.name || "",
        isLookup: obj.isLookup === "true",
        parentObjectName: obj.parentObjectName || null,
        codeDescription: obj.codeDescription || "",
        propCount: (obj.prop && Array.isArray(obj.prop)) ? obj.prop.length : 0
    }));
    
    context.outputChannel.appendLine(`[Data Bridge] Returning ${dataObjects.length} data objects (summary)`);
    sendJsonResponse(res, 200, dataObjects, context.outputChannel);
}

/**
 * GET /api/data-objects-full
 * Get all data objects with full details (including prop array)
 */
export async function getDataObjectsFull(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    const modelService = ModelService.getInstance();
    const objects = modelService.getAllObjects();
    const fullDataObjects = objects.map((obj: any) => {
        const filteredObject: any = {
            name: obj.name || "",
            parentObjectName: obj.parentObjectName || "",
            isLookup: obj.isLookup || "false"
        };
        
        if (obj.codeDescription) {
            filteredObject.codeDescription = obj.codeDescription;
        }
        
        if (obj.prop && Array.isArray(obj.prop) && obj.prop.length > 0) {
            filteredObject.prop = obj.prop;
        }
        
        return filteredObject;
    });
    
    context.outputChannel.appendLine(`[Data Bridge] Returning ${fullDataObjects.length} data objects (full details)`);
    sendJsonResponse(res, 200, fullDataObjects, context.outputChannel);
}

/**
 * GET /api/data-objects/:objectName
 * Get a specific data object by name (complete details)
 */
export async function getDataObjectByName(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    const objectName = decodeURIComponent(req.url!.substring("/api/data-objects/".length));
    
    try {
        const modelService = ModelService.getInstance();
        const objects = modelService.getAllObjects();
        const dataObject = objects.find((obj: any) => obj.name === objectName);
        
        if (!dataObject) {
            sendErrorResponse(res, 404, `Data object "${objectName}" not found`, context.outputChannel);
            return;
        }
        
        const filteredObject: any = {
            name: dataObject.name || "",
            parentObjectName: dataObject.parentObjectName || "",
            isLookup: dataObject.isLookup || "false"
        };
        
        if (dataObject.codeDescription) {
            filteredObject.codeDescription = dataObject.codeDescription;
        }
        
        if (dataObject.prop && Array.isArray(dataObject.prop) && dataObject.prop.length > 0) {
            filteredObject.prop = dataObject.prop;
        }
        
        context.outputChannel.appendLine(`[Data Bridge] Returning complete data object: ${objectName}`);
        sendJsonResponse(res, 200, filteredObject, context.outputChannel);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        context.outputChannel.appendLine(`[Data Bridge] Error getting data object: ${errorMessage}`);
        sendErrorResponse(res, 500, errorMessage, context.outputChannel);
    }
}

/**
 * POST /api/data-objects
 * Create a new data object
 */
export async function createDataObject(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { name, parentObjectName, isLookup, codeDescription } = await parseRequestBody(req);
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        if (!model) {
            throw new Error("Failed to get current model");
        }
        
        if (!model.namespace) {
            model.namespace = [];
        }
        
        if (model.namespace.length === 0) {
            model.namespace.push({ name: "Default", object: [] });
        }
        
        model.namespace.forEach((ns: any) => {
            if (!ns.object) {
                ns.object = [];
            }
        });
        
        let targetNsIndex = 0;
        
        const isLookupBool = isLookup === "true";
        if (!isLookupBool && parentObjectName) {
            for (let i = 0; i < model.namespace.length; i++) {
                const ns = model.namespace[i];
                if (ns.object && ns.object.some((obj: any) => obj.name === parentObjectName)) {
                    targetNsIndex = i;
                    break;
                }
            }
        }
        
        const newObject: any = {
            name: name,
            parentObjectName: parentObjectName || "",
            propSubscription: [],
            modelPkg: [],
            lookupItem: [],
            isLookup: isLookup || "false"
        };
        
        if (codeDescription) {
            newObject.codeDescription = codeDescription;
        }
        
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
        
        model.namespace[targetNsIndex].object.push(newObject);
        modelService.markUnsavedChanges();
        
        setTimeout(() => {
            try {
                require("vscode").commands.executeCommand("appdna.refresh");
            } catch (e) {
                // Ignore errors if vscode commands not available
            }
        }, 100);
        
        context.outputChannel.appendLine(`[Data Bridge] Created data object: ${name}`);
        sendJsonResponse(res, 200, {
            success: true,
            object: {
                name: newObject.name,
                parentObjectName: newObject.parentObjectName,
                isLookup: newObject.isLookup === "true",
                codeDescription: newObject.codeDescription || ""
            },
            message: `Data object "${name}" created successfully`
        }, context.outputChannel);
        
    } catch (error) {
        context.outputChannel.appendLine(`[Data Bridge] Error creating data object: ${error instanceof Error ? error.message : "Unknown error"}`);
        sendErrorResponse(res, 400, error instanceof Error ? error.message : "Invalid request body", context.outputChannel);
    }
}

/**
 * POST /api/data-objects/update
 * Update an existing data object
 */
export async function updateDataObject(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { name, codeDescription } = await parseRequestBody(req);
        
        if (!name) {
            throw new Error('Parameter "name" is required');
        }
        
        if (codeDescription === undefined) {
            throw new Error('Parameter "codeDescription" is required');
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        if (!model || !model.namespace) {
            throw new Error("Failed to get current model");
        }
        
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
        
        foundObject.codeDescription = codeDescription;
        modelService.markUnsavedChanges();
        
        setTimeout(() => {
            try {
                require("vscode").commands.executeCommand("appdna.refresh");
            } catch (e) {
                // Ignore errors if vscode commands not available
            }
        }, 100);
        
        context.outputChannel.appendLine(`[Data Bridge] Updated data object: ${name}`);
        sendJsonResponse(res, 200, {
            success: true,
            object: {
                name: foundObject.name,
                parentObjectName: foundObject.parentObjectName,
                isLookup: foundObject.isLookup === "true",
                codeDescription: foundObject.codeDescription || ""
            },
            message: `Data object "${name}" updated successfully`
        }, context.outputChannel);
        
    } catch (error) {
        context.outputChannel.appendLine(`[Data Bridge] Error updating data object: ${error instanceof Error ? error.message : "Unknown error"}`);
        sendErrorResponse(res, 400, error instanceof Error ? error.message : "Invalid request body", context.outputChannel);
    }
}

/**
 * POST /api/update-full-data-object
 * Update a data object with provided schema (merge/patch operation)
 */
export async function updateFullDataObject(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { data_object_name, data_object } = await parseRequestBody(req);
        
        if (!data_object_name) {
            throw new Error("data_object_name is required");
        }
        
        if (!data_object || typeof data_object !== "object") {
            throw new Error("data_object object is required");
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        if (!model || !model.namespace) {
            throw new Error("Failed to get current model");
        }
        
        let foundDataObject: any = null;
        
        for (const ns of model.namespace) {
            if (ns.object && Array.isArray(ns.object)) {
                const obj = ns.object.find((o: any) => o.name === data_object_name);
                
                if (obj) {
                    foundDataObject = obj;
                    break;
                }
            }
        }
        
        if (!foundDataObject) {
            throw new Error(`Data object "${data_object_name}" not found`);
        }
        
        const objectLevelProps = ["parentObjectName", "isLookup", "codeDescription"];
        objectLevelProps.forEach(prop => {
            if (data_object[prop] !== undefined) {
                foundDataObject[prop] = data_object[prop];
            }
        });
        
        if (data_object.prop && Array.isArray(data_object.prop)) {
            if (!foundDataObject.prop || !Array.isArray(foundDataObject.prop)) {
                foundDataObject.prop = [];
            }
            
            data_object.prop.forEach((newProp: any) => {
                if (!newProp.name) {
                    return;
                }
                
                const existingPropIndex = foundDataObject.prop.findIndex(
                    (p: any) => p.name === newProp.name
                );
                
                if (existingPropIndex !== -1) {
                    const existingProp = foundDataObject.prop[existingPropIndex];
                    Object.keys(newProp).forEach(key => {
                        if (key !== "name") {
                            existingProp[key] = newProp[key];
                        }
                    });
                } else {
                    foundDataObject.prop.push(newProp);
                }
            });
        }
        
        modelService.markUnsavedChanges();
        
        setTimeout(() => {
            try {
                require("vscode").commands.executeCommand("appdna.refresh");
            } catch (e) {
                // Ignore errors if vscode commands not available
            }
        }, 100);
        
        context.outputChannel.appendLine(`[Data Bridge] Updated data object "${data_object_name}" (merge operation)`);
        sendJsonResponse(res, 200, {
            success: true,
            data_object: foundDataObject
        }, context.outputChannel);
        
    } catch (error) {
        context.outputChannel.appendLine(`[Data Bridge] Error updating full data object: ${error instanceof Error ? error.message : "Unknown error"}`);
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to update full data object", context.outputChannel);
    }
}

/**
 * POST /api/data-objects/add-props
 * Add properties to an existing data object
 */
export async function addDataObjectProps(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { objectName, props } = await parseRequestBody(req);
        
        if (!objectName) {
            throw new Error('Parameter "objectName" is required');
        }
        
        if (!props || !Array.isArray(props) || props.length === 0) {
            throw new Error('Parameter "props" must be a non-empty array');
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        if (!model || !model.namespace) {
            throw new Error("Failed to get current model");
        }
        
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
        
        if (!foundObject.prop) {
            foundObject.prop = [];
        }
        
        const existingPropNames = foundObject.prop.map((p: any) => p.name.toLowerCase());
        const duplicates: string[] = [];
        
        props.forEach((newProp: any) => {
            if (existingPropNames.includes(newProp.name.toLowerCase())) {
                duplicates.push(newProp.name);
            }
        });
        
        if (duplicates.length > 0) {
            throw new Error(`Properties already exist: ${duplicates.join(", ")}`);
        }
        
        let addedCount = 0;
        props.forEach((propDef: any) => {
            const newProp: any = {
                name: propDef.name
            };
            
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
        
        modelService.markUnsavedChanges();
        
        setTimeout(() => {
            try {
                require("vscode").commands.executeCommand("appdna.refresh");
            } catch (e) {
                // Ignore errors if vscode commands not available
            }
        }, 100);
        
        context.outputChannel.appendLine(`[Data Bridge] Added ${addedCount} properties to data object: ${objectName}`);
        sendJsonResponse(res, 200, {
            success: true,
            object: {
                name: foundObject.name,
                parentObjectName: foundObject.parentObjectName,
                isLookup: foundObject.isLookup === "true",
                codeDescription: foundObject.codeDescription || "",
                propCount: foundObject.prop.length
            },
            addedCount,
            message: `Added ${addedCount} ${addedCount === 1 ? "property" : "properties"} to "${objectName}"`
        }, context.outputChannel);
        
    } catch (error) {
        context.outputChannel.appendLine(`[Data Bridge] Error adding properties: ${error instanceof Error ? error.message : "Unknown error"}`);
        sendErrorResponse(res, 400, error instanceof Error ? error.message : "Invalid request body", context.outputChannel);
    }
}

/**
 * POST /api/data-objects/update-prop
 * Update an existing property in a data object
 */
export async function updateDataObjectProp(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { objectName, propName, updateFields } = await parseRequestBody(req);
        
        if (!objectName) {
            throw new Error('Parameter "objectName" is required');
        }
        
        if (!propName) {
            throw new Error('Parameter "propName" is required');
        }
        
        if (!updateFields || typeof updateFields !== "object" || Object.keys(updateFields).length === 0) {
            throw new Error('Parameter "updateFields" must be a non-empty object');
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        if (!model || !model.namespace) {
            throw new Error("Failed to get current model");
        }
        
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
        
        const propIndex = foundObject.prop.findIndex((p: any) => p.name === propName);
        
        if (propIndex === -1) {
            const availableProps = foundObject.prop.map((p: any) => p.name).join(", ");
            throw new Error(`Property "${propName}" not found in object "${objectName}". Available properties: ${availableProps}`);
        }
        
        const property = foundObject.prop[propIndex];
        
        Object.keys(updateFields).forEach(key => {
            property[key] = updateFields[key];
        });
        
        if (property.isFK === "true" && !property.fkObjectName) {
            throw new Error('fkObjectName is required when isFK is "true"');
        }
        
        modelService.markUnsavedChanges();
        
        setTimeout(() => {
            try {
                require("vscode").commands.executeCommand("appdna.refresh");
            } catch (e) {
                // Ignore errors if vscode commands not available
            }
        }, 100);
        
        context.outputChannel.appendLine(`[Data Bridge] Updated property "${propName}" in data object: ${objectName}`);
        sendJsonResponse(res, 200, {
            success: true,
            property: property,
            message: `Property "${propName}" updated successfully in "${objectName}"`
        }, context.outputChannel);
        
    } catch (error) {
        context.outputChannel.appendLine(`[Data Bridge] Error updating property: ${error instanceof Error ? error.message : "Unknown error"}`);
        sendErrorResponse(res, 400, error instanceof Error ? error.message : "Invalid request body", context.outputChannel);
    }
}

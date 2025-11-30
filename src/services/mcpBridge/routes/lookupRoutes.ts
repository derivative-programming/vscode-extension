// lookupRoutes.ts
// Route handlers for lookup value operations
// Created on: November 30, 2025

import * as http from "http";
import { ModelService } from "../../modelService";
import { sendJsonResponse, sendErrorResponse, logRequest } from "../utils/routeUtils";
import { RouteContext } from "../types/routeTypes";

/**
 * GET /api/lookup-values
 * Get lookup values for a specified data object
 */
export async function getLookupValues(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const lookupObjectName = url.searchParams.get("lookupObjectName");
        
        if (!lookupObjectName) {
            sendErrorResponse(res, 400, "lookupObjectName query parameter is required", context.outputChannel);
            return;
        }
        
        const modelService = ModelService.getInstance();
        const allObjects = modelService.getAllObjects();
        
        // Case-sensitive exact match
        const lookupObject = allObjects.find((obj: any) => obj.name === lookupObjectName);
        
        if (!lookupObject) {
            sendErrorResponse(res, 404, `Lookup object "${lookupObjectName}" not found`, context.outputChannel);
            return;
        }
        
        // Validate that this is a lookup object
        if (lookupObject.isLookup !== "true") {
            sendErrorResponse(res, 400, `Object "${lookupObjectName}" is not a lookup object (isLookup must be "true")`, context.outputChannel);
            return;
        }
        
        if (!lookupObject.lookupItem || !Array.isArray(lookupObject.lookupItem)) {
            sendJsonResponse(res, 200, [], context.outputChannel);
            return;
        }
        
        const lookupValues = lookupObject.lookupItem.map((item: any) => ({
            name: item.name || "",
            displayName: item.displayName || "",
            description: item.description || "",
            isActive: item.isActive || "true"
        }));
        
        // Sort by name
        lookupValues.sort((a, b) => a.name.localeCompare(b.name));
        
        context.outputChannel.appendLine(`[Data Bridge] Returning ${lookupValues.length} lookup values for "${lookupObjectName}"`);
        sendJsonResponse(res, 200, lookupValues, context.outputChannel);
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to get lookup values", context.outputChannel);
    }
}

/**
 * POST /api/lookup-values
 * Add a new lookup value to a lookup data object
 */
export async function addLookupValue(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        
        req.on("end", () => {
            try {
                const data = JSON.parse(body);
                const { lookupObjectName, name, displayName, description, isActive } = data;
                
                if (!lookupObjectName) {
                    sendErrorResponse(res, 400, "lookupObjectName is required", context.outputChannel);
                    return;
                }
                
                if (!name) {
                    sendErrorResponse(res, 400, "name is required", context.outputChannel);
                    return;
                }
                
                const modelService = ModelService.getInstance();
                const allObjects = modelService.getAllObjects();
                
                // Find the lookup object (case-sensitive)
                const lookupObject = allObjects.find((obj: any) => obj.name === lookupObjectName);
                
                if (!lookupObject) {
                    sendErrorResponse(res, 404, `Lookup object "${lookupObjectName}" not found`, context.outputChannel);
                    return;
                }
                
                // Validate it's a lookup object
                if (lookupObject.isLookup !== "true") {
                    sendErrorResponse(res, 400, `Object "${lookupObjectName}" is not a lookup object (isLookup must be "true")`, context.outputChannel);
                    return;
                }
                
                // Initialize lookupItem array if needed
                if (!lookupObject.lookupItem) {
                    lookupObject.lookupItem = [];
                }
                
                // Check for duplicate (case-insensitive)
                const duplicate = lookupObject.lookupItem.find((item: any) => 
                    item.name.toLowerCase() === name.toLowerCase()
                );
                
                if (duplicate) {
                    sendErrorResponse(res, 409, `Lookup value "${name}" already exists in "${lookupObjectName}"`, context.outputChannel);
                    return;
                }
                
                // Create new lookup value
                const newLookupValue = {
                    name,
                    displayName: displayName || name.replace(/([A-Z])/g, " $1").trim(),
                    description: description || `${name.replace(/([A-Z])/g, " $1").trim()} ${lookupObjectName.toLowerCase()}`,
                    isActive: isActive || "true"
                };
                
                // Add to lookupItem array
                lookupObject.lookupItem.push(newLookupValue);
                
                context.outputChannel.appendLine(`[Data Bridge] Added lookup value "${name}" to "${lookupObjectName}"`);
                sendJsonResponse(res, 201, {
                    success: true,
                    lookupValue: newLookupValue,
                    message: `Lookup value "${name}" added to "${lookupObjectName}" successfully`
                }, context.outputChannel);
            } catch (parseError) {
                sendErrorResponse(res, 400, "Invalid JSON", context.outputChannel);
            }
        });
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to add lookup value", context.outputChannel);
    }
}

/**
 * POST /api/lookup-values/update
 * Update an existing lookup value in a lookup data object
 */
export async function updateLookupValue(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        
        req.on("end", () => {
            try {
                const data = JSON.parse(body);
                const { lookupObjectName, name, displayName, description, isActive } = data;
                
                if (!lookupObjectName) {
                    sendErrorResponse(res, 400, "lookupObjectName is required", context.outputChannel);
                    return;
                }
                
                if (!name) {
                    sendErrorResponse(res, 400, "name is required", context.outputChannel);
                    return;
                }
                
                const modelService = ModelService.getInstance();
                const allObjects = modelService.getAllObjects();
                
                // Find the lookup object (case-sensitive)
                const lookupObject = allObjects.find((obj: any) => obj.name === lookupObjectName);
                
                if (!lookupObject || !lookupObject.lookupItem) {
                    sendErrorResponse(res, 404, `Lookup object "${lookupObjectName}" not found`, context.outputChannel);
                    return;
                }
                
                // Find the lookup value (case-sensitive exact match)
                const lookupValue = lookupObject.lookupItem.find((item: any) => item.name === name);
                
                if (!lookupValue) {
                    sendErrorResponse(res, 404, `Lookup value "${name}" not found in "${lookupObjectName}"`, context.outputChannel);
                    return;
                }
                
                // Update provided fields
                if (displayName !== undefined) {
                    lookupValue.displayName = displayName;
                }
                if (description !== undefined) {
                    lookupValue.description = description;
                }
                if (isActive !== undefined) {
                    lookupValue.isActive = isActive;
                }
                
                context.outputChannel.appendLine(`[Data Bridge] Updated lookup value "${name}" in "${lookupObjectName}"`);
                sendJsonResponse(res, 200, {
                    success: true,
                    lookupValue,
                    message: `Lookup value "${name}" in "${lookupObjectName}" updated successfully`
                }, context.outputChannel);
            } catch (parseError) {
                sendErrorResponse(res, 400, "Invalid JSON", context.outputChannel);
            }
        });
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to update lookup value", context.outputChannel);
    }
}

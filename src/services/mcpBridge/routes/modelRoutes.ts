// modelRoutes.ts
// Route handlers for general model and role operations
// Created on: November 30, 2025

import * as http from "http";
import { ModelService } from "../../modelService";
import { getUsageDetailData, findAllDataObjectReferences } from "../../../commands/dataObjectUsageAnalysisCommands";
import {
    sendJsonResponse,
    sendErrorResponse,
    logRequest
} from "../utils/routeUtils";
import { RouteContext } from "../types/routeTypes";

/**
 * GET /api/model
 * Return the entire model
 */
export async function getModel(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    const modelService = ModelService.getInstance();
    const model = modelService.getCurrentModel();
    
    context.outputChannel.appendLine("[Data Bridge] Returning full model");
    sendJsonResponse(res, 200, model || {}, context.outputChannel);
}

/**
 * GET /api/objects
 * Get all objects from all namespaces
 */
export async function getAllObjects(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    const modelService = ModelService.getInstance();
    const objects = modelService.getAllObjects();
    
    context.outputChannel.appendLine(`[Data Bridge] Returning ${objects.length} objects`);
    sendJsonResponse(res, 200, objects, context.outputChannel);
}

/**
 * GET /api/roles
 * Get all roles from Role data object lookup items
 */
export async function getRoles(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    const modelService = ModelService.getInstance();
    const roles: any[] = [];
    
    const allObjects = modelService.getAllObjects();
    allObjects.forEach((obj: any) => {
        if (obj.name && obj.name.toLowerCase() === "role") {
            if (obj.lookupItem && Array.isArray(obj.lookupItem)) {
                obj.lookupItem.forEach((lookupItem: any) => {
                    if (lookupItem.name) {
                        roles.push({
                            name: lookupItem.name,
                            displayName: lookupItem.displayName || "",
                            description: lookupItem.description || "",
                            isActive: lookupItem.isActive || "true"
                        });
                    }
                });
            }
        }
    });
    
    roles.sort((a, b) => a.name.localeCompare(b.name));
    
    context.outputChannel.appendLine(`[Data Bridge] Returning ${roles.length} roles`);
    sendJsonResponse(res, 200, roles, context.outputChannel);
}

/**
 * GET /api/data-object-usage
 * Get detailed usage data for all data objects
 */
export async function getDataObjectUsage(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const modelService = ModelService.getInstance();
        const usageData = getUsageDetailData(modelService);
        
        context.outputChannel.appendLine(`[Data Bridge] Returning ${usageData.length} data object usage references`);
        sendJsonResponse(res, 200, usageData, context.outputChannel);
    } catch (error) {
        context.outputChannel.appendLine(`[Data Bridge] Error getting usage data: ${error instanceof Error ? error.message : "Unknown error"}`);
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to get usage data", context.outputChannel);
    }
}

/**
 * GET /api/data-object-usage/:objectName
 * Get usage data for a specific data object
 */
export async function getDataObjectUsageByName(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    const objectName = decodeURIComponent(req.url!.substring("/api/data-object-usage/".length));
    
    try {
        const modelService = ModelService.getInstance();
        const references = findAllDataObjectReferences(objectName, modelService);
        const usageData = references.map(ref => ({
            dataObjectName: objectName,
            referenceType: ref.type,
            referencedBy: ref.referencedBy,
            itemType: ref.itemType
        }));
        
        context.outputChannel.appendLine(`[Data Bridge] Returning ${usageData.length} usage references for "${objectName}"`);
        sendJsonResponse(res, 200, usageData, context.outputChannel);
    } catch (error) {
        context.outputChannel.appendLine(`[Data Bridge] Error getting usage data for "${objectName}": ${error instanceof Error ? error.message : "Unknown error"}`);
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to get usage data", context.outputChannel);
    }
}

/**
 * POST /api/roles
 * Add a new role to the Role data object
 */
export async function addRole(
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
                const { name, displayName, description, isActive } = data;
                
                if (!name) {
                    sendErrorResponse(res, 400, "name is required", context.outputChannel);
                    return;
                }
                
                const modelService = ModelService.getInstance();
                const allObjects = modelService.getAllObjects();
                
                // Find the Role object
                const roleObject = allObjects.find((obj: any) => obj.name === "Role");
                
                if (!roleObject) {
                    sendErrorResponse(res, 404, "Role data object not found", context.outputChannel);
                    return;
                }
                
                // Initialize lookupItem array if needed
                if (!roleObject.lookupItem) {
                    roleObject.lookupItem = [];
                }
                
                // Check for duplicate (case-insensitive)
                const duplicate = roleObject.lookupItem.find((item: any) => 
                    item.name.toLowerCase() === name.toLowerCase()
                );
                
                if (duplicate) {
                    sendErrorResponse(res, 409, `Role "${name}" already exists`, context.outputChannel);
                    return;
                }
                
                // Create new role
                const newRole = {
                    name,
                    displayName: displayName || name.replace(/([A-Z])/g, " $1").trim(),
                    description: description || `${name.replace(/([A-Z])/g, " $1").trim()} role`,
                    isActive: isActive || "true"
                };
                
                // Add to lookupItem array
                roleObject.lookupItem.push(newRole);
                
                context.outputChannel.appendLine(`[Data Bridge] Added role "${name}"`);
                sendJsonResponse(res, 201, {
                    success: true,
                    role: newRole,
                    message: `Role "${name}" added successfully`
                }, context.outputChannel);
            } catch (parseError) {
                sendErrorResponse(res, 400, "Invalid JSON", context.outputChannel);
            }
        });
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to add role", context.outputChannel);
    }
}

/**
 * POST /api/roles/update
 * Update an existing role in the Role data object
 */
export async function updateRole(
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
                const { name, displayName, description, isActive } = data;
                
                if (!name) {
                    sendErrorResponse(res, 400, "name is required", context.outputChannel);
                    return;
                }
                
                const modelService = ModelService.getInstance();
                const allObjects = modelService.getAllObjects();
                
                // Find the Role object
                const roleObject = allObjects.find((obj: any) => obj.name === "Role");
                
                if (!roleObject || !roleObject.lookupItem) {
                    sendErrorResponse(res, 404, "Role data object not found", context.outputChannel);
                    return;
                }
                
                // Find the role (case-sensitive exact match)
                const role = roleObject.lookupItem.find((item: any) => item.name === name);
                
                if (!role) {
                    sendErrorResponse(res, 404, `Role "${name}" not found`, context.outputChannel);
                    return;
                }
                
                // Update provided fields
                if (displayName !== undefined) {
                    role.displayName = displayName;
                }
                if (description !== undefined) {
                    role.description = description;
                }
                if (isActive !== undefined) {
                    role.isActive = isActive;
                }
                
                context.outputChannel.appendLine(`[Data Bridge] Updated role "${name}"`);
                sendJsonResponse(res, 200, {
                    success: true,
                    role,
                    message: `Role "${name}" updated successfully`
                }, context.outputChannel);
            } catch (parseError) {
                sendErrorResponse(res, 400, "Invalid JSON", context.outputChannel);
            }
        });
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to update role", context.outputChannel);
    }
}

/**
 * GET /api/health
 * Health check endpoint
 */
export async function getHealth(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    const modelService = ModelService.getInstance();
    const model = modelService.getCurrentModel();
    
    sendJsonResponse(res, 200, {
        status: "ok",
        modelLoaded: !!model,
        timestamp: new Date().toISOString()
    }, context.outputChannel);
}

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

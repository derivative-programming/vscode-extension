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
        const dataObjectName = url.searchParams.get("data_object_name");
        
        if (!dataObjectName) {
            throw new Error("data_object_name parameter is required");
        }
        
        const modelService = ModelService.getInstance();
        const allObjects = modelService.getAllObjects();
        const dataObject = allObjects.find((obj: any) => 
            obj.name.toLowerCase() === dataObjectName.toLowerCase()
        );
        
        if (!dataObject) {
            throw new Error(`Data object "${dataObjectName}" not found`);
        }
        
        if (!dataObject.lookupItem || !Array.isArray(dataObject.lookupItem)) {
            sendJsonResponse(res, 200, [], context.outputChannel);
            return;
        }
        
        const lookupValues = dataObject.lookupItem.map((item: any) => ({
            name: item.name || "",
            displayName: item.displayName || "",
            description: item.description || "",
            isActive: item.isActive || "true"
        }));
        
        context.outputChannel.appendLine(`[Data Bridge] Returning ${lookupValues.length} lookup values for "${dataObjectName}"`);
        sendJsonResponse(res, 200, lookupValues, context.outputChannel);
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to get lookup values", context.outputChannel);
    }
}

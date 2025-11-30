// pageRoutes.ts
// Route handlers for page operations
// Created on: November 30, 2025

import * as http from "http";
import { ModelService } from "../../modelService";
import { sendJsonResponse, sendErrorResponse, logRequest } from "../utils/routeUtils";
import { RouteContext } from "../types/routeTypes";

/**
 * GET /api/pages
 * Get all pages with optional filtering
 */
export async function getPages(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const pageName = url.searchParams.get("page_name");
        const pageType = url.searchParams.get("page_type");
        
        const modelService = ModelService.getInstance();
        const allObjects = modelService.getAllObjects();
        const pages: any[] = [];
        
        for (const obj of allObjects) {
            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                for (const workflow of obj.objectWorkflow) {
                    if (workflow.isPage !== "true") {
                        continue;
                    }
                    
                    if (pageName && workflow.name.toLowerCase() !== pageName.toLowerCase()) {
                        continue;
                    }
                    
                    pages.push({
                        ...workflow,
                        _ownerObjectName: obj.name
                    });
                }
            }
        }
        
        context.outputChannel.appendLine(`[Data Bridge] Returning ${pages.length} pages`);
        sendJsonResponse(res, 200, pages, context.outputChannel);
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to get pages", context.outputChannel);
    }
}

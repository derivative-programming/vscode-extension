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
        // Parse query parameters if present
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const filters: any = {};
        
        const pageName = url.searchParams.get("page_name");
        const pageType = url.searchParams.get("page_type");
        const ownerObject = url.searchParams.get("owner_object");
        const targetChildObject = url.searchParams.get("target_child_object");
        const roleRequired = url.searchParams.get("role_required");
        
        if (pageName) { filters.pageName = pageName; }
        if (pageType) { filters.pageType = pageType; }
        if (ownerObject) { filters.ownerObject = ownerObject; }
        if (targetChildObject) { filters.targetChildObject = targetChildObject; }
        if (roleRequired) { filters.roleRequired = roleRequired; }
        
        // Use ModelService's getPagesWithDetails method
        const modelService = ModelService.getInstance();
        const pages = modelService.getPagesWithDetails(Object.keys(filters).length > 0 ? filters : undefined);
        
        context.outputChannel.appendLine(`[Data Bridge] Returning ${pages.length} pages (filtered: ${Object.keys(filters).length > 0})`);
        sendJsonResponse(res, 200, pages, context.outputChannel);
    } catch (error) {
        context.outputChannel.appendLine(`[Data Bridge] Error getting pages: ${error instanceof Error ? error.message : "Unknown error"}`);
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to get pages", context.outputChannel);
    }
}

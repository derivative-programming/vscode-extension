// routeRegistry.ts
// Central registry for all MCP Bridge routes
// Created on: November 30, 2025

import * as http from "http";
import { RouteDefinition, RouteContext } from "../types/routeTypes";
import * as dataObjectRoutes from "../routes/dataObjectRoutes";
import * as userStoryRoutes from "../routes/userStoryRoutes";
import * as modelRoutes from "../routes/modelRoutes";
import * as formRoutes from "../routes/formRoutes";
import * as pageRoutes from "../routes/pageRoutes";
import * as lookupRoutes from "../routes/lookupRoutes";
import * as reportRoutes from "../routes/reportRoutes";
import * as generalFlowRoutes from "../routes/generalFlowRoutes";
import * as pageInitFlowRoutes from "../routes/pageInitFlowRoutes";
import * as modelServiceRoutes from "../routes/modelServiceRoutes";

/**
 * Route matcher that checks if a request matches a route definition
 */
export function matchRoute(req: http.IncomingMessage, route: RouteDefinition): boolean {
    if (req.method !== route.method) {
        return false;
    }
    
    if (typeof route.path === "string") {
        return req.url === route.path;
    } else {
        // RegExp pattern
        return route.path.test(req.url || "");
    }
}

/**
 * All registered routes for the data bridge (port 3001)
 * IMPORTANT: Routes are matched in order - more specific routes must come before general ones
 */
export function getDataBridgeRoutes(): RouteDefinition[] {
    return [
        // User Stories (exact matches first)
        { method: "POST", path: "/api/user-stories/update", handler: userStoryRoutes.updateUserStory },
        { method: "GET", path: "/api/user-stories", handler: userStoryRoutes.getUserStories },
        { method: "POST", path: "/api/user-stories", handler: userStoryRoutes.createUserStory },
        
        // Model & General
        { method: "GET", path: "/api/model", handler: modelRoutes.getModel },
        { method: "GET", path: "/api/objects", handler: modelRoutes.getAllObjects },
        { method: "POST", path: "/api/roles/update", handler: modelRoutes.updateRole },
        { method: "POST", path: "/api/roles", handler: modelRoutes.addRole },
        { method: "GET", path: "/api/roles", handler: modelRoutes.getRoles },
        { method: "GET", path: "/api/health", handler: modelRoutes.getHealth },
        
        // Data Object Usage (exact match first, then regex)
        { method: "GET", path: "/api/data-object-usage", handler: modelRoutes.getDataObjectUsage },
        { method: "GET", path: /^\/api\/data-object-usage\/.+/, handler: modelRoutes.getDataObjectUsageByName },
        
        // Data Objects (exact matches first, then regex)
        { method: "GET", path: "/api/data-objects-full", handler: dataObjectRoutes.getDataObjectsFull },
        { method: "GET", path: "/api/data-objects", handler: dataObjectRoutes.getDataObjectsSummary },
        { method: "POST", path: "/api/update-full-data-object", handler: dataObjectRoutes.updateFullDataObject },
        { method: "POST", path: "/api/data-objects/update", handler: dataObjectRoutes.updateDataObject },
        { method: "POST", path: "/api/data-objects/add-props", handler: dataObjectRoutes.addDataObjectProps },
        { method: "POST", path: "/api/data-objects/update-prop", handler: dataObjectRoutes.updateDataObjectProp },
        { method: "POST", path: "/api/data-objects", handler: dataObjectRoutes.createDataObject },
        { method: "GET", path: /^\/api\/data-objects\/.+/, handler: dataObjectRoutes.getDataObjectByName },
        
        // Forms (14 endpoints)
        { method: "GET", path: /^\/api\/forms/, handler: formRoutes.getForms },
        { method: "POST", path: "/api/create-form", handler: formRoutes.createForm },
        { method: "POST", path: "/api/update-form", handler: formRoutes.updateForm },
        { method: "POST", path: "/api/update-full-form", handler: formRoutes.updateFullForm },
        { method: "POST", path: "/api/add-form-param", handler: formRoutes.addFormParam },
        { method: "POST", path: "/api/update-form-param", handler: formRoutes.updateFormParam },
        { method: "POST", path: "/api/move-form-param", handler: formRoutes.moveFormParam },
        { method: "POST", path: "/api/add-form-button", handler: formRoutes.addFormButton },
        { method: "POST", path: "/api/update-form-button", handler: formRoutes.updateFormButton },
        { method: "POST", path: "/api/move-form-button", handler: formRoutes.moveFormButton },
        { method: "POST", path: "/api/add-form-output-var", handler: formRoutes.addFormOutputVar },
        { method: "POST", path: "/api/update-form-output-var", handler: formRoutes.updateFormOutputVar },
        { method: "POST", path: "/api/move-form-output-var", handler: formRoutes.moveFormOutputVar },
        
        // Pages (1 endpoint)
        { method: "GET", path: /^\/api\/pages/, handler: pageRoutes.getPages },
        
        // Lookups (3 endpoints)
        { method: "POST", path: "/api/lookup-values/update", handler: lookupRoutes.updateLookupValue },
        { method: "POST", path: "/api/lookup-values", handler: lookupRoutes.addLookupValue },
        { method: "GET", path: /^\/api\/lookup-values/, handler: lookupRoutes.getLookupValues },
        
        // Reports (13 endpoints)
        { method: "GET", path: /^\/api\/reports/, handler: reportRoutes.getReports },
        { method: "POST", path: "/api/create-report", handler: reportRoutes.createReport },
        { method: "POST", path: "/api/update-report", handler: reportRoutes.updateReport },
        { method: "POST", path: "/api/update-full-report", handler: reportRoutes.updateFullReport },
        { method: "POST", path: "/api/add-report-param", handler: reportRoutes.addReportParam },
        { method: "POST", path: "/api/update-report-param", handler: reportRoutes.updateReportParam },
        { method: "POST", path: "/api/move-report-param", handler: reportRoutes.moveReportParam },
        { method: "POST", path: "/api/add-report-column", handler: reportRoutes.addReportColumn },
        { method: "POST", path: "/api/update-report-column", handler: reportRoutes.updateReportColumn },
        { method: "POST", path: "/api/move-report-column", handler: reportRoutes.moveReportColumn },
        { method: "POST", path: "/api/add-report-button", handler: reportRoutes.addReportButton },
        { method: "POST", path: "/api/update-report-button", handler: reportRoutes.updateReportButton },
        { method: "POST", path: "/api/move-report-button", handler: reportRoutes.moveReportButton },
        
        // General Flows (10 stub endpoints - need implementation from mcpBridge.ts lines 897-1852)
        { method: "GET", path: "/api/general-flows-summary", handler: generalFlowRoutes.getGeneralFlowsSummary },
        { method: "GET", path: "/api/general-flows", handler: generalFlowRoutes.getGeneralFlows },
        { method: "POST", path: "/api/update-general-flow", handler: generalFlowRoutes.updateGeneralFlow },
        { method: "POST", path: "/api/update-full-general-flow", handler: generalFlowRoutes.updateFullGeneralFlow },
        { method: "POST", path: "/api/add-general-flow-output-var", handler: generalFlowRoutes.addGeneralFlowOutputVar },
        { method: "POST", path: "/api/update-general-flow-output-var", handler: generalFlowRoutes.updateGeneralFlowOutputVar },
        { method: "POST", path: "/api/move-general-flow-output-var", handler: generalFlowRoutes.moveGeneralFlowOutputVar },
        { method: "POST", path: "/api/add-general-flow-param", handler: generalFlowRoutes.addGeneralFlowParam },
        { method: "POST", path: "/api/update-general-flow-param", handler: generalFlowRoutes.updateGeneralFlowParam },
        { method: "POST", path: "/api/move-general-flow-param", handler: generalFlowRoutes.moveGeneralFlowParam },
        
        // Page Init Flows (6 stub endpoints - need implementation from mcpBridge.ts lines 1853-2410)
        { method: "GET", path: "/api/page-init-flows", handler: pageInitFlowRoutes.getPageInitFlows },
        { method: "POST", path: "/api/update-page-init-flow", handler: pageInitFlowRoutes.updatePageInitFlow },
        { method: "POST", path: "/api/update-full-page-init-flow", handler: pageInitFlowRoutes.updateFullPageInitFlow },
        { method: "POST", path: "/api/add-page-init-flow-output-var", handler: pageInitFlowRoutes.addPageInitFlowOutputVar },
        { method: "POST", path: "/api/update-page-init-flow-output-var", handler: pageInitFlowRoutes.updatePageInitFlowOutputVar },
        { method: "POST", path: "/api/move-page-init-flow-output-var", handler: pageInitFlowRoutes.movePageInitFlowOutputVar },
        
        // Model Services (13 endpoints)
        { method: "GET", path: "/api/auth-status", handler: modelServiceRoutes.getAuthStatus },
        { method: "GET", path: "/api/model-services/model-features", handler: modelServiceRoutes.getModelFeatures },
        { method: "GET", path: "/api/model-services/prep-requests", handler: modelServiceRoutes.getPrepRequests },
        { method: "POST", path: "/api/model-services/create-prep-request", handler: modelServiceRoutes.createPrepRequest },
        { method: "POST", path: "/api/model-services/create-validation-request", handler: modelServiceRoutes.createValidationRequest },
        { method: "POST", path: "/api/model-services/create-fabrication-request", handler: modelServiceRoutes.createFabricationRequest },
        { method: "GET", path: "/api/model-services/validation-requests", handler: modelServiceRoutes.getValidationRequests },
        { method: "GET", path: "/api/model-services/fabrication-requests", handler: modelServiceRoutes.getFabricationRequests },
        { method: "GET", path: /^\/api\/model-services\/prep-request-details/, handler: modelServiceRoutes.getPrepRequestDetails },
        { method: "POST", path: "/api/model-services/merge-ai-processing-results", handler: modelServiceRoutes.mergeAiProcessingResults },
        { method: "GET", path: /^\/api\/model-services\/validation-request-details/, handler: modelServiceRoutes.getValidationRequestDetails },
        { method: "GET", path: /^\/api\/model-services\/fabrication-request-details/, handler: modelServiceRoutes.getFabricationRequestDetails },
        { method: "GET", path: /^\/api\/model-services\/template-sets/, handler: modelServiceRoutes.getTemplateSets }
    ];
}

/**
 * All registered routes for the command bridge (port 3002)
 * Currently uses legacy handler from original file
 */
export function getCommandBridgeRoutes(): RouteDefinition[] {
    return [
        // Command bridge routes will be migrated separately
    ];
}

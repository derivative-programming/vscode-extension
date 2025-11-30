// pageInitFlowRoutes.ts
// Route handlers for page init flow operations  
// Created on: November 30, 2025

import * as http from "http";
import { ModelService } from "../../modelService";
import { sendJsonResponse, sendErrorResponse, logRequest, parseRequestBody, ensureModelLoaded } from "../utils/routeUtils";
import { RouteContext } from "../types/routeTypes";

/**
 * Helper to check if a workflow is a page init flow
 */
function isPageInitFlow(workflow: any): boolean {
    const workflowName = workflow.name ? workflow.name.toLowerCase() : '';
    return workflowName.endsWith('initreport') || workflowName.endsWith('initobjwf');
}

/**
 * Helper to find a page init flow by name
 */
function findPageInitFlow(model: any, flowName: string): { flow: any; ownerObjectName: string } | null {
    if (!model.namespace || !Array.isArray(model.namespace)) {
        return null;
    }
    
    for (const ns of model.namespace) {
        if (ns.object && Array.isArray(ns.object)) {
            for (const obj of ns.object) {
                if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                    const flow = obj.objectWorkflow.find((wf: any) => 
                        wf.name === flowName && isPageInitFlow(wf)
                    );
                    if (flow) {
                        return { flow, ownerObjectName: obj.name };
                    }
                }
            }
        }
    }
    return null;
}

/**
 * GET /api/page-init-flows
 */
export async function getPageInitFlows(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        if (!ensureModelLoaded(res, context.outputChannel)) {
            return;
        }
        
        const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        const pageInitFlowName = url.searchParams.get('page_init_flow_name');
        const ownerObjectName = url.searchParams.get('owner_object_name');
        
        const modelService = ModelService.getInstance();
        const allObjects = modelService.getAllObjects();
        const pageInitFlows: any[] = [];
        
        context.outputChannel.appendLine(`[Data Bridge] Searching for page init flow: "${pageInitFlowName}", owner: "${ownerObjectName || 'any'}"`);
        context.outputChannel.appendLine(`[Data Bridge] Total objects to search: ${allObjects.length}`);
        
        for (const obj of allObjects) {
            // Skip objects without a name
            if (!obj.name) {
                continue;
            }
            
            if (ownerObjectName && obj.name.toLowerCase() !== ownerObjectName.toLowerCase()) {
                continue;
            }
            
            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                for (const workflow of obj.objectWorkflow) {
                    if (!workflow || !workflow.name) {
                        continue;
                    }
                    
                    // Debug: Log workflow being checked
                    if (pageInitFlowName && workflow.name.toLowerCase() === pageInitFlowName.toLowerCase()) {
                        context.outputChannel.appendLine(`[Data Bridge] Found workflow "${workflow.name}" - checking if page init flow...`);
                        const isPageInit = isPageInitFlow(workflow);
                        context.outputChannel.appendLine(`[Data Bridge] isPageInitFlow result: ${isPageInit}`);
                    }
                    
                    if (!isPageInitFlow(workflow)) {
                        continue;
                    }
                    
                    if (pageInitFlowName && workflow.name.toLowerCase() !== pageInitFlowName.toLowerCase()) {
                        continue;
                    }
                    
                    pageInitFlows.push({
                        ...workflow,
                        _ownerObjectName: obj.name
                    });
                    
                    if (pageInitFlowName && workflow.name.toLowerCase() === pageInitFlowName.toLowerCase()) {
                        context.outputChannel.appendLine(`[Data Bridge] Found page init flow "${workflow.name}" in owner object "${obj.name}"`);
                        sendJsonResponse(res, 200, pageInitFlows, context.outputChannel);
                        return;
                    }
                }
            }
        }
        
        context.outputChannel.appendLine(`[Data Bridge] Returning ${pageInitFlows.length} page init flows`);
        sendJsonResponse(res, 200, pageInitFlows, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : 'Failed to get page init flows', context.outputChannel);
    }
}

/**
 * POST /api/update-page-init-flow
 */
export async function updatePageInitFlow(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const body = await parseRequestBody(req);
        const { page_init_flow_name, updates } = body;
        
        if (!page_init_flow_name) {
            sendErrorResponse(res, 400, "page_init_flow_name is required", context.outputChannel);
            return;
        }
        
        if (!updates || Object.keys(updates).length === 0) {
            sendErrorResponse(res, 400, "At least one property to update is required", context.outputChannel);
            return;
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        if (!model) {
            sendErrorResponse(res, 400, "No model loaded", context.outputChannel);
            return;
        }
        
        const found = findPageInitFlow(model, page_init_flow_name);
        if (!found) {
            sendErrorResponse(res, 404, `Page init flow "${page_init_flow_name}" not found. Page init flows must end with "InitObjWF" or "InitReport".`, context.outputChannel);
            return;
        }
        
        for (const [key, value] of Object.entries(updates)) {
            found.flow[key] = value;
        }
        
        modelService.markUnsavedChanges();
        context.outputChannel.appendLine(`[Data Bridge] Updated page init flow "${page_init_flow_name}" in owner object "${found.ownerObjectName}"`);
        
        sendJsonResponse(res, 200, {
            success: true,
            page_init_flow: found.flow,
            owner_object_name: found.ownerObjectName
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : 'Failed to update page init flow', context.outputChannel);
    }
}

/**
 * POST /api/update-full-page-init-flow
 */
export async function updateFullPageInitFlow(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const body = await parseRequestBody(req);
        const { page_init_flow_name, page_init_flow } = body;
        
        if (!page_init_flow_name) {
            sendErrorResponse(res, 400, "page_init_flow_name is required", context.outputChannel);
            return;
        }
        
        if (!page_init_flow || typeof page_init_flow !== 'object') {
            sendErrorResponse(res, 400, "page_init_flow object is required", context.outputChannel);
            return;
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findPageInitFlow(model, page_init_flow_name);
        
        if (!found) {
            sendErrorResponse(res, 404, `Page init flow "${page_init_flow_name}" not found`, context.outputChannel);
            return;
        }
        
        const originalName = found.flow.name;
        
        Object.keys(found.flow).forEach(key => {
            delete found.flow[key];
        });
        
        Object.keys(page_init_flow).forEach(key => {
            found.flow[key] = page_init_flow[key];
        });
        
        found.flow.name = originalName;
        
        modelService.markUnsavedChanges();
        context.outputChannel.appendLine(`[Data Bridge] Fully updated page init flow "${page_init_flow_name}" in owner object "${found.ownerObjectName}"`);
        
        sendJsonResponse(res, 200, {
            success: true,
            page_init_flow: found.flow,
            owner_object_name: found.ownerObjectName
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : 'Failed to update full page init flow', context.outputChannel);
    }
}

/**
 * POST /api/add-page-init-flow-output-var
 */
export async function addPageInitFlowOutputVar(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const body = await parseRequestBody(req);
        const { page_init_flow_name, output_var } = body;
        
        if (!page_init_flow_name) {
            sendErrorResponse(res, 400, "page_init_flow_name is required", context.outputChannel);
            return;
        }
        
        if (!output_var || !output_var.name) {
            sendErrorResponse(res, 400, "output_var with name property is required", context.outputChannel);
            return;
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findPageInitFlow(model, page_init_flow_name);
        
        if (!found) {
            sendErrorResponse(res, 404, `Page init flow "${page_init_flow_name}" not found. Page init flows must end with "InitObjWF" or "InitReport".`, context.outputChannel);
            return;
        }
        
        if (!found.flow.objectWorkflowOutputVar) {
            found.flow.objectWorkflowOutputVar = [];
        }
        
        found.flow.objectWorkflowOutputVar.push(output_var);
        modelService.markUnsavedChanges();
        context.outputChannel.appendLine(`[Data Bridge] Added output variable "${output_var.name}" to page init flow "${page_init_flow_name}" in owner object "${found.ownerObjectName}"`);
        
        sendJsonResponse(res, 200, {
            success: true,
            output_var: output_var,
            owner_object_name: found.ownerObjectName
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : 'Failed to add page init flow output variable', context.outputChannel);
    }
}

/**
 * POST /api/update-page-init-flow-output-var
 */
export async function updatePageInitFlowOutputVar(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const body = await parseRequestBody(req);
        const { page_init_flow_name, output_var_name, updates } = body;
        
        if (!page_init_flow_name) {
            sendErrorResponse(res, 400, "page_init_flow_name is required", context.outputChannel);
            return;
        }
        
        if (!output_var_name) {
            sendErrorResponse(res, 400, "output_var_name is required", context.outputChannel);
            return;
        }
        
        if (!updates || Object.keys(updates).length === 0) {
            sendErrorResponse(res, 400, "At least one property to update is required", context.outputChannel);
            return;
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findPageInitFlow(model, page_init_flow_name);
        
        if (!found) {
            sendErrorResponse(res, 404, `Page init flow "${page_init_flow_name}" not found. Page init flows must end with "InitObjWF" or "InitReport".`, context.outputChannel);
            return;
        }
        
        if (!found.flow.objectWorkflowOutputVar || !Array.isArray(found.flow.objectWorkflowOutputVar)) {
            sendErrorResponse(res, 404, `Page init flow "${page_init_flow_name}" has no output variables`, context.outputChannel);
            return;
        }
        
        const foundOutputVar = found.flow.objectWorkflowOutputVar.find((v: any) => v.name === output_var_name);
        if (!foundOutputVar) {
            sendErrorResponse(res, 404, `Output variable "${output_var_name}" not found in page init flow "${page_init_flow_name}"`, context.outputChannel);
            return;
        }
        
        for (const [key, value] of Object.entries(updates)) {
            foundOutputVar[key] = value;
        }
        
        modelService.markUnsavedChanges();
        context.outputChannel.appendLine(`[Data Bridge] Updated output variable "${output_var_name}" in page init flow "${page_init_flow_name}" in owner object "${found.ownerObjectName}"`);
        
        sendJsonResponse(res, 200, {
            success: true,
            output_var: foundOutputVar,
            owner_object_name: found.ownerObjectName
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : 'Failed to update page init flow output variable', context.outputChannel);
    }
}

/**
 * POST /api/move-page-init-flow-output-var
 */
export async function movePageInitFlowOutputVar(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const body = await parseRequestBody(req);
        const { page_init_flow_name, output_var_name, new_position } = body;
        
        if (!page_init_flow_name) {
            sendErrorResponse(res, 400, "page_init_flow_name is required", context.outputChannel);
            return;
        }
        
        if (!output_var_name) {
            sendErrorResponse(res, 400, "output_var_name is required", context.outputChannel);
            return;
        }
        
        if (typeof new_position !== 'number' || new_position < 0) {
            sendErrorResponse(res, 400, "new_position must be a non-negative number", context.outputChannel);
            return;
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findPageInitFlow(model, page_init_flow_name);
        
        if (!found) {
            sendErrorResponse(res, 404, `Page init flow "${page_init_flow_name}" not found. Page init flows must end with "InitObjWF" or "InitReport".`, context.outputChannel);
            return;
        }
        
        if (!found.flow.objectWorkflowOutputVar || !Array.isArray(found.flow.objectWorkflowOutputVar)) {
            sendErrorResponse(res, 404, `Page init flow "${page_init_flow_name}" has no output variables`, context.outputChannel);
            return;
        }
        
        const outputVarIndex = found.flow.objectWorkflowOutputVar.findIndex((v: any) => v.name === output_var_name);
        
        if (outputVarIndex === -1) {
            sendErrorResponse(res, 404, `Output variable "${output_var_name}" not found in page init flow "${page_init_flow_name}"`, context.outputChannel);
            return;
        }
        
        const outputVarCount = found.flow.objectWorkflowOutputVar.length;
        if (new_position >= outputVarCount) {
            sendErrorResponse(res, 400, `new_position (${new_position}) must be less than output variable count (${outputVarCount}). Valid range: 0 to ${outputVarCount - 1}`, context.outputChannel);
            return;
        }
        
        const old_position = outputVarIndex;
        
        if (old_position === new_position) {
            sendJsonResponse(res, 200, {
                success: true,
                owner_object_name: found.ownerObjectName,
                old_position: old_position,
                new_position: new_position,
                output_var_count: outputVarCount,
                message: `Output variable "${output_var_name}" is already at position ${new_position}`
            }, context.outputChannel);
            return;
        }
        
        const [movedVar] = found.flow.objectWorkflowOutputVar.splice(outputVarIndex, 1);
        found.flow.objectWorkflowOutputVar.splice(new_position, 0, movedVar);
        
        modelService.markUnsavedChanges();
        context.outputChannel.appendLine(`[Data Bridge] Moved output variable "${output_var_name}" in page init flow "${page_init_flow_name}" from position ${old_position} to ${new_position}`);
        
        sendJsonResponse(res, 200, {
            success: true,
            owner_object_name: found.ownerObjectName,
            old_position: old_position,
            new_position: new_position,
            output_var_count: outputVarCount
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : 'Failed to move page init flow output variable', context.outputChannel);
    }
}

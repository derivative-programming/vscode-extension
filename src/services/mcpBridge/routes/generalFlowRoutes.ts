// generalFlowRoutes.ts
// Route handlers for general flow operations
// Created on: November 30, 2025

import * as http from "http";
import { ModelService } from "../../modelService";
import { sendJsonResponse, sendErrorResponse, logRequest, parseRequestBody, ensureModelLoaded } from "../utils/routeUtils";
import { RouteContext } from "../types/routeTypes";

/**
 * Helper to check if a workflow is a general flow
 */
function isGeneralFlow(workflow: any): boolean {
    const isDynaFlowOk = !workflow.isDynaFlow || workflow.isDynaFlow === "false";
    const isDynaFlowTaskOk = !workflow.isDynaFlowTask || workflow.isDynaFlowTask === "false";
    const isPageOk = workflow.isPage === "false";
    const workflowName = (workflow.name || '').toLowerCase();
    const notInitObjWf = !workflowName.endsWith('initobjwf');
    const notInitReport = !workflowName.endsWith('initreport');
    
    return isDynaFlowOk && isDynaFlowTaskOk && isPageOk && notInitObjWf && notInitReport;
}

/**
 * Helper to find a general flow by name across all objects
 */
function findGeneralFlow(model: any, flowName: string): { flow: any; ownerObjectName: string } | null {
    if (!model.namespace || !Array.isArray(model.namespace)) {
        return null;
    }
    
    for (const ns of model.namespace) {
        if (ns.object && Array.isArray(ns.object)) {
            for (const obj of ns.object) {
                if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                    const flow = obj.objectWorkflow.find((wf: any) => 
                        wf.name === flowName && isGeneralFlow(wf)
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
 * GET /api/general-flows-summary
 */
export async function getGeneralFlowsSummary(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        if (!ensureModelLoaded(res, context.outputChannel)) {
            return;
        }
        
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const generalFlowName = url.searchParams.get('general_flow_name');
        const ownerObjectName = url.searchParams.get('owner_object_name');
        
        const modelService = ModelService.getInstance();
        const allObjects = modelService.getAllObjects();
        const generalFlows: any[] = [];
        
        for (const obj of allObjects) {
            if (ownerObjectName && obj.name.toLowerCase() !== ownerObjectName.toLowerCase()) {
                continue;
            }
            
            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                for (const workflow of obj.objectWorkflow) {
                    if (!isGeneralFlow(workflow)) {
                        continue;
                    }
                    
                    if (generalFlowName && workflow.name.toLowerCase() !== generalFlowName.toLowerCase()) {
                        continue;
                    }
                    
                    const paramCount = (workflow.objectWorkflowParam && Array.isArray(workflow.objectWorkflowParam)) 
                        ? workflow.objectWorkflowParam.length : 0;
                    const outputVarCount = (workflow.objectWorkflowOutputVar && Array.isArray(workflow.objectWorkflowOutputVar)) 
                        ? workflow.objectWorkflowOutputVar.length : 0;
                    
                    generalFlows.push({
                        name: workflow.name,
                        ownerObject: obj.name,
                        roleRequired: workflow.roleRequired || 'Public',
                        paramCount: paramCount,
                        outputVarCount: outputVarCount
                    });
                    
                    if (generalFlowName && workflow.name.toLowerCase() === generalFlowName.toLowerCase()) {
                        context.outputChannel.appendLine(`[Data Bridge] Found general flow summary "${workflow.name}" in owner object "${obj.name}"`);
                        sendJsonResponse(res, 200, generalFlows, context.outputChannel);
                        return;
                    }
                }
            }
        }
        
        context.outputChannel.appendLine(`[Data Bridge] Returning ${generalFlows.length} general flow summaries`);
        sendJsonResponse(res, 200, generalFlows, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : 'Failed to get general flow summaries', context.outputChannel);
    }
}

/**
 * GET /api/general-flows
 */
export async function getGeneralFlows(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        if (!ensureModelLoaded(res, context.outputChannel)) {
            return;
        }
        
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const generalFlowName = url.searchParams.get('general_flow_name');
        const ownerObjectName = url.searchParams.get('owner_object_name');
        
        const modelService = ModelService.getInstance();
        const allObjects = modelService.getAllObjects();
        const generalFlows: any[] = [];
        
        for (const obj of allObjects) {
            if (ownerObjectName && obj.name.toLowerCase() !== ownerObjectName.toLowerCase()) {
                continue;
            }
            
            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                for (const workflow of obj.objectWorkflow) {
                    if (!isGeneralFlow(workflow)) {
                        continue;
                    }
                    
                    if (generalFlowName && workflow.name.toLowerCase() !== generalFlowName.toLowerCase()) {
                        continue;
                    }
                    
                    const filteredParams = workflow.objectWorkflowParam ? workflow.objectWorkflowParam.map((param: any) => {
                        const { defaultValue, fKObjectName, isFK, isFKLookup, isRequired, isSecured, validationRuleRegExMatchRequired, validationRuleRegExMatchRequiredErrorText, labelText, isVisible, ...allowedProps } = param;
                        return allowedProps;
                    }) : [];
                    
                    const filteredOutputVars = workflow.objectWorkflowOutputVar ? workflow.objectWorkflowOutputVar.map((outputVar: any) => {
                        const { defaultValue, fKObjectName, isFK, isFKLookup, labelText, isVisible, isLabelVisible, isHeaderText, isLink, conditionalVisiblePropertyName, ...allowedProps } = outputVar;
                        return allowedProps;
                    }) : [];
                    
                    const { isPage, ...workflowWithoutIsPage } = workflow;
                    const completeFlow = {
                        ...workflowWithoutIsPage,
                        objectWorkflowParam: filteredParams,
                        objectWorkflowOutputVar: filteredOutputVars,
                        _ownerObjectName: obj.name
                    };
                    
                    generalFlows.push(completeFlow);
                    
                    if (generalFlowName && workflow.name.toLowerCase() === generalFlowName.toLowerCase()) {
                        context.outputChannel.appendLine(`[Data Bridge] Found complete general flow "${workflow.name}" in owner object "${obj.name}"`);
                        sendJsonResponse(res, 200, generalFlows, context.outputChannel);
                        return;
                    }
                }
            }
        }
        
        context.outputChannel.appendLine(`[Data Bridge] Returning ${generalFlows.length} complete general flows`);
        sendJsonResponse(res, 200, generalFlows, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : 'Failed to get general flows', context.outputChannel);
    }
}

/**
 * POST /api/update-general-flow
 */
export async function updateGeneralFlow(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const body = await parseRequestBody(req);
        const { general_flow_name, updates } = body;
        
        if (!general_flow_name) {
            sendErrorResponse(res, 400, "general_flow_name is required", context.outputChannel);
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
        
        const found = findGeneralFlow(model, general_flow_name);
        if (!found) {
            sendErrorResponse(res, 404, `General flow "${general_flow_name}" not found`, context.outputChannel);
            return;
        }
        
        for (const [key, value] of Object.entries(updates)) {
            found.flow[key] = value;
        }
        
        modelService.markUnsavedChanges();
        context.outputChannel.appendLine(`[Data Bridge] Updated general flow "${general_flow_name}" in owner object "${found.ownerObjectName}"`);
        
        sendJsonResponse(res, 200, {
            success: true,
            general_flow: found.flow,
            owner_object_name: found.ownerObjectName
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : 'Failed to update general flow', context.outputChannel);
    }
}

/**
 * POST /api/update-full-general-flow
 */
export async function updateFullGeneralFlow(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const body = await parseRequestBody(req);
        const { general_flow_name, general_flow } = body;
        
        if (!general_flow_name) {
            sendErrorResponse(res, 400, "general_flow_name is required", context.outputChannel);
            return;
        }
        
        if (!general_flow || typeof general_flow !== 'object') {
            sendErrorResponse(res, 400, "general_flow object is required", context.outputChannel);
            return;
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findGeneralFlow(model, general_flow_name);
        
        if (!found) {
            sendErrorResponse(res, 404, `General flow "${general_flow_name}" not found`, context.outputChannel);
            return;
        }
        
        const originalName = found.flow.name;
        
        Object.keys(found.flow).forEach(key => {
            delete found.flow[key];
        });
        
        Object.keys(general_flow).forEach(key => {
            found.flow[key] = general_flow[key];
        });
        
        found.flow.name = originalName;
        
        modelService.markUnsavedChanges();
        context.outputChannel.appendLine(`[Data Bridge] Fully updated general flow "${general_flow_name}" in owner object "${found.ownerObjectName}"`);
        
        sendJsonResponse(res, 200, {
            success: true,
            general_flow: found.flow,
            owner_object_name: found.ownerObjectName
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : 'Failed to update full general flow', context.outputChannel);
    }
}

/**
 * POST /api/add-general-flow-output-var
 */
export async function addGeneralFlowOutputVar(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const body = await parseRequestBody(req);
        const { general_flow_name, output_var } = body;
        
        if (!general_flow_name) {
            sendErrorResponse(res, 400, "general_flow_name is required", context.outputChannel);
            return;
        }
        
        if (!output_var || !output_var.name) {
            sendErrorResponse(res, 400, "output_var with name property is required", context.outputChannel);
            return;
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findGeneralFlow(model, general_flow_name);
        
        if (!found) {
            sendErrorResponse(res, 404, `General flow "${general_flow_name}" not found`, context.outputChannel);
            return;
        }
        
        if (!found.flow.objectWorkflowOutputVar) {
            found.flow.objectWorkflowOutputVar = [];
        }
        
        const existingOutputVar = found.flow.objectWorkflowOutputVar.find((ov: any) => ov.name === output_var.name);
        if (existingOutputVar) {
            sendErrorResponse(res, 400, `Output variable "${output_var.name}" already exists in general flow "${general_flow_name}"`, context.outputChannel);
            return;
        }
        
        found.flow.objectWorkflowOutputVar.push(output_var);
        modelService.markUnsavedChanges();
        context.outputChannel.appendLine(`[Data Bridge] Added output variable "${output_var.name}" to general flow "${general_flow_name}" in owner object "${found.ownerObjectName}"`);
        
        sendJsonResponse(res, 200, {
            success: true,
            output_var: output_var,
            owner_object_name: found.ownerObjectName
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : 'Failed to add general flow output variable', context.outputChannel);
    }
}

/**
 * POST /api/update-general-flow-output-var
 */
export async function updateGeneralFlowOutputVar(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const body = await parseRequestBody(req);
        const { general_flow_name, output_var_name, updates } = body;
        
        if (!general_flow_name) {
            sendErrorResponse(res, 400, "general_flow_name is required", context.outputChannel);
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
        const found = findGeneralFlow(model, general_flow_name);
        
        if (!found) {
            sendErrorResponse(res, 404, `General flow "${general_flow_name}" not found`, context.outputChannel);
            return;
        }
        
        if (!found.flow.objectWorkflowOutputVar || !Array.isArray(found.flow.objectWorkflowOutputVar)) {
            sendErrorResponse(res, 404, `General flow "${general_flow_name}" has no output variables`, context.outputChannel);
            return;
        }
        
        const outputVar = found.flow.objectWorkflowOutputVar.find((ov: any) => ov.name === output_var_name);
        if (!outputVar) {
            sendErrorResponse(res, 404, `Output variable "${output_var_name}" not found in general flow "${general_flow_name}"`, context.outputChannel);
            return;
        }
        
        for (const [key, value] of Object.entries(updates)) {
            outputVar[key] = value;
        }
        
        modelService.markUnsavedChanges();
        context.outputChannel.appendLine(`[Data Bridge] Updated output variable "${output_var_name}" in general flow "${general_flow_name}" in owner object "${found.ownerObjectName}"`);
        
        sendJsonResponse(res, 200, {
            success: true,
            output_var: outputVar,
            owner_object_name: found.ownerObjectName
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : 'Failed to update general flow output variable', context.outputChannel);
    }
}

/**
 * POST /api/move-general-flow-output-var
 */
export async function moveGeneralFlowOutputVar(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const body = await parseRequestBody(req);
        const { general_flow_name, output_var_name, new_position } = body;
        
        if (!general_flow_name) {
            sendErrorResponse(res, 400, "general_flow_name is required", context.outputChannel);
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
        const found = findGeneralFlow(model, general_flow_name);
        
        if (!found) {
            sendErrorResponse(res, 404, `General flow "${general_flow_name}" not found`, context.outputChannel);
            return;
        }
        
        if (!found.flow.objectWorkflowOutputVar || !Array.isArray(found.flow.objectWorkflowOutputVar)) {
            sendErrorResponse(res, 404, `General flow "${general_flow_name}" has no output variables`, context.outputChannel);
            return;
        }
        
        const oldPosition = found.flow.objectWorkflowOutputVar.findIndex((ov: any) => ov.name === output_var_name);
        if (oldPosition === -1) {
            sendErrorResponse(res, 404, `Output variable "${output_var_name}" not found in general flow "${general_flow_name}"`, context.outputChannel);
            return;
        }
        
        if (new_position >= found.flow.objectWorkflowOutputVar.length) {
            sendErrorResponse(res, 400, `new_position (${new_position}) must be less than total output variable count (${found.flow.objectWorkflowOutputVar.length})`, context.outputChannel);
            return;
        }
        
        const [outputVar] = found.flow.objectWorkflowOutputVar.splice(oldPosition, 1);
        found.flow.objectWorkflowOutputVar.splice(new_position, 0, outputVar);
        
        modelService.markUnsavedChanges();
        context.outputChannel.appendLine(`[Data Bridge] Moved output variable "${output_var_name}" from position ${oldPosition} to ${new_position} in general flow "${general_flow_name}" in owner object "${found.ownerObjectName}"`);
        
        sendJsonResponse(res, 200, {
            success: true,
            old_position: oldPosition,
            new_position: new_position,
            owner_object_name: found.ownerObjectName
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : 'Failed to move general flow output variable', context.outputChannel);
    }
}

/**
 * POST /api/add-general-flow-param
 */
export async function addGeneralFlowParam(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const body = await parseRequestBody(req);
        const { general_flow_name, param } = body;
        
        if (!general_flow_name) {
            sendErrorResponse(res, 400, "general_flow_name is required", context.outputChannel);
            return;
        }
        
        if (!param || !param.name) {
            sendErrorResponse(res, 400, "param object with name property is required", context.outputChannel);
            return;
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findGeneralFlow(model, general_flow_name);
        
        if (!found) {
            sendErrorResponse(res, 404, `General flow "${general_flow_name}" not found`, context.outputChannel);
            return;
        }
        
        if (!found.flow.objectWorkflowParam) {
            found.flow.objectWorkflowParam = [];
        }
        
        const existingParam = found.flow.objectWorkflowParam.find((p: any) => p.name === param.name);
        if (existingParam) {
            sendErrorResponse(res, 400, `Parameter "${param.name}" already exists in general flow "${general_flow_name}"`, context.outputChannel);
            return;
        }
        
        found.flow.objectWorkflowParam.push(param);
        modelService.markUnsavedChanges();
        context.outputChannel.appendLine(`[Data Bridge] Added parameter "${param.name}" to general flow "${general_flow_name}" in owner object "${found.ownerObjectName}"`);
        
        sendJsonResponse(res, 200, {
            success: true,
            param: param,
            owner_object_name: found.ownerObjectName
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : 'Failed to add general flow parameter', context.outputChannel);
    }
}

/**
 * POST /api/update-general-flow-param
 */
export async function updateGeneralFlowParam(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const body = await parseRequestBody(req);
        const { general_flow_name, param_name, updates } = body;
        
        if (!general_flow_name) {
            sendErrorResponse(res, 400, "general_flow_name is required", context.outputChannel);
            return;
        }
        
        if (!param_name) {
            sendErrorResponse(res, 400, "param_name is required", context.outputChannel);
            return;
        }
        
        if (!updates || Object.keys(updates).length === 0) {
            sendErrorResponse(res, 400, "updates object with at least one property is required", context.outputChannel);
            return;
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findGeneralFlow(model, general_flow_name);
        
        if (!found) {
            sendErrorResponse(res, 404, `General flow "${general_flow_name}" not found`, context.outputChannel);
            return;
        }
        
        if (!found.flow.objectWorkflowParam || !Array.isArray(found.flow.objectWorkflowParam)) {
            sendErrorResponse(res, 404, `General flow "${general_flow_name}" has no parameters`, context.outputChannel);
            return;
        }
        
        const param = found.flow.objectWorkflowParam.find((p: any) => p.name === param_name);
        if (!param) {
            sendErrorResponse(res, 404, `Parameter "${param_name}" not found in general flow "${general_flow_name}"`, context.outputChannel);
            return;
        }
        
        if (updates.name && updates.name !== param_name) {
            const duplicateParam = found.flow.objectWorkflowParam.find((p: any) => p.name === updates.name);
            if (duplicateParam) {
                sendErrorResponse(res, 400, `Parameter "${updates.name}" already exists in general flow "${general_flow_name}"`, context.outputChannel);
                return;
            }
        }
        
        Object.keys(updates).forEach(key => {
            param[key] = updates[key];
        });
        
        modelService.markUnsavedChanges();
        context.outputChannel.appendLine(`[Data Bridge] Updated parameter "${param_name}" in general flow "${general_flow_name}" in owner object "${found.ownerObjectName}"`);
        
        sendJsonResponse(res, 200, {
            success: true,
            param: param,
            owner_object_name: found.ownerObjectName
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : 'Failed to update general flow parameter', context.outputChannel);
    }
}

/**
 * POST /api/move-general-flow-param
 */
export async function moveGeneralFlowParam(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const body = await parseRequestBody(req);
        const { general_flow_name, param_name, new_position } = body;
        
        if (!general_flow_name) {
            sendErrorResponse(res, 400, "general_flow_name is required", context.outputChannel);
            return;
        }
        
        if (!param_name) {
            sendErrorResponse(res, 400, "param_name is required", context.outputChannel);
            return;
        }
        
        if (typeof new_position !== 'number' || new_position < 0) {
            sendErrorResponse(res, 400, "new_position must be a non-negative number", context.outputChannel);
            return;
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findGeneralFlow(model, general_flow_name);
        
        if (!found) {
            sendErrorResponse(res, 404, `General flow "${general_flow_name}" not found`, context.outputChannel);
            return;
        }
        
        if (!found.flow.objectWorkflowParam || !Array.isArray(found.flow.objectWorkflowParam)) {
            sendErrorResponse(res, 404, `General flow "${general_flow_name}" has no parameters`, context.outputChannel);
            return;
        }
        
        const paramIndex = found.flow.objectWorkflowParam.findIndex((p: any) => p.name === param_name);
        if (paramIndex === -1) {
            sendErrorResponse(res, 404, `Parameter "${param_name}" not found in general flow "${general_flow_name}"`, context.outputChannel);
            return;
        }
        
        if (new_position >= found.flow.objectWorkflowParam.length) {
            sendErrorResponse(res, 400, `new_position (${new_position}) must be less than total parameter count (${found.flow.objectWorkflowParam.length})`, context.outputChannel);
            return;
        }
        
        const oldPosition = paramIndex;
        const [param] = found.flow.objectWorkflowParam.splice(oldPosition, 1);
        found.flow.objectWorkflowParam.splice(new_position, 0, param);
        
        modelService.markUnsavedChanges();
        context.outputChannel.appendLine(`[Data Bridge] Moved parameter "${param_name}" from position ${oldPosition} to ${new_position} in general flow "${general_flow_name}" in owner object "${found.ownerObjectName}"`);
        
        sendJsonResponse(res, 200, {
            success: true,
            old_position: oldPosition,
            new_position: new_position,
            owner_object_name: found.ownerObjectName
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : 'Failed to move general flow parameter', context.outputChannel);
    }
}

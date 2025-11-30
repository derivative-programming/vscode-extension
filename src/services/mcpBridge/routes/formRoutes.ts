// formRoutes.ts
// Route handlers for form (objectWorkflow) operations
// Created on: November 30, 2025

import * as http from "http";
import { ModelService } from "../../modelService";
import {
    parseRequestBody,
    sendJsonResponse,
    sendErrorResponse,
    logRequest
} from "../utils/routeUtils";
import { RouteContext } from "../types/routeTypes";

/**
 * Helper: Find a form by name across all objects
 */
function findForm(model: any, formName: string): { form: any; ownerObjectName: string } | null {
    if (!model?.namespace || !Array.isArray(model.namespace)) {
        return null;
    }
    
    for (const ns of model.namespace) {
        if (ns.object && Array.isArray(ns.object)) {
            for (const obj of ns.object) {
                if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                    const form = obj.objectWorkflow.find((wf: any) => wf.name === formName);
                    if (form) {
                        return { form, ownerObjectName: obj.name };
                    }
                }
            }
        }
    }
    
    return null;
}

/**
 * GET /api/forms
 * Get forms with optional filtering by form_name or owner_object_name
 */
export async function getForms(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const formName = url.searchParams.get("form_name");
        const ownerObjectName = url.searchParams.get("owner_object_name");
        
        const modelService = ModelService.getInstance();
        const allObjects = modelService.getAllObjects();
        const forms: any[] = [];
        
        for (const obj of allObjects) {
            if (ownerObjectName && obj.name.toLowerCase() !== ownerObjectName.toLowerCase()) {
                continue;
            }
            
            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                for (const workflow of obj.objectWorkflow) {
                    if (formName && workflow.name.toLowerCase() !== formName.toLowerCase()) {
                        continue;
                    }
                    
                    forms.push({
                        ...workflow,
                        _ownerObjectName: obj.name
                    });
                    
                    if (formName && workflow.name.toLowerCase() === formName.toLowerCase()) {
                        context.outputChannel.appendLine(`[Data Bridge] Found form "${workflow.name}" in owner object "${obj.name}"`);
                        sendJsonResponse(res, 200, forms, context.outputChannel);
                        return;
                    }
                }
            }
        }
        
        context.outputChannel.appendLine(`[Data Bridge] Returning ${forms.length} forms`);
        sendJsonResponse(res, 200, forms, context.outputChannel);
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to get forms", context.outputChannel);
    }
}

/**
 * POST /api/create-form
 * Create a new form (objectWorkflow) in an owner data object
 */
export async function createForm(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { ownerObjectName, form, pageInitFlow } = await parseRequestBody(req);
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        if (!model?.namespace || !Array.isArray(model.namespace)) {
            throw new Error("Invalid model structure");
        }
        
        let ownerObject: any = null;
        for (const ns of model.namespace) {
            if (ns.object && Array.isArray(ns.object)) {
                ownerObject = ns.object.find((obj: any) => obj.name === ownerObjectName);
                if (ownerObject) {
                    break;
                }
            }
        }
        
        if (!ownerObject) {
            throw new Error(`Owner object "${ownerObjectName}" not found`);
        }
        
        if (!ownerObject.objectWorkflow) {
            ownerObject.objectWorkflow = [];
        }
        
        ownerObject.objectWorkflow.push(form);
        ownerObject.objectWorkflow.push(pageInitFlow);
        
        modelService.markUnsavedChanges();
        
        context.outputChannel.appendLine(`[Data Bridge] Created form "${form.name}" and page init flow "${pageInitFlow.name}" in owner object "${ownerObjectName}"`);
        sendJsonResponse(res, 200, {
            success: true,
            form: form,
            pageInitFlow: pageInitFlow,
            ownerObjectName: ownerObjectName
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to create form", context.outputChannel);
    }
}

/**
 * POST /api/update-form
 * Update an existing form (objectWorkflow)
 */
export async function updateForm(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const body = await parseRequestBody(req);
        const formName = body.form_name || body.name;
        
        if (!formName) {
            throw new Error("form_name or name is required");
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findForm(model, formName);
        
        if (!found) {
            throw new Error(`Form "${formName}" not found in any data object`);
        }
        
        // Update properties
        Object.keys(body).forEach(key => {
            if (key !== "form_name" && key !== "name") {
                found.form[key] = body[key];
            }
        });
        
        modelService.markUnsavedChanges();
        
        setTimeout(() => {
            try {
                require("vscode").commands.executeCommand("appdna.refresh");
            } catch (e) {
                // Ignore
            }
        }, 100);
        
        context.outputChannel.appendLine(`[Data Bridge] Updated form "${formName}" in owner object "${found.ownerObjectName}"`);
        sendJsonResponse(res, 200, {
            success: true,
            form: found.form,
            owner_object_name: found.ownerObjectName
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to update form", context.outputChannel);
    }
}

/**
 * POST /api/update-full-form
 * Update form with merge/patch operation
 */
export async function updateFullForm(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { form_name, form } = await parseRequestBody(req);
        
        if (!form_name || !form) {
            throw new Error("form_name and form are required");
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findForm(model, form_name);
        
        if (!found) {
            throw new Error(`Form "${form_name}" not found`);
        }
        
        // Merge form-level properties
        const formLevelProps = [
            "titleText", "initObjectWorkflowName", "isInitObjWFSubscribedToParams",
            "isExposedInBusinessObject", "isObjectDelete", "layoutName",
            "introText", "formTitleText", "formIntroText", "formFooterText",
            "formFooterImageURL", "codeDescription", "isAutoSubmit",
            "isHeaderVisible", "isPage", "isAuthorizationRequired",
            "isLoginPage", "isLogoutPage", "isImpersonationPage",
            "roleRequired", "isCaptchaVisible", "isCreditCardEntryUsed",
            "headerImageURL", "footerImageURL", "isDynaFlow",
            "isDynaFlowTask", "isCustomPageViewUsed", "isIgnoredInDocumentation",
            "targetChildObject", "isCustomLogicOverwritten"
        ];
        
        formLevelProps.forEach(prop => {
            if (form[prop] !== undefined) {
                found.form[prop] = form[prop];
            }
        });
        
        // Merge parameters
        if (form.objectWorkflowParam && Array.isArray(form.objectWorkflowParam)) {
            if (!found.form.objectWorkflowParam) {
                found.form.objectWorkflowParam = [];
            }
            
            form.objectWorkflowParam.forEach((newParam: any) => {
                const existingIndex = found.form.objectWorkflowParam.findIndex(
                    (p: any) => p.name === newParam.name
                );
                
                if (existingIndex !== -1) {
                    Object.keys(newParam).forEach(key => {
                        if (key !== "name") {
                            found.form.objectWorkflowParam[existingIndex][key] = newParam[key];
                        }
                    });
                } else {
                    found.form.objectWorkflowParam.push(newParam);
                }
            });
        }
        
        // Merge buttons
        if (form.objectWorkflowButton && Array.isArray(form.objectWorkflowButton)) {
            if (!found.form.objectWorkflowButton) {
                found.form.objectWorkflowButton = [];
            }
            
            form.objectWorkflowButton.forEach((newButton: any) => {
                const existingIndex = found.form.objectWorkflowButton.findIndex(
                    (b: any) => b.name === newButton.name
                );
                
                if (existingIndex !== -1) {
                    Object.keys(newButton).forEach(key => {
                        if (key !== "name") {
                            found.form.objectWorkflowButton[existingIndex][key] = newButton[key];
                        }
                    });
                } else {
                    found.form.objectWorkflowButton.push(newButton);
                }
            });
        }
        
        // Merge output variables
        if (form.objectWorkflowOutputVar && Array.isArray(form.objectWorkflowOutputVar)) {
            if (!found.form.objectWorkflowOutputVar) {
                found.form.objectWorkflowOutputVar = [];
            }
            
            form.objectWorkflowOutputVar.forEach((newVar: any) => {
                const existingIndex = found.form.objectWorkflowOutputVar.findIndex(
                    (v: any) => v.name === newVar.name
                );
                
                if (existingIndex !== -1) {
                    Object.keys(newVar).forEach(key => {
                        if (key !== "name") {
                            found.form.objectWorkflowOutputVar[existingIndex][key] = newVar[key];
                        }
                    });
                } else {
                    found.form.objectWorkflowOutputVar.push(newVar);
                }
            });
        }
        
        modelService.markUnsavedChanges();
        
        setTimeout(() => {
            try {
                require("vscode").commands.executeCommand("appdna.refresh");
            } catch (e) {
                // Ignore
            }
        }, 100);
        
        context.outputChannel.appendLine(`[Data Bridge] Updated full form "${form_name}"`);
        sendJsonResponse(res, 200, {
            success: true,
            form: found.form,
            owner_object_name: found.ownerObjectName
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to update full form", context.outputChannel);
    }
}

/**
 * POST /api/add-form-param
 * Add a new parameter to an existing form
 */
export async function addFormParam(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { form_name, param } = await parseRequestBody(req);
        
        if (!form_name || !param?.name) {
            throw new Error("form_name and param with name are required");
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findForm(model, form_name);
        
        if (!found) {
            throw new Error(`Form "${form_name}" not found`);
        }
        
        if (!found.form.objectWorkflowParam) {
            found.form.objectWorkflowParam = [];
        }
        
        const existingParam = found.form.objectWorkflowParam.find((p: any) => p.name === param.name);
        if (existingParam) {
            throw new Error(`Parameter "${param.name}" already exists in form "${form_name}"`);
        }
        
        found.form.objectWorkflowParam.push(param);
        modelService.markUnsavedChanges();
        
        context.outputChannel.appendLine(`[Data Bridge] Added parameter "${param.name}" to form "${form_name}"`);
        sendJsonResponse(res, 200, {
            success: true,
            param: param,
            owner_object_name: found.ownerObjectName
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to add form parameter", context.outputChannel);
    }
}

/**
 * POST /api/update-form-param
 * Update an existing parameter in a form
 */
export async function updateFormParam(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { form_name, param_name, param } = await parseRequestBody(req);
        
        if (!form_name || !param_name) {
            throw new Error("form_name and param_name are required");
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findForm(model, form_name);
        
        if (!found) {
            throw new Error(`Form "${form_name}" not found`);
        }
        
        const paramIndex = found.form.objectWorkflowParam?.findIndex((p: any) => p.name === param_name);
        if (paramIndex === -1 || paramIndex === undefined) {
            throw new Error(`Parameter "${param_name}" not found in form "${form_name}"`);
        }
        
        Object.keys(param).forEach(key => {
            if (key !== "name") {
                found.form.objectWorkflowParam[paramIndex][key] = param[key];
            }
        });
        
        modelService.markUnsavedChanges();
        
        context.outputChannel.appendLine(`[Data Bridge] Updated parameter "${param_name}" in form "${form_name}"`);
        sendJsonResponse(res, 200, {
            success: true,
            param: found.form.objectWorkflowParam[paramIndex],
            owner_object_name: found.ownerObjectName
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to update form parameter", context.outputChannel);
    }
}

/**
 * POST /api/move-form-param
 * Move a parameter to a new position in a form
 */
export async function moveFormParam(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { form_name, param_name, new_index } = await parseRequestBody(req);
        
        if (!form_name || !param_name || new_index === undefined) {
            throw new Error("form_name, param_name, and new_index are required");
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findForm(model, form_name);
        
        if (!found || !found.form.objectWorkflowParam) {
            throw new Error(`Form "${form_name}" not found or has no parameters`);
        }
        
        const currentIndex = found.form.objectWorkflowParam.findIndex((p: any) => p.name === param_name);
        if (currentIndex === -1) {
            throw new Error(`Parameter "${param_name}" not found`);
        }
        
        const [param] = found.form.objectWorkflowParam.splice(currentIndex, 1);
        found.form.objectWorkflowParam.splice(new_index, 0, param);
        
        modelService.markUnsavedChanges();
        
        context.outputChannel.appendLine(`[Data Bridge] Moved parameter "${param_name}" in form "${form_name}"`);
        sendJsonResponse(res, 200, {
            success: true,
            message: `Parameter moved to index ${new_index}`
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to move form parameter", context.outputChannel);
    }
}

/**
 * POST /api/add-form-button
 * Add a new button to an existing form
 */
export async function addFormButton(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { form_name, button } = await parseRequestBody(req);
        
        if (!form_name || !button?.name) {
            throw new Error("form_name and button with name are required");
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findForm(model, form_name);
        
        if (!found) {
            throw new Error(`Form "${form_name}" not found`);
        }
        
        if (!found.form.objectWorkflowButton) {
            found.form.objectWorkflowButton = [];
        }
        
        found.form.objectWorkflowButton.push(button);
        modelService.markUnsavedChanges();
        
        context.outputChannel.appendLine(`[Data Bridge] Added button "${button.name}" to form "${form_name}"`);
        sendJsonResponse(res, 200, {
            success: true,
            button: button
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to add form button", context.outputChannel);
    }
}

/**
 * POST /api/update-form-button
 * Update an existing button in a form
 */
export async function updateFormButton(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { form_name, button_name, button } = await parseRequestBody(req);
        
        if (!form_name || !button_name) {
            throw new Error("form_name and button_name are required");
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findForm(model, form_name);
        
        if (!found) {
            throw new Error(`Form "${form_name}" not found`);
        }
        
        const buttonIndex = found.form.objectWorkflowButton?.findIndex((b: any) => b.name === button_name);
        if (buttonIndex === -1 || buttonIndex === undefined) {
            throw new Error(`Button "${button_name}" not found`);
        }
        
        Object.keys(button).forEach(key => {
            if (key !== "name") {
                found.form.objectWorkflowButton[buttonIndex][key] = button[key];
            }
        });
        
        modelService.markUnsavedChanges();
        
        context.outputChannel.appendLine(`[Data Bridge] Updated button "${button_name}" in form "${form_name}"`);
        sendJsonResponse(res, 200, {
            success: true,
            button: found.form.objectWorkflowButton[buttonIndex]
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to update form button", context.outputChannel);
    }
}

/**
 * POST /api/move-form-button
 * Move a button to a new position in a form
 */
export async function moveFormButton(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { form_name, button_name, new_index } = await parseRequestBody(req);
        
        if (!form_name || !button_name || new_index === undefined) {
            throw new Error("form_name, button_name, and new_index are required");
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findForm(model, form_name);
        
        if (!found || !found.form.objectWorkflowButton) {
            throw new Error(`Form "${form_name}" not found or has no buttons`);
        }
        
        const currentIndex = found.form.objectWorkflowButton.findIndex((b: any) => b.name === button_name);
        if (currentIndex === -1) {
            throw new Error(`Button "${button_name}" not found`);
        }
        
        const [button] = found.form.objectWorkflowButton.splice(currentIndex, 1);
        found.form.objectWorkflowButton.splice(new_index, 0, button);
        
        modelService.markUnsavedChanges();
        
        context.outputChannel.appendLine(`[Data Bridge] Moved button "${button_name}" in form "${form_name}"`);
        sendJsonResponse(res, 200, {
            success: true,
            message: `Button moved to index ${new_index}`
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to move form button", context.outputChannel);
    }
}

/**
 * POST /api/add-form-output-var
 * Add a new output variable to an existing form
 */
export async function addFormOutputVar(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { form_name, output_var } = await parseRequestBody(req);
        
        if (!form_name || !output_var?.name) {
            throw new Error("form_name and output_var with name are required");
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findForm(model, form_name);
        
        if (!found) {
            throw new Error(`Form "${form_name}" not found`);
        }
        
        if (!found.form.objectWorkflowOutputVar) {
            found.form.objectWorkflowOutputVar = [];
        }
        
        found.form.objectWorkflowOutputVar.push(output_var);
        modelService.markUnsavedChanges();
        
        context.outputChannel.appendLine(`[Data Bridge] Added output var "${output_var.name}" to form "${form_name}"`);
        sendJsonResponse(res, 200, {
            success: true,
            output_var: output_var
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to add form output var", context.outputChannel);
    }
}

/**
 * POST /api/update-form-output-var
 * Update an existing output variable in a form
 */
export async function updateFormOutputVar(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { form_name, output_var_name, output_var } = await parseRequestBody(req);
        
        if (!form_name || !output_var_name) {
            throw new Error("form_name and output_var_name are required");
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findForm(model, form_name);
        
        if (!found) {
            throw new Error(`Form "${form_name}" not found`);
        }
        
        const varIndex = found.form.objectWorkflowOutputVar?.findIndex((v: any) => v.name === output_var_name);
        if (varIndex === -1 || varIndex === undefined) {
            throw new Error(`Output var "${output_var_name}" not found`);
        }
        
        Object.keys(output_var).forEach(key => {
            if (key !== "name") {
                found.form.objectWorkflowOutputVar[varIndex][key] = output_var[key];
            }
        });
        
        modelService.markUnsavedChanges();
        
        context.outputChannel.appendLine(`[Data Bridge] Updated output var "${output_var_name}" in form "${form_name}"`);
        sendJsonResponse(res, 200, {
            success: true,
            output_var: found.form.objectWorkflowOutputVar[varIndex]
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to update form output var", context.outputChannel);
    }
}

/**
 * POST /api/move-form-output-var
 * Move an output variable to a new position in a form
 */
export async function moveFormOutputVar(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { form_name, output_var_name, new_index } = await parseRequestBody(req);
        
        if (!form_name || !output_var_name || new_index === undefined) {
            throw new Error("form_name, output_var_name, and new_index are required");
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findForm(model, form_name);
        
        if (!found || !found.form.objectWorkflowOutputVar) {
            throw new Error(`Form "${form_name}" not found or has no output vars`);
        }
        
        const currentIndex = found.form.objectWorkflowOutputVar.findIndex((v: any) => v.name === output_var_name);
        if (currentIndex === -1) {
            throw new Error(`Output var "${output_var_name}" not found`);
        }
        
        const [outputVar] = found.form.objectWorkflowOutputVar.splice(currentIndex, 1);
        found.form.objectWorkflowOutputVar.splice(new_index, 0, outputVar);
        
        modelService.markUnsavedChanges();
        
        context.outputChannel.appendLine(`[Data Bridge] Moved output var "${output_var_name}" in form "${form_name}"`);
        sendJsonResponse(res, 200, {
            success: true,
            message: `Output var moved to index ${new_index}`
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to move form output var", context.outputChannel);
    }
}

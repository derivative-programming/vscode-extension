// reportRoutes.ts
// Route handlers for report operations
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
 * Helper: Find a report by name across all objects
 */
function findReport(model: any, reportName: string): { report: any; ownerObjectName: string } | null {
    if (!model?.namespace || !Array.isArray(model.namespace)) {
        return null;
    }
    
    for (const ns of model.namespace) {
        if (ns.object && Array.isArray(ns.object)) {
            for (const obj of ns.object) {
                if (obj.report && Array.isArray(obj.report)) {
                    const report = obj.report.find((r: any) => r.name === reportName);
                    if (report) {
                        return { report, ownerObjectName: obj.name };
                    }
                }
            }
        }
    }
    
    return null;
}

/**
 * GET /api/reports
 * Get reports with optional filtering
 */
export async function getReports(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const reportName = url.searchParams.get("report_name");
        const ownerObjectName = url.searchParams.get("owner_object_name");
        
        const modelService = ModelService.getInstance();
        const allObjects = modelService.getAllObjects();
        const reports: any[] = [];
        
        for (const obj of allObjects) {
            if (ownerObjectName && obj.name.toLowerCase() !== ownerObjectName.toLowerCase()) {
                continue;
            }
            
            if (obj.report && Array.isArray(obj.report)) {
                for (const report of obj.report) {
                    if (reportName && report.name.toLowerCase() !== reportName.toLowerCase()) {
                        continue;
                    }
                    
                    reports.push({
                        ...report,
                        _ownerObjectName: obj.name
                    });
                    
                    if (reportName && report.name.toLowerCase() === reportName.toLowerCase()) {
                        context.outputChannel.appendLine(`[Data Bridge] Found report "${report.name}" in owner object "${obj.name}"`);
                        sendJsonResponse(res, 200, reports, context.outputChannel);
                        return;
                    }
                }
            }
        }
        
        context.outputChannel.appendLine(`[Data Bridge] Returning ${reports.length} reports`);
        sendJsonResponse(res, 200, reports, context.outputChannel);
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to get reports", context.outputChannel);
    }
}

/**
 * POST /api/create-report
 * Create a new report in an owner data object
 */
export async function createReport(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { ownerObjectName, report, pageInitFlow } = await parseRequestBody(req);
        
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
        
        if (!ownerObject.report) {
            ownerObject.report = [];
        }
        
        if (!ownerObject.objectWorkflow) {
            ownerObject.objectWorkflow = [];
        }
        
        ownerObject.report.push(report);
        ownerObject.objectWorkflow.push(pageInitFlow);
        
        modelService.markUnsavedChanges();
        
        context.outputChannel.appendLine(`[Data Bridge] Created report "${report.name}" and page init flow "${pageInitFlow.name}" in owner object "${ownerObjectName}"`);
        sendJsonResponse(res, 200, {
            success: true,
            report: report,
            pageInitFlow: pageInitFlow,
            ownerObjectName: ownerObjectName
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to create report", context.outputChannel);
    }
}

/**
 * POST /api/update-report
 * Update an existing report
 */
export async function updateReport(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { report_name, updates } = await parseRequestBody(req);
        
        if (!report_name || !updates || Object.keys(updates).length === 0) {
            throw new Error("report_name and updates are required");
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findReport(model, report_name);
        
        if (!found) {
            throw new Error(`Report "${report_name}" not found`);
        }
        
        for (const [key, value] of Object.entries(updates)) {
            found.report[key] = value;
        }
        
        modelService.markUnsavedChanges();
        
        context.outputChannel.appendLine(`[Data Bridge] Updated report "${report_name}" in owner object "${found.ownerObjectName}"`);
        sendJsonResponse(res, 200, {
            success: true,
            report: found.report,
            owner_object_name: found.ownerObjectName
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to update report", context.outputChannel);
    }
}

/**
 * POST /api/update-full-report
 * Update report with merge/patch operation
 */
export async function updateFullReport(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { report_name, report } = await parseRequestBody(req);
        
        if (!report_name || !report) {
            throw new Error("report_name and report are required");
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findReport(model, report_name);
        
        if (!found) {
            throw new Error(`Report "${report_name}" not found`);
        }
        
        const reportLevelProps = [
            "titleText", "introText", "visualizationType", "isCustomSqlUsed",
            "isIgnoredInDocumentation"
        ];
        
        reportLevelProps.forEach(prop => {
            if (report[prop] !== undefined) {
                found.report[prop] = report[prop];
            }
        });
        
        // Merge parameters
        if (report.reportParam && Array.isArray(report.reportParam)) {
            if (!found.report.reportParam) {
                found.report.reportParam = [];
            }
            
            report.reportParam.forEach((newParam: any) => {
                const existingIndex = found.report.reportParam.findIndex(
                    (p: any) => p.name === newParam.name
                );
                
                if (existingIndex !== -1) {
                    Object.keys(newParam).forEach(key => {
                        if (key !== "name") {
                            found.report.reportParam[existingIndex][key] = newParam[key];
                        }
                    });
                } else {
                    found.report.reportParam.push(newParam);
                }
            });
        }
        
        // Merge columns
        if (report.reportColumn && Array.isArray(report.reportColumn)) {
            if (!found.report.reportColumn) {
                found.report.reportColumn = [];
            }
            
            report.reportColumn.forEach((newColumn: any) => {
                const existingIndex = found.report.reportColumn.findIndex(
                    (c: any) => c.columnName === newColumn.columnName
                );
                
                if (existingIndex !== -1) {
                    Object.keys(newColumn).forEach(key => {
                        found.report.reportColumn[existingIndex][key] = newColumn[key];
                    });
                } else {
                    found.report.reportColumn.push(newColumn);
                }
            });
        }
        
        // Merge buttons
        if (report.reportButton && Array.isArray(report.reportButton)) {
            if (!found.report.reportButton) {
                found.report.reportButton = [];
            }
            
            report.reportButton.forEach((newButton: any) => {
                const existingIndex = found.report.reportButton.findIndex(
                    (b: any) => b.buttonText === newButton.buttonText
                );
                
                if (existingIndex !== -1) {
                    Object.keys(newButton).forEach(key => {
                        found.report.reportButton[existingIndex][key] = newButton[key];
                    });
                } else {
                    found.report.reportButton.push(newButton);
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
        
        context.outputChannel.appendLine(`[Data Bridge] Updated full report "${report_name}"`);
        sendJsonResponse(res, 200, {
            success: true,
            report: found.report,
            owner_object_name: found.ownerObjectName
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to update full report", context.outputChannel);
    }
}

/**
 * POST /api/add-report-param
 */
export async function addReportParam(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { report_name, param } = await parseRequestBody(req);
        
        if (!report_name || !param?.name) {
            throw new Error("report_name and param with name are required");
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findReport(model, report_name);
        
        if (!found) {
            throw new Error(`Report "${report_name}" not found`);
        }
        
        if (!found.report.reportParam) {
            found.report.reportParam = [];
        }
        
        found.report.reportParam.push(param);
        modelService.markUnsavedChanges();
        
        context.outputChannel.appendLine(`[Data Bridge] Added parameter to report "${report_name}"`);
        sendJsonResponse(res, 200, { success: true, param }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to add report parameter", context.outputChannel);
    }
}

/**
 * POST /api/update-report-param
 */
export async function updateReportParam(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { report_name, param_name, param } = await parseRequestBody(req);
        
        if (!report_name || !param_name) {
            throw new Error("report_name and param_name are required");
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findReport(model, report_name);
        
        if (!found) {
            throw new Error(`Report "${report_name}" not found`);
        }
        
        const paramIndex = found.report.reportParam?.findIndex((p: any) => p.name === param_name);
        if (paramIndex === -1 || paramIndex === undefined) {
            throw new Error(`Parameter "${param_name}" not found`);
        }
        
        Object.keys(param).forEach(key => {
            if (key !== "name") {
                found.report.reportParam[paramIndex][key] = param[key];
            }
        });
        
        modelService.markUnsavedChanges();
        
        context.outputChannel.appendLine(`[Data Bridge] Updated parameter in report "${report_name}"`);
        sendJsonResponse(res, 200, { success: true, param: found.report.reportParam[paramIndex] }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to update report parameter", context.outputChannel);
    }
}

/**
 * POST /api/move-report-param
 */
export async function moveReportParam(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { report_name, param_name, new_index } = await parseRequestBody(req);
        
        if (!report_name || !param_name || new_index === undefined) {
            throw new Error("report_name, param_name, and new_index are required");
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findReport(model, report_name);
        
        if (!found || !found.report.reportParam) {
            throw new Error(`Report "${report_name}" not found or has no parameters`);
        }
        
        const currentIndex = found.report.reportParam.findIndex((p: any) => p.name === param_name);
        if (currentIndex === -1) {
            throw new Error(`Parameter "${param_name}" not found`);
        }
        
        const [param] = found.report.reportParam.splice(currentIndex, 1);
        found.report.reportParam.splice(new_index, 0, param);
        
        modelService.markUnsavedChanges();
        
        context.outputChannel.appendLine(`[Data Bridge] Moved parameter in report "${report_name}"`);
        sendJsonResponse(res, 200, { success: true, message: `Parameter moved to index ${new_index}` }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to move report parameter", context.outputChannel);
    }
}

/**
 * POST /api/add-report-column
 */
export async function addReportColumn(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { report_name, column } = await parseRequestBody(req);
        
        if (!report_name || !column?.columnName) {
            throw new Error("report_name and column with columnName are required");
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findReport(model, report_name);
        
        if (!found) {
            throw new Error(`Report "${report_name}" not found`);
        }
        
        if (!found.report.reportColumn) {
            found.report.reportColumn = [];
        }
        
        found.report.reportColumn.push(column);
        modelService.markUnsavedChanges();
        
        context.outputChannel.appendLine(`[Data Bridge] Added column to report "${report_name}"`);
        sendJsonResponse(res, 200, { success: true, column }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to add report column", context.outputChannel);
    }
}

/**
 * POST /api/update-report-column
 */
export async function updateReportColumn(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { report_name, column_name, column } = await parseRequestBody(req);
        
        if (!report_name || !column_name) {
            throw new Error("report_name and column_name are required");
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findReport(model, report_name);
        
        if (!found) {
            throw new Error(`Report "${report_name}" not found`);
        }
        
        const columnIndex = found.report.reportColumn?.findIndex((c: any) => c.columnName === column_name);
        if (columnIndex === -1 || columnIndex === undefined) {
            throw new Error(`Column "${column_name}" not found`);
        }
        
        Object.keys(column).forEach(key => {
            found.report.reportColumn[columnIndex][key] = column[key];
        });
        
        modelService.markUnsavedChanges();
        
        context.outputChannel.appendLine(`[Data Bridge] Updated column in report "${report_name}"`);
        sendJsonResponse(res, 200, { success: true, column: found.report.reportColumn[columnIndex] }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to update report column", context.outputChannel);
    }
}

/**
 * POST /api/move-report-column
 */
export async function moveReportColumn(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { report_name, column_name, new_index } = await parseRequestBody(req);
        
        if (!report_name || !column_name || new_index === undefined) {
            throw new Error("report_name, column_name, and new_index are required");
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findReport(model, report_name);
        
        if (!found || !found.report.reportColumn) {
            throw new Error(`Report "${report_name}" not found or has no columns`);
        }
        
        const currentIndex = found.report.reportColumn.findIndex((c: any) => c.columnName === column_name);
        if (currentIndex === -1) {
            throw new Error(`Column "${column_name}" not found`);
        }
        
        const [column] = found.report.reportColumn.splice(currentIndex, 1);
        found.report.reportColumn.splice(new_index, 0, column);
        
        modelService.markUnsavedChanges();
        
        context.outputChannel.appendLine(`[Data Bridge] Moved column in report "${report_name}"`);
        sendJsonResponse(res, 200, { success: true, message: `Column moved to index ${new_index}` }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to move report column", context.outputChannel);
    }
}

/**
 * POST /api/add-report-button
 */
export async function addReportButton(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { report_name, button } = await parseRequestBody(req);
        
        if (!report_name || !button?.buttonText) {
            throw new Error("report_name and button with buttonText are required");
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findReport(model, report_name);
        
        if (!found) {
            throw new Error(`Report "${report_name}" not found`);
        }
        
        if (!found.report.reportButton) {
            found.report.reportButton = [];
        }
        
        found.report.reportButton.push(button);
        modelService.markUnsavedChanges();
        
        context.outputChannel.appendLine(`[Data Bridge] Added button to report "${report_name}"`);
        sendJsonResponse(res, 200, { success: true, button }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to add report button", context.outputChannel);
    }
}

/**
 * POST /api/update-report-button
 */
export async function updateReportButton(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { report_name, button_text, button } = await parseRequestBody(req);
        
        if (!report_name || !button_text) {
            throw new Error("report_name and button_text are required");
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findReport(model, report_name);
        
        if (!found) {
            throw new Error(`Report "${report_name}" not found`);
        }
        
        const buttonIndex = found.report.reportButton?.findIndex((b: any) => b.buttonText === button_text);
        if (buttonIndex === -1 || buttonIndex === undefined) {
            throw new Error(`Button "${button_text}" not found`);
        }
        
        Object.keys(button).forEach(key => {
            found.report.reportButton[buttonIndex][key] = button[key];
        });
        
        modelService.markUnsavedChanges();
        
        context.outputChannel.appendLine(`[Data Bridge] Updated button in report "${report_name}"`);
        sendJsonResponse(res, 200, { success: true, button: found.report.reportButton[buttonIndex] }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to update report button", context.outputChannel);
    }
}

/**
 * POST /api/move-report-button
 */
export async function moveReportButton(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { report_name, button_text, new_index } = await parseRequestBody(req);
        
        if (!report_name || !button_text || new_index === undefined) {
            throw new Error("report_name, button_text, and new_index are required");
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        const found = findReport(model, report_name);
        
        if (!found || !found.report.reportButton) {
            throw new Error(`Report "${report_name}" not found or has no buttons`);
        }
        
        const currentIndex = found.report.reportButton.findIndex((b: any) => b.buttonText === button_text);
        if (currentIndex === -1) {
            throw new Error(`Button "${button_text}" not found`);
        }
        
        const [button] = found.report.reportButton.splice(currentIndex, 1);
        found.report.reportButton.splice(new_index, 0, button);
        
        modelService.markUnsavedChanges();
        
        context.outputChannel.appendLine(`[Data Bridge] Moved button in report "${report_name}"`);
        sendJsonResponse(res, 200, { success: true, message: `Button moved to index ${new_index}` }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 500, error instanceof Error ? error.message : "Failed to move report button", context.outputChannel);
    }
}

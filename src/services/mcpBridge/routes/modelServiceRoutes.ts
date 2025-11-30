// modelServiceRoutes.ts
// Route handlers for model service AI processing operations
// Created on: November 30, 2025

import * as http from "http";
import * as https from "https";
import * as fs from "fs";
import JSZip = require("jszip");
import { ModelService } from "../../modelService";
import { AuthService } from "../../authService";
import { sendJsonResponse, sendErrorResponse, logRequest, parseRequestBody } from "../utils/routeUtils";
import { RouteContext } from "../types/routeTypes";

/**
 * GET /api/auth-status
 * Check authentication status for model services
 */
export async function getAuthStatus(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    const authService = AuthService.getInstance();
    const isLoggedIn = authService.isLoggedIn();
    
    sendJsonResponse(res, 200, {
        success: true,
        isLoggedIn: isLoggedIn
    }, context.outputChannel);
}

/**
 * POST /api/model-services/model-features
 * Get available model features from Model Services API
 */
export async function getModelFeatures(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const body = await parseRequestBody(req);
        const { pageNumber = 1, itemCountPerPage = 10, orderByColumnName = 'displayName', orderByDescending = false } = body;
        
        const authService = AuthService.getInstance();
        const apiKey = await authService.getApiKey();

        if (!apiKey) {
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Authentication required. Please log in to Model Services.'
            }, context.outputChannel);
            return;
        }
        
        // Build URL with query parameters (same as modelFeatureCatalogCommands.ts)
        const params = [
            'PageNumber=' + encodeURIComponent(pageNumber || 1),
            'ItemCountPerPage=' + encodeURIComponent(itemCountPerPage || 10),
            'OrderByDescending=' + encodeURIComponent(orderByDescending ? 'true' : 'false')
        ];
        if (orderByColumnName) {
            params.push('OrderByColumnName=' + encodeURIComponent(orderByColumnName));
        }
        const url = 'https://modelservicesapi.derivative-programming.com/api/v1_0/model-features?' + params.join('&');
        
        // Make the API call
        const response = await fetch(url, {
            headers: { 'Api-Key': apiKey }
        });
        
        // Check for unauthorized errors
        if (response.status === 401) {
            await authService.logout();
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Your session has expired. Please log in again.'
            }, context.outputChannel);
            return;
        }
        
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Get selected features from model
        const modelService = ModelService.getInstance();
        const selectedFeatures: Array<{name: string, isCompleted?: string}> = [];
        
        if (modelService && modelService.isFileLoaded()) {
            const rootModel = modelService.getCurrentModel();
            
            if (rootModel && rootModel.namespace) {
                for (const namespace of rootModel.namespace) {
                    if (namespace.modelFeature && Array.isArray(namespace.modelFeature)) {
                        namespace.modelFeature.forEach((feature: any) => {
                            if (feature.name) {
                                selectedFeatures.push({
                                    name: feature.name,
                                    isCompleted: feature.isCompleted
                                });
                            }
                        });
                    }
                }
            }
        }
        
        // Enhance catalog items with 'selected' and 'isCompleted' properties
        if (data.items && Array.isArray(data.items)) {
            data.items = data.items.map((item: any) => {
                const selectedFeature = selectedFeatures.find(f => f.name === item.name);
                return {
                    ...item,
                    selected: !!selectedFeature,
                    isCompleted: selectedFeature?.isCompleted || 'false'
                };
            });
        }
        
        sendJsonResponse(res, 200, {
            success: true,
            data: data
        }, context.outputChannel);
        
    } catch (error: any) {
        context.outputChannel.appendLine(`[Data Bridge] Error fetching model features: ${error.message}`);
        sendErrorResponse(res, 500, error.message || 'Failed to fetch model features', context.outputChannel);
    }
}

/**
 * GET /api/model-services/prep-requests
 * Get all prep requests with pagination and sorting
 */
export async function getPrepRequests(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        // Parse query parameters from GET request
        const requestUrl = new URL(req.url || '', `http://${req.headers.host}`);
        const pageNumber = parseInt(requestUrl.searchParams.get('pageNumber') || '1');
        const itemCountPerPage = parseInt(requestUrl.searchParams.get('itemCountPerPage') || '10');
        const orderByColumnName = requestUrl.searchParams.get('orderByColumnName') || 'modelPrepRequestRequestedUTCDateTime';
        const orderByDescending = requestUrl.searchParams.get('orderByDescending') !== 'false';
        
        const authService = AuthService.getInstance();
        const apiKey = await authService.getApiKey();

        if (!apiKey) {
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Authentication required. Please log in to Model Services.'
            }, context.outputChannel);
            return;
        }
        
        // Build URL with query parameters
        const params = [
            'PageNumber=' + encodeURIComponent(pageNumber || 1),
            'ItemCountPerPage=' + encodeURIComponent(itemCountPerPage || 10),
            'OrderByDescending=' + encodeURIComponent(orderByDescending ? 'true' : 'false')
        ];
        if (orderByColumnName) {
            params.push('OrderByColumnName=' + encodeURIComponent(orderByColumnName));
        }
        const apiUrl = 'https://modelservicesapi.derivative-programming.com/api/v1_0/prep-requests?' + params.join('&');
        
        // Make the API call
        const response = await fetch(apiUrl, {
            headers: { 'Api-Key': apiKey }
        });
        
        // Check for unauthorized errors
        if (response.status === 401) {
            await authService.logout();
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Your session has expired. Please log in again.'
            }, context.outputChannel);
            return;
        }
        
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        sendJsonResponse(res, 200, {
            success: true,
            data: data
        }, context.outputChannel);
        
    } catch (error: any) {
        context.outputChannel.appendLine(`[Data Bridge] Error fetching AI processing requests: ${error.message}`);
        sendErrorResponse(res, 500, error.message || 'Failed to fetch AI processing requests', context.outputChannel);
    }
}

/**
 * POST /api/model-services/create-prep-request
 * Create a new prep request
 */
export async function createPrepRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const body = await parseRequestBody(req);
        const { description } = body;
        
        if (!description || !description.trim()) {
            sendJsonResponse(res, 400, {
                success: false,
                error: 'Description is required'
            }, context.outputChannel);
            return;
        }
        
        const authService = AuthService.getInstance();
        const apiKey = await authService.getApiKey();

        if (!apiKey) {
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Authentication required. Please log in to Model Services.'
            }, context.outputChannel);
            return;
        }
        
        // Get model file path
        const modelFilePath = context.modelService.getCurrentFilePath();
        if (!modelFilePath) {
            sendJsonResponse(res, 400, {
                success: false,
                error: 'No model file is currently loaded'
            }, context.outputChannel);
            return;
        }
        
        // Read and zip model file
        const fileContent = fs.readFileSync(modelFilePath, 'utf8');
        const zip = new JSZip();
        zip.file('model.json', fileContent);
        const archive = await zip.generateAsync({ type: 'nodebuffer' });
        const modelFileData = archive.toString('base64');
        
        // Call Model Services API
        const apiUrl = 'https://modelservicesapi.derivative-programming.com/api/v1_0/prep-requests';
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': apiKey
            },
            body: JSON.stringify({ description: description.trim(), modelFileData })
        });
        
        if (response.status === 401) {
            await authService.logout();
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Your session has expired. Please log in again.'
            }, context.outputChannel);
            return;
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            sendJsonResponse(res, response.status, {
                success: false,
                error: `API error: ${response.statusText}`,
                details: errorText
            }, context.outputChannel);
            return;
        }
        
        const data = await response.json();
        
        sendJsonResponse(res, 200, {
            success: true,
            requestCode: data.modelPrepRequestCode,
            message: 'AI processing request created successfully'
        }, context.outputChannel);
        
    } catch (error: any) {
        context.outputChannel?.appendLine(`[Command Bridge] Error creating prep request: ${error.message}`);
        sendJsonResponse(res, 500, {
            success: false,
            error: error.message || 'Failed to create AI processing request'
        }, context.outputChannel);
    }
}

/**
 * POST /api/model-services/create-validation-request
 * Create a new validation request
 */
export async function createValidationRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const body = await parseRequestBody(req);
        const { description } = body;
        
        if (!description || !description.trim()) {
            sendJsonResponse(res, 400, {
                success: false,
                error: 'Description is required'
            }, context.outputChannel);
            return;
        }
        
        const authService = AuthService.getInstance();
        const apiKey = await authService.getApiKey();

        if (!apiKey) {
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Authentication required. Please log in to Model Services.'
            }, context.outputChannel);
            return;
        }
        
        // Get model file path
        const modelFilePath = context.modelService.getCurrentFilePath();
        if (!modelFilePath) {
            sendJsonResponse(res, 400, {
                success: false,
                error: 'No model file is currently loaded'
            }, context.outputChannel);
            return;
        }
        
        // Read and zip model file
        const fileContent = fs.readFileSync(modelFilePath, 'utf8');
        const zip = new JSZip();
        zip.file('model.json', fileContent);
        const archive = await zip.generateAsync({ type: 'nodebuffer' });
        const modelFileData = archive.toString('base64');
        
        // Call Model Services API
        const apiUrl = 'https://modelservicesapi.derivative-programming.com/api/v1_0/validation-requests';
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': apiKey
            },
            body: JSON.stringify({ description: description.trim(), modelFileData })
        });
        
        if (response.status === 401) {
            await authService.logout();
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Your session has expired. Please log in again.'
            }, context.outputChannel);
            return;
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            sendJsonResponse(res, response.status, {
                success: false,
                error: `API error: ${response.statusText}`,
                details: errorText
            }, context.outputChannel);
            return;
        }
        
        const data = await response.json();
        
        sendJsonResponse(res, 200, {
            success: true,
            requestCode: data.modelValidationRequestCode,
            message: 'Validation request created successfully'
        }, context.outputChannel);
        
    } catch (error: any) {
        context.outputChannel?.appendLine(`[Command Bridge] Error creating validation request: ${error.message}`);
        sendJsonResponse(res, 500, {
            success: false,
            error: error.message || 'Failed to create validation request'
        }, context.outputChannel);
    }
}

/**
 * POST /api/model-services/create-fabrication-request
 * Create a new fabrication request
 */
export async function createFabricationRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const body = await parseRequestBody(req);
        const { description } = body;
        
        if (!description || !description.trim()) {
            sendJsonResponse(res, 400, {
                success: false,
                error: 'Description is required'
            }, context.outputChannel);
            return;
        }
        
        const authService = AuthService.getInstance();
        const apiKey = await authService.getApiKey();

        if (!apiKey) {
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Authentication required. Please log in to Model Services.'
            }, context.outputChannel);
            return;
        }
        
        // Get model file path
        const modelFilePath = context.modelService.getCurrentFilePath();
        if (!modelFilePath) {
            sendJsonResponse(res, 400, {
                success: false,
                error: 'No model file is currently loaded'
            }, context.outputChannel);
            return;
        }
        
        // Read and zip model file
        const fileContent = fs.readFileSync(modelFilePath, 'utf8');
        const zip = new JSZip();
        zip.file('model.json', fileContent);
        const archive = await zip.generateAsync({ type: 'nodebuffer' });
        const modelFileData = archive.toString('base64');
        
        // Call Model Services API
        const apiUrl = 'https://modelservicesapi.derivative-programming.com/api/v1_0/fabrication-requests';
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': apiKey
            },
            body: JSON.stringify({ description: description.trim(), modelFileData })
        });
        
        if (response.status === 401) {
            await authService.logout();
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Your session has expired. Please log in again.'
            }, context.outputChannel);
            return;
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            sendJsonResponse(res, response.status, {
                success: false,
                error: `API error: ${response.statusText}`,
                details: errorText
            }, context.outputChannel);
            return;
        }
        
        const data = await response.json();
        
        sendJsonResponse(res, 200, {
            success: true,
            requestCode: data.modelFabricationRequestCode,
            message: 'Fabrication request created successfully'
        }, context.outputChannel);
        
    } catch (error: any) {
        context.outputChannel?.appendLine(`[Command Bridge] Error creating fabrication request: ${error.message}`);
        sendJsonResponse(res, 500, {
            success: false,
            error: error.message || 'Failed to create fabrication request'
        }, context.outputChannel);
    }
}

/**
 * GET /api/model-services/validation-requests
 * Get all validation requests
 */
export async function getValidationRequests(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        // Parse query parameters from GET request
        const requestUrl = new URL(req.url || '', `http://${req.headers.host}`);
        const pageNumber = parseInt(requestUrl.searchParams.get('pageNumber') || '1');
        const itemCountPerPage = parseInt(requestUrl.searchParams.get('itemCountPerPage') || '10');
        const orderByColumnName = requestUrl.searchParams.get('orderByColumnName') || 'modelValidationRequestRequestedUTCDateTime';
        const orderByDescending = requestUrl.searchParams.get('orderByDescending') !== 'false';
        
        const authService = AuthService.getInstance();
        const apiKey = await authService.getApiKey();

        if (!apiKey) {
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Authentication required. Please log in to Model Services.'
            }, context.outputChannel);
            return;
        }
        
        // Build URL with query parameters
        const params = [
            'PageNumber=' + encodeURIComponent(pageNumber || 1),
            'ItemCountPerPage=' + encodeURIComponent(itemCountPerPage || 10),
            'OrderByDescending=' + encodeURIComponent(orderByDescending ? 'true' : 'false')
        ];
        if (orderByColumnName) {
            params.push('OrderByColumnName=' + encodeURIComponent(orderByColumnName));
        }
        const apiUrl = 'https://modelservicesapi.derivative-programming.com/api/v1_0/validation-requests?' + params.join('&');
        
        // Make the API call
        const response = await fetch(apiUrl, {
            headers: { 'Api-Key': apiKey }
        });
        
        // Check for unauthorized errors
        if (response.status === 401) {
            await authService.logout();
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Your session has expired. Please log in again.'
            }, context.outputChannel);
            return;
        }
        
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        sendJsonResponse(res, 200, {
            success: true,
            data: data
        }, context.outputChannel);
        
    } catch (error: any) {
        context.outputChannel.appendLine(`[Data Bridge] Error fetching validation requests: ${error.message}`);
        sendErrorResponse(res, 500, error.message || 'Failed to fetch validation requests', context.outputChannel);
    }
}

/**
 * GET /api/model-services/fabrication-requests
 * Get all fabrication requests
 */
export async function getFabricationRequests(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        // Parse query parameters from GET request
        const requestUrl = new URL(req.url || '', `http://${req.headers.host}`);
        const pageNumber = parseInt(requestUrl.searchParams.get('pageNumber') || '1');
        const itemCountPerPage = parseInt(requestUrl.searchParams.get('itemCountPerPage') || '10');
        const orderByColumnName = requestUrl.searchParams.get('orderByColumnName') || 'modelFabricationRequestRequestedUTCDateTime';
        const orderByDescending = requestUrl.searchParams.get('orderByDescending') !== 'false';
        
        const authService = AuthService.getInstance();
        const apiKey = await authService.getApiKey();

        if (!apiKey) {
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Authentication required. Please log in to Model Services.'
            }, context.outputChannel);
            return;
        }
        
        // Build URL with query parameters
        const params = [
            'PageNumber=' + encodeURIComponent(pageNumber || 1),
            'ItemCountPerPage=' + encodeURIComponent(itemCountPerPage || 10),
            'OrderByDescending=' + encodeURIComponent(orderByDescending ? 'true' : 'false')
        ];
        if (orderByColumnName) {
            params.push('OrderByColumnName=' + encodeURIComponent(orderByColumnName));
        }
        const apiUrl = 'https://modelservicesapi.derivative-programming.com/api/v1_0/fabrication-requests?' + params.join('&');
        
        // Make the API call
        const response = await fetch(apiUrl, {
            headers: { 'Api-Key': apiKey }
        });
        
        // Check for unauthorized errors
        if (response.status === 401) {
            await authService.logout();
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Your session has expired. Please log in again.'
            }, context.outputChannel);
            return;
        }
        
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        sendJsonResponse(res, 200, {
            success: true,
            data: data
        }, context.outputChannel);
        
    } catch (error: any) {
        context.outputChannel.appendLine(`[Data Bridge] Error fetching fabrication requests: ${error.message}`);
        sendErrorResponse(res, 500, error.message || 'Failed to fetch fabrication requests', context.outputChannel);
    }
}

/**
 * POST /api/model-services/prep-request-details
 * Get details for a specific prep request by code
 */
export async function getPrepRequestDetails(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        // Parse query parameters from GET request
        const requestUrl = new URL(req.url || '', `http://${req.headers.host}`);
        const requestCode = requestUrl.searchParams.get('requestCode');
        
        if (!requestCode) {
            sendJsonResponse(res, 400, {
                success: false,
                error: 'Request code is required'
            }, context.outputChannel);
            return;
        }
        
        const authService = AuthService.getInstance();
        const apiKey = await authService.getApiKey();

        if (!apiKey) {
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Authentication required. Please log in to Model Services.'
            }, context.outputChannel);
            return;
        }
        
        // Build URL with query parameter for specific request
        const apiUrl = `https://modelservicesapi.derivative-programming.com/api/v1_0/prep-requests?modelPrepRequestCode=${encodeURIComponent(requestCode)}`;
        
        // Make the API call
        const response = await fetch(apiUrl, {
            headers: { 'Api-Key': apiKey }
        });
        
        // Check for unauthorized errors
        if (response.status === 401) {
            await authService.logout();
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Your session has expired. Please log in again.'
            }, context.outputChannel);
            return;
        }
        
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract the first item from the items array if it exists
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            sendJsonResponse(res, 200, {
                success: true,
                item: data.items[0]
            }, context.outputChannel);
        } else {
            sendJsonResponse(res, 404, {
                success: false,
                error: `No AI processing request found with code: ${requestCode}`
            }, context.outputChannel);
        }
        
    } catch (error: any) {
        context.outputChannel.appendLine(`[Data Bridge] Error fetching AI processing request details: ${error.message}`);
        sendErrorResponse(res, 500, error.message || 'Failed to fetch AI processing request details', context.outputChannel);
    }
}

/**
 * POST /api/model-services/merge-ai-processing-results
 * Merge AI processing results into the current model
 */
export async function mergeAiProcessingResults(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const body = await parseRequestBody(req);
        const { requestCode } = body;
        
        if (!requestCode || !requestCode.trim()) {
            sendJsonResponse(res, 400, {
                success: false,
                error: 'Request code is required'
            }, context.outputChannel);
            return;
        }
        
        const authService = AuthService.getInstance();
        const apiKey = await authService.getApiKey();

        if (!apiKey) {
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Authentication required. Please log in to Model Services.'
            }, context.outputChannel);
            return;
        }
        
        // Get model file path
        const modelFilePath = context.modelService.getCurrentFilePath();
        if (!modelFilePath) {
            sendJsonResponse(res, 400, {
                success: false,
                error: 'No model file is currently loaded'
            }, context.outputChannel);
            return;
        }
        
        // Get request details to get the result model URL
        const detailsUrl = `https://modelservicesapi.derivative-programming.com/api/v1_0/prep-requests?modelPrepRequestCode=${encodeURIComponent(requestCode)}`;
        const detailsResponse = await fetch(detailsUrl, {
            headers: { 'Api-Key': apiKey }
        });
        
        if (!detailsResponse.ok) {
            sendJsonResponse(res, detailsResponse.status, {
                success: false,
                error: 'Failed to fetch request details'
            }, context.outputChannel);
            return;
        }
        
        const detailsData = await detailsResponse.json();
        if (!detailsData.items || detailsData.items.length === 0) {
            sendJsonResponse(res, 404, {
                success: false,
                error: 'Request not found'
            }, context.outputChannel);
            return;
        }
        
        const requestDetails = detailsData.items[0];
        if (!requestDetails.modelPrepRequestResultModelUrl) {
            sendJsonResponse(res, 400, {
                success: false,
                error: 'No result model available yet. Request may not be completed or successful.'
            }, context.outputChannel);
            return;
        }
        
        // Read current model file and zip it
        const fileContent = fs.readFileSync(modelFilePath, 'utf8');
        const zip = new JSZip();
        zip.file('model.json', fileContent);
        const archive = await zip.generateAsync({ type: 'nodebuffer' });
        const modelFileData = archive.toString('base64');
        
        // Call merge API
        const mergeUrl = 'https://modelservicesapi.derivative-programming.com/api/v1_0/model-merge';
        const mergeResponse = await fetch(mergeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': apiKey
            },
            body: JSON.stringify({
                modelFileData,
                additionsModelUrl: requestDetails.modelPrepRequestResultModelUrl
            })
        });
        
        if (mergeResponse.status === 401) {
            await authService.logout();
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Your session has expired. Please log in again.'
            }, context.outputChannel);
            return;
        }
        
        if (!mergeResponse.ok) {
            const errorText = await mergeResponse.text();
            sendJsonResponse(res, mergeResponse.status, {
                success: false,
                error: `Merge API error: ${mergeResponse.statusText}`,
                details: errorText
            }, context.outputChannel);
            return;
        }
        
        const mergeData = await mergeResponse.json();
        
        // Write merged model back to file
        if (mergeData.mergedModel) {
            const mergedModelJson = JSON.stringify(mergeData.mergedModel, null, 2);
            fs.writeFileSync(modelFilePath, mergedModelJson, 'utf8');
            
            // Reload the model in ModelService
            await context.modelService.loadFile(modelFilePath);
            
            sendJsonResponse(res, 200, {
                success: true,
                message: 'AI processing results merged successfully into model',
                mergeReport: mergeData.mergeReport
            }, context.outputChannel);
        } else {
            sendJsonResponse(res, 500, {
                success: false,
                error: 'Merge API did not return merged model'
            }, context.outputChannel);
        }
        
    } catch (error: any) {
        context.outputChannel?.appendLine(`[Command Bridge] Error merging AI processing results: ${error.message}`);
        sendJsonResponse(res, 500, {
            success: false,
            error: error.message || 'Failed to merge AI processing results'
        }, context.outputChannel);
    }
}

/**
 * GET /api/model-services/validation-request-details
 * Get single validation request details by request code
 */
export async function getValidationRequestDetails(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        // Parse query parameters from GET request
        const requestUrl = new URL(req.url || '', `http://${req.headers.host}`);
        const requestCode = requestUrl.searchParams.get('requestCode');
        
        if (!requestCode) {
            sendJsonResponse(res, 400, {
                success: false,
                error: 'Request code is required'
            }, context.outputChannel);
            return;
        }
        
        const authService = AuthService.getInstance();
        const apiKey = await authService.getApiKey();

        if (!apiKey) {
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Authentication required. Please log in to Model Services.'
            }, context.outputChannel);
            return;
        }
        
        // Build URL with query parameter for specific request
        const apiUrl = `https://modelservicesapi.derivative-programming.com/api/v1_0/validation-requests?modelValidationRequestCode=${encodeURIComponent(requestCode)}`;
        
        // Make the API call
        const response = await fetch(apiUrl, {
            headers: { 'Api-Key': apiKey }
        });
        
        // Check for unauthorized errors
        if (response.status === 401) {
            await authService.logout();
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Your session has expired. Please log in again.'
            }, context.outputChannel);
            return;
        }
        
        if (!response.ok) {
            sendJsonResponse(res, response.status, {
                success: false,
                error: `Model Services API error: ${response.statusText}`
            }, context.outputChannel);
            return;
        }
        
        const data = await response.json();
        
        // Extract the single item from the items array
        if (data.items && data.items.length > 0) {
            sendJsonResponse(res, 200, {
                success: true,
                item: data.items[0]
            }, context.outputChannel);
        } else {
            sendJsonResponse(res, 404, {
                success: false,
                error: 'Validation request not found'
            }, context.outputChannel);
        }
    } catch (error: any) {
        context.outputChannel?.appendLine(`Error fetching validation request details: ${error.message}`);
        sendJsonResponse(res, 500, {
            success: false,
            error: error.message || 'Failed to fetch validation request details'
        }, context.outputChannel);
    }
}

/**
 * GET /api/model-services/fabrication-request-details
 * Get single fabrication request details by request code
 */
export async function getFabricationRequestDetails(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        // Parse query parameters from GET request
        const requestUrl = new URL(req.url || '', `http://${req.headers.host}`);
        const requestCode = requestUrl.searchParams.get('requestCode');
        
        if (!requestCode) {
            sendJsonResponse(res, 400, {
                success: false,
                error: 'Request code is required'
            }, context.outputChannel);
            return;
        }
        
        const authService = AuthService.getInstance();
        const apiKey = await authService.getApiKey();

        if (!apiKey) {
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Authentication required. Please log in to Model Services.'
            }, context.outputChannel);
            return;
        }
        
        // Build URL with query parameter for specific request
        const apiUrl = `https://modelservicesapi.derivative-programming.com/api/v1_0/fabrication-requests?modelFabricationRequestCode=${encodeURIComponent(requestCode)}`;
        
        // Make the API call
        const response = await fetch(apiUrl, {
            headers: { 'Api-Key': apiKey }
        });
        
        // Check for unauthorized errors
        if (response.status === 401) {
            await authService.logout();
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Your session has expired. Please log in again.'
            }, context.outputChannel);
            return;
        }
        
        if (!response.ok) {
            sendJsonResponse(res, response.status, {
                success: false,
                error: `Model Services API error: ${response.statusText}`
            }, context.outputChannel);
            return;
        }
        
        const data = await response.json();
        
        // Extract the single item from the items array
        if (data.items && data.items.length > 0) {
            sendJsonResponse(res, 200, {
                success: true,
                item: data.items[0]
            }, context.outputChannel);
        } else {
            sendJsonResponse(res, 404, {
                success: false,
                error: 'Fabrication request not found'
            }, context.outputChannel);
        }
    } catch (error: any) {
        context.outputChannel?.appendLine(`Error fetching fabrication request details: ${error.message}`);
        sendJsonResponse(res, 500, {
            success: false,
            error: error.message || 'Failed to fetch fabrication request details'
        }, context.outputChannel);
    }
}

/**
 * GET /api/model-services/template-sets
 * Get available template sets (fabrication blueprint catalog)
 */
export async function getTemplateSets(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        // Parse query parameters from GET request
        const requestUrl = new URL(req.url || '', `http://${req.headers.host}`);
        const pageNumber = parseInt(requestUrl.searchParams.get('pageNumber') || '1');
        const itemCountPerPage = parseInt(requestUrl.searchParams.get('itemCountPerPage') || '10');
        const orderByColumnName = requestUrl.searchParams.get('orderByColumnName') || 'displayName';
        const orderByDescending = requestUrl.searchParams.get('orderByDescending') === 'true';
        
        const authService = AuthService.getInstance();
        const apiKey = await authService.getApiKey();

        if (!apiKey) {
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Authentication required. Please log in to Model Services.'
            }, context.outputChannel);
            return;
        }
        
        // Build URL with query parameters
        const params = [
            'PageNumber=' + encodeURIComponent(pageNumber || 1),
            'ItemCountPerPage=' + encodeURIComponent(itemCountPerPage || 10),
            'OrderByDescending=' + encodeURIComponent(orderByDescending ? 'true' : 'false')
        ];
        if (orderByColumnName) {
            params.push('OrderByColumnName=' + encodeURIComponent(orderByColumnName));
        }
        const apiUrl = 'https://modelservicesapi.derivative-programming.com/api/v1_0/template-sets?' + params.join('&');
        
        // Make the API call
        const response = await fetch(apiUrl, {
            headers: { 'Api-Key': apiKey }
        });
        
        // Check for unauthorized errors
        if (response.status === 401) {
            await authService.logout();
            sendJsonResponse(res, 401, {
                success: false,
                error: 'Your session has expired. Please log in again.'
            }, context.outputChannel);
            return;
        }
        
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        sendJsonResponse(res, 200, {
            success: true,
            data: data
        }, context.outputChannel);
        
    } catch (error: any) {
        context.outputChannel?.appendLine(`[Data Bridge] Error fetching template sets: ${error.message}`);
        sendErrorResponse(res, 500, error.message || 'Failed to fetch template sets', context.outputChannel);
    }
}

// NOTE: Model service routes return placeholder responses
// Full implementation requires:
// 1. External AI service API configuration
// 2. Authentication credentials management
// 3. Request/response schema definitions
// 4. Error handling for external service failures

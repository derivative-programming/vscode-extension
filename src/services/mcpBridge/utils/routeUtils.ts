// routeUtils.ts
// Common utilities for MCP Bridge route handlers
// Created on: November 30, 2025

import * as http from "http";
import * as vscode from "vscode";
import { ModelService } from "../../modelService";
import { ParsedRequestBody } from "../types/routeTypes";

/**
 * Parse JSON body from request
 */
export function parseRequestBody(req: http.IncomingMessage): Promise<ParsedRequestBody> {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        });
        req.on("end", () => {
            try {
                const parsed = body ? JSON.parse(body) : {};
                resolve(parsed);
            } catch (error) {
                reject(new Error("Invalid JSON in request body"));
            }
        });
        req.on("error", reject);
    });
}

/**
 * Send JSON response
 */
export function sendJsonResponse(
    res: http.ServerResponse,
    statusCode: number,
    data: any,
    outputChannel?: vscode.OutputChannel
): void {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
    
    if (outputChannel) {
        outputChannel.appendLine(`[Response] ${statusCode} - ${JSON.stringify(data).substring(0, 200)}`);
    }
}

/**
 * Send error response
 */
export function sendErrorResponse(
    res: http.ServerResponse,
    statusCode: number,
    message: string,
    outputChannel?: vscode.OutputChannel
): void {
    const errorData = { error: message };
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(errorData));
    
    if (outputChannel) {
        outputChannel.appendLine(`[Error] ${statusCode} - ${message}`);
    }
}

/**
 * Check if model is loaded
 */
export function ensureModelLoaded(
    res: http.ServerResponse,
    outputChannel?: vscode.OutputChannel
): boolean {
    const modelService = ModelService.getInstance();
    const model = modelService.getCurrentModel();
    
    if (!model) {
        sendErrorResponse(res, 400, "No model loaded", outputChannel);
        return false;
    }
    
    return true;
}

/**
 * Set CORS headers
 */
export function setCorsHeaders(res: http.ServerResponse): void {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/**
 * Handle OPTIONS preflight request
 */
export function handleOptionsRequest(res: http.ServerResponse): void {
    res.writeHead(200);
    res.end();
}

/**
 * Extract namespace and object name from path
 */
export function extractPathParams(url: string, pattern: RegExp): { [key: string]: string } | null {
    const match = url.match(pattern);
    if (!match) {
        return null;
    }
    
    const params: { [key: string]: string } = {};
    const keys = pattern.toString().match(/\(\?<(\w+)>/g);
    
    if (keys) {
        keys.forEach((key, index) => {
            const paramName = key.match(/\?<(\w+)>/)![1];
            params[paramName] = match[index + 1];
        });
    }
    
    return params;
}

/**
 * Log request details
 */
export function logRequest(
    req: http.IncomingMessage,
    outputChannel?: vscode.OutputChannel
): void {
    const logMessage = `[Bridge] ${req.method} ${req.url}`;
    if (outputChannel) {
        outputChannel.appendLine(logMessage);
    }
    console.log(logMessage);
}

// routeTypes.ts
// Shared types for MCP Bridge route handlers
// Created on: November 30, 2025

import * as http from "http";
import * as vscode from "vscode";

/**
 * Route handler function type
 */
export type RouteHandler = (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
) => Promise<void> | void;

/**
 * Context passed to all route handlers
 */
export interface RouteContext {
    outputChannel: vscode.OutputChannel;
    extensionContext?: vscode.ExtensionContext;
}

/**
 * Route definition for registration
 */
export interface RouteDefinition {
    method: "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS";
    path: string | RegExp;
    handler: RouteHandler;
}

/**
 * Parsed request body
 */
export interface ParsedRequestBody {
    [key: string]: any;
}

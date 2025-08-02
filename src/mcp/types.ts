// types.ts
// Model Context Protocol type definitions for AppDNA VS Code Extension
// Created on: August 2, 2025
// This file contains type definitions for the MCP server implementation

/**
 * JSON-RPC 2.0 base message structure
 */
export interface JsonRpcMessage {
    jsonrpc: string;
    id?: string | number | null;
}

/**
 * JSON-RPC 2.0 request message
 */
export interface JsonRpcRequest extends JsonRpcMessage {
    method: string;
    params?: any;
}

/**
 * JSON-RPC 2.0 response message
 */
export interface JsonRpcResponse extends JsonRpcMessage {
    result?: any;
    error?: JsonRpcError;
}

/**
 * JSON-RPC 2.0 notification message (no id, no response expected)
 */
export interface JsonRpcNotification {
    jsonrpc: string;
    method: string;
    params?: any;
}

/**
 * JSON-RPC 2.0 error object
 */
export interface JsonRpcError {
    code: number;
    message: string;
    data?: any;
}

/**
 * MCP server capabilities
 */
export interface McpServerCapabilities {
    tools: McpTool[];
    transport: string[];
    authentication: string[];
    json: boolean;
    streaming: boolean;
}

/**
 * MCP server information
 */
export interface McpServerInfo {
    name: string;
    version: string;
    description: string;
}

/**
 * MCP tool definition
 */
export interface McpTool {
    name: string;
    description: string;
    inputs?: McpToolParameter[];
    outputs?: McpToolParameter[];
    parameters: {
        type: 'object';
        properties: Record<string, McpToolPropertySchema>;
        required?: string[];
    };
}

/**
 * MCP tool parameter
 */
export interface McpToolParameter {
    name: string;
    type: string;
    description: string;
    required?: boolean;
}

/**
 * MCP tool property schema (JSON Schema subset)
 */
export interface McpToolPropertySchema {
    type: string;
    description: string;
    enum?: string[];
    items?: McpToolPropertySchema;
    properties?: Record<string, McpToolPropertySchema>;
    required?: string[];
}

/**
 * MCP initialize request parameters
 */
export interface McpInitializeParams {
    capabilities?: {
        [key: string]: any;
    };
    clientInfo?: {
        name: string;
        version: string;
    };
}

/**
 * MCP initialize response result
 */
export interface McpInitializeResult {
    capabilities: McpServerCapabilities;
    serverInfo: McpServerInfo;
}

/**
 * MCP tool execution parameters
 */
export interface McpExecuteParams {
    name: string;
    parameters?: Record<string, any>;
}

/**
 * MCP tool execution result
 */
export interface McpExecuteResult {
    success?: boolean;
    result?: any;
    error?: string;
    data?: any;
    [key: string]: any;
}

/**
 * Standard JSON-RPC error codes
 */
export enum JsonRpcErrorCode {
    ParseError = -32700,
    InvalidRequest = -32600,
    MethodNotFound = -32601,
    InvalidParams = -32602,
    InternalError = -32603,
    // Custom error codes can be from -32099 to -32000
    ServerError = -32000
}

/**
 * User story creation parameters
 */
export interface CreateUserStoryParams {
    title?: string;
    description: string;
}

/**
 * User story result
 */
export interface UserStoryResult {
    success: boolean;
    story?: {
        name: string;
        storyNumber: string;
        storyText: string;
        isIgnored?: string;
    };
    error?: string;
    note?: string;
}

/**
 * User story list result
 */
export interface UserStoryListResult {
    success: boolean;
    stories: Array<{
        title: string;
        description: string;
        isIgnored: boolean;
    }>;
    note?: string;
}

/**
 * HTTP server configuration
 */
export interface McpHttpServerConfig {
    port: number;
    host: string;
    enabled: boolean;
}

/**
 * Server status enumeration
 */
export enum McpServerStatus {
    Stopped = 'stopped',
    Starting = 'starting',
    Running = 'running',
    Error = 'error'
}

/**
 * MCP transport types
 */
export enum McpTransportType {
    Stdio = 'stdio',
    Http = 'http',
    WebSocket = 'websocket'
}

/**
 * GitHub Copilot MCP configuration structure for settings.json
 */
export interface CopilotMcpConfig {
    'github.copilot.advanced': {
        'mcp.discovery.enabled': boolean;
        'mcp.execution.enabled': boolean;
    };
    'mcp.servers': Record<string, McpServerConfig>;
}

/**
 * Individual MCP server configuration in VS Code settings
 */
export interface McpServerConfig {
    type: McpTransportType;
    command?: string;
    args?: string[];
    transport?: McpTransportType;
    enabled: boolean;
    url?: string; // For HTTP transport
    env?: Record<string, string>;
}

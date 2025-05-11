// HTTP server implementation for MCP protocol
// Created on: May 10, 2025

import * as vscode from 'vscode';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { MCPServer } from './server';

/**
 * HTTP server wrapper for MCP protocol
 * This allows Copilot to communicate with our MCP server over HTTP
 */
export class MCPHttpServer {
    private static instance: MCPHttpServer | null = null;
    private server: http.Server | null = null;
    private isRunning = false;
    private port = 3000;
    private mcpServer: MCPServer;
    private outputChannel: vscode.OutputChannel;    
    // Track active SSE connections for sending responses back
    private sseConnections: Map<string, http.ServerResponse> = new Map();
    // Event emitter for server status changes
    private readonly _onStatusChange: vscode.EventEmitter<boolean> = new vscode.EventEmitter<boolean>();
    readonly onStatusChange: vscode.Event<boolean> = this._onStatusChange.event;

    /**
     * Private constructor for singleton pattern
     */
    private constructor() {
        this.mcpServer = MCPServer.getInstance();
        this.outputChannel = vscode.window.createOutputChannel('AppDNA MCP HTTP Server');
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): MCPHttpServer {
        if (!MCPHttpServer.instance) {
            MCPHttpServer.instance = new MCPHttpServer();
        }
        return MCPHttpServer.instance;
    }

    /**
     * Start the HTTP server
     */
    public async start(): Promise<void> {
        if (this.isRunning) {
            vscode.window.showInformationMessage('MCP HTTP server is already running');
            return;
        }

        try {
            // Find an available port
            this.port = await this.findAvailablePort(3000);
            
            // Create HTTP server
            this.server = http.createServer((req, res) => this.handleRequest(req, res));
            
            // Start listening            
            this.server.listen(this.port, '127.0.0.1', () => {
                this.isRunning = true;
                this.logMessage(`MCP HTTP Server running at http://localhost:${this.port}/`);
                vscode.window.showInformationMessage(`MCP HTTP server started on port ${this.port}`);
                
                // Create or update the Copilot config file
                this.createCopilotConfig();
                
                // Notify listeners about status change
                this._onStatusChange.fire(true);
            });

            // Handle server errors
            this.server.on('error', (err) => {
                this.logError(`Server error: ${err.message}`);
                vscode.window.showErrorMessage(`MCP HTTP server error: ${err.message}`);
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logError(`Failed to start MCP HTTP server: ${errorMessage}`);
            vscode.window.showErrorMessage(`Failed to start MCP HTTP server: ${errorMessage}`);
        }
    }

    /**
     * Stop the server
     */
    public stop(): void {
        if (!this.isRunning || !this.server) {
            vscode.window.showInformationMessage('MCP HTTP server is not running');
            return;
        }

        try {
            this.server.close(() => {                this.isRunning = false;
                this.server = null;
                this.logMessage('MCP HTTP Server stopped');
                vscode.window.showInformationMessage('MCP HTTP server stopped');
                
                // Notify listeners about status change
                this._onStatusChange.fire(false);
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logError(`Failed to stop MCP HTTP server: ${errorMessage}`);
            vscode.window.showErrorMessage(`Failed to stop MCP HTTP server: ${errorMessage}`);
        }
    }    /**
     * Handle incoming HTTP requests
     */
    private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // Handle preflight OPTIONS request
        if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
        }        // Handle SSE connections (both at root path and /sse endpoint)
        if (req.method === 'GET' && (req.url === '/' || req.url === '' || 
            req.url?.startsWith('/?sessionId=') || 
            req.url === '/sse' || req.url?.startsWith('/sse?sessionId='))) {
              // Extract sessionId if provided
            let sessionId;
            try {
                const url = new URL(req.url || '/', `http://localhost:${this.port}`);
                sessionId = url.searchParams.get('sessionId');
            } catch (error) {
                // Fallback in case URL parsing fails
                sessionId = req.url?.includes('sessionId=') ? 
                    req.url.split('sessionId=')[1]?.split('&')[0] : undefined;
            }
            
            // Generate a session ID if none provided
            if (!sessionId) {
                sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            }
            
            this.logMessage(`Establishing SSE connection for session: ${sessionId}`);
            
            // Store the connection for sending responses later
            this.sseConnections.set(sessionId, res);
            
            // Set headers for Server-Sent Events
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.statusCode = 200;
            
            this.logMessage(`Established SSE connection on path: ${req.url}`);
            
            // Send initial connected message (JSON-RPC 2.0 format)
            const connectedMsg = {
                jsonrpc: '2.0',
                method: 'mcp/connected',
                params: {
                    serverInfo: {
                        name: "AppDNA User Story MCP (HTTP)",
                        version: "1.0.0"
                    }
                }
            };
            res.write(`data: ${JSON.stringify(connectedMsg)}\n\n`);
            
            // Keep connection alive
            const keepAliveInterval = setInterval(() => {
                if (res.writableEnded) {
                    clearInterval(keepAliveInterval);
                    return;
                }
                res.write(': ping\n\n');
            }, 30000);
              // Handle client disconnect
            req.on('close', () => {
                clearInterval(keepAliveInterval);
                if (sessionId) {
                    this.sseConnections.delete(sessionId);
                    this.logMessage(`SSE connection closed for session: ${sessionId}`);
                } else {
                    this.logMessage('SSE connection closed');
                }
            });
            
            return;
        }// Handle standard MCP discovery endpoint (.well-known/mcp)
        if (req.method === 'GET' && req.url === '/.well-known/mcp') {
            const tools = (this.mcpServer as any).getToolDefinitions();
            const discoveryInfo = {
                version: "1.0",
                capabilities: {
                    tools: tools,
                    transport: ["sse"],
                    authentication: []  // No authentication required
                }
            };
            
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(discoveryInfo));
            
            this.logMessage('Sent MCP discovery information');
            return;
        }
        
        // Handle MCP base endpoint
        if (req.method === 'GET' && (req.url === '/mcp' || req.url === '/mcp/')) {
            const serverInfo = {
                jsonrpc: '2.0',
                result: {
                    name: "AppDNA User Story MCP (HTTP)",
                    description: "HTTP MCP server for interacting with AppDNA user stories",
                    version: "1.0.0",
                    capabilities: {
                        transport: ["sse"]
                    },                    endpoints: {
                        sse: `http://localhost:${this.port}/`,
                        message: `http://localhost:${this.port}/message`,
                        execute: `http://localhost:${this.port}/mcp/execute`,
                        ready: `http://localhost:${this.port}/mcp/ready`
                    }
                }
            };
            
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(serverInfo));
            
            this.logMessage('Sent MCP server info');
            return;
        }

        // Handle MCP ready request
        if (req.method === 'GET' && req.url === '/mcp/ready') {
            const tools = (this.mcpServer as any).getToolDefinitions();
            const readyResponse = {
                jsonrpc: '2.0',
                method: 'mcp/ready',
                params: {
                    tools
                }
            };
            
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(readyResponse));
              this.logMessage('Sent MCP ready response with tools');
            return;
        }
          // Handle initialize request - this is a standard JSON-RPC endpoint required by MCP clients
        if (req.method === 'POST' && (req.url === '/initialize' || req.url === '/')) {
            let body = '';
            
            req.on('data', (chunk) => {
                body += chunk.toString();
            });

            req.on('end', async () => {
                try {
                    const requestData = JSON.parse(body);
                    this.logMessage(`Received initialize request: ${body}`);
                    
                    // Check if this is a true initialize request
                    if (requestData.method === 'initialize' || req.url === '/initialize') {
                        // Send successful initialize response with server capabilities
                        const tools = (this.mcpServer as any).getToolDefinitions();
                          const response = {
                            jsonrpc: '2.0',
                            id: requestData.id,
                            result: {
                                capabilities: {
                                    json: true,
                                    sse: true,
                                    streaming: true
                                },
                                serverInfo: {
                                    name: "AppDNA User Story MCP (HTTP)",
                                    version: "1.0.0"
                                },
                                tools: tools,
                                endpoints: {
                                    sse: `http://localhost:${this.port}/`,
                                    message: `http://localhost:${this.port}/message`,
                                    ready: `http://localhost:${this.port}/mcp/ready`
                                }
                            }
                        };
                        
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(response));
                        
                        this.logMessage('Sent initialize response with server capabilities');
                    }
                    // Handle general JSON-RPC requests at root path
                    else if (requestData.method) {
                        this.logMessage(`Received JSON-RPC request at root: ${requestData.method}`);
                        
                        // TODO: Handle other JSON-RPC methods here
                        
                        // Default response for unknown methods
                        const response = {
                            jsonrpc: '2.0',
                            id: requestData.id,
                            error: {
                                code: -32601,
                                message: `Method ${requestData.method} not found`
                            }
                        };
                        
                        res.statusCode = 200; // Still send 200 for JSON-RPC errors
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(response));
                    }
                } catch (error) {
                    // Handle parse error (JSON-RPC 2.0 spec)
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    res.statusCode = 200; // Use 200 for JSON-RPC protocol errors
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        jsonrpc: '2.0',
                        error: {
                            code: -32700,
                            message: 'Parse error',
                            data: { error: errorMsg }
                        }
                    }));
                    
                    this.logError(`Parse error in initialize: ${errorMsg}`);
                }
            });
            
            return;
        }
          // Handle message endpoint for JSON-RPC messages from Copilot agent
        if (req.method === 'POST' && req.url === '/message') {
            let body = '';
            
            req.on('data', (chunk) => {
                body += chunk.toString();
            });

            req.on('end', async () => {
                try {
                    const requestData = JSON.parse(body);
                    this.logMessage(`Received message request: ${body}`);
                    
                    // Extract session ID from headers if available
                    const sessionId = req.headers['x-session-id'] as string || undefined;
                    
                    // Start the MCP server if not running
                    if (!this.mcpServer.isServerRunning()) {
                        await this.mcpServer.start();
                    }
                    
                    // Validate JSON-RPC 2.0 request format
                    if (!requestData.jsonrpc || requestData.jsonrpc !== '2.0' || !requestData.method) {
                        const errorResponse = {
                            jsonrpc: '2.0',
                            id: requestData.id || null,
                            error: {
                                code: -32600,
                                message: 'Invalid Request',
                                data: { details: 'Not a valid JSON-RPC 2.0 request' }
                            }
                        };
                        
                        // Send error through SSE
                        this.sendSseMessage(errorResponse, sessionId);
                        
                        // Also send minimal acknowledgment via HTTP
                        res.statusCode = 202; // Accepted
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ received: true }));
                        return;
                    }
                    
                    // Process the request - we'll execute these async and send responses through SSE
                    this.processJsonRpcRequest(requestData, sessionId);
                    
                    // Acknowledge receipt (minimal response)
                    res.statusCode = 202; // Accepted
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ received: true }));
                } catch (error) {
                    // Handle parse error
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    this.logError(`Parse error in message endpoint: ${errorMsg}`);
                    
                    // Send error via HTTP response
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        jsonrpc: '2.0',
                        error: {
                            code: -32700,
                            message: 'Parse error',
                            data: { error: errorMsg }
                        }
                    }));
                }
            });
            
            return;
        }
        
        // Handle tool execution requests
        if (req.method === 'POST' && req.url === '/mcp/execute') {
            let body = '';
            
            req.on('data', (chunk) => {
                body += chunk.toString();
            });

            req.on('end', async () => {
                try {
                    const requestData = JSON.parse(body);
                    this.logMessage(`Received MCP execute request: ${body}`);
                    
                    // Start the MCP server if not running
                    if (!this.mcpServer.isServerRunning()) {
                        await this.mcpServer.start();
                    }
                    
                    // Call the appropriate tool
                    const { id, params } = requestData;
                    const { name, parameters } = params;
                    
                    try {
                        let result;
                        // Access the internal tools using the server instance
                        const mcpServerAny = this.mcpServer as any;
                          if (name === 'createUserStory' && mcpServerAny.userStoryTools) {
                            result = await mcpServerAny.userStoryTools.createUserStory(parameters);
                        } else if (name === 'listUserStories' && mcpServerAny.userStoryTools) {
                            result = await mcpServerAny.userStoryTools.listUserStories();
                        } else {
                            // Try to execute the tool generically if available
                            if (mcpServerAny.executeToolByName) {
                                result = await mcpServerAny.executeToolByName(name, parameters);
                            } else {
                                throw new Error(`Unknown tool: ${name}`);
                            }
                        }
                        
                        // Send successful response
                        const response = {
                            jsonrpc: '2.0',
                            id,
                            result
                        };
                        
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(response));
                        
                        this.logMessage(`Sent result for tool ${name}: ${JSON.stringify(result)}`);
                    } catch (error) {
                        // Send error response
                        const errorMsg = error instanceof Error ? error.message : String(error);
                        const response = {
                            jsonrpc: '2.0',
                            id,
                            error: {
                                code: -32603,
                                message: errorMsg,
                                data: { name }
                            }
                        };
                        
                        res.statusCode = 200; // Still use 200 for JSON-RPC errors
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(response));
                        
                        this.logError(`Error executing tool ${name}: ${errorMsg}`);
                    }
                } catch (error) {
                    // Handle parse error
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        jsonrpc: '2.0',
                        error: {
                            code: -32700,
                            message: 'Parse error',
                            data: { error: errorMsg }
                        }
                    }));
                    
                    this.logError(`Parse error: ${errorMsg}`);
                }
            });
            
            return;
        }        // Handle unknown requests
        this.logMessage(`Received unknown request: ${req.method} ${req.url}`);
        
        // For better troubleshooting, log request headers
        const headers = JSON.stringify(req.headers);
        this.logMessage(`Request headers: ${headers}`);
        
        // For GET requests to paths likely meant for MCP, return info instead of 404
        if (req.method === 'GET' && (req.url?.includes('/mcp') || req.url?.includes('/.well-known'))) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            
            // Send info about available endpoints to help troubleshoot
            const availableEndpoints = {
                message: `Endpoint not found: ${req.url}`,                availableEndpoints: {
                    sse: `http://localhost:${this.port}/`,
                    initialize: `http://localhost:${this.port}/initialize`,
                    message: `http://localhost:${this.port}/message`,
                    discovery: `http://localhost:${this.port}/.well-known/mcp`,
                    ready: `http://localhost:${this.port}/mcp/ready`,
                    execute: `http://localhost:${this.port}/mcp/execute`
                }
            };
            
            res.end(JSON.stringify(availableEndpoints));
            return;
        }
        
        // Standard 404 for truly unknown requests
        res.statusCode = 404;
        res.end('Not Found');
    }

    /**
     * Find an available port starting from the given port
     */
    private async findAvailablePort(startPort: number): Promise<number> {
        let port = startPort;
        let maxAttempts = 10;
        
        while (maxAttempts > 0) {
            try {
                await new Promise<void>((resolve, reject) => {
                    const server = http.createServer();
                    server.on('error', reject);
                    server.listen(port, '127.0.0.1', () => {
                        server.close(() => resolve());
                    });
                });
                
                return port;
            } catch (error) {
                port++;
                maxAttempts--;
            }
        }
        
        throw new Error('Could not find an available port');
    }    

    /**
     * Log an informational message to the output channel
     * @param message The message to log
     */
    private logMessage(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] INFO: ${message}`);
    }

    /**
     * Log an error message to the output channel
     * @param message The error message to log
     */
    private logError(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ERROR: ${message}`);
    }
    
    /**
     * Create a Copilot configuration file for the MCP server
     */
    private createCopilotConfig(): void {
        try {
            // Get the first workspace folder
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                this.logError('No workspace folder found');
                return;
            }

            // Check if we're in a development environment
            const extensionDevelopmentPath = process.env.VSCODE_EXTENSION_DEVELOPMENT_PATH;
            const isDevEnvironment = extensionDevelopmentPath && workspaceFolder.uri.fsPath.includes(extensionDevelopmentPath);
            
            if (isDevEnvironment) {
                this.logMessage('Skipping Copilot configuration in development environment');
                return;
            }

            // Create .vscode folder if it doesn't exist
            const vscodeFolder = path.join(workspaceFolder.uri.fsPath, '.vscode');
            if (!fs.existsSync(vscodeFolder)) {
                fs.mkdirSync(vscodeFolder, { recursive: true });
            }
            
            // Add required GitHub Copilot settings for MCP
            const settingsPath = path.join(vscodeFolder, 'settings.json');
            let settings = {};
            
            // Read existing settings if available
            if (fs.existsSync(settingsPath)) {
                try {
                    const settingsContent = fs.readFileSync(settingsPath, 'utf8');
                    settings = JSON.parse(settingsContent);
                } catch (error) {
                    this.logError(`Error reading settings.json: ${error instanceof Error ? error.message : String(error)}`);
                    // Continue with empty settings if parsing fails
                }
            }
            
            // Ensure settings has github.copilot.advanced section and register MCP server
            settings = {
                ...settings,                "github.copilot.advanced": {
                    ...(settings["github.copilot.advanced"] || {}),
                    "mcp.discovery.enabled": true,
                    "mcp.execution.enabled": true
                },
                "mcp.servers": {
                    ...((settings["mcp.servers"] || {})),
                    "AppDNAUserStoryMCPHttp": {
                        "type": "http",
                        "url": `http://localhost:${this.port}`,
                        "transport": "sse",
                        "description": "MCP HTTP server for interacting with AppDNA user stories",
                        "enabled": true
                    }
                }
            };
            
            // Write updated settings
            fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
            this.logMessage(`Updated VS Code settings for Copilot MCP integration at ${settingsPath}`);            // Create mcp-http.json configuration for backward compatibility
            const mcpConfigPath = path.join(vscodeFolder, 'mcp-http.json');
            // Don't use a schema reference - it's not required for functionality
            const mcpConfig = {
                "name": "AppDNA User Story MCP (HTTP)",
                "description": "HTTP MCP server for interacting with AppDNA user stories",
                "version": "1.0.0",
                "tools": (this.mcpServer as any).getToolDefinitions(),
                "server": {
                    "type": "http",
                    "url": `http://localhost:${this.port}`,
                    "transport": "sse"
                },                "endpoints": {
                    "sse": `http://localhost:${this.port}/`,
                    "message": `http://localhost:${this.port}/message`,
                    "execute": `http://localhost:${this.port}/mcp/execute`,
                    "ready": `http://localhost:${this.port}/mcp/ready`,
                    "discovery": `http://localhost:${this.port}/.well-known/mcp`
                }
            };
            
            fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2), 'utf8');
            this.logMessage(`Created MCP HTTP config at ${mcpConfigPath}`);
            vscode.window.showInformationMessage('MCP HTTP configuration created');        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logError(`Failed to create MCP HTTP configuration: ${errorMessage}`);
        }
    }

    /**
     * Check if the server is running
     */    public isServerRunning(): boolean {
        return this.isRunning;
    }
      /**
     * Send a message to a client through the SSE connection
     * @param message JSON-RPC 2.0 message to send
     * @param sessionId Optional session ID to send to specific client. If not provided, sends to all.
     */
    private sendSseMessage(message: any, sessionId?: string): void {
        if (sessionId && this.sseConnections.has(sessionId)) {
            // Send to specific client
            const res = this.sseConnections.get(sessionId)!;
            if (!res.writableEnded) {
                res.write(`data: ${JSON.stringify(message)}\n\n`);
                this.logMessage(`Sent message to session ${sessionId}: ${JSON.stringify(message)}`);
            }
        } else if (!sessionId) {
            // Broadcast to all clients
            let clientCount = 0;
            for (const [id, res] of this.sseConnections.entries()) {
                if (!res.writableEnded) {
                    res.write(`data: ${JSON.stringify(message)}\n\n`);
                    clientCount++;
                }
            }
            if (clientCount > 0) {
                this.logMessage(`Broadcast message to ${clientCount} clients: ${JSON.stringify(message)}`);
            }
        }
    }
    
    /**
     * Process a JSON-RPC request from a client and send the response through SSE
     * @param request The JSON-RPC request
     * @param sessionId The session ID to use for the response
     */
    private async processJsonRpcRequest(request: any, sessionId?: string): Promise<void> {
        const { id, method, params } = request;
        
        try {
            // Process JSON-RPC method requests
            this.logMessage(`Processing JSON-RPC request: ${method}`);
            
            // Initialize method is a special case
            if (method === 'initialize') {
                // Send successful initialize response with server capabilities
                const tools = (this.mcpServer as any).getToolDefinitions();
                
                const response = {
                    jsonrpc: '2.0',
                    id,
                    result: {
                        capabilities: {
                            json: true,
                            sse: true,
                            streaming: true
                        },
                        serverInfo: {
                            name: "AppDNA User Story MCP (HTTP)",
                            version: "1.0.0"
                        },
                        tools: tools,                        endpoints: {
                            sse: `http://localhost:${this.port}/`,
                            message: `http://localhost:${this.port}/message`,
                            ready: `http://localhost:${this.port}/mcp/ready`
                        }
                    }
                };
                
                this.sendSseMessage(response, sessionId);
                this.logMessage('Sent initialize response via SSE connection');
                return;
            }
            
            // Handle tool execution requests
            if (method === 'mcp/execute' && params?.name) {
                const toolName = params.name;
                const toolParams = params.parameters || {};
                
                try {
                    let result;
                    // Access the internal tools using the server instance
                    const mcpServerAny = this.mcpServer as any;
                    
                    if (toolName === 'createUserStory' && mcpServerAny.userStoryTools) {
                        result = await mcpServerAny.userStoryTools.createUserStory(toolParams);
                    } else if (toolName === 'listUserStories' && mcpServerAny.userStoryTools) {
                        result = await mcpServerAny.userStoryTools.listUserStories();
                    } else {
                        // Try to execute the tool generically by looking for all available tools
                        if (mcpServerAny.executeToolByName) {
                            result = await mcpServerAny.executeToolByName(toolName, toolParams);
                        } else {
                            throw new Error(`Unknown tool: ${toolName}`);
                        }
                    }
                    
                    // Send successful response
                    const response = {
                        jsonrpc: '2.0',
                        id,
                        result
                    };
                    
                    this.sendSseMessage(response, sessionId);
                    this.logMessage(`Sent result for tool ${toolName} via SSE: ${JSON.stringify(result)}`);
                } catch (error) {
                    // Send error response
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    const response = {
                        jsonrpc: '2.0',
                        id,
                        error: {
                            code: -32603, // Internal error
                            message: errorMsg,
                            data: { name: toolName }
                        }
                    };
                    
                    this.sendSseMessage(response, sessionId);
                    this.logError(`Error executing tool ${toolName}: ${errorMsg}`);
                }
                
                return;
            }
            
            // Handle shutdown request
            if (method === 'shutdown') {
                const response = {
                    jsonrpc: '2.0',
                    id,
                    result: null
                };
                
                this.sendSseMessage(response, sessionId);
                this.logMessage('Received shutdown request, sent acknowledgement');
                return;
            }
            
            // Handle unknown methods
            const response = {
                jsonrpc: '2.0',
                id,
                error: {
                    code: -32601, // Method not found
                    message: `Method ${method} not found`
                }
            };
            
            this.sendSseMessage(response, sessionId);
            this.logMessage(`Method not found: ${method}`);
        } catch (error) {
            // Send internal error
            const errorMsg = error instanceof Error ? error.message : String(error);
            const response = {
                jsonrpc: '2.0',
                id,
                error: {
                    code: -32603, // Internal error
                    message: 'Internal error',
                    data: { error: errorMsg }
                }
            };
            
            this.sendSseMessage(response, sessionId);
            this.logError(`Internal error processing request: ${errorMsg}`);
        }
    }
}

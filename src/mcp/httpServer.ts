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
            this.server.close(() => {
                this.isRunning = false;
                this.server = null;
                this.logMessage('MCP HTTP Server stopped');
                vscode.window.showInformationMessage('MCP HTTP server stopped');
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logError(`Failed to stop MCP HTTP server: ${errorMessage}`);
            vscode.window.showErrorMessage(`Failed to stop MCP HTTP server: ${errorMessage}`);
        }
    }

    /**
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
                            throw new Error(`Unknown tool: ${name}`);
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
        }

        // Handle unknown requests
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
                ...settings,
                "github.copilot.advanced": {
                    ...(settings["github.copilot.advanced"] || {}),
                    "mcp.discovery.enabled": true,
                    "mcp.execution.enabled": true
                },
                "mcp": {
                    ...((settings["mcp"] || {})),
                    "servers": {
                        ...((settings["mcp"] && settings["mcp"]["servers"]) || {}),
                        "AppDNAUserStoryMCPHttp": {
                            "type": "http",
                            "url": `http://localhost:${this.port}`
                        }
                    }
                }
            };
            
            // Write updated settings
            fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
            this.logMessage(`Updated VS Code settings for Copilot MCP integration at ${settingsPath}`);

            // Create mcp-http.json configuration for backward compatibility
            const mcpConfigPath = path.join(vscodeFolder, 'mcp-http.json');
            // Don't use a schema reference - it's not required for functionality
            const mcpConfig = {
                "name": "AppDNA User Story MCP (HTTP)",
                "description": "HTTP MCP server for interacting with AppDNA user stories",
                "version": "1.0.0",
                "tools": (this.mcpServer as any).getToolDefinitions(),
                "server": {
                    "type": "http",
                    "url": `http://localhost:${this.port}`
                }
            };
            
            fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2), 'utf8');
            this.logMessage(`Created MCP HTTP config at ${mcpConfigPath}`);
            vscode.window.showInformationMessage('MCP HTTP configuration created');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logError(`Failed to create MCP HTTP configuration: ${errorMessage}`);
        }
    }
}

// server.ts
// MCP server implementation for VS Code extension
// Created on: May 10, 2025
// This file implements a Model Context Protocol server that runs on stdio transport

import * as vscode from 'vscode';
import { ModelService } from '../services/modelService';
import { UserStoryTools } from './tools/userStoryTools';

/**
 * MCP Server for handling GitHub Copilot interactions
 * with user stories via Model Context Protocol
 */
export class MCPServer {
    private static instance: MCPServer | null = null;
    private isRunning = false;
    private modelService: ModelService;
    private userStoryTools: UserStoryTools;
    // In-memory storage for user stories when model service is not available
    private inMemoryUserStories: any[] = [];
    
    // Output channel for MCP server logging
    private outputChannel: vscode.OutputChannel | undefined;
    
    // Event emitter for server status changes
    private readonly _onStatusChange: vscode.EventEmitter<boolean> = new vscode.EventEmitter<boolean>();
    readonly onStatusChange: vscode.Event<boolean> = this._onStatusChange.event;

    /**
     * Private constructor for singleton pattern
     */
    private constructor() {
        this.modelService = ModelService.getInstance();
        this.userStoryTools = new UserStoryTools(this);
    }

    /**
     * Get singleton instance of MCP Server
     */
    public static getInstance(): MCPServer {
        if (!MCPServer.instance) {
            MCPServer.instance = new MCPServer();
        }
        return MCPServer.instance;
    }

    /**
     * Start the MCP server
     */
    public async start(): Promise<void> {
        if (this.isRunning) {
            vscode.window.showInformationMessage('MCP server is already running');
            return;
        }

        try {
            this.isRunning = true;
            this.setupStdioTransport();
            vscode.window.showInformationMessage('MCP server started successfully');
            
            // Notify listeners about status change
            this._onStatusChange.fire(true);
        } catch (error) {
            this.isRunning = false;
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to start MCP server: ${errorMessage}`);
            
            // Notify listeners about failed start
            this._onStatusChange.fire(false);
        }
    }

    /**
     * Stop the MCP server
     */
    public stop(): void {
        if (!this.isRunning) {
            vscode.window.showInformationMessage('MCP server is not running');
            return;
        }

        this.isRunning = false;
        // Clean up resources here if needed
        vscode.window.showInformationMessage('MCP server stopped');
        
        // Notify listeners about status change
        this._onStatusChange.fire(false);
    }

    /**
     * Set up stdio transport for MCP communication
     */
    private setupStdioTransport(): void {
        // Set up stdin listener
        process.stdin.on('data', (data) => {
            this.handleIncomingMessage(data.toString());
        });

        // Indicate server is ready
        this.sendMessage({
            jsonrpc: '2.0',
            method: 'mcp/ready',
            params: {
                tools: this.getToolDefinitions()
            }
        });
    }

    /**
     * Handle incoming MCP messages
     */
    private handleIncomingMessage(message: string): void {
        try {
            const parsedMessage = JSON.parse(message);
            console.log('[MCP Server] Received message:', parsedMessage);

            // Create an output channel if it doesn't exist
            if (!this.outputChannel) {
                this.outputChannel = vscode.window.createOutputChannel('AppDNA MCP Server');
            }
            
            // Log to output channel for debugging
            this.outputChannel.appendLine(`[${new Date().toISOString()}] RECEIVED: ${message}`);
            this.outputChannel.show();
            
            // Handle initialize request (critical for JSON-RPC 2.0 handshake)
            if (parsedMessage.method === 'initialize') {
                this.handleInitializeRequest(parsedMessage);
            }
            // Handle tool execution requests
            else if (parsedMessage.method === 'mcp/execute') {
                const toolName = parsedMessage.params?.name || 'unknown';
                vscode.window.showInformationMessage(`MCP Server: GitHub Copilot requested '${toolName}'`);
                this.handleToolExecution(parsedMessage);
            }
        } catch (error) {
            console.error('[MCP Server] Error handling message:', error);
            
            if (this.outputChannel) {
                this.outputChannel.appendLine(`[${new Date().toISOString()}] ERROR: ${error}`);
                this.outputChannel.show();
            }
            
            this.sendErrorResponse({
                code: -32700,
                message: 'Parse error',
                data: { error: String(error) }
            });
        }
    }

    /**
     * Handle initialize requests for MCP
     * This is a critical part of the JSON-RPC 2.0 handshake used by Copilot
     */
    private handleInitializeRequest(message: any): void {
        const { id } = message;
        const tools = this.getToolDefinitions();
        
        // Log the initialize request
        console.log('[MCP Server] Handling initialize request with id:', id);
        
        if (this.outputChannel) {
            this.outputChannel.appendLine(`[${new Date().toISOString()}] HANDLING: Initialize request with id ${id}`);
        }
        
        // Build and send the initialize response according to the MCP specification
        this.sendMessage({
            jsonrpc: '2.0',
            id,
            result: {
                capabilities: {
                    // Include all tools supported by the server
                    tools: tools,
                    // Indicate this server uses stdio transport
                    transport: ['stdio'],
                    // No authentication required for stdio-based servers
                    authentication: ['none'],
                    // Additional capability flags
                    json: true,
                    streaming: true
                },
                // Include server information
                serverInfo: {
                    name: "AppDNA User Story MCP",
                    version: "1.0.0",
                    description: "MCP server for interacting with AppDNA user stories"
                }
            }
        });
        
        vscode.window.showInformationMessage('MCP server initialized for GitHub Copilot');
    }

    /**
     * Handle tool execution requests
     */
    private async handleToolExecution(message: any): Promise<void> {
        const { id, params } = message;
        const { name, parameters } = params;

        try {
            let result;
            
            // Route to appropriate tool
            if (name === 'createUserStory') {
                result = await this.userStoryTools.createUserStory(parameters);
            } else if (name === 'listUserStories') {
                result = await this.userStoryTools.listUserStories();
            } else {
                throw new Error(`Unknown tool: ${name}`);
            }

            // Send successful response
            this.sendMessage({
                jsonrpc: '2.0',
                id,
                result
            });
        } catch (error) {
            console.error(`[MCP Server] Error executing tool ${name}:`, error);
            
            // Send error response
            this.sendErrorResponse({
                code: -32603,
                message: error instanceof Error ? error.message : String(error),
                data: { name }
            }, id);
        }
    }

    /**
     * Execute a tool by name
     * Used for dynamic tool execution when tools are added in the future
     */
    public async executeToolByName(name: string, parameters: any): Promise<any> {
        // Execute tool based on name
        if (name === 'createUserStory') {
            return await this.userStoryTools.createUserStory(parameters);
        } else if (name === 'listUserStories') {
            return await this.userStoryTools.listUserStories();
        } 
        
        // Add more tool implementations here as they are developed
        
        // If no matching tool is found
        throw new Error(`Unknown tool: ${name}`);
    }

    /**
     * Get tool definitions for the MCP server
     * Used by both stdio and HTTP transports
     */
    public getToolDefinitions(): any[] {
        return [
            {
                name: 'createUserStory',
                description: 'Creates a user story and validates its format',
                inputs: [
                    {
                        name: 'title',
                        type: 'string',
                        description: 'Title or ID for the user story (optional)',
                        required: false
                    },
                    {
                        name: 'description',
                        type: 'string',
                        description: 'The user story text following one of these formats:\n' +
                            '1. A [Role name] wants to [View all, view, add, update, delete] a [object name]\n' +
                            '2. As a [Role name], I want to [View all, view, add, update, delete] a [object name]',
                        required: true
                    }
                ],
                outputs: [
                    {
                        name: 'id',
                        type: 'string',
                        description: 'Generated ID for the created user story'
                    },
                    {
                        name: 'story',
                        type: 'object',
                        description: 'The created user story with all details'
                    }
                ],
                // Supporting older schema format for backward compatibility
                parameters: {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string',
                            description: 'Title or ID for the user story (optional)'
                        },
                        description: {
                            type: 'string',
                            description: 'The user story text following one of these formats:\n' +
                                '1. A [Role name] wants to [View all, view, add, update, delete] a [object name]\n' +
                                '2. As a [Role name], I want to [View all, view, add, update, delete] a [object name]'
                        }
                    },
                    required: ['description']
                }
            },
            {
                name: 'listUserStories',
                description: 'Lists all user stories',
                inputs: [],
                outputs: [
                    {
                        name: 'stories',
                        type: 'array',
                        description: 'List of all user stories'
                    }
                ],
                // Supporting older schema format for backward compatibility
                parameters: {
                    type: 'object',
                    properties: {}
                }
            }
        ];
    }

    /**
     * Send a message via MCP
     */
    private sendMessage(message: any): void {
        const serialized = JSON.stringify(message);
        process.stdout.write(serialized + '\n');
        
        // Comprehensive logging
        console.log('[MCP Server] Sent message:', serialized);
        
        // Create an output channel if it doesn't exist
        if (!this.outputChannel) {
            this.outputChannel = vscode.window.createOutputChannel('AppDNA MCP Server');
        }
        
        // Log to output channel for debugging
        this.outputChannel.appendLine(`[${new Date().toISOString()}] SENT: ${serialized}`);
        
        // For ready message and important messages, show notifications
        if (message.method === 'mcp/ready') {
            vscode.window.showInformationMessage(`MCP Server ready with ${(message.params?.tools || []).length} tools`);
        } else if (message.error) {
            vscode.window.showErrorMessage(`MCP Server error: ${message.error.message || 'Unknown error'}`);
        }
    }

    /**
     * Send an error response via MCP
     */
    private sendErrorResponse(error: any, id?: string | number): void {
        this.sendMessage({
            jsonrpc: '2.0',
            id: id || null,
            error
        });
    }

    /**
     * Get the model service instance
     */
    public getModelService(): ModelService {
        return this.modelService;
    }

    /**
     * Get in-memory user stories
     */
    public getInMemoryUserStories(): any[] {
        return this.inMemoryUserStories;
    }

    /**
     * Set in-memory user stories
     */
    public setInMemoryUserStories(stories: any[]): void {
        this.inMemoryUserStories = stories;
    }

    /**
     * Add to in-memory user stories
     */
    public addInMemoryUserStory(story: any): void {
        this.inMemoryUserStories.push(story);
    }

    /**
     * Check if the server is running
     */
    public isServerRunning(): boolean {
        return this.isRunning;
    }
}

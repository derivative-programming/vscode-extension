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
        } catch (error) {
            this.isRunning = false;
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to start MCP server: ${errorMessage}`);
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

            if (parsedMessage.method === 'mcp/execute') {
                this.handleToolExecution(parsedMessage);
            }
        } catch (error) {
            console.error('[MCP Server] Error handling message:', error);
            this.sendErrorResponse({
                code: -32700,
                message: 'Parse error',
                data: { error: String(error) }
            });
        }
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
     * Get tool definitions for the MCP server
     */
    private getToolDefinitions(): any[] {
        return [
            {
                name: 'createUserStory',
                description: 'Creates a user story and validates its format',
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
        console.log('[MCP Server] Sent message:', serialized);
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

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
    private inMemoryUserStories: any[] = [];
    private outputChannel: vscode.OutputChannel | undefined;
    private readonly _onStatusChange: vscode.EventEmitter<boolean> = new vscode.EventEmitter<boolean>();
    readonly onStatusChange: vscode.Event<boolean> = this._onStatusChange.event;

    private constructor() {
        this.modelService = ModelService.getInstance();
        this.userStoryTools = new UserStoryTools(this);
    }

    public static getInstance(): MCPServer {
        if (!MCPServer.instance) {
            MCPServer.instance = new MCPServer();
        }
        return MCPServer.instance;
    }

    public async start(): Promise<void> {
        if (this.isRunning) {
            vscode.window.showInformationMessage('MCP server is already running');
            return;
        }

        try {
            this.isRunning = true;
            this.setupStdioTransport();
            vscode.window.showInformationMessage('MCP server started successfully');
            this._onStatusChange.fire(true);
        } catch (error) {
            this.isRunning = false;
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to start MCP server: ${errorMessage}`);
            this._onStatusChange.fire(false);
            setTimeout(() => this.start(), 5000);
        }
    }

    public stop(): void {
        if (!this.isRunning) {
            vscode.window.showInformationMessage('MCP server is not running');
            return;
        }

        this.isRunning = false;
        process.stdin.removeAllListeners('data');
        process.stdin.removeAllListeners('error');
        process.stdout.removeAllListeners('error');
        this.outputChannel?.dispose();
        this.outputChannel = undefined;
        vscode.window.showInformationMessage('MCP server stopped');
        this._onStatusChange.fire(false);
    }

    private setupStdioTransport(): void {
        let buffer = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (data) => {
            buffer += data.toString();
            let newlineIndex;
            while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                const message = buffer.slice(0, newlineIndex);
                buffer = buffer.slice(newlineIndex + 1);
                if (message.trim()) {
                    this.handleIncomingMessage(message);
                }
            }
        });

        process.stdin.on('error', (error) => {
            console.error('[MCP Server] Stdin error:', error);
            this.outputChannel?.appendLine(`[${new Date().toISOString()}] STDIN ERROR: ${error}`);
        });

        process.stdout.on('error', (error) => {
            console.error('[MCP Server] Stdout error:', error);
            this.outputChannel?.appendLine(`[${new Date().toISOString()}] STDOUT ERROR: ${error}`);
        });

        this.sendMessage({
            jsonrpc: '2.0',
            method: 'mcp/ready',
            params: {
                tools: this.getToolDefinitions()
            }
        });
    }

    private handleIncomingMessage(message: string): void {
        try {
            const parsedMessage = JSON.parse(message);
            console.log('[MCP Server] Received message:', parsedMessage);

            if (!this.outputChannel) {
                this.outputChannel = vscode.window.createOutputChannel('AppDNA MCP Server');
            }
            this.outputChannel.appendLine(`[${new Date().toISOString()}] RECEIVED: ${message}`);

            if (parsedMessage.jsonrpc !== '2.0') {
                throw new Error('Invalid JSON-RPC version');
            }

            if (parsedMessage.method === 'initialize') {
                this.handleInitializeRequest(parsedMessage);
            } else if (parsedMessage.method === 'mcp/execute') {
                const toolName = parsedMessage.params?.name || 'unknown';
                vscode.window.showInformationMessage(`MCP Server: GitHub Copilot requested '${toolName}'`);
                this.handleToolExecution(parsedMessage);
            } else {
                throw new Error(`Unknown method: ${parsedMessage.method}`);
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
                data: { error: error instanceof Error ? error.message : String(error) }
            });
        }
    }

    private handleInitializeRequest(message: any): void {
        if (!message.id) {
            this.sendErrorResponse({
                code: -32600,
                message: 'Invalid Request: Missing id'
            });
            return;
        }

        const tools = this.getToolDefinitions();
        console.log('[MCP Server] Handling initialize request with id:', message.id);
        if (this.outputChannel) {
            this.outputChannel.appendLine(`[${new Date().toISOString()}] HANDLING: Initialize request with id ${message.id}`);
        }

        this.sendMessage({
            jsonrpc: '2.0',
            id: message.id,
            result: {
                capabilities: {
                    tools,
                    transport: ['stdio'],
                    authentication: ['none'],
                    json: true,
                    streaming: true
                },
                serverInfo: {
                    name: 'AppDNA User Story MCP',
                    version: '1.0.0',
                    description: 'MCP server for interacting with AppDNA user stories'
                }
            }
        });

        vscode.window.showInformationMessage('MCP server initialized for GitHub Copilot');
    }

    private async handleToolExecution(message: any): Promise<void> {
        const { id, params } = message;
        if (!params || !params.name) {
            this.sendErrorResponse({
                code: -32602,
                message: 'Invalid params: Missing tool name'
            }, id);
            return;
        }

        const { name, parameters } = params;
        try {
            let result;
            if (name === 'createUserStory') {
                if (!parameters || !parameters.description) {
                    throw new Error('Missing required parameter: description');
                }
                result = await this.userStoryTools.createUserStory(parameters);
            } else if (name === 'listUserStories') {
                result = await this.userStoryTools.listUserStories();
            } else {
                throw new Error(`Unknown tool: ${name}`);
            }

            this.sendMessage({
                jsonrpc: '2.0',
                id,
                result
            });
        } catch (error) {
            console.error(`[MCP Server] Error executing tool ${name}:`, error);
            this.sendErrorResponse({
                code: -32603,
                message: error instanceof Error ? error.message : String(error),
                data: { name }
            }, id);
        }
    }

    public async executeToolByName(name: string, parameters: any): Promise<any> {
        if (name === 'createUserStory') {
            return await this.userStoryTools.createUserStory(parameters);
        } else if (name === 'listUserStories') {
            return await this.userStoryTools.listUserStories();
        }
        throw new Error(`Unknown tool: ${name}`);
    }

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
                parameters: {
                    type: 'object',
                    properties: {
                        title: { type: 'string', description: 'Title or ID for the user story (optional)' },
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
                parameters: {
                    type: 'object',
                    properties: {}
                }
            }
        ];
    }

    private sendMessage(message: any): void {
        const serialized = JSON.stringify(message);
        process.stdout.write(serialized + '\n');
        console.log('[MCP Server] Sent message:', serialized);

        if (!this.outputChannel) {
            this.outputChannel = vscode.window.createOutputChannel('AppDNA MCP Server');
        }
        this.outputChannel.appendLine(`[${new Date().toISOString()}] SENT: ${serialized}`);

        if (message.method === 'mcp/ready') {
            vscode.window.showInformationMessage(`MCP Server ready with ${(message.params?.tools || []).length} tools`);
        } else if (message.error) {
            vscode.window.showErrorMessage(`MCP Server error: ${message.error.message || 'Unknown error'}`);
        }
    }

    private sendErrorResponse(error: any, id?: string | number): void {
        this.sendMessage({
            jsonrpc: '2.0',
            id: id || null,
            error
        });
    }

    public getModelService(): ModelService {
        return this.modelService;
    }

    public getInMemoryUserStories(): any[] {
        return this.inMemoryUserStories;
    }

    public setInMemoryUserStories(stories: any[]): void {
        this.inMemoryUserStories = stories;
    }

    public addInMemoryUserStory(story: any): void {
        this.inMemoryUserStories.push(story);
    }

    public isServerRunning(): boolean {
        return this.isRunning;
    }
}
// server.ts
// MCP Server implementation for AppDNA user stories
// Created on: October 12, 2025
// This file implements an MCP server that provides user story tools

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { UserStoryTools } from './tools/userStoryTools';

/**
 * Main MCP Server class
 */
export class MCPServer {
    private static instance: MCPServer;
    private server: McpServer;
    private userStoryTools: UserStoryTools;
    private transport: StdioServerTransport;

    private constructor() {
        // Initialize UserStoryTools with null modelService (will use in-memory storage)
        this.userStoryTools = new UserStoryTools(null);

        // Create MCP server
        this.server = new McpServer({
            name: 'appdna-user-stories',
            version: '1.0.0',
        });

        // Register tools
        this.registerTools();

        // Create stdio transport
        this.transport = new StdioServerTransport();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): MCPServer {
        if (!MCPServer.instance) {
            MCPServer.instance = new MCPServer();
        }
        return MCPServer.instance;
    }

    /**
     * Register MCP tools
     */
    private registerTools(): void {
        // Register create_user_story tool
        this.server.registerTool('create_user_story', {
            title: 'Create User Story',
            description: 'Create a new user story with proper format validation',
            inputSchema: {
                title: z.string().optional().describe('Optional title/number for the user story'),
                description: z.string().describe('The user story description following the format: "As a [Role] I want to [action] [object]"')
            },
            outputSchema: {
                success: z.boolean(),
                story: z.object({
                    id: z.string(),
                    title: z.string(),
                    description: z.string()
                }).optional(),
                error: z.string().optional(),
                message: z.string().optional()
            }
        }, async ({ title, description }) => {
            try {
                const result = await this.userStoryTools.create_user_story({ title, description });
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    structuredContent: result
                };
            } catch (error) {
                const errorResult = { success: false, error: error.message };
                return {
                    content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                    structuredContent: errorResult,
                    isError: true
                };
            }
        });

        // Register list_user_stories tool
        this.server.registerTool('list_user_stories', {
            title: 'List User Stories',
            description: 'List all user stories from the AppDNA model',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                stories: z.array(z.object({
                    title: z.string(),
                    description: z.string(),
                    isIgnored: z.boolean()
                })),
                note: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.userStoryTools.list_user_stories();
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    structuredContent: result
                };
            } catch (error) {
                const errorResult = { success: false, error: error.message };
                return {
                    content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                    structuredContent: errorResult,
                    isError: true
                };
            }
        });

        // Register secret_word_of_the_day tool
        this.server.registerTool('secret_word_of_the_day', {
            title: 'Secret Word of the Day',
            description: 'Get the secret word of the day, uniquely generated for this MCP server and project',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                word: z.string(),
                date: z.string(),
                project: z.string(),
                note: z.string()
            }
        }, async () => {
            try {
                const result = await this.userStoryTools.secret_word_of_the_day();
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    structuredContent: result
                };
            } catch (error) {
                const errorResult = { success: false, error: error.message };
                return {
                    content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                    structuredContent: errorResult,
                    isError: true
                };
            }
        });
    }

    /**
     * Start the MCP server
     */
    public async start(): Promise<void> {
        console.error('Starting AppDNA MCP Server...');
        await this.server.connect(this.transport);
        console.error('AppDNA MCP Server started and connected');
    }

    /**
     * Get the underlying MCP server instance (for direct access if needed)
     */
    public getServer(): McpServer {
        return this.server;
    }

    /**
     * Get the transport instance (for direct access if needed)
     */
    public getTransport(): StdioServerTransport {
        return this.transport;
    }

    /**
     * Stop the MCP server
     */
    public async stop(): Promise<void> {
        console.error('Stopping AppDNA MCP Server...');
        await this.transport.close();
        console.error('AppDNA MCP Server stopped');
    }
}

// Start the server if this file is run directly
if (require.main === module) {
    async function main() {
        const server = MCPServer.getInstance();
        console.error('Starting AppDNA MCP Server...');
        await server.getServer().connect(server.getTransport());
        console.error('AppDNA MCP Server started and connected');
    }

    main().catch((error) => {
        console.error('Failed to start MCP server:', error);
        process.exit(1);
    });
}
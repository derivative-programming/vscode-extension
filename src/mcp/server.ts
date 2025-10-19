// server.ts
// MCP Server implementation for AppDNA user stories and views
// Created on: October 12, 2025
// Last modified: October 15, 2025
// This file implements an MCP server that provides user story tools and view opening commands

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { UserStoryTools } from './tools/userStoryTools';
import { ViewTools } from './tools/viewTools';
import { DataObjectTools } from './tools/dataObjectTools';
import { ModelTools } from './tools/modelTools';

/**
 * Main MCP Server class
 */
export class MCPServer {
    private static instance: MCPServer;
    private server: McpServer;
    private userStoryTools: UserStoryTools;
    private viewTools: ViewTools;
    private dataObjectTools: DataObjectTools;
    private modelTools: ModelTools;
    private transport: StdioServerTransport;

    private constructor() {
        // Initialize UserStoryTools with null modelService (will use in-memory storage)
        this.userStoryTools = new UserStoryTools(null);
        this.viewTools = new ViewTools();
        this.dataObjectTools = new DataObjectTools(null);
        this.modelTools = new ModelTools();

        // Create MCP server
        this.server = new McpServer({
            name: 'appdna-extension',
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
            description: 'Create a new user story with format validation and add it to the AppDNA model via HTTP bridge. The story text must follow the format: "A [Role] wants to [action] [object]" or "As a [Role], I want to [action] [object]". Valid actions: view all, view, add, create, update, edit, delete, remove.',
            inputSchema: {
                storyText: z.string().describe('The user story text following the format: "A [Role] wants to [action] [object]" or "As a [Role], I want to [action] [object]". Valid actions: view all, view, add, create, update, edit, delete, remove.')
            },
            outputSchema: {
                success: z.boolean(),
                story: z.object({
                    name: z.string(),
                    storyText: z.string()
                }).optional(),
                error: z.string().optional(),
                message: z.string().optional(),
                note: z.string().optional(),
                validatedFormat: z.boolean().optional()
            }
        }, async ({ storyText }) => {
            try {
                const result = await this.userStoryTools.create_user_story({ storyText });
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
            description: 'List all user stories from the AppDNA model with optional filtering. Can filter by role, search text, and inclusion of ignored stories. Without filters, returns all non-ignored stories.',
            inputSchema: {
                role: z.string().optional().describe('Filter stories by role (e.g., "Manager", "User"). Extracts role from story text and matches case-insensitively.'),
                search_story_text: z.string().optional().describe('Search text to filter stories (case-insensitive). Searches only in the story text field.'),
                includeIgnored: z.boolean().optional().describe('Whether to include stories marked as ignored (isIgnored="true"). Default is false.')
            },
            outputSchema: {
                success: z.boolean(),
                stories: z.array(z.object({
                    name: z.string(),
                    storyText: z.string(),
                    isIgnored: z.string().optional()
                })),
                count: z.number(),
                filters: z.object({
                    role: z.string().nullable(),
                    search_story_text: z.string().nullable(),
                    includeIgnored: z.boolean()
                }).optional(),
                note: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ role, search_story_text, includeIgnored }) => {
            try {
                const result = await this.userStoryTools.list_user_stories({ role, search_story_text, includeIgnored });
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

        // Register update_user_story tool
        this.server.registerTool('update_user_story', {
            title: 'Update User Story',
            description: 'Update the isIgnored property of an existing user story. Use this to mark stories as ignored (soft delete) or re-enable them. Story text cannot be changed - create a new story instead if needed.',
            inputSchema: {
                name: z.string().describe('The name (GUID identifier) of the user story to update. Required for exact matching.'),
                isIgnored: z.enum(['true', 'false']).describe('Set to "true" to mark story as ignored (soft delete), "false" to re-enable it.')
            },
            outputSchema: {
                success: z.boolean(),
                story: z.object({
                    name: z.string(),
                    storyText: z.string(),
                    isIgnored: z.string()
                }).optional(),
                message: z.string().optional(),
                note: z.string().optional(),
                error: z.string().optional(),
                validationErrors: z.array(z.string()).optional()
            }
        }, async ({ name, isIgnored }) => {
            try {
                const result = await this.userStoryTools.update_user_story({ name, isIgnored });
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

        // Register get_user_story_schema tool
        this.server.registerTool('get_user_story_schema', {
            title: 'Get User Story Schema',
            description: 'Get the schema definition for user story objects, including field descriptions, types, and an example. This shows the structure of user stories as exposed via MCP tools.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                schema: z.object({
                    type: z.string(),
                    description: z.string(),
                    properties: z.any(),
                    example: z.any()
                }).optional(),
                note: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.userStoryTools.get_user_story_schema();
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

        // Register list_roles tool
        this.server.registerTool('list_roles', {
            title: 'List Roles',
            description: 'List all roles from the Role data object in the AppDNA model',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                roles: z.array(z.object({
                    name: z.string(),
                    displayName: z.string(),
                    description: z.string(),
                    isActive: z.string()
                })),
                count: z.number(),
                note: z.string().optional(),
                warning: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.dataObjectTools.list_roles();
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

        // Register add_role tool
        this.server.registerTool('add_role', {
            title: 'Add Role',
            description: 'Add a new role to the Role data object in the AppDNA model. Role name must be in PascalCase format.',
            inputSchema: {
                name: z.string().describe('Name of the role (required, must be PascalCase, e.g., "Administrator", "DataEntryClerk")')
            },
            outputSchema: {
                success: z.boolean(),
                role: z.object({
                    name: z.string(),
                    displayName: z.string(),
                    description: z.string(),
                    isActive: z.string()
                }).optional(),
                message: z.string().optional(),
                note: z.string().optional(),
                error: z.string().optional(),
                validationErrors: z.array(z.string()).optional()
            }
        }, async ({ name }) => {
            try {
                const result = await this.dataObjectTools.add_role({ name });
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

        // Register update_role tool
        this.server.registerTool('update_role', {
            title: 'Update Role',
            description: 'Update an existing role in the Role data object. Can update displayName, description, and/or isActive. Role name must match exactly (case-sensitive).',
            inputSchema: {
                name: z.string().describe('Name of the role to update (required, case-sensitive)'),
                displayName: z.string().optional().describe('New display name for the role (optional)'),
                description: z.string().optional().describe('New description for the role (optional)'),
                isActive: z.string().optional().describe('Active status: "true" or "false" (optional)')
            },
            outputSchema: {
                success: z.boolean(),
                role: z.object({
                    name: z.string(),
                    displayName: z.string(),
                    description: z.string(),
                    isActive: z.string()
                }).optional(),
                message: z.string().optional(),
                note: z.string().optional(),
                error: z.string().optional(),
                validationErrors: z.array(z.string()).optional()
            }
        }, async ({ name, displayName, description, isActive }) => {
            try {
                const result = await this.dataObjectTools.update_role({ name, displayName, description, isActive });
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

        // Register add_lookup_value tool
        this.server.registerTool('add_lookup_value', {
            title: 'Add Lookup Value',
            description: 'Add a new lookup value to any lookup data object in the AppDNA model. Lookup object name must match exactly (case-sensitive) and must be a lookup object (isLookup="true").',
            inputSchema: {
                lookupObjectName: z.string().describe('Name of the lookup data object (required, case-sensitive, e.g., "Role", "Status")'),
                name: z.string().describe('Name of the lookup value (required, must be PascalCase, e.g., "ActiveStatus", "PendingApproval")'),
                displayName: z.string().optional().describe('Display name for the lookup value (optional, auto-generated from name if not provided)'),
                description: z.string().optional().describe('Description of the lookup value (optional, auto-generated from name if not provided)'),
                isActive: z.string().optional().describe('Active status: "true" or "false" (optional, defaults to "true")')
            },
            outputSchema: {
                success: z.boolean(),
                lookupValue: z.object({
                    name: z.string(),
                    displayName: z.string(),
                    description: z.string(),
                    isActive: z.string()
                }).optional(),
                message: z.string().optional(),
                note: z.string().optional(),
                error: z.string().optional(),
                validationErrors: z.array(z.string()).optional()
            }
        }, async ({ lookupObjectName, name, displayName, description, isActive }) => {
            try {
                const result = await this.dataObjectTools.add_lookup_value({ lookupObjectName, name, displayName, description, isActive });
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

        // Register list_lookup_values tool
        this.server.registerTool('list_lookup_values', {
            title: 'List Lookup Values',
            description: 'List all lookup values from a specific lookup data object in the AppDNA model. Returns name, displayName, description, and isActive for each value.',
            inputSchema: {
                lookupObjectName: z.string().describe('Name of the lookup data object (required, case-sensitive, e.g., "Role", "Status")'),
                includeInactive: z.boolean().optional().describe('Include inactive lookup values (optional, defaults to false)')
            },
            outputSchema: {
                success: z.boolean(),
                lookupObjectName: z.string(),
                values: z.array(z.object({
                    name: z.string(),
                    displayName: z.string(),
                    description: z.string(),
                    isActive: z.string()
                })),
                count: z.number(),
                note: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ lookupObjectName, includeInactive }) => {
            try {
                const result = await this.dataObjectTools.list_lookup_values({ lookupObjectName, includeInactive });
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

        // Register update_lookup_value tool
        this.server.registerTool('update_lookup_value', {
            title: 'Update Lookup Value',
            description: 'Update an existing lookup value in any lookup data object. Can update displayName, description, and/or isActive. Lookup object name and lookup value name must match exactly (case-sensitive).',
            inputSchema: {
                lookupObjectName: z.string().describe('Name of the lookup data object (required, case-sensitive, e.g., "Role", "Status")'),
                name: z.string().describe('Name of the lookup value to update (required, case-sensitive)'),
                displayName: z.string().optional().describe('New display name for the lookup value (optional)'),
                description: z.string().optional().describe('New description for the lookup value (optional)'),
                isActive: z.string().optional().describe('Active status: "true" or "false" (optional)')
            },
            outputSchema: {
                success: z.boolean(),
                lookupValue: z.object({
                    name: z.string(),
                    displayName: z.string(),
                    description: z.string(),
                    isActive: z.string()
                }).optional(),
                message: z.string().optional(),
                note: z.string().optional(),
                error: z.string().optional(),
                validationErrors: z.array(z.string()).optional()
            }
        }, async ({ lookupObjectName, name, displayName, description, isActive }) => {
            try {
                const result = await this.dataObjectTools.update_lookup_value({ lookupObjectName, name, displayName, description, isActive });
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

        // Register get_lookup_value_schema tool
        this.server.registerTool('get_lookup_value_schema', {
            title: 'Get Lookup Value Schema',
            description: 'Get the schema definition for lookup values (lookup items) including properties, validation rules, format requirements, and examples. Useful for understanding the structure of lookup values before creating or updating them.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                schema: z.object({
                    type: z.string(),
                    description: z.string(),
                    properties: z.record(z.any()),
                    validationRules: z.record(z.array(z.string())),
                    usage: z.object({
                        location: z.string(),
                        access: z.string(),
                        tools: z.array(z.string())
                    }),
                    exampleObjects: z.array(z.any())
                }),
                note: z.string()
            }
        }, async () => {
            try {
                const result = await this.dataObjectTools.get_lookup_value_schema();
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

        // Register get_data_object_summary_schema tool
        this.server.registerTool('get_data_object_summary_schema', {
            title: 'Get Data Object Summary Schema',
            description: 'Get the schema definition for data objects as returned by list_data_object_summary. Includes properties (name, isLookup, parentObjectName, codeDescription, propCount), validation rules, format requirements, hierarchical relationships, and examples of both regular entities and lookup objects.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                schema: z.object({
                    type: z.string(),
                    description: z.string(),
                    properties: z.record(z.any()),
                    validationRules: z.record(z.array(z.string())),
                    usage: z.object({
                        location: z.string(),
                        access: z.string(),
                        modelStructure: z.string(),
                        purpose: z.string(),
                        hierarchy: z.string()
                    }),
                    tools: z.object({
                        query: z.array(z.string()),
                        manipulation: z.array(z.string()),
                        related: z.array(z.string())
                    }),
                    commonPatterns: z.object({
                        regularEntities: z.array(z.any()),
                        lookupObjects: z.array(z.any())
                    }),
                    notes: z.array(z.string())
                }),
                note: z.string()
            }
        }, async () => {
            try {
                const result = await this.dataObjectTools.get_data_object_summary_schema();
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

        // Register get_role_schema tool
        this.server.registerTool('get_role_schema', {
            title: 'Get Role Schema',
            description: 'Get the schema definition specifically for roles in the Role lookup object. Includes properties, validation rules, format requirements, examples, and notes about the Role object structure. Useful for understanding role structure before creating or updating roles.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                schema: z.object({
                    type: z.string(),
                    description: z.string(),
                    objectName: z.string(),
                    isLookupObject: z.boolean(),
                    properties: z.record(z.any()),
                    validationRules: z.record(z.array(z.string())),
                    usage: z.object({
                        location: z.string(),
                        access: z.string(),
                        modelStructure: z.string(),
                        purpose: z.string()
                    }),
                    tools: z.object({
                        roleSpecific: z.array(z.string()),
                        genericLookup: z.array(z.string())
                    }),
                    exampleRoles: z.array(z.any()),
                    notes: z.array(z.string())
                }),
                note: z.string()
            }
        }, async () => {
            try {
                const result = await this.dataObjectTools.get_role_schema();
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

        // Register list_data_object_summary tool
        this.server.registerTool('list_data_object_summary', {
            title: 'List Data Object Summary',
            description: 'List summary of all data objects from the AppDNA model with optional search and filters. Returns basic info (name, isLookup, parent, propCount). Search by name (case-insensitive, also searches with spaces removed). Filter by isLookup status or parent object name.',
            inputSchema: {
                search_name: z.string().optional().describe('Optional search text to filter by object name (case-insensitive, searches with and without spaces)'),
                is_lookup: z.string().optional().describe('Optional filter for lookup status: "true" or "false"'),
                parent_object_name: z.string().optional().describe('Optional filter for parent object name (exact match, case-insensitive)')
            },
            outputSchema: {
                success: z.boolean(),
                objects: z.array(z.object({
                    name: z.string(),
                    isLookup: z.boolean(),
                    parentObjectName: z.string().nullable(),
                    codeDescription: z.string(),
                    propCount: z.number()
                })),
                count: z.number(),
                filters: z.object({
                    search_name: z.string().nullable(),
                    is_lookup: z.string().nullable(),
                    parent_object_name: z.string().nullable()
                }).optional(),
                note: z.string().optional(),
                warning: z.string().optional()
            }
        }, async ({ search_name, is_lookup, parent_object_name }) => {
            try {
                const result = await this.dataObjectTools.list_data_object_summary({ search_name, is_lookup, parent_object_name });
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

        // Register list_data_objects tool
        this.server.registerTool('list_data_objects', {
            title: 'List Data Objects (Full Details)',
            description: 'List all data objects with full details from the AppDNA model including prop arrays. Returns complete object structure (name, isLookup, parent, codeDescription, and prop array with all properties). Search by name (case-insensitive). Filter by isLookup status or parent object name. Use this when you need property details for multiple objects.',
            inputSchema: {
                search_name: z.string().optional().describe('Optional search text to filter by object name (case-insensitive, searches with and without spaces)'),
                is_lookup: z.string().optional().describe('Optional filter for lookup status: "true" or "false"'),
                parent_object_name: z.string().optional().describe('Optional filter for parent object name (exact match, case-insensitive)')
            },
            outputSchema: {
                success: z.boolean(),
                objects: z.array(z.any()),
                count: z.number(),
                filters: z.object({
                    search_name: z.string().nullable(),
                    is_lookup: z.string().nullable(),
                    parent_object_name: z.string().nullable()
                }).optional(),
                note: z.string().optional(),
                warning: z.string().optional()
            }
        }, async ({ search_name, is_lookup, parent_object_name }) => {
            try {
                const result = await this.dataObjectTools.list_data_objects({ search_name, is_lookup, parent_object_name });
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

        // Register get_data_object tool
        this.server.registerTool('get_data_object', {
            title: 'Get Data Object',
            description: 'Get complete details of a specific data object by name. Returns all properties including the full props array with all property items, lookupItem array if applicable, and all other object metadata. Use this for detailed inspection of a data object structure.',
            inputSchema: {
                name: z.string().describe('The name of the data object to retrieve (case-sensitive, exact match required)')
            },
            outputSchema: {
                success: z.boolean(),
                dataObject: z.any().optional(),
                note: z.string().optional(),
                error: z.string().optional(),
                validationErrors: z.array(z.string()).optional()
            }
        }, async ({ name }) => {
            try {
                const result = await this.dataObjectTools.get_data_object({ name });
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

        // Register get_data_object_schema tool
        this.server.registerTool('get_data_object_schema', {
            title: 'Get Data Object Schema (Full Details)',
            description: 'Get the schema definition for complete data object structure as returned by get_data_object and list_data_objects. Includes all properties (name, isLookup, parentObjectName, codeDescription), prop array structure with property definitions, validation rules, SQL data types, foreign key indicators, and examples of complete objects with properties.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                schema: z.any(),
                note: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.dataObjectTools.get_data_object_schema();
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

        // Register create_data_object tool
        this.server.registerTool('create_data_object', {
            title: 'Create Data Object',
            description: 'Create a new data object in the AppDNA model with validation. Name must be PascalCase. ParentObjectName is required and must be an exact match (case-sensitive) of an existing data object name. Lookup objects (isLookup="true") must have parent "Pac".',
            inputSchema: {
                name: z.string().describe('Name of the data object (required, must be PascalCase, e.g., "CustomerOrder", "ProductStatus")'),
                parentObjectName: z.string().describe('Parent object name (required, must be exact case-sensitive match of an existing data object name)'),
                isLookup: z.string().optional().describe('Whether this is a lookup object: "true" or "false" (optional, defaults to "false"). Lookup objects must have parentObjectName="Pac"'),
                codeDescription: z.string().optional().describe('Description of the data object and its purpose (optional)')
            },
            outputSchema: {
                success: z.boolean(),
                object: z.object({
                    name: z.string(),
                    parentObjectName: z.string(),
                    isLookup: z.boolean(),
                    codeDescription: z.string()
                }).optional(),
                message: z.string().optional(),
                note: z.string().optional(),
                error: z.string().optional(),
                validationErrors: z.array(z.string()).optional()
            }
        }, async ({ name, parentObjectName, isLookup, codeDescription }) => {
            try {
                const result = await this.dataObjectTools.create_data_object({ name, parentObjectName, isLookup, codeDescription });
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

        // Register update_data_object tool
        this.server.registerTool('update_data_object', {
            title: 'Update Data Object',
            description: 'Update an existing data object in the AppDNA model. Currently supports updating codeDescription. Object name must match exactly (case-sensitive).',
            inputSchema: {
                name: z.string().describe('Name of the data object to update (required, must match exactly case-sensitive)'),
                codeDescription: z.string().describe('New description of the data object and its purpose (required)')
            },
            outputSchema: {
                success: z.boolean(),
                object: z.object({
                    name: z.string(),
                    parentObjectName: z.string(),
                    isLookup: z.boolean(),
                    codeDescription: z.string()
                }).optional(),
                message: z.string().optional(),
                note: z.string().optional(),
                error: z.string().optional(),
                validationErrors: z.array(z.string()).optional()
            }
        }, async ({ name, codeDescription }) => {
            try {
                const result = await this.dataObjectTools.update_data_object({ name, codeDescription });
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

        // Register add_data_object_props tool
        this.server.registerTool('add_data_object_props', {
            title: 'Add Data Object Properties',
            description: 'Add multiple properties (columns) to an existing data object. Each property must have a unique name in PascalCase. Validates property structure including data types and boolean flags. Object name must match exactly (case-sensitive).',
            inputSchema: {
                objectName: z.string().describe('Name of the data object to add properties to (required, must match exactly case-sensitive)'),
                props: z.array(z.object({
                    name: z.string().describe('Property name in PascalCase format (required, e.g., "CustomerID", "FirstName")'),
                    sqlServerDBDataType: z.enum(['nvarchar', 'bit', 'datetime', 'int', 'uniqueidentifier', 'money', 'bigint', 'float', 'decimal', 'date', 'varchar', 'text']).optional().describe('SQL Server data type'),
                    sqlServerDBDataTypeSize: z.string().optional().describe('Data type size (e.g., "50", "100", "MAX" for nvarchar/varchar)'),
                    labelText: z.string().optional().describe('Human-readable label for UI display'),
                    codeDescription: z.string().optional().describe('Code description for documentation'),
                    defaultValue: z.string().optional().describe('Default value for the property'),
                    isFK: z.enum(['true', 'false']).optional().describe('Is this a foreign key? Must be "true" or "false"'),
                    fkObjectName: z.string().optional().describe('Foreign key object name (required if isFK="true")'),
                    fkObjectPropertyName: z.string().optional().describe('Foreign key property name in referenced object'),
                    isFKLookup: z.enum(['true', 'false']).optional().describe('Is this a FK to a lookup object? Must be "true" or "false"'),
                    isFKConstraintSuppressed: z.enum(['true', 'false']).optional().describe('Suppress FK constraint in database? Must be "true" or "false"'),
                    isEncrypted: z.enum(['true', 'false']).optional().describe('Should value be encrypted? Must be "true" or "false"'),
                    isQueryByAvailable: z.enum(['true', 'false']).optional().describe('Enable query filtering? Must be "true" or "false"'),
                    forceDBColumnIndex: z.enum(['true', 'false']).optional().describe('Force database index? Must be "true" or "false"'),
                    isNotPublishedToSubscriptions: z.enum(['', 'true', 'false']).optional().describe('Exclude from subscriptions? Can be "", "true", or "false"')
                })).describe('Array of property definitions to add (required, must be non-empty)')
            },
            outputSchema: {
                success: z.boolean(),
                object: z.object({
                    name: z.string(),
                    parentObjectName: z.string(),
                    isLookup: z.boolean(),
                    codeDescription: z.string(),
                    propCount: z.number()
                }).optional(),
                addedCount: z.number().optional(),
                message: z.string().optional(),
                note: z.string().optional(),
                error: z.string().optional(),
                validationErrors: z.array(z.string()).optional()
            }
        }, async ({ objectName, props }) => {
            try {
                const result = await this.dataObjectTools.add_data_object_props({ objectName, props });
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

        // Register update_data_object_prop tool
        this.server.registerTool('update_data_object_prop', {
            title: 'Update Data Object Property',
            description: 'Update an existing property (column) in a data object. Allows updating any property field including data type, labels, FK settings, and flags. Object and property names must match exactly (case-sensitive).',
            inputSchema: {
                objectName: z.string().describe('Name of the data object containing the property (required, must match exactly case-sensitive)'),
                propName: z.string().describe('Name of the property to update (required, must match exactly case-sensitive)'),
                sqlServerDBDataType: z.enum(['nvarchar', 'bit', 'datetime', 'int', 'uniqueidentifier', 'money', 'bigint', 'float', 'decimal', 'date', 'varchar', 'text']).optional().describe('SQL Server data type'),
                sqlServerDBDataTypeSize: z.string().optional().describe('Data type size (e.g., "50", "100", "MAX" for nvarchar/varchar)'),
                labelText: z.string().optional().describe('Human-readable label for UI display'),
                codeDescription: z.string().optional().describe('Code description for documentation'),
                defaultValue: z.string().optional().describe('Default value for the property'),
                isFK: z.enum(['true', 'false']).optional().describe('Is this a foreign key? Must be "true" or "false"'),
                fkObjectName: z.string().optional().describe('Foreign key object name (required if isFK="true")'),
                fkObjectPropertyName: z.string().optional().describe('Foreign key property name in referenced object'),
                isFKLookup: z.enum(['true', 'false']).optional().describe('Is this a FK to a lookup object? Must be "true" or "false"'),
                isFKConstraintSuppressed: z.enum(['true', 'false']).optional().describe('Suppress FK constraint in database? Must be "true" or "false"'),
                isEncrypted: z.enum(['true', 'false']).optional().describe('Should value be encrypted? Must be "true" or "false"'),
                isQueryByAvailable: z.enum(['true', 'false']).optional().describe('Enable query filtering? Must be "true" or "false"'),
                forceDBColumnIndex: z.enum(['true', 'false']).optional().describe('Force database index? Must be "true" or "false"'),
                isNotPublishedToSubscriptions: z.enum(['', 'true', 'false']).optional().describe('Exclude from subscriptions? Can be "", "true", or "false"')
            },
            outputSchema: {
                success: z.boolean(),
                property: z.any().optional(),
                message: z.string().optional(),
                note: z.string().optional(),
                error: z.string().optional(),
                validationErrors: z.array(z.string()).optional()
            }
        }, async (params) => {
            try {
                const result = await this.dataObjectTools.update_data_object_prop(params);
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

        // Register get_data_object_usage tool
        this.server.registerTool('get_data_object_usage', {
            title: 'Get Data Object Usage',
            description: 'Get detailed usage information for data objects showing where they are referenced across the application. Returns references from forms (owner, target, input controls, output variables), reports (owner, target, columns), flows (owner, input parameters, output variables), and user stories. Optionally filter to a specific data object.',
            inputSchema: {
                dataObjectName: z.string().optional().describe('Optional: Filter to a specific data object name (case-sensitive). If omitted, returns usage for all data objects.')
            },
            outputSchema: {
                success: z.boolean(),
                usageData: z.array(z.object({
                    dataObjectName: z.string(),
                    referenceType: z.string(),
                    referencedBy: z.string(),
                    itemType: z.string()
                })),
                count: z.number(),
                filter: z.string().optional().nullable(),
                note: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ dataObjectName }) => {
            try {
                const result = await this.dataObjectTools.get_data_object_usage({ dataObjectName });
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    structuredContent: result
                };
            } catch (error) {
                const errorResult = { 
                    success: false, 
                    usageData: [],
                    count: 0,
                    error: error.message 
                };
                return {
                    content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                    structuredContent: errorResult,
                    isError: true
                };
            }
        });

        // ===== MODEL OPERATIONS =====

        // Register save_model tool
        this.server.registerTool('save_model', {
            title: 'Save Model',
            description: 'Save the current AppDNA model to file. This is the same operation as clicking the save icon button in the tree view. Persists all changes made to data objects, user stories, forms, reports, and other model elements. Returns success confirmation or error if the save fails.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                message: z.string().optional(),
                note: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.modelTools.save_model();
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    structuredContent: result
                };
            } catch (error) {
                const errorResult = { 
                    success: false, 
                    error: error.message 
                };
                return {
                    content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                    structuredContent: errorResult,
                    isError: true
                };
            }
        });

        // Register close_all_open_views tool
        this.server.registerTool('close_all_open_views', {
            title: 'Close All Open Views',
            description: 'Close all open view panels and webviews in the AppDNA extension. This includes all detail views (data objects, forms, reports, workflows, APIs, page inits, general flows, workflow tasks), list views (pages, workflows, general flows, data objects), analytics views, and other open panels. Useful for cleaning up the workspace or before performing operations that require closing views.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                message: z.string().optional(),
                note: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.modelTools.close_all_open_views();
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    structuredContent: result
                };
            } catch (error) {
                const errorResult = { 
                    success: false, 
                    error: error.message 
                };
                return {
                    content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                    structuredContent: errorResult,
                    isError: true
                };
            }
        });

        // ===== USER STORY VIEW OPENING TOOLS =====
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

        // Register open_user_stories_view tool
        this.server.registerTool('open_user_stories_view', {
            title: 'Open User Stories View',
            description: 'Opens the user stories list view in the VS Code extension. Shows all user stories with three tabs: "Stories" (full list with search/filter), "Details" (detailed table view with expanded information), and "Role Distribution" (analytics showing role distribution charts). Supports initialTab parameter with values: "stories", "details", "analytics".',
            inputSchema: {
                initialTab: z.string().optional().describe('Optional initial tab to show: "stories" (Stories tab), "details" (Details tab), or "analytics" (Role Distribution tab)')
            },
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                initialTab: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ initialTab }) => {
            try {
                const result = await this.viewTools.openUserStories(initialTab);
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

        // ===== USER STORY DEVELOPMENT AND QA VIEWS =====

        this.server.registerTool('open_user_stories_dev_view', {
            title: 'Open User Stories Dev View',
            description: 'Opens the development tracking view for user stories. Shows eight tabs: "Details" (13-column table with filters and bulk operations), "Dev Queue" (drag-and-drop priority queue), "Board" (Kanban board with 5 status columns), "Sprint" (sprint planning and burndown), "Developers" (developer management and capacity), "Forecast" (Gantt chart timeline), "Cost" (monthly cost analysis), and "Analysis" (metrics and charts). Supports initialTab parameter with values: "details", "devQueue", "board", "sprint", "developers", "forecast", "cost", "analysis".',
            inputSchema: {
                initialTab: z.string().optional().describe('Optional initial tab: "details", "devQueue", "board", "sprint", "developers", "forecast", "cost", or "analysis"')
            },
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                initialTab: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ initialTab }) => {
            try {
                const result = await this.viewTools.openUserStoriesDev(initialTab);
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

        this.server.registerTool('open_user_stories_qa_view', {
            title: 'Open User Stories QA View',
            description: 'Opens the QA and testing queue view for user stories. Shows five tabs: "Details" (QA details table with filters), "Board" (Kanban board view), "Status Distribution" (analytics and charts), "Forecast" (QA capacity planning and forecasting), and "Cost" (cost analysis). Supports initialTab parameter with values: "details", "board", "analysis", "forecast", "cost".',
            inputSchema: {
                initialTab: z.string().optional().describe('Optional initial tab: "details", "board", "analysis", "forecast", or "cost"')
            },
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                initialTab: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ initialTab }) => {
            try {
                const result = await this.viewTools.openUserStoriesQA(initialTab);
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

        this.server.registerTool('open_user_stories_journey_view', {
            title: 'Open User Stories Journey View',
            description: 'Opens the user journey mapping and analysis view. Shows seven tabs: "User Stories" (story-page mappings with journey distances), "Page Usage" (usage frequency table), "Page Usage Treemap" (visual size representation), "Page Usage Distribution" (histogram of usage patterns), "Page Usage vs Complexity" (scatter plot analysis), "Journey Visualization" (treemap of journey complexity), and "Journey Distribution" (histogram of complexity categories). Supports initialTab parameter with values: "user-stories", "page-usage", "page-usage-treemap", "page-usage-distribution", "page-usage-vs-complexity", "journey-visualization", "journey-distribution".',
            inputSchema: {
                initialTab: z.string().optional().describe('Optional initial tab: "user-stories", "page-usage", "page-usage-treemap", "page-usage-distribution", "page-usage-vs-complexity", "journey-visualization", or "journey-distribution"')
            },
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                initialTab: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ initialTab }) => {
            try {
                const result = await this.viewTools.openUserStoriesJourney(initialTab);
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

        this.server.registerTool('open_user_stories_page_mapping_view', {
            title: 'Open User Stories Page Mapping View',
            description: 'Opens the page mapping view for user stories. Shows which pages in the application are associated with which user stories. Helps understand the relationship between user stories and UI pages, useful for impact analysis and navigation planning.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openUserStoriesPageMapping();
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

        this.server.registerTool('open_user_stories_role_requirements_view', {
            title: 'Open User Stories Role Requirements View',
            description: 'Opens the user stories role requirements view. Shows which user roles are required to access and complete each user story. Provides a comprehensive view of role-based access control (RBAC) requirements across all user stories.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openUserStoriesRoleRequirements();
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

        this.server.registerTool('open_requirements_fulfillment_view', {
            title: 'Open Requirements Fulfillment View',
            description: 'Opens the requirements fulfillment view. Shows role requirements fulfillment status across user stories, data objects, and user journeys. Tracks which role requirements are fulfilled vs unfulfilled, including access and action mappings.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openRequirementsFulfillment();
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

        // ===== DATA OBJECT VIEWS =====

        this.server.registerTool('open_object_details_view', {
            title: 'Open Data Object Details View',
            description: 'Opens the details view for a specific data object. Shows three tabs: "Settings" (basic configuration), "Properties" (field definitions and data types), and "Lookup Items" (reference data values if the object is a lookup table). Supports initialTab parameter with values: "settings", "props", "lookupItems". Requires objectName parameter to specify which data object to display.',
            inputSchema: {
                objectName: z.string().describe('Name of the data object to view'),
                initialTab: z.string().optional().describe('Optional initial tab: "settings", "props", or "lookupItems"')
            },
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                objectName: z.string().optional(),
                initialTab: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ objectName, initialTab }) => {
            try {
                const result = await this.viewTools.openObjectDetails(objectName, initialTab);
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

        this.server.registerTool('open_data_objects_list_view', {
            title: 'Open Data Objects List View',
            description: 'Opens the list view showing all data objects in the application model. Displays object names, types (entity/lookup/junction), descriptions, and key properties. This is the central view for browsing and managing data objects.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openDataObjectsList();
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

        this.server.registerTool('open_data_object_usage_analysis_view', {
            title: 'Open Data Object Usage Analysis View',
            description: 'Opens the usage analysis view for data objects showing where each data object is used throughout the application. Includes 5 tabs: Summary (overview table), Detail (detailed references), Proportional Usage (treemap), Usage Distribution (histogram), and Complexity vs. Usage (bubble chart). Essential for impact analysis when considering changes to data objects.',
            inputSchema: {
                initialTab: z.enum(['summary', 'detail', 'treemap', 'histogram', 'bubble']).optional().describe('Optional tab to display: "summary" (overview - default), "detail" (detailed references), "treemap" (proportional usage), "histogram" (usage distribution), or "bubble" (complexity vs usage)')
            },
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                initialTab: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ initialTab }) => {
            try {
                const result = await this.viewTools.openDataObjectUsageAnalysis(initialTab);
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

        this.server.registerTool('open_add_data_object_wizard', {
            title: 'Open Add Data Object Wizard',
            description: 'Opens the Add Data Object Wizard to create new data objects in the AppDNA model. Provides guided steps for creating individual objects or bulk import. Supports creating lookup objects and child objects with parent relationships.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openAddDataObjectWizard();
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

        this.server.registerTool('open_data_object_size_analysis_view', {
            title: 'Open Data Object Size Analysis View',
            description: 'Opens the size analysis view for data objects showing storage requirements and capacity planning. Includes 5 tabs: Summary (overview table), Detail (property-level breakdown), Size Visualization (treemap), Size Distribution (histogram), and Size vs Properties (scatter plot). Helps with database optimization and growth projections.',
            inputSchema: {
                initialTab: z.enum(['summary', 'details', 'treemap', 'histogram', 'dotplot']).optional().describe('Optional tab to display: "summary" (overview - default), "details" (property breakdown), "treemap" (size visualization), "histogram" (size distribution), or "dotplot" (size vs properties)')
            },
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                initialTab: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ initialTab }) => {
            try {
                const result = await this.viewTools.openDataObjectSizeAnalysis(initialTab);
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

        this.server.registerTool('open_database_size_forecast_view', {
            title: 'Open Database Size Forecast View',
            description: 'Opens the database size forecast view with growth projections and capacity planning. Includes 3 tabs: Config (set growth parameters and assumptions), Forecast (view projections with interactive charts), and Data (detailed monthly/yearly breakdown table). Projects future database growth based on data object sizes and estimated growth rates.',
            inputSchema: {
                initialTab: z.enum(['config', 'forecast', 'data']).optional().describe('Optional tab to display: "config" (configure growth parameters - default), "forecast" (view projections and charts), or "data" (detailed breakdown table)')
            },
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                initialTab: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ initialTab }) => {
            try {
                const result = await this.viewTools.openDatabaseSizeForecast(initialTab);
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

        // ===== FORM AND PAGE VIEWS =====

        this.server.registerTool('open_form_details_view', {
            title: 'Open Form Details View',
            description: 'Opens the details editor for a specific form. Shows four tabs: "Settings" (basic configuration), "Input Controls" (form fields and input elements), "Buttons" (form action buttons), and "Output Variables" (data outputs from the form). Requires formName parameter.',
            inputSchema: {
                formName: z.string().describe('Name of the form to view'),
                initialTab: z.string().optional().describe('Optional initial tab: "settings", "inputControls", "buttons", or "outputVariables"')
            },
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                formName: z.string().optional(),
                initialTab: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ formName, initialTab }) => {
            try {
                const result = await this.viewTools.openFormDetails(formName, initialTab);
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

        this.server.registerTool('open_pages_list_view', {
            title: 'Open Pages List View',
            description: 'Opens the list view showing all pages in the application. Pages are the main UI screens users navigate to. Shows three tabs: "Pages" (page list table), "Complexity Visualization" (treemap), and "Complexity Distribution" (histogram). Supports initialTab parameter with values: "pages", "visualization", "distribution".',
            inputSchema: {
                initialTab: z.string().optional().describe('Optional initial tab: "pages", "visualization", or "distribution"')
            },
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                initialTab: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ initialTab }) => {
            try {
                const result = await this.viewTools.openPagesList(initialTab);
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

        this.server.registerTool('open_page_details_view', {
            title: 'Open Page Details View',
            description: 'Opens the details editor for a specific page (form or report). Smart router that automatically determines if the page is a form or report and opens the appropriate details view. Queries the HTTP bridge to detect type. Shows tabs for Settings, Input Controls, Buttons, and Output Variables (forms) or Settings, Input Controls, Buttons, and Output Vars (reports).',
            inputSchema: {
                pageName: z.string().describe('Name of the page (form or report) to view'),
                initialTab: z.string().optional().describe('Optional initial tab: "settings", "inputControls", "buttons", "outputVariables", or "outputVars"')
            },
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                pageName: z.string().optional(),
                initialTab: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ pageName, initialTab }) => {
            try {
                const result = await this.viewTools.openPageDetails(pageName, initialTab);
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

        this.server.registerTool('open_page_preview_view', {
            title: 'Open Page Preview View',
            description: 'Opens the Page Preview view showing live preview of pages. Includes two tabs: "Preview" (rendered view) and "Source" (generated HTML/code). Optional pageName parameter will pre-select a specific page.',
            inputSchema: {
                pageName: z.string().optional().describe('Optional name of the page to preview. If omitted, opens the view without selecting a specific page.')
            },
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                pageName: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ pageName }) => {
            try {
                const result = await this.viewTools.openPagePreview(pageName);
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

        // ===== WORKFLOW AND FLOW VIEWS =====

        this.server.registerTool('open_page_init_flows_list_view', {
            title: 'Open Page Init Flows List View',
            description: 'Opens the list view showing page initialization flows. These are workflows that run automatically when a page loads, handling data fetching, permissions checks, and initial UI state setup.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openPageInitFlowsList();
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

        this.server.registerTool('open_page_init_flow_details_view', {
            title: 'Open Page Init Flow Details View',
            description: 'Opens the details editor for a specific page initialization flow. Shows flow settings and output variables. Page init flows run automatically when pages load. Requires flowName parameter.',
            inputSchema: {
                flowName: z.string().describe('Name of the page init flow to view'),
                initialTab: z.string().optional().describe('Optional initial tab (if supported)')
            },
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                flowName: z.string().optional(),
                initialTab: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ flowName, initialTab }) => {
            try {
                const result = await this.viewTools.openPageInitFlowDetails(flowName, initialTab);
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

        this.server.registerTool('open_general_workflows_list_view', {
            title: 'Open General Workflows List View',
            description: 'Opens the list view showing general-purpose workflows. These are reusable business logic workflows that can be triggered from multiple places in the application.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openGeneralWorkflowsList();
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

        this.server.registerTool('open_add_general_flow_wizard', {
            title: 'Open Add General Flow Wizard',
            description: 'Opens the Add General Flow Wizard to create new general workflows (DynaFlows) in the AppDNA model. Provides guided steps for creating workflows with owner objects, role requirements, and target object selection. Supports creating new instance workflows or workflows that work with existing data.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openAddGeneralFlowWizard();
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

        this.server.registerTool('open_general_workflow_details_view', {
            title: 'Open General Workflow Details View',
            description: 'Opens the details editor for a specific general workflow. Shows workflow settings and input parameters. General workflows are reusable business logic that can be called from multiple places. Requires workflowName parameter.',
            inputSchema: {
                workflowName: z.string().describe('Name of the general workflow to view'),
                initialTab: z.string().optional().describe('Optional initial tab (if supported)')
            },
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                workflowName: z.string().optional(),
                initialTab: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ workflowName, initialTab }) => {
            try {
                const result = await this.viewTools.openGeneralWorkflowDetails(workflowName, initialTab);
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

        this.server.registerTool('open_workflows_list_view', {
            title: 'Open Workflows List View',
            description: 'Opens the comprehensive list view showing all workflows in the application. Workflows define business logic, data processing, and automation. Shows workflow names, types, triggers, and execution flow.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openWorkflowsList();
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

        this.server.registerTool('open_workflow_details_view', {
            title: 'Open Workflow Details View',
            description: 'Opens the details editor for a specific DynaFlow workflow. Shows two tabs: "Settings" (workflow configuration) and "Workflow Tasks" (the sequence of tasks that make up the workflow). Requires workflowName parameter.',
            inputSchema: {
                workflowName: z.string().describe('Name of the workflow to view'),
                initialTab: z.string().optional().describe('Optional initial tab: "settings" or "workflowTasks"')
            },
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                workflowName: z.string().optional(),
                initialTab: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ workflowName, initialTab }) => {
            try {
                const result = await this.viewTools.openWorkflowDetails(workflowName, initialTab);
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

        this.server.registerTool('open_workflow_tasks_list_view', {
            title: 'Open Workflow Tasks List View',
            description: 'Opens the list view showing all workflow tasks across all workflows. Tasks are the individual steps within workflows (e.g., data validation, API calls, notifications). Useful for finding and reusing common workflow patterns.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openWorkflowTasksList();
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

        this.server.registerTool('open_workflow_task_details_view', {
            title: 'Open Workflow Task Details View',
            description: 'Opens the details editor for a specific workflow task. Shows task settings, parameters, conditions, and actions. Requires taskName parameter to specify which workflow task to display.',
            inputSchema: {
                taskName: z.string().describe('Name of the workflow task to view'),
                initialTab: z.string().optional().describe('Optional initial tab (if supported)')
            },
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                taskName: z.string().optional(),
                initialTab: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ taskName, initialTab }) => {
            try {
                const result = await this.viewTools.openWorkflowTaskDetails(taskName, initialTab);
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

        // ===== REPORT AND API VIEWS =====

        this.server.registerTool('open_report_details_view', {
            title: 'Open Report Details View',
            description: 'Opens the details editor for a specific report. Shows four tabs: "Settings" (report configuration), "Input Controls" (parameters and filters), "Buttons" (actions and downloads), and "Output Variables" (data outputs). Requires reportName parameter.',
            inputSchema: {
                reportName: z.string().describe('Name of the report to view'),
                initialTab: z.string().optional().describe('Optional initial tab: "settings", "inputControls", "buttons", or "outputVars"')
            },
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                reportName: z.string().optional(),
                initialTab: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ reportName, initialTab }) => {
            try {
                const result = await this.viewTools.openReportDetails(reportName, initialTab);
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

        this.server.registerTool('open_apis_list_view', {
            title: 'Open APIs List View',
            description: 'Opens the list view showing all external API integrations in the application. APIs define connections to external systems and services. Shows API names, endpoints, authentication methods, request/response formats, and usage.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openAPIsList();
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

        this.server.registerTool('open_api_details_view', {
            title: 'Open API Details View',
            description: 'Opens the details editor for a specific external API integration. Shows three tabs: "Settings" (endpoint configuration, authentication, headers), "Request/Response" (API schema definitions and sample data), and "Error Handling" (retry logic, fallback strategies). Requires apiName parameter.',
            inputSchema: {
                apiName: z.string().describe('Name of the API to view'),
                initialTab: z.string().optional().describe('Optional initial tab: "settings", "requestResponse", or "errorHandling"')
            },
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                apiName: z.string().optional(),
                initialTab: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ apiName, initialTab }) => {
            try {
                const result = await this.viewTools.openAPIDetails(apiName, initialTab);
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

        // ===== ANALYSIS AND METRICS VIEWS =====

        this.server.registerTool('open_metrics_analysis_view', {
            title: 'Open Metrics Analysis View',
            description: 'Opens the metrics analysis view showing application KPIs and performance metrics. Includes 2 tabs: Current (current metric values with filters and actions) and History (historical trends with charts and date range filtering). Displays metrics like object counts, form counts, workflow complexity, and other model statistics.',
            inputSchema: {
                initialTab: z.enum(['current', 'history']).optional().describe('Optional tab to display: "current" (current metrics - default) or "history" (historical metrics with charts)')
            },
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                initialTab: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ initialTab }) => {
            try {
                const result = await this.viewTools.openMetricsAnalysis(initialTab);
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

        this.server.registerTool('open_lexicon_view', {
            title: 'Open Lexicon View',
            description: 'Opens the application lexicon view showing business terminology and definitions. Acts as a glossary of domain-specific terms, acronyms, and concepts used throughout the application. Helps ensure consistent terminology across development teams and documentation.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openLexicon();
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

        this.server.registerTool('open_change_requests_view', {
            title: 'Open Change Requests View',
            description: 'Opens the change requests view showing pending and completed modification requests for the application model. Tracks requested changes, their status, priority, impact assessment, and implementation notes. Useful for managing model evolution and stakeholder feedback.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openChangeRequests();
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

        this.server.registerTool('open_model_ai_processing_view', {
            title: 'Open Model AI Processing View',
            description: 'Opens the AI processing view for the application model. Shows AI-powered analysis, recommendations, and automated suggestions for improving the model. Includes code generation previews, pattern detection, optimization suggestions, and best practice validations.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openModelAIProcessing();
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

        this.server.registerTool('open_model_validation_requests_view', {
            title: 'Open Model Validation Requests View',
            description: 'Opens the model validation requests view showing validation status and history. Displays validation requests submitted to the model services API, their status (pending, approved, rejected), timestamps, and detailed validation results. Essential for tracking model quality assurance and compliance validation processes.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openModelValidationRequests();
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

        this.server.registerTool('open_model_feature_catalog_view', {
            title: 'Open Model Feature Catalog View',
            description: 'Opens the model feature catalog view showing available features and enhancements. Displays a catalog of features that can be added to the application model, including descriptions, dependencies, and implementation status. Essential for discovering and managing model capabilities and feature sets.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openModelFeatureCatalog();
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

        this.server.registerTool('open_fabrication_requests_view', {
            title: 'Open Fabrication Requests View',
            description: 'Opens the fabrication requests view showing code generation request status and history. Displays fabrication requests submitted to the model services API for generating source code, their status (pending, processing, completed, failed), timestamps, and download links for generated code packages. Essential for tracking code generation activities and downloading fabricated source code.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openFabricationRequests();
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

        this.server.registerTool('open_fabrication_blueprint_catalog_view', {
            title: 'Open Fabrication Blueprint Catalog View',
            description: 'Opens the blueprint catalog view showing available templates and pre-built components. Blueprints are reusable model patterns that can be applied to quickly add common functionality (e.g., user management, audit logging, file uploads). Shows blueprint descriptions, parameters, and preview capabilities.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openFabricationBlueprintCatalog();
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

        // ===== DIAGRAM AND VISUALIZATION VIEWS =====

        this.server.registerTool('open_hierarchy_diagram_view', {
            title: 'Open Hierarchy Diagram View',
            description: 'Opens the data object hierarchy diagram showing parent-child relationships between data objects. Visualizes the entity relationship model with lines connecting related objects. Useful for understanding data model structure and dependencies.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openHierarchyDiagram();
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

        this.server.registerTool('open_page_flow_diagram_view', {
            title: 'Open Page Flow Diagram View',
            description: 'Opens the page flow diagram showing navigation paths between pages in the application. Visualizes how users move through the UI with arrows indicating navigation links and transitions. Includes 4 visualization tabs: Force Directed Graph (interactive), Mermaid (text-based), User Journey (path analysis), and Statistics (metrics). Useful for understanding user experience and site architecture.',
            inputSchema: {
                initialTab: z.enum(['diagram', 'mermaid', 'userjourney', 'statistics']).optional().describe('Optional tab to display: "diagram" (Force Directed Graph - default), "mermaid" (Mermaid diagram), "userjourney" (User Journey analysis), or "statistics" (flow statistics)')
            },
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                initialTab: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ initialTab }) => {
            try {
                const result = await this.viewTools.openPageFlowDiagram(initialTab);
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

        // ===== SETTINGS AND HELP VIEWS =====

        this.server.registerTool('open_project_settings_view', {
            title: 'Open Project Settings View',
            description: 'Opens the project settings view showing configuration options for the current AppDNA project. Includes settings for code generation, database connections, deployment targets, validation rules, and project metadata.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openProjectSettings();
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

        this.server.registerTool('open_settings_view', {
            title: 'Open Extension Settings View',
            description: 'Opens the VS Code extension settings view for the AppDNA extension. Shows preferences for editor behavior, UI themes, validation levels, auto-save options, and other extension-specific configuration.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openSettings();
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

        this.server.registerTool('open_welcome_view', {
            title: 'Open Welcome View',
            description: 'Opens the welcome screen showing getting started information, recent projects, documentation links, and quick actions. Ideal for new users or when reopening the extension after a break.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openWelcome();
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

        this.server.registerTool('open_help_view', {
            title: 'Open Help View',
            description: 'Opens the help documentation view showing user guides, tutorials, API references, troubleshooting tips, and support contact information. Searchable documentation for all extension features.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openHelp();
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

        // ===== AUTHENTICATION VIEWS =====

        this.server.registerTool('open_register_view', {
            title: 'Open Register View',
            description: 'Opens the model services registration form. Single-page form for creating a new account with the AppDNA model services. Collects user information, credentials, and organization details.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openRegister();
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

        this.server.registerTool('open_login_view', {
            title: 'Open Login View',
            description: 'Opens the model services login form. Single-page form for authenticating with existing AppDNA model services account. Provides access to cloud features, collaboration, and synchronization.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openLogin();
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

        // ===== WIZARD VIEWS =====

        this.server.registerTool('open_add_report_wizard', {
            title: 'Open Add Report Wizard',
            description: 'Opens the Add Report Wizard for creating a new report. The wizard guides you through creating a report with options for selecting the report type, configuring columns, parameters, and filters. Provides validation for report names and configuration.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openAddReportWizard();
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


        this.server.registerTool('open_add_form_wizard', {
            title: 'Open Add Form Wizard',
            description: 'Opens the Add Form Wizard which provides a step-by-step guided interface for creating new forms. The wizard walks through: 1) Selecting owner data object, 2) Choosing required role, 3) Specifying if creating new instance, 4) Selecting target object or action, 5) Setting form name and title. Automatically creates both the form and its associated page init flow.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                view: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.viewTools.openAddFormWizard();
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
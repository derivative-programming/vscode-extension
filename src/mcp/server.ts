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
import { FormTools } from './tools/formTools';
import { ModelTools } from './tools/modelTools';
import { ModelServiceTools } from './tools/modelServiceTools';

/**
 * Main MCP Server class
 */
export class MCPServer {
    private static instance: MCPServer;
    private server: McpServer;
    private userStoryTools: UserStoryTools;
    private viewTools: ViewTools;
    private dataObjectTools: DataObjectTools;
    private formTools: FormTools;
    private modelTools: ModelTools;
    private modelServiceTools: ModelServiceTools;
    private transport: StdioServerTransport;

    private constructor() {
        // Initialize UserStoryTools with null modelService (will use in-memory storage)
        this.userStoryTools = new UserStoryTools(null);
        this.viewTools = new ViewTools();
        this.dataObjectTools = new DataObjectTools(null);
        this.formTools = new FormTools(null);
        this.modelTools = new ModelTools();
        this.modelServiceTools = new ModelServiceTools();

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

        // Register get_form_schema tool
        this.server.registerTool('get_form_schema', {
            title: 'Get Form Schema',
            description: 'Get the schema definition for complete form structure (objectWorkflow). Includes all form properties (name, isPage, titleText, ownerObject, etc.), input parameter structure (objectWorkflowParam), button structure (objectWorkflowButton), output variable structure (objectWorkflowOutputVar), validation rules, SQL data types, and examples of complete forms with all components.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                schema: z.any(),
                note: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.formTools.get_form_schema();
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

        // Register get_form tool
        this.server.registerTool('get_form', {
            title: 'Get Form',
            description: 'Get complete details of a specific form by name. If owner_object_name is provided, searches only that object; otherwise searches all objects. Returns the full form structure including all input parameters (objectWorkflowParam), buttons (objectWorkflowButton), output variables (objectWorkflowOutputVar), and element counts. Form name matching is case-insensitive.',
            inputSchema: {
                form_name: z.string().describe('The name of the form to retrieve (case-insensitive matching)'),
                owner_object_name: z.string().optional().describe('Optional: The name of the owner data object that contains the form (case-insensitive matching). If not provided, all objects will be searched.')
            },
            outputSchema: {
                success: z.boolean(),
                form: z.any().optional().describe('Complete form object with all properties and arrays'),
                owner_object_name: z.string().optional(),
                element_counts: z.object({
                    paramCount: z.number(),
                    buttonCount: z.number(),
                    outputVarCount: z.number(),
                    totalElements: z.number()
                }).optional(),
                note: z.string().optional(),
                error: z.string().optional(),
                validationErrors: z.array(z.string()).optional()
            }
        }, async ({ owner_object_name, form_name }) => {
            try {
                const result = await this.formTools.get_form({ owner_object_name, form_name });
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

        // Register suggest_form_name_and_title tool
        this.server.registerTool('suggest_form_name_and_title', {
            title: 'Suggest Form Name and Title',
            description: 'Generate suggested form name (PascalCase) and title (human-readable) based on context: owner object, role, action, and target child object. Useful before creating a form to get naming recommendations that follow conventions.',
            inputSchema: {
                owner_object_name: z.string().describe('The name of the owner data object (required, case-sensitive exact match)'),
                role_required: z.string().optional().describe('Optional: Role required to access the form (case-sensitive)'),
                action: z.string().optional().describe('Optional: Action verb for the form (e.g., "Save", "Delete", "Approve"). If action is "Add", you should also provide target_child_object.'),
                target_child_object: z.string().optional().describe('Optional: Target child object when form creates new instances (case-sensitive). Should be provided when action is "Add" to specify which child object is being added.')
            },
            outputSchema: {
                success: z.boolean(),
                suggestions: z.object({
                    form_name: z.string(),
                    title_text: z.string()
                }).optional(),
                context: z.object({
                    owner_object_name: z.string(),
                    role_required: z.string().nullable(),
                    action: z.string().nullable(),
                    target_child_object: z.string().nullable()
                }).optional(),
                note: z.string().optional(),
                error: z.string().optional(),
                validationErrors: z.array(z.string()).optional()
            }
        }, async ({ owner_object_name, role_required, action, target_child_object }) => {
            try {
                const result = await this.formTools.suggest_form_name_and_title({ owner_object_name, role_required, action, target_child_object });
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

        // Register create_form tool
        this.server.registerTool('create_form', {
            title: 'Create Form',
            description: 'Create a new form (objectWorkflow) in a data object with automatic page init flow creation. Form name must be unique (case-insensitive) across all objects and in PascalCase format. Automatically creates OK and Cancel buttons. Owner object name must match exactly (case-sensitive). TIP: Use suggest_form_name_and_title tool first to get recommended form name and title based on your context (owner object, role, action, target child object).',
            inputSchema: {
                owner_object_name: z.string().describe('The name of the owner data object (required, case-sensitive exact match)'),
                form_name: z.string().describe('The name of the form (required, PascalCase, must be unique case-insensitive across all objects)'),
                title_text: z.string().describe('The title displayed on the form (required, max 100 characters)'),
                role_required: z.string().optional().describe('Optional: Role required to access the form (case-sensitive). Auto-sets isAuthorizationRequired="true" and layoutName="{role}Layout"'),
                target_child_object: z.string().optional().describe('Optional: Target child object when form creates new instances (case-sensitive exact match)')
            },
            outputSchema: {
                success: z.boolean(),
                form: z.any().optional(),
                page_init_flow: z.any().optional(),
                owner_object_name: z.string().optional(),
                message: z.string().optional(),
                note: z.string().optional(),
                error: z.string().optional(),
                validationErrors: z.array(z.string()).optional()
            }
        }, async ({ owner_object_name, form_name, title_text, role_required, target_child_object }) => {
            try {
                const result = await this.formTools.create_form({ owner_object_name, form_name, title_text, role_required, target_child_object });
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

        // Register update_form tool
        this.server.registerTool('update_form', {
            title: 'Update Form',
            description: 'Update properties of an existing form (objectWorkflow) in the AppDNA model. Form name must match exactly (case-sensitive). At least one property to update is required. Updates only the specified properties, leaving others unchanged. Searches all data objects to find the form.',
            inputSchema: {
                form_name: z.string().describe('The name of the form to update (required, case-sensitive exact match)'),
                titleText: z.string().optional().describe('The title displayed on the form (max 100 characters)'),
                isInitObjWFSubscribedToParams: z.enum(['true', 'false']).optional().describe('Whether the page init flow subscribes to parameters'),
                isObjectDelete: z.enum(['true', 'false']).optional().describe('Whether the form is for object deletion'),
                layoutName: z.string().optional().describe('The layout template for the form (e.g., "ManagerLayout", "AdminLayout")'),
                introText: z.string().optional().describe('Introduction text displayed on the form'),
                formTitleText: z.string().optional().describe('Form title text (alternative to titleText)'),
                formIntroText: z.string().optional().describe('Form introduction text (alternative to introText)'),
                formFooterText: z.string().optional().describe('Footer text displayed at the bottom of the form'),
                codeDescription: z.string().optional().describe('Description of the form for code documentation'),
                isAutoSubmit: z.enum(['true', 'false']).optional().describe('Whether the form auto-submits on load'),
                isHeaderVisible: z.enum(['true', 'false']).optional().describe('Whether the form header is visible'),
                isAuthorizationRequired: z.enum(['true', 'false']).optional().describe('Whether authorization is required to access the form'),
                isLoginPage: z.enum(['true', 'false']).optional().describe('Whether this is the login page'),
                isLogoutPage: z.enum(['true', 'false']).optional().describe('Whether this is the logout page'),
                isCaptchaVisible: z.enum(['true', 'false']).optional().describe('Whether CAPTCHA is visible on the form'),
                isCustomLogicOverwritten: z.enum(['true', 'false']).optional().describe('Whether custom logic overwrites default behavior')
            },
            outputSchema: {
                success: z.boolean(),
                form: z.any().optional(),
                owner_object_name: z.string().optional(),
                message: z.string().optional(),
                note: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ form_name, titleText, isInitObjWFSubscribedToParams, isObjectDelete, layoutName, introText, formTitleText, formIntroText, formFooterText, codeDescription, isAutoSubmit, isHeaderVisible, isAuthorizationRequired, isLoginPage, isLogoutPage, isCaptchaVisible, isCustomLogicOverwritten }) => {
            try {
                // Build updates object with only provided properties
                const updates: any = {};
                if (titleText !== undefined) { updates.titleText = titleText; }
                if (isInitObjWFSubscribedToParams !== undefined) { updates.isInitObjWFSubscribedToParams = isInitObjWFSubscribedToParams; }
                if (isObjectDelete !== undefined) { updates.isObjectDelete = isObjectDelete; }
                if (layoutName !== undefined) { updates.layoutName = layoutName; }
                if (introText !== undefined) { updates.introText = introText; }
                if (formTitleText !== undefined) { updates.formTitleText = formTitleText; }
                if (formIntroText !== undefined) { updates.formIntroText = formIntroText; }
                if (formFooterText !== undefined) { updates.formFooterText = formFooterText; }
                if (codeDescription !== undefined) { updates.codeDescription = codeDescription; }
                if (isAutoSubmit !== undefined) { updates.isAutoSubmit = isAutoSubmit; }
                if (isHeaderVisible !== undefined) { updates.isHeaderVisible = isHeaderVisible; }
                if (isAuthorizationRequired !== undefined) { updates.isAuthorizationRequired = isAuthorizationRequired; }
                if (isLoginPage !== undefined) { updates.isLoginPage = isLoginPage; }
                if (isLogoutPage !== undefined) { updates.isLogoutPage = isLogoutPage; }
                if (isCaptchaVisible !== undefined) { updates.isCaptchaVisible = isCaptchaVisible; }
                if (isCustomLogicOverwritten !== undefined) { updates.isCustomLogicOverwritten = isCustomLogicOverwritten; }

                const result = await this.formTools.update_form(form_name, updates);
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

        // Register add_form_param tool
        this.server.registerTool('add_form_param', {
            title: 'Add Form Parameter',
            description: 'Add a new input parameter (form field/control) to an existing form. Parameter name must be unique within the form and in PascalCase format. Form name must match exactly (case-sensitive). Searches all data objects to find the form.',
            inputSchema: {
                form_name: z.string().describe('The name of the form to add the parameter to (required, case-sensitive exact match)'),
                name: z.string().describe('Parameter name in PascalCase format (required, must be unique within the form)'),
                sqlServerDBDataType: z.enum(['nvarchar', 'bit', 'datetime', 'int', 'uniqueidentifier', 'money', 'bigint', 'float', 'decimal', 'date', 'varchar', 'text']).optional().describe('SQL Server data type for this parameter'),
                sqlServerDBDataTypeSize: z.string().optional().describe('Size of data type (for nvarchar, varchar, decimal). Default is 100 for nvarchar.'),
                labelText: z.string().optional().describe('Human-readable label text displayed for this field'),
                infoToolTipText: z.string().optional().describe('Tooltip text displayed when hovering over the info icon'),
                codeDescription: z.string().optional().describe('Code description for documentation'),
                defaultValue: z.string().optional().describe('Default value for this parameter'),
                isVisible: z.enum(['true', 'false']).optional().describe('Is this parameter visible on the form?'),
                isRequired: z.enum(['true', 'false']).optional().describe('Is this parameter required?'),
                requiredErrorText: z.string().optional().describe('Error message displayed when required field is not filled'),
                isSecured: z.enum(['true', 'false']).optional().describe('Should this parameter be secured (password field)?'),
                isFK: z.enum(['true', 'false']).optional().describe('Is this parameter a foreign key?'),
                fKObjectName: z.string().optional().describe('Name of the foreign key object target (data object name, case-sensitive)'),
                fKObjectQueryName: z.string().optional().describe('Name of the foreign key object query'),
                isFKLookup: z.enum(['true', 'false']).optional().describe('Is this parameter a foreign key to a lookup object?'),
                isFKList: z.enum(['true', 'false']).optional().describe('Should a dropdown list be shown for this FK?'),
                isFKListInactiveIncluded: z.enum(['true', 'false']).optional().describe('Should inactive items be included in the FK dropdown list?'),
                isFKListUnknownOptionRemoved: z.enum(['true', 'false']).optional().describe('Should the "Unknown" option be removed from FK dropdown?'),
                fKListOrderBy: z.enum(['NameDesc', 'NameAsc', 'DisplayOrderDesc', 'DisplayOrderAsc']).optional().describe('Sort order for FK dropdown list'),
                isFKListOptionRecommended: z.enum(['true', 'false']).optional().describe('Should a recommended option be highlighted in FK dropdown?'),
                isFKListSearchable: z.enum(['true', 'false']).optional().describe('Should the FK dropdown list be searchable?'),
                FKListRecommendedOption: z.string().optional().describe('The recommended option value for FK dropdown'),
                isRadioButtonList: z.enum(['true', 'false']).optional().describe('Should this parameter be displayed as radio buttons?'),
                isFileUpload: z.enum(['true', 'false']).optional().describe('Is this parameter a file upload field?'),
                isCreditCardEntry: z.enum(['true', 'false']).optional().describe('Is this parameter a credit card entry field?'),
                isTimeZoneDetermined: z.enum(['true', 'false']).optional().describe('Should timezone be determined for this parameter?'),
                isAutoCompleteAddressSource: z.enum(['true', 'false']).optional().describe('Implements typical Google address autocomplete'),
                autoCompleteAddressSourceName: z.string().optional().describe('Name of the source parameter for address autocomplete'),
                autoCompleteAddressTargetType: z.enum(['AddressLine1', 'AddressLine2', 'City', 'StateAbbrev', 'Zip', 'Country', 'Latitude', 'Longitude']).optional().describe('Type of address field this parameter represents'),
                detailsText: z.string().optional().describe('Additional details text for this parameter'),
                validationRuleRegExMatchRequired: z.string().optional().describe('Regular expression pattern that this parameter must match'),
                validationRuleRegExMatchRequiredErrorText: z.string().optional().describe('Error message displayed when regex validation fails'),
                isIgnored: z.enum(['true', 'false']).optional().describe('Should this parameter be ignored by the code generator?'),
                sourceObjectName: z.string().optional().describe('Name of the source data object for this parameter'),
                sourcePropertyName: z.string().optional().describe('Name of the source property from the source object')
            },
            outputSchema: {
                success: z.boolean(),
                param: z.any().optional(),
                form_name: z.string().optional(),
                owner_object_name: z.string().optional(),
                message: z.string().optional(),
                note: z.string().optional(),
                error: z.string().optional()
            }
        }, async (args) => {
            try {
                const { form_name, name, ...otherParams } = args;
                const param = { name, ...otherParams };
                const result = await this.formTools.add_form_param(form_name, param as any);
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

        // Register update_form_param tool
        this.server.registerTool('update_form_param', {
            title: 'Update Form Parameter',
            description: 'Update properties of an existing parameter (form field/control) in a form. Form name and parameter name must match exactly (case-sensitive). At least one property to update is required. Updates only the specified properties, leaving others unchanged.',
            inputSchema: {
                form_name: z.string().describe('The name of the form containing the parameter (required, case-sensitive exact match)'),
                param_name: z.string().describe('The name of the parameter to update (required, case-sensitive exact match)'),
                sqlServerDBDataType: z.enum(['nvarchar', 'bit', 'datetime', 'int', 'uniqueidentifier', 'money', 'bigint', 'float', 'decimal', 'date', 'varchar', 'text']).optional().describe('SQL Server data type for this parameter'),
                sqlServerDBDataTypeSize: z.string().optional().describe('Size of data type (for nvarchar, varchar, decimal)'),
                labelText: z.string().optional().describe('Human-readable label text displayed for this field'),
                infoToolTipText: z.string().optional().describe('Tooltip text displayed when hovering over the info icon'),
                codeDescription: z.string().optional().describe('Code description for documentation'),
                defaultValue: z.string().optional().describe('Default value for this parameter'),
                isVisible: z.enum(['true', 'false']).optional().describe('Is this parameter visible on the form?'),
                isRequired: z.enum(['true', 'false']).optional().describe('Is this parameter required?'),
                requiredErrorText: z.string().optional().describe('Error message displayed when required field is not filled'),
                isSecured: z.enum(['true', 'false']).optional().describe('Should this parameter be secured (password field)?'),
                isFK: z.enum(['true', 'false']).optional().describe('Is this parameter a foreign key?'),
                fKObjectName: z.string().optional().describe('Name of the foreign key object target (data object name, case-sensitive)'),
                fKObjectQueryName: z.string().optional().describe('Name of the foreign key object query'),
                isFKLookup: z.enum(['true', 'false']).optional().describe('Is this parameter a foreign key to a lookup object?'),
                isFKList: z.enum(['true', 'false']).optional().describe('Should a dropdown list be shown for this FK?'),
                isFKListInactiveIncluded: z.enum(['true', 'false']).optional().describe('Should inactive items be included in the FK dropdown list?'),
                isFKListUnknownOptionRemoved: z.enum(['true', 'false']).optional().describe('Should the "Unknown" option be removed from FK dropdown?'),
                fKListOrderBy: z.enum(['NameDesc', 'NameAsc', 'DisplayOrderDesc', 'DisplayOrderAsc']).optional().describe('Sort order for FK dropdown list'),
                isFKListOptionRecommended: z.enum(['true', 'false']).optional().describe('Should a recommended option be highlighted in FK dropdown?'),
                isFKListSearchable: z.enum(['true', 'false']).optional().describe('Should the FK dropdown list be searchable?'),
                FKListRecommendedOption: z.string().optional().describe('The recommended option value for FK dropdown'),
                isRadioButtonList: z.enum(['true', 'false']).optional().describe('Should this parameter be displayed as radio buttons?'),
                isFileUpload: z.enum(['true', 'false']).optional().describe('Is this parameter a file upload field?'),
                isCreditCardEntry: z.enum(['true', 'false']).optional().describe('Is this parameter a credit card entry field?'),
                isTimeZoneDetermined: z.enum(['true', 'false']).optional().describe('Should timezone be determined for this parameter?'),
                isAutoCompleteAddressSource: z.enum(['true', 'false']).optional().describe('Implements typical Google address autocomplete'),
                autoCompleteAddressSourceName: z.string().optional().describe('Name of the source parameter for address autocomplete'),
                autoCompleteAddressTargetType: z.enum(['AddressLine1', 'AddressLine2', 'City', 'StateAbbrev', 'Zip', 'Country', 'Latitude', 'Longitude']).optional().describe('Type of address field this parameter represents'),
                detailsText: z.string().optional().describe('Additional details text for this parameter'),
                validationRuleRegExMatchRequired: z.string().optional().describe('Regular expression pattern that this parameter must match'),
                validationRuleRegExMatchRequiredErrorText: z.string().optional().describe('Error message displayed when regex validation fails'),
                isIgnored: z.enum(['true', 'false']).optional().describe('Should this parameter be ignored by the code generator?'),
                sourceObjectName: z.string().optional().describe('Name of the source data object for this parameter'),
                sourcePropertyName: z.string().optional().describe('Name of the source property from the source object')
            },
            outputSchema: {
                success: z.boolean(),
                param: z.any().optional(),
                form_name: z.string().optional(),
                owner_object_name: z.string().optional(),
                message: z.string().optional(),
                note: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ form_name, param_name, ...updates }) => {
            try {
                const result = await this.formTools.update_form_param(form_name, param_name, updates);
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

        // Register add_form_button tool
        this.server.registerTool('add_form_button', {
            title: 'Add Form Button',
            description: 'Add a new button to an existing form in the AppDNA model. The form must already exist. Form name is case-sensitive exact match. buttonText is required.',
            inputSchema: {
                form_name: z.string().describe('Name of the form to add button to (required, case-sensitive exact match)'),
                buttonText: z.string().describe('Text displayed on the button (required, e.g., "Submit", "Cancel", "Back")'),
                buttonType: z.enum(['submit', 'cancel', 'other']).optional().describe('Type of button (optional): "submit", "cancel", or "other". Default is "submit"'),
                isVisible: z.enum(['true', 'false']).optional().describe('Whether button is visible (optional): "true" or "false". Default is "true"'),
                conditionalVisiblePropertyName: z.string().optional().describe('Property name that controls button visibility (optional)'),
                destinationContextObjectName: z.string().optional().describe('Owner object of the destination (optional, typically the data object that owns the target form)'),
                destinationTargetName: z.string().optional().describe('Target form, report, or workflow name for button navigation (optional)'),
                introText: z.string().optional().describe('Introduction text shown before button (optional)'),
                isButtonCallToAction: z.enum(['true', 'false']).optional().describe('Whether button is call-to-action for highlighting (optional): "true" or "false". Default is "false"'),
                accessKey: z.string().optional().describe('Keyboard shortcut key for button (optional, single character)'),
                isAccessKeyAvailable: z.enum(['true', 'false']).optional().describe('Whether access key is available (optional): "true" or "false". Default is "false"')
            },
            outputSchema: {
                success: z.boolean(),
                button: z.any().optional(),
                form_name: z.string().optional(),
                owner_object_name: z.string().optional(),
                message: z.string().optional(),
                note: z.string().optional(),
                error: z.string().optional()
            }
        }, async (args: Record<string, unknown>) => {
            try {
                const { form_name, buttonText, ...optionalProps } = args;
                
                // Build button object with only provided properties
                const button: any = { buttonText };
                
                // Add optional properties if provided
                if (optionalProps.buttonType !== undefined) { button.buttonType = optionalProps.buttonType; }
                if (optionalProps.isVisible !== undefined) { button.isVisible = optionalProps.isVisible; }
                if (optionalProps.conditionalVisiblePropertyName !== undefined) { button.conditionalVisiblePropertyName = optionalProps.conditionalVisiblePropertyName; }
                if (optionalProps.destinationContextObjectName !== undefined) { button.destinationContextObjectName = optionalProps.destinationContextObjectName; }
                if (optionalProps.destinationTargetName !== undefined) { button.destinationTargetName = optionalProps.destinationTargetName; }
                if (optionalProps.introText !== undefined) { button.introText = optionalProps.introText; }
                if (optionalProps.isButtonCallToAction !== undefined) { button.isButtonCallToAction = optionalProps.isButtonCallToAction; }
                if (optionalProps.accessKey !== undefined) { button.accessKey = optionalProps.accessKey; }
                if (optionalProps.isAccessKeyAvailable !== undefined) { button.isAccessKeyAvailable = optionalProps.isAccessKeyAvailable; }
                
                const result = await this.formTools.add_form_button(form_name as string, button);
                
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    structuredContent: result
                };
            } catch (error: any) {
                const errorResult = { success: false, error: error.message };
                return {
                    content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                    structuredContent: errorResult,
                    isError: true
                };
            }
        });

        // Register update_form_button tool
        this.server.registerTool('update_form_button', {
            title: 'Update Form Button',
            description: 'Update properties of an existing button in a form. Form name and button text are case-sensitive exact matches. At least one property to update is required.',
            inputSchema: {
                form_name: z.string().describe('Name of the form containing the button (required, case-sensitive exact match)'),
                button_text: z.string().describe('Text of the button to update (required, case-sensitive exact match, used to identify the button)'),
                buttonText: z.string().optional().describe('New button text (optional)'),
                buttonType: z.enum(['submit', 'cancel', 'other']).optional().describe('New button type (optional): "submit", "cancel", or "other"'),
                isVisible: z.enum(['true', 'false']).optional().describe('New visibility setting (optional): "true" or "false"'),
                conditionalVisiblePropertyName: z.string().optional().describe('New property controlling visibility (optional)'),
                destinationContextObjectName: z.string().optional().describe('New owner object of destination (optional)'),
                destinationTargetName: z.string().optional().describe('New target form/report/workflow (optional)'),
                introText: z.string().optional().describe('New introduction text (optional)'),
                isButtonCallToAction: z.enum(['true', 'false']).optional().describe('New call-to-action setting (optional): "true" or "false"'),
                accessKey: z.string().optional().describe('New keyboard shortcut key (optional)'),
                isAccessKeyAvailable: z.enum(['true', 'false']).optional().describe('New access key availability (optional): "true" or "false"')
            },
            outputSchema: {
                success: z.boolean(),
                button: z.any().optional(),
                form_name: z.string().optional(),
                owner_object_name: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async (args: Record<string, unknown>) => {
            try {
                const { form_name, button_text, ...updates } = args;
                
                const result = await this.formTools.update_form_button(form_name as string, button_text as string, updates);
                
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    structuredContent: result
                };
            } catch (error: any) {
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

        // Register list_pages tool
        this.server.registerTool('list_pages', {
            title: 'List Pages',
            description: 'List all pages (forms and reports with isPage=true) from the AppDNA model with optional filtering. Each page includes name, type (Form/Report), owner data object, target child object, role required, report type (for reports: Grid, Navigation, Three Column), and total element count (buttons, columns, inputs, parameters). Use filters to find specific pages by name, type, owner, target, or role.',
            inputSchema: {
                page_name: z.string().optional().describe('Optional: Filter by page name (case-insensitive, partial match)'),
                page_type: z.enum(['Form', 'Report', '']).optional().describe('Optional: Filter by page type - "Form" or "Report"'),
                owner_object: z.string().optional().describe('Optional: Filter by owner data object name (case-insensitive, exact match)'),
                target_child_object: z.string().optional().describe('Optional: Filter by target child object name (case-insensitive, exact match)'),
                role_required: z.string().optional().describe('Optional: Filter by required role (case-insensitive, exact match)')
            },
            outputSchema: {
                success: z.boolean(),
                pages: z.array(z.object({
                    name: z.string(),
                    titleText: z.string(),
                    type: z.string(),
                    reportType: z.string(),
                    ownerObject: z.string(),
                    targetChildObject: z.string(),
                    roleRequired: z.string(),
                    totalElements: z.number(),
                    isPage: z.string()
                })),
                count: z.number(),
                filters: z.object({
                    page_name: z.string().nullable(),
                    page_type: z.string().nullable(),
                    owner_object: z.string().nullable(),
                    target_child_object: z.string().nullable(),
                    role_required: z.string().nullable()
                }).optional(),
                note: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ page_name, page_type, owner_object, target_child_object, role_required }) => {
            try {
                const result = await this.dataObjectTools.list_pages({ 
                    page_name, 
                    page_type, 
                    owner_object, 
                    target_child_object, 
                    role_required 
                });
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    structuredContent: result
                };
            } catch (error) {
                const errorResult = { 
                    success: false, 
                    pages: [],
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

        // Register expand_tree_view tool
        this.server.registerTool('expand_tree_view', {
            title: 'Expand Tree View',
            description: 'Expand all top-level items in the AppDNA tree view. This expands all main sections: PROJECT (configuration, lexicon, MCP server status), DATA OBJECTS (business entities), USER STORIES (requirements), PAGES (forms and reports), FLOWS (workflows and page init flows), APIS (API integrations), ANALYSIS (metrics and analytics), and MODEL SERVICES (AI processing, validation, features, fabrication). Useful for getting an overview of the model structure or navigating to specific items.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                message: z.string().optional(),
                note: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.modelTools.expand_tree_view();
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

        // Register collapse_tree_view tool
        this.server.registerTool('collapse_tree_view', {
            title: 'Collapse Tree View',
            description: 'Collapse all items in the AppDNA tree view to their top-level state. This collapses all sections (PROJECT, DATA OBJECTS, USER STORIES, PAGES, FLOWS, APIS, ANALYSIS, MODEL SERVICES) and their child items. Useful for cleaning up the tree view or getting back to a high-level overview of the model structure.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                message: z.string().optional(),
                note: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.modelTools.collapse_tree_view();
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

        // ===== MODEL SERVICES TOOLS =====

        // Register list_model_features_catalog_items tool
        this.server.registerTool('list_model_features_catalog_items', {
            title: 'List Model Features Catalog Items',
            description: 'List available features from the Model Services catalog with selection status. Returns paginated list of features that can be added to the application model, including name, display name, description, version, and whether each feature is currently selected in the model. Features marked with isCompleted="true" have been processed by AI and cannot be removed. Supports server-side pagination and sorting. Requires authentication to Model Services. Uses the exact same code as the Model Feature Catalog view to ensure consistent data.',
            inputSchema: {
                pageNumber: z.number().optional().describe('Page number (1-indexed, default: 1)'),
                itemCountPerPage: z.number().optional().describe('Items per page (default: 10, max: 100)'),
                orderByColumnName: z.string().optional().describe('Column to sort by: "name", "displayName", "description", or "version" (default: "displayName")'),
                orderByDescending: z.boolean().optional().describe('Sort in descending order (default: false)')
            },
            outputSchema: {
                success: z.boolean(),
                items: z.array(z.any()).optional().describe('Array of model feature objects with name, displayName, description, version, selected status, and isCompleted flag'),
                pageNumber: z.number().optional(),
                itemCountPerPage: z.number().optional(),
                recordsTotal: z.number().optional(),
                recordsFiltered: z.number().optional(),
                orderByColumnName: z.string().optional(),
                orderByDescending: z.boolean().optional(),
                error: z.string().optional(),
                note: z.string().optional()
            }
        }, async (args: any) => {
            try {
                const result = await this.modelServiceTools.list_model_features_catalog_items(
                    args.pageNumber,
                    args.itemCountPerPage,
                    args.orderByColumnName,
                    args.orderByDescending
                );
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    structuredContent: result
                };
            } catch (error) {
                const errorResult = {
                    success: false,
                    error: error.message,
                    items: [],
                    pageNumber: args.pageNumber || 1,
                    itemCountPerPage: args.itemCountPerPage || 10,
                    recordsTotal: 0,
                    recordsFiltered: 0
                };
                return {
                    content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                    structuredContent: errorResult,
                    isError: true
                };
            }
        });

        // Register list_model_ai_processing_requests tool
        this.server.registerTool('list_model_ai_processing_requests', {
            title: 'List Model AI Processing Requests',
            description: 'List AI processing requests from Model Services with status and details. Returns paginated list of requests that have been submitted for AI-powered model preparation and enhancement. Each request includes project information, status, requested/completed timestamps, and processing details. Supports server-side pagination and sorting. Requires authentication to Model Services.',
            inputSchema: {
                pageNumber: z.number().optional().describe('Page number (1-indexed, default: 1)'),
                itemCountPerPage: z.number().optional().describe('Items per page (default: 10, max: 100)'),
                orderByColumnName: z.string().optional().describe('Column to sort by (default: "modelPrepRequestRequestedUTCDateTime")'),
                orderByDescending: z.boolean().optional().describe('Sort in descending order (default: true)')
            },
            outputSchema: {
                success: z.boolean(),
                items: z.array(z.any()).optional().describe('Array of AI processing request objects'),
                pageNumber: z.number().optional(),
                itemCountPerPage: z.number().optional(),
                recordsTotal: z.number().optional(),
                recordsFiltered: z.number().optional(),
                orderByColumnName: z.string().optional(),
                orderByDescending: z.boolean().optional(),
                error: z.string().optional(),
                note: z.string().optional()
            }
        }, async (args: any) => {
            try {
                const result = await this.modelServiceTools.list_model_ai_processing_requests(
                    args.pageNumber,
                    args.itemCountPerPage,
                    args.orderByColumnName,
                    args.orderByDescending
                );
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    structuredContent: result
                };
            } catch (error) {
                const errorResult = {
                    success: false,
                    error: error.message,
                    items: [],
                    pageNumber: args.pageNumber || 1,
                    itemCountPerPage: args.itemCountPerPage || 10,
                    recordsTotal: 0,
                    recordsFiltered: 0
                };
                return {
                    content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                    structuredContent: errorResult,
                    isError: true
                };
            }
        });

        // Register get_model_ai_processing_request_details tool
        this.server.registerTool('get_model_ai_processing_request_details', {
            title: 'Get Model AI Processing Request Details',
            description: 'Get detailed information for a specific AI processing request by request code. Returns complete details including status, timestamps, report URL, result model URL, and error information if applicable. Use this to check on the progress or outcome of a specific AI processing request. Requires authentication to Model Services.',
            inputSchema: {
                requestCode: z.string().describe('The request code to fetch details for (e.g., "ABC123")')
            },
            outputSchema: {
                success: z.boolean(),
                item: z.any().optional().describe('AI processing request details object'),
                requestCode: z.string().optional().describe('The request code that was queried'),
                error: z.string().optional(),
                note: z.string().optional()
            }
        }, async (args: any) => {
            try {
                const result = await this.modelServiceTools.get_model_ai_processing_request_details(
                    args.requestCode
                );
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    structuredContent: result
                };
            } catch (error) {
                const errorResult = {
                    success: false,
                    error: error.message,
                    item: null,
                    requestCode: args.requestCode
                };
                return {
                    content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                    structuredContent: errorResult,
                    isError: true
                };
            }
        });

        // Register create_model_ai_processing_request tool
        this.server.registerTool('create_model_ai_processing_request', {
            title: 'Create Model AI Processing Request',
            description: 'Submit a new AI processing request to Model Services with the current AppDNA model file. The AI will analyze your model and enhance it with additional features, improvements, and recommendations. The model file is automatically read, zipped, and uploaded. Returns the request code for tracking. Requires authentication to Model Services and an open model file.',
            inputSchema: {
                description: z.string().describe('Description for the AI processing request (e.g., "Project: MyApp, Version: 1.0.0")')
            },
            outputSchema: {
                success: z.boolean(),
                message: z.string().optional().describe('Success message'),
                requestCode: z.string().optional().describe('The generated request code for tracking'),
                description: z.string().optional().describe('The description that was submitted'),
                error: z.string().optional(),
                note: z.string().optional()
            }
        }, async (args: any) => {
            try {
                const result = await this.modelServiceTools.create_model_ai_processing_request(
                    args.description
                );
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

        // Register merge_model_ai_processing_results tool
        this.server.registerTool('merge_model_ai_processing_results', {
            title: 'Merge Model AI Processing Results',
            description: 'Merge the AI-enhanced model results from a completed AI processing request into the current AppDNA model. This downloads the result model from Model Services, merges it with your current model, and updates the model in memory. The request must be completed and successful. After merging, use save_model to persist changes. Requires authentication to Model Services and an open model file.',
            inputSchema: {
                requestCode: z.string().describe('The AI processing request code for which to merge results (e.g., "ABC123")')
            },
            outputSchema: {
                success: z.boolean(),
                message: z.string().optional().describe('Success message'),
                requestCode: z.string().optional().describe('The request code that was merged'),
                error: z.string().optional(),
                note: z.string().optional()
            }
        }, async (args: any) => {
            try {
                const result = await this.modelServiceTools.merge_model_ai_processing_results(
                    args.requestCode
                );
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

        // Register create_model_validation_request tool
        this.server.registerTool('create_model_validation_request', {
            title: 'Create Model Validation Request',
            description: 'Submit a new validation request to Model Services with the current AppDNA model file. The validation service will analyze your model for errors, inconsistencies, and potential improvements, and provide a detailed report. The model file is automatically read, zipped, and uploaded. Returns the request code for tracking. Requires authentication to Model Services and an open model file.',
            inputSchema: {
                description: z.string().describe('Description for the validation request (e.g., "Project: MyApp, Version: 1.0.0")')
            },
            outputSchema: {
                success: z.boolean(),
                message: z.string().optional().describe('Success message'),
                requestCode: z.string().optional().describe('The generated request code for tracking'),
                description: z.string().optional().describe('The description that was submitted'),
                error: z.string().optional(),
                note: z.string().optional()
            }
        }, async (args: any) => {
            try {
                const result = await this.modelServiceTools.create_model_validation_request(
                    args.description
                );
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

        // Register create_model_fabrication_request tool
        this.server.registerTool('create_model_fabrication_request', {
            title: 'Create Model Fabrication Request',
            description: 'Submit a new fabrication request to Model Services with the current AppDNA model file. The fabrication service will generate complete application code from your model including database schemas, APIs, UI components, and deployment configurations. The model file is automatically read, zipped, and uploaded. Returns the request code for tracking. Requires authentication to Model Services and an open model file.',
            inputSchema: {
                description: z.string().describe('Description for the fabrication request (e.g., "Project: MyApp, Version: 1.0.0")')
            },
            outputSchema: {
                success: z.boolean(),
                message: z.string().optional().describe('Success message'),
                requestCode: z.string().optional().describe('The generated request code for tracking'),
                description: z.string().optional().describe('The description that was submitted'),
                error: z.string().optional(),
                note: z.string().optional()
            }
        }, async (args: any) => {
            try {
                const result = await this.modelServiceTools.create_model_fabrication_request(
                    args.description
                );
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

        // Register get_model_validation_request_details tool
        this.server.registerTool('get_model_validation_request_details', {
            title: 'Get Model Validation Request Details',
            description: 'Get detailed information for a specific validation request by request code. Returns complete details including status, timestamps, report URL, change suggestions URL, and error information if applicable. Use this to check on the progress or outcome of a specific validation request. Requires authentication to Model Services.',
            inputSchema: {
                requestCode: z.string().describe('The validation request code to fetch details for (e.g., "VAL123")')
            },
            outputSchema: {
                success: z.boolean(),
                item: z.any().optional().describe('Validation request details object'),
                requestCode: z.string().optional().describe('The request code that was queried'),
                error: z.string().optional(),
                note: z.string().optional()
            }
        }, async (args: any) => {
            try {
                const result = await this.modelServiceTools.get_model_validation_request_details(
                    args.requestCode
                );
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    structuredContent: result
                };
            } catch (error) {
                const errorResult = {
                    success: false,
                    error: error.message,
                    item: null,
                    requestCode: args.requestCode
                };
                return {
                    content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                    structuredContent: errorResult,
                    isError: true
                };
            }
        });

        // Register get_model_fabrication_request_details tool
        this.server.registerTool('get_model_fabrication_request_details', {
            title: 'Get Model Fabrication Request Details',
            description: 'Get detailed information for a specific fabrication request by request code. Returns complete details including status, timestamps, report URL, result ZIP URL, and error information if applicable. Use this to check on the progress or outcome of a specific fabrication request. Requires authentication to Model Services.',
            inputSchema: {
                requestCode: z.string().describe('The fabrication request code to fetch details for (e.g., "FAB123")')
            },
            outputSchema: {
                success: z.boolean(),
                item: z.any().optional().describe('Fabrication request details object'),
                requestCode: z.string().optional().describe('The request code that was queried'),
                error: z.string().optional(),
                note: z.string().optional()
            }
        }, async (args: any) => {
            try {
                const result = await this.modelServiceTools.get_model_fabrication_request_details(
                    args.requestCode
                );
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    structuredContent: result
                };
            } catch (error) {
                const errorResult = {
                    success: false,
                    error: error.message,
                    item: null,
                    requestCode: args.requestCode
                };
                return {
                    content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                    structuredContent: errorResult,
                    isError: true
                };
            }
        });

        // Register get_model_ai_processing_request_schema tool
        this.server.registerTool('get_model_ai_processing_request_schema', {
            title: 'Get Model AI Processing Request Schema',
            description: 'Get the JSON schema definition for AI processing request objects returned by Model Services API. This schema describes the structure, properties, data types, and status calculation rules for AI processing requests. Use this to understand the format of objects returned by list_model_ai_processing_requests and get_model_ai_processing_request_details.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                schema: z.any().describe('JSON schema definition for AI processing request objects'),
                note: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.modelServiceTools.get_model_ai_processing_request_schema();
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    structuredContent: result
                };
            } catch (error) {
                const errorResult = {
                    success: false,
                    error: error.message,
                    schema: null
                };
                return {
                    content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                    structuredContent: errorResult,
                    isError: true
                };
            }
        });

        // Register get_model_validation_request_schema tool
        this.server.registerTool('get_model_validation_request_schema', {
            title: 'Get Model Validation Request Schema',
            description: 'Get the JSON schema definition for validation request objects returned by Model Services API. This schema describes the structure, properties, data types, and status calculation rules for validation requests. Use this to understand the format of objects returned by list_model_validation_requests.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                schema: z.any().describe('JSON schema definition for validation request objects'),
                note: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.modelServiceTools.get_model_validation_request_schema();
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    structuredContent: result
                };
            } catch (error) {
                const errorResult = {
                    success: false,
                    error: error.message,
                    schema: null
                };
                return {
                    content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                    structuredContent: errorResult,
                    isError: true
                };
            }
        });

        // Register get_model_fabrication_request_schema tool
        this.server.registerTool('get_model_fabrication_request_schema', {
            title: 'Get Model Fabrication Request Schema',
            description: 'Get the JSON schema definition for fabrication request objects returned by Model Services API. This schema describes the structure, properties, data types, and status calculation rules for fabrication requests. Use this to understand the format of objects returned by list_model_fabrication_requests.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                schema: z.any().describe('JSON schema definition for fabrication request objects'),
                note: z.string().optional()
            }
        }, async () => {
            try {
                const result = await this.modelServiceTools.get_model_fabrication_request_schema();
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    structuredContent: result
                };
            } catch (error) {
                const errorResult = {
                    success: false,
                    error: error.message,
                    schema: null
                };
                return {
                    content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                    structuredContent: errorResult,
                    isError: true
                };
            }
        });

        // Register list_model_validation_requests tool
        this.server.registerTool('list_model_validation_requests', {
            title: 'List Model Validation Requests',
            description: 'List validation requests from Model Services with status and results. Returns paginated list of requests that have been submitted for AI-powered model validation and change suggestions. Each request includes project information, status, requested/completed timestamps, and validation results. Supports server-side pagination and sorting. Requires authentication to Model Services.',
            inputSchema: {
                pageNumber: z.number().optional().describe('Page number (1-indexed, default: 1)'),
                itemCountPerPage: z.number().optional().describe('Items per page (default: 10, max: 100)'),
                orderByColumnName: z.string().optional().describe('Column to sort by (default: "modelValidationRequestRequestedUTCDateTime")'),
                orderByDescending: z.boolean().optional().describe('Sort in descending order (default: true)')
            },
            outputSchema: {
                success: z.boolean(),
                items: z.array(z.any()).optional().describe('Array of validation request objects'),
                pageNumber: z.number().optional(),
                itemCountPerPage: z.number().optional(),
                recordsTotal: z.number().optional(),
                recordsFiltered: z.number().optional(),
                orderByColumnName: z.string().optional(),
                orderByDescending: z.boolean().optional(),
                error: z.string().optional(),
                note: z.string().optional()
            }
        }, async (args: any) => {
            try {
                const result = await this.modelServiceTools.list_model_validation_requests(
                    args.pageNumber,
                    args.itemCountPerPage,
                    args.orderByColumnName,
                    args.orderByDescending
                );
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    structuredContent: result
                };
            } catch (error) {
                const errorResult = {
                    success: false,
                    error: error.message,
                    items: [],
                    pageNumber: args.pageNumber || 1,
                    itemCountPerPage: args.itemCountPerPage || 10,
                    recordsTotal: 0,
                    recordsFiltered: 0
                };
                return {
                    content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                    structuredContent: errorResult,
                    isError: true
                };
            }
        });

        // Register list_fabrication_blueprint_catalog_items tool
        this.server.registerTool('list_fabrication_blueprint_catalog_items', {
            title: 'List Fabrication Blueprint Catalog Items',
            description: 'List available fabrication blueprints (template sets) from the Model Services catalog with selection status. Returns paginated list of blueprints that define the types of files and code that can be generated from the application model. Each blueprint includes name, display name, description, version, and whether it is currently selected in the model. Supports server-side pagination and sorting. Requires authentication to Model Services.',
            inputSchema: {
                pageNumber: z.number().optional().describe('Page number (1-indexed, default: 1)'),
                itemCountPerPage: z.number().optional().describe('Items per page (default: 10, max: 100)'),
                orderByColumnName: z.string().optional().describe('Column to sort by: "name", "displayName", "description", or "version" (default: "displayName")'),
                orderByDescending: z.boolean().optional().describe('Sort in descending order (default: false)')
            },
            outputSchema: {
                success: z.boolean(),
                items: z.array(z.any()).optional().describe('Array of fabrication blueprint objects with name, displayName, description, version, and selected status'),
                pageNumber: z.number().optional(),
                itemCountPerPage: z.number().optional(),
                recordsTotal: z.number().optional(),
                recordsFiltered: z.number().optional(),
                orderByColumnName: z.string().optional(),
                orderByDescending: z.boolean().optional(),
                error: z.string().optional(),
                note: z.string().optional()
            }
        }, async (args: any) => {
            try {
                const result = await this.modelServiceTools.list_fabrication_blueprint_catalog_items(
                    args.pageNumber,
                    args.itemCountPerPage,
                    args.orderByColumnName,
                    args.orderByDescending
                );
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    structuredContent: result
                };
            } catch (error) {
                const errorResult = {
                    success: false,
                    error: error.message,
                    items: [],
                    pageNumber: args.pageNumber || 1,
                    itemCountPerPage: args.itemCountPerPage || 10,
                    recordsTotal: 0,
                    recordsFiltered: 0
                };
                return {
                    content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                    structuredContent: errorResult,
                    isError: true
                };
            }
        });

        // Register list_model_fabrication_requests tool
        this.server.registerTool('list_model_fabrication_requests', {
            title: 'List Model Fabrication Requests',
            description: 'List fabrication requests from Model Services with status and download information. Returns paginated list of requests that have been submitted to generate code files from the application model using selected blueprints. Each request includes project information, blueprint selection, status, requested/completed timestamps, and download URLs for generated files. Supports server-side pagination and sorting. Requires authentication to Model Services.',
            inputSchema: {
                pageNumber: z.number().optional().describe('Page number (1-indexed, default: 1)'),
                itemCountPerPage: z.number().optional().describe('Items per page (default: 10, max: 100)'),
                orderByColumnName: z.string().optional().describe('Column to sort by (default: "modelFabricationRequestRequestedUTCDateTime")'),
                orderByDescending: z.boolean().optional().describe('Sort in descending order (default: true)')
            },
            outputSchema: {
                success: z.boolean(),
                items: z.array(z.any()).optional().describe('Array of fabrication request objects'),
                pageNumber: z.number().optional(),
                itemCountPerPage: z.number().optional(),
                recordsTotal: z.number().optional(),
                recordsFiltered: z.number().optional(),
                orderByColumnName: z.string().optional(),
                orderByDescending: z.boolean().optional(),
                error: z.string().optional(),
                note: z.string().optional()
            }
        }, async (args: any) => {
            try {
                const result = await this.modelServiceTools.list_model_fabrication_requests(
                    args.pageNumber,
                    args.itemCountPerPage,
                    args.orderByColumnName,
                    args.orderByDescending
                );
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    structuredContent: result
                };
            } catch (error) {
                const errorResult = {
                    success: false,
                    error: error.message,
                    items: [],
                    pageNumber: args.pageNumber || 1,
                    itemCountPerPage: args.itemCountPerPage || 10,
                    recordsTotal: 0,
                    recordsFiltered: 0
                };
                return {
                    content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                    structuredContent: errorResult,
                    isError: true
                };
            }
        });

        // Register select_model_feature tool
        this.server.registerTool('select_model_feature', {
            title: 'Select Model Feature',
            description: 'Add a model feature from the catalog to your AppDNA model. The feature will be added to the first namespace in your model. Matching is done on both name AND version. If the feature already exists (same name and version), no action is taken. The model is updated in memory and marked as having unsaved changes. Use list_model_features_catalog_items to find available features first.',
            inputSchema: {
                featureName: z.string().describe('Exact name of the feature from the catalog (case-sensitive, must match catalog item name exactly)'),
                version: z.string().describe('Exact version of the feature from the catalog (must match catalog item version exactly)')
            },
            outputSchema: {
                success: z.boolean(),
                message: z.string().optional(),
                featureName: z.string().optional(),
                version: z.string().optional(),
                alreadyExists: z.boolean().optional().describe('True if feature was already in the model'),
                error: z.string().optional()
            }
        }, async (args: any) => {
            try {
                const result = await this.modelServiceTools.select_model_feature(
                    args.featureName,
                    args.version
                );
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

        // Register unselect_model_feature tool
        this.server.registerTool('unselect_model_feature', {
            title: 'Unselect Model Feature',
            description: 'Remove a model feature from your AppDNA model. Matching is done on both name AND version. This is only allowed if the feature has NOT been marked as completed (isCompleted="true"). Features that have been processed by AI cannot be removed. The model is updated in memory and marked as having unsaved changes. If the feature is marked as completed, an error will be returned.',
            inputSchema: {
                featureName: z.string().describe('Exact name of the feature to remove (case-sensitive, must match existing feature name)'),
                version: z.string().describe('Exact version of the feature to remove (must match existing feature version)')
            },
            outputSchema: {
                success: z.boolean(),
                message: z.string().optional(),
                featureName: z.string().optional(),
                version: z.string().optional(),
                wasCompleted: z.boolean().optional().describe('True if removal failed because feature is marked as completed'),
                notFound: z.boolean().optional().describe('True if the feature was not found in the model'),
                error: z.string().optional()
            }
        }, async (args: any) => {
            try {
                const result = await this.modelServiceTools.unselect_model_feature(
                    args.featureName,
                    args.version
                );
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

        // Register select_fabrication_blueprint tool
        this.server.registerTool('select_fabrication_blueprint', {
            title: 'Select Fabrication Blueprint',
            description: 'Add a fabrication blueprint (template set) from the catalog to your AppDNA model. Matching is done on both name AND version. The blueprint will be added to the root templateSet array. If the blueprint already exists (same name and version), it will be re-enabled if disabled. The model is updated in memory and marked as having unsaved changes. Use list_fabrication_blueprint_catalog_items to find available blueprints first.',
            inputSchema: {
                blueprintName: z.string().describe('Exact name of the blueprint from the catalog (case-sensitive, must match catalog item name exactly)'),
                version: z.string().describe('Exact version of the blueprint from the catalog (must match catalog item version exactly)')
            },
            outputSchema: {
                success: z.boolean(),
                message: z.string().optional(),
                blueprintName: z.string().optional(),
                version: z.string().optional(),
                alreadyExists: z.boolean().optional().describe('True if blueprint was already in the model'),
                error: z.string().optional()
            }
        }, async (args: any) => {
            try {
                const result = await this.modelServiceTools.select_fabrication_blueprint(
                    args.blueprintName,
                    args.version
                );
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

        // Register unselect_fabrication_blueprint tool
        this.server.registerTool('unselect_fabrication_blueprint', {
            title: 'Unselect Fabrication Blueprint',
            description: 'Remove a fabrication blueprint (template set) from your AppDNA model. Matching is done on both name AND version. The blueprint will be removed from the root templateSet array. The model is updated in memory and marked as having unsaved changes.',
            inputSchema: {
                blueprintName: z.string().describe('Exact name of the blueprint to remove (case-sensitive, must match existing blueprint name)'),
                version: z.string().describe('Exact version of the blueprint to remove (must match existing blueprint version)')
            },
            outputSchema: {
                success: z.boolean(),
                message: z.string().optional(),
                blueprintName: z.string().optional(),
                version: z.string().optional(),
                notFound: z.boolean().optional().describe('True if the blueprint was not found in the model'),
                error: z.string().optional()
            }
        }, async (args: any) => {
            try {
                const result = await this.modelServiceTools.unselect_fabrication_blueprint(
                    args.blueprintName,
                    args.version
                );
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

        this.server.registerTool('open_validation_request_details', {
            title: 'Open Validation Request Details',
            description: 'Opens the Model Validation Requests view and displays the details modal for a specific validation request. Shows validation status, results, and allows downloading the validation report. Requires authentication to Model Services.',
            inputSchema: {
                requestCode: z.string().describe('The validation request code to show details for (e.g., "VAL-2025-001")')
            },
            outputSchema: {
                success: z.boolean(),
                requestCode: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ requestCode }) => {
            try {
                const result = await this.viewTools.openValidationRequestDetails(requestCode);
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

        this.server.registerTool('open_model_ai_processing_request_details', {
            title: 'Open AI Processing Request Details',
            description: 'Opens the Model AI Processing Requests view and displays the details modal for a specific AI processing request. Shows request status, AI analysis results, and allows downloading the report or merging results. Requires authentication to Model Services.',
            inputSchema: {
                requestCode: z.string().describe('The AI processing request code to show details for (e.g., "PREP-2025-001")')
            },
            outputSchema: {
                success: z.boolean(),
                requestCode: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ requestCode }) => {
            try {
                const result = await this.viewTools.openAIProcessingRequestDetails(requestCode);
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

        this.server.registerTool('open_model_fabrication_request_details', {
            title: 'Open Fabrication Request Details',
            description: 'Opens the Model Fabrication Requests view and displays the details modal for a specific fabrication request. Shows request status, generated file information, and allows downloading fabrication results. Requires authentication to Model Services.',
            inputSchema: {
                requestCode: z.string().describe('The fabrication request code to show details for (e.g., "FAB-2025-001")')
            },
            outputSchema: {
                success: z.boolean(),
                requestCode: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional()
            }
        }, async ({ requestCode }) => {
            try {
                const result = await this.viewTools.openFabricationRequestDetails(requestCode);
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
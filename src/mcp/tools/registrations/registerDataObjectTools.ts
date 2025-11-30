// registerDataObjectTools.ts
// MCP tool registrations for data object operations
// Extracted from server.ts on: November 23, 2025

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DataObjectTools } from '../dataObjectTools.js';

/**
 * Get list of tool names for chatmode YAML
 */
export function getToolNames(): string[] {
    return [
        'list_roles',
        'add_role',
        'update_role',
        'get_role_schema',
        'add_lookup_value',
        'list_lookup_values',
        'update_lookup_value',
        'get_lookup_value_schema',
        'list_data_object_summary',
        'list_data_objects',
        'get_data_object',
        'get_data_object_schema',
        'get_data_object_summary_schema',
        'create_data_object',
        'update_data_object',
        'update_full_data_object',
        'add_data_object_props',
        'update_data_object_prop',
        'get_data_object_usage',
        'list_pages'
    ];
}

/**
 * Generate chatmode documentation for data object tools
 */
export function generateChatmodeDocumentation(): string {
    return `**Data Object Tools (19 tools):**

*Role Management:*
- \`list_roles\` - List all roles from the Role data object
- \`add_role\` - Add a new role (name must be PascalCase)
- \`update_role\` - Update role properties
- \`get_role_schema\` - Get schema definition for role objects

*Lookup Value Management:*
- \`add_lookup_value\` - Add lookup value to a lookup data object
- \`list_lookup_values\` - List all lookup values for a data object
- \`update_lookup_value\` - Update lookup value properties
- \`get_lookup_value_schema\` - Get schema definition for lookup values

*Data Object Operations:*
- \`list_data_object_summary\` - List data objects with summary info
- \`list_data_objects\` - List all data objects with full details
- \`get_data_object\` - Get complete details of a specific data object
- \`get_data_object_schema\` - Get schema definition for data objects
- \`get_data_object_summary_schema\` - Get schema for summary view
- \`create_data_object\` - Create a new data object
- \`update_data_object\` - Update data object properties
- \`add_data_object_props\` - Add properties to a data object
- \`update_data_object_prop\` - Update a specific property
- \`get_data_object_usage\` - Get usage information for a data object
- \`list_pages\` - List all pages (forms and reports)`;
}

export function registerDataObjectTools(server: McpServer, tools: DataObjectTools): void {
    // Register list_roles tool
        server.registerTool('list_roles', {
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
            const result = await tools.list_roles();
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

    // Register add_role tool
        server.registerTool('add_role', {
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
            const result = await tools.add_role({ name });
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

    // Register update_role tool
        server.registerTool('update_role', {
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
            const result = await tools.update_role({ name, displayName, description, isActive });
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

    // Register add_lookup_value tool
        server.registerTool('add_lookup_value', {
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
            const result = await tools.add_lookup_value({ lookupObjectName, name, displayName, description, isActive });
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

    // Register list_lookup_values tool
        server.registerTool('list_lookup_values', {
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
            const result = await tools.list_lookup_values({ lookupObjectName, includeInactive });
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

    // Register update_lookup_value tool
        server.registerTool('update_lookup_value', {
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
            const result = await tools.update_lookup_value({ lookupObjectName, name, displayName, description, isActive });
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

    // Register get_lookup_value_schema tool
        server.registerTool('get_lookup_value_schema', {
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
            const result = await tools.get_lookup_value_schema();
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

    // Register get_data_object_summary_schema tool
        server.registerTool('get_data_object_summary_schema', {
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
            const result = await tools.get_data_object_summary_schema();
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

    // Register get_role_schema tool
        server.registerTool('get_role_schema', {
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
                    purpose: z.string(),
                    tools: z.array(z.string()),
                    genericAlternatives: z.array(z.string())
                }),
                commonRoles: z.array(z.any()),
                notes: z.array(z.string())
            }),
            note: z.string()
        }
    }, async () => {
        try {
            const result = await tools.get_role_schema();
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

    // Register list_data_object_summary tool
        server.registerTool('list_data_object_summary', {
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
            const result = await tools.list_data_object_summary({ search_name, is_lookup, parent_object_name });
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

    // Register list_data_objects tool
        server.registerTool('list_data_objects', {
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
            const result = await tools.list_data_objects({ search_name, is_lookup, parent_object_name });
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

    // Register get_data_object tool
        server.registerTool('get_data_object', {
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
            const result = await tools.get_data_object({ name });
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

    // Register get_data_object_schema tool
        server.registerTool('get_data_object_schema', {
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
            const result = await tools.get_data_object_schema();
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
    server.registerTool('create_data_object', {
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
            const result = await tools.create_data_object({ name, parentObjectName, isLookup, codeDescription });
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

    // Register update_data_object tool
    server.registerTool('update_data_object', {
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
            const result = await tools.update_data_object({ name, codeDescription });
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

    // Register add_data_object_props tool
    server.registerTool('add_data_object_props', {
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
            const result = await tools.add_data_object_props({ objectName, props });
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

    // Register update_data_object_prop tool
    server.registerTool('update_data_object_prop', {
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
            const result = await tools.update_data_object_prop(params);
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

    // Register get_data_object_usage tool
    server.registerTool('get_data_object_usage', {
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
            const result = await tools.get_data_object_usage({ dataObjectName });
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
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
    server.registerTool('list_pages', {
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
            const result = await tools.list_pages({ page_name, page_type, owner_object, target_child_object, role_required });
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
}

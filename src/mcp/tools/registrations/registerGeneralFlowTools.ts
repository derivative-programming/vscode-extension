// registerGeneralFlowTools.ts
// MCP tool registrations for general flow operations
// Extracted from server.ts on: November 23, 2025

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GeneralFlowTools } from '../generalFlowTools.js';

/**
 * Get list of tool names for chatmode YAML
 */
export function getToolNames(): string[] {
    return [
        'get_general_flow_schema',
        'list_general_flows',
        'get_general_flow',
        'update_general_flow',
        'update_full_general_flow',
        'add_general_flow_param',
        'update_general_flow_param',
        'move_general_flow_param',
        'add_general_flow_output_var',
        'update_general_flow_output_var',
        'move_general_flow_output_var'
    ];
}

/**
 * Generate chatmode documentation for general flow tools
 */
export function generateChatmodeDocumentation(): string {
    return `**General Flow Tools (9 tools):**

*Flow Operations:*
- \`get_general_flow_schema\` - Get schema definition for general flows
- \`get_general_flow\` - Get complete details of a specific general flow
- \`update_general_flow\` - Update general flow properties
- \`list_general_flows\` - List all general flows

*Flow Parameters (Inputs):*
- \`add_general_flow_param\` - Add an input parameter to a general flow
- \`update_general_flow_param\` - Update parameter properties
- \`move_general_flow_param\` - Change the display order of a parameter

*Flow Output Variables:*
- \`add_general_flow_output_var\` - Add an output variable to a general flow
- \`update_general_flow_output_var\` - Update output variable properties
- \`move_general_flow_output_var\` - Change the display order of an output variable`;
}

export function registerGeneralFlowTools(server: McpServer, tools: GeneralFlowTools): void {
    // Register get_general_flow_schema tool
        server.registerTool('get_general_flow_schema', {
        title: 'Get General Flow Schema',
        description: 'Get the schema definition for complete general flow structure (general objectWorkflow). General flows are reusable business logic workflows that can be called from multiple places. Includes all general flow properties (name, roleRequired, isExposedInBusinessObject, etc.), input parameter structure (objectWorkflowParam), output variable structure (objectWorkflowOutputVar), validation rules, SQL data types, and examples of complete general flows with all components.',
        inputSchema: {},
        outputSchema: {
            success: z.boolean(),
            schema: z.any(),
            note: z.string().optional()
        }
    }, async () => {
        try {
            const result = await tools.get_general_flow_schema();
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



    // Register get_general_flow tool
        server.registerTool('get_general_flow', {
        title: 'Get General Flow',
        description: 'Get complete details of a specific general flow by name. If owner_object_name is provided, searches only that object; otherwise searches all objects. Returns the full general flow structure including all input parameters (objectWorkflowParam), output variables (objectWorkflowOutputVar), and element counts. General flows are reusable business logic workflows. General flow name matching is case-insensitive.',
        inputSchema: {
            general_flow_name: z.string().describe('The name of the general flow to retrieve (case-insensitive matching)'),
            owner_object_name: z.string().optional().describe('Optional: The name of the owner data object that contains the general flow (case-insensitive matching). If not provided, all objects will be searched.')
        },
        outputSchema: {
            success: z.boolean(),
            general_flow: z.any().optional().describe('Complete general flow object with all properties and arrays'),
            owner_object_name: z.string().optional(),
            element_counts: z.object({
                paramCount: z.number(),
                outputVarCount: z.number(),
                totalElements: z.number()
            }).optional(),
            note: z.string().optional(),
            error: z.string().optional(),
            validationErrors: z.array(z.string()).optional()
        }
    }, async ({ owner_object_name, general_flow_name }) => {
        try {
            const result = await tools.get_general_flow({ owner_object_name, general_flow_name });
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

    // Register update_general_flow tool
        server.registerTool('update_general_flow', {
        title: 'Update General Flow',
        description: 'Update properties of an existing general flow. Requires exact case-sensitive general flow name. Updates are made in-memory and model will have unsaved changes after update. General flows are reusable business logic workflows. At least one property to update must be provided. Properties align with general flow schema.',
        inputSchema: {
            general_flow_name: z.string().describe('The name of the general flow to update (case-sensitive, exact match required)'),
            updates: z.object({
                isAuthorizationRequired: z.enum(['true', 'false']).optional().describe('Does this general flow require user authorization to execute? String "true" or "false".'),
                roleRequired: z.string().optional().describe('Name of the role required to execute this general flow. Should match a role name from the Role lookup object.'),
                isExposedInBusinessObject: z.enum(['true', 'false']).optional().describe('Is this general flow exposed in the business object API? String "true" or "false".'),
                isCustomLogicOverwritten: z.enum(['true', 'false']).optional().describe('Has the auto-generated logic been overwritten with custom code? String "true" or "false".'),
                isIgnored: z.enum(['true', 'false']).optional().describe('Whether the general flow is ignored (soft delete). String "true" or "false".')
            }).describe('Object containing properties to update. At least one property must be provided. All properties align with general flow schema.')
        },
        outputSchema: {
            success: z.boolean(),
            general_flow: z.any().optional().describe('Updated general flow object with all properties'),
            owner_object_name: z.string().optional().describe('Name of the data object that owns the general flow'),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional()
        }
    }, async ({ general_flow_name, updates }) => {
        try {
            const result = await tools.update_general_flow(general_flow_name as string, updates);
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

    // Register list_general_flows tool
        server.registerTool('list_general_flows', {
        title: 'List General Flows',
        description: 'List all general flows from the model with optional filtering. General flows are reusable business logic workflows (objectWorkflow with isPage="false", not DynaFlow tasks, not init flows). Returns summary data: name, ownerObject, roleRequired, paramCount, outputVarCount. Use get_general_flow for complete details. Supports filtering by general flow name (exact match) or owner object name (exact match). All name matching is case-insensitive.',
        inputSchema: {
            general_flow_name: z.string().optional().describe('Optional: Filter by general flow name (case-insensitive, exact match)'),
            owner_object: z.string().optional().describe('Optional: Filter by owner data object name (case-insensitive, exact match)')
        },
        outputSchema: {
            success: z.boolean(),
            general_flows: z.array(z.object({
                name: z.string(),
                ownerObject: z.string(),
                roleRequired: z.string(),
                paramCount: z.number(),
                outputVarCount: z.number()
            })).optional().describe('Array of general flow summary objects'),
            count: z.number().optional().describe('Total number of general flows returned'),
            filters: z.object({
                general_flow_name: z.string().nullable(),
                owner_object: z.string().nullable()
            }).optional(),
            note: z.string().optional(),
            error: z.string().optional()
        }
    }, async ({ general_flow_name, owner_object }) => {
        try {
            const result = await tools.list_general_flows({ general_flow_name, owner_object });
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

    // Register add_general_flow_output_var tool
        server.registerTool('add_general_flow_output_var', {
        title: 'Add General Flow Output Variable',
        description: 'Add a new output variable to an existing general flow. Output variables display results/data after general flow execution. Requires exact case-sensitive general flow name. Updates are made in-memory and model will have unsaved changes after adding.',
        inputSchema: {
            general_flow_name: z.string().describe('The name of the general flow to add the output variable to (case-sensitive, exact match required)'),
            output_var: z.object({
                name: z.string().describe('The name of the output variable (required, typically PascalCase without spaces)'),
                dataSize: z.string().optional().describe('Data size for the output variable (e.g., "50", "MAX"). Maps to sqlServerDBDataTypeSize.'),
                dataType: z.string().optional().describe('SQL Server data type for the output variable (e.g., "nvarchar", "int", "datetime"). Maps to sqlServerDBDataType.'),
                isIgnored: z.enum(['true', 'false']).optional().describe('Whether the output variable is ignored (soft delete)'),
                sourceObjectName: z.string().optional().describe('Source object name for the output variable value'),
                sourcePropertyName: z.string().optional().describe('Source property name for the output variable value')
            }).describe('The output variable object to add')
        },
        outputSchema: {
            success: z.boolean(),
            output_var: z.any().optional().describe('The added output variable object'),
            general_flow_name: z.string().optional(),
            owner_object_name: z.string().optional().describe('Name of the data object that owns the general flow'),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional()
        }
    }, async ({ general_flow_name, output_var }) => {
        try {
            const result = await tools.add_general_flow_output_var(general_flow_name as string, output_var as any);
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

    // Register update_general_flow_output_var tool
        server.registerTool('update_general_flow_output_var', {
        title: 'Update General Flow Output Variable',
        description: 'Update properties of an existing output variable in a general flow. Requires exact case-sensitive general flow name and output variable name. At least one property to update must be provided. Updates are made in-memory and model will have unsaved changes after update.',
        inputSchema: {
            general_flow_name: z.string().describe('The name of the general flow containing the output variable (case-sensitive, exact match required)'),
            output_var_name: z.string().describe('The current name of the output variable to update (case-sensitive, exact match required, used to identify the output variable)'),
            updates: z.object({
                name: z.string().optional().describe('New name for the output variable (PascalCase without spaces)'),
                dataSize: z.string().optional().describe('Data size for the output variable (e.g., "50", "MAX"). Maps to sqlServerDBDataTypeSize.'),
                dataType: z.string().optional().describe('SQL Server data type for the output variable (e.g., "nvarchar", "int", "datetime"). Maps to sqlServerDBDataType.'),
                isIgnored: z.enum(['true', 'false']).optional().describe('Whether the output variable is ignored (soft delete)'),
                sourceObjectName: z.string().optional().describe('Source object name for the output variable value'),
                sourcePropertyName: z.string().optional().describe('Source property name for the output variable value')
            }).describe('Object containing properties to update. At least one property must be provided.')
        },
        outputSchema: {
            success: z.boolean(),
            output_var: z.any().optional().describe('The updated output variable object'),
            general_flow_name: z.string().optional(),
            owner_object_name: z.string().optional().describe('Name of the data object that owns the general flow'),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional()
        }
    }, async ({ general_flow_name, output_var_name, updates }) => {
        try {
            const result = await tools.update_general_flow_output_var(general_flow_name as string, output_var_name as string, updates);
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

    // Register move_general_flow_output_var tool
        server.registerTool('move_general_flow_output_var', {
        title: 'Move General Flow Output Variable',
        description: 'Move an output variable to a new position in a general flow to change the display order. Position is 0-based index (0 = first position). Must be less than total output variable count. Updates are made in-memory and model will have unsaved changes after move.',
        inputSchema: {
            general_flow_name: z.string().describe('The name of the general flow containing the output variable (case-sensitive, exact match required)'),
            output_var_name: z.string().describe('The name of the output variable to move (case-sensitive, exact match required)'),
            new_position: z.number().describe('The new 0-based index position for the output variable (must be less than total output variable count)')
        },
        outputSchema: {
            success: z.boolean(),
            general_flow_name: z.string().optional(),
            owner_object_name: z.string().optional().describe('Name of the data object that owns the general flow'),
            output_var_name: z.string().optional(),
            old_position: z.number().optional().describe('The previous position of the output variable'),
            new_position: z.number().optional().describe('The new position of the output variable'),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional()
        }
    }, async ({ general_flow_name, output_var_name, new_position }) => {
        try {
            const result = await tools.move_general_flow_output_var(general_flow_name as string, output_var_name as string, new_position as number);
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

    // Register add_general_flow_param tool
        server.registerTool('add_general_flow_param', {
        title: 'Add General Flow Parameter',
        description: 'Add a new parameter (input parameter) to an existing general flow. General flows are reusable workflows with isPage="false", excluding DynaFlows and init flows. Parameters support basic data type configuration only. Returns success status with parameter details.',
        inputSchema: {
            general_flow_name: z.string().describe('Name of the general flow to add the parameter to (case-sensitive, exact match required)'),
            param: z.object({
                name: z.string().describe('Name of the parameter (required, PascalCase). Must be unique within the general flow.'),
                dataType: z.string().optional().describe('SQL Server data type (e.g., "Int", "NVarChar", "Decimal", "DateTime", "Bit"). Maps to sqlServerDBDataType.'),
                dataSize: z.string().optional().describe('Size specification for the data type (e.g., "50", "100", "18,2", "MAX"). Maps to sqlServerDBDataTypeSize.'),
                codeDescription: z.string().optional().describe('Code description for the parameter'),
                isIgnored: z.enum(['true', 'false']).optional().describe('Should this parameter be ignored during code generation? ("true" or "false")')
            }).describe('The parameter object to add. Only name is required; all other properties are optional.')
        }
    }, async ({ general_flow_name, param }: { general_flow_name: string; param: any }) => {
        try {
            const result = await tools.add_general_flow_param(general_flow_name, param);
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

    // Register update_general_flow_param tool
        server.registerTool('update_general_flow_param', {
        title: 'Update General Flow Parameter',
        description: 'Update properties of an existing parameter in a general flow. Can update name, data type, data size, code description, and isIgnored flag. General flows are reusable workflows with isPage="false", excluding DynaFlows and init flows. Returns success status with updated parameter details.',
        inputSchema: {
            general_flow_name: z.string().describe('Name of the general flow containing the parameter (case-sensitive, exact match required)'),
            param_name: z.string().describe('Name of the parameter to update (case-sensitive, exact match required)'),
            updates: z.object({
                name: z.string().optional().describe('New name for the parameter (PascalCase, must be unique within the general flow)'),
                dataType: z.string().optional().describe('SQL Server data type (e.g., "Int", "NVarChar", "Decimal", "DateTime", "Bit"). Maps to sqlServerDBDataType.'),
                dataSize: z.string().optional().describe('Size specification for the data type (e.g., "50", "100", "18,2", "MAX"). Maps to sqlServerDBDataTypeSize.'),
                codeDescription: z.string().optional().describe('Code description for the parameter'),
                isIgnored: z.enum(['true', 'false']).optional().describe('Should this parameter be ignored during code generation? ("true" or "false")')
            }).describe('Object containing the properties to update. At least one property must be provided.')
        }
    }, async ({ general_flow_name, param_name, updates }: { general_flow_name: string; param_name: string; updates: any }) => {
        try {
            const result = await tools.update_general_flow_param(general_flow_name, param_name, updates);
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

    // Register move_general_flow_param tool
        server.registerTool('move_general_flow_param', {
        title: 'Move General Flow Parameter',
        description: 'Move a parameter to a new position within a general flow. The position is 0-based (0 is first position). Useful for reordering parameters to match desired display order. General flows are reusable workflows with isPage="false", excluding DynaFlows and init flows. Returns success status with old and new positions.',
        inputSchema: {
            general_flow_name: z.string().describe('Name of the general flow containing the parameter (case-sensitive, exact match required)'),
            param_name: z.string().describe('Name of the parameter to move (case-sensitive, exact match required)'),
            new_position: z.number().describe('New 0-based index position for the parameter. Must be less than the total parameter count. 0 = first position.')
        }
    }, async ({ general_flow_name, param_name, new_position }: { general_flow_name: string; param_name: string; new_position: number }) => {
        try {
            const result = await tools.move_general_flow_param(general_flow_name, param_name, new_position);
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

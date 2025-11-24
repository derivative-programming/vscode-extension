// registerPageInitTools.ts
// MCP tool registrations for page initialization operations
// Extracted from server.ts on: November 23, 2025

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PageInitTools } from '../pageInitTools.js';

/**
 * Get list of tool names for chatmode YAML
 */
export function getToolNames(): string[] {
    return [
        'get_page_init_flow_schema',
        'get_page_init_flow',
        'update_page_init_flow',
        'update_full_page_init_flow',
        'add_page_init_flow_output_var',
        'update_page_init_flow_output_var',
        'move_page_init_flow_output_var'
    ];
}

/**
 * Generate chatmode documentation for page init flow tools
 */
export function generateChatmodeDocumentation(): string {
    return `**Page Init Flow Tools (6 tools):**

*Flow Operations:*
- \`get_page_init_flow_schema\` - Get schema definition for page init flows
- \`get_page_init_flow\` - Get complete details of a specific page init flow
- \`update_page_init_flow\` - Update page init flow properties

*Output Variables:*
- \`add_page_init_flow_output_var\` - Add an output variable to a page init flow
- \`update_page_init_flow_output_var\` - Update output variable properties
- \`move_page_init_flow_output_var\` - Change the display order of an output variable`;
}

export function registerPageInitTools(server: McpServer, tools: PageInitTools): void {
    // Register get_page_init_flow_schema tool
        server.registerTool('get_page_init_flow_schema', {
        title: 'Get Page Init Flow Schema',
        description: 'Get the schema definition for page init flow structure (objectWorkflow for page initialization). Includes all page init flow properties (name, isAuthorizationRequired, roleRequired, pageTitleText, etc.), output variable structure (objectWorkflowOutputVar), validation rules, SQL data types, and examples of complete page init flows. Page init flows prepare data before page display and typically have output variables but no parameters or buttons.',
        inputSchema: {},
        outputSchema: {
            success: z.boolean(),
            schema: z.any(),
            note: z.string().optional()
        }
    }, async () => {
        try {
            const result = await tools.get_page_init_flow_schema();
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

    // Register get_page_init_flow tool
        server.registerTool('get_page_init_flow', {
        title: 'Get Page Init Flow',
        description: 'Get complete details of a specific page init flow by name. If owner_object_name is provided, searches only that object; otherwise searches all objects. Returns the full page init flow structure including all output variables (objectWorkflowOutputVar) and element counts. Page init flow name matching is case-insensitive. Page init flows are identified by names ending in "InitObjWF" or "InitReport".',
        inputSchema: {
            page_init_flow_name: z.string().describe('The name of the page init flow to retrieve (case-insensitive matching, must end with "InitObjWF" or "InitReport")'),
            owner_object_name: z.string().optional().describe('Optional: The name of the owner data object that contains the page init flow (case-insensitive matching). If not provided, all objects will be searched.')
        },
        outputSchema: {
            success: z.boolean(),
            page_init_flow: z.any().optional().describe('Complete page init flow object with all properties and output variables'),
            owner_object_name: z.string().optional().describe('Name of the owner data object containing the page init flow'),
            element_counts: z.object({
                outputVarCount: z.number()
            }).optional().describe('Count of output variables in the page init flow'),
            note: z.string().optional(),
            error: z.string().optional(),
            validationErrors: z.array(z.string()).optional()
        }
    }, async ({ page_init_flow_name, owner_object_name }) => {
        try {
            const result = await tools.get_page_init_flow({
                page_init_flow_name,
                owner_object_name
            });
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

    // Register update_page_init_flow tool
        server.registerTool('update_page_init_flow', {
        title: 'Update Page Init Flow',
        description: 'Update properties of an existing page init flow (objectWorkflow ending in InitObjWF or InitReport) in the AppDNA model. Page init flow name must match exactly (case-sensitive). At least one property to update is required. Updates only the specified properties shown in the Page Init Details View Settings tab, leaving others unchanged. Searches all data objects to find the page init flow.',
        inputSchema: {
            page_init_flow_name: z.string().describe('The name of the page init flow to update (required, case-sensitive exact match, must end with "InitObjWF" or "InitReport")'),
            isAuthorizationRequired: z.enum(['true', 'false']).optional().describe('Whether authorization is required to run this page init flow'),
            isCustomLogicOverwritten: z.enum(['true', 'false']).optional().describe('Whether custom logic overwrites default behavior'),
            roleRequired: z.string().optional().describe('Role name required to access this page init flow (must be a valid role in the model)')
        },
        outputSchema: {
            success: z.boolean(),
            page_init_flow: z.any().optional(),
            owner_object_name: z.string().optional(),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional()
        }
    }, async ({ page_init_flow_name, isAuthorizationRequired, isCustomLogicOverwritten, roleRequired }) => {
        try {
        // Build updates object with only provided properties
            const updates: any = {};
            if (isAuthorizationRequired !== undefined) { updates.isAuthorizationRequired = isAuthorizationRequired; }
            if (isCustomLogicOverwritten !== undefined) { updates.isCustomLogicOverwritten = isCustomLogicOverwritten; }
            if (roleRequired !== undefined) { updates.roleRequired = roleRequired; }

            const result = await tools.update_page_init_flow(page_init_flow_name, updates);
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

    // Register add_page_init_flow_output_var tool
        server.registerTool('add_page_init_flow_output_var', {
        title: 'Add Page Init Flow Output Variable',
        description: 'Add a new output variable to an existing page init flow (objectWorkflow ending in InitObjWF or InitReport) in the AppDNA model. Page init flow name must match exactly (case-sensitive). The output variable name is required. All other properties are optional and will only be included if provided. Searches all data objects to find the page init flow. After adding, the model will have unsaved changes. NOTE: The properties defaultValue, fKObjectName, isFK, and isFKLookup are NOT supported for page init flow output variables and will be rejected.',
        inputSchema: {
            page_init_flow_name: z.string().describe('The name of the page init flow to add the output variable to (required, case-sensitive exact match, must end with "InitObjWF" or "InitReport")'),
            name: z.string().describe('The name of the output variable (required)'),
            sqlServerDBDataType: z.string().optional().describe('SQL Server data type for the output variable (e.g., "nvarchar", "int", "bit", "datetime")'),
            sqlServerDBDataTypeSize: z.string().optional().describe('Size of the SQL Server data type (e.g., "50", "MAX")'),
            labelText: z.string().optional().describe('Label text to display for this output variable'),
            isLabelVisible: z.enum(['true', 'false']).optional().describe('Whether the label should be visible'),
            isLink: z.enum(['true', 'false']).optional().describe('Whether this output variable is a link'),
            isAutoRedirectURL: z.enum(['true', 'false']).optional().describe('Whether to auto-redirect to the URL'),
            conditionalVisiblePropertyName: z.string().optional().describe('Property name that controls conditional visibility'),
            isVisible: z.enum(['true', 'false']).optional().describe('Whether the output variable is visible'),
            isHeaderText: z.enum(['true', 'false']).optional().describe('Whether this is header text'),
            isIgnored: z.enum(['true', 'false']).optional().describe('Whether this output variable should be ignored'),
            sourceObjectName: z.string().optional().describe('Source object name for this output variable'),
            sourcePropertyName: z.string().optional().describe('Source property name for this output variable')
        },
        outputSchema: {
            success: z.boolean(),
            output_var: z.any().optional(),
            page_init_flow_name: z.string().optional(),
            owner_object_name: z.string().optional(),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional()
        }
    }, async ({ page_init_flow_name, name, sqlServerDBDataType, sqlServerDBDataTypeSize, labelText, isLabelVisible, isLink, isAutoRedirectURL, conditionalVisiblePropertyName, isVisible, isHeaderText, isIgnored, sourceObjectName, sourcePropertyName }) => {
        try {
        // Build output_var object with only provided properties
            const output_var: any = { name };
            if (sqlServerDBDataType !== undefined) { output_var.sqlServerDBDataType = sqlServerDBDataType; }
            if (sqlServerDBDataTypeSize !== undefined) { output_var.sqlServerDBDataTypeSize = sqlServerDBDataTypeSize; }
            if (labelText !== undefined) { output_var.labelText = labelText; }
            if (isLabelVisible !== undefined) { output_var.isLabelVisible = isLabelVisible; }
            if (isLink !== undefined) { output_var.isLink = isLink; }
            if (isAutoRedirectURL !== undefined) { output_var.isAutoRedirectURL = isAutoRedirectURL; }
            if (conditionalVisiblePropertyName !== undefined) { output_var.conditionalVisiblePropertyName = conditionalVisiblePropertyName; }
            if (isVisible !== undefined) { output_var.isVisible = isVisible; }
            if (isHeaderText !== undefined) { output_var.isHeaderText = isHeaderText; }
            if (isIgnored !== undefined) { output_var.isIgnored = isIgnored; }
            if (sourceObjectName !== undefined) { output_var.sourceObjectName = sourceObjectName; }
            if (sourcePropertyName !== undefined) { output_var.sourcePropertyName = sourcePropertyName; }

            const result = await tools.add_page_init_flow_output_var(page_init_flow_name, output_var);
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

    // Register update_page_init_flow_output_var tool
        server.registerTool('update_page_init_flow_output_var', {
        title: 'Update Page Init Flow Output Variable',
        description: 'Update properties of an existing output variable in a page init flow (objectWorkflow ending in InitObjWF or InitReport). Page init flow name and output variable name are case-sensitive exact matches. At least one property to update is required. Updates only the specified properties, leaving others unchanged. NOTE: The properties defaultValue, fKObjectName, isFK, and isFKLookup are NOT supported for page init flow output variables and will be rejected.',
        inputSchema: {
            page_init_flow_name: z.string().describe('Name of the page init flow containing the output variable (required, case-sensitive exact match, must end with "InitObjWF" or "InitReport")'),
            output_var_name: z.string().describe('Current name of the output variable to update (required, case-sensitive exact match, used to identify the output variable)'),
            name: z.string().optional().describe('New name for the output variable (optional, allows renaming)'),
            sqlServerDBDataType: z.string().optional().describe('New SQL Server data type (e.g., "nvarchar", "int", "bit", "datetime")'),
            sqlServerDBDataTypeSize: z.string().optional().describe('New size of the SQL Server data type (e.g., "50", "MAX")'),
            labelText: z.string().optional().describe('New label text to display'),
            isLabelVisible: z.enum(['true', 'false']).optional().describe('New label visibility setting'),
            isLink: z.enum(['true', 'false']).optional().describe('New link setting'),
            isAutoRedirectURL: z.enum(['true', 'false']).optional().describe('New auto-redirect setting'),
            conditionalVisiblePropertyName: z.string().optional().describe('New property name that controls conditional visibility'),
            isVisible: z.enum(['true', 'false']).optional().describe('New visibility setting'),
            isHeaderText: z.enum(['true', 'false']).optional().describe('New header text setting'),
            isIgnored: z.enum(['true', 'false']).optional().describe('New ignored setting'),
            sourceObjectName: z.string().optional().describe('New source object name'),
            sourcePropertyName: z.string().optional().describe('New source property name')
        },
        outputSchema: {
            success: z.boolean(),
            output_var: z.any().optional(),
            page_init_flow_name: z.string().optional(),
            owner_object_name: z.string().optional(),
            message: z.string().optional(),
            error: z.string().optional()
        }
    }, async (args: Record<string, unknown>) => {
        try {
            const { page_init_flow_name, output_var_name, ...updates } = args;
            
            const result = await tools.update_page_init_flow_output_var(
                page_init_flow_name as string, 
                output_var_name as string, 
                updates
            );
            
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

    // Register move_page_init_flow_output_var tool
        server.registerTool('move_page_init_flow_output_var', {
        title: 'Move Page Init Flow Output Variable',
        description: 'Move a page init flow output variable to a new position in the output variable list. Changes the display order of output variables on the page init flow. Page init flow name and output variable name must match exactly (case-sensitive). Position is 0-based index (0 = first position). Page init flow must end with "InitObjWF" or "InitReport".',
        inputSchema: {
            page_init_flow_name: z.string().describe('The name of the page init flow containing the output variable (required, case-sensitive exact match, must end with "InitObjWF" or "InitReport")'),
            output_var_name: z.string().describe('The name of the output variable to move (required, case-sensitive exact match)'),
            new_position: z.number().min(0).describe('The new 0-based index position for the output variable (0 = first position). Must be less than the total output variable count.')
        },
        outputSchema: {
            success: z.boolean(),
            page_init_flow_name: z.string().optional(),
            owner_object_name: z.string().optional(),
            output_var_name: z.string().optional(),
            old_position: z.number().optional(),
            new_position: z.number().optional(),
            output_var_count: z.number().optional(),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional()
        }
    }, async ({ page_init_flow_name, output_var_name, new_position }) => {
        try {
            const result = await tools.move_page_init_flow_output_var(page_init_flow_name, output_var_name, new_position);
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

    // ===== WORKFLOW TOOLS =====

}

// registerReportTools.ts
// MCP tool registrations for report operations
// Extracted from server.ts on: November 23, 2025

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ReportTools } from '../reportTools.js';

/**
 * Get list of tool names for chatmode YAML
 */
export function getToolNames(): string[] {
    return [
        'get_report_schema',
        'get_report',
        'suggest_report_name_and_title',
        'create_report',
        'update_report',
        'add_report_param',
        'update_report_param',
        'move_report_param',
        'add_report_column',
        'update_report_column',
        'move_report_column',
        'add_report_button',
        'update_report_button',
        'move_report_button'
    ];
}

/**
 * Generate chatmode documentation for report tools
 */
export function generateChatmodeDocumentation(): string {
    return `**Report Tools (13 tools):**

*Report Operations:*
- \`get_report_schema\` - Get schema definition for report structure
- \`get_report\` - Get complete details of a specific report
- \`suggest_report_name_and_title\` - Get AI suggestions for report name and title
- \`create_report\` - Create a new report
- \`update_report\` - Update report properties

*Report Parameters (Input Controls):*
- \`add_report_param\` - Add a filter/parameter to a report
- \`update_report_param\` - Update report parameter properties
- \`move_report_param\` - Change the display order of a parameter

*Report Columns:*
- \`add_report_column\` - Add a column to a report
- \`update_report_column\` - Update column properties
- \`move_report_column\` - Change the display order of a column

*Report Buttons:*
- \`add_report_button\` - Add a button to a report
- \`update_report_button\` - Update button properties
- \`move_report_button\` - Change the display order of a button`;
}

export function registerReportTools(server: McpServer, tools: ReportTools): void {
    // Register get_report_schema tool
        server.registerTool('get_report_schema', {
        title: 'Get Report Schema',
        description: 'Get the schema definition for complete report structure. Includes all report properties (name, titleText, visualizationType, targetChildObject, etc.), filter parameter structure (reportParam), column structure (reportColumn), button structure (reportButton), validation rules, SQL data types, and examples of complete reports with all components.',
        inputSchema: {},
        outputSchema: {
            success: z.boolean(),
            schema: z.any(),
            note: z.string().optional()
        }
    }, async () => {
        try {
            const result = await tools.get_report_schema();
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

    // Register get_report tool
        server.registerTool('get_report', {
        title: 'Get Report',
        description: 'Get complete details of a specific report by name. If owner_object_name is provided, searches only that object; otherwise searches all objects. Returns the full report structure including all filter parameters (reportParam), columns (reportColumn), buttons (reportButton), and element counts. Report name matching is case-insensitive.',
        inputSchema: {
            report_name: z.string().describe('The name of the report to retrieve (case-insensitive matching)'),
            owner_object_name: z.string().optional().describe('Optional: The name of the owner data object that contains the report (case-insensitive matching). If not provided, all objects will be searched.')
        },
        outputSchema: {
            success: z.boolean(),
            report: z.any().optional().describe('Complete report object with all properties and arrays'),
            owner_object_name: z.string().optional(),
            element_counts: z.object({
                paramCount: z.number(),
                columnCount: z.number(),
                buttonCount: z.number(),
                totalElements: z.number()
            }).optional(),
            note: z.string().optional(),
            error: z.string().optional(),
            validationErrors: z.array(z.string()).optional()
        }
    }, async ({ owner_object_name, report_name }) => {
        try {
            const result = await tools.get_report({ owner_object_name, report_name });
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

    // Register suggest_report_name_and_title tool
        server.registerTool('suggest_report_name_and_title', {
        title: 'Suggest Report Name and Title',
        description: 'Generate suggested report name (PascalCase) and title (human-readable) based on context: owner object, role, visualization type, and target child object. Useful before creating a report to get naming recommendations that follow conventions.',
        inputSchema: {
            owner_object_name: z.string().describe('The name of the owner data object (required, case-sensitive exact match)'),
            role_required: z.string().optional().describe('Optional: Role required to access the report (case-sensitive)'),
            visualization_type: z.enum(['Grid', 'PieChart', 'LineChart', 'FlowChart', 'CardView', 'FolderView']).optional().describe('Optional: Visualization type. Defaults to Grid if not provided.'),
            target_child_object: z.string().optional().describe('Optional: Target child object when report displays list of items (case-sensitive). Commonly used with Grid visualization type.')
        },
        outputSchema: {
            success: z.boolean(),
            suggestions: z.object({
                report_name: z.string(),
                title_text: z.string()
            }).optional(),
            context: z.object({
                owner_object_name: z.string(),
                role_required: z.string().nullable(),
                visualization_type: z.string(),
                target_child_object: z.string().nullable()
            }).optional(),
            note: z.string().optional(),
            error: z.string().optional(),
            validationErrors: z.array(z.string()).optional()
        }
    }, async ({ owner_object_name, role_required, visualization_type, target_child_object }) => {
        try {
            const result = await tools.suggest_report_name_and_title({ owner_object_name, role_required, visualization_type, target_child_object });
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

    // Register create_report tool
        server.registerTool('create_report', {
        title: 'Create Report',
        description: 'Create a new report in a data object with automatic page init flow creation. Report name must be unique (case-insensitive) across all objects and in PascalCase format. Automatically creates Back button. Owner object name must match exactly (case-sensitive). TIP: Use suggest_report_name_and_title tool first to get recommended report name and title based on your context (owner object, role, visualization type, target child object).',
        inputSchema: {
            owner_object_name: z.string().describe('The name of the owner data object (required, case-sensitive exact match)'),
            report_name: z.string().describe('The name of the report (required, PascalCase, must be unique case-insensitive across all objects)'),
            title_text: z.string().describe('The title displayed on the report (required, max 100 characters)'),
            visualization_type: z.enum(['Grid', 'PieChart', 'LineChart', 'FlowChart', 'CardView', 'FolderView']).optional().describe('Optional: Visualization type. Defaults to Grid if not provided.'),
            role_required: z.string().optional().describe('Optional: Role required to access the report (case-sensitive). Auto-sets isAuthorizationRequired="true" and layoutName="{role}Layout"'),
            target_child_object: z.string().optional().describe('Optional: Target child object when report displays list of items (case-sensitive exact match)')
        },
        outputSchema: {
            success: z.boolean(),
            report: z.any().optional(),
            page_init_flow: z.any().optional(),
            owner_object_name: z.string().optional(),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional(),
            validationErrors: z.array(z.string()).optional()
        }
    }, async ({ owner_object_name, report_name, title_text, visualization_type, role_required, target_child_object }) => {
        try {
            const result = await tools.create_report({ owner_object_name, report_name, title_text, visualization_type, role_required, target_child_object });
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

    // Register update_report tool
        server.registerTool('update_report', {
        title: 'Update Report',
        description: 'Update properties of an existing report in the AppDNA model. Report name must match exactly (case-sensitive). At least one property to update is required. Updates only the specified properties, leaving others unchanged. Searches all data objects to find the report.',
        inputSchema: {
            report_name: z.string().describe('Name of the report to update (case-sensitive exact match)'),
            titleText: z.string().optional(),
            visualizationType: z.enum(['Grid', 'PieChart', 'LineChart', 'FlowChart', 'CardView', 'FolderView']).optional(),
            introText: z.string().optional(),
            layoutName: z.string().optional(),
            codeDescription: z.string().optional(),
            isCachingAllowed: z.enum(['true', 'false']).optional(),
            cacheExpirationInMinutes: z.string().optional(),
            isPagingAvailable: z.enum(['true', 'false']).optional(),
            defaultPageSize: z.string().optional(),
            isFilterSectionHidden: z.enum(['true', 'false']).optional(),
            isFilterSectionCollapsable: z.enum(['true', 'false']).optional(),
            isRefreshButtonHidden: z.enum(['true', 'false']).optional(),
            isExportButtonsHidden: z.enum(['true', 'false']).optional(),
            isAutoRefresh: z.enum(['true', 'false']).optional(),
            autoRefreshFrequencyInMinutes: z.string().optional(),
            defaultOrderByColumnName: z.string().optional(),
            defaultOrderByDescending: z.enum(['true', 'false']).optional(),
            isHeaderVisible: z.enum(['true', 'false']).optional(),
            isHeaderLabelsVisible: z.enum(['true', 'false']).optional(),
            noRowsReturnedText: z.string().optional(),
            isAuthorizationRequired: z.enum(['true', 'false']).optional()
        },
        outputSchema: {
            success: z.boolean(),
            report: z.any().optional(),
            owner_object_name: z.string().optional(),
            message: z.string().optional(),
            error: z.string().optional(),
            note: z.string().optional()
        }
    }, async (args: Record<string, unknown>) => {
        try {
            const { report_name, ...updates } = args;
            const result = await tools.update_report(report_name as string, updates);
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

    // Register add_report_param tool
        server.registerTool('add_report_param', {
        title: 'Add Report Parameter',
        description: 'Add a new filter parameter (input control) to an existing report. Parameters allow users to filter report data. Report name must match exactly (case-sensitive). Parameter names must be unique within the report and in PascalCase format.',
        inputSchema: {
            report_name: z.string().describe('Name of the report (case-sensitive exact match)'),
            name: z.string().describe('Parameter name (required, PascalCase)'),
            sqlServerDBDataType: z.enum(['nvarchar', 'bit', 'datetime', 'int', 'uniqueidentifier', 'money', 'bigint', 'float', 'decimal', 'date', 'varchar', 'text']).optional().describe('SQL Server data type for this parameter'),
            sqlServerDBDataTypeSize: z.string().optional().describe('Size of data type (for nvarchar, varchar, decimal)'),
            labelText: z.string().optional().describe('Human-readable label text displayed for this field'),
            targetColumnName: z.string().optional().describe('Target column name in the report data source'),
            isFK: z.enum(['true', 'false']).optional().describe('Is this parameter a foreign key?'),
            fKObjectName: z.string().optional().describe('Name of the foreign key object target (data object name, case-sensitive)'),
            isFKLookup: z.enum(['true', 'false']).optional().describe('Is this parameter a foreign key to a lookup object?'),
            isFKList: z.enum(['true', 'false']).optional().describe('Should a dropdown list be shown for this FK?'),
            isFKListInactiveIncluded: z.enum(['true', 'false']).optional().describe('Should inactive items be included in the FK dropdown list?'),
            fKListOrderBy: z.enum(['NameDesc', 'NameAsc', 'DisplayOrderDesc', 'DisplayOrderAsc']).optional().describe('Sort order for FK dropdown list'),
            isFKListSearchable: z.enum(['true', 'false']).optional().describe('Should the FK dropdown list be searchable?'),
            isUnknownLookupAllowed: z.enum(['true', 'false']).optional().describe('Should "Unknown" option be allowed in lookup?'),
            defaultValue: z.string().optional().describe('Default value for this parameter'),
            isVisible: z.enum(['true', 'false']).optional().describe('Is this parameter visible on the report?'),
            codeDescription: z.string().optional().describe('Code description for documentation')
        },
        outputSchema: {
            success: z.boolean(),
            param: z.any().optional(),
            report_name: z.string().optional(),
            owner_object_name: z.string().optional(),
            message: z.string().optional(),
            error: z.string().optional(),
            note: z.string().optional()
        }
    }, async (args: Record<string, unknown>) => {
        try {
            const { report_name, ...param } = args;
            const result = await tools.add_report_param(report_name as string, param as any);
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

    // Register update_report_param tool
        server.registerTool('update_report_param', {
        title: 'Update Report Parameter',
        description: 'Update properties of an existing filter parameter in a report. Report name and parameter name must match exactly (case-sensitive). At least one property to update must be provided.',
        inputSchema: {
            report_name: z.string().describe('Name of the report (case-sensitive exact match)'),
            param_name: z.string().describe('Name of the parameter to update (case-sensitive exact match)'),
            updates: z.object({
                sqlServerDBDataType: z.enum(['nvarchar', 'bit', 'datetime', 'int', 'uniqueidentifier', 'money', 'bigint', 'float', 'decimal', 'date', 'varchar', 'text']).optional().describe('SQL Server data type for this parameter'),
                sqlServerDBDataTypeSize: z.string().optional().describe('Size of data type (for nvarchar, varchar, decimal)'),
                labelText: z.string().optional().describe('Human-readable label text displayed for this field'),
                targetColumnName: z.string().optional().describe('Target column name in the report data source'),
                isFK: z.enum(['true', 'false']).optional().describe('Is this parameter a foreign key?'),
                fKObjectName: z.string().optional().describe('Name of the foreign key object target (data object name, case-sensitive)'),
                isFKLookup: z.enum(['true', 'false']).optional().describe('Is this parameter a foreign key to a lookup object?'),
                isFKList: z.enum(['true', 'false']).optional().describe('Should a dropdown list be shown for this FK?'),
                isFKListInactiveIncluded: z.enum(['true', 'false']).optional().describe('Should inactive items be included in the FK dropdown list?'),
                fKListOrderBy: z.enum(['NameDesc', 'NameAsc', 'DisplayOrderDesc', 'DisplayOrderAsc']).optional().describe('Sort order for FK dropdown list'),
                isFKListSearchable: z.enum(['true', 'false']).optional().describe('Should the FK dropdown list be searchable?'),
                isUnknownLookupAllowed: z.enum(['true', 'false']).optional().describe('Should "Unknown" option be allowed in lookup?'),
                defaultValue: z.string().optional().describe('Default value for this parameter'),
                isVisible: z.enum(['true', 'false']).optional().describe('Is this parameter visible on the report?'),
                codeDescription: z.string().optional().describe('Code description for documentation')
            }).describe('Object containing properties to update')
        },
        outputSchema: {
            success: z.boolean(),
            param: z.any().optional(),
            report_name: z.string().optional(),
            owner_object_name: z.string().optional(),
            message: z.string().optional(),
            error: z.string().optional(),
            note: z.string().optional()
        }
    }, async (args: Record<string, unknown>) => {
        try {
            const { report_name, param_name, updates } = args;
            const result = await tools.update_report_param(
                report_name as string, 
                param_name as string, 
                updates as any
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

    // Register add_report_column tool
        server.registerTool('add_report_column', {
        title: 'Add Report Column',
        description: 'Add a new column to an existing report. Columns display data in the report grid or chart. Report name must match exactly (case-sensitive). Column names must be unique within the report and in PascalCase format. Columns can be data fields or action buttons.',
        inputSchema: {
            report_name: z.string().describe('Name of the report (case-sensitive exact match)'),
            name: z.string().describe('Column name (required, PascalCase)'),
            headerText: z.string().optional().describe('Column header text displayed in the report grid'),
            sqlServerDBDataType: z.enum(['nvarchar', 'bit', 'datetime', 'int', 'uniqueidentifier', 'money', 'bigint', 'float', 'decimal', 'date', 'varchar', 'text']).optional().describe('SQL Server data type for this column'),
            sqlServerDBDataTypeSize: z.string().optional().describe('Size of data type (for nvarchar, varchar, decimal)'),
            sourceObjectName: z.string().optional().describe('Source data object name (case-sensitive)'),
            sourcePropertyName: z.string().optional().describe('Source property name from the source object'),
            isVisible: z.enum(['true', 'false']).optional().describe('Is this column visible in the report?'),
            minWidth: z.string().optional().describe('Minimum column width (e.g., "100px", "10%")'),
            maxWidth: z.string().optional().describe('Maximum column width (e.g., "200px", "20%")'),
            isButton: z.enum(['true', 'false']).optional().describe('Is this column a button?'),
            buttonText: z.string().optional().describe('Button text if isButton="true"'),
            destinationContextObjectName: z.string().optional().describe('Owner object of the destination for button navigation'),
            destinationTargetName: z.string().optional().describe('Target form/report/workflow for button navigation'),
            isFilterAvailable: z.enum(['true', 'false']).optional().describe('Is filtering available for this column?'),
            codeDescription: z.string().optional().describe('Code description for documentation')
        },
        outputSchema: {
            success: z.boolean(),
            column: z.any().optional(),
            report_name: z.string().optional(),
            owner_object_name: z.string().optional(),
            message: z.string().optional(),
            error: z.string().optional(),
            note: z.string().optional()
        }
    }, async (args: Record<string, unknown>) => {
        try {
            const { report_name, ...column } = args;
            const result = await tools.add_report_column(report_name as string, column as any);
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

    // Register update_report_column tool
        server.registerTool('update_report_column', {
        title: 'Update Report Column',
        description: 'Update properties of an existing column in a report. Report name and column name must match exactly (case-sensitive). At least one property to update must be provided.',
        inputSchema: {
            report_name: z.string().describe('Name of the report (case-sensitive exact match)'),
            column_name: z.string().describe('Name of the column to update (case-sensitive exact match)'),
            updates: z.object({
                headerText: z.string().optional().describe('Column header text displayed in the report grid'),
                sqlServerDBDataType: z.enum(['nvarchar', 'bit', 'datetime', 'int', 'uniqueidentifier', 'money', 'bigint', 'float', 'decimal', 'date', 'varchar', 'text']).optional().describe('SQL Server data type for this column'),
                sqlServerDBDataTypeSize: z.string().optional().describe('Size of data type (for nvarchar, varchar, decimal)'),
                sourceObjectName: z.string().optional().describe('Source data object name (case-sensitive)'),
                sourcePropertyName: z.string().optional().describe('Source property name from the source object'),
                isVisible: z.enum(['true', 'false']).optional().describe('Is this column visible in the report?'),
                minWidth: z.string().optional().describe('Minimum column width (e.g., "100px", "10%")'),
                maxWidth: z.string().optional().describe('Maximum column width (e.g., "200px", "20%")'),
                isButton: z.enum(['true', 'false']).optional().describe('Is this column a button?'),
                buttonText: z.string().optional().describe('Button text if isButton="true"'),
                destinationContextObjectName: z.string().optional().describe('Owner object of the destination for button navigation'),
                destinationTargetName: z.string().optional().describe('Target form/report/workflow for button navigation'),
                isFilterAvailable: z.enum(['true', 'false']).optional().describe('Is filtering available for this column?'),
                codeDescription: z.string().optional().describe('Code description for documentation')
            }).describe('Object containing properties to update')
        },
        outputSchema: {
            success: z.boolean(),
            column: z.any().optional(),
            report_name: z.string().optional(),
            owner_object_name: z.string().optional(),
            message: z.string().optional(),
            error: z.string().optional(),
            note: z.string().optional()
        }
    }, async (args: Record<string, unknown>) => {
        try {
            const { report_name, column_name, updates } = args;
            const result = await tools.update_report_column(
                report_name as string,
                column_name as string,
                updates as any
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

    // Register add_report_button tool
        server.registerTool('add_report_button', {
        title: 'Add Report Button',
        description: 'Add a new button to an existing report. Buttons allow navigation or actions from the report page. Report name must match exactly (case-sensitive). Common button types: back, add, other.',
        inputSchema: {
            report_name: z.string().describe('Name of the report (case-sensitive exact match)'),
            buttonText: z.string().describe('Text displayed on the button (required)'),
            buttonName: z.string().optional().describe('Unique identifier for the button (optional, auto-generated if not provided)'),
            buttonType: z.enum(['add', 'back', 'other', 'multiSelectProcessing', 'breadcrumb']).optional().describe('Type of button: "back" (top left navigation), "add" (top right), "other" (top right), "multiSelectProcessing" (above report list for batch operations), "breadcrumb" (breadcrumb navigation)'),
            isVisible: z.enum(['true', 'false']).optional().describe('Is this button visible on the report?'),
            destinationContextObjectName: z.string().optional().describe('Owner object of the destination for button navigation'),
            destinationTargetName: z.string().optional().describe('Target form/report/workflow for button navigation'),
            isButtonCallToAction: z.enum(['true', 'false']).optional().describe('Should this button be highlighted as a call-to-action?')
        },
        outputSchema: {
            success: z.boolean(),
            button: z.any().optional(),
            report_name: z.string().optional(),
            owner_object_name: z.string().optional(),
            message: z.string().optional(),
            error: z.string().optional(),
            note: z.string().optional()
        }
    }, async (args: Record<string, unknown>) => {
        try {
            const { report_name, ...button } = args;
            const result = await tools.add_report_button(report_name as string, button as any);
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

    // Register update_report_button tool
        server.registerTool('update_report_button', {
        title: 'Update Report Button',
        description: 'Update properties of an existing button in a report. Report name and button name must match exactly (case-sensitive). At least one property to update must be provided.',
        inputSchema: {
            report_name: z.string().describe('Name of the report (case-sensitive exact match)'),
            button_name: z.string().describe('buttonName of the button to update (case-sensitive exact match)'),
            updates: z.object({
                buttonText: z.string().optional().describe('Text displayed on the button'),
                buttonType: z.enum(['add', 'back', 'other', 'multiSelectProcessing', 'breadcrumb']).optional().describe('Type of button: "back" (top left navigation), "add" (top right), "other" (top right), "multiSelectProcessing" (above report list for batch operations), "breadcrumb" (breadcrumb navigation)'),
                isVisible: z.enum(['true', 'false']).optional().describe('Is this button visible on the report?'),
                destinationContextObjectName: z.string().optional().describe('Owner object of the destination for button navigation'),
                destinationTargetName: z.string().optional().describe('Target form/report/workflow for button navigation'),
                isButtonCallToAction: z.enum(['true', 'false']).optional().describe('Should this button be highlighted as a call-to-action?')
            }).describe('Object containing properties to update')
        },
        outputSchema: {
            success: z.boolean(),
            button: z.any().optional(),
            report_name: z.string().optional(),
            owner_object_name: z.string().optional(),
            message: z.string().optional(),
            error: z.string().optional(),
            note: z.string().optional()
        }
    }, async (args: Record<string, unknown>) => {
        try {
            const { report_name, button_name, updates } = args;
            const result = await tools.update_report_button(
                report_name as string,
                button_name as string,
                updates as any
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

    // Register move_report_param tool
        server.registerTool('move_report_param', {
        title: 'Move Report Parameter',
        description: 'Move a report parameter (filter control) to a new position in the parameter list. Changes the display order of filter controls on the report. Report name and parameter name must match exactly (case-sensitive). Position is 0-based index (0 = first position).',
        inputSchema: {
            report_name: z.string().describe('The name of the report containing the parameter (required, case-sensitive exact match)'),
            param_name: z.string().describe('The name of the parameter to move (required, case-sensitive exact match)'),
            new_position: z.number().min(0).describe('The new 0-based index position for the parameter (0 = first position). Must be less than the total parameter count.')
        },
        outputSchema: {
            success: z.boolean(),
            report_name: z.string().optional(),
            owner_object_name: z.string().optional(),
            param_name: z.string().optional(),
            old_position: z.number().optional(),
            new_position: z.number().optional(),
            param_count: z.number().optional(),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional()
        }
    }, async ({ report_name, param_name, new_position }) => {
        try {
            const result = await tools.move_report_param(report_name, param_name, new_position);
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

    // Register move_report_column tool
        server.registerTool('move_report_column', {
        title: 'Move Report Column',
        description: 'Move a report column to a new position in the column list. Changes the display order of columns in the report grid/table. Report name and column name must match exactly (case-sensitive). Position is 0-based index (0 = first/leftmost position).',
        inputSchema: {
            report_name: z.string().describe('The name of the report containing the column (required, case-sensitive exact match)'),
            column_name: z.string().describe('The name of the column to move (required, case-sensitive exact match)'),
            new_position: z.number().min(0).describe('The new 0-based index position for the column (0 = first/leftmost position). Must be less than the total column count.')
        },
        outputSchema: {
            success: z.boolean(),
            report_name: z.string().optional(),
            owner_object_name: z.string().optional(),
            column_name: z.string().optional(),
            old_position: z.number().optional(),
            new_position: z.number().optional(),
            column_count: z.number().optional(),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional()
        }
    }, async ({ report_name, column_name, new_position }) => {
        try {
            const result = await tools.move_report_column(report_name, column_name, new_position);
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

    // Register move_report_button tool
        server.registerTool('move_report_button', {
        title: 'Move Report Button',
        description: 'Move a report button to a new position in the button list. Changes the display order of buttons on the report. Report name and button name must match exactly (case-sensitive). Position is 0-based index (0 = first position).',
        inputSchema: {
            report_name: z.string().describe('The name of the report containing the button (required, case-sensitive exact match)'),
            button_name: z.string().describe('The name of the button to move (required, case-sensitive exact match)'),
            new_position: z.number().min(0).describe('The new 0-based index position for the button (0 = first position). Must be less than the total button count.')
        },
        outputSchema: {
            success: z.boolean(),
            report_name: z.string().optional(),
            owner_object_name: z.string().optional(),
            button_name: z.string().optional(),
            old_position: z.number().optional(),
            new_position: z.number().optional(),
            button_count: z.number().optional(),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional()
        }
    }, async ({ report_name, button_name, new_position }) => {
        try {
            const result = await tools.move_report_button(report_name, button_name, new_position);
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

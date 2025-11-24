// registerWorkflowTools.ts
// MCP tool registrations for workflow operations
// Extracted from server.ts on: November 23, 2025

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WorkflowTools } from '../workflowTools.js';

/**
 * Get list of tool names for chatmode YAML
 */
export function getToolNames(): string[] {
    return [
        'get_workflow_schema',
        'list_workflows',
        'get_workflow',
        'update_workflow',
        'create_workflow',
        'add_workflow_task',
        'move_workflow_task'
    ];
}

/**
 * Generate chatmode documentation for workflow tools
 */
export function generateChatmodeDocumentation(): string {
    return `**Workflow Tools (7 tools):**

*Workflow Operations:*
- \`get_workflow_schema\` - Get schema definition for DynaFlow workflows
- \`list_workflows\` - List all workflows with filtering options
- \`get_workflow\` - Get complete details of a specific workflow
- \`update_workflow\` - Update workflow properties
- \`create_workflow\` - Create a new workflow

*Workflow Tasks:*
- \`add_workflow_task\` - Add a task to a workflow
- \`move_workflow_task\` - Change the execution order of a task`;
}

export function registerWorkflowTools(server: McpServer, tools: WorkflowTools): void {
    // Register get_workflow_schema tool
        server.registerTool('get_workflow_schema', {
        title: 'Get Workflow Schema',
        description: 'Get the complete schema definition for workflows (isDynaFlow=true objectWorkflow). Returns detailed information about workflow properties, task properties, validation rules, naming patterns, and complete examples. Workflows are multi-step business processes orchestrated through tasks. Use this to understand the structure before creating or updating workflows.',
        inputSchema: {},
        outputSchema: {
            success: z.boolean(),
            schema: z.object({
                type: z.string(),
                description: z.string(),
                objectType: z.string(),
                category: z.string(),
                properties: z.any(),
                dynaFlowTask: z.any(),
                usage: z.any(),
                notes: z.array(z.string())
            }).optional(),
            error: z.string().optional()
        }
    }, async () => {
        try {
            const result = await tools.get_workflow_schema();
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

    // Register list_workflows tool
        server.registerTool('list_workflows', {
        title: 'List Workflows',
        description: 'List all workflows in the model with summary information and optional filtering. Returns name, owner data object, and task count for each workflow. Workflows are identified by isDynaFlow="true" in the objectWorkflow array. Use filters to find specific workflows by name or owner object. Use this to discover available workflows before getting full details.',
        inputSchema: {
            workflow_name: z.string().optional().describe('Optional: Filter by workflow name (case-insensitive, partial match)'),
            owner_object_name: z.string().optional().describe('Optional: Filter by owner data object name (case-insensitive, exact match)')
        },
        outputSchema: {
            success: z.boolean(),
            workflows: z.array(z.object({
                name: z.string(),
                owner_object_name: z.string(),
                taskCount: z.number()
            })).optional(),
            count: z.number().optional(),
            filters: z.object({
                workflow_name: z.string().nullable(),
                owner_object_name: z.string().nullable()
            }).optional(),
            note: z.string().optional(),
            error: z.string().optional()
        }
    }, async ({ workflow_name, owner_object_name }) => {
        try {
            const result = await tools.list_workflows(workflow_name, owner_object_name);
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

    // Register get_workflow tool
        server.registerTool('get_workflow', {
        title: 'Get Workflow',
        description: 'Get complete details of a specific workflow including all tasks (dynaFlowTask array). Retrieves workflow by name. Returns full workflow structure with all properties and tasks. Workflow name matching is case-insensitive. Hidden UI properties are filtered out. Searches all data objects to find the workflow.',
        inputSchema: {
            workflow_name: z.string().describe('Name of the workflow to retrieve (case-insensitive)')
        },
        outputSchema: {
            success: z.boolean(),
            workflow: z.any().optional(),
            owner_object_name: z.string().optional(),
            element_counts: z.object({
                taskCount: z.number()
            }).optional(),
            note: z.string().optional(),
            error: z.string().optional(),
            validationErrors: z.array(z.string()).optional()
        }
    }, async ({ workflow_name }) => {
        try {
            const result = await tools.get_workflow(workflow_name);
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

    // Register update_workflow tool
        server.registerTool('update_workflow', {
        title: 'Update Workflow',
        description: 'Update workflow properties (settings). Supports partial updates - only specified properties are modified. Workflow name matching is case-sensitive. At least one property must be specified. Properties: codeDescription, isCustomLogicOverwritten. Note: name is the identifier (cannot be updated). Model is marked as unsaved after update.',
        inputSchema: {
            workflow_name: z.string().describe('Name of the workflow to update (case-sensitive)'),
            codeDescription: z.string().optional().describe('Code-level description of workflow purpose'),
            isCustomLogicOverwritten: z.enum(['true', 'false']).optional().describe('Custom code flag')
        },
        outputSchema: {
            success: z.boolean(),
            workflow: z.any().optional(),
            owner_object_name: z.string().optional(),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional(),
            validationErrors: z.array(z.string()).optional()
        }
    }, async (args: any) => {
        try {
            const result = await tools.update_workflow(
                args.workflow_name,
                args.codeDescription,
                args.isCustomLogicOverwritten
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

    // Register create_workflow tool
        server.registerTool('create_workflow', {
        title: 'Create Workflow',
        description: 'Create a new workflow in the specified data object. Workflow name must be PascalCase and should not end with InitObjWF or InitReport (those are for page init flows). isDynaFlow is automatically set to "true". dynaFlowTask array is initialized as empty. Owner object name matching is case-sensitive. Only codeDescription can be set on creation - use update_workflow to set other properties later. Model is marked as unsaved after creation.',
        inputSchema: {
            owner_object_name: z.string().describe('Name of the owner data object (case-sensitive)'),
            name: z.string().describe('Name of the new workflow (PascalCase, no InitObjWF/InitReport suffix)'),
            codeDescription: z.string().optional().describe('Code-level description of workflow purpose')
        },
        outputSchema: {
            success: z.boolean(),
            workflow: z.any().optional(),
            owner_object_name: z.string().optional(),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional(),
            validationErrors: z.array(z.string()).optional()
        }
    }, async (args: any) => {
        try {
            const result = await tools.create_workflow(
                args.owner_object_name,
                args.name,
                args.codeDescription
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

    // Register add_workflow_task tool
        server.registerTool('add_workflow_task', {
        title: 'Add Workflow Task',
        description: 'Add a new task to a workflow. Task name must be PascalCase and unique within the workflow. Tasks are stored in the dynaFlowTask array. Only task name is in the simplified schema. Workflow name matching is case-sensitive. Model is marked as unsaved after adding task.',
        inputSchema: {
            workflow_name: z.string().describe('Name of the workflow (case-sensitive)'),
            name: z.string().describe('Name of the new task (PascalCase, unique in workflow)')
        },
        outputSchema: {
            success: z.boolean(),
            task: z.any().optional(),
            workflow_name: z.string().optional(),
            owner_object_name: z.string().optional(),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional(),
            validationErrors: z.array(z.string()).optional()
        }
    }, async (args: any) => {
        try {
            const result = await tools.add_workflow_task(
                args.workflow_name,
                args.name
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

    // Register move_workflow_task tool
        server.registerTool('move_workflow_task', {
        title: 'Move Workflow Task',
        description: 'Move a task to a new position in the workflow\'s task array (dynaFlowTask). Position is 0-based index. Position 0 is first in array. Returns old position, new position, and total task count. Workflow and task name matching is case-sensitive. Model is marked as unsaved after moving task.',
        inputSchema: {
            workflow_name: z.string().describe('Name of the workflow (case-sensitive)'),
            task_name: z.string().describe('Name of the task to move (case-sensitive)'),
            new_position: z.number().describe('New position (0-based index, 0 = first position)')
        },
        outputSchema: {
            success: z.boolean(),
            workflow_name: z.string().optional(),
            owner_object_name: z.string().optional(),
            task_name: z.string().optional(),
            old_position: z.number().optional(),
            new_position: z.number().optional(),
            task_count: z.number().optional(),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional(),
            validationErrors: z.array(z.string()).optional()
        }
    }, async ({ workflow_name, task_name, new_position }) => {
        try {
            const result = await tools.move_workflow_task(workflow_name, task_name, new_position);
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

    // ===== MODEL OPERATIONS =====

}

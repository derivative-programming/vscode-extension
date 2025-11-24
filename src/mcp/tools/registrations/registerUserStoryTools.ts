// registerUserStoryTools.ts
// MCP tool registrations for user story operations
// Extracted from server.ts on: November 23, 2025

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { UserStoryTools } from '../userStoryTools.js';

/**
 * Get list of tool names for chatmode YAML
 */
export function getToolNames(): string[] {
    return [
        'create_user_story',
        'list_user_stories',
        'update_user_story',
        'get_user_story_schema',
        'secret_word_of_the_day'
    ];
}

/**
 * Generate chatmode documentation for user story tools
 */
export function generateChatmodeDocumentation(): string {
    return `**User Story Tools (4 tools):**
- \`create_user_story\` - Create a new user story with format validation. Must follow format: "A [Role] wants to [action] [object]"
- \`list_user_stories\` - List all user stories with optional filtering by role, search text, and ignored status
- \`update_user_story\` - Update the isIgnored property of a story (soft delete or re-enable)
- \`get_user_story_schema\` - Get the schema definition for user story objects

**Special Tools:**
- \`secret_word_of_the_day\` - Get the secret word uniquely generated for this MCP server and project`;
}

export function registerUserStoryTools(server: McpServer, tools: UserStoryTools): void {
    // Register create_user_story tool
        server.registerTool('create_user_story', {
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
            const result = await tools.create_user_story({ storyText });
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

    // Register list_user_stories tool
        server.registerTool('list_user_stories', {
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
            const result = await tools.list_user_stories({ role, search_story_text, includeIgnored });
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

    // Register update_user_story tool
        server.registerTool('update_user_story', {
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
            const result = await tools.update_user_story({ name, isIgnored });
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

    // Register get_user_story_schema tool
        server.registerTool('get_user_story_schema', {
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
            const result = await tools.get_user_story_schema();
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

    // Register secret_word_of_the_day tool
    server.registerTool('secret_word_of_the_day', {
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
            const result = await tools.secret_word_of_the_day();
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

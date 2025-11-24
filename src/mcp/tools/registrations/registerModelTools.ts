// registerModelTools.ts
// MCP tool registrations for model operations
// Extracted from server.ts on: November 23, 2025

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ModelTools } from '../modelTools.js';

/**
 * Get list of tool names for chatmode YAML
 */
export function getToolNames(): string[] {
    return [
        'save_model',
        'close_all_open_views',
        'expand_tree_view',
        'collapse_tree_view'
    ];
}

/**
 * Generate chatmode documentation for model operation tools
 */
export function generateChatmodeDocumentation(): string {
    return `**Model Operations (4 tools):**
- \`save_model\` - Save the current AppDNA model to file (persists all changes)
- \`close_all_open_views\` - Close all open view panels and webviews
- \`expand_tree_view\` - Expand all top-level items in the tree view
- \`collapse_tree_view\` - Collapse all items in the tree view to top-level state`;
}

export function registerModelTools(server: McpServer, tools: ModelTools): void {
    // Register save_model tool
        server.registerTool('save_model', {
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
            const result = await tools.save_model();
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
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
        server.registerTool('close_all_open_views', {
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
            const result = await tools.close_all_open_views();
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
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
        server.registerTool('expand_tree_view', {
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
            const result = await tools.expand_tree_view();
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
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
        server.registerTool('collapse_tree_view', {
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
            const result = await tools.collapse_tree_view();
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
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
}

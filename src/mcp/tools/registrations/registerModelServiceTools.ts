// registerModelServiceTools.ts
// MCP tool registrations for model service AI operations
// Extracted from server.ts on: November 23, 2025

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ModelServiceTools } from '../modelServiceTools.js';

/**
 * Get list of tool names for chatmode YAML
 */
export function getToolNames(): string[] {
    return [
        'list_model_features_catalog_items',
        'select_model_feature',
        'unselect_model_feature',
        'list_model_ai_processing_requests',
        'create_model_ai_processing_request',
        'merge_model_ai_processing_results',
        'get_model_ai_processing_request_details',
        'get_model_ai_processing_request_schema',
        'open_model_ai_processing_request_details',
        'list_model_validation_requests',
        'create_model_validation_request',
        'get_model_validation_request_details',
        'get_model_validation_request_schema',
        'open_validation_request_details',
        'list_fabrication_blueprint_catalog_items',
        'select_fabrication_blueprint',
        'unselect_fabrication_blueprint',
        'list_model_fabrication_requests',
        'create_model_fabrication_request',
        'get_model_fabrication_request_details',
        'get_model_fabrication_request_schema',
        'open_model_fabrication_request_details'
    ];
}

/**
 * Generate chatmode documentation for model service tools
 */
export function generateChatmodeDocumentation(): string {
    return `**Model Service Tools (18 tools - requires authentication):**

*Feature Catalog:*
- \`list_model_features_catalog_items\` - List available features from catalog
- \`select_model_feature\` - Select a feature to add to the model
- \`unselect_model_feature\` - Remove a selected feature

*AI Processing:*
- \`list_model_ai_processing_requests\` - List AI processing requests
- \`create_model_ai_processing_request\` - Create a new AI processing request
- \`get_model_ai_processing_request_details\` - Get details of a specific request
- \`get_model_ai_processing_request_schema\` - Get schema for AI processing requests
- \`merge_model_ai_processing_results\` - Merge AI results into the model

*Model Validation:*
- \`list_model_validation_requests\` - List validation requests
- \`create_model_validation_request\` - Create a new validation request
- \`get_model_validation_request_details\` - Get details of a specific request
- \`get_model_validation_request_schema\` - Get schema for validation requests

*Fabrication (Code Generation):*
- \`list_fabrication_blueprint_catalog_items\` - List available blueprints
- \`select_fabrication_blueprint\` - Select a blueprint for code generation
- \`unselect_fabrication_blueprint\` - Remove a selected blueprint
- \`list_model_fabrication_requests\` - List fabrication requests
- \`create_model_fabrication_request\` - Create a new fabrication request
- \`get_model_fabrication_request_details\` - Get details of a specific request
- \`get_model_fabrication_request_schema\` - Get schema for fabrication requests`;
}

export function registerModelServiceTools(server: McpServer, tools: ModelServiceTools): void {
        server.registerTool('list_model_features_catalog_items', {
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
            const result = await tools.list_model_features_catalog_items(
                args.pageNumber,
                args.itemCountPerPage,
                args.orderByColumnName,
                args.orderByDescending
            );
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
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
        server.registerTool('list_model_ai_processing_requests', {
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
            const result = await tools.list_model_ai_processing_requests(
                args.pageNumber,
                args.itemCountPerPage,
                args.orderByColumnName,
                args.orderByDescending
            );
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
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
        server.registerTool('get_model_ai_processing_request_details', {
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
            const result = await tools.get_model_ai_processing_request_details(
                args.requestCode
            );
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
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
        server.registerTool('create_model_ai_processing_request', {
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
            const result = await tools.create_model_ai_processing_request(
                args.description
            );
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

    // Register merge_model_ai_processing_results tool
        server.registerTool('merge_model_ai_processing_results', {
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
            const result = await tools.merge_model_ai_processing_results(
                args.requestCode
            );
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

    // Register create_model_validation_request tool
        server.registerTool('create_model_validation_request', {
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
            const result = await tools.create_model_validation_request(
                args.description
            );
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

    // Register create_model_fabrication_request tool
        server.registerTool('create_model_fabrication_request', {
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
            const result = await tools.create_model_fabrication_request(
                args.description
            );
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

    // Register get_model_validation_request_details tool
        server.registerTool('get_model_validation_request_details', {
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
            const result = await tools.get_model_validation_request_details(
                args.requestCode
            );
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
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
        server.registerTool('get_model_fabrication_request_details', {
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
            const result = await tools.get_model_fabrication_request_details(
                args.requestCode
            );
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
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
        server.registerTool('get_model_ai_processing_request_schema', {
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
            const result = await tools.get_model_ai_processing_request_schema();
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
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
        server.registerTool('get_model_validation_request_schema', {
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
            const result = await tools.get_model_validation_request_schema();
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
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
        server.registerTool('get_model_fabrication_request_schema', {
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
            const result = await tools.get_model_fabrication_request_schema();
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
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
        server.registerTool('list_model_validation_requests', {
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
            const result = await tools.list_model_validation_requests(
                args.pageNumber,
                args.itemCountPerPage,
                args.orderByColumnName,
                args.orderByDescending
            );
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
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
        server.registerTool('list_fabrication_blueprint_catalog_items', {
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
            const result = await tools.list_fabrication_blueprint_catalog_items(
                args.pageNumber,
                args.itemCountPerPage,
                args.orderByColumnName,
                args.orderByDescending
            );
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
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
        server.registerTool('list_model_fabrication_requests', {
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
            const result = await tools.list_model_fabrication_requests(
                args.pageNumber,
                args.itemCountPerPage,
                args.orderByColumnName,
                args.orderByDescending
            );
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
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
        server.registerTool('select_model_feature', {
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
            const result = await tools.select_model_feature(
                args.featureName,
                args.version
            );
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

    // Register unselect_model_feature tool
        server.registerTool('unselect_model_feature', {
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
            const result = await tools.unselect_model_feature(
                args.featureName,
                args.version
            );
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

    // Register select_fabrication_blueprint tool
        server.registerTool('select_fabrication_blueprint', {
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
            const result = await tools.select_fabrication_blueprint(
                args.blueprintName,
                args.version
            );
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

    // Register unselect_fabrication_blueprint tool
        server.registerTool('unselect_fabrication_blueprint', {
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
            const result = await tools.unselect_fabrication_blueprint(
                args.blueprintName,
                args.version
            );
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

    // ===== USER STORY VIEW OPENING TOOLS =====
}

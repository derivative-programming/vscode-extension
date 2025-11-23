// registerViewTools.ts
// MCP tool registrations for view operations
// Extracted from server.ts on: November 23, 2024

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ViewTools } from '../viewTools.js';

export function registerViewTools(server: McpServer, tools: ViewTools): void {
    // Register open_user_stories_view tool
        server.registerTool('open_user_stories_view', {
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
            const result = await tools.openUserStories(initialTab);
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

    // ===== USER STORY DEVELOPMENT AND QA VIEWS =====

        server.registerTool('open_user_stories_dev_view', {
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
            const result = await tools.openUserStoriesDev(initialTab);
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

        server.registerTool('open_user_stories_qa_view', {
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
            const result = await tools.openUserStoriesQA(initialTab);
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

        server.registerTool('open_user_stories_journey_view', {
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
            const result = await tools.openUserStoriesJourney(initialTab);
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

        server.registerTool('open_user_stories_page_mapping_view', {
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
            const result = await tools.openUserStoriesPageMapping();
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

        server.registerTool('open_user_stories_role_requirements_view', {
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
            const result = await tools.openUserStoriesRoleRequirements();
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

        server.registerTool('open_requirements_fulfillment_view', {
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
            const result = await tools.openRequirementsFulfillment();
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

    // ===== DATA OBJECT VIEWS =====

        server.registerTool('open_object_details_view', {
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
            const result = await tools.openObjectDetails(objectName, initialTab);
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

        server.registerTool('open_data_objects_list_view', {
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
            const result = await tools.openDataObjectsList();
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

        server.registerTool('open_data_object_usage_analysis_view', {
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
            const result = await tools.openDataObjectUsageAnalysis(initialTab);
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

        server.registerTool('open_add_data_object_wizard', {
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
            const result = await tools.openAddDataObjectWizard();
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

        server.registerTool('open_data_object_size_analysis_view', {
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
            const result = await tools.openDataObjectSizeAnalysis(initialTab);
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

        server.registerTool('open_database_size_forecast_view', {
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
            const result = await tools.openDatabaseSizeForecast(initialTab);
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

    // ===== FORM AND PAGE VIEWS =====

        server.registerTool('open_form_details_view', {
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
            const result = await tools.openFormDetails(formName, initialTab);
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

        server.registerTool('open_pages_list_view', {
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
            const result = await tools.openPagesList(initialTab);
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

        server.registerTool('open_page_details_view', {
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
            const result = await tools.openPageDetails(pageName, initialTab);
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

        server.registerTool('open_page_preview_view', {
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
            const result = await tools.openPagePreview(pageName);
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

        server.registerTool('open_validation_request_details', {
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
            const result = await tools.openValidationRequestDetails(requestCode);
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

        server.registerTool('open_model_ai_processing_request_details', {
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
            const result = await tools.openAIProcessingRequestDetails(requestCode);
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

        server.registerTool('open_model_fabrication_request_details', {
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
            const result = await tools.openFabricationRequestDetails(requestCode);
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

    // ===== WORKFLOW AND FLOW VIEWS =====

        server.registerTool('open_page_init_flows_list_view', {
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
            const result = await tools.openPageInitFlowsList();
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

        server.registerTool('open_page_init_flow_details_view', {
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
            const result = await tools.openPageInitFlowDetails(flowName, initialTab);
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

        server.registerTool('open_general_workflows_list_view', {
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
            const result = await tools.openGeneralWorkflowsList();
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

        server.registerTool('open_add_general_flow_wizard', {
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
            const result = await tools.openAddGeneralFlowWizard();
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

        server.registerTool('open_general_workflow_details_view', {
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
            const result = await tools.openGeneralWorkflowDetails(workflowName, initialTab);
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

        server.registerTool('open_workflows_list_view', {
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
            const result = await tools.openWorkflowsList();
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

        server.registerTool('open_workflow_details_view', {
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
            const result = await tools.openWorkflowDetails(workflowName, initialTab);
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

        server.registerTool('open_workflow_tasks_list_view', {
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
            const result = await tools.openWorkflowTasksList();
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

        server.registerTool('open_workflow_task_details_view', {
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
            const result = await tools.openWorkflowTaskDetails(taskName, initialTab);
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

    // ===== REPORT AND API VIEWS =====

        server.registerTool('open_report_details_view', {
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
            const result = await tools.openReportDetails(reportName, initialTab);
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

        server.registerTool('open_apis_list_view', {
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
            const result = await tools.openAPIsList();
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

        server.registerTool('open_api_details_view', {
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
            const result = await tools.openAPIDetails(apiName, initialTab);
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

    // ===== ANALYSIS AND METRICS VIEWS =====

        server.registerTool('open_metrics_analysis_view', {
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
            const result = await tools.openMetricsAnalysis(initialTab);
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

        server.registerTool('open_lexicon_view', {
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
            const result = await tools.openLexicon();
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

        server.registerTool('open_change_requests_view', {
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
            const result = await tools.openChangeRequests();
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

        server.registerTool('open_model_ai_processing_view', {
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
            const result = await tools.openModelAIProcessing();
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

        server.registerTool('open_model_validation_requests_view', {
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
            const result = await tools.openModelValidationRequests();
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

        server.registerTool('open_model_feature_catalog_view', {
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
            const result = await tools.openModelFeatureCatalog();
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

        server.registerTool('open_fabrication_requests_view', {
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
            const result = await tools.openFabricationRequests();
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

        server.registerTool('open_fabrication_blueprint_catalog_view', {
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
            const result = await tools.openFabricationBlueprintCatalog();
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

    // ===== DIAGRAM AND VISUALIZATION VIEWS =====

        server.registerTool('open_hierarchy_diagram_view', {
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
            const result = await tools.openHierarchyDiagram();
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

        server.registerTool('open_page_flow_diagram_view', {
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
            const result = await tools.openPageFlowDiagram(initialTab);
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

    // ===== SETTINGS AND HELP VIEWS =====

        server.registerTool('open_project_settings_view', {
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
            const result = await tools.openProjectSettings();
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

        server.registerTool('open_settings_view', {
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
            const result = await tools.openSettings();
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

        server.registerTool('open_welcome_view', {
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
            const result = await tools.openWelcome();
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

        server.registerTool('open_help_view', {
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
            const result = await tools.openHelp();
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

    // ===== AUTHENTICATION VIEWS =====

        server.registerTool('open_register_view', {
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
            const result = await tools.openRegister();
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

        server.registerTool('open_login_view', {
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
            const result = await tools.openLogin();
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

    // ===== WIZARD VIEWS =====

        server.registerTool('open_add_report_wizard', {
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
            const result = await tools.openAddReportWizard();
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


        server.registerTool('open_add_form_wizard', {
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
            const result = await tools.openAddFormWizard();
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

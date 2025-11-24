// registerViewTools.ts
// MCP tool registrations for view operations
// Consolidated into single open_view tool on: November 23, 2024

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ViewTools } from '../viewTools.js';

/**
 * View configuration with detailed descriptions
 */
interface ViewConfig {
    method: keyof ViewTools;
    params: string[];
    description: string;
    category: string;
    tabs?: string;
}

/**
 * View name to method mapping with descriptions
 */
const VIEW_METHOD_MAP: Record<string, ViewConfig> = {
    // User Story Views
    'user_stories': { 
        method: 'openUserStories', 
        params: ['initialTab'],
        description: 'Opens the user stories list view. Shows all user stories with their roles, descriptions, and acceptance criteria.',
        category: 'User Stories',
        tabs: 'stories (full list with search/filter), details (detailed table view), analytics (role distribution charts)'
    },
    'user_stories_dev': { 
        method: 'openUserStoriesDev', 
        params: ['initialTab'],
        description: 'Opens the development tracking view for user stories with sprint planning, assignments, and forecasting.',
        category: 'User Stories',
        tabs: 'details (13-column table with filters), devQueue (priority queue), board (Kanban board), sprint (sprint planning), developers (developer management), forecast (Gantt chart), cost (cost analysis), analysis (metrics and charts)'
    },
    'user_stories_qa': { 
        method: 'openUserStoriesQA', 
        params: ['initialTab'],
        description: 'Opens the QA and testing queue view for user stories with testing progress and status tracking.',
        category: 'User Stories',
        tabs: 'details (QA details table), board (Kanban board), analysis (status distribution), forecast (QA capacity planning), cost (cost analysis)'
    },
    'user_stories_journey': { 
        method: 'openUserStoriesJourney', 
        params: ['initialTab'],
        description: 'Opens the user journey mapping and analysis view showing story-page mappings and complexity.',
        category: 'User Stories',
        tabs: 'user-stories (story-page mappings), page-usage (usage frequency), page-usage-treemap (visual size), page-usage-distribution (histogram), page-usage-vs-complexity (scatter plot), journey-visualization (complexity treemap), journey-distribution (complexity histogram)'
    },
    'user_stories_page_mapping': { 
        method: 'openUserStoriesPageMapping', 
        params: [],
        description: 'Opens the page mapping view showing which pages are associated with which user stories for impact analysis and navigation planning.',
        category: 'User Stories'
    },
    'user_stories_role_requirements': { 
        method: 'openUserStoriesRoleRequirements', 
        params: [],
        description: 'Shows which user roles are required to access and complete each user story with comprehensive RBAC requirements.',
        category: 'User Stories'
    },
    'requirements_fulfillment': { 
        method: 'openRequirementsFulfillment', 
        params: [],
        description: 'Shows role requirements fulfillment status across user stories, data objects, and user journeys including access and action mappings.',
        category: 'User Stories'
    },
    
    // Data Object Views
    'object_details': { 
        method: 'openObjectDetails', 
        params: ['objectName', 'initialTab'],
        description: 'Opens the details view for a specific data object showing configuration, properties, and lookup items.',
        category: 'Data Objects',
        tabs: 'settings (basic configuration), props (field definitions), lookupItems (reference data values for lookup tables)'
    },
    'data_objects_list': { 
        method: 'openDataObjectsList', 
        params: [],
        description: 'Opens the list view showing all data objects (entities, lookups, junctions) with names, types, descriptions, and key properties.',
        category: 'Data Objects'
    },
    'data_object_usage_analysis': { 
        method: 'openDataObjectUsageAnalysis', 
        params: ['initialTab'],
        description: 'Opens usage analysis showing where each data object is used throughout the application for impact analysis.',
        category: 'Data Objects',
        tabs: 'summary (overview table), detail (detailed references), treemap (proportional usage), histogram (usage distribution), bubble (complexity vs usage)'
    },
    'data_object_size_analysis': { 
        method: 'openDataObjectSizeAnalysis', 
        params: ['initialTab'],
        description: 'Opens size analysis showing storage requirements and capacity planning for database optimization.',
        category: 'Data Objects',
        tabs: 'summary (overview table), details (property-level breakdown), treemap (size visualization), histogram (size distribution), dotplot (size vs properties)'
    },
    'database_size_forecast': { 
        method: 'openDatabaseSizeForecast', 
        params: ['initialTab'],
        description: 'Opens database size forecast with growth projections and capacity planning based on estimated growth rates.',
        category: 'Data Objects',
        tabs: 'config (set growth parameters), forecast (view projections with charts), data (detailed monthly/yearly breakdown)'
    },
    
    // Form and Page Views
    'form_details': { 
        method: 'openFormDetails', 
        params: ['formName', 'initialTab'],
        description: 'Opens the details editor for a specific form with configuration, fields, buttons, and outputs.',
        category: 'Forms & Pages',
        tabs: 'settings (basic configuration), inputControls (form fields), buttons (form actions), outputVariables (data outputs)'
    },
    'pages_list': { 
        method: 'openPagesList', 
        params: ['initialTab'],
        description: 'Opens the list view showing all pages (main UI screens) with complexity analysis.',
        category: 'Forms & Pages',
        tabs: 'pages (page list table), visualization (complexity treemap), distribution (complexity histogram)'
    },
    'page_details': { 
        method: 'openPageDetails', 
        params: ['pageName', 'initialTab'],
        description: 'Smart router that opens details for a specific page (form or report), automatically detecting the type.',
        category: 'Forms & Pages',
        tabs: 'settings, inputControls, buttons, outputVariables (for forms) or outputVars (for reports)'
    },
    'page_preview': { 
        method: 'openPagePreview', 
        params: ['pageName'],
        description: 'Opens live preview of pages showing rendered view and generated HTML/code.',
        category: 'Forms & Pages',
        tabs: 'preview (rendered view), source (generated HTML/code)'
    },
    
    // Model Services Request Details
    'validation_request_details': { 
        method: 'openValidationRequestDetails', 
        params: ['requestCode'],
        description: 'Opens Model Validation Requests view and displays details modal for a specific validation request. Shows status, results, and download options. Requires authentication.',
        category: 'Request Details'
    },
    'ai_processing_request_details': { 
        method: 'openAIProcessingRequestDetails', 
        params: ['requestCode'],
        description: 'Opens Model AI Processing Requests view and displays details modal for a specific AI processing request. Shows status, analysis results, and merge options. Requires authentication.',
        category: 'Request Details'
    },
    'fabrication_request_details': { 
        method: 'openFabricationRequestDetails', 
        params: ['requestCode'],
        description: 'Opens Model Fabrication Requests view and displays details modal for a specific fabrication request. Shows status, generated files, and download options. Requires authentication.',
        category: 'Request Details'
    },
    
    // Workflow and Flow Views
    'page_init_flows_list': { 
        method: 'openPageInitFlowsList', 
        params: [],
        description: 'Opens list of page initialization flows that run automatically when pages load, handling data fetching and permissions.',
        category: 'Workflows'
    },
    'page_init_flow_details': { 
        method: 'openPageInitFlowDetails', 
        params: ['flowName', 'initialTab'],
        description: 'Opens details for a specific page initialization flow showing settings and output variables.',
        category: 'Workflows',
        tabs: 'settings (flow configuration), outputVariables (data outputs from flow)'
    },
    'general_workflows_list': { 
        method: 'openGeneralWorkflowsList', 
        params: [],
        description: 'Opens list of general-purpose reusable business logic workflows that can be triggered from multiple places.',
        category: 'Workflows'
    },
    'general_workflow_details': { 
        method: 'openGeneralWorkflowDetails', 
        params: ['workflowName', 'initialTab'],
        description: 'Opens details for a specific general workflow showing settings and input parameters for reusable business logic.',
        category: 'Workflows',
        tabs: 'settings (workflow configuration), inputParameters (workflow input parameters)'
    },
    'workflows_list': { 
        method: 'openWorkflowsList', 
        params: [],
        description: 'Opens comprehensive list of all workflows (business logic, data processing, automation) with names, types, and triggers.',
        category: 'Workflows'
    },
    'workflow_details': { 
        method: 'openWorkflowDetails', 
        params: ['workflowName', 'initialTab'],
        description: 'Opens details for a specific DynaFlow workflow showing configuration and task sequence.',
        category: 'Workflows',
        tabs: 'settings (workflow configuration), workflowTasks (task sequence)'
    },
    'workflow_tasks_list': { 
        method: 'openWorkflowTasksList', 
        params: [],
        description: 'Opens list of all workflow tasks (individual steps like validation, API calls, notifications) across workflows. Planned feature.',
        category: 'Workflows'
    },
    'workflow_task_details': { 
        method: 'openWorkflowTaskDetails', 
        params: ['taskName', 'initialTab'],
        description: 'Opens details for a specific workflow task showing settings, parameters, conditions, and actions.',
        category: 'Workflows',
        tabs: 'settings (task configuration), parameters (task parameters), conditions (execution conditions), actions (task actions)'
    },
    
    // Report and API Views
    'report_details': { 
        method: 'openReportDetails', 
        params: ['reportName', 'initialTab'],
        description: 'Opens details editor for a specific report with configuration, parameters, filters, and outputs.',
        category: 'Reports & APIs',
        tabs: 'settings (report configuration), inputControls (parameters and filters), buttons (actions and downloads), outputVars (data outputs)'
    },
    'apis_list': { 
        method: 'openAPIsList', 
        params: [],
        description: 'Opens list of all external API integrations with endpoints, authentication, request/response formats. Planned feature.',
        category: 'Reports & APIs'
    },
    'api_details': { 
        method: 'openAPIDetails', 
        params: ['apiName', 'initialTab'],
        description: 'Opens details for a specific API integration showing endpoint configuration, schema, and error handling.',
        category: 'Reports & APIs',
        tabs: 'settings (endpoint, authentication, headers), requestResponse (schema and samples), errorHandling (retry logic, fallbacks)'
    },
    
    // Analysis and Metrics Views
    'metrics_analysis': { 
        method: 'openMetricsAnalysis', 
        params: ['initialTab'],
        description: 'Opens metrics analysis showing application KPIs, performance metrics, and historical trends.',
        category: 'Analysis',
        tabs: 'current (current metric values with filters), history (historical trends with charts)'
    },
    'lexicon': { 
        method: 'openLexicon', 
        params: [],
        description: 'Opens application lexicon (glossary) showing business terminology, domain terms, acronyms, and concept definitions.',
        category: 'Analysis'
    },
    'change_requests': { 
        method: 'openChangeRequests', 
        params: [],
        description: 'Opens change requests view showing pending and completed modification requests with status, priority, and impact assessment.',
        category: 'Analysis'
    },
    'model_ai_processing': { 
        method: 'openModelAIProcessing', 
        params: [],
        description: 'Opens AI processing view with AI-powered analysis, recommendations, pattern detection, and optimization suggestions. Requires authentication.',
        category: 'Analysis'
    },
    'model_validation_requests': { 
        method: 'openModelValidationRequests', 
        params: [],
        description: 'Opens validation requests view showing validation status, history, timestamps, and detailed results. Requires authentication.',
        category: 'Analysis'
    },
    'model_feature_catalog': { 
        method: 'openModelFeatureCatalog', 
        params: [],
        description: 'Opens feature catalog showing available features and enhancements with descriptions, dependencies, and implementation status. Requires authentication.',
        category: 'Analysis'
    },
    'fabrication_requests': { 
        method: 'openFabricationRequests', 
        params: [],
        description: 'Opens fabrication requests view showing code generation request status, history, and download links. Requires authentication.',
        category: 'Analysis'
    },
    'fabrication_blueprint_catalog': { 
        method: 'openFabricationBlueprintCatalog', 
        params: [],
        description: 'Opens blueprint catalog with reusable model patterns and pre-built components (user management, audit logging, etc.). Requires authentication.',
        category: 'Analysis'
    },
    
    // Diagram Views
    'hierarchy_diagram': { 
        method: 'openHierarchyDiagram', 
        params: [],
        description: 'Opens data object hierarchy diagram visualizing parent-child relationships and entity relationship model structure.',
        category: 'Diagrams'
    },
    'page_flow_diagram': { 
        method: 'openPageFlowDiagram', 
        params: ['initialTab'],
        description: 'Opens page flow diagram showing navigation paths between pages and user journey visualization.',
        category: 'Diagrams',
        tabs: 'diagram (force directed graph), mermaid (text-based diagram), userjourney (path analysis), statistics (flow metrics)'
    },
    
    // Settings and Help Views
    'project_settings': { 
        method: 'openProjectSettings', 
        params: [],
        description: 'Opens project settings showing configuration for code generation, database connections, deployment targets, and metadata.',
        category: 'Settings & Help'
    },
    'settings': { 
        method: 'openSettings', 
        params: [],
        description: 'Opens VS Code extension settings for editor behavior, UI themes, validation levels, and auto-save options.',
        category: 'Settings & Help'
    },
    'welcome': { 
        method: 'openWelcome', 
        params: [],
        description: 'Opens welcome screen with getting started information, recent projects, documentation links, and quick actions.',
        category: 'Settings & Help'
    },
    'help': { 
        method: 'openHelp', 
        params: [],
        description: 'Opens help documentation with user guides, tutorials, API references, troubleshooting tips, and support contact.',
        category: 'Settings & Help'
    },
    'register': { 
        method: 'openRegister', 
        params: [],
        description: 'Opens model services registration form for creating a new account with user information and organization details.',
        category: 'Settings & Help'
    },
    'login': { 
        method: 'openLogin', 
        params: [],
        description: 'Opens model services login form for authentication to access cloud features, collaboration, and synchronization.',
        category: 'Settings & Help'
    },
    
    // Wizard Views
    'add_data_object_wizard': { 
        method: 'openAddDataObjectWizard', 
        params: [],
        description: 'Opens Add Data Object Wizard with guided steps for creating individual objects or bulk import, including lookup objects and child objects.',
        category: 'Wizards'
    },
    'add_report_wizard': { 
        method: 'openAddReportWizard', 
        params: [],
        description: 'Opens Add Report Wizard with guided steps for creating reports including type selection, column configuration, parameters, and filters.',
        category: 'Wizards'
    },
    'add_form_wizard': { 
        method: 'openAddFormWizard', 
        params: [],
        description: 'Opens Add Form Wizard with 5-step workflow: select owner object, choose role, specify if creating new instance, select target object/action, set form name. Creates both form and page init flow.',
        category: 'Wizards'
    },
    'add_general_flow_wizard': { 
        method: 'openAddGeneralFlowWizard', 
        params: [],
        description: 'Opens Add General Flow Wizard for creating DynaFlows with owner objects, role requirements, target object selection, and new/existing instance workflows.',
        category: 'Wizards'
    },
};

/**
 * Generates the tool description from VIEW_METHOD_MAP
 */
function generateOpenViewDescription(): string {
    // Group views by category from their config
    const categories: Record<string, string[]> = {};
    
    for (const [viewName, config] of Object.entries(VIEW_METHOD_MAP)) {
        if (!categories[config.category]) {
            categories[config.category] = [];
        }
        categories[config.category].push(viewName);
    }
    
    // Build parameter requirements section
    const paramGroups: Record<string, string[]> = {};
    for (const [viewName, config] of Object.entries(VIEW_METHOD_MAP)) {
        for (const param of config.params) {
            if (param !== 'initialTab') {
                if (!paramGroups[param]) {
                    paramGroups[param] = [];
                }
                paramGroups[param].push(viewName);
            }
        }
    }
    
    let description = `Opens any view in the VS Code extension. This is a universal view opener that routes to the appropriate view handler.

PARAMETER REQUIREMENTS:\n`;
    
    for (const [param, views] of Object.entries(paramGroups)) {
        description += `- ${param} (required): ${views.join(', ')}\n`;
    }
    description += `- initialTab (optional): Many views support this for tab selection (see view descriptions below)\n`;
    
    description += `\nAVAILABLE VIEWS BY CATEGORY:\n`;
    
    // Add each category
    for (const [category, viewNames] of Object.entries(categories)) {
        if (viewNames.length === 0) {
            continue;
        }
        
        description += `\n${category}:\n`;
        for (const viewName of viewNames) {
            const config = VIEW_METHOD_MAP[viewName];
            const requiredParams = config.params.filter(p => p !== 'initialTab');
            const requiresText = requiredParams.length > 0 ? ` - REQUIRES ${requiredParams.join(', ')}` : '';
            const tabsText = config.tabs ? ` [tabs: ${config.tabs}]` : '';
            
            description += `- ${viewName}: ${config.description}${requiresText}${tabsText}\n`;
        }
    }
    
    return description;
}

/**
 * Get list of tool names for chatmode YAML
 */
export function getToolNames(): string[] {
    return ['open_view'];
}

/**
 * Generates chatmode documentation from VIEW_METHOD_MAP for inclusion in extension.ts
 * This provides users with a comprehensive guide to all available views
 */
export function generateChatmodeDocumentation(): string {
    // Group views by category
    const categories: Record<string, string[]> = {};
    
    for (const [viewName, config] of Object.entries(VIEW_METHOD_MAP)) {
        if (!categories[config.category]) {
            categories[config.category] = [];
        }
        categories[config.category].push(viewName);
    }
    
    // Count total views
    const totalViews = Object.keys(VIEW_METHOD_MAP).length;
    
    let doc = `**View Navigation:**
- Use the \`open_view\` tool to open any view in the extension
- When users say **"view"**, **"show"**, or **"open"**, use \`open_view\` with the appropriate viewName
- Examples: 
  - "view user stories" → \`open_view({ viewName: "user_stories" })\`
  - "show form details for Customer" → \`open_view({ viewName: "form_details", params: { formName: "Customer" } })\`
  - "open data objects" → \`open_view({ viewName: "data_objects_list" })\`

**Available Views (${totalViews} total, organized by category):**

`;
    
    // Generate documentation for each category
    for (const [category, viewNames] of Object.entries(categories)) {
        if (viewNames.length === 0) {
            continue;
        }
        
        doc += `**${category} (${viewNames.length} views):**\n`;
        
        for (const viewName of viewNames) {
            const config = VIEW_METHOD_MAP[viewName];
            const requiredParams = config.params.filter(p => p !== 'initialTab');
            const requiresText = requiredParams.length > 0 ? ` (REQUIRES ${requiredParams.join(', ')})` : '';
            const tabsText = config.tabs ? ` - tabs: ${config.tabs}` : '';
            
            doc += `- \`${viewName}\` - ${config.description}${requiresText}${tabsText}\n`;
        }
        
        doc += `\n`;
    }
    
    doc += `**Important Notes:**
- Views marked "REQUIRES" need specific parameters in the params object
- Many views support \`initialTab\` parameter for direct tab navigation
- Authentication is required for model services views (AI processing, validation, fabrication)`;
    
    return doc;
}

export function registerViewTools(server: McpServer, tools: ViewTools): void {
    // Register consolidated open_view tool with dynamically generated description
    server.registerTool('open_view', {
        title: 'Open View',
        description: generateOpenViewDescription(),
        inputSchema: {
            viewName: z.string().describe('Name of the view to open (e.g., "user_stories", "form_details", "page_preview")'),
            params: z.record(z.any()).optional().describe('Optional parameters for the view (e.g., { objectName: "Customer", initialTab: "props" })')
        },
        outputSchema: {
            success: z.boolean(),
            view: z.string().optional(),
            message: z.string().optional(),
            error: z.string().optional()
        }
    }, async ({ viewName, params = {} }) => {
        try {
            const viewConfig = VIEW_METHOD_MAP[viewName];
            
            if (!viewConfig) {
                // Generate helpful error with grouped views
                const viewGroups = {
                    'User Stories': Object.keys(VIEW_METHOD_MAP).filter(k => k.startsWith('user_stories') || k === 'requirements_fulfillment'),
                    'Data Objects': Object.keys(VIEW_METHOD_MAP).filter(k => k.includes('object') || k.includes('database')),
                    'Forms & Pages': Object.keys(VIEW_METHOD_MAP).filter(k => k.includes('form') || k.includes('page')),
                    'Workflows': Object.keys(VIEW_METHOD_MAP).filter(k => k.includes('workflow') || k.includes('flow')),
                    'Reports & APIs': Object.keys(VIEW_METHOD_MAP).filter(k => k.includes('report') || k.includes('api')),
                    'Analysis': Object.keys(VIEW_METHOD_MAP).filter(k => k.includes('metrics') || k.includes('model_') || k.includes('fabrication') || k.includes('lexicon') || k.includes('change')),
                    'Diagrams': Object.keys(VIEW_METHOD_MAP).filter(k => k.includes('diagram')),
                    'Settings & Help': Object.keys(VIEW_METHOD_MAP).filter(k => ['settings', 'welcome', 'help', 'register', 'login', 'project_settings'].includes(k)),
                    'Wizards': Object.keys(VIEW_METHOD_MAP).filter(k => k.includes('wizard'))
                };
                
                let errorMsg = `Unknown view: "${viewName}".\n\nAvailable views by category:\n`;
                for (const [category, views] of Object.entries(viewGroups)) {
                    if (views.length > 0) {
                        errorMsg += `\n${category}:\n  - ${views.join('\n  - ')}\n`;
                    }
                }
                throw new Error(errorMsg);
            }
            
            // Add view description to help users understand what they're opening
            console.log(`Opening view: ${viewName}`);
            console.log(`Description: ${viewConfig.description}`);
            if (viewConfig.tabs) {
                console.log(`Available tabs: ${viewConfig.tabs}`);
            }
            
            // Extract parameters in the correct order
            const args = viewConfig.params.map(paramName => params[paramName]).filter(arg => arg !== undefined);
            
            // Validate required parameters
            const requiredParams = viewConfig.params.filter(p => !p.includes('Tab'));
            const missingParams = requiredParams.filter(p => !params[p]);
            if (missingParams.length > 0) {
                throw new Error(`Missing required parameters for view "${viewName}": ${missingParams.join(', ')}. Description: ${viewConfig.description}`);
            }
            
            // Call the appropriate method on ViewTools
            const method = tools[viewConfig.method] as any;
            if (typeof method !== 'function') {
                throw new Error(`View method "${String(viewConfig.method)}" is not implemented`);
            }
            
            const result = await method.apply(tools, args);
            
            // Enhance result with view metadata
            return {
                content: [{ 
                    type: 'text', 
                    text: JSON.stringify({
                        ...result,
                        viewName,
                        description: viewConfig.description,
                        tabs: viewConfig.tabs
                    }, null, 2) 
                }],
                structuredContent: {
                    ...result,
                    viewName,
                    description: viewConfig.description,
                    tabs: viewConfig.tabs
                }
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

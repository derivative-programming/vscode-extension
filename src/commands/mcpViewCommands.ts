// mcpViewCommands.ts
// MCP-specific commands for opening views
// Created on: October 15, 2025
// These commands are NOT in the command palette - they're only for MCP use
// They provide MCP-friendly parameters (strings, not complex objects)

import * as vscode from 'vscode';
import { ModelService } from '../services/modelService';

/**
 * Register MCP-specific view commands
 * These commands are NOT in package.json contributes.commands
 * They are hidden from the command palette but callable via executeCommand()
 */
export function registerMcpViewCommands(context: vscode.ExtensionContext): void {
    const modelService = ModelService.getInstance();

    // Open user stories view
    // Description: Opens the User Stories view showing all user stories with their roles, descriptions, and acceptance criteria
    // Tabs: 'stories' (list of all user stories), 'details' (story details table), 'analytics' (role distribution analytics)
    // Parameters: initialTab (optional) - One of: 'stories', 'details', 'analytics'
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openUserStories', async (initialTab?: string) => {
            // Delegate to existing command
            return vscode.commands.executeCommand('appdna.showUserStories', initialTab);
        })
    );

    // Open user stories dev view
    // Description: Opens the User Story Development tracking view with sprint planning, assignments, and forecasting
    // Tabs: 'details' (story development details), 'devQueue' (priority queue), 'analysis' (status analytics), 
    //       'board' (kanban board), 'sprint' (sprint management), 'developers' (developer assignments),
    //       'forecast' (timeline forecasting), 'cost' (cost analysis)
    // Parameters: initialTab (optional) - One of: 'details', 'devQueue', 'analysis', 'board', 'sprint', 'developers', 'forecast', 'cost'
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openUserStoriesDev', async (initialTab?: string) => {
            return vscode.commands.executeCommand('appdna.userStoriesDev', initialTab);
        })
    );

    // Open user stories QA view
    // Description: Opens the User Story QA/Testing workflow view for tracking testing progress and status
    // Tabs: 'details' (QA details), 'board' (testing board), 'analysis' (status distribution), 
    //       'forecast' (QA timeline), 'cost' (QA cost analysis)
    // Parameters: initialTab (optional) - One of: 'details', 'board', 'analysis', 'forecast', 'cost'
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openUserStoriesQA', async (initialTab?: string) => {
            return vscode.commands.executeCommand('appdna.userStoriesQA', initialTab);
        })
    );

    // Open user stories journey view
    // Description: Opens the User Journey visualization and analysis with multiple tabs
    // Tabs: 'user-stories' (story-page mappings), 'page-usage' (usage table), 'page-usage-treemap' (visual treemap),
    //       'page-usage-distribution' (usage histogram), 'page-usage-vs-complexity' (scatter plot),
    //       'journey-visualization' (complexity treemap), 'journey-distribution' (complexity histogram)
    // Parameters: initialTab (optional) - One of: 'user-stories', 'page-usage', 'page-usage-treemap', 'page-usage-distribution', 
    //             'page-usage-vs-complexity', 'journey-visualization', 'journey-distribution'
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openUserStoriesJourney', async (initialTab?: string) => {
            return vscode.commands.executeCommand('appdna.userStoriesJourney', initialTab);
        })
    );

    // Open user stories page mapping view
    // Description: Opens the Page Mapping view showing requirements and page-to-story relationships
    // Tabs: 'mapping' (page mapping table), 'statistics' (mapping statistics)
    // Parameters: None (initialTab not supported)
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openUserStoriesPageMapping', async () => {
            return vscode.commands.executeCommand('appdna.userStoriesPageMapping');
        })
    );

    // Open user stories role requirements view
    // Description: Shows which user roles are required to access and complete each user story
    // Opens view with title: "User Stories - Role Requirements"
    // Tabs: None
    // Parameters: None
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openUserStoriesRoleRequirements', async () => {
            return vscode.commands.executeCommand('appdna.showRoleRequirements');
        })
    );

    // Open requirements fulfillment view
    // Description: Shows role requirements fulfillment status across user stories, data objects, and journeys
    // Tabs: None
    // Parameters: None
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openRequirementsFulfillment', async () => {
            return vscode.commands.executeCommand('appdna.showRequirementsFulfillment');
        })
    );

    // Open object details by name (MCP-friendly - takes string instead of tree item)
    // Description: Opens the Data Object details view showing object configuration, properties, and lookup items
    // Tabs: 'settings' (object configuration), 'props' (object properties), 'lookupItems' (lookup values - only for lookup objects)
    // Parameters: objectName (required) - Name of the data object
    //            initialTab (optional) - One of: 'settings', 'props', 'lookupItems'
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openObjectDetails', async (objectName: string, initialTab?: string) => {
            if (!modelService.isFileLoaded()) {
                throw new Error('No App DNA file is currently loaded');
            }

            // Find the object in the model
            const objects = modelService.getAllObjects();
            const object = objects.find(o => o.name === objectName);
            
            if (!object) {
                throw new Error(`Object '${objectName}' not found. Available objects: ${objects.map(o => o.name).join(', ')}`);
            }
            
            // Create a mock tree item for the object
            const mockTreeItem = {
                label: objectName,
                resourceType: 'object',
                nodeType: 'object',
                contextValue: 'object'
            };
            
            // Open the details view
            return vscode.commands.executeCommand('appdna.showDetails', mockTreeItem, initialTab);
        })
    );

    // Open report details by name (MCP-friendly - takes string instead of tree item)
    // Description: Opens the Report details view showing report configuration, input controls, buttons, and output variables
    // Tabs: 'settings' (report configuration), 'inputControls' (parameters and filters), 'buttons' (actions and downloads), 'outputVars' (data outputs)
    // Parameters: reportName (required) - Name of the report
    //            initialTab (optional) - One of: 'settings', 'inputControls', 'buttons', 'outputVars'
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openReportDetails', async (reportName: string, initialTab?: string) => {
            if (!modelService.isFileLoaded()) {
                throw new Error('No App DNA file is currently loaded');
            }

            // Find the report in the model
            const reports = modelService.getAllReports();
            const report = reports.find(r => r.name === reportName);
            
            if (!report) {
                throw new Error(`Report '${reportName}' not found. Available reports: ${reports.map(r => r.name).join(', ')}`);
            }
            
            // Create a mock tree item for the report
            const mockTreeItem = {
                label: reportName,
                resourceType: 'report',
                nodeType: 'report',
                contextValue: 'reportItem'
            };
            
            // Open the report details view
            return vscode.commands.executeCommand('appdna.showReportDetails', mockTreeItem, initialTab);
        })
    );
    // Open form details by name (MCP-friendly - takes string instead of tree item)
    // Description: Opens the Form details view showing form configuration, parameters, buttons, and output variables
    // Parameters: formName (required) - Name of the form (from pageObjectWorkflow)
    //            initialTab (optional) - One of available tabs (if form details view supports tabs)
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openFormDetails', async (formName: string, initialTab?: string) => {
            // Find the form in the model
            const allPageWorkflows = modelService.getAllPageObjectWorkflows();
            const form = allPageWorkflows.find(workflow => {
                const workflowName = workflow.name || workflow.titleText || 'Unnamed Form';
                return workflowName === formName;
            });
            
            if (!form) {
                const formNames = allPageWorkflows.map(w => w.name || w.titleText || 'Unnamed Form');
                throw new Error(`Form '${formName}' not found. Available forms: ${formNames.join(', ')}`);
            }
            
            // Create a mock tree item for the form
            const mockTreeItem = {
                label: formName,
                resourceType: 'pageObjectWorkflow',
                nodeType: 'pageObjectWorkflow',
                contextValue: 'pageObjectWorkflow'
            };
            
            // Open the form details view
            return vscode.commands.executeCommand('appdna.showFormDetails', mockTreeItem, initialTab);
        })
    );

    // Open hierarchy diagram
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openHierarchyDiagram', async () => {
            return vscode.commands.executeCommand('appdna.showHierarchyDiagram');
        })
    );

    // Open page flow diagram
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openPageFlowDiagram', async () => {
            return vscode.commands.executeCommand('appdna.showPageFlowDiagram');
        })
    );

    // Open welcome screen
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openWelcome', async () => {
            return vscode.commands.executeCommand('appdna.showWelcome');
        })
    );

    // Open settings view
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openSettings', async () => {
            return vscode.commands.executeCommand('appdna.showAppDNASettings');
        })
    );

    // Open add data object wizard
    // Description: Opens the Add Data Object Wizard for creating new data objects
    // Parameters: None
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openAddDataObjectWizard', async () => {
            if (!modelService.isFileLoaded()) {
                throw new Error('No App DNA file is currently loaded');
            }
            return vscode.commands.executeCommand('appdna.addObject');
        })
    );

    // Open add report wizard
    // Description: Opens the Add Report Wizard for creating a new report
    // Parameters: None
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openAddReportWizard', async () => {
            return vscode.commands.executeCommand('appdna.addReport');
        })
    );
    // Open Add Form Wizard
    // Description: Opens the wizard for creating a new form
    // Parameters: None
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openAddFormWizard', async () => {
            if (!modelService.isFileLoaded()) {
                throw new Error('No App DNA file is currently loaded');
            }
            return vscode.commands.executeCommand('appdna.addForm');
        })
    );

    // Open Page Preview with specific page selection
    // Description: Opens the page preview view and selects a specific page
    // Parameters: pageName (required) - Name of the form or report to preview
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openPagePreview', async (pageName: string) => {
            if (!modelService.isFileLoaded()) {
                throw new Error('No App DNA file is currently loaded');
            }
            if (!pageName) {
                throw new Error('Page name is required');
            }
            const { showPagePreviewWithSelection } = require('../webviews/pagepreview/pagePreviewView');
            return showPagePreviewWithSelection(context, modelService, pageName);
        })
    );

    // Open validation request details modal
    // Description: Opens the Model Validation Requests view and displays the details modal for a specific request
    // Parameters: requestCode (required) - The validation request code to show details for
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openValidationRequestDetails', async (requestCode: string) => {
            if (!requestCode) {
                throw new Error('Request code is required');
            }
            // Open the validation view first, then trigger the details modal
            await vscode.commands.executeCommand('appdna.modelValidation', requestCode);
            return { success: true, requestCode };
        })
    );

    // Open AI processing request details modal
    // Description: Opens the Model AI Processing Requests view and displays the details modal for a specific request
    // Parameters: requestCode (required) - The AI processing request code to show details for
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openAIProcessingRequestDetails', async (requestCode: string) => {
            if (!requestCode) {
                throw new Error('Request code is required');
            }
            // Open the AI processing view first, then trigger the details modal
            await vscode.commands.executeCommand('appdna.modelAIProcessing', requestCode);
            return { success: true, requestCode };
        })
    );

    // Open fabrication request details modal
    // Description: Opens the Model Fabrication Requests view and displays the details modal for a specific request
    // Parameters: requestCode (required) - The fabrication request code to show details for
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openFabricationRequestDetails', async (requestCode: string) => {
            if (!requestCode) {
                throw new Error('Request code is required');
            }
            // Open the fabrication view first, then trigger the details modal
            await vscode.commands.executeCommand('appdna.modelFabrication', requestCode);
            return { success: true, requestCode };
        })
    );

    // Open Page Init Flow Details
    // Description: Opens the details editor for a specific page initialization flow
    // Parameters: flowName (required) - Name of the page init flow, initialTab (optional)
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openPageInitFlowDetails', async (flowName: string, initialTab?: string) => {
            if (!modelService.isFileLoaded()) {
                throw new Error('No App DNA file is currently loaded');
            }
            if (!flowName) {
                throw new Error('Flow name is required');
            }
            const pageInitDetailsView = require('../webviews/pageInitDetailsView');
            const item = { label: flowName, contextValue: 'pageInit' };
            return pageInitDetailsView.showPageInitDetails(item, modelService, context);
        })
    );

    // Open General Workflow Details
    // Description: Opens the details editor for a specific general workflow
    // Parameters: workflowName (required) - Name of the general workflow, initialTab (optional)
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openGeneralWorkflowDetails', async (workflowName: string, initialTab?: string) => {
            if (!modelService.isFileLoaded()) {
                throw new Error('No App DNA file is currently loaded');
            }
            if (!workflowName) {
                throw new Error('Workflow name is required');
            }
            const generalFlowDetailsView = require('../webviews/generalFlow/generalFlowDetailsView');
            const item = { label: workflowName, contextValue: 'generalFlow' };
            return generalFlowDetailsView.showGeneralFlowDetails(item, modelService, context);
        })
    );

    // Open Workflow Details
    // Description: Opens the details editor for a specific DynaFlow workflow
    // Parameters: workflowName (required) - Name of the workflow, initialTab (optional)
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openWorkflowDetails', async (workflowName: string, initialTab?: string) => {
            if (!modelService.isFileLoaded()) {
                throw new Error('No App DNA file is currently loaded');
            }
            if (!workflowName) {
                throw new Error('Workflow name is required');
            }
            const workflowDetailsView = require('../webviews/workflowDetailsView');
            const item = { label: workflowName, contextValue: 'workflow' };
            return workflowDetailsView.showWorkflowDetails(item, modelService, context);
        })
    );

    // Open Workflow Task Details
    // Description: Opens the details editor for a specific workflow task
    // Parameters: taskName (required) - Name of the workflow task, initialTab (optional)
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openWorkflowTaskDetails', async (taskName: string, initialTab?: string) => {
            if (!modelService.isFileLoaded()) {
                throw new Error('No App DNA file is currently loaded');
            }
            if (!taskName) {
                throw new Error('Task name is required');
            }
            const workflowTaskDetailsView = require('../webviews/workflowTaskDetailsView');
            const item = { label: taskName, contextValue: 'workflowTask' };
            return workflowTaskDetailsView.showWorkflowTaskDetails(item, modelService, context);
        })
    );

    // Open APIs List View
    // Description: Opens the list view showing all external API integrations
    // Parameters: None
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openAPIsList', async () => {
            if (!modelService.isFileLoaded()) {
                throw new Error('No App DNA file is currently loaded');
            }
            // Note: This view needs to be implemented - placeholder for now
            throw new Error('APIs List view is not yet implemented. API management features are under development.');
        })
    );

    // Open API Details
    // Description: Opens the details editor for a specific API integration
    // Parameters: apiName (required) - Name of the API, initialTab (optional)
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openAPIDetails', async (apiName: string, initialTab?: string) => {
            if (!modelService.isFileLoaded()) {
                throw new Error('No App DNA file is currently loaded');
            }
            if (!apiName) {
                throw new Error('API name is required');
            }
            const apiDetailsView = require('../webviews/apis/apiDetailsView');
            const item = { label: apiName, contextValue: 'api' };
            return apiDetailsView.showApiDetails(item, modelService, context);
        })
    );

    // Open Change Requests View
    // Description: Opens the change requests view showing pending and completed modification requests
    // Parameters: None
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openChangeRequests', async () => {
            if (!modelService.isFileLoaded()) {
                throw new Error('No App DNA file is currently loaded');
            }
            // Delegate to existing command if it exists
            return vscode.commands.executeCommand('appdna.showChangeRequests');
        })
    );

    // Open Workflow Tasks List View
    // Description: Opens the list view showing all workflow tasks across all workflows
    // Parameters: None
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openWorkflowTasksList', async () => {
            if (!modelService.isFileLoaded()) {
                throw new Error('No App DNA file is currently loaded');
            }
            // Note: This view needs to be implemented - placeholder for now
            throw new Error('Workflow Tasks List view is not yet implemented. Use the workflow list view to access individual workflow tasks.');
        })
    );

    // Generic view opener - routes to specific commands based on view name
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openView', async (viewName: string, params?: any) => {
            const viewMap: Record<string, string> = {
                'user-stories': 'appdna.mcp.openUserStories',
                'user-stories-dev': 'appdna.mcp.openUserStoriesDev',
                'user-stories-qa': 'appdna.mcp.openUserStoriesQA',
                'user-stories-journey': 'appdna.mcp.openUserStoriesJourney',
                'user-stories-page-mapping': 'appdna.mcp.openUserStoriesPageMapping',
                'object-details': 'appdna.mcp.openObjectDetails',
                'report-details': 'appdna.mcp.openReportDetails',
                'hierarchy': 'appdna.mcp.openHierarchyDiagram',
                'page-flow': 'appdna.mcp.openPageFlowDiagram',
                'welcome': 'appdna.mcp.openWelcome',
                'settings': 'appdna.mcp.openSettings',
                'add-data-object-wizard': 'appdna.mcp.openAddDataObjectWizard',
                'add-form-wizard': 'appdna.mcp.openAddFormWizard'
            };
            
            const command = viewMap[viewName];
            if (!command) {
                throw new Error(`Unknown view: ${viewName}. Available views: ${Object.keys(viewMap).join(', ')}`);
            }
            
            // Extract arguments from params
            const args = params?.args || [];
            
            return vscode.commands.executeCommand(command, ...args);
        })
    );

    console.log('[MCP View Commands] Registered successfully');
}

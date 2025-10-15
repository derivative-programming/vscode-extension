// viewTools.ts
// Tools for opening views via MCP
// Created on: October 15, 2025
// This file implements view opening tools for the MCP server with comprehensive descriptions

/**
 * Implements view opening tools for the MCP server
 * Each tool opens a specific view in the VS Code extension
 */
export class ViewTools {
    constructor() {
        // No dependencies needed - just executes commands
    }

    /**
     * Execute a VS Code command with optional arguments via HTTP bridge
     * Uses the same HTTP bridge as UserStoryTools to communicate with the extension
     */
    private async executeCommand(command: string, args: any[] = []): Promise<any> {
        return new Promise((resolve, reject) => {
            const http = require('http');
            
            const postData = JSON.stringify({ command, args });
            
            const options = {
                hostname: 'localhost',
                port: 3002,
                path: '/api/execute-command',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 5000 // 5 second timeout
            };

            const req = http.request(options, (res: any) => {
                let data = '';
                
                res.on('data', (chunk: any) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.success) {
                            resolve({
                                success: true,
                                view: command,
                                message: 'View opened successfully'
                            });
                        } else {
                            reject(new Error(response.error || 'Command execution failed'));
                        }
                    } catch (error) {
                        reject(new Error('Invalid response from extension'));
                    }
                });
            });

            req.on('error', (error: any) => {
                reject(new Error(`HTTP bridge connection failed: ${error.message}. Is the extension running and HTTP bridge started?`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Command execution timed out. Is the extension responding?'));
            });

            req.write(postData);
            req.end();
        });
    }

    // ===== USER STORY VIEWS =====

    /**
     * Open User Stories List View
     * Shows all user stories in a tabbed interface with analytics
     */
    public async openUserStories(initialTab?: string): Promise<any> {
        return this.executeCommand('appdna.mcp.openUserStories', initialTab ? [initialTab] : []);
    }

    /**
     * Open User Stories Dev View
     * Shows development queue and analytics for user stories
     */
    public async openUserStoriesDev(initialTab?: string): Promise<any> {
        return this.executeCommand('appdna.mcp.openUserStoriesDev', initialTab ? [initialTab] : []);
    }

    /**
     * Open User Stories QA View
     * Shows QA queue and testing analytics for user stories
     */
    public async openUserStoriesQA(initialTab?: string): Promise<any> {
        return this.executeCommand('appdna.mcp.openUserStoriesQA', initialTab ? [initialTab] : []);
    }

    /**
     * Open User Stories Journey View
     * Shows user journey mapping and flow
     */
    public async openUserStoriesJourney(): Promise<any> {
        return this.executeCommand('appdna.mcp.openUserStoriesJourney');
    }

    /**
     * Open User Stories Page Mapping View
     * Shows which pages are used by which user stories
     */
    public async openUserStoriesPageMapping(): Promise<any> {
        return this.executeCommand('appdna.mcp.openUserStoriesPageMapping');
    }

    /**
     * Open User Stories Role Requirements View
     * Shows role-based access requirements for user stories
     */
    public async openUserStoriesRoleRequirements(): Promise<any> {
        return this.executeCommand('appdna.mcp.openUserStoriesRoleRequirements');
    }

    // ===== DATA OBJECT VIEWS =====

    /**
     * Open Data Object Details View
     * Shows properties, analytics, and lookup items for a specific data object
     */
    public async openObjectDetails(objectName: string, initialTab?: string): Promise<any> {
        const params = initialTab ? { initialTab } : undefined;
        return this.executeCommand('appdna.mcp.openObjectDetails', [objectName, params]);
    }

    /**
     * Open Data Objects List View
     * Shows all data objects in the model
     */
    public async openDataObjectsList(): Promise<any> {
        return this.executeCommand('appdna.openDataObjectsList');
    }

    /**
     * Open Data Object Usage Analysis View
     * Shows which pages, forms, and flows use each data object
     */
    public async openDataObjectUsageAnalysis(): Promise<any> {
        return this.executeCommand('appdna.openDataObjectUsageAnalysis');
    }

    /**
     * Open Data Object Size Analysis View
     * Shows estimated record counts and storage requirements
     */
    public async openDataObjectSizeAnalysis(): Promise<any> {
        return this.executeCommand('appdna.openDataObjectSizeAnalysis');
    }

    /**
     * Open Database Size Forecast View
     * Shows projected database growth over time
     */
    public async openDatabaseSizeForecast(): Promise<any> {
        return this.executeCommand('appdna.openDatabaseSizeForecast');
    }

    // ===== FORM AND PAGE VIEWS =====

    /**
     * Open Forms List View
     * Shows all forms in the application
     */
    public async openFormsList(): Promise<any> {
        return this.executeCommand('appdna.openFormsList');
    }

    /**
     * Open Form Details View
     * Shows details for a specific form
     */
    public async openFormDetails(formName: string, initialTab?: string): Promise<any> {
        const params = initialTab ? { initialTab } : undefined;
        return this.executeCommand('appdna.showFormDetails', [formName, params]);
    }

    /**
     * Open Pages List View
     * Shows all pages in the application
     */
    public async openPagesList(): Promise<any> {
        return this.executeCommand('appdna.openPagesList');
    }

    /**
     * Open Page Details View
     * Shows details for a specific page
     */
    public async openPageDetails(pageName: string, initialTab?: string): Promise<any> {
        const params = initialTab ? { initialTab } : undefined;
        return this.executeCommand('appdna.showPageDetails', [pageName, params]);
    }

    /**
     * Open Page Preview View
     * Shows live preview for a specific page
     */
    public async openPagePreview(pageName: string): Promise<any> {
        return this.executeCommand('appdna.showPagePreview', [pageName]);
    }

    // ===== WORKFLOW AND FLOW VIEWS =====

    /**
     * Open Page Init Flows List View
     * Shows initialization flows for pages
     */
    public async openPageInitFlowsList(): Promise<any> {
        return this.executeCommand('appdna.openPageInitFlowsList');
    }

    /**
     * Open Page Init Flow Details View
     * Shows details for a specific page initialization flow
     */
    public async openPageInitFlowDetails(flowName: string, initialTab?: string): Promise<any> {
        const params = initialTab ? { initialTab } : undefined;
        return this.executeCommand('appdna.showPageInitDetails', [flowName, params]);
    }

    /**
     * Open General Workflows List View
     * Shows general-purpose workflows
     */
    public async openGeneralWorkflowsList(): Promise<any> {
        return this.executeCommand('appdna.openGeneralWorkflowsList');
    }

    /**
     * Open General Workflow Details View
     * Shows details for a specific general workflow
     */
    public async openGeneralWorkflowDetails(workflowName: string, initialTab?: string): Promise<any> {
        const params = initialTab ? { initialTab } : undefined;
        return this.executeCommand('appdna.showGeneralFlowDetails', [workflowName, params]);
    }

    /**
     * Open Workflows List View
     * Shows all workflows in the application
     */
    public async openWorkflowsList(): Promise<any> {
        return this.executeCommand('appdna.openWorkflowsList');
    }

    /**
     * Open Workflow Details View
     * Shows details for a specific DynaFlow workflow
     */
    public async openWorkflowDetails(workflowName: string, initialTab?: string): Promise<any> {
        const params = initialTab ? { initialTab } : undefined;
        return this.executeCommand('appdna.showWorkflowDetails', [workflowName, params]);
    }

    /**
     * Open Workflow Tasks List View
     * Shows all workflow tasks across all workflows
     */
    public async openWorkflowTasksList(): Promise<any> {
        return this.executeCommand('appdna.openWorkflowTasksList');
    }

    /**
     * Open Workflow Task Details View
     * Shows details for a specific workflow task
     */
    public async openWorkflowTaskDetails(taskName: string, initialTab?: string): Promise<any> {
        const params = initialTab ? { initialTab } : undefined;
        return this.executeCommand('appdna.showWorkflowTaskDetails', [taskName, params]);
    }

    // ===== REPORT VIEWS =====

    /**
     * Open Reports List View
     * Shows all reports in the application
     */
    public async openReportsList(): Promise<any> {
        return this.executeCommand('appdna.openReportsList');
    }

    /**
     * Open Report Details View
     * Shows details for a specific report
     */
    public async openReportDetails(reportName: string, initialTab?: string): Promise<any> {
        const params = initialTab ? { initialTab } : undefined;
        return this.executeCommand('appdna.showReportDetails', [reportName, params]);
    }

    // ===== API VIEWS =====

    /**
     * Open APIs List View
     * Shows all external API integrations
     */
    public async openAPIsList(): Promise<any> {
        return this.executeCommand('appdna.openAPIsList');
    }

    /**
     * Open API Details View
     * Shows details for a specific API integration
     */
    public async openAPIDetails(apiName: string, initialTab?: string): Promise<any> {
        const params = initialTab ? { initialTab } : undefined;
        return this.executeCommand('appdna.showAPIDetails', [apiName, params]);
    }

    // ===== ANALYSIS VIEWS =====

    /**
     * Open Metrics Analysis View
     * Shows application metrics and KPIs with historical trends
     */
    public async openMetricsAnalysis(): Promise<any> {
        return this.executeCommand('appdna.openMetricsAnalysis');
    }

    /**
     * Open Lexicon View
     * Shows application terminology and definitions
     */
    public async openLexicon(): Promise<any> {
        return this.executeCommand('appdna.openLexicon');
    }

    /**
     * Open Change Requests View
     * Shows pending and completed change requests
     */
    public async openChangeRequests(): Promise<any> {
        return this.executeCommand('appdna.openChangeRequests');
    }

    /**
     * Open Model AI Processing View
     * Shows AI analysis and recommendations for the model
     */
    public async openModelAIProcessing(): Promise<any> {
        return this.executeCommand('appdna.openModelAIProcessing');
    }

    /**
     * Open Fabrication Blueprint Catalog View
     * Shows available templates and blueprints
     */
    public async openFabricationBlueprintCatalog(): Promise<any> {
        return this.executeCommand('appdna.openFabricationBlueprintCatalog');
    }

    // ===== DIAGRAM VIEWS =====

    /**
     * Open Hierarchy Diagram View
     * Shows object hierarchy relationships
     */
    public async openHierarchyDiagram(): Promise<any> {
        return this.executeCommand('appdna.openHierarchyDiagram');
    }

    /**
     * Open Page Flow Diagram View
     * Shows navigation flow between pages
     */
    public async openPageFlowDiagram(): Promise<any> {
        return this.executeCommand('appdna.openPageFlowDiagram');
    }

    // ===== SETTINGS AND INFO VIEWS =====

    /**
     * Open Project Settings View
     * Shows configuration options for the current project
     */
    public async openProjectSettings(): Promise<any> {
        return this.executeCommand('appdna.openProjectSettings');
    }

    /**
     * Open Extension Settings View
     * Shows VS Code extension settings
     */
    public async openSettings(): Promise<any> {
        return this.executeCommand('appdna.mcp.openSettings');
    }

    /**
     * Open Welcome View
     * Shows welcome screen and getting started information
     */
    public async openWelcome(): Promise<any> {
        return this.executeCommand('appdna.mcp.openWelcome');
    }

    /**
     * Open Help View
     * Shows help documentation and support resources
     */
    public async openHelp(): Promise<any> {
        return this.executeCommand('appdna.openHelp');
    }

    /**
     * Open Register View
     * Shows model services registration form
     */
    public async openRegister(): Promise<any> {
        return this.executeCommand('appdna.registerModelServices');
    }

    /**
     * Open Login View
     * Shows model services login form
     */
    public async openLogin(): Promise<any> {
        return this.executeCommand('appdna.loginModelServices');
    }
}

// viewTools.ts
// Tools for opening views via MCP
// Created on: October 15, 2025
// Modified on: October 19, 2025
// This file implements view opening tools for the MCP server with comprehensive descriptions
// Added authentication checks for Model Services views

/**
 * Implements view opening tools for the MCP server
 * Each tool opens a specific view in the VS Code extension
 */
export class ViewTools {
    constructor() {
        // No dependencies needed - just executes commands
    }

    /**
     * Check if user is logged in to Model Services via HTTP bridge
     */
    private async checkAuthStatus(): Promise<boolean> {
        return new Promise((resolve) => {
            const http = require('http');
            
            const options = {
                hostname: 'localhost',
                port: 3002,
                path: '/api/auth-status',
                method: 'GET',
                timeout: 2000 // 2 second timeout
            };

            const req = http.request(options, (res: any) => {
                let data = '';
                
                res.on('data', (chunk: any) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(response.success && response.isLoggedIn);
                    } catch (error) {
                        resolve(false);
                    }
                });
            });

            req.on('error', () => {
                resolve(false);
            });

            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });

            req.end();
        });
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
    public async openUserStoriesJourney(initialTab?: string): Promise<any> {
        return this.executeCommand('appdna.mcp.openUserStoriesJourney', initialTab ? [initialTab] : []);
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
     * Shows which user roles are required to access and complete each user story
     */
    public async openUserStoriesRoleRequirements(): Promise<any> {
        return this.executeCommand('appdna.mcp.openUserStoriesRoleRequirements');
    }

    /**
     * Open Requirements Fulfillment View
     * Shows role requirements fulfillment status across user stories, data objects, and journeys
     */
    public async openRequirementsFulfillment(): Promise<any> {
        return this.executeCommand('appdna.mcp.openRequirementsFulfillment');
    }

    // ===== DATA OBJECT VIEWS =====

    /**
     * Open Data Object Details View
     * Shows properties, analytics, and lookup items for a specific data object
     */
    public async openObjectDetails(objectName: string, initialTab?: string): Promise<any> {
        return this.executeCommand('appdna.mcp.openObjectDetails', initialTab ? [objectName, initialTab] : [objectName]);
    }

    /**
     * Open Data Objects List View
     * Shows all data objects in the model
     */
    public async openDataObjectsList(): Promise<any> {
        return this.executeCommand('appdna.dataObjectList');
    }

    /**
     * Open Data Object Usage Analysis View
     * Shows which pages, forms, and flows use each data object
     */
    public async openDataObjectUsageAnalysis(initialTab?: string): Promise<any> {
        return this.executeCommand('appdna.dataObjectUsageAnalysis', initialTab ? [initialTab] : []);
    }

    /**
     * Open Data Object Size Analysis View
     * Shows estimated record counts and storage requirements
     */
    public async openDataObjectSizeAnalysis(initialTab?: string): Promise<any> {
        return this.executeCommand('appdna.dataObjectSizeAnalysis', initialTab ? [initialTab] : []);
    }

    /**
     * Open Database Size Forecast View
     * Shows projected database growth over time
     */
    public async openDatabaseSizeForecast(initialTab?: string): Promise<any> {
        return this.executeCommand('appdna.databaseSizeForecast', initialTab ? [initialTab] : []);
    }

    // ===== FORM AND PAGE VIEWS =====

    /**
     * Open Form Details View
     * Shows details for a specific form
     */
    public async openFormDetails(formName: string, initialTab?: string): Promise<any> {
        return this.executeCommand('appdna.mcp.openFormDetails', initialTab ? [formName, initialTab] : [formName]);
    }

    /**
     * Open Pages List View
     * Shows all pages in the application
     */
    public async openPagesList(initialTab?: string): Promise<any> {
        return this.executeCommand('appdna.pageList', initialTab ? [initialTab] : []);
    }

    /**
     * Open Page Details View
     * Smart router that automatically determines if a page is a form or report and opens the appropriate view.
     * Queries the HTTP bridge to detect page type, then routes to openFormDetails() or openReportDetails().
     * Includes graceful fallback when bridge is unavailable.
     */
    public async openPageDetails(pageName: string, initialTab?: string): Promise<any> {
        try {
            // Try to fetch forms and reports lists from the bridge to determine type
            const http = require('http');
            
            // Helper function to fetch data from bridge
            const fetchFromBridge = (endpoint: string): Promise<any> => {
                return new Promise((resolve, reject) => {
                    const options = {
                        hostname: 'localhost',
                        port: 3001,
                        path: endpoint,
                        method: 'GET',
                        timeout: 3000
                    };

                    const req = http.request(options, (res: any) => {
                        let data = '';
                        res.on('data', (chunk: any) => { data += chunk; });
                        res.on('end', () => {
                            try {
                                resolve(JSON.parse(data));
                            } catch (error) {
                                reject(new Error('Invalid JSON response'));
                            }
                        });
                    });

                    req.on('error', reject);
                    req.on('timeout', () => {
                        req.destroy();
                        reject(new Error('Request timeout'));
                    });
                    req.end();
                });
            };

            // Try to determine if it's a form or report
            let isForm = false;
            let isReport = false;

            try {
                // Check if it's in forms list
                const forms = await fetchFromBridge('/api/forms');
                if (Array.isArray(forms) && forms.some((f: any) => f.name === pageName)) {
                    isForm = true;
                }
            } catch (error) {
                // Ignore errors, will check reports too
            }

            if (!isForm) {
                try {
                    // Check if it's in reports list
                    const reports = await fetchFromBridge('/api/reports');
                    if (Array.isArray(reports) && reports.some((r: any) => r.name === pageName)) {
                        isReport = true;
                    }
                } catch (error) {
                    // Ignore errors
                }
            }

            // Route to appropriate view
            if (isForm) {
                return await this.openFormDetails(pageName, initialTab);
            } else if (isReport) {
                return await this.openReportDetails(pageName, initialTab);
            } else {
                // If we can't determine, try report first (more common), then form
                try {
                    return await this.openReportDetails(pageName, initialTab);
                } catch (reportError) {
                    try {
                        return await this.openFormDetails(pageName, initialTab);
                    } catch (formError) {
                        throw new Error(`Could not find page "${pageName}" in forms or reports. Please verify the page name exists in your model.`);
                    }
                }
            }
        } catch (error) {
            throw new Error(`Failed to open page details for "${pageName}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Open Page Preview View
     * Shows live preview for a specific page
     * @param pageName Optional name of page to preview (if omitted, opens without selection)
     */
    public async openPagePreview(pageName?: string): Promise<any> {
        return this.executeCommand('appdna.mcp.openPagePreview', pageName ? [pageName] : []);
    }

    /**
     * Open Validation Request Details Modal
     * Opens the Model Validation Requests view and displays the details modal for a specific request
     * @param requestCode The validation request code to show details for
     */
    public async openValidationRequestDetails(requestCode: string): Promise<any> {
        // Check authentication before opening Model Services views
        const isLoggedIn = await this.checkAuthStatus();
        if (!isLoggedIn) {
            throw new Error('You must be logged in to Model Services to view validation requests. Use the login tool first.');
        }
        
        if (!requestCode) {
            throw new Error('Request code is required to open validation request details');
        }
        
        return this.executeCommand('appdna.mcp.openValidationRequestDetails', [requestCode]);
    }

    /**
     * Open AI Processing Request Details Modal
     * Opens the Model AI Processing Requests view and displays the details modal for a specific request
     * @param requestCode The AI processing request code to show details for
     */
    public async openAIProcessingRequestDetails(requestCode: string): Promise<any> {
        // Check authentication before opening Model Services views
        const isLoggedIn = await this.checkAuthStatus();
        if (!isLoggedIn) {
            throw new Error('You must be logged in to Model Services to view AI processing requests. Use the login tool first.');
        }
        
        if (!requestCode) {
            throw new Error('Request code is required to open AI processing request details');
        }
        
        return this.executeCommand('appdna.mcp.openAIProcessingRequestDetails', [requestCode]);
    }

    /**
     * Open Fabrication Request Details Modal
     * Opens the Model Fabrication Requests view and displays the details modal for a specific request
     * @param requestCode The fabrication request code to show details for
     */
    public async openFabricationRequestDetails(requestCode: string): Promise<any> {
        // Check authentication before opening Model Services views
        const isLoggedIn = await this.checkAuthStatus();
        if (!isLoggedIn) {
            throw new Error('You must be logged in to Model Services to view fabrication requests. Use the login tool first.');
        }
        
        if (!requestCode) {
            throw new Error('Request code is required to open fabrication request details');
        }
        
        return this.executeCommand('appdna.mcp.openFabricationRequestDetails', [requestCode]);
    }

    // ===== WORKFLOW AND FLOW VIEWS =====

    /**
     * Open Page Init Flows List View
     * Shows initialization flows for pages
     */
    public async openPageInitFlowsList(): Promise<any> {
        return this.executeCommand('appdna.pageInitList');
    }

    /**
     * Open Page Init Flow Details View
     * Shows details for a specific page initialization flow
     * ⚠️ NOT IMPLEMENTED YET - Command does not exist
     */
    public async openPageInitFlowDetails(flowName: string, initialTab?: string): Promise<any> {
        throw new Error('Page Init Flow Details view is not yet implemented. Create page init details handler to add this functionality.');
    }

    /**
     * Open General Workflows List View
     * Shows general-purpose workflows
     */
    public async openGeneralWorkflowsList(): Promise<any> {
        return this.executeCommand('appdna.generalList');
    }

    /**
     * Open Add General Flow Wizard
     * Opens wizard to create new general workflows
     */
    public async openAddGeneralFlowWizard(): Promise<any> {
        return this.executeCommand('appdna.addGeneralFlow');
    }

    /**
     * Open General Workflow Details View
     * Shows details for a specific general workflow
     * ⚠️ NOT IMPLEMENTED YET - Command does not exist
     */
    public async openGeneralWorkflowDetails(workflowName: string, initialTab?: string): Promise<any> {
        throw new Error('General Workflow Details view is not yet implemented. Create general workflow details handler to add this functionality.');
    }

    /**
     * Open Workflows List View
     * Shows all workflows in the application
     */
    public async openWorkflowsList(): Promise<any> {
        return this.executeCommand('appdna.workflowList');
    }

    /**
     * Open Workflow Details View
     * Shows details for a specific DynaFlow workflow
     * ⚠️ NOT IMPLEMENTED YET - Command does not exist
     */
    public async openWorkflowDetails(workflowName: string, initialTab?: string): Promise<any> {
        throw new Error('Workflow Details view is not yet implemented. Create workflow details handler to add this functionality.');
    }

    /**
     * Open Workflow Tasks List View
     * Shows all workflow tasks across all workflows
     * ⚠️ NOT IMPLEMENTED YET - Command does not exist
     */
    public async openWorkflowTasksList(): Promise<any> {
        throw new Error('Workflow Tasks List view is not yet implemented. Create workflowTaskListCommands.ts to add this functionality.');
    }

    /**
     * Open Workflow Task Details View
     * Shows details for a specific workflow task
     * ⚠️ NOT IMPLEMENTED YET - Command does not exist
     */
    public async openWorkflowTaskDetails(taskName: string, initialTab?: string): Promise<any> {
        throw new Error('Workflow Task Details view is not yet implemented. Create workflow task details handler to add this functionality.');
    }

    // ===== REPORT VIEWS =====

    /**
     * Open Report Details View
     * Shows details for a specific report
     */
    public async openReportDetails(reportName: string, initialTab?: string): Promise<any> {
        return this.executeCommand('appdna.mcp.openReportDetails', initialTab ? [reportName, initialTab] : [reportName]);
    }

    /**
     * Open Page Details (Smart Router)
     * Intelligently determines if a page is a form or report and opens the appropriate view
     * @param pageName Name of the page (form or report)
     * @param initialTab Optional tab to display
     * @returns Result from opening the appropriate view
     */
    // ===== API VIEWS =====

    /**
     * Open APIs List View
     * Shows all external API integrations
     * ⚠️ NOT IMPLEMENTED YET - Command does not exist
     */
    public async openAPIsList(): Promise<any> {
        throw new Error('APIs List view is not yet implemented. Create apiListCommands.ts to add this functionality.');
    }

    /**
     * Open API Details View
     * Shows details for a specific API integration
     * ⚠️ NOT IMPLEMENTED YET - Command does not exist
     */
    public async openAPIDetails(apiName: string, initialTab?: string): Promise<any> {
        throw new Error('API Details view is not yet implemented. Create API details handler to add this functionality.');
    }

    // ===== ANALYSIS VIEWS =====

    /**
     * Open Metrics Analysis View
     * Shows application metrics and KPIs with historical trends
     * @param initialTab Optional tab to display: 'current' or 'history'
     */
    public async openMetricsAnalysis(initialTab?: string): Promise<any> {
        return this.executeCommand('appdna.metricsAnalysis', initialTab ? [initialTab] : []);
    }

    /**
     * Open Lexicon View
     * Shows application terminology and definitions
     */
    public async openLexicon(): Promise<any> {
        return this.executeCommand('appdna.showLexicon');
    }

    /**
     * Open Change Requests View
     * Shows pending and completed change requests
     * ⚠️ NOT IMPLEMENTED YET - Command does not exist
     */
    public async openChangeRequests(): Promise<any> {
        throw new Error('Change Requests view is not yet implemented. Command appdna.changeRequests does not exist.');
    }

    /**
     * Open Model AI Processing View
     * Shows AI analysis and recommendations for the model
     * Requires authentication to Model Services
     */
    public async openModelAIProcessing(): Promise<any> {
        const isLoggedIn = await this.checkAuthStatus();
        if (!isLoggedIn) {
            return {
                success: false,
                error: 'Authentication required. Please log in to Model Services first using the open_login_view tool or click Login under Model Services in the tree view.'
            };
        }
        return this.executeCommand('appdna.modelAIProcessing');
    }

    /**
     * Open Model Validation Requests View
     * Shows validation request status and history
     * Requires authentication to Model Services
     */
    public async openModelValidationRequests(): Promise<any> {
        const isLoggedIn = await this.checkAuthStatus();
        if (!isLoggedIn) {
            return {
                success: false,
                error: 'Authentication required. Please log in to Model Services first using the open_login_view tool or click Login under Model Services in the tree view.'
            };
        }
        return this.executeCommand('appdna.modelValidation');
    }

    /**
     * Open Model Feature Catalog View
     * Shows available features and enhancements
     * Requires authentication to Model Services
     */
    public async openModelFeatureCatalog(): Promise<any> {
        const isLoggedIn = await this.checkAuthStatus();
        if (!isLoggedIn) {
            return {
                success: false,
                error: 'Authentication required. Please log in to Model Services first using the open_login_view tool or click Login under Model Services in the tree view.'
            };
        }
        return this.executeCommand('appdna.modelFeatureCatalog');
    }

    /**
     * Open Fabrication Requests View
     * Shows fabrication request status and code generation history
     * Requires authentication to Model Services
     */
    public async openFabricationRequests(): Promise<any> {
        const isLoggedIn = await this.checkAuthStatus();
        if (!isLoggedIn) {
            return {
                success: false,
                error: 'Authentication required. Please log in to Model Services first using the open_login_view tool or click Login under Model Services in the tree view.'
            };
        }
        return this.executeCommand('appdna.modelFabrication');
    }

    /**
     * Open Fabrication Blueprint Catalog View
     * Shows available templates and blueprints
     * Requires authentication to Model Services
     */
    public async openFabricationBlueprintCatalog(): Promise<any> {
        const isLoggedIn = await this.checkAuthStatus();
        if (!isLoggedIn) {
            return {
                success: false,
                error: 'Authentication required. Please log in to Model Services first using the open_login_view tool or click Login under Model Services in the tree view.'
            };
        }
        return this.executeCommand('appdna.fabricationBlueprintCatalog');
    }

    // ===== DIAGRAM VIEWS =====

    /**
     * Open Hierarchy Diagram View
     * Shows object hierarchy relationships
     */
    public async openHierarchyDiagram(): Promise<any> {
        return this.executeCommand('appdna.showHierarchyDiagram');
    }

    /**
     * Open Page Flow Diagram View
     * Shows navigation flow between pages
     * @param initialTab Optional tab to display: 'diagram', 'mermaid', 'userjourney', or 'statistics'
     */
    public async openPageFlowDiagram(initialTab?: string): Promise<any> {
        return this.executeCommand('appdna.showPageFlowDiagram', initialTab ? [initialTab] : []);
    }

    // ===== SETTINGS AND INFO VIEWS =====

    /**
     * Open Project Settings View
     * Shows configuration options for the current project
     */
    public async openProjectSettings(): Promise<any> {
        return this.executeCommand('appdna.showProjectSettings');
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
        return this.executeCommand('appdna.showHelp');
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

    // ===== WIZARD VIEWS =====

    /**
     * Open Add Data Object Wizard
     * Opens the wizard for creating new data objects with guided steps
     */
    public async openAddDataObjectWizard(): Promise<any> {
        return this.executeCommand('appdna.mcp.openAddDataObjectWizard');
    }

    /**
     * Open Add Report Wizard
     * Opens the wizard for creating new reports with guided steps
     */
    public async openAddReportWizard(): Promise<any> {
        return this.executeCommand('appdna.mcp.openAddReportWizard');
    }

    /**
     * Open Add Form Wizard
     * Opens the wizard for creating new forms with guided steps
     */
    public async openAddFormWizard(): Promise<any> {
        return this.executeCommand('appdna.mcp.openAddFormWizard');
    }
}

// reportTools.ts
// Tools for managing reports via MCP
// Created on: October 25, 2025
// This file implements report tools for the MCP server

/**
 * Implements report tools for the MCP server
 */
export class ReportTools {
    constructor(modelService: any) {
        // ModelService passed but not used - MCP server uses HTTP bridge
    }

    /**
     * Gets the schema definition for reports
     * Tool name: get_report_schema (following MCP snake_case convention)
     * @returns Schema definition with properties, validation rules, and examples for reports
     */
    public async get_report_schema(): Promise<any> {
        return {
            success: true,
            schema: {
                type: 'object',
                description: 'Report structure in AppDNA model - represents data visualization and reporting interfaces',
                objectType: 'report',
                properties: {
                    name: {
                        type: 'string',
                        required: true,
                        format: 'PascalCase',
                        pattern: '^[A-Z][A-Za-z0-9]*$',
                        description: 'Report ID, unique for each report. Must be in PascalCase format (starts with uppercase letter, no spaces, can contain letters and numbers).',
                        examples: ['CustomerList', 'SalesReport', 'OrderHistory', 'ProductCatalog', 'UserActivityReport']
                    },
                    titleText: {
                        type: 'string',
                        required: false,
                        description: 'Title displayed on the report page. Human-readable title for the report UI.',
                        examples: ['Customer List', 'Sales Report', 'Order History', 'Product Catalog']
                    },
                    visualizationType: {
                        type: 'string',
                        required: false,
                        enum: ['Grid', 'PieChart', 'LineChart', 'FlowChart', 'CardView', 'FolderView'],
                        description: 'Type of visualization for the report data.',
                        examples: ['Grid', 'PieChart', 'LineChart', 'CardView']
                    }
                },
                notes: [
                    'Reports represent data visualization and display interfaces',
                    'Each report belongs to a data object (owner)',
                    'Report names typically follow the pattern: Entity + Type (CustomerList, SalesReport)',
                    'All boolean flags must be string "true" or "false", not boolean values'
                ]
            },
            note: 'This schema defines the complete structure of reports in the AppDNA model'
        };
    }

    /**
     * Gets a specific report by name from an owner object
     * Tool name: get_report (following MCP snake_case convention)
     * @param parameters Object containing report_name (required) and owner_object_name (optional)
     * @returns Complete report object with all arrays (params, columns, buttons) and element counts
     */
    public async get_report(parameters?: any): Promise<any> {
        const { owner_object_name, report_name } = parameters || {};

        // Validate required parameters
        const validationErrors: string[] = [];
        
        if (!report_name) {
            validationErrors.push('report_name is required');
        }

        if (validationErrors.length > 0) {
            return {
                success: false,
                error: 'Validation failed',
                validationErrors: validationErrors,
                note: 'report_name is required (case-sensitive). owner_object_name is optional - if not provided, all objects will be searched.'
            };
        }

        try {
            let endpoint: string;
            let reports: any[];
            
            if (owner_object_name) {
                // If owner specified, fetch reports filtered by both owner and report name
                endpoint = `/api/reports?owner_object_name=${encodeURIComponent(owner_object_name)}&report_name=${encodeURIComponent(report_name)}`;
            } else {
                // If owner not specified, fetch reports filtered by report name only
                endpoint = `/api/reports?report_name=${encodeURIComponent(report_name)}`;
            }
            
            reports = await this.fetchFromBridge(endpoint);
            
            // Check if we found the report
            if (!reports || reports.length === 0) {
                if (owner_object_name) {
                    return {
                        success: false,
                        error: `Report "${report_name}" not found in owner object "${owner_object_name}"`,
                        note: 'Report name and owner object name matching is case-insensitive. Use list_pages with page_type="Report" to see available reports.',
                        validationErrors: [`Report "${report_name}" does not exist in owner object "${owner_object_name}"`]
                    };
                } else {
                    return {
                        success: false,
                        error: `Report "${report_name}" not found in any object`,
                        note: 'Report name matching is case-insensitive. Use list_pages with page_type="Report" to see available reports.',
                        validationErrors: [`Report "${report_name}" does not exist in the model`]
                    };
                }
            }
            
            // Get the first (and should be only) report from results
            const report = reports[0];
            const ownerObjectName = report._ownerObjectName;
            
            // Remove the temporary _ownerObjectName property
            delete report._ownerObjectName;

            // Calculate element counts
            const paramCount = report.reportParam ? report.reportParam.length : 0;
            const columnCount = report.reportColumn ? report.reportColumn.length : 0;
            const buttonCount = report.reportButton ? report.reportButton.length : 0;
            const totalElements = paramCount + columnCount + buttonCount;

            return {
                success: true,
                report: report,
                owner_object_name: ownerObjectName,
                element_counts: {
                    paramCount: paramCount,
                    columnCount: columnCount,
                    buttonCount: buttonCount,
                    totalElements: totalElements
                },
                note: `Report "${report_name}" retrieved successfully from owner object "${ownerObjectName}". ` +
                      `Contains ${paramCount} parameter(s), ${columnCount} column(s), and ${buttonCount} button(s).`
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not retrieve report: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to retrieve reports. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Helper method to fetch data from the HTTP bridge
     * @param endpoint API endpoint to fetch from
     * @returns Parsed JSON response
     */
    private async fetchFromBridge(endpoint: string): Promise<any> {
        const http = await import('http');
        
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 3001,
                path: endpoint,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const req = http.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(data);
                        resolve(parsedData);
                    } catch (error) {
                        reject(new Error(`Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Bridge connection failed: ${error.message}`));
            });

            req.end();
        });
    }

    /**
     * Suggests report name and title based on context
     * Tool name: suggest_report_name_and_title
     * @param parameters - Context for suggestion (owner, role, visualization_type, target)
     * @returns Suggested report name (PascalCase) and title (human-readable)
     */
    public async suggest_report_name_and_title(parameters: {
        owner_object_name: string;
        role_required?: string;
        visualization_type?: string;
        target_child_object?: string;
    }): Promise<any> {
        const { owner_object_name, role_required, visualization_type, target_child_object } = parameters;

        try {
            // Validate owner object exists
            const endpoint = `/api/data-objects`;
            const allObjects = await this.fetchFromBridge(endpoint);
            
            const ownerObject = allObjects.find((obj: any) => obj.name === owner_object_name);
            if (!ownerObject) {
                return {
                    success: false,
                    error: `Owner object "${owner_object_name}" not found`,
                    note: 'Owner object name must match exactly (case-sensitive). Use list_data_object_summary to see available objects.',
                    validationErrors: [`Owner object "${owner_object_name}" does not exist in the model`]
                };
            }

            // Validate role_required exists if provided
            if (role_required) {
                try {
                    const roles = await this.fetchFromBridge('/api/roles');
                    const roleExists = roles.some((role: any) => role.name === role_required);
                    if (!roleExists) {
                        return {
                            success: false,
                            error: `Role "${role_required}" not found`,
                            note: 'Role must match exactly (case-sensitive). Use list_roles to see available roles.',
                            validationErrors: [`Role "${role_required}" does not exist in the Role lookup object`]
                        };
                    }
                } catch (error) {
                    return {
                        success: false,
                        error: 'Could not validate role',
                        note: 'Unable to fetch roles from the model. The Role lookup object may not exist or the bridge connection failed.',
                        validationErrors: ['Failed to validate role_required parameter']
                    };
                }
            }

            // Validate target_child_object exists if provided
            if (target_child_object) {
                const targetObject = allObjects.find((obj: any) => obj.name === target_child_object);
                if (!targetObject) {
                    return {
                        success: false,
                        error: `Target child object "${target_child_object}" not found`,
                        note: 'Target child object name must match exactly (case-sensitive). Use list_data_object_summary to see available objects.',
                        validationErrors: [`Target child object "${target_child_object}" does not exist in the model`]
                    };
                }
            }

            // Build base report name (PascalCase)
            let baseReportName = target_child_object || owner_object_name;
            if (role_required) {
                baseReportName = role_required + baseReportName;
            }
            
            // Add visualization type suffix if not Grid (default)
            const vizType = visualization_type || 'Grid';
            if (vizType !== 'Grid') {
                baseReportName += vizType;
            } else {
                // For Grid type, add "List" suffix if it's a list of items
                if (target_child_object || !baseReportName.endsWith('List')) {
                    baseReportName += 'List';
                }
            }

            // Check for duplicates and append numeric suffix if needed
            const existingReportNames: string[] = [];
            for (const obj of allObjects) {
                if (obj.report && Array.isArray(obj.report)) {
                    for (const report of obj.report) {
                        if (report.name) {
                            existingReportNames.push(report.name.toLowerCase());
                        }
                    }
                }
            }

            let reportName = baseReportName;
            let suffix = 1;
            while (existingReportNames.includes(reportName.toLowerCase())) {
                reportName = baseReportName + suffix;
                suffix++;
            }

            // Build suggested title (human-readable with spaces)
            const targetReadable = target_child_object ? this.convertToHumanReadable(target_child_object) : this.convertToHumanReadable(owner_object_name);
            
            let reportTitle = targetReadable;
            if (vizType !== 'Grid') {
                reportTitle += ' ' + this.convertToHumanReadable(vizType);
            } else {
                reportTitle += ' List';
            }

            // Add numeric suffix to title if it was added to the name
            if (suffix > 1) {
                reportTitle += ' ' + (suffix - 1);
            }

            return {
                success: true,
                suggestions: {
                    report_name: reportName,
                    title_text: reportTitle
                },
                context: {
                    owner_object_name: owner_object_name,
                    role_required: role_required || null,
                    visualization_type: vizType,
                    target_child_object: target_child_object || null
                },
                note: reportName !== baseReportName 
                    ? `Suggested names follow PascalCase convention. A numeric suffix was added to "${baseReportName}" because that report name already exists.`
                    : 'Suggested names follow PascalCase convention. You can modify these suggestions before creating the report.'
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not generate suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Creates a new report in the specified owner data object
     * Tool name: create_report
     * @param parameters - Report creation parameters
     * @returns Success status with created report details or validation errors
     */
    public async create_report(parameters: {
        owner_object_name: string;
        report_name: string;
        title_text: string;
        visualization_type?: string;
        role_required?: string;
        target_child_object?: string;
    }): Promise<any> {
        const { owner_object_name, report_name, title_text, visualization_type, role_required, target_child_object } = parameters;

        // Validation array
        const validationErrors: string[] = [];

        try {
            // Validate report_name format (PascalCase)
            const namePattern = /^[A-Z][a-zA-Z0-9]*$/;
            if (!report_name || report_name.trim() === '') {
                validationErrors.push('Report name is required and cannot be empty');
            } else if (!namePattern.test(report_name)) {
                validationErrors.push('Report name must be in PascalCase format (start with uppercase letter, only letters and numbers allowed)');
            }

            // Validate title_text
            if (!title_text || title_text.trim() === '') {
                validationErrors.push('Title text is required and cannot be empty');
            } else if (title_text.length > 100) {
                validationErrors.push('Title text cannot exceed 100 characters');
            }

            // Validate visualization_type if provided
            const validVisualizationTypes = ['Grid', 'PieChart', 'LineChart', 'FlowChart', 'CardView', 'FolderView'];
            const vizType = visualization_type || 'Grid';
            if (!validVisualizationTypes.includes(vizType)) {
                validationErrors.push(`Visualization type must be one of: ${validVisualizationTypes.join(', ')}`);
            }

            // If validation errors at this point, return early
            if (validationErrors.length > 0) {
                return {
                    success: false,
                    error: 'Validation failed',
                    validationErrors: validationErrors,
                    note: 'Please fix the validation errors and try again.'
                };
            }

            // Fetch all objects to validate owner and check for duplicates
            const endpoint = `/api/data-objects`;
            const allObjects = await this.fetchFromBridge(endpoint);

            // Validate owner object exists (case-sensitive exact match)
            const ownerObject = allObjects.find((obj: any) => obj.name === owner_object_name);
            if (!ownerObject) {
                validationErrors.push(`Owner object "${owner_object_name}" not found (case-sensitive match required)`);
                return {
                    success: false,
                    error: `Owner object "${owner_object_name}" not found`,
                    validationErrors: validationErrors,
                    note: 'Owner object name must match exactly (case-sensitive). Use list_data_object_summary to see available objects.'
                };
            }

            // Validate target_child_object if provided (case-sensitive exact match)
            if (target_child_object) {
                const targetObject = allObjects.find((obj: any) => obj.name === target_child_object);
                if (!targetObject) {
                    validationErrors.push(`Target child object "${target_child_object}" not found (case-sensitive match required)`);
                    return {
                        success: false,
                        error: `Target child object "${target_child_object}" not found`,
                        validationErrors: validationErrors,
                        note: 'Target child object name must match exactly (case-sensitive). Use list_data_object_summary to see available objects.'
                    };
                }
            }

            // Validate role_required if provided (case-sensitive exact match)
            if (role_required) {
                try {
                    const roles = await this.fetchFromBridge('/api/roles');
                    const roleExists = roles.some((role: any) => role.name === role_required);
                    if (!roleExists) {
                        validationErrors.push(`Role "${role_required}" not found in the Role lookup object`);
                        return {
                            success: false,
                            error: `Role "${role_required}" not found`,
                            validationErrors: validationErrors,
                            note: 'Role must match exactly (case-sensitive). Use list_roles to see available roles.'
                        };
                    }
                } catch (error) {
                    validationErrors.push('Failed to validate role_required parameter');
                    return {
                        success: false,
                        error: 'Could not validate role',
                        validationErrors: validationErrors,
                        note: 'Unable to fetch roles from the model. The Role lookup object may not exist or the bridge connection failed.'
                    };
                }
            }

            // Check for duplicate report names (case-insensitive across all objects)
            const reportNameLower = report_name.toLowerCase();
            for (const obj of allObjects) {
                if (obj.report && Array.isArray(obj.report)) {
                    const duplicate = obj.report.find((rpt: any) => 
                        rpt.name && rpt.name.toLowerCase() === reportNameLower
                    );
                    if (duplicate) {
                        validationErrors.push(`Report name "${report_name}" already exists in object "${obj.name}" (case-insensitive check)`);
                        return {
                            success: false,
                            error: `Report name "${report_name}" already exists`,
                            validationErrors: validationErrors,
                            note: 'Report names must be unique across all data objects (case-insensitive). Use a different name.'
                        };
                    }
                }
            }

            // Create the new report object
            const newReport: any = {
                name: report_name,
                titleText: title_text,
                visualizationType: vizType,
                isCustomSqlUsed: "false",
                isPage: "true",
                reportColumn: [],
                reportButton: [
                    {
                        buttonName: "Back",
                        buttonText: "Back",
                        buttonType: "back",
                        isVisible: "true"
                    }
                ],
                reportParam: []
            };

            // Add optional properties based on parameters
            if (role_required) {
                newReport.isAuthorizationRequired = "true";
                newReport.roleRequired = role_required;
                newReport.layoutName = role_required + "Layout";
            } else {
                newReport.isAuthorizationRequired = "false";
            }

            if (target_child_object) {
                newReport.targetChildObject = target_child_object;
            }

            // Create page init flow
            const pageInitFlowName = report_name + "InitReport";
            newReport.initObjectWorkflowName = pageInitFlowName;

            const newPageInitFlow = {
                name: pageInitFlowName,
                titleText: title_text + " Page Init",
                objectWorkflowOutputVar: []
            };

            // Add report and page init flow to owner object via HTTP bridge POST
            const createEndpoint = `/api/create-report`;
            const postData = {
                ownerObjectName: owner_object_name,
                report: newReport,
                pageInitFlow: newPageInitFlow
            };

            // Use HTTP POST to create the report
            const http = await import('http');
            const result = await new Promise((resolve, reject) => {
                const postDataString = JSON.stringify(postData);
                const options = {
                    hostname: 'localhost',
                    port: 3001,
                    path: createEndpoint,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postDataString)
                    }
                };

                const req = http.request(options, (res) => {
                    let data = '';

                    res.on('data', (chunk) => {
                        data += chunk;
                    });

                    res.on('end', () => {
                        try {
                            const parsedData = JSON.parse(data);
                            resolve(parsedData);
                        } catch (error) {
                            reject(new Error(`Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`));
                        }
                    });
                });

                req.on('error', (error) => {
                    reject(new Error(`Bridge connection failed: ${error.message}`));
                });

                req.write(postDataString);
                req.end();
            });

            return {
                success: true,
                report: newReport,
                page_init_flow: newPageInitFlow,
                owner_object_name: owner_object_name,
                message: `Report "${report_name}" and page init flow "${pageInitFlowName}" created successfully`,
                note: 'Report has been added to the model with default Back button. Use add_report_param to add filter parameters, add_report_column to add columns, and add_report_button to add custom buttons.'
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not create report: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to create reports. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Converts PascalCase to human-readable format with spaces
     * @param text - PascalCase text
     * @returns Human-readable text with spaces
     */
    private convertToHumanReadable(text: string): string {
        if (!text) {
            return '';
        }
        return text.replace(/([A-Z])/g, ' $1').trim();
    }
}

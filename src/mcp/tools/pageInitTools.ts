// pageInitTools.ts
// Tools for managing page init flows (objectWorkflow for page initialization) via MCP
// Created on: October 26, 2025
// This file implements page init flow tools for the MCP server

/**
 * Implements page init flow tools for the MCP server
 */
export class PageInitTools {
    constructor(modelService: any) {
        // ModelService passed but not used - MCP server uses HTTP bridge
    }

    /**
     * Gets the schema definition for page init flows (objectWorkflow for page initialization)
     * Tool name: get_page_init_flow_schema (following MCP snake_case convention)
     * @returns Schema definition with properties, validation rules, and examples for page init flows
     */
    public async get_page_init_flow_schema(): Promise<any> {
        return {
            success: true,
            schema: {
                type: "object",
                description: "Page Init Flow (objectWorkflow) structure in AppDNA model - represents page initialization workflows that prepare data before page display. Note: The Page Init Details View displays a curated subset of 7 properties in the Settings tab, while the full objectWorkflow schema contains 40+ properties. This schema documents what is actually shown and editable in the UI.",
                objectType: "objectWorkflow",
                category: "pageInitFlow",
                displayedInUI: {
                    settingsTab: ["name", "isAuthorizationRequired", "isCustomLogicOverwritten", "isExposedInBusinessObject", "isRequestRunViaDynaFlowAllowed", "pageIntroText", "pageTitleText", "roleRequired"],
                    outputVariablesTab: "objectWorkflowOutputVar (all properties)"
                },
                properties: {
                    name: {
                        type: "string",
                        required: true,
                        format: "PascalCase",
                        pattern: "^[A-Z][A-Za-z0-9]*(InitObjWF|InitReport)$",
                        description: "Page init flow ID, unique for each flow. Must be in PascalCase format and end with 'InitObjWF' or 'InitReport'. This naming convention identifies workflows as page initialization flows in the tree view.",
                        examples: ["CustomerListInitObjWF", "UpdateFlavorInitObjWF", "ProductDetailsInitObjWF", "OrderFormInitReport", "SalesDataInitReport"],
                        displayedInUI: true,
                        editableInUI: false,
                        uiNote: "Displayed in header, not editable in Settings tab"
                    },
                    isAuthorizationRequired: {
                        type: "string",
                        required: false,
                        enum: ["true", "false"],
                        description: "Does this page init flow require user authorization? String \"true\" or \"false\".",
                        examples: ["true", "false"],
                        displayedInUI: true,
                        editableInUI: true,
                        uiTab: "Settings"
                    },
                    isCustomLogicOverwritten: {
                        type: "string",
                        required: false,
                        enum: ["true", "false"],
                        description: "Is custom logic overwritten for this page init flow? String \"true\" or \"false\".",
                        examples: ["true", "false"],
                        displayedInUI: true,
                        editableInUI: true,
                        uiTab: "Settings"
                    },
                    isExposedInBusinessObject: {
                        type: "string",
                        required: false,
                        enum: ["true", "false"],
                        description: "Is this page init flow exposed in the business object layer? String \"true\" or \"false\".",
                        examples: ["true", "false"],
                        displayedInUI: true,
                        editableInUI: true,
                        uiTab: "Settings"
                    },
                    isRequestRunViaDynaFlowAllowed: {
                        type: "string",
                        required: false,
                        enum: ["true", "false"],
                        description: "Can this page init flow be run via DynaFlow? String \"true\" or \"false\".",
                        examples: ["true", "false"],
                        displayedInUI: true,
                        editableInUI: true,
                        uiTab: "Settings"
                    },
                    pageIntroText: {
                        type: "string",
                        required: false,
                        description: "Introduction text displayed at the top of the page after initialization.",
                        examples: ["Welcome to the customer list", "View and manage your orders", "Product details"],
                        displayedInUI: true,
                        editableInUI: true,
                        uiTab: "Settings"
                    },
                    pageTitleText: {
                        type: "string",
                        required: false,
                        description: "Title text displayed on the page after initialization.",
                        examples: ["Customer List", "Order Management", "Product Details"],
                        displayedInUI: true,
                        editableInUI: true,
                        uiTab: "Settings"
                    },
                    roleRequired: {
                        type: "string",
                        required: false,
                        description: "Name of the role required to run this page init flow. Should match a role name from the Role lookup object.",
                        examples: ["Administrator", "Manager", "User", "ReadOnlyUser"],
                        displayedInUI: true,
                        editableInUI: true,
                        uiTab: "Settings"
                    }
                },
                hiddenProperties: {
                    note: "The following properties exist in the full objectWorkflow schema but are NOT displayed in the Page Init Details View UI",
                    list: [
                        "codeDescription",
                        "isIgnored",
                        "isIgnoredInDocumentation",
                        "initObjectWorkflowName",
                        "isCachingAllowed",
                        "cacheExpirationInMinutes",
                        "badgeCountPropertyName",
                        "isHeaderLabelsVisible",
                        "isReportDetailLabelColumnVisible",
                        "isAzureBlobStorageUsed",
                        "azureTableNameOverride",
                        "isAzureTablePrimaryKeyColumnDateTime",
                        "workflowType",
                        "workflowSubType",
                        "isAsync",
                        "asyncTimeoutMinutes",
                        "isEmailNotificationRequired",
                        "emailNotificationTemplateName",
                        "isAuditLogRequired",
                        "auditLogMessage",
                        "isCustomHandlerRequired",
                        "customHandlerClassName",
                        "customHandlerMethodName",
                        "isValidationRequired",
                        "validationRuleName",
                        "isAuthorizationBypassAllowed",
                        "authorizationBypassReason",
                        "isDevelopmentOnly",
                        "developmentDescription",
                        "isLegacySupported",
                        "legacyCompatibilityVersion",
                        "isMobileOptimized",
                        "mobileViewName",
                        "isTabletOptimized",
                        "tabletViewName",
                        "formFooterImageURL",
                        "footerImageURL",
                        "headerImageURL",
                        "isCreditCardEntryUsed",
                        "isDynaFlow",
                        "isDynaFlowTask",
                        "isCustomPageViewUsed",
                        "isImpersonationPage",
                        "isPage",
                        "visualizationType",
                        "and 10+ more workflow-related properties"
                    ]
                },
                objectWorkflowOutputVar: {
                    type: "array",
                    description: "Output variables that are produced by the page init flow and made available to the page. The Page Init Flow Details View displays 19 properties for each output variable in a specific order.",
                    displayedInUI: true,
                    uiTab: "Output Variables",
                    displayOrder: ["buttonNavURL", "buttonObjectWFName", "buttonText", "conditionalVisiblePropertyName", "dataSize", "dataType", "defaultValue", "fKObjectName", "labelText", "isAutoRedirectURL", "isFK", "isFKLookup", "isLabelVisible", "isHeaderText", "isIgnored", "isLink", "isVisible", "sourceObjectName", "sourcePropertyName"],
                    items: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                required: true,
                                format: "PascalCase",
                                pattern: "^[A-Z][A-Za-z0-9]*$",
                                description: "Output variable name. Must be in PascalCase format (starts with uppercase letter, no spaces, can contain letters and numbers).",
                                examples: ["CustomerList", "TotalRecords", "FilteredResults", "UserPermissions"],
                                displayedInUI: true,
                                editableInUI: false,
                                uiNote: "Shown in list, not editable in details form"
                            },
                            buttonNavURL: {
                                type: "string",
                                required: false,
                                description: "Navigation URL when this output variable is clicked (if isLink is true).",
                                examples: ["/customer/details", "/order/view", "/product/edit"],
                                displayedInUI: true,
                                editableInUI: true,
                                displayOrder: 1
                            },
                            buttonObjectWFName: {
                                type: "string",
                                required: false,
                                description: "Workflow name to navigate to when this output variable is clicked.",
                                examples: ["CustomerDetails", "OrderView", "ProductEdit"],
                                displayedInUI: true,
                                editableInUI: true,
                                displayOrder: 2
                            },
                            buttonText: {
                                type: "string",
                                required: false,
                                description: "Button text if this output variable is displayed as a button.",
                                examples: ["View Details", "Edit", "Delete"],
                                displayedInUI: true,
                                editableInUI: true,
                                displayOrder: 3
                            },
                            conditionalVisiblePropertyName: {
                                type: "string",
                                required: false,
                                description: "Name of the property that controls conditional visibility of this output variable.",
                                examples: ["IsAdministrator", "HasPermission", "IsActive"],
                                displayedInUI: true,
                                editableInUI: true,
                                displayOrder: 4
                            },
                            dataSize: {
                                type: "string",
                                required: false,
                                description: "Size specification for the data type (e.g., '50' for varchar(50), '18,2' for decimal(18,2)). Also known as sqlServerDBDataTypeSize in schema.",
                                examples: ["50", "100", "18,2", "MAX"],
                                schemaVariant: "sqlServerDBDataTypeSize",
                                displayedInUI: true,
                                editableInUI: true,
                                displayOrder: 5
                            },
                            dataType: {
                                type: "string",
                                required: false,
                                enum: ["varchar", "nvarchar", "int", "bigint", "decimal", "money", "datetime", "date", "time", "bit", "uniqueidentifier", "text", "ntext"],
                                description: "SQL Server data type for this output variable. Also known as sqlServerDBDataType in schema.",
                                examples: ["varchar", "int", "datetime", "bit", "uniqueidentifier"],
                                schemaVariant: "sqlServerDBDataType",
                                displayedInUI: true,
                                editableInUI: true,
                                displayOrder: 6
                            },
                            defaultValue: {
                                type: "string",
                                required: false,
                                description: "Default value for this output variable if not set by the flow.",
                                examples: ["0", "", "NULL", "[]"],
                                displayedInUI: true,
                                editableInUI: true,
                                displayOrder: 7
                            },
                            fKObjectName: {
                                type: "string",
                                required: false,
                                description: "Name of the foreign key object target (data object name). Case-sensitive. Has browse button in UI.",
                                examples: ["Customer", "Order", "Status", "Role"],
                                displayedInUI: true,
                                editableInUI: true,
                                hasBrowseButton: true,
                                displayOrder: 8
                            },
                            labelText: {
                                type: "string",
                                required: false,
                                description: "Display label for this output variable (if shown in UI).",
                                examples: ["Customer List", "Total Records", "Filtered Results"],
                                schemaVariants: ["headerText", "headerLabelText"],
                                displayedInUI: true,
                                editableInUI: true,
                                displayOrder: 9
                            },
                            isAutoRedirectURL: {
                                type: "string",
                                required: false,
                                enum: ["true", "false"],
                                description: "Should the page automatically redirect to this URL after initialization? String \"true\" or \"false\".",
                                examples: ["true", "false"],
                                displayedInUI: true,
                                editableInUI: true,
                                displayOrder: 10
                            },
                            isFK: {
                                type: "string",
                                required: false,
                                enum: ["true", "false"],
                                description: "Is this output variable a foreign key reference? String \"true\" or \"false\".",
                                examples: ["true", "false"],
                                displayedInUI: true,
                                editableInUI: true,
                                displayOrder: 11
                            },
                            isFKLookup: {
                                type: "string",
                                required: false,
                                enum: ["true", "false"],
                                description: "Is this output variable a foreign key to a lookup object? String \"true\" or \"false\".",
                                examples: ["true", "false"],
                                displayedInUI: true,
                                editableInUI: true,
                                displayOrder: 12
                            },
                            isLabelVisible: {
                                type: "string",
                                required: false,
                                enum: ["true", "false"],
                                description: "Is the label for this output variable visible? String \"true\" or \"false\".",
                                examples: ["true", "false"],
                                schemaVariants: ["isHeaderLabelsVisible", "isHeaderLabelVisible"],
                                displayedInUI: true,
                                editableInUI: true,
                                displayOrder: 13
                            },
                            isHeaderText: {
                                type: "string",
                                required: false,
                                enum: ["true", "false"],
                                description: "Is this output variable displayed as header text? String \"true\" or \"false\".",
                                examples: ["true", "false"],
                                displayedInUI: true,
                                editableInUI: true,
                                displayOrder: 14
                            },
                            isIgnored: {
                                type: "string",
                                required: false,
                                enum: ["true", "false"],
                                description: "Should this output variable be ignored by the code generator? String \"true\" or \"false\". Use instead of deleting.",
                                examples: ["true", "false"],
                                displayedInUI: true,
                                editableInUI: true,
                                displayOrder: 15
                            },
                            isLink: {
                                type: "string",
                                required: false,
                                enum: ["true", "false"],
                                description: "Should this output variable be displayed as a clickable link? String \"true\" or \"false\".",
                                examples: ["true", "false"],
                                displayedInUI: true,
                                editableInUI: true,
                                displayOrder: 16
                            },
                            isVisible: {
                                type: "string",
                                required: false,
                                enum: ["true", "false"],
                                description: "Is this output variable visible in the UI? String \"true\" or \"false\".",
                                examples: ["true", "false"],
                                displayedInUI: true,
                                editableInUI: true,
                                displayOrder: 17
                            },
                            sourceObjectName: {
                                type: "string",
                                required: false,
                                description: "Name of the source data object for this output variable (case-sensitive). Has browse button in UI.",
                                examples: ["Customer", "Order", "Product", "User"],
                                displayedInUI: true,
                                editableInUI: true,
                                hasBrowseButton: true,
                                displayOrder: 18
                            },
                            sourcePropertyName: {
                                type: "string",
                                required: false,
                                description: "Name of the source property from the source object (case-sensitive, PascalCase).",
                                examples: ["FirstName", "LastName", "EmailAddress", "TotalAmount"],
                                displayedInUI: true,
                                editableInUI: true,
                                displayOrder: 19
                            }
                        }
                    }
                },
                usage: {
                    description: "Page init flows are used to initialize pages before display. They prepare data, check permissions, and set up the initial state of the page.",
                    examples: [
                        {
                            name: "CustomerListInitObjWF",
                            isAuthorizationRequired: "true",
                            roleRequired: "User",
                            pageTitleText: "Customer List",
                            pageIntroText: "View and manage customers",
                            objectWorkflowOutputVar: [
                                {
                                    name: "CustomerList",
                                    dataType: "nvarchar",
                                    dataSize: "MAX",
                                    sourceObjectName: "Customer",
                                    isVisible: "true"
                                },
                                {
                                    name: "TotalCustomers",
                                    dataType: "int",
                                    defaultValue: "0",
                                    isVisible: "true",
                                    labelText: "Total Customers"
                                }
                            ]
                        },
                        {
                            name: "ProductDetailsInitObjWF",
                            isAuthorizationRequired: "true",
                            pageTitleText: "Product Details",
                            objectWorkflowOutputVar: [
                                {
                                    name: "ProductName",
                                    dataType: "varchar",
                                    dataSize: "100",
                                    sourceObjectName: "Product",
                                    sourcePropertyName: "Name",
                                    isVisible: "true"
                                },
                                {
                                    name: "ProductPrice",
                                    dataType: "money",
                                    sourceObjectName: "Product",
                                    sourcePropertyName: "Price",
                                    isVisible: "true"
                                }
                            ]
                        }
                    ]
                },
                notes: [
                    "Page init flows are stored in the objectWorkflow array of a data object",
                    "Page init flows are IDENTIFIED by their naming convention: names must end with 'InitObjWF' or 'InitReport' (case-insensitive)",
                    "This naming convention is how the tree view and tools distinguish page init flows from forms and reports",
                    "Page init flows typically have output variables (objectWorkflowOutputVar) but no parameters or buttons",
                    "Page init flows run before the page is displayed to prepare data and check permissions",
                    "Forms and reports reference page init flows via the initObjectWorkflowName property",
                    "IMPORTANT: The Page Init Details View displays only 7 properties in the Settings tab (curated list)",
                    "The full objectWorkflow schema contains 40+ properties, but most are hidden in the UI as they are not relevant for page init flows",
                    "Properties like isDynaFlow, isAsync, workflowType, etc. are workflow-related and hidden from the page init UI",
                    "The UI follows the principle of showing only what's relevant for page initialization scenarios"
                ]
            }
        };
    }

    /**
     * Gets a specific page init flow by name
     * Tool name: get_page_init_flow (following MCP snake_case convention)
     * Page init flows are identified by names ending in "InitObjWF" or "InitReport" (case-insensitive)
     * @param parameters Object containing page_init_flow_name (required) and owner_object_name (optional)
     * @returns Complete page init flow object with all output variables and element counts
     */
    public async get_page_init_flow(parameters?: any): Promise<any> {
        const { owner_object_name, page_init_flow_name } = parameters || {};

        // Validate required parameters
        const validationErrors: string[] = [];
        
        if (!page_init_flow_name) {
            validationErrors.push('page_init_flow_name is required');
        }

        if (validationErrors.length > 0) {
            return {
                success: false,
                error: 'Validation failed',
                validationErrors: validationErrors,
                note: 'page_init_flow_name is required (case-insensitive). owner_object_name is optional - if not provided, all objects will be searched.'
            };
        }

        try {
            let endpoint: string;
            let pageInitFlows: any[];
            
            if (owner_object_name) {
                // If owner specified, fetch page init flows filtered by both owner and flow name
                endpoint = `/api/page-init-flows?owner_object_name=${encodeURIComponent(owner_object_name)}&page_init_flow_name=${encodeURIComponent(page_init_flow_name)}`;
            } else {
                // If owner not specified, fetch page init flows filtered by flow name only
                endpoint = `/api/page-init-flows?page_init_flow_name=${encodeURIComponent(page_init_flow_name)}`;
            }
            
            pageInitFlows = await this.fetchFromBridge(endpoint);
            
            // Check if we found the page init flow
            if (!pageInitFlows || pageInitFlows.length === 0) {
                if (owner_object_name) {
                    return {
                        success: false,
                        error: `Page init flow "${page_init_flow_name}" not found in owner object "${owner_object_name}"`,
                        note: 'Page init flow name and owner object name matching is case-insensitive. Page init flows must have names ending in "InitObjWF" or "InitReport".',
                        validationErrors: [`Page init flow "${page_init_flow_name}" does not exist in owner object "${owner_object_name}"`]
                    };
                } else {
                    return {
                        success: false,
                        error: `Page init flow "${page_init_flow_name}" not found in any object`,
                        note: 'Page init flow name matching is case-insensitive. Page init flows must have names ending in "InitObjWF" or "InitReport".',
                        validationErrors: [`Page init flow "${page_init_flow_name}" does not exist in the model`]
                    };
                }
            }
            
            // Get the first (and should be only) page init flow from results
            const pageInitFlow = pageInitFlows[0];
            const ownerObjectName = pageInitFlow._ownerObjectName;
            
            // Remove the temporary _ownerObjectName property
            delete pageInitFlow._ownerObjectName;

            // Calculate element counts
            const outputVarCount = pageInitFlow.objectWorkflowOutputVar ? pageInitFlow.objectWorkflowOutputVar.length : 0;

            // Filter out hidden properties from the page init flow object
            const filteredPageInitFlow = this.filterHiddenPageInitFlowProperties(pageInitFlow);

            return {
                success: true,
                page_init_flow: filteredPageInitFlow,
                owner_object_name: ownerObjectName,
                element_counts: {
                    outputVarCount: outputVarCount
                },
                note: `Page init flow "${page_init_flow_name}" retrieved successfully from owner object "${ownerObjectName}". ` +
                      `Contains ${outputVarCount} output variable(s).`
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not retrieve page init flow: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to retrieve page init flows. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Filters out hidden properties from a page init flow object
     * These properties are hidden in the Page Init Details View UI
     * @param pageInitFlow The page init flow object to filter
     * @returns Filtered page init flow object without hidden properties
     */
    private filterHiddenPageInitFlowProperties(pageInitFlow: any): any {
        // These are the properties NOT shown in the Page Init Details View Settings tab
        const hiddenProperties = [
            'isIgnoredInDocumentation',
            'formFooterImageURL',
            'footerImageURL',
            'headerImageURL',
            'isCreditCardEntryUsed',
            'isDynaFlow',
            'isDynaFlowTask',
            'isCustomPageViewUsed',
            'isImpersonationPage',
            'isExposedInBusinessObject',
            'isPage',
            'titleText',
            'initObjectWorkflowName',
            'isInitObjWFSubscribedToParams',
            'isObjectDelete',
            'layoutName',
            'introText',
            'formTitleText',
            'formIntroText',
            'formFooterText',
            'codeDescription',
            'isAutoSubmit',
            'targetChildObject',
            'ownerObject',
            'isAsync',
            'asyncWaitMilliseconds',
            'workflowType',
            'isQueue',
            'maxRetryCount',
            'errorWorkflowName',
            'completionWorkflowName',
            'isBackButtonVisible',
            'isCancelButtonAvailable',
            'isFileUploadAvailable',
            'isAddressAutoComplete',
            'objectWorkflowParam',
            'objectWorkflowButton'
        ];

        // Create a shallow copy and remove hidden properties
        const filtered = { ...pageInitFlow };
        hiddenProperties.forEach(prop => {
            delete filtered[prop];
        });

        return filtered;
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
                method: 'GET'
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(parsed);
                    } catch (e) {
                        reject(new Error(`Failed to parse response: ${e instanceof Error ? e.message : 'Unknown error'}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Bridge request failed: ${error.message}`));
            });

            req.end();
        });
    }

    /**
     * Update an existing page init flow
     * Tool name: update_page_init_flow (following MCP snake_case convention)
     * @param page_init_flow_name - Name of the page init flow to update (case-sensitive)
     * @param updates - Object containing properties to update (at least one required)
     * @returns Result object with success status
     */
    async update_page_init_flow(
        page_init_flow_name: string,
        updates: {
            isAuthorizationRequired?: 'true' | 'false';
            isCustomLogicOverwritten?: 'true' | 'false';
            isExposedInBusinessObject?: 'true' | 'false';
            isRequestRunViaDynaFlowAllowed?: 'true' | 'false';
            pageIntroText?: string;
            pageTitleText?: string;
            roleRequired?: string;
        }
    ): Promise<{ success: boolean; page_init_flow?: any; owner_object_name?: string; message?: string; error?: string; note?: string }> {
        try {
            // Validate at least one property to update
            const updateKeys = Object.keys(updates);
            if (updateKeys.length === 0) {
                return {
                    success: false,
                    error: 'At least one property to update must be provided'
                };
            }

            // Call bridge API to update page init flow
            const http = await import('http');
            const postData = {
                page_init_flow_name,
                updates: updates
            };

            const postDataString = JSON.stringify(postData);

            const updatedPageInitFlow: any = await new Promise((resolve, reject) => {
                const req = http.request(
                    {
                        hostname: 'localhost',
                        port: 3001,
                        path: '/api/update-page-init-flow',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Length': Buffer.byteLength(postDataString)
                        }
                    },
                    (res) => {
                        let data = '';
                        res.on('data', (chunk) => {
                            data += chunk;
                        });
                        res.on('end', () => {
                            if (res.statusCode === 200) {
                                resolve(JSON.parse(data));
                            } else {
                                reject(new Error(data || `HTTP ${res.statusCode}`));
                            }
                        });
                    }
                );

                req.on('error', (error) => {
                    reject(error);
                });

                req.write(postDataString);
                req.end();
            });

            if (!updatedPageInitFlow.success) {
                return {
                    success: false,
                    error: updatedPageInitFlow.error || 'Failed to update page init flow'
                };
            }

            // Filter hidden properties from returned page init flow
            const filteredPageInitFlow = this.filterHiddenPageInitFlowProperties(updatedPageInitFlow.page_init_flow);

            return {
                success: true,
                page_init_flow: filteredPageInitFlow,
                owner_object_name: updatedPageInitFlow.owner_object_name,
                message: `Page init flow "${page_init_flow_name}" updated successfully`,
                note: 'Page init flow properties have been updated. The model has unsaved changes.'
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not update page init flow: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to update page init flows. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Update a page init flow with its complete schema (bulk replacement of all properties)
     * Tool name: update_full_page_init_flow (following MCP snake_case convention)
     * @param page_init_flow_name - Name of the page init flow to update (case-sensitive, exact match required)
     * @param page_init_flow - Complete page init flow object with all properties to replace
     * @returns Result object with success status and updated page init flow
     */
    async update_full_page_init_flow(
        page_init_flow_name: string,
        page_init_flow: any
    ): Promise<{ success: boolean; page_init_flow?: any; owner_object_name?: string; message?: string; error?: string; note?: string; validationErrors?: string[] }> {
        // Validate required parameters
        const validationErrors: string[] = [];
        
        if (!page_init_flow_name) {
            validationErrors.push('page_init_flow_name is required');
        }
        
        if (!page_init_flow || typeof page_init_flow !== 'object') {
            validationErrors.push('page_init_flow is required and must be an object');
        }
        
        if (validationErrors.length > 0) {
            return {
                success: false,
                error: 'Validation failed',
                validationErrors: validationErrors,
                note: 'page_init_flow_name is required (case-sensitive). page_init_flow must be provided with properties to update.'
            };
        }
        
        // Get actual schema for validation
        const schemaResult = await this.get_page_init_flow_schema();
        const schema = schemaResult.schema;
        
        // Use JSON Schema validation with ajv
        if (schema) {
            try {
                const Ajv = require('ajv');
                const ajv = new Ajv({ allErrors: true, strict: false });
                
                const validate = ajv.compile(schema);
                const valid = validate(page_init_flow);
                
                if (!valid && validate.errors) {
                    validate.errors.forEach((error: any) => {
                        const path = error.instancePath || error.dataPath || '';
                        const field = path.replace(/^\//, '').replace(/\//g, '.') || 'root';
                        
                        if (error.keyword === 'enum') {
                            validationErrors.push(`${field}: must be one of ${JSON.stringify(error.params.allowedValues)}`);
                        } else if (error.keyword === 'pattern') {
                            validationErrors.push(`${field}: ${error.message} (expected pattern: ${error.params.pattern})`);
                        } else if (error.keyword === 'type') {
                            validationErrors.push(`${field}: must be ${error.params.type}`);
                        } else if (error.keyword === 'required') {
                            validationErrors.push(`${error.params.missingProperty} is required`);
                        } else {
                            validationErrors.push(`${field}: ${error.message}`);
                        }
                    });
                }
            } catch (error) {
                // If schema validation fails, fall back to basic validation
                console.error('Schema validation error:', error);
            }
        }
        
        if (validationErrors.length > 0) {
            return {
                success: false,
                error: 'Validation failed',
                validationErrors: validationErrors,
                note: 'Please check the validation errors and ensure all values match the schema requirements from get_page_init_flow_schema.'
            };
        }
        
        try {
            // Call bridge API to update full page init flow
            const http = await import('http');
            const postData = {
                page_init_flow_name,
                page_init_flow: page_init_flow
            };

            const postDataString = JSON.stringify(postData);

            const result: any = await new Promise((resolve, reject) => {
                const req = http.request(
                    {
                        hostname: 'localhost',
                        port: 3001,
                        path: '/api/update-full-page-init-flow',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Length': Buffer.byteLength(postDataString)
                        }
                    },
                    (res) => {
                        let data = '';
                        res.on('data', (chunk) => {
                            data += chunk;
                        });
                        res.on('end', () => {
                            if (res.statusCode === 200) {
                                resolve(JSON.parse(data));
                            } else {
                                reject(new Error(data || `HTTP ${res.statusCode}`));
                            }
                        });
                    }
                );

                req.on('error', (error) => {
                    reject(error);
                });

                req.write(postDataString);
                req.end();
            });

            if (!result.success) {
                return {
                    success: false,
                    error: result.error || 'Failed to update full page init flow'
                };
            }

            // Filter hidden properties from returned page init flow
            const filteredPageInitFlow = this.filterHiddenPageInitFlowProperties(result.page_init_flow);

            return {
                success: true,
                page_init_flow: filteredPageInitFlow,
                owner_object_name: result.owner_object_name,
                message: `Page init flow "${page_init_flow_name}" fully updated in owner object "${result.owner_object_name}"`,
                note: 'Page init flow has been completely replaced with the provided schema. The model has unsaved changes.'
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not update full page init flow: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to update page init flows. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Add a new output variable to an existing page init flow
     * Tool name: add_page_init_flow_output_var (following MCP snake_case convention)
     * @param page_init_flow_name - Name of the page init flow to add the output variable to (case-sensitive, exact match required)
     * @param output_var - The output variable object to add
     * @returns Result object with success status
     */
    async add_page_init_flow_output_var(
        page_init_flow_name: string,
        output_var: {
            name: string;
            buttonNavURL?: string;
            buttonObjectWFName?: string;
            buttonText?: string;
            conditionalVisiblePropertyName?: string;
            dataSize?: string; // Maps to sqlServerDBDataTypeSize
            dataType?: string; // Maps to sqlServerDBDataType
            defaultValue?: string;
            fKObjectName?: string;
            labelText?: string;
            isAutoRedirectURL?: 'true' | 'false';
            isFK?: 'true' | 'false';
            isFKLookup?: 'true' | 'false';
            isLabelVisible?: 'true' | 'false';
            isHeaderText?: 'true' | 'false';
            isIgnored?: 'true' | 'false';
            isLink?: 'true' | 'false';
            isVisible?: 'true' | 'false';
            sourceObjectName?: string;
            sourcePropertyName?: string;
        }
    ): Promise<{ success: boolean; output_var?: any; page_init_flow_name?: string; owner_object_name?: string; message?: string; error?: string; note?: string }> {
        if (!output_var.name) {
            return {
                success: false,
                error: 'Output variable name is required'
            };
        }

        try {
            // Map UI property names to schema property names
            const mappedOutputVar: any = { ...output_var };
            
            // Map dataType to sqlServerDBDataType if provided
            if (output_var.dataType) {
                mappedOutputVar.sqlServerDBDataType = output_var.dataType;
                delete mappedOutputVar.dataType;
            }
            
            // Map dataSize to sqlServerDBDataTypeSize if provided
            if (output_var.dataSize) {
                mappedOutputVar.sqlServerDBDataTypeSize = output_var.dataSize;
                delete mappedOutputVar.dataSize;
            }

            const postData = {
                page_init_flow_name,
                output_var: mappedOutputVar
            };

            const http = await import('http');
            const result = await new Promise((resolve, reject) => {
                const postDataString = JSON.stringify(postData);
                const options = {
                    hostname: 'localhost',
                    port: 3001,
                    path: '/api/add-page-init-flow-output-var',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postDataString)
                    }
                };

                const req = http.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => {
                        try {
                            resolve(JSON.parse(data));
                        } catch (e) {
                            reject(new Error(`Failed to parse response: ${e instanceof Error ? e.message : 'Unknown error'}`));
                        }
                    });
                });

                req.on('error', (error) => {
                    reject(new Error(`Bridge request failed: ${error.message}`));
                });

                req.write(postDataString);
                req.end();
            }) as any;

            if (!result.success) {
                return {
                    success: false,
                    error: result.error || 'Failed to add output variable'
                };
            }

            return {
                success: true,
                output_var: result.output_var,
                page_init_flow_name: page_init_flow_name,
                owner_object_name: result.owner_object_name,
                message: `Output variable "${output_var.name}" added successfully to page init flow "${page_init_flow_name}"`,
                note: 'Output variable has been added. The model has unsaved changes.'
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not add output variable: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to add output variables. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Update an existing output variable in a page init flow
     * Tool name: update_page_init_flow_output_var (following MCP snake_case convention)
     * @param page_init_flow_name - Name of the page init flow containing the output variable (case-sensitive, exact match required)
     * @param output_var_name - Current name of the output variable to update (case-sensitive, exact match required, used to identify the output variable)
     * @param updates - Object containing properties to update
     * @returns Result object with success status
     */
    async update_page_init_flow_output_var(
        page_init_flow_name: string,
        output_var_name: string,
        updates: {
            name?: string; // Allow renaming the output variable
            buttonNavURL?: string;
            buttonObjectWFName?: string;
            buttonText?: string;
            conditionalVisiblePropertyName?: string;
            sqlServerDBDataType?: string;
            sqlServerDBDataTypeSize?: string;
            defaultValue?: string;
            fKObjectName?: string;
            labelText?: string;
            isAutoRedirectURL?: 'true' | 'false';
            isFK?: 'true' | 'false';
            isFKLookup?: 'true' | 'false';
            isLabelVisible?: 'true' | 'false';
            isHeaderText?: 'true' | 'false';
            isIgnored?: 'true' | 'false';
            isLink?: 'true' | 'false';
            isVisible?: 'true' | 'false';
            sourceObjectName?: string;
            sourcePropertyName?: string;
        }
    ): Promise<{ success: boolean; output_var?: any; page_init_flow_name?: string; owner_object_name?: string; message?: string; error?: string }> {
        if (Object.keys(updates).length === 0) {
            return {
                success: false,
                error: 'At least one property to update is required'
            };
        }

        try {
            const postData = {
                page_init_flow_name,
                output_var_name,
                updates
            };

            const http = await import('http');
            const result = await new Promise((resolve, reject) => {
                const postDataString = JSON.stringify(postData);
                const options = {
                    hostname: 'localhost',
                    port: 3001,
                    path: '/api/update-page-init-flow-output-var',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postDataString)
                    }
                };

                const req = http.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => {
                        try {
                            resolve(JSON.parse(data));
                        } catch (e) {
                            reject(new Error(`Failed to parse response: ${e instanceof Error ? e.message : 'Unknown error'}`));
                        }
                    });
                });

                req.on('error', (error) => {
                    reject(new Error(`Bridge request failed: ${error.message}`));
                });

                req.write(postDataString);
                req.end();
            }) as any;

            if (!result.success) {
                return {
                    success: false,
                    error: result.error || 'Failed to update output variable'
                };
            }

            return {
                success: true,
                output_var: result.output_var,
                page_init_flow_name: page_init_flow_name,
                owner_object_name: result.owner_object_name,
                message: `Output variable "${output_var_name}" updated successfully in page init flow "${page_init_flow_name}"`
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not update output variable: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }

    /**
     * Move an output variable to a new position in a page init flow
     * Tool name: move_page_init_flow_output_var (following MCP snake_case convention)
     * @param page_init_flow_name - Name of the page init flow containing the output variable (case-sensitive, exact match required)
     * @param output_var_name - Name of the output variable to move (case-sensitive, exact match required)
     * @param new_position - New 0-based index position (0 = first position)
     * @returns Result object with success status
     */
    async move_page_init_flow_output_var(
        page_init_flow_name: string,
        output_var_name: string,
        new_position: number
    ): Promise<{ success: boolean; page_init_flow_name?: string; owner_object_name?: string; output_var_name?: string; old_position?: number; new_position?: number; output_var_count?: number; message?: string; note?: string; error?: string }> {
        if (new_position < 0) {
            return {
                success: false,
                error: 'Position must be 0 or greater (0-based index)'
            };
        }

        try {
            const postData = {
                page_init_flow_name,
                output_var_name,
                new_position
            };

            const http = await import('http');
            const result = await new Promise((resolve, reject) => {
                const postDataString = JSON.stringify(postData);
                const options = {
                    hostname: 'localhost',
                    port: 3001,
                    path: '/api/move-page-init-flow-output-var',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postDataString)
                    }
                };

                const req = http.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => {
                        try {
                            resolve(JSON.parse(data));
                        } catch (e) {
                            reject(new Error(`Failed to parse response: ${e instanceof Error ? e.message : 'Unknown error'}`));
                        }
                    });
                });

                req.on('error', (error) => {
                    reject(new Error(`Bridge request failed: ${error.message}`));
                });

                req.write(postDataString);
                req.end();
            }) as any;

            if (!result.success) {
                return {
                    success: false,
                    error: result.error || 'Failed to move output variable'
                };
            }

            return {
                success: true,
                page_init_flow_name: page_init_flow_name,
                owner_object_name: result.owner_object_name,
                output_var_name: output_var_name,
                old_position: result.old_position,
                new_position: new_position,
                output_var_count: result.output_var_count,
                message: `Output variable "${output_var_name}" moved from position ${result.old_position} to ${new_position} in page init flow "${page_init_flow_name}"`,
                note: `Total output variables: ${result.output_var_count}. The model has unsaved changes.`
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not move output variable: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
}

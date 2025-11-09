// generalFlowTools.ts
// Tools for managing general flows (general objectWorkflow) via MCP
// Created on: October 26, 2025
// This file implements general flow tools for the MCP server

/**
 * Implements general flow tools for the MCP server
 */
export class GeneralFlowTools {
    constructor(modelService: any) {
        // ModelService passed but not used - MCP server uses HTTP bridge
    }

    /**
     * Gets the schema definition for general flows (general objectWorkflow)
     * Tool name: get_general_flow_schema (following MCP snake_case convention)
     * @returns Schema definition with properties, validation rules, and examples for general flows
     */
    public async get_general_flow_schema(): Promise<any> {
        return {
            success: true,
            schema: {
                type: 'object',
                description: 'General Flow (objectWorkflow) structure in AppDNA model - represents reusable business logic workflows that can be called from multiple places in the application. General flows are not standalone pages and are not DynaFlow tasks.',
                objectType: 'objectWorkflow',
                flowType: 'general',
                properties: {
                    name: {
                        type: 'string',
                        required: true,
                        format: 'PascalCase',
                        pattern: '^[A-Z][A-Za-z0-9]*$',
                        description: 'Workflow ID, unique for each workflow element. Must be in PascalCase format (starts with uppercase letter, no spaces, can contain letters and numbers). For general flows, should not end with "InitObjWF" or "InitReport".',
                        examples: ['ProcessOrder', 'CalculateDiscount', 'SendNotification', 'ValidateInventory', 'GenerateInvoice']
                    },
                    isAuthorizationRequired: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Does this general flow require user authorization to execute? String "true" or "false".',
                        examples: ['true', 'false']
                    },
                    roleRequired: {
                        type: 'string',
                        required: false,
                        description: 'Name of the role required to execute this general flow. Should match a role name from the Role lookup object.',
                        examples: ['Administrator', 'Manager', 'User', 'Supervisor']
                    },
                    isExposedInBusinessObject: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Is this general flow exposed in the business object API? String "true" or "false".',
                        examples: ['true', 'false']
                    },
                    isCustomLogicOverwritten: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Has the auto-generated logic been overwritten with custom code? String "true" or "false".',
                        examples: ['true', 'false']
                    }
                },
                childArrays: {
                    objectWorkflowParam: {
                        description: 'Input parameters for the general flow. These are the values passed into the workflow when it is called.',
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['name'],
                            properties: {
                                name: {
                                    type: 'string',
                                    required: true,
                                    format: 'PascalCase',
                                    pattern: '^[A-Z][A-Za-z0-9]*$',
                                    description: 'Parameter name in PascalCase format.',
                                    examples: ['CustomerId', 'OrderAmount', 'DiscountPercent', 'EmailAddress']
                                },
                                dataType: {
                                    type: 'string',
                                    required: false,
                                    description: 'SQL Server data type for the parameter.',
                                    examples: ['Int', 'NVarChar', 'Decimal', 'DateTime', 'Bit']
                                },
                                dataSize: {
                                    type: 'string',
                                    required: false,
                                    description: 'Size specification for the data type (e.g., length for strings, precision for decimals).',
                                    examples: ['50', '100', '18,2', 'MAX']
                                },
                                codeDescription: {
                                    type: 'string',
                                    required: false,
                                    description: 'Code description for the parameter.',
                                    examples: ['Customer ID for order processing', 'Discount percentage to apply']
                                },
                                isIgnored: {
                                    type: 'string',
                                    required: false,
                                    enum: ['true', 'false'],
                                    description: 'Should this parameter be ignored during code generation? String "true" or "false".',
                                    examples: ['true', 'false']
                                }
                            }
                        },
                        examples: [
                            {
                                name: 'CustomerId',
                                dataType: 'Int',
                                codeDescription: 'Customer ID for order processing'
                            },
                            {
                                name: 'OrderAmount',
                                dataType: 'Decimal',
                                dataSize: '18,2',
                                codeDescription: 'Order amount to process'
                            }
                        ]
                    },
                    objectWorkflowOutputVar: {
                        description: 'Output variables from the general flow. These are the values returned by the workflow after execution.',
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['name'],
                            properties: {
                                name: {
                                    type: 'string',
                                    required: true,
                                    format: 'PascalCase',
                                    pattern: '^[A-Z][A-Za-z0-9]*$',
                                    description: 'Output variable name in PascalCase format.',
                                    examples: ['TotalAmount', 'DiscountApplied', 'OrderStatus', 'ErrorMessage', 'IsSuccess']
                                },
                                sourceObjectName: {
                                    type: 'string',
                                    required: false,
                                    description: 'Name of the source data object for this output variable.',
                                    examples: ['Order', 'Customer', 'Product', 'Invoice']
                                },
                                sourcePropertyName: {
                                    type: 'string',
                                    required: false,
                                    description: 'Name of the property from the source object.',
                                    examples: ['TotalAmount', 'CustomerName', 'ProductCode', 'Status']
                                },
                                sqlServerDBDataType: {
                                    type: 'string',
                                    required: false,
                                    description: 'SQL Server data type for the output variable.',
                                    examples: ['Int', 'NVarChar', 'Decimal', 'DateTime', 'Bit']
                                },
                                sqlServerDBDataTypeSize: {
                                    type: 'string',
                                    required: false,
                                    description: 'Size specification for the SQL Server data type.',
                                    examples: ['50', '100', '18,2', 'MAX']
                                },
                                isIgnored: {
                                    type: 'string',
                                    required: false,
                                    enum: ['true', 'false'],
                                    description: 'Should this output variable be ignored during code generation? String "true" or "false".',
                                    examples: ['true', 'false']
                                }
                            }
                        },
                        examples: [
                            {
                                name: 'TotalAmount',
                                sourceObjectName: 'Order',
                                sourcePropertyName: 'TotalAmount',
                                sqlServerDBDataType: 'Decimal',
                                sqlServerDBDataTypeSize: '18,2'
                            },
                            {
                                name: 'IsSuccess',
                                sqlServerDBDataType: 'Bit'
                            }
                        ]
                    }
                },
                usage: {
                    description: 'General flows are reusable business logic workflows that can be called from forms, reports, other workflows, and APIs. They are owned by a data object and defined within the objectWorkflow array of that data object.',
                    ownerObject: 'General flows are defined in the objectWorkflow array of a data object',
                    filtering: 'General flows are identified by: isDynaFlow not true, isDynaFlowTask not true, name not ending with "InitObjWF" or "InitReport"',
                    commonScenarios: [
                        'Business logic calculations (discounts, tax calculations, totals)',
                        'Data validation and processing workflows',
                        'Notification and communication triggers',
                        'Integration with external systems',
                        'Report data preparation',
                        'Batch operations and data transformations'
                    ]
                },
                completeExample: {
                    name: 'CalculateOrderDiscount',
                    isAuthorizationRequired: 'true',
                    roleRequired: 'Manager',
                    isExposedInBusinessObject: 'true',
                    objectWorkflowParam: [
                        {
                            name: 'CustomerId',
                            dataType: 'Int',
                            codeDescription: 'Customer ID for discount calculation'
                        },
                        {
                            name: 'OrderAmount',
                            dataType: 'Decimal',
                            dataSize: '18,2',
                            codeDescription: 'Total order amount'
                        }
                    ],
                    objectWorkflowOutputVar: [
                        {
                            name: 'DiscountPercent',
                            sqlServerDBDataType: 'Decimal',
                            sqlServerDBDataTypeSize: '5,2'
                        },
                        {
                            name: 'DiscountAmount',
                            sqlServerDBDataType: 'Decimal',
                            sqlServerDBDataTypeSize: '18,2'
                        },
                        {
                            name: 'FinalAmount',
                            sqlServerDBDataType: 'Decimal',
                            sqlServerDBDataTypeSize: '18,2'
                        }
                    ]
                },
                notes: [
                    'General flows are owned by data objects and appear in the objectWorkflow array',
                    'General flow names should not end with "InitObjWF" or "InitReport" (those are page init flows)',
                    'General flows can be called from forms, reports, other workflows, and APIs',
                    'Input parameters (objectWorkflowParam) define what data is passed into the workflow',
                    'Output variables (objectWorkflowOutputVar) define what data is returned from the workflow',
                    'All boolean properties use string values: "true" or "false"',
                    'Use isExposedInBusinessObject="true" to make the workflow available via business object API',
                    'Use roleRequired to restrict execution to specific user roles',
                    'Parameter and output variable names must be in PascalCase format'
                ]
            }
        };
    }

    /**
     * Gets a specific general flow by name
     * Tool name: get_general_flow (following MCP snake_case convention)
     * @param parameters Object containing general_flow_name (required) and owner_object_name (optional)
     * @returns Complete general flow object with all arrays (params, output vars) and element counts
     */
    public async get_general_flow(parameters?: any): Promise<any> {
        const { owner_object_name, general_flow_name } = parameters || {};

        // Validate required parameters
        const validationErrors: string[] = [];
        
        if (!general_flow_name) {
            validationErrors.push('general_flow_name is required');
        }

        if (validationErrors.length > 0) {
            return {
                success: false,
                error: 'Validation failed',
                validationErrors: validationErrors,
                note: 'general_flow_name is required (case-insensitive). owner_object_name is optional - if not provided, all objects will be searched.'
            };
        }

        try {
            let endpoint: string;
            let generalFlows: any[];
            
            if (owner_object_name) {
                // If owner specified, fetch general flows filtered by both owner and flow name
                endpoint = `/api/general-flows?owner_object_name=${encodeURIComponent(owner_object_name)}&general_flow_name=${encodeURIComponent(general_flow_name)}`;
            } else {
                // If owner not specified, fetch general flows filtered by flow name only
                endpoint = `/api/general-flows?general_flow_name=${encodeURIComponent(general_flow_name)}`;
            }
            
            generalFlows = await this.fetchFromBridge(endpoint);
            
            // Check if we found the general flow
            if (!generalFlows || generalFlows.length === 0) {
                if (owner_object_name) {
                    return {
                        success: false,
                        error: `General flow "${general_flow_name}" not found in owner object "${owner_object_name}"`,
                        note: 'General flow name and owner object name matching is case-insensitive. Use open_general_workflows_list_view to see available general flows.',
                        validationErrors: [`General flow "${general_flow_name}" does not exist in owner object "${owner_object_name}"`]
                    };
                } else {
                    return {
                        success: false,
                        error: `General flow "${general_flow_name}" not found in any object`,
                        note: 'General flow name matching is case-insensitive. Use open_general_workflows_list_view to see available general flows.',
                        validationErrors: [`General flow "${general_flow_name}" does not exist in the model`]
                    };
                }
            }
            
            // Get the first (and should be only) general flow from results
            const generalFlow = generalFlows[0];
            const ownerObjectName = generalFlow._ownerObjectName;
            
            // Remove the temporary _ownerObjectName property
            delete generalFlow._ownerObjectName;

            // Calculate element counts
            const paramCount = generalFlow.objectWorkflowParam ? generalFlow.objectWorkflowParam.length : 0;
            const outputVarCount = generalFlow.objectWorkflowOutputVar ? generalFlow.objectWorkflowOutputVar.length : 0;
            const totalElements = paramCount + outputVarCount;

            return {
                success: true,
                general_flow: generalFlow,
                owner_object_name: ownerObjectName,
                element_counts: {
                    paramCount: paramCount,
                    outputVarCount: outputVarCount,
                    totalElements: totalElements
                },
                note: `General flow "${general_flow_name}" retrieved successfully from owner object "${ownerObjectName}". ` +
                      `Contains ${paramCount} input parameter(s) and ${outputVarCount} output variable(s). ` +
                      `General flows are reusable business logic workflows.`
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not retrieve general flow: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to retrieve general flows. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Update properties of an existing general flow (general objectWorkflow)
     * Tool name: update_general_flow (following MCP snake_case convention)
     * @param general_flow_name Name of the general flow to update (case-sensitive)
     * @param updates Object containing properties to update (aligned with general flow schema)
     * @returns Object with success status, updated general flow, and owner object name
     */
    public async update_general_flow(
        general_flow_name: string,
        updates: {
            isAuthorizationRequired?: 'true' | 'false';
            roleRequired?: string;
            isExposedInBusinessObject?: 'true' | 'false';
            isCustomLogicOverwritten?: 'true' | 'false';
            isIgnored?: 'true' | 'false';
        }
    ): Promise<{ success: boolean; general_flow?: any; owner_object_name?: string; message?: string; error?: string; note?: string }> {
        try {
            // Validate at least one property to update
            const updateKeys = Object.keys(updates);
            if (updateKeys.length === 0) {
                return {
                    success: false,
                    error: 'At least one property to update must be provided'
                };
            }

            // Call bridge API to update general flow
            const http = await import('http');
            const postData = {
                general_flow_name,
                updates: updates
            };

            const postDataString = JSON.stringify(postData);

            const updatedGeneralFlow: any = await new Promise((resolve, reject) => {
                const req = http.request(
                    {
                        hostname: 'localhost',
                        port: 3001,
                        path: '/api/update-general-flow',
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

            if (!updatedGeneralFlow.success) {
                return {
                    success: false,
                    error: updatedGeneralFlow.error || 'Failed to update general flow'
                };
            }

            // Remove temporary properties
            const generalFlow = { ...updatedGeneralFlow.general_flow };
            delete generalFlow._ownerObjectName;

            return {
                success: true,
                general_flow: generalFlow,
                owner_object_name: updatedGeneralFlow.owner_object_name,
                message: `General flow "${general_flow_name}" updated successfully in owner object "${updatedGeneralFlow.owner_object_name}".`,
                note: 'Model has unsaved changes. Use the save command to persist the updates.'
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not update general flow: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to update general flows. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Update a general flow with its complete schema (bulk replacement of all properties)
     * Tool name: update_full_general_flow (following MCP snake_case convention)
     * @param general_flow_name - Name of the general flow to update (case-sensitive, exact match required)
     * @param general_flow - Complete general flow object with all properties to replace
     * @returns Result object with success status and updated general flow
     */
    async update_full_general_flow(
        general_flow_name: string,
        general_flow: any
    ): Promise<{ success: boolean; general_flow?: any; owner_object_name?: string; message?: string; error?: string; note?: string; validationErrors?: string[] }> {
        // Validate required parameters
        const validationErrors: string[] = [];
        
        if (!general_flow_name) {
            validationErrors.push('general_flow_name is required');
        }
        
        if (!general_flow || typeof general_flow !== 'object') {
            validationErrors.push('general_flow is required and must be an object');
        }
        
        if (validationErrors.length > 0) {
            return {
                success: false,
                error: 'Validation failed',
                validationErrors: validationErrors,
                note: 'general_flow_name is required (case-sensitive). general_flow must be provided with properties to update.'
            };
        }
        
        // Get actual schema for validation
        const schemaResult = await this.get_general_flow_schema();
        const schema = schemaResult.schema;
        
        // Use JSON Schema validation with ajv
        if (schema) {
            try {
                const Ajv = require('ajv');
                const ajv = new Ajv({ allErrors: true, strict: false });
                
                const validate = ajv.compile(schema);
                const valid = validate(general_flow);
                
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
                note: 'Please check the validation errors and ensure all values match the schema requirements from get_general_flow_schema.'
            };
        }
        
        try {
            // Call bridge API to update full general flow
            const http = await import('http');
            const postData = {
                general_flow_name,
                general_flow: general_flow
            };

            const postDataString = JSON.stringify(postData);

            const result: any = await new Promise((resolve, reject) => {
                const req = http.request(
                    {
                        hostname: 'localhost',
                        port: 3001,
                        path: '/api/update-full-general-flow',
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
                    error: result.error || 'Failed to update full general flow'
                };
            }

            return {
                success: true,
                general_flow: result.general_flow,
                owner_object_name: result.owner_object_name,
                message: `General flow "${general_flow_name}" fully updated in owner object "${result.owner_object_name}"`,
                note: 'General flow has been completely replaced with the provided schema. The model has unsaved changes.'
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not update full general flow: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to update general flows. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Add a new parameter (input parameter) to an existing general flow
     * Tool name: add_general_flow_param (following MCP snake_case convention)
     * @param general_flow_name - Name of the general flow to add the parameter to (case-sensitive, exact match required)
     * @param param - The parameter object to add
     * @returns Result object with success status
     */
    async add_general_flow_param(
        general_flow_name: string,
        param: {
            name: string;
            dataType?: string; // Maps to sqlServerDBDataType
            dataSize?: string; // Maps to sqlServerDBDataTypeSize
            codeDescription?: string;
            isIgnored?: 'true' | 'false';
        }
    ): Promise<{ success: boolean; param?: any; general_flow_name?: string; owner_object_name?: string; message?: string; error?: string; note?: string }> {
        try {
            // Validate required parameter name
            if (!param.name) {
                return {
                    success: false,
                    error: 'Parameter name is required'
                };
            }

            // Map UI property names to schema property names
            const mappedParam: any = { ...param };
            
            // Map dataType to sqlServerDBDataType if provided
            if (param.dataType) {
                mappedParam.sqlServerDBDataType = param.dataType;
                delete mappedParam.dataType;
            }
            
            // Map dataSize to sqlServerDBDataTypeSize if provided
            if (param.dataSize) {
                mappedParam.sqlServerDBDataTypeSize = param.dataSize;
                delete mappedParam.dataSize;
            }

            // Call bridge API to add general flow param
            const http = await import('http');
            const postData = {
                general_flow_name,
                param: mappedParam
            };

            const postDataString = JSON.stringify(postData);

            const result: any = await new Promise((resolve, reject) => {
                const req = http.request(
                    {
                        hostname: 'localhost',
                        port: 3001,
                        path: '/api/add-general-flow-param',
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
                    error: result.error || 'Failed to add general flow parameter'
                };
            }

            return {
                success: true,
                param: result.param,
                general_flow_name: general_flow_name,
                owner_object_name: result.owner_object_name,
                message: `Parameter "${param.name}" added to general flow "${general_flow_name}" successfully`,
                note: 'General flow parameter has been added. The model has unsaved changes.'
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not add general flow parameter: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to add general flow parameters. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Update an existing parameter (input parameter) in a general flow
     * Tool name: update_general_flow_param (following MCP snake_case convention)
     * @param general_flow_name - Name of the general flow containing the parameter (case-sensitive, exact match required)
     * @param param_name - Name of the parameter to update (case-sensitive, exact match required)
     * @param updates - Object containing properties to update (at least one required)
     * @returns Result object with success status
     */
    async update_general_flow_param(
        general_flow_name: string,
        param_name: string,
        updates: {
            name?: string;
            dataType?: string; // Maps to sqlServerDBDataType
            dataSize?: string; // Maps to sqlServerDBDataTypeSize
            codeDescription?: string;
            isIgnored?: 'true' | 'false';
        }
    ): Promise<{ success: boolean; param?: any; general_flow_name?: string; owner_object_name?: string; message?: string; error?: string; note?: string }> {
        if (Object.keys(updates).length === 0) {
            return {
                success: false,
                error: 'At least one property to update must be provided'
            };
        }

        try {
            // Map UI property names to schema property names
            const mappedUpdates: any = { ...updates };
            
            // Map dataType to sqlServerDBDataType if provided
            if (updates.dataType) {
                mappedUpdates.sqlServerDBDataType = updates.dataType;
                delete mappedUpdates.dataType;
            }
            
            // Map dataSize to sqlServerDBDataTypeSize if provided
            if (updates.dataSize) {
                mappedUpdates.sqlServerDBDataTypeSize = updates.dataSize;
                delete mappedUpdates.dataSize;
            }

            const postData = {
                general_flow_name,
                param_name,
                updates: mappedUpdates
            };

            const http = await import('http');
            const result = await new Promise((resolve, reject) => {
                const postDataString = JSON.stringify(postData);
                const options = {
                    hostname: 'localhost',
                    port: 3001,
                    path: '/api/update-general-flow-param',
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
                    error: result.error || 'Failed to update general flow parameter'
                };
            }

            return {
                success: true,
                param: result.param,
                general_flow_name: general_flow_name,
                owner_object_name: result.owner_object_name,
                message: `Parameter "${param_name}" updated successfully in general flow "${general_flow_name}"`,
                note: 'General flow parameter has been updated. The model has unsaved changes.'
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not update general flow parameter: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to update general flow parameters. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Move a parameter to a new position in a general flow
     * Tool name: move_general_flow_param (following MCP snake_case convention)
     * @param general_flow_name - Name of the general flow containing the parameter (case-sensitive, exact match required)
     * @param param_name - Name of the parameter to move (case-sensitive, exact match required)
     * @param new_position - New 0-based index position for the parameter (must be less than total count)
     * @returns Result object with success status
     */
    async move_general_flow_param(
        general_flow_name: string,
        param_name: string,
        new_position: number
    ): Promise<{ success: boolean; general_flow_name?: string; owner_object_name?: string; param_name?: string; old_position?: number; new_position?: number; message?: string; error?: string; note?: string }> {
        if (new_position < 0) {
            return {
                success: false,
                error: 'Position must be a non-negative number (0-based index)'
            };
        }

        try {
            const postData = {
                general_flow_name,
                param_name,
                new_position
            };

            const http = await import('http');
            const result = await new Promise((resolve, reject) => {
                const postDataString = JSON.stringify(postData);
                const options = {
                    hostname: 'localhost',
                    port: 3001,
                    path: '/api/move-general-flow-param',
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
                    error: result.error || 'Failed to move general flow parameter'
                };
            }

            return {
                success: true,
                general_flow_name: general_flow_name,
                owner_object_name: result.owner_object_name,
                param_name: param_name,
                old_position: result.old_position,
                new_position: new_position,
                message: `Parameter "${param_name}" moved from position ${result.old_position} to ${new_position} in general flow "${general_flow_name}"`,
                note: 'General flow parameter position has been updated. The model has unsaved changes.'
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not move general flow parameter: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to move general flow parameters. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Add a new output variable to an existing general flow
     * Tool name: add_general_flow_output_var (following MCP snake_case convention)
     * @param general_flow_name - Name of the general flow to add the output variable to (case-sensitive, exact match required)
     * @param output_var - The output variable object to add
     * @returns Result object with success status
     */
    async add_general_flow_output_var(
        general_flow_name: string,
        output_var: {
            name: string;
            dataSize?: string; // Maps to sqlServerDBDataTypeSize
            dataType?: string; // Maps to sqlServerDBDataType
            isIgnored?: 'true' | 'false';
            sourceObjectName?: string;
            sourcePropertyName?: string;
        }
    ): Promise<{ success: boolean; output_var?: any; general_flow_name?: string; owner_object_name?: string; message?: string; error?: string; note?: string }> {
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
                general_flow_name,
                output_var: mappedOutputVar
            };

            const http = await import('http');
            const result = await new Promise((resolve, reject) => {
                const postDataString = JSON.stringify(postData);
                const options = {
                    hostname: 'localhost',
                    port: 3001,
                    path: '/api/add-general-flow-output-var',
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
                general_flow_name: general_flow_name,
                owner_object_name: result.owner_object_name,
                message: `Output variable "${output_var.name}" added successfully to general flow "${general_flow_name}"`,
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
     * Update an existing output variable in a general flow
     * Tool name: update_general_flow_output_var (following MCP snake_case convention)
     * @param general_flow_name - Name of the general flow containing the output variable (case-sensitive, exact match required)
     * @param output_var_name - Current name of the output variable to update (case-sensitive, exact match required, used to identify the output variable)
     * @param updates - Object containing properties to update
     * @returns Result object with success status
     */
    async update_general_flow_output_var(
        general_flow_name: string,
        output_var_name: string,
        updates: {
            name?: string;
            dataSize?: string;
            dataType?: string;
            isIgnored?: 'true' | 'false';
            sourceObjectName?: string;
            sourcePropertyName?: string;
        }
    ): Promise<{ success: boolean; output_var?: any; general_flow_name?: string; owner_object_name?: string; message?: string; error?: string; note?: string }> {
        if (Object.keys(updates).length === 0) {
            return {
                success: false,
                error: 'At least one property to update must be provided'
            };
        }

        try {
            // Map UI property names to schema property names
            const mappedUpdates: any = { ...updates };
            
            // Map dataType to sqlServerDBDataType if provided
            if (updates.dataType) {
                mappedUpdates.sqlServerDBDataType = updates.dataType;
                delete mappedUpdates.dataType;
            }
            
            // Map dataSize to sqlServerDBDataTypeSize if provided
            if (updates.dataSize) {
                mappedUpdates.sqlServerDBDataTypeSize = updates.dataSize;
                delete mappedUpdates.dataSize;
            }

            const postData = {
                general_flow_name,
                output_var_name,
                updates: mappedUpdates
            };

            const http = await import('http');
            const result = await new Promise((resolve, reject) => {
                const postDataString = JSON.stringify(postData);
                const options = {
                    hostname: 'localhost',
                    port: 3001,
                    path: '/api/update-general-flow-output-var',
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
                general_flow_name: general_flow_name,
                owner_object_name: result.owner_object_name,
                message: `Output variable "${output_var_name}" updated successfully in general flow "${general_flow_name}"`,
                note: 'Output variable has been updated. The model has unsaved changes.'
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not update output variable: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to update output variables. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Move an output variable to a new position in a general flow
     * Tool name: move_general_flow_output_var (following MCP snake_case convention)
     * @param general_flow_name - Name of the general flow containing the output variable (case-sensitive, exact match required)
     * @param output_var_name - Name of the output variable to move (case-sensitive, exact match required)
     * @param new_position - New 0-based index position for the output variable (must be less than total count)
     * @returns Result object with success status
     */
    async move_general_flow_output_var(
        general_flow_name: string,
        output_var_name: string,
        new_position: number
    ): Promise<{ success: boolean; general_flow_name?: string; owner_object_name?: string; output_var_name?: string; old_position?: number; new_position?: number; message?: string; error?: string; note?: string }> {
        if (new_position < 0) {
            return {
                success: false,
                error: 'Position must be a non-negative number (0-based index)'
            };
        }

        try {
            const postData = {
                general_flow_name,
                output_var_name,
                new_position
            };

            const http = await import('http');
            const result = await new Promise((resolve, reject) => {
                const postDataString = JSON.stringify(postData);
                const options = {
                    hostname: 'localhost',
                    port: 3001,
                    path: '/api/move-general-flow-output-var',
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
                general_flow_name: general_flow_name,
                owner_object_name: result.owner_object_name,
                output_var_name: output_var_name,
                old_position: result.old_position,
                new_position: new_position,
                message: `Output variable "${output_var_name}" moved from position ${result.old_position} to ${new_position} in general flow "${general_flow_name}"`,
                note: 'Output variable position has been updated. The model has unsaved changes.'
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not move output variable: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to move output variables. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * List general flows with optional filtering
     * Tool name: list_general_flows (following MCP snake_case convention)
     * @param parameters Optional filter parameters
     * @returns Array of general flow objects with details
     */
    public async list_general_flows(parameters?: any): Promise<any> {
        const { 
            general_flow_name,   // Optional, case insensitive, exact match
            owner_object         // Optional, case insensitive, exact match
        } = parameters || {};
        
        try {
            // Build query parameters for filtering
            const queryParams: string[] = [];
            if (general_flow_name) { queryParams.push(`general_flow_name=${encodeURIComponent(general_flow_name)}`); }
            if (owner_object) { queryParams.push(`owner_object_name=${encodeURIComponent(owner_object)}`); }
            
            const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
            const endpoint = `/api/general-flows-summary${queryString}`;
            
            const generalFlows = await this.fetchFromBridge(endpoint);
            
            return {
                success: true,
                general_flows: generalFlows,
                count: generalFlows.length,
                filters: {
                    general_flow_name: general_flow_name || null,
                    owner_object: owner_object || null
                },
                note: 'General flows loaded from AppDNA model. General flows are reusable business logic workflows (not DynaFlow tasks, not init flows). Each includes name, ownerObject, roleRequired, paramCount, and outputVarCount. Use get_general_flow for complete details.'
            };
        } catch (error) {
            return {
                success: false,
                general_flows: [],
                count: 0,
                error: `Could not load general flows: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to load general flows. Make sure the AppDNA extension is running and a model file is loaded.'
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
}

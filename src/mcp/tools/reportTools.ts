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
     * Note: This schema excludes properties that are hidden in the report details view settings tab
     */
    public async get_report_schema(): Promise<any> {
        return {
            success: true,
            schema: {
                type: 'object',
                description: 'Report structure in AppDNA model - represents data visualization and reporting interfaces. This schema shows properties visible in the report details view settings tab.',
                objectType: 'report',
                properties: {
                    // Core Properties (always visible in settings tab)
                    titleText: {
                        type: 'string',
                        required: false,
                        description: 'Title displayed on the report page. Human-readable title for the report UI.',
                        examples: ['Customer List', 'Sales Report', 'Order History', 'Product Catalog']
                    },
                    introText: {
                        type: 'string',
                        required: false,
                        description: 'Page subtitle or introduction text displayed on the report.',
                        examples: ['View all customers', 'Monthly sales summary']
                    },
                    visualizationType: {
                        type: 'string',
                        required: false,
                        enum: ['Grid', 'PieChart', 'LineChart', 'FlowChart', 'CardView', 'FolderView'],
                        description: 'Type of visualization for the report data.',
                        examples: ['Grid', 'PieChart', 'LineChart', 'CardView']
                    },
                    
                    // Data Source Properties
                    isCustomSqlUsed: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Whether custom SQL stored procedure is used for the report. Must be string "true" or "false".',
                        examples: ['true', 'false']
                    },
                    targetChildObject: {
                        type: 'string',
                        required: false,
                        description: 'Child object of the owner object that is displayed on the report. Case-sensitive data object name.',
                        examples: ['OrderLineItem', 'CustomerAddress', 'ProductReview']
                    },
                    
                    // Display Control Properties
                    isButtonDropDownAllowed: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Whether dropdown display of buttons is allowed instead of individual buttons (for grid visualization).',
                        examples: ['true', 'false']
                    },
                    isPagingAvailable: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Determines whether to show paging controls.',
                        examples: ['true', 'false']
                    },
                    defaultPageSize: {
                        type: 'string',
                        required: false,
                        description: 'Default number of rows per page when paging is enabled.',
                        examples: ['10', '25', '50', '100']
                    },
                    isFilterSectionHidden: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Determines whether to show the filter section.',
                        examples: ['true', 'false']
                    },
                    isFilterSectionCollapsable: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Determines if expand/collapse button is shown at top right corner of filter section.',
                        examples: ['true', 'false']
                    },
                    isFilterPersistant: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Whether filter settings persist across sessions.',
                        examples: ['true', 'false']
                    },
                    isBreadcrumbSectionHidden: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Whether to hide the breadcrumb navigation section.',
                        examples: ['true', 'false']
                    },
                    isRefreshButtonHidden: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Whether to hide the refresh button.',
                        examples: ['true', 'false']
                    },
                    isExportButtonsHidden: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Whether to hide export buttons (Excel, CSV, etc.).',
                        examples: ['true', 'false']
                    },
                    isHeaderVisible: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Whether to show the report header section.',
                        examples: ['true', 'false']
                    },
                    
                    // Rating and Styling Properties
                    ratingLevelColumnName: {
                        type: 'string',
                        required: false,
                        description: 'Rating level column name override. Defaults to "RatingLevel".',
                        examples: ['RatingLevel', 'Status', 'Priority']
                    },
                    isRatingLevelChangingRowBackgroundColor: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Whether rating level column values (Unknown, Excellent, Good, Fair, Poor) automatically change row background color.',
                        examples: ['true', 'false']
                    },
                    
                    // Sorting Properties
                    defaultOrderByColumnName: {
                        type: 'string',
                        required: false,
                        description: 'Default column name to sort by when report loads.',
                        examples: ['Name', 'Date', 'Priority']
                    },
                    defaultOrderByDescending: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Whether default sort order is descending.',
                        examples: ['true', 'false']
                    },
                    
                    // Auto-Refresh Properties
                    isAutoRefresh: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Whether report automatically refreshes at intervals.',
                        examples: ['true', 'false']
                    },
                    isAutoRefreshVisible: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Whether auto-refresh controls are visible to users.',
                        examples: ['true', 'false']
                    },
                    isAutoRefreshFrequencyVisible: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Whether auto-refresh frequency selector is visible.',
                        examples: ['true', 'false']
                    },
                    isAutoRefreshDegraded: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Whether auto-refresh uses degraded/reduced frequency mode.',
                        examples: ['true', 'false']
                    },
                    autoRefreshFrequencyInMinutes: {
                        type: 'string',
                        required: false,
                        description: 'Auto-refresh frequency in minutes.',
                        examples: ['1', '5', '15', '30', '60']
                    },
                    
                    // Feature Flags
                    isSchedulingAllowed: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Whether report scheduling feature is enabled.',
                        examples: ['true', 'false']
                    },
                    isFavoriteCreationAllowed: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Whether users can save report as favorite.',
                        examples: ['true', 'false']
                    },
                    isPageUserSettingsDistinctForApp: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Whether user settings for this page are distinct per application.',
                        examples: ['true', 'false']
                    },
                    
                    // Authorization Properties
                    isAuthorizationRequired: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Whether authorization/role check is required to access this report.',
                        examples: ['true', 'false']
                    },
                    roleRequired: {
                        type: 'string',
                        required: false,
                        description: 'Role name required to access this report (when isAuthorizationRequired is "true").',
                        examples: ['Admin', 'Manager', 'User', 'SuperUser']
                    },
                    
                    // Layout and UI Properties
                    layoutName: {
                        type: 'string',
                        required: false,
                        description: 'Layout template name to use for this report.',
                        examples: ['AdminLayout', 'UserLayout', 'PublicLayout']
                    },
                    noRowsReturnedText: {
                        type: 'string',
                        required: false,
                        description: 'Message displayed when no results are found.',
                        examples: ['No Results Found', 'No data available', 'No records match your criteria']
                    },
                    
                    // Azure Storage Properties
                    isAzureTableUsed: {
                        type: 'string',
                        required: false,
                        enum: ['', 'true', 'false'],
                        description: 'Whether Azure Table Storage is used as the data source.',
                        examples: ['', 'true', 'false']
                    },
                    azureTablePrimaryKeyColumn: {
                        type: 'string',
                        required: false,
                        description: 'Column name used for Azure Table Storage RowKey value.',
                        examples: ['ID', 'CustomerID', 'OrderID']
                    },
                    
                    // Documentation and Metadata
                    codeDescription: {
                        type: 'string',
                        required: false,
                        description: 'Developer notes or description for documentation purposes.',
                        examples: ['Customer list report with filtering', 'Sales summary by region']
                    },
                    filteringSqlLogic: {
                        type: 'string',
                        required: false,
                        description: 'Custom SQL logic for filtering data.',
                        examples: ['WHERE Status = \'Active\'', 'AND CreatedDate > DATEADD(day, -30, GETDATE())']
                    },
                    isBasicHeaderAutomaticallyAdded: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        description: 'Whether basic header is automatically added to the report.',
                        examples: ['true', 'false']
                    },
                    
                    // Array Properties (have dedicated tabs in UI)
                    reportColumn: {
                        type: 'array',
                        required: false,
                        description: 'Array of column definitions for the report. Managed in the Columns tab of the report details view.',
                        items: {
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string',
                                    required: true,
                                    description: 'Column identifier name',
                                    examples: ['CustomerName', 'OrderDate', 'TotalAmount']
                                },
                                headerText: {
                                    type: 'string',
                                    description: 'Header text displayed for the column',
                                    examples: ['Customer Name', 'Order Date', 'Total Amount']
                                },
                                sourceObjectName: {
                                    type: 'string',
                                    description: 'Source data object name for the column data',
                                    examples: ['Customer', 'Order']
                                },
                                sourcePropertyName: {
                                    type: 'string',
                                    description: 'Source property name from the data object',
                                    examples: ['Name', 'OrderDate', 'TotalAmount']
                                },
                                isVisible: {
                                    type: 'string',
                                    enum: ['true', 'false'],
                                    description: 'Whether column is visible in the report'
                                },
                                isButton: {
                                    type: 'string',
                                    enum: ['true', 'false'],
                                    description: 'Whether this column is a button (destination button or general flow button)'
                                },
                                buttonText: {
                                    type: 'string',
                                    description: 'Button text (when isButton is "true")'
                                },
                                destinationContextObjectName: {
                                    type: 'string',
                                    description: 'Context object for navigation (for destination buttons)'
                                },
                                destinationTargetName: {
                                    type: 'string',
                                    description: 'Target page/report name (for destination buttons)'
                                },
                                minWidth: {
                                    type: 'string',
                                    description: 'Minimum column width in pixels',
                                    examples: ['100', '150', '200']
                                },
                                maxWidth: {
                                    type: 'string',
                                    description: 'Maximum column width in pixels',
                                    examples: ['300', '400', '500']
                                }
                            },
                            note: 'See ReportColumnSchema interface for complete list of 60+ column properties including formatting, filtering, navigation, and display control options'
                        },
                        examples: [
                            {
                                name: 'CustomerName',
                                headerText: 'Customer Name',
                                sourceObjectName: 'Customer',
                                sourcePropertyName: 'Name',
                                isVisible: 'true',
                                minWidth: '150'
                            }
                        ]
                    },
                    reportButton: {
                        type: 'array',
                        required: false,
                        description: 'Array of button definitions for the report. Managed in the Buttons tab of the report details view.',
                        items: {
                            type: 'object',
                            properties: {
                                buttonName: {
                                    type: 'string',
                                    required: true,
                                    description: 'Button identifier name (PascalCase, no numbers)',
                                    examples: ['Back', 'Edit', 'Delete', 'ViewDetails']
                                },
                                buttonText: {
                                    type: 'string',
                                    required: true,
                                    description: 'Text displayed on the button',
                                    examples: ['Back', 'Edit', 'Delete', 'View Details']
                                },
                                buttonType: {
                                    type: 'string',
                                    description: 'Type of button action',
                                    enum: ['back', 'destination', 'generalFlow', 'multiSelect'],
                                    examples: ['back', 'destination', 'generalFlow']
                                },
                                isVisible: {
                                    type: 'string',
                                    enum: ['true', 'false'],
                                    description: 'Whether button is visible'
                                },
                                destinationContextObjectName: {
                                    type: 'string',
                                    description: 'Context object for navigation (for destination buttons)'
                                },
                                destinationTargetName: {
                                    type: 'string',
                                    description: 'Target page/report name (for destination buttons)'
                                },
                                isButtonCallToAction: {
                                    type: 'string',
                                    enum: ['true', 'false'],
                                    description: 'Whether button is styled as call-to-action (highlighted)'
                                },
                                accessKey: {
                                    type: 'string',
                                    description: 'Keyboard shortcut key for the button',
                                    examples: ['B', 'E', 'D']
                                }
                            }
                        },
                        examples: [
                            {
                                buttonName: 'Back',
                                buttonText: 'Back',
                                buttonType: 'back',
                                isVisible: 'true'
                            }
                        ]
                    },
                    reportParam: {
                        type: 'array',
                        required: false,
                        description: 'Array of filter parameter definitions for the report. Managed in the Filters tab of the report details view.',
                        items: {
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string',
                                    required: true,
                                    description: 'Parameter identifier name',
                                    examples: ['CustomerID', 'StartDate', 'Status']
                                },
                                labelText: {
                                    type: 'string',
                                    description: 'Label text displayed for the filter',
                                    examples: ['Customer', 'Start Date', 'Status']
                                },
                                sqlServerDBDataType: {
                                    type: 'string',
                                    enum: ['nvarchar', 'bit', 'datetime', 'int', 'uniqueidentifier', 'money', 'bigint', 'float', 'decimal', 'date', 'varchar', 'text'],
                                    description: 'SQL Server data type for the parameter'
                                },
                                sqlServerDBDataTypeSize: {
                                    type: 'string',
                                    description: 'Size of nvarchar (100 by default for nvarchar)',
                                    examples: ['50', '100', '500', 'max']
                                },
                                isFK: {
                                    type: 'string',
                                    enum: ['true', 'false'],
                                    description: 'Whether parameter is a foreign key'
                                },
                                fKObjectName: {
                                    type: 'string',
                                    description: 'Foreign key object name (when isFK is "true")',
                                    examples: ['Customer', 'Status', 'Priority']
                                },
                                isFKLookup: {
                                    type: 'string',
                                    enum: ['true', 'false'],
                                    description: 'Whether FK is to a lookup object'
                                },
                                isFKList: {
                                    type: 'string',
                                    enum: ['true', 'false'],
                                    description: 'Whether dropdown list should be shown for FK selection'
                                },
                                isFKListInactiveIncluded: {
                                    type: 'string',
                                    enum: ['true', 'false'],
                                    description: 'Whether inactive items are included in FK dropdown list'
                                },
                                fKListOrderBy: {
                                    type: 'string',
                                    enum: ['NameDesc', 'NameAsc', 'DisplayOrderDesc', 'DisplayOrderAsc'],
                                    description: 'Sort order for FK dropdown list'
                                },
                                isFKListSearchable: {
                                    type: 'string',
                                    enum: ['true', 'false'],
                                    description: 'Whether FK dropdown list is searchable'
                                },
                                isUnknownLookupAllowed: {
                                    type: 'string',
                                    enum: ['', 'true', 'false'],
                                    description: 'Whether unknown lookup values are allowed'
                                },
                                defaultValue: {
                                    type: 'string',
                                    description: 'Default value for the parameter'
                                },
                                isVisible: {
                                    type: 'string',
                                    enum: ['', 'true', 'false'],
                                    description: 'Whether parameter is visible in filter section'
                                },
                                targetColumnName: {
                                    type: 'string',
                                    description: 'Target database column name for filtering'
                                },
                                codeDescription: {
                                    type: 'string',
                                    description: 'Developer notes or description for documentation'
                                }
                            }
                        },
                        examples: [
                            {
                                name: 'CustomerID',
                                labelText: 'Customer',
                                sqlServerDBDataType: 'int',
                                isFK: 'true',
                                fKObjectName: 'Customer',
                                isFKList: 'true',
                                isVisible: 'true'
                            }
                        ]
                    }
                },
                validationRules: {
                    name: [
                        'Required field (but not exposed in settings tab - managed at creation)',
                        'Must be unique within the object\'s report array (case-insensitive check)',
                        'Must be in PascalCase format',
                        'Must start with uppercase letter',
                        'Can only contain letters (A-Z, a-z) and numbers (0-9)',
                        'No spaces, hyphens, or special characters allowed',
                        'Common patterns: Entity + Type (CustomerList, SalesReport, OrderHistory)'
                    ],
                    titleText: [
                        'Optional field',
                        'Human-readable title for the report',
                        'Displayed at the top of the report page',
                        'Can contain spaces and special characters'
                    ],
                    visualizationType: [
                        'Optional field',
                        'Must be one of: Grid, PieChart, LineChart, FlowChart, CardView, FolderView',
                        'Determines how data is visualized',
                        'Grid is most common for tabular data',
                        'Each type has specific column mapping properties (hidden from settings tab)'
                    ],
                    targetChildObject: [
                        'Optional field',
                        'Must match an existing data object name exactly (case-sensitive)',
                        'Defines which child object data is displayed on the report',
                        'If not specified, report shows owner object data'
                    ],
                    roleRequired: [
                        'Optional field',
                        'Must match a role name from the Role lookup object (case-sensitive)',
                        'Controls who can access this report',
                        'Leave empty for public access',
                        'Common values: Admin, Manager, User, Viewer'
                    ],
                    reportColumn: [
                        'Optional array - only included if report has columns',
                        'Each column must have unique name within the report',
                        'Column names must be in PascalCase format',
                        'All boolean-like fields use string "true"/"false" not boolean',
                        'sourceObjectName and sourcePropertyName link to data object properties',
                        'isButton="true" creates destination button or general flow button columns',
                        'destinationContextObjectName and destinationTargetName define navigation for button columns'
                    ],
                    reportButton: [
                        'Optional array - only included if report has buttons',
                        'Each button must have unique buttonName within the report',
                        'Button names must be in PascalCase format with no numbers',
                        'Common button types: back, destination, generalFlow, multiSelect',
                        'buttonText provides the displayed text on the button',
                        'destinationContextObjectName and destinationTargetName define navigation',
                        'isButtonCallToAction highlights the button as primary action',
                        'All boolean-like fields use string "true"/"false" not boolean'
                    ],
                    reportParam: [
                        'Optional array - only included if report has filter parameters',
                        'Each parameter must have unique name within the report',
                        'Parameter names must be in PascalCase format',
                        'All boolean-like fields use string "true"/"false" not boolean',
                        'sqlServerDBDataType must be one of: nvarchar, bit, datetime, int, uniqueidentifier, money, bigint, float, decimal, date',
                        'isFK must be "true" or "false" - if "true" then fKObjectName is required',
                        'isFKLookup must be "true" or "false" - indicates FK to a lookup object',
                        'fKObjectName must match existing data object name exactly (case-sensitive)',
                        'targetColumnName specifies which database column to filter on'
                    ]
                },
                usage: {
                    location: 'Stored in namespace → object → report array in AppDNA model',
                    access: 'Via namespace[0].object[n].report array',
                    modelStructure: 'namespace → object[] → report[]',
                    purpose: 'Define reports for data visualization, listing, and analysis',
                    relatedTools: [
                        'list_pages - List all reports from the model (use page_type="Report")',
                        'get_report - Get a specific report by name',
                        'create_report - Create new report',
                        'update_report - Update report properties',
                        'open_report_details_view - Open report details editor in VS Code',
                        'open_add_report_wizard - Open wizard for creating new reports'
                    ]
                },
                commonPatterns: {
                    gridReport: {
                        name: 'CustomerList',
                        titleText: 'Customer List',
                        visualizationType: 'Grid',
                        isCustomSqlUsed: 'false',
                        isPage: 'true',
                        isPagingAvailable: 'true',
                        defaultPageSize: '25',
                        isAuthorizationRequired: 'true',
                        roleRequired: 'User',
                        reportColumn: [
                            {
                                name: 'Name',
                                headerText: 'Customer Name',
                                sourceObjectName: 'Customer',
                                sourcePropertyName: 'Name',
                                isVisible: 'true',
                                minWidth: '150'
                            },
                            {
                                name: 'Email',
                                headerText: 'Email Address',
                                sourceObjectName: 'Customer',
                                sourcePropertyName: 'EmailAddress',
                                isVisible: 'true',
                                minWidth: '200'
                            }
                        ],
                        reportButton: [
                            {
                                buttonName: 'Back',
                                buttonText: 'Back',
                                buttonType: 'back',
                                isVisible: 'true'
                            }
                        ],
                        reportParam: [
                            {
                                name: 'StatusID',
                                labelText: 'Status',
                                sqlServerDBDataType: 'int',
                                isFK: 'true',
                                isFKLookup: 'true',
                                fKObjectName: 'Status',
                                isVisible: 'true'
                            }
                        ]
                    },
                    cardViewReport: {
                        name: 'ProductCatalog',
                        titleText: 'Product Catalog',
                        visualizationType: 'CardView',
                        isPage: 'true',
                        reportColumn: [
                            {
                                name: 'ProductName',
                                headerText: 'Product Name',
                                sourceObjectName: 'Product',
                                sourcePropertyName: 'Name',
                                isVisible: 'true'
                            }
                        ],
                        reportButton: [
                            {
                                buttonName: 'Back',
                                buttonText: 'Back',
                                buttonType: 'back',
                                isVisible: 'true'
                            }
                        ]
                    },
                    reportWithDestinationButtonColumn: {
                        name: 'OrderList',
                        titleText: 'Order List',
                        visualizationType: 'Grid',
                        isPage: 'true',
                        isPagingAvailable: 'true',
                        reportColumn: [
                            {
                                name: 'OrderNumber',
                                headerText: 'Order #',
                                sourceObjectName: 'Order',
                                sourcePropertyName: 'OrderNumber',
                                isVisible: 'true'
                            },
                            {
                                name: 'ViewButton',
                                headerText: 'Actions',
                                isButton: 'true',
                                buttonText: 'View',
                                destinationContextObjectName: 'Order',
                                destinationTargetName: 'OrderDetails',
                                isVisible: 'true'
                            }
                        ],
                        reportButton: [
                            {
                                buttonName: 'Back',
                                buttonText: 'Back',
                                buttonType: 'back',
                                isVisible: 'true'
                            }
                        ]
                    }
                },
                notes: [
                    'Reports represent data visualization and display interfaces',
                    'Each report belongs to a data object (owner)',
                    'Report names typically follow the pattern: Entity + Type (CustomerList, SalesReport)',
                    'All boolean flags must be string "true" or "false", not boolean values',
                    'This schema reflects properties visible in the report details view',
                    'Settings tab shows scalar properties; Columns, Buttons, and Filters tabs manage array properties',
                    'Hidden properties are managed through other UI mechanisms or are system-controlled',
                    'Array properties (reportColumn, reportButton, reportParam) contain full item schemas with 60+, 15+, and 16+ properties respectively',
                    'Use get_report tool to retrieve a complete report object with all properties and arrays',
                    'Visualization types each have specific column mapping properties that are hidden from settings tab',
                    'reportColumn array can contain both data display columns and button columns (isButton="true")',
                    'reportButton array is for top-level report buttons (breadcrumbs, navigation)',
                    'reportParam array defines filter controls shown in the filter section'
                ]
            },
            note: 'This schema defines the editable structure of reports in the AppDNA model, matching what users see in the report details view'
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
            
            const response = await this.fetchFromBridge(endpoint);
            
            // Debug: Check the response structure
            if (!response) {
                return {
                    success: false,
                    error: 'No response received from bridge',
                    note: 'Bridge connection required to retrieve reports. Make sure the AppDNA extension is running and a model file is loaded.'
                };
            }

            // Handle array response (expected)
            reports = Array.isArray(response) ? response : [];
            
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
            
            // Safely get owner object name
            const ownerObjectName = report?._ownerObjectName || 'Unknown';
            
            // Remove the temporary _ownerObjectName property
            delete report._ownerObjectName;

            // Calculate element counts
            const paramCount = report.reportParam ? report.reportParam.length : 0;
            const columnCount = report.reportColumn ? report.reportColumn.length : 0;
            const buttonCount = report.reportButton ? report.reportButton.length : 0;
            const totalElements = paramCount + columnCount + buttonCount;

            // Filter out hidden properties from the report object
            const filteredReport = this.filterHiddenReportProperties(report);

            return {
                success: true,
                report: filteredReport,
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
     * Filters out hidden properties from a report object
     * These properties are hidden in the UI settings tab and should not be prominently returned by the API
     * Based on getReportPropertiesToIgnore() from settingsTabTemplate.js
     * @param report The report object to filter
     * @returns Filtered report object without hidden properties
     */
    private filterHiddenReportProperties(report: any): any {
        const hiddenProperties = [
            // System-managed properties
            'initObjectWorkflowName',
            'isCachingAllowed',
            'cacheExpirationInMinutes',
            'badgeCountPropertyName',
            'isHeaderLabelsVisible',
            'isReportDetailLabelColumnVisible',
            'formIntroText',
            'isIgnoredInDocumentation',
            'isAzureBlobStorageUsed',
            'azureTableNameOverride',
            'isAzureTablePrimaryKeyColumnDateTime',
            
            // Visualization-specific properties (Grid)
            'visualizationGridGroupByColumnName',
            'visualizationGridGroupByInfoTextColumnName',
            
            // Visualization-specific properties (PieChart)
            'visualizationPieChartSliceValueColumnName',
            'visualizationPieChartSliceDescriptionColumnName',
            
            // Visualization-specific properties (LineChart)
            'visualizationLineChartUTCDateTimeColumnName',
            'visualizationLineChartValueColumnName',
            'visualizationLineChartDescriptionColumnName',
            'isVisualizationLineChartGridHorizLineHidden',
            'isVisualizationLineChartGridVerticalLineHidden',
            'isVisualizationLineChartLegendHidden',
            'isVisualizationLineChartStairLines',
            'visualizationLineChartGridVerticalMaxValue',
            'visualizationLineChartGridVerticalMinValue',
            'visualizationLineChartGridVerticalStepValue',
            'isVisualizationLineChartVerticalLabelsHidden',
            'visualizationLineChartGridVerticalTitle',
            'visualizationLineChartGridHorizTitle',
            'visualizationLineChartGridVerticalMaxValLabel',
            'visualizationLineChartGridVerticalMinValLabel',
            'isVisualizationLineChartGridVerticalMaxDynamic',
            
            // Visualization-specific properties (FlowChart)
            'visualizationFlowChartSourceNodeCodeColumnName',
            'visualizationFlowChartSourceNodeDescriptionColumnName',
            'visualizationFlowChartSourceNodeColorColumnName',
            'visualizationFlowChartFlowDescriptionColumnName',
            'visualizationFlowChartDestinationNodeCodeColumnName',
            
            // Visualization-specific properties (CardView)
            'visualizationCardViewTitleColumn',
            'visualizationCardViewDescriptionColumn',
            'visualizationCardViewIsImageAvailable',
            'visualizationCardViewImageColumn',
            'visualizationCardViewGroupByColumnName',
            'visualizationCardViewGroupByInfoTextColumnName',
            
            // Visualization-specific properties (FolderView)
            'visualizationFolderIDColumnName',
            'visualizationFolderNameColumnName',
            'visualizationFolderParentIDColumnName',
            'visualizationFolderIsFolderColumnName',
            'visualizationFolderIsDragDropAllowed',
            'visualizationFolderDragDropEventContextObjectName',
            'visualizationFolderDragDropEventTargetName'
        ];

        // Create a shallow copy and remove hidden properties
        const filtered = { ...report };
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
     * Helper method to post data to the HTTP bridge
     * @param endpoint API endpoint to post to
     * @param postData Data to post
     * @returns Parsed JSON response
     */
    private async postToBridge(endpoint: string, postData: any): Promise<any> {
        const http = await import('http');
        
        return new Promise((resolve, reject) => {
            const postDataString = JSON.stringify(postData);
            const options = {
                hostname: 'localhost',
                port: 3001,
                path: endpoint,
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
                        if (res.statusCode === 200) {
                            const parsedData = JSON.parse(data);
                            resolve(parsedData);
                        } else {
                            reject(new Error(data || `HTTP ${res.statusCode}`));
                        }
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

            // Build base report name (PascalCase) - matches wizard logic exactly
            // Start with owner object (report belongs to this object)
            let baseReportName = owner_object_name;
            
            // Add role qualifier if provided
            if (role_required) {
                baseReportName += role_required;
            }
            
            // Add visualization-specific suffix (matches wizard's logic exactly)
            const vizType = visualization_type || 'Grid';
            if (vizType === 'Grid' && target_child_object) {
                // Grid with target: add target object name + "List"
                baseReportName += target_child_object + 'List';
            } else if (vizType === 'Grid') {
                // Grid without target: add "List"
                baseReportName += 'List';
            } else if (vizType === 'DetailThreeColumn') {
                baseReportName += 'Detail';
            } else if (vizType === 'DetailTwoColumn') {
                baseReportName += 'Dashboard';
            }
            // Note: Other visualization types (PieChart, LineChart, etc.) get no suffix - matches wizard behavior

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

            // Build suggested title (human-readable with spaces) - matches wizard logic
            // Convert the generated name directly to human-readable format
            let reportTitle = this.convertToHumanReadable(reportName);

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

            // Create the new report object - matches wizard's minimal approach
            const newReport: any = {
                name: report_name,
                titleText: title_text,
                visualizationType: vizType,
                isCustomSqlUsed: "false",
                isPage: "true",
                reportColumn: [],
                reportButton: [],
                reportParam: []
            };

            // Add default Back button
            newReport.reportButton.push({
                buttonName: "Back",
                buttonText: "Back",
                buttonType: "back"
            });

            // Add optional properties based on parameters
            if (role_required) {
                newReport.isAuthorizationRequired = "true";
                newReport.roleRequired = role_required;
                newReport.layoutName = role_required + "Layout";
            }

            if (target_child_object && vizType === "Grid") {
                newReport.targetChildObject = target_child_object;
            }

            // Create page init flow
            const pageInitFlowName = report_name + "InitReport";
            newReport.initObjectWorkflowName = pageInitFlowName;

            const newPageInitFlow = {
                name: pageInitFlowName,
                titleText: title_text + " Initialization",
                objectWorkflowOutputVar: []
            };

            // Add report and page init flow to owner object via HTTP bridge POST
            const postData = {
                ownerObjectName: owner_object_name,
                report: newReport,
                pageInitFlow: newPageInitFlow
            };

            // Use HTTP POST to create the report
            await this.postToBridge('/api/create-report', postData);

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

    /**
     * Update an existing report's properties
     * @param report_name - Name of the report to update (case-sensitive, exact match required)
     * @param updates - Object containing properties to update (at least one required)
     * @returns Result object with success status
     */
    async update_report(
        report_name: string,
        updates: {
            // Core Properties
            titleText?: string;
            introText?: string;
            visualizationType?: 'Grid' | 'PieChart' | 'LineChart' | 'FlowChart' | 'CardView' | 'FolderView';
            
            // Data Source Properties
            isCustomSqlUsed?: 'true' | 'false';
            targetChildObject?: string;
            
            // Display Control Properties
            isButtonDropDownAllowed?: 'true' | 'false';
            isPagingAvailable?: 'true' | 'false';
            defaultPageSize?: string;
            isFilterSectionHidden?: 'true' | 'false';
            isFilterSectionCollapsable?: 'true' | 'false';
            isFilterPersistant?: 'true' | 'false';
            isBreadcrumbSectionHidden?: 'true' | 'false';
            isRefreshButtonHidden?: 'true' | 'false';
            isExportButtonsHidden?: 'true' | 'false';
            isHeaderVisible?: 'true' | 'false';
            
            // Rating and Styling Properties
            ratingLevelColumnName?: string;
            isRatingLevelChangingRowBackgroundColor?: 'true' | 'false';
            
            // Sorting Properties
            defaultOrderByColumnName?: string;
            defaultOrderByDescending?: 'true' | 'false';
            
            // Auto-Refresh Properties
            isAutoRefresh?: 'true' | 'false';
            isAutoRefreshVisible?: 'true' | 'false';
            isAutoRefreshFrequencyVisible?: 'true' | 'false';
            isAutoRefreshDegraded?: 'true' | 'false';
            autoRefreshFrequencyInMinutes?: string;
            
            // Feature Flags
            isSchedulingAllowed?: 'true' | 'false';
            isFavoriteCreationAllowed?: 'true' | 'false';
            isPageUserSettingsDistinctForApp?: 'true' | 'false';
            
            // Authorization Properties
            isAuthorizationRequired?: 'true' | 'false';
            roleRequired?: string;
            
            // Layout and UI Properties
            layoutName?: string;
            noRowsReturnedText?: string;
            isBasicHeaderAutomaticallyAdded?: 'true' | 'false';
            
            // Azure Storage Properties
            isAzureTableUsed?: '' | 'true' | 'false';
            azureTablePrimaryKeyColumn?: string;
            
            // Documentation and Metadata
            codeDescription?: string;
            filteringSqlLogic?: string;
        }
    ): Promise<{ success: boolean; report?: any; owner_object_name?: string; message?: string; error?: string; note?: string }> {
        try {
            // Validate at least one property to update
            const updateKeys = Object.keys(updates);
            if (updateKeys.length === 0) {
                return {
                    success: false,
                    error: 'At least one property to update must be provided'
                };
            }

            // Call bridge API to update report
            const postData = {
                report_name,
                updates: updates
            };

            const updatedReport: any = await this.postToBridge('/api/update-report', postData);

            if (!updatedReport.success) {
                return {
                    success: false,
                    error: updatedReport.error || 'Failed to update report'
                };
            }

            return {
                success: true,
                report: updatedReport.report,
                owner_object_name: updatedReport.owner_object_name,
                message: `Report "${report_name}" updated successfully`,
                note: 'Report properties have been updated. The model has unsaved changes.'
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not update report: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to update reports. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Add a new parameter (filter control) to an existing report
     * @param report_name - Name of the report to add the parameter to (case-sensitive, exact match required)
     * @param param - The parameter object to add
     * @returns Result object with success status
     */
    async add_report_param(
        report_name: string,
        param: {
            name: string;
            sqlServerDBDataType?: string;
            sqlServerDBDataTypeSize?: string;
            labelText?: string;
            targetColumnName?: string;
            isFK?: 'true' | 'false';
            fKObjectName?: string;
            isFKLookup?: 'true' | 'false';
            isFKList?: 'true' | 'false';
            isFKListInactiveIncluded?: 'true' | 'false';
            fKListOrderBy?: string;
            isFKListSearchable?: 'true' | 'false';
            isUnknownLookupAllowed?: 'true' | 'false';
            defaultValue?: string;
            isVisible?: 'true' | 'false';
            codeDescription?: string;
        }
    ): Promise<{ success: boolean; param?: any; report_name?: string; owner_object_name?: string; message?: string; error?: string; note?: string }> {
        try {
            // Validate required parameter name
            if (!param.name) {
                return {
                    success: false,
                    error: 'Parameter name is required'
                };
            }

            // Call bridge API to add report param
            const postData = {
                report_name,
                param: param
            };

            const result: any = await this.postToBridge('/api/add-report-param', postData);

            if (!result.success) {
                return {
                    success: false,
                    error: result.error || 'Failed to add report parameter'
                };
            }

            return {
                success: true,
                param: result.param,
                report_name: report_name,
                owner_object_name: result.owner_object_name,
                message: `Parameter "${param.name}" added to report "${report_name}" successfully`,
                note: 'Report parameter has been added. The model has unsaved changes.'
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not add report parameter: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to add report parameters. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Update an existing parameter (filter control) in a report
     * @param report_name - Name of the report containing the parameter (case-sensitive, exact match required)
     * @param param_name - Name of the parameter to update (case-sensitive, exact match required)
     * @param updates - Object containing the properties to update
     * @returns Result object with success status
     */
    async update_report_param(
        report_name: string,
        param_name: string,
        updates: {
            sqlServerDBDataType?: string;
            sqlServerDBDataTypeSize?: string;
            labelText?: string;
            targetColumnName?: string;
            isFK?: 'true' | 'false';
            fKObjectName?: string;
            isFKLookup?: 'true' | 'false';
            isFKList?: 'true' | 'false';
            isFKListInactiveIncluded?: 'true' | 'false';
            fKListOrderBy?: string;
            isFKListSearchable?: 'true' | 'false';
            isUnknownLookupAllowed?: 'true' | 'false';
            defaultValue?: string;
            isVisible?: 'true' | 'false';
            codeDescription?: string;
        }
    ): Promise<{ success: boolean; param?: any; report_name?: string; owner_object_name?: string; message?: string; error?: string; note?: string }> {
        try {
            // Validate at least one property to update
            const updateKeys = Object.keys(updates);
            if (updateKeys.length === 0) {
                return {
                    success: false,
                    error: 'At least one property to update must be provided'
                };
            }

            // Call bridge API to update report param
            const postData = {
                report_name,
                param_name,
                param: updates
            };

            const result: any = await this.postToBridge('/api/update-report-param', postData);

            if (!result.success) {
                return {
                    success: false,
                    error: result.error || 'Failed to update report parameter'
                };
            }

            return {
                success: true,
                param: result.param,
                report_name: report_name,
                owner_object_name: result.owner_object_name,
                message: `Parameter "${param_name}" in report "${report_name}" updated successfully`,
                note: 'Report parameter has been updated. The model has unsaved changes.'
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not update report parameter: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to update report parameters. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Add a new column to an existing report
     * @param report_name - Name of the report to add the column to (case-sensitive, exact match required)
     * @param column - The column object to add
     * @returns Result object with success status
     */
    async add_report_column(
        report_name: string,
        column: {
            name: string;
            headerText?: string;
            sqlServerDBDataType?: string;
            sqlServerDBDataTypeSize?: string;
            sourceObjectName?: string;
            sourcePropertyName?: string;
            isVisible?: 'true' | 'false';
            minWidth?: string;
            maxWidth?: string;
            isButton?: 'true' | 'false';
            buttonText?: string;
            destinationContextObjectName?: string;
            destinationTargetName?: string;
            isFilterAvailable?: 'true' | 'false';
            codeDescription?: string;
        }
    ): Promise<{ success: boolean; column?: any; report_name?: string; owner_object_name?: string; message?: string; error?: string; note?: string }> {
        try {
            // Validate required column name
            if (!column.name) {
                return {
                    success: false,
                    error: 'Column name is required'
                };
            }

            // Call bridge API to add report column
            // Ensure column has columnName (backend expects it)
            const columnData = { ...column, columnName: column.name };
            const postData = {
                report_name,
                column: columnData
            };

            const result: any = await this.postToBridge('/api/add-report-column', postData);

            if (!result.success) {
                return {
                    success: false,
                    error: result.error || 'Failed to add report column'
                };
            }

            return {
                success: true,
                column: result.column,
                report_name: report_name,
                owner_object_name: result.owner_object_name,
                message: `Column "${column.name}" added to report "${report_name}" successfully`,
                note: 'Report column has been added. The model has unsaved changes.'
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not add report column: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to add report columns. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Update an existing column in a report
     * @param report_name - Name of the report containing the column (case-sensitive, exact match required)
     * @param column_name - Name of the column to update (case-sensitive, exact match required)
     * @param updates - Object containing the properties to update
     * @returns Result object with success status
     */
    async update_report_column(
        report_name: string,
        column_name: string,
        updates: {
            headerText?: string;
            sqlServerDBDataType?: string;
            sqlServerDBDataTypeSize?: string;
            sourceObjectName?: string;
            sourcePropertyName?: string;
            isVisible?: 'true' | 'false';
            minWidth?: string;
            maxWidth?: string;
            isButton?: 'true' | 'false';
            buttonText?: string;
            destinationContextObjectName?: string;
            destinationTargetName?: string;
            isFilterAvailable?: 'true' | 'false';
            codeDescription?: string;
        }
    ): Promise<{ success: boolean; column?: any; report_name?: string; owner_object_name?: string; message?: string; error?: string; note?: string }> {
        try {
            // Validate at least one property to update
            const updateKeys = Object.keys(updates);
            if (updateKeys.length === 0) {
                return {
                    success: false,
                    error: 'At least one property to update must be provided'
                };
            }

            // Call bridge API to update report column
            const postData = {
                report_name,
                column_name,
                column: updates
            };

            const result: any = await this.postToBridge('/api/update-report-column', postData);

            if (!result.success) {
                return {
                    success: false,
                    error: result.error || 'Failed to update report column'
                };
            }

            return {
                success: true,
                column: result.column,
                report_name: report_name,
                owner_object_name: result.owner_object_name,
                message: `Column "${column_name}" in report "${report_name}" updated successfully`,
                note: 'Report column has been updated. The model has unsaved changes.'
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not update report column: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to update report columns. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Add a new button to an existing report
     * @param report_name - Name of the report to add the button to (case-sensitive, exact match required)
     * @param button - The button object to add
     * @returns Result object with success status
     */
    async add_report_button(
        report_name: string,
        button: {
            buttonName?: string;
            buttonText: string;
            buttonType?: string;
            isVisible?: 'true' | 'false';
            destinationContextObjectName?: string;
            destinationTargetName?: string;
            isButtonCallToAction?: 'true' | 'false';
        }
    ): Promise<{ success: boolean; button?: any; report_name?: string; owner_object_name?: string; message?: string; error?: string; note?: string }> {
        try {
            // Validate required button text
            if (!button.buttonText) {
                return {
                    success: false,
                    error: 'Button text is required'
                };
            }

            // Call bridge API to add report button
            const postData = {
                report_name,
                button: button
            };

            const result: any = await this.postToBridge('/api/add-report-button', postData);

            if (!result.success) {
                return {
                    success: false,
                    error: result.error || 'Failed to add report button'
                };
            }

            return {
                success: true,
                button: result.button,
                report_name: report_name,
                owner_object_name: result.owner_object_name,
                message: `Button "${button.buttonText}" added to report "${report_name}" successfully`,
                note: 'Report button has been added. The model has unsaved changes.'
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not add report button: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to add report buttons. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Update an existing button in a report
     * @param report_name - Name of the report containing the button (case-sensitive, exact match required)
     * @param button_name - buttonName of the button to update (case-sensitive, exact match required)
     * @param updates - Object containing the properties to update
     * @returns Result object with success status
     */
    async update_report_button(
        report_name: string,
        button_name: string,
        updates: {
            buttonText?: string;
            buttonType?: string;
            isVisible?: 'true' | 'false';
            destinationContextObjectName?: string;
            destinationTargetName?: string;
            isButtonCallToAction?: 'true' | 'false';
        }
    ): Promise<{ success: boolean; button?: any; report_name?: string; owner_object_name?: string; message?: string; error?: string; note?: string }> {
        try {
            // Validate at least one property to update
            const updateKeys = Object.keys(updates);
            if (updateKeys.length === 0) {
                return {
                    success: false,
                    error: 'At least one property to update must be provided'
                };
            }

            // Call bridge API to update report button
            const postData = {
                report_name,
                button_text: button_name,
                button: updates
            };

            const result: any = await this.postToBridge('/api/update-report-button', postData);

            if (!result.success) {
                return {
                    success: false,
                    error: result.error || 'Failed to update report button'
                };
            }

            return {
                success: true,
                button: result.button,
                report_name: report_name,
                owner_object_name: result.owner_object_name,
                message: `Button "${button_name}" in report "${report_name}" updated successfully`,
                note: 'Report button has been updated. The model has unsaved changes.'
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not update report button: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to update report buttons. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Move a report parameter to a new position in the reportParam array
     * @param report_name - Name of the report (case-sensitive exact match)
     * @param param_name - Name of the parameter to move (case-sensitive exact match)
     * @param new_position - New 0-based index position for the parameter
     * @returns Result with success status and position details
     */
    async move_report_param(
        report_name: string,
        param_name: string,
        new_position: number
    ): Promise<any> {
        try {
            if (new_position < 0) {
                return {
                    success: false,
                    error: 'new_position must be 0 or greater'
                };
            }

            const http = await import('http');
            const postData = { report_name, param_name, new_index: new_position };
            const postDataString = JSON.stringify(postData);

            const result: any = await new Promise((resolve, reject) => {
                const req = http.request(
                    {
                        hostname: 'localhost',
                        port: 3001,
                        path: '/api/move-report-param',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Length': Buffer.byteLength(postDataString)
                        }
                    },
                    (res) => {
                        let data = '';
                        res.on('data', (chunk) => { data += chunk; });
                        res.on('end', () => {
                            if (res.statusCode === 200) {
                                resolve(JSON.parse(data));
                            } else {
                                reject(new Error(data || `HTTP ${res.statusCode}`));
                            }
                        });
                    }
                );
                req.on('error', (error) => { reject(error); });
                req.write(postDataString);
                req.end();
            });

            if (!result.success) {
                return { success: false, error: result.error || 'Failed to move report parameter' };
            }

            return {
                success: true,
                report_name: report_name,
                owner_object_name: result.owner_object_name,
                param_name: param_name,
                old_position: result.old_position,
                new_position: new_position,
                param_count: result.param_count,
                message: `Parameter "${param_name}" moved from position ${result.old_position} to position ${new_position}`,
                note: 'Report parameter has been reordered. The model has unsaved changes.'
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not move report parameter: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Move a report column to a new position in the reportColumn array
     * @param report_name - Name of the report (case-sensitive exact match)
     * @param column_name - Name of the column to move (case-sensitive exact match)
     * @param new_position - New 0-based index position for the column
     * @returns Result with success status and position details
     */
    async move_report_column(
        report_name: string,
        column_name: string,
        new_position: number
    ): Promise<any> {
        try {
            if (new_position < 0) {
                return {
                    success: false,
                    error: 'new_position must be 0 or greater'
                };
            }

            const http = await import('http');
            const postData = { report_name, column_name, new_index: new_position };
            const postDataString = JSON.stringify(postData);

            const result: any = await new Promise((resolve, reject) => {
                const req = http.request(
                    {
                        hostname: 'localhost',
                        port: 3001,
                        path: '/api/move-report-column',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Length': Buffer.byteLength(postDataString)
                        }
                    },
                    (res) => {
                        let data = '';
                        res.on('data', (chunk) => { data += chunk; });
                        res.on('end', () => {
                            if (res.statusCode === 200) {
                                resolve(JSON.parse(data));
                            } else {
                                reject(new Error(data || `HTTP ${res.statusCode}`));
                            }
                        });
                    }
                );
                req.on('error', (error) => { reject(error); });
                req.write(postDataString);
                req.end();
            });

            if (!result.success) {
                return { success: false, error: result.error || 'Failed to move report column' };
            }

            return {
                success: true,
                report_name: report_name,
                owner_object_name: result.owner_object_name,
                column_name: column_name,
                old_position: result.old_position,
                new_position: new_position,
                column_count: result.column_count,
                message: `Column "${column_name}" moved from position ${result.old_position} to position ${new_position}`,
                note: 'Report column has been reordered. The model has unsaved changes.'
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not move report column: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Move a report button to a new position in the reportButton array
     * @param report_name - Name of the report (case-sensitive exact match)
     * @param button_name - Name of the button to move (case-sensitive exact match)
     * @param new_position - New 0-based index position for the button
     * @returns Result with success status and position details
     */
    async move_report_button(
        report_name: string,
        button_name: string,
        new_position: number
    ): Promise<any> {
        try {
            if (new_position < 0) {
                return {
                    success: false,
                    error: 'new_position must be 0 or greater'
                };
            }

            const http = await import('http');
            const postData = { report_name, button_text: button_name, new_index: new_position };
            const postDataString = JSON.stringify(postData);

            const result: any = await new Promise((resolve, reject) => {
                const req = http.request(
                    {
                        hostname: 'localhost',
                        port: 3001,
                        path: '/api/move-report-button',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Length': Buffer.byteLength(postDataString)
                        }
                    },
                    (res) => {
                        let data = '';
                        res.on('data', (chunk) => { data += chunk; });
                        res.on('end', () => {
                            if (res.statusCode === 200) {
                                resolve(JSON.parse(data));
                            } else {
                                reject(new Error(data || `HTTP ${res.statusCode}`));
                            }
                        });
                    }
                );
                req.on('error', (error) => { reject(error); });
                req.write(postDataString);
                req.end();
            });

            if (!result.success) {
                return { success: false, error: result.error || 'Failed to move report button' };
            }

            return {
                success: true,
                report_name: report_name,
                owner_object_name: result.owner_object_name,
                button_name: button_name,
                old_position: result.old_position,
                new_position: new_position,
                button_count: result.button_count,
                message: `Button "${button_name}" moved from position ${result.old_position} to position ${new_position}`,
                note: 'Report button has been reordered. The model has unsaved changes.'
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not move report button: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Updates a report with its complete schema (merge/patch operation)
     * Tool name: update_full_report (following MCP snake_case convention)
     * @param report_name - Name of the report to update (case-sensitive, exact match required)
     * @param report - Report object with properties to update/add (does not remove existing properties)
     * @returns Result object with success status and updated report
     */
    async update_full_report(
        report_name: string,
        report: any
    ): Promise<{ success: boolean; report?: any; owner_object_name?: string; message?: string; error?: string; note?: string; validationErrors?: string[] }> {
        // Validate required parameters
        const validationErrors: string[] = [];
        
        if (!report_name) {
            validationErrors.push('report_name is required');
        }
        
        if (!report || typeof report !== 'object') {
            validationErrors.push('report is required and must be an object');
        }
        
        if (validationErrors.length > 0) {
            return {
                success: false,
                error: 'Validation failed',
                validationErrors: validationErrors,
                note: 'report_name is required (case-sensitive). report object must be provided with at least one property to update.'
            };
        }
        
        // Get actual schema for validation
        const schemaResult = await this.get_report_schema();
        const schema = schemaResult.schema;
        
        // Use JSON Schema validation with ajv
        if (schema) {
            try {
                const Ajv = require('ajv');
                const ajv = new Ajv({ allErrors: true, strict: false });
                
                const validate = ajv.compile(schema);
                const valid = validate(report);
                
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
        
        // Additional business rule validation
        if (report.reportParam && Array.isArray(report.reportParam)) {
            report.reportParam.forEach((param: any, index: number) => {
                // Validate FK requires fKObjectName
                if (param.isFK === 'true' && !param.fKObjectName) {
                    validationErrors.push(`Parameter ${index} (${param.name || index}): fKObjectName is required when isFK is "true"`);
                }
            });
        }
        
        if (validationErrors.length > 0) {
            return {
                success: false,
                error: 'Validation failed',
                validationErrors: validationErrors,
                note: 'Please check the validation errors and ensure all values match the schema requirements from get_report_schema.'
            };
        }
        
        try {
            // Call bridge API to update full report
            const http = await import('http');
            const postData = {
                report_name,
                report: report
            };

            const postDataString = JSON.stringify(postData);

            const result: any = await new Promise((resolve, reject) => {
                const req = http.request(
                    {
                        hostname: 'localhost',
                        port: 3001,
                        path: '/api/update-full-report',
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
                    error: result.error || 'Failed to update full report'
                };
            }

            return {
                success: true,
                report: result.report,
                owner_object_name: result.owner_object_name,
                message: `Report "${report_name}" updated with provided properties`,
                note: 'Report properties have been updated/added (existing properties not removed). Properties in reportParam, reportColumn, and reportButton arrays are matched by name/buttonText and updated, new items are added. The model has unsaved changes.'
            };

        } catch (error) {
            return {
                success: false,
                error: `Could not update full report: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to update reports. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }
}

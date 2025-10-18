// dataObjectTools.ts
// Tools for managing data objects via MCP
// Created on: October 15, 2025
// This file implements data object tools for the MCP server

/**
 * Implements data object tools for the MCP server
 */
export class DataObjectTools {
    constructor(modelService: any) {
        // ModelService passed but not used - MCP server uses HTTP bridge
    }

    /**
     * Lists summary of all data objects from the AppDNA model
     * Tool name: list_data_object_summary (following MCP snake_case convention)
     * @param parameters Optional search and filter parameters
     * @returns Array of data objects with name, isLookup, and parentObjectName
     */
    public async list_data_object_summary(parameters?: any): Promise<any> {
        const { search_name, is_lookup, parent_object_name } = parameters || {};
        
        // Try to get data objects from extension via HTTP bridge
        try {
            const response = await this.fetchFromBridge('/api/data-objects');
            let filteredObjects = response;
            
            // Apply search_name filter (case-insensitive)
            if (search_name && typeof search_name === 'string') {
                const searchLower = search_name.toLowerCase();
                const searchNoSpaces = search_name.replace(/\s+/g, '').toLowerCase();
                
                filteredObjects = filteredObjects.filter((obj: any) => {
                    const nameLower = (obj.name || '').toLowerCase();
                    const nameNoSpaces = (obj.name || '').replace(/\s+/g, '').toLowerCase();
                    
                    // Search with spaces and without spaces
                    return nameLower.includes(searchLower) || nameNoSpaces.includes(searchNoSpaces);
                });
            }
            
            // Apply is_lookup filter
            if (is_lookup !== undefined && is_lookup !== null) {
                const lookupValue = is_lookup === 'true' || is_lookup === true;
                filteredObjects = filteredObjects.filter((obj: any) => obj.isLookup === lookupValue);
            }
            
            // Apply parent_object_name filter (case-insensitive exact match)
            if (parent_object_name && typeof parent_object_name === 'string') {
                const parentLower = parent_object_name.toLowerCase();
                filteredObjects = filteredObjects.filter((obj: any) => {
                    const objParentLower = (obj.parentObjectName || '').toLowerCase();
                    return objParentLower === parentLower;
                });
            }
            
            return {
                success: true,
                objects: filteredObjects,
                count: filteredObjects.length,
                filters: {
                    search_name: search_name || null,
                    is_lookup: is_lookup || null,
                    parent_object_name: parent_object_name || null
                },
                note: "Data objects loaded from AppDNA model file via MCP bridge"
            };
        } catch (error) {
            // Return empty list if bridge is not available
            return {
                success: false,
                objects: [],
                count: 0,
                note: "Could not load data objects from bridge",
                warning: `Could not connect to extension: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Lists all data objects with full details from the AppDNA model
     * Tool name: list_data_objects (following MCP snake_case convention)
     * @param parameters Optional search and filter parameters
     * @returns Array of complete data objects with all properties including prop array
     */
    public async list_data_objects(parameters?: any): Promise<any> {
        const { search_name, is_lookup, parent_object_name } = parameters || {};
        
        // Try to get full data objects from extension via HTTP bridge
        try {
            const response = await this.fetchFromBridge('/api/data-objects-full');
            let filteredObjects = response;
            
            // Apply search_name filter (case-insensitive)
            if (search_name && typeof search_name === 'string') {
                const searchLower = search_name.toLowerCase();
                const searchNoSpaces = search_name.replace(/\s+/g, '').toLowerCase();
                
                filteredObjects = filteredObjects.filter((obj: any) => {
                    const nameLower = (obj.name || '').toLowerCase();
                    const nameNoSpaces = (obj.name || '').replace(/\s+/g, '').toLowerCase();
                    
                    // Search with spaces and without spaces
                    return nameLower.includes(searchLower) || nameNoSpaces.includes(searchNoSpaces);
                });
            }
            
            // Apply is_lookup filter
            if (is_lookup !== undefined && is_lookup !== null) {
                const lookupValue = is_lookup === 'true' || is_lookup === true;
                filteredObjects = filteredObjects.filter((obj: any) => {
                    const objIsLookup = obj.isLookup === 'true' || obj.isLookup === true;
                    return objIsLookup === lookupValue;
                });
            }
            
            // Apply parent_object_name filter (case-insensitive exact match)
            if (parent_object_name && typeof parent_object_name === 'string') {
                const parentLower = parent_object_name.toLowerCase();
                filteredObjects = filteredObjects.filter((obj: any) => {
                    const objParentLower = (obj.parentObjectName || '').toLowerCase();
                    return objParentLower === parentLower;
                });
            }
            
            return {
                success: true,
                objects: filteredObjects,
                count: filteredObjects.length,
                filters: {
                    search_name: search_name || null,
                    is_lookup: is_lookup || null,
                    parent_object_name: parent_object_name || null
                },
                note: "Full data objects (with prop arrays) loaded from AppDNA model via MCP bridge"
            };
        } catch (error) {
            // Return empty list if bridge is not available
            return {
                success: false,
                objects: [],
                count: 0,
                note: "Could not load data objects from bridge",
                warning: `Could not connect to extension: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Gets the schema definition for data object summary
     * Tool name: get_data_object_summary_schema (following MCP snake_case convention)
     * @returns Schema definition with properties, validation rules, and examples
     */
    public async get_data_object_summary_schema(): Promise<any> {
        return {
            success: true,
            schema: {
                type: 'object',
                description: 'Data object structure in AppDNA model - represents entities and their relationships',
                properties: {
                    name: {
                        type: 'string',
                        required: true,
                        format: 'PascalCase',
                        pattern: '^[A-Z][A-Za-z0-9]*$',
                        description: 'Unique identifier for the data object. Must be in PascalCase format (starts with uppercase letter, no spaces, can contain letters and numbers).',
                        examples: ['Customer', 'Order', 'Product', 'Employee', 'CustomerOrder', 'OrderLineItem']
                    },
                    isLookup: {
                        type: 'boolean',
                        required: true,
                        description: 'Indicates whether this is a lookup/reference data object (true) or a regular entity (false). Lookup objects contain dropdown/selection values.',
                        examples: [true, false]
                    },
                    parentObjectName: {
                        type: 'string',
                        required: true,
                        nullable: true,
                        description: 'Name of the parent data object. Defines hierarchical relationships. Lookup objects must have parent "Pac". Root objects may have null parent.',
                        examples: ['Customer', 'Order', 'Pac', null]
                    },
                    codeDescription: {
                        type: 'string',
                        required: false,
                        description: 'Optional description of the data object for documentation purposes.',
                        examples: ['Customer entity with contact information', 'Order header data', 'Product catalog items']
                    },
                    propCount: {
                        type: 'number',
                        required: true,
                        description: 'Number of properties (columns) in the prop array for this data object. Useful for quickly determining object complexity without loading full details.',
                        examples: [0, 5, 12, 25]
                    }
                },
                validationRules: {
                    name: [
                        'Required field',
                        'Must be unique across all data objects (case-insensitive check)',
                        'Must be in PascalCase format',
                        'Must start with uppercase letter',
                        'Can only contain letters (A-Z, a-z) and numbers (0-9)',
                        'No spaces, hyphens, or special characters allowed',
                        'Common patterns: Entity names (Customer, Order), Composite names (CustomerOrder)'
                    ],
                    isLookup: [
                        'Required field',
                        'Boolean value (true or false)',
                        'true = Lookup object (contains reference/dropdown values)',
                        'false = Regular entity object (contains transactional/master data)',
                        'Lookup objects typically have names ending in common patterns (Status, Type, Category, Role)'
                    ],
                    parentObjectName: [
                        'Required field (can be null for root objects)',
                        'Must match an existing data object name exactly (case-sensitive)',
                        'Defines parent-child hierarchical relationship',
                        'Lookup objects (isLookup=true) must have parentObjectName="Pac"',
                        'Regular objects typically have entity as parent (e.g., OrderLineItem parent is Order)',
                        'Used for organizing model structure and navigation'
                    ],
                    codeDescription: [
                        'Optional field',
                        'Can be any descriptive text',
                        'Used for documentation and code generation hints',
                        'Not displayed in UI, mainly for developers'
                    ],
                    propCount: [
                        'Required field (automatically calculated)',
                        'Non-negative integer (0 or greater)',
                        'Represents the number of items in the prop array',
                        '0 = Object exists but has no properties defined yet',
                        'Higher values indicate more complex objects with many fields/columns',
                        'Useful for understanding object complexity at a glance'
                    ]
                },
                usage: {
                    location: 'Stored in namespace → object array in AppDNA model',
                    access: 'Via namespace[0].object array',
                    modelStructure: 'namespace → object[]',
                    purpose: 'Define entities, their types (lookup vs regular), and hierarchical relationships',
                    hierarchy: 'Objects form a tree structure via parentObjectName relationships'
                },
                tools: {
                    query: [
                        'list_data_object_summary - List/search data objects with filters',
                        'get_data_object_summary_schema - Get this schema definition'
                    ],
                    manipulation: [
                        'create_data_object - Create new data object',
                        'update_data_object - Update existing data object (if implemented)'
                    ],
                    related: [
                        'list_lookup_values - List values within a lookup object',
                        'add_lookup_value - Add value to a lookup object',
                        'list_roles - List values from the special Role lookup object'
                    ]
                },
                commonPatterns: {
                    regularEntities: [
                        {
                            name: 'Customer',
                            isLookup: false,
                            parentObjectName: 'Pac',
                            codeDescription: 'Customer master data',
                            propCount: 12
                        },
                        {
                            name: 'Order',
                            isLookup: false,
                            parentObjectName: 'Customer',
                            codeDescription: 'Customer orders',
                            propCount: 8
                        },
                        {
                            name: 'OrderLineItem',
                            isLookup: false,
                            parentObjectName: 'Order',
                            codeDescription: 'Individual items in an order',
                            propCount: 6
                        }
                    ],
                    lookupObjects: [
                        {
                            name: 'Role',
                            isLookup: true,
                            parentObjectName: 'Pac',
                            codeDescription: 'User roles for access control',
                            propCount: 3
                        },
                        {
                            name: 'Status',
                            isLookup: true,
                            parentObjectName: 'Pac',
                            codeDescription: 'Status values (Active, Inactive, Pending, etc.)',
                            propCount: 2
                        },
                        {
                            name: 'Priority',
                            isLookup: true,
                            parentObjectName: 'Pac',
                            codeDescription: 'Priority levels (High, Medium, Low)',
                            propCount: 2
                        }
                    ]
                },
                notes: [
                    'Data objects form the core structure of the AppDNA model',
                    'Lookup objects (isLookup=true) contain dropdown/reference values and must have parent "Pac"',
                    'Regular objects (isLookup=false) represent entities and can have any valid parent',
                    'Parent-child relationships create a hierarchical tree structure',
                    'propCount shows how many properties exist in the prop array (0 = no properties yet)',
                    'Use list_data_objects or get_data_object to see full property details',
                    'The "Pac" object is typically the root parent for lookup objects',
                    'Object names are used in user stories, page mappings, and code generation',
                    'PascalCase naming enforced for consistency and code generation compatibility'
                ]
            },
            note: 'This schema defines the structure of data objects in the AppDNA model as returned by list_data_object_summary'
        };
    }

    /**
     * Gets complete details of a specific data object including all properties and props array
     * Tool name: get_data_object (following MCP snake_case convention)
     * @param parameters Tool parameters containing name (the data object name to retrieve)
     * @returns Complete data object with all properties, props array, and lookupItem array if applicable
     */
    public async get_data_object(parameters: any): Promise<any> {
        const { name } = parameters;

        // Validate required parameter
        if (!name) {
            return {
                success: false,
                error: 'Parameter "name" is required',
                validationErrors: ['name is required']
            };
        }

        // Get data object from extension via HTTP bridge
        try {
            const endpoint = `/api/data-objects/${encodeURIComponent(name)}`;
            const dataObject = await this.fetchFromBridge(endpoint);

            return {
                success: true,
                dataObject: dataObject,
                note: `Data object "${name}" loaded from AppDNA model via MCP bridge`
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to load data object: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: `Data object "${name}" not found or bridge connection failed`
            };
        }
    }

    /**
     * Gets the schema definition for full data object structure
     * Tool name: get_data_object_schema (following MCP snake_case convention)
     * @returns Schema definition with properties, validation rules, and examples for full data objects
     */
    public async get_data_object_schema(): Promise<any> {
        return {
            success: true,
            schema: {
                type: 'object',
                description: 'Complete data object structure in AppDNA model as returned by get_data_object and list_data_objects - includes all properties and prop array',
                properties: {
                    name: {
                        type: 'string',
                        required: true,
                        format: 'PascalCase',
                        pattern: '^[A-Z][A-Za-z0-9]*$',
                        description: 'Unique identifier for the data object. Must be in PascalCase format.',
                        examples: ['Customer', 'Order', 'Product', 'OrderLineItem']
                    },
                    parentObjectName: {
                        type: 'string',
                        required: true,
                        description: 'Name of the parent data object. Defines hierarchical relationships.',
                        examples: ['Customer', 'Order', 'Pac', '']
                    },
                    isLookup: {
                        type: 'string',
                        required: true,
                        enum: ['true', 'false'],
                        description: 'String value indicating whether this is a lookup object. "true" for lookup objects, "false" for regular entities.',
                        examples: ['true', 'false']
                    },
                    codeDescription: {
                        type: 'string',
                        required: false,
                        description: 'Optional description of the data object for documentation purposes.',
                        examples: ['Customer entity with contact information', 'Order header data']
                    },
                    prop: {
                        type: 'array',
                        required: false,
                        description: 'Array of property definitions for this data object. Only included if the object has properties. Each property represents a field/column.',
                        items: {
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string',
                                    required: true,
                                    format: 'PascalCase',
                                    description: 'Property name in PascalCase format',
                                    examples: ['CustomerID', 'FirstName', 'EmailAddress', 'OrderDate', 'IsActive']
                                },
                                codeDescription: {
                                    type: 'string',
                                    required: false,
                                    description: 'Code description for the property',
                                    examples: ['Campaign Data Row Event Type Is Active']
                                },
                                defaultValue: {
                                    type: 'string',
                                    required: false,
                                    description: 'Default value for the property',
                                    examples: ['0', 'false', '']
                                },
                                fkObjectName: {
                                    type: 'string',
                                    required: false,
                                    description: 'Foreign key object name - the data object this FK references (case-sensitive)',
                                    examples: ['Customer', 'Order', 'Status', 'Role']
                                },
                                fkObjectPropertyName: {
                                    type: 'string',
                                    required: false,
                                    description: 'Foreign key object property name - the property name in the referenced object',
                                    examples: ['CustomerID', 'OrderID', 'StatusID']
                                },
                                forceDBColumnIndex: {
                                    type: 'string',
                                    required: false,
                                    enum: ['true', 'false'],
                                    description: 'Forces database column index creation. Must be string "true" or "false".',
                                    examples: ['true', 'false']
                                },
                                isEncrypted: {
                                    type: 'string',
                                    required: false,
                                    enum: ['true', 'false'],
                                    description: 'Indicates if property value should be encrypted. Must be string "true" or "false".',
                                    examples: ['true', 'false']
                                },
                                isFK: {
                                    type: 'string',
                                    required: false,
                                    enum: ['true', 'false'],
                                    description: 'Defines if the property is a foreign key. Must be string "true" or "false". If true, provide fkObjectName.',
                                    examples: ['true', 'false']
                                },
                                isFKConstraintSuppressed: {
                                    type: 'string',
                                    required: false,
                                    enum: ['true', 'false'],
                                    description: 'Suppresses foreign key constraint in database. Must be string "true" or "false". Some FK properties may not always have a value set.',
                                    examples: ['true', 'false']
                                },
                                isFKLookup: {
                                    type: 'string',
                                    required: false,
                                    enum: ['true', 'false'],
                                    description: 'Defines if property is a foreign key to a lookup object. Must be string "true" or "false".',
                                    examples: ['true', 'false']
                                },
                                isNotPublishedToSubscriptions: {
                                    type: 'string',
                                    required: false,
                                    enum: ['', 'true', 'false'],
                                    description: 'Excludes property from subscriptions. Can be empty string, "true", or "false". If true, the prop will not be sent to prop subscribers.',
                                    examples: ['', 'true', 'false']
                                },
                                isQueryByAvailable: {
                                    type: 'string',
                                    required: false,
                                    enum: ['true', 'false'],
                                    description: 'Enables query filtering on this property. Must be string "true" or "false". If true, the DB column will be indexed and a query function will be created.',
                                    examples: ['true', 'false']
                                },
                                labelText: {
                                    type: 'string',
                                    required: false,
                                    description: 'Human-readable label text for UI display',
                                    examples: ['Is Active', 'First Name', 'Email Address', 'Order Date']
                                },
                                sqlServerDBDataType: {
                                    type: 'string',
                                    required: false,
                                    enum: ['nvarchar', 'bit', 'datetime', 'int', 'uniqueidentifier', 'money', 'bigint', 'float', 'decimal', 'date', 'varchar', 'text'],
                                    description: 'SQL Server data type for this property. Must be one of the allowed types.',
                                    examples: ['int', 'nvarchar', 'datetime', 'bit', 'decimal', 'uniqueidentifier']
                                },
                                sqlServerDBDataTypeSize: {
                                    type: 'string',
                                    required: false,
                                    description: 'SQL Server data type size (for varchar, nvarchar, etc.)',
                                    examples: ['50', '100', '255', 'MAX']
                                }
                            }
                        },
                        examples: [
                            [
                                {
                                    name: 'CustomerID',
                                    sqlServerDBDataType: 'int',
                                    isFK: 'true',
                                    fkObjectName: 'Customer',
                                    isNotPublishedToSubscriptions: 'true',
                                    isFKConstraintSuppressed: 'false',
                                    labelText: 'Customer ID'
                                },
                                {
                                    name: 'FirstName',
                                    sqlServerDBDataType: 'nvarchar',
                                    sqlServerDBDataTypeSize: '100',
                                    labelText: 'First Name',
                                    isQueryByAvailable: 'true'
                                },
                                {
                                    name: 'IsActive',
                                    sqlServerDBDataType: 'bit',
                                    labelText: 'Is Active',
                                    codeDescription: 'Indicates if record is active'
                                }
                            ]
                        ]
                    }
                },
                excludedProperties: {
                    propSubscription: 'Internal array - always excluded from response',
                    modelPkg: 'Internal array - always excluded from response',
                    lookupItem: 'Lookup values array - excluded from get_data_object and list_data_objects responses (use list_lookup_values tool instead)'
                },
                validationRules: {
                    name: [
                        'Required field',
                        'Must be unique across all data objects',
                        'Must be in PascalCase format',
                        'Must start with uppercase letter',
                        'Can only contain letters and numbers',
                        'No spaces or special characters'
                    ],
                    parentObjectName: [
                        'Required field',
                        'Must match an existing data object name',
                        'Lookup objects (isLookup="true") must have parentObjectName="Pac"',
                        'Empty string allowed for root objects'
                    ],
                    isLookup: [
                        'Required field',
                        'Must be string "true" or "false" (not boolean)',
                        '"true" = Lookup object (contains reference values)',
                        '"false" = Regular entity object'
                    ],
                    prop: [
                        'Optional array - only included if object has properties',
                        'Each property must have unique name within the object',
                        'Property names must be in PascalCase format',
                        'Foreign key properties typically end with "ID" suffix',
                        'All boolean-like fields use string "true"/"false" not boolean',
                        'sqlServerDBDataType must be one of: nvarchar, bit, datetime, int, uniqueidentifier, money, bigint, float, decimal, date, varchar, text',
                        'sqlServerDBDataTypeSize required for nvarchar, varchar, decimal types',
                        'isFK must be "true" or "false" - if "true" then fkObjectName is required',
                        'isFKLookup must be "true" or "false" - indicates FK to a lookup object',
                        'isFKConstraintSuppressed must be "true" or "false" - suppresses DB constraint',
                        'isNotPublishedToSubscriptions can be "", "true", or "false" - note empty string is valid',
                        'isEncrypted must be "true" or "false" - for sensitive data',
                        'isQueryByAvailable must be "true" or "false" - enables indexing and query functions',
                        'forceDBColumnIndex must be "true" or "false" - forces index creation',
                        'labelText provides human-readable UI labels',
                        'codeDescription provides code generation hints',
                        'defaultValue sets default value for the property',
                        'fkObjectName must match existing data object name exactly (case-sensitive)',
                        'fkObjectPropertyName specifies the FK property in the referenced object'
                    ]
                },
                usage: {
                    returnedBy: [
                        'get_data_object - Returns single complete object by name',
                        'list_data_objects - Returns array of complete objects with optional filters'
                    ],
                    notReturnedBy: [
                        'list_data_object_summary - Returns only basic properties (name, isLookup, parentObjectName, codeDescription) without prop array'
                    ],
                    relatedTools: [
                        'get_data_object_summary_schema - Schema for summary structure (no prop array)',
                        'create_data_object - Create new data object',
                        'list_lookup_values - List lookup values (excluded from this structure)'
                    ]
                },
                commonPatterns: {
                    regularEntityWithParentFK: {
                        name: 'Order',
                        parentObjectName: 'Customer',
                        isLookup: 'false',
                        codeDescription: 'Customer orders',
                        prop: [
                            {
                                name: 'CustomerID',
                                sqlServerDBDataType: 'int',
                                isFK: 'true',
                                fkObjectName: 'Customer',
                                isNotPublishedToSubscriptions: 'true',
                                isFKConstraintSuppressed: 'false',
                                labelText: 'Customer ID'
                            },
                            {
                                name: 'OrderDate',
                                sqlServerDBDataType: 'datetime',
                                labelText: 'Order Date',
                                isQueryByAvailable: 'true'
                            },
                            {
                                name: 'TotalAmount',
                                sqlServerDBDataType: 'decimal',
                                sqlServerDBDataTypeSize: '18,2',
                                labelText: 'Total Amount'
                            },
                            {
                                name: 'IsActive',
                                sqlServerDBDataType: 'bit',
                                labelText: 'Is Active',
                                codeDescription: 'Order is active'
                            }
                        ]
                    },
                    lookupObject: {
                        name: 'Status',
                        parentObjectName: 'Pac',
                        isLookup: 'true',
                        codeDescription: 'Status lookup values',
                        prop: [
                            {
                                name: 'PacID',
                                sqlServerDBDataType: 'int',
                                isFK: 'true',
                                fkObjectName: 'Pac',
                                isFKLookup: 'true',
                                isNotPublishedToSubscriptions: 'true',
                                isFKConstraintSuppressed: 'false',
                                labelText: 'Pac ID'
                            }
                        ]
                    },
                    propertyWithFKLookup: {
                        name: 'Order',
                        parentObjectName: 'Customer',
                        isLookup: 'false',
                        codeDescription: 'Order with status lookup',
                        prop: [
                            {
                                name: 'StatusID',
                                sqlServerDBDataType: 'int',
                                isFK: 'true',
                                isFKLookup: 'true',
                                fkObjectName: 'Status',
                                labelText: 'Status',
                                isQueryByAvailable: 'true'
                            }
                        ]
                    },
                    encryptedProperty: {
                        name: 'User',
                        parentObjectName: 'Pac',
                        isLookup: 'false',
                        prop: [
                            {
                                name: 'Password',
                                sqlServerDBDataType: 'nvarchar',
                                sqlServerDBDataTypeSize: '255',
                                isEncrypted: 'true',
                                labelText: 'Password'
                            }
                        ]
                    },
                    objectWithoutProps: {
                        name: 'NewObject',
                        parentObjectName: 'Pac',
                        isLookup: 'false',
                        codeDescription: 'Newly created object without properties yet'
                    }
                },
                notes: [
                    'This schema describes the FULL data object structure with prop array',
                    'The prop array is only included if the object has properties (length > 0)',
                    'Arrays propSubscription, modelPkg, and lookupItem are always excluded',
                    'For lookup objects, use list_lookup_values tool to get lookup items',
                    'Property values use string "true"/"false" not boolean true/false',
                    'All property names must be in PascalCase format',
                    'Foreign key properties typically reference parent object (e.g., CustomerID in Order object)',
                    'sqlServerDBDataType is restricted to specific enum values - see schema for full list',
                    'All boolean flags (isFK, isFKLookup, isEncrypted, etc.) must be string "true" or "false"',
                    'isNotPublishedToSubscriptions is special - it can be "", "true", or "false"',
                    'labelText provides human-readable labels for UI display',
                    'codeDescription provides hints for code generation',
                    'fkObjectName must be set when isFK="true" to indicate the referenced object (case-sensitive)',
                    'fkObjectPropertyName specifies which property in the FK object is referenced',
                    'isFKLookup="true" when the FK references a lookup object (isLookup="true")',
                    'isQueryByAvailable="true" allows filtering/searching and creates DB index',
                    'isEncrypted="true" for sensitive fields like passwords, SSN, credit cards',
                    'sqlServerDBDataTypeSize required for nvarchar, varchar, and decimal types',
                    'forceDBColumnIndex="true" forces database index creation for performance',
                    'isFKConstraintSuppressed="true" prevents foreign key constraint creation in database',
                    'defaultValue can be used to set a default value for the property'
                ]
            },
            note: 'This schema defines the complete structure of data objects as returned by get_data_object and list_data_objects (includes prop array)'
        };
    }

    /**
     * Creates a new data object in the AppDNA model
     * Tool name: create_data_object (following MCP snake_case convention)
     * @param parameters Tool parameters containing name, parentObjectName, isLookup, and codeDescription
     * @returns Result of the data object creation
     */
    public async create_data_object(parameters: any): Promise<any> {
        const { name, parentObjectName, isLookup, codeDescription } = parameters;

        // Validate required parameters
        if (!name) {
            return {
                success: false,
                error: 'Parameter "name" is required',
                validationErrors: ['name is required']
            };
        }

        if (!parentObjectName) {
            return {
                success: false,
                error: 'Parameter "parentObjectName" is required',
                validationErrors: ['parentObjectName is required']
            };
        }

        // Validate name is PascalCase
        if (!this.isPascalCase(name)) {
            return {
                success: false,
                error: `Invalid name format. Name must be in PascalCase (e.g., "CustomerOrder", "ProductCategory"). Received: "${name}"`,
                validationErrors: ['name must be in PascalCase format (start with uppercase letter, no spaces)']
            };
        }

        // Default isLookup to 'false' if not provided
        const lookupValue = isLookup || 'false';

        // Validate isLookup value
        if (lookupValue !== 'true' && lookupValue !== 'false') {
            return {
                success: false,
                error: `Invalid isLookup value. Must be "true" or "false". Received: "${lookupValue}"`,
                validationErrors: ['isLookup must be "true" or "false"']
            };
        }

        // Special validation: Lookup objects must have parent 'Pac'
        if (lookupValue === 'true' && parentObjectName !== 'Pac') {
            return {
                success: false,
                error: `Lookup data objects (isLookup="true") must have parentObjectName="Pac" (case-sensitive). Received: "${parentObjectName}"`,
                validationErrors: ['Lookup objects must have parent "Pac"']
            };
        }

        // Validate parentObjectName IS an existing data object (exact case-sensitive match)
        try {
            const existingObjects = await this.fetchFromBridge('/api/data-objects');
            
            // Check if parentObjectName exactly matches an existing object name (case-sensitive)
            const parentExists = existingObjects.some((obj: any) => 
                obj.name === parentObjectName
            );

            if (!parentExists) {
                return {
                    success: false,
                    error: `parentObjectName must be an exact match (case-sensitive) of an existing data object. "${parentObjectName}" was not found.`,
                    validationErrors: [`parentObjectName "${parentObjectName}" does not match any existing data object (case-sensitive)`],
                    note: `Available objects: ${existingObjects.map((o: any) => o.name).join(', ')}`
                };
            }

            // Check if object with this name already exists
            const nameExists = existingObjects.some((obj: any) => 
                (obj.name || '').toLowerCase() === name.toLowerCase()
            );

            if (nameExists) {
                return {
                    success: false,
                    error: `A data object with name "${name}" already exists`,
                    validationErrors: [`Object name "${name}" already exists`]
                };
            }

        } catch (error) {
            return {
                success: false,
                error: `Could not validate against existing objects: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required for validation'
            };
        }

        // Create the object via HTTP bridge
        try {
            const newObject = await this.postToBridge('/api/data-objects', {
                name,
                parentObjectName,
                isLookup: lookupValue,
                codeDescription: codeDescription || undefined
            });

            return {
                success: true,
                object: newObject.object,
                message: newObject.message || 'Data object created successfully',
                note: 'Object added to AppDNA model via MCP bridge (unsaved changes)'
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to create data object: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Could not connect to extension or validation failed'
            };
        }
    }

    /**
     * Updates an existing data object in the AppDNA model
     * Tool name: update_data_object (following MCP snake_case convention)
     * @param parameters Tool parameters containing name and codeDescription to update
     * @returns Result of the data object update
     */
    public async update_data_object(parameters: any): Promise<any> {
        const { name, codeDescription } = parameters;

        // Validate required parameter
        if (!name) {
            return {
                success: false,
                error: 'Parameter "name" is required',
                validationErrors: ['name is required']
            };
        }

        // Validate that codeDescription is provided
        if (codeDescription === undefined) {
            return {
                success: false,
                error: 'Parameter "codeDescription" is required',
                validationErrors: ['codeDescription is required']
            };
        }

        // Check if data object exists
        try {
            const existingObjects = await this.fetchFromBridge('/api/data-objects');
            
            // Case-sensitive check for exact match
            const objectExists = existingObjects.some((obj: any) => 
                obj.name === name
            );

            if (!objectExists) {
                return {
                    success: false,
                    error: `Data object "${name}" not found. Object name must match exactly (case-sensitive).`,
                    validationErrors: [`Data object "${name}" does not exist`],
                    note: `Available objects: ${existingObjects.map((o: any) => o.name).join(', ')}`
                };
            }

        } catch (error) {
            return {
                success: false,
                error: `Could not validate data object existence: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required for validation'
            };
        }

        // Update the data object via HTTP bridge
        try {
            const result = await this.postToBridge('/api/data-objects/update', {
                name,
                codeDescription
            });

            return {
                success: true,
                object: result.object,
                message: result.message || 'Data object updated successfully',
                note: 'Data object updated in AppDNA model via MCP bridge (unsaved changes)'
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to update data object: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to update data objects'
            };
        }
    }

    /**
     * Adds properties to an existing data object in the AppDNA model
     * Tool name: add_data_object_props (following MCP snake_case convention)
     * @param parameters Tool parameters containing objectName and props array
     * @returns Result of the property addition
     */
    public async add_data_object_props(parameters: any): Promise<any> {
        const { objectName, props } = parameters;

        // Validate required parameters
        if (!objectName) {
            return {
                success: false,
                error: 'Parameter "objectName" is required',
                validationErrors: ['objectName is required']
            };
        }

        if (!props || !Array.isArray(props) || props.length === 0) {
            return {
                success: false,
                error: 'Parameter "props" is required and must be a non-empty array',
                validationErrors: ['props must be a non-empty array']
            };
        }

        // Validate each property structure
        const validationErrors: string[] = [];
        const allowedDataTypes = ['nvarchar', 'bit', 'datetime', 'int', 'uniqueidentifier', 'money', 'bigint', 'float', 'decimal', 'date', 'varchar', 'text'];
        const allowedBooleanValues = ['true', 'false'];
        const allowedNotPublishedValues = ['', 'true', 'false'];

        props.forEach((prop: any, index: number) => {
            // Validate name (required, PascalCase)
            if (!prop.name) {
                validationErrors.push(`Property ${index}: name is required`);
            } else if (!this.isPascalCase(prop.name)) {
                validationErrors.push(`Property ${index}: name "${prop.name}" must be in PascalCase format`);
            }

            // Validate sqlServerDBDataType if provided
            if (prop.sqlServerDBDataType && !allowedDataTypes.includes(prop.sqlServerDBDataType)) {
                validationErrors.push(`Property ${index} (${prop.name}): sqlServerDBDataType must be one of: ${allowedDataTypes.join(', ')}`);
            }

            // Validate boolean-like fields
            const booleanFields = ['isFK', 'isFKLookup', 'isEncrypted', 'isQueryByAvailable', 'forceDBColumnIndex', 'isFKConstraintSuppressed'];
            booleanFields.forEach(field => {
                if (prop[field] !== undefined && !allowedBooleanValues.includes(prop[field])) {
                    validationErrors.push(`Property ${index} (${prop.name}): ${field} must be "true" or "false"`);
                }
            });

            // Validate isNotPublishedToSubscriptions (special case - allows empty string)
            if (prop.isNotPublishedToSubscriptions !== undefined && !allowedNotPublishedValues.includes(prop.isNotPublishedToSubscriptions)) {
                validationErrors.push(`Property ${index} (${prop.name}): isNotPublishedToSubscriptions must be "", "true", or "false"`);
            }

            // Validate FK-related fields
            if (prop.isFK === 'true' && !prop.fkObjectName) {
                validationErrors.push(`Property ${index} (${prop.name}): fkObjectName is required when isFK is "true"`);
            }
        });

        if (validationErrors.length > 0) {
            return {
                success: false,
                error: 'Property validation failed',
                validationErrors
            };
        }

        // Check if data object exists
        try {
            const existingObjects = await this.fetchFromBridge('/api/data-objects');
            
            // Case-sensitive check for exact match
            const objectExists = existingObjects.some((obj: any) => 
                obj.name === objectName
            );

            if (!objectExists) {
                return {
                    success: false,
                    error: `Data object "${objectName}" not found. Object name must match exactly (case-sensitive).`,
                    validationErrors: [`Data object "${objectName}" does not exist`],
                    note: `Available objects: ${existingObjects.map((o: any) => o.name).join(', ')}`
                };
            }

        } catch (error) {
            return {
                success: false,
                error: `Could not validate data object existence: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required for validation'
            };
        }

        // Add properties via HTTP bridge
        try {
            const result = await this.postToBridge('/api/data-objects/add-props', {
                objectName,
                props
            });

            return {
                success: true,
                object: result.object,
                addedCount: result.addedCount,
                message: result.message || 'Properties added successfully',
                note: 'Properties added to data object via MCP bridge (unsaved changes)'
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to add properties: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to add properties'
            };
        }
    }

    /**
     * Updates an existing property in a data object
     * Tool name: update_data_object_prop (following MCP snake_case convention)
     * @param parameters Tool parameters containing objectName, propName, and fields to update
     * @returns Result of the property update
     */
    public async update_data_object_prop(parameters: any): Promise<any> {
        const { objectName, propName, ...updateFields } = parameters;

        // Validate required parameters
        if (!objectName) {
            return {
                success: false,
                error: 'Parameter "objectName" is required',
                validationErrors: ['objectName is required']
            };
        }

        if (!propName) {
            return {
                success: false,
                error: 'Parameter "propName" is required',
                validationErrors: ['propName is required']
            };
        }

        // Validate that at least one field to update is provided
        const validUpdateFields = [
            'codeDescription', 'defaultValue', 'fkObjectName', 'fkObjectPropertyName',
            'forceDBColumnIndex', 'isEncrypted', 'isFK', 'isFKConstraintSuppressed',
            'isFKLookup', 'isNotPublishedToSubscriptions',
            'isQueryByAvailable', 'labelText', 'sqlServerDBDataType', 'sqlServerDBDataTypeSize'
        ];

        const fieldsToUpdate = Object.keys(updateFields).filter(key => validUpdateFields.includes(key));

        if (fieldsToUpdate.length === 0) {
            return {
                success: false,
                error: 'At least one field to update must be provided',
                validationErrors: [`No valid update fields provided. Valid fields: ${validUpdateFields.join(', ')}`]
            };
        }

        // Validate field values
        const validationErrors: string[] = [];
        const allowedDataTypes = ['nvarchar', 'bit', 'datetime', 'int', 'uniqueidentifier', 'money', 'bigint', 'float', 'decimal', 'date', 'varchar', 'text'];
        const allowedBooleanValues = ['true', 'false'];
        const allowedNotPublishedValues = ['', 'true', 'false'];

        if (updateFields.sqlServerDBDataType !== undefined && !allowedDataTypes.includes(updateFields.sqlServerDBDataType)) {
            validationErrors.push(`sqlServerDBDataType must be one of: ${allowedDataTypes.join(', ')}`);
        }

        const booleanFields = ['isFK', 'isFKLookup', 'isEncrypted', 'isQueryByAvailable', 'forceDBColumnIndex', 'isFKConstraintSuppressed'];
        booleanFields.forEach(field => {
            if (updateFields[field] !== undefined && !allowedBooleanValues.includes(updateFields[field])) {
                validationErrors.push(`${field} must be "true" or "false"`);
            }
        });

        if (updateFields.isNotPublishedToSubscriptions !== undefined && !allowedNotPublishedValues.includes(updateFields.isNotPublishedToSubscriptions)) {
            validationErrors.push('isNotPublishedToSubscriptions must be "", "true", or "false"');
        }

        if (updateFields.isFK === 'true' && updateFields.fkObjectName === undefined) {
            // Check if fkObjectName will be set (either in update or already exists)
            // This will be validated on the server side
        }

        if (validationErrors.length > 0) {
            return {
                success: false,
                error: 'Property validation failed',
                validationErrors
            };
        }

        // Check if data object exists
        try {
            const existingObjects = await this.fetchFromBridge('/api/data-objects');
            
            const objectExists = existingObjects.some((obj: any) => 
                obj.name === objectName
            );

            if (!objectExists) {
                return {
                    success: false,
                    error: `Data object "${objectName}" not found. Object name must match exactly (case-sensitive).`,
                    validationErrors: [`Data object "${objectName}" does not exist`],
                    note: `Available objects: ${existingObjects.map((o: any) => o.name).join(', ')}`
                };
            }

        } catch (error) {
            return {
                success: false,
                error: `Could not validate data object existence: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required for validation'
            };
        }

        // Update property via HTTP bridge
        try {
            const result = await this.postToBridge('/api/data-objects/update-prop', {
                objectName,
                propName,
                updateFields: fieldsToUpdate.reduce((acc, key) => {
                    acc[key] = updateFields[key];
                    return acc;
                }, {} as any)
            });

            return {
                success: true,
                property: result.property,
                message: result.message || 'Property updated successfully',
                note: 'Property updated in data object via MCP bridge (unsaved changes)'
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to update property: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to update properties'
            };
        }
    }

    /**
     * Lists all roles from the Role data object
     * Tool name: list_roles (following MCP snake_case convention)
     * @returns Array of role objects with name, displayName, description, isActive
     */
    public async list_roles(): Promise<any> {
        // Try to get roles from extension via HTTP bridge
        try {
            const response = await this.fetchFromBridge('/api/roles');
            return {
                success: true,
                roles: response,
                count: response.length,
                note: "Roles loaded from Role data object via MCP bridge"
            };
        } catch (error) {
            // Return empty list if bridge is not available
            return {
                success: false,
                roles: [],
                count: 0,
                note: "Could not load roles from bridge",
                warning: `Could not connect to extension: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Gets the schema definition for roles (Role lookup object items)
     * Tool name: get_role_schema (following MCP snake_case convention)
     * @returns Schema definition with properties, validation rules, and examples
     */
    public async get_role_schema(): Promise<any> {
        return {
            success: true,
            schema: {
                type: 'object',
                description: 'Role structure in AppDNA model - stored in the Role lookup data object',
                objectName: 'Role',
                isLookupObject: true,
                properties: {
                    name: {
                        type: 'string',
                        required: true,
                        format: 'PascalCase',
                        pattern: '^[A-Z][A-Za-z0-9]*$',
                        description: 'Unique identifier for the role. Must be in PascalCase format (starts with uppercase letter, no spaces, can contain letters and numbers).',
                        examples: ['Administrator', 'Manager', 'DataEntryClerk', 'Supervisor', 'Guest']
                    },
                    displayName: {
                        type: 'string',
                        required: false,
                        description: 'Human-readable display name for the role. Auto-generated from name if not provided (e.g., "DataEntryClerk" becomes "Data Entry Clerk").',
                        examples: ['Administrator', 'Manager', 'Data Entry Clerk', 'Supervisor', 'Guest']
                    },
                    description: {
                        type: 'string',
                        required: false,
                        description: 'Detailed description of the role and its responsibilities. Auto-generated from name if not provided.',
                        examples: ['System administrator with full access rights', 'Manages team and approves requests', 'Responsible for data entry tasks', 'Supervises operations']
                    },
                    isActive: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        default: 'true',
                        description: 'Indicates whether the role is active and available for assignment. Must be the string "true" or "false" (not boolean). Defaults to "true" if not provided.',
                        examples: ['true', 'false']
                    }
                },
                validationRules: {
                    name: [
                        'Required field',
                        'Must be unique within the Role object (case-insensitive check)',
                        'Must be in PascalCase format',
                        'Must start with uppercase letter',
                        'Can only contain letters (A-Z, a-z) and numbers (0-9)',
                        'No spaces, hyphens, or special characters allowed'
                    ],
                    displayName: [
                        'Optional field',
                        'Auto-generated from name if not provided',
                        'Can contain spaces and special characters',
                        'Used for UI display and user-facing text'
                    ],
                    description: [
                        'Optional field',
                        'Auto-generated from name if not provided',
                        'Can be any descriptive text',
                        'Should describe role responsibilities and permissions'
                    ],
                    isActive: [
                        'Optional field',
                        'Must be string "true" or "false" (not boolean)',
                        'Defaults to "true" if not provided',
                        'Use "false" for soft delete (hide role without removing)',
                        'Inactive roles typically not shown in role selection dropdowns'
                    ]
                },
                usage: {
                    location: 'Stored in the "Role" lookup data object',
                    access: 'Via Role object\'s lookupItem array property',
                    modelStructure: 'namespace → object[name="Role"] → lookupItem[]',
                    purpose: 'Define user roles and permissions for the application',
                    tools: [
                        'list_roles - List all roles from the Role object',
                        'add_role - Create new role',
                        'update_role - Update existing role properties',
                        'get_role_schema - Get this schema definition'
                    ],
                    genericAlternatives: [
                        'list_lookup_values - Can list roles using lookupObjectName="Role"',
                        'add_lookup_value - Can add roles using lookupObjectName="Role"',
                        'update_lookup_value - Can update roles using lookupObjectName="Role"'
                    ]
                },
                commonRoles: [
                    {
                        name: 'Administrator',
                        displayName: 'Administrator',
                        description: 'System administrator with full access to all features',
                        isActive: 'true'
                    },
                    {
                        name: 'Manager',
                        displayName: 'Manager',
                        description: 'Manages team members and approves requests',
                        isActive: 'true'
                    },
                    {
                        name: 'User',
                        displayName: 'User',
                        description: 'Standard user with basic access rights',
                        isActive: 'true'
                    },
                    {
                        name: 'Guest',
                        displayName: 'Guest',
                        description: 'Limited access guest user',
                        isActive: 'true'
                    },
                    {
                        name: 'Deprecated',
                        displayName: 'Deprecated',
                        description: 'No longer used',
                        isActive: 'false'
                    }
                ],
                notes: [
                    'Roles are stored in a special lookup data object named "Role"',
                    'The Role object must have isLookup="true"',
                    'Role-specific tools (add_role, update_role, list_roles) provide convenience',
                    'Generic lookup value tools also work with roles',
                    'Role names are used in user stories and access control',
                    'Common pattern: Prefix with responsibility (e.g., DataEntryClerk, ReportViewer)'
                ]
            },
            note: 'This schema defines the structure of roles in the AppDNA model Role lookup object'
        };
    }

    /**
     * Adds a new role to the Role data object
     * Tool name: add_role (following MCP snake_case convention)
     * @param parameters Tool parameters containing name, displayName, description, isActive
     * @returns Result of the role addition
     */
    public async add_role(parameters: any): Promise<any> {
        const { name, displayName, description, isActive } = parameters;

        // Validate required parameter
        if (!name) {
            return {
                success: false,
                error: 'Parameter "name" is required',
                validationErrors: ['name is required']
            };
        }

        // Validate name is PascalCase
        if (!this.isPascalCase(name)) {
            return {
                success: false,
                error: `Invalid name format. Name must be in PascalCase (e.g., "Administrator", "DataEntryClerk"). Received: "${name}"`,
                validationErrors: ['name must be in PascalCase format (start with uppercase letter, no spaces)']
            };
        }

        // Default isActive to 'true' if not provided
        const activeValue = isActive || 'true';

        // Validate isActive value
        if (activeValue !== 'true' && activeValue !== 'false') {
            return {
                success: false,
                error: `Invalid isActive value. Must be "true" or "false". Received: "${activeValue}"`,
                validationErrors: ['isActive must be "true" or "false"']
            };
        }

        // Check if role already exists
        try {
            const existingRoles = await this.fetchFromBridge('/api/roles');
            
            // Case-insensitive check for duplicates
            const roleExists = existingRoles.some((role: any) => 
                role.name.toLowerCase() === name.toLowerCase()
            );

            if (roleExists) {
                return {
                    success: false,
                    error: `A role with name "${name}" already exists`,
                    validationErrors: [`Role "${name}" already exists`]
                };
            }

        } catch (error) {
            return {
                success: false,
                error: `Could not validate against existing roles: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required for validation'
            };
        }

        // Add the role via HTTP bridge
        try {
            const result = await this.postToBridge('/api/roles', { 
                name,
                displayName: displayName || undefined,
                description: description || undefined,
                isActive: activeValue
            });

            return {
                success: true,
                role: result.role,
                message: result.message || 'Role added successfully',
                note: 'Role added to Role data object via MCP bridge (unsaved changes)'
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to add role: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to add roles'
            };
        }
    }

    /**
     * Updates an existing role in the Role data object
     * Tool name: update_role (following MCP snake_case convention)
     * @param parameters Tool parameters containing name and fields to update
     * @returns Result of the role update
     */
    public async update_role(parameters: any): Promise<any> {
        const { name, displayName, description, isActive } = parameters;

        // Validate required parameter
        if (!name) {
            return {
                success: false,
                error: 'Parameter "name" is required',
                validationErrors: ['name is required']
            };
        }

        // Validate that at least one field to update is provided
        if (displayName === undefined && description === undefined && isActive === undefined) {
            return {
                success: false,
                error: 'At least one field to update must be provided (displayName, description, or isActive)',
                validationErrors: ['No fields to update provided']
            };
        }

        // Validate isActive if provided
        if (isActive !== undefined && isActive !== 'true' && isActive !== 'false') {
            return {
                success: false,
                error: `Invalid isActive value. Must be "true" or "false". Received: "${isActive}"`,
                validationErrors: ['isActive must be "true" or "false"']
            };
        }

        // Check if role exists
        try {
            const existingRoles = await this.fetchFromBridge('/api/roles');
            
            // Case-sensitive check for exact match
            const roleExists = existingRoles.some((role: any) => 
                role.name === name
            );

            if (!roleExists) {
                return {
                    success: false,
                    error: `Role "${name}" not found. Role name must match exactly (case-sensitive).`,
                    validationErrors: [`Role "${name}" does not exist`],
                    note: `Available roles: ${existingRoles.map((r: any) => r.name).join(', ')}`
                };
            }

        } catch (error) {
            return {
                success: false,
                error: `Could not validate role existence: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required for validation'
            };
        }

        // Update the role via HTTP bridge
        try {
            const updateData: any = { name };
            if (displayName !== undefined) { updateData.displayName = displayName; }
            if (description !== undefined) { updateData.description = description; }
            if (isActive !== undefined) { updateData.isActive = isActive; }

            const result = await this.postToBridge('/api/roles/update', updateData);

            return {
                success: true,
                role: result.role,
                message: result.message || 'Role updated successfully',
                note: 'Role updated in Role data object via MCP bridge (unsaved changes)'
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to update role: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to update roles'
            };
        }
    }

    /**
     * Adds a new lookup value to any lookup data object
     * Tool name: add_lookup_value (following MCP snake_case convention)
     * @param parameters Tool parameters containing lookupObjectName, name, and optional fields
     * @returns Result of the lookup value addition
     */
    public async add_lookup_value(parameters: any): Promise<any> {
        const { lookupObjectName, name, displayName, description, isActive } = parameters;

        // Validate required parameters
        if (!lookupObjectName) {
            return {
                success: false,
                error: 'Parameter "lookupObjectName" is required',
                validationErrors: ['lookupObjectName is required']
            };
        }

        if (!name) {
            return {
                success: false,
                error: 'Parameter "name" is required',
                validationErrors: ['name is required']
            };
        }

        // Validate name is PascalCase
        if (!this.isPascalCase(name)) {
            return {
                success: false,
                error: `Invalid name format. Name must be in PascalCase (e.g., "ActiveStatus", "PendingApproval"). Received: "${name}"`,
                validationErrors: ['name must be in PascalCase format (start with uppercase letter, no spaces)']
            };
        }

        // Default isActive to 'true' if not provided
        const activeValue = isActive || 'true';

        // Validate isActive value
        if (activeValue !== 'true' && activeValue !== 'false') {
            return {
                success: false,
                error: `Invalid isActive value. Must be "true" or "false". Received: "${activeValue}"`,
                validationErrors: ['isActive must be "true" or "false"']
            };
        }

        // Add lookup value via HTTP bridge
        try {
            const updateData: any = {
                lookupObjectName,
                name,
                displayName: displayName || undefined,
                description: description || undefined,
                isActive: activeValue
            };

            const result = await this.postToBridge('/api/lookup-values', updateData);

            return {
                success: true,
                lookupValue: result.lookupValue,
                message: result.message || 'Lookup value added successfully',
                note: `Lookup value added to ${lookupObjectName} data object via MCP bridge (unsaved changes)`
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to add lookup value: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to add lookup values'
            };
        }
    }

    /**
     * Lists all lookup values from a specific lookup data object
     * Tool name: list_lookup_values (following MCP snake_case convention)
     * @param parameters Tool parameters containing lookupObjectName and optional includeInactive filter
     * @returns Array of lookup values with name, displayName, description, isActive
     */
    public async list_lookup_values(parameters: any): Promise<any> {
        const { lookupObjectName, includeInactive } = parameters;

        // Validate required parameter
        if (!lookupObjectName) {
            return {
                success: false,
                error: 'Parameter "lookupObjectName" is required',
                validationErrors: ['lookupObjectName is required']
            };
        }

        // Get lookup values from extension via HTTP bridge
        try {
            const endpoint = `/api/lookup-values?lookupObjectName=${encodeURIComponent(lookupObjectName)}`;
            const response = await this.fetchFromBridge(endpoint);
            
            let filteredValues = response;

            // Filter out inactive values unless includeInactive is true
            if (!includeInactive || includeInactive === 'false' || includeInactive === false) {
                filteredValues = filteredValues.filter((value: any) => value.isActive === 'true');
            }

            return {
                success: true,
                lookupObjectName: lookupObjectName,
                values: filteredValues,
                count: filteredValues.length,
                note: `Lookup values loaded from ${lookupObjectName} data object via MCP bridge`
            };
        } catch (error) {
            return {
                success: false,
                lookupObjectName: lookupObjectName,
                values: [],
                count: 0,
                error: `Failed to load lookup values: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required or lookup object not found'
            };
        }
    }

    /**
     * Updates an existing lookup value in any lookup data object
     * Tool name: update_lookup_value (following MCP snake_case convention)
     * @param parameters Tool parameters containing lookupObjectName, name, and fields to update
     * @returns Result of the lookup value update
     */
    public async update_lookup_value(parameters: any): Promise<any> {
        const { lookupObjectName, name, displayName, description, isActive } = parameters;

        // Validate required parameters
        if (!lookupObjectName) {
            return {
                success: false,
                error: 'Parameter "lookupObjectName" is required',
                validationErrors: ['lookupObjectName is required']
            };
        }

        if (!name) {
            return {
                success: false,
                error: 'Parameter "name" is required',
                validationErrors: ['name is required']
            };
        }

        // Validate that at least one field to update is provided
        if (displayName === undefined && description === undefined && isActive === undefined) {
            return {
                success: false,
                error: 'At least one field to update must be provided (displayName, description, or isActive)',
                validationErrors: ['No fields to update provided']
            };
        }

        // Validate isActive if provided
        if (isActive !== undefined && isActive !== 'true' && isActive !== 'false') {
            return {
                success: false,
                error: `Invalid isActive value. Must be "true" or "false". Received: "${isActive}"`,
                validationErrors: ['isActive must be "true" or "false"']
            };
        }

        // Update the lookup value via HTTP bridge
        try {
            const updateData: any = { lookupObjectName, name };
            if (displayName !== undefined) { updateData.displayName = displayName; }
            if (description !== undefined) { updateData.description = description; }
            if (isActive !== undefined) { updateData.isActive = isActive; }

            const result = await this.postToBridge('/api/lookup-values/update', updateData);

            return {
                success: true,
                lookupValue: result.lookupValue,
                message: result.message || 'Lookup value updated successfully',
                note: `Lookup value updated in ${lookupObjectName} data object via MCP bridge (unsaved changes)`
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to update lookup value: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required to update lookup values'
            };
        }
    }

    /**
     * Gets the schema definition for lookup values (lookup items)
     * Tool name: get_lookup_value_schema (following MCP snake_case convention)
     * @returns Schema definition with properties, validation rules, and examples
     */
    public async get_lookup_value_schema(): Promise<any> {
        return {
            success: true,
            schema: {
                type: 'object',
                description: 'Lookup value (lookup item) structure in AppDNA model',
                properties: {
                    name: {
                        type: 'string',
                        required: true,
                        format: 'PascalCase',
                        pattern: '^[A-Z][A-Za-z0-9]*$',
                        description: 'Unique identifier for the lookup value. Must be in PascalCase format (starts with uppercase letter, no spaces, can contain letters and numbers).',
                        examples: ['Administrator', 'DataEntryClerk', 'ActiveStatus', 'PendingApproval', 'HighPriority']
                    },
                    displayName: {
                        type: 'string',
                        required: false,
                        description: 'Human-readable display name for the lookup value. Auto-generated from name if not provided (e.g., "DataEntryClerk" becomes "Data Entry Clerk").',
                        examples: ['Administrator', 'Data Entry Clerk', 'Active Status', 'Pending Approval', 'High Priority']
                    },
                    description: {
                        type: 'string',
                        required: false,
                        description: 'Detailed description of the lookup value. Auto-generated from name if not provided.',
                        examples: ['System administrator with full access', 'User responsible for data entry tasks', 'Currently active item', 'Item pending approval']
                    },
                    isActive: {
                        type: 'string',
                        required: false,
                        enum: ['true', 'false'],
                        default: 'true',
                        description: 'Indicates whether the lookup value is active. Must be the string "true" or "false" (not boolean). Defaults to "true" if not provided.',
                        examples: ['true', 'false']
                    }
                },
                validationRules: {
                    name: [
                        'Required field',
                        'Must be unique within the lookup object (case-insensitive check)',
                        'Must be in PascalCase format',
                        'Must start with uppercase letter',
                        'Can only contain letters (A-Z, a-z) and numbers (0-9)',
                        'No spaces, hyphens, or special characters allowed'
                    ],
                    displayName: [
                        'Optional field',
                        'Auto-generated from name if not provided',
                        'Can contain spaces and special characters',
                        'Used for UI display'
                    ],
                    description: [
                        'Optional field',
                        'Auto-generated from name if not provided',
                        'Can be any descriptive text'
                    ],
                    isActive: [
                        'Optional field',
                        'Must be string "true" or "false" (not boolean)',
                        'Defaults to "true" if not provided',
                        'Use "false" for soft delete (hide without removing)'
                    ]
                },
                usage: {
                    location: 'Stored in lookup data objects (objects with isLookup="true")',
                    access: 'Via lookupItem array property on lookup objects',
                    tools: [
                        'add_lookup_value - Create new lookup value',
                        'list_lookup_values - List all lookup values from a lookup object',
                        'update_lookup_value - Update existing lookup value properties'
                    ]
                },
                exampleObjects: [
                    {
                        name: 'Administrator',
                        displayName: 'Administrator',
                        description: 'Administrator',
                        isActive: 'true'
                    },
                    {
                        name: 'DataEntryClerk',
                        displayName: 'Data Entry Clerk',
                        description: 'Data Entry Clerk',
                        isActive: 'true'
                    },
                    {
                        name: 'ActiveStatus',
                        displayName: 'Active Status',
                        description: 'Items that are currently active',
                        isActive: 'true'
                    },
                    {
                        name: 'Deprecated',
                        displayName: 'Deprecated',
                        description: 'No longer used',
                        isActive: 'false'
                    }
                ]
            },
            note: 'This schema defines the structure of lookup values (lookup items) in the AppDNA model'
        };
    }

    /**
     * Validates if a string is in PascalCase format
     * PascalCase: starts with uppercase letter, no spaces, can contain letters and numbers
     * @param str String to validate
     * @returns true if string is PascalCase
     */
    private isPascalCase(str: string): boolean {
        if (!str || typeof str !== 'string') {
            return false;
        }

        // Must start with uppercase letter
        // Can contain letters and numbers, no spaces
        // Examples: Customer, CustomerOrder, Product123
        const pascalCaseRegex = /^[A-Z][A-Za-z0-9]*$/;
        return pascalCaseRegex.test(str);
    }

    /**
     * Fetch data from extension via HTTP bridge (data bridge on port 3001)
     * @param endpoint The API endpoint to fetch from (e.g., '/api/data-objects')
     * @returns Promise resolving to the fetched data
     */
    private async fetchFromBridge(endpoint: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const http = require('http');
            
            const options = {
                hostname: 'localhost',
                port: 3001,
                path: endpoint,
                method: 'GET',
                timeout: 5000 // 5 second timeout
            };

            const req = http.request(options, (res: any) => {
                let data = '';
                
                res.on('data', (chunk: any) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(parsed);
                    } catch (e) {
                        reject(new Error(`Failed to parse response: ${e instanceof Error ? e.message : 'Unknown error'}`));
                    }
                });
            });

            req.on('error', (e: any) => {
                reject(new Error(`HTTP request failed: ${e.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timed out - is the extension running?'));
            });

            req.end();
        });
    }

    /**
     * Post data to extension via HTTP bridge (data bridge on port 3001)
     * @param endpoint The API endpoint to post to (e.g., '/api/data-objects')
     * @param data The data to post
     * @returns Promise resolving to the response data
     */
    private async postToBridge(endpoint: string, data: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const http = require('http');
            
            const postData = JSON.stringify(data);
            
            const options = {
                hostname: 'localhost',
                port: 3001,
                path: endpoint,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 5000 // 5 second timeout
            };

            const req = http.request(options, (res: any) => {
                let responseData = '';
                
                res.on('data', (chunk: any) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseData);
                        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(parsed);
                        } else {
                            reject(new Error(parsed.error || `HTTP ${res.statusCode}`));
                        }
                    } catch (e) {
                        reject(new Error(`Failed to parse response: ${e instanceof Error ? e.message : 'Unknown error'}`));
                    }
                });
            });

            req.on('error', (e: any) => {
                reject(new Error(`HTTP request failed: ${e.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timed out - is the extension running?'));
            });

            req.write(postData);
            req.end();
        });
    }
}

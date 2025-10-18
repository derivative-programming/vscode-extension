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
     * Lists all data objects from the AppDNA model
     * Tool name: list_data_objects (following MCP snake_case convention)
     * @param parameters Optional search and filter parameters
     * @returns Array of data objects with name, isLookup, and parentObjectName
     */
    public async list_data_objects(parameters?: any): Promise<any> {
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

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
     * @returns Array of data objects with name, isLookup, and parentObjectName
     */
    public async list_data_objects(): Promise<any> {
        // Try to get data objects from extension via HTTP bridge
        try {
            const response = await this.fetchFromBridge('/api/data-objects');
            return {
                success: true,
                objects: response.map((obj: any) => ({
                    name: obj.name || "",
                    isLookup: obj.isLookup === "true",
                    parentObjectName: obj.parentObjectName || null
                })),
                count: response.length,
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
}

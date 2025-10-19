// modelServiceTools.ts
// Tools for Model Services API operations via MCP
// Created on: October 19, 2025
// This file implements tools for accessing Model Services cloud features

/**
 * Implements Model Services API tools for the MCP server
 * All operations go through HTTP bridge to extension which has the API key
 */
export class ModelServiceTools {
    constructor() {
        // No dependencies needed - just uses HTTP bridge
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
     * Fetch model features catalog through the extension's HTTP bridge
     * Uses the exact same endpoint and logic as the Model Feature Catalog view
     */
    private async fetchModelFeatures(
        pageNumber: number,
        itemCountPerPage: number,
        orderByColumnName: string,
        orderByDescending: boolean
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            const http = require('http');
            
            const postData = JSON.stringify({ 
                pageNumber, 
                itemCountPerPage, 
                orderByColumnName, 
                orderByDescending 
            });
            
            const options = {
                hostname: 'localhost',
                port: 3002,
                path: '/api/model-services/model-features',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 30000 // 30 second timeout for API calls
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
                            resolve(response.data);
                        } else {
                            reject(new Error(response.error || 'API call failed'));
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
                reject(new Error('API call timed out. The Model Services API may be slow or unavailable.'));
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * List model features from the catalog
     * Returns paginated list of available features from Model Services
     * Tool name: list_model_features_catalog_items
     * 
     * @param pageNumber - Page number (1-indexed, default: 1)
     * @param itemCountPerPage - Items per page (default: 10)
     * @param orderByColumnName - Column to sort by (default: "displayName")
     * @param orderByDescending - Sort descending (default: false)
     */
    public async list_model_features_catalog_items(
        pageNumber: number = 1,
        itemCountPerPage: number = 10,
        orderByColumnName: string = "displayName",
        orderByDescending: boolean = false
    ): Promise<any> {
        // Check authentication first
        const isLoggedIn = await this.checkAuthStatus();
        if (!isLoggedIn) {
            return {
                success: false,
                error: 'Authentication required. Please log in to Model Services first using the open_login_view tool or click Login under Model Services in the tree view.',
                items: [],
                pageNumber: 1,
                itemCountPerPage: 10,
                recordsTotal: 0,
                recordsFiltered: 0
            };
        }

        try {
            // Fetch model features using the same code as the Model Feature Catalog view
            const data = await this.fetchModelFeatures(
                pageNumber,
                itemCountPerPage,
                orderByColumnName,
                orderByDescending
            );

            return {
                success: true,
                items: data.items || [],
                pageNumber: data.pageNumber || pageNumber,
                itemCountPerPage: data.itemCountPerPage || itemCountPerPage,
                recordsTotal: data.recordsTotal || 0,
                recordsFiltered: data.recordsFiltered || 0,
                orderByColumnName: data.orderByColumnName || orderByColumnName,
                orderByDescending: data.orderByDescending || orderByDescending
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred while fetching model features',
                items: [],
                pageNumber,
                itemCountPerPage,
                recordsTotal: 0,
                recordsFiltered: 0,
                note: 'Check that you are logged in to Model Services and have an active internet connection'
            };
        }
    }
}

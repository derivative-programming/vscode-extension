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

    /**
     * Generic fetch method for Model Services API endpoints
     * @param endpoint - API endpoint (e.g., 'prep-requests', 'validation-requests')
     * @param pageNumber - Page number
     * @param itemCountPerPage - Items per page
     * @param orderByColumnName - Column to sort by
     * @param orderByDescending - Sort descending
     */
    private async fetchFromModelServices(
        endpoint: string,
        pageNumber: number,
        itemCountPerPage: number,
        orderByColumnName: string,
        orderByDescending: boolean
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            const http = require('http');
            
            const postData = JSON.stringify({ 
                endpoint,
                pageNumber, 
                itemCountPerPage, 
                orderByColumnName, 
                orderByDescending 
            });
            
            const options = {
                hostname: 'localhost',
                port: 3002,
                path: '/api/model-services/' + endpoint,
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
     * List AI processing requests
     * Returns paginated list of AI processing requests from Model Services
     * Tool name: list_model_ai_processing_requests
     * 
     * @param pageNumber - Page number (1-indexed, default: 1)
     * @param itemCountPerPage - Items per page (default: 10)
     * @param orderByColumnName - Column to sort by (default: "modelPrepRequestRequestedUTCDateTime")
     * @param orderByDescending - Sort descending (default: true)
     */
    public async list_model_ai_processing_requests(
        pageNumber: number = 1,
        itemCountPerPage: number = 10,
        orderByColumnName: string = "modelPrepRequestRequestedUTCDateTime",
        orderByDescending: boolean = true
    ): Promise<any> {
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
            const data = await this.fetchFromModelServices(
                'prep-requests',
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
                error: error instanceof Error ? error.message : 'Unknown error occurred while fetching AI processing requests',
                items: [],
                pageNumber,
                itemCountPerPage,
                recordsTotal: 0,
                recordsFiltered: 0,
                note: 'Check that you are logged in to Model Services and have an active internet connection'
            };
        }
    }

    /**
     * List validation requests
     * Returns paginated list of validation requests from Model Services
     * Tool name: list_model_validation_requests
     * 
     * @param pageNumber - Page number (1-indexed, default: 1)
     * @param itemCountPerPage - Items per page (default: 10)
     * @param orderByColumnName - Column to sort by (default: "modelValidationRequestRequestedUTCDateTime")
     * @param orderByDescending - Sort descending (default: true)
     */
    public async list_model_validation_requests(
        pageNumber: number = 1,
        itemCountPerPage: number = 10,
        orderByColumnName: string = "modelValidationRequestRequestedUTCDateTime",
        orderByDescending: boolean = true
    ): Promise<any> {
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
            const data = await this.fetchFromModelServices(
                'validation-requests',
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
                error: error instanceof Error ? error.message : 'Unknown error occurred while fetching validation requests',
                items: [],
                pageNumber,
                itemCountPerPage,
                recordsTotal: 0,
                recordsFiltered: 0,
                note: 'Check that you are logged in to Model Services and have an active internet connection'
            };
        }
    }

    /**
     * List fabrication blueprint catalog items
     * Returns paginated list of available fabrication blueprints from Model Services
     * Tool name: list_fabrication_blueprint_catalog_items
     * 
     * @param pageNumber - Page number (1-indexed, default: 1)
     * @param itemCountPerPage - Items per page (default: 10)
     * @param orderByColumnName - Column to sort by (default: "displayName")
     * @param orderByDescending - Sort descending (default: false)
     */
    public async list_fabrication_blueprint_catalog_items(
        pageNumber: number = 1,
        itemCountPerPage: number = 10,
        orderByColumnName: string = "displayName",
        orderByDescending: boolean = false
    ): Promise<any> {
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
            const data = await this.fetchFromModelServices(
                'template-sets',
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
                error: error instanceof Error ? error.message : 'Unknown error occurred while fetching fabrication blueprints',
                items: [],
                pageNumber,
                itemCountPerPage,
                recordsTotal: 0,
                recordsFiltered: 0,
                note: 'Check that you are logged in to Model Services and have an active internet connection'
            };
        }
    }

    /**
     * List fabrication requests
     * Returns paginated list of fabrication requests from Model Services
     * Tool name: list_model_fabrication_requests
     * 
     * @param pageNumber - Page number (1-indexed, default: 1)
     * @param itemCountPerPage - Items per page (default: 10)
     * @param orderByColumnName - Column to sort by (default: "modelFabricationRequestRequestedUTCDateTime")
     * @param orderByDescending - Sort descending (default: true)
     */
    public async list_model_fabrication_requests(
        pageNumber: number = 1,
        itemCountPerPage: number = 10,
        orderByColumnName: string = "modelFabricationRequestRequestedUTCDateTime",
        orderByDescending: boolean = true
    ): Promise<any> {
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
            const data = await this.fetchFromModelServices(
                'fabrication-requests',
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
                error: error instanceof Error ? error.message : 'Unknown error occurred while fetching fabrication requests',
                items: [],
                pageNumber,
                itemCountPerPage,
                recordsTotal: 0,
                recordsFiltered: 0,
                note: 'Check that you are logged in to Model Services and have an active internet connection'
            };
        }
    }

    /**
     * Select (add) a model feature from the catalog
     * Tool name: select_model_feature
     * 
     * @param featureName - Name of the feature to select (must match catalog item name exactly)
     * @param version - Version of the feature (must match catalog item version exactly)
     */
    public async select_model_feature(
        featureName: string,
        version: string
    ): Promise<any> {
        return new Promise((resolve) => {
            const http = require('http');
            
            const postData = JSON.stringify({ 
                command: 'select_model_feature',
                featureName,
                version
            });
            
            const options = {
                hostname: 'localhost',
                port: 3002,
                path: '/api/execute-command',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 5000
            };

            const req = http.request(options, (res: any) => {
                let data = '';
                
                res.on('data', (chunk: any) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(response);
                    } catch (error) {
                        resolve({
                            success: false,
                            error: 'Invalid response from extension'
                        });
                    }
                });
            });

            req.on('error', (error: any) => {
                resolve({
                    success: false,
                    error: `Failed to connect to extension: ${error.message}. Is the extension running?`
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'Request timed out'
                });
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Unselect (remove) a model feature from the catalog
     * Only allowed if the feature is not marked as completed
     * Tool name: unselect_model_feature
     * 
     * @param featureName - Name of the feature to unselect (must match catalog item name exactly)
     * @param version - Version of the feature (must match catalog item version exactly)
     */
    public async unselect_model_feature(
        featureName: string,
        version: string
    ): Promise<any> {
        return new Promise((resolve) => {
            const http = require('http');
            
            const postData = JSON.stringify({ 
                command: 'unselect_model_feature',
                featureName,
                version
            });
            
            const options = {
                hostname: 'localhost',
                port: 3002,
                path: '/api/execute-command',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 5000
            };

            const req = http.request(options, (res: any) => {
                let data = '';
                
                res.on('data', (chunk: any) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(response);
                    } catch (error) {
                        resolve({
                            success: false,
                            error: 'Invalid response from extension'
                        });
                    }
                });
            });

            req.on('error', (error: any) => {
                resolve({
                    success: false,
                    error: `Failed to connect to extension: ${error.message}. Is the extension running?`
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'Request timed out'
                });
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Select (add) a fabrication blueprint from the catalog
     * Tool name: select_fabrication_blueprint
     * 
     * @param blueprintName - Name of the blueprint to select (must match catalog item name exactly)
     * @param version - Version of the blueprint (must match catalog item version exactly)
     */
    public async select_fabrication_blueprint(
        blueprintName: string,
        version: string
    ): Promise<any> {
        return new Promise((resolve) => {
            const http = require('http');
            
            const postData = JSON.stringify({ 
                command: 'select_fabrication_blueprint',
                blueprintName,
                version
            });
            
            const options = {
                hostname: 'localhost',
                port: 3002,
                path: '/api/execute-command',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 5000
            };

            const req = http.request(options, (res: any) => {
                let data = '';
                
                res.on('data', (chunk: any) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(response);
                    } catch (error) {
                        resolve({
                            success: false,
                            error: 'Invalid response from extension'
                        });
                    }
                });
            });

            req.on('error', (error: any) => {
                resolve({
                    success: false,
                    error: `Failed to connect to extension: ${error.message}. Is the extension running?`
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'Request timed out'
                });
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Unselect (remove) a fabrication blueprint from the catalog
     * Tool name: unselect_fabrication_blueprint
     * 
     * @param blueprintName - Name of the blueprint to unselect (must match catalog item name exactly)
     * @param version - Version of the blueprint (must match catalog item version exactly)
     */
    public async unselect_fabrication_blueprint(
        blueprintName: string,
        version: string
    ): Promise<any> {
        return new Promise((resolve) => {
            const http = require('http');
            
            const postData = JSON.stringify({ 
                command: 'unselect_fabrication_blueprint',
                blueprintName,
                version
            });
            
            const options = {
                hostname: 'localhost',
                port: 3002,
                path: '/api/execute-command',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 5000
            };

            const req = http.request(options, (res: any) => {
                let data = '';
                
                res.on('data', (chunk: any) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(response);
                    } catch (error) {
                        resolve({
                            success: false,
                            error: 'Invalid response from extension'
                        });
                    }
                });
            });

            req.on('error', (error: any) => {
                resolve({
                    success: false,
                    error: `Failed to connect to extension: ${error.message}. Is the extension running?`
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'Request timed out'
                });
            });

            req.write(postData);
            req.end();
        });
    }
}

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
                port: 3001,  // Use data bridge port
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
                port: 3001,  // Data bridge port
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
                pageNumber, 
                itemCountPerPage, 
                orderByColumnName, 
                orderByDescending 
            });
            
            const options = {
                hostname: 'localhost',
                port: 3001,  // Data bridge port
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
                        // The response should already have the data we need directly
                        resolve(response);
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
            const response = await this.fetchFromModelServices(
                'prep-requests',
                pageNumber,
                itemCountPerPage,
                orderByColumnName,
                orderByDescending
            );

            // Unwrap the data property from the response
            const data = response.data || response;

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
     * Get AI processing request details
     * Returns details for a specific AI processing request by request code
     * Tool name: get_model_ai_processing_request_details
     * 
     * @param requestCode - The request code to fetch details for
     */
    public async get_model_ai_processing_request_details(requestCode: string): Promise<any> {
        if (!requestCode || requestCode.trim() === '') {
            return {
                success: false,
                error: 'Request code is required',
                item: null
            };
        }

        const isLoggedIn = await this.checkAuthStatus();
        if (!isLoggedIn) {
            return {
                success: false,
                error: 'Authentication required. Please log in to Model Services first using the open_login_view tool or click Login under Model Services in the tree view.',
                item: null
            };
        }

        return new Promise((resolve) => {
            const http = require('http');
            
            const options = {
                hostname: 'localhost',
                port: 3001,  // Data bridge port
                path: `/api/model-services/prep-request-details?requestCode=${encodeURIComponent(requestCode)}`,
                method: 'GET',
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
                            resolve({
                                success: true,
                                item: response.item,
                                requestCode: requestCode
                            });
                        } else {
                            resolve({
                                success: false,
                                error: response.error || 'Failed to fetch request details',
                                item: null,
                                requestCode: requestCode
                            });
                        }
                    } catch (error) {
                        resolve({
                            success: false,
                            error: 'Invalid response from extension',
                            item: null,
                            requestCode: requestCode
                        });
                    }
                });
            });

            req.on('error', (error: any) => {
                resolve({
                    success: false,
                    error: `HTTP bridge connection failed: ${error.message}. Is the extension running and HTTP bridge started?`,
                    item: null,
                    requestCode: requestCode,
                    note: 'Check that you are logged in to Model Services and have an active internet connection'
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'API call timed out. The Model Services API may be slow or unavailable.',
                    item: null,
                    requestCode: requestCode
                });
            });

            req.end();
        });
    }

    /**
     * Get validation request details
     * Returns details for a specific validation request by request code
     * Tool name: get_model_validation_request_details
     * 
     * @param requestCode - The validation request code to fetch details for
     */
    public async get_model_validation_request_details(requestCode: string): Promise<any> {
        if (!requestCode || requestCode.trim() === '') {
            return {
                success: false,
                error: 'Request code is required',
                item: null
            };
        }

        const isLoggedIn = await this.checkAuthStatus();
        if (!isLoggedIn) {
            return {
                success: false,
                error: 'Authentication required. Please log in to Model Services first using the open_login_view tool or click Login under Model Services in the tree view.',
                item: null
            };
        }

        return new Promise((resolve) => {
            const http = require('http');
            
            const options = {
                hostname: 'localhost',
                port: 3001,  // Data bridge port
                path: `/api/model-services/validation-request-details?requestCode=${encodeURIComponent(requestCode)}`,
                method: 'GET',
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
                            resolve({
                                success: true,
                                item: response.item,
                                requestCode: requestCode
                            });
                        } else {
                            resolve({
                                success: false,
                                error: response.error || 'Failed to fetch validation request details',
                                item: null,
                                requestCode: requestCode
                            });
                        }
                    } catch (error: any) {
                        resolve({
                            success: false,
                            error: 'Failed to parse response from Model Services',
                            item: null,
                            requestCode: requestCode
                        });
                    }
                });
            });

            req.on('error', (error: any) => {
                resolve({
                    success: false,
                    error: error.message || 'Failed to connect to Model Services',
                    item: null,
                    requestCode: requestCode,
                    note: 'Check that you are logged in to Model Services and have an active internet connection'
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'API call timed out. The Model Services API may be slow or unavailable.',
                    item: null,
                    requestCode: requestCode
                });
            });

            req.end();
        });
    }

    /**
     * Get fabrication request details
     * Returns details for a specific fabrication request by request code
     * Tool name: get_model_fabrication_request_details
     * 
     * @param requestCode - The fabrication request code to fetch details for
     */
    public async get_model_fabrication_request_details(requestCode: string): Promise<any> {
        if (!requestCode || requestCode.trim() === '') {
            return {
                success: false,
                error: 'Request code is required',
                item: null
            };
        }

        const isLoggedIn = await this.checkAuthStatus();
        if (!isLoggedIn) {
            return {
                success: false,
                error: 'Authentication required. Please log in to Model Services first using the open_login_view tool or click Login under Model Services in the tree view.',
                item: null
            };
        }

        return new Promise((resolve) => {
            const http = require('http');
            
            const options = {
                hostname: 'localhost',
                port: 3001,  // Data bridge port
                path: `/api/model-services/fabrication-request-details?requestCode=${encodeURIComponent(requestCode)}`,
                method: 'GET',
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
                            resolve({
                                success: true,
                                item: response.item,
                                requestCode: requestCode
                            });
                        } else {
                            resolve({
                                success: false,
                                error: response.error || 'Failed to fetch fabrication request details',
                                item: null,
                                requestCode: requestCode
                            });
                        }
                    } catch (error: any) {
                        resolve({
                            success: false,
                            error: 'Failed to parse response from Model Services',
                            item: null,
                            requestCode: requestCode
                        });
                    }
                });
            });

            req.on('error', (error: any) => {
                resolve({
                    success: false,
                    error: error.message || 'Failed to connect to Model Services',
                    item: null,
                    requestCode: requestCode,
                    note: 'Check that you are logged in to Model Services and have an active internet connection'
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'API call timed out. The Model Services API may be slow or unavailable.',
                    item: null,
                    requestCode: requestCode
                });
            });

            req.end();
        });
    }

    /**
     * Create AI processing request
     * Submits a new AI processing request to Model Services with the current model file
     * Tool name: create_model_ai_processing_request
     * 
     * @param description - Description for the AI processing request (e.g., "Project: MyApp, Version: 1.0.0")
     */
    public async create_model_ai_processing_request(description: string): Promise<any> {
        if (!description || description.trim() === '') {
            return {
                success: false,
                error: 'Description is required for creating an AI processing request'
            };
        }

        const isLoggedIn = await this.checkAuthStatus();
        if (!isLoggedIn) {
            return {
                success: false,
                error: 'Authentication required. Please log in to Model Services first using the open_login_view tool or click Login under Model Services in the tree view.'
            };
        }

        return new Promise((resolve) => {
            const http = require('http');
            
            const postData = JSON.stringify({ 
                description: description.trim()
            });
            
            const options = {
                hostname: 'localhost',
                port: 3002,
                path: '/api/model-services/create-prep-request',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 60000 // 60 second timeout for file upload
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
                                message: 'AI processing request created successfully',
                                requestCode: response.requestCode,
                                description: description
                            });
                        } else {
                            resolve({
                                success: false,
                                error: response.error || 'Failed to create AI processing request'
                            });
                        }
                    } catch (error: any) {
                        resolve({
                            success: false,
                            error: 'Failed to parse response from Model Services'
                        });
                    }
                });
            });

            req.on('error', (error: any) => {
                resolve({
                    success: false,
                    error: error.message || 'Failed to connect to Model Services',
                    note: 'Check that you are logged in to Model Services and have an active internet connection'
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'API call timed out. The Model Services API may be slow or unavailable, or the model file may be too large.'
                });
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Create validation request
     * Submits a new validation request to Model Services with the current model file
     * Tool name: create_model_validation_request
     * 
     * @param description - Description for the validation request (e.g., "Project: MyApp, Version: 1.0.0")
     */
    public async create_model_validation_request(description: string): Promise<any> {
        if (!description || description.trim() === '') {
            return {
                success: false,
                error: 'Description is required for creating a validation request'
            };
        }

        const isLoggedIn = await this.checkAuthStatus();
        if (!isLoggedIn) {
            return {
                success: false,
                error: 'Authentication required. Please log in to Model Services first using the open_login_view tool or click Login under Model Services in the tree view.'
            };
        }

        return new Promise((resolve) => {
            const http = require('http');
            
            const postData = JSON.stringify({ 
                description: description.trim()
            });
            
            const options = {
                hostname: 'localhost',
                port: 3002,
                path: '/api/model-services/create-validation-request',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 60000 // 60 second timeout for file upload
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
                                message: 'Validation request created successfully',
                                requestCode: response.requestCode,
                                description: description
                            });
                        } else {
                            resolve({
                                success: false,
                                error: response.error || 'Failed to create validation request'
                            });
                        }
                    } catch (error: any) {
                        resolve({
                            success: false,
                            error: 'Failed to parse response from Model Services'
                        });
                    }
                });
            });

            req.on('error', (error: any) => {
                resolve({
                    success: false,
                    error: error.message || 'Failed to connect to Model Services',
                    note: 'Check that you are logged in to Model Services and have an active internet connection'
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'API call timed out. The Model Services API may be slow or unavailable, or the model file may be too large.'
                });
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Create fabrication request
     * Submits a new fabrication request to Model Services with the current model file
     * Tool name: create_model_fabrication_request
     * 
     * @param description - Description for the fabrication request (e.g., "Project: MyApp, Version: 1.0.0")
     */
    public async create_model_fabrication_request(description: string): Promise<any> {
        if (!description || description.trim() === '') {
            return {
                success: false,
                error: 'Description is required for creating a fabrication request'
            };
        }

        const isLoggedIn = await this.checkAuthStatus();
        if (!isLoggedIn) {
            return {
                success: false,
                error: 'Authentication required. Please log in to Model Services first using the open_login_view tool or click Login under Model Services in the tree view.'
            };
        }

        return new Promise((resolve) => {
            const http = require('http');
            
            const postData = JSON.stringify({ 
                description: description.trim()
            });
            
            const options = {
                hostname: 'localhost',
                port: 3002,
                path: '/api/model-services/create-fabrication-request',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 60000 // 60 second timeout for file upload
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
                                message: 'Fabrication request created successfully',
                                requestCode: response.requestCode,
                                description: description
                            });
                        } else {
                            resolve({
                                success: false,
                                error: response.error || 'Failed to create fabrication request'
                            });
                        }
                    } catch (error: any) {
                        resolve({
                            success: false,
                            error: 'Failed to parse response from Model Services'
                        });
                    }
                });
            });

            req.on('error', (error: any) => {
                resolve({
                    success: false,
                    error: error.message || 'Failed to connect to Model Services',
                    note: 'Check that you are logged in to Model Services and have an active internet connection'
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'API call timed out. The Model Services API may be slow or unavailable, or the model file may be too large.'
                });
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Merge AI processing results into current model
     * Downloads the AI-enhanced model and merges it with the current model
     * Tool name: merge_model_ai_processing_results
     * 
     * @param requestCode - The AI processing request code
     */
    public async merge_model_ai_processing_results(requestCode: string): Promise<any> {
        if (!requestCode || requestCode.trim() === '') {
            return {
                success: false,
                error: 'Request code is required for merging AI processing results'
            };
        }

        const isLoggedIn = await this.checkAuthStatus();
        if (!isLoggedIn) {
            return {
                success: false,
                error: 'Authentication required. Please log in to Model Services first using the open_login_view tool or click Login under Model Services in the tree view.'
            };
        }

        return new Promise((resolve) => {
            const http = require('http');
            
            const postData = JSON.stringify({ 
                requestCode: requestCode.trim()
            });
            
            const options = {
                hostname: 'localhost',
                port: 3002,
                path: '/api/model-services/merge-ai-processing-results',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 120000 // 120 second timeout for merge operation (download + merge)
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
                                message: 'AI processing results merged successfully into model',
                                requestCode: requestCode,
                                note: 'The model has been updated in memory. Use save_model tool to persist changes to disk.'
                            });
                        } else {
                            resolve({
                                success: false,
                                error: response.error || 'Failed to merge AI processing results'
                            });
                        }
                    } catch (error: any) {
                        resolve({
                            success: false,
                            error: 'Failed to parse response from Model Services'
                        });
                    }
                });
            });

            req.on('error', (error: any) => {
                resolve({
                    success: false,
                    error: error.message || 'Failed to connect to Model Services',
                    note: 'Check that you are logged in to Model Services and have an active internet connection'
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'Merge operation timed out. The Model Services API may be slow or unavailable, or the result model may be very large.'
                });
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Get the Model AI Processing Request schema definition
     * Tool name: get_model_ai_processing_request_schema
     * @returns Schema definition for AI processing request objects returned by Model Services API
     */
    public async get_model_ai_processing_request_schema(): Promise<any> {
        return {
            success: true,
            schema: {
                type: "object",
                description: "AI Processing Request object structure returned by Model Services API",
                properties: {
                    modelPrepRequestCode: {
                        type: "string",
                        description: "Unique identifier code for the AI processing request",
                        required: true,
                        example: "ABC123"
                    },
                    modelPrepRequestDescription: {
                        type: "string",
                        description: "User-provided description of the AI processing request",
                        required: true,
                        example: "Project: MyApp, Version: 1.0.0"
                    },
                    modelPrepRequestRequestedUTCDateTime: {
                        type: "string",
                        format: "date-time",
                        description: "UTC timestamp when the request was submitted",
                        required: true,
                        example: "2025-10-20T12:00:00Z"
                    },
                    modelPrepRequestIsStarted: {
                        type: "boolean",
                        description: "Whether the AI processing has started",
                        required: true,
                        default: false
                    },
                    modelPrepRequestIsCompleted: {
                        type: "boolean",
                        description: "Whether the AI processing has completed",
                        required: true,
                        default: false
                    },
                    modelPrepRequestIsSuccessful: {
                        type: "boolean",
                        description: "Whether the AI processing completed successfully (only meaningful if isCompleted is true)",
                        required: true,
                        default: false
                    },
                    modelPrepRequestIsCanceled: {
                        type: "boolean",
                        description: "Whether the request was cancelled by the user",
                        required: true,
                        default: false
                    },
                    modelPrepRequestReportUrl: {
                        type: "string",
                        format: "uri",
                        description: "URL to download the AI processing report (available when completed)",
                        required: false,
                        example: "https://modelservicesapi.derivative-programming.com/reports/ABC123.txt"
                    },
                    modelPrepRequestResultModelUrl: {
                        type: "string",
                        format: "uri",
                        description: "URL to download the result model with AI-generated additions (available when successful)",
                        required: false,
                        example: "https://modelservicesapi.derivative-programming.com/results/ABC123.json"
                    },
                    modelPrepRequestErrorMessage: {
                        type: "string",
                        description: "Error message describing why processing failed (only present if isCompleted is true and isSuccessful is false)",
                        required: false,
                        example: "Invalid model format"
                    }
                },
                statusCalculation: {
                    description: "The status can be calculated from the boolean flags",
                    rules: [
                        "Queued: isStarted=false AND isCanceled=false",
                        "Processing: isStarted=true AND isCompleted=false",
                        "Success: isCompleted=true AND isSuccessful=true",
                        "Processing Error: isCompleted=true AND isSuccessful=false",
                        "Cancelled: isCanceled=true"
                    ]
                },
                example: {
                    modelPrepRequestCode: "ABC123",
                    modelPrepRequestDescription: "Project: MyApp, Version: 1.0.0",
                    modelPrepRequestRequestedUTCDateTime: "2025-10-20T12:00:00Z",
                    modelPrepRequestIsStarted: true,
                    modelPrepRequestIsCompleted: true,
                    modelPrepRequestIsSuccessful: true,
                    modelPrepRequestIsCanceled: false,
                    modelPrepRequestReportUrl: "https://modelservicesapi.derivative-programming.com/reports/ABC123.txt",
                    modelPrepRequestResultModelUrl: "https://modelservicesapi.derivative-programming.com/results/ABC123.json",
                    modelPrepRequestErrorMessage: null
                }
            },
            note: "This schema represents the AI processing request objects returned by the Model Services API. Use list_model_ai_processing_requests to get all requests or get_model_ai_processing_request_details to get a specific request."
        };
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
            const response = await this.fetchFromModelServices(
                'validation-requests',
                pageNumber,
                itemCountPerPage,
                orderByColumnName,
                orderByDescending
            );

            // Unwrap the data property from the response
            const data = response.data || response;

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
     * Get the Model Validation Request schema definition
     * Tool name: get_model_validation_request_schema
     * @returns Schema definition for validation request objects returned by Model Services API
     */
    public async get_model_validation_request_schema(): Promise<any> {
        return {
            success: true,
            schema: {
                type: "object",
                description: "Model Validation Request object structure returned by Model Services API",
                properties: {
                    modelValidationRequestCode: {
                        type: "string",
                        description: "Unique identifier code for the validation request",
                        required: true,
                        example: "VAL123"
                    },
                    modelValidationRequestDescription: {
                        type: "string",
                        description: "User-provided description of the validation request",
                        required: true,
                        example: "Project: MyApp, Version: 1.0.0"
                    },
                    modelValidationRequestRequestedUTCDateTime: {
                        type: "string",
                        format: "date-time",
                        description: "UTC timestamp when the request was submitted",
                        required: true,
                        example: "2025-10-20T12:00:00Z"
                    },
                    modelValidationRequestIsStarted: {
                        type: "boolean",
                        description: "Whether the validation processing has started",
                        required: true,
                        default: false
                    },
                    modelValidationRequestIsCompleted: {
                        type: "boolean",
                        description: "Whether the validation processing has completed",
                        required: true,
                        default: false
                    },
                    modelValidationRequestIsSuccessful: {
                        type: "boolean",
                        description: "Whether the validation completed successfully (only meaningful if isCompleted is true)",
                        required: true,
                        default: false
                    },
                    modelValidationRequestIsCanceled: {
                        type: "boolean",
                        description: "Whether the request was cancelled by the user",
                        required: true,
                        default: false
                    },
                    modelValidationRequestReportUrl: {
                        type: "string",
                        format: "uri",
                        description: "URL to download the validation report (available when completed)",
                        required: false,
                        example: "https://modelservicesapi.derivative-programming.com/validation-reports/VAL123.txt"
                    },
                    modelValidationRequestChangeSuggestionsUrl: {
                        type: "string",
                        format: "uri",
                        description: "URL to download the change suggestions file (available when successful)",
                        required: false,
                        example: "https://modelservicesapi.derivative-programming.com/change-suggestions/VAL123.json"
                    },
                    modelValidationRequestErrorMessage: {
                        type: "string",
                        description: "Error message describing why validation failed (only present if isCompleted is true and isSuccessful is false)",
                        required: false,
                        example: "Invalid model format"
                    }
                },
                statusCalculation: {
                    description: "The status can be calculated from the boolean flags",
                    rules: [
                        "Queued: isStarted=false AND isCanceled=false",
                        "Processing: isStarted=true AND isCompleted=false",
                        "Success: isCompleted=true AND isSuccessful=true",
                        "Validation Error: isCompleted=true AND isSuccessful=false",
                        "Cancelled: isCanceled=true"
                    ]
                },
                example: {
                    modelValidationRequestCode: "VAL123",
                    modelValidationRequestDescription: "Project: MyApp, Version: 1.0.0",
                    modelValidationRequestRequestedUTCDateTime: "2025-10-20T12:00:00Z",
                    modelValidationRequestIsStarted: true,
                    modelValidationRequestIsCompleted: true,
                    modelValidationRequestIsSuccessful: true,
                    modelValidationRequestIsCanceled: false,
                    modelValidationRequestReportUrl: "https://modelservicesapi.derivative-programming.com/validation-reports/VAL123.txt",
                    modelValidationRequestChangeSuggestionsUrl: "https://modelservicesapi.derivative-programming.com/change-suggestions/VAL123.json",
                    modelValidationRequestErrorMessage: null
                }
            },
            note: "This schema represents the validation request objects returned by the Model Services API. Use list_model_validation_requests to get all validation requests. Validation requests analyze your model and provide change suggestions to improve quality."
        };
    }

    /**
     * Get Model Fabrication Request Schema
     * Returns the schema definition for Model Fabrication Request objects.
     * This is a static documentation tool that doesn't require authentication.
     * Tool name: get_model_fabrication_request_schema
     * 
     * Returns schema with properties:
     * - modelFabricationRequestCode: Unique identifier (string)
     * - modelFabricationRequestDescription: User-friendly description (string)
     * - modelFabricationRequestRequestedUTCDateTime: When request was submitted (ISO 8601 string)
     * - modelFabricationRequestIsStarted: Whether processing has begun (boolean)
     * - modelFabricationRequestIsCompleted: Whether request is finished (boolean)
     * - modelFabricationRequestIsSuccessful: Whether request succeeded (boolean)
     * - modelFabricationRequestIsCanceled: Whether request was canceled (boolean)
     * - modelFabricationRequestReportUrl: URL to execution report (string or null)
     * - modelFabricationRequestResultUrl: URL to fabricated result (string or null)
     * - modelFabricationRequestErrorMessage: Error details if failed (string or null)
     * 
     * Status Calculation:
     * - "Completed Successfully" = IsCompleted && IsSuccessful && !IsCanceled
     * - "Completed with Errors" = IsCompleted && !IsSuccessful && !IsCanceled
     * - "Processing" = IsStarted && !IsCompleted && !IsCanceled
     * - "Pending" = !IsStarted && !IsCompleted && !IsCanceled
     * - "Canceled" = IsCanceled
     */
    public async get_model_fabrication_request_schema(): Promise<any> {
        return {
            success: true,
            schema: {
                type: "object",
                properties: {
                    modelFabricationRequestCode: {
                        type: "string",
                        description: "Unique identifier for the fabrication request"
                    },
                    modelFabricationRequestDescription: {
                        type: "string",
                        description: "User-friendly description of the fabrication request (typically includes project name and blueprint)"
                    },
                    modelFabricationRequestRequestedUTCDateTime: {
                        type: "string",
                        format: "date-time",
                        description: "ISO 8601 timestamp when the fabrication request was submitted"
                    },
                    modelFabricationRequestIsStarted: {
                        type: "boolean",
                        description: "Indicates whether processing has begun"
                    },
                    modelFabricationRequestIsCompleted: {
                        type: "boolean",
                        description: "Indicates whether the request has finished processing"
                    },
                    modelFabricationRequestIsSuccessful: {
                        type: "boolean",
                        description: "Indicates whether the request completed successfully"
                    },
                    modelFabricationRequestIsCanceled: {
                        type: "boolean",
                        description: "Indicates whether the request was canceled"
                    },
                    modelFabricationRequestReportUrl: {
                        type: ["string", "null"],
                        description: "URL to the execution report (available after completion)"
                    },
                    modelFabricationRequestResultUrl: {
                        type: ["string", "null"],
                        description: "URL to the fabricated result (available after successful completion)"
                    },
                    modelFabricationRequestErrorMessage: {
                        type: ["string", "null"],
                        description: "Error message if the request failed"
                    }
                },
                required: [
                    "modelFabricationRequestCode",
                    "modelFabricationRequestDescription",
                    "modelFabricationRequestRequestedUTCDateTime",
                    "modelFabricationRequestIsStarted",
                    "modelFabricationRequestIsCompleted",
                    "modelFabricationRequestIsSuccessful",
                    "modelFabricationRequestIsCanceled"
                ],
                example: {
                    modelFabricationRequestCode: "FAB123",
                    modelFabricationRequestDescription: "Project: MyApp, Blueprint: Customer Registration Form",
                    modelFabricationRequestRequestedUTCDateTime: "2025-10-20T12:00:00Z",
                    modelFabricationRequestIsStarted: true,
                    modelFabricationRequestIsCompleted: true,
                    modelFabricationRequestIsSuccessful: true,
                    modelFabricationRequestIsCanceled: false,
                    modelFabricationRequestReportUrl: "https://modelservicesapi.derivative-programming.com/fabrication-reports/FAB123.txt",
                    modelFabricationRequestResultUrl: "https://modelservicesapi.derivative-programming.com/fabrication-results/FAB123.zip",
                    modelFabricationRequestErrorMessage: null
                }
            },
            note: "This schema represents the fabrication request objects returned by the Model Services API. Use list_model_fabrication_requests to get all fabrication requests. Fabrication requests generate code and artifacts from blueprints."
        };
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
            const response = await this.fetchFromModelServices(
                'template-sets',
                pageNumber,
                itemCountPerPage,
                orderByColumnName,
                orderByDescending
            );

            // Unwrap the data property from the response
            const data = response.data || response;

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
            const response = await this.fetchFromModelServices(
                'fabrication-requests',
                pageNumber,
                itemCountPerPage,
                orderByColumnName,
                orderByDescending
            );

            // Unwrap the data property from the response
            const data = response.data || response;

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

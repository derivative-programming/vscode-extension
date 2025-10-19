// modelTools.ts
// Tools for model-level operations via MCP
// Created on: October 19, 2025
// This file implements model-level tools for the MCP server (save, validate, etc.)

/**
 * Implements model-level tools for the MCP server
 */
export class ModelTools {
    constructor() {
        // No dependencies needed - just executes commands via HTTP bridge
    }

    /**
     * Execute a VS Code command via HTTP bridge
     * Uses port 3002 for command execution
     */
    private async executeCommand(command: string, args: any[] = []): Promise<any> {
        return new Promise((resolve, reject) => {
            const http = require('http');
            
            const postData = JSON.stringify({ command, args });
            
            const options = {
                hostname: 'localhost',
                port: 3002,
                path: '/api/execute-command',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 10000 // 10 second timeout for save operations
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
                                message: response.message || 'Command executed successfully'
                            });
                        } else {
                            reject(new Error(response.error || 'Command execution failed'));
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
                reject(new Error('Command execution timed out. The save operation may be taking longer than expected.'));
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Save the current AppDNA model to file
     * Executes the same command as the save icon button in the tree view
     * Tool name: save_model
     */
    public async save_model(): Promise<any> {
        try {
            const result = await this.executeCommand('appdna.saveFile');
            return {
                success: true,
                message: 'Model saved successfully to file',
                note: 'All changes have been persisted to the app-dna.json file'
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred while saving model',
                note: 'Check that the AppDNA model file is loaded and the extension is running'
            };
        }
    }

    /**
     * Close all open view panels/webviews
     * Closes all detail views (objects, forms, reports, workflows, APIs, etc.) and list views
     * Tool name: close_all_open_views
     */
    public async close_all_open_views(): Promise<any> {
        try {
            const result = await this.executeCommand('appdna.closeAllOpenViews');
            return {
                success: true,
                message: 'All open views closed successfully',
                note: 'Closed all detail views, list views, and other open panels'
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred while closing views',
                note: 'Check that the extension is running and views are open'
            };
        }
    }
}

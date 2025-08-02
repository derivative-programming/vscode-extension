// MCP stdio bridge 
// Created on: May 10, 2025
// This file acts as an entry point for the stdio MCP server

import { MCPServer } from './server';

/**
 * Main entry point for stdio MCP server
 * Detects stdio mode and initializes the server
 */
export function initializeStdioServer(): void {
    // Check if this is a standalone stdio MCP request
    const isStdioMcp = process.argv.includes('--stdio-mcp') || process.env.APPDNA_MCP_MODE === 'true';
    
    if (isStdioMcp) {
        console.error('[STDIO MCP] Initializing AppDNA MCP Server in stdio mode');
        
        // Set up the server
        const server = MCPServer.getInstance();
        server.start().catch(error => {
            console.error('[STDIO MCP] Failed to start server:', error);
            process.exit(1);
        });
        
        // Handle process exit gracefully
        process.on('SIGINT', () => {
            console.error('[STDIO MCP] Received SIGINT. Shutting down...');
            server.stop();
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            console.error('[STDIO MCP] Received SIGTERM. Shutting down...');
            server.stop();
            process.exit(0);
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('[STDIO MCP] Uncaught exception:', error);
            server.stop();
            process.exit(1);
        });
    }
}

// Only run if directly called (not imported)
if (require.main === module) {
    initializeStdioServer();
}

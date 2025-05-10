// mcpHttpCommands.ts
// Commands for controlling the MCP HTTP server
// Created on: May 10, 2025

import * as vscode from 'vscode';
import { MCPHttpServer } from '../mcp/httpServer';
import { addLogToCommandHistory } from '../utils/commandLog';

/**
 * Command to start the MCP HTTP server
 */
export async function startMCPHttpServerCommand(): Promise<void> {
    try {
        addLogToCommandHistory("startMCPHttpServerCommand");
        const server = MCPHttpServer.getInstance();
        await server.start();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to start MCP HTTP server: ${errorMessage}`);
    }
}

/**
 * Command to stop the MCP HTTP server
 */
export async function stopMCPHttpServerCommand(): Promise<void> {
    try {
        addLogToCommandHistory("stopMCPHttpServerCommand");
        const server = MCPHttpServer.getInstance();
        server.stop();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to stop MCP HTTP server: ${errorMessage}`);
    }
}

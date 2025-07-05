// mcpProvider.ts
// Official VS Code MCP Server Definition Provider implementation
// Created on: July 5, 2025
// This file implements the official VS Code MCP provider API instead of custom server

import * as vscode from 'vscode';
import { ModelService } from '../services/modelService';

/**
 * Official VS Code MCP Server Definition Provider
 * Replaces the custom stdio/HTTP server implementation with the official API
 */
export class AppDNAMcpProvider implements vscode.McpServerDefinitionProvider {
    private _onDidChangeMcpServerDefinitions = new vscode.EventEmitter<void>();
    public readonly onDidChangeMcpServerDefinitions = this._onDidChangeMcpServerDefinitions.event;
    
    private modelService: ModelService;

    constructor() {
        this.modelService = ModelService.getInstance();
        
        // Listen for file changes to update server definitions
        // Note: Using file watcher instead of onModelChanged which doesn't exist
        const watcher = vscode.workspace.createFileSystemWatcher('**/*.json');
        watcher.onDidChange(() => {
            this._onDidChangeMcpServerDefinitions.fire();
        });
    }

    /**
     * Provides MCP server definitions
     */
    async provideMcpServerDefinitions(token: vscode.CancellationToken): Promise<vscode.McpStdioServerDefinition[]> {
        // Return the AppDNA MCP server definition
        const serverDefinition = new vscode.McpStdioServerDefinition(
            'AppDNA Model Server',  // label
            process.execPath,       // command (Node.js executable)
            [                       // args
                this.getStdioBridgePath(),
                '--stdio-mcp'
            ],
            {                       // env
                ...process.env,
                APPDNA_MCP_MODE: 'true'
            },
            '1.0.0'                // version
        );

        // Set additional properties
        (serverDefinition as any).id = 'appDNAServer';
        (serverDefinition as any).description = 'MCP server for interacting with AppDNA model data, user stories, and validation requests';
        (serverDefinition as any).cwd = this.getWorkspacePath();

        return [serverDefinition];
    }

    /**
     * Resolves an MCP server definition when it needs to be started
     * This is where we can perform additional setup like authentication
     */
    async resolveMcpServerDefinition(
        definition: vscode.McpStdioServerDefinition,
        token: vscode.CancellationToken
    ): Promise<vscode.McpStdioServerDefinition> {
        // For now, just return the definition as-is
        // In the future, we could add authentication or other setup here
        return definition;
    }

    /**
     * Gets the path to the compiled stdioBridge.js file
     */
    private getStdioBridgePath(): string {
        const extensionPath = vscode.extensions.getExtension('derivative-programming.appdna')?.extensionPath;
        if (!extensionPath) {
            throw new Error('AppDNA extension not found');
        }
        return `${extensionPath}/dist/mcp/stdioBridge.js`;
    }

    /**
     * Gets the current workspace path
     */
    private getWorkspacePath(): string {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        return workspaceFolder?.uri.fsPath || process.cwd();
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        this._onDidChangeMcpServerDefinitions.dispose();
    }
}

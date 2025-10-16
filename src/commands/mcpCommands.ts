// mcpCommands.ts
// Commands for managing the MCP server
// Created on: October 12, 2025

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { MCPServer } from '../mcp/server';

let mcpProcess: import('child_process').ChildProcess | null = null;
let onStatusChangeCallback: (() => void) | null = null;

/**
 * Check if the MCP server is currently running
 */
export function isMcpServerRunning(): boolean {
    return mcpProcess !== null && !mcpProcess.killed;
}

/**
 * Set a callback to be called when the MCP server status changes
 */
export function setMcpServerStatusChangeCallback(callback: () => void): void {
    onStatusChangeCallback = callback;
}

/**
 * Configure VS Code MCP server using mcp.json file
 * Exported for use by extension activation
 * Per official VS Code documentation: https://code.visualstudio.com/docs/copilot/customization/mcp-servers
 */
export async function configureMcpSettings(workspaceFolder: vscode.WorkspaceFolder, extensionPath: string): Promise<void> {
    const mcpConfigPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'mcp.json');

    // Ensure .vscode directory exists
    const vscodeDir = path.dirname(mcpConfigPath);
    if (!fs.existsSync(vscodeDir)) {
        fs.mkdirSync(vscodeDir, { recursive: true });
    }

    // Read existing mcp.json if it exists
    let mcpConfig: any = {
        servers: {}
    };
    
    if (fs.existsSync(mcpConfigPath)) {
        try {
            const content = fs.readFileSync(mcpConfigPath, 'utf8');
            mcpConfig = JSON.parse(content);
            // Ensure servers object exists
            if (!mcpConfig.servers) {
                mcpConfig.servers = {};
            }
        } catch (error) {
            console.warn('Failed to parse existing mcp.json:', error);
            mcpConfig = { servers: {} };
        }
    }

    // Configure AppDNA MCP server using official stdio format
    mcpConfig.servers['appdna-extension'] = {
        type: 'stdio',
        command: 'node',
        args: [path.join(extensionPath, 'dist', 'mcp', 'server.js')],
        env: {
            // Optional: Add any environment variables needed
            NODE_PATH: path.join(extensionPath, 'node_modules')
        }
    };

    // Write mcp.json file
    fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
    
    console.log('MCP server configured in mcp.json');
}

/**
 * Start the MCP server as a background process
 */
export async function startMcpServerCommand(): Promise<void> {
    try {
        // Check if server is already running
        if (mcpProcess && !mcpProcess.killed) {
            vscode.window.showInformationMessage('MCP Server is already running');
            return;
        }

        // Get the extension's directory (where the compiled server is located)
        const extension = vscode.extensions.getExtension('derivative-programming.appdna');
        if (!extension) {
            vscode.window.showErrorMessage('AppDNA extension not found');
            return;
        }

        const extensionPath = extension.extensionPath;

        // Get the workspace folder (for settings and cwd)
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        // Path to the compiled server in the extension directory
        const serverPath = path.join(extensionPath, 'dist', 'mcp', 'server.js');

        // Check if server file exists
        if (!fs.existsSync(serverPath)) {
            vscode.window.showErrorMessage(`MCP server file not found: ${serverPath}`);
            return;
        }

        // Start the MCP server process
        const { spawn } = await import('child_process');
        mcpProcess = spawn('node', [serverPath], {
            cwd: workspaceFolder.uri.fsPath,
            stdio: ['pipe', 'pipe', 'pipe'],
            detached: false
        });

        // Handle process events
        mcpProcess.on('error', (error) => {
            console.error('MCP Server process error:', error);
            vscode.window.showErrorMessage(`MCP Server failed to start: ${error.message}`);
            mcpProcess = null;
        });

        mcpProcess.on('exit', (code) => {
            console.log(`MCP Server exited with code ${code}`);
            mcpProcess = null;
        });

        // Log output for debugging
        if (mcpProcess.stdout) {
            mcpProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log('MCP Server stdout:', output);
                // Also show in output channel for visibility
                const outputChannel = vscode.window.createOutputChannel('AppDNA MCP Server');
                outputChannel.appendLine(`[STDOUT] ${output}`);
                outputChannel.show();
            });
        }

        if (mcpProcess.stderr) {
            mcpProcess.stderr.on('data', (data) => {
                const output = data.toString();
                console.error('MCP Server stderr:', output);
                // Also show in output channel for visibility
                const outputChannel = vscode.window.createOutputChannel('AppDNA MCP Server');
                outputChannel.appendLine(`[STDERR] ${output}`);
                outputChannel.show();
            });
        }

        // Wait a bit for the server to start
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if process is still running
        if (mcpProcess && !mcpProcess.killed) {
            console.log('MCP Server process started successfully');
        } else {
            vscode.window.showErrorMessage('MCP Server process failed to start');
            return;
        }

        // Configure VS Code settings for MCP
        await configureMcpSettings(workspaceFolder, extensionPath);

        vscode.window.showInformationMessage('MCP Server started successfully');

        // Notify listeners of status change
        if (onStatusChangeCallback) {
            onStatusChangeCallback();
        }

    } catch (error) {
        console.error('Failed to start MCP server:', error);
        vscode.window.showErrorMessage(`Failed to start MCP Server: ${error}`);
    }
}

/**
 * Stop the MCP server
 */
export async function stopMcpServerCommand(): Promise<void> {
    try {
        if (mcpProcess && !mcpProcess.killed) {
            mcpProcess.kill();
            mcpProcess = null;
            vscode.window.showInformationMessage('MCP Server stopped');
            
            // Notify listeners of status change
            if (onStatusChangeCallback) {
                onStatusChangeCallback();
            }
        } else {
            vscode.window.showInformationMessage('MCP Server is not running');
        }
    } catch (error) {
        console.error('Failed to stop MCP server:', error);
        vscode.window.showErrorMessage(`Failed to stop MCP Server: ${error}`);
    }
}
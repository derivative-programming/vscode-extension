// mcpCommands.ts
// Commands for controlling the MCP server
// Created on: May 10, 2025
// This file provides commands to start and stop the MCP server

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { MCPServer } from '../mcp/server';
import { addLogToCommandHistory } from '../utils/commandLog';

/**
 * Command to start the Model Context Protocol server
 */
export async function startMCPServerCommand(): Promise<void> {
    try {
        addLogToCommandHistory("startMCPServerCommand");
        const server = MCPServer.getInstance();
        await server.start();
        
        // Create or update mcp.json configuration if it doesn't exist
        await createOrUpdateMcpConfig();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to start MCP server: ${errorMessage}`);
    }
}

/**
 * Command to stop the Model Context Protocol server
 */
export async function stopMCPServerCommand(): Promise<void> {
    try {
        addLogToCommandHistory("stopMCPServerCommand");
        const server = MCPServer.getInstance();
        server.stop();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to stop MCP server: ${errorMessage}`);
    }
}

/**
 * Create or update the mcp.json configuration file in the .vscode folder
 */
async function createOrUpdateMcpConfig(): Promise<void> {
    try {
        // Get the first workspace folder
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showWarningMessage('No workspace folder found. MCP config will not be created.');
            return;
        }
        
        // Check if we're in a development environment
        const extensionDevelopmentPath = process.env.VSCODE_EXTENSION_DEVELOPMENT_PATH;
        const isDevEnvironment = extensionDevelopmentPath && workspaceFolder.uri.fsPath.includes(extensionDevelopmentPath);
        
        if (isDevEnvironment) {
            console.log('Skipping Copilot configuration in development environment');
            return;
        }

        // Create .vscode folder if it doesn't exist
        const vscodeFolder = path.join(workspaceFolder.uri.fsPath, '.vscode');
        if (!fs.existsSync(vscodeFolder)) {
            fs.mkdirSync(vscodeFolder, { recursive: true });
        }
        
        // Add required GitHub Copilot settings for MCP and register the server
        const settingsPath = path.join(vscodeFolder, 'settings.json');
        let settings = {};
            
        // Read existing settings if available
        if (fs.existsSync(settingsPath)) {
            try {
                const settingsContent = fs.readFileSync(settingsPath, 'utf8');
                settings = JSON.parse(settingsContent);
            } catch (error) {
                console.error(`Error reading settings.json: ${error instanceof Error ? error.message : String(error)}`);
                // Continue with empty settings if parsing fails
            }
        }
        
        // Ensure settings has github.copilot.advanced and mcp.servers sections
        settings = {
            ...settings,
            "github.copilot.advanced": {
                ...(settings["github.copilot.advanced"] || {}),
                "mcp.discovery.enabled": true,
                "mcp.execution.enabled": true
            },
            "mcp": {
                ...((settings["mcp"] || {})),
                "servers": {
                    ...((settings["mcp"] && settings["mcp"]["servers"]) || {}),
                    "AppDNAUserStoryMCP": {
                        "type": "stdio",
                        "command": "${execPath}",
                        "args": [
                            "${workspaceFolder}",
                            "--extensionDevelopmentPath=${execPath}/extensions/TestPublisher.appdna-0.0.1",
                            "--command=appdna.startMCPServer"
                        ]
                    }
                }
            }
        };
            
        // Write updated settings
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
        console.log(`Updated VS Code settings for Copilot MCP integration at ${settingsPath}`);
        
        // Create or update mcp.json for backward compatibility
        const mcpConfigPath = path.join(vscodeFolder, 'mcp.json');
        const mcpConfig = {
            "name": "AppDNA User Story MCP",
            "description": "MCP server for interacting with AppDNA user stories",
            "version": "1.0.0",
            "tools": [
                {
                    "name": "createUserStory",
                    "description": "Creates a user story and validates its format",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "title": {
                                "type": "string",
                                "description": "Title or ID for the user story (optional)"
                            },
                            "description": {
                                "type": "string",
                                "description": "The user story text following one of these formats:\n" +
                                "1. A [Role name] wants to [View all, view, add, update, delete] a [object name]\n" +
                                "2. As a [Role name], I want to [View all, view, add, update, delete] a [object name]"
                            }
                        },
                        "required": ["description"]
                    }
                },
                {
                    "name": "listUserStories",
                    "description": "Lists all user stories",
                    "parameters": {
                        "type": "object",
                        "properties": {}
                    }
                }
            ],
            "server": {
                "type": "stdio"
            }
        };
        
        await fs.promises.writeFile(mcpConfigPath, JSON.stringify(mcpConfig, null, 2), 'utf8');
        vscode.window.showInformationMessage('MCP configuration created successfully');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to create MCP configuration: ${errorMessage}`);
    }
}

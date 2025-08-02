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
        
        // Note: We want MCP configuration to work in development mode too for testing
        console.log(`Creating MCP configuration in ${isDevEnvironment ? 'development' : 'production'} environment`);

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
        
        // Ensure settings has github.copilot.chat.experimental and mcp.servers sections
        const extensionPath = vscode.extensions.getExtension('derivative-programming.appdna')?.extensionPath || 
                             process.env.VSCODE_EXTENSION_DEVELOPMENT_PATH ||
                             path.dirname(__dirname); // fallback to parent of src
        
        settings = {
            ...settings,
            "github.copilot.chat.experimental.mcpServers": {
                ...(settings["github.copilot.chat.experimental.mcpServers"] || {}),
                "appdna": {
                    "command": "node",
                    "args": [path.join(extensionPath, "dist", "mcp", "stdioBridge.js")],
                    "env": {
                        "NODE_ENV": "production",
                        "APPDNA_MCP_MODE": "true"
                    }
                }
            },
            // Keep the legacy format for backward compatibility
            "github.copilot.advanced": {
                ...(settings["github.copilot.advanced"] || {}),
                "mcp.discovery.enabled": true,
                "mcp.execution.enabled": true
            },            "mcp.servers": {
                ...((settings["mcp.servers"] || {})),
                "AppDNAUserStoryMCP": {
                    "type": "stdio",
                    "command": "node",
                    "args": [path.join(extensionPath, "dist", "mcp", "stdioBridge.js")],
                    "env": {
                        "APPDNA_MCP_MODE": "true"
                    },
                    "transport": "stdio",
                    "enabled": true
                }
            }
        };
            
        // Write updated settings
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
        console.log(`Updated VS Code settings for Copilot MCP integration at ${settingsPath}`);
        
        // Create or update mcp.json for backward compatibility and debugging
        const mcpConfigPath = path.join(vscodeFolder, 'mcp.json');
        const mcpConfig = {
            "mcpVersion": "2024-11-05",
            "name": "AppDNA User Story MCP Server",
            "description": "MCP server for interacting with AppDNA user stories and model data",
            "version": "1.0.10",
            "capabilities": {
                "tools": {
                    "listChanged": false
                },
                "logging": {},
                "prompts": {
                    "listChanged": false
                },
                "resources": {
                    "subscribe": false,
                    "listChanged": false
                }
            },
            "tools": [
                {
                    "name": "create_user_story",
                    "description": "Creates a user story and validates its format. User stories must follow the format: 'As a [Role], I want to [action] a [object]' or 'A [Role] wants to [action] a [object]'",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "title": {
                                "type": "string",
                                "description": "Optional title or ID for the user story"
                            },
                            "description": {
                                "type": "string",
                                "description": "The user story text following one of the supported formats"
                            }
                        },
                        "required": ["description"]
                    }
                },
                {
                    "name": "list_user_stories",
                    "description": "Lists all existing user stories from the AppDNA model",
                    "inputSchema": {
                        "type": "object",
                        "properties": {},
                        "additionalProperties": false
                    }
                }
            ],
            "server": {
                "type": "stdio",
                "command": "node",
                "args": [path.join(extensionPath, "dist", "mcp", "stdioBridge.js")]
            }
        };
        
        await fs.promises.writeFile(mcpConfigPath, JSON.stringify(mcpConfig, null, 2), 'utf8');
        vscode.window.showInformationMessage('MCP configuration created successfully');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to create MCP configuration: ${errorMessage}`);
    }
}

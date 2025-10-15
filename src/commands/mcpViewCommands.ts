// mcpViewCommands.ts
// MCP-specific commands for opening views
// Created on: October 15, 2025
// These commands are NOT in the command palette - they're only for MCP use
// They provide MCP-friendly parameters (strings, not complex objects)

import * as vscode from 'vscode';
import { ModelService } from '../services/modelService';

/**
 * Register MCP-specific view commands
 * These commands are NOT in package.json contributes.commands
 * They are hidden from the command palette but callable via executeCommand()
 */
export function registerMcpViewCommands(context: vscode.ExtensionContext): void {
    const modelService = ModelService.getInstance();

    // Open user stories view
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openUserStories', async (initialTab?: string) => {
            // Delegate to existing command
            return vscode.commands.executeCommand('appdna.showUserStories', initialTab);
        })
    );

    // Open user stories dev view
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openUserStoriesDev', async () => {
            return vscode.commands.executeCommand('appdna.userStoriesDev');
        })
    );

    // Open user stories QA view
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openUserStoriesQA', async () => {
            return vscode.commands.executeCommand('appdna.userStoriesQA');
        })
    );

    // Open user stories journey view
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openUserStoriesJourney', async () => {
            return vscode.commands.executeCommand('appdna.userStoriesJourney');
        })
    );

    // Open user stories page mapping view
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openUserStoriesPageMapping', async () => {
            return vscode.commands.executeCommand('appdna.userStoriesPageMapping');
        })
    );

    // Open object details by name (MCP-friendly - takes string instead of tree item)
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openObjectDetails', async (objectName: string, initialTab?: string) => {
            if (!modelService.isFileLoaded()) {
                throw new Error('No App DNA file is currently loaded');
            }

            // Find the object in the model
            const objects = modelService.getAllObjects();
            const object = objects.find(o => o.name === objectName);
            
            if (!object) {
                throw new Error(`Object '${objectName}' not found. Available objects: ${objects.map(o => o.name).join(', ')}`);
            }
            
            // Create a mock tree item for the object
            const mockTreeItem = {
                label: objectName,
                resourceType: 'object',
                nodeType: 'object',
                contextValue: 'object'
            };
            
            // Open the details view
            return vscode.commands.executeCommand('appdna.showDetails', mockTreeItem, initialTab);
        })
    );

    // Open hierarchy diagram
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openHierarchyDiagram', async () => {
            return vscode.commands.executeCommand('appdna.showHierarchyDiagram');
        })
    );

    // Open page flow diagram
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openPageFlowDiagram', async () => {
            return vscode.commands.executeCommand('appdna.showPageFlowDiagram');
        })
    );

    // Open welcome screen
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openWelcome', async () => {
            return vscode.commands.executeCommand('appdna.showWelcome');
        })
    );

    // Open settings view
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openSettings', async () => {
            return vscode.commands.executeCommand('appdna.showAppDNASettings');
        })
    );

    // Generic view opener - routes to specific commands based on view name
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.mcp.openView', async (viewName: string, params?: any) => {
            const viewMap: Record<string, string> = {
                'user-stories': 'appdna.mcp.openUserStories',
                'user-stories-dev': 'appdna.mcp.openUserStoriesDev',
                'user-stories-qa': 'appdna.mcp.openUserStoriesQA',
                'user-stories-journey': 'appdna.mcp.openUserStoriesJourney',
                'user-stories-page-mapping': 'appdna.mcp.openUserStoriesPageMapping',
                'object-details': 'appdna.mcp.openObjectDetails',
                'hierarchy': 'appdna.mcp.openHierarchyDiagram',
                'page-flow': 'appdna.mcp.openPageFlowDiagram',
                'welcome': 'appdna.mcp.openWelcome',
                'settings': 'appdna.mcp.openSettings'
            };
            
            const command = viewMap[viewName];
            if (!command) {
                throw new Error(`Unknown view: ${viewName}. Available views: ${Object.keys(viewMap).join(', ')}`);
            }
            
            // Extract arguments from params
            const args = params?.args || [];
            
            return vscode.commands.executeCommand(command, ...args);
        })
    );

    console.log('[MCP View Commands] Registered successfully');
}

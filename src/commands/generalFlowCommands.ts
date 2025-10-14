// SEARCH_TAG: general flow commands for VS Code extension
// General Flow-related command implementations.
// Created: 2025-08-31
// Last modified: 2025-08-31

import * as vscode from 'vscode';
import { JsonTreeItem } from '../models/types';

// Import from the JavaScript wrapper (following form details pattern)
const generalFlowDetailsView = require('../webviews/generalFlow/generalFlowDetailsView');
// Import the Add General Flow Wizard webview
const { showAddGeneralFlowWizard } = require('../webviews/addGeneralFlowWizardView');

/**
 * Command handler for showing general flow details
 * @param item The tree item representing the general flow
 * @param modelService The ModelService instance
 * @param context The extension context
 */
export async function showGeneralFlowDetailsCommand(item: JsonTreeItem, modelService: any, context?: any): Promise<void> {
    try {
        // Ensure the generalFlowDetailsView module is loaded correctly
        if (!generalFlowDetailsView || typeof generalFlowDetailsView.showGeneralFlowDetails !== 'function') {
            vscode.window.showErrorMessage('Failed to load generalFlowDetailsView module. Please check the extension setup.');
            return;
        }

        // Use the generalFlowDetailsView implementation with modelService and context
        generalFlowDetailsView.showGeneralFlowDetails(item, modelService, context);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error showing general flow details:', errorMessage);
        vscode.window.showErrorMessage(`Failed to open General Flow Details: ${errorMessage}`);
    }
}

/**
 * Command handler for adding a general flow using the wizard
 * @param modelService The ModelService instance
 * @param context The extension context
 */
export async function addGeneralFlowCommand(modelService: any, context: vscode.ExtensionContext): Promise<void> {
    if (!modelService || !modelService.isFileLoaded()) {
        vscode.window.showErrorMessage('No model file is loaded. Please open or create a model file first.');
        return;
    }
    
    try {
        // Show the add general flow wizard
        showAddGeneralFlowWizard(modelService, context);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error showing add general flow wizard:', errorMessage);
        vscode.window.showErrorMessage(`Failed to open Add General Flow Wizard: ${errorMessage}`);
    }
}

/**
 * Register all general flow-related commands
 * @param context The extension context
 * @param modelService The ModelService instance
 */
export function registerGeneralFlowCommands(context: vscode.ExtensionContext, modelService: any): void {
    // Register the command to show general flow details
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showGeneralFlowDetails', (node: JsonTreeItem) => {
            showGeneralFlowDetailsCommand(node, modelService, context);
        })
    );
    
    // Register the command to add a general flow
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.addGeneralFlow', () => {
            addGeneralFlowCommand(modelService, context);
        })
    );
}

// SEARCH_TAG: form commands for VS Code extension
// Form-related command implementations.
// Created: 2025-01-13
// Last modified: 2025-01-13

import * as vscode from 'vscode';
import { JsonTreeItem } from '../models/types';

// Import from the JavaScript wrapper (following report details pattern)
const formDetailsView = require('../webviews/formDetailsView');
// Import the Add Form Wizard webview
const { showAddFormWizard } = require('../webviews/addFormWizardView');

/**
 * Command handler for showing form details
 * @param item The tree item representing the form
 * @param modelService The ModelService instance
 * @param context The extension context
 */
export async function showFormDetailsCommand(item: JsonTreeItem, modelService: any, context?: any): Promise<void> {
    try {
        // Ensure the formDetailsView module is loaded correctly
        if (!formDetailsView || typeof formDetailsView.showFormDetails !== 'function') {
            vscode.window.showErrorMessage('Failed to load formDetailsView module. Please check the extension setup.');
            return;
        }

        // Use the formDetailsView implementation with modelService and context
        formDetailsView.showFormDetails(item, modelService, context);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error showing form details:', errorMessage);
        vscode.window.showErrorMessage(`Failed to open Form Details: ${errorMessage}`);
    }
}

/**
 * Command handler for adding a form using the wizard
 * @param modelService The ModelService instance
 */
export async function addFormCommand(modelService: any): Promise<void> {
    if (!modelService || !modelService.isFileLoaded()) {
        vscode.window.showErrorMessage('No model file is loaded. Please open or create a model file first.');
        return;
    }
    
    try {
        // Show the add form wizard
        showAddFormWizard(modelService);
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to open Add Form Wizard: ${errorMessage}`);
    }
}

/**
 * Register all form-related commands
 * @param context The extension context
 * @param modelService The ModelService instance
 */
export function registerFormCommands(context: vscode.ExtensionContext, modelService: any): void {
    // Register the command to show form details
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showFormDetails', (node: JsonTreeItem) => {
            showFormDetailsCommand(node, modelService);
        })
    );
    
    // Register the command to add a form
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.addForm', () => {
            addFormCommand(modelService);
        })
    );
}

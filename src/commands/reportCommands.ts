// SEARCH_TAG: report commands for VS Code extension
// Report-related command implementations.
// Created: 2025-01-27
// Last modified: 2025-06-15

import * as vscode from 'vscode';
import { JsonTreeItem } from '../models/types';

// Import from the JavaScript wrapper (following object details pattern)
const reportDetailsView = require('../webviews/reports/reportDetailsView');
// Import the Add Report Wizard webview
const { showAddReportWizard } = require('../webviews/addReportWizardView');

/**
 * Command handler for showing report details
 * @param item The tree item representing the report
 * @param modelService The ModelService instance
 * @param context The extension context
 * @param initialTab Optional tab to open initially
 */
export async function showReportDetailsCommand(item: JsonTreeItem, modelService: any, context?: vscode.ExtensionContext, initialTab?: string): Promise<void> {
    try {
        console.log(`[showReportDetailsCommand] Called with initialTab: ${initialTab}`);
        
        // Ensure the reportDetailsView module is loaded correctly
        if (!reportDetailsView || typeof reportDetailsView.showReportDetails !== 'function') {
            vscode.window.showErrorMessage('Failed to load reportDetailsView module. Please check the extension setup.');
            return;
        }

        // Use the reportDetailsView implementation with modelService and context
        reportDetailsView.showReportDetails(item, modelService, context, initialTab);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error showing report details:', errorMessage);
        vscode.window.showErrorMessage(`Failed to open Report Details: ${errorMessage}`);
    }
}

/**
 * Command handler for adding a report using the wizard
 * @param modelService The ModelService instance
 * @param context The extension context
 */
export async function addReportCommand(modelService: any, context: vscode.ExtensionContext): Promise<void> {
    if (!modelService || !modelService.isFileLoaded()) {
        vscode.window.showErrorMessage('No model file is loaded. Please open or create a model file first.');
        return;
    }
    
    try {
        // Show the add report wizard
        showAddReportWizard(modelService, context);
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to open Add Report Wizard: ${errorMessage}`);
    }
}

/**
 * Register all report-related commands
 * @param context The extension context
 * @param modelService The ModelService instance
 */
export function registerReportCommands(context: vscode.ExtensionContext, modelService: any): void {
    // Register the command to show report details
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showReportDetails', (node: JsonTreeItem, initialTab?: string) => {
            showReportDetailsCommand(node, modelService, context, initialTab);
        })
    );
    
    // Register the command to add a new report
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.addReport', () => {
            addReportCommand(modelService, context);
        })
    );
}

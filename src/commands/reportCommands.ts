// SEARCH_TAG: report commands for VS Code extension
// Report-related command implementations.
// Created: 2025-01-27
// Last modified: 2025-01-27

import * as vscode from 'vscode';
import { JsonTreeItem } from '../models/types';

// Import from the JavaScript wrapper (following object details pattern)
const reportDetailsView = require('../webviews/reportDetailsView');

/**
 * Register all report-related commands
 * @param context The extension context
 * @param modelService The ModelService instance
 */
export function registerReportCommands(context: vscode.ExtensionContext, modelService: any): void {
    // Register the command to show report details
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showReportDetails', (node: JsonTreeItem) => {
            // Ensure the reportDetailsView module is loaded correctly
            if (!reportDetailsView || typeof reportDetailsView.showReportDetails !== 'function') {
                vscode.window.showErrorMessage('Failed to load reportDetailsView module. Please check the extension setup.');
                return;
            }

            // Use the reportDetailsView implementation with modelService only
            reportDetailsView.showReportDetails(node, modelService);
        })
    );
}

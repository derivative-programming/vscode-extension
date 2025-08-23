// SEARCH_TAG: API commands for VS Code extension
// API-related command implementations.
// Created: 2025-01-22
// Last modified: 2025-01-22

import * as vscode from 'vscode';
import { JsonTreeItem } from '../models/types';

// Import from the JavaScript wrapper (following form details pattern)
const apiDetailsView = require('../webviews/apis/apiDetailsView');

/**
 * Command handler for showing API details
 * @param item The tree item representing the API site
 * @param modelService The ModelService instance
 * @param context The extension context
 */
export async function showApiDetailsCommand(item: JsonTreeItem, modelService: any, context?: any): Promise<void> {
    try {
        // Ensure the apiDetailsView module is loaded correctly
        if (!apiDetailsView || typeof apiDetailsView.showApiDetails !== 'function') {
            vscode.window.showErrorMessage('Failed to load apiDetailsView module. Please check the extension setup.');
            return;
        }

        // Use the apiDetailsView implementation with modelService and context
        apiDetailsView.showApiDetails(item, modelService, context);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error showing API details:', errorMessage);
        vscode.window.showErrorMessage(`Failed to open API Details: ${errorMessage}`);
    }
}
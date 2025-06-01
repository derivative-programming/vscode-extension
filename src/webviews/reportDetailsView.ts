"use strict";

import * as vscode from 'vscode';
import { JsonTreeItem } from '../models/types';

// Import the JavaScript wrapper for enhanced functionality
const reportDetailsWrapper = require('./reportDetailsView');

/**
 * Shows report details in a webview
 * @param item The tree item representing the report
 * @param modelService ModelService instance
 */
export function showReportDetails(item: JsonTreeItem, modelService: any): void {
    console.log(`TypeScript wrapper called for ${item.label}`);
    
    try {
        // Use the JavaScript implementation for enhanced functionality
        reportDetailsWrapper.showReportDetails(item, modelService);
    } catch (error) {
        console.error("Error showing report details:", error);
        vscode.window.showErrorMessage(`Failed to show report details: ${error}`);
    }
}

/**
 * Refreshes all open report details webviews with the latest model data
 */
export function refreshAll(): void {
    try {
        reportDetailsWrapper.refreshAll();
    } catch (error) {
        console.error("Error refreshing report details:", error);
    }
}

/**
 * Gets currently open panel items
 * @returns Array of open panel items
 */
export function getOpenPanelItems(): JsonTreeItem[] {
    try {
        return reportDetailsWrapper.getOpenPanelItems();
    } catch (error) {
        console.error("Error getting open panel items:", error);
        return [];
    }
}

/**
 * Closes all open panels
 */
export function closeAllPanels(): void {
    try {
        reportDetailsWrapper.closeAllPanels();
    } catch (error) {
        console.error("Error closing all panels:", error);
    }
}

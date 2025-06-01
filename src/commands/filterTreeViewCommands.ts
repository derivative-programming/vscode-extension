// SEARCH_TAG: filter commands for tree view
// Provides commands to filter the tree view by name.

import * as vscode from 'vscode';
import { JsonTreeDataProvider } from '../providers/jsonTreeDataProvider';

/**
 * Shows a filter input box to filter the tree view items by name
 * @param treeDataProvider The tree data provider to apply the filter to
 */
export async function showFilterInputCommand(treeDataProvider: JsonTreeDataProvider): Promise<void> {
    // Show input box to enter filter text
    const filterText = await vscode.window.showInputBox({
        placeHolder: 'Filter by name (case insensitive)',
        prompt: 'Enter text to filter tree view items',
        value: '',
    });

    // If user cancels or provides empty text, don't apply filter
    if (filterText === undefined) {
        return;
    }

    if (filterText === '') {
        // If empty text is provided, clear the filter
        clearFilterCommand(treeDataProvider);
    } else {
        // Apply the filter
        treeDataProvider.setFilter(filterText);
    }
}

/**
 * Clears the current filter from the tree view
 * @param treeDataProvider The tree data provider to clear the filter from
 */
export function clearFilterCommand(treeDataProvider: JsonTreeDataProvider): void {
    treeDataProvider.clearFilter();
}

/**
 * Shows a filter input box to filter only the report items by name
 * @param treeDataProvider The tree data provider to apply the report filter to
 */
export async function showReportFilterInputCommand(treeDataProvider: JsonTreeDataProvider): Promise<void> {
    // Show input box to enter filter text
    const filterText = await vscode.window.showInputBox({
        placeHolder: 'Filter reports by name (case insensitive)',
        prompt: 'Enter text to filter report items',
        value: '',
    });

    // If user cancels or provides empty text, don't apply filter
    if (filterText === undefined) {
        return;
    }

    if (filterText === '') {
        // If empty text is provided, clear the filter
        clearReportFilterCommand(treeDataProvider);
    } else {
        // Apply the report filter
        treeDataProvider.setReportFilter(filterText);
    }
}

/**
 * Clears the current report filter from the tree view
 * @param treeDataProvider The tree data provider to clear the report filter from
 */
export function clearReportFilterCommand(treeDataProvider: JsonTreeDataProvider): void {
    treeDataProvider.clearReportFilter();
}
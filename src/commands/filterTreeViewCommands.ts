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

/**
 * Shows a filter input box to filter only the data object items by name
 * @param treeDataProvider The tree data provider to apply the data object filter to
 */
export async function showDataObjectFilterInputCommand(treeDataProvider: JsonTreeDataProvider): Promise<void> {
    // Show input box to enter filter text
    const filterText = await vscode.window.showInputBox({
        placeHolder: 'Filter data objects by name (case insensitive)',
        prompt: 'Enter text to filter data object items',
        value: '',
    });

    // If user cancels or provides empty text, don't apply filter
    if (filterText === undefined) {
        return;
    }

    if (filterText === '') {
        // If empty text is provided, clear the filter
        clearDataObjectFilterCommand(treeDataProvider);
    } else {
        // Apply the data object filter
        treeDataProvider.setDataObjectFilter(filterText);
    }
}

/**
 * Clears the current data object filter from the tree view
 * @param treeDataProvider The tree data provider to clear the data object filter from
 */
export function clearDataObjectFilterCommand(treeDataProvider: JsonTreeDataProvider): void {
    treeDataProvider.clearDataObjectFilter();
}

/**
 * Shows a filter input box to filter only the form items by name
 * @param treeDataProvider The tree data provider to apply the form filter to
 */
export async function showFormFilterInputCommand(treeDataProvider: JsonTreeDataProvider): Promise<void> {
    // Show input box to enter filter text
    const filterText = await vscode.window.showInputBox({
        placeHolder: 'Filter forms by name (case insensitive)',
        prompt: 'Enter text to filter form items',
        value: '',
    });

    // If user cancels or provides empty text, don't apply filter
    if (filterText === undefined) {
        return;
    }

    if (filterText === '') {
        // If empty text is provided, clear the filter
        clearFormFilterCommand(treeDataProvider);
    } else {
        // Apply the form filter
        treeDataProvider.setFormFilter(filterText);
    }
}

/**
 * Clears the current form filter from the tree view
 * @param treeDataProvider The tree data provider to clear the form filter from
 */
export function clearFormFilterCommand(treeDataProvider: JsonTreeDataProvider): void {
    treeDataProvider.clearFormFilter();
}
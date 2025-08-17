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

/**
 * Shows a filter input box to filter only the page init items by name
 * @param treeDataProvider The tree data provider to apply the page init filter to
 */
export async function showPageInitFilterInputCommand(treeDataProvider: JsonTreeDataProvider): Promise<void> {
    // Show input box to enter filter text
    const filterText = await vscode.window.showInputBox({
        placeHolder: 'Filter page init items by name (case insensitive)',
        prompt: 'Enter text to filter page init items',
        value: '',
    });

    // If user cancels or provides empty text, don't apply filter
    if (filterText === undefined) {
        return;
    }

    if (filterText === '') {
        // If empty text is provided, clear the filter
        clearPageInitFilterCommand(treeDataProvider);
    } else {
        // Apply the page init filter
        treeDataProvider.setPageInitFilter(filterText);
    }
}

/**
 * Clears the current page init filter from the tree view
 * @param treeDataProvider The tree data provider to clear the page init filter from
 */
export function clearPageInitFilterCommand(treeDataProvider: JsonTreeDataProvider): void {
    treeDataProvider.clearPageInitFilter();
}

/**
 * Shows a filter input box to filter only the workflows items by name
 * @param treeDataProvider The tree data provider to apply the workflows filter to
 */
export async function showWorkflowsFilterInputCommand(treeDataProvider: JsonTreeDataProvider): Promise<void> {
    // Show input box to enter filter text
    const filterText = await vscode.window.showInputBox({
        placeHolder: 'Filter workflows by name (case insensitive)',
        prompt: 'Enter text to filter workflows items',
        value: '',
    });

    // If user cancels or provides empty text, don't apply filter
    if (filterText === undefined) {
        return;
    }

    if (filterText === '') {
        // If empty text is provided, clear the filter
        clearWorkflowsFilterCommand(treeDataProvider);
    } else {
        // Apply the workflows filter
        treeDataProvider.setWorkflowsFilter(filterText);
    }
}

/**
 * Clears the current workflows filter from the tree view
 * @param treeDataProvider The tree data provider to clear the workflows filter from
 */
export function clearWorkflowsFilterCommand(treeDataProvider: JsonTreeDataProvider): void {
    treeDataProvider.clearWorkflowsFilter();
}

/**
 * Shows a filter input box to filter only the workflow tasks items by name
 * @param treeDataProvider The tree data provider to apply the workflow tasks filter to
 */
export async function showWorkflowTasksFilterInputCommand(treeDataProvider: JsonTreeDataProvider): Promise<void> {
    // Show input box to enter filter text
    const filterText = await vscode.window.showInputBox({
        placeHolder: 'Filter workflow tasks by name (case insensitive)',
        prompt: 'Enter text to filter workflow tasks items',
        value: '',
    });

    // If user cancels or provides empty text, don't apply filter
    if (filterText === undefined) {
        return;
    }

    if (filterText === '') {
        // If empty text is provided, clear the filter
        clearWorkflowTasksFilterCommand(treeDataProvider);
    } else {
        // Apply the workflow tasks filter
        treeDataProvider.setWorkflowTasksFilter(filterText);
    }
}

/**
 * Clears the current workflow tasks filter from the tree view
 * @param treeDataProvider The tree data provider to clear the workflow tasks filter from
 */
export function clearWorkflowTasksFilterCommand(treeDataProvider: JsonTreeDataProvider): void {
    treeDataProvider.clearWorkflowTasksFilter();
}

/**
 * Shows a filter input box to filter only the general items by name
 * @param treeDataProvider The tree data provider to apply the general filter to
 */
export async function showGeneralFilterInputCommand(treeDataProvider: JsonTreeDataProvider): Promise<void> {
    // Show input box to enter filter text
    const filterText = await vscode.window.showInputBox({
        placeHolder: 'Filter general workflows by name (case insensitive)',
        prompt: 'Enter text to filter general workflow items',
        value: '',
    });

    // If user cancels or provides empty text, don't apply filter
    if (filterText === undefined) {
        return;
    }

    if (filterText === '') {
        // If empty text is provided, clear the filter
        clearGeneralFilterCommand(treeDataProvider);
    } else {
        // Apply the general filter
        treeDataProvider.setGeneralFilter(filterText);
    }
}

/**
 * Clears the current general filter from the tree view
 * @param treeDataProvider The tree data provider to clear the general filter from
 */
export function clearGeneralFilterCommand(treeDataProvider: JsonTreeDataProvider): void {
    treeDataProvider.clearGeneralFilter();
}
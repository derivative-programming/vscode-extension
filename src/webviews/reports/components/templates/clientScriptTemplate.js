"use strict";

// Import required script modules
const { getUIEventHandlers } = require("../scripts/uiEventHandlers");
const { getFormControlUtilities } = require("../scripts/formControlUtilities");
const { getButtonManagementFunctions } = require("../scripts/buttonManagementFunctions");
const { getColumnManagementFunctions } = require("../scripts/columnManagementFunctions");
const { getParameterManagementFunctions } = require("../scripts/parameterManagementFunctions");
const { getDOMInitialization } = require("../scripts/domInitialization");
const { getModalFunctionality } = require("../scripts/modalFunctionality");
const { getAddColumnModalHtml } = require("./addColumnModalTemplate");

/**
 * File: clientScriptTemplate.js
 * Purpose: Generates client-side JavaScript for the report details view using modular architecture
 * Created: 2025-07-06
 * Modified: 2025-07-06 - Refactored to use modular pattern like objects view
 */

/**
 * Generates JavaScript code for client-side functionality
 * @param {Array} columns The report columns
 * @param {Array} buttons The report buttons
 * @param {Array} params The report parameters
 * @param {Object} columnSchema Schema for columns
 * @param {Object} buttonSchema Schema for buttons
 * @param {Object} paramSchema Schema for parameters
 * @param {string} reportName The name of the report
 * @returns {string} JavaScript code
 */
function getClientScriptTemplate(columns, buttons, params, columnSchema, buttonSchema, paramSchema, reportName) {
    return `
        (function() {
            // Core data and API (vscode API already acquired in main template)
            // const vscode = acquireVsCodeApi(); // Already available from main template
            
            // Store current data
            let currentColumns = ${JSON.stringify(columns)};
            let currentButtons = ${JSON.stringify(buttons)};
            let currentParams = ${JSON.stringify(params)};
            let currentEditingIndex = -1;
            
            // Schema data
            const columnSchema = ${JSON.stringify(columnSchema)};
            const buttonSchema = ${JSON.stringify(buttonSchema)};
            const paramSchema = ${JSON.stringify(paramSchema)};
            const reportName = "${reportName || ''}";

            // Modal functionality for add modals
            ${getModalFunctionality()}
            
            // Add Column Modal Template Function
            function getAddColumnModalHtml() {
                return \`${getAddColumnModalHtml()}\`;
            }
            
            // Page Preview Function
            function openPagePreview(reportName, isPage) {
                console.log('[DEBUG] ReportDetails - Open page preview requested for report name:', JSON.stringify(reportName));
                console.log('[DEBUG] ReportDetails - isPage:', isPage);
                
                if (vscode && reportName) {
                    vscode.postMessage({
                        command: 'openPagePreview',
                        formName: reportName
                    });
                } else {
                    console.warn('[WARN] ReportDetails - Cannot open page preview: vscode API or report name not available');
                }
            }
            
            // Make function globally available
            window.openPagePreview = openPagePreview;

            // UI Event Handlers for tabs and view switching
            ${getUIEventHandlers()}

            // Form Control Utilities
            ${getFormControlUtilities()}

            // Button Management Functions
            ${getButtonManagementFunctions()}

            // Column Management Functions  
            ${getColumnManagementFunctions()}

            // Parameter Management Functions
            ${getParameterManagementFunctions()}

            // DOM Initialization
            ${getDOMInitialization()}
            
            // Message handlers for list refresh updates
            window.addEventListener('message', event => {
                const message = event.data;
                
                switch (message.command) {
                    case 'refreshColumnsList':
                        refreshColumnsList(message.data, message.newSelection);
                        break;
                    case 'refreshButtonsList':
                        refreshButtonsList(message.data, message.newSelection);
                        break;
                    case 'refreshParamsList':
                        refreshParamsList(message.data, message.newSelection);
                        break;
                    case 'restoreTab':
                        // Restore the active tab after view reload
                        restoreActiveTab(message.tabId, message.newColumnIndex);
                        break;
                }
            });
            
            // List refresh functions
            function refreshColumnsList(newColumns, newSelection = null) {
                const columnsList = document.getElementById('columnsList');
                if (columnsList) {
                    // Update the currentColumns array
                    currentColumns = newColumns;
                    
                    const currentSelection = newSelection !== null ? newSelection : columnsList.selectedIndex;
                    columnsList.innerHTML = '';
                    newColumns.forEach((column, index) => {
                        const option = document.createElement('option');
                        option.value = index;
                        option.textContent = column.name || 'Unnamed Column';
                        columnsList.appendChild(option);
                    });
                    
                    // Restore selection if still valid
                    if (currentSelection >= 0 && currentSelection < newColumns.length) {
                        columnsList.selectedIndex = currentSelection;
                        
                        // Trigger the change event to update the details view
                        columnsList.dispatchEvent(new Event('change'));
                    }
                    
                    // Update move button states
                    const moveUpButton = document.getElementById('moveUpColumnsButton');
                    const moveDownButton = document.getElementById('moveDownColumnsButton');
                    if (moveUpButton && moveDownButton) {
                        updateMoveButtonStates(columnsList, moveUpButton, moveDownButton);
                    }
                    
                    console.log('[DEBUG] Columns list refreshed with', newColumns.length, 'items');
                }
            }
            
            function refreshButtonsList(newButtons, newSelection = null) {
                const buttonsList = document.getElementById('buttonsList');
                if (buttonsList) {
                    // Update the currentButtons array
                    currentButtons = newButtons;
                    
                    const currentSelection = newSelection !== null ? newSelection : buttonsList.selectedIndex;
                    buttonsList.innerHTML = '';
                    newButtons.forEach((button, index) => {
                        const option = document.createElement('option');
                        option.value = index;
                        option.textContent = button.buttonName || 'Unnamed Button';
                        buttonsList.appendChild(option);
                    });
                    
                    // Restore selection if still valid
                    if (currentSelection >= 0 && currentSelection < newButtons.length) {
                        buttonsList.selectedIndex = currentSelection;
                        
                        // Trigger the change event to update the details view
                        buttonsList.dispatchEvent(new Event('change'));
                    }
                    
                    // Update move button states
                    const moveUpButton = document.getElementById('moveUpButtonsButton');
                    const moveDownButton = document.getElementById('moveDownButtonsButton');
                    if (moveUpButton && moveDownButton) {
                        updateMoveButtonStates(buttonsList, moveUpButton, moveDownButton);
                    }
                    
                    console.log('[DEBUG] Buttons list refreshed with', newButtons.length, 'items');
                }
            }
            
            function refreshParamsList(newParams, newSelection = null) {
                const paramsList = document.getElementById('paramsList');
                if (paramsList) {
                    // Update the currentParams array
                    currentParams = newParams;
                    
                    const currentSelection = newSelection !== null ? newSelection : paramsList.selectedIndex;
                    paramsList.innerHTML = '';
                    newParams.forEach((param, index) => {
                        const option = document.createElement('option');
                        option.value = index;
                        option.textContent = param.name || 'Unnamed Parameter';
                        paramsList.appendChild(option);
                    });
                    
                    // Restore selection if still valid
                    if (currentSelection >= 0 && currentSelection < newParams.length) {
                        paramsList.selectedIndex = currentSelection;
                        
                        // Trigger the change event to update the details view
                        paramsList.dispatchEvent(new Event('change'));
                    }
                    
                    // Update move button states
                    const moveUpButton = document.getElementById('moveUpParamsButton');
                    const moveDownButton = document.getElementById('moveDownParamsButton');
                    if (moveUpButton && moveDownButton) {
                        updateMoveButtonStates(paramsList, moveUpButton, moveDownButton);
                    }
                    
                    console.log('[DEBUG] Params list refreshed with', newParams.length, 'items');
                }
            }
            
            // Update move button states helper function (must be defined here for refresh functions)
            function updateMoveButtonStates(listElement, moveUpButton, moveDownButton) {
                if (!listElement || !moveUpButton || !moveDownButton) return;
                
                const selectedIndex = listElement.selectedIndex;
                const hasSelection = selectedIndex >= 0;
                const isFirstItem = selectedIndex === 0;
                const isLastItem = selectedIndex === listElement.options.length - 1;
                
                // Disable both buttons if no selection
                if (!hasSelection) {
                    moveUpButton.disabled = true;
                    moveDownButton.disabled = true;
                } else {
                    // Enable/disable based on position
                    moveUpButton.disabled = isFirstItem;
                    moveDownButton.disabled = isLastItem;
                }
            }
            
            // Function to restore active tab and optionally select a specific column
            function restoreActiveTab(tabId, newColumnIndex) {
                // Restore the active tab
                if (tabId) {
                    const tab = document.querySelector('.tab[data-tab="' + tabId + '"]');
                    const tabContent = document.getElementById(tabId);
                    
                    if (tab && tabContent) {
                        // Remove active class from all tabs and content
                        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                        
                        // Add active class to the correct tab and content
                        tab.classList.add('active');
                        tabContent.classList.add('active');
                        
                        console.log('[DEBUG] Restored active tab:', tabId);
                    }
                }
                
                // If newColumnIndex is provided and we're on the columns tab, select the new column
                if (typeof newColumnIndex === 'number' && newColumnIndex >= 0 && tabId === 'columns') {
                    const columnsList = document.getElementById('columnsList');
                    if (columnsList && columnsList.options.length > newColumnIndex) {
                        columnsList.selectedIndex = newColumnIndex;
                        
                        // Trigger the change event to show column details
                        columnsList.dispatchEvent(new Event('change'));
                        
                        // Update move button states
                        const moveUpButton = document.getElementById('moveUpColumnsButton');
                        const moveDownButton = document.getElementById('moveDownColumnsButton');
                        if (moveUpButton && moveDownButton) {
                            updateMoveButtonStates(columnsList, moveUpButton, moveDownButton);
                        }
                        
                        console.log('[DEBUG] Selected newly added column at index:', newColumnIndex);
                    }
                }
            }

        })();
    `;
}

module.exports = {
    getClientScriptTemplate
};

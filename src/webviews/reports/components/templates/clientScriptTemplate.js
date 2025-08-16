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
const { getAddButtonModalHtml } = require("./addButtonModalTemplate");
const { getAddParamModalHtml } = require("./addParamModalTemplate");
const { getPageSearchModalHtml } = require("./pageSearchModalTemplate");
const { getPageSearchModalFunctionality } = require("./pageSearchModalFunctionality");
const { getDataObjectSearchModalHtml } = require("./dataObjectSearchModalTemplate");
const { getDataObjectSearchModalFunctionality } = require("./dataObjectSearchModalFunctionality");

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
 * @param {Array} allForms Array of all available forms for page search modal
 * @param {Array} allReports Array of all available reports for page search modal
 * @param {Array} allDataObjects Array of all available data objects for object search (optional)
 * @returns {string} JavaScript code
 */
function getClientScriptTemplate(columns, buttons, params, columnSchema, buttonSchema, paramSchema, reportName, allForms = [], allReports = [], allDataObjects = []) {
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
            
            // Forms and Reports data for page search modal
            const allForms = ${JSON.stringify(allForms)};
            const allReports = ${JSON.stringify(allReports)};
            
            // Data objects for data object search modal
            const allDataObjects = ${JSON.stringify(allDataObjects)};

            // Modal functionality for add modals
            ${getModalFunctionality()}
            
            // Add Column Modal Template Function
            function getAddColumnModalHtml() {
                return \`${getAddColumnModalHtml()}\`;
            }
            
            // Add Button Modal Template Function
            function getAddButtonModalHtml() {
                return \`${getAddButtonModalHtml()}\`;
            }
            
            // Add Param Modal Template Function
            function getAddParamModalHtml() {
                return \`${getAddParamModalHtml()}\`;
            }
            
            // Page Search Modal Template Function
            function getPageSearchModalHtml() {
                return \`${getPageSearchModalHtml()}\`;
            }
            
            // Data Object Search Modal Template Function
            function getDataObjectSearchModalHtml() {
                return \`${getDataObjectSearchModalHtml()}\`;
            }
            
            ${getPageSearchModalFunctionality()}
            
            ${getDataObjectSearchModalFunctionality()}
            
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
            
            // Owner Object Details Function
            function openOwnerObjectDetails(objectName) {
                console.log('[DEBUG] ReportDetails - Open owner object details requested for object name:', JSON.stringify(objectName));
                
                if (vscode && objectName) {
                    vscode.postMessage({
                        command: 'openOwnerObjectDetails',
                        objectName: objectName
                    });
                } else {
                    console.warn('[WARN] ReportDetails - Cannot open owner object details: vscode API or object name not available');
                }
            }
            
            // Copy Report Name Function
            function copyReportName(reportName) {
                console.log('[DEBUG] ReportDetails - Copy report name requested for:', JSON.stringify(reportName));
                
                if (!reportName) {
                    console.warn('[WARN] ReportDetails - Cannot copy: report name not available');
                    return;
                }
                
                try {
                    // Copy to clipboard using the modern Clipboard API
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(reportName).then(() => {
                            console.log('Report name copied to clipboard:', reportName);
                            // Provide visual feedback
                            const copyButton = document.querySelector('.copy-report-name-button .codicon');
                            if (copyButton) {
                                const originalClass = copyButton.className;
                                copyButton.className = 'codicon codicon-check';
                                setTimeout(() => {
                                    copyButton.className = originalClass;
                                }, 2000);
                            }
                        }).catch(err => {
                            console.error('Failed to copy report name: ', err);
                        });
                    } else {
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = reportName;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        
                        // Provide visual feedback
                        const copyButton = document.querySelector('.copy-report-name-button .codicon');
                        if (copyButton) {
                            const originalClass = copyButton.className;
                            copyButton.className = 'codicon codicon-check';
                            setTimeout(() => {
                                copyButton.className = originalClass;
                            }, 2000);
                        }
                    }
                } catch (err) {
                    console.error('Error copying report name: ', err);
                }
            }
            
            // Make functions globally available
            window.openPagePreview = openPagePreview;
            window.openOwnerObjectDetails = openOwnerObjectDetails;
            window.copyReportName = copyReportName;

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
                    case 'setOwnerSubscriptionState':
                        // Update the subscription checkbox state
                        const subscribeCheckbox = document.getElementById('subscribeOwnerProperties');
                        if (subscribeCheckbox) {
                            subscribeCheckbox.checked = message.data.isEnabled;
                        }
                        break;
                    case 'setTargetChildSubscriptionState':
                        // Update the target child subscription checkbox state
                        const subscribeTargetChildCheckbox = document.getElementById('subscribeTargetChildProperties');
                        if (subscribeTargetChildCheckbox) {
                            subscribeTargetChildCheckbox.checked = message.data.isEnabled;
                            subscribeTargetChildCheckbox.disabled = message.data.isDisabled || false;
                        }
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

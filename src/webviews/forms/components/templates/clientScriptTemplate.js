"use strict";

// Import required script modules
const { getUIEventHandlers } = require("../scripts/uiEventHandlers");
const { getFormControlUtilities } = require("../scripts/formControlUtilities");
const { getButtonManagementFunctions } = require("../scripts/buttonManagementFunctions");
const { getParameterManagementFunctions } = require("../scripts/parameterManagementFunctions");
const { getOutputVariableManagementFunctions } = require("../scripts/outputVariableManagementFunctions");
const { getDOMInitialization } = require("../scripts/domInitialization");
const { getModalFunctionality } = require("../scripts/modalFunctionality");
const { getAddInputControlModalHtml } = require("./addInputControlModalTemplate");
const { getAddInputControlModalFunctionality } = require("./addInputControlModalFunctionality");
const { getAddButtonModalFunctionality } = require("./addButtonModalFunctionality");
const { getAddButtonModalHtml } = require("./modalTemplates");
const { getAddOutputVariableModalHtml } = require("./addOutputVariableModalTemplate");
const { getAddOutputVariableModalFunctionality } = require("./addOutputVariableModalFunctionality");

/**
 * File: clientScriptTemplate.js
 * Purpose: Generates client-side JavaScript for the form details view using modular architecture
 * Created: 2025-07-06
 * Modified: 2025-07-06 - Refactored to use modular pattern like reports view
 */

/**
 * Generates JavaScript code for client-side functionality
 * @param {Array} params The form parameters
 * @param {Array} buttons The form buttons
 * @param {Array} outputVars The form output variables
 * @param {Object} paramSchema Schema for parameters
 * @param {Object} buttonSchema Schema for buttons
 * @param {Object} outputVarSchema Schema for output variables
 * @param {string} formName The name of the form
 * @returns {string} JavaScript code
 */
function getClientScriptTemplate(params, buttons, outputVars, paramSchema, buttonSchema, outputVarSchema, formName) {
    return `
        (function() {
            // Core data and API (vscode API already acquired in main template)
            // const vscode = acquireVsCodeApi(); // Already available from main template
            
            // Store current data
            let currentParams = ${JSON.stringify(params)};
            let currentButtons = ${JSON.stringify(buttons)};
            let currentOutputVars = ${JSON.stringify(outputVars)};
            let currentEditingIndex = -1;
            
            // Schema data
            const paramSchema = ${JSON.stringify(paramSchema)};
            const buttonSchema = ${JSON.stringify(buttonSchema)};
            const outputVarSchema = ${JSON.stringify(outputVarSchema)};
            const formName = "${formName || ''}";

            // View Preview functionality
            window.openPagePreview = function(formName, isPage) {
                console.log('[DEBUG] FormDetails - Opening page preview for form name:', JSON.stringify(formName));
                console.log('[DEBUG] FormDetails - Form name type:', typeof formName);
                console.log('[DEBUG] FormDetails - Form name length:', formName ? formName.length : 'null/undefined');
                console.log('[DEBUG] FormDetails - isPage:', isPage);
                
                if (!formName) {
                    console.error('[ERROR] FormDetails - No form name provided');
                    return;
                }
                
                if (isPage !== 'true') {
                    console.warn('[WARN] FormDetails - Form is not marked as a page (isPage !== "true")');
                    // Still try to open it, as the user might want to see it anyway
                }
                
                // Send message to extension to open page preview
                vscode.postMessage({
                    command: 'openPagePreview',
                    formName: formName
                });
            };

            // Modal functionality for add modals
            ${getModalFunctionality()}

            // Add Input Control Modal Template Function
            function getAddInputControlModalHtml() {
                return \`${getAddInputControlModalHtml()}\`;
            }

            // Add Button Modal Template Function
            function getAddButtonModalHtml() {
                return \`${getAddButtonModalHtml(null)}\`;
            }

            // Add Output Variable Modal Template Function
            function getAddOutputVariableModalHtml() {
                return \`${getAddOutputVariableModalHtml()}\`;
            }

            // Add Input Control Modal Functionality
            ${getAddInputControlModalFunctionality()}

            // Add Button Modal Functionality
            ${getAddButtonModalFunctionality()}

            // Add Output Variable Modal Functionality
            ${getAddOutputVariableModalFunctionality()}

            // UI Event Handlers for tabs and view switching
            ${getUIEventHandlers()}

            // Form Control Utilities
            ${getFormControlUtilities()}

            // Button Management Functions
            ${getButtonManagementFunctions()}

            // Parameter Management Functions
            ${getParameterManagementFunctions()}

            // Output Variable Management Functions
            ${getOutputVariableManagementFunctions()}

            // DOM Initialization
            ${getDOMInitialization()}
            
            // Message handlers for list refresh updates
            window.addEventListener('message', event => {
                const message = event.data;
                
                switch (message.command) {
                    case 'refreshParamsList':
                        refreshParamsList(message.data, message.newSelection);
                        break;
                    case 'refreshButtonsList':
                        refreshButtonsList(message.data, message.newSelection);
                        break;
                    case 'refreshOutputVarsList':
                        refreshOutputVarsList(message.data, message.newSelection);
                        break;
                    case 'setFormOwnerSubscriptionState':
                        // Update the subscription checkbox state
                        const checkbox = document.getElementById('subscribeToOwnerProperties');
                        if (checkbox && message.data) {
                            checkbox.checked = message.data.isSubscribed;
                            console.log('[Form Subscription] Checkbox state set to:', message.data.isSubscribed);
                        }
                        break;
                    case 'setFormTargetChildSubscriptionState':
                        // Update the target child subscription checkbox state
                        const targetChildCheckbox = document.getElementById('subscribeToTargetChildProperties');
                        if (targetChildCheckbox && message.data) {
                            targetChildCheckbox.checked = message.data.isSubscribed;
                            targetChildCheckbox.disabled = message.data.isDisabled || false;
                            console.log('[Form Target Child Subscription] Checkbox state set to:', message.data.isSubscribed, 'disabled:', message.data.isDisabled);
                        }
                        break;
                }
            });
            
            // Initialize move button states when page loads
            document.addEventListener('DOMContentLoaded', function() {
                // Set up event listeners for list selection changes
                const paramsList = document.getElementById('paramsList');
                const buttonsList = document.getElementById('buttonsList');
                const outputVarsList = document.getElementById('outputVarsList');
                
                if (paramsList) {
                    paramsList.addEventListener('change', function() {
                        const moveUpButton = document.getElementById('moveUpParamsButton');
                        const moveDownButton = document.getElementById('moveDownParamsButton');
                        if (moveUpButton && moveDownButton) {
                            updateMoveButtonStates(paramsList, moveUpButton, moveDownButton);
                        }
                    });
                    
                    // Initialize button states
                    const moveUpButton = document.getElementById('moveUpParamsButton');
                    const moveDownButton = document.getElementById('moveDownParamsButton');
                    if (moveUpButton && moveDownButton) {
                        updateMoveButtonStates(paramsList, moveUpButton, moveDownButton);
                    }
                }
                
                if (buttonsList) {
                    buttonsList.addEventListener('change', function() {
                        const moveUpButton = document.getElementById('moveUpButtonButton');
                        const moveDownButton = document.getElementById('moveDownButtonButton');
                        if (moveUpButton && moveDownButton) {
                            updateMoveButtonStates(buttonsList, moveUpButton, moveDownButton);
                        }
                    });
                    
                    // Initialize button states
                    const moveUpButton = document.getElementById('moveUpButtonButton');
                    const moveDownButton = document.getElementById('moveDownButtonButton');
                    if (moveUpButton && moveDownButton) {
                        updateMoveButtonStates(buttonsList, moveUpButton, moveDownButton);
                    }
                }
                
                if (outputVarsList) {
                    outputVarsList.addEventListener('change', function() {
                        const moveUpButton = document.getElementById('moveUpOutputVarButton');
                        const moveDownButton = document.getElementById('moveDownOutputVarButton');
                        if (moveUpButton && moveDownButton) {
                            updateMoveButtonStates(outputVarsList, moveUpButton, moveDownButton);
                        }
                    });
                    
                    // Initialize button states
                    const moveUpButton = document.getElementById('moveUpOutputVarButton');
                    const moveDownButton = document.getElementById('moveDownOutputVarButton');
                    if (moveUpButton && moveDownButton) {
                        updateMoveButtonStates(outputVarsList, moveUpButton, moveDownButton);
                    }
                }
            });
            
            // List refresh functions
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
                        option.textContent = button.buttonText || button.buttonName || 'Unnamed Button';
                        buttonsList.appendChild(option);
                    });
                    
                    // Restore selection if still valid
                    if (currentSelection >= 0 && currentSelection < newButtons.length) {
                        buttonsList.selectedIndex = currentSelection;
                        
                        // Trigger the change event to update the details view
                        buttonsList.dispatchEvent(new Event('change'));
                    }
                    
                    // Update move button states
                    const moveUpButton = document.getElementById('moveUpButtonButton');
                    const moveDownButton = document.getElementById('moveDownButtonButton');
                    if (moveUpButton && moveDownButton) {
                        updateMoveButtonStates(buttonsList, moveUpButton, moveDownButton);
                    }
                    
                    console.log('[DEBUG] Buttons list refreshed with', newButtons.length, 'items');
                }
            }
            
            function refreshOutputVarsList(newOutputVars, newSelection = null) {
                const outputVarsList = document.getElementById('outputVarsList');
                if (outputVarsList) {
                    // Update the currentOutputVars array
                    currentOutputVars = newOutputVars;
                    
                    const currentSelection = newSelection !== null ? newSelection : outputVarsList.selectedIndex;
                    outputVarsList.innerHTML = '';
                    newOutputVars.forEach((outputVar, index) => {
                        const option = document.createElement('option');
                        option.value = index;
                        option.textContent = outputVar.name || 'Unnamed Output Variable';
                        outputVarsList.appendChild(option);
                    });
                    
                    // Restore selection if still valid
                    if (currentSelection >= 0 && currentSelection < newOutputVars.length) {
                        outputVarsList.selectedIndex = currentSelection;
                        
                        // Trigger the change event to update the details view
                        outputVarsList.dispatchEvent(new Event('change'));
                    }
                    
                    // Update move button states
                    const moveUpButton = document.getElementById('moveUpOutputVarButton');
                    const moveDownButton = document.getElementById('moveDownOutputVarButton');
                    if (moveUpButton && moveDownButton) {
                        updateMoveButtonStates(outputVarsList, moveUpButton, moveDownButton);
                    }
                    
                    console.log('[DEBUG] Output vars list refreshed with', newOutputVars.length, 'items');
                }
            }
            
            // Update move button states helper function
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

        })();
    `;
}

module.exports = {
    getClientScriptTemplate
};

"use strict";
// generalFlow clientScriptTemplate (imports from forms via ../../../) – touch for rebuild

// Import required script modules (reusing forms scripts for list/tab handling)
const { getUIEventHandlers } = require("../../../forms/components/scripts/uiEventHandlers");
const { getFormControlUtilities } = require("../../../forms/components/scripts/formControlUtilities");
const { getParameterManagementFunctions } = require("../../../forms/components/scripts/parameterManagementFunctions");
const { getOutputVariableManagementFunctions } = require("../../../forms/components/scripts/outputVariableManagementFunctions");
// Note: Do not import forms' domInitialization here — it binds handlers for elements not present in General Flow and causes runtime errors
const { getModalFunctionality } = require("../../../forms/components/scripts/modalFunctionality");
const { getAddInputControlModalHtml } = require("../../../forms/components/templates/addInputControlModalTemplate");
const { getAddInputControlModalFunctionality } = require("../../../forms/components/templates/addInputControlModalFunctionality");
const { getAddOutputVariableModalHtml } = require("../../../forms/components/templates/addOutputVariableModalTemplate");
const { getAddOutputVariableModalFunctionality } = require("../../../forms/components/templates/addOutputVariableModalFunctionality");

/**
 * Generates JavaScript code for client-side functionality of General Flow view
 */
function getClientScriptTemplate(params, outputVars, paramSchema, outputVarSchema, flowName, allDataObjects = []) {
    return `
        (function() {
            // Store current data
            let currentParams = ${JSON.stringify(params)};
            let currentOutputVars = ${JSON.stringify(outputVars)};
            let currentEditingIndex = -1;

            // Schema data
            const paramSchema = ${JSON.stringify(paramSchema)};
            const outputVarSchema = ${JSON.stringify(outputVarSchema)};
            const flowName = "${flowName || ''}";

            // Data object search data (not used yet but kept for parity)
            const allDataObjects = ${JSON.stringify(allDataObjects)};

            // Form control utilities (provides updateInputStyle, setupSettingsInputHandlers, etc.)
            ${getFormControlUtilities()}

            // Copy Flow Name functionality
            window.copyGeneralFlowName = function(name) {
                const value = name || flowName;
                if (!value) { return; }
                const applyFeedback = () => {
                    const icon = document.querySelector('.copy-general-flow-name-button .codicon');
                    if (!icon) { return; }
                    const original = icon.className;
                    icon.className = 'codicon codicon-check';
                    setTimeout(() => { icon.className = original; }, 2000);
                };
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(value).then(applyFeedback).catch(applyFeedback);
                } else {
                    // Fallback
                    const ta = document.createElement('textarea');
                    ta.value = value; document.body.appendChild(ta); ta.select();
                    try { document.execCommand('copy'); } catch {}
                    document.body.removeChild(ta);
                    applyFeedback();
                }
            };

            // Modal functionality for add modals
            ${getModalFunctionality()}

            // Add Input Control Modal Template Function
            function getAddInputControlModalHtml() {
                return \`${getAddInputControlModalHtml()}\`;
            }

            // Add Output Variable Modal Template Function
            function getAddOutputVariableModalHtml() {
                return \`${getAddOutputVariableModalHtml()}\`;
            }

            // Add Input Control Modal Functionality
            ${getAddInputControlModalFunctionality()}

            // Add Output Variable Modal Functionality
            ${getAddOutputVariableModalFunctionality()}

            // UI Event Handlers for tabs and view switching
            ${getUIEventHandlers()}

            // Parameter Management Functions (list, CRUD messaging)
            ${getParameterManagementFunctions()}

            // Output Variable Management Functions
            ${getOutputVariableManagementFunctions()}

            // Refresh Output Variables List function
            function refreshOutputVarsList(newOutputVars, newSelection = null) {
                const outputVarsList = document.getElementById('outputVarsList');
                if (outputVarsList) {
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
                    
                    console.log('[DEBUG] General Flow output vars list refreshed with', newOutputVars.length, 'items');
                }
            }

            // Refresh Params List function
            function refreshParamsList(newParams, newSelection = null) {
                const paramsList = document.getElementById('paramsList');
                if (paramsList) {
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
                    
                    console.log('[DEBUG] General Flow params list refreshed with', newParams.length, 'items');
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

            // Lightweight DOM initialization for General Flow: wire add buttons and settings handlers only
            document.addEventListener('DOMContentLoaded', () => {
                // Wire Add Input Control button to open its modal
                const addParamBtn = document.getElementById('add-param-btn');
                if (addParamBtn) {
                    addParamBtn.addEventListener('click', function() { createAddInputControlModal(); });
                }

                // Wire Add Output Variable button to open its modal
                const addOutputVarBtn = document.getElementById('add-output-var-btn');
                if (addOutputVarBtn) {
                    addOutputVarBtn.addEventListener('click', function() { createAddOutputVariableModal(); });
                }

                // Enable settings field handlers and styling
                if (typeof setupSettingsInputHandlers === 'function') {
                    setupSettingsInputHandlers();
                }

                // Initialize move button states for output variables
                const outputVarsList = document.getElementById('outputVarsList');
                const moveUpOutputVarButton = document.getElementById('moveUpOutputVarButton');
                const moveDownOutputVarButton = document.getElementById('moveDownOutputVarButton');
                
                if (outputVarsList && moveUpOutputVarButton && moveDownOutputVarButton) {
                    // Update button states on list selection changes
                    outputVarsList.addEventListener('change', () => {
                        updateMoveButtonStates(outputVarsList, moveUpOutputVarButton, moveDownOutputVarButton);
                    });
                    
                    // Initialize button states
                    updateMoveButtonStates(outputVarsList, moveUpOutputVarButton, moveDownOutputVarButton);
                }

                // Initialize move button states for params
                const paramsList = document.getElementById('paramsList');
                const moveUpParamsButton = document.getElementById('moveUpParamsButton');
                const moveDownParamsButton = document.getElementById('moveDownParamsButton');
                
                if (paramsList && moveUpParamsButton && moveDownParamsButton) {
                    // Update button states on list selection changes
                    paramsList.addEventListener('change', () => {
                        updateMoveButtonStates(paramsList, moveUpParamsButton, moveDownParamsButton);
                    });
                    
                    // Initialize button states
                    updateMoveButtonStates(paramsList, moveUpParamsButton, moveDownParamsButton);
                }
            });

            // Wire move and reverse buttons for params (input controls)
            document.getElementById('moveUpParamsButton')?.addEventListener('click', () => {
                const paramsList = document.getElementById('paramsList');
                if (!paramsList || !paramsList.value) return;
                const selectedIndex = parseInt(paramsList.value);
                if (selectedIndex > 0) { 
                    vscode.postMessage({ 
                        command: 'moveParam', 
                        data: { fromIndex: selectedIndex, toIndex: selectedIndex - 1 } 
                    }); 
                }
            });

            document.getElementById('moveDownParamsButton')?.addEventListener('click', () => {
                const paramsList = document.getElementById('paramsList');
                if (!paramsList || !paramsList.value) return;
                const selectedIndex = parseInt(paramsList.value);
                const paramCount = document.querySelectorAll('#paramsList option').length;
                if (selectedIndex < paramCount - 1) { 
                    vscode.postMessage({ 
                        command: 'moveParam', 
                        data: { fromIndex: selectedIndex, toIndex: selectedIndex + 1 } 
                    }); 
                }
            });

            document.getElementById('reverseParamsButton')?.addEventListener('click', () => {
                vscode.postMessage({ command: 'reverseParams' });
            });

            // Wire move and reverse buttons for output variables  
            document.getElementById('moveUpOutputVarButton')?.addEventListener('click', () => {
                const outputVarsList = document.getElementById('outputVarsList');
                if (!outputVarsList || !outputVarsList.value) return;
                const selectedIndex = parseInt(outputVarsList.value);
                if (selectedIndex > 0) { 
                    vscode.postMessage({ 
                        command: 'moveOutputVar', 
                        data: { fromIndex: selectedIndex, toIndex: selectedIndex - 1 } 
                    }); 
                }
            });

            document.getElementById('moveDownOutputVarButton')?.addEventListener('click', () => {
                const outputVarsList = document.getElementById('outputVarsList');
                if (!outputVarsList || !outputVarsList.value) return;
                const selectedIndex = parseInt(outputVarsList.value);
                const outputVarCount = document.querySelectorAll('#outputVarsList option').length;
                if (selectedIndex < outputVarCount - 1) { 
                    vscode.postMessage({ 
                        command: 'moveOutputVar', 
                        data: { fromIndex: selectedIndex, toIndex: selectedIndex + 1 } 
                    }); 
                }
            });

            document.getElementById('reverseOutputVarButton')?.addEventListener('click', () => {
                vscode.postMessage({ command: 'reverseOutputVar' });
            });

            // Message handlers for list refresh updates
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'refreshParamsList':
                        refreshParamsList(message.data, message.newSelection);
                        break;
                    case 'refreshOutputVarsList':
                        refreshOutputVarsList(message.data, message.newSelection);
                        break;
                }
            });
        })();
    `;
}

module.exports = { getClientScriptTemplate };

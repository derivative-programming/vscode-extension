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

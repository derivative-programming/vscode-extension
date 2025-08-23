"use strict";
// generalFlow clientScriptTemplate (imports from forms via ../../../) – touch for rebuild

// Import required script modules (reusing forms scripts for list/tab handling)
const { getUIEventHandlers } = require("../../../forms/components/scripts/uiEventHandlers");
const { getParameterManagementFunctions } = require("../../../forms/components/scripts/parameterManagementFunctions");
const { getOutputVariableManagementFunctions } = require("../../../forms/components/scripts/outputVariableManagementFunctions");
const { getDOMInitialization } = require("../../../forms/components/scripts/domInitialization");
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

            // Copy Flow Name functionality
            window.copyGeneralFlowName = function(name) {
                const value = name || flowName;
                if (!value) { return; }
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(value).then(() => {
                        const btn = document.querySelector('.copy-general-flow-name-button');
                        if (btn) {
                            const orig = btn.innerHTML; btn.innerHTML = '<i class="codicon codicon-check"></i>'; btn.title = 'Copied!';
                            setTimeout(() => { btn.innerHTML = orig; btn.title = 'Copy General Flow Name'; }, 1500);
                        }
                    });
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

            // DOM Initialization (ensures list views active by default, etc.)
            ${getDOMInitialization()}

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

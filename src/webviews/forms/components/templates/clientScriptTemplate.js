"use strict";

// Import required script modules
const { getUIEventHandlers } = require("../scripts/uiEventHandlers");
const { getFormControlUtilities } = require("../scripts/formControlUtilities");
const { getButtonManagementFunctions } = require("../scripts/buttonManagementFunctions");
const { getParameterManagementFunctions } = require("../scripts/parameterManagementFunctions");
const { getOutputVariableManagementFunctions } = require("../scripts/outputVariableManagementFunctions");
const { getDOMInitialization } = require("../scripts/domInitialization");
const { getModalFunctionality } = require("../scripts/modalFunctionality");

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

        })();
    `;
}

module.exports = {
    getClientScriptTemplate
};

"use strict";

// Import required script modules
const { getUIEventHandlers } = require("../scripts/uiEventHandlers");
const { getFormControlUtilities } = require("../scripts/formControlUtilities");
const { getButtonManagementFunctions } = require("../scripts/buttonManagementFunctions");
const { getColumnManagementFunctions } = require("../scripts/columnManagementFunctions");
const { getParameterManagementFunctions } = require("../scripts/parameterManagementFunctions");
const { getDOMInitialization } = require("../scripts/domInitialization");
const { getModalFunctionality } = require("../scripts/modalFunctionality");

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

        })();
    `;
}

module.exports = {
    getClientScriptTemplate
};

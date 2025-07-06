"use strict";
const { getDetailViewStyles } = require("../../styles/detailsViewStyles");

/**
 * Gets the main HTML template for the form details view
 * @param {Object} form The form data object
 * @param {number} paramCount Number of parameters in the form
 * @param {number} buttonCount Number of buttons in the form
 * @param {number} outputVarCount Number of output variables in the form
 * @param {string} settingsHtml HTML content for the settings tab
 * @param {string} paramTableHeaders HTML headers for parameters table
 * @param {string} paramTableRows HTML rows for parameters table
 * @param {string} paramListViewFields HTML fields for parameters list view
 * @param {string} buttonTableHeaders HTML headers for buttons table
 * @param {string} buttonTableRows HTML rows for buttons table
 * @param {string} buttonListViewFields HTML fields for buttons list view
 * @param {string} outputVarTableHeaders HTML headers for output variables table
 * @param {string} outputVarTableRows HTML rows for output variables table
 * @param {string} outputVarListViewFields HTML fields for output variables list view
 * @param {string} paramModalHtml HTML for the parameter modal
 * @param {string} buttonModalHtml HTML for the button modal
 * @param {string} outputVarModalHtml HTML for the output variable modal
 * @param {string} clientScript JavaScript code for the client
 * @returns {string} Complete HTML document
 */
function getMainTemplate(
    form, 
    paramCount, 
    buttonCount, 
    outputVarCount,
    settingsHtml, 
    paramTableHeaders, 
    paramTableRows, 
    paramListViewFields,
    buttonTableHeaders, 
    buttonTableRows, 
    buttonListViewFields,
    outputVarTableHeaders, 
    outputVarTableRows, 
    outputVarListViewFields,
    paramModalHtml,
    buttonModalHtml,
    outputVarModalHtml,
    clientScript
) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Form Details: ${form.name || 'Unknown Form'}</title>
    <style>
        ${getDetailViewStyles()}
    </style>
</head>
<body>
    <h1>Details for ${form.name || 'Unknown Form'} Form</h1>
    
    <div class="tabs">
        <div class="tab active" data-tab="settings">Settings</div>
        <div class="tab" data-tab="params">Parameters (${paramCount})</div>
        <div class="tab" data-tab="buttons">Buttons (${buttonCount})</div>
        <div class="tab" data-tab="outputVars">Output Variables (${outputVarCount})</div>
    </div>
    
    <div id="settings" class="tab-content active">
        ${settingsHtml}
    </div>
    
    <div id="params" class="tab-content">
        <div class="action-buttons">
            <button id="add-param-btn">Add Parameter</button>
            <button id="reverse-params-btn">Reverse Order</button>
        </div>
        
        <table class="data-table">
            <thead>
                <tr>${paramTableHeaders}</tr>
            </thead>
            <tbody>
                ${paramTableRows}
            </tbody>
        </table>
    </div>
    
    <div id="buttons" class="tab-content">
        <div class="action-buttons">
            <button id="add-button-btn">Add Button</button>
            <button id="reverse-buttons-btn">Reverse Order</button>
        </div>
        
        <table class="data-table">
            <thead>
                <tr>${buttonTableHeaders}</tr>
            </thead>
            <tbody>
                ${buttonTableRows}
            </tbody>
        </table>
    </div>
    
    <div id="outputVars" class="tab-content">
        <div class="action-buttons">
            <button id="add-output-var-btn">Add Output Variable</button>
            <button id="reverse-output-vars-btn">Reverse Order</button>
        </div>
        
        <table class="data-table">
            <thead>
                <tr>${outputVarTableHeaders}</tr>
            </thead>
            <tbody>
                ${outputVarTableRows}
            </tbody>
        </table>
    </div>
    
    <!-- Modals for adding/editing items -->
    ${paramModalHtml}
    ${buttonModalHtml}
    ${outputVarModalHtml}
    
    <script>
        // Get the VS Code API
        const vscode = acquireVsCodeApi();
        ${clientScript}
    </script>
</body>
</html>`;
}

module.exports = {
    getMainTemplate
};

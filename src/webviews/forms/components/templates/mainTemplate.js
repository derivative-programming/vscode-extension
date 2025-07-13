"use strict";
const { getDetailViewStyles } = require("../../styles/detailsViewStyles");

/**
 * Gets the main HTML template for the form details view
 * @param {Object} form The form data object
 * @param {number} paramCount Number of parameters in the form
 * @param {number} buttonCount Number of buttons in the form
 * @param {number} outputVarCount Number of output variables in the form
 * @param {string} settingsHtml HTML content for the settings tab
 * @param {string} paramListViewFields HTML fields for parameters list view
 * @param {string} buttonListViewFields HTML fields for buttons list view
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
    paramListViewFields,
    buttonListViewFields,
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
        <div class="view-icons" data-tab="params">
            <button id="add-param-btn" class="add-prop-button">Add Parameter</button>
        </div>

        <div id="paramsListView" class="view-content active">
            <div class="list-container">
                <select id="paramsList" size="10">
                    ${(form.objectWorkflowParam || []).map((param, index) => {
                        const name = (param && typeof param === 'object' && param.name) ? param.name : 'Unnamed Parameter';
                        return `<option value="${index}">${name}</option>`;
                    }).join('')}
                </select>
                <div class="list-buttons">
                    <button id="copyParamsButton" class="copy-props-button">Copy</button>
                    <button id="moveUpParamsButton" class="move-button">Move Up</button>
                    <button id="moveDownParamsButton" class="move-button">Move Down</button>
                    <button id="reverseParamsButton" class="reverse-button">Reverse</button>
                </div>
            </div>
            <div id="paramDetailsContainer" class="details-container" style="display: none;">
                <form id="paramDetailsForm">
                    ${paramListViewFields}
                </form>
            </div>
        </div>
    </div>
    
    <div id="buttons" class="tab-content">
        <div class="view-icons" data-tab="buttons">
            <button id="add-button-btn" class="add-prop-button">Add Button</button>
        </div>

        <div id="buttons-list-view" class="view-content active">
            <div class="list-container">
                <select id="buttonsList" size="10">
                    ${(form.objectWorkflowButton || []).map((button, index) => {
                        const name = (button && typeof button === 'object' && button.buttonName) ? button.buttonName : 'Unnamed Button';
                        return `<option value="${index}">${name}</option>`;
                    }).join('')}
                </select>
                <div class="list-buttons">
                    <button id="copyButtonButton" class="copy-props-button">Copy</button>
                    <button id="moveUpButtonButton" class="move-button">Move Up</button>
                    <button id="moveDownButtonButton" class="move-button">Move Down</button>
                    <button id="reverseButtonsButton" class="reverse-button">Reverse</button>
                </div>
            </div>
            <div id="buttonDetailsContainer" class="details-container" style="display: none;">
                ${buttonListViewFields}
            </div>
        </div>
    </div>
    
    <div id="outputVars" class="tab-content">
        <div class="view-icons" data-tab="outputVars">
            <button id="add-output-var-btn" class="add-prop-button">Add Output Variable</button>
        </div>

        <div id="outputVarsListView" class="view-content active">
            <div class="list-container">
                <select id="outputVarsList" size="10">
                    ${(form.objectWorkflowOutputVar || []).map((outputVar, index) => {
                        console.log(`[DEBUG] mainTemplate outputVar at index ${index}:`, outputVar);
                        const name = (outputVar && typeof outputVar === 'object' && outputVar.name) ? outputVar.name : 'Unnamed Output Variable';
                        console.log(`[DEBUG] mainTemplate outputVar name: "${name}"`);
                        return `<option value="${index}">${name}</option>`;
                    }).join('')}
                </select>
                <div class="list-buttons">
                    <button id="copyOutputVarButton" class="copy-props-button">Copy</button>
                    <button id="moveUpOutputVarButton" class="move-button">Move Up</button>
                    <button id="moveDownOutputVarButton" class="move-button">Move Down</button>
                    <button id="reverseOutputVarButton" class="reverse-button">Reverse</button>
                </div>
            </div>
            <div id="outputVarDetailsContainer" class="details-container" style="display: none;">
                <form id="outputVarDetailsForm">
                    ${outputVarListViewFields}
                </form>
            </div>
        </div>
    </div>
    
    <!-- Modals for adding/editing items -->
    ${paramModalHtml}
    ${buttonModalHtml}
    ${outputVarModalHtml}
    
    <script>
        // Initialize vscode messaging
        const vscode = acquireVsCodeApi();
        
        // Store the form data for reference
        const form = ${JSON.stringify(form)};
        
        ${clientScript}
    </script>
</body>
</html>`;
}

module.exports = {
    getMainTemplate
};

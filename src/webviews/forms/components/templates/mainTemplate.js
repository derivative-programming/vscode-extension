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
 * @param {string} codiconsUri URI for the codicon CSS file
 * @param {Object} ownerObject The owner data object for this form (optional)
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
    clientScript,
    codiconsUri,
    ownerObject = null
) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Form Details: ${form.name || 'Unknown Form'}</title>
    <link href="${codiconsUri}" rel="stylesheet" />
    <style>
        ${getDetailViewStyles()}
        
        /* Header Button Styles */
        .header-container {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
        }
        
        .header-title {
            margin: 0;
        }
        
        .copy-form-name-button,
        .view-preview-button {
            background: transparent !important;
            background-color: transparent !important;
            border: none;
            color: var(--vscode-foreground);
            cursor: pointer;
            padding: 6px;
            border-radius: 4px;
            transition: background 0.15s;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 28px;
            height: 28px;
        }
        
        .copy-form-name-button:hover,
        .view-preview-button:hover {
            background: var(--vscode-toolbar-hoverBackground) !important;
            background-color: var(--vscode-toolbar-hoverBackground) !important;
        }
        
        .copy-form-name-button:active,
        .view-preview-button:active {
            background: var(--vscode-toolbar-activeBackground);
            transform: scale(0.95);
        }
        
        .copy-form-name-button .codicon,
        .view-preview-button .codicon {
            font-size: 16px;
        }
        
        /* Hide the emoji fallback icon - we only want the codicon */
        .view-preview-button .icon-text {
            display: none !important;
        }
        
        /* Owner Data Object Section Styles */
        .owner-data-object-section {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 15px;
            padding: 8px 0;
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
        }
        
        .owner-data-object-label {
            font-weight: 500;
        }
        
        .owner-data-object-name {
            color: var(--vscode-foreground);
            font-family: var(--vscode-editor-font-family);
        }
        
        .edit-owner-button {
            background: transparent !important;
            background-color: transparent !important;
            border: none;
            color: var(--vscode-foreground);
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: background 0.15s;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 24px;
            height: 24px;
        }
        
        .edit-owner-button:hover {
            background: var(--vscode-toolbar-hoverBackground) !important;
            background-color: var(--vscode-toolbar-hoverBackground) !important;
        }
        
        .edit-owner-button:active {
            background: var(--vscode-toolbar-activeBackground);
            transform: scale(0.95);
        }
        
        .edit-owner-button .codicon {
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header-container">
        <h1 class="header-title">Details for ${form.name || 'Unknown Form'} Form</h1>
        <button class="copy-form-name-button" onclick="copyFormName()" title="Copy form name">
            <i class="codicon codicon-copy"></i>
        </button>
        <button class="view-preview-button" onclick="openPagePreview('${form.name || ''}', '${form.isPage === 'true' ? 'true' : 'false'}')" title="View page preview">
            <i class="codicon codicon-eye"></i>
            <span class="icon-text">👁</span>
        </button>
    </div>
    
    ${ownerObject ? `
    <div class="owner-data-object-section">
        <span class="owner-data-object-label">Owner Data Object:</span>
        <span class="owner-data-object-name">${ownerObject.name || 'Unknown Object'}</span>
        <button class="edit-owner-button" onclick="openOwnerObjectDetails('${ownerObject.name || ''}')" title="Edit owner data object">
            <i class="codicon codicon-edit"></i>
        </button>
    </div>
    ` : ''}
    
    <div class="tabs">
        <div class="tab active" data-tab="settings">Settings</div>
        <div class="tab" data-tab="params">Input Controls (${paramCount})</div>
        <div class="tab" data-tab="buttons">Buttons (${buttonCount})</div>
        <div class="tab" data-tab="outputVars">Output Variables (${outputVarCount})</div>
    </div>
    
    <div id="settings" class="tab-content active">
        ${settingsHtml}
    </div>
    
    <div id="params" class="tab-content">
        <div class="view-icons" data-tab="params">
            <button id="add-param-btn" class="add-prop-button">Add Input Control</button>
        </div>

        <div id="paramsListView" class="view-content active">
            <div class="list-container">
                <select id="paramsList" size="10">
                    ${(form.objectWorkflowParam || []).map((param, index) => {
                        const name = (param && typeof param === 'object' && param.name) ? param.name : 'Unnamed Input Control';
                        return `<option value="${index}">${name}</option>`;
                    }).join('')}
                </select>
                <div class="list-buttons">
                    <button id="copyParamsButton" class="copy-props-button">Copy List</button>
                    <button id="moveUpParamsButton" class="move-button">Move Up</button>
                    <button id="moveDownParamsButton" class="move-button">Move Down</button>
                    <button id="reverseParamsButton" class="reverse-button">Reverse</button>
                </div>
                <div class="subscription-controls">
                    <label class="subscription-checkbox-label">
                        <input type="checkbox" id="subscribeToOwnerProperties" class="subscription-checkbox" />
                        Subscribe to Owner Data Object Properties
                    </label>
                </div>
                <div class="subscription-controls">
                    <label class="subscription-checkbox-label">
                        <input type="checkbox" id="subscribeToTargetChildProperties" class="subscription-checkbox" />
                        Subscribe to Target Child Data Object Properties
                    </label>
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
                        const name = (button && typeof button === 'object') 
                            ? (button.buttonText || button.buttonName || 'Unnamed Button')
                            : 'Unnamed Button';
                        return `<option value="${index}">${name}</option>`;
                    }).join('')}
                </select>
                <div class="list-buttons">
                    <button id="copyButtonButton" class="copy-props-button">Copy List</button>
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
                    <button id="copyOutputVarButton" class="copy-props-button">Copy List</button>
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

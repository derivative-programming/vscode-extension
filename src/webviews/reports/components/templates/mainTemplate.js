"use strict";
const { getDetailViewStyles } = require("../../styles/detailsViewStyles");

/**
 * Generate HTML template for the report details view
 * @param {Object} report The report data object
 * @param {number} columnCount Number of columns in the report
 * @param {number} buttonCount Number of buttons in the report
 * @param {number} paramCount Number of parameters in the report
 * @param {string} settingsHtml HTML content for the settings tab
 * @param {string} columnListViewFields HTML for the column list view form fields
 * @param {string} buttonListViewFields HTML for the button list view form fields
 * @param {string} paramListViewFields HTML for the param list view form fields
 * @param {string} columnModalHtml HTML for the column modal
 * @param {string} buttonModalHtml HTML for the button modal
 * @param {string} paramModalHtml HTML for the param modal
 * @param {string} clientScript JavaScript code for the client
 * @returns {string} Complete HTML document
 */
function getMainTemplate(report, columnCount, buttonCount, paramCount, 
                        settingsHtml, 
                        columnListViewFields,
                        buttonListViewFields,
                        paramListViewFields,
                        columnModalHtml, buttonModalHtml, paramModalHtml,
                        clientScript, codiconsUri) {
      return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report Details: ${report.name || 'Unknown Report'}</title>
    <link href="${codiconsUri}" rel="stylesheet" />
    <style>
        ${getDetailViewStyles()}
        
        /* View Preview Button Styles */
        .header-container {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
        }
        
        .header-title {
            margin: 0;
        }
        
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
        
        .view-preview-button:hover {
            background: var(--vscode-toolbar-hoverBackground) !important;
            background-color: var(--vscode-toolbar-hoverBackground) !important;
        }
        
        .view-preview-button:active {
            background: var(--vscode-toolbar-activeBackground);
            transform: scale(0.95);
        }
        
        .view-preview-button .codicon {
            font-size: 16px;
        }
        
        /* Hide the emoji fallback icon - we only want the codicon */
        .view-preview-button .icon-text {
            display: none !important;
        }
    </style>
</head>
<body>
    <div class="header-container">
        <h1 class="header-title">Details for ${report.name || 'Unknown Report'} Report</h1>
        <button class="view-preview-button" onclick="openPagePreview('${report.name || ''}', '${report.isPage === 'true' ? 'true' : 'false'}')" title="View page preview">
            <i class="codicon codicon-eye"></i>
            <span class="icon-text">👁</span>
        </button>
    </div>
      <div class="tabs">
        <div class="tab active" data-tab="settings">Settings</div>
        <div class="tab" data-tab="columns">Columns (${columnCount})</div>
        <div class="tab" data-tab="buttons">Buttons (${buttonCount})</div>
        <div class="tab" data-tab="params">Filters (${paramCount})</div>
    </div>
    
    <!-- Settings Tab -->
    <div id="settings" class="tab-content active">
        ${settingsHtml}
    </div>
      <!-- Columns Tab -->
    <div id="columns" class="tab-content">
        <div class="view-icons" data-tab="columns">
            <button id="add-column-btn" class="add-prop-button">Add Column</button>
        </div>

        <div id="columnsListView" class="view-content active">
            <div class="list-container">
                <select id="columnsList" size="10">
                    ${(report.reportColumn || []).map((column, index) => `<option value="${index}">${column.name || 'Unnamed Column'}</option>`).join('')}
                </select>
                <div class="list-buttons">
                    <button id="copyColumnsButton" class="copy-props-button">Copy List</button>
                    <button id="moveUpColumnsButton" class="move-button">Move Up</button>
                    <button id="moveDownColumnsButton" class="move-button">Move Down</button>
                    <button id="reverseColumnsButton" class="reverse-button">Reverse</button>
                </div>
                <div class="subscription-controls">
                    <label>
                        <input type="checkbox" id="subscribeOwnerProperties" class="subscription-checkbox">
                        Subscribe to Owner Data Object Properties
                    </label>
                </div>
            </div>
            <div id="columnDetailsContainer" class="details-container" style="display: none;">
                <form id="columnDetailsForm">
                    ${columnListViewFields}
                </form>
            </div>
        </div>
    </div>
      <!-- Buttons Tab -->
    <div id="buttons" class="tab-content">
        <div class="view-icons" data-tab="buttons">
            <button id="add-button-btn" class="add-prop-button">Add Button</button>
        </div>

        <div id="buttonsListView" class="view-content active">
            <div class="list-container">
                <select id="buttonsList" size="10">
                    ${(report.reportButton || []).map((button, index) => `<option value="${index}">${button.buttonName || 'Unnamed Button'}</option>`).join('')}
                </select>
                <div class="list-buttons">
                    <button id="copyButtonsButton" class="copy-props-button">Copy List</button>
                    <button id="moveUpButtonsButton" class="move-button">Move Up</button>
                    <button id="moveDownButtonsButton" class="move-button">Move Down</button>
                    <button id="reverseButtonsButton" class="reverse-button">Reverse</button>
                </div>
            </div>
            <div id="buttonDetailsContainer" class="details-container" style="display: none;">
                <form id="buttonDetailsForm">
                    ${buttonListViewFields}
                </form>
            </div>
        </div>
    </div>
      <!-- Filters Tab -->
    <div id="params" class="tab-content">
        <div class="view-icons" data-tab="params">
            <button id="add-param-btn" class="add-prop-button">Add Filter</button>
        </div>

        <div id="paramsListView" class="view-content active">
            <div class="list-container">
                <select id="paramsList" size="10">
                    ${(report.reportParam || []).map((param, index) => `<option value="${index}">${param.name || 'Unnamed Parameter'}</option>`).join('')}
                </select>
                <div class="list-buttons">
                    <button id="copyParamsButton" class="copy-props-button">Copy List</button>
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
      <!-- Modal for editing existing columns -->
    ${columnModalHtml}
    
    <!-- Modal for adding/editing buttons -->
    ${buttonModalHtml}
    
    <!-- Modal for editing existing parameters -->
    ${paramModalHtml}
    
    <script>
        // Initialize vscode messaging
        const vscode = acquireVsCodeApi();
        
        // Store the report data for reference
        const report = ${JSON.stringify(report)};
        
        ${clientScript}
    </script>
</body>
</html>`;
}

module.exports = {
    getMainTemplate
};

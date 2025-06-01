"use strict";
const { getDetailViewStyles } = require("../../styles/detailsViewStyles");

/**
 * Generates the main HTML template for the report details view
 * @param {Object} report The report data object
 * @param {number} columnCount Number of columns in the report
 * @param {number} buttonCount Number of buttons in the report
 * @param {number} paramCount Number of parameters in the report
 * @param {string} settingsHtml HTML content for the settings tab
 * @param {string} columnTableHeaders HTML for the column table headers
 * @param {string} columnTableRows HTML for the column table rows
 * @param {string} buttonTableHeaders HTML for the button table headers
 * @param {string} buttonTableRows HTML for the button table rows
 * @param {string} buttonListViewFields HTML for the button list view form fields
 * @param {string} paramTableHeaders HTML for the param table headers
 * @param {string} paramTableRows HTML for the param table rows
 * @param {string} paramListViewFields HTML for the param list view form fields
 * @param {string} columnModalHtml HTML for the column modal
 * @param {string} buttonModalHtml HTML for the button modal
 * @param {string} paramModalHtml HTML for the param modal
 * @param {string} clientScript JavaScript code for the client
 * @returns {string} Complete HTML document
 */
function getMainTemplate(report, columnCount, buttonCount, paramCount, 
                        settingsHtml, 
                        columnTableHeaders, columnTableRows, columnListViewFields,
                        buttonTableHeaders, buttonTableRows, buttonListViewFields,
                        paramTableHeaders, paramTableRows, paramListViewFields,
                        columnModalHtml, buttonModalHtml, paramModalHtml,
                        clientScript) {
      return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report Details: ${report.name || 'Unknown Report'}</title>
    <style>
        ${getDetailViewStyles()}
    </style>
</head>
<body>
    <h1>Details for ${report.name || 'Unknown Report'} Report</h1>
    
    <div class="tabs">
        <button class="tab active" data-tab="settings">Settings</button>
        <button class="tab" data-tab="columns">Columns (${columnCount})</button>
        <button class="tab" data-tab="buttons">Buttons (${buttonCount})</button>
        <button class="tab" data-tab="params">Parameters (${paramCount})</button>
    </div>
    
    <!-- Settings Tab -->
    <div id="settings" class="tab-content active">
        ${settingsHtml}
    </div>
    
    <!-- Columns Tab -->
    <div id="columns" class="tab-content">
        <div class="view-icons">
            <div class="view-icons-left">
                <span class="icon table-icon active" data-view="table">Table View</span>
                <span class="icon list-icon" data-view="list">List View</span>
            </div>
            <button id="add-column-btn" class="add-prop-button">Add Column</button>
        </div>

        <div id="tableView" class="view-content active">
            <div class="table-container">
                <table id="columns-table">
                    <thead>
                        <tr>
                            ${columnTableHeaders}
                        </tr>
                    </thead>
                    <tbody>
                        ${columnTableRows}
                    </tbody>
                </table>
            </div>
        </div>

        <div id="listView" class="view-content">
            <div class="list-container">
                <select id="columnsList" size="10">
                    ${(report.reportColumn || []).map((column, index) => `<option value="${index}">${column.name || 'Unnamed Column'}</option>`).join('')}
                </select>
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
        <div class="view-icons">
            <div class="view-icons-left">
                <span class="icon table-icon active" data-view="table">Table View</span>
                <span class="icon list-icon" data-view="list">List View</span>
            </div>
            <button id="add-button-btn" class="add-prop-button">Add Button</button>
        </div>

        <div id="tableView" class="view-content active">
            <div class="table-container">
                <table id="buttons-table">
                    <thead>
                        <tr>
                            ${buttonTableHeaders}
                        </tr>
                    </thead>
                    <tbody>
                        ${buttonTableRows}
                    </tbody>
                </table>
            </div>
        </div>

        <div id="listView" class="view-content">
            <div class="list-container">
                <select id="buttonsList" size="10">
                    ${(report.reportButton || []).map((button, index) => `<option value="${index}">${button.buttonName || 'Unnamed Button'}</option>`).join('')}
                </select>
            </div>
            <div id="buttonDetailsContainer" class="details-container" style="display: none;">
                <form id="buttonDetailsForm">
                    ${buttonListViewFields}
                </form>
            </div>
        </div>
    </div>
    
    <!-- Parameters Tab -->
    <div id="params" class="tab-content">
        <div class="view-icons">
            <div class="view-icons-left">
                <span class="icon table-icon active" data-view="table">Table View</span>
                <span class="icon list-icon" data-view="list">List View</span>
            </div>
            <button id="add-param-btn" class="add-prop-button">Add Parameter</button>
        </div>

        <div id="tableView" class="view-content active">
            <div class="table-container">
                <table id="params-table">
                    <thead>
                        <tr>
                            ${paramTableHeaders}
                        </tr>
                    </thead>
                    <tbody>
                        ${paramTableRows}
                    </tbody>
                </table>
            </div>
        </div>

        <div id="listView" class="view-content">
            <div class="list-container">
                <select id="paramsList" size="10">
                    ${(report.reportParam || []).map((param, index) => `<option value="${index}">${param.name || 'Unnamed Parameter'}</option>`).join('')}
                </select>
            </div>
            <div id="paramDetailsContainer" class="details-container" style="display: none;">
                <form id="paramDetailsForm">
                    ${paramListViewFields}
                </form>
            </div>
        </div>
    </div>
    
    <!-- Modal for adding/editing columns -->
    ${columnModalHtml}
    
    <!-- Modal for adding/editing buttons -->
    ${buttonModalHtml}
    
    <!-- Modal for adding/editing parameters -->
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

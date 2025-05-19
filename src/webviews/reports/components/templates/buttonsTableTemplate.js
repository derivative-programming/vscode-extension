"use strict";
const { formatLabel } = require("../../helpers/reportDataHelper");

/**
 * Generates the HTML for the buttons table
 * @param {Array} buttons The report buttons data
 * @param {Object} reportButtonsSchema The button schema properties
 * @returns {Object} HTML for the buttons table headers and rows
 */
function getButtonsTableTemplate(buttons, reportButtonsSchema) {
    // Define which columns to display in the table
    const displayColumns = ['name', 'text', 'targetObjectWorkflowName'];
    
    // Generate table headers
    const buttonTableHeaders = `
        <th>Name</th>
        <th>Text</th>
        <th>Target Workflow</th>
        <th>Actions</th>
    `;
    
    // Generate table rows
    const buttonTableRows = buttons.length > 0 
        ? buttons.map((button, index) => {
            return `
                <tr data-index="${index}">
                    <td>${button.name || ''}</td>
                    <td>${button.text || ''}</td>
                    <td>${button.targetObjectWorkflowName || ''}</td>
                    <td>
                        <button class="edit-button-btn" data-index="${index}">Edit</button>
                    </td>
                </tr>
            `;
        }).join('')
        : `<tr><td colspan="4">No buttons defined</td></tr>`;
    
    return { buttonTableHeaders, buttonTableRows };
}

module.exports = {
    getButtonsTableTemplate
};

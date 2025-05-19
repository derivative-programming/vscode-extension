"use strict";
const { formatLabel } = require("../../helpers/reportDataHelper");

/**
 * Generates the HTML for the columns table
 * @param {Array} columns The report columns data
 * @param {Object} reportColumnsSchema The column schema properties
 * @returns {Object} HTML for the columns table headers and rows
 */
function getColumnsTableTemplate(columns, reportColumnsSchema) {
    // Define which columns to display in the table
    const displayColumns = ['name', 'text', 'dataType', 'isVisible'];
    
    // Generate table headers
    const columnTableHeaders = `
        <th>Name</th>
        <th>Text</th>
        <th>Data Type</th>
        <th>Visible</th>
        <th>Actions</th>
    `;
    
    // Generate table rows
    const columnTableRows = columns.length > 0 
        ? columns.map((column, index) => {
            return `
                <tr data-index="${index}">
                    <td>${column.name || ''}</td>
                    <td>${column.text || ''}</td>
                    <td>${column.dataType || ''}</td>
                    <td>${column.isVisible || 'true'}</td>
                    <td>
                        <button class="edit-column-btn" data-index="${index}">Edit</button>
                    </td>
                </tr>
            `;
        }).join('')
        : `<tr><td colspan="5">No columns defined</td></tr>`;
    
    return { columnTableHeaders, columnTableRows };
}

module.exports = {
    getColumnsTableTemplate
};

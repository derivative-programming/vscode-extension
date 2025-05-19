"use strict";
const { formatLabel } = require("../../helpers/reportDataHelper");

/**
 * Generates the HTML for the parameters table
 * @param {Array} params The report parameters data
 * @param {Object} reportParamsSchema The parameter schema properties
 * @returns {Object} HTML for the parameters table headers and rows
 */
function getParamsTableTemplate(params, reportParamsSchema) {
    // Define which columns to display in the table
    const displayColumns = ['name', 'text', 'paramType'];
    
    // Generate table headers
    const paramTableHeaders = `
        <th>Name</th>
        <th>Text</th>
        <th>Type</th>
        <th>Actions</th>
    `;
    
    // Generate table rows
    const paramTableRows = params.length > 0 
        ? params.map((param, index) => {
            return `
                <tr data-index="${index}">
                    <td>${param.name || ''}</td>
                    <td>${param.text || ''}</td>
                    <td>${param.paramType || ''}</td>
                    <td>
                        <button class="edit-param-btn" data-index="${index}">Edit</button>
                    </td>
                </tr>
            `;
        }).join('')
        : `<tr><td colspan="4">No parameters defined</td></tr>`;
    
    return { paramTableHeaders, paramTableRows };
}

module.exports = {
    getParamsTableTemplate
};

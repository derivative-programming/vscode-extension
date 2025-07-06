"use strict";
const { formatLabel } = require("../../helpers/formDataHelper");

/**
 * Generates the table template for form parameters
 * @param {Array} params Array of form parameters
 * @param {Object} paramsSchema Schema properties for form parameters
 * @returns {Object} Object containing tableHeaders and tableRows HTML
 */
function getParamsTableTemplate(params, paramsSchema) {
    // Generate table headers based on schema
    const tableHeaders = Object.keys(paramsSchema)
        .sort((a, b) => a.localeCompare(b))
        .map(prop => `<th>${formatLabel(prop)}</th>`)
        .join("");
    
    // Generate table rows for each parameter
    const tableRows = params.map((param, index) => {
        const cells = Object.keys(paramsSchema)
            .sort((a, b) => a.localeCompare(b))
            .map(prop => {
                const value = param[prop] !== undefined ? param[prop] : '';
                return `<td>${value}</td>`;
            })
            .join("");
        
        return `<tr data-param-index="${index}">
            <td>${index + 1}</td>
            ${cells}
            <td>
                <button class="action-button edit-param" data-param-index="${index}">Edit</button>
                <button class="action-button move-up" data-param-index="${index}" ${index === 0 ? 'disabled' : ''}>▲</button>
                <button class="action-button move-down" data-param-index="${index}" ${index === params.length - 1 ? 'disabled' : ''}>▼</button>
            </td>
        </tr>`;
    }).join("");
    
    return { paramTableHeaders: tableHeaders, paramTableRows: tableRows };
}

/**
 * Generates the list view template for parameter fields
 * @param {Object} paramsSchema Schema properties for form parameters
 * @returns {string} HTML for parameter fields in list view
 */
function getParamsListTemplate(paramsSchema) {
    return Object.entries(paramsSchema)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([prop, schema]) => {
            // Check if property has enum values
            const hasEnum = schema.enum && Array.isArray(schema.enum);
            
            // Get description for tooltip
            const tooltip = schema.description ? `title="${schema.description}"` : "";
            
            // Generate appropriate input field based on whether it has enum values
            let inputField = "";
            if (hasEnum) {
                inputField = `<select id="param-${prop}" name="${prop}" ${tooltip} class="param-field">
                    <option value="">Select...</option>
                    ${schema.enum.map(option => `<option value="${option}">${option}</option>`).join("")}
                </select>`;
            } else {
                inputField = `<input type="text" id="param-${prop}" name="${prop}" ${tooltip} class="param-field">`;
            }
            
            return `<div class="form-row">
                <label for="param-${prop}" ${tooltip}>${formatLabel(prop)}:</label>
                ${inputField}
                <input type="checkbox" class="param-checkbox" data-prop="${prop}" title="Include this property">
            </div>`;
        }).join("");
}

module.exports = {
    getParamsTableTemplate,
    getParamsListTemplate
};

"use strict";
const { formatLabel } = require("../../helpers/formDataHelper");

/**
 * Generates the table template for form buttons
 * @param {Array} buttons Array of form buttons
 * @param {Object} buttonsSchema Schema properties for form buttons
 * @returns {Object} Object containing tableHeaders and tableRows HTML
 */
function getButtonsTableTemplate(buttons, buttonsSchema) {
    // Generate table headers based on schema
    const tableHeaders = Object.keys(buttonsSchema)
        .sort((a, b) => a.localeCompare(b))
        .map(prop => `<th>${formatLabel(prop)}</th>`)
        .join("");
    
    // Generate table rows for each button
    const tableRows = buttons.map((button, index) => {
        const cells = Object.keys(buttonsSchema)
            .sort((a, b) => a.localeCompare(b))
            .map(prop => {
                const value = button[prop] !== undefined ? button[prop] : '';
                return `<td>${value}</td>`;
            })
            .join("");
        
        return `<tr data-button-index="${index}">
            <td>${index + 1}</td>
            ${cells}
            <td>
                <button class="action-button edit-button" data-button-index="${index}">Edit</button>
                <button class="action-button move-up" data-button-index="${index}" ${index === 0 ? 'disabled' : ''}>▲</button>
                <button class="action-button move-down" data-button-index="${index}" ${index === buttons.length - 1 ? 'disabled' : ''}>▼</button>
            </td>
        </tr>`;
    }).join("");
    
    return { buttonTableHeaders: tableHeaders, buttonTableRows: tableRows };
}

/**
 * Generates the list view template for button fields
 * @param {Object} buttonsSchema Schema properties for form buttons
 * @returns {string} HTML for button fields in list view
 */
function getButtonsListTemplate(buttonsSchema) {
    return Object.entries(buttonsSchema)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([prop, schema]) => {
            // Check if property has enum values
            const hasEnum = schema.enum && Array.isArray(schema.enum);
            
            // Get description for tooltip
            const tooltip = schema.description ? `title="${schema.description}"` : "";
            
            // Generate appropriate input field based on whether it has enum values
            let inputField = "";
            if (hasEnum) {
                inputField = `<select id="button-${prop}" name="${prop}" ${tooltip} class="button-field">
                    <option value="">Select...</option>
                    ${schema.enum.map(option => `<option value="${option}">${option}</option>`).join("")}
                </select>`;
            } else {
                inputField = `<input type="text" id="button-${prop}" name="${prop}" ${tooltip} class="button-field">`;
            }
            
            return `<div class="form-row">
                <label for="button-${prop}" ${tooltip}>${formatLabel(prop)}:</label>
                ${inputField}
                <input type="checkbox" class="button-checkbox" data-prop="${prop}" title="Include this property">
            </div>`;
        }).join("");
}

module.exports = {
    getButtonsTableTemplate,
    getButtonsListTemplate
};

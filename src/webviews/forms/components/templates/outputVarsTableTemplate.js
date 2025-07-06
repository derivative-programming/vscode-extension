"use strict";
const { formatLabel } = require("../../helpers/formDataHelper");

/**
 * Generates the table template for form output variables
 * @param {Array} outputVars Array of form output variables
 * @param {Object} outputVarsSchema Schema properties for form output variables
 * @returns {Object} Object containing tableHeaders and tableRows HTML
 */
function getOutputVarsTableTemplate(outputVars, outputVarsSchema) {
    // Generate table headers based on schema
    const tableHeaders = Object.keys(outputVarsSchema)
        .sort((a, b) => a.localeCompare(b))
        .map(prop => `<th>${formatLabel(prop)}</th>`)
        .join("");
    
    // Generate table rows for each output variable
    const tableRows = outputVars.map((outputVar, index) => {
        const cells = Object.keys(outputVarsSchema)
            .sort((a, b) => a.localeCompare(b))
            .map(prop => {
                const value = outputVar[prop] !== undefined ? outputVar[prop] : '';
                return `<td>${value}</td>`;
            })
            .join("");
        
        return `<tr data-outputvar-index="${index}">
            <td>${index + 1}</td>
            ${cells}
            <td>
                <button class="action-button edit-outputvar" data-outputvar-index="${index}">Edit</button>
                <button class="action-button move-up" data-outputvar-index="${index}" ${index === 0 ? 'disabled' : ''}>▲</button>
                <button class="action-button move-down" data-outputvar-index="${index}" ${index === outputVars.length - 1 ? 'disabled' : ''}>▼</button>
            </td>
        </tr>`;
    }).join("");
    
    return { outputVarTableHeaders: tableHeaders, outputVarTableRows: tableRows };
}

/**
 * Generates the list view template for output variable fields
 * @param {Object} outputVarsSchema Schema properties for form output variables
 * @returns {string} HTML for output variable fields in list view
 */
function getOutputVarsListTemplate(outputVarsSchema) {
    return Object.entries(outputVarsSchema)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([prop, schema]) => {
            // Check if property has enum values
            const hasEnum = schema.enum && Array.isArray(schema.enum);
            
            // Get description for tooltip
            const tooltip = schema.description ? `title="${schema.description}"` : "";
            
            // Generate appropriate input field based on whether it has enum values
            let inputField = "";
            if (hasEnum) {
                inputField = `<select id="outputvar-${prop}" name="${prop}" ${tooltip} class="outputvar-field">
                    <option value="">Select...</option>
                    ${schema.enum.map(option => `<option value="${option}">${option}</option>`).join("")}
                </select>`;
            } else {
                inputField = `<input type="text" id="outputvar-${prop}" name="${prop}" ${tooltip} class="outputvar-field">`;
            }
            
            return `<div class="form-row">
                <label for="outputvar-${prop}" ${tooltip}>${formatLabel(prop)}:</label>
                ${inputField}
                <input type="checkbox" class="outputvar-checkbox" data-prop="${prop}" title="Include this property">
            </div>`;
        }).join("");
}

module.exports = {
    getOutputVarsTableTemplate,
    getOutputVarsListTemplate
};

"use strict";

// Import required helpers
const { formatLabel } = require("../../helpers/reportDataHelper");
const { getParamPropertiesToHide } = require("./paramsTableTemplate");

/**
 * Generates the parameters list view HTML content
 * @param {Object} reportParamsSchema Schema properties for parameter items
 * @returns {string} HTML content for list view fields
 */
function getParamsListTemplate(reportParamsSchema) {
    // Get properties to hide
    const propertiesToHide = getParamPropertiesToHide();
    
    // Create header columns for all param properties and sort them alphabetically
    // Make sure 'name' is always the first column if it exists
    // Filter out properties that should be hidden
    const paramColumns = Object.keys(reportParamsSchema)
        .filter(key => key !== "name" && !propertiesToHide.includes(key.toLowerCase()))
        .sort();
    if (reportParamsSchema.hasOwnProperty("name") && !propertiesToHide.includes("name")) {
        paramColumns.unshift("name");
    }

    // Generate list view form fields for all properties except name
    return paramColumns.filter(key => key !== "name").map(paramKey => {
        const paramSchema = reportParamsSchema[paramKey] || {};
        const hasEnum = paramSchema.enum && Array.isArray(paramSchema.enum);
        // Check if it's a boolean enum (containing only true/false values)
        const isBooleanEnum = hasEnum && paramSchema.enum.length === 2 && 
            paramSchema.enum.every(val => val === true || val === false || val === "true" || val === "false");
            
        const tooltip = paramSchema.description ? `title="${paramSchema.description}"` : "";
        
        const fieldId = `param${paramKey}`;
        
        // Note: The detailed parameter values will be populated by client-side JavaScript
        // when a parameter is selected from the list, so we set default values here
        let inputField = "";
        if (hasEnum) {
            // Always display all enum options even when disabled
            inputField = `<select id="${fieldId}" name="${paramKey}" ${tooltip} disabled>
                ${paramSchema.enum.map(option => {
                    // Default to 'false' for boolean enums
                    const isSelected = isBooleanEnum ? (option === false || option === "false") : false;
                    
                    return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                }).join("")}
            </select>`;
        } else {
            inputField = `<input type="text" id="${fieldId}" name="${paramKey}" value="" ${tooltip} readonly>`;
        }
        
        // Note: We'll dynamically set the disabled attribute for checked checkboxes in the JavaScript
        return `<div class="form-row">
            <label for="${fieldId}" ${tooltip}>${formatLabel(paramKey)}:</label>
            ${inputField}
            <input type="checkbox" id="${fieldId}Editable" data-field-id="${fieldId}" title="Toggle property existence" style="margin-left: 5px; transform: scale(0.8);">
        </div>`;
    }).join("");
}

module.exports = {
    getParamsListTemplate,
    getParamPropertiesToHide
};
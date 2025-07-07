"use strict";
const { formatLabel } = require("../../helpers/formDataHelper");

/**
 * File: paramsListTemplate.js
 * Purpose: Provides HTML template for parameters list view in forms
 * Created: 2025-07-06
 */

/**
 * Generates the HTML for parameter list view fields
 * @param {Object} paramSchema Schema for form parameters
 * @returns {string} HTML for parameter list view fields
 */
function getParamsListTemplate(paramSchema) {
    // Sort properties alphabetically
    const sortedProperties = Object.keys(paramSchema)
        .filter(key => key !== "name") // Exclude name as it's already shown in the list
        .sort();
    
    let html = '';
    
    // Generate list view form fields for all properties except name
    sortedProperties.forEach(propKey => {
        const schema = paramSchema[propKey] || {};
        const hasEnum = schema.enum && Array.isArray(schema.enum);
        // Check if it's a boolean enum (containing only true/false values)
        const isBooleanEnum = hasEnum && schema.enum.length === 2 && 
            schema.enum.every(val => val === true || val === false || val === "true" || val === "false");
            
        const tooltip = schema.description ? `title="${schema.description}"` : "";
        
        const fieldId = `param${propKey}`;
        
        let inputField = "";
        if (hasEnum) {
            // Always display all enum options even when disabled
            inputField = `<select id="${fieldId}" name="${propKey}" ${tooltip} disabled>
                ${schema.enum.map(option => {
                    // Check if there's a default value in the schema
                    let isSelected = false;
                    
                    if (schema.default !== undefined) {
                        // Use the schema's default value if available
                        isSelected = option === schema.default;
                    } else if (isBooleanEnum) {
                        // Default to 'false' for boolean enums if no default specified
                        isSelected = (option === false || option === "false");
                    } else if (schema.enum.indexOf(option) === 0) {
                        // For non-boolean enums with no default, select the first option
                        isSelected = true;
                    }
                    
                    return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                }).join("")}
            </select>`;
        } else {
            inputField = `<input type="text" id="${fieldId}" name="${propKey}" value="" ${tooltip} readonly>`;
        }
        
        html += `<div class="form-row">
            <label for="${fieldId}" ${tooltip}>${formatLabel(propKey)}:</label>
            <div class="control-with-checkbox">
                ${inputField}
                <input type="checkbox" id="${fieldId}Editable" data-field-id="${fieldId}" title="Toggle property existence" class="property-toggle">
            </div>
        </div>`;
    });
    
    return html;
}

module.exports = {
    getParamsListTemplate
};

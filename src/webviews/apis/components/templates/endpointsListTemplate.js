"use strict";
const { formatLabel } = require("../../helpers/schemaLoader");

/**
 * File: endpointsListTemplate.js
 * Purpose: Provides HTML template for endpoints list view in API sites
 * Created: 2025-01-27
 */

/**
 * Gets the list of endpoint properties that should be hidden in the endpoints tab
 * @returns {Array<string>} Array of property names to hide (lowercase)
 */
function getEndpointPropertiesToHide() {
    return [
        "name",
        "description",
        "pluralname"
    ];
}

/**
 * Generates the HTML for endpoint list view fields
 * @param {Object} endpointSchema Schema for API endpoints
 * @returns {string} HTML for endpoint list view fields
 */
function getEndpointsListTemplate(endpointSchema) {
    // Get properties to hide
    const propertiesToHide = getEndpointPropertiesToHide();
    
    // Sort properties alphabetically and filter out hidden ones
    const sortedProperties = Object.keys(endpointSchema)
        .filter(key => key !== "name" && !propertiesToHide.includes(key.toLowerCase()))
        .sort();
    
    let html = '';
    
    // Generate list view form fields for all properties except name
    sortedProperties.forEach(propKey => {
        const schema = endpointSchema[propKey] || {};
        const hasEnum = schema.enum && Array.isArray(schema.enum);
        // Check if it's a boolean enum (containing only true/false values)
        const isBooleanEnum = hasEnum && schema.enum.length === 2 && 
            schema.enum.every(val => val === true || val === false || val === "true" || val === "false");
            
        const tooltip = schema.description ? `title="${schema.description}"` : "";
        
        const fieldId = `endpoint${propKey}`;
        
        let inputField = "";
        if (hasEnum) {
            // Always display all enum options even when disabled
            const sortedOptions = schema.enum.slice().sort(); // Create a copy and sort alphabetically
            inputField = `<select id="${fieldId}" name="${propKey}" ${tooltip} disabled>
                ${sortedOptions.map(option => {
                    // Check if there's a default value in the schema
                    let isSelected = false;
                    
                    if (schema.default !== undefined) {
                        // Use the schema's default value if available
                        isSelected = option === schema.default;
                    } else if (isBooleanEnum) {
                        // Default to 'false' for boolean enums if no default specified
                        isSelected = (option === false || option === "false");
                    } else if (sortedOptions.indexOf(option) === 0) {
                        // For non-boolean enums with no default, select the first option
                        isSelected = true;
                    }
                    
                    return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                }).join("")}
            </select>`;
        } else {
            inputField = `<input type="text" id="${fieldId}" name="${propKey}" value="" ${tooltip} readonly>`;
        }
        
        // Add browse button for specific fields if needed (following form pattern)
        let browseButton = "";
        let controlContainer = "";
        if (propKey === "sourceObjectName" || propKey === "targetObjectName") {
            browseButton = `<button type="button" class="lookup-button" data-prop="${propKey}" data-field-id="${fieldId}" disabled title="Browse Objects">
                <span class="codicon codicon-search"></span>
            </button>`;
            controlContainer = `<div class="control-with-button">${inputField}${browseButton}</div>`;
        } else {
            controlContainer = inputField;
        }
        
        html += `<div class="form-row">
            <label for="${fieldId}" ${tooltip}>${formatLabel(propKey)}:</label>
            <div class="control-with-checkbox">
                ${controlContainer}
                <input type="checkbox" id="${fieldId}Editable" data-field-id="${fieldId}" title="Toggle property existence" class="property-toggle">
            </div>
        </div>`;
    });
    
    return html;
}

module.exports = {
    getEndpointsListTemplate,
    getEndpointPropertiesToHide
};
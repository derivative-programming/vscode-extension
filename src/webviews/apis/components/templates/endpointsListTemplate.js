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
        const label = formatLabel(propKey);
        const description = schema.description || `Set the ${label} for this endpoint`;
        
        if (hasEnum) {
            // Enum dropdown - sort alphabetically
            const sortedEnumValues = [...schema.enum].sort();
            html += `
                <div class="form-row">
                    <div class="form-field-container">
                        <label class="form-label" for="endpoint${propKey}" title="${description}">
                            <input type="checkbox" id="endpoint${propKey}Editable" class="property-checkbox" />
                            ${label}:
                        </label>
                        <select id="endpoint${propKey}" class="form-select" disabled title="${description}">
                            <option value="">Select ${label}</option>
                            ${sortedEnumValues.map(val => `<option value="${val}">${val}</option>`).join('')}
                        </select>
                    </div>
                </div>`;
        } else {
            // Text input for other properties
            html += `
                <div class="form-row">
                    <div class="form-field-container">
                        <label class="form-label" for="endpoint${propKey}" title="${description}">
                            <input type="checkbox" id="endpoint${propKey}Editable" class="property-checkbox" />
                            ${label}:
                        </label>
                        <input type="text" id="endpoint${propKey}" class="form-input" disabled title="${description}" />
                    </div>
                </div>`;
        }
    });
    
    return html;
}

module.exports = {
    getEndpointsListTemplate,
    getEndpointPropertiesToHide
};
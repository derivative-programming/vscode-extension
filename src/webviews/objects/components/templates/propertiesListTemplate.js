"use strict";

/**
 * Generates the properties list view HTML content
 * @param {Object} propItemsSchema Schema properties for property items
 * @returns {string} HTML content for list view fields
 */
function getPropertiesListTemplate(propItemsSchema) {
    // Create header columns for all prop item properties and sort them alphabetically
    // Make sure 'name' is always the first column
    // Hide specific properties that should not be displayed to the user
    const hiddenProperties = ["isFKNonLookupIncludedInXMLFunction"];
    const propColumns = Object.keys(propItemsSchema)
        .filter(key => key !== "name" && !hiddenProperties.includes(key))
        .sort();
    propColumns.unshift("name");

    // Generate list view form fields for all properties
    return propColumns.filter(key => key !== "name").map(propKey => {
        const propSchema = propItemsSchema[propKey] || {};
        const hasEnum = propSchema.enum && Array.isArray(propSchema.enum);
        // Check if it's a boolean enum (containing only true/false values)
        const isBooleanEnum = hasEnum && propSchema.enum.length === 2 && 
            propSchema.enum.every(val => val === true || val === false || val === "true" || val === "false");
            
        const tooltip = propSchema.description ? `title="${propSchema.description}"` : "";
        
        const fieldId = `prop${propKey}`;
        
        // Note: The detailed property values will be populated by client-side JavaScript
        // when a property is selected from the list, so we set default values here
        let inputField = "";
        if (hasEnum) {
            // Always display all enum options even when disabled
            inputField = `<select id="${fieldId}" name="${propKey}" ${tooltip} disabled>
                ${propSchema.enum.map(option => {
                    // Check if there's a default value in the schema
                    let isSelected = false;
                    
                    if (propSchema.default !== undefined) {
                        // Use the schema's default value if available
                        isSelected = option === propSchema.default;
                    } else if (isBooleanEnum) {
                        // Default to 'false' for boolean enums if no default specified
                        isSelected = (option === false || option === "false");
                    } else if (propSchema.enum.indexOf(option) === 0) {
                        // For non-boolean enums with no default, select the first option
                        isSelected = true;
                    }
                    
                    return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                }).join("")}
            </select>`;        } else {
            inputField = `<input type="text" id="${fieldId}" name="${propKey}" value="" ${tooltip} readonly>`;
        }
        
        // Add magnifying glass button for fKObjectName field
        let lookupButton = "";
        if (propKey === "fKObjectName") {
            lookupButton = `<button type="button" class="lookup-button" data-prop="${propKey}" data-field-id="${fieldId}" disabled title="Browse for FK Object">
                <span class="codicon codicon-search"></span>
            </button>`;
        }
        
        // Note: We'll dynamically set the disabled attribute for checked checkboxes in the JavaScript
        return `<div class="form-row">
            <label for="${fieldId}" ${tooltip}>${formatLabel(propKey)}:</label>
            <div class="control-with-button">
                ${inputField}
                ${lookupButton}
            </div>
            <input type="checkbox" id="${fieldId}Editable" data-field-id="${fieldId}" title="Toggle property existence" style="margin-left: 5px; transform: scale(0.8);">
        </div>`;
    }).join("");
}

// Import required helpers
const { formatLabel } = require("../../helpers/objectDataHelper");

module.exports = {
    getPropertiesListTemplate
};
"use strict";

/**
 * Generates the properties list view HTML content
 * @param {Object} propItemsSchema Schema properties for property items
 * @returns {string} HTML content for list view fields
 */
function getPropertiesListTemplate(propItemsSchema) {
    // Create header columns for all prop item properties and sort them alphabetically
    // Make sure 'name' is always the first column
    const propColumns = Object.keys(propItemsSchema).filter(key => key !== "name").sort();
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
        
        let inputField = "";
        if (hasEnum) {
            // Always display all enum options even when disabled
            inputField = `<select id="${fieldId}" name="${propKey}" ${tooltip} disabled>
                ${propSchema.enum.map(option => {
                    // Default to 'false' for boolean enums
                    const isSelected = isBooleanEnum ? (option === false || option === "false") : false;
                    
                    return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                }).join("")}
            </select>`;
        } else {
            inputField = `<input type="text" id="${fieldId}" name="${propKey}" value="" ${tooltip} readonly>`;
        }
        
        return `<div class="form-row">
            <label for="${fieldId}" ${tooltip}>${formatLabel(propKey)}:</label>
            ${inputField}
            <input type="checkbox" id="${fieldId}Editable" data-field-id="${fieldId}" title="Toggle property existence" style="margin-left: 5px; transform: scale(0.8);">
        </div>`;
    }).join("");
}

// Import required helpers
const { formatLabel } = require("../../helpers/objectDataHelper");

module.exports = {
    getPropertiesListTemplate
};
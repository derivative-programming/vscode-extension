"use strict";

// Import required helpers
const { formatLabel } = require("../../helpers/formDataHelper");
const { getButtonPropertiesToHide } = require("./buttonsTableTemplate");

/**
 * Generates the buttons list view HTML content
 * @param {Object} buttonsSchema Schema properties for button items
 * @returns {string} HTML content for list view fields
 */
function getButtonsListTemplate(buttonsSchema) {
    // Get properties to hide
    const propertiesToHide = getButtonPropertiesToHide();
    
    // Create header columns for all button properties and sort them alphabetically
    // Make sure 'buttonName' is always the first column if it exists
    // Filter out properties that should be hidden
    const buttonColumns = Object.keys(buttonsSchema)
        .filter(key => key !== "buttonName" && !propertiesToHide.includes(key.toLowerCase()))
        .sort();
    if (buttonsSchema.hasOwnProperty("buttonName")) {
        buttonColumns.unshift("buttonName");
    }

    // Generate list view form fields for all properties except buttonName
    return buttonColumns.filter(key => key !== "buttonName").map(buttonKey => {
        const buttonSchema = buttonsSchema[buttonKey] || {};
        const hasEnum = buttonSchema.enum && Array.isArray(buttonSchema.enum);
        // Check if it's a boolean enum (containing only true/false values)
        const isBooleanEnum = hasEnum && buttonSchema.enum.length === 2 && 
            buttonSchema.enum.every(val => val === true || val === false || val === "true" || val === "false");
            
        const tooltip = buttonSchema.description ? `title="${buttonSchema.description}"` : "";
        
        const fieldId = `button${buttonKey}`;
        
        // Note: The detailed button values will be populated by client-side JavaScript
        // when a button is selected from the list, so we set default values here
        let inputField = "";
        if (hasEnum) {
            // Always display all enum options even when disabled
            inputField = `<select id="${fieldId}" name="${buttonKey}" ${tooltip} disabled>
                ${buttonSchema.enum
                    .slice() // Create a copy to avoid mutating the original array
                    .sort() // Sort alphabetically
                    .map(option => {
                    // Check if there's a default value in the schema
                    let isSelected = false;
                    
                    if (buttonSchema.default !== undefined) {
                        // Use the schema's default value if available
                        isSelected = option === buttonSchema.default;
                    } else if (isBooleanEnum) {
                        // Default to 'false' for boolean enums if no default specified
                        isSelected = (option === false || option === "false");
                    } else if (buttonSchema.enum.indexOf(option) === 0) {
                        // For non-boolean enums with no default, select the first option
                        isSelected = true;
                    }
                    
                    return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                }).join("")}
            </select>`;
        } else {
            inputField = `<input type="text" id="${fieldId}" name="${buttonKey}" value="" ${tooltip} readonly>`;
        }
        
        // Note: We'll dynamically set the disabled attribute for checked checkboxes in the JavaScript
        return `<div class="form-row">
            <label for="${fieldId}" ${tooltip}>${formatLabel(buttonKey)}:</label>
            <div class="control-with-checkbox">
                ${inputField}
                <input type="checkbox" id="${fieldId}Editable" data-field-id="${fieldId}" title="Toggle property existence" class="property-toggle">
            </div>
        </div>`;
    }).join("");
}

module.exports = {
    getButtonsListTemplate
};

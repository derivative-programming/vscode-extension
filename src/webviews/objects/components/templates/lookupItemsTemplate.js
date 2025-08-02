"use strict";

// lookupItemsTemplate.js
// Template for rendering lookup items tab content
// Created: 2025-06-27

/**
 * Generates HTML content for the lookup items tab
 * @param {Array} lookupItems Array of lookup items
 * @param {Object} lookupItemsSchema Schema properties for lookup items
 * @returns {Object} Object containing HTML for table headers, rows, and form fields
 */
function getLookupItemsTemplate(lookupItems, lookupItemsSchema) {
    // Ensure lookupItems is always an array, even if undefined
    const safeLookupItems = Array.isArray(lookupItems) ? lookupItems : [];
    
    // Create header columns for all lookup item properties and sort them alphabetically
    // Make sure 'name' is always the first column if it exists
    const lookupColumns = Object.keys(lookupItemsSchema).filter(key => key !== "name").sort();
    if (lookupItemsSchema.name) {
        lookupColumns.unshift("name");
    }

    // Generate table headers with tooltips based on schema descriptions
    const tableHeaders = lookupColumns.map(key => {
        const propSchema = lookupItemsSchema[key] || {};
        const tooltip = propSchema.description ? ` title="${propSchema.description}"` : "";
        return `<th${tooltip}>${formatLabel(key)}</th>`;
    }).join("");

    // Generate table rows for all lookup items
    const tableRows = safeLookupItems.map((item, index) => {
        const cells = lookupColumns.map(propKey => {
            const propSchema = lookupItemsSchema[propKey] || {};
            const hasEnum = propSchema.enum && Array.isArray(propSchema.enum);
            // Check if it's a boolean enum (containing only true/false values)
            const isBooleanEnum = hasEnum && propSchema.enum.length === 2 && 
                propSchema.enum.every(val => val === true || val === false || val === "true" || val === "false");
            
            const tooltip = propSchema.description ? `title="${propSchema.description}"` : "";
            
            // Check if the property exists and is not null or undefined
            const propertyExists = item.hasOwnProperty(propKey) && item[propKey] !== null && item[propKey] !== undefined;
            
            // Special handling for the name column
            if (propKey === "name") {
                return `<td>
                    <span class="lookup-item-name">${item.name || "Unnamed Lookup Item"}</span>
                    <input type="hidden" name="name" value="${item.name || ""}">
                </td>`;
            }
            
            let inputField = "";
            if (hasEnum) {
                // Always show all options in the dropdown but disable it if property doesn't exist or is null/undefined
                inputField = `<select name="${propKey}" ${tooltip} ${!propertyExists ? "disabled" : ""}>
                    ${propSchema.enum
                        .slice() // Create a copy to avoid mutating the original array
                        .sort() // Sort alphabetically
                        .map(option => {
                        // If it's a boolean enum and the property doesn't exist or is null/undefined, default to 'false'
                        const isSelected = isBooleanEnum && !propertyExists ? 
                            (option === false || option === "false") : 
                            item[propKey] === option;
                        
                        return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                    }).join("")}
                </select>`;
            } else {
                inputField = `<input type="text" name="${propKey}" value="${propertyExists ? item[propKey] : ""}" ${tooltip} ${!propertyExists ? "readonly" : ""}>`;
            }
            
            // If the property exists, add a data attribute to indicate it was originally checked
            // and disable the checkbox to prevent unchecking
            const originallyChecked = propertyExists ? "data-originally-checked=\"true\"" : "";
            
            return `<td>
                <div class="control-with-checkbox">
                    ${inputField}
                    <input type="checkbox" class="lookup-item-checkbox" data-prop="${propKey}" data-index="${index}" ${propertyExists ? "checked disabled" : ""} ${originallyChecked} title="Toggle property existence">
                </div>
            </td>`;
        }).join("");
        
        return `<tr data-index="${index}">${cells}</tr>`;
    }).join("");

    // Generate form fields for list view editing
    const formFields = lookupColumns.filter(key => key !== "name").map(propKey => {
        const propSchema = lookupItemsSchema[propKey] || {};
        const hasEnum = propSchema.enum && Array.isArray(propSchema.enum);
        // Check if it's a boolean enum (containing only true/false values)
        const isBooleanEnum = hasEnum && propSchema.enum.length === 2 && 
            propSchema.enum.every(val => val === true || val === false || val === "true" || val === "false");
            
        const tooltip = propSchema.description ? `title="${propSchema.description}"` : "";
        
        const fieldId = `lookupItem${propKey}`;
        
        // Note: The detailed lookup item values will be populated by client-side JavaScript
        // when a lookup item is selected from the list, so we set default values here
        let inputField = "";
        if (hasEnum) {
            // Always display all enum options even when disabled
            inputField = `<select id="${fieldId}" name="${propKey}" ${tooltip} disabled>
                ${propSchema.enum
                    .slice() // Create a copy to avoid mutating the original array
                    .sort() // Sort alphabetically
                    .map(option => {
                    // Default to 'false' for boolean enums
                    const isSelected = isBooleanEnum ? (option === false || option === "false") : false;
                    
                    return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                }).join("")}
            </select>`;
        } else {
            inputField = `<input type="text" id="${fieldId}" name="${propKey}" value="" ${tooltip} readonly>`;
        }
        
        // Note: We'll dynamically set the disabled attribute for checked checkboxes in the JavaScript
        return `<div class="form-row">
            <label for="${fieldId}" ${tooltip}>${formatLabel(propKey)}:</label>
            <div class="control-with-button">
                ${inputField}
            </div>
            <input type="checkbox" id="${fieldId}Editable" data-field-id="${fieldId}" title="Toggle property existence" style="margin-left: 5px; transform: scale(0.8);">
        </div>`;
    }).join("");

    return {
        tableHeaders,
        tableRows,
        formFields,
        lookupColumns
    };
}

// Import required helpers
const { formatLabel } = require("../../helpers/objectDataHelper");

module.exports = {
    getLookupItemsTemplate
};

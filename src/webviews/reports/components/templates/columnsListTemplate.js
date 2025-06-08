"use strict";

// Import required helpers
const { formatLabel } = require("../../helpers/reportDataHelper");
const { getColumnPropertiesToHide } = require("./columnsTableTemplate");

/**
 * Generates the columns list view HTML content
 * @param {Object} reportColumnsSchema Schema properties for column items
 * @returns {string} HTML content for list view fields
 */
function getColumnsListTemplate(reportColumnsSchema) {
    // Get properties to hide
    const propertiesToHide = getColumnPropertiesToHide();
    
    // Create header columns for all column properties and sort them alphabetically
    // Make sure 'name' is always the first column if it exists
    // Filter out properties that should be hidden
    const columnColumns = Object.keys(reportColumnsSchema)
        .filter(key => key !== "name" && !propertiesToHide.includes(key.toLowerCase()))
        .sort();
    if (reportColumnsSchema.hasOwnProperty("name")) {
        columnColumns.unshift("name");
    }

    // Generate list view form fields for all properties except name
    return columnColumns.filter(key => key !== "name").map(columnKey => {
        const columnSchema = reportColumnsSchema[columnKey] || {};
        const hasEnum = columnSchema.enum && Array.isArray(columnSchema.enum);
        // Check if it's a boolean enum (containing only true/false values)
        const isBooleanEnum = hasEnum && columnSchema.enum.length === 2 && 
            columnSchema.enum.every(val => val === true || val === false || val === "true" || val === "false");
            
        const tooltip = columnSchema.description ? `title="${columnSchema.description}"` : "";
        
        const fieldId = `column${columnKey}`;
        
        // Note: The detailed column values will be populated by client-side JavaScript
        // when a column is selected from the list, so we set default values here
        let inputField = "";
        if (hasEnum) {
            // Always display all enum options even when disabled
            inputField = `<select id="${fieldId}" name="${columnKey}" ${tooltip} disabled>
                ${columnSchema.enum.map(option => {
                    // Default to 'false' for boolean enums
                    const isSelected = isBooleanEnum ? (option === false || option === "false") : false;
                    
                    return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                }).join("")}
            </select>`;
        } else {
            inputField = `<input type="text" id="${fieldId}" name="${columnKey}" value="" ${tooltip} readonly>`;
        }
        
        // Note: We'll dynamically set the disabled attribute for checked checkboxes in the JavaScript
        return `<div class="form-row">
            <label for="${fieldId}" ${tooltip}>${formatLabel(columnKey)}:</label>
            ${inputField}
            <input type="checkbox" id="${fieldId}Editable" data-field-id="${fieldId}" title="Toggle property existence" style="margin-left: 5px; transform: scale(0.8);">
        </div>`;    }).join("");
}

module.exports = {
    getColumnsListTemplate
};
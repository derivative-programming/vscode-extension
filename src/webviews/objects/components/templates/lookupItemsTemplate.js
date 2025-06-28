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
    // Generate table headers for lookup items
    const tableHeaders = Object.keys(lookupItemsSchema)
        .sort() // Display properties in alphabetical order
        .map(prop => {
            const propSchema = lookupItemsSchema[prop];
            const description = propSchema.description || "";
            return `<th title="${description}">${formatLabel(prop)}</th>`;
        }).join("");

    // Generate table rows for lookup items
    const tableRows = lookupItems.map((item, index) => {
        const cells = Object.keys(lookupItemsSchema)
            .sort()
            .map(prop => {
                const value = item[prop] || "";
                return `<td data-prop="${prop}" data-index="${index}">${value}</td>`;
            }).join("");
        return `<tr data-index="${index}">${cells}<td><button class="delete-lookup-item" data-index="${index}">Delete</button></td></tr>`;
    }).join("");

    // Generate form fields for editing lookup items
    const formFields = Object.keys(lookupItemsSchema)
        .sort()
        .map(prop => {
            const propSchema = lookupItemsSchema[prop];
            const description = propSchema.description || "";
            const isEnum = propSchema.enum && propSchema.enum.length > 0;
            
            let inputHtml = "";
            if (isEnum) {
                // Create dropdown for enum properties
                const options = propSchema.enum.map(option => 
                    `<option value="${option}">${option}</option>`
                ).join("");
                inputHtml = `<select id="lookupItem_${prop}" name="${prop}" title="${description}">${options}</select>`;
            } else {
                // Create text input for other properties
                inputHtml = `<input type="text" id="lookupItem_${prop}" name="${prop}" title="${description}" />`;
            }

            return `
                <div class="form-row">
                    <label for="lookupItem_${prop}" title="${description}">${formatLabel(prop)}:</label>
                    ${inputHtml}
                </div>
            `;
        }).join("");

    return {
        tableHeaders: tableHeaders + "<th>Actions</th>",
        tableRows,
        formFields
    };
}

/**
 * Formats a property name to a human-readable label
 * @param {string} propName The property name to format
 * @returns {string} Formatted label
 */
function formatLabel(propName) {
    // Convert camelCase/PascalCase to readable format
    // Keep consecutive capital letters together (e.g., "DNAApp" → "DNA App")
    return propName
        .replace(/([a-z])([A-Z])/g, "$1 $2")  // Add space before capital letters
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")  // Handle consecutive caps
        .replace(/^./, char => char.toUpperCase());  // Capitalize first letter
}

module.exports = {
    getLookupItemsTemplate
};

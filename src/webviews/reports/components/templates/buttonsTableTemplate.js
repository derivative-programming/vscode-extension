"use strict";
const { formatLabel } = require("../../helpers/reportDataHelper");

/**
 * Generates the HTML for the buttons table with property-style editing
 * @param {Array} buttons The report buttons data
 * @param {Object} reportButtonsSchema The button schema properties
 * @returns {Object} HTML for the buttons table headers and rows
 */
function getButtonsTableTemplate(buttons, reportButtonsSchema) {
    // Ensure buttons is always an array, even if undefined
    const safeButtons = Array.isArray(buttons) ? buttons : [];
    
    // Create header columns for all button properties and sort them alphabetically
    // Use a naming property as first column if available (buttonName, buttonText, or just name)
    const buttonColumns = Object.keys(reportButtonsSchema).filter(key => 
        key !== "buttonName" && key !== "buttonText" && key !== "name"
    ).sort();
    
    // Determine the primary identifying column - prefer buttonName, then buttonText, then name
    let primaryColumn = "buttonName";
    if (!reportButtonsSchema.buttonName && reportButtonsSchema.buttonText) {
        primaryColumn = "buttonText";
    } else if (!reportButtonsSchema.buttonName && !reportButtonsSchema.buttonText && reportButtonsSchema.name) {
        primaryColumn = "name";
    }
    
    // Add the primary column to the beginning if it exists in schema
    if (reportButtonsSchema[primaryColumn]) {
        buttonColumns.unshift(primaryColumn);
    }

    // Generate table headers with tooltips based on schema descriptions
    const buttonTableHeaders = buttonColumns.map(key => {
        const buttonSchema = reportButtonsSchema[key] || {};
        const tooltip = buttonSchema.description ? ` title="${buttonSchema.description}"` : "";
        return `<th${tooltip}>${formatLabel(key)}</th>`;
    }).join("");

    // Generate table rows for all buttons
    const buttonTableRows = safeButtons.map((button, index) => {
        const cells = buttonColumns.map(buttonKey => {
            const buttonSchema = reportButtonsSchema[buttonKey] || {};
            const hasEnum = buttonSchema.enum && Array.isArray(buttonSchema.enum);
            // Check if it's a boolean enum (containing only true/false values)
            const isBooleanEnum = hasEnum && buttonSchema.enum.length === 2 && 
                buttonSchema.enum.every(val => val === true || val === false || val === "true" || val === "false");
            
            const tooltip = buttonSchema.description ? `title="${buttonSchema.description}"` : "";
            
            // Check if the property exists and is not null or undefined
            const propertyExists = button.hasOwnProperty(buttonKey) && button[buttonKey] !== null && button[buttonKey] !== undefined;
            
            // Special handling for the primary column (name-like field)
            if (buttonKey === primaryColumn) {
                const displayValue = button[primaryColumn] || "Unnamed Button";
                return `<td>
                    <span class="button-name">${displayValue}</span>
                    <input type="hidden" name="${primaryColumn}" value="${button[primaryColumn] || ""}">
                </td>`;
            }
            
            let inputField = "";
            if (hasEnum) {
                // Always show all options in the dropdown but disable it if property doesn't exist or is null/undefined
                inputField = `<select name="${buttonKey}" ${tooltip} ${!propertyExists ? "disabled" : ""}>
                    ${buttonSchema.enum.map(option => {
                        // If it's a boolean enum and the property doesn't exist or is null/undefined, default to 'false'
                        const isSelected = isBooleanEnum && !propertyExists ? 
                            (option === false || option === "false") : 
                            button[buttonKey] === option;
                        
                        return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                    }).join("")}
                </select>`;
            } else {
                inputField = `<input type="text" name="${buttonKey}" value="${propertyExists ? button[buttonKey] : ""}" ${tooltip} ${!propertyExists ? "readonly" : ""}>`;
            }
            
            // If the property exists, add a data attribute to indicate it was originally checked
            // and disable the checkbox to prevent unchecking
            const originallyChecked = propertyExists ? "data-originally-checked=\"true\"" : "";
            
            return `<td>
                <div class="control-with-checkbox">
                    ${inputField}
                    <input type="checkbox" class="button-checkbox" data-prop="${buttonKey}" data-index="${index}" ${propertyExists ? "checked disabled" : ""} ${originallyChecked} title="Toggle property existence">
                </div>
            </td>`;
        }).join("");
        
        return `<tr data-index="${index}">${cells}</tr>`;
    }).join("");

    return { buttonTableHeaders, buttonTableRows, buttonColumns };
}

module.exports = {
    getButtonsTableTemplate
};

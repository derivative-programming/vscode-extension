"use strict";
const { formatLabel } = require("../../helpers/reportDataHelper");

/**
 * Gets the list of button properties that should be hidden in the buttons tab
 * @returns {Array<string>} Array of property names to hide (lowercase)
 */
function getButtonPropertiesToHide() {
    return [
        "destinationcontextobjectname"
    ];
}

/**
 * Generates the HTML for the buttons table
 * @param {Array} buttons The report buttons data
 * @param {Object} reportButtonsSchema The button schema properties
 * @returns {Object} HTML for the buttons table headers and rows
 */
function getButtonsTableTemplate(buttons, reportButtonsSchema) {
    // Ensure buttons is always an array, even if undefined
    const safeButtons = Array.isArray(buttons) ? buttons : [];
    
    // Get properties to hide
    const propertiesToHide = getButtonPropertiesToHide();
    
    // Create header columns for all button properties and sort them alphabetically
    // Make sure 'buttonName' is always the first column if it exists
    // Filter out properties that should be hidden
    const buttonColumns = Object.keys(reportButtonsSchema)
        .filter(key => key !== "buttonName" && !propertiesToHide.includes(key.toLowerCase()))
        .sort();
    if (reportButtonsSchema.hasOwnProperty("buttonName")) {
        buttonColumns.unshift("buttonName");
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
            
            // Special handling for the buttonName column
            if (buttonKey === "buttonName") {
                return `<td>
                    <span class="button-name">${button.buttonName || "Unnamed Button"}</span>
                    <input type="hidden" name="buttonName" value="${button.buttonName || ""}">
                </td>`;
            }
            
            let inputField = "";
            if (hasEnum) {
                // Always show all options in the dropdown but disable it if property doesn't exist or is null/undefined
                inputField = `<select name="${buttonKey}" ${tooltip} ${!propertyExists ? "disabled" : ""}>
                    ${buttonSchema.enum
                        .slice() // Create a copy to avoid mutating the original array
                        .sort() // Sort alphabetically
                        .map(option => {
                        let isSelected = false;
                        
                        if (propertyExists) {
                            // If the property exists, select the matching option
                            isSelected = button[buttonKey] === option;
                        } else {
                            // If the property doesn't exist, use default value logic
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
                        }
                        
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
    getButtonsTableTemplate,
    getButtonPropertiesToHide
};

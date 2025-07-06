"use strict";
const { formatLabel } = require("../../helpers/formDataHelper");

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
 * Generates the table template for form buttons
 * @param {Array} buttons Array of form buttons
 * @param {Object} buttonsSchema Schema properties for form buttons
 * @returns {Object} Object containing buttonTableHeaders and buttonTableRows HTML
 */
function getButtonsTableTemplate(buttons, buttonsSchema) {
    // Ensure buttons is always an array, even if undefined
    const safeButtons = Array.isArray(buttons) ? buttons : [];
    
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

    // Generate table headers with tooltips based on schema descriptions
    const buttonTableHeaders = buttonColumns.map(key => {
        const buttonSchema = buttonsSchema[key] || {};
        const tooltip = buttonSchema.description ? ` title="${buttonSchema.description}"` : "";
        return `<th${tooltip}>${formatLabel(key)}</th>`;
    }).join("");

    // Generate table rows for all buttons
    const buttonTableRows = safeButtons.map((button, index) => {
        const cells = buttonColumns.map(buttonKey => {
            const buttonSchema = buttonsSchema[buttonKey] || {};
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
                    ${buttonSchema.enum.map(option => {
                        // If it's a boolean enum and the property doesn't exist or is null/undefined, default to 'false'
                        const isSelected = isBooleanEnum && !propertyExists ? 
                            (option === false || option === "false") : 
                            button[buttonKey] === option;
                        return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                    }).join("")}
                </select>`;
            } else {
                inputField = `<input type="text" name="${buttonKey}" value="${propertyExists ? button[buttonKey] : ''}" ${tooltip} ${!propertyExists ? "readonly" : ""}>`;
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
        
        return `<tr data-index="${index}">
            <td>${index + 1}</td>
            ${cells}
            <td class="action-column">
                <button class="action-button edit-button" data-index="${index}" title="Edit this button">Edit</button>
                <button class="action-button copy-button" data-index="${index}" title="Copy this button">Copy</button>
                <button class="action-button move-up-button" data-index="${index}" ${index === 0 ? 'disabled' : ''} title="Move up">▲</button>
                <button class="action-button move-down-button" data-index="${index}" ${index === safeButtons.length - 1 ? 'disabled' : ''} title="Move down">▼</button>
            </td>
        </tr>`;
    }).join("");
    
    return { buttonTableHeaders, buttonTableRows, buttonColumns };
}

/**
 * Generates the list view template for button fields
 * @param {Object} buttonsSchema Schema properties for form buttons
 * @returns {string} HTML for button fields in list view
 */
function getButtonsListTemplate(buttonsSchema) {
    return Object.entries(buttonsSchema)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([prop, schema]) => {
            // Check if property has enum values
            const hasEnum = schema.enum && Array.isArray(schema.enum);
            
            // Get description for tooltip
            const tooltip = schema.description ? `title="${schema.description}"` : "";
            
            // Generate appropriate input field based on whether it has enum values
            let inputField = "";
            if (hasEnum) {
                inputField = `<select id="button-${prop}" name="${prop}" ${tooltip} class="button-field">
                    <option value="">Select...</option>
                    ${schema.enum.map(option => `<option value="${option}">${option}</option>`).join("")}
                </select>`;
            } else {
                inputField = `<input type="text" id="button-${prop}" name="${prop}" ${tooltip} class="button-field">`;
            }
            
            return `<div class="form-row">
                <label for="button-${prop}" ${tooltip}>${formatLabel(prop)}:</label>
                ${inputField}
                <input type="checkbox" class="button-checkbox" data-prop="${prop}" title="Include this property">
            </div>`;
        }).join("");
}

module.exports = {
    getButtonsTableTemplate,
    getButtonsListTemplate
};

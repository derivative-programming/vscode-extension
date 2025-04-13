"use strict";

/**
 * Generates the properties table HTML content
 * @param {Array} props The property items
 * @param {Object} propItemsSchema Schema properties for property items
 * @returns {Object} Object containing tableHeaders and tableRows HTML
 */
function getPropertiesTableTemplate(props, propItemsSchema) {
    // Ensure props is always an array, even if undefined
    const safeProps = Array.isArray(props) ? props : [];
    
    // Create header columns for all prop item properties and sort them alphabetically
    // Make sure 'name' is always the first column
    const propColumns = Object.keys(propItemsSchema).filter(key => key !== "name").sort();
    propColumns.unshift("name");

    // Generate table headers with tooltips based on schema descriptions
    const tableHeaders = propColumns.map(key => {
        const propSchema = propItemsSchema[key] || {};
        const tooltip = propSchema.description ? ` title="${propSchema.description}"` : "";
        return `<th${tooltip}>${formatLabel(key)}</th>`;
    }).join("");

    // Generate table rows for all properties
    const tableRows = safeProps.map((prop, index) => {
        const cells = propColumns.map(propKey => {
            const propSchema = propItemsSchema[propKey] || {};
            const hasEnum = propSchema.enum && Array.isArray(propSchema.enum);
            // Check if it's a boolean enum (containing only true/false values)
            const isBooleanEnum = hasEnum && propSchema.enum.length === 2 && 
                propSchema.enum.every(val => val === true || val === false || val === "true" || val === "false");
            
            const tooltip = propSchema.description ? `title="${propSchema.description}"` : "";
            
            // Special handling for the name column
            if (propKey === "name") {
                return `<td>
                    <span class="prop-name">${prop.name || "Unnamed Property"}</span>
                    <input type="hidden" name="name" value="${prop.name || ""}">
                </td>`;
            }
            
            let inputField = "";
            if (hasEnum) {
                // Always show all options in the dropdown but disable it if property doesn't exist
                inputField = `<select name="${propKey}" ${tooltip} ${!prop.hasOwnProperty(propKey) ? "disabled" : ""}>
                    ${propSchema.enum.map(option => {
                        // If it's a boolean enum and the property doesn't exist or is null, default to 'false'
                        const isSelected = isBooleanEnum && !prop.hasOwnProperty(propKey) ? 
                            (option === false || option === "false") : 
                            prop[propKey] === option;
                        
                        return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                    }).join("")}
                </select>`;
            } else {
                inputField = `<input type="text" name="${propKey}" value="${prop[propKey] || ""}" ${tooltip} ${!prop.hasOwnProperty(propKey) ? "readonly" : ""}>`;
            }
            
            return `<td>
                <div class="control-with-checkbox">
                    ${inputField}
                    <input type="checkbox" class="prop-checkbox" data-prop="${propKey}" data-index="${index}" ${prop.hasOwnProperty(propKey) ? "checked" : ""} title="Toggle property existence">
                </div>
            </td>`;
        }).join("");
        
        return `<tr data-index="${index}">${cells}</tr>`;
    }).join("");

    return { tableHeaders, tableRows, propColumns };
}

// Import required helpers
const { formatLabel } = require("../../helpers/objectDataHelper");

module.exports = {
    getPropertiesTableTemplate
};
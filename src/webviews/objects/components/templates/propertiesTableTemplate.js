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
    // Hide specific properties that should not be displayed to the user
    const hiddenProperties = ["isFKNonLookupIncludedInXMLFunction"];
    const propColumns = Object.keys(propItemsSchema)
        .filter(key => key !== "name" && !hiddenProperties.includes(key))
        .sort();
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
            
            // Check if the property exists and is not null or undefined
            const propertyExists = prop.hasOwnProperty(propKey) && prop[propKey] !== null && prop[propKey] !== undefined;
            
            // Special handling for the name column
            if (propKey === "name") {
                return `<td>
                    <span class="prop-name">${prop.name || "Unnamed Property"}</span>
                    <input type="hidden" name="name" value="${prop.name || ""}">
                </td>`;
            }
            
            let inputField = "";
            if (hasEnum) {
                // Always show all options in the dropdown but disable it if property doesn't exist or is null/undefined
                inputField = `<select name="${propKey}" ${tooltip} ${!propertyExists ? "disabled" : ""}>
                    ${propSchema.enum.map(option => {
                        let isSelected = false;
                        
                        if (propertyExists) {
                            // If the property exists, select the matching option
                            isSelected = prop[propKey] === option;
                        } else {
                            // If the property doesn't exist, use default value logic
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
                        }
                        
                        return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                    }).join("")}
                </select>`;
            } else {
                inputField = `<input type="text" name="${propKey}" value="${propertyExists ? prop[propKey] : ""}" ${tooltip} ${!propertyExists ? "readonly" : ""}>`;
            }
            
            // Add magnifying glass button for fKObjectName field
            let lookupButton = "";
            if (propKey === "fKObjectName") {
                lookupButton = `<button type="button" class="lookup-button" data-prop="${propKey}" data-index="${index}" ${!propertyExists ? "disabled" : ""} title="Browse for FK Object">
                    <span class="codicon codicon-search"></span>
                </button>`;
            }
            
            // If the property exists, add a data attribute to indicate it was originally checked
            // and disable the checkbox to prevent unchecking
            const originallyChecked = propertyExists ? "data-originally-checked=\"true\"" : "";
            
            return `<td>
                <div class="control-with-checkbox">
                    ${inputField}
                    ${lookupButton}
                    <input type="checkbox" class="prop-checkbox" data-prop="${propKey}" data-index="${index}" ${propertyExists ? "checked disabled" : ""} ${originallyChecked} title="Toggle property existence">
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
"use strict";
const { formatLabel } = require("../../../forms/helpers/formDataHelper");

/**
 * Gets the list of API site properties that should not be editable or visible on the settings tab
 * Focus on the main properties requested in the issue
 * @returns {Array<string>} Array of property names to ignore (lowercase)
 */
function getApiSitePropertiesToIgnore() {
    return [
        "name", // name should not be editable in settings
        "apienvironment", // complex array property - will have its own tab if needed
        "apiendpoint", // complex array property - will have its own tab if needed
    ];
}

/**
 * Gets the list of API site properties that should be included in the settings tab
 * Based on the issue requirements
 * @returns {Array<string>} Array of property names to include
 */
function getApiSitePropertiesToInclude() {
    return [
        "apilogreportname",
        "description", 
        "ispublic",
        "issiteloggingenabled",
        "title",
        "versionnumber"
    ];
}

/**
 * Generates the HTML for the API site settings tab
 * @param {Object} apiSite The API site data
 * @param {Object} apiSiteSchemaProps The API site schema properties
 * @returns {string} HTML for the settings tab
 */
function getSettingsTabTemplate(apiSite, apiSiteSchemaProps) {
    const propertiesToIgnore = getApiSitePropertiesToIgnore();
    const propertiesToInclude = getApiSitePropertiesToInclude();
    
    return Object.entries(apiSiteSchemaProps)
        .filter(([prop, schema]) => {
            // Skip properties that should not be editable or visible
            if (propertiesToIgnore.includes(prop.toLowerCase())) {
                return false;
            }
            
            // Include only the properties requested in the issue
            return propertiesToInclude.includes(prop.toLowerCase());
        })
        .sort((a, b) => a[0].localeCompare(b[0])) // Sort alphabetically by property name
        .map(([prop, schema]) => {
            // Check if property has enum values
            const hasEnum = schema.enum && Array.isArray(schema.enum);
            // Check if it's a boolean enum (containing only true/false values)
            const isBooleanEnum = hasEnum && schema.enum.length === 2 && 
                schema.enum.every(val => val === true || val === false || val === "true" || val === "false");
            
            // Get description for tooltip
            const tooltip = schema.description ? `title="${schema.description}"` : "";
            
            // Check if the property exists in the API site object
            const propertyExists = apiSite.hasOwnProperty(prop) && apiSite[prop] !== null && apiSite[prop] !== undefined;
            
            // Generate appropriate input field based on whether it has enum values
            let inputField = "";
            if (hasEnum) {
                // Generate select dropdown for enum values
                inputField = `<select id="setting-${prop}" name="${prop}" ${tooltip} ${!propertyExists ? "readonly disabled" : ""}>
                    ${schema.enum
                        .slice() // Create a copy to avoid mutating the original array
                        .sort() // Sort alphabetically
                        .map(option => {
                        let isSelected = false;
                        
                        if (propertyExists) {
                            // Use the actual API site value if property exists
                            isSelected = apiSite[prop] === option;
                        } else {
                            // Property doesn't exist - set defaults
                            if (schema.default !== undefined) {
                                // Use the schema's default value if available
                                isSelected = option === schema.default;
                            } else if (isBooleanEnum) {
                                // Default to 'false' for boolean enums if no default specified
                                isSelected = (option === false || option === "false");
                            } else if (schema.enum.indexOf(option) === 0) {
                                // For non-boolean enums with no default, select the first option
                                isSelected = true;
                            }
                        }
                        
                        return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                    }).join("")}
                </select>`;
            } else {
                // Generate text input for non-enum values
                inputField = `<input type="text" id="setting-${prop}" name="${prop}" value="${propertyExists ? apiSite[prop] : ""}" ${tooltip} ${!propertyExists ? "readonly" : ""}>`;
            }
            
            // If the property exists, add a data attribute to indicate it was originally checked
            // This will help prevent unchecking properties that already exist
            const originallyChecked = propertyExists ? "data-originally-checked=\"true\"" : "";
            
            return `<div class="form-row">
                <label for="setting-${prop}" ${tooltip}>${formatLabel(prop)}:</label>
                ${inputField}
                <input type="checkbox" class="setting-checkbox" data-prop="${prop}" data-is-enum="${hasEnum}" ${propertyExists ? "checked disabled" : ""} ${originallyChecked} style="margin-left: 5px; transform: scale(0.8);" title="Toggle property existence">
            </div>`;
        }).join("");
}

module.exports = {
    getSettingsTabTemplate,
    getApiSitePropertiesToIgnore,
    getApiSitePropertiesToInclude
};
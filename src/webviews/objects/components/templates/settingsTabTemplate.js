"use strict";

/**
 * Generates the settings tab HTML content
 * @param {Object} object The object data for settings
 * @param {Object} objectSchemaProps Schema properties for the object
 * @returns {string} HTML content for settings tab
 */
function getSettingsTabTemplate(object, objectSchemaProps) {
    return Object.entries(objectSchemaProps)
        .filter(([key, desc]) => {
            // Exclude 'objectDocument' and 'objectButton' properties
            if (key === "objectDocument" || key === "objectButton") {
                return false;
            }
            // Keep other non-array properties that are not 'name'
            return desc.type !== "array" && key !== "name";
        })
        .sort((a, b) => a[0].localeCompare(b[0])) // Sort alphabetically by property name
        .map(([key, desc]) => {
            // Check if property has enum values
            const hasEnum = desc.enum && Array.isArray(desc.enum);
            // Check if it's a boolean enum (containing only true/false values)
            const isBooleanEnum = hasEnum && desc.enum.length === 2 && 
                desc.enum.every(val => val === true || val === false || val === "true" || val === "false");
            
            // Get description for tooltip
            const tooltip = desc.description ? `title="${desc.description}"` : "";
            
            // Generate appropriate input field based on whether it has enum values
            let inputField = "";
            if (hasEnum) {
                // Generate select dropdown for enum values - Always show options, but disable if property doesn't exist
                inputField = `<select id="${key}" name="${key}" ${tooltip} ${!object.hasOwnProperty(key) ? "disabled" : ""}>
                    ${desc.enum.map(option => {
                        // If it's a boolean enum and the property doesn't exist or is null, default to 'false'
                        const isSelected = isBooleanEnum && !object.hasOwnProperty(key) ? 
                            (option === false || option === "false") : 
                            object[key] === option;
                        
                        return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                    }).join("")}
                </select>`;
            } else {
                // Generate text input for non-enum values
                inputField = `<input type="text" id="${key}" name="${key}" value="${object[key] || ""}" ${tooltip} ${!object.hasOwnProperty(key) ? "readonly" : ""}>`;
            }
            
            return `<div class="form-row">
                <label for="${key}" ${tooltip}>${formatLabel(key)}:</label>
                ${inputField}
                <input type="checkbox" class="setting-checkbox" data-prop="${key}" data-is-enum="${hasEnum}" ${object.hasOwnProperty(key) ? "checked" : ""} style="margin-left: 5px; transform: scale(0.8);" title="Toggle property existence">
            </div>`;
        }).join("");
}

// Import required helpers
const { formatLabel } = require("../../helpers/objectDataHelper");

module.exports = {
    getSettingsTabTemplate
};
"use strict";
const { formatLabel } = require("../../helpers/formDataHelper");

/**
 * File: paramsListTemplate.js
 * Purpose: Provides HTML template for parameters list view in forms
 * Created: 2025-07-06
 */

/**
 * Gets the list of parameter properties that should be hidden in the parameters tab
 * @returns {Array<string>} Array of property names to hide (lowercase)
 */
function getParamPropertiesToHide() {
    return [
        "name",
        "defaultvalue",
        "isfk",
        "isfklookup",
        "fklistorderby",
        "isunknownlookupallowed",
        // Additional properties to hide based on user requirements
        "fkobjectqueryname",
        "isfklistoptionrecommended",
        "fklistrecommendedoption",
        "iscreditcardentry",
        "istimezonedetermined"
    ];
}

/**
 * Generates the HTML for parameter list view fields
 * @param {Object} paramSchema Schema for form parameters
 * @returns {string} HTML for parameter list view fields
 */
function getParamsListTemplate(paramSchema) {
    // Get properties to hide
    const propertiesToHide = getParamPropertiesToHide();
    
    // Sort properties alphabetically and filter out hidden ones
    const sortedProperties = Object.keys(paramSchema)
        .filter(key => key !== "name" && !propertiesToHide.includes(key.toLowerCase()))
        .sort();
    
    let html = '';
    
    // Generate list view form fields for all properties except name
    sortedProperties.forEach(propKey => {
        const schema = paramSchema[propKey] || {};
        const hasEnum = schema.enum && Array.isArray(schema.enum);
        // Check if it's a boolean enum (containing only true/false values)
        const isBooleanEnum = hasEnum && schema.enum.length === 2 && 
            schema.enum.every(val => val === true || val === false || val === "true" || val === "false");
            
        const tooltip = schema.description ? `title="${schema.description}"` : "";
        
        const fieldId = `param${propKey}`;
        
        let inputField = "";
        if (hasEnum) {
            // Always display all enum options even when disabled
            const sortedOptions = schema.enum.slice().sort(); // Create a copy and sort alphabetically
            inputField = `<select id="${fieldId}" name="${propKey}" ${tooltip} disabled>
                ${sortedOptions.map(option => {
                    // Check if there's a default value in the schema
                    let isSelected = false;
                    
                    if (schema.default !== undefined) {
                        // Use the schema's default value if available
                        isSelected = option === schema.default;
                    } else if (isBooleanEnum) {
                        // Default to 'false' for boolean enums if no default specified
                        isSelected = (option === false || option === "false");
                    } else if (sortedOptions.indexOf(option) === 0) {
                        // For non-boolean enums with no default, select the first option
                        isSelected = true;
                    }
                    
                    return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                }).join("")}
            </select>`;
        } else {
            inputField = `<input type="text" id="${fieldId}" name="${propKey}" value="" ${tooltip} readonly>`;
        }
        
        // Add browse button for sourceObjectName and fKObjectName fields
        let browseButton = "";
        let controlContainer = "";
        if (propKey === "sourceObjectName") {
            browseButton = `<button type="button" class="lookup-button" data-prop="${propKey}" data-field-id="${fieldId}" disabled title="Browse Data Objects">
                <span class="codicon codicon-search"></span>
            </button>`;
            controlContainer = `<div class="control-with-button">${inputField}${browseButton}</div>`;
        } else if (propKey === "fKObjectName") {
            browseButton = `<button type="button" class="lookup-button" data-prop="${propKey}" data-field-id="${fieldId}" disabled title="Browse Data Objects">
                <span class="codicon codicon-search"></span>
            </button>`;
            controlContainer = `<div class="control-with-button">${inputField}${browseButton}</div>`;
        } else {
            controlContainer = inputField;
        }
        
        html += `<div class="form-row">
            <label for="${fieldId}" ${tooltip}>${formatLabel(propKey)}:</label>
            <div class="control-with-checkbox">
                ${controlContainer}
                <input type="checkbox" id="${fieldId}Editable" data-field-id="${fieldId}" title="Toggle property existence" class="property-toggle">
            </div>
        </div>`;
    });
    
    return html;
}

module.exports = {
    getParamsListTemplate,
    getParamPropertiesToHide
};

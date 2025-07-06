"use strict";
const { formatLabel } = require("../../helpers/formDataHelper");

/**
 * Gets the list of parameter properties that should be hidden in the parameters tab
 * @returns {Array<string>} Array of property names to hide (lowercase)
 */
function getParamPropertiesToHide() {
    return [
        "name",
        "defaultvalue",
        "fkobjectname",
        "isfk",
        "isfklookup",
        "fklistorderby",
        "isunknownlookupallowed"
    ];
}

/**
 * Generates the table template for form parameters
 * @param {Array} params Array of form parameters
 * @param {Object} paramsSchema Schema properties for form parameters
 * @returns {Object} Object containing paramTableHeaders and paramTableRows HTML
 */
function getParamsTableTemplate(params, paramsSchema) {
    // Ensure params is always an array, even if undefined
    const safeParams = Array.isArray(params) ? params : [];
    
    // Get properties to hide
    const propertiesToHide = getParamPropertiesToHide();
    
    // Create header columns for all param properties and sort them alphabetically
    // Make sure 'name' is always the first column if it exists
    // Filter out properties that should be hidden
    const paramColumns = Object.keys(paramsSchema)
        .filter(key => key !== "name" && !propertiesToHide.includes(key.toLowerCase()))
        .sort();
    if (paramsSchema.hasOwnProperty("name") && !propertiesToHide.includes("name")) {
        paramColumns.unshift("name");
    }

    // Generate table headers with tooltips based on schema descriptions
    const paramTableHeaders = paramColumns.map(key => {
        const paramSchema = paramsSchema[key] || {};
        const tooltip = paramSchema.description ? ` title="${paramSchema.description}"` : "";
        return `<th${tooltip}>${formatLabel(key)}</th>`;
    }).join("");

    // Generate table rows for all parameters
    const paramTableRows = safeParams.map((param, index) => {
        const cells = paramColumns.map(paramKey => {
            const paramSchema = paramsSchema[paramKey] || {};
            const hasEnum = paramSchema.enum && Array.isArray(paramSchema.enum);
            // Check if it's a boolean enum (containing only true/false values)
            const isBooleanEnum = hasEnum && paramSchema.enum.length === 2 && 
                paramSchema.enum.every(val => val === true || val === false || val === "true" || val === "false");
            
            const tooltip = paramSchema.description ? `title="${paramSchema.description}"` : "";
            
            // Check if the property exists and is not null or undefined
            const propertyExists = param.hasOwnProperty(paramKey) && param[paramKey] !== null && param[paramKey] !== undefined;
            
            // Special handling for the name column
            if (paramKey === "name") {
                return `<td>
                    <span class="param-name">${param.name || "Unnamed Parameter"}</span>
                    <input type="hidden" name="name" value="${param.name || ""}">
                </td>`;
            }
            
            let inputField = "";
            if (hasEnum) {
                // Always show all options in the dropdown but disable it if property doesn't exist or is null/undefined
                inputField = `<select name="${paramKey}" ${tooltip} ${!propertyExists ? "disabled" : ""}>
                    ${paramSchema.enum.map(option => {
                        // If it's a boolean enum and the property doesn't exist or is null/undefined, default to 'false'
                        const isSelected = isBooleanEnum && !propertyExists ? 
                            (option === false || option === "false") : 
                            param[paramKey] === option;
                        return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                    }).join("")}
                </select>`;
            } else {
                inputField = `<input type="text" name="${paramKey}" value="${propertyExists ? param[paramKey] : ''}" ${tooltip} ${!propertyExists ? "readonly" : ""}>`;
            }
            
            return `<td>
                ${inputField}
                <input type="checkbox" class="property-toggle" data-property="${paramKey}" ${propertyExists ? "checked" : ""} title="Toggle property existence">
            </td>`;
        }).join("");
        
        return `<tr data-param-index="${index}">
            <td>${index + 1}</td>
            ${cells}
            <td>
                <button class="action-button edit-param" data-param-index="${index}">Edit</button>
                <button class="action-button move-up" data-param-index="${index}" ${index === 0 ? 'disabled' : ''}>▲</button>
                <button class="action-button move-down" data-param-index="${index}" ${index === safeParams.length - 1 ? 'disabled' : ''}>▼</button>
            </td>
        </tr>`;
    }).join("");
    
    return { paramTableHeaders, paramTableRows };
}

/**
 * Generates the list view template for parameter fields
 * @param {Object} paramsSchema Schema properties for form parameters
 * @returns {string} HTML for parameter fields in list view
 */
function getParamsListTemplate(paramsSchema) {
    // Get properties to hide
    const propertiesToHide = getParamPropertiesToHide();
    
    // Create header columns for all param properties and sort them alphabetically
    // Make sure 'name' is always the first field if it exists
    // Filter out properties that should be hidden
    const paramColumns = Object.keys(paramsSchema)
        .filter(key => key !== "name" && !propertiesToHide.includes(key.toLowerCase()))
        .sort();
    if (paramsSchema.hasOwnProperty("name") && !propertiesToHide.includes("name")) {
        paramColumns.unshift("name");
    }

    // Generate list view form fields for all properties except name
    return paramColumns.filter(key => key !== "name").map(paramKey => {
        const paramSchema = paramsSchema[paramKey] || {};
        const hasEnum = paramSchema.enum && Array.isArray(paramSchema.enum);
        // Check if it's a boolean enum (containing only true/false values)
        const isBooleanEnum = hasEnum && paramSchema.enum.length === 2 && 
            paramSchema.enum.every(val => val === true || val === false || val === "true" || val === "false");
            
        const tooltip = paramSchema.description ? `title="${paramSchema.description}"` : "";
        
        const fieldId = `param${paramKey}`;
        
        // Note: The detailed parameter values will be populated by client-side JavaScript
        // when a parameter is selected from the list, so we set default values here
        let inputField = "";
        if (hasEnum) {
            // Always display all enum options even when disabled
            inputField = `<select id="${fieldId}" name="${paramKey}" ${tooltip} disabled>
                ${paramSchema.enum.map(option => {
                    // Default to 'false' for boolean enums
                    const isSelected = isBooleanEnum ? (option === false || option === "false") : false;
                    
                    return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                }).join("")}
            </select>`;
        } else {
            inputField = `<input type="text" id="${fieldId}" name="${paramKey}" value="" ${tooltip} readonly>`;
        }
        
        // Note: We'll dynamically set the disabled attribute for checked checkboxes in the JavaScript
        return `<div class="form-row">
            <label for="${fieldId}" ${tooltip}>${formatLabel(paramKey)}:</label>
            ${inputField}
            <input type="checkbox" id="${fieldId}Editable" data-field-id="${fieldId}" title="Toggle property existence" style="margin-left: 5px; transform: scale(0.8);">
        </div>`;
    }).join("");
}

module.exports = {
    getParamsTableTemplate,
    getParamsListTemplate,
    getParamPropertiesToHide
};

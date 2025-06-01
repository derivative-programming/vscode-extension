"use strict";
const { formatLabel } = require("../../helpers/reportDataHelper");

/**
 * Generates the HTML for the parameters table
 * @param {Array} params The report parameters data
 * @param {Object} reportParamsSchema The parameter schema properties
 * @returns {Object} HTML for the parameters table headers and rows
 */
function getParamsTableTemplate(params, reportParamsSchema) {
    // Ensure params is always an array, even if undefined
    const safeParams = Array.isArray(params) ? params : [];
    
    // Create header columns for all param properties and sort them alphabetically
    // Make sure 'name' is always the first column if it exists
    const paramColumns = Object.keys(reportParamsSchema).filter(key => key !== "name").sort();
    if (reportParamsSchema.hasOwnProperty("name")) {
        paramColumns.unshift("name");
    }

    // Generate table headers with tooltips based on schema descriptions
    const paramTableHeaders = paramColumns.map(key => {
        const paramSchema = reportParamsSchema[key] || {};
        const tooltip = paramSchema.description ? ` title="${paramSchema.description}"` : "";
        return `<th${tooltip}>${formatLabel(key)}</th>`;
    }).join("");

    // Generate table rows for all parameters
    const paramTableRows = safeParams.map((param, index) => {
        const cells = paramColumns.map(paramKey => {
            const paramSchema = reportParamsSchema[paramKey] || {};
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
                inputField = `<input type="text" name="${paramKey}" value="${propertyExists ? param[paramKey] : ""}" ${tooltip} ${!propertyExists ? "readonly" : ""}>`;
            }
            
            // If the property exists, add a data attribute to indicate it was originally checked
            // and disable the checkbox to prevent unchecking
            const originallyChecked = propertyExists ? "data-originally-checked=\"true\"" : "";
            
            return `<td>
                <div class="control-with-checkbox">
                    ${inputField}
                    <input type="checkbox" class="param-checkbox" data-prop="${paramKey}" data-index="${index}" ${propertyExists ? "checked disabled" : ""} ${originallyChecked} title="Toggle property existence">
                </div>
            </td>`;
        }).join("");
        
        return `<tr data-index="${index}">${cells}</tr>`;
    }).join("");

    return { paramTableHeaders, paramTableRows, paramColumns };
}

module.exports = {
    getParamsTableTemplate
};

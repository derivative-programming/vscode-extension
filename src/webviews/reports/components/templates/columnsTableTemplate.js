"use strict";
const { formatLabel } = require("../../helpers/reportDataHelper");

/**
 * Gets the list of column properties that should be hidden in the columns tab
 * @returns {Array<string>} Array of property names to hide (lowercase)
 */
function getColumnPropertiesToHide() {
    return [
        "buttondestinationcontextobjectname",
        "maxwidth",
        "datetimedisplayformat",
        "iscolumnsummetricavailable",
        "issummarydisplayed",
        "isconditionallydisplayed",
        "isbuttonclickedonrowclick",
        "buttonbadgecountpropertyname",
        "isformfooter",
        "isencrypted"
    ];
}

/**
 * Generates the HTML for the columns table
 * @param {Array} columns The report columns data
 * @param {Object} reportColumnsSchema The column schema properties
 * @returns {Object} HTML for the columns table headers and rows
 */
function getColumnsTableTemplate(columns, reportColumnsSchema) {
    // Ensure columns is always an array, even if undefined
    const safeColumns = Array.isArray(columns) ? columns : [];
    
    // Get properties to hide
    const propertiesToHide = getColumnPropertiesToHide();
    
    // Create header columns for all column properties and sort them alphabetically
    // Make sure 'name' is always the first column if it exists
    // Filter out properties that should be hidden
    const columnColumns = Object.keys(reportColumnsSchema)
        .filter(key => key !== "name" && !propertiesToHide.includes(key.toLowerCase()))
        .sort();
    if (reportColumnsSchema.hasOwnProperty("name")) {
        columnColumns.unshift("name");
    }

    // Generate table headers with tooltips based on schema descriptions
    const columnTableHeaders = columnColumns.map(key => {
        const columnSchema = reportColumnsSchema[key] || {};
        const tooltip = columnSchema.description ? ` title="${columnSchema.description}"` : "";
        return `<th${tooltip}>${formatLabel(key)}</th>`;
    }).join("");

    // Generate table rows for all columns
    const columnTableRows = safeColumns.map((column, index) => {
        const cells = columnColumns.map(columnKey => {
            const columnSchema = reportColumnsSchema[columnKey] || {};
            const hasEnum = columnSchema.enum && Array.isArray(columnSchema.enum);
            // Check if it's a boolean enum (containing only true/false values)
            const isBooleanEnum = hasEnum && columnSchema.enum.length === 2 && 
                columnSchema.enum.every(val => val === true || val === false || val === "true" || val === "false");
            
            const tooltip = columnSchema.description ? `title="${columnSchema.description}"` : "";
            
            // Check if the property exists and is not null or undefined
            const propertyExists = column.hasOwnProperty(columnKey) && column[columnKey] !== null && column[columnKey] !== undefined;
            
            // Special handling for the name column
            if (columnKey === "name") {
                return `<td>
                    <span class="column-name">${column.name || "Unnamed Column"}</span>
                    <input type="hidden" name="name" value="${column.name || ""}">
                </td>`;
            }
            
            let inputField = "";
            if (hasEnum) {
                // Always show all options in the dropdown but disable it if property doesn't exist or is null/undefined
                inputField = `<select name="${columnKey}" ${tooltip} ${!propertyExists ? "disabled" : ""}>
                    ${columnSchema.enum.map(option => {
                        // If it's a boolean enum and the property doesn't exist or is null/undefined, default to 'false'
                        const isSelected = isBooleanEnum && !propertyExists ? 
                            (option === false || option === "false") : 
                            column[columnKey] === option;
                        
                        return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                    }).join("")}
                </select>`;
            } else {
                inputField = `<input type="text" name="${columnKey}" value="${propertyExists ? column[columnKey] : ""}" ${tooltip} ${!propertyExists ? "readonly" : ""}>`;
            }
            
            // If the property exists, add a data attribute to indicate it was originally checked
            // and disable the checkbox to prevent unchecking
            const originallyChecked = propertyExists ? "data-originally-checked=\"true\"" : "";
            
            return `<td>
                <div class="control-with-checkbox">
                    ${inputField}
                    <input type="checkbox" class="column-checkbox" data-prop="${columnKey}" data-index="${index}" ${propertyExists ? "checked disabled" : ""} ${originallyChecked} title="Toggle property existence">
                </div>
            </td>`;
        }).join("");
        
        return `<tr data-index="${index}">${cells}</tr>`;
    }).join("");

    return { columnTableHeaders, columnTableRows, columnColumns };
}

module.exports = {
    getColumnsTableTemplate,
    getColumnPropertiesToHide
};

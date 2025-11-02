"use strict";
const { formatLabel } = require("../../helpers/formDataHelper");

/**
 * Gets the list of output variable properties that should be hidden in the output variables tab
 * @returns {Array<string>} Array of property names to hide (lowercase)
 */
function getOutputVarPropertiesToHide() {
    return [
        // Note: "name" is not hidden as it's the primary identifier for output variables
        "buttonnavurl",
        "buttonobjectwfname",
        "buttontext",
        "conditionalvisiblepropertyname",
        "isheadertext",
        "islabelvisible",
        "islink",
        "isvisible",
        "labeltext"
    ];
}

/**
 * Generates the table template for form output variables
 * @param {Array} outputVars Array of form output variables
 * @param {Object} outputVarsSchema Schema properties for form output variables
 * @returns {Object} Object containing tableHeaders and tableRows HTML
 */
function getOutputVarsTableTemplate(outputVars, outputVarsSchema) {
    console.log("[DEBUG] getOutputVarsTableTemplate called with:", {
        outputVarsCount: outputVars ? outputVars.length : 0,
        outputVarsSchemaKeys: outputVarsSchema ? Object.keys(outputVarsSchema) : [],
        outputVarsSchema: outputVarsSchema
    });
    
    // Ensure outputVars is always an array, even if undefined
    const safeOutputVars = Array.isArray(outputVars) ? outputVars : [];
    console.log("[DEBUG] safeOutputVars:", safeOutputVars);
    
    // Get properties to hide
    const propertiesToHide = getOutputVarPropertiesToHide();
    console.log("[DEBUG] propertiesToHide:", propertiesToHide);
    
    // Create header columns for all outputVar properties and sort them alphabetically
    // Make sure 'name' is always the first column if it exists
    // Filter out properties that should be hidden
    const outputVarColumns = Object.keys(outputVarsSchema)
        .filter(key => key !== "name" && !propertiesToHide.includes(key.toLowerCase()))
        .sort();
    if (outputVarsSchema.hasOwnProperty("name") && !propertiesToHide.includes("name")) {
        outputVarColumns.unshift("name");
    }
    console.log("[DEBUG] outputVarColumns:", outputVarColumns);

    // Generate table headers with tooltips based on schema descriptions
    const outputVarTableHeaders = outputVarColumns.map(key => {
        const outputVarSchema = outputVarsSchema[key] || {};
        const tooltip = outputVarSchema.description ? ` title="${outputVarSchema.description}"` : "";
        console.log(`[DEBUG] Processing header for key: ${key}, schema:`, outputVarSchema);
        return `<th${tooltip}>${formatLabel(key)}</th>`;
    }).join("");
    console.log("[DEBUG] outputVarTableHeaders:", outputVarTableHeaders);
    
    // Generate table rows for all output variables
    const outputVarTableRows = safeOutputVars.map((outputVar, index) => {
        console.log(`[DEBUG] Processing outputVar at index ${index}:`, outputVar);
        
        const cells = outputVarColumns.map(outputVarKey => {
            console.log(`[DEBUG] Processing outputVarKey: ${outputVarKey} for outputVar:`, outputVar);
            
            const outputVarSchema = outputVarsSchema[outputVarKey] || {};
            const hasEnum = outputVarSchema.enum && Array.isArray(outputVarSchema.enum);
            // Check if it's a boolean enum (containing only true/false values)
            const isBooleanEnum = hasEnum && outputVarSchema.enum.length === 2 && 
                outputVarSchema.enum.every(val => val === true || val === false || val === "true" || val === "false");
            
            const tooltip = outputVarSchema.description ? `title="${outputVarSchema.description}"` : "";
            
            // Check if the property exists and is not null or undefined
            const propertyExists = outputVar && outputVar.hasOwnProperty(outputVarKey) && outputVar[outputVarKey] !== null && outputVar[outputVarKey] !== undefined;
            console.log(`[DEBUG] Property ${outputVarKey} exists: ${propertyExists}, value:`, outputVar ? outputVar[outputVarKey] : 'N/A');
            
            // Special handling for the name column
            if (outputVarKey === "name") {
                const outputVarName = (outputVar && typeof outputVar === 'object' && outputVar.name) ? outputVar.name : "Unnamed Output Variable";
                const outputVarNameValue = (outputVar && typeof outputVar === 'object' && outputVar.name) ? outputVar.name : "";
                console.log(`[DEBUG] Handling name column: outputVarName="${outputVarName}", outputVarNameValue="${outputVarNameValue}"`);
                return `<td>
                    <span class="outputvar-name">${outputVarName}</span>
                    <input type="hidden" name="name" value="${outputVarNameValue}">
                </td>`;
            }
            
            let inputField = "";
            if (hasEnum) {
                // Always show all options in the dropdown but disable it if property doesn't exist or is null/undefined
                inputField = `<select name="${outputVarKey}" ${tooltip} ${!propertyExists ? "disabled" : ""}>
                    ${outputVarSchema.enum
                        .slice() // Create a copy to avoid mutating the original array
                        .sort() // Sort alphabetically
                        .map(option => {
                        // If it's a boolean enum and the property doesn't exist or is null/undefined, default to 'false'
                        const isSelected = isBooleanEnum && !propertyExists ? 
                            (option === false || option === "false") : 
                            outputVar[outputVarKey] === option;
                        
                        return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                    }).join("")}
                </select>`;
            } else {
                inputField = `<input type="text" name="${outputVarKey}" value="${propertyExists ? outputVar[outputVarKey] : ""}" ${tooltip} ${!propertyExists ? "readonly" : ""}>`;
            }
            
            // Add browse button for sourceObjectName field
            let browseButton = "";
            let controlContainer = "";
            if (outputVarKey === "sourceObjectName") {
                browseButton = `<button type="button" class="lookup-button" data-prop="${outputVarKey}" data-index="${index}" ${!propertyExists ? "disabled" : ""} title="Browse Data Objects">
                    <span class="codicon codicon-search"></span>
                </button>`;
                controlContainer = `<div class="control-with-button">${inputField}${browseButton}</div>`;
            } else {
                controlContainer = inputField;
            }
            
            // If the property exists, add a data attribute to indicate it was originally checked
            // and disable the checkbox to prevent unchecking
            const originallyChecked = propertyExists ? "data-originally-checked=\"true\"" : "";
            
            console.log(`[DEBUG] Generated inputField for ${outputVarKey}:`, inputField.substring(0, 100) + '...');
            
            return `<td>
                <div class="control-with-checkbox">
                    ${controlContainer}
                    <input type="checkbox" class="outputvar-checkbox" data-prop="${outputVarKey}" data-index="${index}" ${propertyExists ? "checked disabled" : ""} ${originallyChecked} title="Toggle property existence">
                </div>
            </td>`;
        }).join("");
        
        console.log(`[DEBUG] Generated cells for outputVar ${index}:`, cells.substring(0, 200) + '...');
        
        return `<tr data-index="${index}">
            <td>${index + 1}</td>
            ${cells}
            <td class="action-column">
                <button class="action-button edit-outputvar" data-index="${index}" title="Edit this output variable">Edit</button>
                <button class="action-button copy-outputvar" data-index="${index}" title="Copy this output variable">Copy List</button>
                <button class="action-button move-up-outputvar" data-index="${index}" ${index === 0 ? 'disabled' : ''} title="Move up">▲</button>
                <button class="action-button move-down-outputvar" data-index="${index}" ${index === safeOutputVars.length - 1 ? 'disabled' : ''} title="Move down">▼</button>
            </td>
        </tr>`;
    }).join("");
    
    console.log("[DEBUG] outputVarTableRows generated, length:", outputVarTableRows.length);
    
    const result = { outputVarTableHeaders, outputVarTableRows, outputVarColumns };
    console.log("[DEBUG] getOutputVarsTableTemplate returning:", result);
    return result;
}

/**
 * Generates the list view template for output variable fields
 * @param {Object} outputVarsSchema Schema properties for form output variables
 * @returns {string} HTML for output variable fields in list view
 */
function getOutputVarsListTemplate(outputVarsSchema) {
    console.log("[DEBUG] getOutputVarsListTemplate called with outputVarsSchema:", outputVarsSchema);
    
    // Get properties to hide
    const propertiesToHide = getOutputVarPropertiesToHide();
    console.log("[DEBUG] propertiesToHide:", propertiesToHide);
    
    // Create header columns for all outputVar properties and sort them alphabetically
    // Make sure 'name' is always the first column if it exists
    // Filter out properties that should be hidden
    const outputVarColumns = Object.keys(outputVarsSchema)
        .filter(key => key !== "name" && !propertiesToHide.includes(key.toLowerCase()))
        .sort();
    if (outputVarsSchema.hasOwnProperty("name") && !propertiesToHide.includes("name")) {
        outputVarColumns.unshift("name");
    }

    // Generate list view form fields for all properties except name
    return outputVarColumns.filter(key => key !== "name").map(outputVarKey => {
        const outputVarSchema = outputVarsSchema[outputVarKey] || {};
        const hasEnum = outputVarSchema.enum && Array.isArray(outputVarSchema.enum);
        // Check if it's a boolean enum (containing only true/false values)
        const isBooleanEnum = hasEnum && outputVarSchema.enum.length === 2 && 
            outputVarSchema.enum.every(val => val === true || val === false || val === "true" || val === "false");
            
        const tooltip = outputVarSchema.description ? `title="${outputVarSchema.description}"` : "";
        
        const fieldId = `outputVar${outputVarKey}`;
        
        // Note: The detailed output variable values will be populated by client-side JavaScript
        // when an output variable is selected from the list, so we set default values here
        let inputField = "";
        if (hasEnum) {
            // Always display all enum options even when disabled
            inputField = `<select id="${fieldId}" name="${outputVarKey}" ${tooltip} disabled>
                ${outputVarSchema.enum
                    .slice() // Create a copy to avoid mutating the original array
                    .sort() // Sort alphabetically
                    .map(option => {
                    // Default to 'false' for boolean enums
                    const isSelected = isBooleanEnum ? (option === false || option === "false") : false;
                    
                    return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                }).join("")}
            </select>`;
        } else {
            inputField = `<input type="text" id="${fieldId}" name="${outputVarKey}" value="" ${tooltip} readonly>`;
        }
        
        // Add browse button for sourceObjectName field
        let browseButton = "";
        let controlContainer = "";
        if (outputVarKey === "sourceObjectName") {
            browseButton = `<button type="button" class="lookup-button" data-prop="${outputVarKey}" data-field-id="${fieldId}" title="Browse Data Objects">
                <span class="codicon codicon-search"></span>
            </button>`;
            controlContainer = `<div class="control-with-button">${inputField}${browseButton}</div>`;
        } else {
            controlContainer = inputField;
        }
        
        // Note: We'll dynamically set the disabled attribute for checked checkboxes in the JavaScript
        return `<div class="form-row">
            <label for="${fieldId}" ${tooltip}>${formatLabel(outputVarKey)}:</label>
            <div class="control-with-checkbox">
                ${controlContainer}
                <input type="checkbox" id="${fieldId}Editable" data-field-id="${fieldId}" title="Toggle property existence" class="property-toggle">
            </div>
        </div>`;
    }).join("");
}



module.exports = {
    getOutputVarsTableTemplate,
    getOutputVarsListTemplate,
    getOutputVarPropertiesToHide
};

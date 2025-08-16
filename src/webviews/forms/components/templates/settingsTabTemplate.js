"use strict";
const { formatLabel } = require("../../helpers/formDataHelper");

/**
 * Gets the list of form properties that should not be editable or visible on the settings tab
 * Based on comprehensive property filtering approach similar to reports view
 * @returns {Array<string>} Array of property names to ignore (lowercase)
 */
function getFormPropertiesToIgnore() {
    return [
        "name",
        "isignoredindocumentation",
        "objectworkflowparam",
        "objectworkflowbutton",
        "objectworkflowoutputvar",
        // Additional form-specific properties that should be hidden
        "initobjectworkflowname",
        "iscachingallowed",
        "cacheexpirationinminutes",
        "badgecountpropertyname",
        "isheaderlabelsvisible",
        "isreportdetaillabelcolumnvisible",
        // "formintrotext",
        "isazureblobstorageused",
        "azuretablenameoverride",
        "isazuretableprimarykeycolumndatetime",
        // Workflow-specific properties to hide
        "workflowtype",
        "workflowsubtype",
        "isasync",
        "asynctimeoutminutes",
        "isemailnotificationrequired",
        "emailnotificationtemplatename",
        "isauditlogrequired",
        "auditlogmessage",
        "iscustomhandlerrequired",
        "customhandlerclassname",
        "customhandlermethodname",
        "isvalidationrequired",
        "validationrulename",
        "isauthorizationbypassallowed",
        "authorizationbypassreason",
        "isdevelopmentonly",
        "developmentdescription",
        "islegacysupported",
        "legacycompatibilityversion",
        "ismobileoptimized",
        "mobileviewname",
        "istabletoptimized",
        "tabletviewname",
        // Additional form properties to hide based on user requirements
        "formfooterimageurl",
        "footerimageurl",
        "headerimageurl",
        "iscreditcardentryused",
        "isdynaflow",
        "isdynaflowtask",
        "iscustompageviewused",
        "isimpersonationpage",
        "isexposedinbusinessobject"
    ];
}

/**
 * Generates the HTML for the settings tab
 * @param {Object} form The form data excluding complex properties
 * @param {Object} formSchemaProps The form schema properties
 * @returns {string} HTML for the settings tab
 */
function getSettingsTabTemplate(form, formSchemaProps) {
    const propertiesToIgnore = getFormPropertiesToIgnore();
    
    return Object.entries(formSchemaProps)
        .filter(([prop, schema]) => {
            // Skip array properties as they have their own tabs
            if (prop === 'objectWorkflowParam' || prop === 'objectWorkflowButton' || prop === 'objectWorkflowOutputVar') {
                return false;
            }
            
            // Skip properties that should not be editable or visible
            if (propertiesToIgnore.includes(prop.toLowerCase())) {
                return false;
            }
            
            return true;
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
            
            // Check if the property exists in the form object
            const propertyExists = form.hasOwnProperty(prop) && form[prop] !== null && form[prop] !== undefined;
            
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
                            // Use the actual form value if property exists
                            isSelected = form[prop] === option;
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
                inputField = `<input type="text" id="setting-${prop}" name="${prop}" value="${propertyExists ? form[prop] : ""}" ${tooltip} ${!propertyExists ? "readonly" : ""}>`;
            }
            
            // Add browse button for targetChildObject field
            let browseButton = "";
            let controlContainer = "";
            if (prop === "targetChildObject") {
                browseButton = `<button type="button" class="lookup-button" data-prop="${prop}" data-field-id="setting-${prop}" disabled title="Browse Data Objects">
                    <span class="codicon codicon-search"></span>
                </button>`;
                controlContainer = `<div class="control-with-button">${inputField}${browseButton}</div>`;
            } else {
                controlContainer = inputField;
            }
            
            // If the property exists, add a data attribute to indicate it was originally checked
            // This will help prevent unchecking properties that already exist
            const originallyChecked = propertyExists ? "data-originally-checked=\"true\"" : "";
            
            return `<div class="form-row">
                <label for="setting-${prop}" ${tooltip}>${formatLabel(prop)}:</label>
                ${controlContainer}
                <input type="checkbox" class="setting-checkbox" data-prop="${prop}" data-is-enum="${hasEnum}" ${propertyExists ? "checked disabled" : ""} ${originallyChecked} style="margin-left: 5px; transform: scale(0.8);" title="Toggle property existence">
            </div>`;
        }).join("");
}

module.exports = {
    getSettingsTabTemplate,
    getFormPropertiesToIgnore
};

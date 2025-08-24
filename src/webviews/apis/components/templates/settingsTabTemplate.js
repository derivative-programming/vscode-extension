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
        "apienvironment", // complex array property - handled in dedicated views
        "apiendpoint", // complex array property - handled in dedicated views
    ];
}

/**
 * Gets the list of API site properties that should be included in the settings tab
 * Based on the issue requirements
 * @returns {Array<string>} Array of property names to include
 */
// We no longer hardcode an include list. Follow schema-driven generation per guidelines.
function getApiSitePropertiesToInclude() {
    return null; // sentinel indicating: include all non-array/object props except ignore list
}

/**
 * Generates the HTML for the API site settings tab
 * @param {Object} apiSite The API site data
 * @param {Object} apiSiteSchemaProps The API site schema properties
 * @returns {string} HTML for the settings tab
 */
function getSettingsTabTemplate(apiSite, apiSiteSchemaProps) {
    const propertiesToIgnore = getApiSitePropertiesToIgnore();

    return Object.entries(apiSiteSchemaProps)
        .filter(([prop, schema]) => {
            const key = String(prop || "").toLowerCase();
            if (propertiesToIgnore.includes(key)) { return false; }
            // Skip arrays and objects; settings tab is for scalar/editable primitives and enums
            const type = schema && schema.type;
            if (type === "array" || type === "object") { return false; }
            return true;
        })
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([prop, schema]) => {
            const hasEnum = Array.isArray(schema?.enum);
            const isBooleanEnum = hasEnum && schema.enum.length === 2 && schema.enum.every(val =>
                val === true || val === false || val === "true" || val === "false"
            );
            const type = schema?.type;
            const tooltip = schema?.description ? `title="${schema.description}"` : "";
            const propertyExists = Object.prototype.hasOwnProperty.call(apiSite, prop) && apiSite[prop] !== null && apiSite[prop] !== undefined;

            // Build input control
            let inputField = "";
            const dataTypeAttr = hasEnum
                ? `data-type="enum"`
                : `data-type="${type || "string"}"`;

            if (hasEnum) {
                inputField = `<select id="setting-${prop}" name="${prop}" ${tooltip} ${dataTypeAttr} ${!propertyExists ? "readonly disabled" : ""}>
                    ${schema.enum.slice().sort().map(option => {
                        let isSelected = false;
                        if (propertyExists) {
                            isSelected = apiSite[prop] === option;
                        } else if (schema.default !== undefined) {
                            isSelected = option === schema.default;
                        } else if (isBooleanEnum) {
                            isSelected = (option === false || option === "false");
                        } else if (schema.enum.indexOf(option) === 0) {
                            isSelected = true;
                        }
                        const selectedAttr = isSelected ? " selected" : "";
                        return `<option value="${option}"${selectedAttr}>${option}</option>`;
                    }).join("")}
                </select>`;
            } else {
                // Choose input type by schema.type
                let inputType = "text";
                if (type === "number" || type === "integer") { inputType = "number"; }
                inputField = `<input type="${inputType}" id="setting-${prop}" name="${prop}" ${dataTypeAttr} value="${propertyExists ? apiSite[prop] : ""}" ${tooltip} ${!propertyExists ? "readonly" : ""}>`;
            }

            // Optional browse button pattern parity (none specific for APIs yet)
            let controlContainer = inputField;

            // Existence checkbox goes to the left of the control, per guidelines
            const originallyChecked = propertyExists ? "data-originally-checked=\"true\"" : "";
            const checkbox = `<input type="checkbox" class="setting-checkbox" data-prop="${prop}" data-is-enum="${hasEnum}" ${propertyExists ? "checked disabled" : ""} ${originallyChecked} style="margin-left: 5px; transform: scale(0.8);" title="Toggle property existence" />`;

            return `<div class="form-row">
                <label for="setting-${prop}" ${tooltip}>${formatLabel(prop)}:</label>
                ${controlContainer}
                ${checkbox}
            </div>`;
        }).join("");
}

module.exports = {
    getSettingsTabTemplate,
    getApiSitePropertiesToIgnore,
    getApiSitePropertiesToInclude
};
"use strict";
const { formatLabel } = require("../../helpers/formDataHelper");

function getOutputVarPropertiesToHide() {
    return [
        // Keep all properties visible by default for page init output vars
    ];
}

function getOutputVarsListTemplate(outputVarsSchema) {
    const propertiesToHide = getOutputVarPropertiesToHide();
    const outputVarColumns = Object.keys(outputVarsSchema)
        .filter(key => key !== "name" && !propertiesToHide.includes(key.toLowerCase()))
        .sort();
    if (Object.prototype.hasOwnProperty.call(outputVarsSchema, "name") && !propertiesToHide.includes("name")) {
        outputVarColumns.unshift("name");
    }

    return outputVarColumns.filter(key => key !== "name").map(outputVarKey => {
        const outputVarSchema = outputVarsSchema[outputVarKey] || {};
        const hasEnum = outputVarSchema.enum && Array.isArray(outputVarSchema.enum);
        const isBooleanEnum = hasEnum && outputVarSchema.enum.length === 2 && 
            outputVarSchema.enum.every(val => val === true || val === false || val === "true" || val === "false");
        const tooltip = outputVarSchema.description ? `title="${outputVarSchema.description}"` : "";
        const fieldId = `outputVar${outputVarKey}`;

        let inputField = "";
        if (hasEnum) {
            inputField = `<select id="${fieldId}" name="${outputVarKey}" ${tooltip} disabled>
                ${outputVarSchema.enum
                    .slice()
                    .sort()
                    .map(option => {
                        const isSelected = isBooleanEnum ? (option === false || option === "false") : false;
                        return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                    }).join("")}
            </select>`;
        } else {
            inputField = `<input type="text" id="${fieldId}" name="${outputVarKey}" value="" ${tooltip} readonly>`;
        }

        return `<div class="form-row">
            <label for="${fieldId}" ${tooltip}>${formatLabel(outputVarKey)}:</label>
            <div class="control-with-checkbox">
                ${inputField}
                <input type="checkbox" id="${fieldId}Editable" data-field-id="${fieldId}" title="Toggle property existence" class="property-toggle">
            </div>
        </div>`;
    }).join("");
}

module.exports = {
    getOutputVarsListTemplate,
    getOutputVarPropertiesToHide
};

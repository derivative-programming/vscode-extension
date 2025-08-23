"use strict";
// generalFlow settingsTabTemplate reuse forms – touch for rebuild
const { formatLabel } = require("../../../forms/helpers/formDataHelper");

function getGeneralFlowPropertiesToIgnore() {
    return [
        "name",
        // Arrays are on their own tabs
        "objectworkflowparam",
        "objectworkflowoutputvar",
        // General flow should not expose page/report specific flags here
        "ispage",
        "initobjectworkflowname",
        // Dynaflow classification is shown elsewhere
        "isdynaflow",
        "isdynaflowtask"
    ];
}

function getSettingsTabTemplate(flow, flowSchemaProps) {
    const propertiesToIgnore = getGeneralFlowPropertiesToIgnore();

    return Object.entries(flowSchemaProps)
        .filter(([prop, schema]) => {
            // Skip array properties as they have their own tabs
            if (prop === 'objectWorkflowParam' || prop === 'objectWorkflowOutputVar') { return false; }
            // Skip properties that should not be editable or visible
            if (propertiesToIgnore.includes(prop.toLowerCase())) { return false; }
            return true;
        })
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([prop, schema]) => {
            const hasEnum = schema.enum && Array.isArray(schema.enum);
            const isBooleanEnum = hasEnum && schema.enum.length === 2 && schema.enum.every(val => val === true || val === false || val === "true" || val === "false");
            const tooltip = schema.description ? `title="${schema.description}"` : "";
            const propertyExists = flow.hasOwnProperty(prop) && flow[prop] !== null && flow[prop] !== undefined;

            let inputField = "";
            if (hasEnum) {
                inputField = `<select id="setting-${prop}" name="${prop}" ${tooltip} ${!propertyExists ? "readonly disabled" : ""}>
                    ${schema.enum.slice().sort().map(option => {
                        let isSelected = false;
                        if (propertyExists) {
                            isSelected = flow[prop] === option;
                        } else {
                            if (schema.default !== undefined) {
                                isSelected = option === schema.default;
                            } else if (isBooleanEnum) {
                                isSelected = (option === false || option === "false");
                            } else if (schema.enum.indexOf(option) === 0) {
                                isSelected = true;
                            }
                        }
                        return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                    }).join("")}
                </select>`;
            } else {
                inputField = `<input type="text" id="setting-${prop}" name="${prop}" value="${propertyExists ? flow[prop] : ""}" ${tooltip} ${!propertyExists ? "readonly" : ""}>`;
            }

            const originallyChecked = propertyExists ? "data-originally-checked=\"true\"" : "";
            return `<div class="form-row">
                <label for="setting-${prop}" ${tooltip}>${formatLabel(prop)}:</label>
                ${inputField}
                <input type="checkbox" class="setting-checkbox" data-prop="${prop}" data-is-enum="${hasEnum}" ${propertyExists ? "checked disabled" : ""} ${originallyChecked} style="margin-left: 5px; transform: scale(0.8);" title="Toggle property existence">
            </div>`;
        }).join("");
}

module.exports = { getSettingsTabTemplate, getGeneralFlowPropertiesToIgnore };

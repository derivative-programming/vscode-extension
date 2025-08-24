"use strict";
const { formatLabel } = require("../../../forms/helpers/formDataHelper");

function getWorkflowTaskPropertiesToHide() {
    return [
        // Keep all properties visible by default for workflow tasks
    ];
}

function getWorkflowTasksListTemplate(workflowTaskSchema) {
    // Only display these properties for a workflow task, in this exact order
    const allowedOrder = [
        "description",
        "contextObjectName",
        "isDynaFlowRequest"
    ];

    // Build case-insensitive key map from schema
    const schemaKeyByLower = Object.keys(workflowTaskSchema || {}).reduce((acc, key) => {
        acc[key.toLowerCase()] = key; return acc;
    }, {});

    // Support common variant mappings if needed
    const variantMap = {
        // Add any variant mappings here if needed
    };

    // Resolve actual schema keys present in this order
    const resolvedKeys = [];
    for (const name of allowedOrder) {
        const lower = name.toLowerCase();
        if (schemaKeyByLower[lower]) {
            resolvedKeys.push(schemaKeyByLower[lower]);
            continue;
        }
        const variants = variantMap[lower];
        if (variants) {
            const found = variants.find(v => schemaKeyByLower[v]);
            if (found) { resolvedKeys.push(schemaKeyByLower[found]); }
        }
    }

    return resolvedKeys.map(workflowTaskKey => {
        const workflowTaskPropertySchema = workflowTaskSchema[workflowTaskKey] || {};
        const hasEnum = workflowTaskPropertySchema.enum && Array.isArray(workflowTaskPropertySchema.enum);
        const isBooleanEnum = hasEnum && workflowTaskPropertySchema.enum.length === 2 && 
            workflowTaskPropertySchema.enum.every(val => val === true || val === false || val === "true" || val === "false");
        const tooltip = workflowTaskPropertySchema.description ? `title="${workflowTaskPropertySchema.description}"` : "";
        const fieldId = `workflowTask${workflowTaskKey}`;

        let inputField = "";
        if (hasEnum) {
            inputField = `<select id="${fieldId}" name="${workflowTaskKey}" ${tooltip} disabled>
                ${workflowTaskPropertySchema.enum
                    .slice()
                    .sort()
                    .map(option => {
                        const isSelected = isBooleanEnum ? (option === false || option === "false") : false;
                        return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                    }).join("")}
            </select>`;
        } else {
            inputField = `<input type="text" id="${fieldId}" name="${workflowTaskKey}" value="" ${tooltip} readonly>`;
        }

    return `<div class="form-row">
            <label for="${fieldId}" ${tooltip}>${formatLabel(workflowTaskKey)}:</label>
            <div class="control-with-checkbox">
                ${inputField}
                <input type="checkbox" id="${fieldId}Editable" data-field-id="${fieldId}" title="Toggle property existence" class="property-toggle">
            </div>
        </div>`;
    }).join("");
}

module.exports = {
    getWorkflowTasksListTemplate,
    getWorkflowTaskPropertiesToHide
};

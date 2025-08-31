"use strict";
// generalFlow outputVarsListTemplate – independent implementation for General Flow output variables

const { formatLabel } = require("../../helpers/formDataHelper");

function getOutputVarPropertiesToHide() {
    return [
        // Keep all properties visible by default for general flow output vars
    ];
}

function getOutputVarsListTemplate(outputVarsSchema) {
    // Properties for General Flow output variables based on objectWorkflowOutputVar schema
    // Removed UI-specific properties that are not relevant for general workflow output variables
    const allowedOrder = [
        "conditionalVisiblePropertyName",
        "defaultValue",
        "fKObjectName",
        "isFK",
        "isFKLookup",
        "isHeaderText",
        "isIgnored",
        "isLabelVisible",
        "isLink",
        "isVisible",
        "labelText",
        "sourceObjectName",
        "sourcePropertyName",
        "sqlServerDBDataType",
        "sqlServerDBDataTypeSize"
    ];

    // Build case-insensitive key map from schema
    const schemaKeyByLower = Object.keys(outputVarsSchema || {}).reduce((acc, key) => {
        acc[key.toLowerCase()] = key; 
        return acc;
    }, {});

    // Support common variant mappings for backward compatibility
    const variantMap = {
        'datatype': ['sqlserverdbdatatype'],
        'datasize': ['sqlserverdbdatatypesize', 'sqlserverdbdatatypesize'],
        'labeltext': ['headertext', 'headerlabeltext'],
        'islabelvisible': ['isheaderlabelsvisible', 'isheaderlabelvisible']
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
            if (found) { 
                resolvedKeys.push(schemaKeyByLower[found]); 
            }
        }
    }

    return resolvedKeys.map(outputVarKey => {
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

        // Add browse button for sourceObjectName field
        let browseButton = "";
        let controlContainer = "";
        if (outputVarKey === "sourceObjectName") {
            browseButton = `<button type="button" class="lookup-button" data-prop="${outputVarKey}" data-field-id="${fieldId}" disabled title="Browse Data Objects">
                <span class="codicon codicon-search"></span>
            </button>`;
            controlContainer = `<div class="control-with-button">${inputField}${browseButton}</div>`;
        } else {
            controlContainer = inputField;
        }

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
    getOutputVarsListTemplate,
    getOutputVarPropertiesToHide
};

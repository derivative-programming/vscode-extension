"use strict";
// General Flow params list – follow Page Init allowlist + checkbox pattern for optional items
const { formatLabel } = require("../../../forms/helpers/formDataHelper");

function getParamsListTemplate(paramSchema) {
    // Only display these properties for a parameter, in this exact order
    const allowedOrder = [
        "dataSize",
        "dataType",
        "defaultValue",
        "fKObjectName",
        "isFK",
        "isFKLookup",
        "isIgnored",
        "isVisible",
        "labelText",
        "isLabelVisible",
        "sourceObjectName",
        "sourcePropertyName",
        "conditionalVisiblePropertyName"
    ];

    // Build case-insensitive key map from schema
    const schemaKeyByLower = Object.keys(paramSchema || {}).reduce((acc, key) => {
        acc[key.toLowerCase()] = key; return acc;
    }, {});

    // Support common variant mappings (schema often uses sqlServerDBDataType/Size)
    const variantMap = {
        'datatype': ['sqlserverdbdatatype'],
        'datasize': ['sqlserverdbdatatypesize'],
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
            if (found) { resolvedKeys.push(schemaKeyByLower[found]); }
        }
    }

    // Generate list view form fields for resolved properties in fixed order
    return resolvedKeys.map(propKey => {
        const schema = paramSchema[propKey] || {};
        const hasEnum = schema.enum && Array.isArray(schema.enum);
        const isBooleanEnum = hasEnum && schema.enum.length === 2 && 
            schema.enum.every(val => val === true || val === false || val === "true" || val === "false");
        const tooltip = schema.description ? `title="${schema.description}"` : "";

        const fieldId = `param${propKey}`;

        let inputField = "";
        if (hasEnum) {
            const options = schema.enum.slice().sort();
            inputField = `<select id="${fieldId}" name="${propKey}" ${tooltip} disabled>
                ${options.map(option => {
                    let isSelected = false;
                    if (schema.default !== undefined) {
                        isSelected = option === schema.default;
                    } else if (isBooleanEnum) {
                        isSelected = (option === false || option === "false");
                    } else if (options.indexOf(option) === 0) {
                        isSelected = true;
                    }
                    return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                }).join("")}
            </select>`;
        } else {
            inputField = `<input type="text" id="${fieldId}" name="${propKey}" value="" ${tooltip} readonly>`;
        }

        return `<div class="form-row">
            <label for="${fieldId}" ${tooltip}>${formatLabel(propKey)}:</label>
            <div class="control-with-checkbox">
                ${inputField}
                <input type="checkbox" id="${fieldId}Editable" data-field-id="${fieldId}" title="Toggle property existence" class="property-toggle">
            </div>
        </div>`;
    }).join("");
}

module.exports = { getParamsListTemplate };

"use strict";
// General Flow params list – follow Page Init allowlist + checkbox pattern for optional items
const { formatLabel } = require("../../../forms/helpers/formDataHelper");

function getParamsListTemplate(paramSchema) {
    // Only display these properties for a parameter, in this exact order
    // Removed UI-specific properties that are not relevant for general workflow parameters
    // Removed FK, validation, and security properties that are not applicable to general flow params
    const allowedOrder = [
        "codeDescription",
        "dataSize",
        "dataType",
        "isIgnored"
    ];

    // Build case-insensitive key map from schema
    const schemaKeyByLower = Object.keys(paramSchema || {}).reduce((acc, key) => {
        acc[key.toLowerCase()] = key; return acc;
    }, {});

    // Support common variant mappings (schema often uses sqlServerDBDataType/Size)
    const variantMap = {
        'datatype': ['sqlserverdbdatatype'],
        'datasize': ['sqlserverdbdatatypesize'],
        'labeltext': ['headertext', 'headerlabeltext']
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

        // Add browse button for sourceObjectName and fKObjectName fields
        let browseButton = "";
        let controlContainer = "";
        if (propKey === "sourceObjectName" || propKey === "fKObjectName") {
            browseButton = `<button type="button" class="lookup-button" data-prop="${propKey}" data-field-id="${fieldId}" disabled title="Browse Data Objects">
                <span class="codicon codicon-search"></span>
            </button>`;
            controlContainer = `<div class="control-with-button">${inputField}${browseButton}</div>`;
        } else {
            controlContainer = inputField;
        }

        return `<div class="form-row">
            <label for="${fieldId}" ${tooltip}>${formatLabel(propKey)}:</label>
            <div class="control-with-checkbox">
                ${controlContainer}
                <input type="checkbox" id="${fieldId}Editable" data-field-id="${fieldId}" title="Toggle property existence" class="property-toggle">
            </div>
        </div>`;
    }).join("");
}

module.exports = { getParamsListTemplate };

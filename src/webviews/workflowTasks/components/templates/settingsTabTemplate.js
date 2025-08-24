"use strict";
const { formatLabel } = require("../../../forms/helpers/formDataHelper");

function getSettingsTabTemplate(flow, flowSchemaProps) {
    // Settings-only view for workflow tasks
    const allowedOrder = [
        'isAuthorizationRequired',
        'roleRequired',
        'isRequestRunViaDynaFlowAllowed',
        'isCustomLogicOverwritten',
        'isExposedInBusinessObject',
        'pageTitleText',
        'pageIntroText'
    ];

    const schemaKeyByLower = Object.keys(flowSchemaProps || {}).reduce((acc, key) => { acc[key.toLowerCase()] = key; return acc; }, {});
    const variantMap = { 'rolerequired': ['rolerequired', 'isrolerequired'] };

    const resolvedKeys = [];
    for (const name of allowedOrder) {
        const lc = name.toLowerCase();
        if (schemaKeyByLower[lc]) { resolvedKeys.push(schemaKeyByLower[lc]); continue; }
        const variants = variantMap[lc];
        if (variants) {
            const found = variants.find(v => schemaKeyByLower[v]);
            if (found) { resolvedKeys.push(schemaKeyByLower[found]); }
        }
    }

    return resolvedKeys.map(prop => {
        const schema = flowSchemaProps[prop] || {};
        const hasEnum = schema.enum && Array.isArray(schema.enum);
        const isBooleanEnum = hasEnum && schema.enum.length === 2 && schema.enum.every(val => val === true || val === false || val === "true" || val === "false");
        const tooltip = schema.description ? `title="${schema.description}"` : "";
        const propertyExists = Object.prototype.hasOwnProperty.call(flow, prop) && flow[prop] !== null && flow[prop] !== undefined;

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
            <input type="checkbox" class="setting-checkbox" data-prop="${prop}" data-is-enum="${!!hasEnum}" ${propertyExists ? "checked disabled" : ""} ${originallyChecked} style="margin-left: 5px; transform: scale(0.8);" title="Toggle property existence">
        </div>`;
    }).join("");
}

module.exports = { getSettingsTabTemplate };

"use strict";
// General Flow settings – show only specific properties in a fixed order
const { formatLabel } = require("../../../forms/helpers/formDataHelper");

function getSettingsTabTemplate(flow, flowSchemaProps) {
    console.log('[DEBUG] flowForSettings object keys:', Object.keys(flow || {}));
    console.log('[DEBUG] flowForSettings object:', flow);
    
    // Only show the following settings, in this exact order (case-insensitive match to schema keys)
    // Note: isPage and isDynaFlowTask are excluded as they are not relevant for general flows
    const allowedOrder = [
        'isAuthorizationRequired',
        'roleRequired',
        'isExposedInBusinessObject',
        'isCustomLogicOverwritten',
        'isRequestRunViaDynaFlowAllowed',
        'pageIntroText',
        'pageTitleText'
    ];

    // Build a case-insensitive lookup of schema keys
    const schemaKeyByLower = Object.keys(flowSchemaProps || {}).reduce((acc, key) => {
        acc[key.toLowerCase()] = key; return acc;
    }, {});

    // Include common variants for role required to maximize match chance
    const variantMap = {
        'rolerequired': ['rolerequired', 'isrolerequired']
    };

    // Resolve the actual keys present in schema based on allowed order
    const resolvedKeys = [];
    for (const name of allowedOrder) {
        const lc = name.toLowerCase();
        if (schemaKeyByLower[lc]) { 
            resolvedKeys.push(schemaKeyByLower[lc]); 
            if (name === 'isExposedInBusinessObject') {
                console.log('[DEBUG] Found isExposedInBusinessObject in schema as:', schemaKeyByLower[lc]);
            }
            continue; 
        }
        const variants = variantMap[lc];
        if (variants) {
            const found = variants.find(v => schemaKeyByLower[v]);
            if (found) { resolvedKeys.push(schemaKeyByLower[found]); }
        }
        if (name === 'isExposedInBusinessObject') {
            console.log('[DEBUG] isExposedInBusinessObject NOT found in schema keys:', Object.keys(flowSchemaProps || {}));
        }
    }

    return resolvedKeys.map(prop => {
            const schema = flowSchemaProps[prop] || {};
            const hasEnum = schema.enum && Array.isArray(schema.enum);
            const isBooleanEnum = hasEnum && schema.enum.length === 2 && schema.enum.every(val => val === true || val === false || val === "true" || val === "false");
            const tooltip = schema.description ? `title="${schema.description}"` : "";
            const propertyExists = flow.hasOwnProperty(prop) && flow[prop] !== null && flow[prop] !== undefined;
            
            if (prop === 'isExposedInBusinessObject') {
                console.log('[DEBUG] Processing isExposedInBusinessObject:');
                console.log('[DEBUG] - Property exists in model:', propertyExists);
                console.log('[DEBUG] - Model value:', flow[prop]);
                console.log('[DEBUG] - Schema enum:', schema.enum);
                console.log('[DEBUG] - Has enum:', hasEnum);
            }

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
                // Text input for non-enum values
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

module.exports = { getSettingsTabTemplate };

"use strict";
const { formatLabel } = require("../../helpers/reportDataHelper");
const { getParamPropertiesToHide } = require("./paramsTableTemplate");

/**
 * Generates HTML for the parameter modal
 * @param {Object} reportParamsSchema The parameter schema properties
 * @returns {string} HTML for the parameter modal
 */
function getParamModalHtml(reportParamsSchema) {
    // Get properties to hide
    const propertiesToHide = getParamPropertiesToHide();
    
    // Filter out hidden properties and sort remaining properties alphabetically
    const sortedProps = Object.keys(reportParamsSchema)
        .filter(key => !propertiesToHide.includes(key.toLowerCase()))
        .sort();
    
    // Generate form groups for each property
    const formGroups = sortedProps.map(prop => {
        const schema = reportParamsSchema[prop];
        const propLabel = formatLabel(prop);
        
        // Get tooltip content if description exists
        const tooltipHtml = schema.description 
            ? `<div class="tooltip">
                <span>ⓘ</span>
                <span class="tooltip-text">${schema.description}</span>
              </div>`
            : '';
        
        // Generate appropriate input based on the type
        let inputHtml = '';
        
        if (schema.enum && Array.isArray(schema.enum)) {
            // Enum should use a select dropdown
            const options = schema.enum.map(opt => {
                return `<option value="${opt}">${opt}</option>`;
            }).join('');
            
            inputHtml = `
                <select id="param-${prop}">
                    ${options}
                </select>
            `;
        } else {
            // Default to text input
            inputHtml = `
                <input type="text" id="param-${prop}" value="">
            `;
        }
        
        // Create the form group
        return `
            <div class="form-group">
                <div class="property-label">
                    <label for="param-${prop}">${propLabel} ${tooltipHtml}</label>
                </div>
                ${inputHtml}
            </div>
        `;
    });
    
    // Return the full modal HTML
    return `
        <div id="param-modal" class="modal">
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2 class="modal-title">Edit Parameter</h2>
                <form id="param-form">
                    <div class="grid-container">
                        ${formGroups.join('')}
                    </div>
                    <div class="action-buttons">
                        <button type="submit" id="save-param-btn">Save</button>
                        <button type="button" id="cancel-param-btn">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

module.exports = {
    getParamModalHtml,
    getParamPropertiesToHide
};

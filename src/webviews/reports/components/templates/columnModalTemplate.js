"use strict";
const { formatLabel } = require("../../helpers/reportDataHelper");
const { getColumnPropertiesToHide } = require("./columnsTableTemplate");

/**
 * Generates HTML for the column modal
 * @param {Object} reportColumnsSchema The column schema properties
 * @returns {string} HTML for the column modal
 */
function getColumnModalHtml(reportColumnsSchema) {
    // Get properties to hide
    const propertiesToHide = getColumnPropertiesToHide();
    
    // Sort properties alphabetically and filter out hidden properties
    const sortedProps = Object.keys(reportColumnsSchema)
        .filter(prop => !propertiesToHide.includes(prop.toLowerCase()))
        .sort();
    
    // Generate form groups for each property
    const formGroups = sortedProps.map(prop => {
        const schema = reportColumnsSchema[prop];
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
            // Enum should use a select dropdown - sort options alphabetically
            const options = schema.enum
                .slice() // Create a copy to avoid mutating the original array
                .sort() // Sort alphabetically
                .map(opt => {
                    return `<option value="${opt}">${opt}</option>`;
                }).join('');
            
            inputHtml = `
                <select id="column-${prop}">
                    ${options}
                </select>
            `;
        } else {
            // Default to text input
            inputHtml = `
                <input type="text" id="column-${prop}" value="">
            `;
        }
        
        // Create the form group
        return `
            <div class="form-group">
                <div class="property-label">
                    <label for="column-${prop}">${propLabel} ${tooltipHtml}</label>
                </div>
                ${inputHtml}
            </div>
        `;
    });
    
    // Return the full modal HTML
    return `
        <div id="column-modal" class="modal">
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2 class="modal-title">Edit Column</h2>
                <form id="column-form">
                    <div class="grid-container">
                        ${formGroups.join('')}
                    </div>
                    <div class="action-buttons">
                        <button type="submit" id="save-column-btn">Save</button>
                        <button type="button" id="cancel-column-btn">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

module.exports = {
    getColumnModalHtml
};

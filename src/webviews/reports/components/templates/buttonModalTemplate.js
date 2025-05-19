"use strict";
const { formatLabel } = require("../../helpers/reportDataHelper");

/**
 * Generates HTML for the button modal
 * @param {Object} reportButtonsSchema The button schema properties
 * @returns {string} HTML for the button modal
 */
function getButtonModalHtml(reportButtonsSchema) {
    // Sort properties alphabetically
    const sortedProps = Object.keys(reportButtonsSchema).sort();
    
    // Generate form groups for each property
    const formGroups = sortedProps.map(prop => {
        const schema = reportButtonsSchema[prop];
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
                <select id="button-${prop}">
                    ${options}
                </select>
            `;
        } else {
            // Default to text input
            inputHtml = `
                <input type="text" id="button-${prop}" value="">
            `;
        }
        
        // Create the form group
        return `
            <div class="form-group">
                <div class="property-label">
                    <label for="button-${prop}">${propLabel} ${tooltipHtml}</label>
                </div>
                ${inputHtml}
            </div>
        `;
    });
    
    // Return the full modal HTML
    return `
        <div id="button-modal" class="modal">
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2 class="modal-title">Edit Button</h2>
                <form id="button-form">
                    <div class="grid-container">
                        ${formGroups.join('')}
                    </div>
                    <div class="action-buttons">
                        <button type="submit" id="save-button-btn">Save</button>
                        <button type="button" id="cancel-button-btn">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

module.exports = {
    getButtonModalHtml
};

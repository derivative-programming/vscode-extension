"use strict";
const { formatLabel } = require("../../helpers/reportDataHelper");
const { getButtonPropertiesToHide } = require("./buttonsTableTemplate");

/**
 * Generates HTML for the button modal
 * @param {Object} reportButtonsSchema The button schema properties
 * @returns {string} HTML for the button modal
 */
function getButtonModalHtml(reportButtonsSchema) {
    // Get properties to hide
    const propertiesToHide = getButtonPropertiesToHide();
    
    // Sort properties alphabetically and filter out hidden properties
    const sortedProps = Object.keys(reportButtonsSchema)
        .filter(prop => !propertiesToHide.includes(prop.toLowerCase()))
        .sort();
    
    // Generate form groups for each property (for edit mode)
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
            // Enum should use a select dropdown - sort options alphabetically
            const options = schema.enum
                .slice() // Create a copy to avoid mutating the original array
                .sort() // Sort alphabetically
                .map(opt => {
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
    
    // Return the full modal HTML with both add and edit forms
    return `
        <div id="button-modal" class="modal">
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2 class="modal-title">Edit Button</h2>
                
                <!-- Add Button Form (simplified) -->
                <div id="add-button-form" style="display: none;">                    <div class="form-group">
                        <label for="button-name-input">Button Name:</label>
                        <input type="text" id="button-name-input" placeholder="">
                        <div class="field-note">Use Pascal case (Example: ButtonName). No spaces or numbers are allowed in names. Letters only.</div>
                    </div>
                    <div id="button-name-validation-error" class="validation-error"></div>
                    <div class="action-buttons">
                        <button type="button" id="add-button-save-btn">Add Button</button>
                        <button type="button" id="add-button-cancel-btn">Cancel</button>
                    </div>
                </div>
                
                <!-- Edit Button Form (full schema) -->
                <form id="button-form" style="display: none;">
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

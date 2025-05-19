"use strict";
const { formatLabel } = require("../../helpers/reportDataHelper");

/**
 * Generates the HTML for the settings tab
 * @param {Object} report The report data excluding complex properties
 * @param {Object} reportSchemaProps The report schema properties
 * @returns {string} HTML for the settings tab
 */
function getSettingsTabTemplate(report, reportSchemaProps) {
    // Sort properties alphabetically
    const sortedProps = Object.keys(reportSchemaProps).sort();
    
    // Generate form groups for each property
    const formGroups = sortedProps.map(prop => {
        // Skip array properties as they have their own tabs
        if (prop === 'reportColumn' || prop === 'reportButton' || prop === 'reportParam') {
            return '';
        }
        
        const schema = reportSchemaProps[prop];
        const propLabel = formatLabel(prop);
        const propValue = report[prop] !== undefined ? report[prop] : '';
        const hasValue = propValue !== '';
        
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
                const selected = opt === propValue ? 'selected' : '';
                return `<option value="${opt}" ${selected}>${opt}</option>`;
            }).join('');
            
            inputHtml = `
                <select id="setting-${prop}" ${!hasValue ? 'readonly' : ''}>
                    ${options}
                </select>
            `;
        } else {
            // Default to text input
            inputHtml = `
                <input type="text" id="setting-${prop}" value="${propValue}" ${!hasValue ? 'readonly' : ''}>
            `;
        }
        
        // Create the form group with property binding
        return `
            <div class="form-group">
                <div class="property-label">
                    <label for="setting-${prop}">${propLabel} ${tooltipHtml}</label>
                    <input 
                        type="checkbox" 
                        class="enable-checkbox" 
                        id="enable-setting-${prop}" 
                        ${hasValue ? 'checked' : ''}
                        data-property="${prop}"
                    >
                </div>
                ${inputHtml}
            </div>
        `;
    });
    
    // Return the full settings HTML
    return `
        <div class="settings-form">
            <div class="grid-container">
                ${formGroups.join('')}
            </div>
        </div>
    `;
}

module.exports = {
    getSettingsTabTemplate
};

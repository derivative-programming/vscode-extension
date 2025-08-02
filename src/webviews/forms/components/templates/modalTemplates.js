"use strict";
const { formatLabel } = require("../../helpers/formDataHelper");

/**
 * Generates the modal HTML for editing a form parameter
 * @param {Object} paramsSchema Schema properties for form parameters
 * @returns {string} HTML for parameter edit modal
 */
function getParamModalHtml(paramsSchema) {
    // Get properties to hide
    const { getParamPropertiesToHide } = require("./paramsTableTemplate");
    const propertiesToHide = getParamPropertiesToHide();
    
    // Filter out hidden properties and sort remaining properties alphabetically
    const sortedProps = Object.keys(paramsSchema)
        .filter(key => !propertiesToHide.includes(key.toLowerCase()))
        .sort();
    
    // Generate form groups for each property
    const formGroups = sortedProps.map(prop => {
        const schema = paramsSchema[prop];
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
        
        // Create the form group with checkbox for property toggle
        return `
            <div class="form-group">
                <div class="property-label">
                    <label for="param-${prop}">${propLabel} ${tooltipHtml}</label>
                </div>
                <div class="property-input">
                    ${inputHtml}
                    <input type="checkbox" id="param-${prop}-toggle" class="property-toggle" data-property="${prop}" title="Toggle property existence">
                </div>
            </div>
        `;
    }).join('');

    return `
    <div id="param-modal" class="modal">
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h3>Edit Parameter</h3>
            
            <form id="param-form">
                <input type="hidden" id="param-index">
                <div id="param-fields-container">
                    ${formGroups}
                </div>
                
                <div class="form-actions">
                    <button type="button" id="save-param">Save</button>
                    <button type="button" id="cancel-param">Cancel</button>
                </div>
            </form>
        </div>
    </div>`;
}

/**
 * Generates the modal HTML for editing a form button
 * @param {Object} buttonsSchema Schema properties for form buttons
 * @returns {string} HTML for button edit modal
 */
function getButtonModalHtml(buttonsSchema) {
    // Get properties to hide
    const { getButtonPropertiesToHide } = require("./buttonsTableTemplate");
    const propertiesToHide = getButtonPropertiesToHide();
    
    // Filter out hidden properties and sort remaining properties alphabetically
    const sortedProps = Object.keys(buttonsSchema)
        .filter(key => !propertiesToHide.includes(key.toLowerCase()))
        .sort();
    
    // Generate form groups for each property
    const formGroups = sortedProps.map(prop => {
        const schema = buttonsSchema[prop];
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
        
        // Create the form group with checkbox for property toggle
        return `
            <div class="form-group">
                <div class="property-label">
                    <label for="button-${prop}">${propLabel} ${tooltipHtml}</label>
                </div>
                <div class="property-input">
                    ${inputHtml}
                    <input type="checkbox" id="button-${prop}-toggle" class="property-toggle" data-property="${prop}" title="Toggle property existence">
                </div>
            </div>
        `;
    }).join('');

    return `
    <div id="button-modal" class="modal">
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h3>Edit Button</h3>
            
            <form id="button-form">
                <input type="hidden" id="button-index">
                <div id="button-fields-container">
                    ${formGroups}
                </div>
                
                <div class="form-actions">
                    <button type="button" id="save-button">Save</button>
                    <button type="button" id="cancel-button">Cancel</button>
                </div>
            </form>
        </div>
    </div>`;
}

/**
 * Generates the modal HTML for editing a form output variable
 * @param {Object} outputVarsSchema Schema properties for form output variables
 * @returns {string} HTML for output variable edit modal
 */
function getOutputVarModalHtml(outputVarsSchema) {
    // Get properties to hide
    const { getOutputVarPropertiesToHide } = require("./outputVarsTableTemplate");
    const propertiesToHide = getOutputVarPropertiesToHide();
    
    // Filter out hidden properties and sort remaining properties alphabetically
    const sortedProps = Object.keys(outputVarsSchema)
        .filter(key => !propertiesToHide.includes(key.toLowerCase()))
        .sort();
    
    // Generate form groups for each property
    const formGroups = sortedProps.map(prop => {
        const schema = outputVarsSchema[prop];
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
                <select id="output-var-${prop}" name="${prop}">
                    ${options}
                </select>
            `;
        } else {
            // Default to text input
            inputHtml = `
                <input type="text" id="output-var-${prop}" name="${prop}" value="">
            `;
        }
        
        // Create the form group with checkbox for property toggle
        return `
            <div class="form-group">
                <div class="property-label">
                    <label for="output-var-${prop}">${propLabel} ${tooltipHtml}</label>
                </div>
                <div class="property-input">
                    ${inputHtml}
                    <input type="checkbox" id="output-var-${prop}-toggle" class="property-toggle" data-property="${prop}" title="Toggle property existence">
                </div>
            </div>
        `;
    }).join('');

    return `
    <div id="output-var-modal" class="modal">
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h3>Edit Output Variable</h3>
            
            <form id="output-var-form">
                <input type="hidden" id="output-var-index">
                <div id="output-var-fields-container">
                    ${formGroups}
                </div>
                
                <div class="form-actions">
                    <button type="button" id="save-output-var">Save</button>
                    <button type="button" id="cancel-output-var">Cancel</button>
                </div>
            </form>
        </div>
    </div>`;
}

/**
 * Generates the modal HTML for adding a new form parameter
 * @param {Object} paramsSchema Schema properties for form parameters
 * @returns {string} HTML for add parameter modal
 */
function getAddParamModalHtml(paramsSchema) {
    return `
    <div id="add-param-modal" class="modal">
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h3>Add New Parameter</h3>
            
            <form id="add-param-form">
                <div id="add-param-fields-container"></div>
                
                <div class="form-actions">
                    <button type="button" id="save-add-param">Add</button>
                    <button type="button" id="cancel-add-param">Cancel</button>
                </div>
            </form>
        </div>
    </div>`;
}

/**
 * Generates the modal HTML for adding a new form button
 * @param {Object} buttonsSchema Schema properties for form buttons
 * @returns {string} HTML for add button modal
 */
function getAddButtonModalHtml(buttonsSchema) {
    return `
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h3>Add New Button</h3>
            
            <form id="add-button-form">
                <div class="form-row">
                    <label for="button-text-input">Button Text:</label>
                    <input type="text" id="button-text-input" name="buttonText" required placeholder="Enter button text" title="The text that will be displayed on the button">
                    <small class="help-text">Enter the text to display on the button. This must be unique within the form.</small>
                </div>
                <div id="button-text-error" class="error-message" style="display: none;"></div>
                
                <div class="form-actions">
                    <button type="button" id="save-add-button">Add</button>
                    <button type="button" id="cancel-add-button">Cancel</button>
                </div>
            </form>
        </div>`;
}

/**
 * Generates the modal HTML for adding a new form output variable
 * @param {Object} outputVarsSchema Schema properties for form output variables
 * @returns {string} HTML for add output variable modal
 */
function getAddOutputVarModalHtml(outputVarsSchema) {
    return `
    <div id="add-output-var-modal" class="modal">
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h3>Add New Output Variable</h3>
            
            <form id="add-output-var-form">
                <div id="add-output-var-fields-container"></div>
                
                <div class="form-actions">
                    <button type="button" id="save-add-output-var">Add</button>
                    <button type="button" id="cancel-add-output-var">Cancel</button>
                </div>
            </form>
        </div>
    </div>`;
}

module.exports = {
    getParamModalHtml,
    getButtonModalHtml,
    getOutputVarModalHtml,
    getAddParamModalHtml,
    getAddButtonModalHtml,
    getAddOutputVarModalHtml
};

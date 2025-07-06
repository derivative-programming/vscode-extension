"use strict";
const { formatLabel } = require("../../helpers/formDataHelper");

/**
 * Generates the modal HTML for editing a form parameter
 * @param {Object} paramsSchema Schema properties for form parameters
 * @returns {string} HTML for parameter edit modal
 */
function getParamModalHtml(paramsSchema) {
    return `
    <div id="param-modal" class="modal">
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h3>Edit Parameter</h3>
            
            <form id="param-form">
                <input type="hidden" id="param-index">
                <div id="param-fields-container"></div>
                
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
    return `
    <div id="button-modal" class="modal">
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h3>Edit Button</h3>
            
            <form id="button-form">
                <input type="hidden" id="button-index">
                <div id="button-fields-container"></div>
                
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
    return `
    <div id="output-var-modal" class="modal">
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h3>Edit Output Variable</h3>
            
            <form id="output-var-form">
                <input type="hidden" id="output-var-index">
                <div id="output-var-fields-container"></div>
                
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
    <div id="add-button-modal" class="modal">
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h3>Add New Button</h3>
            
            <form id="add-button-form">
                <div id="add-button-fields-container"></div>
                
                <div class="form-actions">
                    <button type="button" id="save-add-button">Add</button>
                    <button type="button" id="cancel-add-button">Cancel</button>
                </div>
            </form>
        </div>
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

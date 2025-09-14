"use strict";

/**
 * File: addInputControlModalTemplate.js
 * Purpose: Provides HTML template for the Add Input Control modal in forms
 * Created: 2025-01-27
 */

/**
 * Generates the HTML content for the Add Input Control modal
 * @returns {string} HTML string for the modal content
 */
function getAddInputControlModalHtml() {
    return `
<div class="modal-content">
    <span class="close-button">&times;</span>
    <h2>Add Input Control</h2>
    <div class="tabs">
        <div class="tab active" data-tab="singleAdd">Single Input Control</div>
        <div class="tab" data-tab="bulkAdd">Bulk Add</div>
        <div class="tab" data-tab="availProps">Avail Data Object Props</div>
    </div>
    <div id="singleAdd" class="tab-content active">
        <div class="form-row">
            <label for="inputControlName">Input Control Name:</label>
            <input type="text" id="inputControlName">
            <div class="field-note">Use Pascal case (Example: FirstName). No spaces are allowed in names. Alpha characters only. Maximum 100 characters.</div>
        </div>
        <div id="singleValidationError" class="validation-error"></div>
        <button id="addSingleInputControl">Add Input Control</button>
    </div>
    <div id="bulkAdd" class="tab-content">
        <div class="form-row">
            <label for="bulkInputControls">Input Control Names (one per line):</label>
            <textarea id="bulkInputControls" rows="5"></textarea>
            <div class="field-note">Use Pascal case (Example: FirstName). No spaces are allowed in names. Alpha characters only. Maximum 100 characters.</div>
        </div>
        <div id="bulkValidationError" class="validation-error"></div>
        <button id="addBulkInputControls">Add Input Controls</button>
    </div>
    <div id="availProps" class="tab-content">
        <div class="form-row">
            <label>Available Data Object Properties:</label>
            <div id="availPropsContainer" class="properties-container">
                <!-- Properties will be dynamically populated here -->
            </div>
            <div class="field-note">Select one or more properties from the available data objects. Input controls will be named using the format "[DataObjectName][PropertyName]".</div>
        </div>
        <div id="propsValidationError" class="validation-error"></div>
        <button id="addSelectedProps">Add Selected Properties</button>
    </div>
</div>`;
}

module.exports = {
    getAddInputControlModalHtml
};

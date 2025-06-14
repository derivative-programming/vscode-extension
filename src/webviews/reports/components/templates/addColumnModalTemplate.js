"use strict";

/**
 * Generates the HTML content for the Add Column modal
 * @returns {string} HTML string for the modal content
 */
function getAddColumnModalHtml() {
    return `
<div class="modal-content">
    <span class="close-button">&times;</span>
    <h2>Add Column</h2>
    <div class="tabs">
        <div class="tab active" data-tab="singleAdd">Single Column</div>
        <div class="tab" data-tab="bulkAdd">Bulk Add</div>
    </div>    <div id="singleAdd" class="tab-content active">
        <div class="form-row">
            <label for="columnName">Column Name:</label>
            <input type="text" id="columnName">
            <div class="field-note">Use Pascal case (Example: FirstName). No spaces are allowed in names. Alpha characters only. Maximum 100 characters.</div>
        </div>
        <div id="singleValidationError" class="validation-error"></div>
        <button id="addSingleColumn">Add Column</button>
    </div>
    <div id="bulkAdd" class="tab-content">
        <div class="form-row">
            <label for="bulkColumns">Column Names (one per line):</label>
            <textarea id="bulkColumns" rows="5"></textarea>
            <div class="field-note">Use Pascal case (Example: FirstName). No spaces are allowed in names. Alpha characters only. Header text will be auto-generated from the column name. Maximum 100 characters.</div>
        </div>
        <div id="bulkValidationError" class="validation-error"></div>
        <button id="addBulkColumns">Add Columns</button>
    </div>
</div>`;
}

module.exports = {
    getAddColumnModalHtml
};
"use strict";

/**
 * Generates the HTML content for the Add Parameter modal
 * @returns {string} HTML string for the modal content
 */
function getAddParamModalHtml() {
    return `
<div class="modal-content">
    <span class="close-button">&times;</span>
    <h2>Add Filter</h2>
    <div class="tabs">
        <div class="tab active" data-tab="singleAdd">Single Filter</div>
        <div class="tab" data-tab="bulkAdd">Bulk Add</div>
    </div>
    <div id="singleAdd" class="tab-content active">
        <div class="form-row">
            <label for="paramName">Filter Name:</label>
            <input type="text" id="paramName" placeholder="Enter filter name" />
            <div class="field-note">Use Pascal case (Example: FirstName). No spaces are allowed in names. Alpha characters only. Maximum 100 characters.</div>
        </div>
        <div id="singleValidationError" class="validation-error"></div>
        <button id="addSingleParam" class="primary-button">Add Filter</button>
    </div>
    <div id="bulkAdd" class="tab-content">
        <div class="form-row">
            <label for="bulkParams">Filter Names (one per line):</label>
            <textarea id="bulkParams" rows="6" placeholder="Enter filter names, one per line"></textarea>
            <div class="field-note">Use Pascal case for each name. No spaces allowed. Alpha characters only. One name per line.</div>
        </div>
        <div id="bulkValidationError" class="validation-error"></div>
        <button id="addBulkParams" class="primary-button">Add Filters</button>
    </div>
</div>`;
}

module.exports = {
    getAddParamModalHtml
};

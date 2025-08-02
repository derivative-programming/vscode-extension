"use strict";

/**
 * Generates the HTML content for the Add Button modal
 * @returns {string} HTML string for the modal content
 */
function getAddButtonModalHtml() {
    return `
<div class="modal-content">
    <div class="modal-header">
        <h3>Add Button</h3>
        <span class="close-button">&times;</span>
    </div>
    <div class="modal-body">
        <div class="tab-container">
            <div class="tab active" data-tab="singleAdd">Single Button</div>
            <div class="tab" data-tab="bulkAdd">Bulk Add</div>
        </div>
        <div id="singleAdd" class="tab-content active">
            <div class="form-row">
                <label for="buttonName">Button Name:</label>
                <input type="text" id="buttonName" placeholder="Enter button name" />
                <div class="field-note">Use Pascal case (Example: SubmitButton). No spaces are allowed in names. Alpha characters only. Maximum 100 characters.</div>
            </div>
            <div id="singleValidationError" class="validation-error"></div>
            <button id="addSingleButton" class="primary-button">Add Button</button>
        </div>
        <div id="bulkAdd" class="tab-content">
            <div class="form-row">
                <label for="bulkButtons">Button Names (one per line):</label>
                <textarea id="bulkButtons" rows="6" placeholder="Enter button names, one per line"></textarea>
                <div class="field-note">Use Pascal case for each name. No spaces allowed. Alpha characters only. One name per line.</div>
            </div>
            <div id="bulkValidationError" class="validation-error"></div>
            <button id="addBulkButtons" class="primary-button">Add Buttons</button>
        </div>
    </div>
</div>`;
}

module.exports = {
    getAddButtonModalHtml
};

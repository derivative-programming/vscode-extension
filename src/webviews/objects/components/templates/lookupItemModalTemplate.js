"use strict";

/**
 * Generates the HTML content for the Add Lookup Item modal
 * @returns {string} HTML string for the modal content
 */
function getLookupItemModalHtml() {
    return `
<div class="modal-content">
    <span class="close-button">&times;</span>
    <h2>Add Lookup Item</h2>
    <div class="tabs">
        <div class="tab active" data-tab="singleAdd">Single Lookup Item</div>
        <div class="tab" data-tab="bulkAdd">Bulk Add</div>
    </div>
    <div id="singleAdd" class="tab-content active">
        <div class="form-row">
            <label for="lookupItemName">Lookup Item Name:</label>
            <input type="text" id="lookupItemName">
            <div class="field-note">Use Pascal case (Example: ActiveStatus). No spaces are allowed in names. Alpha characters only. Maximum 50 characters.</div>
        </div>
        <div id="singleValidationError" class="validation-error"></div>
        <button id="addSingleLookupItem">Add Lookup Item</button>
    </div>
    <div id="bulkAdd" class="tab-content">
        <div class="form-row">
            <label for="bulkLookupItems">Lookup Item Names (one per line):</label>
            <textarea id="bulkLookupItems" rows="5"></textarea>
            <div class="field-note">Use Pascal case (Example: ActiveStatus). No spaces are allowed in names. Alpha characters only. Maximum 50 characters.</div>
        </div>
        <div id="bulkValidationError" class="validation-error"></div>
        <button id="addBulkLookupItems">Add Lookup Items</button>
    </div>
</div>`;
}

module.exports = {
    getLookupItemModalHtml
};

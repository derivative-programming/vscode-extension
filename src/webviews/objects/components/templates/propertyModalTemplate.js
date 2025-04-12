"use strict";

/**
 * Generates the HTML content for the Add Property modal
 * @returns {string} HTML string for the modal content
 */
function getPropertyModalHtml() {
    return `
<div class="modal-content">
    <span class="close-button">&times;</span>
    <h2>Add Property</h2>
    <div class="tabs">
        <div class="tab active" data-tab="singleAdd">Single Property</div>
        <div class="tab" data-tab="bulkAdd">Bulk Add</div>
    </div>
    <div id="singleAdd" class="tab-content active">
        <div class="form-row">
            <label for="propName">Property Name:</label>
            <input type="text" id="propName" placeholder="Enter property name">
        </div>
        <div id="singleValidationError" class="validation-error"></div>
        <button id="addSingleProp">Add Property</button>
    </div>
    <div id="bulkAdd" class="tab-content">
        <div class="form-row">
            <label for="bulkProps">Property Names (one per line):</label>
            <textarea id="bulkProps" rows="5" placeholder="Enter property names (one per line)"></textarea>
        </div>
        <div id="bulkValidationError" class="validation-error"></div>
        <button id="addBulkProps">Add Properties</button>
    </div>
</div>`;
}

module.exports = {
    getPropertyModalHtml
};
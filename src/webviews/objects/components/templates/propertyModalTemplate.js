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
        <div class="tab" data-tab="lookupAdd">Lookup Property</div>
    </div>
    <div id="singleAdd" class="tab-content active">
        <div class="form-row">
            <label for="propName">Property Name:</label>
            <input type="text" id="propName">
            <div class="field-note">Use Pascal case (Example: ToDoItem). No spaces are allowed in names. Alpha characters only.</div>
        </div>
        <div id="singleValidationError" class="validation-error"></div>
        <button id="addSingleProp">Add Property</button>
    </div>
    <div id="bulkAdd" class="tab-content">
        <div class="form-row">
            <label for="bulkProps">Property Names (one per line):</label>
            <textarea id="bulkProps" rows="5"></textarea>
            <div class="field-note">Use Pascal case (Example: ToDoItem). No spaces are allowed in names. Alpha characters only.</div>
        </div>
        <div id="bulkValidationError" class="validation-error"></div>
        <button id="addBulkProps">Add Properties</button>
    </div>
    <div id="lookupAdd" class="tab-content">
        <div class="form-row">
            <label for="lookupObjectsList">Select Lookup Data Object:</label>
            <select id="lookupObjectsList" size="8" style="width: 100%; height: 150px;">
                <!-- Options will be populated dynamically -->
            </select>
            <div class="field-note">Select a lookup data object to create a foreign key property. The property name will be automatically generated as [ObjectName]ID.</div>
        </div>
        <div id="lookupValidationError" class="validation-error"></div>
        <button id="addLookupProp" disabled>Add Lookup Property</button>
    </div>
</div>`;
}

module.exports = {
    getPropertyModalHtml
};
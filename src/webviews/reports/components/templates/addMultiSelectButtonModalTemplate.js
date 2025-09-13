"use strict";

/**
 * Generates the HTML content for the Add Multi-Select Button modal
 * @returns {string} HTML string for the modal content
 */
function getAddMultiSelectButtonModalHtml() {
    return `
<div class="modal-content">
    <span class="close-button">&times;</span>
    <h2>Add Multi-Select Button</h2>
    <div class="form-row">
        <label for="multiSelectButtonText">Button Text:</label>
        <input type="text" id="multiSelectButtonText" placeholder="Enter button text" />
        <div class="field-note">Enter the display text for the multi-select button. This will be shown to users on the interface.</div>
    </div>
    <div id="multiSelectValidationError" class="validation-error"></div>
    <div class="modal-buttons">
        <button id="addMultiSelectButton" class="primary-button">Add</button>
        <button id="cancelMultiSelectButton" class="secondary-button">Cancel</button>
    </div>
</div>`;
}

module.exports = {
    getAddMultiSelectButtonModalHtml
};
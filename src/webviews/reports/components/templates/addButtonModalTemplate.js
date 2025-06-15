"use strict";

/**
 * Generates the HTML content for the Add Button modal
 * @returns {string} HTML string for the modal content
 */
function getAddButtonModalHtml() {
    return `
<div class="modal-content">
    <span class="close-button">&times;</span>
    <h2>Add Button</h2>
    
    <div class="form-row">
        <label for="buttonName">Button Name:</label>
        <input type="text" id="buttonName">
        <div class="field-note">Use Pascal case (Example: SubmitButton). No spaces are allowed in names. Alpha characters only. Maximum 100 characters.</div>
    </div>
    <div id="buttonValidationError" class="validation-error"></div>
    <button id="addButton">Add Button</button>
</div>`;
}

module.exports = {
    getAddButtonModalHtml
};

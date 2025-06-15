"use strict";

/**
 * objectSearchModalTemplate.js
 * Generates the HTML content for the Object Search modal
 * Created: 2024-12-27
 * Purpose: Provides a modal interface for selecting FK object names from available objects
 */

/**
 * Generates the HTML content for the Object Search modal
 * @returns {string} HTML string for the modal content
 */
function getObjectSearchModalHtml() {
    return `
<div class="modal-content">
    <span class="close-button">&times;</span>
    <h2>Select FK Object</h2>
    <div class="form-row">
        <label for="objectList">Available Objects:</label>
        <select id="objectList" size="10" style="width: 100%; height: 200px;">
            <!-- Options will be populated by JavaScript -->
        </select>
        <div class="field-note">Select an object from the list to use as the foreign key target.</div>
    </div>
    <div class="modal-buttons">
        <button id="acceptObjectSelection">Accept</button>
        <button id="cancelObjectSelection">Cancel</button>
    </div>
</div>`;
}

module.exports = {
    getObjectSearchModalHtml
};
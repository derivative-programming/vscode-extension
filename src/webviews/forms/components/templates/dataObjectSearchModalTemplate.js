"use strict";

/**
 * dataObjectSearchModalTemplate.js
 * Generates the HTML content for the Data Object Search modal
 * Created: 2025-01-16
 * Purpose: Provides a modal interface for browsing and selecting source object names from available data objects
 */

/**
 * Generates the HTML content for the Data Object Search modal
 * @returns {string} HTML string for the modal content
 */
function getDataObjectSearchModalHtml() {
    return `
<div class="modal-content">
    <span class="close-button">&times;</span>
    <h2>Browse Data Objects</h2>
    <div class="form-row">
        <label for="dataObjectNameFilter">Filter by Name:</label>
        <input type="text" id="dataObjectNameFilter" placeholder="Enter text to filter data objects..." style="width: 100%; margin-bottom: 10px;" />
    </div>
    <div class="form-row">
        <label for="dataObjectList">Available Data Objects:</label>
        <select id="dataObjectList" size="10" style="width: 100%; height: 200px;">
            <!-- Options will be populated by JavaScript -->
        </select>
        <div class="field-note">Select a data object from the list to use as the source object.</div>
    </div>
    <div class="modal-buttons">
        <button id="acceptDataObjectSelection">Accept</button>
        <button id="cancelDataObjectSelection">Cancel</button>
    </div>
</div>`;
}

module.exports = {
    getDataObjectSearchModalHtml
};
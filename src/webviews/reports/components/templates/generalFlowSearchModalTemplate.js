"use strict";

/**
 * generalFlowSearchModalTemplate.js
 * Generates the HTML content for the General Flow Search modal
 * Created: 2025-01-27
 * Purpose: Provides a modal interface for browsing and selecting general flows
 */

/**
 * Generates the HTML content for the General Flow Search modal
 * @returns {string} HTML string for the modal content
 */
function getGeneralFlowSearchModalHtml() {
    return `
<div class="modal-content">
    <span class="close-button">&times;</span>
    <h2>Browse for General Flow</h2>
    <div class="form-row">
        <label for="generalFlowNameFilter">Filter by Name:</label>
        <input type="text" id="generalFlowNameFilter" placeholder="Enter text to filter general flows..." style="width: 100%; margin-bottom: 10px;" />
    </div>
    <div class="form-row">
        <label for="generalFlowList">Available General Flows:</label>
        <select id="generalFlowList" size="10" style="width: 100%; height: 200px;">
            <!-- Options will be populated by JavaScript -->
        </select>
        <div class="field-note">Select a general flow for the button to execute.</div>
    </div>
    <div class="modal-buttons">
        <button id="acceptGeneralFlowSelection">Accept</button>
        <button id="cancelGeneralFlowSelection">Cancel</button>
    </div>
</div>`;
}

module.exports = {
    getGeneralFlowSearchModalHtml
};
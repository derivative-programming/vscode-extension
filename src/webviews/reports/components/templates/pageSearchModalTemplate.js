"use strict";

/**
 * pageSearchModalTemplate.js
 * Generates the HTML content for the Page Search modal
 * Created: 2025-08-16
 * Purpose: Provides a modal interface for browsing and selecting destination target names from available pages/forms/reports
 */

/**
 * Generates the HTML content for the Page Search modal
 * @returns {string} HTML string for the modal content
 */
function getPageSearchModalHtml() {
    return `
<div class="modal-content">
    <span class="close-button">&times;</span>
    <h2>Browse for Page</h2>
    <div class="form-row">
        <label for="pageTypeFilter">Filter by Type:</label>
        <select id="pageTypeFilter" style="width: 100%; margin-bottom: 10px;">
            <option value="">All Types</option>
            <option value="form">Forms</option>
            <option value="report">Reports</option>
        </select>
    </div>
    <div class="form-row">
        <label for="pageList">Available Pages:</label>
        <select id="pageList" size="10" style="width: 100%; height: 200px;">
            <!-- Options will be populated by JavaScript -->
        </select>
        <div class="field-note">Select a page/form/report to use as the destination target.</div>
    </div>
    <div class="modal-buttons">
        <button id="acceptPageSelection">Accept</button>
        <button id="cancelPageSelection">Cancel</button>
    </div>
</div>`;
}

module.exports = {
    getPageSearchModalHtml
};

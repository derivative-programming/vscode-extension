"use strict";

/**
 * addGeneralFlowButtonColumnModalTemplate.js
 * Generates the HTML content for the Add General Flow Button Column modal
 * Created: 2025-01-27
 * Purpose: Provides a modal interface for creating general flow button columns in reports
 */

/**
 * Generates the HTML content for the Add General Flow Button Column modal
 * @returns {string} HTML string for the modal content
 */
function getAddGeneralFlowButtonColumnModalHtml() {
    return `
<div class="modal-content">
    <span class="close-button">&times;</span>
    <h2>Add General Flow Button Column</h2>
    
    <div class="form-row">
        <label for="generalFlowName">General Flow:</label>
        <div class="general-flow-list-container">
            <select id="generalFlowName" size="8">
                <option value="" disabled selected>Loading general flows...</option>
            </select>
        </div>
        <div class="field-note">Select the general flow that the button will execute.</div>
    </div>
    
    <div class="form-row">
        <label for="buttonText">Button Text:</label>
        <input type="text" id="buttonText" placeholder="Enter button text">
        <div class="field-note">The text displayed on the button (Example: Process Item).</div>
    </div>
    
    <div class="form-row">
        <label for="columnName">Column Name:</label>
        <input type="text" id="columnName" placeholder="Auto-generated from button text and general flow">
        <div class="field-note">Column name is automatically generated from button text and selected general flow.</div>
    </div>
    
    <div id="validationError" class="validation-error"></div>
    
    <div class="modal-buttons">
        <button id="addGeneralFlowButtonColumn">Add</button>
        <button id="cancelGeneralFlowButtonColumn">Cancel</button>
    </div>
</div>`;
}

module.exports = {
    getAddGeneralFlowButtonColumnModalHtml
};
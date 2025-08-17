"use strict";

/**
 * addDestinationButtonColumnModalTemplate.js
 * Generates the HTML content for the Add Destination Button Column modal
 * Created: 2025-08-17
 * Purpose: Provides a modal interface for creating destination button columns in reports
 */

/**
 * Generates the HTML content for the Add Destination Button Column modal
 * @returns {string} HTML string for the modal content
 */
function getAddDestinationButtonColumnModalHtml() {
    return `
<div class="modal-content">
    <span class="close-button">&times;</span>
    <h2>Add Destination Button Column</h2>
    
    <div class="form-row">
        <label for="destinationPageName">Destination Page:</label>
        <div class="control-with-button">
            <input type="text" id="destinationPageName" placeholder="Enter destination page name">
            <button type="button" class="lookup-button" id="browseDestinationPage" title="Browse for Page">
                <i class="codicon codicon-search"></i>
            </button>
        </div>
        <div class="field-note">Select the page/form/report that the button will navigate to.</div>
    </div>
    
    <div class="form-row">
        <label for="buttonText">Button Text:</label>
        <input type="text" id="buttonText" placeholder="Enter button text">
        <div class="field-note">The text displayed on the button (Example: View Details).</div>
    </div>
    
    <div class="form-row">
        <label for="columnName">Column Name:</label>
        <input type="text" id="columnName" placeholder="Auto-generated from button text and destination">
        <div class="field-note">Column name is automatically generated from button text and destination page owner object.</div>
    </div>
    
    <div id="validationError" class="validation-error"></div>
    
    <div class="modal-buttons">
        <button id="addDestinationButtonColumn">Add</button>
        <button id="cancelDestinationButtonColumn">Cancel</button>
    </div>
</div>`;
}

module.exports = {
    getAddDestinationButtonColumnModalHtml
};

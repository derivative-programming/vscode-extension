"use strict";

function getDataObjectSearchModalTemplate() {
    return `
    <div id="dataObjectSearchModal" class="modal" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Select Data Object</h3>
                <button type="button" class="close-button">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-row">
                    <label for="dataObjectFilter">Filter Data Objects:</label>
                    <input type="text" id="dataObjectFilter" placeholder="Type to filter data objects..." autocomplete="off">
                </div>
                <div class="form-row">
                    <label for="dataObjectSelect">Available Data Objects:</label>
                    <select id="dataObjectSelect" size="10" style="width: 100%; min-height: 200px;">
                        <!-- Options will be populated dynamically -->
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" id="acceptDataObjectSelection">Accept</button>
                <button type="button" class="cancel-button">Cancel</button>
            </div>
        </div>
    </div>`;
}

module.exports = { getDataObjectSearchModalTemplate };

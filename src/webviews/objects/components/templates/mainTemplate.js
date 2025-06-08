"use strict";

/**
 * Generates the main HTML content for the object details view
 * @param {Object} object The object data to display
 * @param {number} propsLength Number of properties
 * @param {string} settingsHtml HTML content for the settings tab
 * @param {string} tableHeaders HTML for table headers
 * @param {string} tableRows HTML for table rows
 * @param {string} listViewFields HTML for list view form fields
 * @param {string} clientScript HTML script tag with JavaScript
 * @returns {string} Complete HTML for the details view
 */
function getMainTemplate(object, propsLength, settingsHtml, tableHeaders, tableRows, listViewFields, clientScript) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" width="device-width, initial-scale=1.0">
    <title>Object Details: ${object.name}</title>
    <style>
        ${getDetailViewStyles()}
    </style>
</head>
<body>
    <h1>Details for ${object.name} Data Object</h1>
    
    <div class="tabs">
        <div class="tab active" data-tab="settings">Settings</div>
        <div class="tab" data-tab="props">Properties (${propsLength})</div>
    </div>
    
    <div id="settings" class="tab-content active">
        ${object.error ? 
            `<div class="error">${object.error}</div>` : 
            `<form id="settingsForm">
                ${settingsHtml}
            </form>`
        }
    </div>
    
    <div id="props" class="tab-content">
        <div class="view-icons">
            <div class="view-icons-left">
                <span class="icon list-icon active" data-view="list">List View</span>
                <span class="icon table-icon" data-view="table">Table View</span>
            </div>
            <button id="addProp" class="add-prop-button">Add Property</button>
        </div>

        <div id="tableView" class="view-content">
            ${object.error ? 
                `<div class="error">${object.error}</div>` : 
                `<div class="table-container">
                    <table id="propsTable">
                        <thead>
                            <tr>
                                ${tableHeaders}
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>`
            }
        </div>

        <div id="listView" class="view-content active">
            <div class="list-container">
                <select id="propsList" size="10">
                    ${object.prop.map((prop, index) => `<option value="${index}">${prop.name || 'Unnamed Property'}</option>`).join('')}
                </select>
                <button id="copyPropsButton" class="copy-props-button">Copy</button>
            </div>
            <div id="propertyDetailsContainer" class="details-container" style="display: none;">
                <form id="propDetailsForm">
                    ${listViewFields}
                </form>
            </div>
        </div>

        ${clientScript}
    </div>
</body>
</html>`;
}

// Import required styles
const { getDetailViewStyles } = require("../../styles/detailsViewStyles");

module.exports = {
    getMainTemplate
};
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
 * @param {Object} lookupItemsHtml HTML content for lookup items tab (null if not a lookup object)
 * @param {number} lookupItemsLength Number of lookup items
 * @returns {string} Complete HTML for the details view
 */
function getMainTemplate(object, propsLength, settingsHtml, tableHeaders, tableRows, listViewFields, clientScript, lookupItemsHtml, lookupItemsLength) {
    return `<!DOCTYPE html>
<html lang="en">
<head>    <meta charset="UTF-8">
    <meta name="viewport" width="device-width, initial-scale=1.0">
    <title>Object Details: ${object.name}</title>
    <link rel="stylesheet" href="https://unpkg.com/@vscode/codicons@latest/dist/codicon.css" />
    <style>
        ${getDetailViewStyles()}
    </style>
</head>
<body>
    <h1>Details for ${object.name} Data Object</h1>
    
    <div class="tabs">
        <div class="tab active" data-tab="settings">Settings</div>
        <div class="tab" data-tab="props">Properties (${propsLength})</div>
        ${object.isLookup === "true" ? `<div class="tab" data-tab="lookupItems">Lookup Items (${lookupItemsLength || 0})</div>` : ""}
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
                <span class="icon list-icon active" data-view="propsList">List View</span>
                <span class="icon table-icon" data-view="propsTable">Table View</span>
            </div>
            <button id="addProp" class="add-prop-button">Add Property</button>
        </div>

        <div id="propsTableView" class="view-content">
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

        <div id="propsListView" class="view-content active">
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

    ${object.isLookup === "true" ? `
    <div id="lookupItems" class="tab-content">
        <div class="view-icons">
            <div class="view-icons-left">
                <span class="icon list-icon active" data-view="lookupList">List View</span>
                <span class="icon table-icon" data-view="lookupTable">Table View</span>
            </div>
            <button id="addLookupItem" class="add-lookup-item-button">Add Lookup Item</button>
        </div>

        <div id="lookupTableView" class="view-content">
            ${object.error ? 
                `<div class="error">${object.error}</div>` : 
                `<div class="table-container">
                    <table id="lookupItemsTable">
                        <thead>
                            <tr>
                                ${lookupItemsHtml ? lookupItemsHtml.tableHeaders : ""}
                            </tr>
                        </thead>
                        <tbody>
                            ${lookupItemsHtml ? lookupItemsHtml.tableRows : ""}
                        </tbody>
                    </table>
                </div>`
            }
        </div>

        <div id="lookupListView" class="view-content active">
            <div class="list-container">
                <select id="lookupItemsList" size="10">
                    ${object.lookupItem ? object.lookupItem.map((item, index) => `<option value="${index}">${item.name || item.displayName || 'Unnamed Lookup Item'}</option>`).join('') : ''}
                </select>
                <button id="copyLookupItemsButton" class="copy-lookup-items-button">Copy</button>
            </div>
            <div id="lookupItemDetailsContainer" class="details-container" style="display: none;">
                <form id="lookupItemDetailsForm">
                    ${lookupItemsHtml ? lookupItemsHtml.formFields : ""}
                </form>
            </div>
        </div>
    </div>
    ` : ""}
</body>
</html>`;
}

// Import required styles
const { getDetailViewStyles } = require("../../styles/detailsViewStyles");

module.exports = {
    getMainTemplate
};
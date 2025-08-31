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
 * @param {string} initialTab Initial tab to show ('settings', 'props', 'lookupItems')
 * @returns {string} Complete HTML for the details view
 */
function getMainTemplate(object, propsLength, settingsHtml, tableHeaders, tableRows, listViewFields, clientScript, lookupItemsHtml, lookupItemsLength, initialTab = 'settings') {
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
        <div class="tab ${initialTab === 'settings' ? 'active' : ''}" data-tab="settings">Settings</div>
        <div class="tab ${initialTab === 'props' ? 'active' : ''}" data-tab="props">Properties (${propsLength})</div>
        ${(object.isLookup === "true" || initialTab === 'lookupItems') ? `<div class="tab ${initialTab === 'lookupItems' ? 'active' : ''}" data-tab="lookupItems">Lookup Items (${lookupItemsLength || 0})</div>` : ""}
    </div>
    
    <script>
        console.log("[DEBUG] MainTemplate - object.isLookup:", "${object.isLookup}");
        console.log("[DEBUG] MainTemplate - initialTab:", "${initialTab}");
        console.log("[DEBUG] MainTemplate - lookup tab condition:", ${(object.isLookup === "true" || initialTab === 'lookupItems')});
    </script>
    
    <div id="settings" class="tab-content ${initialTab === 'settings' ? 'active' : ''}">
        ${object.error ? 
            `<div class="error">${object.error}</div>` : 
            `<form id="settingsForm">
                ${settingsHtml}
            </form>`
        }
    </div>
    
    <div id="props" class="tab-content ${initialTab === 'props' ? 'active' : ''}">
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
                <div class="list-buttons">
                    <button id="copyPropsButton" class="copy-props-button">Copy List</button>
                </div>
            </div>
            <div id="propertyDetailsContainer" class="details-container" style="display: none;">
                <form id="propDetailsForm">
                    ${listViewFields}
                </form>
            </div>
        </div>

        ${clientScript}
    </div>

    ${(object.isLookup === "true" || initialTab === 'lookupItems') ? `
    <div id="lookupItems" class="tab-content ${initialTab === 'lookupItems' ? 'active' : ''}">
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
                <div class="list-buttons">
                    <button id="copyLookupItemsButton" class="copy-lookup-items-button">Copy List</button>
                    <button id="moveUpLookupItemsButton" class="move-button">Move Up</button>
                    <button id="moveDownLookupItemsButton" class="move-button">Move Down</button>
                    <button id="reverseLookupItemsButton" class="reverse-button">Reverse</button>
                </div>
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
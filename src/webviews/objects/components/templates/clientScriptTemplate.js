"use strict";

// Import required templates
const { getPropertyModalHtml } = require("./propertyModalTemplate");
const { getPropertyModalFunctionality } = require("./propertyModalFunctionality");
const { getObjectSearchModalHtml } = require("./objectSearchModalTemplate");
const { getObjectSearchModalFunctionality } = require("./objectSearchModalFunctionality");
const { getLookupItemModalHtml } = require("./lookupItemModalTemplate");
const { getLookupItemModalFunctionality } = require("./lookupItemModalFunctionality");
const { getPropertiesTableTemplate } = require("./propertiesTableTemplate");
const { getPropertiesListTemplate } = require("./propertiesListTemplate");
const { getLookupItemsTemplate } = require("./lookupItemsTemplate");

// Import script modules
const { getUIEventHandlers } = require("../scripts/uiEventHandlers");
const { getFormControlUtilities } = require("../scripts/formControlUtilities");
const { getPropertyManagementFunctions } = require("../scripts/propertyManagement");
const { getSaveSubmitHandlers } = require("../scripts/saveSubmitHandlers");
const { getDOMInitialization } = require("../scripts/domInitialization");
const { getLookupItemManagementFunctions } = require("../scripts/lookupItemManagement");

/**
 * Generates client-side JavaScript for the details view
 * @param {Array} props The property items array 
 * @param {Object} propItemsSchema Schema for property items
 * @param {string} objectName The name of the object for display and messaging
 * @param {Array} allObjects Array of all available objects for FK lookup
 * @param {Object} objectData The complete object data including lookup items
 * @param {Object} lookupItemsSchema Schema for lookup items (optional)
 * @returns {string} HTML script tag with JavaScript
 */
function getClientScriptTemplate(props, propItemsSchema, objectName, allObjects, objectData, lookupItemsSchema) {
    // Create header columns for all prop item properties and sort them alphabetically
    // Make sure 'name' is always the first column
    const propColumns = Object.keys(propItemsSchema).filter(key => key !== "name").sort();
    propColumns.unshift("name");

    // Use the passed lookupItemsSchema parameter if available
    let lookupColumns = [];
    
    // Create header columns for lookup items if schema is available
    if (lookupItemsSchema && typeof lookupItemsSchema === 'object' && Object.keys(lookupItemsSchema).length > 0) {
        lookupColumns = Object.keys(lookupItemsSchema).filter(key => key !== "name").sort();
        if (lookupItemsSchema.name) {
            lookupColumns.unshift("name");
        }
    }

    return `<script>
            (function() {
                // Core data and API
                const vscode = acquireVsCodeApi();
                const props = ${JSON.stringify(props)};
                const propColumns = ${JSON.stringify(propColumns)};
                const propItemsSchema = ${JSON.stringify(propItemsSchema)};
                const lookupColumns = ${JSON.stringify(lookupColumns)};
                const lookupItemsSchema = ${JSON.stringify(lookupItemsSchema || {})};
                const objectName = "${objectName || ''}";
                const allObjects = ${JSON.stringify(allObjects || [])};
                
                // Make object data available globally for lookup items
                window.objectData = ${JSON.stringify(objectData || {})};

                // Helper function to format labels (convert camelCase/PascalCase to readable labels)
                function formatLabel(key) {
                    if (!key) {
                        return "";
                    }

                    // Use regex for a more robust approach to handle various cases including acronyms
                    let result = key
                        // Insert space before a capital letter followed by a lowercase letter (e.g., AppDna -> App Dna)
                        .replace(/([A-Z])([a-z])/g, " $1$2")
                        // Insert space before a capital letter that is preceded by a lowercase letter or digit (e.g., appDNA -> app DNA, test1DNA -> test1 DNA)
                        .replace(/([a-z\\d])([A-Z])/g, "$1 $2")
                        // Insert space before a sequence of capital letters followed by a lowercase letter (handles acronym followed by word, e.g. DNAApp -> DNA App)
                        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
                        // Add space between letter and digit: TestA1 -> Test A 1
                        .replace(/([A-Za-z])(\\d)/g, "$1 $2");

                    // Capitalize the first letter and trim whitespace
                    result = result.charAt(0).toUpperCase() + result.slice(1).trim();

                    return result;
                }

                // Helper function to get property modal HTML
                function getPropertyModalHtml() {
                    return \`${getPropertyModalHtml().replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
                }

                // Helper function to get object search modal HTML
                function getObjectSearchModalHtml() {
                    return \`${getObjectSearchModalHtml().replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
                }

                // Helper function to get lookup item modal HTML
                function getLookupItemModalHtml() {
                    return \`${getLookupItemModalHtml().replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
                }

                // Template functions for view regeneration
                function getPropertiesTableTemplate(props, propItemsSchema) {
                    ${getPropertiesTableTemplate.toString().replace(/^function getPropertiesTableTemplate\([^)]*\) \{|\}$/g, '')}
                }

                function getPropertiesListTemplate(propItemsSchema) {
                    ${getPropertiesListTemplate.toString().replace(/^function getPropertiesListTemplate\([^)]*\) \{|\}$/g, '')}
                }

                function getLookupItemsTemplate(lookupItems, lookupItemsSchema) {
                    ${getLookupItemsTemplate.toString().replace(/^function getLookupItemsTemplate\([^)]*\) \{|\}$/g, '')}
                }

                // Import modal functionality
                ${getPropertyModalFunctionality()}

                // Import object search modal functionality
                ${getObjectSearchModalFunctionality()}

                // Import lookup item modal functionality
                ${getLookupItemModalFunctionality()}

                // UI Event Handlers for tabs and view switching
                ${getUIEventHandlers()}

                // Form Control Utilities
                ${getFormControlUtilities()}

                // Property Management Functions
                ${getPropertyManagementFunctions()}

                // Lookup Item Management Functions  
                ${getLookupItemManagementFunctions()}

                // DOM Initialization
                ${getDOMInitialization()}

                // Save and Submit Handlers
                ${getSaveSubmitHandlers()}
                
                // View Refresh Functions for synchronizing list and table views
                // View Reload Functions that completely regenerate view content
                window.reloadPropertiesTableView = function() {
                    console.log('=== reloadPropertiesTableView called ===');
                    console.log('Current props array:', props);
                    
                    const propsTableView = document.getElementById('propsTableView');
                    if (!propsTableView) {
                        console.log('Reload skipped - propsTableView not found');
                        return;
                    }
                    
                    // Import the table template function (it should be available in the global scope)
                    if (typeof getPropertiesTableTemplate === 'function') {
                        const { tableHeaders, tableRows } = getPropertiesTableTemplate(props, propItemsSchema);
                        
                        propsTableView.innerHTML = \`<div class="table-container">
                            <table id="propsTable">
                                <thead>
                                    <tr>
                                        \${tableHeaders}
                                    </tr>
                                </thead>
                                <tbody>
                                    \${tableRows}
                                </tbody>
                            </table>
                        </div>\`;
                        
                        // Re-initialize checkbox behavior for all rows
                        setupRealTimeUpdates();
                        
                        console.log('Properties table view reloaded successfully');
                    } else {
                        console.warn('getPropertiesTableTemplate function not available');
                    }
                };
                
                window.reloadPropertiesListView = function() {
                    console.log('=== reloadPropertiesListView called ===');
                    console.log('Current props array:', props);
                    
                    const propsListView = document.getElementById('propsListView');
                    if (!propsListView) {
                        console.log('Reload skipped - propsListView not found');
                        return;
                    }
                    
                    // Import the list template function (it should be available in the global scope)
                    if (typeof getPropertiesListTemplate === 'function') {
                        const listViewFields = getPropertiesListTemplate(propItemsSchema);
                        
                        propsListView.innerHTML = \`<div class="list-container">
                            <select id="propsList" size="10">
                                \${props.map((prop, index) => \`<option value="\${index}">\${prop.name || 'Unnamed Property'}</option>\`).join('')}
                            </select>
                            <div class="list-buttons">
                                <button id="copyPropsButton" class="copy-props-button">Copy List</button>
                            </div>
                        </div>
                        <div id="propertyDetailsContainer" class="details-container" style="display: none;">
                            <form id="propDetailsForm">
                                \${listViewFields}
                            </form>
                        </div>\`;
                        
                        // Re-initialize event handlers
                        setupRealTimeUpdates();
                        
                        console.log('Properties list view reloaded successfully');
                    } else {
                        console.warn('getPropertiesListTemplate function not available');
                    }
                };
                
                window.reloadLookupItemsTableView = function() {
                    console.log('=== reloadLookupItemsTableView called ===');
                    const lookupItems = (window.objectData && window.objectData.lookupItem) ? window.objectData.lookupItem : [];
                    console.log('Current lookupItems array:', lookupItems);
                    
                    const lookupTableView = document.getElementById('lookupTableView');
                    if (!lookupTableView) {
                        console.log('Reload skipped - lookupTableView not found');
                        return;
                    }
                    
                    // Use the lookup items template function
                    if (typeof getLookupItemsTemplate === 'function') {
                        const lookupHtml = getLookupItemsTemplate(lookupItems, lookupItemsSchema);
                        
                        lookupTableView.innerHTML = \`<div class="table-container">
                            <table id="lookupItemsTable">
                                <thead>
                                    <tr>
                                        \${lookupHtml.tableHeaders}
                                    </tr>
                                </thead>
                                <tbody>
                                    \${lookupHtml.tableRows}
                                </tbody>
                            </table>
                        </div>\`;
                        
                        // Re-initialize lookup items functionality
                        if (typeof initializeLookupItems === 'function') {
                            initializeLookupItems();
                        }
                        
                        console.log('Lookup items table view reloaded successfully');
                    } else {
                        console.warn('getLookupItemsTemplate function not available');
                    }
                };
                
                window.reloadLookupItemsListView = function() {
                    console.log('=== reloadLookupItemsListView called ===');
                    const lookupItems = (window.objectData && window.objectData.lookupItem) ? window.objectData.lookupItem : [];
                    console.log('Current lookupItems array:', lookupItems);
                    
                    const lookupListView = document.getElementById('lookupListView');
                    if (!lookupListView) {
                        console.log('Reload skipped - lookupListView not found');
                        return;
                    }
                    
                    // Use the lookup items template function for list view
                    if (typeof getLookupItemsTemplate === 'function') {
                        const lookupHtml = getLookupItemsTemplate(lookupItems, lookupItemsSchema);
                        
                        lookupListView.innerHTML = \`<div class="list-container">
                            <select id="lookupItemsList" size="10">
                                \${lookupItems.map((item, index) => \`<option value="\${index}">\${item.name || 'Unnamed Item'}</option>\`).join('')}
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
                                \${lookupHtml.formFields}
                            </form>
                        </div>\`;
                        
                        // Re-initialize lookup items functionality
                        if (typeof initializeLookupItems === 'function') {
                            initializeLookupItems();
                        }
                        
                        console.log('Lookup items list view reloaded successfully');
                    } else {
                        console.warn('getLookupItemsTemplate function not available');
                    }
                };
            })();
        </script>`;
}

module.exports = {
    getClientScriptTemplate
};
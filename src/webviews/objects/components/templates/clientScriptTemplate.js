"use strict";

// Import required templates
const { getPropertyModalHtml } = require("./propertyModalTemplate");
const { getPropertyModalFunctionality } = require("./propertyModalFunctionality");
const { getObjectSearchModalHtml } = require("./objectSearchModalTemplate");
const { getObjectSearchModalFunctionality } = require("./objectSearchModalFunctionality");
const { getLookupItemModalHtml } = require("./lookupItemModalTemplate");
const { getLookupItemModalFunctionality } = require("./lookupItemModalFunctionality");

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

                // Helper function to get property modal HTML
                function getPropertyModalHtml() {
                    ${getPropertyModalHtml.toString().replace(/^function getPropertyModalHtml\(\) \{|\}$/g, '')}
                }

                // Helper function to get object search modal HTML
                function getObjectSearchModalHtml() {
                    ${getObjectSearchModalHtml.toString().replace(/^function getObjectSearchModalHtml\(\) \{|\}$/g, '')}
                }

                // Helper function to get lookup item modal HTML
                function getLookupItemModalHtml() {
                    ${getLookupItemModalHtml.toString().replace(/^function getLookupItemModalHtml\(\) \{|\}$/g, '')}
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
            })();
        </script>`;
}

module.exports = {
    getClientScriptTemplate
};
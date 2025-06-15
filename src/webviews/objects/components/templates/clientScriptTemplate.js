"use strict";

// Import required templates
const { getPropertyModalHtml } = require("./propertyModalTemplate");
const { getPropertyModalFunctionality } = require("./propertyModalFunctionality");
const { getObjectLookupModalHtml } = require("./objectLookupModalTemplate");
const { getObjectLookupModalFunctionality } = require("./objectLookupModalFunctionality");

// Import script modules
const { getUIEventHandlers } = require("../scripts/uiEventHandlers");
const { getFormControlUtilities } = require("../scripts/formControlUtilities");
const { getPropertyManagementFunctions } = require("../scripts/propertyManagement");
const { getSaveSubmitHandlers } = require("../scripts/saveSubmitHandlers");
const { getDOMInitialization } = require("../scripts/domInitialization");

/**
 * Generates client-side JavaScript for the details view
 * @param {Array} props The property items array 
 * @param {Object} propItemsSchema Schema for property items
 * @param {string} objectName The name of the object for display and messaging
 * @param {Array} allObjects Array of all available objects for FK lookup
 * @returns {string} HTML script tag with JavaScript
 */
function getClientScriptTemplate(props, propItemsSchema, objectName, allObjects) {
    // Create header columns for all prop item properties and sort them alphabetically
    // Make sure 'name' is always the first column
    const propColumns = Object.keys(propItemsSchema).filter(key => key !== "name").sort();
    propColumns.unshift("name");

    return `<script>
            (function() {
                // Core data and API
                const vscode = acquireVsCodeApi();
                const props = ${JSON.stringify(props)};
                const propColumns = ${JSON.stringify(propColumns)};
                const propItemsSchema = ${JSON.stringify(propItemsSchema)};
                const objectName = "${objectName || ''}";
                const allObjects = ${JSON.stringify(allObjects || [])};

                // Helper function to get property modal HTML
                function getPropertyModalHtml() {
                    ${getPropertyModalHtml.toString().replace(/^function getPropertyModalHtml\(\) \{|\}$/g, '')}
                }

                // Helper function to get object lookup modal HTML
                function getObjectLookupModalHtml() {
                    ${getObjectLookupModalHtml.toString().replace(/^function getObjectLookupModalHtml\(\) \{|\}$/g, '')}
                }

                // Import modal functionality
                ${getPropertyModalFunctionality()}

                // Import object lookup modal functionality
                ${getObjectLookupModalFunctionality()}

                // UI Event Handlers for tabs and view switching
                ${getUIEventHandlers()}

                // Form Control Utilities
                ${getFormControlUtilities()}

                // Property Management Functions
                ${getPropertyManagementFunctions()}

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
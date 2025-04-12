"use strict";

// Import helpers and templates
const { formatLabel } = require("../helpers/objectDataHelper");
const { getDetailViewStyles } = require("../styles/detailsViewStyles");
const { getPropertyModalHtml } = require("./templates/propertyModalTemplate");
const { getPropertyModalFunctionality } = require("./templates/propertyModalFunctionality");
const { getMainTemplate } = require("./templates/mainTemplate");
const { getSettingsTabTemplate } = require("./templates/settingsTabTemplate");
const { getPropertiesTableTemplate } = require("./templates/propertiesTableTemplate");
const { getPropertiesListTemplate } = require("./templates/propertiesListTemplate");
const { getClientScriptTemplate } = require("./templates/clientScriptTemplate");

/**
 * Generates the HTML content for the object details webview
 * @param {Object} object The object data to display
 * @param {Object} objectSchemaProps Schema properties for the object
 * @param {Object} propItemsSchema Schema properties for property items
 * @returns {string} HTML content
 */
function generateDetailsView(object, objectSchemaProps, propItemsSchema) {
    const props = object.prop || [];
    
    // Remove complex properties from settings
    const objectForSettings = { ...object };
    delete objectForSettings.prop;
    delete objectForSettings.report;
    delete objectForSettings.objectWorkflow;

    // Generate the settings tab content using the template
    const settingsHtml = getSettingsTabTemplate(objectForSettings, objectSchemaProps);
    
    // Generate the properties tab content using templates
    const { tableHeaders, tableRows, propColumns } = getPropertiesTableTemplate(props, propItemsSchema);
    const listViewFields = getPropertiesListTemplate(propItemsSchema);
    
    // Generate client-side JavaScript
    const clientScript = getClientScriptTemplate(props, propItemsSchema, object.name);
    
    // Combine all parts into the main template
    return getMainTemplate(object, props.length, settingsHtml, tableHeaders, tableRows, listViewFields, clientScript);
}

module.exports = {
    generateDetailsView
};
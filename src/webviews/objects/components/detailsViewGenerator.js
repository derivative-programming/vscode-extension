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
const { getLookupItemsTemplate } = require("./templates/lookupItemsTemplate");

/**
 * Generates the HTML content for the object details webview
 * @param {Object} object The object data to display
 * @param {Object} objectSchemaProps Schema properties for the object
 * @param {Object} propItemsSchema Schema properties for property items
 * @param {Array} allObjects Array of all available objects for FK lookup
 * @returns {string} HTML content
 */
function generateDetailsView(object, objectSchemaProps, propItemsSchema, allObjects) {
    const props = object.prop || [];
    const lookupItems = object.lookupItem || [];
    
    // Remove complex properties from settings
    const objectForSettings = { ...object };
    delete objectForSettings.prop;
    delete objectForSettings.report;
    delete objectForSettings.objectWorkflow;
    delete objectForSettings.lookupItem;

    // Generate the settings tab content using the template
    const settingsHtml = getSettingsTabTemplate(objectForSettings, objectSchemaProps);
    
    // Generate the properties tab content using templates
    const { tableHeaders, tableRows, propColumns } = getPropertiesTableTemplate(props, propItemsSchema);
    const listViewFields = getPropertiesListTemplate(propItemsSchema);
    
    // Generate lookup items tab content if this is a lookup object
    const { loadSchema, getObjectSchemaProperties, getPropItemsSchema, getLookupItemsSchema } = require("../helpers/schemaLoader");
    const schema = loadSchema();
    const lookupItemsSchema = getLookupItemsSchema(schema);
    const lookupItemsHtml = (object.isLookup === "true") ? getLookupItemsTemplate(lookupItems, lookupItemsSchema) : null;
    
    // Generate client-side JavaScript
    const clientScript = getClientScriptTemplate(props, propItemsSchema, object.name, allObjects, object, lookupItemsSchema);
    
    // Combine all parts into the main template
    return getMainTemplate(object, props.length, settingsHtml, tableHeaders, tableRows, listViewFields, clientScript, lookupItemsHtml, lookupItems.length);
}

module.exports = {
    generateDetailsView
};
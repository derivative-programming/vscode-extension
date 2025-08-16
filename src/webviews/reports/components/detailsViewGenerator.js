"use strict";

// Import helpers and templates
// const { formatLabel } = require("../helpers/reportDataHelper");
// const { getDetailViewStyles } = require("../styles/detailsViewStyles");
const { getColumnModalHtml } = require("./templates/columnModalTemplate");
const { getButtonModalHtml } = require("./templates/buttonModalTemplate");
const { getParamModalHtml } = require("./templates/paramModalTemplate");
const { getMainTemplate } = require("./templates/mainTemplate");
const { getSettingsTabTemplate } = require("./templates/settingsTabTemplate");
const { getColumnsListTemplate } = require("./templates/columnsListTemplate");
const { getButtonsListTemplate } = require("./templates/buttonsListTemplate");
const { getParamsListTemplate } = require("./templates/paramsListTemplate");
const { getClientScriptTemplate } = require("./templates/clientScriptTemplate");

/**
 * Generates the HTML content for the report details webview
 * @param {Object} report The report data to display
 * @param {Object} reportSchemaProps Schema properties for the report
 * @param {Object} reportColumnsSchema Schema properties for report columns
 * @param {Object} reportButtonsSchema Schema properties for report buttons
 * @param {Object} reportParamsSchema Schema properties for report params
 * @param {string} codiconsUri URI for the codicon CSS file
 * @param {Array} allForms Array of all available forms for page search modal
 * @param {Array} allReports Array of all available reports for page search modal
 * @param {Array} allDataObjects Array of all available data objects for object search (optional)
 * @param {Object} ownerObject The owner data object for this report (optional)
 * @returns {string} HTML content
 */
function generateDetailsView(report, reportSchemaProps, reportColumnsSchema, reportButtonsSchema, reportParamsSchema, codiconsUri, allForms = [], allReports = [], allDataObjects = [], ownerObject = null) {
    const columns = report.reportColumn || [];
    const buttons = report.reportButton || [];
    const params = report.reportParam || [];
    
    // Remove complex properties from settings
    const reportForSettings = { ...report };
    delete reportForSettings.reportColumn;
    delete reportForSettings.reportButton;
    delete reportForSettings.reportParam;

    // Generate the settings tab content using the template
    const settingsHtml = getSettingsTabTemplate(reportForSettings, reportSchemaProps);
    
    // Generate the columns list view content
    const columnListViewFields = getColumnsListTemplate(reportColumnsSchema);
    
    // Generate the buttons list view content
    const buttonListViewFields = getButtonsListTemplate(reportButtonsSchema);
    
    // Generate the params list view content
    const paramListViewFields = getParamsListTemplate(reportParamsSchema);
    
    // Generate column modal HTML
    const columnModalHtml = getColumnModalHtml(reportColumnsSchema);
    
    // Generate button modal HTML
    const buttonModalHtml = getButtonModalHtml(reportButtonsSchema);
    
    // Generate param modal HTML
    const paramModalHtml = getParamModalHtml(reportParamsSchema);
    
    // Generate client-side JavaScript (modal functionality is already included in the modular client script)
    const clientScript = getClientScriptTemplate(
        columns, buttons, params, 
        reportColumnsSchema, reportButtonsSchema, reportParamsSchema, 
        report.name,
        allForms,
        allReports,
        allDataObjects
    );
    
    // Combine all parts into the main template
    return getMainTemplate(
        report, 
        columns.length, buttons.length, params.length,
        settingsHtml, 
        columnListViewFields,
        buttonListViewFields,
        paramListViewFields,
        columnModalHtml, buttonModalHtml, paramModalHtml,
        clientScript,
        codiconsUri,
        ownerObject
    );
}

module.exports = {
    generateDetailsView
};

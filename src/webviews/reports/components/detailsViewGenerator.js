"use strict";

// Import helpers and templates
const { formatLabel } = require("../helpers/reportDataHelper");
const { getDetailViewStyles } = require("../styles/detailsViewStyles");
const { getColumnModalHtml } = require("./templates/columnModalTemplate");
const { getButtonModalHtml } = require("./templates/buttonModalTemplate");
const { getParamModalHtml } = require("./templates/paramModalTemplate");
const { getMainTemplate } = require("./templates/mainTemplate");
const { getSettingsTabTemplate } = require("./templates/settingsTabTemplate");
const { getColumnsTableTemplate } = require("./templates/columnsTableTemplate");
const { getColumnsListTemplate } = require("./templates/columnsListTemplate");
const { getButtonsTableTemplate } = require("./templates/buttonsTableTemplate");
const { getButtonsListTemplate } = require("./templates/buttonsListTemplate");
const { getParamsTableTemplate } = require("./templates/paramsTableTemplate");
const { getParamsListTemplate } = require("./templates/paramsListTemplate");
const { getClientScriptTemplate } = require("./templates/clientScriptTemplate");

/**
 * Generates the HTML content for the report details webview
 * @param {Object} report The report data to display
 * @param {Object} reportSchemaProps Schema properties for the report
 * @param {Object} reportColumnsSchema Schema properties for report columns
 * @param {Object} reportButtonsSchema Schema properties for report buttons
 * @param {Object} reportParamsSchema Schema properties for report params
 * @returns {string} HTML content
 */
function generateDetailsView(report, reportSchemaProps, reportColumnsSchema, reportButtonsSchema, reportParamsSchema) {
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
    
    // Generate the columns tab content using templates
    const { columnTableHeaders, columnTableRows } = getColumnsTableTemplate(columns, reportColumnsSchema);
    
    // Generate the columns list view content
    const columnListViewFields = getColumnsListTemplate(reportColumnsSchema);
    
    // Generate the buttons tab content using templates
    const { buttonTableHeaders, buttonTableRows } = getButtonsTableTemplate(buttons, reportButtonsSchema);
    
    // Generate the buttons list view content
    const buttonListViewFields = getButtonsListTemplate(reportButtonsSchema);
    
    // Generate the params tab content using templates
    const { paramTableHeaders, paramTableRows } = getParamsTableTemplate(params, reportParamsSchema);
    
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
        report.name
    );
    
    // Combine all parts into the main template
    return getMainTemplate(
        report, 
        columns.length, buttons.length, params.length,
        settingsHtml, 
        columnTableHeaders, columnTableRows, columnListViewFields,
        buttonTableHeaders, buttonTableRows, buttonListViewFields,
        paramTableHeaders, paramTableRows, paramListViewFields,
        columnModalHtml, buttonModalHtml, paramModalHtml,
        clientScript
    );
}

module.exports = {
    generateDetailsView
};

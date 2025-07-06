"use strict";

// Import helpers and templates
const { formatLabel } = require("../helpers/formDataHelper");
const { getSettingsTabTemplate } = require("./templates/settingsTabTemplate");
const { getParamsTableTemplate, getParamsListTemplate } = require("./templates/paramsTableTemplate");
const { getButtonsTableTemplate, getButtonsListTemplate } = require("./templates/buttonsTableTemplate");
const { getOutputVarsTableTemplate, getOutputVarsListTemplate } = require("./templates/outputVarsTableTemplate");
const { getParamModalHtml, getButtonModalHtml, getOutputVarModalHtml } = require("./templates/modalTemplates");
const { getClientScriptTemplate } = require("./templates/clientScriptTemplate");
const { getMainTemplate } = require("./templates/mainTemplate");

/**
 * Generates the HTML content for the form details webview
 * @param {Object} form The form data to display
 * @param {Object} formSchemaProps Schema properties for the form
 * @param {Object} formParamsSchema Schema properties for form parameters (objectWorkflowParam)
 * @param {Object} formButtonsSchema Schema properties for form buttons (objectWorkflowButton)
 * @param {Object} formOutputVarsSchema Schema properties for form output variables (objectWorkflowOutputVar)
 * @returns {string} HTML content
 */
function generateDetailsView(form, formSchemaProps, formParamsSchema, formButtonsSchema, formOutputVarsSchema) {
    const params = form.objectWorkflowParam || [];
    const buttons = form.objectWorkflowButton || [];
    const outputVars = form.objectWorkflowOutputVar || [];
    
    // Remove complex properties from settings
    const formForSettings = { ...form };
    delete formForSettings.objectWorkflowParam;
    delete formForSettings.objectWorkflowButton;
    delete formForSettings.objectWorkflowOutputVar;

    // Generate the settings tab content using the template
    const settingsHtml = getSettingsTabTemplate(formForSettings, formSchemaProps);
    
    // Generate the params tab content using templates
    const { paramTableHeaders, paramTableRows } = getParamsTableTemplate(params, formParamsSchema);
    
    // Generate the params list view content
    const paramListViewFields = getParamsListTemplate(formParamsSchema);
    
    // Generate the buttons tab content using templates
    const { buttonTableHeaders, buttonTableRows } = getButtonsTableTemplate(buttons, formButtonsSchema);
    
    // Generate the buttons list view content
    const buttonListViewFields = getButtonsListTemplate(formButtonsSchema);
    
    // Generate the output variables tab content using templates
    const { outputVarTableHeaders, outputVarTableRows } = getOutputVarsTableTemplate(outputVars, formOutputVarsSchema);
    
    // Generate the output variables list view content
    const outputVarListViewFields = getOutputVarsListTemplate(formOutputVarsSchema);
    
    // Generate modal HTML content
    const paramModalHtml = getParamModalHtml(formParamsSchema);
    const buttonModalHtml = getButtonModalHtml(formButtonsSchema);
    const outputVarModalHtml = getOutputVarModalHtml(formOutputVarsSchema);
    
    // Generate client-side JavaScript
    const clientScript = getClientScriptTemplate(
        params, 
        buttons, 
        outputVars, 
        formParamsSchema, 
        formButtonsSchema, 
        formOutputVarsSchema, 
        form.name
    );
    
    // Generate the complete HTML document
    return getMainTemplate(
        form,
        params.length,
        buttons.length,
        outputVars.length,
        settingsHtml,
        paramTableHeaders,
        paramTableRows,
        paramListViewFields,
        buttonTableHeaders,
        buttonTableRows,
        buttonListViewFields,
        outputVarTableHeaders,
        outputVarTableRows,
        outputVarListViewFields,
        paramModalHtml,
        buttonModalHtml,
        outputVarModalHtml,
        clientScript
    );
}

module.exports = {
    generateDetailsView
};

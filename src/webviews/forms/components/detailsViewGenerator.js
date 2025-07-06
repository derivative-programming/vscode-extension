"use strict";

// Import helpers and templates
const { formatLabel } = require("../helpers/formDataHelper");
const { getDetailViewStyles } = require("../styles/detailsViewStyles");
const { getSettingsTabTemplate } = require("./templates/settingsTabTemplate");
const { getParamsTableTemplate, getParamsListTemplate, getParamPropertiesToHide } = require("./templates/paramsTableTemplate");
const { getButtonsTableTemplate } = require("./templates/buttonsTableTemplate");
const { getButtonsListTemplate } = require("./templates/buttonsListTemplate");
const { getOutputVarsTableTemplate, getOutputVarsListTemplate } = require("./templates/outputVarsTableTemplate");
const { getParamModalHtml, getButtonModalHtml, getOutputVarModalHtml } = require("./templates/modalTemplates");
const { getClientScriptTemplate } = require("./templates/clientScriptTemplate");
const { getMainTemplate } = require("./templates/mainTemplate");

// Import modular scripts
const { getModalFunctionality } = require("./scripts/modalFunctionality");
const { getUIEventHandlers } = require("./scripts/uiEventHandlers");
const { getFormControlUtilities } = require("./scripts/formControlUtilities");
const { getButtonManagementFunctions } = require("./scripts/buttonManagementFunctions");
const { getParameterManagementFunctions } = require("./scripts/parameterManagementFunctions");
const { getOutputVariableManagementFunctions } = require("./scripts/outputVariableManagementFunctions");
const { getDOMInitialization } = require("./scripts/domInitialization");

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
    console.log("[DEBUG] generateDetailsView called with:", {
        form: form,
        formSchemaPropsKeys: formSchemaProps ? Object.keys(formSchemaProps) : [],
        formParamsSchemaKeys: formParamsSchema ? Object.keys(formParamsSchema) : [],
        formButtonsSchemaKeys: formButtonsSchema ? Object.keys(formButtonsSchema) : [],
        formOutputVarsSchemaKeys: formOutputVarsSchema ? Object.keys(formOutputVarsSchema) : []
    });
    
    try {
        const params = form.objectWorkflowParam || [];
        const buttons = form.objectWorkflowButton || [];
        const outputVars = form.objectWorkflowOutputVar || [];
        
        console.log("[DEBUG] Extracted arrays:", {
            paramsCount: params.length,
            buttonsCount: buttons.length,
            outputVarsCount: outputVars.length,
            outputVars: outputVars
        });
        
        // Remove complex properties from settings
        const formForSettings = { ...form };
        delete formForSettings.objectWorkflowParam;
        delete formForSettings.objectWorkflowButton;
        delete formForSettings.objectWorkflowOutputVar;

        // Generate the settings tab content using the template
        console.log("[DEBUG] Generating settings tab...");
        const settingsHtml = getSettingsTabTemplate(formForSettings, formSchemaProps);
        
        // Get properties to hide for parameters
        const paramPropertiesToHide = getParamPropertiesToHide();
        
        // Generate the params tab content using templates
        console.log("[DEBUG] Generating params tab...");
        const { paramTableHeaders, paramTableRows } = getParamsTableTemplate(params, formParamsSchema);
        
        // Generate the params list view content
        const paramListViewFields = getParamsListTemplate(formParamsSchema);
        
        // Generate the buttons tab content using templates
        console.log("[DEBUG] Generating buttons tab...");
        const { buttonTableHeaders, buttonTableRows } = getButtonsTableTemplate(buttons, formButtonsSchema);
        
        // Generate the buttons list view content
        const buttonListViewFields = getButtonsListTemplate(formButtonsSchema);
        
        // Generate the output variables tab content using templates
        console.log("[DEBUG] Generating output variables tab...");
        const { outputVarTableHeaders, outputVarTableRows } = getOutputVarsTableTemplate(outputVars, formOutputVarsSchema);
        
        // Generate the output variables list view content
        console.log("[DEBUG] Generating output variables list view...");
        const outputVarListViewFields = getOutputVarsListTemplate(formOutputVarsSchema);
        
        // Generate modal HTML content
        console.log("[DEBUG] Generating modals...");
        const paramModalHtml = getParamModalHtml(formParamsSchema);
        const buttonModalHtml = getButtonModalHtml(formButtonsSchema);
        const outputVarModalHtml = getOutputVarModalHtml(formOutputVarsSchema);
        
        // Get additional data for dynamic rendering
        const styles = getDetailViewStyles();
        const paramProperties = Object.keys(formParamsSchema)
            .filter(key => !paramPropertiesToHide.includes(key.toLowerCase()));
        
        // Generate client-side JavaScript with modular scripts
        console.log("[DEBUG] Generating client script...");
        console.log("[DEBUG] Form object:", form);
        console.log("[DEBUG] Form name:", form ? form.name : 'form is null/undefined');
        const formName = (form && form.name) ? form.name : 'Unknown Form';
        console.log("[DEBUG] Using formName:", formName);
        
        // Get the main client script template
        const clientScript = getClientScriptTemplate(
            params, 
            buttons, 
            outputVars,
            formParamsSchema,
            formButtonsSchema,
            formOutputVarsSchema,
            formName
        );
        
        // Generate the complete HTML document
        console.log("[DEBUG] Generating main template...");
        const result = getMainTemplate(
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
        
        console.log("[DEBUG] generateDetailsView completed successfully");
        return result;
        
    } catch (error) {
        console.error("[ERROR] generateDetailsView failed:", error);
        console.error("[ERROR] Stack trace:", error.stack);
        throw error;
    }
}

module.exports = {
    generateDetailsView
};

"use strict";

// Import helpers and templates (copied/adapted from forms, excluding buttons)
const { getDetailViewStyles } = require("../styles/detailsViewStyles");
const { getSettingsTabTemplate } = require("./templates/settingsTabTemplate");
const { getParamsListTemplate } = require("./templates/paramsListTemplate");
const { getOutputVarsListTemplate } = require("./templates/outputVarsTableTemplate");
const { getClientScriptTemplate } = require("./templates/clientScriptTemplate");
const { getMainTemplate } = require("./templates/mainTemplate");

/**
 * Generates the HTML content for the general flow details webview
 */
function generateDetailsView(flow, flowSchemaProps, flowParamsSchema, flowOutputVarsSchema, codiconsUri, allDataObjects = [], ownerObject = null) {
    try {
        const params = flow.objectWorkflowParam || [];
        const outputVars = flow.objectWorkflowOutputVar || [];

        // Remove complex properties from settings
        const flowForSettings = { ...flow };
        delete flowForSettings.objectWorkflowParam;
        delete flowForSettings.objectWorkflowOutputVar;

        const settingsHtml = getSettingsTabTemplate(flowForSettings, flowSchemaProps);
        const paramListViewFields = getParamsListTemplate(flowParamsSchema);
        const outputVarListViewFields = getOutputVarsListTemplate(flowOutputVarsSchema);
    // Modals are created dynamically via client script; no static modal HTML injection

        const flowName = (flow && (flow.titleText || flow.name)) ? (flow.titleText || flow.name) : 'Unknown Flow';

        const clientScript = getClientScriptTemplate(
            params,
            outputVars,
            flowParamsSchema,
            flowOutputVarsSchema,
            flowName,
            allDataObjects
        );

    const result = getMainTemplate(
            flow,
            params.length,
            outputVars.length,
            settingsHtml,
            paramListViewFields,
            outputVarListViewFields,
            clientScript,
            codiconsUri,
            ownerObject
        );

        return result;
    } catch (error) {
        console.error("[ERROR] generateDetailsView (generalFlow) failed:", error);
        throw error;
    }
}

module.exports = { generateDetailsView };

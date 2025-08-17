"use strict";

const { getDetailViewStyles } = require("../styles/detailsViewStyles");
const { getSettingsTabTemplate } = require("./templates/settingsTabTemplate");
const { getOutputVarsListTemplate } = require("./templates/outputVarsTableTemplate");
const { getOutputVarModalHtml } = require("./templates/modalTemplates");
const { getClientScriptTemplate } = require("./templates/clientScriptTemplate");
const { getMainTemplate } = require("./templates/mainTemplate");

function generateDetailsView(flow, flowSchemaProps, flowOutputVarsSchema, codiconsUri, allDataObjects = [], ownerObject = null) {
    try {
        const outputVars = flow.objectWorkflowOutputVar || [];
        const flowForSettings = { ...flow };
        delete flowForSettings.objectWorkflowOutputVar;

        const settingsHtml = getSettingsTabTemplate(flowForSettings, flowSchemaProps);
        const outputVarListViewFields = getOutputVarsListTemplate(flowOutputVarsSchema);
        const outputVarModalHtml = getOutputVarModalHtml(flowOutputVarsSchema);
        const styles = getDetailViewStyles();
        const flowName = (flow && flow.name) ? flow.name : 'Unknown Flow';

        const clientScript = getClientScriptTemplate(
            outputVars,
            flowOutputVarsSchema,
            flowName,
            allDataObjects
        );

        const result = getMainTemplate(
            flow,
            outputVars.length,
            settingsHtml,
            outputVarListViewFields,
            outputVarModalHtml,
            clientScript,
            codiconsUri,
            ownerObject
        );
        return result;
    } catch (error) {
        console.error("[ERROR] generateDetailsView (pageinits) failed:", error);
        throw error;
    }
}

module.exports = { generateDetailsView };

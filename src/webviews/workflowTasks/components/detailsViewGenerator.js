"use strict";

const { getDetailViewStyles } = require("../styles/detailsViewStyles");
const { getSettingsTabTemplate } = require("./templates/settingsTabTemplate");
const { getMainTemplate } = require("./templates/mainTemplate");

// Generates HTML content for the workflow task details webview (settings-only)
function generateDetailsView(flow, flowSchemaProps, codiconsUri, allDataObjects = [], ownerObject = null) {
    try {
        // Remove arrays from settings view if present
        const flowForSettings = { ...flow };
        if (flowForSettings.objectWorkflowParam) { delete flowForSettings.objectWorkflowParam; }
        if (flowForSettings.objectWorkflowOutputVar) { delete flowForSettings.objectWorkflowOutputVar; }

        const settingsHtml = getSettingsTabTemplate(flowForSettings, flowSchemaProps);
        const result = getMainTemplate(
            flow,
            settingsHtml,
            codiconsUri,
            ownerObject
        );
        return result;
    } catch (error) {
        console.error("[ERROR] generateDetailsView (workflowTasks) failed:", error);
        throw error;
    }
}

module.exports = { generateDetailsView };

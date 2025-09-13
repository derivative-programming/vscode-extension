"use strict";

const { getDetailViewStyles } = require("../styles/detailsViewStyles");
const { getSettingsTabTemplate } = require("./templates/settingsTabTemplate");
const { getWorkflowTasksListTemplate } = require("./templates/workflowTasksTableTemplate");
const { getWorkflowTaskModalHtml } = require("./templates/modalTemplates");
const { getClientScriptTemplate } = require("./templates/clientScriptTemplate");
const { getMainTemplate } = require("./templates/mainTemplate");

// Generates HTML content for the workflow (DynaFlow) details webview
function generateDetailsView(flow, flowSchemaProps, flowDynaFlowTaskSchema, codiconsUri, allDataObjects = [], ownerObject = null) {
    try {
        const workflowTasks = flow.dynaFlowTask || [];
        const flowForSettings = { ...flow };
        // Remove arrays from settings view
        if (flowForSettings.objectWorkflowParam) { delete flowForSettings.objectWorkflowParam; }
        if (flowForSettings.objectWorkflowOutputVar) { delete flowForSettings.objectWorkflowOutputVar; }
        if (flowForSettings.dynaFlowTask) { delete flowForSettings.dynaFlowTask; }

        const settingsHtml = getSettingsTabTemplate(flowForSettings, flowSchemaProps);
        const workflowTaskListViewFields = getWorkflowTasksListTemplate(flowDynaFlowTaskSchema);
        const workflowTaskModalHtml = getWorkflowTaskModalHtml(flowDynaFlowTaskSchema);
        const styles = getDetailViewStyles();
        const flowName = (flow && flow.name) || 'Unknown Flow';

        const clientScript = getClientScriptTemplate(
            workflowTasks,
            flowDynaFlowTaskSchema,
            flowName,
            allDataObjects,
            flow
        );

        const result = getMainTemplate(
            flow,
            workflowTasks.length,
            settingsHtml,
            workflowTaskListViewFields,
            workflowTaskModalHtml,
            clientScript,
            codiconsUri,
            ownerObject
        );
        return result;
    } catch (error) {
        console.error("[ERROR] generateDetailsView (workflows) failed:", error);
        throw error;
    }
}

module.exports = { generateDetailsView };

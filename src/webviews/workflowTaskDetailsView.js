/**
 * workflowTaskDetailsView.js
 * Workflow Task Details View webview wrapper for AppDNA extension
 * Created: 2025-08-24
 * 
 * This wrapper delegates to the workflowTasks subfolder implementation,
 * following the same pattern as other details views.
 */

"use strict";

// Import the workflow task details view from the workflowTasks subfolder
const { showWorkflowTaskDetails, refreshAll, getOpenPanelItems, closeAllPanels } = require("./workflowTasks/workflowTaskDetailsView");

function showWorkflowTaskDetailsWrapper(item, modelService, context) {
    return showWorkflowTaskDetails(item, modelService, context);
}

function refreshAllWrapper() { return refreshAll(); }
function getOpenPanelItemsWrapper() { return getOpenPanelItems(); }
function closeAllPanelsWrapper() { return closeAllPanels(); }

module.exports = {
    showWorkflowTaskDetails: showWorkflowTaskDetailsWrapper,
    refreshAll: refreshAllWrapper,
    getOpenPanelItems: getOpenPanelItemsWrapper,
    closeAllPanels: closeAllPanelsWrapper
};

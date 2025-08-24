/**
 * workflowDetailsView.js
 * Workflow (DynaFlow) Details View webview wrapper for AppDNA extension
 * Created: 2025-08-24
 * 
 * This wrapper delegates to the workflows subfolder implementation,
 * following the same pattern as other details views.
 */

"use strict";

// Import the workflow details view from the workflows subfolder
const { showWorkflowDetails, refreshAll, getOpenPanelItems, closeAllPanels } = require("./workflows/workflowDetailsView");

function showWorkflowDetailsWrapper(item, modelService, context) {
    return showWorkflowDetails(item, modelService, context);
}

function refreshAllWrapper() { return refreshAll(); }
function getOpenPanelItemsWrapper() { return getOpenPanelItems(); }
function closeAllPanelsWrapper() { return closeAllPanels(); }

module.exports = {
    showWorkflowDetails: showWorkflowDetailsWrapper,
    refreshAll: refreshAllWrapper,
    getOpenPanelItems: getOpenPanelItemsWrapper,
    closeAllPanels: closeAllPanelsWrapper
};

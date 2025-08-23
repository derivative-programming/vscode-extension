/**
 * generalFlowDetailsView.js
 * General Flow Details View webview wrapper for AppDNA extension
 * Created: 2025-08-23
 * 
 * This wrapper delegates to the generalFlow subfolder implementation,
 * following the same pattern as form/report/page init details views.
 */

"use strict";

// Import the general flow details view from the generalFlow subfolder
const { showGeneralFlowDetails, refreshAll, getOpenPanelItems, closeAllPanels } = require("./generalFlow/generalFlowDetailsView");

/**
 * Shows general flow details in a webview
 * @param {Object} item The tree/list item representing the workflow (expects label, optional ownerObject)
 * @param {Object} modelService ModelService instance
 * @param {vscode.ExtensionContext} context Extension context (optional)
 */
function showGeneralFlowDetailsWrapper(item, modelService, context) {
    return showGeneralFlowDetails(item, modelService, context);
}

function refreshAllWrapper() { return refreshAll(); }
function getOpenPanelItemsWrapper() { return getOpenPanelItems(); }
function closeAllPanelsWrapper() { return closeAllPanels(); }

module.exports = {
    showGeneralFlowDetails: showGeneralFlowDetailsWrapper,
    refreshAll: refreshAllWrapper,
    getOpenPanelItems: getOpenPanelItemsWrapper,
    closeAllPanels: closeAllPanelsWrapper
};

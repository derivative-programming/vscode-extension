/**
 * pageInitDetailsView.js
 * Page Init Flow Details View webview wrapper for AppDNA extension
 * Created: 2025-08-17
 * 
 * This wrapper delegates to the pageinits subfolder implementation,
 * following the same pattern as form/report details views.
 */

"use strict";

// Import the page init details view from the pageinits subfolder
const { showPageInitDetails, refreshAll, getOpenPanelItems, closeAllPanels } = require("./pageinits/pageInitDetailsView");

/**
 * Shows page init flow details in a webview
 * @param {Object} item The tree/list item representing the workflow (expects label, optional ownerObject)
 * @param {Object} modelService ModelService instance
 * @param {vscode.ExtensionContext} context Extension context (optional)
 */
function showPageInitDetailsWrapper(item, modelService, context) {
    return showPageInitDetails(item, modelService, context);
}

function refreshAllWrapper() { return refreshAll(); }
function getOpenPanelItemsWrapper() { return getOpenPanelItems(); }
function closeAllPanelsWrapper() { return closeAllPanels(); }

module.exports = {
    showPageInitDetails: showPageInitDetailsWrapper,
    refreshAll: refreshAllWrapper,
    getOpenPanelItems: getOpenPanelItemsWrapper,
    closeAllPanels: closeAllPanelsWrapper
};

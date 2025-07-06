/**
 * formDetailsView.js
 * Form Details View webview implementation for AppDNA extension
 * Created: 2025-01-13
 * 
 * This is a wrapper that delegates to the forms subfolder implementation,
 * following the same pattern as reportDetailsView.js
 */

"use strict";

// Import the form details view from the forms subfolder
const { showFormDetails, refreshAll, getOpenPanelItems, closeAllPanels } = require("./forms/formDetailsView");

/**
 * Shows form details in a webview
 * @param {Object} item The tree item representing the form
 * @param {Object} modelService ModelService instance
 */
function showFormDetailsWrapper(item, modelService) {
    return showFormDetails(item, modelService);
}

/**
 * Refreshes all open form details webviews with the latest model data
 */
function refreshAllWrapper() {
    return refreshAll();
}

/**
 * Gets an array of items from all open panels
 * @returns {Array} Array of items from open panels
 */
function getOpenPanelItemsWrapper() {
    return getOpenPanelItems();
}

/**
 * Closes all currently open form details panels
 */
function closeAllPanelsWrapper() {
    return closeAllPanels();
}

// Export the wrapper functions
module.exports = {
    showFormDetails: showFormDetailsWrapper,
    refreshAll: refreshAllWrapper,
    getOpenPanelItems: getOpenPanelItemsWrapper,
    closeAllPanels: closeAllPanelsWrapper
};

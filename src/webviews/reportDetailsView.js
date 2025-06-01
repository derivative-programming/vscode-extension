"use strict";

// Import the report details view from the reports subfolder
const { showReportDetails, refreshAll, getOpenPanelItems, closeAllPanels } = require("./reports/reportDetailsView");

/**
 * Shows report details in a webview
 * @param {Object} item The tree item representing the report
 * @param {Object} modelService ModelService instance
 */
function showReportDetailsWrapper(item, modelService) {
    return showReportDetails(item, modelService);
}

/**
 * Refreshes all open report details webviews with the latest model data
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
 * Closes all currently open report details panels
 */
function closeAllPanelsWrapper() {
    return closeAllPanels();
}

// Export the wrapper functions
module.exports = {
    showReportDetails: showReportDetailsWrapper,
    refreshAll: refreshAllWrapper,
    getOpenPanelItems: getOpenPanelItemsWrapper,
    closeAllPanels: closeAllPanelsWrapper
};

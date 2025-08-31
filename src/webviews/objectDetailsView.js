"use strict";

// Import the object details view from the objects subfolder
const { showObjectDetails, refreshAll, getOpenPanelItems, closeAllPanels } = require("./objects/objectDetailsView");

/**
 * Shows object details in a webview
 * @param {Object} item The tree item representing the object
 * @param {Object} modelService ModelService instance
 * @param {string} initialTab Optional initial tab to show
 */
function showObjectDetailsWrapper(item, modelService, initialTab) {
    console.log(`Wrapper called for ${item.label} with initialTab: ${initialTab}`);
    // Pass parameters to the implementation
    showObjectDetails(item, modelService, initialTab);
}

// Export the functions to maintain compatibility with existing code
module.exports = {
    showObjectDetails: showObjectDetailsWrapper,
    refreshAll,
    getOpenPanelItems,
    closeAllPanels
};
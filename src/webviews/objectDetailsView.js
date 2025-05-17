"use strict";

// Import the object details view from the objects subfolder
const { showObjectDetails, refreshAll, getOpenPanelItems, closeAllPanels } = require("./objects/objectDetailsView");

/**
 * Shows object details in a webview
 * @param {Object} item The tree item representing the object
 * @param {Object} modelService ModelService instance
 */
function showObjectDetailsWrapper(item, modelService) {
    console.log(`Wrapper called for ${item.label}`);
    // Pass parameters to the implementation
    showObjectDetails(item, modelService);
}

// Export the functions to maintain compatibility with existing code
module.exports = {
    showObjectDetails: showObjectDetailsWrapper,
    refreshAll,
    getOpenPanelItems,
    closeAllPanels
};
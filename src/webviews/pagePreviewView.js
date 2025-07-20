/**
 * pagePreviewView.js
 * Page Preview View wrapper for AppDNA extension
 * Created: July 20, 2025
 * 
 * This is a wrapper that delegates to the pagepreview subfolder implementation,
 * following the same pattern as other view wrappers in the extension
 */

"use strict";

// Import the page preview view from the pagepreview subfolder
const { showPagePreview, getPagePreviewPanel, closePagePreviewView } = require("./pagepreview/pagePreviewView");

/**
 * Shows page preview in a webview
 * @param {vscode.ExtensionContext} context Extension context
 * @param {Object} modelService ModelService instance
 */
function showPagePreviewWrapper(context, modelService) {
    return showPagePreview(context, modelService);
}

/**
 * Gets the current page preview panel information
 * @returns {Object} Object containing panel and context information
 */
function getPagePreviewPanelWrapper() {
    return getPagePreviewPanel();
}

/**
 * Closes the page preview view
 */
function closePagePreviewViewWrapper() {
    return closePagePreviewView();
}

// Export the wrapper functions
module.exports = {
    showPagePreview: showPagePreviewWrapper,
    getPagePreviewPanel: getPagePreviewPanelWrapper,
    closePagePreviewView: closePagePreviewViewWrapper
};

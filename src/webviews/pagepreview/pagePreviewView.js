// pagePreviewView.js
// Page Preview View webview for AppDNA extension
// Shows a preview representation of selected forms and reports with role filtering
// Created: July 20, 2025

"use strict";

const vscode = require('vscode');
const path = require('path');
const { generateHTMLContent } = require('./components/htmlGenerator');

let currentPanel = undefined;
let currentContext = undefined;

/**
 * Shows the page preview view in a webview
 * @param {vscode.ExtensionContext} context Extension context
 * @param {Object} modelService ModelService instance
 */
async function showPagePreview(context, modelService) {
    // Store context for later use
    currentContext = context;
    
    // Get current model data - work directly with objects
    const allObjects = modelService.getAllObjects();
    console.log('[DEBUG] PagePreview - ModelService.getAllObjects() returned:', allObjects);
    console.log('[DEBUG] PagePreview - All objects count:', allObjects ? allObjects.length : 0);
    
    // Create or show the webview panel
    const columnToShowIn = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;
        
    // If we already have a panel, show it
    if (currentPanel) {
        currentPanel.reveal(columnToShowIn);
        return;
    }
    
    // Create a new panel
    currentPanel = vscode.window.createWebviewPanel(
        'pagePreview',
        'Page Preview',
        columnToShowIn || vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(context.extensionPath, 'media'))
            ]
        }
    );
    
    // Handle messages from the webview
    currentPanel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'refresh':
                    console.log('[DEBUG] PagePreview - Refresh requested');
                    // Refresh the page preview data
                    refreshPagePreviewData(modelService);
                    break;
                case 'showFormDetails':
                    console.log('[DEBUG] PagePreview - Show form details requested:', message.formName);
                    // Navigate to form details view
                    showFormDetailsForPreview(message.formName, message.objectName, modelService);
                    break;
                case 'showReportDetails':
                    console.log('[DEBUG] PagePreview - Show report details requested:', message.reportName);
                    // Navigate to report details view (future implementation)
                    vscode.window.showInformationMessage(`Report details view for ${message.reportName} not yet implemented.`);
                    break;
            }
        },
        undefined,
        context.subscriptions
    );
    
    // Clean up when the panel is closed
    currentPanel.onDidDispose(
        () => {
            currentPanel = undefined;
        },
        null,
        context.subscriptions
    );
    
    // Generate and set the webview content - pass allObjects directly
    const htmlContent = generateHTMLContent(allObjects);
    currentPanel.webview.html = htmlContent;
}

/**
 * Refreshes the page preview data with fresh model information
 * @param {Object} modelService ModelService instance
 */
function refreshPagePreviewData(modelService) {
    if (!currentPanel) {
        return;
    }
    
    // Get fresh data from model service
    const allObjects = modelService.getAllObjects();
    
    // Send updated data to webview
    currentPanel.webview.postMessage({
        command: 'updatePageData',
        data: {
            allObjects: allObjects
        }
    });
}

/**
 * Shows form details for a form selected in the preview
 * @param {string} formName The name of the form to show details for
 * @param {string} objectName The name of the parent object
 * @param {Object} modelService ModelService instance
 */
function showFormDetailsForPreview(formName, objectName, modelService) {
    try {
        // Create a mock tree item similar to what the tree view would create
        const mockTreeItem = {
            label: formName,
            contextValue: 'form',
            tooltip: `${formName} (${objectName})`
        };
        
        // Import and call the form details view
        const { showFormDetails } = require('../formDetailsView');
        showFormDetails(mockTreeItem, modelService);
    } catch (error) {
        console.error('[ERROR] PagePreview - Error showing form details:', error);
        vscode.window.showErrorMessage(`Error opening form details: ${error.message}`);
    }
}

/**
 * Gets the current page preview panel
 * @returns {Object} Object containing panel and context information
 */
function getPagePreviewPanel() {
    return {
        panel: currentPanel,
        context: currentContext
    };
}

/**
 * Closes the page preview view
 */
function closePagePreviewView() {
    if (currentPanel) {
        currentPanel.dispose();
        currentPanel = undefined;
    }
}

module.exports = {
    showPagePreview,
    getPagePreviewPanel,
    closePagePreviewView
};

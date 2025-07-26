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
                vscode.Uri.file(path.join(context.extensionPath, 'media')),
                vscode.Uri.file(path.join(context.extensionPath, 'node_modules', '@vscode', 'codicons', 'dist'))
            ]
        }
    );
    
    // Handle messages from the webview
    currentPanel.webview.onDidReceiveMessage(
        message => {
            console.log('[DEBUG] PagePreview - Received message from webview:', message);
            
            switch (message.command) {
                case 'refresh':
                    console.log('[DEBUG] PagePreview - Refresh requested');
                    // Refresh the page preview data
                    refreshPagePreviewData(modelService);
                    break;
                case 'refreshPreview':
                    console.log('[DEBUG] PagePreview - Refresh preview requested for page:', message.pageName);
                    // Refresh the page preview data and then show preview for specific page
                    refreshPagePreviewDataAndShowPage(modelService, message.pageName);
                    break;
                case 'showFormDetails':
                    console.log('[DEBUG] PagePreview - Show form details requested:', message.formName, message.objectName);
                    // Navigate to form details view
                    showFormDetailsForPreview(message.formName, message.objectName, modelService);
                    break;
                case 'showReportDetails':
                    console.log('[DEBUG] PagePreview - Show report details requested:', message.reportName, message.objectName);
                    // Navigate to report details view
                    showReportDetailsForPreview(message.reportName, message.objectName, modelService);
                    break;
                default:
                    console.warn('[WARN] PagePreview - Unknown command received:', message.command);
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
    
    // Generate codicon URI for the webview
    const codiconsUri = currentPanel.webview.asWebviewUri(
        vscode.Uri.file(path.join(context.extensionPath, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css'))
    );
    
    // Generate and set the webview content - pass allObjects and codicon URI
    const htmlContent = generateHTMLContent(allObjects, codiconsUri);
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
 * Refreshes the page preview data and then shows preview for a specific page
 * @param {Object} modelService ModelService instance
 * @param {string} pageName The name of the page to show preview for
 */
function refreshPagePreviewDataAndShowPage(modelService, pageName) {
    if (!currentPanel) {
        return;
    }
    
    // Get fresh data from model service
    const allObjects = modelService.getAllObjects();
    
    // Send updated data to webview and request to show specific page
    currentPanel.webview.postMessage({
        command: 'updatePageDataAndShowPreview',
        data: {
            allObjects: allObjects,
            pageName: pageName
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
    console.log('[DEBUG] PagePreview - showFormDetailsForPreview called with:', formName, objectName);
    
    try {
        // Create a mock tree item similar to what the tree view would create
        const mockTreeItem = {
            label: formName,
            contextValue: 'form',
            tooltip: `${formName} (${objectName})`
        };
        
        console.log('[DEBUG] PagePreview - Created mock tree item:', mockTreeItem);
        console.log('[DEBUG] PagePreview - ModelService available:', !!modelService);
        
        // Import and call the form details view (JavaScript file)
        console.log('[DEBUG] PagePreview - About to require formDetailsView.js');
        const { showFormDetails } = require('../formDetailsView.js');
        console.log('[DEBUG] PagePreview - Successfully required formDetailsView, showFormDetails:', !!showFormDetails);
        
        console.log('[DEBUG] PagePreview - About to call showFormDetails');
        const result = showFormDetails(mockTreeItem, modelService);
        console.log('[DEBUG] PagePreview - showFormDetails returned:', result);
    } catch (error) {
        console.error('[ERROR] PagePreview - Error showing form details:', error);
        console.error('[ERROR] PagePreview - Error stack:', error.stack);
        vscode.window.showErrorMessage(`Error opening form details: ${error.message}`);
    }
}

/**
 * Shows report details for a report selected in the preview
 * @param {string} reportName The name of the report to show details for
 * @param {string} objectName The name of the parent object
 * @param {Object} modelService ModelService instance
 */
function showReportDetailsForPreview(reportName, objectName, modelService) {
    console.log('[DEBUG] PagePreview - showReportDetailsForPreview called with:', reportName, objectName);
    
    try {
        // Create a mock tree item similar to what the tree view would create
        const mockTreeItem = {
            label: reportName,
            contextValue: 'report',
            tooltip: `${reportName} (${objectName})`
        };
        
        console.log('[DEBUG] PagePreview - Created mock tree item:', mockTreeItem);
        console.log('[DEBUG] PagePreview - ModelService available:', !!modelService);
        
        // Import and call the report details view (JavaScript file)
        console.log('[DEBUG] PagePreview - About to require reportDetailsView.js');
        const { showReportDetails } = require('../reportDetailsView.js');
        console.log('[DEBUG] PagePreview - Successfully required reportDetailsView, showReportDetails:', !!showReportDetails);
        
        console.log('[DEBUG] PagePreview - About to call showReportDetails');
        const result = showReportDetails(mockTreeItem, modelService);
        console.log('[DEBUG] PagePreview - showReportDetails returned:', result);
    } catch (error) {
        console.error('[ERROR] PagePreview - Error showing report details:', error);
        console.error('[ERROR] PagePreview - Error stack:', error.stack);
        vscode.window.showErrorMessage(`Error opening report details: ${error.message}`);
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

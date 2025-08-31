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
                case 'requestPathfindingData':
                    console.log('[DEBUG] PagePreview - Pathfinding data requested from', message.fromPage, 'to', message.toPage);
                    // Get pathfinding data and send back to webview
                    handlePathfindingRequest(message.fromPage, message.toPage, modelService);
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
        // Check if context is available
        if (!currentContext) {
            console.error('[ERROR] PagePreview - currentContext is not available for form details');
            vscode.window.showErrorMessage('Extension context not available. Please ensure the page preview is properly initialized.');
            return;
        }
        
        // Create a mock tree item similar to what the tree view would create
        const mockTreeItem = {
            label: formName,
            contextValue: 'form',
            tooltip: `${formName} (${objectName})`
        };
        
        console.log('[DEBUG] PagePreview - Created mock tree item:', mockTreeItem);
        console.log('[DEBUG] PagePreview - ModelService available:', !!modelService);
        console.log('[DEBUG] PagePreview - CurrentContext available:', !!currentContext);
        
        // Import and call the form details view (JavaScript file)
        console.log('[DEBUG] PagePreview - About to require formDetailsView.js');
        const { showFormDetails } = require('../formDetailsView.js');
        console.log('[DEBUG] PagePreview - Successfully required formDetailsView, showFormDetails:', !!showFormDetails);
        
        console.log('[DEBUG] PagePreview - About to call showFormDetails');
        const result = showFormDetails(mockTreeItem, modelService, currentContext);
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
        // Check if context is available
        if (!currentContext) {
            console.error('[ERROR] PagePreview - currentContext is not available');
            vscode.window.showErrorMessage('Extension context not available. Please ensure the page preview is properly initialized.');
            return;
        }
        
        // Create a mock tree item similar to what the tree view would create
        const mockTreeItem = {
            label: reportName,
            contextValue: 'report',
            tooltip: `${reportName} (${objectName})`
        };
        
        console.log('[DEBUG] PagePreview - Created mock tree item:', mockTreeItem);
        console.log('[DEBUG] PagePreview - ModelService available:', !!modelService);
        console.log('[DEBUG] PagePreview - CurrentContext available:', !!currentContext);
        
        // Import and call the report details view (JavaScript file)
        console.log('[DEBUG] PagePreview - About to require reportDetailsView.js');
        const { showReportDetails } = require('../reports/reportDetailsView.js');
        console.log('[DEBUG] PagePreview - Successfully required reportDetailsView, showReportDetails:', !!showReportDetails);
        
        console.log('[DEBUG] PagePreview - About to call showReportDetails');
        const result = showReportDetails(mockTreeItem, modelService, currentContext);
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

/**
 * Shows the page preview view with a specific form selected
 * @param {vscode.ExtensionContext} context Extension context
 * @param {Object} modelService ModelService instance
 * @param {string} formName The name of the form to select for preview
 * @param {string} targetPage Optional target page name for "Show me the way" section (when showing journey from formName to targetPage)
 */
async function showPagePreviewWithSelection(context, modelService, formName, targetPage = null) {
    console.log('[DEBUG] PagePreview - showPagePreviewWithSelection called for form:', formName, 'with target page for journey:', targetPage);
    
    // First open the regular page preview
    await showPagePreview(context, modelService);
    
    // If we have a panel and a form name, send a message to select the form
    if (currentPanel && formName) {
        console.log('[DEBUG] PagePreview - Sending select page message for:', formName);
        
        // If we have both start page (formName) and target page, use the show me the way section
        if (targetPage) {
            // Send message to webview to set both start and target pages in "Show me the way" section
            currentPanel.webview.postMessage({
                command: 'selectPageAndShowWay',
                data: {
                    startPageName: formName,
                    targetPageName: targetPage
                }
            });
        } else {
            // Send message to webview to select the specific page in main section
            currentPanel.webview.postMessage({
                command: 'selectPageAndShowPreview',
                data: {
                    pageName: formName
                }
            });
        }
    }
}

/**
 * Extracts buttons with destination targets from a workflow
 */
function extractButtonsFromWorkflow(workflow) {
    const buttons = [];
    
    // Extract object workflow buttons with destination targets
    if (workflow.objectWorkflowButton && Array.isArray(workflow.objectWorkflowButton)) {
        workflow.objectWorkflowButton.forEach(button => {
            // Only include buttons that have destination targets and are visible and not ignored
            if (button.destinationTargetName && 
                (!button.hasOwnProperty('isVisible') || button.isVisible !== "false") && 
                (!button.hasOwnProperty('isIgnored') || button.isIgnored !== "true")) {
                buttons.push({
                    buttonName: button.buttonText || 'Button',
                    buttonText: button.buttonText,
                    buttonType: button.buttonType || 'other',
                    destinationTargetName: button.destinationTargetName,
                    destinationContextObjectName: button.destinationContextObjectName
                });
            }
        });
    }
    
    return buttons;
}

/**
 * Extracts buttons with destination targets from a report
 */
function extractButtonsFromReport(report) {
    const buttons = [];
    
    // Extract report buttons (excluding breadcrumb buttons)
    if (report.reportButton && Array.isArray(report.reportButton)) {
        report.reportButton.forEach(button => {
            // Only include buttons that have destination targets, are not breadcrumb buttons, and are visible and not ignored
            if (button.destinationTargetName && 
                button.buttonType !== "breadcrumb" &&
                (!button.hasOwnProperty('isVisible') || button.isVisible !== "false") && 
                (!button.hasOwnProperty('isIgnored') || button.isIgnored !== "true")) {
                buttons.push({
                    buttonName: button.buttonName || button.buttonText,
                    buttonText: button.buttonText,
                    buttonType: button.buttonType,
                    destinationTargetName: button.destinationTargetName,
                    destinationContextObjectName: button.destinationContextObjectName
                });
            }
        });
    }
    
    // Extract report column buttons with destinations
    if (report.reportColumn && Array.isArray(report.reportColumn)) {
        report.reportColumn.forEach(column => {
            // Only include column buttons that have destination targets and are visible and not ignored
            if (column.isButton === "true" && 
                column.destinationTargetName &&
                (!column.hasOwnProperty('isVisible') || column.isVisible !== "false") && 
                (!column.hasOwnProperty('isIgnored') || column.isIgnored !== "true")) {
                buttons.push({
                    buttonName: column.name,
                    buttonText: column.buttonText,
                    buttonType: 'column',
                    destinationTargetName: column.destinationTargetName,
                    destinationContextObjectName: column.destinationContextObjectName
                });
            }
        });
    }
    
    return buttons;
}

/**
 * Handles pathfinding data request from webview
 * @param {string} fromPage Starting page name
 * @param {string} toPage Target page name  
 * @param {Object} modelService ModelService instance
 */
function handlePathfindingRequest(fromPage, toPage, modelService) {
    console.log('[DEBUG] PagePreview - Processing pathfinding request from', fromPage, 'to', toPage);
    
    if (!currentPanel) {
        console.error('[ERROR] PagePreview - No current panel for pathfinding response');
        return;
    }
    
    try {
        // Get all objects from model service
        const allObjects = modelService.getAllObjects();
        console.log('[DEBUG] PagePreview - Got', allObjects.length, 'objects from model service');
        
        // Extract pages and connections for pathfinding (similar to User Stories Journey logic)
        const pages = [];
        const connections = [];
        
        allObjects.forEach(obj => {
            // Extract form pages from objectWorkflow
            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                obj.objectWorkflow.forEach(workflow => {
                    if (workflow.isPage === "true") {
                        // Use same structure as Page Flow view with normalized buttons
                        const page = {
                            ...workflow,  // Spread all workflow properties
                            objectName: obj.name,
                            type: 'form',
                            pageType: 'form',
                            buttons: extractButtonsFromWorkflow(workflow)  // Normalized buttons array
                        };
                        pages.push(page);
                        
                        console.log('[DEBUG] PagePreview - Form page:', workflow.name, 'has', page.buttons.length, 'buttons');
                    }
                });
            }
            
            // Extract report pages from report array
            if (obj.report && Array.isArray(obj.report)) {
                obj.report.forEach(report => {
                    if (report.isPage === "true" || report.isPage === undefined) {
                        // Use same structure as Page Flow view with normalized buttons
                        const page = {
                            ...report,  // Spread all report properties
                            objectName: obj.name,
                            type: 'report',
                            pageType: 'report',
                            buttons: extractButtonsFromReport(report)  // Normalized buttons array
                        };
                        pages.push(page);
                        
                        console.log('[DEBUG] PagePreview - Report page:', report.name, 'has', page.buttons.length, 'buttons');
                    }
                });
            }
        });
        
        console.log('[DEBUG] PagePreview - Extracted', pages.length, 'pages for pathfinding');
        console.log('[DEBUG] PagePreview - Page names:', pages.map(p => p.name));
        
        // Log button destinations for debugging
        pages.forEach(page => {
            const destinations = page.buttons.map(b => b.destinationTargetName).filter(d => d);
            if (destinations.length > 0) {
                console.log('[DEBUG] PagePreview - Page', page.name, 'button destinations:', destinations);
            }
        });
        
        // Send pathfinding data back to webview
        currentPanel.webview.postMessage({
            command: 'pathfindingData',
            data: {
                pages: pages,
                connections: connections,
                fromPage: fromPage,
                toPage: toPage
            }
        });
        
    } catch (error) {
        console.error('[ERROR] PagePreview - Error processing pathfinding request:', error);
    }
}

module.exports = {
    showPagePreview,
    showPagePreviewWithSelection,
    getPagePreviewPanel,
    closePagePreviewView
};

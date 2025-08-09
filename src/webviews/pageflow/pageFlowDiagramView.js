// pageFlowDiagramView.js
// Main page flow diagram view for VS Code extension
// Shows the flow between pages based on destination target names in buttons
// Created: July 13, 2025 (Refactored from large monolithic file)

"use strict";

const vscode = require('vscode');
const path = require('path');
const { extractPagesFromModel } = require('./helpers/pageExtractor');
const { buildFlowMap } = require('./helpers/flowBuilder');
const { generateHTMLContent } = require('./components/htmlGenerator');

let currentPanel = undefined;
let currentContext = undefined;

/**
 * Shows the page flow diagram in a webview
 * @param {vscode.ExtensionContext} context Extension context
 * @param {Object} modelService ModelService instance
 */
async function showPageFlowDiagram(context, modelService) {
    // Store context for later use
    currentContext = context;
    
    // Get current model data
    const allObjects = modelService.getAllObjects();
    console.log('[DEBUG] ModelService.getAllObjects() returned:', allObjects);
    console.log('[DEBUG] All objects count:', allObjects ? allObjects.length : 0);
    console.log('[DEBUG] All objects type:', typeof allObjects);
    console.log('[DEBUG] All objects is array:', Array.isArray(allObjects));
    
    if (allObjects && allObjects.length > 0) {
        console.log('[DEBUG] First object sample:', JSON.stringify(allObjects[0], null, 2));
    }
    
    // Extract pages from the model
    const pages = extractPagesFromModel(allObjects || []);
    console.log('[DEBUG] Extracted pages count:', pages.length);
    console.log('[DEBUG] Extracted pages:', pages);
    
    // Create or show the webview panel
    const columnToShowIn = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;
        
    // If we already have a panel, show it
    if (currentPanel) {
        currentPanel.reveal(columnToShowIn);
        return;
    }
    
    // Create the webview panel
    currentPanel = vscode.window.createWebviewPanel(
        'pageFlowDiagram',
        'Page Flow Diagram',
        columnToShowIn || vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );
    
    // Get HTML content
    const htmlContent = await getWebviewContent(context, allObjects || [], modelService);
    currentPanel.webview.html = htmlContent;
    
    // Handle messages from the webview
    currentPanel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'showFormDetails':
                    if (message.formName && message.objectName) {
                        // Create a mock tree item to match the expected interface
                        const mockTreeItem = {
                            label: message.objectName,
                            contextValue: 'dataObjectItem',
                            objectName: message.objectName
                        };
                        
                        // Call the showFormDetails function
                        const formDetailsView = require('../formDetailsView');
                        formDetailsView.showFormDetails(mockTreeItem, modelService, currentContext);
                    }
                    return;
                
                case 'showReportDetails':
                    if (message.reportName && message.objectName) {
                        // Create a mock tree item to match the expected interface
                        const reportObjectName = message.objectName + '.' + message.reportName;
                        const mockTreeItem = {
                            label: reportObjectName,
                            contextValue: 'reportItem',
                            objectName: reportObjectName
                        };
                        
                        // Call the showReportDetails function
                        const reportDetailsView = require('../reports/reportDetailsView');
                        reportDetailsView.showReportDetails(mockTreeItem, modelService);
                    }
                    return;
                
                case 'downloadFile':
                    // Handle file download request from webview
                    if (message.fileName && message.content) {
                        handleFileDownload(message.fileName, message.content, message.mimeType);
                    }
                    return;
                
                case 'error':
                    vscode.window.showErrorMessage(message.message);
                    return;
            }
        },
        undefined,
        context.subscriptions
    );
    
    // Reset when the panel is closed
    currentPanel.onDidDispose(
        () => {
            currentPanel = undefined;
        },
        null,
        context.subscriptions
    );
}

/**
 * Gets the page flow panel if it exists
 * @returns {vscode.WebviewPanel | undefined} The current panel
 */
function getPageFlowPanel() {
    return currentPanel;
}

/**
 * Closes the page flow diagram view
 */
function closePageFlowView() {
    if (currentPanel) {
        currentPanel.dispose();
        currentPanel = undefined;
    }
}

/**
 * Generates the HTML content for the webview
 * @param {vscode.ExtensionContext} context Extension context
 * @param {Array} allObjects Array of all objects from the model
 * @param {Object} modelService ModelService instance
 * @returns {string} HTML content
 */
async function getWebviewContent(context, allObjects, modelService) {
    // Extract pages and build flow map
    const pages = extractPagesFromModel(allObjects);
    const flowMap = buildFlowMap(pages);
    
    // Get app name from the model
    let appName = '';
    if (modelService && modelService.isFileLoaded()) {
        const rootModel = modelService.getCurrentModel();
        appName = rootModel?.appName || '';
    }
    
    // Get the codicons URI for the webview
    const codiconsUri = currentPanel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css')
    );
    
    console.log('[DEBUG] Final flow map:', flowMap);
    console.log('[DEBUG] App name for filename:', appName);
    console.log('[DEBUG] Codicons URI:', codiconsUri.toString());
    
    // Generate HTML using the modular generator, passing the app name and codicons URI
    return generateHTMLContent(flowMap, appName, codiconsUri.toString());
}

/**
 * Handles file download requests from the webview
 * @param {string} fileName Name of the file to download
 * @param {string} content File content
 * @param {string} mimeType MIME type of the file
 */
async function handleFileDownload(fileName, content, mimeType) {
    try {
        // Show save dialog to user
        const saveOptions = {
            defaultUri: vscode.Uri.file(fileName),
            filters: {}
        };
        
        // Set up file filters based on MIME type
        if (mimeType && mimeType.includes('svg')) {
            saveOptions.filters['SVG Files'] = ['svg'];
        } else {
            saveOptions.filters['All Files'] = ['*'];
        }
        
        const fileUri = await vscode.window.showSaveDialog(saveOptions);
        
        if (fileUri) {
            // Write the file content
            const buffer = Buffer.from(content, 'utf8');
            await vscode.workspace.fs.writeFile(fileUri, buffer);
            
            // Show success message
            const fileName = fileUri.fsPath.split(/[\\/]/).pop();
            vscode.window.showInformationMessage(`File saved successfully: ${fileName}`);
            
            console.log('[DEBUG] File saved successfully:', fileUri.fsPath);
        } else {
            console.log('[DEBUG] User cancelled file save dialog');
        }
    } catch (error) {
        console.error('[DEBUG] Error saving file:', error);
        vscode.window.showErrorMessage('Error saving file: ' + error.message);
    }
}

/**
 * Shows the page flow diagram with User Journey tab and predefined values
 * @param {vscode.ExtensionContext} context Extension context
 * @param {Object} modelService ModelService instance
 * @param {string} targetPage Target page name for the journey
 * @param {string} startPage Start page name for the journey (optional)
 */
async function showPageFlowWithUserJourney(context, modelService, targetPage, startPage = null) {
    console.log('[DEBUG] showPageFlowWithUserJourney called with:', { targetPage, startPage });
    
    // First open the page flow diagram normally
    await showPageFlowDiagram(context, modelService);
    
    // Send a message to switch to User Journey tab and set values
    if (currentPanel) {
        setTimeout(() => {
            currentPanel.webview.postMessage({
                command: 'openUserJourneyWithValues',
                targetPage: targetPage,
                startPage: startPage
            });
        }, 500); // Small delay to ensure webview is loaded
    }
}

module.exports = {
    showPageFlowDiagram,
    showPageFlowWithUserJourney,
    getPageFlowPanel,
    closePageFlowView
};

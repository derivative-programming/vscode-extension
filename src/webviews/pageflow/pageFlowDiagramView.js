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
    const htmlContent = await getWebviewContent(context, allObjects || []);
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
                        formDetailsView.showFormDetails(mockTreeItem, modelService);
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
                        const reportDetailsView = require('../reportDetailsView');
                        reportDetailsView.showReportDetails(mockTreeItem, modelService);
                    }
                    return;
                
                case 'refreshDiagram':
                    // Handle refresh request by sending fresh data to the webview
                    const refreshedObjects = modelService.getAllObjects();
                    const refreshedFlowMap = buildFlowMap(extractPagesFromModel(refreshedObjects || []));
                    currentPanel.webview.postMessage({
                        command: 'updateFlowData',
                        flowData: refreshedFlowMap
                    });
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
 * @returns {string} HTML content
 */
async function getWebviewContent(context, allObjects) {
    // Extract pages and build flow map
    const pages = extractPagesFromModel(allObjects);
    const flowMap = buildFlowMap(pages);
    
    console.log('[DEBUG] Final flow map:', flowMap);
    
    // Generate HTML using the modular generator
    return generateHTMLContent(flowMap);
}

module.exports = {
    showPageFlowDiagram,
    getPageFlowPanel,
    closePageFlowView
};

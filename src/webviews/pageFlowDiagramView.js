// pageFlowDiagramView.js
// Page flow diagram view for VS Code extension
// Shows the flow between pages based on destination target names in buttons
// Created: July 12, 2025

"use strict";

const vscode = require('vscode');
const path = require('path');

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
    
    // Extract pages from the model (don't return early, show debug info)
    const pages = extractPagesFromModel(allObjects || []);
    console.log('[DEBUG] Extracted pages count:', pages.length);
    console.log('[DEBUG] Extracted pages:', pages);
    
    // Always show the webview, even if no pages found (for debugging)
    
    // Create or show the webview panel
    const columnToShowIn = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;
        
    // If we already have a panel, show it
    if (currentPanel) {
        currentPanel.reveal(columnToShowIn);
        return;
    }
    
    // Otherwise, create a new panel
    currentPanel = vscode.window.createWebviewPanel(
        'pageFlowDiagramView',
        'Page Flow Diagram',
        columnToShowIn || vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(context.extensionPath, 'src')),
                vscode.Uri.file(path.join(context.extensionPath, 'node_modules'))
            ]
        }
    );
    
    // Set the HTML content for the webview
    currentPanel.webview.html = await getWebviewContent(context, allObjects);
    
    // Handle messages from the webview
    currentPanel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'showFormDetails':
                    // Handle showing form details
                    const formName = message.formName;
                    const objectName = message.objectName;
                    if (formName && objectName) {
                        // Create a mock tree item to pass to showFormDetails
                        const mockTreeItem = {
                            label: formName,
                            contextValue: 'formItem',
                            objectName: objectName
                        };
                        
                        // Call the showFormDetails function
                        const formDetailsView = require('./formDetailsView');
                        formDetailsView.showFormDetails(mockTreeItem, modelService);
                    }
                    return;
                    
                case 'showReportDetails':
                    // Handle showing report details
                    const reportName = message.reportName;
                    const reportObjectName = message.objectName;
                    if (reportName && reportObjectName) {
                        // Create a mock tree item to pass to showReportDetails
                        const mockTreeItem = {
                            label: reportName,
                            contextValue: 'reportItem',
                            objectName: reportObjectName
                        };
                        
                        // Call the showReportDetails function
                        const reportDetailsView = require('./reportDetailsView');
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
 * Extracts all pages from the model data
 * @param {Array} allObjects Array of all objects from the model
 * @returns {Array} Array of page objects
 */
function extractPagesFromModel(allObjects) {
    const pages = [];
    console.log('[DEBUG] extractPagesFromModel - processing', allObjects.length, 'objects');
    
    allObjects.forEach((obj, index) => {
        console.log(`[DEBUG] Object ${index}: ${obj.name}, has objectWorkflow:`, !!obj.objectWorkflow, 'has report:', !!obj.report);
        
        // Extract forms (object workflows - only those with isPage=true)
        if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
            console.log(`[DEBUG] Object ${obj.name} has ${obj.objectWorkflow.length} objectWorkflow items`);
            obj.objectWorkflow.forEach((workflow, wIndex) => {
                console.log(`[DEBUG] Workflow ${wIndex}: ${workflow.name}, isPage: ${workflow.isPage}`);
                if (workflow.isPage === "true") {
                    const page = {
                        name: workflow.name,
                        titleText: workflow.titleText || workflow.name,
                        type: 'form',
                        objectName: obj.name,
                        buttons: extractButtonsFromWorkflow(workflow),
                        roleRequired: workflow.roleRequired
                    };
                    console.log('[DEBUG] Adding form page:', page);
                    pages.push(page);
                }
            });
        }
        
        // Extract reports with isPage=true
        if (obj.report && Array.isArray(obj.report)) {
            console.log(`[DEBUG] Object ${obj.name} has ${obj.report.length} report items`);
            obj.report.forEach((report, rIndex) => {
                console.log(`[DEBUG] Report ${rIndex}: ${report.name}, isPage: ${report.isPage}`);
                if (report.isPage === "true") {
                    const page = {
                        name: report.name,
                        titleText: report.titleText || report.name,
                        type: 'report',
                        visualizationType: report.visualizationType || 'grid', // Default to grid if not specified
                        objectName: obj.name,
                        buttons: extractButtonsFromReport(report),
                        roleRequired: report.roleRequired
                    };
                    console.log('[DEBUG] Adding report page:', page);
                    pages.push(page);
                }
            });
        }
    });
    
    console.log('[DEBUG] extractPagesFromModel - returning', pages.length, 'pages');
    return pages;
}

/**
 * Extracts buttons with destination targets from a workflow
 * @param {Object} workflow Object workflow
 * @returns {Array} Array of button objects with destinations
 */
function extractButtonsFromWorkflow(workflow) {
    const buttons = [];
    
    // Extract object workflow buttons with destination targets
    if (workflow.objectWorkflowButton && Array.isArray(workflow.objectWorkflowButton)) {
        workflow.objectWorkflowButton.forEach(button => {
            if (button.destinationTargetName) {
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
 * @param {Object} report Report object
 * @returns {Array} Array of button objects with destinations
 */
function extractButtonsFromReport(report) {
    const buttons = [];
    
    // Extract report buttons (excluding breadcrumb buttons as requested)
    if (report.reportButton && Array.isArray(report.reportButton)) {
        report.reportButton.forEach(button => {
            if (button.destinationTargetName && button.buttonType !== "breadcrumb") {
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
            if (column.isButton === "true" && column.destinationTargetName) {
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
 * Builds a flow map showing connections between pages
 * @param {Array} pages Array of page objects
 * @returns {Object} Flow map object
 */
function buildFlowMap(pages) {
    const flowMap = {
        pages: pages,
        connections: []
    };
    
    // Build connections based on destination target names
    pages.forEach(sourcePage => {
        sourcePage.buttons.forEach(button => {
            // Find the destination page
            const destinationPage = pages.find(page => page.name === button.destinationTargetName);
            if (destinationPage) {
                flowMap.connections.push({
                    from: sourcePage.name,
                    to: destinationPage.name,
                    buttonText: button.buttonText || button.buttonName,
                    buttonType: button.buttonType
                });
            }
        });
    });
    
    return flowMap;
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
    
    // Get the path to the media directory
    const mediaPath = vscode.Uri.file(path.join(context.extensionPath, 'media'));
    const mediaUri = currentPanel.webview.asWebviewUri(mediaPath);
    
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Page Flow Diagram</title>
            <script src="https://d3js.org/d3.v7.min.js"></script>
            <link rel="stylesheet" href="https://unpkg.com/@vscode/codicons@latest/dist/codicon.css" />
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    margin: 0;
                    padding: 20px;
                }
                
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 10px;
                }
                
                .title {
                    font-size: 1.5em;
                    font-weight: bold;
                }
                
                .controls {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }
                
                .zoom-controls {
                    display: flex;
                    gap: 5px;
                    align-items: center;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 2px;
                    background-color: var(--vscode-editorWidget-background);
                }
                
                .zoom-btn {
                    background: none;
                    border: none;
                    color: var(--vscode-foreground);
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 3px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    min-width: 28px;
                    height: 28px;
                }
                
                .zoom-btn:hover {
                    background: var(--vscode-toolbar-hoverBackground);
                    color: var(--vscode-foreground);
                }
                
                .zoom-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                    background: none;
                }
                
                .icon-button {
                    background: none;
                    border: none;
                    color: var(--vscode-foreground);
                    cursor: pointer;
                    padding: 5px;
                    margin-left: 5px;
                    border-radius: 3px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                }
                
                .icon-button:hover {
                    background: var(--vscode-toolbar-hoverBackground);
                    color: var(--vscode-foreground);
                }
                
                .icon-button:focus {
                    outline: 1px solid var(--vscode-focusBorder);
                    outline-offset: 2px;
                }
                
                .zoom-level {
                    font-size: 11px;
                    color: var(--vscode-descriptionForeground);
                    min-width: 35px;
                    text-align: center;
                    user-select: none;
                }
                
                .btn {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    cursor: pointer;
                    border-radius: 3px;
                    font-size: 13px;
                }
                
                .btn:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                
                .flow-container {
                    width: 100%;
                    height: 80vh;
                    border: 1px solid var(--vscode-panel-border);
                    position: relative;
                    overflow: hidden;
                    background-color: var(--vscode-editor-background);
                }
                
                .d3-container {
                    width: 100%;
                    height: 100%;
                }
                
                .page-node {
                    fill: var(--vscode-editorWidget-background);
                    stroke: var(--vscode-panel-border);
                    stroke-width: 2;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .page-node:hover {
                    stroke: var(--vscode-focusBorder);
                    stroke-width: 3;
                }
                
                .page-node.form {
                    stroke-left: var(--vscode-charts-green);
                    stroke-width: 4;
                }
                
                .page-node.report {
                    stroke-left: var(--vscode-charts-orange);
                    stroke-width: 4;
                }
                
                /* Different background colors for page types */
                .page-node.form {
                    fill: #e3f2fd; /* Light blue for forms */
                }
                
                .page-node.report-grid {
                    fill: #fff3e0; /* Light orange for grid reports */
                }
                
                .page-node.report-navigation {
                    fill: #f3e5f5; /* Light purple for navigation reports (two column) */
                }
                
                .page-node.report-detail {
                    fill: #ffebee; /* Light red for detail reports (three column) */
                }
                
                .page-node.report-other {
                    fill: #fffde7; /* Light yellow for other report types */
                }
                
                /* Dark mode adjustments */
                body.vscode-dark .page-node.form {
                    fill: #1e3a8a; /* Dark blue for forms */
                }
                
                body.vscode-dark .page-node.report-grid {
                    fill: #ea580c; /* Dark orange for grid reports */
                }
                
                body.vscode-dark .page-node.report-navigation {
                    fill: #7c3aed; /* Dark purple for navigation reports */
                }
                
                body.vscode-dark .page-node.report-detail {
                    fill: #dc2626; /* Dark red for detail reports */
                }
                
                body.vscode-dark .page-node.report-other {
                    fill: #ca8a04; /* Dark yellow for other report types */
                }
                
                /* Search highlighting styles */
                .page-node.search-partial {
                    fill: #90ee90 !important; /* Light green for partial matches */
                    stroke: #32cd32 !important; /* Lime green border */
                    stroke-width: 3px !important;
                }
                
                .page-node.search-highlight {
                    fill: #00ff00 !important; /* Bright green for exact matches */
                    stroke: #228b22 !important; /* Forest green border */
                    stroke-width: 4px !important;
                }
                
                /* Dark mode search highlighting */
                body.vscode-dark .page-node.search-partial {
                    fill: #4ade80 !important; /* Light green for partial matches in dark mode */
                    stroke: #16a34a !important; /* Green border */
                }
                
                body.vscode-dark .page-node.search-highlight {
                    fill: #22c55e !important; /* Bright green for exact matches in dark mode */
                    stroke: #15803d !important; /* Dark green border */
                }
                
                .page-text {
                    font-family: var(--vscode-font-family);
                    font-size: 13px;
                    fill: var(--vscode-editor-foreground);
                    text-anchor: middle;
                    dominant-baseline: middle;
                    pointer-events: none;
                }
                
                .page-title {
                    font-weight: bold;
                    font-size: 15px;
                }
                
                .page-type {
                    font-size: 11px;
                    fill: var(--vscode-descriptionForeground);
                    text-transform: uppercase;
                }
                
                .page-object {
                    font-size: 11px;
                    fill: var(--vscode-descriptionForeground);
                }
                
                .connection-line {
                    stroke: var(--vscode-charts-blue);
                    stroke-width: 2;
                    fill: none;
                    marker-end: url(#arrowhead);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .connection-line:hover {
                    stroke: var(--vscode-charts-purple);
                    stroke-width: 3;
                }
                
                .connection-label {
                    font-family: var(--vscode-font-family);
                    font-size: 10px;
                    fill: var(--vscode-editor-foreground);
                    text-anchor: middle;
                    pointer-events: none;
                    background: var(--vscode-editor-background);
                }
                
                .info-panel {
                    margin-top: 20px;
                    padding: 15px;
                    background-color: var(--vscode-editorWidget-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                }
                
                .info-panel-title {
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 15px;
                    color: var(--vscode-editor-foreground);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 8px;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 40px;
                    color: var(--vscode-descriptionForeground);
                }
                
                .empty-state h3 {
                    margin-bottom: 10px;
                    color: var(--vscode-editor-foreground);
                }
                
                .stats {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 10px;
                }
                
                .stat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                
                .stat-number {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: var(--vscode-focusBorder);
                }
                
                .stat-label {
                    font-size: 11px;
                    color: var(--vscode-descriptionForeground);
                    text-transform: uppercase;
                }
                
                .search-box {
                    margin-bottom: 15px;
                    padding: 10px;
                    background-color: var(--vscode-editorWidget-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                }
                
                .search-box input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    font-family: var(--vscode-font-family);
                    font-size: 14px;
                    box-sizing: border-box;
                }
                
                .search-box input:focus {
                    outline: 1px solid var(--vscode-focusBorder);
                    border-color: var(--vscode-focusBorder);
                }
                
                .role-filter {
                    margin-bottom: 15px;
                    padding: 10px;
                    background-color: var(--vscode-editorWidget-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                }
                
                .role-filter-title {
                    font-size: 13px;
                    font-weight: bold;
                    margin-bottom: 8px;
                    color: var(--vscode-editor-foreground);
                }
                
                .role-filter-options {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                
                .role-checkbox-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    cursor: pointer;
                    min-width: 120px;
                }
                
                .role-checkbox-item input[type="checkbox"] {
                    margin: 0;
                    cursor: pointer;
                }
                
                .role-checkbox-item label {
                    cursor: pointer;
                    color: var(--vscode-editor-foreground);
                    user-select: none;
                }
                
                .tooltip {
                    position: absolute;
                    background-color: var(--vscode-editorHoverWidget-background);
                    color: var(--vscode-editorHoverWidget-foreground);
                    border: 1px solid var(--vscode-editorHoverWidget-border);
                    border-radius: 4px;
                    padding: 8px 12px;
                    font-size: 12px;
                    max-width: 300px;
                    z-index: 1000;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                }
                
                .tooltip.visible {
                    opacity: 1;
                }
                
                .tooltip-title {
                    font-weight: bold;
                    margin-bottom: 4px;
                    color: var(--vscode-editorHoverWidget-foreground);
                }
                
                .tooltip-content {
                    line-height: 1.4;
                }
                
                .tooltip-section {
                    margin-bottom: 6px;
                }
                
                .tooltip-section:last-child {
                    margin-bottom: 0;
                }
                
                .legend {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                    margin-top: 15px;
                    padding: 15px;
                    background-color: var(--vscode-editorWidget-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                }
                
                .legend-title {
                    width: 100%;
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: var(--vscode-editor-foreground);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .legend-toggle {
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                }
                
                .legend-content {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                    transition: all 0.3s ease;
                }
                
                .legend-content.collapsed {
                    display: none;
                }
                
                .legend-panel {
                    transition: all 0.3s ease;
                }
                
                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 12px;
                    min-width: 200px;
                }
                
                .legend-color {
                    width: 20px;
                    height: 20px;
                    border-radius: 4px;
                    border: 2px solid;
                    flex-shrink: 0;
                }
                
                .legend-color.form {
                    border-color: var(--vscode-charts-blue);
                    background-color: #e3f2fd; /* Light blue for forms */
                }
                
                .legend-color.report-grid {
                    border-color: var(--vscode-charts-orange);
                    background-color: #fff3e0; /* Light orange for grid reports */
                }
                
                .legend-color.report-navigation {
                    border-color: var(--vscode-charts-purple);
                    background-color: #f3e5f5; /* Light purple for navigation reports */
                }
                
                .legend-color.report-detail {
                    border-color: var(--vscode-charts-red);
                    background-color: #ffebee; /* Light red for detail reports */
                }
                
                .legend-color.report-other {
                    border-color: var(--vscode-charts-yellow);
                    background-color: #fffde7; /* Light yellow for other report types */
                }
                
                /* Dark mode legend colors */
                body.vscode-dark .legend-color.form {
                    background-color: #1e3a8a; /* Dark blue for forms */
                }
                
                body.vscode-dark .legend-color.report-grid {
                    background-color: #ea580c; /* Dark orange for grid reports */
                }
                
                body.vscode-dark .legend-color.report-navigation {
                    background-color: #7c3aed; /* Dark purple for navigation reports */
                }
                
                body.vscode-dark .legend-color.report-detail {
                    background-color: #dc2626; /* Dark red for detail reports */
                }
                
                body.vscode-dark .legend-color.report-other {
                    background-color: #ca8a04; /* Dark yellow for other report types */
                }
                
                .legend-description {
                    color: var(--vscode-editor-foreground);
                }
                
                .legend-viz-types {
                    font-size: 10px;
                    color: var(--vscode-descriptionForeground);
                    font-style: italic;
                }
                
                .connections-legend {
                    margin-top: 15px;
                    padding: 10px 15px;
                    background-color: var(--vscode-editorWidget-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    font-size: 12px;
                    transition: all 0.3s ease;
                }
                
                .connections-legend.hidden {
                    display: none;
                }
                
                .connections-legend-title {
                    font-weight: bold;
                    margin-bottom: 8px;
                    color: var(--vscode-editor-foreground);
                }
                
                .connection-sample {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 5px;
                }
                
                .connection-line-sample {
                    width: 30px;
                    height: 2px;
                    background-color: var(--vscode-charts-blue);
                    position: relative;
                }
                
                .connection-line-sample::after {
                    content: '→';
                    position: absolute;
                    right: -8px;
                    top: -8px;
                    color: var(--vscode-charts-blue);
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">Page Flow Diagram</div>
                <div class="controls">
                    <div class="zoom-controls">
                        <button class="zoom-btn icon-button" id="zoomOut" onclick="zoomOut()" title="Zoom Out"><i class="codicon codicon-zoom-out"></i></button>
                        <span class="zoom-level" id="zoomLevel">100%</span>
                        <button class="zoom-btn icon-button" id="zoomIn" onclick="zoomIn()" title="Zoom In"><i class="codicon codicon-zoom-in"></i></button>
                        <button class="zoom-btn icon-button" onclick="resetZoom()" title="Reset Zoom"><i class="codicon codicon-home"></i></button>
                    </div>
                    <button class="btn" onclick="refreshDiagram()">Refresh</button>
                    <button class="btn" onclick="autoLayout()">Auto Layout</button>
                </div>
            </div>
            
            <div class="search-box">
                <input type="text" id="searchPages" placeholder="Search pages...">
            </div>
            
            <div class="role-filter">
                <div class="role-filter-title">Filter by Role:</div>
                <div class="role-filter-options" id="roleFilterOptions">
                    <!-- Role checkboxes will be populated here -->
                </div>
            </div>
            
            <div class="flow-container" id="flowContainer">
                <svg class="d3-container" id="d3Container"></svg>
                <div class="tooltip" id="tooltip">
                    <div class="tooltip-title"></div>
                    <div class="tooltip-content"></div>
                </div>
            </div>
            
            <div class="info-panel">
                <div class="info-panel-title">Diagram Statistics</div>
                <div class="stats">
                    <div class="stat">
                        <div class="stat-number" id="totalPages">0</div>
                        <div class="stat-label">Total Pages</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number" id="totalForms">0</div>
                        <div class="stat-label">Forms</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number" id="totalReports">0</div>
                        <div class="stat-label">Reports</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number" id="totalGridReports">0</div>
                        <div class="stat-label">Grid Reports</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number" id="totalNavReports">0</div>
                        <div class="stat-label">Nav Reports</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number" id="totalDetailReports">0</div>
                        <div class="stat-label">Detail Reports</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number" id="totalConnections">0</div>
                        <div class="stat-label">Connections</div>
                    </div>
                </div>
                
                <div class="legend" id="legendPanel">
                    <div class="legend-title" onclick="toggleLegend()">
                        <span>Color Legend - Page Types</span>
                        <span class="legend-toggle" id="legendToggle">(click to collapse)</span>
                    </div>
                    <div class="legend-content" id="legendContent">
                        <div class="legend-item">
                            <div class="legend-color form"></div>
                            <div>
                                <div class="legend-description"><strong>Forms</strong></div>
                                <div class="legend-viz-types">Object Workflows with isPage="true"</div>
                            </div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color report-grid"></div>
                            <div>
                                <div class="legend-description"><strong>Grid/Table Reports</strong></div>
                                <div class="legend-viz-types">visualizationType: grid, table</div>
                            </div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color report-navigation"></div>
                            <div>
                                <div class="legend-description"><strong>Navigation Reports</strong></div>
                                <div class="legend-viz-types">visualizationType: navigation, twocolumn, DetailTwoColumn</div>
                            </div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color report-detail"></div>
                            <div>
                                <div class="legend-description"><strong>Detail Reports</strong></div>
                                <div class="legend-viz-types">visualizationType: detail, threecolumn, DetailThreeColumn</div>
                            </div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color report-other"></div>
                            <div>
                                <div class="legend-description"><strong>Other Report Types</strong></div>
                                <div class="legend-viz-types">Custom or unspecified visualization types</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="connections-legend" id="connectionsLegend">
                    <div class="connections-legend-title">Connection Information</div>
                    <div class="connection-sample">
                        <div class="connection-line-sample"></div>
                        <span>Blue arrows show navigation flow between pages via button destinations</span>
                    </div>
                    <div style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 5px;">
                        • Hover over connections to see button details<br>
                        • Hover over pages to see detailed information<br>
                        • Click pages to open their detail views
                    </div>
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                const flowData = ${JSON.stringify(flowMap)};
                let selectedRoles = new Set(); // Track selected roles
                let simulation;
                let svg;
                let g;
                let tooltip; // Tooltip element
                let zoom; // D3 zoom behavior
                let currentZoom = 1; // Current zoom level
                const minZoom = 0.1;
                const maxZoom = 3;
                
                // Debug information
                console.log('[DEBUG] Flow data received in webview:', flowData);
                console.log('[DEBUG] Pages count:', flowData.pages ? flowData.pages.length : 0);
                console.log('[DEBUG] Connections count:', flowData.connections ? flowData.connections.length : 0);
                
                // Initialize the diagram
                document.addEventListener('DOMContentLoaded', function() {
                    tooltip = document.getElementById('tooltip');
                    populateRoleFilter();
                    initializeD3();
                    renderDiagram();
                    updateZoomDisplay(); // Initialize zoom display
                    
                    // Add search functionality
                    document.getElementById('searchPages').addEventListener('input', searchPages);
                    
                    // Listen for messages from the extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'updateFlowData':
                                // Update the flow data and re-render
                                Object.assign(flowData, message.flowData);
                                console.log('[DEBUG] Received updated flow data:', flowData);
                                
                                // Re-populate role filter with new data
                                const roleFilterOptions = document.getElementById('roleFilterOptions');
                                roleFilterOptions.innerHTML = '';
                                selectedRoles.clear();
                                populateRoleFilter();
                                
                                // Re-render the diagram with new data
                                renderDiagram();
                                
                                // Remove refresh notification and show success
                                const refreshNotification = document.getElementById('refreshNotification');
                                if (refreshNotification && refreshNotification.parentNode) {
                                    refreshNotification.parentNode.removeChild(refreshNotification);
                                }
                                
                                // Show success notification
                                const successNotification = document.createElement('div');
                                successNotification.style.position = 'fixed';
                                successNotification.style.top = '10px';
                                successNotification.style.right = '10px';
                                successNotification.style.backgroundColor = 'var(--vscode-notifications-background)';
                                successNotification.style.color = 'var(--vscode-notifications-foreground)';
                                successNotification.style.padding = '8px 12px';
                                successNotification.style.borderRadius = '4px';
                                successNotification.style.border = '1px solid var(--vscode-notifications-border)';
                                successNotification.style.zIndex = '1000';
                                successNotification.style.fontSize = '12px';
                                successNotification.textContent = 'Diagram refreshed successfully';
                                
                                document.body.appendChild(successNotification);
                                
                                // Remove success notification after 2 seconds
                                setTimeout(() => {
                                    if (successNotification.parentNode) {
                                        successNotification.parentNode.removeChild(successNotification);
                                    }
                                }, 2000);
                                break;
                        }
                    });
                    
                    // Add keyboard shortcut for legend toggle (L key)
                });
                
                function populateRoleFilter() {
                    const roleFilterOptions = document.getElementById('roleFilterOptions');
                    const roles = [...new Set(flowData.pages.map(page => page.roleRequired).filter(role => role))];
                    
                    // Add "Public Pages" option for pages without role requirements
                    const hasPublicPages = flowData.pages.some(page => !page.roleRequired);
                    
                    if (hasPublicPages) {
                        const publicItem = document.createElement('div');
                        publicItem.className = 'role-checkbox-item';
                        publicItem.innerHTML = 
                            '<input type="checkbox" id="role-PUBLIC" checked onchange="handleRoleChange(this)">' +
                            '<label for="role-PUBLIC">Public Pages</label>';
                        roleFilterOptions.appendChild(publicItem);
                        selectedRoles.add('PUBLIC');
                    }
                    
                    roles.forEach(role => {
                        const roleItem = document.createElement('div');
                        roleItem.className = 'role-checkbox-item';
                        roleItem.innerHTML = 
                            '<input type="checkbox" id="role-' + role + '" checked onchange="handleRoleChange(this)">' +
                            '<label for="role-' + role + '">' + role + '</label>';
                        roleFilterOptions.appendChild(roleItem);
                        selectedRoles.add(role);
                    });
                }
                
                function handleRoleChange(checkbox) {
                    const roleValue = checkbox.id.replace('role-', '');
                    
                    if (checkbox.checked) {
                        selectedRoles.add(roleValue);
                    } else {
                        selectedRoles.delete(roleValue);
                    }
                    
                    renderDiagram();
                }
                
                function searchPages() {
                    const searchText = document.getElementById('searchPages').value.toLowerCase();
                    
                    // Clear previous search highlights
                    clearSearchHighlights();
                    
                    // If search is empty, just clear highlights and return
                    if (!searchText.trim()) {
                        renderDiagram();
                        return;
                    }
                    
                    let exactMatchNode = null;
                    let matchCount = 0;
                    
                    // Find matching pages and mark them for highlighting
                    flowData.pages.forEach(page => {
                        const pageName = page.name.toLowerCase();
                        const pageTitle = (page.titleText || '').toLowerCase();
                        
                        // Check if page name or title matches
                        const nameMatch = pageName.includes(searchText);
                        const titleMatch = pageTitle.includes(searchText);
                        
                        if (nameMatch || titleMatch) {
                            matchCount++;
                            
                            // Check for exact match vs partial match
                            if (pageName === searchText || pageTitle === searchText) {
                                // Exact match - use bright green
                                page.searchHighlight = true;
                                page.searchPartial = false;
                                if (!exactMatchNode) {
                                    exactMatchNode = page;
                                }
                            } else {
                                // Partial match - use light green
                                page.searchHighlight = false;
                                page.searchPartial = true;
                            }
                        } else {
                            // No match
                            page.searchHighlight = false;
                            page.searchPartial = false;
                        }
                    });
                    
                    console.log('[DEBUG] Search results:', {
                        searchText,
                        matchCount,
                        exactMatch: exactMatchNode ? exactMatchNode.name : 'none'
                    });
                    
                    // Re-render the diagram to apply search highlighting
                    renderDiagram();
                }
                
                function clearSearchHighlights() {
                    flowData.pages.forEach(page => {
                        page.searchHighlight = false;
                        page.searchPartial = false;
                    });
                }
                
                function initializeD3() {
                    const container = d3.select('#d3Container');
                    const containerRect = document.getElementById('flowContainer').getBoundingClientRect();
                    
                    svg = container
                        .attr('width', containerRect.width)
                        .attr('height', containerRect.height);
                    
                    // Create arrow marker for connections
                    svg.append('defs').append('marker')
                        .attr('id', 'arrowhead')
                        .attr('viewBox', '0 -5 10 10')
                        .attr('refX', 15)
                        .attr('refY', 0)
                        .attr('markerWidth', 6)
                        .attr('markerHeight', 6)
                        .attr('orient', 'auto')
                        .append('path')
                        .attr('d', 'M0,-5L10,0L0,5')
                        .attr('fill', 'var(--vscode-charts-blue)');
                    
                    // Create zoom behavior
                    zoom = d3.zoom()
                        .scaleExtent([minZoom, maxZoom])
                        .on('zoom', (event) => {
                            g.attr('transform', event.transform);
                            currentZoom = event.transform.k;
                            updateZoomDisplay();
                        });
                    
                    svg.call(zoom);
                    
                    // Create main group for zoom/pan
                    g = svg.append('g');
                }
                
                // Function to get CSS class for page node based on type and visualization
                function getPageNodeClass(page) {
                    let baseClass = '';
                    
                    if (page.type === 'form') {
                        baseClass = 'page-node form';
                    } else if (page.type === 'report') {
                        const vizType = (page.visualizationType || 'grid').toLowerCase();
                        
                        // Map visualization types to CSS classes
                        switch (vizType) {
                            case 'grid':
                            case 'table':
                                baseClass = 'page-node report-grid';
                                break;
                            case 'navigation':
                            case 'twocolumn':
                            case 'two column':
                            case 'nav':
                            case 'detailtwocolumn':
                                baseClass = 'page-node report-navigation';
                                break;
                            case 'detail':
                            case 'threecolumn':
                            case 'three column':
                            case 'detailthreecolumn':
                                baseClass = 'page-node report-detail';
                                break;
                            default:
                                baseClass = 'page-node report-other';
                                break;
                        }
                    } else {
                        baseClass = 'page-node';
                    }
                    
                    // Add search highlighting classes
                    if (page.searchHighlight) {
                        baseClass += ' search-highlight';
                    } else if (page.searchPartial) {
                        baseClass += ' search-partial';
                    }
                    
                    return baseClass;
                }
                
                function renderDiagram() {
                    // Clear previous content
                    g.selectAll('*').remove();
                    
                    // Filter pages by selected roles
                    let filteredPages = flowData.pages;
                    if (selectedRoles.size > 0) {
                        filteredPages = flowData.pages.filter(page => {
                            // Check if page matches any selected role
                            if (selectedRoles.has('PUBLIC') && !page.roleRequired) {
                                return true; // Show public pages
                            }
                            return page.roleRequired && selectedRoles.has(page.roleRequired);
                        });
                    }
                    // If no roles are selected, show all pages (this is the default behavior)
                    
                    // Check if there are any pages to display
                    if (filteredPages.length === 0) {
                        showEmptyState();
                        updateStatistics([], []);
                        return;
                    }
                    
                    // Filter connections to only include filtered pages
                    const filteredConnections = flowData.connections.filter(conn => 
                        filteredPages.some(page => page.name === conn.from) &&
                        filteredPages.some(page => page.name === conn.to)
                    );
                    
                    // Prepare data for D3
                    const nodes = filteredPages.map(page => ({
                        id: page.name,
                        ...page,
                        x: Math.random() * 800 + 100,
                        y: Math.random() * 600 + 100
                    }));
                    
                    const links = filteredConnections.map(conn => ({
                        source: conn.from,
                        target: conn.to,
                        ...conn
                    }));
                    
                    // Always use force-directed layout
                    renderForceDirectedLayout(nodes, links);
                    
                    // Update statistics
                    updateStatistics(filteredPages, filteredConnections);
                }
                
                function renderForceDirectedLayout(nodes, links) {
                    const containerRect = document.getElementById('flowContainer').getBoundingClientRect();
                    const width = containerRect.width;
                    const height = containerRect.height;
                    
                    // Create force simulation with weak connection forces and strong collision prevention
                    simulation = d3.forceSimulation(nodes)
                        .force('link', d3.forceLink(links)
                            .id(d => d.id)
                            .distance(200)  // Longer distance between connected nodes
                            .strength(0.1))  // Very weak link force to minimize pulling
                        .force('charge', d3.forceManyBody()
                            .strength(-150))  // Stronger repulsion to keep nodes separated
                        .force('center', d3.forceCenter(width / 2, height / 2))
                        .force('collision', d3.forceCollide()
                            .radius(120)  // Large collision radius to prevent overlap (nodes are 180x100)
                            .strength(1.0))  // Maximum collision strength to enforce separation
                    
                    // Create links
                    const link = g.append('g')
                        .selectAll('line')
                        .data(links)
                        .enter().append('line')
                        .attr('class', 'connection-line')
                        .on('mouseover', function(event, d) {
                            // Show tooltip or highlight
                            d3.select(this).style('stroke-width', '3px');
                        })
                        .on('mouseout', function(event, d) {
                            d3.select(this).style('stroke-width', '2px');
                        });
                    
                    // Add connection labels
                    const linkLabels = g.append('g')
                        .selectAll('text')
                        .data(links)
                        .enter().append('text')
                        .attr('class', 'connection-label')
                        .text(d => d.buttonText || d.buttonType || 'Button');
                    
                    // Create node groups
                    const node = g.append('g')
                        .selectAll('g')
                        .data(nodes)
                        .enter().append('g')
                        .call(d3.drag()
                            .on('start', dragstarted)
                            .on('drag', dragged)
                            .on('end', dragended));
                    
                    // Add rectangles for nodes (made larger for better readability)
                    node.append('rect')
                        .attr('class', d => getPageNodeClass(d))
                        .attr('width', 180)
                        .attr('height', 100)
                        .attr('rx', 8)
                        .attr('ry', 8)
                        .style('stroke', d => {
                            if (d.type === 'form') {
                                return 'var(--vscode-charts-blue)';
                            } else if (d.type === 'report') {
                                const vizType = (d.visualizationType || 'grid').toLowerCase();
                                switch (vizType) {
                                    case 'grid':
                                    case 'table':
                                        return 'var(--vscode-charts-orange)';
                                    case 'navigation':
                                    case 'twocolumn':
                                    case 'two column':
                                    case 'nav':
                                    case 'detailtwocolumn':
                                        return 'var(--vscode-charts-purple)';
                                    case 'detail':
                                    case 'threecolumn':
                                    case 'three column':
                                    case 'detailthreecolumn':
                                        return 'var(--vscode-charts-red)';
                                    default:
                                        return 'var(--vscode-charts-red)';
                                }
                            }
                            return 'var(--vscode-panel-border)';
                        })
                        .style('stroke-width', 2)
                        .on('click', function(event, d) {
                            hideTooltip();
                            if (d.type === 'form') {
                                vscode.postMessage({
                                    command: 'showFormDetails',
                                    formName: d.name,
                                    objectName: d.objectName
                                });
                            } else if (d.type === 'report') {
                                vscode.postMessage({
                                    command: 'showReportDetails',
                                    reportName: d.name,
                                    objectName: d.objectName
                                });
                            }
                        })
                        .on('mouseover', function(event, d) {
                            showTooltip(event, d);
                        })
                        .on('mousemove', function(event, d) {
                            updateTooltipPosition(event);
                        })
                        .on('mouseout', function(event, d) {
                            hideTooltip();
                        });
                    
                    // Add text to nodes (improved sizing and positioning)
                    node.append('text')
                        .attr('class', 'page-text page-type')
                        .attr('x', 90)
                        .attr('y', 25)
                        .style('font-size', '11px')
                        .text(d => d.type.toUpperCase());
                    
                    node.append('text')
                        .attr('class', 'page-text page-title')
                        .attr('x', 90)
                        .attr('y', 45)
                        .style('font-size', '14px')
                        .style('font-weight', 'bold')
                        .text(d => d.titleText.length > 20 ? d.titleText.substring(0, 20) + '...' : d.titleText);
                    
                    node.append('text')
                        .attr('class', 'page-text page-object')
                        .attr('x', 90)
                        .attr('y', 65)
                        .style('font-size', '11px')
                        .text(d => 'Object: ' + (d.objectName.length > 12 ? d.objectName.substring(0, 12) + '...' : d.objectName));
                    
                    node.append('text')
                        .attr('class', 'page-text')
                        .attr('x', 90)
                        .attr('y', 80)
                        .style('font-size', '10px')
                        .text(d => (d.roleRequired || 'Public') + ' | ' + d.buttons.length + ' btn(s)');
                    
                    // Update positions on simulation tick (adjusted for larger nodes)
                    simulation.on('tick', () => {
                        link
                            .attr('x1', d => d.source.x + 90)
                            .attr('y1', d => d.source.y + 50)
                            .attr('x2', d => d.target.x + 90)
                            .attr('y2', d => d.target.y + 50);
                        
                        linkLabels
                            .attr('x', d => (d.source.x + d.target.x) / 2 + 90)
                            .attr('y', d => (d.source.y + d.target.y) / 2 + 45);
                        
                        node
                            .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');
                    });
                    
                    function dragstarted(event, d) {
                        if (!event.active) simulation.alphaTarget(0.3).restart();
                        d.fx = d.x;
                        d.fy = d.y;
                    }
                    
                    function dragged(event, d) {
                        d.fx = event.x;
                        d.fy = event.y;
                    }
                    
                    function dragended(event, d) {
                        if (!event.active) simulation.alphaTarget(0);
                        d.fx = null;
                        d.fy = null;
                    }
                }
                
                function showEmptyState() {
                    const container = document.getElementById('flowContainer');
                    const totalPages = flowData.pages ? flowData.pages.length : 'undefined';
                    const selectedRolesArray = Array.from(selectedRoles);
                    const roleFilter = selectedRolesArray.length > 0 ? selectedRolesArray.join(', ') : 'All Roles';
                    const rawDataStr = JSON.stringify(flowData, null, 2);                        container.innerHTML = '<div class="empty-state">' +
                            '<h3>No Pages Found</h3>' +
                            '<p>No pages match the current filter criteria.</p>' +
                            '<p>Pages are forms (object workflows) and reports with isPage="true".</p>' +
                            '<hr>' +
                            '<h4>Debug Information:</h4>' +
                            '<p><strong>Total pages in flowData:</strong> ' + totalPages + '</p>' +
                            '<p><strong>Current role filter:</strong> ' + roleFilter + '</p>' +
                            '<p><strong>Raw flowData:</strong></p>' +
                            '<pre style="background: #2d2d2d; padding: 10px; color: #cccccc; font-size: 10px; overflow: auto; max-height: 200px;">' +
                            rawDataStr + '</pre>' +
                            '</div>';
                }
                
                function updateStatistics(pages, connections) {
                    document.getElementById('totalPages').textContent = pages.length;
                    document.getElementById('totalForms').textContent = pages.filter(p => p.type === 'form').length;
                    document.getElementById('totalReports').textContent = pages.filter(p => p.type === 'report').length;
                    
                    // Count different report types
                    const gridReports = pages.filter(p => p.type === 'report' && 
                        ['grid', 'table'].includes((p.visualizationType || 'grid').toLowerCase())).length;
                    const navReports = pages.filter(p => p.type === 'report' && 
                        ['navigation', 'twocolumn', 'two column', 'nav', 'detailtwocolumn'].includes((p.visualizationType || '').toLowerCase())).length;
                    const detailReports = pages.filter(p => p.type === 'report' && 
                        ['detail', 'threecolumn', 'three column', 'detailthreecolumn'].includes((p.visualizationType || '').toLowerCase())).length;
                    
                    document.getElementById('totalGridReports').textContent = gridReports;
                    document.getElementById('totalNavReports').textContent = navReports;
                    document.getElementById('totalDetailReports').textContent = detailReports;
                    document.getElementById('totalConnections').textContent = connections.length;
                }
                
                function refreshDiagram() {
                    // Show loading indicator
                    const notification = document.createElement('div');
                    notification.id = 'refreshNotification';
                    notification.style.position = 'fixed';
                    notification.style.top = '10px';
                    notification.style.right = '10px';
                    notification.style.backgroundColor = 'var(--vscode-notifications-background)';
                    notification.style.color = 'var(--vscode-notifications-foreground)';
                    notification.style.padding = '8px 12px';
                    notification.style.borderRadius = '4px';
                    notification.style.border = '1px solid var(--vscode-notifications-border)';
                    notification.style.zIndex = '1000';
                    notification.style.fontSize = '12px';
                    notification.textContent = 'Refreshing diagram data...';
                    
                    document.body.appendChild(notification);
                    
                    // Request fresh data from the extension
                    vscode.postMessage({ command: 'refreshDiagram' });
                }
                
                function autoLayout() {
                    // Re-render with force-directed layout
                    renderDiagram();
                    
                    // Show notification
                    const notification = document.createElement('div');
                    notification.style.position = 'fixed';
                    notification.style.top = '10px';
                    notification.style.right = '10px';
                    notification.style.backgroundColor = 'var(--vscode-notifications-background)';
                    notification.style.color = 'var(--vscode-notifications-foreground)';
                    notification.style.padding = '8px 12px';
                    notification.style.borderRadius = '4px';
                    notification.style.border = '1px solid var(--vscode-notifications-border)';
                    notification.style.zIndex = '1000';
                    notification.style.fontSize = '12px';
                    notification.textContent = 'Switched to D3.js force-directed layout';
                    
                    document.body.appendChild(notification);
                    
                    // Remove notification after 3 seconds
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 3000);
                }
                
                // Tooltip functions
                function showTooltip(event, data) {
                    const tooltipTitle = tooltip.querySelector('.tooltip-title');
                    const tooltipContent = tooltip.querySelector('.tooltip-content');
                    
                    // Build tooltip content
                    tooltipTitle.textContent = data.titleText || data.name;
                    
                    let content = '';
                    content += '<div class="tooltip-section"><strong>Name:</strong> ' + data.name + '</div>';
                    content += '<div class="tooltip-section"><strong>Type:</strong> ' + data.type.charAt(0).toUpperCase() + data.type.slice(1);
                    if (data.type === 'report' && data.visualizationType) {
                        content += ' (' + data.visualizationType + ')';
                    }
                    content += '</div>';
                    content += '<div class="tooltip-section"><strong>Object:</strong> ' + data.objectName + '</div>';
                    content += '<div class="tooltip-section"><strong>Role Required:</strong> ' + (data.roleRequired || 'Public') + '</div>';
                    
                    if (data.buttons && data.buttons.length > 0) {
                        content += '<div class="tooltip-section"><strong>Buttons (' + data.buttons.length + '):</strong><br>';
                        data.buttons.forEach((button, index) => {
                            if (index < 5) { // Show first 5 buttons
                                content += '• ' + (button.buttonText || button.buttonName || 'Button') + 
                                          (button.destinationTargetName ? ' → ' + button.destinationTargetName : '') + '<br>';
                            } else if (index === 5) {
                                content += '• ... and ' + (data.buttons.length - 5) + ' more<br>';
                            }
                        });
                        content += '</div>';
                    }
                    
                    // Add connections information
                    const outgoingConnections = flowData.connections.filter(conn => conn.from === data.name);
                    const incomingConnections = flowData.connections.filter(conn => conn.to === data.name);
                    
                    if (outgoingConnections.length > 0 || incomingConnections.length > 0) {
                        content += '<div class="tooltip-section"><strong>Connections:</strong><br>';
                        if (outgoingConnections.length > 0) {
                            content += 'Outgoing: ' + outgoingConnections.length + '<br>';
                        }
                        if (incomingConnections.length > 0) {
                            content += 'Incoming: ' + incomingConnections.length;
                        }
                        content += '</div>';
                    }
                    
                    tooltipContent.innerHTML = content;
                    
                    // Position and show tooltip
                    updateTooltipPosition(event);
                    tooltip.classList.add('visible');
                }
                
                function updateTooltipPosition(event) {
                    const containerRect = document.getElementById('flowContainer').getBoundingClientRect();
                    const tooltipRect = tooltip.getBoundingClientRect();
                    
                    let x = event.pageX - containerRect.left + 15;
                    let y = event.pageY - containerRect.top - 10;
                    
                    // Adjust position if tooltip would go outside container
                    if (x + tooltipRect.width > containerRect.width) {
                        x = event.pageX - containerRect.left - tooltipRect.width - 15;
                    }
                    if (y + tooltipRect.height > containerRect.height) {
                        y = event.pageY - containerRect.top - tooltipRect.height - 10;
                    }
                    
                    // Ensure tooltip doesn't go above or to the left of container
                    x = Math.max(5, x);
                    y = Math.max(5, y);
                    
                    tooltip.style.left = x + 'px';
                    tooltip.style.top = y + 'px';
                }
                
                function hideTooltip() {
                    tooltip.classList.remove('visible');
                }
                
                // Legend toggle function
                function toggleLegend() {
                    const legendContent = document.getElementById('legendContent');
                    const legendToggle = document.getElementById('legendToggle');
                    
                    if (legendContent.classList.contains('collapsed')) {
                        legendContent.classList.remove('collapsed');
                        legendToggle.textContent = '(click to collapse)';
                    } else {
                        legendContent.classList.add('collapsed');
                        legendToggle.textContent = '(click to expand)';
                    }
                }
                
                // Zoom control functions
                function updateZoomDisplay() {
                    const zoomLevel = document.getElementById('zoomLevel');
                    const zoomOut = document.getElementById('zoomOut');
                    const zoomIn = document.getElementById('zoomIn');
                    
                    zoomLevel.textContent = Math.round(currentZoom * 100) + '%';
                    
                    // Disable buttons at zoom limits
                    zoomOut.disabled = currentZoom <= minZoom;
                    zoomIn.disabled = currentZoom >= maxZoom;
                }
                
                function zoomIn() {
                    if (currentZoom < maxZoom) {
                        const newZoom = Math.min(currentZoom * 1.2, maxZoom);
                        applyZoom(newZoom);
                    }
                }
                
                function zoomOut() {
                    if (currentZoom > minZoom) {
                        const newZoom = Math.max(currentZoom / 1.2, minZoom);
                        applyZoom(newZoom);
                    }
                }
                
                function resetZoom() {
                    applyZoom(1);
                }
                
                function applyZoom(scale) {
                    if (svg && zoom) {
                        const containerRect = document.getElementById('flowContainer').getBoundingClientRect();
                        const centerX = containerRect.width / 2;
                        const centerY = containerRect.height / 2;
                        
                        svg.transition()
                            .duration(300)
                            .call(zoom.transform, d3.zoomIdentity.translate(centerX, centerY).scale(scale).translate(-centerX, -centerY));
                    }
                }
                
                // Handle window resize
                window.addEventListener('resize', () => {
                    if (svg) {
                        const containerRect = document.getElementById('flowContainer').getBoundingClientRect();
                        svg.attr('width', containerRect.width).attr('height', containerRect.height);
                        if (simulation) {
                            simulation.force('center', d3.forceCenter(containerRect.width / 2, containerRect.height / 2));
                            simulation.alpha(0.3).restart();
                        }
                    }
                });
            </script>
        </body>
        </html>
    `;
}

module.exports = {
    showPageFlowDiagram,
    getPageFlowPanel,
    closePageFlowView
};

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
                    // Handle refresh request by updating the webview with fresh data
                    const refreshedObjects = modelService.getAllObjects();
                    getWebviewContent(context, refreshedObjects).then(html => {
                        currentPanel.webview.html = html;
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
                
                .legend {
                    display: flex;
                    gap: 20px;
                    margin-top: 10px;
                }
                
                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 12px;
                }
                
                .legend-color {
                    width: 16px;
                    height: 16px;
                    border-radius: 3px;
                    border: 2px solid;
                }
                
                .legend-color.form {
                    border-color: var(--vscode-charts-green);
                }
                
                .legend-color.report {
                    border-color: var(--vscode-charts-orange);
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">Page Flow Diagram</div>
                <div class="controls">
                    <button class="btn" onclick="refreshDiagram()">Refresh</button>
                    <button class="btn" onclick="autoLayout()">Auto Layout</button>
                </div>
            </div>
            
            <div class="role-filter">
                <div class="role-filter-title">Filter by Role:</div>
                <div class="role-filter-options" id="roleFilterOptions">
                    <!-- Role checkboxes will be populated here -->
                </div>
            </div>
            
            <div class="flow-container" id="flowContainer">
                <svg class="d3-container" id="d3Container"></svg>
            </div>
            
            <div class="info-panel">
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
                        <div class="stat-number" id="totalConnections">0</div>
                        <div class="stat-label">Connections</div>
                    </div>
                </div>
                
                <div class="legend">
                    <div class="legend-item">
                        <div class="legend-color form"></div>
                        <span>Forms (Object Workflows with isPage="true")</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color report"></div>
                        <span>Reports (with isPage="true")</span>
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
                
                // Debug information
                console.log('[DEBUG] Flow data received in webview:', flowData);
                console.log('[DEBUG] Pages count:', flowData.pages ? flowData.pages.length : 0);
                console.log('[DEBUG] Connections count:', flowData.connections ? flowData.connections.length : 0);
                
                // Initialize the diagram
                document.addEventListener('DOMContentLoaded', function() {
                    populateRoleFilter();
                    initializeD3();
                    renderDiagram();
                });
                
                function populateRoleFilter() {
                    const roleFilterOptions = document.getElementById('roleFilterOptions');
                    const roles = [...new Set(flowData.pages.map(page => page.roleRequired).filter(role => role))];
                    
                    // Add "Public Pages" option for pages without role requirements
                    const hasPublicPages = flowData.pages.some(page => !page.roleRequired);
                    
                    // Create "All Roles" checkbox
                    const allRolesItem = document.createElement('div');
                    allRolesItem.className = 'role-checkbox-item';
                    allRolesItem.innerHTML = 
                        '<input type="checkbox" id="role-all" checked onchange="handleAllRolesChange(this)">' +
                        '<label for="role-all">All Roles</label>';
                    roleFilterOptions.appendChild(allRolesItem);
                    
                    if (hasPublicPages) {
                        const publicItem = document.createElement('div');
                        publicItem.className = 'role-checkbox-item';
                        publicItem.innerHTML = 
                            '<input type="checkbox" id="role-PUBLIC" onchange="handleRoleChange(this)">' +
                            '<label for="role-PUBLIC">Public Pages</label>';
                        roleFilterOptions.appendChild(publicItem);
                    }
                    
                    roles.forEach(role => {
                        const roleItem = document.createElement('div');
                        roleItem.className = 'role-checkbox-item';
                        roleItem.innerHTML = 
                            '<input type="checkbox" id="role-' + role + '" onchange="handleRoleChange(this)">' +
                            '<label for="role-' + role + '">' + role + '</label>';
                        roleFilterOptions.appendChild(roleItem);
                    });
                }
                
                function handleAllRolesChange(checkbox) {
                    const allCheckboxes = document.querySelectorAll('.role-checkbox-item input[type="checkbox"]:not(#role-all)');
                    
                    if (checkbox.checked) {
                        // If "All Roles" is checked, uncheck all other checkboxes and clear selected roles
                        allCheckboxes.forEach(cb => cb.checked = false);
                        selectedRoles.clear();
                    }
                    
                    renderDiagram();
                }
                
                function handleRoleChange(checkbox) {
                    const allRolesCheckbox = document.getElementById('role-all');
                    const roleValue = checkbox.id.replace('role-', '');
                    
                    if (checkbox.checked) {
                        // Uncheck "All Roles" when any specific role is selected
                        allRolesCheckbox.checked = false;
                        selectedRoles.add(roleValue);
                    } else {
                        selectedRoles.delete(roleValue);
                        
                        // If no roles are selected, check "All Roles"
                        if (selectedRoles.size === 0) {
                            allRolesCheckbox.checked = true;
                        }
                    }
                    
                    renderDiagram();
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
                    const zoom = d3.zoom()
                        .scaleExtent([0.1, 3])
                        .on('zoom', (event) => {
                            g.attr('transform', event.transform);
                        });
                    
                    svg.call(zoom);
                    
                    // Create main group for zoom/pan
                    g = svg.append('g');
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
                    
                    // Create force simulation
                    simulation = d3.forceSimulation(nodes)
                        .force('link', d3.forceLink(links)
                            .id(d => d.id)
                            .distance(600)  // Very long distances to prevent chain overlap
                            .strength(0.8))  // Very strong link force to maintain chain integrity
                        .force('charge', d3.forceManyBody()
                            .strength(-800)  // Strong repulsion to separate different chains
                            .distanceMin(200))  // Larger minimum distance for better separation
                        .force('center', d3.forceCenter(width / 2, height / 2))
                        .force('collision', d3.forceCollide()
                            .radius(150)  // Large collision radius to prevent overlap
                            .strength(1.0));  // Maximum collision strength
                    
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
                        .attr('class', d => 'page-node ' + d.type)
                        .attr('width', 180)
                        .attr('height', 100)
                        .attr('rx', 8)
                        .attr('ry', 8)
                        .style('fill', 'var(--vscode-editorWidget-background)')
                        .style('stroke', d => d.type === 'form' ? 'var(--vscode-charts-green)' : 'var(--vscode-charts-orange)')
                        .style('stroke-width', 2)
                        .on('click', function(event, d) {
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
                    document.getElementById('totalConnections').textContent = connections.length;
                }
                
                function refreshDiagram() {
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

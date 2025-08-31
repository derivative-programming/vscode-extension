"use strict";
// SEARCH_TAG: hierarchy view for VS Code extension
// This file manages the hierarchy diagram view for data objects

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

let currentPanel = undefined;
let currentContext = undefined;

/**
 * Shows the hierarchy diagram in a webview
 * @param {vscode.ExtensionContext} context Extension context
 * @param {Object} modelService ModelService instance
 */
async function showHierarchyDiagram(context, modelService) {
    // Store context for later use
    currentContext = context;
    
    // Get current model data
    const allObjects = modelService.getAllObjects();
    
    if (!allObjects || allObjects.length === 0) {
        vscode.window.showInformationMessage("No data objects found to display in hierarchy diagram.");
        return;
    }
    
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
        'hierarchyDiagramView',
        'Object Hierarchy Diagram',
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
                case 'showObjectDetails':
                    // Handle showing object details
                    const objectId = message.objectId;
                    const objectName = message.objectName;
                    if (objectName) {
                        // Create a mock tree item to pass to showObjectDetails
                        const mockTreeItem = {
                            label: objectName,
                            contextValue: 'dataObjectItem'
                        };
                        
                        // Call the showObjectDetails function
                        const objectDetailsView = require('./objectDetailsView');
                        objectDetailsView.showObjectDetails(mockTreeItem, modelService, currentContext, 'settings');
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
 * Builds the HTML content for the hierarchy diagram webview
 * @param {vscode.ExtensionContext} context Extension context
 * @param {Array} allObjects Array of all objects from the model
 * @returns {string} HTML content
 */
async function getWebviewContent(context, allObjects) {
    // Build object relationship data structure
    const objectRelationships = buildObjectRelationships(allObjects);
    
    // Create HTML content with D3.js for visualization
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Object Hierarchy Diagram</title>
        <link rel="stylesheet" href="https://unpkg.com/@vscode/codicons@latest/dist/codicon.css" />
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe WPC', 'Segoe UI', system-ui, 'Ubuntu', 'Droid Sans', sans-serif;
                padding: 0;
                margin: 0;
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
            }
            .container {
                height: 100vh;
                display: flex;
                flex-direction: column;
            }
            .toolbar {
                padding: 10px;
                display: flex;
                align-items: center;
                background-color: var(--vscode-panel-background);
            }
            .diagram-container {
                flex: 1;
                overflow: hidden;
            }
            #diagram {
                width: 100%;
                height: 100%;
                overflow: hidden;
            }
            .search-box {
                margin-right: 10px;
                flex: 1;
            }
            .search-box input {
                width: 100%;
                padding: 5px;
                border: 1px solid var(--vscode-input-border);
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
            }
            .button {
                padding: 5px 10px;
                margin-left: 5px;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                cursor: pointer;
            }
            .button:hover {
                background: var(--vscode-button-hoverBackground);
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
            .legend {
                display: flex;
                align-items: center;
                margin-left: 15px;
                font-size: 12px;
            }
            .legend-item {
                display: flex;
                align-items: center;
                margin-right: 10px;
            }
            .legend-color {
                width: 16px;
                height: 16px;
                border: 1px solid var(--vscode-editor-foreground);
                margin-right: 5px;
                border-radius: 2px;
            }
            .legend-color.lookup {
                background-color: #ffa500;
            }
            .checkbox-control {
                display: flex;
                align-items: center;
                margin-left: 15px;
                font-size: 12px;
            }
            .checkbox-control input[type="checkbox"] {
                margin-right: 5px;
            }
            .node {
                cursor: pointer;
            }            .node rect {
                stroke: var(--vscode-editor-foreground);
                stroke-width: 1px;
                /* Removed default fill - will be set by JavaScript */
            }            .node.lookup rect {
                fill: #ffa500 !important;  /* Light orange for lookup items */
                stroke: #ff8c00 !important;  /* Dark orange border */
                stroke-width: 1px !important;
            }
            .node.search-partial rect {
                fill: #90ee90 !important;  /* Light green for partial matches */
                stroke: #32cd32 !important;  /* Lime green border */
                stroke-width: 1px !important;
            }
            .node.search-highlight rect {
                fill: #00ff00 !important;  /* Bright green for exact matches */
                stroke: #228b22 !important;  /* Forest green border */
                stroke-width: 2px !important;
            }
            .node.selected rect {
                fill: var(--vscode-list-activeSelectionBackground) !important;
                stroke: var(--vscode-list-activeSelectionForeground) !important;
                stroke-width: 1.5px !important;
            }
            .node.collapsed rect {
                fill: var(--vscode-panel-background);
            }
            .node.normal rect {
                fill: var(--vscode-editor-background);
            }
            .node text {
                font-size: 12px;
                fill: var(--vscode-editor-foreground);
            }
            .link {
                fill: none;
                stroke: var(--vscode-editor-foreground);
                stroke-opacity: 0.5;
                stroke-width: 1.5px;
            }
            .detail-panel {
                position: absolute;
                right: 20px;
                top: 60px;
                width: 300px;
                background: var(--vscode-panel-background);
                border: 1px solid var(--vscode-panel-border);
                padding: 10px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
                z-index: 100;
                display: none;
                overflow-y: auto;
                max-height: calc(100vh - 80px);
            }
            .detail-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 1px solid var(--vscode-panel-border);
            }
            .detail-panel-title {
                margin: 0;
                font-size: 14px;
                font-weight: bold;
            }
            .detail-panel-close-x {
                background: none;
                border: none;
                color: var(--vscode-foreground);
                cursor: pointer;
                font-size: 16px;
                padding: 2px 6px;
                border-radius: 3px;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
            }
            .detail-panel-close-x:hover {
                background: var(--vscode-button-hoverBackground);
            }
            .detail-panel-footer {
                display: flex;
                justify-content: flex-end;
                align-items: center;
                margin-top: 15px;
                padding-top: 10px;
                border-top: 1px solid var(--vscode-panel-border);
                gap: 10px;
            }
            .detail-panel table {
                width: 100%;
                border-collapse: collapse;
                margin: 5px 0;
            }
            .detail-panel th {
                background: var(--vscode-editor-background);
                color: var(--vscode-foreground);
                font-weight: bold;
                padding: 8px 4px;
                text-align: left;
                border-bottom: 1px solid var(--vscode-panel-border);
                font-size: 12px;
            }
            .detail-panel td {
                padding: 6px 4px;
                border-bottom: 1px solid var(--vscode-panel-border);
                font-size: 11px;
                vertical-align: top;
            }
            .detail-panel .data-type {
                color: var(--vscode-textLink-foreground);
                font-style: italic;
                font-size: 10px;
            }
        </style>
        <script src="https://d3js.org/d3.v7.min.js"></script>
    </head>
    <body>
        <div class="container">
            <div class="toolbar">
                <div class="search-box">
                    <input type="text" id="search" placeholder="Search objects...">
                </div>
                <button id="expand-all" class="icon-button" title="Expand All"><i class="codicon codicon-expand-all"></i></button>
                <button id="collapse-all" class="icon-button" title="Collapse All"><i class="codicon codicon-collapse-all"></i></button>
                <button id="zoom-in" class="icon-button" title="Zoom In"><i class="codicon codicon-zoom-in"></i></button>
                <button id="zoom-out" class="icon-button" title="Zoom Out"><i class="codicon codicon-zoom-out"></i></button>
                <button id="refresh" class="icon-button" title="Refresh Diagram"><i class="codicon codicon-refresh"></i></button>
                <button id="reset-zoom" class="icon-button" title="Reset View"><i class="codicon codicon-home"></i></button>
                <div class="legend">
                    <div class="legend-item">
                        <div class="legend-color lookup"></div>
                        <span>Lookup Data Objects</span>
                    </div>
                </div>
                <div class="checkbox-control">
                    <input type="checkbox" id="show-lookup" checked>
                    <label for="show-lookup">Show All Lookup Data Objects</label>
                </div>
            </div>
            <div class="diagram-container">
                <div id="diagram"></div>
            </div>
            <div id="detail-panel" class="detail-panel">
                <div class="detail-panel-header">
                    <h3 id="detail-title" class="detail-panel-title">Object Details</h3>
                    <button id="close-detail-x" class="detail-panel-close-x" title="Close"><i class="codicon codicon-close"></i></button>
                </div>
                <div id="detail-content"></div>
                <div class="detail-panel-footer">
                    <button id="show-full-details" class="button">Show Full Details</button>
                    <button id="close-detail" class="button">Close</button>
                </div>
            </div>
        </div>

        <script>            (function() {
                // Get VS Code API
                const vscode = acquireVsCodeApi();
                
                // Store the relationship data
                const objectData = ${JSON.stringify(objectRelationships)};
                
                // Initialize variables for the diagram
                let root;
                let svg;
                let g;
                let zoom;
                let i = 0; // Counter for unique node IDs
                let diagonal = d3.linkHorizontal()
                    .x(d => d.y)
                    .y(d => d.x);
                
                // Current selected node
                let selectedNode = null;
                
                // Dimensions
                const margin = {top: 20, right: 120, bottom: 20, left: 120};
                const width = window.innerWidth - margin.left - margin.right;
                const height = window.innerHeight - margin.top - margin.bottom - 50;
                
                // Node size
                const nodeWidth = 150;
                const nodeHeight = 30;
                  // Distance between levels
                const levelDistance = 250;
                
                // Initialize the diagram
                function initDiagram() {
                    // Create hierarchy from data
                    if (objectData.length === 0) {
                        document.getElementById('diagram').innerHTML = '<div style="text-align: center; padding-top: 50px;">No objects found to display in hierarchy.</div>';
                        return;
                    }
                    
                    // Debug: Log all objects to console
                    console.log('All objects:', objectData);
                    
                    // Find the root objects (those without parents or with parent not found in the list)
                    let rootObjects = objectData.filter(obj => !obj.parentName || !objectData.find(o => o.name === obj.parentName));
                    
                    // Debug: Log root objects
                    console.log('Root objects found:', rootObjects);
                    
                    if (rootObjects.length === 0) {
                        // If no root object found, use the first object as root
                        console.log('No root objects found, using first object as root');
                        rootObjects = [objectData[0]];
                    }
                    
                    // Create a super root to handle multiple root objects
                    const superRoot = {
                        name: 'All Objects',
                        children: rootObjects
                    };
                    
                    // Create D3 hierarchy
                    root = d3.hierarchy(superRoot);
                    
                    // Calculate initial positions
                    root.x0 = height / 2;
                    root.y0 = 0;
                    
                    // Create SVG element
                    svg = d3.select('#diagram')
                        .append('svg')
                        .attr('width', '100%')
                        .attr('height', '100%')
                        .append('g')
                        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
                    
                    // Add zoom behavior
                    zoom = d3.zoom()
                        .scaleExtent([0.1, 3])
                        .on('zoom', (event) => {
                            svg.attr('transform', event.transform);
                        });
                    
                    d3.select('#diagram svg').call(zoom);
                    
                    // Initialize the visualization
                    update(root);
                    
                    // Set initial view: zoom out by 10% and center 'All Objects' root node
                    setTimeout(() => {
                        setInitialView();
                    }, 100);
                    
                    // Add event listeners for buttons
                    document.getElementById('expand-all').addEventListener('click', expandAll);
                    document.getElementById('collapse-all').addEventListener('click', collapseAll);
                    document.getElementById('zoom-in').addEventListener('click', zoomIn);
                    document.getElementById('zoom-out').addEventListener('click', zoomOut);
                    document.getElementById('reset-zoom').addEventListener('click', resetViewToInitial);                    document.getElementById('refresh').addEventListener('click', refreshDiagram);
                    document.getElementById('close-detail').addEventListener('click', closeDetailPanel);
                    document.getElementById('close-detail-x').addEventListener('click', closeDetailPanel);
                    document.getElementById('show-full-details').addEventListener('click', showFullDetails);
                    document.getElementById('search').addEventListener('input', searchObjects);
                    document.getElementById('show-lookup').addEventListener('change', toggleLookupItems);
                    
                    // Focus on the search input when the diagram loads
                    document.getElementById('search').focus();
                }
                
                // Update the diagram
                function update(source) {
                    // Compute the new tree layout
                    const tree = d3.tree()
                        .nodeSize([nodeHeight * 2, levelDistance]);
                    
                    tree(root);
                    
                    // Get all nodes and links
                    const nodes = root.descendants();
                    const links = root.links();
                    
                    // Normalize for fixed-depth
                    nodes.forEach(d => {
                        d.y = d.depth * levelDistance;
                    });
                    
                    // Update the nodes
                    const node = svg.selectAll('g.node')
                        .data(nodes, d => d.id || (d.id = ++i));                    // Enter new nodes
                    const nodeEnter = node.enter().append('g')
                        .attr('class', d => {
                            let classes = 'node';
                            
                            // Always add lookup class if it's a lookup item
                            if (d.data.isLookup) classes += ' lookup';
                            
                            // Add status classes with priority order
                            if (d === selectedNode) classes += ' selected';
                            else if (d.searchHighlight) classes += ' search-highlight';  // Exact match
                            else if (d.searchPartial) classes += ' search-partial';     // Partial match
                            else if (d._children) classes += ' collapsed';
                            else classes += ' normal';
                            
                            return classes;
                        })
                        .attr('transform', d => 'translate(' + source.y0 + ',' + source.x0 + ')')
                        .on('click', (event, d) => {
                            // Handle expand/collapse
                            if (d.children) {
                                d._children = d.children;
                                d.children = null;
                            } else if (d._children) {
                                d.children = d._children;
                                d._children = null;
                            }
                            
                            if (d !== root) {
                                // Select this node and show details
                                selectNode(d);
                            }
                            
                            update(d);
                        });                    // Add rectangles for the nodes
                    nodeEnter.append('rect')
                        .attr('width', nodeWidth)
                        .attr('height', nodeHeight)
                        .attr('y', -nodeHeight / 2)
                        .attr('rx', 5)
                        .attr('ry', 5);
                        // Fill color is now handled by CSS classes
                    
                    // Add text labels
                    nodeEnter.append('text')
                        .attr('dy', '0.35em')
                        .attr('x', 10)
                        .text(d => d.data.name)
                        .attr('text-anchor', 'start');
                    
                    // Add expand/collapse indicator
                    nodeEnter.append('text')
                        .attr('dy', '0.35em')
                        .attr('x', nodeWidth - 15)
                        .text(d => {
                            if (d === root) return '';
                            return d._children ? '⊕' : d.children ? '⊖' : '';
                        })
                        .attr('class', 'expander')
                        .attr('text-anchor', 'middle');
                      // Update position for existing nodes
                    const nodeUpdate = nodeEnter.merge(node);
                    
                    nodeUpdate.transition()
                        .duration(500)
                        .attr('transform', d => 'translate(' + d.y + ',' + d.x + ')');
                      // Update CSS classes for all nodes (both new and existing)
                    nodeUpdate.attr('class', d => {
                        let classes = 'node';
                        
                        // Always add lookup class if it's a lookup item
                        if (d.data.isLookup) {
                            classes += ' lookup';
                            console.log('Applying lookup class to:', d.data.name);
                        }
                        
                        // Add status classes with priority order
                        if (d === selectedNode) {
                            classes += ' selected';
                            console.log('Applying selected class to:', d.data.name);
                        } else if (d.searchHighlight) {
                            classes += ' search-highlight';  // Exact match
                            console.log('Applying search-highlight class to:', d.data.name);
                        } else if (d.searchPartial) {
                            classes += ' search-partial';    // Partial match
                            console.log('Applying search-partial class to:', d.data.name);
                        } else if (d._children) {
                            classes += ' collapsed';
                        } else {
                            classes += ' normal';
                        }
                        return classes;
                    });
                    
                    // Update expander indicators for both new and existing nodes
                    nodeUpdate.select('.expander')
                        .text(d => {
                            if (d === root) return '';
                            return d._children ? '⊕' : d.children ? '⊖' : '';
                        });
                    
                    // Remove nodes that are no longer present
                    node.exit().transition()
                        .duration(500)
                        .attr('transform', d => 'translate(' + source.y + ',' + source.x + ')')
                        .remove();
                    
                    // Update links
                    const link = svg.selectAll('path.link')
                        .data(links, d => d.target.id);
                    
                    // Enter new links at parent's previous position
                    link.enter().insert('path', 'g')
                        .attr('class', 'link')
                        .attr('d', () => {
                            const o = {x: source.x0, y: source.y0};
                            return diagonal({source: o, target: o});
                        })
                        .merge(link)
                        .transition()
                        .duration(500)
                        .attr('d', d => {
                            // Adjust source position to end of rectangle
                            const sourceY = d.source.y + nodeWidth;
                            const sourceX = d.source.x;
                            
                            // Use target position as is
                            const targetY = d.target.y;
                            const targetX = d.target.x;
                            
                            return diagonal({
                                source: {x: sourceX, y: sourceY},
                                target: {x: targetX, y: targetY}
                            });
                        });
                    
                    // Remove any old links
                    link.exit().transition()
                        .duration(500)
                        .attr('d', () => {
                            const o = {x: source.x, y: source.y};
                            return diagonal({source: o, target: o});
                        })
                        .remove();
                    
                    // Store the old positions for transition
                    nodes.forEach(d => {
                        d.x0 = d.x;
                        d.y0 = d.y;
                    });
                }
                
                // Expand all nodes
                function expandAll() {
                    expand(root);
                    update(root);
                }
                
                // Expand a node and its children
                function expand(d) {
                    if (d._children) {
                        d.children = d._children;
                        d._children = null;
                        d.children.forEach(expand);
                    }
                }
                
                // Collapse all nodes except the root
                function collapseAll() {
                    collapse(root);
                    update(root);
                }
                
                // Toggle visibility of lookup items
                function toggleLookupItems() {
                    const showLookup = document.getElementById('show-lookup').checked;
                    console.log('Toggle lookup items:', showLookup);
                    
                    // Apply visibility filter to all nodes
                    svg.selectAll('g.node')
                        .style('display', function(d) {
                            // Never hide the root "All Objects" node
                            if (d === root) {
                                return 'block';
                            }
                            
                            // If showLookup is true, show all nodes
                            if (showLookup) {
                                return 'block';
                            }
                            
                            // If showLookup is false, only hide lookup nodes that have no children
                            if (d.data.isLookup) {
                                // Check if this lookup node has any children (visible or collapsed)
                                const hasChildren = (d.children && d.children.length > 0) || (d._children && d._children.length > 0);
                                
                                if (hasChildren) {
                                    // Keep lookup nodes that have children
                                    console.log('Keeping lookup node with children:', d.data.name);
                                    return 'block';
                                } else {
                                    // Hide lookup nodes with no children
                                    console.log('Hiding childless lookup node:', d.data.name);
                                    return 'none';
                                }
                            }
                            
                            // Show all non-lookup nodes
                            return 'block';
                        });
                    
                    // Handle connecting links - hide links where both source and target are hidden
                    svg.selectAll('path.link')
                        .style('display', function(d) {
                            // If showLookup is true, show all links
                            if (showLookup) {
                                return 'block';
                            }
                            
                            // Check if source or target nodes are hidden
                            const sourceNode = svg.selectAll('g.node').filter(node => node === d.source);
                            const targetNode = svg.selectAll('g.node').filter(node => node === d.target);
                            
                            const isSourceHidden = sourceNode.style('display') === 'none';
                            const isTargetHidden = targetNode.style('display') === 'none';
                            
                            // Hide link if either source or target is hidden
                            if (isSourceHidden || isTargetHidden) {
                                return 'none';
                            }
                            
                            return 'block';
                        });
                }
                
                // Collapse a node and its children
                function collapse(d) {
                    if (d.children) {
                        d._children = d.children;
                        d._children.forEach(collapse);
                        d.children = null;
                    }
                }
                
                // Zoom in
                function zoomIn() {
                    d3.select('#diagram svg')
                        .transition()
                        .duration(300)
                        .call(zoom.scaleBy, 1.2);
                }
                
                // Zoom out
                function zoomOut() {
                    d3.select('#diagram svg')
                        .transition()
                        .duration(300)
                        .call(zoom.scaleBy, 1 / 1.2);
                }
                
                // Reset zoom
                function resetZoom() {
                    d3.select('#diagram svg')
                        .transition()
                        .duration(300)
                        .call(zoom.transform, d3.zoomIdentity.translate(margin.left, margin.top));
                }
                
                // Reset view to initial state (comprehensive reset)
                function resetViewToInitial() {
                    console.log('Resetting view to initial state...');
                    
                    // 1. Clear search input and highlights
                    document.getElementById('search').value = '';
                    clearSearchHighlights(root);
                    
                    // 2. Close details panel if open
                    closeDetailPanel();
                    
                    // 3. Reset lookup checkbox to checked (show all lookup items)
                    document.getElementById('show-lookup').checked = true;
                    
                    // 4. Expand all nodes to show full hierarchy
                    expandAll();
                    
                    // 5. Reset zoom and position to initial view
                    setTimeout(() => {
                        setInitialView();
                    }, 100);
                    
                    // 6. Show all lookup items again
                    svg.selectAll('g.node').style('display', 'block');
                    svg.selectAll('path.link').style('display', 'block');
                    
                    console.log('View reset complete - all nodes expanded');
                }
                
                // Center view on a specific node
                function centerViewOnNode(node) {
                    if (!node) return;
                    
                    // Get the current dimensions of the SVG container
                    const svgElement = d3.select('#diagram svg').node();
                    const svgRect = svgElement.getBoundingClientRect();
                    const centerX = svgRect.width / 2;
                    const centerY = svgRect.height / 2;
                    
                    // Calculate translation needed to center the node
                    const translateX = centerX - node.y - margin.left;
                    const translateY = centerY - node.x - margin.top;
                    
                    // Apply the transform to center the node
                    d3.select('#diagram svg')
                        .transition()
                        .duration(500)
                        .call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY));
                }
                
                // Set initial view: zoom out by 10% and center 'All Objects' root node
                function setInitialView() {
                    if (!root) return;
                    
                    // Get the current dimensions of the SVG container
                    const svgElement = d3.select('#diagram svg').node();
                    const svgRect = svgElement.getBoundingClientRect();
                    const centerX = svgRect.width / 2;
                    const centerY = svgRect.height / 2;
                    
                    // Calculate translation needed to center the root node ('All Objects')
                    const translateX = centerX - root.y - margin.left;
                    const translateY = centerY - root.x - margin.top;
                    
                    // Apply initial zoom (0.9 = 10% zoom out) and center the root node
                    const initialScale = 0.9;
                    d3.select('#diagram svg')
                        .transition()
                        .duration(500)
                        .call(zoom.transform, d3.zoomIdentity
                            .scale(initialScale)
                            .translate(translateX, translateY));
                }
                
                // Select a node and display its details
                function selectNode(d) {
                    // Deselect previously selected node
                    if (selectedNode) {                        // Find the DOM element for the previously selected node and update its class
                        svg.selectAll('g.node')
                            .filter(node => node === selectedNode)
                            .attr('class', node => {
                                let classes = 'node';
                                if (node.searchHighlight) {
                                    classes += ' search-highlight';  // Exact match
                                } else if (node.searchPartial) {
                                    classes += ' search-partial';    // Partial match
                                } else if (node._children) {
                                    classes += ' collapsed';
                                } else {
                                    classes += ' normal';
                                }
                                return classes;
                            });
                    }
                    
                    // Select new node
                    selectedNode = d;
                    
                    // Find the DOM element for the newly selected node and apply selected class
                    svg.selectAll('g.node')
                        .filter(node => node === d)
                        .attr('class', 'node selected');
                    
                    console.log('Selected node:', d.data.name);
                    
                    // Show details
                    showDetailPanel(d);
                }
                
                // Show detail panel for the selected node
                function showDetailPanel(d) {
                    if (d === root) return; // Don't show details for the super root
                    
                    const panel = document.getElementById('detail-panel');
                    const title = document.getElementById('detail-title');
                    const content = document.getElementById('detail-content');
                    
                    // Set title
                    title.textContent = d.data.name;
                    
                    // Set content
                    const details = d.data.details || {};
                    let html = '<table style="width: 100%;">';
                    
                    // Add properties
                    if (details.properties && details.properties.length > 0) {
                        html += '<tr><th>Property</th><th>Data Type</th></tr>';
                        details.properties.forEach(prop => {
                            const propName = prop.name || '';
                            const dataType = prop.dataType || 'Unknown';
                            html += '<tr><td>' + propName + '</td><td><span class="data-type">' + dataType + '</span></td></tr>';
                        });
                    }
                    
                    // Add parent and children info
                    html += '<tr><th colspan="2">Relationships</th></tr>';
                    if (details.parentName) {
                        html += '<tr><td>Parent</td><td>' + details.parentName + '</td></tr>';
                    }
                    
                    if (details.children && details.children.length > 0) {
                        html += '<tr><td>Children</td><td>' + details.children.map(c => c.name).join(', ') + '</td></tr>';
                    }
                    
                    html += '</table>';
                    content.innerHTML = html;
                    
                    // Show the panel
                    panel.style.display = 'block';
                }                // Close detail panel
                function closeDetailPanel() {
                    document.getElementById('detail-panel').style.display = 'none';
                    
                    // Deselect the node
                    if (selectedNode) {                        // Find the DOM element for the selected node and restore its appropriate class
                        svg.selectAll('g.node')
                            .filter(node => node === selectedNode)
                            .attr('class', node => {
                                let classes = 'node';
                                if (node.searchHighlight) {
                                    classes += ' search-highlight';  // Exact match
                                } else if (node.searchPartial) {
                                    classes += ' search-partial';    // Partial match
                                } else if (node._children) {
                                    classes += ' collapsed';
                                } else {
                                    classes += ' normal';
                                }
                                return classes;
                            });
                        
                        console.log('Deselected node:', selectedNode.data.name);
                        selectedNode = null;
                    }
                }
                
                // Show full details in the objectDetailsView
                function showFullDetails() {
                    if (!selectedNode || selectedNode === root) return;
                    
                    vscode.postMessage({
                        command: 'showObjectDetails',
                        objectId: selectedNode.data.id,
                        objectName: selectedNode.data.name
                    });
                }
                
                // Refresh the diagram with latest data
                function refreshDiagram() {
                    vscode.postMessage({
                        command: 'refreshDiagram'
                    });
                }
                  // Search for objects by name
                function searchObjects() {
                    const searchText = document.getElementById('search').value.toLowerCase();
                    
                    // Debug logging
                    console.log('Search text:', searchText);
                    
                    // If search is empty, reset to original view
                    if (!searchText) {
                        // Clear search highlighting
                        clearSearchHighlights(root);
                        collapseAll();
                        return;
                    }
                    
                    // Collapse all first to start fresh
                    collapseAll();
                    
                    // Clear previous search highlights
                    clearSearchHighlights(root);
                    
                    let exactMatchNode = null;
                    let matchCount = 0;
                    
                    // Find matching nodes and expand their path
                    function findAndExpandPath(d) {
                        let found = false;
                          // Check if this node matches
                        const nodeName = d.data.name.toLowerCase();
                        if (nodeName.includes(searchText)) {
                            found = true;
                            matchCount++;
                            
                            // Check for exact match vs partial match
                            if (nodeName === searchText) {
                                // Exact match - use bright green
                                d.searchHighlight = true;
                                d.searchPartial = false;
                                if (!exactMatchNode) {
                                    exactMatchNode = d;
                                    console.log('Exact match found:', d.data.name);
                                }
                            } else {
                                // Partial match - use light green
                                d.searchHighlight = false;
                                d.searchPartial = true;
                                console.log('Partial match found:', d.data.name);
                            }
                        }
                        
                        // Check children (both visible and hidden)
                        const children = d.children || d._children || [];
                        
                        // If any child matches, this node's path should be expanded
                        children.forEach(child => {
                            if (findAndExpandPath(child)) {
                                found = true;
                            }
                        });
                        
                        // If this node or any descendant matches, expand path
                        if (found && d._children) {
                            d.children = d._children;
                            d._children = null;
                        }
                        
                        return found;
                    }
                      // Start the search from root
                    findAndExpandPath(root);
                    
                    console.log('Total matches found:', matchCount);
                    console.log('Exact match node:', exactMatchNode ? exactMatchNode.data.name : 'none');
                    
                    // Debug: Log all nodes with search highlighting
                    const highlightedNodes = root.descendants().filter(d => d.searchHighlight);
                    console.log('Nodes with searchHighlight property:', highlightedNodes.map(d => d.data.name));
                    
                    // Update the visualization
                    update(root);
                      // Additional debug: After update, check DOM classes
                    setTimeout(() => {
                        const highlightElements = document.querySelectorAll('.node.search-highlight');
                        console.log('DOM elements with search-highlight class:', highlightElements.length);
                        highlightElements.forEach((el, i) => {
                            const textEl = el.querySelector('text');
                            const textContent = textEl ? textEl.textContent : 'no text';
                            console.log('Highlighted element ' + i + ':', textContent);
                        });
                    }, 100);
                    
                    // Center view on exact match if found (but don't select it)
                    if (exactMatchNode && exactMatchNode !== root) {
                        centerViewOnNode(exactMatchNode);
                    }
                }                // Clear search highlights from all nodes
                function clearSearchHighlights(d) {
                    d.searchHighlight = false;
                    d.searchPartial = false;
                    d.searchSelected = false;
                    
                    // Clear children (both visible and hidden)
                    const children = d.children || d._children || [];
                    children.forEach(child => clearSearchHighlights(child));
                }
                
                // Initialize when the window loads
                window.addEventListener('load', initDiagram);
                
                // Handle window resize
                window.addEventListener('resize', () => {
                    // Only recreate if initialized
                    if (svg) {
                        d3.select('#diagram svg').remove();
                        initDiagram();
                    }
                });
            })();
        </script>
    </body>
    </html>`;
}

/**
 * Builds object relationship data for the hierarchy diagram
 * @param {Array} objects Array of objects from the model
 * @returns {Array} Array of objects with parent-child relationships
 */
function buildObjectRelationships(objects) {
    if (!objects || !Array.isArray(objects) || objects.length === 0) {
        console.log('No objects provided to buildObjectRelationships');
        return [];
    }
    
    console.log('Building relationships for', objects.length, 'objects');
    
    // Create a map of objects by name for quick lookup
    const objectMap = new Map();
      // First pass: populate the map
    objects.forEach(obj => {
        if (obj.name) {
            // Treat empty strings and whitespace-only strings as null (no parent)
            const parentName = obj.parentObjectName && obj.parentObjectName.trim() ? obj.parentObjectName.trim() : null;
            
            objectMap.set(obj.name, {
                name: obj.name,
                id: obj.id || `obj_${Math.random().toString(36).substr(2, 9)}`,
                parentName: parentName,
                isLookup: obj.isLookup === "true", // Convert string to boolean
                children: [],
                details: {
                    properties: obj.prop ? obj.prop.map(p => ({ 
                        name: p.name, 
                        value: p.value,
                        dataType: p.sqlServerDBDataType || p.dataType || 'Unknown'
                    })) : [],
                    parentName: parentName,
                    isLookup: obj.isLookup === "true",
                    children: []
                }
            });
        }
    });    // Second pass: build parent-child relationships using only parentObjectName property
    objectMap.forEach(obj => {
        if (obj.parentName && objectMap.has(obj.parentName)) {
            const parent = objectMap.get(obj.parentName);
            parent.children.push(obj);
            parent.details.children.push({ name: obj.name, id: obj.id });
            console.log(`Added ${obj.name} as child of ${parent.name}`);
        } else if (obj.parentName) {
            console.log(`Parent '${obj.parentName}' not found for object '${obj.name}'`);
        } else {
            console.log(`Object '${obj.name}' has no parent - will be root object`);
        }
    });
    
    // Convert map values to array
    const result = Array.from(objectMap.values());
    console.log('Final relationship data:', result);
    return result;
}

/**
 * Gets the current hierarchy panel data if open
 * @returns {Object|null} Object with context and modelService if panel is open, null otherwise
 */
function getHierarchyPanel() {
    if (currentPanel && !currentPanel._disposed) {
        return {
            context: currentContext,
            modelService: null // modelService is passed to showHierarchyDiagram, not stored globally
        };
    }
    return null;
}

/**
 * Closes the hierarchy view panel
 */
function closeHierarchyView() {
    if (currentPanel) {
        currentPanel.dispose();
        currentPanel = undefined;
    }
}

module.exports = {
    showHierarchyDiagram,
    closeHierarchyView,
    getHierarchyPanel
};
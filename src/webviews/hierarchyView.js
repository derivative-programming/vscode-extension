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
                        objectDetailsView.showObjectDetails(mockTreeItem, modelService);
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
            .node {
                cursor: pointer;
            }
            .node rect {
                stroke: var(--vscode-editor-foreground);
                stroke-width: 1px;
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
        </style>
        <script src="https://d3js.org/d3.v7.min.js"></script>
    </head>
    <body>
        <div class="container">
            <div class="toolbar">
                <div class="search-box">
                    <input type="text" id="search" placeholder="Search objects...">
                </div>
                <button id="expand-all" class="button">Expand All</button>
                <button id="collapse-all" class="button">Collapse All</button>
                <button id="zoom-in" class="button">+</button>
                <button id="zoom-out" class="button">-</button>
                <button id="reset-zoom" class="button">Reset</button>
            </div>
            <div class="diagram-container">
                <div id="diagram"></div>
            </div>
            <div id="detail-panel" class="detail-panel">
                <h3 id="detail-title">Object Details</h3>
                <div id="detail-content"></div>
                <button id="close-detail" class="button">Close</button>
                <button id="show-full-details" class="button">Show Full Details</button>
            </div>
        </div>

        <script>
            (function() {
                // Get VS Code API
                const vscode = acquireVsCodeApi();
                
                // Store the relationship data
                const objectData = ${JSON.stringify(objectRelationships)};
                
                // Initialize variables for the diagram
                let root;
                let svg;
                let g;
                let zoom;
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
                        document.getElementById('diagram').innerHTML = '<div style="text-align: center; padding-top: 50px;">No objects found with parent-child relationships.</div>';
                        return;
                    }
                    
                    // Find the root objects (those without parents or with parent not found in the list)
                    let rootObjects = objectData.filter(obj => !obj.parentName || !objectData.find(o => o.name === obj.parentName));
                    
                    if (rootObjects.length === 0) {
                        // If no root object found, use the first object as root
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
                    
                    // Add event listeners for buttons
                    document.getElementById('expand-all').addEventListener('click', expandAll);
                    document.getElementById('collapse-all').addEventListener('click', collapseAll);
                    document.getElementById('zoom-in').addEventListener('click', zoomIn);
                    document.getElementById('zoom-out').addEventListener('click', zoomOut);
                    document.getElementById('reset-zoom').addEventListener('click', resetZoom);
                    document.getElementById('close-detail').addEventListener('click', closeDetailPanel);
                    document.getElementById('show-full-details').addEventListener('click', showFullDetails);
                    document.getElementById('search').addEventListener('input', searchObjects);
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
                        .data(nodes, d => d.id || (d.id = ++i));
                    
                    // Enter new nodes
                    const nodeEnter = node.enter().append('g')
                        .attr('class', 'node')
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
                        });
                    
                    // Add rectangles for the nodes
                    nodeEnter.append('rect')
                        .attr('width', nodeWidth)
                        .attr('height', nodeHeight)
                        .attr('y', -nodeHeight / 2)
                        .attr('rx', 5)
                        .attr('ry', 5);
                    
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
                    
                    nodeUpdate.select('rect')
                        .attr('fill', d => {
                            if (d === selectedNode) return 'var(--vscode-list-activeSelectionBackground)';
                            return d._children ? 'var(--vscode-panel-background)' : 'var(--vscode-editor-background)';
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
                    const currentTransform = d3.zoomTransform(d3.select('#diagram svg').node());
                    d3.select('#diagram svg')
                        .transition()
                        .duration(300)
                        .call(zoom.transform, currentTransform.scale(currentTransform.k * 1.2));
                }
                
                // Zoom out
                function zoomOut() {
                    const currentTransform = d3.zoomTransform(d3.select('#diagram svg').node());
                    d3.select('#diagram svg')
                        .transition()
                        .duration(300)
                        .call(zoom.transform, currentTransform.scale(currentTransform.k / 1.2));
                }
                
                // Reset zoom
                function resetZoom() {
                    d3.select('#diagram svg')
                        .transition()
                        .duration(300)
                        .call(zoom.transform, d3.zoomIdentity.translate(margin.left, margin.top));
                }
                
                // Select a node and display its details
                function selectNode(d) {
                    // Deselect previously selected node
                    if (selectedNode) {
                        d3.select(d3.select(selectedNode).node().parentNode)
                            .select('rect')
                            .attr('fill', d => d._children ? 'var(--vscode-panel-background)' : 'var(--vscode-editor-background)');
                    }
                    
                    // Select new node
                    selectedNode = d;
                    d3.select(d3.select(d).node().parentNode)
                        .select('rect')
                        .attr('fill', 'var(--vscode-list-activeSelectionBackground)');
                    
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
                        html += '<tr><th colspan="2">Properties</th></tr>';
                        details.properties.forEach(prop => {
                            html += '<tr><td>' + prop.name + '</td><td>' + (prop.value || '') + '</td></tr>';
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
                }
                
                // Close detail panel
                function closeDetailPanel() {
                    document.getElementById('detail-panel').style.display = 'none';
                    
                    // Deselect the node
                    if (selectedNode) {
                        d3.select(d3.select(selectedNode).node().parentNode)
                            .select('rect')
                            .attr('fill', d => d._children ? 'var(--vscode-panel-background)' : 'var(--vscode-editor-background)');
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
                
                // Search for objects by name
                function searchObjects() {
                    const searchText = document.getElementById('search').value.toLowerCase();
                    
                    // If search is empty, reset to original view
                    if (!searchText) {
                        collapseAll();
                        return;
                    }
                    
                    // Collapse all first to start fresh
                    collapseAll();
                    
                    // Find matching nodes and expand their path
                    function findAndExpandPath(d) {
                        let found = false;
                        
                        // Check if this node matches
                        if (d.data.name.toLowerCase().includes(searchText)) {
                            found = true;
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
                    
                    // Update the visualization
                    update(root);
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
        return [];
    }
    
    // Create a map of objects by name for quick lookup
    const objectMap = new Map();
    
    // First pass: populate the map
    objects.forEach(obj => {
        if (obj.name) {
            objectMap.set(obj.name, {
                name: obj.name,
                id: obj.id || `obj_${Math.random().toString(36).substr(2, 9)}`,
                parentName: obj.parentObjectName || null,
                children: [],
                details: {
                    properties: obj.prop ? obj.prop.map(p => ({ name: p.name, value: p.value })) : [],
                    parentName: obj.parentObjectName || null,
                    children: []
                }
            });
        }
    });
    
    // Second pass: build parent-child relationships
    objectMap.forEach(obj => {
        if (obj.parentName && objectMap.has(obj.parentName)) {
            const parent = objectMap.get(obj.parentName);
            parent.children.push(obj);
            parent.details.children.push({ name: obj.name, id: obj.id });
        }
    });
    
    // Also consider explicit childObject arrays
    objects.forEach(obj => {
        if (obj.name && obj.childObject && Array.isArray(obj.childObject)) {
            const parentObj = objectMap.get(obj.name);
            
            if (parentObj) {
                obj.childObject.forEach(child => {
                    if (child.name && objectMap.has(child.name)) {
                        const childObj = objectMap.get(child.name);
                        
                        // Only add if not already a child
                        if (!parentObj.children.find(c => c.name === childObj.name)) {
                            parentObj.children.push(childObj);
                            parentObj.details.children.push({ name: childObj.name, id: childObj.id });
                            
                            // Set parent relationship if not already set
                            if (!childObj.parentName) {
                                childObj.parentName = parentObj.name;
                                childObj.details.parentName = parentObj.name;
                            }
                        }
                    }
                });
            }
        }
    });
    
    // Convert map values to array
    return Array.from(objectMap.values());
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
    closeHierarchyView
};
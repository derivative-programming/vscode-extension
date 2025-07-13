// diagramRenderer.js
// D3.js diagram rendering logic for page flow diagram
// Created: July 13, 2025

"use strict";

// Global variables for D3 components
let simulation;
let svg;
let g;
let zoom;

// Initialize D3 components
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
    const minZoom = 0.1;
    const maxZoom = 3;
    
    zoom = d3.zoom()
        .scaleExtent([minZoom, maxZoom])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
            window.pageflowDiagram.currentZoom = event.transform.k;
            window.pageflowDiagram.updateZoomDisplay();
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

// Render force-directed layout
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
            .strength(1.0));  // Maximum collision strength to enforce separation
    
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
            window.pageflowDiagram.hideTooltip();
            if (d.type === 'form') {
                window.pageflowDiagram.vscode.postMessage({
                    command: 'showFormDetails',
                    formName: d.name,
                    objectName: d.objectName
                });
            } else if (d.type === 'report') {
                window.pageflowDiagram.vscode.postMessage({
                    command: 'showReportDetails',
                    reportName: d.name,
                    objectName: d.objectName
                });
            }
        })
        .on('mouseover', function(event, d) {
            window.pageflowDiagram.showTooltip(event, d);
        })
        .on('mousemove', function(event, d) {
            window.pageflowDiagram.updateTooltipPosition(event);
        })
        .on('mouseout', function(event, d) {
            window.pageflowDiagram.hideTooltip();
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
        if (!event.active) {
            simulation.alphaTarget(0.3).restart();
        }
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    function dragended(event, d) {
        if (!event.active) {
            simulation.alphaTarget(0);
        }
        d.fx = null;
        d.fy = null;
    }
}

// Clear previous diagram content
function clearDiagram() {
    if (g) {
        g.selectAll('*').remove();
    }
}

// Export functions for use in main script
window.pageflowRenderer = {
    initializeD3,
    renderForceDirectedLayout,
    clearDiagram,
    getPageNodeClass
};

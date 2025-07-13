// htmlGenerator.js
// HTML template generation for page flow diagram (simplified)
// Created: July 13, 2025

"use strict";

/**
 * Generates the HTML content for the page flow diagram webview
 * @param {Object} flowMap Flow map data
 * @returns {string} HTML content
 */
function generateHTMLContent(flowMap) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Flow Diagram</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        ${getEmbeddedCSS()}
    </style>
</head>
<body>
    ${generateBodyContent(flowMap)}
    
    <script>
        ${getEmbeddedJavaScript(flowMap)}
    </script>
</body>
</html>`;
}

/**
 * Gets embedded CSS content
 * @returns {string} CSS content
 */
function getEmbeddedCSS() {
    return `
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
            stroke: var(--vscode-charts-blue);
            stroke-width: 4;
            fill: #e3f2fd;
        }
        
        .page-node.report-grid {
            stroke: var(--vscode-charts-orange);
            stroke-width: 4;
            fill: #fff3e0;
        }
        
        .page-node.report-navigation {
            stroke: var(--vscode-charts-purple);
            stroke-width: 4;
            fill: #f3e5f5;
        }
        
        .page-node.report-detail {
            stroke: var(--vscode-charts-red);
            stroke-width: 4;
            fill: #ffebee;
        }
        
        .page-node.report-other {
            stroke: var(--vscode-charts-yellow);
            stroke-width: 4;
            fill: #fffde7;
        }
        
        /* Dark mode adjustments */
        body.vscode-dark .page-node.form {
            fill: #1e3a8a;
        }
        
        body.vscode-dark .page-node.report-grid {
            fill: #ea580c;
        }
        
        body.vscode-dark .page-node.report-navigation {
            fill: #7c3aed;
        }
        
        body.vscode-dark .page-node.report-detail {
            fill: #dc2626;
        }
        
        body.vscode-dark .page-node.report-other {
            fill: #ca8a04;
        }
        
        /* Search highlighting styles */
        .page-node.search-partial {
            fill: #90ee90 !important;
            stroke: #32cd32 !important;
            stroke-width: 3px !important;
        }
        
        .page-node.search-highlight {
            fill: #00ff00 !important;
            stroke: #228b22 !important;
            stroke-width: 4px !important;
        }
        
        body.vscode-dark .page-node.search-partial {
            fill: #4ade80 !important;
            stroke: #16a34a !important;
        }
        
        body.vscode-dark .page-node.search-highlight {
            fill: #22c55e !important;
            stroke: #15803d !important;
        }
        
        .page-text {
            font-family: var(--vscode-font-family);
            font-size: 13px;
            fill: var(--vscode-editor-foreground);
            text-anchor: middle;
            dominant-baseline: middle;
            pointer-events: none;
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
        }
        
        .tabs {
            display: flex;
            border-bottom: 1px solid var(--vscode-panel-border);
            margin-bottom: 15px;
            background-color: var(--vscode-editorWidget-background);
        }
        
        .tab {
            padding: 12px 20px;
            cursor: pointer;
            border: none;
            background: none;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            font-size: 13px;
            font-weight: 500;
            border-bottom: 3px solid transparent;
            transition: all 0.2s ease;
            user-select: none;
        }
        
        .tab:hover {
            background-color: var(--vscode-toolbar-hoverBackground);
        }
        
        .tab.active {
            color: var(--vscode-focusBorder);
            border-bottom-color: var(--vscode-focusBorder);
            background-color: var(--vscode-tab-activeBackground);
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
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
        
        .empty-state {
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground);
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
    `;
}

/**
 * Gets embedded JavaScript content
 * @param {Object} flowMap Flow map data
 * @returns {string} JavaScript content
 */
function getEmbeddedJavaScript(flowMap) {
    return `
        const vscode = acquireVsCodeApi();
        const flowData = ${JSON.stringify(flowMap)};
        let simulation;
        let svg;
        let g;
        let zoom;
        let selectedRoles = new Set();
        let currentZoom = 1;

        // Initialize everything when DOM is ready
        document.addEventListener('DOMContentLoaded', function() {
            console.log('[DEBUG] Flow data received:', flowData);
            initializeD3();
            populateRoleFilter();
            renderDiagram();
            updateZoomDisplay();
            
            document.getElementById('searchPages').addEventListener('input', searchPages);
        });

        // Initialize D3 components
        function initializeD3() {
            const container = d3.select('#d3Container');
            const containerRect = document.getElementById('flowContainer').getBoundingClientRect();
            
            svg = container
                .attr('width', containerRect.width)
                .attr('height', containerRect.height);
            
            // Create arrow marker
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
                .scaleExtent([0.1, 3])
                .on('zoom', (event) => {
                    g.attr('transform', event.transform);
                    currentZoom = event.transform.k;
                    updateZoomDisplay();
                });
            
            svg.call(zoom);
            g = svg.append('g');
        }

        // Populate role filter
        function populateRoleFilter() {
            const roleFilterOptions = document.getElementById('roleFilterOptions');
            const roles = [...new Set(flowData.pages.map(page => page.roleRequired).filter(role => role))];
            
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

        // Handle role changes
        function handleRoleChange(checkbox) {
            const roleValue = checkbox.id.replace('role-', '');
            
            if (checkbox.checked) {
                selectedRoles.add(roleValue);
            } else {
                selectedRoles.delete(roleValue);
            }
            
            renderDiagram();
        }

        // Search functionality
        function searchPages() {
            const searchText = document.getElementById('searchPages').value.toLowerCase();
            
            flowData.pages.forEach(page => {
                const pageName = page.name.toLowerCase();
                const pageTitle = (page.titleText || '').toLowerCase();
                
                if (!searchText.trim()) {
                    page.searchHighlight = false;
                    page.searchPartial = false;
                } else if (pageName === searchText || pageTitle === searchText) {
                    page.searchHighlight = true;
                    page.searchPartial = false;
                } else if (pageName.includes(searchText) || pageTitle.includes(searchText)) {
                    page.searchHighlight = false;
                    page.searchPartial = true;
                } else {
                    page.searchHighlight = false;
                    page.searchPartial = false;
                }
            });
            
            renderDiagram();
        }

        // Get CSS class for page node
        function getPageNodeClass(page) {
            let baseClass = '';
            
            if (page.type === 'form') {
                baseClass = 'page-node form';
            } else if (page.type === 'report') {
                const vizType = (page.visualizationType || 'grid').toLowerCase();
                switch (vizType) {
                    case 'grid':
                    case 'table':
                        baseClass = 'page-node report-grid';
                        break;
                    case 'navigation':
                    case 'twocolumn':
                    case 'two column':
                        baseClass = 'page-node report-navigation';
                        break;
                    case 'detail':
                    case 'threecolumn':
                    case 'three column':
                        baseClass = 'page-node report-detail';
                        break;
                    default:
                        baseClass = 'page-node report-other';
                        break;
                }
            } else {
                baseClass = 'page-node';
            }
            
            if (page.searchHighlight) {
                baseClass += ' search-highlight';
            } else if (page.searchPartial) {
                baseClass += ' search-partial';
            }
            
            return baseClass;
        }

        // Main render function
        function renderDiagram() {
            g.selectAll('*').remove();
            
            let filteredPages = flowData.pages;
            if (selectedRoles.size > 0) {
                filteredPages = flowData.pages.filter(page => {
                    if (selectedRoles.has('PUBLIC') && !page.roleRequired) {
                        return true;
                    }
                    return page.roleRequired && selectedRoles.has(page.roleRequired);
                });
            }
            
            if (filteredPages.length === 0) {
                showEmptyState();
                return;
            }
            
            const filteredConnections = flowData.connections.filter(conn => 
                filteredPages.some(page => page.name === conn.from) &&
                filteredPages.some(page => page.name === conn.to)
            );
            
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
            
            renderForceDirectedLayout(nodes, links);
        }

        // Force-directed layout
        function renderForceDirectedLayout(nodes, links) {
            const containerRect = document.getElementById('flowContainer').getBoundingClientRect();
            const width = containerRect.width;
            const height = containerRect.height;
            
            simulation = d3.forceSimulation(nodes)
                .force('link', d3.forceLink(links).id(d => d.id).distance(200).strength(0.1))
                .force('charge', d3.forceManyBody().strength(-150))
                .force('center', d3.forceCenter(width / 2, height / 2))
                .force('collision', d3.forceCollide().radius(120).strength(1.0));
            
            const link = g.append('g')
                .selectAll('line')
                .data(links)
                .enter().append('line')
                .attr('class', 'connection-line');
            
            const node = g.append('g')
                .selectAll('g')
                .data(nodes)
                .enter().append('g')
                .call(d3.drag()
                    .on('start', dragstarted)
                    .on('drag', dragged)
                    .on('end', dragended));
            
            node.append('rect')
                .attr('class', d => getPageNodeClass(d))
                .attr('width', 180)
                .attr('height', 100)
                .attr('rx', 8)
                .attr('ry', 8)
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
            
            node.append('text')
                .attr('class', 'page-text')
                .attr('x', 90)
                .attr('y', 25)
                .style('font-size', '11px')
                .text(d => d.type.toUpperCase());
            
            node.append('text')
                .attr('class', 'page-text')
                .attr('x', 90)
                .attr('y', 45)
                .style('font-size', '14px')
                .style('font-weight', 'bold')
                .text(d => d.titleText.length > 20 ? d.titleText.substring(0, 20) + '...' : d.titleText);
            
            node.append('text')
                .attr('class', 'page-text')
                .attr('x', 90)
                .attr('y', 65)
                .style('font-size', '11px')
                .text(d => 'Object: ' + (d.objectName.length > 12 ? d.objectName.substring(0, 12) + '...' : d.objectName));
            
            simulation.on('tick', () => {
                link
                    .attr('x1', d => d.source.x + 90)
                    .attr('y1', d => d.source.y + 50)
                    .attr('x2', d => d.target.x + 90)
                    .attr('y2', d => d.target.y + 50);
                
                node.attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');
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

        // Empty state
        function showEmptyState() {
            const container = document.getElementById('flowContainer');
            container.innerHTML = '<div class="empty-state"><h3>No Pages Found</h3><p>No pages match the current filter criteria.</p></div>';
        }

        // Zoom controls
        function updateZoomDisplay() {
            const zoomDisplay = document.getElementById('zoomLevel');
            if (zoomDisplay) {
                zoomDisplay.textContent = Math.round(currentZoom * 100) + '%';
            }
        }

        function zoomIn() {
            const currentTransform = d3.zoomTransform(svg.node());
            const newScale = Math.min(currentTransform.k * 1.2, 3);
            svg.transition().duration(300).call(
                zoom.transform,
                d3.zoomIdentity.translate(currentTransform.x, currentTransform.y).scale(newScale)
            );
        }

        function zoomOut() {
            const currentTransform = d3.zoomTransform(svg.node());
            const newScale = Math.max(currentTransform.k / 1.2, 0.1);
            svg.transition().duration(300).call(
                zoom.transform,
                d3.zoomIdentity.translate(currentTransform.x, currentTransform.y).scale(newScale)
            );
        }

        function resetZoom() {
            svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
        }

        function refreshDiagram() {
            vscode.postMessage({ command: 'refreshDiagram' });
        }

        function switchTab(tabName) {
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            document.querySelector('[onclick="switchTab(\'' + tabName + '\')"]').classList.add('active');
            document.getElementById(tabName).classList.add('active');
        }
    `;
}

/**
 * Generates the body content for the HTML template
 * @param {Object} flowMap Flow map data
 * @returns {string} Body HTML content
 */
function generateBodyContent(flowMap) {
    return `<div class="header">
        <div class="title">Page Flow Diagram</div>
        <div class="controls">
            <div class="zoom-controls">
                <button class="zoom-btn" onclick="zoomOut()" title="Zoom Out">−</button>
                <span class="zoom-level" id="zoomLevel">100%</span>
                <button class="zoom-btn" onclick="zoomIn()" title="Zoom In">+</button>
                <button class="zoom-btn" onclick="resetZoom()" title="Reset Zoom">⌂</button>
            </div>
            <button class="btn" onclick="refreshDiagram()">Refresh</button>
        </div>
    </div>
    
    <div class="tabs">
        <button class="tab active" onclick="switchTab('diagram')">Diagram</button>
        <button class="tab" onclick="switchTab('statistics')">Statistics</button>
    </div>
    
    <div id="diagram" class="tab-content active">
        <div class="search-box">
            <input type="text" id="searchPages" placeholder="Search pages by name or title..." />
        </div>
        
        <div class="role-filter">
            <div class="role-filter-title">Filter by Role:</div>
            <div class="role-filter-options" id="roleFilterOptions">
                <!-- Role checkboxes will be populated by JavaScript -->
            </div>
        </div>
        
        <div class="flow-container" id="flowContainer">
            <svg id="d3Container" class="d3-container"></svg>
        </div>
    </div>
    
    <div id="statistics" class="tab-content">
        <div class="stats">
            <div class="stat">
                <div class="stat-number">${flowMap.pages ? flowMap.pages.length : 0}</div>
                <div class="stat-label">Total Pages</div>
            </div>
            <div class="stat">
                <div class="stat-number">${flowMap.connections ? flowMap.connections.length : 0}</div>
                <div class="stat-label">Connections</div>
            </div>
        </div>
    </div>`;
}

module.exports = {
    generateHTMLContent,
    generateBodyContent,
    getEmbeddedCSS,
    getEmbeddedJavaScript
};

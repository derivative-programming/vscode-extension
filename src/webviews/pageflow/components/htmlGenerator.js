// htmlGenerator.js
// HTML template generation for page flow diagram (simplified)
// Created: July 13, 2025

"use strict";

/**
 * Generates the HTML content for the page flow diagram webview
 * @param {Object} flowMap Flow map data
 * @param {string} appName App name from the model
 * @returns {string} HTML content
 */
function generateHTMLContent(flowMap, appName = '') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Flow Diagram</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
    <style>
        ${getEmbeddedCSS()}
    </style>
</head>
<body>
    ${generateBodyContent(flowMap)}
    
    <script>
        ${getEmbeddedJavaScript(flowMap, appName)}
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
            cursor: grab;
        }
        
        .flow-container:active {
            cursor: grabbing;
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
        
        .mermaid-container {
            width: 100%;
            min-height: 500px;
            background-color: var(--vscode-editor-background);
            overflow: visible;
            text-align: center;
            padding: 20px;
            box-sizing: border-box;
            position: relative;
            transition: transform 0.2s ease; /* Improved transition for smoother zoom/pan */
            transform-origin: 0 0; /* Set transform origin to top-left for better pan behavior */
        }
        
        .mermaid-controls {
            margin-bottom: 15px;
            display: flex;
            gap: 10px;
            align-items: center;
            justify-content: center;
        }
        
        .mermaid-header-controls {
            margin-bottom: 15px;
        }
        
        .mermaid-filter-controls {
            margin-top: 15px;
        }
        
        .mermaid-type-controls {
            margin-bottom: 15px;
            padding: 10px;
            background-color: var(--vscode-editorWidget-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
        }
        
        .mermaid-type-title {
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 8px;
            color: var(--vscode-editor-foreground);
        }
        
        .mermaid-type-select {
            width: 100%;
            max-width: 250px;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: var(--vscode-font-family);
            font-size: 13px;
            cursor: pointer;
        }
        
        .mermaid-type-select:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        
        .mermaid-container {
            transform-origin: 0 0; /* Changed to top-left for more predictable behavior */
            transition: transform 0.15s ease; /* Reduced transition time for more responsive feel */
            margin: 0 auto;
            text-align: center;
        }
        
        .mermaid-viewport {
            width: 100%;
            height: 80vh;
            overflow: hidden;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            background-color: var(--vscode-editor-background);
            position: relative;
            cursor: grab;
            margin: 0 auto;
            text-align: center;
        }
        
        .mermaid-viewport::-webkit-scrollbar {
            width: 12px;
            height: 12px;
        }
        
        .mermaid-viewport::-webkit-scrollbar-track {
            background: var(--vscode-scrollbarSlider-background);
            border-radius: 6px;
        }
        
        .mermaid-viewport::-webkit-scrollbar-thumb {
            background: var(--vscode-scrollbarSlider-background);
            border-radius: 6px;
        }
        
        .mermaid-viewport::-webkit-scrollbar-thumb:hover {
            background: var(--vscode-scrollbarSlider-hoverBackground);
        }
        
        .mermaid-syntax {
            margin-top: 20px;
            background-color: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 15px;
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
            white-space: pre-wrap;
            overflow-x: auto;
            max-height: 300px;
            color: var(--vscode-textPreformat-foreground);
        }
        
        .diagram-controls {
            margin-bottom: 15px;
        }
        
        .control-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 20px;
            margin-bottom: 15px;
        }
        
        .control-row .role-filter {
            flex: 1;
            margin-bottom: 0;
        }
        
        .control-row .zoom-controls {
            flex-shrink: 0;
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
        
        .info-panel {
            padding: 20px;
            background-color: var(--vscode-editorWidget-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            margin-bottom: 20px;
        }
        
        .info-panel-title {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 20px;
            color: var(--vscode-editor-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 10px;
        }
        
        .info-panel h4 {
            color: var(--vscode-editor-foreground);
            margin: 20px 0 10px 0;
            font-size: 1.1em;
            border-left: 3px solid var(--vscode-focusBorder);
            padding-left: 10px;
        }
        
        .info-panel ul {
            margin: 10px 0 0 20px;
            padding: 0;
        }
        
        .info-panel li {
            margin: 5px 0;
            color: var(--vscode-editor-foreground);
        }
        
        .info-panel p {
            color: var(--vscode-descriptionForeground);
            margin: 10px 0;
            font-style: italic;
        }
        
        .tooltip {
            position: absolute;
            background-color: var(--vscode-editorWidget-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 12px;
            color: var(--vscode-editor-foreground);
            pointer-events: none;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            max-width: 300px;
            word-wrap: break-word;
            opacity: 0;
            transition: opacity 0.2s ease;
        }
        
        .tooltip.visible {
            opacity: 1;
        }
        
        .tooltip .tooltip-title {
            font-weight: bold;
            margin-bottom: 4px;
            color: var(--vscode-focusBorder);
        }
        
        .tooltip .tooltip-detail {
            margin: 2px 0;
            font-size: 11px;
        }
        
        .legend-items {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin: 15px 0;
            padding: 15px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 4px;
            border: 2px solid transparent;
            flex-shrink: 0;
        }
        
        .legend-color.form {
            background-color: #e3f2fd;
            border-color: var(--vscode-charts-blue);
        }
        
        .legend-color.report-grid {
            background-color: #fff3e0;
            border-color: var(--vscode-charts-orange);
        }
        
        .legend-color.report-navigation {
            background-color: #f3e5f5;
            border-color: var(--vscode-charts-purple);
        }
        
        .legend-color.report-detail {
            background-color: #ffebee;
            border-color: var(--vscode-charts-red);
        }
        
        .legend-color.report-other {
            background-color: #fffde7;
            border-color: var(--vscode-charts-yellow);
        }
        
        /* Dark mode legend colors */
        body.vscode-dark .legend-color.form {
            background-color: #1e3a8a;
        }
        
        body.vscode-dark .legend-color.report-grid {
            background-color: #ea580c;
        }
        
        body.vscode-dark .legend-color.report-navigation {
            background-color: #7c3aed;
        }
        
        body.vscode-dark .legend-color.report-detail {
            background-color: #dc2626;
        }
        
        body.vscode-dark .legend-color.report-other {
            background-color: #ca8a04;
        }
        
        .legend-description {
            font-size: 13px;
            color: var(--vscode-editor-foreground);
        }
    `;
}

/**
 * Gets embedded JavaScript content
 * @param {Object} flowMap Flow map data
 * @param {string} appName App name from the model
 * @returns {string} JavaScript content
 */
function getEmbeddedJavaScript(flowMap, appName = '') {
    return `
        const vscode = acquireVsCodeApi();
        const flowData = ${JSON.stringify(flowMap)};
        const appName = '${appName}'; // App name for filename generation
        let simulation;
        let svg;
        let g;
        let zoom;
        let selectedRoles = new Set();
        let currentZoom = 1;
        let mermaidDiagramType = 'flowchart TD'; // Default diagram type

        // Initialize everything when DOM is ready
        document.addEventListener('DOMContentLoaded', function() {
            console.log('[DEBUG] Flow data received:', flowData);
            console.log('[DEBUG] Mermaid library available:', typeof mermaid !== 'undefined');
            console.log('[DEBUG] App name for filename:', appName);
            
            initializeD3();
            populateRoleFilter();
            renderDiagram();
            updateZoomDisplay();
            addKeyboardNavigation();
            
            document.getElementById('searchPages').addEventListener('input', searchPages);
            
            // Check if Mermaid tab is already active and initialize if needed
            const mermaidTab = document.getElementById('mermaid');
            if (mermaidTab && mermaidTab.classList.contains('active')) {
                setTimeout(() => {
                    initializeMermaid();
                }, 500);
            }
        });

        // Handle messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateFlowData':
                    // Handle refresh data updates if needed
                    break;
            }
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
                .scaleExtent([0.05, 20])
                .on('zoom', (event) => {
                    g.attr('transform', event.transform);
                    currentZoom = event.transform.k;
                    updateZoomDisplay();
                });
            
            svg.call(zoom);
            g = svg.append('g');
        }

        // Add keyboard navigation support
        function addKeyboardNavigation() {
            document.addEventListener('keydown', function(event) {
                // Only handle keyboard events when the diagram tab is active
                const diagramTab = document.getElementById('diagram');
                if (!diagramTab || !diagramTab.classList.contains('active')) {
                    return;
                }
                
                // Prevent default behavior for our handled keys
                const handledKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Equal', 'Minus', 'Digit0'];
                if (handledKeys.includes(event.code) || (event.key === '+' || event.key === '-' || event.key === '0')) {
                    event.preventDefault();
                }
                
                const currentTransform = d3.zoomTransform(svg.node());
                const panStep = 50 / currentTransform.k; // Adjust pan step based on zoom level
                
                switch(event.code) {
                    case 'ArrowUp':
                        // Pan up
                        svg.transition().duration(200).call(
                            zoom.transform,
                            d3.zoomIdentity.translate(currentTransform.x, currentTransform.y + panStep).scale(currentTransform.k)
                        );
                        break;
                    case 'ArrowDown':
                        // Pan down
                        svg.transition().duration(200).call(
                            zoom.transform,
                            d3.zoomIdentity.translate(currentTransform.x, currentTransform.y - panStep).scale(currentTransform.k)
                        );
                        break;
                    case 'ArrowLeft':
                        // Pan left
                        svg.transition().duration(200).call(
                            zoom.transform,
                            d3.zoomIdentity.translate(currentTransform.x + panStep, currentTransform.y).scale(currentTransform.k)
                        );
                        break;
                    case 'ArrowRight':
                        // Pan right
                        svg.transition().duration(200).call(
                            zoom.transform,
                            d3.zoomIdentity.translate(currentTransform.x - panStep, currentTransform.y).scale(currentTransform.k)
                        );
                        break;
                    case 'Equal':
                    case 'NumpadAdd':
                        // Zoom in (+ key)
                        if (event.key === '+' || event.shiftKey) {
                            zoomIn();
                        }
                        break;
                    case 'Minus':
                    case 'NumpadSubtract':
                        // Zoom out (- key)
                        zoomOut();
                        break;
                    case 'Digit0':
                    case 'Numpad0':
                        // Reset zoom (0 key)
                        resetZoom();
                        break;
                }
            });
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
                .attr('class', 'connection-line')
                .on('mouseover', function(event, d) {
                    showConnectionTooltip(event, d);
                })
                .on('mousemove', function(event, d) {
                    showConnectionTooltip(event, d);
                })
                .on('mouseout', function() {
                    hideTooltip();
                });
            
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
                })
                .on('mouseover', function(event, d) {
                    showTooltip(event, d);
                })
                .on('mousemove', function(event, d) {
                    showTooltip(event, d);
                })
                .on('mouseout', function() {
                    hideTooltip();
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
        
        // Tooltip functions
        function showTooltip(event, data) {
            const tooltip = document.getElementById('tooltip');
            const roleText = data.roleRequired ? data.roleRequired : 'Public (no role required)';
            const typeText = data.type === 'form' ? 'Form Page' : 'Report Page';
            const vizTypeText = data.type === 'report' ? 
                ' (' + (data.visualizationType || 'grid') + ')' : '';
            
            let tooltipContent = 
                '<div class="tooltip-title">' + data.titleText + '</div>' +
                '<div class="tooltip-detail"><strong>Type:</strong> ' + typeText + vizTypeText + '</div>' +
                '<div class="tooltip-detail"><strong>Name:</strong> ' + data.name + '</div>' +
                '<div class="tooltip-detail"><strong>Object:</strong> ' + data.objectName + '</div>' +
                '<div class="tooltip-detail"><strong>Role:</strong> ' + roleText + '</div>';
            
            if (data.type === 'form' && data.description) {
                tooltipContent += '<div class="tooltip-detail"><strong>Description:</strong> ' + data.description + '</div>';
            }
            
            tooltip.innerHTML = tooltipContent;
            tooltip.classList.add('visible');
            
            // Position tooltip
            const rect = document.getElementById('flowContainer').getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            
            let left = event.pageX + 10;
            let top = event.pageY - 10;
            
            // Adjust if tooltip would go off screen
            if (left + tooltipRect.width > window.innerWidth - 20) {
                left = event.pageX - tooltipRect.width - 10;
            }
            if (top + tooltipRect.height > window.innerHeight - 20) {
                top = event.pageY - tooltipRect.height - 10;
            }
            
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
        }
        
        function hideTooltip() {
            const tooltip = document.getElementById('tooltip');
            tooltip.classList.remove('visible');
        }
        
        function showConnectionTooltip(event, data) {
            const tooltip = document.getElementById('tooltip');
            
            let tooltipContent = 
                '<div class="tooltip-title">Page Connection</div>' +
                '<div class="tooltip-detail"><strong>From:</strong> ' + data.source.titleText + '</div>' +
                '<div class="tooltip-detail"><strong>To:</strong> ' + data.target.titleText + '</div>';
            
            if (data.buttonText) {
                tooltipContent += '<div class="tooltip-detail"><strong>Button:</strong> ' + data.buttonText + '</div>';
            }
            
            tooltip.innerHTML = tooltipContent;
            tooltip.classList.add('visible');
            
            // Position tooltip
            let left = event.pageX + 10;
            let top = event.pageY - 10;
            
            const tooltipRect = tooltip.getBoundingClientRect();
            
            // Adjust if tooltip would go off screen
            if (left + tooltipRect.width > window.innerWidth - 20) {
                left = event.pageX - tooltipRect.width - 10;
            }
            if (top + tooltipRect.height > window.innerHeight - 20) {
                top = event.pageY - tooltipRect.height - 10;
            }
            
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
        }

        function zoomIn() {
            const currentTransform = d3.zoomTransform(svg.node());
            // Use different zoom increments based on current zoom level for better precision
            let zoomFactor = 1.2;
            if (currentTransform.k > 5) {
                zoomFactor = 1.1; // Smaller increments at high zoom
            } else if (currentTransform.k > 10) {
                zoomFactor = 1.05; // Even smaller increments at very high zoom
            }
            
            const newScale = Math.min(currentTransform.k * zoomFactor, 20);
            svg.transition().duration(300).call(
                zoom.transform,
                d3.zoomIdentity.translate(currentTransform.x, currentTransform.y).scale(newScale)
            );
        }

        function zoomOut() {
            const currentTransform = d3.zoomTransform(svg.node());
            // Use different zoom increments based on current zoom level
            let zoomFactor = 1.2;
            if (currentTransform.k > 5) {
                zoomFactor = 1.1; // Smaller increments at high zoom
            } else if (currentTransform.k > 10) {
                zoomFactor = 1.05; // Even smaller increments at very high zoom
            }
            
            const newScale = Math.max(currentTransform.k / zoomFactor, 0.05);
            svg.transition().duration(300).call(
                zoom.transform,
                d3.zoomIdentity.translate(currentTransform.x, currentTransform.y).scale(newScale)
            );
        }

        function resetZoom() {
            svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
        }

        function switchTab(tabName) {
            console.log('[DEBUG] Switching to tab:', tabName);
            
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            document.querySelector('[onclick="switchTab(\\\'' + tabName + '\\\')"]').classList.add('active');
            document.getElementById(tabName).classList.add('active');
            
            // Initialize Mermaid when switching to mermaid tab
            if (tabName === 'mermaid') {
                console.log('[DEBUG] Mermaid tab activated, checking if Mermaid is loaded...');
                
                // Initialize role filter for Mermaid tab
                initializeMermaidRoleFilter();
                
                if (typeof mermaid !== 'undefined') {
                    console.log('[DEBUG] Mermaid library is loaded, initializing...');
                    setTimeout(() => {
                        initializeMermaid();
                    }, 100);
                } else {
                    console.error('[DEBUG] Mermaid library is not loaded!');
                    const mermaidElement = document.getElementById('mermaidDiagram');
                    if (mermaidElement) {
                        mermaidElement.innerHTML = 
                            '<div style="color: red; padding: 20px; text-align: center; border: 1px solid red; margin: 10px;">' +
                            '<h3>Mermaid Library Not Loaded</h3>' +
                            '<p>The Mermaid library failed to load from the CDN.</p>' +
                            '<p>Please check your internet connection and try refreshing the page.</p>' +
                            '</div>';
                    }
                }
            }
            
            // Initialize statistics role filter when switching to statistics tab
            if (tabName === 'statistics') {
                console.log('[DEBUG] Statistics tab activated, initializing role filter...');
                initializeStatisticsRoleFilter();
            }
        }
        
        function initializeMermaid() {
            try {
                console.log('[DEBUG] Initializing Mermaid...');
                
                // Configure Mermaid with simple, reliable settings
                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'default',
                    securityLevel: 'loose',
                    flowchart: {
                        useMaxWidth: true,
                        htmlLabels: false,
                        curve: 'linear',
                        padding: 15
                    }
                });
                
                // Get the Mermaid element
                const mermaidElement = document.getElementById('mermaidDiagram');
                if (!mermaidElement) {
                    console.error('[DEBUG] Mermaid element not found');
                    return;
                }
                
                console.log('[DEBUG] Mermaid element found, content length:', mermaidElement.textContent.length);
                
                // Clear any existing content and reset
                mermaidElement.innerHTML = '';
                mermaidElement.removeAttribute('data-processed');
                
                // Get the syntax from the hidden display element
                const syntaxDisplay = document.getElementById('mermaidSyntaxDisplay');
                if (syntaxDisplay && syntaxDisplay.textContent.trim()) {
                    const mermaidSyntax = syntaxDisplay.textContent.trim();
                    console.log('[DEBUG] Using syntax from display element, length:', mermaidSyntax.length);
                    
                    // Set the content directly
                    mermaidElement.textContent = mermaidSyntax;
                    mermaidElement.classList.add('mermaid');
                } else {
                    console.log('[DEBUG] Using existing content from mermaid element');
                }
                
                // Try to render with a slight delay
                setTimeout(async () => {
                    try {
                        console.log('[DEBUG] Attempting to render Mermaid diagram...');
                        await mermaid.run();
                        console.log('[DEBUG] Mermaid rendering completed successfully');
                        
                        // Initialize zoom and pan functionality after successful render
                        setTimeout(() => {
                            console.log('[DEBUG] Initializing Mermaid zoom and pan functionality');
                            initMermaidZoomPan();
                        }, 100);
                    } catch (error) {
                        console.error('[DEBUG] Mermaid rendering error:', error);
                        mermaidElement.innerHTML = 
                            '<div style="color: red; padding: 20px; text-align: center; border: 1px solid red; margin: 10px;">' +
                            '<h3>Diagram Rendering Error</h3>' +
                            '<p>Unable to render the Mermaid diagram.</p>' +
                            '<p>Error: ' + error.message + '</p>' +
                            '<p>Check the browser console for more details.</p>' +
                            '</div>';
                    }
                }, 200);
                
            } catch (error) {
                console.error('[DEBUG] Mermaid initialization error:', error);
                const mermaidElement = document.getElementById('mermaidDiagram');
                if (mermaidElement) {
                    mermaidElement.innerHTML = 
                        '<div style="color: red; padding: 20px; text-align: center; border: 1px solid red; margin: 10px;">' +
                        '<h3>Mermaid Initialization Error</h3>' +
                        '<p>Failed to initialize Mermaid library.</p>' +
                        '<p>Error: ' + error.message + '</p>' +
                        '</div>';
                }
            }
        }
        
        function downloadMermaidSVG() {
            console.log('[DEBUG] Download SVG function called');
            const mermaidElement = document.getElementById('mermaidDiagram');
            
            if (!mermaidElement) {
                console.error('[DEBUG] Mermaid element not found');
                alert('Error: Mermaid diagram element not found. Please ensure the diagram is rendered first.');
                return;
            }
            
            console.log('[DEBUG] Mermaid element found, looking for SVG...');
            const svgElement = mermaidElement.querySelector('svg');
            
            if (!svgElement) {
                console.error('[DEBUG] SVG element not found in mermaid diagram');
                console.log('[DEBUG] Mermaid element content:', mermaidElement.innerHTML);
                alert('Error: No SVG found in the diagram. Please render the diagram first using the "Render Diagram" button.');
                return;
            }
            
            console.log('[DEBUG] SVG element found, proceeding with download...');
            
            try {
                // Clone the SVG and add styling
                const clonedSvg = svgElement.cloneNode(true);
                clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
                
                // Add some basic styling to ensure the SVG looks good when saved
                const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
                styleElement.textContent = 
                    'text { font-family: Arial, sans-serif; font-size: 14px; }' +
                    '.node rect, .node circle, .node ellipse, .node polygon { fill: #f9f9f9; stroke: #333; stroke-width: 1px; }' +
                    '.edge path { stroke: #333; stroke-width: 2px; fill: none; }' +
                    '.edge polygon { fill: #333; stroke: #333; }';
                clonedSvg.insertBefore(styleElement, clonedSvg.firstChild);
                
                // Create a proper SVG document
                const svgData = new XMLSerializer().serializeToString(clonedSvg);
                const fullSvgData = '<?xml version="1.0" encoding="UTF-8"?>\\n' + svgData;
                
                console.log('[DEBUG] SVG data prepared, length:', fullSvgData.length);
                
                // Generate filename with app name and selected roles
                let fileName = '';
                if (appName) {
                    fileName = appName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-page-flow-mermaid-diagram';
                } else {
                    fileName = 'page-flow-mermaid-diagram';
                }
                
                if (mermaidSelectedRoles && mermaidSelectedRoles.size > 0) {
                    const rolesList = Array.from(mermaidSelectedRoles).sort();
                    const rolesStr = rolesList.join('-');
                    fileName = fileName + '-roles-' + rolesStr.toLowerCase().replace(/[^a-z0-9-]/g, '');
                }
                fileName = fileName + '.svg';
                
                console.log('[DEBUG] Generated filename:', fileName);
                
                // Use VS Code API to handle the download instead of browser methods
                vscode.postMessage({
                    command: 'downloadFile',
                    fileName: fileName,
                    content: fullSvgData,
                    mimeType: 'image/svg+xml'
                });
                
                console.log('[DEBUG] Download request sent to VS Code');
                
                // Show user feedback
                const originalButton = event.target;
                if (originalButton) {
                    const originalText = originalButton.textContent;
                    originalButton.textContent = 'Download Requested...';
                    setTimeout(() => {
                        originalButton.textContent = originalText;
                    }, 3000);
                }
                
            } catch (error) {
                console.error('[DEBUG] Error during SVG download:', error);
                alert('Error downloading SVG: ' + error.message + '\\n\\nTry refreshing the page and rendering the diagram again.');
            }
        }
        
        function toggleMermaidSyntax() {
            const syntaxDisplay = document.getElementById('mermaidSyntaxDisplay');
            if (syntaxDisplay.style.display === 'none') {
                syntaxDisplay.style.display = 'block';
            } else {
                syntaxDisplay.style.display = 'none';
            }
        }
        
        // Mermaid zoom and filtering functionality
        let mermaidSelectedRoles = new Set();
        let mermaidZoom = 1;
        
        // Initialize Mermaid role filter when tab is activated
        function initializeMermaidRoleFilter() {
            const mermaidRoleFilterOptions = document.getElementById('mermaidRoleFilterOptions');
            if (!mermaidRoleFilterOptions || mermaidRoleFilterOptions.children.length > 0) {
                return; // Already initialized
            }
            
            const roles = [...new Set(flowData.pages.map(page => page.roleRequired).filter(role => role))];
            const hasPublicPages = flowData.pages.some(page => !page.roleRequired);
            
            // Clear existing roles selection for Mermaid
            mermaidSelectedRoles.clear();
            
            if (hasPublicPages) {
                const publicItem = document.createElement('div');
                publicItem.className = 'role-checkbox-item';
                publicItem.innerHTML = 
                    '<input type="checkbox" id="mermaid-role-PUBLIC" checked onchange="handleMermaidRoleChange(this)">' +
                    '<label for="mermaid-role-PUBLIC">Public Pages</label>';
                mermaidRoleFilterOptions.appendChild(publicItem);
                mermaidSelectedRoles.add('PUBLIC');
            }
            
            roles.forEach(role => {
                const roleItem = document.createElement('div');
                roleItem.className = 'role-checkbox-item';
                roleItem.innerHTML = 
                    '<input type="checkbox" id="mermaid-role-' + role + '" checked onchange="handleMermaidRoleChange(this)">' +
                    '<label for="mermaid-role-' + role + '">' + role + '</label>';
                mermaidRoleFilterOptions.appendChild(roleItem);
                mermaidSelectedRoles.add(role);
            });
        }
        
        // Handle Mermaid role filter changes
        function handleMermaidRoleChange(checkbox) {
            const roleValue = checkbox.id.replace('mermaid-role-', '');
            
            if (checkbox.checked) {
                mermaidSelectedRoles.add(roleValue);
            } else {
                mermaidSelectedRoles.delete(roleValue);
            }
            
            // Regenerate and render Mermaid diagram with filtered data
            updateMermaidDiagram();
        }
        
        // Handle Mermaid diagram type changes
        function handleMermaidTypeChange(selectElement) {
            mermaidDiagramType = selectElement.value;
            console.log('[DEBUG] Mermaid diagram type changed to:', mermaidDiagramType);
            
            // Regenerate and render Mermaid diagram with new type
            updateMermaidDiagram();
        }
        
        // Update Mermaid diagram with current filters
        function updateMermaidDiagram() {
            let filteredPages = flowData.pages;
            if (mermaidSelectedRoles.size > 0) {
                filteredPages = flowData.pages.filter(page => {
                    if (mermaidSelectedRoles.has('PUBLIC') && !page.roleRequired) {
                        return true;
                    }
                    return page.roleRequired && mermaidSelectedRoles.has(page.roleRequired);
                });
            }
            
            const filteredConnections = flowData.connections.filter(conn => 
                filteredPages.some(page => page.name === conn.from) &&
                filteredPages.some(page => page.name === conn.to)
            );
            
            const filteredFlowMap = {
                pages: filteredPages,
                connections: filteredConnections
            };
            
            // Generate new Mermaid syntax with filtered data and current diagram type
            const newMermaidSyntax = generateMermaidSyntaxFromFlowMap(filteredFlowMap);
            
            // Update the syntax display
            const syntaxDisplay = document.getElementById('mermaidSyntaxDisplay');
            if (syntaxDisplay) {
                syntaxDisplay.textContent = newMermaidSyntax;
            }
            
            // Update and re-render the diagram
            const mermaidElement = document.getElementById('mermaidDiagram');
            if (mermaidElement) {
                mermaidElement.innerHTML = '';
                mermaidElement.removeAttribute('data-processed');
                mermaidElement.textContent = newMermaidSyntax;
                mermaidElement.classList.add('mermaid');
                
                // Re-render with current zoom
                setTimeout(async () => {
                    try {
                        await mermaid.run();
                        applyMermaidZoom();
                    } catch (error) {
                        console.error('Error re-rendering Mermaid:', error);
                    }
                }, 100);
            }
        }
        
        // Mermaid zoom and pan variables
        let mermaidPanX = 0;
        let mermaidPanY = 0;
        let mermaidIsPanning = false;
        let mermaidStartX = 0;
        let mermaidStartY = 0;
        let mermaidLastPanX = 0;
        let mermaidLastPanY = 0;
        
        // Enhanced Mermaid zoom functions with mouse wheel zoom and panning support
        function mermaidZoomIn() {
            // Use variable zoom increments like the main diagram
            let zoomFactor = 1.05; // Reduced for less sensitive zooming
            if (mermaidZoom > 5) {
                zoomFactor = 1.03;
            } else if (mermaidZoom > 10) {
                zoomFactor = 1.02;
            }
            
            const mermaidViewport = document.querySelector('.mermaid-viewport');
            if (mermaidViewport) {
                // Get viewport dimensions
                const viewportRect = mermaidViewport.getBoundingClientRect();
                const centerX = viewportRect.width / 2;
                const centerY = viewportRect.height / 2;
                
                // Convert center point to original coordinate space
                const centerXInOriginalSpace = (centerX - mermaidPanX) / mermaidZoom;
                const centerYInOriginalSpace = (centerY - mermaidPanY) / mermaidZoom;
                
                // Update zoom level
                mermaidZoom = Math.min(mermaidZoom * zoomFactor, 20);
                
                // Calculate new pan position to keep center fixed
                mermaidPanX = centerX - centerXInOriginalSpace * mermaidZoom;
                mermaidPanY = centerY - centerYInOriginalSpace * mermaidZoom;
                
                // Apply the transformation and update display
                applyMermaidZoom();
                updateMermaidZoomDisplay();
            } else {
                mermaidZoom = Math.min(mermaidZoom * zoomFactor, 20);
                applyMermaidZoom();
                updateMermaidZoomDisplay();
            }
        }
        
        function mermaidZoomOut() {
            // Use variable zoom increments like the main diagram
            let zoomFactor = 1.05; // Reduced for less sensitive zooming
            if (mermaidZoom > 5) {
                zoomFactor = 1.03;
            } else if (mermaidZoom > 10) {
                zoomFactor = 1.02;
            }
            
            const mermaidViewport = document.querySelector('.mermaid-viewport');
            if (mermaidViewport) {
                // Get viewport dimensions
                const viewportRect = mermaidViewport.getBoundingClientRect();
                const centerX = viewportRect.width / 2;
                const centerY = viewportRect.height / 2;
                
                // Convert center point to original coordinate space
                const centerXInOriginalSpace = (centerX - mermaidPanX) / mermaidZoom;
                const centerYInOriginalSpace = (centerY - mermaidPanY) / mermaidZoom;
                
                // Update zoom level
                mermaidZoom = Math.max(mermaidZoom / zoomFactor, 0.05);
                
                // Calculate new pan position to keep center fixed
                mermaidPanX = centerX - centerXInOriginalSpace * mermaidZoom;
                mermaidPanY = centerY - centerYInOriginalSpace * mermaidZoom;
                
                // Apply the transformation and update display
                applyMermaidZoom();
                updateMermaidZoomDisplay();
            } else {
                mermaidZoom = Math.max(mermaidZoom / zoomFactor, 0.05);
                applyMermaidZoom();
                updateMermaidZoomDisplay();
            }
        }
        
        function mermaidResetZoom() {
            mermaidZoom = 1;
            
            // Center the diagram in the viewport
            const mermaidViewport = document.querySelector('.mermaid-viewport');
            const mermaidContainer = document.getElementById('mermaidContainer');
            
            if (mermaidViewport && mermaidContainer) {
                const viewportRect = mermaidViewport.getBoundingClientRect();
                
                // Center horizontally
                mermaidPanX = (viewportRect.width - mermaidContainer.offsetWidth) / 2;
                if (mermaidPanX < 0) mermaidPanX = 20; // Minimum padding
                
                // Position near the top with some margin
                mermaidPanY = 20; 
            } else {
                mermaidPanX = 0;
                mermaidPanY = 0;
            }
            
            applyMermaidZoom();
            updateMermaidZoomDisplay();
        }
        
        function applyMermaidZoom() {
            const mermaidContainer = document.getElementById('mermaidContainer');
            const mermaidDiagram = document.getElementById('mermaidDiagram');
            
            if (mermaidContainer && mermaidDiagram) {
                // Apply transform with both zoom and pan to the container
                // Use 0 0 transform origin for more predictable behavior
                mermaidContainer.style.transformOrigin = '0 0';
                mermaidContainer.style.transform = 'translate(' + mermaidPanX + 'px, ' + mermaidPanY + 'px) scale(' + mermaidZoom + ')';
                
                // Get the SVG element
                const svgElement = mermaidDiagram.querySelector('svg');
                if (svgElement) {
                    // Get the original SVG dimensions
                    const bbox = svgElement.getBBox ? svgElement.getBBox() : { width: 800, height: 600 };
                    const originalWidth = bbox.width || 800;
                    const originalHeight = bbox.height || 600;
                    
                    // Set container size to original content size (not scaled)
                    // The scaling will be handled by the transform
                    const padding = 40;
                    mermaidContainer.style.width = (originalWidth + padding * 2) + 'px';
                    mermaidContainer.style.height = (originalHeight + padding * 2) + 'px';
                    mermaidContainer.style.padding = padding + 'px';
                } else {
                    // Fallback for when SVG is not yet rendered
                    const basePadding = 20;
                    mermaidContainer.style.padding = basePadding + 'px';
                    
                    // Set reasonable defaults for dimensions
                    const baseMinWidth = 800;
                    const baseMinHeight = 500;
                    mermaidContainer.style.minWidth = baseMinWidth + 'px';
                    mermaidContainer.style.minHeight = baseMinHeight + 'px';
                }
            }
        }
        
        function updateMermaidZoomDisplay() {
            const zoomDisplay = document.getElementById('mermaidZoomLevel');
            if (zoomDisplay) {
                zoomDisplay.textContent = Math.round(mermaidZoom * 100) + '%';
            }
        }
        
        // Initialize mouse wheel zoom and panning for Mermaid diagram
        function initMermaidZoomPan() {
            const mermaidViewport = document.querySelector('.mermaid-viewport');
            const mermaidContainer = document.getElementById('mermaidContainer');
            
            if (mermaidViewport && mermaidContainer) {
                // Set initial cursor style
                mermaidViewport.style.cursor = 'grab';
                
                // Mouse wheel zoom (centered on mouse position)
                mermaidViewport.addEventListener('wheel', function(e) {
                    e.preventDefault();
                    
                    // Get mouse position relative to the container with current transform
                    const rect = mermaidViewport.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;
                    
                    // Convert to position in the original coordinate space
                    const mouseXInOriginalSpace = (mouseX - mermaidPanX) / mermaidZoom;
                    const mouseYInOriginalSpace = (mouseY - mermaidPanY) / mermaidZoom;
                    
                    const oldZoom = mermaidZoom;
                    
                    // Calculate zoom factor based on current zoom level for better precision
                    let zoomFactor = 1.05; // Reduced for less sensitive zooming
                    if (mermaidZoom > 5) {
                        zoomFactor = 1.03; // Smaller increments at high zoom
                    } else if (mermaidZoom > 10) {
                        zoomFactor = 1.02; // Even smaller increments at very high zoom
                    }
                    
                    // Apply zoom based on wheel direction
                    if (e.deltaY < 0) {
                        mermaidZoom = Math.min(mermaidZoom * zoomFactor, 20);
                    } else {
                        mermaidZoom = Math.max(mermaidZoom / zoomFactor, 0.05);
                    }
                    
                    // Calculate new pan position to keep mouse point fixed
                    // This is the key formula for stable zooming:
                    // - Transform the mouse point back to original space
                    // - Apply new zoom to that point
                    // - Offset so mouse stays in same screen position
                    mermaidPanX = mouseX - mouseXInOriginalSpace * mermaidZoom;
                    mermaidPanY = mouseY - mouseYInOriginalSpace * mermaidZoom;
                    
                    // Apply the transformation and update display
                    applyMermaidZoom();
                    updateMermaidZoomDisplay();
                }, { passive: false });
                
                // Pan functionality (drag)
                mermaidViewport.addEventListener('mousedown', function(e) {
                    if (e.button !== 0) return; // Only respond to left mouse button
                    mermaidIsPanning = true;
                    mermaidStartX = e.clientX;
                    mermaidStartY = e.clientY;
                    mermaidLastPanX = mermaidPanX;
                    mermaidLastPanY = mermaidPanY;
                    mermaidViewport.style.cursor = 'grabbing';
                });
                
                document.addEventListener('mousemove', function(e) {
                    if (!mermaidIsPanning) return;
                    mermaidPanX = mermaidLastPanX + (e.clientX - mermaidStartX);
                    mermaidPanY = mermaidLastPanY + (e.clientY - mermaidStartY);
                    applyMermaidZoom();
                });
                
                document.addEventListener('mouseup', function() {
                    if (mermaidIsPanning) {
                        mermaidIsPanning = false;
                        mermaidViewport.style.cursor = 'grab';
                    }
                });
                
                // Touch support for mobile devices
                mermaidViewport.addEventListener('touchstart', function(e) {
                    if (e.touches.length === 1) {
                        mermaidIsPanning = true;
                        mermaidStartX = e.touches[0].clientX;
                        mermaidStartY = e.touches[0].clientY;
                        mermaidLastPanX = mermaidPanX;
                        mermaidLastPanY = mermaidPanY;
                        e.preventDefault();
                    }
                }, { passive: false });
                
                mermaidViewport.addEventListener('touchmove', function(e) {
                    if (mermaidIsPanning && e.touches.length === 1) {
                        mermaidPanX = mermaidLastPanX + (e.touches[0].clientX - mermaidStartX);
                        mermaidPanY = mermaidLastPanY + (e.touches[0].clientY - mermaidStartY);
                        applyMermaidZoom();
                        e.preventDefault();
                    }
                }, { passive: false });
                
                mermaidViewport.addEventListener('touchend', function() {
                    mermaidIsPanning = false;
                });
                
                // Initialize pinch zoom for touch devices
                let initialDistance = 0;
                let initialZoom = 1;
                
                mermaidViewport.addEventListener('touchstart', function(e) {
                    if (e.touches.length === 2) {
                        initialDistance = Math.hypot(
                            e.touches[0].clientX - e.touches[1].clientX,
                            e.touches[0].clientY - e.touches[1].clientY
                        );
                        initialZoom = mermaidZoom;
                        e.preventDefault();
                    }
                }, { passive: false });
                
                mermaidViewport.addEventListener('touchmove', function(e) {
                    if (e.touches.length === 2) {
                        const distance = Math.hypot(
                            e.touches[0].clientX - e.touches[1].clientX,
                            e.touches[0].clientY - e.touches[1].clientY
                        );
                        
                        const center = {
                            x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                            y: (e.touches[0].clientY + e.touches[1].clientY) / 2
                        };
                        
                        const rect = mermaidViewport.getBoundingClientRect();
                        const pinchCenterX = center.x - rect.left;
                        const pinchCenterY = center.y - rect.top;
                        
                        // Convert pinch center to original coordinate space
                        const pinchCenterXInOriginalSpace = (pinchCenterX - mermaidPanX) / mermaidZoom;
                        const pinchCenterYInOriginalSpace = (pinchCenterY - mermaidPanY) / mermaidZoom;
                        
                        // Calculate new zoom with smoother factor
                        const oldZoom = mermaidZoom;
                        mermaidZoom = Math.min(20, Math.max(0.05, initialZoom * distance / initialDistance));
                        
                        // Calculate new pan position to keep pinch center fixed
                        mermaidPanX = pinchCenterX - pinchCenterXInOriginalSpace * mermaidZoom;
                        mermaidPanY = pinchCenterY - pinchCenterYInOriginalSpace * mermaidZoom;
                        
                        applyMermaidZoom();
                        updateMermaidZoomDisplay();
                        e.preventDefault();
                    }
                }, { passive: false });
            }
        }
        
        // Helper function to generate Mermaid syntax from flow map (similar to existing function)
        function generateMermaidSyntaxFromFlowMap(flowMap) {
            let mermaidCode = mermaidDiagramType + "\\n";
            
            if (flowMap.pages && flowMap.pages.length > 0) {
                const usedNodeIds = new Set();
                
                flowMap.pages.forEach((page, index) => {
                    if (!page || !page.name) {
                        return;
                    }
                    
                    let nodeId = sanitizeNodeIdForMermaid(page.name);
                    let counter = 1;
                    while (usedNodeIds.has(nodeId)) {
                        nodeId = sanitizeNodeIdForMermaid(page.name) + '_' + counter;
                        counter++;
                    }
                    usedNodeIds.add(nodeId);
                    
                    const displayText = sanitizeDisplayTextForMermaid(page.titleText || page.name);
                    const nodeShape = getNodeShapeForPageTypeForMermaid(page.type);
                    
                    mermaidCode += "    " + nodeId + nodeShape.start + '"' + displayText + '"' + nodeShape.end + "\\n";
                });
                
                mermaidCode += "\\n";
                
                if (flowMap.connections && flowMap.connections.length > 0) {
                    flowMap.connections.forEach(connection => {
                        if (!connection || !connection.from || !connection.to) {
                            return;
                        }
                        
                        const fromId = sanitizeNodeIdForMermaid(connection.from);
                        const toId = sanitizeNodeIdForMermaid(connection.to);
                        
                        if (fromId !== toId && fromId && toId) {
                            const buttonText = connection.buttonText || "";
                            
                            if (buttonText) {
                                const sanitizedButtonText = sanitizeDisplayTextForMermaid(buttonText);
                                mermaidCode += "    " + fromId + ' -->|"' + sanitizedButtonText + '"| ' + toId + "\\n";
                            } else {
                                mermaidCode += "    " + fromId + " --> " + toId + "\\n";
                            }
                        }
                    });
                }
                
                mermaidCode += "\\n";
                mermaidCode += "    classDef formPage fill:#e1f5fe,stroke:#01579b,stroke-width:2px\\n";
                mermaidCode += "    classDef reportPage fill:#f3e5f5,stroke:#4a148c,stroke-width:2px\\n\\n";
                
                flowMap.pages.forEach(page => {
                    if (!page || !page.name) {
                        return;
                    }
                    
                    const nodeId = sanitizeNodeIdForMermaid(page.name);
                    if (page.type === 'form') {
                        mermaidCode += "    class " + nodeId + " formPage\\n";
                    } else if (page.type === 'report') {
                        mermaidCode += "    class " + nodeId + " reportPage\\n";
                    }
                });
            } else {
                mermaidCode += "    NoPages[\\"No pages found in the model\\"]\\n";
                mermaidCode += "    class NoPages emptyState\\n";
                mermaidCode += "    classDef emptyState fill:#ffebee,stroke:#c62828,stroke-width:2px\\n";
            }
            
            return mermaidCode;
        }
        
        // Helper functions for Mermaid syntax generation (duplicated to avoid dependency issues)
        function sanitizeNodeIdForMermaid(name) {
            return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[^a-zA-Z]/, 'N_');
        }
        
        function sanitizeDisplayTextForMermaid(text) {
            return text.replace(/"/g, '\\"').replace(/\\n/g, ' ').trim();
        }
        
        function getNodeShapeForPageTypeForMermaid(type) {
            if (type === 'form') {
                return { start: '[', end: ']' };
            } else if (type === 'report') {
                return { start: '(', end: ')' };
            }
            return { start: '[', end: ']' };
        }
        
        // Statistics role filtering variables
        let statisticsSelectedRoles = new Set();
        
        // Initialize statistics role filter when tab is activated
        function initializeStatisticsRoleFilter() {
            const statisticsRoleFilterOptions = document.getElementById('statisticsRoleFilterOptions');
            if (!statisticsRoleFilterOptions || statisticsRoleFilterOptions.children.length > 0) {
                console.log('[DEBUG] Statistics role filter already initialized or container not found');
                return;
            }
            
            console.log('[DEBUG] Initializing statistics role filter');
            const roles = [...new Set(flowData.pages.map(page => page.roleRequired).filter(role => role))];
            
            // Add Public Pages if there are pages without roles
            const hasPublicPages = flowData.pages.some(page => !page.roleRequired);
            
            if (hasPublicPages) {
                const publicItem = document.createElement('div');
                publicItem.className = 'role-checkbox-item';
                publicItem.innerHTML = 
                    '<input type="checkbox" id="statistics-role-PUBLIC" checked onchange="handleStatisticsRoleChange(this)">' +
                    '<label for="statistics-role-PUBLIC">Public Pages</label>';
                statisticsRoleFilterOptions.appendChild(publicItem);
                statisticsSelectedRoles.add('PUBLIC');
            }
            
            roles.forEach(role => {
                const roleItem = document.createElement('div');
                roleItem.className = 'role-checkbox-item';
                roleItem.innerHTML = 
                    '<input type="checkbox" id="statistics-role-' + role + '" checked onchange="handleStatisticsRoleChange(this)">' +
                    '<label for="statistics-role-' + role + '">' + role + '</label>';
                statisticsRoleFilterOptions.appendChild(roleItem);
                statisticsSelectedRoles.add(role);
            });
        }
        
        // Handle statistics role filter changes
        function handleStatisticsRoleChange(checkbox) {
            const roleValue = checkbox.id.replace('statistics-role-', '');
            
            if (checkbox.checked) {
                statisticsSelectedRoles.add(roleValue);
            } else {
                statisticsSelectedRoles.delete(roleValue);
            }
            
            // Update statistics with filtered data
            updateStatisticsContent();
        }
        
        // Update statistics content with current role filters
        function updateStatisticsContent() {
            let filteredPages = flowData.pages;
            if (statisticsSelectedRoles.size > 0) {
                filteredPages = flowData.pages.filter(page => {
                    if (!page.roleRequired) {
                        return statisticsSelectedRoles.has('PUBLIC');
                    }
                    return statisticsSelectedRoles.has(page.roleRequired);
                });
            }
            
            // Recalculate statistics based on filtered pages
            const formPages = filteredPages.filter(page => page.type === 'form').length;
            const reportPages = filteredPages.filter(page => page.type === 'report').length;
            const totalPages = filteredPages.length;
            
            // Calculate connections for filtered pages
            const filteredPageNames = new Set(filteredPages.map(page => page.name));
            const connections = flowData.connections || [];
            const filteredConnections = connections.filter(conn => 
                filteredPageNames.has(conn.from) && filteredPageNames.has(conn.to)
            );
            
            // Update statistics numbers
            const statisticsNumbers = document.getElementById('statisticsNumbers');
            if (statisticsNumbers) {
                statisticsNumbers.innerHTML = 
                    '<div class="stat">' +
                        '<div class="stat-number">' + totalPages + '</div>' +
                        '<div class="stat-label">Total Pages</div>' +
                    '</div>' +
                    '<div class="stat">' +
                        '<div class="stat-number">' + formPages + '</div>' +
                        '<div class="stat-label">Form Pages</div>' +
                    '</div>' +
                    '<div class="stat">' +
                        '<div class="stat-number">' + reportPages + '</div>' +
                        '<div class="stat-label">Report Pages</div>' +
                    '</div>' +
                    '<div class="stat">' +
                        '<div class="stat-number">' + filteredConnections.length + '</div>' +
                        '<div class="stat-label">Connections</div>' +
                    '</div>';
            }
            
            // Update detailed statistics
            const statisticsDetails = document.getElementById('statisticsDetails');
            if (statisticsDetails) {
                // Calculate detailed breakdowns for filtered pages
                const reportsByType = {};
                filteredPages.filter(page => page.type === 'report').forEach(page => {
                    const vizType = (page.visualizationType || 'grid').toLowerCase();
                    if (!reportsByType[vizType]) {
                        reportsByType[vizType] = 0;
                    }
                    reportsByType[vizType]++;
                });
                
                const roleBreakdown = {};
                filteredPages.forEach(page => {
                    const role = page.roleRequired || 'Public';
                    if (!roleBreakdown[role]) {
                        roleBreakdown[role] = 0;
                    }
                    roleBreakdown[role]++;
                });
                
                let detailsHtml = '<h4>Page Breakdown by Type:</h4><ul>';
                detailsHtml += '<li><strong>Forms:</strong> ' + formPages + ' pages (workflows with isPage=true)</li>';
                detailsHtml += '<li><strong>Reports:</strong> ' + reportPages + ' pages</li>';
                
                if (Object.keys(reportsByType).length > 0) {
                    detailsHtml += '</ul><h4>Report Types:</h4><ul>';
                    Object.entries(reportsByType).forEach(([type, count]) => {
                        detailsHtml += '<li><strong>' + type.charAt(0).toUpperCase() + type.slice(1) + ':</strong> ' + count + ' pages</li>';
                    });
                }
                
                detailsHtml += '</ul><h4>Pages by Role:</h4><ul>';
                Object.entries(roleBreakdown).forEach(([role, count]) => {
                    detailsHtml += '<li><strong>' + role + ':</strong> ' + count + ' pages</li>';
                });
                
                detailsHtml += '</ul><h4>Connections:</h4><ul>';
                detailsHtml += '<li><strong>Total Connections:</strong> ' + filteredConnections.length + '</li>';
                detailsHtml += '<li><strong>Average Connections per Page:</strong> ' + (totalPages > 0 ? (filteredConnections.length / totalPages).toFixed(2) : '0') + '</li>';
                detailsHtml += '</ul>';
                
                statisticsDetails.innerHTML = detailsHtml;
            }
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
    </div>
    
    <div class="tabs">
        <button class="tab active" onclick="switchTab('diagram')">Force Directed Graph</button>
        <button class="tab" onclick="switchTab('mermaid')">Mermaid</button>
        <button class="tab" onclick="switchTab('statistics')">Statistics</button>
    </div>
    
    <div id="diagram" class="tab-content active">
        <div class="diagram-controls">
            <div class="search-box">
                <input type="text" id="searchPages" placeholder="Search pages by name or title..." />
            </div>
            
            <div class="control-row">
                <div class="role-filter">
                    <div class="role-filter-title">Filter by Role:</div>
                    <div class="role-filter-options" id="roleFilterOptions">
                        <!-- Role checkboxes will be populated by JavaScript -->
                    </div>
                </div>
                
                <div class="zoom-controls">
                    <button class="zoom-btn" onclick="zoomOut()" title="Zoom Out">−</button>
                    <span class="zoom-level" id="zoomLevel">100%</span>
                    <button class="zoom-btn" onclick="zoomIn()" title="Zoom In">+</button>
                    <button class="zoom-btn" onclick="resetZoom()" title="Reset Zoom">⌂</button>
                </div>
            </div>
            
            <div class="navigation-help" style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 10px; padding: 8px; background-color: var(--vscode-editorWidget-background); border-radius: 4px;">
                <strong>Navigation:</strong> 
                Arrow keys to pan • +/- to zoom • 0 to reset • Mouse wheel to zoom • Drag to pan • Drag nodes to reposition
            </div>
        </div>
        
        <div class="flow-container" id="flowContainer">
            <svg id="d3Container" class="d3-container"></svg>
        </div>
    </div>
    
    <div id="mermaid" class="tab-content">
        ${generateMermaidContent(flowMap)}
    </div>
    
    <div id="statistics" class="tab-content">
        ${generateStatisticsContent(flowMap)}
    </div>
    
    <div id="tooltip" class="tooltip"></div>`;
}

/**
 * Generates the statistics content
 * @param {Object} flowMap Flow map data
 * @returns {string} Statistics HTML content
 */
function generateStatisticsContent(flowMap) {
    const totalPages = flowMap.pages ? flowMap.pages.length : 0;
    const totalConnections = flowMap.connections ? flowMap.connections.length : 0;
    const formPages = flowMap.pages ? flowMap.pages.filter(p => p.type === 'form').length : 0;
    const reportPages = flowMap.pages ? flowMap.pages.filter(p => p.type === 'report').length : 0;
    
    // Calculate report types breakdown
    const reportTypes = {
        grid: 0,
        navigation: 0,
        detail: 0,
        other: 0
    };
    
    if (flowMap.pages) {
        flowMap.pages.filter(p => p.type === 'report').forEach(page => {
            const vizType = (page.visualizationType || 'grid').toLowerCase();
            switch (vizType) {
                case 'grid':
                case 'table':
                    reportTypes.grid++;
                    break;
                case 'navigation':
                case 'twocolumn':
                case 'two column':
                case 'detailtwocolumn':
                    reportTypes.navigation++;
                    break;
                case 'detail':
                case 'threecolumn':
                case 'three column':
                case 'detailthreecolumn':
                    reportTypes.detail++;
                    break;
                default:
                    reportTypes.other++;
                    break;
            }
        });
    }
    
    // Calculate roles breakdown
    const rolesSet = new Set();
    let publicPages = 0;
    
    if (flowMap.pages) {
        flowMap.pages.forEach(page => {
            if (page.roleRequired) {
                rolesSet.add(page.roleRequired);
            } else {
                publicPages++;
            }
        });
    }
    
    const roles = Array.from(rolesSet).sort();
    
    return `
        <div class="mermaid-header-controls">
            <div class="role-filter">
                <div class="role-filter-title">Filter by Role:</div>
                <div class="role-filter-options" id="statisticsRoleFilterOptions">
                    <!-- Role checkboxes will be populated by JavaScript -->
                </div>
            </div>
        </div>
        
        <div class="info-panel">
            <div class="info-panel-title">Page Flow Statistics</div>
            
            <div class="stats" id="statisticsNumbers">
                <div class="stat">
                    <div class="stat-number">${totalPages}</div>
                    <div class="stat-label">Total Pages</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${formPages}</div>
                    <div class="stat-label">Form Pages</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${reportPages}</div>
                    <div class="stat-label">Report Pages</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${totalConnections}</div>
                    <div class="stat-label">Connections</div>
                </div>
            </div>
            
            <h4>Page Type Color Legend:</h4>
            <div class="legend-items">
                <div class="legend-item">
                    <div class="legend-color form"></div>
                    <span class="legend-description">Forms (workflow pages)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color report-grid"></div>
                    <span class="legend-description">Grid Reports (grid, table)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color report-navigation"></div>
                    <span class="legend-description">Navigation Reports (navigation, two column, DetailTwoColumn)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color report-detail"></div>
                    <span class="legend-description">Detail Reports (detail, three column, DetailThreeColumn)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color report-other"></div>
                    <span class="legend-description">Other Reports (other visualization types)</span>
                </div>
            </div>
            
            <div id="statisticsDetails">
                <h4>Page Breakdown by Type:</h4>
                <ul>
                    <li><strong>Forms:</strong> ${formPages} pages (workflows with isPage=true)</li>
                <li><strong>Reports:</strong> ${reportPages} pages (reports with isPage=true)</li>
            </ul>
            
            <h4>Report Types Breakdown:</h4>
            <ul>
                <li><strong>Grid Reports:</strong> ${reportTypes.grid} pages (grid, table)</li>
                <li><strong>Navigation Reports:</strong> ${reportTypes.navigation} pages (navigation, two column, DetailTwoColumn)</li>
                <li><strong>Detail Reports:</strong> ${reportTypes.detail} pages (detail, three column, DetailThreeColumn)</li>
                <li><strong>Other Reports:</strong> ${reportTypes.other} pages (other visualization types)</li>
            </ul>
            
            <h4>Security & Access:</h4>
            <ul>
                <li><strong>Public Pages:</strong> ${publicPages} pages (no role required)</li>
                <li><strong>Role-Protected Pages:</strong> ${totalPages - publicPages} pages</li>
                <li><strong>Unique Roles:</strong> ${roles.length} roles (${roles.join(', ')})</li>
            </ul>
            
            <h4>Connection Details:</h4>
            <p>Connections represent navigation paths between pages through buttons with destination targets.</p>
            <ul>
                <li><strong>Total connections:</strong> ${totalConnections}</li>
                <li><strong>Average connections per page:</strong> ${totalPages > 0 ? (totalConnections / totalPages).toFixed(1) : 0}</li>
                <li><strong>Most connected pages:</strong> Coming soon...</li>
            </ul>
            
            <h4>Data Quality:</h4>
            <ul>
                <li><strong>Pages with titles:</strong> ${flowMap.pages ? flowMap.pages.filter(p => p.titleText && p.titleText.trim()).length : 0}</li>
                <li><strong>Pages without titles:</strong> ${flowMap.pages ? flowMap.pages.filter(p => !p.titleText || !p.titleText.trim()).length : 0}</li>
                <li><strong>Orphaned pages:</strong> ${totalPages > 0 ? flowMap.pages.filter(page => !flowMap.connections.some(conn => conn.to === page.name)).length : 0} (no incoming connections)</li>
                <li><strong>Dead-end pages:</strong> ${totalPages > 0 ? flowMap.pages.filter(page => !flowMap.connections.some(conn => conn.from === page.name)).length : 0} (no outgoing connections)</li>
            </ul>
        </div>
    `;
}

/**
 * Generates the Mermaid content
 * @param {Object} flowMap Flow map data
 * @returns {string} Mermaid HTML content
 */
function generateMermaidContent(flowMap) {
    const mermaidSyntax = generateMermaidSyntax(flowMap, "flowchart TD");
    
    return `
        <div class="mermaid-header-controls">
            <div class="mermaid-controls">
                <button class="btn" onclick="initializeMermaid()">Render Diagram</button>
                <button class="btn" onclick="downloadMermaidSVG()">Download SVG</button>
                <button class="btn" onclick="toggleMermaidSyntax()">Show/Hide Syntax</button>
            </div>
            
            <div class="mermaid-type-controls">
                <div class="mermaid-type-title">Diagram Type:</div>
                <select id="mermaidTypeSelect" class="mermaid-type-select" onchange="handleMermaidTypeChange(this)">
                    <option value="flowchart TD">Flowchart Top-Down</option>
                    <option value="flowchart LR">Flowchart Left-Right</option>
                </select>
            </div>
            
            <div class="mermaid-filter-controls">
                <div class="control-row">
                    <div class="role-filter">
                        <div class="role-filter-title">Filter by Role:</div>
                        <div class="role-filter-options" id="mermaidRoleFilterOptions">
                            <!-- Role checkboxes will be populated by JavaScript -->
                        </div>
                    </div>
                    
                    <div class="zoom-controls">
                        <button class="zoom-btn" onclick="mermaidZoomOut()" title="Zoom Out">−</button>
                        <span class="zoom-level" id="mermaidZoomLevel">100%</span>
                        <button class="zoom-btn" onclick="mermaidZoomIn()" title="Zoom In">+</button>
                        <button class="zoom-btn" onclick="mermaidResetZoom()" title="Reset Zoom">⌂</button>
                    </div>
                </div>
            </div>
            
            <div class="navigation-help" style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 10px; padding: 8px; background-color: var(--vscode-editorWidget-background); border-radius: 4px;">
                <strong>Navigation:</strong> 
                +/- buttons to zoom • Mouse wheel to zoom • Drag to pan • Scroll to navigate zoomed content
            </div>
        </div>
        
        <div class="mermaid-viewport">
            <div class="mermaid-container" id="mermaidContainer">
                <div id="mermaidDiagram" class="mermaid">
${mermaidSyntax}
                </div>
            </div>
        </div>
        
        <div id="mermaidSyntaxDisplay" class="mermaid-syntax" style="display: none;">${escapeHtml(mermaidSyntax)}</div>
    `;
}

/**
 * Generates Mermaid syntax from flow map data
 * @param {Object} flowMap Flow map data
 * @param {string} diagramType Diagram type (e.g., 'flowchart TD', 'flowchart LR', 'graph TD', 'graph LR')
 * @returns {string} Mermaid syntax
 */
function generateMermaidSyntax(flowMap, diagramType = "flowchart TD") {
    let mermaidCode = diagramType + "\n";
    
    // Add nodes for each page
    if (flowMap.pages && flowMap.pages.length > 0) {
        // Track used node IDs to prevent duplicates
        const usedNodeIds = new Set();
        
        flowMap.pages.forEach((page, index) => {
            if (!page || !page.name) {
                console.warn('Invalid page object at index', index, page);
                return;
            }
            
            let nodeId = sanitizeNodeId(page.name);
            
            // Ensure unique node IDs
            let counter = 1;
            while (usedNodeIds.has(nodeId)) {
                nodeId = sanitizeNodeId(page.name) + '_' + counter;
                counter++;
            }
            usedNodeIds.add(nodeId);
            
            const displayText = sanitizeDisplayText(page.titleText || page.name);
            const nodeShape = getNodeShapeForPageType(page.type);
            
            // Add node with appropriate shape and styling
            mermaidCode += `    ${nodeId}${nodeShape.start}"${displayText}"${nodeShape.end}\n`;
        });
        
        mermaidCode += "\n";
        
        // Add connections (excluding self-references which cause syntax errors)
        if (flowMap.connections && flowMap.connections.length > 0) {
            flowMap.connections.forEach(connection => {
                if (!connection || !connection.from || !connection.to) {
                    console.warn('Invalid connection object', connection);
                    return;
                }
                
                const fromId = sanitizeNodeId(connection.from);
                const toId = sanitizeNodeId(connection.to);
                
                // Skip self-referencing connections and ensure both nodes exist
                if (fromId !== toId && fromId && toId) {
                    const buttonText = connection.buttonText || "";
                    
                    if (buttonText) {
                        const sanitizedButtonText = sanitizeDisplayText(buttonText);
                        mermaidCode += `    ${fromId} -->|"${sanitizedButtonText}"| ${toId}\n`;
                    } else {
                        mermaidCode += `    ${fromId} --> ${toId}\n`;
                    }
                }
            });
        }
        
        mermaidCode += "\n";
        
        // Add class definitions for styling
        mermaidCode += "    classDef formPage fill:#e1f5fe,stroke:#01579b,stroke-width:2px\n";
        mermaidCode += "    classDef reportPage fill:#f3e5f5,stroke:#4a148c,stroke-width:2px\n";
        
        // Apply classes to nodes
        mermaidCode += "\n";
        flowMap.pages.forEach(page => {
            if (!page || !page.name) {
                return;
            }
            
            const nodeId = sanitizeNodeId(page.name);
            if (page.type === 'form') {
                mermaidCode += `    class ${nodeId} formPage\n`;
            } else if (page.type === 'report') {
                mermaidCode += `    class ${nodeId} reportPage\n`;
            }
        });
    } else {
        mermaidCode += "    NoPages[\"No pages found in the model\"]\n";
        mermaidCode += "    class NoPages emptyState\n";
        mermaidCode += "    classDef emptyState fill:#ffebee,stroke:#c62828,stroke-width:2px\n";
    }
    
    return mermaidCode;
}

/**
 * Escapes HTML characters for safe display
 * @param {string} text Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (!text) {
        return '';
    }
    
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

/**
 * Sanitizes display text for Mermaid syntax
 * @param {string} text Original text
 * @returns {string} Sanitized text safe for Mermaid
 */
function sanitizeDisplayText(text) {
    if (!text) {
        return '';
    }
    
    // Replace problematic characters for Mermaid syntax
    return text
        .replace(/"/g, '\\"')  // Escape double quotes
        .replace(/'/g, "\\'")  // Escape single quotes
        .replace(/\n/g, ' ')   // Replace newlines with spaces
        .replace(/\r/g, '')    // Remove carriage returns
        .replace(/\t/g, ' ')   // Replace tabs with spaces
        .replace(/\s+/g, ' ')  // Collapse multiple spaces
        .trim();               // Remove leading/trailing spaces
}

/**
 * Sanitizes a node ID for Mermaid syntax
 * @param {string} name Original name
 * @returns {string} Sanitized node ID
 */
function sanitizeNodeId(name) {
    if (!name || typeof name !== 'string') {
        return 'InvalidNode_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Replace spaces and special characters with underscores
    // Ensure it starts with a letter and contains only valid characters
    let sanitized = name
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    
    // Ensure it starts with a letter (Mermaid requirement)
    if (!/^[a-zA-Z]/.test(sanitized)) {
        sanitized = 'Node_' + sanitized;
    }
    
    // Ensure minimum length
    if (sanitized.length < 2) {
        sanitized = 'Node_' + sanitized + '_' + Math.random().toString(36).substr(2, 5);
    }
    
    return sanitized;
}

/**
 * Gets the appropriate node shape for a page type
 * @param {string} pageType Page type (form, report, etc.)
 * @returns {Object} Object with start and end shape characters
 */
function getNodeShapeForPageType(pageType) {
    switch (pageType) {
        case 'form':
            return { start: '[', end: ']' }; // Rectangle for forms
        case 'report':
            return { start: '(', end: ')' }; // Rounded rectangle for reports
        default:
            return { start: '[', end: ']' }; // Default rectangle
    }
}

module.exports = {
    generateHTMLContent,
    generateBodyContent,
    generateStatisticsContent,
    generateMermaidContent,
    getEmbeddedCSS,
    getEmbeddedJavaScript
};

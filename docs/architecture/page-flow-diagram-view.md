# Page Flow Diagram View Architecture

## Component Overview
The `pageFlowDiagramView.js` is a sophisticated webview component that visualizes page flow connections in the AppDNA model. It creates an interactive D3.js-based diagram showing how forms and reports connect through button destinations.

## D3.js Force Simulation Configuration
The page flow diagram uses D3.js force-directed layout with custom settings optimized for non-overlapping node layout:
- **Link Distance**: 200 - Longer distance between connected nodes for better spacing
- **Link Strength**: 0.1 - Very weak connection force to minimize pulling between connected nodes
- **Charge Strength**: -150 - Strong repulsion force to keep all nodes well separated
- **Collision Radius**: 120 - Large collision radius to prevent overlap (nodes are 180x100 pixels)
- **Collision Strength**: 1.0 - Maximum collision strength to enforce strict separation
- **Center Force**: Applied to keep nodes centered in the container

This configuration prioritizes preventing node overlap while maintaining weak connections between related pages. The large collision radius accounts for the full node dimensions (180x100) plus padding to ensure visual clarity.

## Key Features
- **Data Extraction**: Automatically extracts pages from the model by finding forms (objectWorkflow) and reports with `isPage="true"`
- **Button Analysis**: Analyzes buttons in workflows and reports to identify navigation connections via `destinationTargetName`
- **D3.js Visualization**: Uses D3.js force-directed layout for interactive node positioning and connection rendering
- **Role-based Filtering**: Provides filtering by role requirements including a "Public Pages" option
- **Interactive Navigation**: Clicking on nodes opens corresponding form/report detail views
- **Real-time Statistics**: Shows counts of total pages, forms, reports, and connections

## Data Flow
1. `showPageFlowDiagram()` → Gets all objects from ModelService
2. `extractPagesFromModel()` → Filters for pages with `isPage="true"`
3. `extractButtonsFromWorkflow/Report()` → Finds buttons with destination targets
4. `buildFlowMap()` → Creates connections between pages based on button destinations
5. D3.js renders interactive force-directed graph with draggable nodes

## Technical Implementation
- Uses D3.js v7 for advanced graph visualization
- Force simulation with collision detection and link constraints
- SVG-based rendering with zoom/pan capabilities
- WebView messaging for navigation to detail views
- Responsive design with VS Code theme integration

## Debug Features
- Extensive console logging for troubleshooting data extraction
- Empty state shows raw flowData for debugging
- Debug information panel shows filter states and data counts

## Page Flow Diagram Refactoring (July 13, 2025)

Successfully refactored the large pageFlowDiagramView.js file (1866 lines) into a modular structure following the data object view pattern:

### New Structure:
- **Main View**: `src/webviews/pageflow/pageFlowDiagramView.js` - Panel management and core logic
- **Helpers**:

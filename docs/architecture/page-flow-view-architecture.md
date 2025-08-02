# Page Flow View Architecture (Added July 13, 2025)

The page flow view has been refactored into a modular architecture:

- **Main coordinator**: `src/webviews/pageFlowDiagramView.js` - Simple re-export for backward compatibility
- **Core logic**: `src/webviews/pageflow/pageFlowDiagramView.js` - Main webview management, message handling
- **HTML generation**: `src/webviews/pageflow/components/htmlGenerator.js` - Large file with HTML, CSS, and JavaScript generation
- **Data processing**: `src/webviews/pageflow/helpers/` - Page extraction and flow building utilities

## Tab System
The view uses a tab system with:
- **Diagram tab**: Interactive D3.js visualization with zoom, search, role filtering
- **Mermaid tab**: Mermaid.js flowchart representation with copy/download functionality
- **Statistics tab**: Summary information about pages, connections, and data quality

## Data Flow
1. ModelService provides all objects
2. `pageExtractor.js` extracts pages from model objects
3. `flowBuilder.js` creates flow map with pages and connections
4. HTML generator creates complete HTML with embedded CSS and JavaScript
5. Webview displays content with message passing for interactions

## Mermaid Integration
- Uses Mermaid.js CDN for flowchart generation
- Generates flowchart syntax from flow map data
- Supports copying syntax and downloading SVG
- Uses VS Code theme variables for styling consistency
- Different node shapes for forms (rectangles) vs reports (rounded rectangles)

# AppDNA VS Code Extension Architecture Notes

This file serves as the main index for architecture documentation. The detailed architecture notes have been organized into separate files by topic for better maintainability.

## Recent Changes

### Mermaid Zoom & Pan Functionality Improvements (2025-07-19)
Fixed erratic zoom behavior in the Mermaid diagram tab in the Page Flow View:
- **Key Improvements:**
  - Corrected transform origin issues for consistent zoom behavior
  - Refined mouse position calculation for accurate cursor-centered zoom
  - Improved touch event handling for reliable mobile experience
  - Standardized zoom application across all zoom functions
  - Fixed reset zoom to properly center the diagram
- **Zoom Implementation Differences:**
  - **Graph Tab:** Uses D3.js built-in zoom behavior with sophisticated event handling
  - **Mermaid Tab:** Uses CSS transforms with custom event handlers
  - Both now support mouse wheel zoom, drag panning, and touch gestures
- **Technical Considerations:**
  - Variable zoom factors (1.05-1.2) based on zoom level for precision
  - Transform origin maintained at mouse position during zoom
  - State management via mermaidZoom and mermaidPan variables
  - Event handlers initialized when switching to Mermaid tab

### Form Details View Table View Removal (2025-07-13)
Removed the table view functionality from all Form Details View tabs (Parameters, Buttons, Output Variables) to simplify the interface:
- **Files Modified:**
  - `mainTemplate.js`: Removed table view HTML elements, view switching icons, and simplified parameters
  - `detailsViewGenerator.js`: Removed table template imports and function calls
  - `uiEventHandlers.js`: Removed view switching event handlers since only list view remains
  - `parameterManagementFunctions.js`: Removed table view initialization and switching code
  - `buttonManagementFunctions.js`: Removed table view initialization and switching code
  - `outputVariableManagementFunctions.js`: Removed table view initialization and switching code
- **UI Changes:**
  - No more "List View"/"Table View" toggle buttons
  - Only the list view interface remains for all tabs
  - Add buttons repositioned where view toggle buttons were
  - Cleaner, simpler interface with consistent list-based editing

### Report Details View Table View Removal (2025-07-13)
Removed the table view functionality from all Report Details View tabs (Columns, Buttons, Filters) to simplify the interface:
- **Files Modified:**
  - `mainTemplate.js`: Removed table view HTML elements, view switching icons, and simplified parameters
  - `detailsViewGenerator.js`: Removed table template imports and function calls
  - `uiEventHandlers.js`: Removed view switching event handlers since only list view remains
- **UI Changes:**
  - No more "List View"/"Table View" toggle buttons
  - Only the list view interface remains for all tabs
  - Add buttons repositioned where view toggle buttons were
  - Cleaner, simpler interface with consistent list-based editing

# AppDNA VS Code Extension Architecture Notes

This file serves as the main index for architecture documentation. The detailed architecture notes have been organized into separate files by topic for better maintainability.

## Architecture Documentation

### [UI Components](./docs/architecture/ui-components.md)
Documentation for all user interface components including:
- Form and Report Details Views
- Modal implementations and enhancements  
- Wizard implementations and focus handling
- Tree view functionality and object hierarchy
- Button and input field behaviors
- Auto-focus and keyboard navigation features

**Sections:** 30 detailed architecture notes covering UI components, modals, wizards, tree views, and user interaction patterns.

### [Configuration System](./docs/architecture/configuration-system.md)
Documentation for configuration management including:
- AppDNA configuration file system (app-dna.config.json)
- Settings tab implementations
- Property hiding and read-only field management
- Auto-expand and conditional tree view features

**Sections:** 5 detailed notes covering configuration management, settings UI, and user preference handling.

### [Bug Fixes and Improvements](./docs/architecture/bug-fixes-and-improvements.md)
Documentation for bug fixes and system improvements including:
- Font consistency fixes
- Property management issue resolutions
- Validation error display enhancements
- Web extension compatibility updates
- Schema loading issue fixes

**Sections:** 5 detailed notes covering bug fixes, improvements, and compatibility updates.

### [Other Architecture](./docs/architecture/other-architecture.md)
Documentation for other architectural components including:
- Model AI panel management during logout
- User registration implementation
- MCP (Model Context Protocol) server implementation

**Sections:** 3 detailed notes covering specialized architectural components.

## Page Flow Diagram View Architecture

### Component Overview
The `pageFlowDiagramView.js` is a sophisticated webview component that visualizes page flow connections in the AppDNA model. It creates an interactive D3.js-based diagram showing how forms and reports connect through button destinations.

### D3.js Force Simulation Configuration
The page flow diagram uses D3.js force-directed layout with custom settings optimized for non-overlapping node layout:
- **Link Distance**: 200 - Longer distance between connected nodes for better spacing
- **Link Strength**: 0.1 - Very weak connection force to minimize pulling between connected nodes
- **Charge Strength**: -150 - Strong repulsion force to keep all nodes well separated
- **Collision Radius**: 120 - Large collision radius to prevent overlap (nodes are 180x100 pixels)
- **Collision Strength**: 1.0 - Maximum collision strength to enforce strict separation
- **Center Force**: Applied to keep nodes centered in the container

This configuration prioritizes preventing node overlap while maintaining weak connections between related pages. The large collision radius accounts for the full node dimensions (180x100) plus padding to ensure visual clarity.

### Key Features
- **Data Extraction**: Automatically extracts pages from the model by finding forms (objectWorkflow) and reports with `isPage="true"`
- **Button Analysis**: Analyzes buttons in workflows and reports to identify navigation connections via `destinationTargetName`
- **D3.js Visualization**: Uses D3.js force-directed layout for interactive node positioning and connection rendering
- **Role-based Filtering**: Provides filtering by role requirements including a "Public Pages" option
- **Interactive Navigation**: Clicking on nodes opens corresponding form/report detail views
- **Real-time Statistics**: Shows counts of total pages, forms, reports, and connections

### Data Flow
1. `showPageFlowDiagram()` → Gets all objects from ModelService
2. `extractPagesFromModel()` → Filters for pages with `isPage="true"`
3. `extractButtonsFromWorkflow/Report()` → Finds buttons with destination targets
4. `buildFlowMap()` → Creates connections between pages based on button destinations
5. D3.js renders interactive force-directed graph with draggable nodes

### Technical Implementation
- Uses D3.js v7 for advanced graph visualization
- Force simulation with collision detection and link constraints
- SVG-based rendering with zoom/pan capabilities
- WebView messaging for navigation to detail views
- Responsive design with VS Code theme integration

### Debug Features
- Extensive console logging for troubleshooting data extraction
- Empty state shows raw flowData for debugging
- Debug information panel shows filter states and data counts

### [Client Script Architecture](./docs/architecture/client-script-architecture.md)
Documentation for client script architecture including:
- Modularization pattern for client-side scripts
- Common pitfalls to avoid when working with client scripts
- Client script testing guidelines

**Sections:** 3 detailed notes covering client script modularization, pitfalls, and testing.

## Quick Reference

### Recent Major Updates
- **2025-07-05**: Form Details View and Report Details View Structure
- **2025-07-05**: MCP Server Implementation
- **2025-07-05**: Report Details View Architecture Review
- **2025-06-27**: Custom Logout Confirmation Modal
- **2025-01-20**: Welcome View Auto-Opening on Login
- **2025-07-12**: Forms Treeview Conditional Visibility Change

### Key Architecture Patterns
- **Schema-driven UI**: All editable properties come directly from the schema
- **Modular Templates**: Separate template files for different UI components
- **Property Toggling**: Properties can be added/removed via checkboxes
- **Tab State Persistence**: Active tab is restored when re-opening views

### File Organization
All detailed architecture notes are now organized in the `docs/architecture/` directory:
```
docs/architecture/
├── ui-components.md                    # UI-related architecture (30 sections)
├── configuration-system.md            # Configuration management (5 sections)
├── bug-fixes-and-improvements.md      # Bug fixes and improvements (5 sections)
├── other-architecture.md              # Other specialized components (3 sections)
└── client-script-architecture.md      # Client script architecture (3 sections)
```

### Contributing to Architecture Documentation
When adding new architecture notes:
1. Determine the appropriate category from the files above
2. Add the new section to the relevant file in `docs/architecture/`
3. Update the section count in this index file
4. Follow the existing format with date stamps and clear headings

---

*Architecture documentation restructured on 2025-01-15 to improve maintainability and organization.*

## Forms Treeview Conditional Visibility (2025-07-12)

The FORMS treeview item now follows the same conditional visibility pattern as the REPORTS treeview item:
- Both FORMS and REPORTS are only shown when `settings.editor.showAdvancedProperties` is set to `true`
- When `showAdvancedProperties` is `false`, only PROJECT, DATA OBJECTS, and MODEL SERVICES are shown at the root level
- This provides a cleaner interface for basic users while keeping advanced features accessible when needed

Implementation details:
- Modified `jsonTreeDataProvider.ts` to wrap FORMS creation in the same conditional check as REPORTS
- Updated documentation to reflect FORMS as a conditional item
- Maintained the same order: PROJECT, DATA OBJECTS, [FORMS], [REPORTS], MODEL SERVICES

## Property Display Configuration

### Object Properties View Filtering
- Property display can be controlled by filtering the `propColumns` array in both list and table view templates
- Located in: `src/webviews/objects/components/templates/propertiesListTemplate.js` and `propertiesTableTemplate.js`
- To hide properties: Add property names to the `hiddenProperties` array before filtering
- The `isFKNonLookupIncludedInXMLFunction` property is hidden from user view while still being preserved in the JSON model
- Schema properties are dynamically read from `app-dna.schema.json` and filtered before UI generation

### Report Settings Tab Property Filtering
- Report property display is controlled by the `getReportPropertiesToIgnore()` function in `settingsTabTemplate.js`
- Properties in the ignore list are converted to lowercase for comparison with schema properties
- Located in: `src/webviews/reports/components/templates/settingsTabTemplate.js`
- The properties `visualizationLineChartGridHorizTitle` and `visualizationCardViewIsImageAvailable` are hidden from the settings tab
- Fixed property name casing issues where ignore list entries didn't match actual schema property names

### Form Settings Tab Property Filtering
- Form property display is controlled by the `getFormPropertiesToIgnore()` function in form `settingsTabTemplate.js`
- Properties in the ignore list are converted to lowercase for comparison with schema properties
- Located in: `src/webviews/forms/components/templates/settingsTabTemplate.js`
- Hidden properties include: `formFooterImageURL`, `isImpersonationPage`, `isCreditCardEntryUsed`, `headerImageURL`, `footerImageURL`, `isDynaFlow`, `isDynaFlowTask`, `isCustomPageViewUsed`
- Properties are hidden from user view while still being preserved in the JSON model

### Form Parameters Tab Property Filtering
- Form parameter property display is controlled by the `getParamPropertiesToHide()` function in both list and table templates
- Properties in the ignore list are converted to lowercase for comparison with schema properties
- Located in: `src/webviews/forms/components/templates/paramsListTemplate.js` and `paramsTableTemplate.js`
- Hidden properties include: `fKObjectQueryName`, `isFKListOptionRecommended`, `FKListRecommendedOption`, `isCreditCardEntry`, `isTimeZoneDetermined`, `defaultValue`
- Both list and table views now consistently filter the same properties
- Properties are hidden from user view while still being preserved in the JSON model

## Config File Watcher Implementation (Added 2025-07-12)

Implemented automated configuration reloading to address the TODO item "if appdna config file changes, reload its settings".

### Problem:
- The extension only watched the model file (`app-dna.json`) for changes, not the configuration file (`app-dna.config.json`)
- External changes to configuration settings would not be reflected until manual refresh
- Settings like `showAdvancedProperties` and `expandNodesOnLoad` could become out of sync

### Solution:
Added comprehensive configuration file watching and reloading system:

#### 1. **Config File Watcher** (`extension.ts`)
- Created `FileSystemWatcher` for `app-dna.config.json` alongside existing model file watcher
- Watches for file creation, deletion, and modification events
- Triggers `appdna.reloadConfig` command on any config file changes

#### 2. **Reload Config Command** (`registerCommands.ts`)
- New command `appdna.reloadConfig` registered for internal use
- Refreshes tree view to apply configuration changes (like advanced properties visibility)
- Reloads any open AppDNA settings panels with fresh configuration data
- Provides debug logging for config reload events

#### 3. **Settings Panel Reload Support** (`appDnaSettingsView.js`)
- Added `reload()` method to `AppDNASettingsPanel` class
- New exported function `reloadAppDNASettingsPanel()` for external access
- Automatically refreshes form data when config changes externally

### Technical Implementation:
```typescript
// Config file watcher setup
const configFileWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(workspaceFolder, 'app-dna.config.json')
);

configFileWatcher.onDidChange(() => {
    vscode.commands.executeCommand("appdna.reloadConfig");
});
```

### Benefits:
- **Real-time Updates**: Configuration changes are immediately reflected in the UI
- **Consistent State**: Tree view and panels always show current configuration
- **Better UX**: No manual refresh needed when config file is modified externally
- **Development Friendly**: Hot-reloading of settings during development and testing

### Integration Points:
- File watcher disposal managed by extension context subscriptions
- Reuses existing `getShowAdvancedPropertiesFromConfig()` and `getExpandNodesOnLoadFromConfig()` utilities
- Maintains consistency with existing refresh patterns in the extension

This implementation resolves the configuration sync issue and provides a foundation for future configuration-driven features.

---

# Property Modal Architecture Notes

## Add Property Modal Structure
- Located in `src/webviews/objects/components/templates/`
- Template: `propertyModalTemplate.js` - HTML structure
- Functionality: `propertyModalFunctionality.js` - JavaScript behavior  
- Integration: Called from `saveSubmitHandlers.js` via `createPropertyModal()`

## Current Tabs
1. **Single Property**: Basic property with name only
2. **Bulk Add**: Multiple basic properties

## Missing Lookup Tab (TODO)
The modal needs a third tab for foreign key/lookup properties:
- Target object selection dropdown (from model data objects)
- Target property selection dropdown (from selected object properties)
- Auto-populates: isFK="true", isFKLookup="true", fKObjectName, fKObjectPropertyName
- Sample structure from todo.md:
```json
{
  "fKObjectName": "DataSourceType",
  "fKObjectPropertyName": "DataSourceTypeID", 
  "isFK": "true",
  "isFKLookup": "true",
  "name": "DataSourceTypeID"
}
```

## Property Management Flow
1. Modal created by `createPropertyModal()` 
2. Property added via `addNewProperty(propName)`
3. Property Management functions in `propertyManagement.js`
4. Table/list views updated with new property
5. Checkbox behavior initialized for new row
6. Model updated via `vscode.postMessage()` with 'updateModel' command

## Schema Integration
- Property schema defined in `app-dna.schema.json` 
- FK properties have additional fields: `fKObjectName`, `fKObjectPropertyName`, `isFK`, `isFKLookup`
- Property validation uses schema enum values for dropdowns
- Default values and descriptions come from schema

## Data Object Lookup Item Tab Review - Issues Identified

### 1. Checkbox Disable Issue ✅ FIXED
**Problem**: "once checked, the checkbox should be disabled and not editable"
**Current Behavior**: Checkboxes can be unchecked after being checked
**Location**: `lookupItemManagement.js` lines 400-440

**Root Cause**: The checkbox event handler doesn't disable the checkbox after checking it
**Fix Applied**: Added `this.disabled = true;` and `data-originally-checked="true"` when checkbox is checked in both table view and list view

### 2. CustomIntProp1Value Not Updating ✅ FIXED  
**Problem**: "custom int prop 1 value doesn't change when list selection changes"
**Current Behavior**: When switching between lookup items in the list view, the customIntProp1Value field may not update correctly
**Location**: `lookupItemManagement.js` showLookupItemDetails function

**Root Cause**: Field population logic may not be properly updating all fields when selection changes
**Fix Applied**: 
- Improved field clearing to completely clear all input values including customIntProp1Value
- Added checkbox re-enabling and attribute clearing when switching selections
- Enhanced field population to properly set existing checkboxes as disabled

### 3. Current Checkbox Behavior Analysis
- ✅ Checkboxes start unchecked for properties that don't exist
- ✅ When checked, enables the input field and sets default value
- ✅ Visual styling updates correctly (updateInputStyle function)
- ✅ FIXED: Checkbox is now disabled once checked (prevents unchecking)
- ✅ FIXED: Proper field clearing and re-enabling on selection change

### 4. Schema Structure
Lookup items support these properties:
- `name` (string) - Internal name
- `displayName` (string) - Display name  
- `description` (string) - Description
- `isActive` (enum: "true"/"false") - Active status
- `customIntProp1Value` (string) - Custom integer property value

### 5. View Structure
- **List View**: Shows lookup items in dropdown, details form below
- **Table View**: Shows all lookup items in table with inline editing
- **Both views** support checkbox-based property existence toggle

### 6. Architecture Issues ✅ RESOLVED
- ✅ FIXED: Checkbox behavior now consistent with property modal (disables after check)
- ✅ FIXED: List view selection change properly clears previous values
- ✅ FIXED: Field population logic improved for customIntProp1Value and all other fields

### 7. Implementation Details
**Changes Made**:
1. **Table View Checkbox Fix**: Added `this.disabled = true;` and `data-originally-checked="true"` in checkbox change handler
2. **List View Checkbox Fix**: Added `e.target.disabled = true;` and `data-originally-checked="true"` in form change handler  
3. **Field Clearing Enhancement**: Improved `showLookupItemDetails()` to completely clear all field values
4. **Checkbox Reset**: Added logic to re-enable and clear attributes when switching between lookup items
5. **Existing Property Handling**: Enhanced population logic to disable checkboxes for existing properties

**Behavior After Fix**:
- Checkboxes start unchecked for non-existent properties
- When checked, checkbox becomes disabled (cannot be unchecked)
- Input fields are enabled/disabled based on checkbox state
- Switching lookup items properly clears all fields including customIntProp1Value
- Existing properties show as checked and disabled checkboxes
- Field values update correctly when changing selections

## Tree View Structure
- Tree view is provided by JsonTreeDataProvider in src/providers/jsonTreeDataProvider.ts
- Main hierarchy: PROJECT → DATA OBJECTS → [PAGES (containing FORMS/REPORTS)] → MODEL SERVICES
- PAGES item groups UI-related components (FORMS and REPORTS) under a single parent
- FORMS and REPORTS retain their original contextValues and functionality when nested under PAGES
- Advanced properties setting controls visibility of PAGES, FORMS, and REPORTS sections

## Refresh Functionality Enhancement
The refresh button now uses an optimized approach:
- Sends a message to the extension to get fresh model data
- Updates only the flow data without reloading the entire webview
- Preserves user state (zoom level, role filters, search terms)
- Shows loading and success notifications for better UX
- Re-populates role filters based on updated data
- Avoids page flicker and maintains user context

Previous implementation reloaded the entire HTML which caused loss of state and poor user experience.

## Tabbed Interface Implementation
Added a clean tabbed interface to organize the page flow view:
- **Force-Directed Graph Tab**: Contains the interactive D3.js diagram with zoom controls
- **Stats Tab**: Contains statistics, legend, and connection information
- **Professional Design**: Uses VS Code's design language with proper hover states and active indicators
- **Smart Resizing**: Automatically handles SVG resizing when switching back to the graph tab
- **State Preservation**: Tab switching preserves diagram state and user interactions

The tabs improve organization by separating the interactive visualization from the informational content, reducing visual clutter while maintaining easy access to both views.

### Zoom Controls Repositioning
Moved zoom controls from the main header into the Force-Directed Graph tab:
- **Better Context**: Zoom controls are now only visible when viewing the graph
- **Floating Overlay**: Positioned as a floating overlay in the top-right corner of the graph
- **Space Efficiency**: Frees up header space for other global controls
- **Professional Appearance**: Styled with subtle shadow and proper VS Code theming
- **High Z-Index**: Ensures controls stay above the graph content

The zoom controls (zoom in, zoom out, reset, and level indicator) are now contextually relevant and don't clutter the interface when viewing statistics.

## Page Flow Diagram Refactoring (July 13, 2025)

Successfully refactored the large pageFlowDiagramView.js file (1866 lines) into a modular structure following the data object view pattern:

### New Structure:
- **Main View**: `src/webviews/pageflow/pageFlowDiagramView.js` - Panel management and core logic
- **Helpers**:
  - `pageExtractor.js` - Page extraction from model data
  - `flowBuilder.js` - Flow map building logic
- **Components**:
  - `htmlGenerator.js` - HTML template generation with inline CSS/JS
- **Scripts**:
  - `diagramRenderer.js` - D3.js diagram rendering logic
  - `eventHandlers.js` - Event handling and state management
- **Styles**:
  - `pageflow.css` - External CSS styles

### Benefits:
- Reduced main file from 1866 lines to ~140 lines

## Mermaid Diagram Tab Enhancement (July 18, 2025)

Enhanced the Mermaid diagram tab in the Page Flow view to provide the same level of zoom/pan interaction as the D3.js graph view:

### Key Improvements:
- **Enhanced Zoom Functionality**: 
  - Mouse wheel zoom centered on mouse position
  - Variable zoom factors based on zoom level (1.15, 1.1, 1.05)
  - Zoom range from 0.05 to 20 (matching D3 graph)
  - Smooth zoom transitions

- **Advanced Pan Support**:
  - Drag-to-pan using mouse button
  - Proper cursor feedback (grab/grabbing)
  - Mobile device touch support

- **Improved Touch Support**:
  - Pinch to zoom gesture with proper centering
  - Single finger pan gesture
  - Prevents default scroll behavior for better experience

### Implementation Details:
- Uses CSS transforms for both translation (pan) and scaling (zoom)
- State variables track zoom level (mermaidZoom) and pan position (mermaidPanX, mermaidPanY)
- Dynamically adjusts container dimensions based on content and zoom level
- Maintains proper transform origin for intuitive zoom behavior
- Initializes automatically after Mermaid diagram rendering

The result is a consistent interaction model across both visualization tabs, with the Mermaid diagram now offering the same level of intuitive navigation as the D3.js graph view.
- Improved maintainability and readability
- Better separation of concerns
- Easier testing and debugging
- Follows established patterns in the codebase

## Page Flow View Architecture (Added July 13, 2025)

The page flow view has been refactored into a modular architecture:

- **Main coordinator**: `src/webviews/pageFlowDiagramView.js` - Simple re-export for backward compatibility
- **Core logic**: `src/webviews/pageflow/pageFlowDiagramView.js` - Main webview management, message handling
- **HTML generation**: `src/webviews/pageflow/components/htmlGenerator.js` - Large file with HTML, CSS, and JavaScript generation
- **Data processing**: `src/webviews/pageflow/helpers/` - Page extraction and flow building utilities

### Tab System
The view uses a tab system with:
- **Diagram tab**: Interactive D3.js visualization with zoom, search, role filtering
- **Mermaid tab**: Mermaid.js flowchart representation with copy/download functionality
- **Statistics tab**: Summary information about pages, connections, and data quality

### Data Flow
1. ModelService provides all objects
2. `pageExtractor.js` extracts pages from model objects
3. `flowBuilder.js` creates flow map with pages and connections
4. HTML generator creates complete HTML with embedded CSS and JavaScript
5. Webview displays content with message passing for interactions

### Mermaid Integration
- Uses Mermaid.js CDN for flowchart generation
- Generates flowchart syntax from flow map data
- Supports copying syntax and downloading SVG
- Uses VS Code theme variables for styling consistency
- Different node shapes for forms (rectangles) vs reports (rounded rectangles)

## Mermaid Tab Enhancements (July 13, 2025)

Added role filtering and zoom functionality to the Mermaid tab in the page flow view to match the capabilities of the D3 diagram tab:

### Role Filtering for Mermaid
- **Independent filter state**: Uses `mermaidSelectedRoles` Set to track selections separately from D3 tab
- **Dynamic role population**: `initializeMermaidRoleFilter()` populates checkboxes for available roles
- **Real-time updates**: `handleMermaidRoleChange()` and `updateMermaidDiagram()` regenerate diagram when filters change
- **Filtered syntax generation**: `generateMermaidSyntaxFromFlowMap()` creates new Mermaid code with only selected roles

### Zoom Controls for Mermaid
- **CSS transform-based zoom**: Uses `transform: scale()` on the mermaid container
- **Zoom state tracking**: `mermaidZoom` variable tracks current zoom level (0.1 to 3.0 range)
- **Zoom functions**: `mermaidZoomIn()`, `mermaidZoomOut()`, `mermaidResetZoom()` with proper bounds checking
- **Visual feedback**: `updateMermaidZoomDisplay()` shows current zoom percentage

### Implementation Details
- **String concatenation**: Used regular string concatenation instead of template literals to avoid syntax conflicts
- **Container styling**: Added CSS transition and transform-origin for smooth zoom animations
- **Initialization**: Role filter populated when switching to Mermaid tab via `switchTab()` function
- **Independent operation**: Mermaid tab filters and zoom work independently from D3 diagram tab

### User Experience
- Users can now filter pages by role in both D3 and Mermaid views independently
- Zoom controls allow better viewing of large or complex diagrams in Mermaid format
- Consistent UI pattern between both visualization tabs
- Smooth transitions and visual feedback for all interactions

## Checkbox Behavior Implementation

### Property Toggle Checkboxes in Table Views
When implementing property toggle checkboxes in table views (Forms, Reports, Objects), the following pattern must be followed for correct behavior:

1. **Template Implementation**: Checkboxes must use `"checked disabled"` when property exists:
   ```javascript
   `<input type="checkbox" class="property-checkbox" ${propertyExists ? "checked disabled" : ""} ${originallyChecked}>`
   ```

2. **Event Handler Implementation**: Must prevent unchecking of existing properties:
   ```javascript
   checkbox.addEventListener('change', function() {
       // Don't allow unchecking of properties that already exist in the model
       if (this.hasAttribute('data-originally-checked')) {
           this.checked = true;
           return;
       }
       
       if (this.checked) {
           // Enable input and disable checkbox to prevent unchecking
           this.disabled = true;
           this.setAttribute('data-originally-checked', 'true');
       }
   });
   ```

3. **CSS Class Names**: Different views use different class names:
   - Forms parameters: `property-toggle`
   - Forms buttons: `button-checkbox`
   - Forms output variables: `outputvar-checkbox`
   - Reports columns: `column-checkbox`
   - Reports buttons: `button-checkbox`
   - Objects properties: `prop-checkbox`

This pattern ensures users cannot accidentally remove existing properties from the model, only add new ones.

## Data Object Properties View Synchronization (2024-07-13)

### Issue Identified
The data object properties tab has both list and table views that allow users to edit property values. However, changes made in one view were not being reflected in the other view when switching between them.

### Root Cause
- Both views update the in-memory `props` array when changes are made
- However, when switching views, the UI controls were not being refreshed with the current state of the `props` array
- This caused inconsistent data display between list and table views

### Solution Implemented (Revised July 13, 2025)
1. **Added View Refresh Functions** in `clientScriptTemplate.js`:
   - `window.refreshPropertiesTableView()` - Updates table view with current model data
   - `window.refreshPropertiesListView()` - Updates list view with current model data  
   - `window.refreshLookupItemsTableView()` - Updates lookup items table view
   - `window.refreshLookupItemsListView()` - Updates lookup items list view
   - Functions are defined globally on `window` object to ensure accessibility across modules

2. **Enhanced View Switching Logic**:
   - Modified the view switching event handler in `uiEventHandlers.js` to call appropriate refresh functions when switching views
   - Added small timeout delay (50ms) to ensure DOM is ready and pending updates are complete
   - Added extensive console logging for debugging synchronization issues

3. **Added Cross-View Updates**:
   - Modified `updatePropertyField()` in `saveSubmitHandlers.js` to refresh table view when list view changes
   - Modified `updateTableField()` in `saveSubmitHandlers.js` to refresh list view when table view changes
   - Modified `addNewProperty()` in `propertyManagement.js` to refresh list view after adding properties
   - All refresh calls use small timeout delays to handle timing issues

4. **Lookup Items Synchronization**:
   - Enhanced `saveLookupItemChanges()` to update table view when list view changes
   - Enhanced table input change handlers to update list view when table changes
   - Refresh functions access lookup items via `window.objectData.lookupItem` for proper scope access

### Key Files Modified
- `src/webviews/objects/components/templates/clientScriptTemplate.js` - Added global refresh functions with proper scope access
- `src/webviews/objects/components/scripts/uiEventHandlers.js` - Added view switching refresh calls with timing delays
- `src/webviews/objects/components/scripts/saveSubmitHandlers.js` - Added cross-view update calls with debugging
- `src/webviews/objects/components/scripts/propertyManagement.js` - Added refresh call after property addition
- `src/webviews/objects/components/scripts/lookupItemManagement.js` - Enhanced lookup item synchronization

### Technical Implementation Details (Revised)
- Refresh functions are defined globally on `window` object to ensure accessibility across all modules
- Functions access global variables (`props`, `propColumns`, `propItemsSchema`) defined in client script scope
- Lookup items are accessed via `window.objectData.lookupItem` to handle local variable scope properly
- Small timeout delays (10-50ms) are used to handle timing issues where DOM or data updates need completion
- Extensive console logging added for debugging synchronization issues
- Both properties and lookup items follow the same synchronization pattern with proper error handling

## Form Details View Issues and Fixes

### Issues Found (2025-07-13):
1. **Empty Implementation Functions**: The `updateModelDirectly` and `updateSettingsDirectly` functions in `formDetailsView.js` were placeholder functions that only logged messages, not actually updating the model.

2. **Command Name Mismatch**: The form UI event handlers were sending an `updateForm` command, but the message handler was only expecting `updateSettings` and `updateModel` commands.

3. **Missing Settings Handlers**: The form control utilities lacked proper event handlers to send `updateSettings` commands for individual property changes.

### Fixes Applied:
1. **Implemented Model Update Functions**: Added proper implementations for `updateModelDirectly` and `updateSettingsDirectly` in `formDetailsView.js`, following the same pattern as the working report details view.

2. **Added updateForm Command Handler**: Added a new case for handling `updateForm` commands for backward compatibility.

3. **Enhanced Form Control Utilities**: Added `setupSettingsInputHandlers()` function to properly handle checkbox and input changes for settings, sending `updateSettings` commands with proper property/exists/value structure.

4. **Fixed UI Event Handlers**: Removed conflicting updateForm logic from `uiEventHandlers.js` and integrated the proper settings handlers through the DOM initialization.

5. **Connected DOM Initialization**: Ensured `setupSettingsInputHandlers()` is called during DOM initialization to properly wire up the event handlers.

### Key Pattern for Model Updates:
- Settings changes send: `{ command: 'updateSettings', data: { property, exists, value } }`
- The backend handles individual property updates and calls `modelService.markUnsavedChanges()`
- Tree view is refreshed with `vscode.commands.executeCommand("appdna.refresh")`

## Local Array Synchronization Pattern (Added 2025-07-13)

### Problem: Property Changes Lost When Switching Between Items
When implementing details views with list views (Forms, Reports, Objects), changes to properties can be lost when switching between items if the local array is not synchronized with backend changes.

### Pattern:
1. **Local Array Declaration**: Client script maintains local arrays like `currentColumns`, `currentButtons`, etc.
2. **Selection Handler**: Reads from local array to populate form fields when switching items
3. **Change Handlers**: Must update BOTH backend model AND local array:
   ```javascript
   // Update local array FIRST
   currentColumns[currentColumnIndex][columnKey] = fieldValue;
   
   // THEN send to backend
   vscode.postMessage({
       command: 'updateColumn',
       data: { index, property, exists, value }
   });
   ```

### Implementation Notes:
- Update local array immediately when changes occur
- Both checkbox changes and input field changes need this pattern
- Applies to list view and table view handlers
- Critical for maintaining UI state consistency

### Example Files:
- `columnManagementFunctions.js` - Column property changes
- Similar pattern needed for buttons, parameters, etc.

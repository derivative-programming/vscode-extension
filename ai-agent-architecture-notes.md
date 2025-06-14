# AppDNA VS Code Extension Architecture Notes
   
## Data Object Settings Tab - Parent Object Name Read-Only Field (Added 2025-06-14)

Implemented requirement to make the 'Parent Object Name' textbox always read-only in the data object details view settings tab.

### Problem:
- The `parentObjectName` field in the settings tab was editable when the property existed in the object
- User requirement was to make this field always read-only regardless of property existence

### Solution:
- Modified `src/webviews/objects/components/templates/settingsTabTemplate.js` 
- Added conditional logic: `const isReadonly = !propertyExists || key === "parentObjectName"`
- Applied this logic to the input field template to force readonly attribute

### Technical Details:
- **File Modified**: `src/webviews/objects/components/templates/settingsTabTemplate.js`
- **Change Type**: Minimal - Added 3 lines, removed 1 line (net +2 lines)
- **Logic**: The field is now readonly if either the property doesn't exist OR if it's specifically the `parentObjectName` field
- **Consistency**: Other fields maintain their original behavior (editable when property exists)

### Testing Verified:
- Property exists with value: Field shows value and is readonly ✅
- Property doesn't exist: Field is empty and readonly ✅  
- Property is null: Field is empty and readonly ✅
- Property is empty string: Field is empty and readonly ✅
- Other fields unaffected: Description field remains editable when appropriate ✅

### Benefits:
- Prevents accidental modification of parent object relationships
- Maintains data integrity in object hierarchy
- Consistent with read-only styling (different background via CSS)
- No impact on existing functionality for other fields

*Last updated: December 21, 2024*

## Report Details View Reverse Button Height Fix (Added 2024-12-21)

Fixed an issue where the 'Reverse' button height didn't match the 'Copy' button height in the report details view list tabs.

### Problem:
- In the columns, buttons, and filters tabs list views, the Copy button had proper styling with padding `6px 12px`
- The Reverse button used class `.reverse-button` but had no specific CSS, falling back to generic button styles with padding `8px 16px`
- This made the Reverse button taller than the Copy button

### Solution:
- Added `.reverse-button` to existing CSS selectors in `detailsViewStyles.js`:
  - Added to main button styles: `.copy-props-button, .move-button, .reverse-button`
  - Added to hover styles: `.copy-props-button:hover, .move-button:hover, .reverse-button:hover`
- Now all buttons in `.list-buttons` containers have consistent height with padding `6px 12px`

### Files Modified:
- `src/webviews/reports/styles/detailsViewStyles.js`: Added 2 lines to include `.reverse-button` in existing selectors

### Benefits:
- Consistent button heights across all list view actions
- Improved visual design and user experience
- Minimal change with no risk of breaking existing functionality

## Tree View Object Selection Enhancement (Added 2025-06-14)

Added functionality to automatically select newly created data objects in the tree view after creation via the Add Object Wizard.

### Changes Made:
- **JsonTreeDataProvider** (`jsonTreeDataProvider.ts`): Added `selectDataObject(objectName)` method to programmatically select objects in tree view
- **Command Registration** (`registerCommands.ts`): Registered `appdna.selectDataObject` command that calls the provider method
- **Add Object Wizard** (`addObjectWizardView.js`): Added call to selection command after object creation with 300ms delay

### Implementation Details:
- **Tree Selection Process**: Expands DATA OBJECTS section first, then selects specific object with focus
- **Timing**: Uses setTimeout with 300ms delay to allow tree refresh to complete before selection
- **Error Handling**: Graceful error handling if tree view is not available or selection fails
- **VS Code Integration**: Uses native tree view reveal API with select, focus, and expand options

### Benefits:
- Improved user experience: Users can immediately see their newly created object in the tree
- Consistent with VS Code UX patterns for item selection after creation
- No impact on existing functionality - purely additive enhancement

*Last updated: December 24, 2024*

## Help View Implementation (Added 2024-12-24)

Added a Help view accessible from the tree view to provide users with quick access to documentation and support resources.

### Features:
- **Webview Panel**: Simple, clean help interface similar to welcome view pattern
- **GitHub Integration**: Direct links to repository and issues page
- **Positioning**: Help button positioned to the left of welcome button in tree view
- **VS Code Theming**: Uses consistent VS Code theme variables for appearance

### Implementation:
- **New Module** (`src/webviews/helpView.js`): Self-contained help view component following VS Code webview patterns
- **Command Registration** (`registerCommands.ts`): Added `appdna.showHelp` command registration
- **Package Configuration** (`package.json`): Added command definition with question mark icon and menu positioning
- **Positioning Logic**: Uses `navigation@-1` group to appear left of welcome button (`navigation@0`)

### UI Organization:
- **Learn More Section**: Links to GitHub repository with descriptive text
- **Report Issues Section**: Direct link to GitHub issues with reporting guidelines
- **Quick Tips Section**: Basic usage tips for new users
- **Professional Design**: Responsive layout with clear sections and consistent typography

### Benefits:
- **User Support**: Easy access to help without leaving VS Code
- **Issue Reporting**: Streamlined path for users to report bugs or request features
- **Documentation Access**: Quick link to comprehensive GitHub documentation
- **Minimal Overhead**: Lightweight implementation with no external dependencies 

## Property Modal UI Enhancement (Added 2025-12-20)

Updated the Add Property modal to use Pascal case instructions instead of placeholder text for better user guidance.

### Changes Made:
- **Template Updates** (`propertyModalTemplate.js`): Removed placeholder text from both single property input and bulk add textarea
- **User Guidance**: Added field-note divs with clear Pascal case instructions and example (ToDoItem)
- **CSS Styling** (`detailsViewStyles.js`): Added `.field-note` class with appropriate VS Code theming
- **Consistency**: Applied changes to both single property and bulk add tabs

### Implementation Details:
- **Replaced**: `placeholder="Enter property name"` with instructional div
- **Added**: "Use Pascal case (Example: ToDoItem). No spaces are allowed in names. Alpha characters only."
- **Styling**: Field notes use `--vscode-descriptionForeground` with italic styling for subtle appearance
- **Validation**: Existing validation rules `/^[a-zA-Z][a-zA-Z0-9]*$/` remain unchanged

### User Experience:
- Clear guidance on naming conventions without relying on placeholder text
- Visual example (ToDoItem) demonstrates proper Pascal case format
- Consistent instructions across both single and bulk add modes
- Maintains existing validation behavior and error messaging
 
*Last updated: December 20, 2024*

## Report Details View Move Button States Fix (Added 2024-12-20)

Fixed an issue where move up/down button states were not being updated after move operations in the report details view.

### Problem:
- In the columns, buttons, and parameters tabs list views, move up/down buttons enable/disable based on selected item position
- When a list item was clicked, move button states were updated correctly 
- However, after clicking move up/down buttons, the move button states were not updated for the new position
- This left buttons in incorrect enabled/disabled states after moves

### Solution:
- Added calls to `updateMoveButtonStates()` after move operations in `clientScriptTemplate.js`:
  - After `selectElement.selectedIndex = newIndex;` in `moveListItem()` function
  - After selection updates in `reverseList()` function
- Now move buttons correctly reflect whether the newly positioned item can be moved further

### Files Modified:
- `src/webviews/reports/components/templates/clientScriptTemplate.js`: Added 6 lines calling `updateMoveButtonStates()`

### Key Learning:
- When implementing move/reorder functionality, always update UI states after position changes
- The `updateMoveButtonStates()` function was already properly implemented but not being called at the right times
- Minimal fix: just 2 function calls added to existing move operation logic
 

## Move Up/Down Functionality for Report Details View (Added 2025-06-08)

Added Move Up and Move Down buttons for reordering items in the report details view list tabs.

### Features:
- Move Up/Down buttons for columns, buttons, and parameters tabs in list view mode
- Buttons are automatically disabled when no item is selected or item is at first/last position
- Visual feedback with proper enabled/disabled button states
- Model arrays are updated correctly with proper error handling
- Changes are marked as unsaved and view refreshes automatically

### Implementation:
- **HTML Template** (`mainTemplate.js`): Added buttons in `.list-buttons` containers next to Copy buttons
- **CSS Styles** (`detailsViewStyles.js`): Added flex layout for button containers and disabled button states
- **Client Script** (`clientScriptTemplate.js`): Added `moveListItem()` function and button state management
- **Message Handlers** (`reportDetailsView.js`): Added `moveColumn`, `moveButton`, `moveParam` command handlers
- **Array Operations**: Uses `array.splice()` to move items between indices in reportColumn, reportButton, reportParam arrays

### User Experience:
- Intuitive placement next to existing Copy functionality
- Clear visual feedback for available actions
- Consistent behavior across all three list view tabs
- Immediate visual updates in the UI when items are moved

## Font Consistency Fix (Added 2025-06-08)

Fixed font inconsistency between the lexicon view and project settings view:

### Issue:
- Project settings view was using `var(--vscode-editor-font-family)` 
- All other webviews (including lexicon view) use `var(--vscode-font-family)`
- This caused visual inconsistency between different views

### Solution:
- Changed project settings view to use `var(--vscode-font-family)` for consistency
- Single line change in `/src/webviews/projectSettingsView.js` line 349
- Verified all other webviews use the same standard font property

### Key Learning:
- **Font Standards**: All webviews should use `var(--vscode-font-family)` for body font
- **Consistency Check**: When styling webviews, grep for existing font-family usage to maintain consistency
- **VS Code CSS Variables**: `var(--vscode-font-family)` is the standard, not `var(--vscode-editor-font-family)`

### Build Verification:
- Webpack compilation successful
- TypeScript compilation passes
- ESLint clean (no new warnings)
- Minimal change: 1 line modified across 1 file

## Property Management Unsaved Changes Fix (Added 2025-01-14)

Fixed the missing unsaved changes flag when properties are added to data objects through the property management modal.

### Issue:
- When users added properties via the "Add Property" modal, the unsaved changes flag was not being set
- The `addNewProperty` function was only updating local webview data but not triggering model updates

### Solution:
- Added `document.dispatchEvent(new CustomEvent('propertyAdded'))` to the `addNewProperty` function
- Leveraged existing event infrastructure:
  - `saveSubmitHandlers.js` already had a listener for `propertyAdded` events
  - The listener calls `vscode.postMessage` with `updateModel` command
  - `updateModelDirectly` in `objectDetailsView.js` calls `modelService.markUnsavedChanges()`

### Implementation Details:
- Minimal change: 1 line added to `propertyManagement.js`
- Works for both single and bulk property additions
- Follows existing patterns used throughout the codebase
- No breaking changes to existing functionality

### Key Files Modified:
- `src/webviews/objects/components/scripts/propertyManagement.js`: Added event dispatch

### Architecture Pattern:
This fix demonstrates the event-driven communication pattern between webview JavaScript and the extension:
1. UI action in webview (add property)
2. Custom event dispatched (`propertyAdded`)
3. Event handler sends message to extension (`updateModel` command)
4. Extension updates model and marks unsaved changes
5. Tree view updates to show unsaved changes indicator

## Report Details View Property Hiding (Added 2025-06-08)

Implemented comprehensive property hiding functionality across all report details view tabs to improve UI usability:

### Properties Hidden:
- **Columns Tab**: 10 properties hidden (buttondestinationcontextobjectname, maxwidth, datetimedisplayformat, iscolumnsummetricavailable, issummarydisplayed, isconditionallydisplayed, isbuttonclickedonrowclick, buttonbadgecountpropertyname, isformfooter, isencrypted)
- **Buttons Tab**: 1 property hidden (destinationContextObjectName)
- **Parameters Tab**: 7 properties hidden (name, fkobjectname, isfk, isfklookup, fklistorderby, isunknownlookupallowed, defaultvalue)

### Implementation Details:
- Created helper functions in each template: `getColumnPropertiesToHide()`, `getButtonPropertiesToHide()`, `getParamPropertiesToHide()`
- Applied filtering to all view types: table view, list view, and modal dialog
- Used case-insensitive property name comparison for robust filtering
- Maintained alphabetical sorting of remaining visible properties
- Preserved existing functionality while hiding specified properties

### Key Files Modified:
- `columnsTableTemplate.js`, `columnsListTemplate.js`, `columnModalTemplate.js`: Column property filtering
- `buttonsTableTemplate.js`, `buttonsListTemplate.js`, `buttonModalTemplate.js`: Button property filtering  
- `paramsTableTemplate.js`, `paramsListTemplate.js`, `paramModalTemplate.js`: Parameter property filtering

### Architecture Benefits:
- Consistent filtering pattern across all template types
- Easy to maintain and extend (properties to hide are centralized in helper functions)
- No impact on underlying data model - only affects UI display
- Compilation verified with no errors

## Report Details View Fixes (Added 2025-06-08)

Fixed critical issues in the report details view that were preventing it from working correctly:

### Issues Fixed:

1. **Duplicate HTML IDs**: The main template was using duplicate IDs (`tableView`, `listView`) across different tabs (columns, buttons, params), which caused JavaScript conflicts. 
   - **Solution**: Changed to unique IDs per tab: `columnsTableView`, `buttonsTableView`, `paramsTableView`, etc.

2. **View Switching Logic**: Updated the client script to handle tab-aware view switching since each tab now has unique view IDs.
   - **Solution**: Modified event handler to detect the current tab and build the correct view ID dynamically.

3. **Inconsistent Tab Elements**: Report template used `<button class="tab">` while object template used `<div class="tab">`.
   - **Solution**: Standardized on `<div class="tab">` elements for consistency.

4. **Missing Parameter in Function Signature**: The `getMainTemplate` function was missing the `columnListViewFields` parameter.
   - **Solution**: Added the missing parameter to the function signature to match the calling convention.

### Architecture Improvements:
- Added `data-tab` attributes to view-icons containers to enable tab-aware view switching
- Updated client script to use event delegation for better view switching reliability
- Ensured consistent patterns between object and report details views

### Key Files Modified:
- `src/webviews/reports/components/templates/mainTemplate.js`: Fixed duplicate IDs and tab elements
- `src/webviews/reports/components/templates/clientScriptTemplate.js`: Updated view switching logic

## Report Details View List and Table Views (Added 2025-06-01)

The report details view now supports both list and table views for the buttons tab, following the same pattern as object details properties tab:

### Implementation Pattern:
- **Table View**: Shows all buttons in a table format with inline editing (original functionality)
- **List View**: Shows button names in a list on the left, with detailed editing form on the right when selected
- **View Switching**: Icons allow users to toggle between table and list views
- **Consistent UI**: Matches the object details design patterns and VS Code theming

### Key Files:
- `buttonsListTemplate.js`: Generates list view form fields for button properties
- `mainTemplate.js`: Updated to include view switching icons and list view structure  
- `clientScriptTemplate.js`: Handles view switching logic and list interaction
- `detailsViewStyles.js`: Added CSS for view icons, list container, and form layout

### Features Added:
- Button selection from list shows detailed editing form
- Checkbox toggles for property existence with proper validation
- Real-time model updates when changes are made
- Proper initialization and state management
- Consistent styling with existing UI patterns

This implementation demonstrates the modular template approach used throughout the extension for maintaining consistency across different webview components.
 
*Last updated: June 1, 2025* 

## Overview
The AppDNA VS Code extension provides a graphical interface for editing, validating, and managing AppDNA model files (JSON) using a dynamic UI generated from an external JSON schema. This document contains key architectural observations to help quickly understand the codebase.

## Core Architecture

### Extension Initialization Flow
1. The extension starts in `extension.ts` with the `activate` function
2. It sets up the extension context, initializes the ModelService
3. Creates file watchers for the model file
4. Initializes the tree view with JsonTreeDataProvider
5. Registers all commands via registerCommands.ts

### Key Components

#### ModelService (Singleton)
- Central service that manages loading, caching, and saving the AppDNA model file
- Provides methods to manipulate the model (getAllObjects, getAllReports, etc.)
- Tracks unsaved changes with hasUnsavedChanges flag
- Views call markUnsavedChanges() when they update the model in memory
  - lexiconView.js calls markUnsavedChanges() when lexicon items are updated
  - objectDetailsView.js calls markUnsavedChanges() when object properties are updated
  - projectSettingsView.js calls markUnsavedChanges() when project settings are updated
  - userStoriesView.js calls markUnsavedChanges() when adding/updating user stories or importing from CSV
  - objectCommands.ts calls markUnsavedChanges() when adding data objects
- hasUnsavedChangesInMemory() can be used to check if model has unsaved changes
- Destructive operations (like merge) check for unsaved changes and prompt users to save first

#### Tree View Architecture
- **JsonTreeDataProvider**: The main provider class that implements `vscode.TreeDataProvider`
  - Contains the core methods for generating tree items
  - `getChildren()`: Returns child items for a given parent item  - `getParent()`: Returns the parent item for a given child item (required for reveal functionality)
  - `refresh()`: Triggers a refresh of the tree view
  - Monitors ModelService's unsaved changes state and shows a visual indicator in the title bar
    - Uses a circle icon in the title bar when changes are unsaved
    - Updates VS Code context variable 'appDnaHasUnsavedChanges' to control indicator visibility
    - Polls for unsaved changes status periodically to keep indicator in sync

- **JsonTreeItem**: Custom tree item class that extends `vscode.TreeItem`
  - Represents individual nodes in the tree

## Change Requests List View UI Layout
The Change Requests List View follows these UI organization principles:
1. Filters (like Status dropdown) are positioned at the top-left of the page
2. Batch operations that act on selected items (Approve Selected, Reject Selected) appear directly below the filters
3. Global operations like "Apply All Approved" that don't depend on selection are positioned in the top-right action controls area
4. The Validate button is placed with filter controls to allow manual validation of pending change requests

This layout provides a logical separation of functionality:
- Top area contains filtering, validation, and operations
- Filter-related operations are close to the filters they work with
- Selection-based operations are separate from global operations
- Validation affects primarily pending requests and is a filter-related operation

The HTML structure follows this pattern:
```html
<div class="toolbar">
    <div class="filter-controls">
        <!-- Filter dropdowns and options -->
        <!-- Refresh and Validate buttons -->
    </div>
    <div class="action-controls">
        <!-- Global actions -->
    </div>
</div>
<div class="batch-actions">
    <!-- Selection-based actions -->
</div>
```
  - Properties like label, id, and context are set in the constructor
  - Used for PROJECT, DATA OBJECTS, MODEL SERVICES sections

- **Tree View Commands**:
  - `expandAllTopLevelCommand`: Expands all top-level nodes in the tree
  - `collapseAllTopLevelCommand`: Collapses all tree nodes
  - These are implemented in expandCollapseCommands.ts

- **Parent-Child Relationships**:
  - Top-level items: PROJECT, DATA OBJECTS, MODEL SERVICES (no parent)
  - Second-level items: Each has a specific parent based on contextValue
    - project* → PROJECT
    - dataObjectItem → DATA OBJECTS
    - modelService* → MODEL SERVICES
- Acts as a facade over the ModelDataProvider for data operations
- Direct file manipulation without creating backups (preserves original files)

#### JsonTreeDataProvider
- Manages the tree view in the sidebar showing the model structure
- Creates tree items for objects, namespaces, reports, etc.
- Uses ModelService to access model data
- Dynamically updates UI elements based on service status changes (e.g., MCP server, MCP HTTP server, authentication)
- Tree items have context values that determine their behavior and appearance
- Service status indicators (like MCP Server and MCP HTTP Server) use consistent iconography:
  - Running services: server-environment icon (MCP Server, MCP HTTP Server)
  - Stopped services: server-process icon (MCP Server, MCP HTTP Server)
  - Each service item can be clicked to toggle its status (start/stop)
- Tree view has expandAll and collapseAll buttons in the title bar for easy navigation:
  - Expand button uses the VS Code built-in 'list.toggleAllExpanded' command with a fallback mechanism
  - Collapse button uses the VS Code built-in 'workbench.actions.treeView.appdna.collapseAll' command
  - Both commands have robust error handling and logging
  - The expandAllItems method in JsonTreeDataProvider provides additional programmatic control
- Unsaved changes indicator in the tree view:
  - Circle icon appears directly next to "AppDNA" in the tree view title when there are unsaved changes
  - JsonTreeDataProvider dynamically updates the tree view title to include/remove the indicator
  - Uses VS Code context variable 'appDnaHasUnsavedChanges' internally
  - JsonTreeDataProvider polls ModelService every second to detect changes in status
  - Original title is preserved when there are no unsaved changes
  - Both commands log actions to the command history file using commandLog utility

### Webview Architecture Pattern

The extension follows a consistent wrapper pattern for webviews:

- **Pattern**: `wrapper.js` → `subfolder/implementation.js`
- **Object Details**: `objectDetailsView.js` → `objects/objectDetailsView.js`
- **Report Details**: `reportDetailsView.js` → `reports/reportDetailsView.js`

**Key characteristics:**
- Wrapper files are in `src/webviews/` and delegate to subfolder implementations
- Each implementation exports: `showDetails`, `refreshAll`, `getOpenPanelItems`, `closeAllPanels`
- Commands import the wrapper (not the implementation directly)
- Webpack copies both wrapper and subfolder files to build output
- TypeScript commands use `require()` to import JavaScript wrappers
- This pattern ensures consistent architecture and easier maintenance
  - Collapse button uses the VS Code built-in 'workbench.actions.treeView.appdna.collapseAll' command
  - Both commands have robust error handling and logging
  - The expandAllItems method in JsonTreeDataProvider provides additional programmatic control
- Unsaved changes indicator in the tree view:
  - Circle icon appears directly next to "AppDNA" in the tree view title when there are unsaved changes
  - JsonTreeDataProvider dynamically updates the tree view title to include/remove the indicator
  - Uses VS Code context variable 'appDnaHasUnsavedChanges' internally
  - JsonTreeDataProvider polls ModelService every second to detect changes in status
  - Original title is preserved when there are no unsaved changes
  - Both commands log actions to the command history file using commandLog utility

#### MCPServer (Singleton)
- Implements a Model Context Protocol server that enables GitHub Copilot to interact with user stories
- Uses stdio transport for communication as the primary method
- Also supports HTTP transport via MCPHttpServer for alternative communication approach
- Status is reflected in the UI through a dedicated tree item in the PROJECT node
- Fires status change events that the JsonTreeDataProvider listens to for UI updates
- Provides user story management tools through the MCP API
- Handles JSON-RPC 2.0 protocol, including the critical `initialize` handshake required by Copilot
- Responds to initialize requests with detailed capabilities information in JSON-RPC 2.0 format
- Tool definitions follow the MCP specification with `inputs` and `outputs` arrays

#### API Error Handling
- Centralized API error handling through the `handleApiError` utility in `apiErrorHandler.ts`
- Specifically handles 401 Unauthorized errors across all API endpoints:
  - Automatically logs the user out through AuthService
  - Displays a clear message to the user about session expiration
  - Opens the login view to allow immediate re-authentication
  - Returns a boolean flag to indicate if the error was handled (true) or if the response was ok (false)
- Model service API calls in command files consistently use this pattern:
  ```typescript
  const response = await fetch(url, { headers });
  if (await handleApiError(context, response, 'Failed to fetch data')) {
    // Error was a 401, it was handled, send empty data to webview
    return;
  }
  // Continue processing the response normally
  ```
- Implemented across all model service view commands:
  - Model Validation
  - Model Fabrication  
  - Model Feature Catalog
  - Model AI Processing
- Uses a dedicated entry point (stdioBridge.ts) for standalone stdio MCP server mode
- Can be launched either through VS Code commands or directly as a stdio server
- Properly handles process lifecycle events (SIGINT, SIGTERM) when running in standalone mode
- Automatically configures VS Code settings (github.copilot.advanced and mcp.servers) for server discovery
- Both server implementations register themselves directly in settings.json for proper GitHub Copilot discovery

#### MCPHttpServer (Singleton)
- Implements an HTTP server wrapper for the MCP protocol to enable GitHub Copilot integration
- Provides endpoints that follow the Model Context Protocol (MCP) specification:
  - Root path (`/`) - SSE (Server-Sent Events) connection endpoint for streaming responses back to clients
  - `/message` endpoint - JSON-RPC 2.0 communication channel for Copilot to send requests
  - `/.well-known/mcp` - Standard MCP discovery endpoint providing server capabilities
  - `/mcp/ready` - Endpoint that provides tool definitions to clients
  - `/mcp/execute` - Legacy endpoint for direct tool execution (older protocol version)
- Tracks active SSE connections via session IDs to enable sending responses back to specific clients
- Uses a request-acknowledgement pattern where:
  1. Client sends a JSON-RPC request to `/message` endpoint
  2. Server acknowledges receipt with a 202 HTTP status
  3. Server processes the request asynchronously
  4. Server sends the actual response via the SSE connection established earlier
- Automatically configures VS Code settings for GitHub Copilot to discover and use the server
- Fires events to update the UI when server status changes

#### Webviews
- Two types of webview implementation in the codebase:
  1. Native TypeScript webviews (e.g., `modelExplorerView.ts`, `loginView.ts`, `validationRequestDetailsView.ts`) - implemented directly in TypeScript
  2. TypeScript wrappers around JavaScript implementations (e.g., `lexiconView.ts`, `userStoriesView.ts`)
- The wrapper pattern uses a TypeScript file (e.g., `userStoriesView.ts`) to provide type-safe exports
  that internally use `require()` to dynamically import JavaScript implementations (e.g., `userStoriesView.js`)
- JavaScript implementation files export their functions using `module.exports` at the end of the file
- The wrapper pattern allows sharing webview code between VS Code (TypeScript) and web environments
- Important design note: When writing these wrapper files, always import the JS module dynamically inside the wrapper function rather than at the module level to avoid potential TypeScript/ESLint errors
- Commands that use webviews are registered in `registerCommands.ts` and reference the TypeScript wrapper functions, not the JS implementations directly
- These run in a separate context (not TypeScript)
- Communicate with the extension via postMessage API
- Dynamically generate UI based on the schema properties
- Webviews include spinner functionality to indicate loading states:
  - Spinners are displayed during data fetching or lengthy operations
  - The spinner overlay is styled with semi-transparent backgrounds (`rgba(0,0,0,0.4)`) and centered within the webview
  - Spinner visibility is toggled dynamically based on the operation's progress
  - Consistent spinner implementation across all webviews ensures a unified user experience

### Panel Management Pattern
- The extension implements a consistent pattern for handling panels (webviews) to avoid duplicate panels
- Each panel type (objectDetails, projectSettings, modelValidation, etc.) uses:
  - A static Map to track active panels: `const activePanels = new Map()`
  - A consistent panel ID generation approach: `const panelId = 'panelType-identifier'`
  - A check before creating new panels: `if (activePanels.has(panelId)) { activePanels.get(panelId).reveal() }`
  - Panel tracking: `activePanels.set(panelId, panel)`
  - Cleanup on disposal: `panel.onDidDispose(() => { activePanels.delete(panelId) })`
- This ensures clicking an already open item focuses on it rather than creating a duplicate panel
- Implementation is similar across object details, project settings, and model service views

### Webview Pagination Pattern

The model feature catalog and other list webviews implement a standardized pagination approach:

1. **Page Control Elements**:
   - First page button (`«`): Jumps to the first page
   - Previous page button (`‹`): Moves back one page
   - Page indicator: Shows current page number and total pages
   - Next page button (`›`): Moves forward one page
   - Last page button (`»`): Jumps to the last page
   - Items per page dropdown: Allows selecting 10, 25, 50, or 100 items per page
   - Record counter: Shows "X of Y items" information

2. **Implementation Pattern**:
   - `renderPaging()` function creates the pagination controls
   - Buttons are disabled appropriately when at first/last page
   - Page size defaults to 100 items per page to reduce pagination needs
   - All UI components follow VS Code theming variables for consistent styling

3. **Data Flow**:
   - Pagination state is tracked in the webview (pageNumber, itemCountPerPage)
   - Page change events trigger API calls via the extension
   - Extension handles API pagination parameters and returns paginated data
   - Spinner is displayed during page loading for user feedback

4. **Sort Controls**:
   - Column headers are clickable for sorting
   - Current sort column is indicated with an up/down arrow
   - Sort indicator shows ascending (▲) or descending (▼)
   - Clicking the same column toggles sort direction

This consistent pagination pattern is implemented across multiple views including model feature catalog, model validation requests, and fabrication requests for a unified user experience.

#### Commands
- Registered in `registerCommands.ts` 
- Include operations like adding objects, saving files, generating code

### Data Flow

1. **Loading**: ModelService loads the JSON file → ModelDataProvider parses and validates → In-memory model created
2. **Display**: JsonTreeDataProvider accesses model via ModelService → Renders tree view
3. **Editing**: User selects object in tree → Webview opens with UI generated from schema → Changes made in UI
4. **Saving**: Save command → ModelService.saveToFile → Updates JSON file on disk directly (no backups)

### Schema Structure
- Complex schema defined in `app-dna.schema.json`
- Root element with properties like appName, projectName
- Namespaces that contain objects
- Objects with properties, reports, workflows, etc.
- TypeScript interfaces in `data/interfaces` match the schema structure

## Schema Structure for Reports (Fixed 2025-05-26)

The JSON schema file does not use separate `definitions` for report schemas. Instead, report schemas are defined inline within the nested object structure:

- **Report properties**: `schema.properties.root.properties.namespace.items.properties.object.items.properties.report.items.properties`
- **Report column properties**: `...report.items.properties.reportColumn.items.properties`
- **Report button properties**: `...report.items.properties.reportButton.items.properties` 
- **Report param properties**: `...report.items.properties.reportParam.items.properties`

The schema loader functions in `src/webviews/reports/helpers/schemaLoader.js` needed to be updated to navigate these correct nested paths instead of looking for non-existent `schema.definitions.reportSchema` entries.

This nested schema structure is different from how object schemas are likely structured, which explains why the object details view settings tab works but the report details view was broken.

### UI/UX Conventions
- Schema descriptions are shown as tooltips
- Enum properties are displayed as dropdowns
- Properties are displayed alphabetically
- Checkboxes control property presence in JSON file
- Read-only controls have a distinct background
- No delete operations exposed - properties like `isIgnored` are used instead

### Model Services Architecture
- Services require authentication via AuthService before they can be used
- Each service has a dedicated command file (e.g., modelValidationCommands.ts)
- Commands create webviews with specific functionality
- API endpoints follow a consistent pattern with pagination and filtering
- Model Feature Catalog integrates with the AppDNA model structure by:
  - Listing available features from the API endpoint
  - Showing which features are already selected in the model
  - Allowing users to add/remove features from the model
  - Features with isCompleted=true cannot be removed
  - Selected features are stored in the namespace.modelFeature array

## Important File Relationships

- `extension.ts` → initializes → `ModelService`
- `extension.ts` → creates → `JsonTreeDataProvider`
- `JsonTreeDataProvider` → uses → `ModelService` 
- `commands/*.ts` → call → `ModelService` methods
- `webviews/*.js` → communicate with → extension via messages

## Special Patterns

### File Refresh Mechanism (2025-01-06)
When the model file is updated externally, the extension automatically refreshes all open views:
- File watcher in `extension.ts` triggers the `"appdna.refreshView"` command
- Command in `registerCommands.ts` handles the refresh logic:
  1. Stores references to all open panels (object details, report details, etc.)
  2. Closes all open panels
  3. Reloads the model file from disk
  4. Reopens all previously open panels with fresh data
- Both object details views and report details views follow the same pattern:
  - `getOpenPanelItems()` - gets currently open panels
  - `closeAllPanels()` - closes all panels  
  - `showObjectDetails()`/`showReportDetails()` - reopens panels with fresh data
- Wrapper files in `src/webviews/` import the actual implementations from subdirectories

1. **Dynamic UI Generation**:
   - Schema is loaded and parsed to discover all possible properties
   - UI elements are generated based on property types (enum → dropdown)

2. **File Watching Logic**:
   - Extension monitors model file for changes
   - Saves triggered by the extension are ignored by the watcher
   - External changes trigger a refresh of the tree view

3. **Property Existence Control**:
   - Checkboxes control whether a property appears in the JSON
   - Unchecked = property is omitted from the file

4. **Webview Email Pre-population Pattern**:
   - For reliable pre-population of fields in VS Code webviews, use a handshake pattern:
     1. The webview JS sends a `webviewReady` message to the extension after DOMContentLoaded.
     2. The extension responds with a `setEmailValue` message containing the value to pre-populate.
     3. The webview JS sets the field value on receiving this message.
   - This avoids race conditions where the extension sends a message before the webview is ready.

5. **Secret Storage for Email**:
   - To pre-populate the email field after logout, do NOT delete the email from VS Code secret storage on logout. Only delete the API key.
   - This allows the extension to retrieve and pre-populate the email field for user convenience on subsequent logins.

## Model Services API and Login Flow (2025-05-04)
- The extension authenticates users via the Model Services API endpoint: https://modelservicesapi.derivative-programming.com/api/v1_0/logins
- Login request body: { "email": string, "password": string }
- Response: { "success": boolean, "message": string, "modelServicesAPIKey": string, "validationError": [ { "property": string, "message": string } ] }
- On successful login, the API key is stored in VS Code secret storage and used for subsequent authenticated requests.
- The user's email is also stored in secret storage (and not deleted on logout) to enable pre-population of the login form for convenience.
- The login webview uses a handshake pattern: the webview JS sends a `webviewReady` message, and the extension responds with the saved email for pre-population.
- The login page provides a registration link for new users and displays terms/disclaimers about data usage and liability.

## Code Style Conventions
- Double quotes preferred over single quotes
- Regular concatenation preferred over template literals for short strings
- TypeScript for extension code, JavaScript for webviews

## UI Styling Conventions
- Table cells use word wrapping instead of truncation with ellipsis for better readability
- Consistent styling across all catalog and list views (validation, feature catalog, fabrication catalog)
- Tables use fixed layout with defined column widths (percentage-based)
- Status badges use consistent colors across all views
- All tables have sortable columns with visual indicators
- VS Code design language is used throughout (using VS Code theme variables)
- Pagination controls follow a standard pattern across all list views
- Action buttons in tables have vertical spacing (margin-bottom) to prevent stacking
- Buttons are displayed as block elements for better vertical alignment

## UI Design Patterns

### Webview Design Consistency

- All webviews use VS Code's CSS variables for consistent theming
- VS Code codicons are available in webviews by including: `<link rel="stylesheet" href="https://unpkg.com/@vscode/codicons@latest/dist/codicon.css" />`
- Use codicon classes like `<i class="codicon codicon-zoom-in"></i>` for consistent iconography
- Icons should be used instead of text symbols (e.g., use zoom-in/zoom-out icons instead of +/- text)
- Buttons follow VS Code styling with proper hover states and theming variables
- **Object Details View**: Uses template-based approach with proper VS Code theming
  - Title format: "Details for {name} Data Object"
  - Tabs are left-justified with VS Code theme variables
  - Uses data attributes for tab switching
  - Consistent CSS classes: .tabs, .tab, .tab.active, .tab-content
  
- **Report Details View**: Updated to match object details design pattern
  - Title format: "Details for {name} Report" 
  - Same tab styling and structure as object details
  - Uses VS Code CSS variables for theming consistency
  - Tab labels include counts (e.g., "Columns (5)")

### Webview Styling Guidelines
- Always use VS Code CSS variables for theming (--vscode-*)
- Left-justify tabs for consistency
- Use data attributes instead of onclick handlers for tab switching
- Apply consistent title formats across different detail views
- Use proper CSS classes for reusability

## Extension Points

The model can be extended by:
- Updating `app-dna.schema.json` with new properties (UI will automatically reflect changes)
- Adding new commands in `registerCommands.ts`
- Creating new webview implementations for different object types
- Expanding the MCP server functionality with additional tools

## Model Context Protocol (MCP) Server (2025-05-10)

The extension includes a Model Context Protocol server that enables GitHub Copilot to interact with user story data:

1. **Architecture**: 
   - `src/mcp/server.ts`: The main MCP server implementation, handles stdio transport and message routing
   - `src/mcp/tools/userStoryTools.ts`: Implements user story creation and listing tools
   - `src/commands/mcpCommands.ts`: Commands to start/stop the server and update configuration

2. **Tool Definitions**:
   - `createUserStory`: Creates and validates user stories against standard format patterns
   - `listUserStories`: Returns a list of all defined user stories

3. **Transport and Communication**:
   - Uses standard input/output (stdio) transport for regular MCP server
   - Also supports HTTP transport via the HTTP server option (src/mcp/httpServer.ts)
   - Follows the JSON-RPC 2.0 message format according to MCP specification
   - Integration with VS Code via `.vscode/mcp.json` configuration
   - HTTP server creates `.vscode/mcp-http.json` configuration
   - MCP configurations don't include schema references to avoid validation errors

4. **Copilot Integration**:
   - Automatically configures required VS Code settings in `.vscode/settings.json`:
     ```json
     "github.copilot.advanced": {
       "mcp.discovery.enabled": true,
       "mcp.execution.enabled": true
     }
     ```
   - No additional code is required from users to connect Copilot to the MCP server

4. **Format Validation**:
   - Shares validation logic with the userStoriesView.js component
   - Validates against two regex patterns for user story formatting:
     - "A [Role] wants to [action] a [object]"
     - "As a [Role], I want to [action] a [object]"

5. **Storage Strategy**:
   - Primarily saves to the model through ModelService when available
   - Falls back to in-memory storage when the model file isn't loaded

## Testing Framework

The extension uses a multi-level testing approach:

1. **Unit Tests** (`test/` directory):
   - Focus on testing individual components
   - Use a separate TypeScript configuration (`test/tsconfig.json`) that extends the main one
   - Set `rootDir` to `..` to allow access to both test and source files
   - Primary test files: `extension.test.ts` and `emptyProject.test.ts`

2. **End-to-End Tests** (`test-e2e/` directory):
   - Test the full extension in an actual VS Code window
   - Use a completely separate TypeScript configuration
   - Create temporary workspaces to test extension functionality
   - Focus on testing user-facing functionality like UI elements and commands

3. **TypeScript Configuration Separation**:
   - Main `tsconfig.json`: 
     - Focuses only on source code with `"rootDir": "src"`
     - Explicitly includes only `src/**/*` files
     - Excludes test directories to avoid compilation errors
   - Test configs:
     - Extend from the main config but override critical settings
     - Allow compilation of test files without mixing contexts

4. **Key Test Files**:
   - `runTest.ts`: Sets up the VS Code test environment
   - `emptyProject.test.ts`: Tests extension behavior with no model file
   - `clean-project.test.ts`: E2E tests for clean project scenarios

Both test suites verify critical extension functionality including command registration, UI visibility, and context-sensitive behaviors.

## Configuration Files

The extension uses two types of files:

1. **Model Files** (`app-dna.json`):
   - Contains the actual model data following the schema
   - Core file that defines objects, reports, namespaces, etc.
   - Created from template files (`app-dna.new.json`) when a new project is set up
   - The `projectCode` property in root is automatically set to a GUID when creating a new file

2. **Config Files** (`app-dna.config.json`):
   - Created alongside model files when using "Add File" command
   - Contains extension-specific settings like validation preferences and code generation options
   - Does not include backup settings as backups are not supported
   - Can be manually edited to customize extension behavior

## Debugging and Performance Notes

### Webview Communication Patterns

- **Potential Recursion Issue**: Be careful when updating model data in response to webview messages.
  - In `projectSettingsView.js`, calling `refreshWebviewData` from inside `handleUpdateSetting` caused a Maximum call stack size exceeded error when clicking on project settings.
  - This is because `refreshWebviewData` sends a 'setProjectData' message that triggers UI updates, which can trigger additional 'updateSetting' messages, creating an infinite loop.
  - The fix was to separate the saving of data from refreshing the UI, avoiding the recursive call cycle.

- **Event Handling Pattern**: When a UI element's state changes:
  1. Update UI element visually
  2. Send a single message to the extension
  3. Extension processes the update
  4. Extension sends an acknowledgment back without triggering a full refresh

## MCP Components

The extension includes Model Context Protocol (MCP) integration with two server components:

1. **MCPServer** (`src/mcp/server.ts`):
   - Main MCP server for handling GitHub Copilot interactions
   - Implements the core MCP protocol features
   - Manages tools for user stories, lexicon, and model operations
   - Provides status events that UI components can listen to

2. **MCPHttpServer** (`src/mcp/httpServer.ts`):
   - HTTP wrapper around the core MCP server implementing the Model Context Protocol (MCP)
   - Allows external tools like GitHub Copilot and Copilot Studio to communicate with the MCP server
   - Handles configuration for VS Code settings integration
   - Provides status events for UI components
   - Uses consistent iconography with MCPServer in the UI
   - Implements these key MCP endpoints:
     - `/` - Root endpoint for SSE (Server-Sent Events) connectivity with sessionId support
     - `/initialize` - Required by GitHub Copilot to establish a session with capabilities exchange
     - `/.well-known/mcp` - Standard MCP discovery endpoint for tool and capability discovery
     - `/mcp` - Base MCP endpoint for server information
     - `/mcp/ready` - Returns available tools in JSON-RPC 2.0 format
     - `/mcp/execute` - Handles tool execution requests from Copilot

Both components implement the Singleton pattern and provide status events that the JsonTreeDataProvider listens to for UI updates. The UI represents their status consistently using the 'server-environment' icon for running servers and 'server-process' icon for stopped servers.

### MCP Protocol Implementation

The Model Context Protocol (MCP) implementation in the application follows these key principles:

1. **JSON-RPC 2.0 Compliance**:
   - All messages follow the JSON-RPC 2.0 specification
   - Proper error codes and message formats for invalid requests
   - Request/response correlation using message IDs

2. **Server-Sent Events (SSE) Transport**:
   - Used for server-to-client communication
   - Supports session tracking with sessionId parameter
   - Maintains connection with periodic keep-alive messages

3. **Discovery Mechanism**:
   - Standard `.well-known/mcp` endpoint for capability discovery
   - Full URL paths for all endpoints to support Copilot Studio
   - Complete tool definitions with input/output schemas

4. **VS Code Integration**:
   - Automatic configuration of VS Code settings.json
   - Support for auto-discovery of MCP servers
   - Configuration for both HTTP and native MCP servers

## Code Generation

The `codeGenerator.ts` module provides functionality to generate code from model objects:

1. Supports generating both TypeScript and C# model classes
2. Makes API calls to an external model service for code generation
3. Has a fallback code generation capability if the API is unavailable
4. Creates basic class definitions with appropriate properties and types

The code generator demonstrates the extension's end-to-end capabilities beyond just model editing.

## UI/UX Implementation Notes

### Modal Dialogs
1. **Z-Index Management**:
   - Modal containers require `z-index: 100` to appear above all content
   - Modal content needs `z-index: 101` to ensure proper layering
   - Table headers use `z-index: 2` to stay visible while scrolling but below modals
   - Modal backdrops use semi-transparent backgrounds (`rgba(0,0,0,0.4)`)
   - All modal implementations across different views (modelAIProcessingView.js, modelValidationView.js, etc.) should maintain consistent z-index values to prevent layering issues

2. **Dialog Structure**:
   - Modals are implemented with a container div (.modal) and an inner content div (.modal-content)
   - Close buttons are provided both in the header (X) and as a button at the bottom
   - Action buttons use the VS Code theming variables for consistency

3. **Loading States**:
   - Modals display a "Loading..." message when fetching data
   - Spinner overlays are used during lengthy operations
   - Error states are handled with appropriate styling and messages

### Standardized Pagination Pattern
- Consistent pagination controls are used across data-heavy views like:
  - Model Feature Catalog (modelFeatureCatalogView.js)
  - Model Validation Request List (modelValidationView.js)
- Standard structure includes:
  - First/Previous/Next/Last page navigation buttons
  - Page indicator ("Page X of Y")
  - Items per page selector (standardized to 10, 25, 50, 100 options)
  - Count summary showing current items and total records
  - Default configuration shows 100 items per page

### Change Request List View
- Displays change requests from model validation results
- Allows users to approve, reject, and apply individual changes
- Features batch operations via checkboxes and action buttons:
  - "Approve Selected" button for batch approval of checked items
  - "Reject Selected" button with modal for providing rejection reasons
  - "Apply All Approved" button to implement all approved changes
- Row-level actions for individual change operations
- Status filtering to view subsets of change requests
- "Validate" button to manually check if pending change requests are still valid
- Automatic validation of pending change requests when loading data
- Auto-rejection of out-of-date change requests (when old values no longer match model)
- Consistent table format with sortable columns
- Word-wrapped cell content for better readability

### Model Feature Catalog
- Allows users to add/remove model features from the current AppDNA model
- Uses a consistent table format for displaying features with:
  - Selection checkboxes for toggling feature inclusion
  - Display Name shown in the "Name" column
  - Description and Version columns for additional details
  - Hidden internal name column to avoid duplicating information
- Changes are kept in memory only and not automatically saved to disk
- The primary Tree View's save button must be used to persist changes
- Selection toggle is immediate but applies only to the in-memory model
- When adding a new model feature, we don't create the `isCompleted` property
- The `isCompleted` property is only added by the AI processing when needed
- Existing features with the `isCompleted` property set to "true" cannot be removed

## Change Requests Handling Behavior

The Change Requests List View supports flexible handling of property updates:

1. **Property Creation**
   - When applying change requests, the system checks if the property exists
   - If the property doesn't exist, it will be created with the new value
   - This applies to properties found via ModelXPath, PropertyPath, or constructed paths

2. **Value Verification**
   - For existing properties, the current value is verified against the expected old value
   - If the values don't match, the change request is rejected as "out of date"
   - For non-existent properties, verification is skipped since there's no current value to check
   - Validation happens automatically when loading change requests
   - Validation can be triggered manually via the "Validate" button in the UI
   - The validatePendingChangeRequests function in changeRequestsListView.ts performs the validation

3. **Error Handling**
   - If the parent object can't be found, an error is thrown
   - If the property itself doesn't exist but its parent does, the property will be created
   - Detailed logging is provided to trace the property access and creation process

4. **Validation Process**
   - Gets the current model state from the file system
   - For each pending change request, compares current value with old value
   - If values don't match, automatically marks the request as rejected with reason "out of date"
   - Updates the change request file on disk to persist validation results
   - Only validates pending change requests (not approved, rejected, or processed ones)

This approach allows for both updating existing properties and adding new ones through the change request mechanism while ensuring that changes are still valid against the current model state.

## Property Name Length Validation (Added 2025-01-14)

Enhanced the property validation in the Add Property modal to enforce a 100 character limit on property names.

### Issue:
- Data object property names needed a maximum length constraint to prevent overly long property names
- The existing validation only checked for empty names, valid format (letters/numbers), and uniqueness

### Solution:
- Added length validation to the `validatePropertyName` function in `propertyModalFunctionality.js`
- The validation now checks `name.length > 100` and returns appropriate error message
- Length check is positioned after empty check but before format check for logical validation order

### Implementation Details:
- **File modified**: `src/webviews/objects/components/templates/propertyModalFunctionality.js`
- **Change**: Added `if (name.length > 100) { return "Property name cannot exceed 100 characters"; }`
- **Validation order**: Empty → Length → Format → Uniqueness
- **Works for**: Both single property addition and bulk property addition modes
- **Testing**: Created isolated test cases to verify 100 character limit enforcement

### Validation Rules (Complete):
1. Property name cannot be empty
2. Property name cannot exceed 100 characters
3. Property name must start with a letter and contain only letters and numbers
4. Property name must be unique (not already exist)

*Last updated: January 14, 2025*

## Welcome View Architecture

The Welcome View provides an entry point for new users to understand the extension's capabilities and workflow:

1. **Panel Creation Pattern**:
   - The welcome view follows a standard pattern for webview panels in VS Code
   - It uses a singleton pattern via `WelcomePanel.currentPanel` to prevent multiple instances
   - When an existing panel exists, it uses `reveal()` instead of creating a new panel

2. **Workflow Presentation**:
   - The welcome screen displays a 6-step workflow for using AppDNA
   - Each step is visually represented with a numbered indicator and description
   - Important notes about each step are highlighted in italics with left border styling
   - The workflow follows a sequential pattern with visual indicators showing the flow direction

3. **UI Organization**:
   - The welcome view is organized in sections: header, getting started actions, workflow steps, and features
   - Action cards provide quick access to common functions with hover effects for better interactivity
   - Styling uses VS Code's theme variables for consistent appearance across themes

4. **Message Communication Pattern**:
   - The welcome view communicates with the extension via the `postMessage` API
   - Command messages like "createNewFile" trigger corresponding VS Code commands

This pattern of presenting a workflow guide helps users understand the proper sequence of operations in the extension and reduces the learning curve for new users.

## Object Details View Mechanism

### Panel Management
- The extension uses a webview-based approach for displaying object details
- Object details panels are tracked in two maps within `src/webviews/objects/objectDetailsView.js`:
  - `activePanels`: Tracks panels by ID to prevent duplicates
  - `openPanels`: Stores references to panels along with their associated items and modelService

### Refresh Mechanism
- When the user clicks the refresh button (`appdna.refreshView` command), the extension:
  1. Gets references to currently open detail panels via `getOpenPanelItems()`
  2. Closes all open panels via `closeAllPanels()` 
  3. Reloads the model file from disk
  4. Refreshes the tree view
  5. Reopens the previously open panels with fresh data

- This approach ensures that all panels display the most up-to-date data after a refresh, rather than trying to update the panels in-place which could be error-prone.

### Project Settings View Mechanism
- The Project Settings view displays and allows editing of project-level configuration
- Like Object Details View, it implements a close-and-reopen refresh pattern
- The view is tracked in the `projectSettingsPanel` object in projectSettingsView.js
- When the refresh button is clicked:
  1. A reference to the open project settings panel is stored via `getProjectSettingsPanel()`
  2. The panel is closed via `closeProjectSettingsPanel()`
  3. The model is reloaded from disk
  4. The tree view is refreshed
  5. The project settings panel is reopened with fresh data using the stored reference

## Report-Related Models and Interfaces

### Report Schema Structure
- The app-dna.schema.json file defines several report-related schemas:
  - `report`: Defines the main report structure with visualization settings and metadata
  - `reportButton`: Defines buttons that appear on report views 
  - `reportParam`: Defines parameters that can be used for report filtering
  - `reportColumn`: Defines columns that appear in report results

### TypeScript Implementation
- Each schema has corresponding TypeScript interfaces in the `src/data/interfaces` directory:
  - `ReportSchema` in report.interface.ts
  - `ReportButtonSchema` in reportButton.interface.ts
  - `ReportParamSchema` in reportParam.interface.ts
  - `ReportColumnSchema` in reportColumn.interface.ts

- Each interface has a model implementation in the `src/data/models` directory:
  - `ReportModel` implements `ReportSchema`
  - `ReportButtonModel` implements `ReportButtonSchema`
  - `ReportParamModel` implements `ReportParamSchema`
  - `ReportColumnModel` implements `ReportColumnSchema`

### Model Pattern
- Models follow a consistent pattern with:
  1. Properties matching the schema definition
  2. Constructor that selectively copies properties from input data
  3. Static `createEmpty()` method to instantiate an empty model
  4. Static `fromJson()` method to create from JSON data
  5. `toJson()` method to convert back to JSON, omitting undefined properties

- This pattern ensures that:
  - Properties are only included in the JSON output if they have values
  - The schema structure is properly maintained
  - Optional properties are handled correctly

## UI Patterns

### Webview Feedback Patterns
- **Global Spinner Overlay**: Used for major operations that should block the entire UI
  - Controlled by `showSpinner()` and `hideSpinner()` functions
  - Covers the entire UI with a semi-transparent overlay and centered spinner
  - Appropriate for operations like initial data loading or complex processing

- **Button Spinners**: Used for operations triggered by specific buttons
  - Controlled by button-specific functions like `showRefreshSpinner()` and `hideRefreshSpinner()`
  - Places a small spinner directly in the button while disabling it
  - Provides focused feedback without blocking the entire UI
  - Appropriate for operations like data refreshing or small updates

- **Auto-Refresh Mechanism**: Used for views that need to monitor changing data
  - Implemented in views that display processing items (e.g., modelAIProcessingView.js)
  - Automatically refreshes data at regular intervals (typically every 60 seconds)
  - Only activates when there are items in processing/queued states
  - Visual indicator shows when auto-refresh is active
  - Cleans up timers appropriately when view is closed or no more processing items exist
  - Uses interval-based timing with configurable intervals (const AUTO_REFRESH_INTERVAL)

- **Modal Progress**: Used for long-running operations displayed in modal dialogs
  - Includes progress bars with percentage indicators
  - Can display additional context like file counts for extraction operations
  - Maintains user context by keeping the operation visible until completion

### Error Report Download Pattern

#### Implementation Pattern for Report Downloads
The extension uses a consistent pattern for downloading and viewing error reports across different request types (AI Processing, Validation, Fabrication):

1. **Check Report Exists**: Before showing download/view button, check if report file exists locally
   - Command: `{type}CheckReportExists` - Checks `.app_dna/{type}_reports/{filename}` directory
   - Response: `{type}ReportExistsResult` with exists flag and requestCode

2. **Download Report**: Downloads report from API and saves locally
   - Command: `{type}DownloadReport` - Takes URL and requestCode parameters
   - Uses AuthService.getApiKey() for authentication
   - Saves to `.app_dna/{type}_reports/` directory with consistent naming
   - Response: `{type}ReportDownloadStarted`, `{type}ReportDownloadSuccess`, or `{type}ReportDownloadError`

3. **View Report**: Opens existing local report file in VS Code editor
   - Command: `{type}ViewReport` - Takes requestCode parameter
   - Opens file in new editor tab using vscode.window.showTextDocument()
   - Response: `reportOpened` or `reportOpenError`

#### Directory Structure for Reports
- AI Processing: `.app_dna/ai_processing_reports/{requestCode}.txt`
- Validation: `.app_dna/validation_reports/validation_report_{requestCode}.txt`
- Fabrication: `.app_dna/fabrication_reports/fabrication_report_{requestCode}.txt`

#### Webview Button Logic
- Button shows "View Report" if file exists locally, "Download Report" if not
- Button is disabled during download with progress indication
- After successful download, button switches to "View Report" mode
- Only shown when request failed AND has a report URL available

# AppDNA VS Code Extension Architecture Notes

## Webview Architecture Pattern

### Consistent Architecture for Details Views
Both object details and report details views now follow the same architectural pattern:

**Pattern: Wrapper → Implementation in Subfolder**

#### Object Details View:
- `webviews/objectDetailsView.js` - Wrapper that imports from `./objects/objectDetailsView.js`
- `webviews/objects/objectDetailsView.js` - Main implementation with full functionality
- `webviews/objects/helpers/` - Helper modules (schemaLoader, objectDataHelper)
- `webviews/objects/components/` - UI components (detailsViewGenerator)
- Command registration: Uses the JavaScript wrapper

#### Report Details View:
- `webviews/reportDetailsView.js` - Wrapper that imports from `./reports/reportDetailsView.js`
- `webviews/reports/reportDetailsView.js` - Main implementation with full functionality  
- `webviews/reports/helpers/` - Helper modules (schemaLoader, reportDataHelper)
- `webviews/reports/components/` - UI components (detailsViewGenerator)
- `webviews/reportDetailsView.ts` - Backup TypeScript implementation (not used by default)
- Command registration: Uses the JavaScript wrapper

**Benefits of this pattern:**
- Consistent architecture across all detail views
- Modular organization with helpers and components in subfolders
- Clear separation between wrapper and implementation
- Easy to extend with new detail view types

**Function exports required for consistency:**
All detail view implementations must export:
- `showDetails()` - Main function to display the view
- `refreshAll()` - Refresh all open panels of this type
- `getOpenPanelItems()` - Get list of items from open panels
- `closeAllPanels()` - Close all panels of this type

## Report Properties Filtering (Added 2025-05-26)

The report details view settings tab filters out certain properties that should not be editable or visible to users. This is implemented in `src/webviews/reports/components/templates/settingsTabTemplate.js`:

### Filtered Properties Include:
- **Basic properties**: name, initobjectworkflowname
- **Caching settings**: iscachingallowed, cacheexpirationinminutes
- **Header/display settings**: isheaderlabelsvisible, isreportdetaillabelcolumnvisible, formintrotext
- **Azure storage settings**: isazureblobstorageused, azuretablenameoverride, etc.
- **Visualization properties**: All visualization* properties (40+ properties for charts, cards, folders, etc.)
- **Advanced settings**: isignoredindocumentation, badgecountpropertyname, ispage

### Implementation:
- `getReportPropertiesToIgnore()` function returns array of 51 property names (lowercase)
- Properties are filtered in the main template generation along with array properties (reportColumn, reportButton, reportParam)
- Based on C# `GetReportPropertiesToIgnore()` method from the original codebase

This ensures the settings tab only shows user-editable properties while hiding complex internal settings.

## Column Properties Filtering (Added 2025-06-08)

Added functionality to hide specific column properties in the report details view columns tab to improve usability and focus on relevant properties.

### Hidden Properties:
The following column properties are now hidden from the columns tab views:
- `buttondestinationcontextobjectname`
- `maxwidth`
- `datetimedisplayformat`
- `iscolumnsummetricavailable`
- `issummarydisplayed`
- `isconditionallydisplayed`
- `isbuttonclickedonrowclick`
- `buttonbadgecountpropertyname`
- `isformfooter`
- `isencrypted`

### Implementation:
- Created `getColumnPropertiesToHide()` function in `columnsTableTemplate.js` 
- Applied filtering in all three column property displays:
  - Table view (`columnsTableTemplate.js`)
  - List view (`columnsListTemplate.js`) 
  - Modal dialog (`columnModalTemplate.js`)
- Properties are filtered case-insensitively during schema processing
- Follows same pattern as settings tab property filtering

### Benefits:
- Cleaner, more focused UI for column editing
- Reduces cognitive load by hiding advanced/internal properties
- Maintains consistency with existing property filtering patterns
- Easy to extend for additional properties if needed

## Button Properties Filtering (Added 2025-06-08)

Added functionality to hide the `destinationContextObjectName` property in the report details view buttons tab to improve usability.

### Hidden Properties:
- `destinationContextObjectName` - Hidden from buttons tab views

### Implementation:
- Created `getButtonPropertiesToHide()` function in `buttonsTableTemplate.js` 
- Applied filtering in all three button property displays:
  - Table view (`buttonsTableTemplate.js`)
  - List view (`buttonsListTemplate.js`) 
  - Modal dialog (`buttonModalTemplate.js`)
- Properties are filtered case-insensitively during schema processing
- Follows same pattern as column and settings tab property filtering

### Benefits:
- Cleaner, more focused UI for button editing
- Consistent with column property filtering approach
- Easy to extend for additional button properties if needed

## Model Fabrication Request Details Enhancement (Added 2025-12-19)

Enhanced the Model Fabrication Request Details modal to display the request code, bringing it in line with the Model Validation Request Details modal.

### Changes Made:
- Added `modelFabricationRequestCode` field to the details modal in `src/webviews/modelFabricationView.js`
- Field is displayed with label "Request Code" positioned after the Status field
- Uses existing field rendering logic for consistent formatting and HTML escaping
- Follows the same pattern as the Model Validation view for consistency

### Implementation Details:
- Field added to `fieldsToShow` array in the `showDetailsModal` function
- No special handling required - uses default text rendering with HTML escaping
- Minimal change: only one line added to existing array definition
# AppDNA VS Code Extension Architecture Notes
 
## Form Details View and Report Details View Structure (Added 2025-07-05)

### Implementation Overview:
The Form Details View and Report Details View follow a parallel structure with consistent UI patterns and component organization. Both views use a tabbed interface to present and edit complex objects with schema-driven property editing and array management.

### Architecture Pattern:
- **Modular Templates**: Both views use separate template files for different UI components:
  - `settingsTabTemplate.js` - Generates schema-driven property editors
  - `modalTemplates.js` (Forms) / `*ModalTemplate.js` files (Reports) - Handle editing dialogs
  - `*TableTemplate.js` files - Generate table views for array items
  - `*ListTemplate.js` files - Generate list views for schema properties
  - `clientScriptTemplate.js` - Handles client-side interactions
  - `mainTemplate.js` - Orchestrates the complete UI assembly

- **Data Flow Pattern**:
  - Extensions loads schema and object data from ModelService
  - Data passes to detailsViewGenerator which distributes to template functions
  - Templates generate HTML/CSS/JS for the webview
  - Client-side JS handles user interactions and sends commands back to extension

### Key Features:
- **Schema-driven UI**: All editable properties come directly from the schema
- **Property Toggling**: Properties can be added/removed via checkboxes
- **Real-time Updates**: Property changes immediately update the in-memory model
- **Tooltips**: Schema descriptions shown as tooltips on hover
- **Consistent Styling**: VS Code theming variables used throughout
- **Tab State Persistence**: Active tab is restored when re-opening views
- **Array Management**: Items can be added, edited, reordered, and reversed

### Mapping Between Views:
- Forms: objectWorkflowParam = Reports: reportColumn
- Forms: objectWorkflowButton = Reports: reportButton
- Forms: objectWorkflowOutputVar = Reports: reportParam

## Custom Logout Confirmation Modal (Added 2025-06-27)

### Implementation Overview:
Replaced VS Code's built-in `showWarningMessage` confirmation with a custom webview-based modal that follows the same design patterns used throughout the extension.

### Architecture Pattern:
- **Modal Utility**: Created `src/utils/logoutConfirmationModal.ts` as a reusable utility
- **Webview Integration**: Uses VS Code webview panel for consistent styling and behavior
- **Design Consistency**: Follows the established modal pattern with `.modal`, `.modal-content`, and `.modal-buttons` classes
- **Theme Integration**: Uses VS Code CSS variables for theming consistency

### Key Features:
- **Consistent Styling**: Matches other confirmation modals (fabrication cancel, validation cancel)
- **Keyboard Support**: Enter/Escape key handling for accessibility
- **Focus Management**: Default focus on Cancel button (safer default)
- **Click-outside-to-cancel**: Modal closes when clicking outside content area
- **Proper Event Handling**: Promise-based approach for clean async/await usage

### Files Modified:
- `src/utils/logoutConfirmationModal.ts`: New utility for logout confirmation
- `src/commands/registerCommands.ts`: Updated logout command to use custom modal
- `copilot-command-history.txt`: Logged implementation details

### Button Layout:
- **Primary Action**: "Logout" button (left side, standard button styling)
- **Secondary Action**: "Cancel" button (right side, secondary button styling)
- **Button Order**: Follows VS Code conventions with primary action first

### Benefits:
- **Visual Consistency**: Matches the design language of other modals in the extension
- **Better UX**: Custom modal provides more control over styling and behavior
- **Accessibility**: Proper keyboard navigation and focus management
- **Maintainability**: Reusable utility that can be extended for other confirmations

## Welcome View Auto-Opening on Login (Added 2025-01-20)

### Login Flow Enhancement:
Added functionality to automatically open the welcome view when a user successfully logs in to Model Services.

### Implementation Details:
- Modified the login command callback in `registerCommands.ts`
- Added `showWelcomeView(context)` call after successful login
- Placed before the existing welcome view update logic to ensure proper initialization

### Login Sequence:
1. User clicks login and completes authentication
2. Login callback executes:
   - Refresh tree view to update icons and services
   - Execute refresh view command
   - **Open welcome view automatically** *(NEW)*
   - Update welcome view login status if already open

### Benefits:
- **Improved User Experience**: Users immediately see the welcome view after login
- **Better Onboarding**: Welcome view provides guidance and next steps
- **Consistent Interface**: Ensures users have a starting point after authentication
- **Contextual Information**: Welcome view shows login status and available features

### Technical Notes:
- Uses existing `showWelcomeView(context)` function
- Maintains existing welcome view update logic for cases where view is already open
- No impact on existing login flow functionality
 
## Model AI Panel Management During Logout (Added 2025-01-20)

### Panel Tracking Architecture:
The extension uses `activePanels` Maps in three command files to track webview panels:
- `modelAIProcessingCommands.ts` - Tracks Model AI Processing panels
- `modelFabricationCommands.ts` - Tracks Model Fabrication panels  
- `modelValidationCommands.ts` - Tracks Model Validation panels

Additionally, catalog views are managed through individual close functions:
- `closeModelFeatureCatalogPanel()` - Closes Model Feature Catalog view
- `closeFabricationBlueprintCatalogPanel()` - Closes Fabrication Blueprint Catalog view

### Panel Lifecycle:
1. **Panel Creation**: Panels are added to `activePanels` Map with unique IDs
2. **Panel Disposal**: `onDidDispose()` callback removes panel from Map automatically
3. **Panel Reuse**: Existing panels are revealed instead of creating duplicates

### Logout Implementation:
Created `closeAllPanels` functions in each command file that:
- Iterate through the `activePanels` Map
- Call `dispose()` on each panel
- Clear the Map (though `onDidDispose` handles removal)
- Log panel disposal for debugging

For catalog views, existing close functions are called directly during logout.

### Integration Points:
- Functions are exported from command files
- Imported in `registerCommands.ts`
- Called during logout before `authService.logout()`
- Ensures all Model AI-related views AND catalog views are closed before logout completes

### Views Closed During Logout:
- Model AI Processing panels
- Model Fabrication panels
- Model Validation panels
- Model Feature Catalog view
- Fabrication Blueprint Catalog view

### Benefits:
- Clean state after logout
- Prevents stale authenticated panels
- Consistent user experience
- Proper resource cleanup
- Complete closure of all AI-related interfaces
 
## Add Report Wizard Step 3 Enhanced Enter Key Handling (Added 2025-01-15)

### Issue #174 Resolution:
The report wizard step 3 needed complete Enter key functionality and keyboard accessibility improvements.

### Problems Identified:
1. **Missing Focus Management**: Step 3 didn't get focus when opened, making Enter key unreliable
2. **Non-Keyboard Accessible Options**: Visualization options lacked tabindex and keyboard event handlers
3. **Missing Focus Styles**: No visual indication when options were focused via keyboard

### Solution Applied:
- **Step 3 Focus Management**: Added focus on step3 element when step opens (like other steps)
- **Keyboard Accessibility**: Added tabindex="0" to all visualization options
- **Keyboard Event Handlers**: Added Space/Enter key support for selecting options
- **Focus Styles**: Added CSS :focus styles for clear visual feedback

### Technical Implementation:
```javascript
// Focus management in showStep function
if (stepNumber === 3) {
    const step3Element = document.getElementById('step3');
    if (step3Element) {
        step3Element.focus();
    }
}

// Keyboard support for visualization options
option.addEventListener('keydown', function(event) {
    if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        this.click();
    }
});
```

### User Experience:
- Step 3 opens with proper focus enabling Enter key functionality
- Users can Tab through visualization options and select with Space/Enter
- Enter key advances to next step when visualization is selected
- Clear visual feedback for keyboard navigation
- Consistent with other wizard steps and VS Code accessibility standards
 
## Data Object Settings Tab - Property Hiding and Read-Only Updates (Added 2025-01-17)

Implemented user requirements to hide specific settings and make 'is lookup' field read-only in the data object details view settings tab.

### Requirements:
- Hide 'is not implemented' setting (isNotImplemented)
- Hide 'is full research database view allowed' setting (isFullResearchDatabaseViewAllowed)  
- Hide 'cache individual recs' setting (cacheIndividualRecs)
- Make 'is lookup' field read-only (isLookup)

### Solution:
Modified `src/webviews/objects/components/templates/settingsTabTemplate.js` to add property filtering and read-only logic following existing patterns in the codebase.

### Technical Details:
- **File Modified**: `src/webviews/objects/components/templates/settingsTabTemplate.js`
- **Change Type**: Minimal - Added 8 lines, removed 2 lines (net +6 lines)
- **Property Hiding**: Extended existing filter logic to exclude the 3 specified properties
- **Read-Only Logic**: Added `isLookup` to enum dropdown disable condition (similar to existing `parentObjectName` pattern)

### Implementation:
1. **Property Filtering**: Added filter condition for the 3 properties to hide them completely
2. **Read-Only Dropdown**: Modified enum handling to disable `isLookup` dropdown while still showing its current value
3. **Consistent UX**: Followed existing patterns for property hiding and read-only fields

### Testing Verified:
- Properties are hidden: isNotImplemented, isFullResearchDatabaseViewAllowed, cacheIndividualRecs no longer appear ✅
- isLookup field appears but is disabled (read-only) ✅
- Build and lint successful with no new issues ✅
- Other properties maintain their original behavior ✅
 

## Add Report Wizard Step 4 Focus and Enter Key Handling (Added 2025-01-15)

### Requirements:
- When step 4 opens, automatically focus on the 'target data object' dropdown
- On Enter key press, if dropdown has a value selected, move to the next step

### Solution:
Added focus and keyboard navigation functionality to the Add Report Wizard step 4 following the same patterns used by the Add Object Wizard and other modals in the application.

### Technical Details:
- **File Modified**: `src/webviews/addReportWizardView.js`
- **Functions Updated**: `showStep()` function and event listener setup
- **Changes Made**:
  1. **Auto-focus on step open**: Added focus management to `showStep()` function
  2. **Enter key handling**: Added keydown event listener for target object dropdown
  3. **Smart validation**: Enter key only triggers action when dropdown has a value
  4. **Consistent UX**: Follows same patterns as Add Object Wizard step focus management

### Implementation:
```javascript
// Focus management in showStep function
function showStep(stepNumber) {
    // ... existing code ...
    
    // Focus management for each step
    setTimeout(() => {
        if (stepNumber === 4) {
            // Focus on the target data object dropdown
            const targetObjectDropdown = document.getElementById('targetObject');
            if (targetObjectDropdown) {
                targetObjectDropdown.focus();
            }
        }
    }, 100);
}

// Enter key handling for target object dropdown
document.getElementById('targetObject').addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && this.value) {
        event.preventDefault();
        document.getElementById('step4NextBtn').click();
    }
});
```

### User Experience:
- Step 4 opens with cursor immediately in the target data object dropdown
- Users can navigate dropdown with keyboard and press Enter to proceed without mouse interaction
- Enter key is ignored when no value is selected, preventing accidental navigation
- Consistent with other wizard steps and modals throughout the application

 
## Add Column Modal Focus and Enter Key Handling (Added 2025-12-20)

### Requirements:
- When single column tab opens, automatically focus on the 'column name' textbox
- When bulk columns tab opens, automatically focus on the 'column name' textbox (bulk columns textarea)
- On Enter key press in single column input, trigger the 'add column' button if it's enabled
- On Enter key press in bulk columns textarea, trigger the 'add columns' button if it's enabled

### Solution:
Added focus and keyboard navigation functionality to the add column modal following the same patterns used by other modals in the application (property and parameter modals).

### Technical Details:
- **File Modified**: `src/webviews/reports/components/templates/clientScriptTemplate.js`
- **Functions Updated**: `createAddColumnModal()` and `attachModalEventListeners(modal)`
- **Changes Made**:
  1. **Auto-focus on modal open**: Added `columnNameInput.focus()` when modal opens
  2. **Tab-based focus management**: Added focus handling when switching between tabs
  3. **Enter key handling for single column**: Added keypress event listener for Enter key
  4. **Enter key handling for bulk columns**: Added keydown event listener with Shift+Enter support
  5. **Smart validation**: Enter key only triggers action when buttons are not disabled
  6. **Consistent UX**: Follows same patterns as property and parameter modals

### Implementation:
```javascript
// Focus on column name input when modal opens (single column tab is active by default)
const columnNameInput = modal.querySelector("#columnName");
if (columnNameInput) {
    columnNameInput.focus();
}

// Set focus based on which tab is now active during tab switching
setTimeout(() => {
    if (tabId === 'singleAdd') {
        const columnNameInput = modal.querySelector("#columnName");
        if (columnNameInput) {
            columnNameInput.focus();
        }
    } else if (tabId === 'bulkAdd') {
        const bulkColumnsTextarea = modal.querySelector("#bulkColumns");
        if (bulkColumnsTextarea) {
            bulkColumnsTextarea.focus();
        }
    }
}, 10);

// Add Enter key handling for single column input
columnNameInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        const addButton = modal.querySelector("#addSingleColumn");
        if (addButton && !addButton.disabled) {
            addButton.click();
        }
    }
});

// Add Enter key handling for bulk columns textarea (Enter submits, Shift+Enter for new line)
bulkColumnsTextarea.addEventListener("keydown", function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        const addButton = modal.querySelector("#addBulkColumns");
        if (addButton && !addButton.disabled) {
            addButton.click();
        }
    }
    // Shift+Enter will allow new line (default behavior)
});
```

### User Experience:
- Modal opens with cursor immediately in the column name field (single column tab)
- When switching to bulk tab, cursor moves to the bulk columns textarea
- When switching back to single tab, cursor returns to the column name field
- Users can type and press Enter to add column(s) without mouse interaction
- Enter key is only active when button would be enabled (respects validation state)
- Shift+Enter in bulk textarea allows multi-line input, regular Enter submits
- Consistent with other add modals throughout the application

## Add Report Wizard Focus and Enter Key Handling (Added 2025-01-15)

### Requirements:
- When wizard opens, automatically focus on the 'owner data object' dropdown
- On Enter key press, if the dropdown has a value selected, move to the next step

### Solution:
Added focus and keyboard navigation functionality to the Add Report Wizard following the same patterns used by the Add Object Wizard for consistency.

### Technical Details:
- **File Modified**: `src/webviews/addReportWizardView.js`
- **Functions Updated**: `showStep()` function and event listeners
- **Changes Made**:
  1. **Auto-focus**: Added focus management in `showStep()` with setTimeout for DOM readiness
  2. **Enter key handling**: Added keydown event listener for Enter key on step 1
  3. **Smart validation**: Enter key only triggers action when Next button is enabled (dropdown has value)
  4. **Initial focus**: Added initial focus setup when wizard loads
  5. **Consistent UX**: Follows same patterns as Add Object Wizard

### Implementation:
```javascript
// Focus management in showStep function
setTimeout(() => {
    if (stepNumber === 1) {
        // Focus on the owner data object dropdown
        const ownerObjectSelect = document.getElementById('ownerObject');
        if (ownerObjectSelect) {
            ownerObjectSelect.focus();
        }
    }
}, 100); // Small delay to ensure DOM is updated

// Enter key handling for step 1
document.getElementById('step1').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !document.getElementById('step1NextBtn').disabled) {
        event.preventDefault();
        document.getElementById('step1NextBtn').click();
    }
});

// Initial focus setup
setTimeout(() => {
    showStep(1); // This will trigger focus on the owner object dropdown
}, 100);
```

### User Experience:
- Wizard opens with cursor immediately in the owner object dropdown
- Users can select option and press Enter to advance without mouse interaction
- Enter key is ignored when no selection is made, preventing errors
- Consistent with Add Object Wizard behavior throughout the application

### Testing:
- Created comprehensive test file `/tmp/test-report-wizard-focus.html`
- Verified focus behavior works correctly on wizard open
- Confirmed Enter key handling respects dropdown selection state
- No regressions in existing functionality

## Add Button Modal Focus and Enter Key Handling (Added 2025-06-15)

Implemented user experience improvements for the add button modal in the report details view.

### Requirements:
- When modal opens, automatically focus on the 'button name' textbox
- On Enter key press, trigger the 'add button' action if the button is enabled (input is valid)

### Solution:
Added focus and keyboard navigation functionality to the add button modal following the same patterns used by other modals in the application.

### Technical Details:
- **File Modified**: `src/webviews/reports/components/templates/clientScriptTemplate.js`
- **Function Updated**: `attachButtonModalEventListeners(modal)`
- **Changes Made**:
  1. **Auto-focus**: Added `buttonNameInput.focus()` when modal opens
  2. **Enter key handling**: Added keypress event listener for Enter key
  3. **Smart validation**: Enter key only triggers action when input passes validation
  4. **Consistent UX**: Follows same patterns as property and column modals

### Implementation:
```javascript
// Focus on button name input when modal opens
const buttonNameInput = modal.querySelector("#buttonName");
if (buttonNameInput) {
    buttonNameInput.focus();
}

// Add enter key handling for button name input
if (buttonNameInput) {
    buttonNameInput.addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            const buttonName = buttonNameInput.value.trim();
            const validationError = validateButtonName(buttonName);
            
            // Only trigger click if button would be enabled (no validation errors)
            if (!validationError) {
                addButton.click();
            }
        }
    });
}
```

### User Experience:
- Modal opens with cursor immediately in the button name field
- Users can type and press Enter to add button without mouse interaction
- Enter key is ignored for invalid input, preventing errors
- Consistent with other add modals throughout the application

### Testing:
- Created comprehensive test file `/tmp/test-button-modal-focus.html`
- Verified focus behavior works correctly
- Confirmed Enter key handling respects validation rules
- No regressions in existing functionality

## Object Hierarchy View - Auto Focus Search Box (Added 2025-06-15)

Enhanced user experience in the Object Hierarchy diagram by automatically focusing the search input when the view opens.

### Implementation:
- **File Modified**: `src/webviews/hierarchyView.js`
- **Location**: Added to `initDiagram()` function after event listener setup
- **Change**: Added `document.getElementById('search').focus();` to automatically place cursor in search box
- **Timing**: Focus is applied after all initialization is complete for best user experience

### User Experience Improvement:
- Users can immediately start typing to search objects without clicking on the search box first
- Follows common UI patterns where search interfaces auto-focus on load
- Improves workflow efficiency for users frequently searching in the hierarchy

## Object Hierarchy View - Enhanced Search Functionality (Updated 2025-06-15)

Implemented advanced search features including exact match view centering and partial match highlighting for improved user experience.

### Features:
1. **Exact Match Centering**: When search text exactly matches a node name, the view smoothly centers on that node WITHOUT selecting it
2. **Partial Match Highlighting**: When search text partially or exactly matches node names, those nodes get light green background
3. **Case Insensitive Search**: Search works regardless of case sensitivity
4. **Search State Management**: Proper cleanup when search is cleared or changed

### Implementation:
- **File Modified**: `src/webviews/hierarchyView.js`
- **Functions Enhanced**:
  - `searchObjects()`: Modified exact match handling to center view instead of selecting node
  - `centerViewOnNode()`: New function for smooth view centering using D3 zoom transforms
  - `clearSearchHighlights()`: Continues to clean up search state
  - `update()`: Unchanged node fill color logic for search highlighting

### Technical Details:
- Uses `node.searchHighlight` property to track nodes with partial matches
- **New**: `centerViewOnNode()` function calculates viewport center and smoothly pans to target node
- **Removed**: `node.searchSelected` property usage since exact matches are no longer selected
- Light green color (`lightgreen`) used for partial match highlighting
- **Changed behavior**: Exact matches center view with 500ms smooth transition instead of showing selection/details
- Search uses `includes()` for partial matching and `===` for exact matching
- 24 lines added, 8 lines removed - minimal surgical changes maintained

### User Experience Benefits:
- **Exact matches**: View smoothly centers on matched node without triggering selection or details panel
- **Partial matches**: Clear visual feedback with light green highlighting remains unchanged
- **Navigation**: Efficient centering on exact matches without manual scrolling
- **Non-intrusive**: Exact matches don't open details panel or change selection state
- Visual indicators remain until search is changed or cleared

### Implementation:
- **File Modified**: `src/webviews/hierarchyView.js`
- **Functions Enhanced**:
  - `searchObjects()`: Added exact vs partial match tracking
  - `clearSearchHighlights()`: New function for search state cleanup
  - `update()`: Modified node fill color logic to include search highlighting
  - `selectNode()` and `closeDetailPanel()`: Updated to preserve search highlighting

### Technical Details:
- Uses `node.searchHighlight` property to track nodes with partial matches
- Uses `node.searchSelected` property to track if node was selected via search
- Light green color (`lightgreen`) used for partial match highlighting
- Selection highlighting (blue) takes priority over search highlighting for exact matches
- Search uses `includes()` for partial matching and `===` for exact matching
- 42 lines added, 3 lines removed - minimal change approach maintained

### User Experience Benefits:
- Immediate visual feedback for search results
- Clear distinction between exact matches (focused) and partial matches (highlighted)
- Efficient navigation to exact matches without manual scrolling
- Visual indicators remain until search is changed or cleared

## Object Hierarchy View - Lookup Items Enhancement (Added 2025-12-20)

Implemented visual distinction and filtering for lookup items in the object hierarchy diagram per issue #182.

### Problem:
- Lookup data objects (isLookup="true") were not visually distinct in the hierarchy view
- No way to identify which objects were lookup items
- No option to hide lookup items to focus on main data objects

### Solution:
- **Visual Distinction**: Added light orange background color for lookup items
- **Legend**: Added visual legend showing orange color meaning 
- **Filtering**: Added checkbox to hide/show lookup items
- **Complete Integration**: Works with existing search and selection features

### Implementation:
- **File Modified**: `src/webviews/hierarchyView.js`
- **Styling**: Added `.node.lookup` CSS class with #ffa500 background
- **Data Processing**: Enhanced `buildObjectRelationships` to convert isLookup string to boolean
- **Node Classification**: Updated CSS class assignment in both node enter and update sections
- **UI Controls**: Added legend and checkbox to toolbar
- **Filtering Logic**: Implemented `toggleLookupItems` function to hide/show nodes and links

### Technical Details:
- **Priority System**: selected > search-highlight > search-partial > lookup > collapsed > normal
- **String Conversion**: Converts isLookup "true" string to boolean for easier JavaScript handling
- **Complete Filtering**: Hides both lookup nodes and their connecting links when filtered
- **Event Handling**: Added checkbox change listener to toggle visibility
- **Console Logging**: Added debug logging for lookup class application

### User Experience Benefits:
- Clear visual identification of lookup vs. main data objects
- Easy filtering to focus view on non-lookup objects
- Maintains full functionality with search and selection features
- Legend provides immediate understanding of color coding
## Report Button Name Validation - No Numbers Allowed (Added 2025-06-14)

Implemented requirement to prevent numbers in button names when adding new buttons in the report details view.

### Problem:
- The button name validation in the report details view allowed numbers in button names
- User requirement was to restrict button names to letters only (no numbers)

### Solution:
- Modified the `validateButtonName` function in `src/webviews/reports/components/templates/clientScriptTemplate.js`
- Changed regex from `/^[a-zA-Z][a-zA-Z0-9]*$/` to `/^[a-zA-Z][a-zA-Z]*$/`
- Updated error message to clarify that numbers are not allowed
- Updated the UI guidance text in button modal template

### Technical Details:
- **Primary File Modified**: `src/webviews/reports/components/templates/clientScriptTemplate.js`
  - Updated `validateButtonName` function regex and error message
- **Secondary File Modified**: `src/webviews/reports/components/templates/buttonModalTemplate.js`
  - Updated field note text from "Alpha characters only" to "Letters only"
- **Test File Updated**: `test-button-validation.js`
  - Updated test cases to expect validation errors for names containing numbers
  - Added specific test cases for names with numbers
- **Location**: Report Details View → Button Tab → Add Button Modal
- **User Impact**: Button names can now only contain letters (A-Z, a-z), no numbers or special characters

   
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

## Add Report Wizard Implementation (Added 2025-06-15)

Implemented a comprehensive Add Report Wizard for creating new reports from the REPORTS tree view item.

### Problem:
- Users needed a way to add new reports to data objects through a guided wizard interface
- Required support for multiple report types and role-based authorization
- Needed intelligent naming conventions and validation

### Solution:
- Created `src/webviews/addReportWizardView.js` - Complete wizard implementation following the Add Object Wizard pattern
- Added `appdna.addReport` command to package.json and view context menu for reports tree items
- Extended `src/commands/reportCommands.ts` with addReportCommand function
- Integrated with existing ModelService for data manipulation and tree refresh

### Architecture Pattern:
- **Webview Implementation**: JavaScript-based wizard with multi-step navigation
- **Command Registration**: Standard VS Code command pattern with context menu integration
- **Model Integration**: Uses ModelService for object retrieval and report creation
- **Tree Integration**: Automatically refreshes tree view and opens report details after creation

### Wizard Flow:
1. **Step 1: Owner Object Selection** - Select the data object that will own the report
2. **Step 2: Role Selection** - Choose required role (if Role objects exist, otherwise skipped)
3. **Step 3: Visualization Type** - Select from Table, Navigation, or Detail views
4. **Step 4: Target Object** - Select target data object (for Table visualization only)
5. **Step 5: Report Details** - Enter report name and title with validation

### Technical Features:
- **Smart Navigation**: Skips steps based on data availability and selections
- **Intelligent Naming**: Auto-generates report names following [Owner][Role][Target][Type] convention
- **Real-time Validation**: Name validation for uniqueness, format, and length constraints
- **Dynamic UI**: Progress indicator, conditional field display, and contextual descriptions
- **Role Detection**: Automatically detects Role objects and their lookup items
- **Child Object Resolution**: Dynamically loads child objects for target selection

### Files Modified/Created:
- **NEW**: `src/webviews/addReportWizardView.js` - Main wizard implementation
- **MODIFIED**: `src/commands/reportCommands.ts` - Added addReportCommand function
- **MODIFIED**: `package.json` - Added command and menu item
- **MODIFIED**: `copilot-command-history.txt` - Logged implementation

### Integration Points:
- **Tree View**: Plus icon button on REPORTS items triggers wizard
- **Model Service**: Uses getAllObjects(), getAllReports(), and markAsChanged()
- **Report Details**: Automatically opens created report in details view
- **Validation**: Leverages existing ReportSchema interface for type safety
- Property is null: Field is empty and readonly ✅
- Property is empty string: Field is empty and readonly ✅
- Other fields unaffected: Description field remains editable when appropriate ✅

### Benefits:
- Prevents accidental modification of parent object relationships
- Maintains data integrity in object hierarchy
- Consistent with read-only styling (different background via CSS)
- No impact on existing functionality for other fields

*Last updated: December 21, 2024*

## Bug Fix: Add Report Wizard markAsChanged Issue (Fixed 2025-01-15)

### Issue Fixed:
- Add Report Wizard was calling non-existent `modelService.markAsChanged()` method
- This caused "modelService.markAsChanged is not a function" error in final step of wizard

### Root Cause:
- Method name mismatch: code called `markAsChanged()` but ModelService only has `markUnsavedChanges()`
- Other files in codebase correctly use `markUnsavedChanges()` (e.g., reportDetailsView.js)

### Solution:
- Changed line 118 in `addReportWizardView.js` from `markAsChanged()` to `markUnsavedChanges()`
- Minimal one-line fix that aligns with existing codebase patterns
- No functional changes, just corrected method name

### Key Learning:
- Always verify method names against actual service interfaces
- The ModelService uses `markUnsavedChanges()` consistently throughout the codebase
- Pattern is: `if (modelService && typeof modelService.markUnsavedChanges === 'function') { modelService.markUnsavedChanges(); }`

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

## Add Column Modal Implementation (Added 2025-12-20)

Created a new "Add Column" modal for the report details view that's similar to the "Add Data Object Property" modal but tailored specifically for columns.

### Key Features:
- **Dual Interface**: Single column addition and bulk addition tabs
- **Essential Fields**: Focuses on `name` (required) and `headerText` (optional, auto-generated)  
- **Validation**: Pascal case naming, uniqueness checking, required field validation
- **Auto-Generation**: Header text automatically generated from column name (e.g., "FirstName" → "First Name")
- **Bulk Support**: Add multiple columns at once with one name per line

### Implementation Details:
- **Template Structure**: Created `addColumnModalTemplate.js` with tab-based interface similar to property modal
- **Functionality Integration**: Embedded modal functions directly in `clientScriptTemplate.js` for browser execution
- **Button Integration**: Modified add column button to use new modal instead of existing edit modal
- **Separation of Concerns**: Maintains distinction between adding new columns vs. editing existing ones

### Files Created:
- `addColumnModalTemplate.js`: Modal HTML template with single/bulk tabs
- `addColumnModalFunctionality.js`: Standalone functionality (kept for reference)

### Files Modified:
- `detailsViewGenerator.js`: Added imports and integration for new modal template
- `mainTemplate.js`: Updated function signature and modal rendering section
- `clientScriptTemplate.js`:
  - Added `getAddColumnModalHtml()` function inline
  - Added `createAddColumnModal()` function with full event handling
  - Modified add column button handler to use new modal
  - Added `addNewColumn()` helper function

### Architecture Pattern:
- **Modal Template**: HTML structure defined in separate template file for maintainability
- **Inline Integration**: JavaScript functionality embedded directly in client script for browser execution
- **Event-Driven**: Uses DOM events for validation, submission, and modal management
- **Data Validation**: Client-side validation with user-friendly error messages

### User Experience:
- **Familiar Interface**: Consistent with existing property modal design patterns
- **Clear Guidance**: Field notes explain naming conventions and requirements
- **Immediate Feedback**: Real-time validation with specific error messages
- **Flexible Input**: Choice between single column creation or bulk operations

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
- Minimal fix: 2 function calls added to existing move operation logic
 

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

## Select FK Object Modal Accept Button State Management (Updated 2025-01-17)

Enhanced the Select FK Object modal functionality to properly disable the 'Accept' button when no object is selected:

**Key Changes:**
- Fixed selection detection to use `selectedIndex` instead of `querySelector("option:checked")` for better compatibility with select elements
- Added click event listener in addition to change event listener to ensure button state updates immediately when user clicks on options
- Added CSS styling for disabled buttons to provide clear visual feedback using VS Code theme variables
- Accept button remains disabled until a valid selection is made, preventing invalid submissions

**Implementation Details:**
- Button starts disabled by default (`acceptButton.disabled = true`)
- Gets enabled when pre-selected value exists or when user makes a selection
- Visual feedback through reduced opacity and "not-allowed" cursor for disabled state
- Uses VS Code's built-in theme variables for consistent styling with editor theme

## Configuration File System (app-dna.config.json)

The extension uses a configuration file system to manage project-specific settings:

1. **File Location**: `app-dna.config.json` is created in the workspace root directory
2. **Creation**: Auto-created when a new AppDNA project is created via `createAppDNAFileCommand` in `objectCommands.ts`
3. **Purpose**: Stores project configuration including:
   - Model file name (allows custom naming instead of hardcoded "app-dna.json")
   - Code generation settings (output path)
   - Editor preferences (advanced properties, expand nodes on load)

4. **Usage Pattern**:
   - `getModelFileNameFromConfig()` in `fileUtils.ts` reads the config to determine the model file name
   - Used in `extension.ts` to locate the correct model file at startup
   - Used in `welcomeView.js` to check if files exist
   - If config doesn't exist, creates it with default "app-dna.json" model file name

5. **Config Structure**:
   ```json
   {
     "version": "1.0.0",
     "modelFile": "app-dna.json",
     "settings": {
       "codeGeneration": {
         "outputPath": "./generated"
       },
       "editor": {
         "showAdvancedProperties": false,
         "expandNodesOnLoad": false
       }
     }
   }
   ```

6. **Current Limitations**: Only the `modelFile` property is currently used by the extension logic.

## Configuration File Implementation Updates

**Enhanced Config Usage (June 29, 2025):**

The extension now properly utilizes the `outputPath` setting from the configuration file:

1. **New Function**: Added `getOutputPathFromConfig()` in `fileUtils.ts` to read the `settings.codeGeneration.outputPath` from config
2. **Updated Model Fabrication**: `modelFabricationCommands.ts` now uses config outputPath instead of hardcoded "fabrication_results"
3. **Dynamic Folder Support**: 
   - Supports both relative and absolute paths from config
   - Default fallback to "./fabrication_results" if config missing/invalid
   - Success messages now show actual folder name used
4. **Webview Updates**: 
   - `modelFabricationView.js` displays dynamic folder name in success messages
   - `welcomeView.js` uses generic messaging about "output folder"

This makes the extension properly respect user configuration for where fabrication results are stored.

## Config File Naming Standardization (June 29, 2025)

**Important Change**: The config file naming has been standardized to always use `app-dna.config.json` regardless of the model file name.

- **Previous Behavior**: Config file was named based on model file (e.g., `my-model.config.json` for `my-model.json`)
- **New Behavior**: Config file is always named `app-dna.config.json` in the workspace root
- **Rationale**: Consistent naming makes it easier to locate and reference the config file
- **Updated Function**: `createConfigFileName()` in `objectCommands.ts` now returns fixed name
- **Copilot Ignore**: Added `!app-dna.config.json` to ensure this file is never ignored by Copilot

## Auto-Expand Tree View Feature (June 29, 2025)

**New Feature**: Auto-expand tree view nodes when model is loaded based on config setting.

**Implementation**:
1. **New Function**: Added `getExpandNodesOnLoadFromConfig()` in `fileUtils.ts` to read the `settings.editor.expandNodesOnLoad` boolean from config
2. **Extension Startup**: Modified `extension.ts` to check config and auto-expand when model loads on startup
3. **Refresh Command**: Updated `registerCommands.ts` refresh command to respect auto-expand setting after reload
4. **New Project Creation**: Modified `addFileCommand` in `objectCommands.ts` to auto-expand after creating new project

**How it works**:
- When `expandNodesOnLoad: true` in config, the extension automatically calls `jsonTreeDataProvider.expandAllItems()`
- Uses small delays (100-200ms) to ensure tree view is ready before expansion
- Applied to all model loading scenarios: startup, refresh, and new project creation

**Config Setting**:
```json
{
  "settings": {
    "editor": {
      "expandNodesOnLoad": true
    }
  }
}
```

## Conditional Tree View Items Feature (June 29, 2025)

**New Feature**: Show/hide advanced tree view items based on config setting.

**Implementation**:
1. **New Function**: Added `getShowAdvancedPropertiesFromConfig()` in `fileUtils.ts` to read the `settings.editor.showAdvancedProperties` boolean from config
2. **Modified JsonTreeDataProvider**: Updated tree item creation logic to conditionally show items based on config
3. **Root Level**: REPORTS item is only shown if `showAdvancedProperties: true`
4. **PROJECT Children**: Lexicon, User Stories, MCP Server, and MCP HTTP Server are only shown if `showAdvancedProperties: true`
5. **Always Shown**: Settings item under PROJECT is always visible regardless of the setting

**Conditional Items**:
- **Hidden when `showAdvancedProperties: false`**:
  - REPORTS (root level)
  - Lexicon (under PROJECT)
  - User Stories (under PROJECT)
  - MCP Server (under PROJECT)
  - MCP HTTP Server (under PROJECT)

- **Always Visible**:
  - PROJECT (root level)
  - DATA OBJECTS (root level)
  - MODEL SERVICES (root level)
  - Settings (under PROJECT)

**Config Setting**:
```json
{
  "settings": {
    "editor": {
      "showAdvancedProperties": false
    }
  }
}
```

This provides a cleaner interface for basic users while keeping advanced features accessible when needed.

## AppDNA Settings View and Configuration Management (Added 2025-01-02)

### Settings Gear Icon and Configuration UI:
Added a settings gear icon to the AppDNA tree view title bar that opens a configuration interface allowing users to edit AppDNA config properties.

### Architecture Pattern:
- **Settings View**: Created `src/webviews/appDnaSettingsView.js` as a dedicated webview for editing config file properties
- **Tree View Integration**: Added gear icon to tree view title bar with appropriate visibility conditions
- **Command Registration**: Registered `appdna.showAppDNASettings` command in `registerCommands.ts`
- **Config Integration**: Webview reads and writes to `app-dna.config.json` in workspace root

### Key Features:
- **Professional UI**: Clean, VS Code-themed interface with grouped settings sections
- **Config Property Management**: Allows editing of output path, showAdvancedProperties, and expandNodesOnLoad
- **Streamlined Interface**: Simplified UI focusing only on configurable properties
- **Real-time Refresh**: Tree view automatically refreshes after settings are saved
- **Form Validation**: Basic validation of config structure before saving

### Configurable Properties:
- **Output Path**: Folder where fabricated code will be saved (relative to workspace root)
- **Show Advanced Properties**: Controls visibility of advanced tree view items (Lexicon, User Stories, MCP Servers, Reports)
- **Expand Nodes on Load**: Automatically expands all tree view nodes when a model is loaded

### Files Added/Modified:
- `src/webviews/appDnaSettingsView.js`: New settings webview implementation
- `src/commands/registerCommands.ts`: Added settings command registration and import
- `package.json`: Settings command already configured in menus with proper `when` conditions

### Menu Visibility:
Settings gear icon appears in tree view title bar only when:
- `view == appdna` (in AppDNA tree view)
- `appDnaFileExists` (AppDNA model file is loaded)
- `appDnaConfigExists` (Config file exists in workspace)

### Context Key Integration:
The `appDnaConfigExists` context key is managed by `fileUtils.ts` and automatically updated when config file state changes, ensuring the settings button appears/disappears appropriately.

### Settings Form Structure:
1. **Code Generation**: Editable output path with description
2. **Editor Settings**: Checkboxes for showAdvancedProperties and expandNodesOnLoad
3. **Action Button**: Single Save button for streamlined user experience

### Benefits:
- **User-Friendly Configuration**: No need to manually edit JSON files
- **Immediate Feedback**: Tree view updates immediately after saving settings
- **Proper Validation**: Prevents invalid config structures from being saved
- **Consistent Design**: Matches VS Code design language and extension patterns

## User Registration Implementation (June 29, 2025)

The extension now supports user registration through the Model Services treeview:

- **AuthService**: Contains both `login()` and `register()` methods for API authentication
- **Register Endpoint**: `/api/v1_0/registers` with RegisterPostModel schema (email, password, confirmPassword, firstName, lastName, optIntoTerms)
- **Tree View**: When not logged in, shows both "Login" and "Register" options under Model Services
- **Register View**: `registerView.ts` provides a webview form similar to login view for user registration
- **Navigation**: Users can switch between login and register views via links in each view
- **Success Flow**: After successful registration, user is automatically logged in and welcome view is shown

**Registration Form Fields:**
- Email (required)
- First Name (required) 
- Last Name (required)
- Password (required)
- Confirm Password (required)
- Terms of Service checkbox (required)

**API Response**: Returns `modelServicesAPIKey` on successful registration, same as login flow.

## Validation Error Display Enhancement (June 29, 2025)

Enhanced the authentication views to properly display API validation errors:

- **AuthService Error Handling**: Modified to preserve structured validation errors instead of concatenating them
- **Error Structure**: Throws errors with `isValidationError` flag and `validationErrors[]` array
- **UI Display**: Added proper CSS styling and JavaScript handling for validation errors
- **User Experience**: Each field error is displayed separately with clear field identification
- **Consistency**: Both login and register views use identical error display patterns

**Error Display Features:**
- General errors: Single message display (as before)
- Validation errors: Structured list with field names and error messages
- Visual styling: Left border, background highlighting, bold field names
- Clear separation between different types of errors

## Web Extension Compatibility Issues (June 29, 2025)

The AppDNA extension cannot run on VS Code for the Web because:

1. **Missing `browser` field**: Web extensions require a `browser` field in package.json instead of/alongside `main`
2. **Heavy Node.js dependencies**: The extension extensively uses Node.js APIs that are not available in browsers:
   - `fs` (file system) - used in 21+ files for reading/writing JSON files  
   - `path` - used in 21+ files for file path manipulation
   - `process` - used in MCP server for stdio communication and process handling
3. **File system operations**: Core functionality depends on direct file system access to read/write app-dna.json files
4. **MCP Server**: The Model Context Protocol server uses stdio/process APIs incompatible with browser environment
5. **Local file dependencies**: Extension loads local schema files and resources using file:// paths

## Schema Loading Issue Fixed (June 29, 2025)

Fixed critical bug in project settings view where schema file loading was failing:

**Problem**: ModelService.getSchemaPath() was using incorrect extension ID 'TestPublisher.appdna' instead of 'derivative-programming.appdna' from package.json

**Solution**: 
1. Updated extension ID to match package.json 
2. Enhanced error handling with fallback to extensionContext utility
3. Added more robust path resolution using existing extension infrastructure

**Files Changed**: 
- src/services/modelService.ts - Fixed getSchemaPath() method

**Related Components**:
- SchemaLoader class already has proper path resolution logic that could be used for consistency
- Extension context utility provides reliable extension path resolution

## MCP (Model Context Protocol) Server Implementation (Added 2025-07-05)

### Architecture Overview:
The extension implements a comprehensive MCP server that allows GitHub Copilot and other AI assistants to interact with AppDNA model data through standardized protocols.

### Key Components:
- **MCPServer** (`src/mcp/server.ts`): Main server implementation using stdio transport
- **MCPHttpServer** (`src/mcp/httpServer.ts`): HTTP wrapper for the MCP protocol
- **UserStoryTools** (`src/mcp/tools/userStoryTools.ts`): Implements user story creation and listing tools
- **StdioBridge** (`src/mcp/stdioBridge.ts`): Entry point for standalone stdio mode

### Features Implemented:
- **Dual Transport**: Both stdio and HTTP transport methods
- **User Story Management**: Create and list user stories with validation
- **Model Integration**: Automatically saves to AppDNA model when loaded, falls back to in-memory storage
- **Format Validation**: Validates user story formats ("As a [Role], I want..." and "A [Role] wants to...")
- **Singleton Pattern**: Ensures single instance across the extension
- **Status Events**: Emits status change events for UI updates

### VS Code Integration:
- **Commands**: Start/stop commands for both stdio and HTTP servers
- **Output Channels**: Dedicated logging for debugging
- **Configuration**: Generates mcp.json config file for Copilot integration
- **Package.json**: MCP entry point defined for external access

### Current Limitations:
- Limited to user story tools only (vs todo list in ai-agent-architecture-notes.md shows more planned tools)
- Types.ts file is empty (needs type definitions)
- No data object manipulation tools yet implemented
- No validation request tools implemented
- HTTP server implementation incomplete (references incomplete at line 840)

### TODO Items from Code Review:
- Implement data object tools (get, add, modify objects and properties)
- Add validation request tools
- Complete HTTP server implementation
- Add proper TypeScript type definitions
- Expand tool coverage to match todo requirements

### VS Code Official MCP Guidelines Review (2025-07-05):
After reviewing the official VS Code MCP documentation, several critical gaps and improvements needed:

**❌ Missing Official Registration Method:**
- Current implementation uses custom stdio/HTTP servers
- Official VS Code way: Use `vscode.lm.registerMcpServerDefinitionProvider` API
- Need to add `contributes.mcpServerDefinitionProviders` to package.json
- Should implement `McpServerDefinitionProvider` with proper lifecycle management

**❌ Naming Convention Violations:**
- Current tools: `createUserStory`, `listUserStories` (camelCase)
- Official standard: `create_user_story`, `list_user_stories` (snake_case with verb_noun pattern)

**❌ Missing Advanced Features:**
- No Resources implementation (should provide AppDNA model data as resources)
- No Prompts implementation (could provide reusable workflow templates)
- No Authorization support (future OAuth integration)
- No Sampling support (LLM requests from server)
- No Development mode configuration (watch/debug)

**❌ Tool Annotations Missing:**
- No `title` annotations for human-readable names
- No `readOnlyHint` for non-destructive operations
- Tool confirmation dialogs not properly configured

**✅ Correct Implementation Aspects:**
- Proper error handling and validation
- JSON-RPC 2.0 protocol compliance
- Output channel logging
- VS Code integration commands

**Priority Fixes Needed:**
1. Migrate to official `vscode.lm.registerMcpServerDefinitionProvider` API
2. Fix tool naming to follow snake_case convention
3. Add Resources for AppDNA model browsing
4. Implement proper tool annotations
5. Add development mode configuration

### High Priority MCP Implementation Status (2025-07-05):

**✅ Completed Items:**
1. **Fixed Tool Naming Convention** - All tools now use snake_case format:
   - `createUserStory` → `create_user_story`
   - `listUserStories` → `list_user_stories` 
   - Updated in server.ts, userStoryTools.ts, tests, and mcp.json
   - Follows official MCP naming standards: {verb}_{noun}

2. **Added Package.json MCP Configuration** - Added `mcpServerDefinitionProviders` contribution point:
   - ID: `appDNAMcpProvider`
   - Label: `AppDNA MCP Server Provider`
   - Ready for official API when available

3. **Prepared Official API Migration** - Created AppDNAMcpProvider class:
   - Implements VS Code MCP provider pattern
   - Handles server definitions and lifecycle
   - Ready for vscode.lm.registerMcpServerDefinitionProvider API

**⚠️ Blocked Item:**
- **Official API Registration** - `vscode.lm.registerMcpServerDefinitionProvider` not available in VS Code 1.99.0
- API appears to be in preview/future release
- Provider implementation ready but commented out in extension.ts
- Will need VS Code engine update when API becomes available

**📊 Progress Summary:**
- Tool naming: ✅ 100% complete (snake_case convention)
- Package.json config: ✅ 100% complete (contribution points added)
- Official API migration: 🟡 95% complete (blocked by API availability)

**Next Steps When API Available:**
1. Update VS Code engine version in package.json
2. Uncomment MCP provider registration in extension.ts
3. Test official integration with VS Code MCP management

## Report Details View Architecture Review (2025-07-05)

### File Structure
- **Main View**: `src/webviews/reportDetailsView.js` - Wrapper that delegates to the reports subfolder
- **Implementation**: `src/webviews/reports/reportDetailsView.js` - Core implementation with 826 lines
- **Components**: `src/webviews/reports/components/` - Modular template system
- **Templates**: Multiple template files for different sections (main, settings, columns, buttons, params)
- **Styles**: `src/webviews/reports/styles/detailsViewStyles.js` - CSS-in-JS styling

### Key Features
1. **Tabbed Interface**: Settings, Columns, Buttons, Filters (Parameters)
2. **Dual View Modes**: List view and Table view for array properties
3. **Schema-Driven**: Uses app-dna.schema.json to dynamically generate form fields
4. **Property Management**: Checkboxes control property existence in JSON
5. **Live Updates**: Direct model manipulation with real-time webview refresh
6. **Panel Management**: Prevents duplicate panels, tracks open panels

### Architecture Strengths
- Clean separation of concerns with template system
- Schema-driven UI generation prevents hardcoding
- Direct model reference updates for efficiency
- Comprehensive debugging logging
- Follows VS Code UI patterns and styling

### UX Features
- Read-only controls have different styling
- Tooltips from schema descriptions
- Alphabetical property ordering
- Move up/down/reverse operations for arrays
- Modal dialogs for adding new items
- Copy functionality for array items

### Data Flow
1. Panel opens → Loads report from ModelService
2. Schema loaded → UI generated dynamically  
3. User edits → Direct model updates
4. Changes marked → Tree view refreshed
5. Tab preservation during updates

### Areas for Review/Improvement
- Large file size (826 lines) - could benefit from more modularization
- Complex message handling switch statement
- Heavy use of console.log - could use structured logging
- Some duplicate template logic across array types

## Object Workflow Architecture Review (2025-07-05)

### Schema Structure
- **Main Entity**: `objectWorkflow` array within data objects
- **Core Properties**: name, titleText, initObjectWorkflowName, isPage, etc.
- **Child Arrays**: 
  - `objectWorkflowParam[]` - Input parameters for the workflow
  - `objectWorkflowOutputVar[]` - Output variables/results
  - `objectWorkflowButton[]` - Buttons/actions available
  - `dynaFlowTask[]` - Background task definitions

### Model Implementation
- **Main Model**: `ObjectWorkflowModel.ts` (215 lines)
- **Child Models**: 
  - `ObjectWorkflowParamModel.ts` - Parameter definitions
  - `ObjectWorkflowButtonModel.ts` - Button configurations  
  - `ObjectWorkflowOutputVarModel.ts` - Output variable specs
- **Interfaces**: Complete TypeScript interfaces in `src/data/interfaces/`

### Current State Analysis
**✅ Implemented:**
- Complete TypeScript models and interfaces
- JSON schema definitions with all properties
- Model serialization/deserialization
- Integration with parent object model

**❌ Missing Implementation:**
- No dedicated webview for object workflow details
- No tree view representation of workflows
- Object workflows excluded from object details view (line 31 in detailsViewGenerator.js)
- No commands for creating/editing workflows
- No UI for workflow parameters, buttons, output variables

### Key Features from Schema
1. **Page Workflows**: `isPage: "true"` indicates form/page workflows
2. **Authorization**: Role-based access with `isAuthorizationRequired` and `roleRequired`
3. **Form Configuration**: Title, intro, footer text and images
4. **DynaFlow Integration**: Background task workflow support
5. **Business Logic**: `isExposedInBusinessObject` for API exposure

### Todo Item Connection
- Forms tree view item mentions "object.objwf where page = true"
- This suggests need for displaying page-type workflows in tree view
- Currently no UI exists for this functionality

### Recommended Implementation Priorities
1. Add object workflows to tree data provider (filtered by isPage=true)
2. Create object workflow details webview (similar to report details)
3. Implement workflow parameter/button/output variable editing
4. Add commands for creating new workflows
5. Integrate with forms tree view for page workflows

### Technical Considerations
- Schema has 30+ properties with complex business logic rules
- Similar complexity to reports but with different focus (forms vs data)
- Would benefit from same tabbed interface pattern as reports
- Need schema-driven UI generation like other detail views

## Forms Tree View Implementation (2025-07-05)

### Implementation Summary
Successfully added a 'Forms' section to the tree view that displays object workflows with `isPage=true`.

### Changes Made

**1. ModelService Enhancement** (`src/services/modelService.ts`):
- Added `getAllPageObjectWorkflows()` method to retrieve workflows with `isPage=true`
- Added import for `ObjectWorkflowSchema` interface
- Method filters all object workflows from all objects and returns only page-type workflows

**2. Tree Data Provider Updates** (`src/providers/jsonTreeDataProvider.ts`):
- Added FORMS as a new top-level tree item above REPORTS
- Added 'forms' context value handling
- Implemented filtering support for form items
- Added proper error handling and empty state messages
- Used 'form' icon for the main Forms section and 'file-code' for individual forms

**3. Command Integration** (`src/models/types.ts` & `src/commands/registerCommands.ts`):
- Added `formItem` context handling in JsonTreeItem constructor
- Added `appdna.showFormDetails` command registration
- Implemented placeholder command that shows form information
- Command shows form name and explains current implementation status

**4. Tree Structure Order**:
```
- PROJECT
- DATA OBJECTS  
- FORMS (new - shows when advanced properties enabled)
- REPORTS
- MODEL SERVICES
```

**5. Test Data** (`app-dna.new.json`):
- Added sample object workflow with `isPage=true` for testing
- Includes parameters and buttons to demonstrate full structure
- Named "PacAddForm" with proper form configuration

### UI Features Implemented
- ✅ Forms section appears above Reports in tree view
- ✅ Shows count and proper icons
- ✅ Filters forms based on global filter text
- ✅ Displays form name or titleText as fallback
- ✅ Shows helpful tooltips with form details
- ✅ Handles empty states and loading states
- ✅ Only shows when advanced properties are enabled (same as Reports)
- ✅ Clickable form items with placeholder command
- ✅ Proper command integration following extension patterns

### Technical Notes
- Forms are filtered by `isPage=true` to show only page-type workflows
- Display name uses `workflow.name` with fallback to `workflow.titleText`
- Tooltip shows both name and title text when available
- Context value 'formItem' for individual forms enables command handling
- Follows same architectural patterns as Reports implementation
- Placeholder command shows information dialog until full details view is implemented

### Future Implementation
The foundation is now in place for adding a full form details view similar to the report details view. This would include:
- Object workflow details webview
- Parameter editing interface
- Button configuration
- Output variable management
- Form settings configuration

## Forms Detail View Modularization (2024-12-19)

Successfully refactored the forms detail view from a monolithic clientScriptTemplate.js (1289 lines) to a modular architecture similar to the reports/objects view.

### Key Architecture Points:

1. **Script Injection Flow**:
   - detailsViewGenerator.js reads all modular scripts from `scripts/` directory
   - Combines them with the main clientScriptTemplate.js
   - Passes the combined script to mainTemplate.js
   - mainTemplate.js injects it as a single `<script>` block

2. **Modular Scripts Structure**:
   - Scripts are plain JavaScript (no wrapper functions or module.exports)
   - No `<script>` tags in the modular files
   - Each script contains specific initialization functions
   - All scripts are concatenated and executed in the webview context

3. **Critical Pattern**:
   - Each modular script exports functions like `initializeXXXFunctionality()`
   - The main clientScriptTemplate.js calls all initialization functions on DOMContentLoaded
   - Only one `acquireVsCodeApi()` call in the main template
   - VS Code API (`vscode`) is available globally to all modular scripts

4. **Forms Specific Modules**:
   - modalFunctionality.js - Modal open/close functions
   - uiEventHandlers.js - Tab switching and view switching  
   - formControlUtilities.js - Input styling utilities
   - buttonManagementFunctions.js - Button CRUD operations
   - parameterManagementFunctions.js - Parameter CRUD operations
   - outputVariableManagementFunctions.js - Output variable CRUD operations
   - domInitialization.js - Event listeners and initialization

5. **Common Issues Fixed**:
   - Removed function wrappers from modular scripts
   - Fixed lint errors with curly braces on if statements
   - Ensured no duplicate acquireVsCodeApi() calls
   - Proper initialization function calling sequence

### Debugging Tips:
- Check that modular scripts are plain JavaScript without wrappers
- Verify all initialization functions exist and are called
- Ensure VS Code API is acquired only once in main template
- Monitor script injection order in detailsViewGenerator.js

### Common UI Bug Pattern - List/Table View Switching (Added 2025-07-06):
When implementing list/table view toggle buttons in details views, ensure the view switching JavaScript matches the actual HTML element IDs:
- **HTML Elements**: Use naming convention like `columnsListView`, `columnsTableView`, `buttonsListView`, etc.
- **View Switching Logic**: Must construct the proper ID from tab name + "ListView"/"TableView"
- **Event Handler**: Look for `.icon[data-view="list|table"]` clicks and find parent `.view-icons[data-tab="..."]`
- **Bug Pattern**: Using class-based selectors like `.list-view` instead of ID-based selectors like `#columnsListView`

**IMPORTANT**: Forms Detail View has inconsistent naming patterns that require special handling:
- `params` tab: `paramsListView` / `paramsTableView` (standard pattern)
- `buttons` tab: `buttons-list-view` / `buttons-table-view` (with hyphens!)
- `outputVars` tab: `outputVarsListView` / `outputVarsTableView` (standard pattern)

The view switching code should handle these inconsistencies:
```javascript
if (currentTab === 'buttons') {
    // Special case for buttons tab which uses hyphens
    viewId = view === 'list' ? 'buttons-list-view' : 'buttons-table-view';
} else {
    // Standard pattern for other tabs
    viewId = currentTab + (view === 'list' ? 'ListView' : 'TableView');
}
```
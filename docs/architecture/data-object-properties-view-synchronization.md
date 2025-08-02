# Data Object Properties View Synchronization (2024-07-13)

## Issue Identified
The data object properties tab has both list and table views that allow users to edit property values. However, changes made in one view were not being reflected in the other view when switching between them.

## Root Cause
- Both views update the in-memory `props` array when changes are made
- However, when switching views, the UI controls were not being refreshed with the current state of the `props` array
- This caused inconsistent data display between list and table views

## Solution Implemented (Revised July 13, 2025)
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

## Key Files Modified
- `src/webviews/objects/components/templates/clientScriptTemplate.js` - Added global refresh functions with proper scope access
- `src/webviews/objects/components/scripts/uiEventHandlers.js` - Added view switching refresh calls with timing delays
- `src/webviews/objects/components/scripts/saveSubmitHandlers.js` - Added cross-view update calls with debugging
- `src/webviews/objects/components/scripts/propertyManagement.js` - Added refresh call after property addition
- `src/webviews/objects/components/scripts/lookupItemManagement.js` - Enhanced lookup item synchronization

## Technical Implementation Details (Revised)
- Refresh functions are defined globally on `window` object to ensure accessibility across all modules
- Functions access global variables (`props`, `propColumns`, `propItemsSchema`) defined in client script scope
- Lookup items are accessed via `window.objectData.lookupItem` to handle local variable scope properly
- Small timeout delays (10-50ms) are used to handle timing issues where DOM or data updates need completion
- Extensive console logging added for debugging synchronization issues
- Both properties and lookup items follow the same synchronization pattern with proper error handling

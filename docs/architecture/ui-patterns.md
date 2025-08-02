# UI Patterns

## Add Item Selection Pattern

When adding new items (columns, parameters, buttons, etc.) to lists in detail views, there are two different patterns used:

### Forms View Pattern (Recommended)
- Uses individual `add[ItemType]WithName` commands (e.g., `addParamWithName`, `addButtonWithText`)
- Backend functions create the item and send `refresh[ItemType]sList` message with `newSelection` parameter
- Client-side refresh functions support `newSelection` parameter to auto-select newly added items
- More efficient as it only refreshes the list, not the entire view
- Examples: `formDetailsView.js` - `addParamToFormWithName`, `addButtonToFormWithText`

### Reports View Pattern (Updated - 2025-08-02)
- **Fixed inconsistency:** Column adding worked correctly with auto-selection, but button and param adding did not
- **Root cause:** Buttons had no add event listener, params used old `updateModel` approach 
- **Solution implemented:**
  - Added `addButtonToReport` and `addButtonToReportWithName` backend functions
  - Added `addParamToReport` and `addParamToReportWithName` backend functions  
  - Added missing event listener for `add-button-btn` in buttonManagementFunctions.js
  - Updated param adding to use `addParamWithName` instead of `updateModel`
  - All three types (columns, buttons, params) now use consistent pattern:
    - Backend functions send `refresh[Type]sList` message with `newSelection` parameter
    - Frontend automatically selects newly added items
- Examples: `reportDetailsView.js` - `addColumnToReportWithName`, `addButtonToReportWithName`, `addParamToReportWithName`

### Key Learning
- Always use the individual add commands with selection rather than full model updates
- This provides better UX (immediate selection of new items) and better performance
- The refresh functions should support `newSelection` parameter for auto-selection
- Backend should send refresh messages with newSelection pointing to newly added item index

## Modal Textarea Enter Key Behavior

For bulk add modals with textarea inputs (columns, parameters, buttons):
- **Single input fields**: Enter key submits the form for quick single-item addition
- **Bulk textarea fields**: Enter key creates new lines (normal textarea behavior)
- Users must click the "Add [Items]" button to submit bulk additions
- This provides better UX as users expect Enter to create new lines in multi-line text areas
- Implementation: Remove keydown event listeners for bulk textareas in `modalFunctionality.js`

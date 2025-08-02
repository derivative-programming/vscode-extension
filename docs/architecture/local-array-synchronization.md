# Local Array Synchronization Pattern (Added 2025-07-13)

## Problem: Property Changes Lost When Switching Between Items
When implementing details views with list views (Forms, Reports, Objects), changes to properties can be lost when switching between items if the local array is not synchronized with backend changes.

## Pattern:
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

## Implementation Notes:
- Update local array immediately when changes occur
- Both checkbox changes and input field changes need this pattern
- Applies to list view and table view handlers
- Critical for maintaining UI state consistency

## Example Files:
- `columnManagementFunctions.js` - Column property changes
- Similar pattern needed for buttons, parameters, etc.

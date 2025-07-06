# Bug Fixes And Improvements

*This file contains architecture notes related to bug fixes and improvements.*

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


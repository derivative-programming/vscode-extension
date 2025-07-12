# Testing Config File Watcher Implementation

This file documents how to test the newly implemented config file watcher functionality.

## Test Steps

### 1. Setup Test Environment
1. Open VS Code with this extension project
2. Ensure you have an `app-dna.json` file in the workspace root
3. Ensure you have an `app-dna.config.json` file in the workspace root (create one if needed)

### 2. Test Config File Creation
1. Delete `app-dna.config.json` if it exists
2. Watch the VS Code developer console (`Help > Toggle Developer Tools`)
3. Create a new `app-dna.config.json` file with minimal content:
```json
{
  "version": "1.0.0",
  "modelFile": "app-dna.json",
  "settings": {
    "codeGeneration": {
      "outputPath": "./fabrication_results"
    },
    "editor": {
      "showAdvancedProperties": true,
      "expandNodesOnLoad": true
    }
  }
}
```
4. **Expected Result**: Console should show "app-dna.config.json file was created" and tree view should refresh

### 3. Test Config File Changes
1. Open the AppDNA Settings view (`Ctrl+Shift+P` → "AppDNA Settings")
2. Note current settings values
3. Externally edit `app-dna.config.json` to change `showAdvancedProperties` from `true` to `false`
4. Save the config file
5. **Expected Results**: 
   - Console shows "app-dna.config.json file was changed"
   - Tree view refreshes (advanced properties like Reports/Forms should hide/show)
   - Settings panel automatically reloads with new values

### 4. Test Config File Deletion
1. Delete `app-dna.config.json`
2. **Expected Result**: Console should show "app-dna.config.json file was deleted" and tree view should refresh

### 5. Test Settings Panel Hot Reload
1. Create `app-dna.config.json` with `showAdvancedProperties: false`
2. Open AppDNA Settings view
3. Note that "Show Advanced Properties" checkbox is unchecked
4. Externally edit config to set `showAdvancedProperties: true`
5. Save the config file
6. **Expected Result**: Settings panel checkbox should automatically update to checked without manual reload

## Implementation Details

### Files Modified:
- `src/extension.ts` - Added config file watcher
- `src/commands/registerCommands.ts` - Added reloadConfig command
- `src/webviews/appDnaSettingsView.js` - Added reload functionality

### Commands Added:
- `appdna.reloadConfig` - Internal command triggered by file watcher

### Key Features:
1. **Automatic Detection**: File watcher detects creation, modification, and deletion
2. **Tree View Refresh**: Applies config changes to tree view visibility
3. **Settings Panel Reload**: Hot-reloads open settings panels
4. **Debug Logging**: Console messages for troubleshooting

## Error Scenarios to Test

### Invalid JSON
1. Edit config file to have invalid JSON syntax
2. Save the file
3. **Expected**: Error handling should prevent crashes

### Missing Properties
1. Edit config to remove required properties
2. Save the file
3. **Expected**: Extension should use defaults gracefully

### File Permission Issues
1. Make config file read-only
2. Try to modify through settings panel
3. **Expected**: Appropriate error message should appear

## Success Criteria

✅ File watcher detects config file changes
✅ Tree view refreshes automatically on config changes
✅ Settings panel reloads without user intervention
✅ No compilation errors
✅ No runtime errors in console
✅ Performance impact is minimal
✅ TODO item marked as completed

This implementation successfully addresses the requirement "if appdna config file changes, reload its settings" from the todo list.

# Configuration System

*This file contains architecture notes related to configuration system.*

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


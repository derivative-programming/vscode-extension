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

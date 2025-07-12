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

# AppDNA VS Code Extension Architecture Notes

This file serves as the main index for architecture documentation. The detailed architecture notes have been organized into separate files by topic for better maintainability.

## Code Review Notes (2025-08-02)

### Page Preview Form Controls - Date/DateTime Implementation
- **Location**: `src/webviews/pagepreview/components/htmlGenerator.js` lines 2346-2351
- **Implementation**: Date and datetime controls are correctly implemented:
  - `dataType = "date"` → `<input type="date">` (date picker only)
  - `dataType = "datetime"` → `<input type="datetime-local">` (date picker + time picker)
  - `dataType = "time"` → `<input type="time">` (time picker only)
- **Logic**: Uses `dataType.includes()` checks with proper precedence handling
- **Data Source**: `param.sqlServerDBDataType` converted to lowercase for comparison
- **Schema**: Both "date" and "datetime" are valid enum values in app-dna.schema.json
- **Status**: ✅ Implementation is correct and follows HTML5 input type standards

### Report Grid Filter Date/DateTime Implementation - **FIXED**
- **Location**: `src/webviews/pagepreview/components/htmlGenerator.js` lines 2615-2618 (function `generateFilterInput`)
- **Issue Found**: Report grid filters only checked `dataType.includes('date')` for all date types
- **Problem**: 
  - `dataType = "datetime"` → was showing `<input type="date">` ❌ (wrong - no time picker)
  - `dataType = "time"` → was showing `<input type="date">` ❌ (wrong - no time selection)
- **Fix Applied**: Updated logic to match form input implementation:
  - `dataType = "date"` → `<input type="date">` ✅ (date picker only)
  - `dataType = "datetime"` → `<input type="datetime-local">` ✅ (date + time picker)
  - `dataType = "time"` → `<input type="time">` ✅ (time picker only)
- **Status**: ✅ **FIXED** - Report grid filters now correctly implement date/datetime/time inputs

## Architecture Documentation

### [UI Components](./docs/architecture/ui-components.md)
Documentation for all user interface components including:
- Form and Report Details Views
- Modal implementations and enhancements  
- Wizard implementations and focus handling
- Tree view functionality and object hierarchy
- Button and input field behaviors
- Auto-focus and keyboard navigation features

### [UI Patterns](./docs/architecture/ui-patterns.md)
- Describes common UI patterns used throughout the extension, such as the Add Item Selection Pattern and Modal Textarea Enter Key Behavior.

### [Page Flow Diagram View](./docs/architecture/page-flow-diagram-view.md)
- Detailed architecture of the page flow diagram view, including D3.js force simulation configuration, key features, data flow, and technical implementation.

### [Recent Changes](./docs/architecture/recent-changes.md)
- A log of recent enhancements and new features added to the extension.

### [Bug Fixes and Improvements](./docs/architecture/bug-fixes-and-improvements.md)
Documentation for bug fixes and system improvements including:
- Font consistency fixes
- Property management issue resolutions
- Validation error display enhancements
- Web extension compatibility updates
- Schema loading issue fixes

### [Configuration System](./docs/architecture/configuration-system.md)
Documentation for configuration management including:
- AppDNA configuration file system (app-dna.config.json)
- Settings tab implementations
- Property hiding and read-only field management
- Auto-expand and conditional tree view features

### [Other Architecture](./docs/architecture/other-architecture.md)
Documentation for other architectural components including:
- Model AI panel management during logout
- User registration implementation
- MCP (Model Context Protocol) server implementation

### [Client Script Architecture](./docs/architecture/client-script-architecture.md)
Documentation for client script architecture including:
- Modularization pattern for client-side scripts
- Common pitfalls to avoid when working with client scripts
- Client script testing guidelines

### [Notebook Architecture](./docs/architecture/notebook-architecture.md)
- Describes how to work with Jupyter Notebooks within the extension.

### [Property Modal Architecture](./docs/architecture/property-modal-architecture.md)
- Architecture notes for the "Add Property" modal.

### [Data Object Lookup Item Tab](./docs/architecture/data-object-lookup-item-tab.md)
- Review of issues and fixes for the Data Object Lookup Item Tab.

### [Tree View Structure](./docs/architecture/tree-view-structure.md)
- Describes the structure of the tree view in the extension.

### [Refresh Functionality](./docs/architecture/refresh-functionality.md)
- Details on the enhanced refresh functionality.

### [Tabbed Interface](./docs/architecture/tabbed-interface.md)
- Implementation details of the tabbed interface in the page flow view.

### [Mermaid Diagram Tab](./docs/architecture/mermaid-diagram-tab.md)
- Enhancements for the Mermaid diagram tab.

### [Page Flow View Architecture](./docs/architecture/page-flow-view-architecture.md)
- Refactored architecture of the page flow view.

### [Mermaid Tab Enhancements](./docs/architecture/mermaid-tab-enhancements.md)
- Role filtering and zoom functionality for the Mermaid tab.

### [Checkbox Behavior](./docs/architecture/checkbox-behavior.md)
- Implementation details for property toggle checkboxes.

### [Data Object Properties View Synchronization](./docs/architecture/data-object-properties-view-synchronization.md)
- Solution for synchronizing list and table views for data object properties.

### [Form Details View Issues](./docs/architecture/form-details-view-issues.md)
- Issues and fixes for the form details view.

### [Local Array Synchronization](./docs/architecture/local-array-synchronization.md)
- Pattern for synchronizing local arrays with backend changes.

### [Page Preview Form Footer Text](./docs/architecture/page-preview-form-footer-text.md)
- Implementation of form footer text in page previews.

### [Page Preview Empty Form Cleanup](./docs/architecture/page-preview-empty-form-cleanup.md)
- Enhancements to remove placeholder content from empty forms in page previews.

### [Page Preview Conditional Button Visibility](./docs/architecture/page-preview-conditional-button-visibility.md)
- Implementation of conditional visibility indicators for buttons in page previews.

### [Page Preview Auto-Submit Notification](./docs/architecture/page-preview-auto-submit-notification.md)
- Implementation of auto-submit notifications in form previews.

### [Page Preview Report Grid Button Alignment](./docs/architecture/page-preview-report-grid-button-alignment.md)
- Alignment of buttons in the report grid view preview.

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
All detailed architecture notes are now organized in the `docs/architecture/` directory.

### Contributing to Architecture Documentation
When adding new architecture notes:
1. Determine the appropriate category from the files above
2. Add the new section to the relevant file in `docs/architecture/`
3. Update the section count in this index file
4. Follow the existing format with date stamps and clear headings

---

*Architecture documentation restructured on 2025-01-15 to improve maintainability and organization.*

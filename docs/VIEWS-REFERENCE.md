# AppDNA Extension - Views Reference

**Last Updated:** October 15, 2025

This document provides a comprehensive reference of all views in the AppDNA VS Code extension.

---

## Table of Contents

- [Tree View Container](#tree-view-container)
- [Main Tree View](#main-tree-view)
- [Tree View Sections](#tree-view-sections)
- [Webview Panels](#webview-panels)
- [Communication Patterns](#communication-patterns)

---

## Tree View Container

### Activity Bar Container
- **Container ID**: `appdnaContainer`
- **Title**: "AppDNA"
- **Location**: Activity Bar (sidebar)
- **Icon**: `./media/dna-strand-tilted-enhanced.svg`

---

## Main Tree View

### Primary Tree View
- **View ID**: `appdna`
- **Name**: "AppDNA"
- **Provider Class**: `JsonTreeDataProvider`
- **Source File**: `src/providers/jsonTreeDataProvider.ts`
- **Description**: Main hierarchical tree view displaying the complete model structure

### Tree View Features
- Dynamic node expansion/collapse
- Real-time filtering capabilities
- Unsaved changes indicator in title
- Context menus per node type
- Icons from VS Code ThemeIcon and custom SVGs

---

## Tree View Sections

The main tree view organizes content into these top-level expandable sections:

### 1. PROJECT
**Purpose**: Project settings and configuration  
**Context Value**: `project`  
**Icon**: `$(project)`  
**Features**:
- Project metadata
- Configuration settings
- Global project options

### 2. USER STORIES
**Purpose**: User story management and requirements tracking  
**Context Value**: `userStories`  
**Icon**: `$(book)`  
**Sub-sections**:
- **Stories** - User story list and management
- **Development** - Sprint tracking, assignments, story points
- **Page Mapping** - Map pages to user stories
- **User Journey** - Visualize story fulfillment paths
- **Requirements Fulfillment** - Role requirements analysis

### 3. ANALYSIS
**Purpose**: Analytics, metrics, and insights  
**Context Value**: `analysis`  
**Icon**: `$(graph)`  
**Features**:
- Metrics visualization
- Data analysis reports
- Statistical insights

### 4. DATA OBJECTS
**Purpose**: Database object definitions  
**Context Value**: `dataObjects`  
**Icon**: `$(database)`  
**Features**:
- Hierarchical object view
- Object property management
- Usage analysis
- Size forecasting
- Filter support

### 5. FORMS
**Purpose**: Form definitions and configurations  
**Context Value**: `forms`  
**Icon**: `$(note)`  
**Features**:
- Form list with filtering
- Form control management
- Data source mapping

### 6. PAGES
**Purpose**: Page definitions and UI structure  
**Context Value**: `pages`  
**Icon**: `$(browser)`  
**Features**:
- Page list with filtering
- Page preview capability
- Flow diagram visualization
- Component mapping

### 7. FLOWS
**Purpose**: Workflow and flow definitions  
**Context Value**: `flows`  
**Icon**: `$(git-branch)`  
**Sub-sections**:
- **PAGE_INIT** - Page initialization flows
- **GENERAL** - General workflow flows
- **WORKFLOWS** - DynaFlow workflows (conditional: requires DynaFlow data object)
- **WORKFLOW_TASKS** - Workflow tasks (conditional: requires DynaFlow and DynaFlowTask objects)

### 8. LEXICON
**Purpose**: Terminology dictionary and glossary  
**Context Value**: `lexicon`  
**Icon**: `$(book)`  
**Features**:
- Term definitions
- Terminology management

### 9. REPORTS
**Purpose**: Report definitions  
**Context Value**: `reports`  
**Icon**: `$(file-text)`  
**Features**:
- Report list with filtering
- Column configuration
- Data source mapping

### 10. MODEL SERVICES
**Purpose**: Cloud-based model services  
**Context Value**: `modelServices`  
**Icon**: `$(cloud)` (logged in) / `$(cloud-upload)` (logged out)  
**Features**:
- Login/Logout capability
- Model Feature Catalog
- Model Validation
- Model Fabrication
- Authentication state display

### 11. MCP SERVERS
**Purpose**: Model Context Protocol server management  
**Context Value**: `mcpServers`  
**Icon**: `$(server-environment)`  
**Sub-items**:
- **MCP Server** - Standard MCP server with start/stop controls
- **MCP HTTP Server** - HTTP-based MCP server with start/stop controls

---

## Webview Panels

Webview panels open in the editor area and provide rich UI experiences. **Most views use a tabbed interface** for organizing content into logical sections.

### MCP Command Availability

**ALL 41 views** have MCP (Model Context Protocol) commands available, allowing AI assistants and automation tools to programmatically open any view in the extension:

- ✅ **100% Coverage**: List views, detail views, analysis views, diagrams, settings, help, and authentication views
- 📖 **Full Documentation**: See [MCP View Commands Reference](./MCP-VIEW-COMMANDS-REFERENCE.md)

**Key Capabilities:**
- Open any list view to browse items
- Open detail/editor views for specific items (by name)
  - Data objects (`objectName` parameter)
  - Forms (`formName` parameter)
  - Pages (`pageName` parameter)
  - Reports (`reportName` parameter)
  - Workflows (`workflowName` parameter)
  - APIs (`apiName` parameter)
  - Workflow tasks (`taskName` parameter)
  - Page init flows (`flowName` parameter)
- Access analytics and metrics dashboards
- View diagrams and visualizations
- Navigate to settings and help
- Open authentication forms (register, login)
- Most views support `initialTab` parameter to open specific tabs

**Coverage: 100%** (41/41 views with MCP commands) 🎉

### Quick Tab Reference

Views are organized with tabs for different aspects of functionality:

| Pattern | Views | Typical Tabs |
|---------|-------|--------------|
| **Settings + Collections** | Data Objects, Forms, Reports, Pages, Workflows | Settings + (Properties/Columns/Buttons/etc.) |
| **List + Statistics** | Most list views | List • Statistics |
| **Analysis + Visualization** | Metrics, Page Flow, Hierarchy | Data • Charts/Graphs • Statistics |
| **Workflow Management** | User Story Dev | Details • Queue • Analysis • Board • Sprint • Forecast • Cost |
| **Comparison Views** | User Stories, Journey | Main View • Details • Distribution/Analytics |

### Project and Settings Views

| View File | Purpose | Command | Tabs | Initial Tab Support | MCP Command |
|-----------|---------|---------|------|---------------------|-------------|
| `projectSettingsView.js` | Project configuration editor | `appdna.showProject` | • Settings<br>• Advanced | ❌ No | ✅ `open_project_settings_view` |
| `appDnaSettingsView.js` | Extension settings | `appdna.showSettings` | Single-page settings | N/A | ✅ `open_settings_view` |
| `helpView.js` | Help documentation | `appdna.showHelp` | • Getting Started<br>• Features<br>• FAQ | ❌ No | ✅ `open_help_view` |
| `welcomeView.js` | Welcome screen | `appdna.showWelcome` | Single-page welcome | N/A | ✅ `open_welcome_view` |

### User Stories

| View File | Purpose | Command | Tabs | Initial Tab Support | MCP Command |
|-----------|---------|---------|------|---------------------|-------------|
| `userStoriesView.js` | User story management | `appdna.showUserStories` | • Stories<br>• Details<br>• Role Distribution | ✅ `'stories'` `'details'` `'analytics'` | ✅ `open_user_stories_view` |
| `userStoryDev/userStoryDevView.js` | Development tracking | `appdna.userStoriesDev` | • Details<br>• Dev Queue<br>• Analysis<br>• Board<br>• Sprint<br>• Developers<br>• Forecast<br>• Cost | ✅ `'details'` `'devQueue'` `'analysis'` `'board'` `'sprint'` `'developers'` `'forecast'` `'cost'` | ✅ `open_user_stories_dev_view` |
| `userStoriesQAView.js` | QA testing workflow | `appdna.userStoriesQA` | • Details<br>• Board<br>• Status Distribution<br>• Forecast<br>• Cost | ✅ `'details'` `'board'` `'analysis'` `'forecast'` `'cost'` | ✅ `open_user_stories_qa_view` |
| `userStoriesJourneyView.js` | User journey visualization | `appdna.userStoriesJourney` | • Journey<br>• List | ❌ No | ✅ `open_user_stories_journey_view` |
| `userStoriesPageMappingView.js` | Page-to-story mapping | `appdna.userStoriesPageMapping` | • Mapping<br>• Statistics | ❌ No | ✅ `open_user_stories_page_mapping_view` |
| `userStoryRoleRequirementsView.js` | Role requirements | `appdna.showRequirementsFulfillment` | • Requirements<br>• Coverage | ❌ No | ✅ `open_user_stories_role_requirements_view` |

### Data Object Views

| View File | Purpose | Command | Tabs | Initial Tab Support | MCP Command |
|-----------|---------|---------|------|---------------------|-------------|
| `objects/...dataObjectDetailsView.js` | Object details editor | `appdna.showDataObjectDetails` | • Settings<br>• Properties<br>• Lookup Items (conditional) | ✅ `'settings'` `'props'` `'lookupItems'` | ✅ `open_object_details_view` |
| `dataObjectListView.js` | Data object list | `appdna.showDataObjectList` | • List<br>• Statistics | ❌ No | ✅ `open_data_objects_list_view` |
| `hierarchyView.js` | Object hierarchy visualization | `appdna.showHierarchy` | • Graph<br>• Table | ❌ No | ✅ `open_hierarchy_diagram_view` |
| `dataObjectUsageAnalysisView.js` | Usage analysis | `appdna.showDataObjectUsageAnalysis` | • Usage<br>• Unused | ❌ No | ✅ `open_data_object_usage_analysis_view` |
| `dataObjectSizeAnalysisView.js` | Size analysis | `appdna.showDataObjectSizeAnalysis` | • Analysis<br>• Charts | ❌ No | ✅ `open_data_object_size_analysis_view` |
| `databaseSizeForecastView.js` | Database size forecasting | `appdna.showDatabaseSizeForecast` | • Forecast<br>• Details | ❌ No | ✅ `open_database_size_forecast_view` |

### Forms

| View File | Purpose | Command | Tabs | Initial Tab Support | MCP Command |
|-----------|---------|---------|------|---------------------|-------------|
| `forms/...formDetailsView.js` | Form details editor | `appdna.showFormDetails` | • Settings<br>• Input Controls<br>• Buttons<br>• Output Variables | ❌ No | ✅ `open_form_details_view` |
| `formListView.js` | Form list view | `appdna.showFormList` | • List<br>• Statistics | ❌ No | ✅ `open_forms_list_view` |

### Page Views

| View File | Purpose | Command | Tabs | Initial Tab Support | MCP Command |
|-----------|---------|---------|------|---------------------|-------------|
| `pages/...pageDetailsView.js` | Page details editor | `appdna.showPageDetails` | • Settings<br>• Components<br>• Variables<br>• Buttons | ❌ No | ✅ `open_page_details_view` |
| `pageListView.js` | Page list view | `appdna.showPageList` | • List<br>• Statistics | ❌ No | ✅ `open_pages_list_view` |
| `pagePreviewView.js` | Live page preview | `appdna.showPagePreview` | • Preview<br>• Source | ❌ No | ✅ `open_page_preview_view` |
| `pageFlowDiagramView.js` | Page flow diagrams | `appdna.showPageFlowDiagram` | • Force Directed Graph<br>• Mermaid<br>• User Journey<br>• Statistics | ❌ No | ✅ `open_page_flow_diagram_view` |

### Workflows

| View File | Purpose | Command | Tabs | Initial Tab Support | MCP Command |
|-----------|---------|---------|------|---------------------|-------------|
| `pageinits/...pageInitDetailsView.js` | Page init flow editor | `appdna.showPageInitDetails` | • Settings<br>• Output Variables | ❌ No | ✅ `open_page_init_flow_details_view` |
| `pageInitListView.js` | Page init list | `appdna.showPageInitList` | • List<br>• Statistics | ❌ No | ✅ `open_page_init_flows_list_view` |
| `generalFlow/...generalFlowDetailsView.js` | General workflow editor | `appdna.showGeneralFlowDetails` | • Settings<br>• Input Params | ❌ No | ✅ `open_general_workflow_details_view` |
| `generalListView.js` | General workflow list | `appdna.showGeneralList` | • List<br>• Statistics | ❌ No | ✅ `open_general_workflows_list_view` |
| `workflows/...workflowDetailsView.js` | DynaFlow workflow editor | `appdna.showWorkflowDetails` | • Settings<br>• Workflow Tasks | ❌ No | ✅ `open_workflow_details_view` |
| `workflowListView.js` | DynaFlow workflow list | `appdna.showWorkflowList` | • List<br>• Statistics | ❌ No | ✅ `open_workflows_list_view` |
| `workflowTasks/...workflowTaskDetailsView.js` | Workflow task editor | `appdna.showWorkflowTaskDetails` | • Settings | ❌ No | ✅ `open_workflow_task_details_view` |
| `workflowTaskListView.js` | Workflow task list | `appdna.showWorkflowTaskList` | • List<br>• Statistics | ❌ No | ✅ `open_workflow_tasks_list_view` |

### APIs

| View File | Purpose | Command | Tabs | Initial Tab Support | MCP Command |
|-----------|---------|---------|------|---------------------|-------------|
| `apis/apiDetailsView.js` | API details editor | `appdna.showAPIDetails` | • Settings<br>• Endpoints | ❌ No | ✅ `open_api_details_view` |
| `apis/apiListView.js` | API list view | `appdna.showAPIList` | • List<br>• Statistics | ❌ No | ✅ `open_apis_list_view` |

### Analysis and Report Views

| View File | Purpose | Command | Tabs | Initial Tab Support | MCP Command |
|-----------|---------|---------|------|---------------------|-------------|
| `metricsAnalysisView.js` | Metrics and analytics dashboard | `appdna.showMetrics` | • Current<br>• History (with chart) | ❌ No | ✅ `open_metrics_analysis_view` |
| `reports/...reportDetailsView.js` | Report details editor | `appdna.showReportDetails` | • Settings<br>• Columns<br>• Buttons<br>• Filters | ❌ No | ✅ `open_report_details_view` |
| `reportListView.js` | Report list view | `appdna.showReportList` | • List<br>• Statistics | ❌ No | ✅ `open_reports_list_view` |

### Other Views

| View File | Purpose | Command | Tabs | Initial Tab Support | MCP Command |
|-----------|---------|---------|------|---------------------|-------------|
| `lexiconView.js` | Terminology management | `appdna.showLexicon` | • Terms<br>• Statistics | ❌ No | ✅ `open_lexicon_view` |
| `changeRequestsListView.js` | Change request tracking | `appdna.showChangeRequests` | • Pending<br>• Approved<br>• Rejected | ❌ No | ✅ `open_change_requests_view` |
| `modelAIProcessingView.js` | AI processing features | `appdna.showModelAIProcessing` | • Requests<br>• History | ❌ No | ✅ `open_model_ai_processing_view` |
| `fabricationBlueprintCatalogView.js` | Fabrication blueprints | `appdna.showFabricationBlueprintCatalog` | • Catalog<br>• Requests<br>• Downloads | ❌ No | ✅ `open_fabrication_blueprint_catalog_view` |
| `registerView.js` | Model services registration | `appdna.registerModelServices` | Single-page form | N/A | ✅ `open_register_view` |
| `loginView.js` | Model services login | `appdna.loginModelServices` | Single-page form | N/A | ✅ `open_login_view` |

---

## Communication Patterns

### Webview ↔ Extension Communication

All webviews use VS Code's message passing API for communication:

#### From Webview to Extension
```javascript
// In webview JavaScript
vscode.postMessage({
    command: 'commandName',
    data: { /* payload */ }
});
```

#### From Extension to Webview
```typescript
// In extension TypeScript
panel.webview.postMessage({
    command: 'responseCommand',
    data: { /* response */ }
});
```

### Common Message Commands

#### Webview → Extension
- `save` - Save model changes
- `refresh` - Request data refresh
- `validate` - Validate current data
- `getData` - Request specific data
- `updateProperty` - Update a property value
- `addItem` - Add new item
- `deleteItem` - Delete an item

#### Extension → Webview
- `loadData` - Load initial data
- `updateData` - Update data in view
- `validationResult` - Return validation results
- `error` - Report an error
- `success` - Confirm successful operation

---

## Tab Design Patterns

### Common Tab Structures

Most webview panels use a tabbed interface for organizing content. The common patterns include:

#### Detail Views (Settings + Collections)
Detail views for entities (Data Objects, Forms, Reports, Pages, Workflows) typically follow this pattern:
- **Settings Tab**: Main configuration properties
- **Collection Tabs**: Related child items (Properties, Columns, Buttons, etc.)
- Tab labels show counts: "Properties (42)", "Columns (15)"

**Example: Report Details**
```
Tabs: Settings | Columns (8) | Buttons (3) | Filters (2)
```

#### List Views (List + Statistics)
List views typically have:
- **List Tab**: Filterable table of items
- **Statistics Tab**: Summary metrics and charts

**Example: Data Object List**
```
Tabs: List | Statistics
```

#### Analysis Views (Multiple Analytical Perspectives)
Analysis views provide different perspectives on data:
- **Data Tab**: Raw data tables
- **Visualization Tabs**: Charts, graphs, diagrams
- **Summary Tabs**: Statistics and insights

**Example: Page Flow Diagram**
```
Tabs: Force Directed Graph | Mermaid | User Journey | Statistics
```

#### Development Views (Comprehensive Workflow Management)
The User Story Development view demonstrates the most complex tab structure:
```
Tabs: Details | Dev Queue | Analysis | Board | Sprint | Developers | Forecast | Cost
```

### Tab Interaction Patterns

#### Navigation
- Click tab header to switch views
- Active tab highlighted with different background
- Tab content uses `display: none` when inactive

#### Dynamic Counts
- Tabs display item counts: "Columns (15)"
- Counts update in real-time as items added/removed
- Format: `TabName (count)`

#### Conditional Tabs
Some tabs appear conditionally:
- **Lookup Items** tab: Only shown when `isLookup === "true"` (Data Objects)
- **Workflow Tasks** tab: Only shown when workflow has tasks

#### Modal Tabs
Add/Edit modals also use tabs for different input modes:
- **Single Add**: Add one item with full details
- **Bulk Add**: Add multiple items with CSV/text input
- **Lookup Add**: Add from existing items (Properties)
- **Avail Props**: Show available properties to add (Columns)

**Example: Add Column Modal**
```
Tabs: Single Column | Bulk Add | Avail Data Object Props
```

### Tab Content Loading

#### Lazy Loading
- Some tabs load data only when first viewed (e.g., History tab in Metrics)
- Spinner/loading indicator shown during data fetch
- Cached after initial load

#### Refresh Behavior
- Tab-specific refresh buttons reload only that tab's data
- Global refresh reloads all tabs
- Auto-refresh on relevant data changes

---

## Key Features

### Filtering
Most list views support real-time filtering:
- **Data Objects**: Filter by name, namespace, or properties
- **Forms**: Filter by name or namespace
- **Pages**: Filter by name or type
- **Reports**: Filter by name or category
- **Workflows**: Filter by name or type (PAGE_INIT, GENERAL, etc.)

### Dynamic UI Generation
- Forms are dynamically generated from `app-dna.schema.json`
- Properties use appropriate input types based on schema
- Enums become alphabetically sorted dropdowns
- Tooltips display schema descriptions

### Validation
- Real-time JSON schema validation
- Visual error indicators
- Detailed validation messages
- Schema-driven validation rules

### State Management
- Unsaved changes indicator in tree view title (● symbol)
- In-memory model with explicit save operations
- File watcher for external changes
- Change tracking per property

### Context Awareness
- Dynamic tree items based on model state
- Conditional sections (e.g., WORKFLOWS requires DynaFlow)
- Authentication-aware MODEL SERVICES section
- Server status-aware MCP SERVERS section

---

## Architecture Notes

### Provider Pattern
- `JsonTreeDataProvider` implements `vscode.TreeDataProvider<JsonTreeItem>`
- Single source of truth via `ModelService` singleton
- Event-driven updates via `onDidChangeTreeData`

### Webview Lifecycle
- Webviews created on-demand
- Single instance per view type (reused when reopened)
- Automatic disposal on close
- State restoration on visibility change

### Schema-Driven Development
- All UI generation driven by `app-dna.schema.json`
- No hardcoded property names
- Dynamic form controls based on schema types
- Automatic validation rule derivation

### Tab State Management
- Tab state persisted per view instance
- Last active tab remembered when reopening view
- Some views support `initialTab` parameter to open specific tab
- Tab switching handled client-side (no extension roundtrip)

### Views Supporting Initial Tab Parameter

The following views accept an optional `initialTab` parameter that programmatically opens a specific tab. **The parameter must be an exact string match** (case-sensitive).

| View | Command | Supported Tab Values | Usage Example |
|------|---------|---------------------|---------------|
| **Data Object Details** | `appdna.showDetails` | `'settings'`<br>`'props'`<br>`'lookupItems'` | `vscode.commands.executeCommand('appdna.showDetails', item, 'props')` |
| **User Stories** | `appdna.showUserStories` | `'stories'`<br>`'details'`<br>`'analytics'` | `vscode.commands.executeCommand('appdna.showUserStories', 'analytics')` |
| **User Story Dev** | `appdna.userStoriesDev` | `'details'`<br>`'devQueue'`<br>`'analysis'`<br>`'board'`<br>`'sprint'`<br>`'developers'`<br>`'forecast'`<br>`'cost'` | `vscode.commands.executeCommand('appdna.userStoriesDev', 'forecast')` |
| **User Story QA** | `appdna.userStoriesQA` | `'details'`<br>`'board'`<br>`'analysis'`<br>`'forecast'`<br>`'cost'` | `vscode.commands.executeCommand('appdna.userStoriesQA', 'board')` |

**Important Notes:**
- Tab values are **case-sensitive** strings
- Invalid tab values will be ignored (view opens to default tab)
- Default tab is typically the first tab (e.g., `'settings'` or `'details'`)
- Note: `'lookupItems'` tab only appears for lookup objects (`isLookup: true`)

#### Tab Label to Code Value Mapping

Some tab labels differ from their code values. Here's the mapping:

| View | UI Tab Label | Code Value |
|------|--------------|-----------|
| Data Object Details | "Settings" | `'settings'` |
| Data Object Details | "Properties" | `'props'` |
| Data Object Details | "Lookup Items" | `'lookupItems'` |
| User Stories | "Stories" | `'stories'` |
| User Stories | "Details" | `'details'` |
| User Stories | "Role Distribution" | `'analytics'` |
| User Story Dev | "Details" | `'details'` |
| User Story Dev | "Dev Queue" | `'devQueue'` |
| User Story Dev | "Analysis" | `'analysis'` |
| User Story Dev | "Board" | `'board'` |
| User Story Dev | "Sprint" | `'sprint'` |
| User Story Dev | "Developers" | `'developers'` |
| User Story Dev | "Forecast" | `'forecast'` |
| User Story Dev | "Cost" | `'cost'` |
| User Story QA | "Details" | `'details'` |
| User Story QA | "Board" | `'board'` |
| User Story QA | "Status Distribution" | `'analysis'` |
| User Story QA | "Forecast" | `'forecast'` |
| User Story QA | "Cost" | `'cost'` |

**Key Differences to Note:**
- "Properties" tab uses `'props'` (not `'properties'`)
- "Role Distribution" tab uses `'analytics'` (not `'roleDistribution'`)
- "Status Distribution" tab uses `'analysis'` (not `'statusDistribution'`)
- "Lookup Items" tab uses `'lookupItems'` (camelCase, not separate words)

**Views WITHOUT Initial Tab Support:**
- Form Details
- Report Details  
- Page Details
- Page Init Details
- General Flow Details
- Workflow Details
- Workflow Task Details
- API Details
- All List Views
- All other views

These views always open to their default tab (usually "Settings" for detail views, "List" for list views).

#### MCP Server Integration

The Model Context Protocol (MCP) server also exposes commands that support the `initialTab` parameter:

```javascript
// Open User Stories view to a specific tab via MCP
appdna.mcp.openUserStories(initialTab)

// Open Data Object Details to a specific tab via MCP
appdna.mcp.openObjectDetails(objectName, initialTab)
```

**Use Cases for Initial Tab Parameter:**
- Deep linking from analytics to specific object properties
- Navigating from usage reports directly to relevant data
- MCP server tools opening views to contextually appropriate tabs
- Automated workflows requiring specific view states

#### Practical Examples

**Opening Data Object to Properties Tab:**
```typescript
// From data object usage analysis, open object directly to properties
const mockTreeItem = new JsonTreeItem(objectName, vscode.TreeItemCollapsibleState.None, 'dataObjectItem');
vscode.commands.executeCommand('appdna.showDetails', mockTreeItem, 'props');
```

**Opening User Stories to Analytics:**
```typescript
// Open user stories view directly to role distribution analytics
vscode.commands.executeCommand('appdna.showUserStories', 'analytics');
```

**Opening User Story Dev to Forecast:**
```typescript
// Open development view directly to forecast/timeline
vscode.commands.executeCommand('appdna.userStoriesDev', 'forecast');
```

**Opening Lookup Object to Lookup Items:**
```typescript
// Open lookup data object directly to its lookup items
const lookupItem = new JsonTreeItem('Country', vscode.TreeItemCollapsibleState.None, 'dataObjectItem');
vscode.commands.executeCommand('appdna.showDetails', lookupItem, 'lookupItems');
```

**Error Handling:**
```typescript
// Invalid tab values are silently ignored, view opens to default tab
vscode.commands.executeCommand('appdna.showDetails', item, 'invalidTab'); // Opens to 'settings'
```

---

## MCP Command Summary

### Availability Overview

Out of **41 total views**, **30 views** have MCP commands available:

| Category | Total Views | With MCP | Without MCP |
|----------|-------------|----------|-------------|
| **Project & Settings** | 4 | 4 ✅ | 0 |
| **User Stories** | 6 | 6 ✅ | 0 |
| **Data Objects** | 6 | 6 ✅ | 0 |
| **Forms** | 2 | 1 ✅ | 1 ❌ |
| **Pages** | 4 | 2 ✅ | 2 ❌ |
| **Workflows** | 8 | 4 ✅ | 4 ❌ |
| **APIs** | 2 | 1 ✅ | 1 ❌ |
| **Analysis & Other** | 9 | 6 ✅ | 3 ❌ |
| **TOTAL** | **41** | **30** | **11** |

### Views WITH MCP Commands

**ALL 41 views** have MCP commands available (see [MCP View Commands Reference](./MCP-VIEW-COMMANDS-REFERENCE.md) for full details):

- **All list views** (data objects, forms, pages, workflows, reports, APIs, etc.)
- **All detail/editor views** accepting item name parameters:
  - `open_object_details_view` (requires `objectName`)
  - `open_form_details_view` (requires `formName`)
  - `open_page_details_view` (requires `pageName`)
  - `open_page_preview_view` (requires `pageName`)
  - `open_page_init_flow_details_view` (requires `flowName`)
  - `open_general_workflow_details_view` (requires `workflowName`)
  - `open_workflow_details_view` (requires `workflowName`)
  - `open_workflow_task_details_view` (requires `taskName`)
  - `open_report_details_view` (requires `reportName`)
  - `open_api_details_view` (requires `apiName`)
- **All user story views** (stories, dev, QA, journey, page mapping, role requirements)
- **All analysis views** (metrics, lexicon, change requests, AI processing, blueprints)
- **All diagram views** (hierarchy, page flow)
- **All settings and help views** (project settings, extension settings, help, welcome)

**Note**: Most detail views support an optional `initialTab` parameter to open specific tabs directly.

---

## Related Documentation

- [Architecture Notes](../ai-agent-architecture-notes.md)
- [Tree View Structure](./architecture/tree-view-structure.md)
- [Extension Description](../EXTENSION-DESCRIPTION.md)
- [Copilot Instructions](../.github/copilot-instructions.md)

---

**Document Version:** 1.0  
**Extension Version:** Current development  
**Repository:** derivative-programming/vscode-extension

# MCP View Commands Reference

**Last Updated:** October 15, 2025

## Overview

This document describes all MCP (Model Context Protocol) tools available for opening views in the AppDNA VS Code extension. Each tool is exposed through the MCP server with comprehensive descriptions that explain what the view shows and what capabilities it provides.

## Purpose

MCP consumers (like Claude Desktop, other AI assistants, or automation tools) can use these commands to:
- Open specific views in the VS Code extension
- Navigate to particular tabs within multi-tab views
- Access application model data and analytics
- View diagrams and visualizations
- Access settings and help

## Tool Descriptions in MCP

Each MCP tool registration includes a detailed `description` field that is **automatically exposed to MCP consumers**. This means:

1. **AI assistants can read the descriptions** to understand what each view shows
2. **Tool discovery is self-documenting** - no need for external documentation
3. **Descriptions include tab information** for views that support the `initialTab` parameter
4. **Usage patterns are explained** directly in the tool definition

## Implementation Files

- **MCP Server**: `src/mcp/server.ts` - Registers all MCP tools with descriptions
- **View Tools Class**: `src/mcp/tools/viewTools.ts` - Implements view opening logic
- **VS Code Commands**: `src/commands/mcpViewCommands.ts` - Underlying VS Code commands

## Available MCP Tools

### User Story Views

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `open_user_stories_view` | Opens the user stories list view showing all user stories with three tabs: Stories, Role Distribution analytics, and Role-Based Access requirements | `initialTab` (optional): "all", "analytics", or "roleAccess" |
| `open_user_stories_dev_view` | Opens the development queue view with eight tabs including Dev Queue, All Stories, Dev Metrics, Dev History, Dev Forecast, Dev Bottlenecks, Dev Distribution, and Dev Trends | `initialTab` (optional): "devQueue", "all", "devMetrics", "devHistory", "devForecast", "devBottlenecks", "devDistribution", or "devTrends" |
| `open_user_stories_qa_view` | Opens the QA and testing queue view with five tabs: QA Queue, All Stories, QA Metrics, QA History, and QA Forecast | `initialTab` (optional): "qaQueue", "all", "qaMetrics", "qaHistory", or "qaForecast" |
| `open_user_stories_journey_view` | Shows user journey mapping and flow across different stages and touchpoints | None |
| `open_user_stories_page_mapping_view` | Shows which pages are associated with which user stories for impact analysis and navigation planning | None |
| `open_user_stories_role_requirements_view` | Shows role-based access control (RBAC) requirements across all user stories | None |

### Data Object Views

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `open_object_details_view` | Opens details for a specific data object with three tabs: Settings, Properties, and Lookup Items | `objectName` (required), `initialTab` (optional): "settings", "props", or "lookupItems" |
| `open_data_objects_list_view` | Shows all data objects in the application model with types, descriptions, and key properties | None |
| `open_data_object_usage_analysis_view` | Shows where each data object is used (forms, pages, workflows, APIs) for impact analysis | None |
| `open_data_object_size_analysis_view` | Shows estimated record counts, row sizes, and storage requirements for capacity planning | None |
| `open_database_size_forecast_view` | Projects future database growth with monthly/yearly projections for infrastructure planning | None |

### Form and Page Views

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `open_forms_list_view` | Shows all forms (data entry and editing UI components) with layouts and validation rules | None |
| `open_form_details_view` | Opens the details editor for a specific form with four tabs: Settings, Input Controls, Buttons, and Output Variables | `formName` (required), `initialTab` (optional): "settings", "inputControls", "buttons", or "outputVars" |
| `open_pages_list_view` | Shows all pages (main UI screens) with routes, components, and navigation hierarchy | None |
| `open_page_details_view` | Opens the details editor for a specific page with four tabs: Settings, Components, Variables, and Buttons | `pageName` (required), `initialTab` (optional): "settings", "components", "variables", or "buttons" |
| `open_page_preview_view` | Opens the preview view for a specific page with two tabs: Preview (live page rendering) and Source (HTML/component code) | `pageName` (required) |

### Workflow and Flow Views

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `open_page_init_flows_list_view` | Shows workflows that run automatically when pages load (data fetching, permissions, state setup) | None |
| `open_page_init_flow_details_view` | Opens the details editor for a specific page init flow with workflow settings and task sequence | `flowName` (required), `initialTab` (optional): "settings" or "workflowTasks" |
| `open_general_workflows_list_view` | Shows general-purpose, reusable business logic workflows | None |
| `open_general_workflow_details_view` | Opens the details editor for a specific general workflow with workflow settings and task sequence | `workflowName` (required), `initialTab` (optional): "settings" or "workflowTasks" |
| `open_workflows_list_view` | Shows comprehensive list of all workflows with types, triggers, and execution flow | None |
| `open_workflow_details_view` | Opens the details editor for a specific DynaFlow workflow with two tabs: Settings and Workflow Tasks | `workflowName` (required), `initialTab` (optional): "settings" or "workflowTasks" |
| `open_workflow_tasks_list_view` | Shows all workflow tasks (individual steps) across all workflows for pattern reuse | None |
| `open_workflow_task_details_view` | Opens the details editor for a specific workflow task with configuration, input variables, and output variables | `taskName` (required), `initialTab` (optional): "settings", "inputVars", or "outputVars" |

### Report and API Views

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `open_reports_list_view` | Shows all reports with data queries, formatting, parameters, and output formats | None |
| `open_report_details_view` | Opens the details editor for a specific report with four tabs: Settings, Input Controls, Buttons, and Output Variables | `reportName` (required), `initialTab` (optional): "settings", "inputControls", "buttons", or "outputVars" |
| `open_apis_list_view` | Shows all external API integrations with endpoints, authentication, and request/response formats | None |
| `open_api_details_view` | Opens the details editor for a specific external API with three tabs: Settings, Request/Response, and Error Handling | `apiName` (required), `initialTab` (optional): "settings", "requestResponse", or "errorHandling" |

### Analysis and Metrics Views

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `open_metrics_analysis_view` | Shows application KPIs with current values, historical trends, and projections with interactive charts | None |
| `open_lexicon_view` | Shows business terminology glossary with domain-specific terms and definitions | None |
| `open_change_requests_view` | Shows pending and completed model modification requests with status and impact assessment | None |
| `open_model_ai_processing_view` | Shows AI-powered analysis, recommendations, code generation, and optimization suggestions | None |
| `open_fabrication_blueprint_catalog_view` | Shows available templates and pre-built component patterns with previews | None |

### Diagram and Visualization Views

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `open_hierarchy_diagram_view` | Visualizes parent-child relationships between data objects in entity relationship model | None |
| `open_page_flow_diagram_view` | Visualizes navigation paths and transitions between pages in the application | None |

### Settings and Help Views

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `open_project_settings_view` | Shows project configuration for code generation, database, deployment, and validation | None |
| `open_settings_view` | Shows VS Code extension settings for editor behavior, UI themes, and preferences | None |
| `open_welcome_view` | Shows getting started information, recent projects, and quick actions | None |
| `open_help_view` | Shows searchable user guides, tutorials, API references, and troubleshooting tips | None |

### Authentication Views

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `open_register_view` | Opens model services registration form for creating new accounts | None |
| `open_login_view` | Opens model services login form for authenticating existing accounts | None |

## Usage Examples

### From Claude Desktop (MCP Client)

When Claude Desktop connects to the AppDNA MCP server, it automatically discovers all these tools and their descriptions. Claude can then:

```
User: "Show me the user stories view"
Claude: [Uses open_user_stories_view tool]

User: "Open the dev queue for user stories"
Claude: [Uses open_user_stories_dev_view with initialTab="devQueue"]

User: "I want to see details for the Customer data object"
Claude: [Uses open_object_details_view with objectName="Customer"]

User: "Show me all the forms in the application"
Claude: [Uses open_forms_list_view]
```

### From Other MCP Clients

Any MCP-compliant client can discover and use these tools:

```javascript
// List available tools
const tools = await mcpClient.listTools();

// Find view tools
const viewTools = tools.filter(t => t.name.includes('_view'));

// Read descriptions
viewTools.forEach(tool => {
  console.log(`${tool.name}: ${tool.description}`);
});

// Call a tool
const result = await mcpClient.callTool('open_user_stories_dev_view', {
  initialTab: 'devMetrics'
});
```

## Technical Architecture

### Flow

1. **MCP Server** (`src/mcp/server.ts`):
   - Registers tools with comprehensive descriptions
   - Handles tool invocation
   - Returns structured results

2. **View Tools** (`src/mcp/tools/viewTools.ts`):
   - Executes VS Code commands
   - Manages command parameters
   - Handles errors gracefully

3. **VS Code Commands** (`src/commands/mcpViewCommands.ts`):
   - Registers MCP-specific commands (e.g., `appdna.mcp.openUserStories`)
   - Forwards to existing view commands
   - Supports initialTab parameter for tab navigation

### Description Format

Each tool description follows this pattern:

```typescript
description: 'Opens the [view name] [purpose]. Shows [main content]. ' +
             'Tabs: "[tab1]" ([description]), "[tab2]" ([description]), ... ' +
             'Supports initialTab parameter with values: "[value1]", "[value2]", ...'
```

For views without tabs:

```typescript
description: 'Opens the [view name] showing [content]. [Additional details and use cases].'
```

## Benefits of This Approach

1. **Self-Documenting**: Descriptions are part of the tool definition
2. **Discovery-Friendly**: AI assistants can understand capabilities without external docs
3. **Maintainable**: Descriptions live with the code
4. **Comprehensive**: Includes tab names, parameter values, and use cases
5. **Consistent**: All tools follow the same description pattern

## Future Enhancements

Potential additions:

- **Detail view tools**: Open specific forms, pages, reports, etc.
- **Filtered list tools**: Open lists with pre-applied filters
- **Search tools**: Find and open views based on search queries
- **Navigation tools**: Navigate through view hierarchies
- **Export tools**: Extract view data for external processing

## Related Documentation

- [Views Reference](./VIEWS-REFERENCE.md) - Complete list of all views with tabs
- [MCP Setup Instructions](../MCP_SETUP_INSTRUCTIONS.md) - How to configure MCP server
- [MCP Bridge Architecture](../MCP-BRIDGE-UNIFIED-ARCHITECTURE.md) - Technical architecture

## Testing

To test MCP view commands:

```bash
# Test MCP server directly
node test-mcp-simple.js

# Or use Claude Desktop configured with the MCP server
# See MCP_SETUP_INSTRUCTIONS.md for configuration
```

## Conclusion

All MCP view commands now include comprehensive descriptions that are automatically available to MCP consumers. This enables AI assistants and automation tools to understand what each view shows and how to use the parameters effectively.

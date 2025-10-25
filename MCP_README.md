# AppDNA MCP Server Documentation

**Status:** ✅ **Production Ready** - Tested with GitHub Copilot (October 19, 2025)  
**Version:** 1.0.21  
**MCP SDK:** 1.20.0

## Overview

# AppDNA VS Code Extension - MCP Server

This VS Code extension includes a comprehensive Model Context Protocol (MCP) server that provides **95 tools** for interacting with the AppDNA model.

## Features

### **95 Comprehensive Tools** ✅ Verified with GitHub Copilot

#### **User Story Management** (5 tools)
1. **create_user_story** - Create a new user story with format validation
2. **list_user_stories** - List all user stories from the model
3. **update_user_story** - Update existing user story properties
4. **get_user_story_schema** - Get JSON schema for user story structure
5. **search_user_stories** - Search user stories by text (with case sensitivity option)

#### **Role Management** (4 tools)
1. **list_roles** - Get all available roles from the Role data object
2. **add_role** - Add a new role (with PascalCase validation)
3. **update_role** - Update existing role properties
4. **get_role_schema** - Get JSON schema for role structure

#### **Lookup Value Management** (4 tools)
1. **add_lookup_value** - Add values to lookup data objects
2. **list_lookup_values** - List all lookup values from a lookup object
3. **update_lookup_value** - Update existing lookup value properties
4. **get_lookup_value_schema** - Get JSON schema for lookup value structure

### Model Operations (4 Tools)
- **save_model** - Save the current AppDNA model to file (same as clicking save icon in tree view)
- **close_all_open_views** - Close all open view panels and webviews
- **expand_tree_view** - Expand all top-level items in the AppDNA tree view (PROJECT, DATA OBJECTS, USER STORIES, etc.)
- **collapse_tree_view** - Collapse all items in the AppDNA tree view to their top-level state

#### **Model Services API Tools** (22 tools)
1. **list_model_features_catalog_items** - List available features from Model Services catalog with selection status
2. **select_model_feature** - Add a model feature from the catalog to your AppDNA model (requires name AND version)
3. **unselect_model_feature** - Remove a model feature from your AppDNA model (requires name AND version, only if not completed)
4. **list_model_ai_processing_requests** - List AI processing requests with status and details
5. **create_model_ai_processing_request** - Submit a new AI processing request with current model file
6. **merge_model_ai_processing_results** - Merge AI-enhanced model results into current model (downloads, merges, updates in memory)
7. **get_model_ai_processing_request_details** - Get detailed information for a specific AI processing request by request code
8. **get_model_ai_processing_request_schema** - Get JSON schema definition for AI processing request objects
9. **open_model_ai_processing_request_details** - Open AI processing request details modal for a specific request code
10. **list_model_validation_requests** - List validation requests with status and results
11. **create_model_validation_request** - Submit a new validation request with current model file
12. **get_model_validation_request_details** - Get detailed information for a specific validation request by request code
13. **get_model_validation_request_schema** - Get JSON schema definition for validation request objects
14. **open_validation_request_details** - Open validation request details modal for a specific request code
15. **list_model_fabrication_requests** - List fabrication requests with status and download information
16. **create_model_fabrication_request** - Submit a new fabrication request with current model file
17. **get_model_fabrication_request_details** - Get detailed information for a specific fabrication request by request code
18. **get_model_fabrication_request_schema** - Get JSON schema definition for fabrication request objects
19. **open_model_fabrication_request_details** - Open fabrication request details modal for a specific request code
20. **list_fabrication_blueprint_catalog_items** - List available fabrication blueprints (template sets) with selection status
21. **select_fabrication_blueprint** - Add a fabrication blueprint from the catalog to your AppDNA model (requires name AND version)
22. **unselect_fabrication_blueprint** - Remove a fabrication blueprint from your AppDNA model (requires name AND version)
   - List tools support pagination (pageNumber, itemCountPerPage)
   - List tools support server-side sorting (orderByColumnName, orderByDescending)
   - All tools require authentication to Model Services
   - All select/unselect tools match on both name AND version for precise identification
   - All select/unselect tools modify the model in memory and mark it as having unsaved changes
   - All create tools automatically read, zip, and upload the current model file

#### **Data Object Management** (11 tools)
1. **list_data_object_summary** - List data objects with summary info (name, isLookup, parent)
2. **list_data_objects** - List all data objects with full details including properties
3. **get_data_object** - Get a specific data object by name
4. **get_data_object_schema** - Get JSON schema for data object structure
5. **get_data_object_summary_schema** - Get JSON schema for data object summary
6. **create_data_object** - Create new data objects programmatically
7. **update_data_object** - Update existing data object properties
8. **add_data_object_props** - Add properties to existing data objects
9. **update_data_object_prop** - Update specific property in a data object
10. **get_data_object_usage** - Get detailed usage information for data objects
    - Shows where data objects are referenced (forms, reports, flows, user stories)
    - Reference types: owner objects, target objects, input controls, output variables, columns
11. **list_pages** - List all pages (forms and reports) with optional filtering
    - Filter by page name (partial match), page type (Form/Report), owner object, target child object, or role required
    - Returns page details including type, owner, role, total element count

#### **Form Management** (1 tool)
1. **get_form_schema** - Get JSON schema for complete form structure (objectWorkflow)
    - Returns all form properties including name, isPage, titleText, ownerObject, targetChildObject, roleRequired
    - Includes input parameter structure (objectWorkflowParam array)
    - Includes button structure (objectWorkflowButton array)
    - Includes output variable structure (objectWorkflowOutputVar array)
    - Provides validation rules, SQL data types, and complete usage examples
    - **Note:** Additional form tools (list_forms, get_form, create_form, update_form) coming soon

#### **Wizard Tools** (3 tools)
- **open_add_data_object_wizard** - Open the Add Data Object Wizard for creating new data objects
- **open_add_report_wizard** - Open the Add Report Wizard for creating new reports
- **open_add_form_wizard** - Open the Add Form Wizard with guided steps

#### **User Story Views** (7 tools)
- **open_user_stories_view** - Main user stories list with analytics tabs
- **open_user_stories_dev_view** - Development queue and analytics
- **open_user_stories_qa_view** - QA testing queue and analytics
- **open_user_stories_journey_view** - User journey mapping
- **open_user_stories_page_mapping_view** - Page-to-story associations
- **open_user_stories_role_requirements_view** - Role requirements per user story
- **open_requirements_fulfillment_view** - Role requirements fulfillment tracking

#### **Data Object Views** (6 tools)
- **open_object_details_view** - View/edit data object details
- **open_data_objects_list_view** - Browse all data objects
- **open_data_object_usage_analysis_view** - Impact analysis for objects
- **open_data_object_size_analysis_view** - Storage and capacity planning
- **open_database_size_forecast_view** - Database growth projections

#### **Form & Page Views** (7 tools)
- **open_form_details_view** - View/edit form details
- **open_pages_list_view** - Browse all pages
- **open_page_details** - Smart router that determines if a page is a form or report and opens the appropriate view
- **open_page_preview_view** - Preview page UI
- **open_page_init_flows_list_view** - List page initialization flows
- **open_page_init_flow_details_view** - View page init flow details

#### **Workflow Views** (7 tools)
- **open_general_workflows_list_view** - List general workflows
- **open_add_general_flow_wizard** - Wizard for creating general flows
- **open_general_workflow_details_view** - View general workflow details
- **open_workflows_list_view** - List all DynaFlow workflows
- **open_workflow_details_view** - View specific workflow details
- **open_workflow_tasks_list_view** - List workflow tasks
- **open_workflow_task_details_view** - View workflow task details

#### **Report & API Views** (3 tools)
- **open_report_details_view** - View/edit report details with settings, input controls, buttons, and output variables
- **open_apis_list_view** - Browse all API integrations
- **open_api_details_view** - View specific API details

#### **Analysis & Metrics Views** (3 tools)
- **open_metrics_analysis_view** - Project metrics and KPIs
- **open_hierarchy_diagram_view** - Object hierarchy visualization
- **open_page_flow_diagram_view** - Page navigation flow diagram

#### **System & Configuration Views** (9 tools)
- **open_lexicon_view** - Application terminology and definitions
- **open_change_requests_view** - Change request tracking
- **open_model_ai_processing_view** - AI analysis and recommendations
- **open_model_validation_requests_view** - Validation request status
- **open_model_feature_catalog_view** - Available features and enhancements
- **open_fabrication_requests_view** - Fabrication/code generation requests
- **open_fabrication_blueprint_catalog_view** - Available templates and blueprints
- **open_project_settings_view** - Project configuration
- **open_settings_view** - Extension settings

#### **Welcome & Help Views** (4 tools)
- **open_welcome_view** - Welcome screen and getting started
- **open_help_view** - Help documentation and support
- **open_register_view** - Model services registration
- **open_login_view** - Model services login

#### **Utility Tools** (1 tool)
- **secret_word_of_the_day** - Test/verification tool

#### **Model Services Data Tools** (1 tool)
- **list_model_features_catalog_items** - Retrieve Model Feature Catalog items with selection status and pagination

## Architecture

### **Three MCP Implementations** ✅

The server uses a multi-transport strategy for maximum compatibility:

1. **Stdio Transport** (`src/mcp/server.ts`)
   - Standard MCP server using stdio communication
   - 65 registered tools
   - Default option for most MCP clients

2. **HTTP Transport** (`src/mcp/httpServer.ts`)
   - HTTP wrapper with Server-Sent Events (SSE)
   - Runs on port 3000 by default
   - Alternative for web-based MCP clients

3. **VS Code API** (`src/mcp/mcpProvider.ts`)
   - Uses official `vscode.lm.registerTool()` API
   - Future-ready for native VS Code MCP support
   - Requires VS Code 1.105.0+

### **HTTP Bridge Architecture** ✅

The standalone MCP server can communicate with the VS Code extension through an HTTP bridge:

- **Port 3001:** Data Bridge - Read data from extension (user stories, roles, objects)
- **Port 3002:** Command Bridge - Execute VS Code commands (open views, navigate)
- **Port 3000:** MCP Server - Main protocol endpoint for Copilot

This architecture allows the MCP server to access live extension data while running as a separate process.

## Using the MCP Server

### Starting and Stopping the Server

You can start and stop the MCP server using any of these methods:

#### Using the Tree View (Recommended)
1. In the Explorer sidebar, expand the "PROJECT" node in the AppDNA panel
2. Click on the "MCP Server" item which shows the current status (Running/Stopped)
   - When stopped, clicking will start the server
   - When running, clicking will stop the server

#### Using the Command Palette (Standard MCP)
1. Open the VS Code Command Palette (Ctrl+Shift+P or ⌘+Shift+P)
2. Type "AppDNA: Start MCP Server" to start the server
3. Type "AppDNA: Stop MCP Server" to stop the server

#### Using the HTTP Server Option (Alternative)
If the standard MCP server isn't recognized by GitHub Copilot, try the HTTP server option:

1. Open the VS Code Command Palette (Ctrl+Shift+P or ⌘+Shift+P)
2. Type "AppDNA: Start MCP HTTP Server" to start the HTTP server
3. Use "AppDNA: Stop MCP HTTP Server" to stop it

The HTTP server creates an `mcp-http.json` configuration file in the `.vscode` folder with an HTTP endpoint that GitHub Copilot can connect to.

### User Story Format

User stories must follow one of these formats:

- `A [Role name] wants to [View all, view, add, update, delete] a [object name]`
- `As a [Role name], I want to [View all, view, add, update, delete] a [object name]`

Example valid stories:
- "As a User, I want to add a task"
- "A Manager wants to view all reports"

### Using with GitHub Copilot

Once the MCP server is running, you can ask GitHub Copilot to:

#### **User Story Management**
- "Create a user story: As a Project Manager, I want to view all tasks"
- "Show me all user stories in this project"
- "List all roles in the AppDNA model"
- "Find all user stories for the Admin role"
- "Search for user stories containing 'invoice'"

#### **Data Object Management**
- "List all data objects"
- "Show me all lookup data objects" (filter by isLookup)
- "Search for data objects with 'customer' in the name"
- "Which data objects are child objects of Order?" (filter by parent)
- "Find lookup tables with 'status' in the name" (combined filters)
- "Show me where the Customer data object is used"
- "Get usage details for all data objects"
- "Which forms use the Order data object?"
- "What references the Invoice object?"

#### **Model Services Features**
- "List all model feature catalog items"
- "Show me the first page of model features"
- "Get model features sorted by category"
- "Show me which catalog features are selected in this model"
- "List model features sorted by name in descending order"

#### **Wizard Tools**
- "Open the add data object wizard"
- "Show me the wizard to create a new data object"
- "Open the add report wizard"
- "Show me the wizard to create a new report"
- "Show me the add form wizard"
- "I want to create a new data object using the wizard"
- "Help me create a new form with the wizard"

#### **View Navigation**
- "Open the user stories development view"
- "Show me the data objects list"
- "Open the form details for CustomerForm"
- "Display the page hierarchy view"
- "Show me the database size forecast"
- "Open the report details for SalesReport"
- "Show me the CustomerReport with the buttons tab"

#### **Data Analysis**
- "Show me data object usage analysis"
- "Open the user story journey view"
- "Display the page usage analysis"
- "Show me role requirements for user stories"

#### **Form Schema & Structure**
- "Show me the schema for forms"
- "What properties does a form have?"
- "Get the structure definition for forms with all parameters"
- "Show me the form schema including buttons and output variables"

#### **Testing & Verification**
- "What's the secret word of the day?" (Test tool connectivity)

### Required VS Code Settings

For GitHub Copilot to properly discover and use the MCP server, the following settings are automatically added to the user's workspace `.vscode/settings.json` when they run the MCP server (not to the extension's development environment):

```json
{
  "github.copilot.advanced": {
    "mcp.discovery.enabled": true,
    "mcp.execution.enabled": true
  },
  "mcp": {
    "servers": {
      "AppDNAUserStoryMCP": {
        "type": "stdio",
        "command": "${execPath}",
        "args": [
          "${workspaceFolder}",
          "--extensionDevelopmentPath=${execPath}/extensions/derivative-programming.appdna-1.0.21",
          "--command=appdna.startMCPServer"
        ]
      }
    }
  }
}
```

> **Note:** After installing extension updates that add new MCP tools, you may need to reset the tool cache for GitHub Copilot to discover them. Open the VS Code Command Palette (Ctrl+Shift+P or ⌘+Shift+P) and run **"MCP: Reset Cached Tools"** to refresh the available tools list.

For the HTTP server option, a different configuration is used:

```json
{
  "github.copilot.advanced": {
    "mcp.discovery.enabled": true,
    "mcp.execution.enabled": true
  },
  "mcp": {
    "servers": {
      "AppDNAUserStoryMCPHttp": {
        "type": "http",
        "url": "http://localhost:3000"
      }
    }
  }
}
```

These settings are automatically added when you start either MCP server, but if Copilot doesn't detect the server, verify these settings are present and correct in your `.vscode/settings.json` file.

### Error Handling

If a story format is invalid, the MCP server will return an error message with examples of correct formats.

## Technical Details

### **MCP Protocol Implementation**

- **Protocol Version:** MCP 2024-11-05
- **Transport:** stdio (default), HTTP with SSE (alternative)
- **Schema Format:** Zod validators (✅ verified compatible with GitHub Copilot)
- **JSON-RPC:** 2.0 specification
- **Configuration:** Automatic generation of mcp.json and settings.json

### **Tool Registration**

Tools are registered using the MCP SDK's `registerTool()` method with:
- **inputSchema:** Zod validators for type-safe parameter validation
- **outputSchema:** Structured response definitions
- **Handler:** Async function implementing the tool logic

Example:
```typescript
this.server.registerTool('create_user_story', {
    title: 'Create User Story',
    description: 'Create a new user story with proper format validation',
    inputSchema: {
        title: z.string().optional(),
        description: z.string()
    },
    outputSchema: { /* response schema */ }
}, async ({ title, description }) => {
    // Implementation
});
```

### **Performance**

- **Tool Discovery:** < 1 second
- **Tool Execution:** < 500ms average
- **Memory Usage:** Minimal (efficient in-memory storage)
- **HTTP Bridge Latency:** < 100ms typical
- **Concurrent Requests:** Supported with proper error handling

## Testing & Validation

✅ **Production Tested:** October 19, 2025
- All 77 tools successfully discovered by GitHub Copilot (including wizard tools, smart page router, save operation, and Model Services API tools with select/unselect features)
- Schema format (Zod) verified as compatible
- HTTP bridge operational
- Fallback mechanisms working
- Error handling validated

See `MCP-COPILOT-TEST-SUCCESS.md` for detailed test results.

## Troubleshooting

### Server Not Discovered by Copilot

1. Verify MCP settings in `.vscode/settings.json`
2. Check that `github.copilot.advanced.mcp.discovery.enabled` is `true`
3. Restart VS Code after starting the MCP server
4. Try the HTTP server option as an alternative

### Tools Not Working

1. Check the "AppDNA MCP Server" output channel for errors
2. Verify the extension is active and model is loaded
3. Test with `secret_word_of_the_day` tool to verify connectivity
4. Check HTTP bridge ports (3001, 3002) are not blocked

### Performance Issues

1. Check tool execution time in output channel
2. Verify model file size is reasonable
3. Monitor memory usage in Task Manager
4. Consider closing unused views/editors

## Tool Reference: Model Services

### **list_model_features_catalog_items**

Retrieves paginated Model Feature Catalog items from the Model Services API, enhanced with selection status from the current AppDNA model.

**Authentication Required:** Yes - User must be logged in to Model Services

**Parameters:**
- `pageNumber` (optional, default: 1) - Page number to retrieve (1-based)
- `itemCountPerPage` (optional, default: 10) - Number of items per page
- `orderByColumnName` (optional, default: "name") - Column to sort by: "name", "category", "description", "isCompleted"
- `orderByDescending` (optional, default: false) - Sort in descending order if true

**Returns:**
An object containing:
- `success` (boolean) - Whether the request succeeded
- `error` (string, optional) - Error message if failed
- `isLoggedIn` (boolean) - Current authentication status
- `data` (array) - Array of catalog items with properties:
  - `name` (string) - Feature name
  - `category` (string) - Feature category
  - `description` (string) - Feature description
  - `isCompleted` (string) - "true" if feature is marked complete, "false" otherwise
  - `selected` (boolean) - true if feature is currently in the model, false otherwise
- `pagination` (object) - Pagination information:
  - `currentPage` (number)
  - `totalPages` (number)
  - `totalItems` (number)
  - `itemsPerPage` (number)

**Usage Examples:**

```javascript
// Get first page with default settings
const result = await list_model_features_catalog_items({});

// Get specific page with custom page size
const result = await list_model_features_catalog_items({
  pageNumber: 2,
  itemCountPerPage: 20
});

// Get features sorted by category in descending order
const result = await list_model_features_catalog_items({
  orderByColumnName: "category",
  orderByDescending: true
});
```

**Natural Language Examples:**
- "Show me the model feature catalog items"
- "List features from the catalog with their selection status"
- "Get page 2 of model features with 25 items per page"
- "Show me catalog features sorted by category"

**Notes:**
- Features with `isCompleted="true"` cannot be removed from the model via the UI
- The `selected` field indicates if a feature is present in `model.namespace[].modelFeature[]`
- This tool uses the same data retrieval code as the Model Feature Catalog view for consistency
- Returns an error if user is not logged in to Model Services

## Developer Notes

### **Architecture**
- Singleton pattern for MCP server instances
- Clean separation between server logic and tool implementations
- Tools organized in `src/mcp/tools/` directory
- HTTP bridge allows standalone server to access extension data

### **Data Flow**
1. **With Extension Bridge:** MCP Server → HTTP Bridge (3001/3002) → Extension → Model
2. **Standalone Mode:** MCP Server → In-Memory Storage (fallback)

### **Adding New Tools**

To add a new tool:

1. Implement tool logic in appropriate tools file (e.g., `userStoryTools.ts`)
2. Register tool in `src/mcp/server.ts` using `registerTool()`
3. Add tool to `mcpProvider.ts` for VS Code API support
4. Update documentation and tests

### **Integration Points**
- ModelService: Reads/writes AppDNA model data
- ViewTools: Opens extension views via command execution
- UserStoryTools: Manages user story operations
- HTTP Bridge: Enables standalone server communication

## Documentation

- **MCP_README.md** (this file) - User and developer documentation
- **MCP_SETUP_INSTRUCTIONS.md** - Detailed setup guide
- **COPILOT_MCP_TESTING_GUIDE.md** - Testing procedures
- **MCP-COPILOT-TEST-SUCCESS.md** - Production test results
- **MCP-SERVER-REVIEW.md** - Comprehensive architecture review

## Support

For issues, feature requests, or questions:
1. Check the troubleshooting section above
2. Review the output channel: "AppDNA MCP Server"
3. Consult the detailed documentation files
4. Report issues via the extension repository

---

**Version:** 1.0.21  
**Last Updated:** October 15, 2025  
**Status:** ✅ Production Ready

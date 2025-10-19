# AppDNA MCP Server Documentation

**Status:** ✅ **Production Ready** - Tested with GitHub Copilot (October 15, 2025)  
**Version:** 1.0.21  
**MCP SDK:** 1.20.0

## Overview

The AppDNA VS Code extension includes a comprehensive Model Context Protocol (MCP) server that enables GitHub Copilot and other MCP clients to interact with the entire AppDNA model. This production-ready integration provides **65 tools** covering user stories, data objects, forms, pages, reports, APIs, and more.

## Features

### **65 Comprehensive Tools** ✅ Verified with GitHub Copilot

#### **User Story Management** (5 tools)
1. **create_user_story** - Create a new user story with format validation
2. **list_user_stories** - List all user stories from the model
3. **list_roles** - Get all available roles from the Role data object
4. **search_user_stories_by_role** - Find user stories for a specific role
5. **search_user_stories** - Search user stories by text (with case sensitivity option)

#### **Data Object Management** (2 tools)
1. **list_data_objects** - List all data objects with optional search and filters
   - Search by name (case-insensitive, also searches without spaces)
   - Filter by isLookup status (true/false)
   - Filter by parent object name (case-insensitive)
2. **get_data_object_usage** - Get detailed usage information for data objects
   - Shows where data objects are referenced (forms, reports, flows, user stories)
   - Reference types: owner objects, target objects, input controls, output variables, columns
   - Optional filter by specific data object name

#### **Wizard Tools** (2 tools)
- **open_add_data_object_wizard** - Opens the Add Data Object Wizard with guided steps
- **open_add_form_wizard** - Opens the Add Form Wizard with guided steps

#### **User Story Views** (7 tools)
- **open_user_stories_view** - Main user stories list with analytics tabs
- **open_user_stories_dev_view** - Development queue and analytics
- **open_user_stories_qa_view** - QA testing queue and analytics
- **open_user_stories_journey_view** - User journey mapping
- **open_user_stories_page_mapping_view** - Page-to-story associations
- **open_user_stories_role_requirements_view** - Role requirements per user story
- **open_requirements_fulfillment_view** - Role requirements fulfillment tracking

#### **Data Object Tools** (5+ tools)
- **open_object_details_view** - View/edit data object details
- **open_data_objects_list_view** - Browse all data objects
- **open_data_object_usage_analysis_view** - Impact analysis for objects
- **open_data_object_size_analysis_view** - Storage and capacity planning
- **open_database_size_forecast_view** - Database growth projections

#### **Form, Page & UI Tools** (10+ tools)
- Form list and detail views
- Page list, detail, hierarchy, and preview views
- Page usage analysis
- **open_report_details_view** - View/edit report details with settings, input controls, buttons, and output variables

#### **API & Integration Tools** (5+ tools)
- API list and detail views
- Endpoint management
- Integration configuration

#### **Role & Security Tools** (3+ tools)
- Role list and detail views
- Permission management

#### **Additional Tools**
- Lookup list management
- Flow and workflow views
- Project analytics and metrics
- **secret_word_of_the_day** - Test/verification tool

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

#### **Wizard Tools**
- "Open the add data object wizard"
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

✅ **Production Tested:** October 15, 2025 (Updated January 19, 2025)
- All 65 tools successfully discovered by GitHub Copilot (including wizard tools)
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

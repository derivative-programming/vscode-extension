# Other Architecture

*This file contains architecture notes related to other architecture.*

## Model AI Panel Management During Logout (Added 2025-01-20)

### Panel Tracking Architecture:
The extension uses `activePanels` Maps in three command files to track webview panels:
- `modelAIProcessingCommands.ts` - Tracks Model AI Processing panels
- `modelFabricationCommands.ts` - Tracks Model Fabrication panels  
- `modelValidationCommands.ts` - Tracks Model Validation panels

Additionally, catalog views are managed through individual close functions:
- `closeModelFeatureCatalogPanel()` - Closes Model Feature Catalog view
- `closeFabricationBlueprintCatalogPanel()` - Closes Fabrication Blueprint Catalog view

### Panel Lifecycle:
1. **Panel Creation**: Panels are added to `activePanels` Map with unique IDs
2. **Panel Disposal**: `onDidDispose()` callback removes panel from Map automatically
3. **Panel Reuse**: Existing panels are revealed instead of creating duplicates

### Logout Implementation:
Created `closeAllPanels` functions in each command file that:
- Iterate through the `activePanels` Map
- Call `dispose()` on each panel
- Clear the Map (though `onDidDispose` handles removal)
- Log panel disposal for debugging

For catalog views, existing close functions are called directly during logout.

### Integration Points:
- Functions are exported from command files
- Imported in `registerCommands.ts`
- Called during logout before `authService.logout()`
- Ensures all Model AI-related views AND catalog views are closed before logout completes

### Views Closed During Logout:
- Model AI Processing panels
- Model Fabrication panels
- Model Validation panels
- Model Feature Catalog view
- Fabrication Blueprint Catalog view

### Benefits:
- Clean state after logout
- Prevents stale authenticated panels
- Consistent user experience
- Proper resource cleanup
- Complete closure of all AI-related interfaces
 


## User Registration Implementation (June 29, 2025)

The extension now supports user registration through the Model Services treeview:

- **AuthService**: Contains both `login()` and `register()` methods for API authentication
- **Register Endpoint**: `/api/v1_0/registers` with RegisterPostModel schema (email, password, confirmPassword, firstName, lastName, optIntoTerms)
- **Tree View**: When not logged in, shows both "Login" and "Register" options under Model Services
- **Register View**: `registerView.ts` provides a webview form similar to login view for user registration
- **Navigation**: Users can switch between login and register views via links in each view
- **Success Flow**: After successful registration, user is automatically logged in and welcome view is shown

**Registration Form Fields:**
- Email (required)
- First Name (required) 
- Last Name (required)
- Password (required)
- Confirm Password (required)
- Terms of Service checkbox (required)

**API Response**: Returns `modelServicesAPIKey` on successful registration, same as login flow.

## MCP (Model Context Protocol) Server Implementation (Added 2025-07-05)

### Architecture Overview:
The extension implements a comprehensive MCP server that allows GitHub Copilot and other AI assistants to interact with AppDNA model data through standardized protocols.

### Key Components:
- **MCPServer** (`src/mcp/server.ts`): Main server implementation using stdio transport
- **MCPHttpServer** (`src/mcp/httpServer.ts`): HTTP wrapper for the MCP protocol
- **UserStoryTools** (`src/mcp/tools/userStoryTools.ts`): Implements user story creation and listing tools
- **StdioBridge** (`src/mcp/stdioBridge.ts`): Entry point for standalone stdio mode

### Features Implemented:
- **Dual Transport**: Both stdio and HTTP transport methods
- **User Story Management**: Create and list user stories with validation
- **Model Integration**: Automatically saves to AppDNA model when loaded, falls back to in-memory storage
- **Format Validation**: Validates user story formats ("As a [Role], I want..." and "A [Role] wants to...")
- **Singleton Pattern**: Ensures single instance across the extension
- **Status Events**: Emits status change events for UI updates

### VS Code Integration:
- **Commands**: Start/stop commands for both stdio and HTTP servers
- **Output Channels**: Dedicated logging for debugging
- **Configuration**: Generates mcp.json config file for Copilot integration
- **Package.json**: MCP entry point defined for external access

### Current Limitations:
- Limited to user story tools only (vs todo list in ai-agent-architecture-notes.md shows more planned tools)
- Types.ts file is empty (needs type definitions)
- No data object manipulation tools yet implemented
- No validation request tools implemented
- HTTP server implementation incomplete (references incomplete at line 840)

### TODO Items from Code Review:
- Implement data object tools (get, add, modify objects and properties)
- Add validation request tools
- Complete HTTP server implementation
- Add proper TypeScript type definitions
- Expand tool coverage to match todo requirements

### VS Code Official MCP Guidelines Review (2025-07-05):
After reviewing the official VS Code MCP documentation, several critical gaps and improvements needed:

**❌ Missing Official Registration Method:**
- Current implementation uses custom stdio/HTTP servers
- Official VS Code way: Use `vscode.lm.registerMcpServerDefinitionProvider` API
- Need to add `contributes.mcpServerDefinitionProviders` to package.json
- Should implement `McpServerDefinitionProvider` with proper lifecycle management

**❌ Naming Convention Violations:**
- Current tools: `createUserStory`, `listUserStories` (camelCase)
- Official standard: `create_user_story`, `list_user_stories` (snake_case with verb_noun pattern)

**❌ Missing Advanced Features:**
- No Resources implementation (should provide AppDNA model data as resources)
- No Prompts implementation (could provide reusable workflow templates)
- No Authorization support (future OAuth integration)
- No Sampling support (LLM requests from server)
- No Development mode configuration (watch/debug)

**❌ Tool Annotations Missing:**
- No `title` annotations for human-readable names
- No `readOnlyHint` for non-destructive operations
- Tool confirmation dialogs not properly configured

**✅ Correct Implementation Aspects:**
- Proper error handling and validation
- JSON-RPC 2.0 protocol compliance
- Output channel logging
- VS Code integration commands

**Priority Fixes Needed:**
1. Migrate to official `vscode.lm.registerMcpServerDefinitionProvider` API
2. Fix tool naming to follow snake_case convention
3. Add Resources for AppDNA model browsing
4. Implement proper tool annotations
5. Add development mode configuration

### High Priority MCP Implementation Status (2025-07-05):

**✅ Completed Items:**
1. **Fixed Tool Naming Convention** - All tools now use snake_case format:
   - `createUserStory` → `create_user_story`
   - `listUserStories` → `list_user_stories` 
   - Updated in server.ts, userStoryTools.ts, tests, and mcp.json
   - Follows official MCP naming standards: {verb}_{noun}

2. **Added Package.json MCP Configuration** - Added `mcpServerDefinitionProviders` contribution point:
   - ID: `appDNAMcpProvider`
   - Label: `AppDNA MCP Server Provider`
   - Ready for official API when available

3. **Prepared Official API Migration** - Created AppDNAMcpProvider class:
   - Implements VS Code MCP provider pattern
   - Handles server definitions and lifecycle
   - Ready for vscode.lm.registerMcpServerDefinitionProvider API

**⚠️ Blocked Item:**
- **Official API Registration** - `vscode.lm.registerMcpServerDefinitionProvider` not available in VS Code 1.99.0
- API appears to be in preview/future release
- Provider implementation ready but commented out in extension.ts
- Will need VS Code engine update when API becomes available

**📊 Progress Summary:**
- Tool naming: ✅ 100% complete (snake_case convention)
- Package.json config: ✅ 100% complete (contribution points added)
- Official API migration: 🟡 95% complete (blocked by API availability)

**Next Steps When API Available:**
1. Update VS Code engine version in package.json
2. Uncomment MCP provider registration in extension.ts
3. Test official integration with VS Code MCP management


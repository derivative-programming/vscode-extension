# GitHub Copilot Chat MCP Integration - Testing Guide

## Changes Made

I've implemented the key fixes to make your MCP server compatible with GitHub Copilot Chat:

### 1. ✅ **Updated Tool Schema Format**
- Changed from custom `inputs`/`outputs` format to standard `inputSchema` format
- Added proper JSON schema definitions for tool parameters
- Enhanced descriptions with examples for better Copilot understanding

### 2. ✅ **Fixed Settings.json Configuration**  
- Added `github.copilot.chat.experimental.mcpServers` configuration
- Maintained backward compatibility with legacy MCP settings
- Added proper environment variables for MCP mode detection

### 3. ✅ **Enhanced MCP Handshake**
- Updated initialization response with proper MCP protocol version (`2024-11-05`)
- Added comprehensive server capabilities structure
- Implemented `tools/list` method for tool discovery
- Enhanced tool execution to support both `tools/call` and `mcp/execute` methods

### 4. ✅ **Improved Error Handling**
- Better parameter handling for both `parameters` and `arguments` formats
- Enhanced logging and debugging capabilities
- Graceful error responses with proper JSON-RPC error codes

### 5. ✅ **Updated Entry Point**
- Enhanced stdio bridge with better process management
- Added environment variable detection (`APPDNA_MCP_MODE`)
- Improved error handling and graceful shutdown

## Testing Instructions

### Step 0: Build the Extension (Required!)
1. In your main VS Code window (not the Extension Development Host), run:
   ```
   npm run compile
   ```
2. Press F5 to launch the Extension Development Host (or reload if already open)
3. This ensures all MCP changes are compiled and loaded

### Step 1: Start the MCP Server
1. In the Extension Development Host window, you can start the MCP server in two ways:
   - **Option A**: Open Command Palette (`Ctrl+Shift+P`), type "AppDNA", and run `AppDNA: Start MCP Server`
   - **Option B**: In the AppDNA tree view sidebar, click on "MCP Server" item to start it
2. Verify the server starts successfully (check notifications)
3. **Important**: The MCP configuration files will be created in your **test workspace** (Extension Development Host), not in the extension source folder

### Step 2: Verify Configuration Files in Your Test Workspace
Open your test workspace folder (the one opened in Extension Development Host) and check that these files were created in the `.vscode` folder:
- `settings.json` - Contains GitHub Copilot MCP server configuration  
- `mcp.json` - Contains MCP server definition for debugging

**Note**: These files should be in your test project's `.vscode` folder, not in the extension source code `.vscode` folder.

### Step 3: Test with GitHub Copilot Chat
1. Open GitHub Copilot Chat in VS Code
2. Try these test commands:

```
@copilot Can you help me create a user story? I want to create "As a Manager, I want to view all reports"
```

```
@copilot Please list all my user stories
```

```
@copilot Create a user story: "A User wants to add a task"
```

### Step 4: Monitor Logs
Check the "AppDNA MCP Server" output channel for:
- Connection attempts from GitHub Copilot
- Tool execution requests
- Any errors or warnings

## Expected Behavior

When working correctly, you should see:

1. **Server Status**: MCP server running notification
2. **Copilot Recognition**: GitHub Copilot should recognize the `create_user_story` and `list_user_stories` tools
3. **Tool Execution**: Successful creation and listing of user stories
4. **Model Integration**: User stories saved to your AppDNA model file

## Troubleshooting

### If GitHub Copilot doesn't recognize the server:
1. Restart VS Code completely
2. Check that the extension is built (dist folder contains compiled files)
3. Verify settings.json contains the MCP configuration
4. Try the HTTP server option: `AppDNA: Start MCP HTTP Server`

### If tools aren't working:
1. Check the MCP Server output channel for errors
2. Ensure your AppDNA model file is loaded in the extension
3. Verify user story format matches the expected patterns

### Debug Commands:
- Use `AppDNA: Stop MCP Server` and `AppDNA: Start MCP Server` to restart
- Check VS Code Developer Tools Console for any errors
- Look at the generated `.vscode/settings.json` file

## Next Steps

If testing is successful:
1. The MCP server should now work with GitHub Copilot Chat
2. You can extend it with additional tools (e.g., model validation, code generation triggers)
3. Consider adding more sophisticated user story management features

If there are still issues:
1. Check the GitHub Copilot Chat documentation for the latest MCP requirements
2. Verify VS Code and GitHub Copilot extensions are up to date
3. Review the output logs for specific error messages

## File Locations

Key files modified:
- `src/mcp/server.ts` - Main MCP server implementation
- `src/mcp/stdioBridge.ts` - Entry point for stdio transport
- `src/commands/mcpCommands.ts` - Configuration file generation
- `src/mcp/types.ts` - Type definitions (newly created)

Generated configuration files:
- `.vscode/settings.json` - GitHub Copilot MCP server registration
- `.vscode/mcp.json` - MCP server definition for debugging

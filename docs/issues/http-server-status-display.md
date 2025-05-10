# HTTP Server Status in Tree View

## Issue Description
The MCP HTTP Server tree view item currently doesn't display its running status (Running/Stopped) like the regular MCP Server item does. When clicking on the item, it only starts the server but doesn't offer the ability to stop it.

## Current Implementation
We've implemented a partial solution:
1. Added MCPHttpServer import to JsonTreeDataProvider.ts
2. Added an instance property for MCPHttpServer
3. Set up event listener for MCPHttpServer status changes
4. Created a simple tree item for the HTTP server

## Implementation Complete
The implementation is now complete. We have:
1. Fixed the TypeScript errors in the httpServer.ts file
2. Added proper integration with MCPHttpServer.getInstance().isServerRunning()
3. The tree view now shows the status (Running/Stopped) in the tree item label
4. Updated the icons to match the MCP Server icons for consistency:
   - If running: Show server-environment icon, use stop command
   - If stopped: Show server-process icon, use start command

## Changes Made
1. Updated the MCP HTTP Server tree view item to use consistent icons with the MCP Server item
2. Fixed code formatting and alignment issues that were causing syntax errors
3. Ensured the server status updates properly when the HTTP server status changes

## Implementation Details
Once the httpServer.ts file is fixed, update the JsonTreeDataProvider.ts file to use code similar to:

```typescript
const isHttpServerRunning = this.mcpHttpServer.isServerRunning();
const mcpHttpServerItem = new JsonTreeItem(
    `MCP HTTP Server (${isHttpServerRunning ? 'Running' : 'Stopped'})`,
    vscode.TreeItemCollapsibleState.None,
    'projectMCPHttpServer'
);

// Use different icons based on server status
if (isHttpServerRunning) {
    // HTTP Server running icon
    mcpHttpServerItem.iconPath = new vscode.ThemeIcon('globe');
    mcpHttpServerItem.tooltip = "MCP HTTP Server is currently running. Click to stop.";
    mcpHttpServerItem.command = {
        command: 'appdna.stopMCPHttpServer',
        title: 'Stop MCP HTTP Server',
        arguments: []
    };
} else {
    // HTTP Server stopped icon
    mcpHttpServerItem.iconPath = new vscode.ThemeIcon('globe-outline');
    mcpHttpServerItem.tooltip = "MCP HTTP Server is currently stopped. Click to start.";
    mcpHttpServerItem.command = {
        command: 'appdna.startMCPHttpServer',
        title: 'Start MCP HTTP Server',
        arguments: []
    };
}
```

## Priority
Medium - The HTTP server tree item works but lacks status information and toggle functionality.

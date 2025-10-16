# MCP Server Tree View Toggle

## Overview
Added an MCP Server toggle item under the PROJECT node in the AppDNA tree view. This allows users to easily start and stop the MCP (Model Context Protocol) server directly from the tree view interface.

**Created on:** October 16, 2025

## Implementation Details

### Files Modified

#### 1. `src/commands/mcpCommands.ts`
- **Added `isMcpServerRunning()` function**: Returns boolean indicating if MCP server process is running
- **Added `setMcpServerStatusChangeCallback()` function**: Allows external code to register a callback for status changes
- **Updated `startMcpServerCommand()`**: Now triggers status change callback after successfully starting server
- **Updated `stopMcpServerCommand()`**: Now triggers status change callback after stopping server

```typescript
export function isMcpServerRunning(): boolean {
    return mcpProcess !== null && !mcpProcess.killed;
}

export function setMcpServerStatusChangeCallback(callback: () => void): void {
    onStatusChangeCallback = callback;
}
```

#### 2. `src/providers/jsonTreeDataProvider.ts`
- **Added imports**: `isMcpServerRunning` and `setMcpServerStatusChangeCallback` from mcpCommands
- **Updated constructor**: Registers a callback to refresh the tree when MCP server status changes
- **Updated PROJECT children**: Added MCP Server item after Settings item

```typescript
// In constructor
setMcpServerStatusChangeCallback(() => {
    this.refresh();
});

// In getChildren for 'project' context
const isServerRunning = isMcpServerRunning();
const mcpServerItem = new JsonTreeItem(
    `MCP Server (${isServerRunning ? 'Running' : 'Stopped'})`,
    vscode.TreeItemCollapsibleState.None,
    'projectMcpServer'
);
```

### User Interface

The MCP Server item appears under PROJECT with:
- **Label**: "MCP Server (Running)" or "MCP Server (Stopped)"
- **Icons**:
  - `server-environment` when running
  - `server-process` when stopped
- **Tooltip**:
  - "MCP Server is currently running. Click to stop." (when running)
  - "MCP Server is currently stopped. Click to start." (when stopped)
- **Command**:
  - `appdna.stopMcpServer` when running
  - `appdna.startMcpServer` when stopped

### Tree Structure
```
PROJECT
├── Settings
├── MCP Server (Running/Stopped)  ← NEW
└── Lexicon (when advanced properties enabled)
```

## User Experience

1. **Starting the Server**:
   - User clicks on "MCP Server (Stopped)"
   - Server starts in background
   - Tree view automatically refreshes to show "MCP Server (Running)"
   - Icon changes from server-process to server-environment

2. **Stopping the Server**:
   - User clicks on "MCP Server (Running)"
   - Server process is killed
   - Tree view automatically refreshes to show "MCP Server (Stopped)"
   - Icon changes from server-environment to server-process

3. **Visual Feedback**:
   - Status is always visible in the label
   - Icon changes match the state
   - Tooltip provides guidance on what clicking will do

## Technical Details

### Status Detection
The MCP server status is detected by checking if the `mcpProcess` variable in `mcpCommands.ts` is:
- Non-null AND
- Not killed (`!mcpProcess.killed`)

### Automatic Refresh
When the server status changes:
1. The start/stop command completes
2. The status change callback is invoked
3. The callback triggers `this.refresh()` on the tree data provider
4. VS Code re-queries the tree items
5. The new status is reflected immediately

### Event Flow
```
User clicks item
    ↓
Command executed (start/stop)
    ↓
Status change callback triggered
    ↓
Tree view refreshes
    ↓
getChildren() called for PROJECT
    ↓
isMcpServerRunning() checked
    ↓
Item created with new status
```

## Testing

To test this feature:
1. Open a workspace with an AppDNA model
2. Expand PROJECT in the tree view
3. Click "MCP Server (Stopped)" - should start the server
4. Verify item changes to "MCP Server (Running)" with different icon
5. Click "MCP Server (Running)" - should stop the server
6. Verify item changes back to "MCP Server (Stopped)"

## Related Commands

- **Palette Command**: `AppDNA: Start MCP Server` (still available)
- **Palette Command**: `AppDNA: Stop MCP Server` (still available)
- **Tree View**: Click MCP Server item (new functionality)

## Future Enhancements

Potential improvements:
- Show MCP server port number in tooltip
- Add context menu items for "Restart Server"
- Show number of active connections
- Add "View Logs" command in context menu
- Color-code the icon (green for running, gray for stopped)

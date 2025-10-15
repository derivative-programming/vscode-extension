# List Roles MCP Tool Implementation

**Created:** October 15, 2025  
**Feature:** New MCP tool to retrieve roles from the AppDNA model

## Overview

Added a new `list_roles` MCP tool that retrieves all roles from the Role data object in the AppDNA model via the HTTP bridge. This enables GitHub Copilot and other MCP clients to query available roles for validation and autocomplete purposes.

## Implementation Details

### 1. MCP Bridge Endpoint (`src/services/mcpBridge.ts`)

Added new `/api/roles` GET endpoint to the data bridge (port 3001):

```typescript
else if (req.url === '/api/roles') {
    // Get all roles from Role data object lookup items
    const roles = new Set<string>();
    
    // Extract roles from Role data objects
    const allObjects = modelService.getAllObjects();
    allObjects.forEach((obj: any) => {
        if (obj.name && obj.name.toLowerCase() === 'role') {
            if (obj.lookupItem && Array.isArray(obj.lookupItem)) {
                obj.lookupItem.forEach((lookupItem: any) => {
                    if (lookupItem.name) {
                        roles.add(lookupItem.name);
                    }
                });
            }
        }
    });
    
    const rolesArray = Array.from(roles).sort();
    
    this.outputChannel.appendLine(`[Data Bridge] Returning ${rolesArray.length} roles`);
    
    res.writeHead(200);
    res.end(JSON.stringify(rolesArray));
}
```

**Key Features:**
- Extracts roles from Role data object's `lookupItem` array
- Returns alphabetically sorted array of role names
- Uses Set to ensure unique role names
- Logs the count of roles returned

### 2. UserStoryTools Method (`src/mcp/tools/userStoryTools.ts`)

Added `list_roles()` method:

```typescript
public async list_roles(): Promise<any> {
    // Try to get roles from extension via HTTP bridge
    try {
        const response = await this.fetchFromBridge('/api/roles');
        return {
            success: true,
            roles: response,
            count: response.length,
            note: "Roles loaded from Role data object via MCP bridge"
        };
    } catch (error) {
        // Return empty list if bridge is not available
        return {
            success: false,
            roles: [],
            count: 0,
            note: "Could not load roles from bridge",
            warning: `Could not connect to extension: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}
```

**Key Features:**
- Calls `/api/roles` bridge endpoint
- Returns structured response with success status
- Graceful fallback with error information if bridge unavailable
- Includes count and descriptive note

### 3. MCP Server Registration (`src/mcp/server.ts`)

Registered the tool with the MCP server:

```typescript
this.server.registerTool('list_roles', {
    title: 'List Roles',
    description: 'List all roles from the Role data object in the AppDNA model',
    inputSchema: {},
    outputSchema: {
        success: z.boolean(),
        roles: z.array(z.string()),
        count: z.number(),
        note: z.string().optional(),
        warning: z.string().optional()
    }
}, async () => {
    try {
        const result = await this.userStoryTools.list_roles();
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            structuredContent: result
        };
    } catch (error) {
        const errorResult = { success: false, error: error.message };
        return {
            content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
            structuredContent: errorResult,
            isError: true
        };
    }
});
```

**Key Features:**
- No input parameters required
- Structured output schema with Zod validation
- Error handling with structured error response
- Returns both text content and structured content

### 4. Package.json Declaration (`package.json`)

Added tool declaration for VS Code MCP registry:

```json
{
  "name": "list_roles",
  "displayName": "List Roles",
  "modelDescription": "List all roles from the Role data object in the AppDNA model",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

## Usage

### From GitHub Copilot Chat

```
@workspace /tools
```

This will list `list_roles` as an available tool.

```
Can you list all the roles in the AppDNA model?
```

Copilot will use the `list_roles` tool to fetch and display the roles.

### Response Format

**Success Response:**
```json
{
  "success": true,
  "roles": ["Admin", "Manager", "User"],
  "count": 3,
  "note": "Roles loaded from Role data object via MCP bridge"
}
```

**Error Response:**
```json
{
  "success": false,
  "roles": [],
  "count": 0,
  "note": "Could not load roles from bridge",
  "warning": "Could not connect to extension: Request timed out - is the extension running?"
}
```

## Architecture

```
MCP Client (Copilot)
  ↓ calls list_roles tool
MCP Server (src/mcp/server.ts)
  ↓ delegates to
UserStoryTools.list_roles() (src/mcp/tools/userStoryTools.ts)
  ↓ HTTP GET
MCP Bridge /api/roles (src/services/mcpBridge.ts:3001)
  ↓ queries
ModelService.getAllObjects()
  ↓ filters for
Role Data Object → lookupItem[] → role names
```

## Data Source

Roles are extracted from the **Role data object** in the AppDNA model:

1. Finds data objects where `name.toLowerCase() === 'role'`
2. Extracts `lookupItem` array from Role objects
3. Collects `name` property from each lookup item
4. Returns unique, sorted list

This is the authoritative source for roles in the AppDNA model structure.

## Future Enhancements

Potential improvements:
- Add role details (description, permissions)
- Filter by namespace
- Include role usage statistics
- Cache roles for performance
- Add role validation to `create_user_story` tool

## Related Files

- `src/services/mcpBridge.ts` - HTTP bridge endpoints
- `src/mcp/tools/userStoryTools.ts` - MCP tool implementations
- `src/mcp/server.ts` - MCP server registration
- `package.json` - Tool declarations
- `src/commands/roleRequirementsCommands.ts` - Example role extraction logic
- `src/webviews/userStoriesView.js` - Role validation in webviews

## Testing

To test the tool:

1. Start the extension in debug mode (F5)
2. Ensure the MCP bridge is running (check Output > MCP Bridge)
3. Open GitHub Copilot Chat
4. Use the tool: `@workspace list all roles`
5. Verify the response contains roles from your AppDNA model

## Notes

- Tool requires VS Code extension to be running with MCP bridge active
- Returns empty array with warning if bridge is unavailable
- Roles are sorted alphabetically for consistent output
- Only includes roles from Role data object's lookup items (primary source)

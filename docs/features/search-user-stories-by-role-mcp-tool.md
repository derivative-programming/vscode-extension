# Search User Stories by Role MCP Tool

**Created:** October 15, 2025  
**Feature:** MCP tool to search and filter user stories by role name

## Overview

Added a new `search_user_stories_by_role` MCP tool that filters user stories by extracting and matching the role mentioned in each user story. This enables GitHub Copilot and other MCP clients to quickly find all user stories relevant to a specific role.

## Implementation Details

### 1. Role Extraction Method (`src/mcp/tools/userStoryTools.ts`)

Added helper method to extract role from user story text:

```typescript
private extractRoleFromUserStory(text: string): string | null {
    if (!text || typeof text !== "string") {
        return null;
    }
    
    const t = text.trim().replace(/\s+/g, " ");
    
    // Pattern 1: "A [Role] wants to..."
    const match1 = t.match(/^A\s+([\w\s]+?)\s+wants to\s+/i);
    if (match1) {
        return match1[1].trim();
    }
    
    // Pattern 2: "As a [Role], I want to..."
    const match2 = t.match(/^As a\s+([\w\s]+?)\s*,\s*I want to\s+/i);
    if (match2) {
        return match2[1].trim();
    }
    
    return null;
}
```

**Supported Patterns:**
- `"A [Role] wants to..."` → extracts Role
- `"As a [Role], I want to..."` → extracts Role

### 2. Search Method (`src/mcp/tools/userStoryTools.ts`)

Added `search_user_stories_by_role()` method:

```typescript
public async search_user_stories_by_role(parameters: any): Promise<any> {
    const { role } = parameters;
    
    if (!role) {
        throw new Error('Role parameter is required');
    }
    
    // Try to get stories from extension via HTTP bridge
    try {
        const response = await this.fetchFromBridge('/api/user-stories');
        
        // Filter stories by role (case-insensitive match)
        const roleLower = role.toLowerCase();
        const matchingStories = response.filter((story: any) => {
            const storyText = story.storyText || "";
            const extractedRole = this.extractRoleFromUserStory(storyText);
            return extractedRole && extractedRole.toLowerCase() === roleLower;
        });
        
        return {
            success: true,
            role: role,
            stories: matchingStories.map((story: any) => ({
                title: story.storyNumber || "",
                description: story.storyText || "",
                isIgnored: story.isIgnored === "true"
            })),
            count: matchingStories.length,
            note: "Stories loaded from AppDNA model file via MCP bridge"
        };
    } catch (error) {
        // Fallback to in-memory storage
        // ... error handling
    }
}
```

**Key Features:**
- Fetches all user stories from `/api/user-stories` bridge endpoint
- Extracts role from each story using regex patterns
- Case-insensitive role matching
- Returns filtered list with count
- Graceful fallback to in-memory storage

### 3. MCP Server Registration (`src/mcp/server.ts`)

Registered the tool with input/output schemas:

```typescript
this.server.registerTool('search_user_stories_by_role', {
    title: 'Search User Stories by Role',
    description: 'Search for user stories that mention a specific role',
    inputSchema: {
        role: z.string().describe('The role name to search for in user stories')
    },
    outputSchema: {
        success: z.boolean(),
        role: z.string(),
        stories: z.array(z.object({
            title: z.string(),
            description: z.string(),
            isIgnored: z.boolean()
        })),
        count: z.number(),
        note: z.string().optional(),
        warning: z.string().optional()
    }
}, async ({ role }) => {
    try {
        const result = await this.userStoryTools.search_user_stories_by_role({ role });
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

### 4. Package.json Declaration (`package.json`)

Added tool declaration for VS Code MCP registry:

```json
{
  "name": "search_user_stories_by_role",
  "displayName": "Search User Stories by Role",
  "modelDescription": "Search for user stories that mention a specific role",
  "inputSchema": {
    "type": "object",
    "properties": {
      "role": {
        "type": "string",
        "description": "The role name to search for in user stories"
      }
    },
    "required": ["role"]
  }
}
```

## Usage

### From GitHub Copilot Chat

**Example 1: Find all Manager stories**
```
Show me all user stories for the Manager role
```

**Example 2: Check Admin responsibilities**
```
What user stories are assigned to Admin?
```

**Example 3: Compare roles**
```
Compare user stories between Manager and User roles
```

### Direct Tool Call

```javascript
// MCP client call
await callTool('search_user_stories_by_role', { role: 'Manager' });
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "role": "Manager",
  "stories": [
    {
      "title": "US-001",
      "description": "A Manager wants to view all reports",
      "isIgnored": false
    },
    {
      "title": "US-005",
      "description": "As a Manager, I want to update a project",
      "isIgnored": false
    }
  ],
  "count": 2,
  "note": "Stories loaded from AppDNA model file via MCP bridge"
}
```

**No Matches Response:**
```json
{
  "success": true,
  "role": "NonExistentRole",
  "stories": [],
  "count": 0,
  "note": "Stories loaded from AppDNA model file via MCP bridge"
}
```

**Error Response:**
```json
{
  "success": true,
  "role": "Manager",
  "stories": [],
  "count": 0,
  "note": "Stories loaded from MCP server memory (bridge not available)",
  "warning": "Could not connect to extension: Request timed out - is the extension running?"
}
```

## Architecture

```
MCP Client (Copilot)
  ↓ calls search_user_stories_by_role(role: "Manager")
MCP Server (src/mcp/server.ts)
  ↓ delegates to
UserStoryTools.search_user_stories_by_role()
  ↓ HTTP GET
MCP Bridge /api/user-stories (port 3001)
  ↓ queries
ModelService → All User Stories
  ↓ filters by
extractRoleFromUserStory() → Match role (case-insensitive)
  ↓ returns
Filtered user stories
```

## Role Extraction Logic

The tool uses regex patterns to extract roles from user story text:

### Pattern 1: "A [Role] wants to..."
- Example: `"A Manager wants to view all reports"`
- Regex: `/^A\s+([\w\s]+?)\s+wants to\s+/i`
- Extracts: `"Manager"`

### Pattern 2: "As a [Role], I want to..."
- Example: `"As a Manager, I want to update a project"`
- Regex: `/^As a\s+([\w\s]+?)\s*,\s*I want to\s+/i`
- Extracts: `"Manager"`

### Matching Behavior
- **Case-insensitive**: "manager", "Manager", "MANAGER" all match
- **Exact match**: Only stories with the exact role name (case-insensitive) are returned
- **Multi-word roles**: Supports roles like "Project Manager", "System Admin"

## Use Cases

### 1. Role-Based Requirements Analysis
```
List all user stories for Admin role and summarize their responsibilities
```

### 2. Role Coverage Verification
```
Which roles have the most user stories? Show me the distribution.
```

### 3. Access Control Planning
```
Show me all user stories for the Manager role to plan access control requirements
```

### 4. Sprint Planning
```
Filter user stories by User role for the next sprint
```

### 5. Documentation Generation
```
Generate role-based documentation from user stories for each role
```

## Integration with Other Tools

This tool works well in combination with:

- **`list_roles`** - First get all available roles, then search for each
- **`list_user_stories`** - Get all stories, then filter by role
- **`create_user_story`** - Create stories with validated roles
- **`open_user_stories_view`** - Open filtered view in VS Code

### Example Workflow

```javascript
// 1. Get all roles
const rolesResult = await callTool('list_roles');
// Returns: ["Admin", "Manager", "User"]

// 2. Search stories for each role
for (const role of rolesResult.roles) {
    const stories = await callTool('search_user_stories_by_role', { role });
    console.log(`${role}: ${stories.count} stories`);
}
```

## Performance Considerations

- **Fetch All Stories**: Retrieves all user stories on each call
- **Client-Side Filtering**: Filtering happens in the MCP server
- **No Caching**: Each call fetches fresh data from the bridge
- **Case-Insensitive**: Uses `.toLowerCase()` for comparison

For large models with many user stories (100+), consider:
- Implementing server-side filtering in the bridge endpoint
- Adding caching with TTL
- Creating dedicated `/api/user-stories/by-role/:role` endpoint

## Future Enhancements

Potential improvements:
- **Partial matching**: Find stories with roles containing substring
- **Multi-role search**: Search for multiple roles at once
- **Role synonyms**: Match role aliases (e.g., "Admin" = "Administrator")
- **Regex support**: Allow regex patterns in role parameter
- **Date filtering**: Filter by story creation/modification date
- **Status filtering**: Filter by isIgnored flag
- **Sorting options**: Sort by title, date, or relevance

## Testing

To test the tool:

1. **Ensure extension is running** with MCP bridge active
2. **Open GitHub Copilot Chat**
3. **Use natural language**:
   ```
   Show me all user stories for the Manager role
   ```
4. **Verify results** contain only stories with "Manager" role
5. **Test case sensitivity**: Try "manager", "MANAGER"
6. **Test non-existent role**: Try a role that doesn't exist

### Manual Testing

```javascript
// Test 1: Valid role
await callTool('search_user_stories_by_role', { role: 'Manager' });

// Test 2: Case insensitive
await callTool('search_user_stories_by_role', { role: 'manager' });

// Test 3: Non-existent role
await callTool('search_user_stories_by_role', { role: 'InvalidRole' });

// Test 4: Missing parameter
await callTool('search_user_stories_by_role', {});
// Should throw: "Role parameter is required"
```

## Related Files

- `src/mcp/tools/userStoryTools.ts` - Tool implementation
- `src/mcp/server.ts` - MCP server registration
- `src/services/mcpBridge.ts` - HTTP bridge endpoints
- `package.json` - Tool declarations
- `docs/features/list-roles-mcp-tool.md` - Related tool documentation

## Error Handling

The tool handles several error scenarios:

1. **Missing role parameter**: Throws error with clear message
2. **Bridge unavailable**: Falls back to in-memory storage with warning
3. **Invalid user story format**: Returns empty role (not matched)
4. **Network timeout**: Returns error response with timeout message
5. **Empty story list**: Returns success with count: 0

## Notes

- Role extraction only works for standard user story formats
- Non-standard formats won't have roles extracted (returns empty)
- Requires VS Code extension running with MCP bridge active
- Uses existing `/api/user-stories` endpoint (no new endpoint needed)
- Client-side filtering is fast enough for typical model sizes (<1000 stories)

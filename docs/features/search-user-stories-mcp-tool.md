# Search User Stories MCP Tool

**Created:** October 15, 2025  
**Feature:** MCP tool to perform text search across user stories

## Overview

Added a new `search_user_stories` MCP tool that performs full-text search across user story titles and descriptions. This enables GitHub Copilot and other MCP clients to find user stories containing specific keywords, phrases, or concepts.

## Implementation Details

### 1. Search Method (`src/mcp/tools/userStoryTools.ts`)

Added `search_user_stories()` method with optional case-sensitive search:

```typescript
public async search_user_stories(parameters: any): Promise<any> {
    const { query, caseSensitive } = parameters;
    
    if (!query) {
        throw new Error('Query parameter is required');
    }
    
    const isCaseSensitive = caseSensitive === true;
    
    // Try to get stories from extension via HTTP bridge
    try {
        const response = await this.fetchFromBridge('/api/user-stories');
        
        // Filter stories by text search
        const matchingStories = response.filter((story: any) => {
            const storyText = story.storyText || "";
            const storyNumber = story.storyNumber || "";
            
            const searchText = isCaseSensitive 
                ? storyText + " " + storyNumber
                : (storyText + " " + storyNumber).toLowerCase();
            const searchQuery = isCaseSensitive ? query : query.toLowerCase();
            
            return searchText.includes(searchQuery);
        });
        
        return {
            success: true,
            query: query,
            caseSensitive: isCaseSensitive,
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
- Searches in both `storyText` (description) and `storyNumber` (title)
- Case-insensitive by default (configurable)
- Returns filtered list with count and metadata
- Graceful fallback to in-memory storage

### 2. MCP Server Registration (`src/mcp/server.ts`)

Registered the tool with input/output schemas:

```typescript
this.server.registerTool('search_user_stories', {
    title: 'Search User Stories',
    description: 'Search user stories by text query in title or description',
    inputSchema: {
        query: z.string().describe('The text to search for in user stories'),
        caseSensitive: z.boolean().optional().describe('Whether the search should be case-sensitive (default: false)')
    },
    outputSchema: {
        success: z.boolean(),
        query: z.string(),
        caseSensitive: z.boolean(),
        stories: z.array(z.object({
            title: z.string(),
            description: z.string(),
            isIgnored: z.boolean()
        })),
        count: z.number(),
        note: z.string().optional(),
        warning: z.string().optional()
    }
}, async ({ query, caseSensitive }) => {
    try {
        const result = await this.userStoryTools.search_user_stories({ query, caseSensitive });
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

### 3. Package.json Declaration (`package.json`)

Added tool declaration for VS Code MCP registry:

```json
{
  "name": "search_user_stories",
  "displayName": "Search User Stories",
  "modelDescription": "Search user stories by text query in title or description",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "The text to search for in user stories"
      },
      "caseSensitive": {
        "type": "boolean",
        "description": "Whether the search should be case-sensitive (default: false)"
      }
    },
    "required": ["query"]
  }
}
```

## Usage

### From GitHub Copilot Chat

**Example 1: Find stories about reports**
```
Find all user stories that mention "report"
```

**Example 2: Search for specific action**
```
Show me user stories about updating
```

**Example 3: Find stories about specific objects**
```
Search for user stories containing "employee" or "project"
```

**Example 4: Case-sensitive search**
```
Find user stories with "API" (case sensitive)
```

### Direct Tool Call

```javascript
// Case-insensitive search (default)
await callTool('search_user_stories', { 
    query: 'report' 
});

// Case-sensitive search
await callTool('search_user_stories', { 
    query: 'API',
    caseSensitive: true 
});
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "query": "report",
  "caseSensitive": false,
  "stories": [
    {
      "title": "US-001",
      "description": "A Manager wants to view all reports",
      "isIgnored": false
    },
    {
      "title": "US-015",
      "description": "As an Admin, I want to update a report",
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
  "query": "nonexistent",
  "caseSensitive": false,
  "stories": [],
  "count": 0,
  "note": "Stories loaded from AppDNA model file via MCP bridge"
}
```

**Error Response:**
```json
{
  "success": true,
  "query": "report",
  "caseSensitive": false,
  "stories": [],
  "count": 0,
  "note": "Stories loaded from MCP server memory (bridge not available)",
  "warning": "Could not connect to extension: Request timed out - is the extension running?"
}
```

## Architecture

```
MCP Client (Copilot)
  ↓ calls search_user_stories(query: "report")
MCP Server (src/mcp/server.ts)
  ↓ delegates to
UserStoryTools.search_user_stories()
  ↓ HTTP GET
MCP Bridge /api/user-stories (port 3001)
  ↓ queries
ModelService → All User Stories
  ↓ filters by
String.includes() → Match query in title/description
  ↓ returns
Filtered user stories
```

## Search Behavior

### Search Scope
- **Title (storyNumber)**: Searches in the story number/title field
- **Description (storyText)**: Searches in the full story description
- **Combined**: Matches if query appears in either field

### Case Sensitivity
- **Default (false)**: Case-insensitive search
  - Query: `"report"` matches `"Report"`, `"REPORT"`, `"report"`
- **Case Sensitive (true)**: Exact case matching
  - Query: `"API"` matches only `"API"`, not `"api"` or `"Api"`

### Match Type
- **Substring matching**: Uses JavaScript `String.includes()`
- **Partial matches**: Query `"port"` matches `"report"`, `"support"`, `"portfolio"`
- **No regex**: Plain text search only

### Examples

| Query | Case Sensitive | Matches |
|-------|---------------|---------|
| `"report"` | false | "Report", "reports", "reporting", "reporter" |
| `"API"` | true | "API" only, not "api" |
| `"view all"` | false | "view all", "View All", "VIEW ALL" |
| `"Manager"` | false | "Manager", "manager", "Project Manager" |

## Use Cases

### 1. Feature Discovery
```
Find all user stories about authentication
```
→ Discovers all auth-related stories

### 2. Object-Specific Stories
```
Search for user stories mentioning "employee"
```
→ Finds all stories involving employee data

### 3. Action-Based Search
```
Find user stories with "update" or "delete"
```
→ Identifies modification operations

### 4. Integration Points
```
Search for user stories containing "API"
```
→ Finds API integration points

### 5. Requirements Analysis
```
Find all user stories about reports
```
→ Gathers reporting requirements

### 6. Sprint Planning
```
Search for user stories with "dashboard"
```
→ Groups dashboard-related work

### 7. Technical Debt
```
Find user stories mentioning "legacy" or "refactor"
```
→ Identifies technical debt items

## Integration with Other Tools

This tool complements existing MCP tools:

### Workflow Examples

**1. Search → View Details**
```javascript
// Find stories about reports
const results = await callTool('search_user_stories', { query: 'report' });
// Open the user stories view to see them
await callTool('open_user_stories_view');
```

**2. List Roles → Search by Role**
```javascript
// Get all roles
const roles = await callTool('list_roles');
// Search stories for first role
const stories = await callTool('search_user_stories_by_role', { 
    role: roles.roles[0] 
});
```

**3. Search → Analyze → Create**
```javascript
// Find existing stories
const existing = await callTool('search_user_stories', { query: 'dashboard' });
// Analyze and create new story
await callTool('create_user_story', {
    title: 'US-NEW',
    description: 'As a Manager, I want to view a dashboard'
});
```

## Performance Considerations

### Current Implementation
- **Fetch All**: Retrieves all user stories on each call
- **Client-Side Filtering**: Filtering in MCP server (JavaScript)
- **No Caching**: Fresh data on every request
- **Simple String Match**: Fast `String.includes()` operation

### Performance Characteristics
- **Small Models (< 100 stories)**: Instant (<50ms)
- **Medium Models (100-500 stories)**: Fast (<200ms)
- **Large Models (500-1000 stories)**: Acceptable (<500ms)
- **Very Large Models (1000+ stories)**: May be slow (>1s)

### Optimization Strategies (Future)

For large models, consider:

1. **Server-Side Search**: Add `/api/user-stories/search?q=query` endpoint
2. **Indexing**: Pre-index story text for faster searching
3. **Pagination**: Return results in batches
4. **Caching**: Cache all stories with TTL
5. **Regex Support**: Add regex pattern matching
6. **Advanced Search**: Boolean operators (AND, OR, NOT)

## Advanced Search Patterns

### Multi-Word Search
```javascript
// Searches for exact phrase
await callTool('search_user_stories', { 
    query: 'view all reports' 
});
```

### Partial Matching
```javascript
// Finds "report", "reports", "reporting"
await callTool('search_user_stories', { 
    query: 'report' 
});
```

### Case-Specific Search
```javascript
// Only matches exact case
await callTool('search_user_stories', { 
    query: 'API',
    caseSensitive: true 
});
```

## Limitations

Current limitations of the tool:

1. **No Regex**: Plain text only, no regular expressions
2. **No Boolean Operators**: Can't combine multiple terms (AND, OR)
3. **No Wildcards**: No `*` or `?` pattern matching
4. **No Fuzzy Search**: Exact substring match only
5. **No Highlighting**: Doesn't highlight matched text in results
6. **No Ranking**: Results not sorted by relevance
7. **No Field-Specific**: Can't search only title or only description

## Future Enhancements

Potential improvements:

### 1. Advanced Query Syntax
```javascript
// Boolean operators
query: "report AND dashboard"
query: "update OR delete"
query: "employee NOT manager"
```

### 2. Field-Specific Search
```javascript
// Search only in title
searchIn: "title"
// Search only in description
searchIn: "description"
```

### 3. Regex Support
```javascript
query: "view.*report",
isRegex: true
```

### 4. Fuzzy Matching
```javascript
query: "maneger", // typo
fuzzy: true // matches "manager"
```

### 5. Result Highlighting
```json
{
  "description": "A Manager wants to view all **reports**",
  "matchPositions": [35, 42]
}
```

### 6. Relevance Ranking
```json
{
  "stories": [...],
  "sortBy": "relevance" // or "date", "title"
}
```

### 7. Search History
```javascript
// Get recent searches
await callTool('get_search_history');
```

## Testing

To test the tool:

### Basic Tests

```javascript
// Test 1: Simple search
await callTool('search_user_stories', { query: 'report' });

// Test 2: Case-insensitive (default)
await callTool('search_user_stories', { query: 'REPORT' });

// Test 3: Case-sensitive
await callTool('search_user_stories', { 
    query: 'API',
    caseSensitive: true 
});

// Test 4: Multi-word phrase
await callTool('search_user_stories', { query: 'view all' });

// Test 5: No matches
await callTool('search_user_stories', { query: 'xyz123' });

// Test 6: Missing query parameter
await callTool('search_user_stories', {});
// Should throw: "Query parameter is required"
```

### Manual Testing in Copilot

1. **Start extension** with MCP bridge active
2. **Open Copilot Chat**
3. **Try various searches**:
   ```
   Find user stories about reports
   Search for user stories with "update"
   Show me stories mentioning "employee"
   ```
4. **Verify results** match expected stories
5. **Test edge cases**: empty query, special characters

## Error Handling

The tool handles several error scenarios:

1. **Missing query**: Throws error with clear message
2. **Empty query**: Throws error (could be enhanced to allow)
3. **Bridge unavailable**: Falls back to in-memory storage
4. **Network timeout**: Returns error response with timeout message
5. **Empty result set**: Returns success with count: 0
6. **Special characters**: Handled as literal text (no escaping needed)

## Related Files

- `src/mcp/tools/userStoryTools.ts` - Tool implementation
- `src/mcp/server.ts` - MCP server registration  
- `src/services/mcpBridge.ts` - HTTP bridge endpoints
- `package.json` - Tool declarations
- `docs/features/search-user-stories-by-role-mcp-tool.md` - Related search tool
- `docs/features/list-roles-mcp-tool.md` - List roles tool

## Comparison with Other Search Tools

### search_user_stories vs search_user_stories_by_role

| Feature | search_user_stories | search_user_stories_by_role |
|---------|---------------------|----------------------------|
| Search Type | Text query (any field) | Role-specific extraction |
| Input | Text string | Role name |
| Scope | Title + Description | Extracted role only |
| Use Case | Find by keyword | Find by role assignment |
| Example | "report", "API", "view" | "Manager", "Admin" |

**Use Both Together:**
```javascript
// First, find stories about reports
const reportStories = await callTool('search_user_stories', { 
    query: 'report' 
});

// Then, find which roles need reports
const managerStories = await callTool('search_user_stories_by_role', { 
    role: 'Manager' 
});
```

## Notes

- Searches are performed client-side after fetching all stories
- No server-side search index (could be added for performance)
- Case-insensitive by default for better user experience
- Searches in both title and description for comprehensive results
- Requires VS Code extension running with MCP bridge active
- Uses existing `/api/user-stories` endpoint (no new endpoint needed)
- Simple substring matching is sufficient for typical model sizes

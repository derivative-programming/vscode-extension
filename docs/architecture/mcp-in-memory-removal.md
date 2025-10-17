# MCP Server: Removal of In-Memory User Stories

**Created:** October 16, 2025  
**Purpose:** Remove in-memory user story storage from MCP server, use only HTTP bridge

## Problem

The MCP server had a dual-tier fallback architecture:
1. Primary: HTTP bridge to extension (port 3001)
2. Fallback: In-memory storage when bridge unavailable

This created confusion and unnecessary complexity since:
- MCP server should only work when extension is running
- In-memory stories were never synced back to the model
- Created inconsistent behavior between modes
- Added methods that weren't needed

## Solution

Removed all in-memory user story functionality. MCP server now:
- **Only** uses HTTP bridge to get data from extension
- Returns clear error messages when extension is not running
- Simplifies architecture and reduces code complexity

## Changes Made

### 1. Removed In-Memory Storage

**Before:**
```typescript
export class UserStoryTools {
    private inMemoryUserStories: any[] = [];

    constructor(modelService: any) {
        // Always use in-memory storage for MCP server
    }
}
```

**After:**
```typescript
export class UserStoryTools {
    constructor(modelService: any) {
        // modelService parameter kept for compatibility but not used
        // All data comes from HTTP bridge to extension
    }
}
```

### 2. Removed Methods

Deleted these methods that were only used for in-memory storage:
- `addInMemoryUserStory(story: any): void`
- `getInMemoryUserStories(): any[]`

### 3. Updated create_user_story()

Story creation is no longer supported via MCP. The tool now validates format only.

**Before:**
```typescript
// For MCP server, always use in-memory storage
const storyId = title || this.generateGuid();
const newStory = {
    name: storyId,
    storyText: description,
    isIgnored: "false"
};

this.inMemoryUserStories.push(newStory);

return {
    success: true,
    story: { ...newStory },
    message: 'User story created successfully in MCP server memory'
};
```

**After:**
```typescript
// MCP server does not create stories directly
// This tool is for validation only
return {
    success: false,
    error: 'Story creation via MCP is not supported. Use the extension UI to create stories.',
    validatedFormat: true,
    suggestedStory: {
        name: title || this.generateGuid(),
        storyText: description,
        isIgnored: "false"
    }
};
```

### 4. Updated list_user_stories()

**Before:**
```typescript
try {
    const response = await this.fetchFromBridge('/api/user-stories');
    return { success: true, stories: response, ... };
} catch (error) {
    // Fallback to in-memory storage
    const inMemoryStories = this.getInMemoryUserStories();
    return { success: true, stories: inMemoryStories, ... };
}
```

**After:**
```typescript
try {
    const response = await this.fetchFromBridge('/api/user-stories');
    return { success: true, stories: response, ... };
} catch (error) {
    return {
        success: false,
        stories: [],
        count: 0,
        error: `Could not connect to extension: ${error.message}`,
        note: "MCP bridge is not available. Make sure the extension is running."
    };
}
```

### 5. Updated search_user_stories_by_role()

Removed fallback to in-memory storage, returns error if bridge unavailable.

**Before:**
```typescript
} catch (error) {
    // Fallback to in-memory storage
    const inMemoryStories = this.getInMemoryUserStories();
    // ... filter and return in-memory stories
}
```

**After:**
```typescript
} catch (error) {
    return {
        success: false,
        role: role,
        stories: [],
        count: 0,
        error: `Could not connect to extension: ${error.message}`,
        note: "MCP bridge is not available. Make sure the extension is running."
    };
}
```

### 6. Updated search_user_stories()

Removed fallback to in-memory storage, returns error if bridge unavailable.

Same pattern as search_user_stories_by_role().

## Impact

### Simplified Architecture

```
Before:
┌─────────────────────┐
│   GitHub Copilot    │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│    MCP Server       │
│  ┌───────────────┐  │
│  │ HTTP Bridge   │◄─┼─────► Extension (Port 3001)
│  └───────┬───────┘  │
│          │          │
│     Fallback to     │
│          v          │
│  ┌───────────────┐  │
│  │  In-Memory    │  │
│  │   Storage     │  │
│  └───────────────┘  │
└─────────────────────┘

After:
┌─────────────────────┐
│   GitHub Copilot    │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│    MCP Server       │
│  ┌───────────────┐  │
│  │ HTTP Bridge   │◄─┼─────► Extension (Port 3001)
│  └───────────────┘  │
│         │           │
│    (Only Path)      │
└─────────────────────┘
```

### Benefits

1. **Clearer Error Messages**: Users know immediately if extension isn't running
2. **Single Source of Truth**: All data comes from AppDNA model via extension
3. **Reduced Code Complexity**: ~50 lines of code removed
4. **No Data Sync Issues**: Can't have in-memory data that differs from model
5. **Better User Experience**: Forces proper workflow (extension must be running)

### Breaking Changes

- `create_user_story` now returns `success: false` with validation info instead of creating in-memory story
- All tools return `success: false` when extension is not running (instead of returning in-memory data)
- Methods `addInMemoryUserStory` and `getInMemoryUserStories` removed (not exposed to MCP anyway)

## Testing

When extension is running:
- ✅ `list_user_stories` - Returns stories from model
- ✅ `search_user_stories` - Searches stories from model
- ✅ `search_user_stories_by_role` - Searches stories from model
- ✅ `create_user_story` - Returns validation result with error

When extension is NOT running:
- ❌ `list_user_stories` - Returns `success: false` with clear error
- ❌ `search_user_stories` - Returns `success: false` with clear error
- ❌ `search_user_stories_by_role` - Returns `success: false` with clear error
- ❌ `create_user_story` - Returns validation result with error

## Migration Notes

For users/AI agents using the MCP server:
- The extension **must be running** for story tools to work
- Start extension before using MCP tools
- Check `success` field in responses
- Read `error` and `note` fields for troubleshooting

## Files Modified

- `src/mcp/tools/userStoryTools.ts` - Removed in-memory storage and fallback logic

## Related Documentation

- See `docs/architecture/mcp-story-structure-correction.md` for story format details
- See `docs/architecture/MCP-BRIDGE-UNIFIED-ARCHITECTURE.md` for HTTP bridge architecture

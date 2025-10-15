# MCP Provider Registration Fix

**Date:** October 15, 2025  
**Issue:** New MCP tools not appearing in VS Code's official MCP API

## Problem

Three new MCP tools were created and registered in the standalone MCP server (`src/mcp/server.ts`) but were not available when testing in VS Code with GitHub Copilot:

- `list_roles` - List all roles from the AppDNA model
- `search_user_stories_by_role` - Search user stories by role
- `search_user_stories` - Text search across user stories

The tools were declared in `package.json` and worked in the standalone MCP server, but were not registered with VS Code's official Language Model API.

## Root Cause

The AppDNA extension uses two MCP implementations:

1. **Standalone MCP Server** (`src/mcp/server.ts`) - For external MCP clients
2. **VS Code MCP Provider** (`src/mcp/mcpProvider.ts`) - For VS Code's official Language Model API

The new tools were only registered in the standalone server, not in the VS Code provider.

## Solution

**Part 1:** Updated `src/mcp/mcpProvider.ts` to register all three new tools with VS Code's Language Model API.

**Part 2:** Fixed missing initialization - the `AppDNAMcpProvider` was never being instantiated in `src/extension.ts`, so the tools were never actually registered with VS Code.

### Changes Made

#### 0. Initialize MCP Provider in Extension (CRITICAL FIX)

**File:** `src/extension.ts`

Added import:
```typescript
import { AppDNAMcpProvider } from './mcp/mcpProvider';
```

Added initialization in `activate()` function:
```typescript
// Initialize VS Code MCP Provider for GitHub Copilot integration
const mcpProvider = new AppDNAMcpProvider();
context.subscriptions.push(mcpProvider);
console.log('[Extension] MCP provider initialized for VS Code Language Model API');
```

**This was the critical missing piece** - the MCP provider was never being instantiated, so none of the tools were registered with VS Code's Language Model API.

#### 1. Added Input Schema Interfaces

```typescript
/**
 * Input schema for list_roles tool
 */
interface ListRolesInput {
    // No parameters needed
}

/**
 * Input schema for search_user_stories_by_role tool
 */
interface SearchUserStoriesByRoleInput {
    role: string;
}

/**
 * Input schema for search_user_stories tool
 */
interface SearchUserStoriesInput {
    query: string;
    caseSensitive?: boolean;
}
```

#### 2. Registered list_roles Tool

```typescript
const listRolesTool = vscode.lm.registerTool('list_roles', {
    prepareInvocation: async (options, token) => {
        return {
            invocationMessage: 'Listing all roles from the AppDNA model',
            confirmationMessages: undefined
        };
    },
    invoke: async (options, token) => {
        try {
            const result = await this.userStoryTools.list_roles();
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
            ]);
        } catch (error) {
            const errorResult = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(JSON.stringify(errorResult, null, 2))
            ]);
        }
    }
});
```

#### 3. Registered search_user_stories_by_role Tool

```typescript
const searchByRoleTool = vscode.lm.registerTool('search_user_stories_by_role', {
    prepareInvocation: async (options, token) => {
        const input = options.input as SearchUserStoriesByRoleInput;
        return {
            invocationMessage: `Searching user stories for role: ${input.role}`,
            confirmationMessages: undefined
        };
    },
    invoke: async (options, token) => {
        try {
            const input = options.input as SearchUserStoriesByRoleInput;
            const result = await this.userStoryTools.search_user_stories_by_role(input);
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
            ]);
        } catch (error) {
            const errorResult = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(JSON.stringify(errorResult, null, 2))
            ]);
        }
    }
});
```

#### 4. Registered search_user_stories Tool

```typescript
const searchStoriesTool = vscode.lm.registerTool('search_user_stories', {
    prepareInvocation: async (options, token) => {
        const input = options.input as SearchUserStoriesInput;
        return {
            invocationMessage: `Searching user stories for: "${input.query}"`,
            confirmationMessages: undefined
        };
    },
    invoke: async (options, token) => {
        try {
            const input = options.input as SearchUserStoriesInput;
            const result = await this.userStoryTools.search_user_stories(input);
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
            ]);
        } catch (error) {
            const errorResult = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(JSON.stringify(errorResult, null, 2))
            ]);
        }
    }
});
```

#### 5. Updated Disposables Array

```typescript
this.disposables.push(createTool, listTool, listRolesTool, searchByRoleTool, searchStoriesTool);
```

## Verification

After this fix, all tools should be available in VS Code:

### Test in GitHub Copilot Chat

```
@workspace /tools
```

Should show:
- ✅ create_user_story
- ✅ list_user_stories
- ✅ list_roles
- ✅ search_user_stories_by_role
- ✅ search_user_stories

### Test Functionality

```
List all roles in the AppDNA model
```

```
Show me user stories for the Manager role
```

```
Search for user stories containing "report"
```

## Architecture Note

The AppDNA extension maintains two parallel MCP implementations:

### 1. Standalone MCP Server (`src/mcp/server.ts`)
- For external MCP clients (e.g., Claude Desktop)
- Uses stdio transport
- Runs as separate process
- Registered via `.vscode/mcp-server.json`

### 2. VS Code MCP Provider (`src/mcp/mcpProvider.ts`)
- For VS Code's built-in Language Model API
- For GitHub Copilot integration
- Runs in extension host
- Uses `vscode.lm.registerTool()`

**Important:** When adding new MCP tools, they must be registered in BOTH places:
1. `src/mcp/server.ts` - For standalone server
2. `src/mcp/mcpProvider.ts` - For VS Code integration

## Files Modified

- `src/extension.ts` - **CRITICAL**: Added initialization of `AppDNAMcpProvider`
- `src/mcp/mcpProvider.ts` - Added registration for 3 new tools

## Related Documentation

- `docs/features/list-roles-mcp-tool.md`
- `docs/features/search-user-stories-by-role-mcp-tool.md`
- `docs/features/search-user-stories-mcp-tool.md`

## Testing Checklist

- [x] TypeScript compilation passes
- [ ] Extension loads without errors
- [ ] `@workspace /tools` shows all 5 tools
- [ ] `list_roles` returns roles from model
- [ ] `search_user_stories_by_role` filters by role
- [ ] `search_user_stories` performs text search
- [ ] Error handling works for all tools
- [ ] Tools work without MCP bridge (in-memory fallback)

## Prevention

To prevent this issue in the future:

1. **Checklist:** When adding new MCP tools, verify registration in both locations
2. **Documentation:** Add note to tool creation guide
3. **Testing:** Test in both standalone server AND VS Code
4. **Code Review:** Check both files are updated

## Lessons Learned

- VS Code has its own MCP tool registration API separate from the MCP protocol
- Tool declarations in `package.json` are for discovery, not execution
- The `AppDNAMcpProvider` class must be kept in sync with MCP server registrations
- Testing should include both external MCP clients and VS Code's Copilot

## Future Improvement

Consider creating a shared tool registration system to avoid duplication:

```typescript
// Proposed: tools/registry.ts
export const TOOL_DEFINITIONS = {
    list_roles: {
        handler: (tools) => tools.list_roles(),
        schema: { /* ... */ }
    },
    // ... other tools
};

// Use in both server.ts and mcpProvider.ts
TOOL_DEFINITIONS.forEach(def => registerTool(def));
```

This would ensure both implementations stay synchronized automatically.

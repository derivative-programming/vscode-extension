# MCP Server Refactoring Proposal

## Date: November 22, 2025

## Problem Statement

The `server.ts` file has grown to **5,446 lines** with **148 tool registrations** all contained in a single massive `registerTools()` method. This makes the file:
- Difficult to navigate and maintain
- Hard to test individual tool registrations
- Prone to merge conflicts
- Not following separation of concerns principle

## Current Architecture

```
src/mcp/
├── server.ts (5,446 lines - MASSIVE!)
│   ├── MCPServer class
│   └── registerTools() method with 148 tool registrations
└── tools/
    ├── userStoryTools.ts (591 lines) - 4 tools
    ├── dataObjectTools.ts (2,171 lines) - many tools
    ├── formTools.ts (2,617 lines) - many tools
    ├── generalFlowTools.ts - many tools
    ├── reportTools.ts - many tools
    ├── viewTools.ts (717 lines) - 45+ view opening tools
    ├── modelTools.ts - several tools
    ├── modelServiceTools.ts - several tools
    ├── pageInitTools.ts - several tools
    └── workflowTools.ts - several tools
```

## Proposed Architecture

Each tool file should export a `registerTools` function that registers its own tools with the server.

```typescript
// Pattern for each tool file:

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export class XyzTools {
    // ... existing methods ...
}

export function registerXyzTools(server: McpServer, tools: XyzTools): void {
    // Register tool 1
    server.registerTool('tool_name_1', {
        title: 'Tool Title',
        description: 'Tool description',
        inputSchema: { /* ... */ },
        outputSchema: { /* ... */ }
    }, async (params) => {
        try {
            const result = await tools.method_name(params);
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
    
    // Register tool 2, 3, etc...
}
```

Then `server.ts` becomes much simpler:

```typescript
import { registerUserStoryTools } from './tools/userStoryTools';
import { registerViewTools } from './tools/viewTools';
import { registerDataObjectTools } from './tools/dataObjectTools';
// ... etc

private registerTools(): void {
    registerUserStoryTools(this.server, this.userStoryTools);
    registerViewTools(this.server, this.viewTools);
    registerDataObjectTools(this.server, this.dataObjectTools);
    registerFormTools(this.server, this.formTools);
    registerGeneralFlowTools(this.server, this.generalFlowTools);
    registerReportTools(this.server, this.reportTools);
    registerModelTools(this.server, this.modelTools);
    registerModelServiceTools(this.server, this.modelServiceTools);
    registerPageInitTools(this.server, this.pageInitTools);
    registerWorkflowTools(this.server, this.workflowTools);
}
```

## Benefits

1. **Maintainability**: Each tool file owns its registration logic
2. **Testability**: Can test registrations independently
3. **Readability**: server.ts becomes < 100 lines
4. **Separation of Concerns**: Tool logic and registration stay together
5. **Ease of Development**: Adding new tools only touches one file

## Tool Count by File

Based on analysis of `server.ts`:
- `userStoryTools.ts`: 4 tools (create, list, update, get_schema)
- `dataObjectTools.ts`: ~20 tools (roles, lookup values, data objects, etc.)
- `formTools.ts`: ~20 tools (CRUD, params, buttons, output vars, etc.)
- `generalFlowTools.ts`: ~10 tools (CRUD, params, output vars)
- `reportTools.ts`: ~15 tools (CRUD, params, columns, buttons)
- `viewTools.ts`: ~45 tools (all view opening commands)
- `modelTools.ts`: ~15 tools (model operations, features, fabrication)
- `modelServiceTools.ts`: ~5 tools (save, expand/collapse tree, etc.)
- `pageInitTools.ts`: ~5 tools (page init flows)
- `workflowTools.ts`: ~8 tools (workflow CRUD and tasks)

**Total: 148 tools**

## Implementation Plan

### Phase 1: Add Registration Functions (COMPLETE for userStoryTools)
✅ userStoryTools.ts - Added `registerUserStoryTools()`
- [ ] viewTools.ts - Add `registerViewTools()`
- [ ] dataObjectTools.ts - Add `registerDataObjectTools()`
- [ ] formTools.ts - Add `registerFormTools()`
- [ ] generalFlowTools.ts - Add `registerGeneralFlowTools()`
- [ ] reportTools.ts - Add `registerReportTools()`
- [ ] modelTools.ts - Add `registerModelTools()`
- [ ] modelServiceTools.ts - Add `registerModelServiceTools()`
- [ ] pageInitTools.ts - Add `registerPageInitTools()`
- [ ] workflowTools.ts - Add `registerWorkflowTools()`

### Phase 2: Refactor server.ts
- [ ] Import all registration functions
- [ ] Replace massive registerTools() with calls to each registration function
- [ ] Delete old registration code (save as backup first)

### Phase 3: Testing
- [ ] Verify all 148 tools still work
- [ ] Run existing MCP tests
- [ ] Test with GitHub Copilot integration

### Phase 4: Cleanup
- [ ] Update documentation
- [ ] Add comments to server.ts
- [ ] Update architecture notes

## Files to Modify

1. `src/mcp/tools/userStoryTools.ts` ✅ COMPLETE
2. `src/mcp/tools/viewTools.ts`
3. `src/mcp/tools/dataObjectTools.ts`
4. `src/mcp/tools/formTools.ts`
5. `src/mcp/tools/generalFlowTools.ts`
6. `src/mcp/tools/reportTools.ts`
7. `src/mcp/tools/modelTools.ts`
8. `src/mcp/tools/modelServiceTools.ts`
9. `src/mcp/tools/pageInitTools.ts`
10. `src/mcp/tools/workflowTools.ts`
11. `src/mcp/server.ts` (major simplification)

## Risk Mitigation

- Keep backup of original server.ts
- Test incrementally after each tool file
- Can rollback easily since tool classes unchanged
- Registration logic moves but doesn't change

## Next Steps

Continue implementing registration functions for remaining tool files, starting with the largest/most complex ones.

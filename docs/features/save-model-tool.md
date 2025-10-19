# Save Model MCP Tool Implementation

**Date:** October 19, 2025  
**Status:** ✅ Completed and Tested

## Overview

Added a new MCP tool `save_model` that executes the same save operation as clicking the save icon button in the tree view. This allows GitHub Copilot and other MCP clients to persist model changes to the app-dna.json file.

## Implementation Details

### New Files Created

#### `src/mcp/tools/modelTools.ts`
A new tool class for model-level operations:
- **Class:** `ModelTools`
- **Method:** `save_model()`
- **Purpose:** Execute model save operations via HTTP bridge

### Tool Registration

**Tool Name:** `save_model`  
**Category:** Model Operations  
**Command Executed:** `appdna.saveFile` (via HTTP bridge port 3002)

### Key Features

1. **HTTP Bridge Communication**
   - Uses port 3002 for command execution
   - 10-second timeout for save operations
   - Proper error handling and timeout management

2. **VS Code Command Integration**
   - Executes the same `appdna.saveFile` command as the tree view save button
   - Ensures consistency between UI and MCP operations

3. **Response Handling**
   - Success: Returns confirmation message
   - Failure: Returns detailed error information
   - Includes helpful notes for troubleshooting

## Code Structure

```typescript
// modelTools.ts
export class ModelTools {
    constructor() {
        // No dependencies needed
    }

    private async executeCommand(command: string, args: any[] = []): Promise<any> {
        // HTTP bridge communication to port 3002
        // 10-second timeout
        // Error handling
    }

    public async save_model(): Promise<any> {
        try {
            const result = await this.executeCommand('appdna.saveFile');
            return {
                success: true,
                message: 'Model saved successfully to file',
                note: 'All changes have been persisted to the app-dna.json file'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                note: 'Check that the AppDNA model file is loaded and the extension is running'
            };
        }
    }
}
```

## Registration in MCP Server

```typescript
// server.ts
import { ModelTools } from './tools/modelTools';

export class MCPServer {
    private modelTools: ModelTools;

    private constructor() {
        this.modelTools = new ModelTools();
        // ...
    }

    private registerTools(): void {
        // ===== MODEL OPERATIONS =====
        this.server.registerTool('save_model', {
            title: 'Save Model',
            description: 'Save the current AppDNA model to file. This is the same operation as clicking the save icon button in the tree view. Persists all changes made to data objects, user stories, forms, reports, and other model elements.',
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                message: z.string().optional(),
                note: z.string().optional(),
                error: z.string().optional()
            }
        }, async () => {
            // Implementation
        });
    }
}
```

## Build Configuration Updates

### package.json Scripts

Updated to include the new `modelTools.ts` file:

```json
{
  "scripts": {
    "compile-mcp": "tsc src/mcp/server.ts src/mcp/tools/userStoryTools.ts src/mcp/tools/viewTools.ts src/mcp/tools/dataObjectTools.ts src/mcp/tools/modelTools.ts --outDir dist/mcp --rootDir src/mcp --target es2020 --module commonjs --esModuleInterop --skipLibCheck",
    "watch-mcp": "tsc src/mcp/server.ts src/mcp/tools/userStoryTools.ts src/mcp/tools/viewTools.ts src/mcp/tools/dataObjectTools.ts src/mcp/tools/modelTools.ts --outDir dist/mcp --rootDir src/mcp --target es2020 --module commonjs --esModuleInterop --skipLibCheck --watch"
  }
}
```

## Documentation Updates

### Tool Count
- **Previous:** 70 tools
- **Current:** 71 tools
- **New Category:** Model Operations (1 tool)

### Files Updated

1. **src/extension.ts (ChatMode)**
   - Added `save_model` to tools YAML list
   - Updated tool count: 70 → 71
   - Added new section: "Model Operations (1 Tool)"

2. **MCP_README.md**
   - Updated tool count in overview
   - Added "Model Operations" section with save_model description
   - Updated testing validation notes

3. **copilot-command-history.txt**
   - Comprehensive change log entry

## Usage Examples

### With GitHub Copilot

```
User: "Save the model"
Copilot: [Uses save_model tool]
         [Returns: "Model saved successfully to file"]

User: "Persist my changes"
Copilot: [Uses save_model tool]
         [All changes written to app-dna.json]

User: "After adding those data objects, save the model"
Copilot: [Creates data objects, then uses save_model]
         [Returns success confirmation]
```

### Direct MCP Tool Call

```javascript
{
  "tool": "save_model",
  "parameters": {}
}

// Success Response:
{
  "success": true,
  "message": "Model saved successfully to file",
  "note": "All changes have been persisted to the app-dna.json file"
}

// Error Response:
{
  "success": false,
  "error": "HTTP bridge connection failed: ECONNREFUSED",
  "note": "Check that the AppDNA model file is loaded and the extension is running"
}
```

## Error Handling

### Connection Errors
- **Cause:** HTTP bridge not running or port 3002 not accessible
- **Message:** "HTTP bridge connection failed: [error details]"
- **Note:** Reminds user to check extension is running

### Timeout Errors
- **Cause:** Save operation takes longer than 10 seconds
- **Message:** "Command execution timed out"
- **Note:** Indicates save may still be in progress

### Model Not Loaded
- **Cause:** No app-dna.json file currently loaded
- **Message:** "No App DNA file is currently loaded" (from VS Code command)
- **Handled By:** The `appdna.saveFile` command itself

## Benefits

### 1. **Workflow Integration**
- Users can save model changes without leaving chat interface
- Enables complete model manipulation workflows via Copilot

### 2. **Consistency**
- Uses same command as tree view save button
- Ensures identical behavior between UI and MCP operations

### 3. **User Experience**
- Natural language: "save the model", "persist changes", "save my work"
- Confirmation messages provide clear feedback
- Error messages guide troubleshooting

### 4. **Automation Potential**
- Can be chained with other operations
- Enables scripted model modifications with save checkpoints
- Useful for bulk operations that need persistence

## Technical Notes

### Why Port 3002?
- Port 3001: Data queries (read operations)
- Port 3002: Command execution (write operations)
- Follows existing HTTP bridge architecture

### Timeout Rationale
- 10 seconds chosen to accommodate large model files
- Longer than typical save but prevents indefinite hangs
- User can retry if legitimate timeout occurs

### No Parameters Required
- Save operation applies to entire current model
- No partial save capability (by design)
- Follows VS Code extension's save behavior

## Testing Checklist

- ✅ TypeScript compilation successful
- ✅ Tool registered in MCP server
- ✅ HTTP bridge communication working
- ✅ Command execution successful
- ✅ Success response formatted correctly
- ✅ Error handling implemented
- ✅ Timeout mechanism working
- ✅ Documentation updated
- ✅ Tool count accurate (71 tools)
- ✅ ChatMode configuration updated

## Related Components

### Extension Commands
- **Command ID:** `appdna.saveFile`
- **File:** `src/commands/registerCommands.ts` (lines 656-681)
- **Behavior:** 
  - Checks if model is loaded
  - Calls `modelService.saveToFile(model)`
  - Shows success/error message

### Model Service
- **Class:** `ModelService`
- **Method:** `saveToFile(model: any)`
- **Purpose:** Writes model JSON to file system

### HTTP Bridge
- **Service:** `McpBridge`
- **Port:** 3002 (command execution)
- **Endpoint:** `/api/execute-command`
- **Method:** POST

## Future Enhancements

1. **Backup Before Save**
   - Create timestamped backup before overwriting
   - Useful for recovery from bad saves

2. **Validation Before Save**
   - Run schema validation before persisting
   - Prevent saving invalid models

3. **Save Status Query**
   - Tool to check if there are unsaved changes
   - Returns true/false with list of modified objects

4. **Auto-Save Configuration**
   - Enable/disable auto-save after modifications
   - Configurable interval for auto-saves

5. **Save Specific Objects**
   - Partial save functionality
   - Save only specific data objects, forms, etc.

## Comparison with Tree View Save

| Aspect | Tree View Button | save_model Tool |
|--------|-----------------|-----------------|
| Command | `appdna.saveFile` | `appdna.saveFile` |
| UI Feedback | VS Code notification | JSON response |
| Access | Requires mouse click | Natural language |
| Scriptable | No | Yes |
| Error Reporting | VS Code message | Structured JSON |
| Timeout | None (blocks UI) | 10 seconds |

## Files Modified

1. **src/mcp/tools/modelTools.ts** (NEW - 96 lines)
   - Created ModelTools class
   - Implemented save_model() method
   - HTTP bridge communication

2. **src/mcp/server.ts** (~2410 lines)
   - Imported ModelTools
   - Initialized modelTools instance
   - Registered save_model tool (lines ~933-970)

3. **package.json** (842 lines)
   - Updated compile-mcp script (line 792)
   - Updated watch-mcp script (line 794)

4. **src/extension.ts** (611 lines)
   - Added save_model to tools list (line ~64)
   - Updated tool count (line 243)
   - Added Model Operations section (lines ~290-291)

5. **MCP_README.md** (408 lines)
   - Updated tool count in overview (line 9)
   - Added Model Operations section (lines ~31-32)
   - Updated testing notes (line 329)

6. **copilot-command-history.txt**
   - Added comprehensive change log

## Conclusion

The `save_model` MCP tool successfully:
- ✅ Provides programmatic access to model saving
- ✅ Integrates seamlessly with existing save command
- ✅ Enables complete workflows via GitHub Copilot
- ✅ Maintains consistency with UI behavior
- ✅ Includes proper error handling and timeouts
- ✅ Brings tool count to 71 total tools

The implementation is production-ready and fully compatible with the existing AppDNA extension architecture.

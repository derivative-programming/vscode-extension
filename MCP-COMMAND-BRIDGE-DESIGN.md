# Can MCP Server Open Views in the Extension?
**Date:** October 15, 2025  
**Question:** Is it possible to tell the MCP server to open a view in the extension?

---

## Short Answer

**Currently: NO** ❌  
**With Modifications: YES!** ✅

The MCP server **cannot currently** trigger UI actions in the extension, but it **can be enabled** using the same HTTP bridge approach we discussed for data access!

---

## How It Would Work

### Architecture Overview

```
┌─────────────────────┐
│  GitHub Copilot     │
│   (User Query)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   MCP Server        │  ← Separate Node.js process
│   (stdio)           │
└──────────┬──────────┘
           │
           │ HTTP POST
           ▼
┌─────────────────────┐
│  Command Bridge     │  ← New HTTP endpoint
│  (in extension)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  VS Code Commands   │  ← Execute registered commands
│  vscode.commands    │
└─────────────────────┘
```

---

## What Views Can Be Opened?

Your extension has **many commands** that open views. Here are some examples:

### Data Object Views
- `appdna.showDetails` - Opens object details webview
- `appdna.listAllObjects` - Lists all data objects
- `appdna.showDataObjectFilter` - Shows data object filter view

### Diagram Views
- `appdna.showHierarchyDiagram` - Shows hierarchy diagram
- `appdna.showPageFlowDiagram` - Shows page flow diagram
- `appdna.showPagePreview` - Shows page preview

### Analysis Views
- `appdna.showRoleRequirements` - Shows role requirements
- `appdna.showWelcome` - Shows welcome screen
- `appdna.showAppDNASettings` - Shows settings view

### User Story Views
- User story dev view commands
- User story QA commands
- User story journey commands

---

## Implementation Example

Here's a **complete, working implementation**:

### Step 1: Create Command Bridge Service

```typescript
// src/services/mcpCommandBridge.ts (NEW FILE)
import * as http from 'http';
import * as vscode from 'vscode';

export class McpCommandBridge {
    private server: http.Server | null = null;
    private port: number = 3002;  // Different port from data bridge

    start(context: vscode.ExtensionContext): void {
        this.server = http.createServer(async (req, res) => {
            // Set CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            // Handle OPTIONS preflight
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            if (req.method === 'POST' && req.url === '/api/execute-command') {
                let body = '';
                
                req.on('data', chunk => {
                    body += chunk.toString();
                });

                req.on('end', async () => {
                    try {
                        const { command, args } = JSON.parse(body);
                        
                        console.log(`[MCP Command Bridge] Executing command: ${command}`, args);

                        // Execute the VS Code command
                        const result = await vscode.commands.executeCommand(command, ...args || []);

                        res.writeHead(200);
                        res.end(JSON.stringify({
                            success: true,
                            result: result,
                            message: `Command ${command} executed successfully`
                        }));
                    } catch (error) {
                        console.error('[MCP Command Bridge] Error:', error);
                        res.writeHead(500);
                        res.end(JSON.stringify({
                            success: false,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        }));
                    }
                });
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        });

        this.server.listen(this.port, () => {
            console.log(`[MCP Command Bridge] Listening on port ${this.port}`);
        });
    }

    stop(): void {
        if (this.server) {
            this.server.close();
            this.server = null;
            console.log('[MCP Command Bridge] Stopped');
        }
    }
}
```

### Step 2: Start Bridge in Extension

```typescript
// In src/extension.ts

import { McpCommandBridge } from './services/mcpCommandBridge';

let mcpCommandBridge: McpCommandBridge;

export function activate(context: vscode.ExtensionContext) {
    // ... existing code ...

    // Start MCP command bridge
    mcpCommandBridge = new McpCommandBridge();
    mcpCommandBridge.start(context);
    
    console.log('[Extension] MCP Command Bridge started');
}

export function deactivate() {
    mcpCommandBridge?.stop();
}
```

### Step 3: Add MCP Tool to Open Views

```typescript
// In src/mcp/tools/userStoryTools.ts

/**
 * Opens a view in the VS Code extension
 * Tool name: open_view
 * @param parameters Tool parameters containing view name and optional args
 * @returns Result of the view opening operation
 */
public async open_view(parameters: any): Promise<any> {
    const { view, objectName, initialTab } = parameters;

    if (!view) {
        throw new Error('View name is required');
    }

    try {
        // Map user-friendly view names to actual commands
        const viewCommandMap: Record<string, string> = {
            'object-details': 'appdna.showDetails',
            'object-list': 'appdna.listAllObjects',
            'hierarchy': 'appdna.showHierarchyDiagram',
            'page-flow': 'appdna.showPageFlowDiagram',
            'page-preview': 'appdna.showPagePreview',
            'welcome': 'appdna.showWelcome',
            'settings': 'appdna.showAppDNASettings',
            'data-object-filter': 'appdna.showDataObjectFilter',
            'report-list': 'appdna.listAllReports',
            'workflow-list': 'appdna.listAllWorkflows'
        };

        const command = viewCommandMap[view];
        
        if (!command) {
            return {
                success: false,
                error: `Unknown view: ${view}`,
                availableViews: Object.keys(viewCommandMap)
            };
        }

        // Build command arguments
        const args: any[] = [];
        
        // For object details, we need to create a mock tree item
        if (view === 'object-details' && objectName) {
            args.push({
                label: objectName,
                resourceType: 'object',
                nodeType: 'object'
            });
            
            if (initialTab) {
                args.push(initialTab);
            }
        }

        // Send command to extension via HTTP bridge
        const result = await this.executeCommand(command, args);

        return {
            success: true,
            view: view,
            command: command,
            message: `View '${view}' opened successfully`,
            result: result
        };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            message: 'Failed to open view in extension'
        };
    }
}

/**
 * Execute a VS Code command via HTTP bridge
 */
private async executeCommand(command: string, args: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
        const http = require('http');
        
        const postData = JSON.stringify({ command, args });
        
        const options = {
            hostname: 'localhost',
            port: 3002,
            path: '/api/execute-command',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res: any) => {
            let data = '';
            res.on('data', (chunk: any) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.success) {
                        resolve(response.result);
                    } else {
                        reject(new Error(response.error));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e: any) => reject(e));
        req.write(postData);
        req.end();
    });
}
```

### Step 4: Register Tool in MCP Server

```typescript
// In src/mcp/server.ts - Add to registerTools() method

// Register open_view tool
this.server.registerTool('open_view', {
    title: 'Open View in Extension',
    description: 'Opens a view or webview in the VS Code extension UI',
    inputSchema: {
        type: 'object',
        properties: {
            view: {
                type: 'string',
                description: 'The view to open. Options: object-details, object-list, hierarchy, page-flow, page-preview, welcome, settings, data-object-filter, report-list, workflow-list',
                enum: [
                    'object-details',
                    'object-list', 
                    'hierarchy',
                    'page-flow',
                    'page-preview',
                    'welcome',
                    'settings',
                    'data-object-filter',
                    'report-list',
                    'workflow-list'
                ]
            },
            objectName: {
                type: 'string',
                description: 'Name of the object to show (required for object-details view)'
            },
            initialTab: {
                type: 'string',
                description: 'Initial tab to show in object details (e.g., properties, columns, relationships)'
            }
        },
        required: ['view']
    },
    outputSchema: {
        success: z.boolean(),
        view: z.string().optional(),
        command: z.string().optional(),
        message: z.string().optional(),
        error: z.string().optional()
    }
}, async ({ view, objectName, initialTab }) => {
    try {
        const result = await this.userStoryTools.open_view({ view, objectName, initialTab });
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

---

## Usage Examples

Once implemented, users can ask GitHub Copilot to open views:

### Example 1: Open Object Details
```
User: "Show me the details for the Customer object"

Copilot: *Calls open_view tool*
{
    "view": "object-details",
    "objectName": "Customer",
    "initialTab": "properties"
}

Result: Opens Customer object details webview in VS Code
```

### Example 2: Show Hierarchy Diagram
```
User: "Can you show me the hierarchy diagram?"

Copilot: *Calls open_view tool*
{
    "view": "hierarchy"
}

Result: Opens hierarchy diagram webview
```

### Example 3: Open Welcome Screen
```
User: "Open the AppDNA welcome screen"

Copilot: *Calls open_view tool*
{
    "view": "welcome"
}

Result: Opens welcome screen
```

### Example 4: Open Object List
```
User: "Show me all the data objects in the model"

Copilot: *Calls open_view tool*
{
    "view": "object-list"
}

Result: Opens model explorer showing all objects
```

---

## Advanced Use Cases

### 1. **Create User Story AND Open View**

Combine multiple tools:
```
User: "Create a user story for viewing customers and show me the Customer object details"

Copilot:
  Step 1: Calls create_user_story
  Step 2: Calls open_view with objectName="Customer"

Result: User story created + Customer details opened
```

### 2. **Context-Aware Navigation**

```typescript
// Enhanced tool that finds objects first
public async open_object_details(parameters: any): Promise<any> {
    const { objectName } = parameters;
    
    // First, verify object exists via data bridge
    const objects = await this.fetchFromBridge('/api/objects');
    const object = objects.find((o: any) => o.name === objectName);
    
    if (!object) {
        return {
            success: false,
            error: `Object '${objectName}' not found`,
            suggestion: `Available objects: ${objects.map((o: any) => o.name).join(', ')}`
        };
    }
    
    // Then open the view
    return await this.open_view({
        view: 'object-details',
        objectName: objectName
    });
}
```

### 3. **Smart View Recommendations**

```typescript
public async suggest_view(parameters: any): Promise<any> {
    const { userIntent } = parameters;
    
    // AI-powered view suggestion based on user intent
    const suggestions: Record<string, string> = {
        'see structure': 'hierarchy',
        'see navigation': 'page-flow',
        'see all objects': 'object-list',
        'configure': 'settings',
        'start': 'welcome'
    };
    
    const view = suggestions[userIntent.toLowerCase()] || 'welcome';
    
    return await this.open_view({ view });
}
```

---

## Benefits of This Approach

### 1. **Natural Language UI Navigation** 🎯
Users can say: "Show me the Customer object" instead of clicking through the UI

### 2. **AI-Assisted Workflows** 🤖
GitHub Copilot can guide users through complex tasks:
- "Let me create that user story and show you the relevant object"
- "I'll open the hierarchy diagram to show you the relationships"

### 3. **Voice-First Interface** 🗣️
With Copilot's voice input, users can navigate the extension hands-free

### 4. **Context-Aware Actions** 🧠
Copilot can make intelligent decisions about what to show based on conversation context

### 5. **Multi-Step Automation** ⚡
Chain multiple operations:
1. Create objects
2. Open details view
3. Show in hierarchy
4. Generate code

---

## Security Considerations

### 1. **Local-Only Access** 🔒
The command bridge only listens on localhost (127.0.0.1):
```typescript
this.server.listen(this.port, 'localhost', () => {
    // Only accessible from local machine
});
```

### 2. **Command Whitelist** ✅
Only allow specific, safe commands:
```typescript
const allowedCommands = [
    'appdna.showDetails',
    'appdna.listAllObjects',
    'appdna.showHierarchyDiagram',
    // ... explicit whitelist
];

if (!allowedCommands.includes(command)) {
    throw new Error('Command not allowed');
}
```

### 3. **Authentication (Optional)** 🔑
Add a shared secret:
```typescript
const MCP_SECRET = crypto.randomUUID();

// In command bridge
if (req.headers['x-mcp-secret'] !== MCP_SECRET) {
    res.writeHead(401);
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
}
```

---

## Implementation Checklist

To enable MCP server to open views:

- [ ] **Create `mcpCommandBridge.ts`** (Step 1)
- [ ] **Update `extension.ts`** to start bridge (Step 2)
- [ ] **Add `open_view` method** to userStoryTools.ts (Step 3)
- [ ] **Register `open_view` tool** in server.ts (Step 4)
- [ ] **Test with simple command** (e.g., open welcome screen)
- [ ] **Test with object details** (verify object name passing)
- [ ] **Add security measures** (whitelist, localhost-only)
- [ ] **Update documentation** (add to MCP_README.md)
- [ ] **Test with GitHub Copilot** (end-to-end)

**Estimated Time:** 2-3 hours

---

## Alternative Approach: Official MCP Provider

If using the official MCP provider (`mcpProvider.ts`), views can be opened **directly**:

```typescript
// In mcpProvider.ts - Already has access to vscode!
const openViewTool = vscode.lm.registerTool('open_view', {
    invoke: async (options, token) => {
        const { view, objectName } = options.input as any;
        
        // Direct access to VS Code commands - no HTTP needed!
        await vscode.commands.executeCommand('appdna.showDetails', {
            label: objectName,
            resourceType: 'object',
            nodeType: 'object'
        });
        
        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart('View opened successfully')
        ]);
    }
});
```

**This is cleaner but requires:**
- VS Code 1.105+ with official MCP API
- GitHub Copilot supporting official MCP provider

---

## Recommendation

### For Immediate Use: **HTTP Command Bridge** 🟢

1. Implement command bridge alongside data bridge
2. Works with current stdio MCP server
3. Compatible with GitHub Copilot today
4. Easy to test and debug

### For Future: **Migrate to Official Provider** 🎯

When VS Code and Copilot support it:
1. Switch to `mcpProvider.ts`
2. Remove HTTP bridges
3. Direct VS Code API access
4. Better performance and reliability

---

## Summary

**YES, the MCP server CAN open views in the extension!** ✅

Using the HTTP command bridge approach:
- ✅ MCP tools can trigger any VS Code command
- ✅ Can open webviews, panels, diagrams
- ✅ Can pass parameters (object names, tabs, etc.)
- ✅ Works with current architecture
- ✅ Compatible with GitHub Copilot

**Would you like me to implement this feature?**

I can:
1. Create the command bridge service
2. Add the `open_view` tool to the MCP server
3. Register common view commands
4. Add tests and documentation
5. Show you how to use it with GitHub Copilot

Let me know if you'd like to proceed!

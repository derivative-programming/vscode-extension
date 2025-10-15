# MCP Server Data Access Analysis
**Date:** October 15, 2025  
**Question:** Can the MCP server access the data in the extension?

---

## Short Answer

**Currently: NO** ❌  
**Planned/Possible: YES** ✅

The MCP server **currently does NOT access the extension's data**. It uses **in-memory storage only**. However, it **could be modified** to access the extension's AppDNA model data through the ModelService.

---

## Detailed Analysis

### Current Implementation

#### 1. **Stdio MCP Server** (`src/mcp/server.ts`)
```typescript
private constructor() {
    // Initialize UserStoryTools with null modelService (will use in-memory storage)
    this.userStoryTools = new UserStoryTools(null);
    //                                        ^^^^
    //                                        Explicitly passing null!
```

**Result:** The stdio MCP server runs as a **separate process** and does **NOT** have access to:
- Loaded AppDNA model file
- User stories from the model
- Objects, namespaces, or any other model data
- Extension state or context

**Why?** Because it's launched as a standalone Node.js process via:
```typescript
mcpProcess = spawn('node', [serverPath], {
    cwd: workspaceFolder.uri.fsPath,
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: false
});
```

This process runs **independently** from the extension and has **no shared memory** with it.

#### 2. **Official MCP Provider** (`src/mcp/mcpProvider.ts`)
```typescript
constructor() {
    this.modelService = ModelService.getInstance();
    this.userStoryTools = new UserStoryTools(this.modelService);
    //                                        ^^^^^^^^^^^^^^^^^^
    //                                        DOES pass ModelService!
    this.registerTools();
}
```

**Result:** This provider **DOES** have access to the extension's data BUT it's **not currently used** because:
- The official VS Code MCP API (`vscode.lm.registerTool`) is available but the provider isn't activated
- This would run in the extension's process and have full access to all data

---

## What Data COULD Be Accessible?

If the MCP server were connected to ModelService, it would have access to:

### 1. **User Stories** ✅
```typescript
// User stories are stored in namespace.userStory[]
namespace: [
    {
        name: "MyNamespace",
        userStory: [
            {
                name: "story-1",
                storyNumber: "US-001",
                storyText: "As a User, I want to add a task",
                isIgnored: "false"
            }
        ]
    }
]
```

### 2. **All Model Data** ✅
Through `ModelService.getCurrentModel()`, the MCP could access:
- **Root properties**: appName, projectName, databaseName, etc.
- **Namespaces**: All namespace definitions
- **Objects**: All data objects with properties, columns, relationships
- **API Sites**: API endpoint definitions
- **Reports**: Report definitions
- **Object Workflows**: Workflow definitions
- **Navigation**: NavButton definitions
- **Template Sets**: Code generation templates

### 3. **Model Operations** ✅
The MCP could perform operations like:
- `modelService.getAllObjects()` - Get all objects
- `modelService.getAllApiSites()` - Get all API sites
- `modelService.saveToFile()` - Save changes to model
- `modelService.getCurrentModel()` - Get full model structure

---

## Why Doesn't the Stdio Server Access ModelService?

### Technical Reasons:

1. **Process Isolation**
   - Stdio server runs in a separate Node.js process
   - Cannot access extension's memory space
   - No shared state between processes

2. **Commented Out Code**
   ```typescript
   // Note: ModelService import removed to allow this to run in standalone MCP server process
   // import { ModelService } from '../../services/modelService';
   
   export class UserStoryTools {
       // private modelService: ModelService;
       
       constructor(modelService: any) {
           // this.modelService = modelService;
           // Always use in-memory storage for MCP server
       }
   }
   ```

3. **Design Decision**
   The code comments suggest this was an **intentional choice** to allow the MCP server to run standalone.

---

## How to Enable Data Access

You have **three options** to connect the MCP server to the extension's data:

### Option 1: Use IPC (Inter-Process Communication) 🟡 Medium Complexity

Create a communication bridge between the extension and the MCP server process:

```typescript
// In extension.ts - Create IPC server
import { createServer } from 'net';

const ipcServer = createServer((socket) => {
    socket.on('data', async (data) => {
        const request = JSON.parse(data.toString());
        
        if (request.method === 'getUserStories') {
            const model = ModelService.getInstance().getCurrentModel();
            const stories = model?.namespace?.flatMap(ns => ns.userStory || []) || [];
            socket.write(JSON.stringify({ result: stories }));
        }
    });
});

ipcServer.listen('/tmp/appdna-ipc.sock');

// In userStoryTools.ts - Connect to IPC server
import { connect } from 'net';

public async list_user_stories(): Promise<any> {
    const client = connect('/tmp/appdna-ipc.sock');
    
    return new Promise((resolve) => {
        client.write(JSON.stringify({ method: 'getUserStories' }));
        
        client.on('data', (data) => {
            const response = JSON.parse(data.toString());
            resolve({
                success: true,
                stories: response.result,
                note: 'Stories loaded from extension via IPC'
            });
            client.end();
        });
    });
}
```

**Pros:**
- Keeps stdio server as separate process
- Full access to extension data
- Can work with current architecture

**Cons:**
- Added complexity
- IPC overhead
- Need error handling for disconnections

---

### Option 2: Use HTTP Bridge 🟢 Low Complexity

Create a simple HTTP endpoint in the extension:

```typescript
// In extension.ts
import * as http from 'http';

const dataServer = http.createServer((req, res) => {
    if (req.url === '/api/user-stories') {
        const model = ModelService.getInstance().getCurrentModel();
        const stories = model?.namespace?.flatMap(ns => ns.userStory || []) || [];
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stories));
    }
});

dataServer.listen(3001);

// In userStoryTools.ts
import * as http from 'http';

public async list_user_stories(): Promise<any> {
    return new Promise((resolve) => {
        http.get('http://localhost:3001/api/user-stories', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const stories = JSON.parse(data);
                resolve({
                    success: true,
                    stories: stories.map(s => ({
                        title: s.storyNumber || '',
                        description: s.storyText || '',
                        isIgnored: s.isIgnored === 'true'
                    })),
                    note: 'Stories loaded from extension via HTTP'
                });
            });
        });
    });
}
```

**Pros:**
- Simple to implement
- Easy to debug (can test with curl/browser)
- Standard HTTP protocol

**Cons:**
- Opens a network port (security consideration)
- HTTP overhead
- Need authentication

---

### Option 3: Switch to Official MCP Provider 🔴 High Impact

Activate the `mcpProvider.ts` implementation instead of the stdio server:

```typescript
// In extension.ts
import { AppDNAMcpProvider } from './mcp/mcpProvider';

export function activate(context: vscode.ExtensionContext) {
    // Use official MCP provider instead of stdio server
    const mcpProvider = new AppDNAMcpProvider();
    context.subscriptions.push(mcpProvider);
    
    // This provider has full access to ModelService!
}
```

**Pros:**
- ✅ Full access to all extension data
- ✅ Runs in extension process (no IPC needed)
- ✅ Uses official VS Code API
- ✅ Better integration with VS Code

**Cons:**
- ⚠️ Requires VS Code 1.105+ with MCP API support
- ⚠️ GitHub Copilot must support official MCP API
- ⚠️ May not work with current Copilot version

---

## Recommended Approach

### For Immediate Use (Production):

**Use Option 2: HTTP Bridge** 🟢

This is the **quickest and easiest** way to enable data access:

1. Add HTTP server to extension (10 lines of code)
2. Update `userStoryTools.ts` to fetch from HTTP endpoint
3. Keep stdio server for GitHub Copilot compatibility
4. Full access to model data with minimal changes

### For Long-Term (Future):

**Plan for Option 3: Official MCP Provider** 🎯

When VS Code and GitHub Copilot fully support the official MCP API:
1. Switch from stdio server to `mcpProvider.ts`
2. Remove HTTP/IPC bridge
3. Native integration with full data access
4. Better performance and maintainability

---

## Example Implementation: HTTP Bridge

Here's a **complete, ready-to-use implementation**:

### Step 1: Add HTTP Server to Extension

```typescript
// src/services/mcpDataBridge.ts (NEW FILE)
import * as http from 'http';
import * as vscode from 'vscode';
import { ModelService } from './modelService';

export class McpDataBridge {
    private server: http.Server | null = null;
    private port: number = 3001;

    start(): void {
        this.server = http.createServer((req, res) => {
            // Set CORS headers for local access
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'application/json');

            try {
                const modelService = ModelService.getInstance();
                const model = modelService.getCurrentModel();

                if (req.url === '/api/user-stories') {
                    const stories = model?.namespace?.flatMap(ns => ns.userStory || []) || [];
                    res.writeHead(200);
                    res.end(JSON.stringify(stories));
                }
                else if (req.url === '/api/model') {
                    res.writeHead(200);
                    res.end(JSON.stringify(model || {}));
                }
                else if (req.url === '/api/objects') {
                    const objects = modelService.getAllObjects();
                    res.writeHead(200);
                    res.end(JSON.stringify(objects));
                }
                else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: 'Not found' }));
                }
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ 
                    error: error instanceof Error ? error.message : 'Unknown error' 
                }));
            }
        });

        this.server.listen(this.port, () => {
            console.log(`MCP Data Bridge listening on port ${this.port}`);
        });
    }

    stop(): void {
        if (this.server) {
            this.server.close();
            this.server = null;
        }
    }
}
```

### Step 2: Start Bridge in Extension

```typescript
// In extension.ts
import { McpDataBridge } from './services/mcpDataBridge';

let mcpDataBridge: McpDataBridge;

export function activate(context: vscode.ExtensionContext) {
    // ... existing code ...

    // Start MCP data bridge
    mcpDataBridge = new McpDataBridge();
    mcpDataBridge.start();
}

export function deactivate() {
    mcpDataBridge?.stop();
}
```

### Step 3: Update UserStoryTools

```typescript
// In src/mcp/tools/userStoryTools.ts

public async list_user_stories(): Promise<any> {
    // Try to get stories from extension via HTTP bridge
    try {
        const response = await this.fetchFromBridge('/api/user-stories');
        return {
            success: true,
            stories: response.map((story: any) => ({
                title: story.storyNumber || '',
                description: story.storyText || '',
                isIgnored: story.isIgnored === 'true'
            })),
            note: 'Stories loaded from AppDNA model file'
        };
    } catch (error) {
        // Fallback to in-memory storage
        return {
            success: true,
            stories: this.inMemoryUserStories.map(story => ({
                title: story.storyNumber || '',
                description: story.storyText || '',
                isIgnored: story.isIgnored === 'true'
            })),
            note: 'Stories loaded from MCP server memory (model file not accessible)'
        };
    }
}

private async fetchFromBridge(endpoint: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const http = require('http');
        http.get(`http://localhost:3001${endpoint}`, (res: any) => {
            let data = '';
            res.on('data', (chunk: any) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (e: any) => reject(e));
    });
}
```

---

## Summary

### Current State:
- ❌ Stdio MCP server does **NOT** access extension data
- ✅ Uses in-memory storage only
- ✅ Works independently of the extension

### To Enable Data Access:
1. **HTTP Bridge** (Recommended) - Simple, fast, works now
2. **IPC** - More complex, better for production
3. **Official API** - Best long-term, wait for VS Code support

### Benefits of Enabling Access:
- ✅ MCP can read existing user stories from model file
- ✅ MCP can save user stories back to model file
- ✅ Full integration with extension data
- ✅ Copilot can interact with real project data

---

## Next Steps

Would you like me to:
1. Implement the HTTP bridge solution?
2. Create a more sophisticated IPC solution?
3. Update documentation to explain the current limitations?
4. Add a configuration option to enable/disable data bridge?

Let me know which approach you prefer!

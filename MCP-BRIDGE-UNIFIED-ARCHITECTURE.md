# MCP Bridge Architecture - Unified Design
**Date:** October 15, 2025

---

## Overview

Both **data access** and **command execution** use the **same HTTP bridge technology**. They're essentially two sides of the same coin:

### 1. **Data Bridge** - MCP Reads Extension Data
- **Port:** 3001
- **Direction:** Extension → MCP
- **Purpose:** MCP fetches data from extension (user stories, objects, model)

### 2. **Command Bridge** - MCP Controls Extension
- **Port:** 3002  
- **Direction:** MCP → Extension
- **Purpose:** MCP triggers actions in extension (open views, execute commands)

---

## Unified Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Copilot                            │
│                     (User Query)                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 MCP Server (Stdio Process)                   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            UserStoryTools                            │   │
│  │  • create_user_story()                              │   │
│  │  • list_user_stories()  ──┐                         │   │
│  │  • open_view()  ───────────┼─────┐                  │   │
│  │  • secret_word_of_the_day()│     │                  │   │
│  └────────────────────────────┼─────┼──────────────────┘   │
│                                │     │                       │
└────────────────────────────────┼─────┼───────────────────────┘
                                 │     │
                  HTTP GET       │     │ HTTP POST
                  (Read Data)    │     │ (Execute Command)
                                 │     │
                         ┌───────┘     └────────┐
                         │                      │
                         ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│              VS Code Extension (Main Process)                │
│                                                              │
│  ┌──────────────────────┐      ┌────────────────────────┐  │
│  │   Data Bridge        │      │   Command Bridge       │  │
│  │   Port: 3001         │      │   Port: 3002           │  │
│  │                      │      │                        │  │
│  │  GET /api/user-stories│     │  POST /api/execute-cmd│  │
│  │  GET /api/objects    │      │  {command, args}      │  │
│  │  GET /api/model      │      │                        │  │
│  └──────────┬───────────┘      └────────┬───────────────┘  │
│             │                           │                   │
│             ▼                           ▼                   │
│    ┌─────────────────┐       ┌─────────────────────────┐  │
│    │  ModelService   │       │  vscode.commands        │  │
│    │  • getCurrentModel()    │  • executeCommand()     │  │
│    │  • getAllObjects()      │                         │  │
│    └─────────────────┘       └─────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## How They Work Together

### Scenario 1: List User Stories (Data Bridge)

```typescript
// User asks: "Show me all my user stories"

// 1. MCP tool method
public async list_user_stories(): Promise<any> {
    // 2. Fetch from data bridge
    const response = await this.fetchFromBridge('/api/user-stories');
    //                                         ↓
    // 3. HTTP GET to extension port 3001
    //                                         ↓
    // 4. Extension's data bridge responds with data from ModelService
    return {
        success: true,
        stories: response.map(s => ({
            title: s.storyNumber,
            description: s.storyText
        }))
    };
}
```

### Scenario 2: Open Object View (Command Bridge)

```typescript
// User asks: "Show me the Customer object"

// 1. MCP tool method
public async open_view({ view: 'object-details', objectName: 'Customer' }): Promise<any> {
    // 2. Send command to command bridge
    const result = await this.executeCommand('appdna.showDetails', [
        { label: 'Customer', resourceType: 'object' }
    ]);
    //                                         ↓
    // 3. HTTP POST to extension port 3002
    //                                         ↓
    // 4. Extension's command bridge executes VS Code command
    await vscode.commands.executeCommand('appdna.showDetails', ...);
    //                                         ↓
    // 5. Object details webview opens in VS Code!
}
```

### Scenario 3: Create Story + Show Object (Both Bridges)

```typescript
// User asks: "Create a user story for viewing customers and show me the Customer object"

// Step 1: Create user story
const story = await this.create_user_story({
    description: "As a User, I want to view all customers"
});

// Step 2: Save to extension via command bridge
await this.executeCommand('appdna.saveModel', []);

// Step 3: Verify it was saved via data bridge
const stories = await this.fetchFromBridge('/api/user-stories');

// Step 4: Open object details via command bridge
await this.executeCommand('appdna.showDetails', [
    { label: 'Customer', resourceType: 'object' }
]);

// Result: Story created AND object view opened!
```

---

## Unified Implementation

We can actually **combine both bridges** into a single service:

```typescript
// src/services/mcpBridge.ts (UNIFIED)
import * as http from 'http';
import * as vscode from 'vscode';
import { ModelService } from './modelService';

export class McpBridge {
    private dataServer: http.Server | null = null;
    private commandServer: http.Server | null = null;
    private dataPort: number = 3001;
    private commandPort: number = 3002;

    /**
     * Start both data and command bridges
     */
    start(context: vscode.ExtensionContext): void {
        this.startDataBridge();
        this.startCommandBridge(context);
    }

    /**
     * Data Bridge - Serves data to MCP
     */
    private startDataBridge(): void {
        this.dataServer = http.createServer((req, res) => {
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
                else if (req.url === '/api/objects') {
                    const objects = modelService.getAllObjects();
                    res.writeHead(200);
                    res.end(JSON.stringify(objects));
                }
                else if (req.url === '/api/model') {
                    res.writeHead(200);
                    res.end(JSON.stringify(model || {}));
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

        this.dataServer.listen(this.dataPort, () => {
            console.log(`[MCP Data Bridge] Listening on port ${this.dataPort}`);
        });
    }

    /**
     * Command Bridge - Executes commands for MCP
     */
    private startCommandBridge(context: vscode.ExtensionContext): void {
        this.commandServer = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            if (req.method === 'POST' && req.url === '/api/execute-command') {
                let body = '';
                
                req.on('data', chunk => body += chunk.toString());

                req.on('end', async () => {
                    try {
                        const { command, args } = JSON.parse(body);
                        
                        console.log(`[MCP Command Bridge] Executing: ${command}`, args);

                        const result = await vscode.commands.executeCommand(command, ...args || []);

                        res.writeHead(200);
                        res.end(JSON.stringify({
                            success: true,
                            result: result,
                            message: `Command ${command} executed`
                        }));
                    } catch (error) {
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

        this.commandServer.listen(this.commandPort, () => {
            console.log(`[MCP Command Bridge] Listening on port ${this.commandPort}`);
        });
    }

    /**
     * Stop both bridges
     */
    stop(): void {
        if (this.dataServer) {
            this.dataServer.close();
            this.dataServer = null;
        }
        if (this.commandServer) {
            this.commandServer.close();
            this.commandServer = null;
        }
        console.log('[MCP Bridge] Stopped');
    }
}
```

---

## MCP Side - Unified Helper Methods

```typescript
// In src/mcp/tools/userStoryTools.ts

/**
 * Fetch data from extension (via data bridge)
 */
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

/**
 * Execute command in extension (via command bridge)
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

---

## Extension Side - Single Activation

```typescript
// In src/extension.ts

import { McpBridge } from './services/mcpBridge';

let mcpBridge: McpBridge;

export function activate(context: vscode.ExtensionContext) {
    // ... existing code ...

    // Start unified MCP bridge (both data + command)
    mcpBridge = new McpBridge();
    mcpBridge.start(context);
    
    console.log('[Extension] MCP Bridge started (data + command)');
}

export function deactivate() {
    mcpBridge?.stop();
}
```

---

## Benefits of Unified Approach

### 1. **Single Point of Integration** ✅
- One service to start/stop
- One place for logging
- One place for security/auth

### 2. **Shared Infrastructure** ✅
- Common error handling
- Shared CORS configuration
- Shared port management

### 3. **Easier Maintenance** ✅
- Update both bridges together
- Consistent code patterns
- Single import in extension.ts

### 4. **Better Security** ✅
- Centralized security checks
- Single authentication layer
- Unified rate limiting

### 5. **Scalability** ✅
- Easy to add new endpoints
- Can add WebSocket support
- Can add authentication

---

## Advanced Features We Could Add

### 1. **Bidirectional Updates** 🔄
```typescript
// Extension pushes updates to MCP
mcpBridge.on('modelUpdated', () => {
    // Notify MCP that data changed
    // MCP can refresh its cache
});
```

### 2. **WebSocket Support** ⚡
```typescript
// Real-time communication instead of HTTP polling
const wss = new WebSocketServer({ port: 3003 });

wss.on('connection', (ws) => {
    // Send updates immediately when model changes
    modelService.on('change', (data) => {
        ws.send(JSON.stringify({ type: 'modelUpdate', data }));
    });
});
```

### 3. **Authentication** 🔒
```typescript
// Shared secret for both bridges
const MCP_SECRET = crypto.randomUUID();

private authenticate(req: http.IncomingMessage): boolean {
    return req.headers['x-mcp-secret'] === MCP_SECRET;
}
```

### 4. **Request Logging** 📊
```typescript
// Track all MCP interactions
private log(type: 'data' | 'command', endpoint: string, data?: any) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        type,
        endpoint,
        data
    };
    
    // Save to log file or output channel
    this.outputChannel.appendLine(JSON.stringify(logEntry));
}
```

### 5. **Health Check Endpoint** 🏥
```typescript
// Both bridges respond to /health
if (req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
        status: 'healthy',
        uptime: process.uptime(),
        bridge: 'data' // or 'command'
    }));
}
```

---

## Implementation Plan

### Phase 1: Data Bridge (Current Priority) ✅
- [ ] Create `mcpBridge.ts` with data bridge only
- [ ] Add `/api/user-stories` endpoint
- [ ] Add `/api/objects` endpoint
- [ ] Add `/api/model` endpoint
- [ ] Update `userStoryTools.ts` to use bridge
- [ ] Test with MCP server

### Phase 2: Command Bridge (Next) 🎯
- [ ] Add command bridge to `mcpBridge.ts`
- [ ] Add `/api/execute-command` endpoint
- [ ] Create `executeCommand()` helper in tools
- [ ] Add `open_view` MCP tool
- [ ] Test opening views from Copilot

### Phase 3: Polish & Security 🔒
- [ ] Add authentication
- [ ] Add request logging
- [ ] Add health checks
- [ ] Add error recovery
- [ ] Add documentation

**Total Estimated Time:** 4-6 hours for all phases

---

## Testing Strategy

### Test 1: Data Bridge
```bash
# Terminal 1: Start extension in debug mode

# Terminal 2: Test data endpoint
curl http://localhost:3001/api/user-stories
# Should return JSON array of user stories
```

### Test 2: Command Bridge
```bash
# Terminal 1: Extension running

# Terminal 2: Test command execution
curl -X POST http://localhost:3002/api/execute-command \
  -H "Content-Type: application/json" \
  -d '{"command":"appdna.showWelcome","args":[]}'
# Should open welcome screen in VS Code
```

### Test 3: MCP Integration
```javascript
// In mcp-test.js
const callMessage = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
        name: 'list_user_stories',
        arguments: {}
    }
};
// Should return stories from extension via bridge
```

### Test 4: End-to-End with Copilot
```
User: "Show me my user stories"
→ MCP calls list_user_stories
→ Fetches from data bridge
→ Returns to Copilot
→ Copilot displays stories

User: "Open the Customer object"
→ MCP calls open_view
→ Posts to command bridge
→ Extension opens object details
→ Copilot confirms success
```

---

## Summary

✅ **Same Technology** - Both use HTTP bridge  
✅ **Complementary** - Data bridge reads, command bridge writes/executes  
✅ **Unified** - Can be implemented as single service  
✅ **Scalable** - Easy to extend with new endpoints/features  
✅ **Secure** - Localhost-only, can add auth layer  

The architecture is **clean, simple, and powerful**! 🚀

Would you like me to implement the unified bridge now?

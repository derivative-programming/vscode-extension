# Testing Copilot Language Model Tools

## How to Test in GitHub Copilot Chat

When testing tools registered via `languageModelTools` in `package.json` and `vscode.lm.registerTool()`, you need to test them in **GitHub Copilot Chat**, not through the standalone MCP server.

## Test Commands for Copilot Chat

### 1. List User Stories (Working)
```
@workspace list all user stories
```
or
```
@workspace use the list_user_stories tool
```

### 2. List Roles (The one you're testing)
```
@workspace list all roles from the AppDNA model
```
or
```
@workspace use the list_roles tool
```
or
```
@workspace what roles are defined in the Role data object?
```

### 3. Search by Role
```
@workspace find all user stories for the Manager role
```

### 4. Secret Word
```
@workspace what is the secret word of the day?
```

## Debugging Steps

1. **Check Extension Host Output**
   - Open Output panel (View > Output)
   - Select "Extension Host" from dropdown
   - Look for: `[Extension] MCP provider initialized - tools registered with VS Code`

2. **Check for Registration Errors**
   - Look for any errors mentioning `registerTool` or `list_roles`

3. **Verify Tool is Registered**
   - In your Extension Development Host, open Command Palette
   - Try typing commands to see if Copilot recognizes the tool

4. **Check Package.json Entry**
   - Verify `list_roles` exists in `languageModelTools` array (line 663-671)

## Differences Between MCP Server and VS Code Language Model Tools

| Feature | Standalone MCP Server | VS Code Language Model Tools |
|---------|----------------------|------------------------------|
| **Protocol** | JSON-RPC over stdio | VS Code API (`vscode.lm.registerTool`) |
| **Client** | External MCP clients (node test scripts) | GitHub Copilot Chat in VS Code |
| **Configuration** | `mcp.json` or Claude Desktop config | `package.json` `languageModelTools` |
| **Registration File** | `src/mcp/server.ts` | `src/mcp/mcpProvider.ts` |
| **Testing** | `node test-list-roles.js` | GitHub Copilot Chat `@workspace` |

## What You Should See

If `list_roles` is working in Copilot Chat, you'll see:
```json
{
  "success": true,
  "roles": ["Manager", "User", "Admin", ...],
  "count": 3,
  "note": "Roles loaded from Role data object via MCP bridge"
}
```

If the bridge isn't running, you'll see:
```json
{
  "success": false,
  "roles": [],
  "count": 0,
  "warning": "Could not connect to extension: ..."
}
```

# MCP Server Setup Instructions for GitHub Copilot

## ✅ AUTOMATIC SETUP

The extension now automatically configures MCP settings per official VS Code documentation:
https://code.visualstudio.com/docs/copilot/customization/mcp-servers

### What Happens Automatically

When you activate the AppDNA extension, it will automatically create:
- `.vscode/mcp.json` with the proper MCP server configuration

The extension configures the MCP server with:
- Type: `stdio` (standard input/output transport)
- Command: `node` with path to compiled `server.js`
- Proper environment variables for Node.js

### Activation Process

1. Extension activates
2. Creates `.vscode/mcp.json` with MCP server config
3. GitHub Copilot can discover and use the MCP server

### Available Tools

- **create_user_story**: Create a new user story with validation
- **list_user_stories**: List all user stories from the model
- **secret_word_of_the_day**: Get the unique daily word for this project

## Using MCP Tools in VS Code

### 1. Open Agent Mode
- Press `Ctrl+Alt+I` to open Chat view
- Select **Agent mode** from the dropdown

### 2. View Available Tools
- Click the **Tools** button in the chat input
- You should see three AppDNA tools listed
- Select/deselect tools as needed

### 3. Test the Secret Word Tool
Ask GitHub Copilot in Agent mode:
```
What's the secret word of the day?
```

Or directly reference the tool:
```
#secret_word_of_the_day
```

## Manual Configuration (if needed)

If auto-configuration doesn't work, you can manually create `.vscode/mcp.json`:

```json
{
  "servers": {
    "appdnaUserStories": {
      "type": "stdio",
      "command": "node",
      "args": ["<extensionPath>/dist/mcp/server.js"],
      "env": {
        "NODE_PATH": "<extensionPath>/node_modules"
      }
    }
  }
}
```

Replace `<extensionPath>` with the actual path to your extension installation.

## Troubleshooting

### Server Not Starting
1. Run `MCP: List Servers` from Command Palette
2. Select the AppDNA server
3. Choose **Show Output** to view logs

### Server Not Discovered
1. Ensure VS Code is version 1.102 or higher
2. Reload VS Code: `Developer: Reload Window`
3. Check that `mcp.json` exists in `.vscode` folder
4. Run `MCP: Reset Cached Tools` to refresh tool list

### Tools Not Appearing
1. Open Chat view in **Agent mode**
2. Click **Tools** button
3. Search for "appdna" or "secret"
4. If not found, check MCP output logs for errors
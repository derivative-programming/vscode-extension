# Add Form Wizard MCP Tool - Usage Guide

## Overview
This guide demonstrates how to use the new MCP tools for opening the Add Data Object Wizard and Add Form Wizard through GitHub Copilot or other MCP clients.

## Prerequisites
1. AppDNA extension installed in VS Code
2. MCP server running (command: "AppDNA: Start MCP Server")
3. GitHub Copilot or another MCP client connected
4. An AppDNA model file loaded in the workspace

## Available Commands

### Natural Language (via GitHub Copilot)

#### Opening the Add Data Object Wizard
```
You: "Open the add data object wizard"
You: "Show me the data object creation wizard"
You: "I want to create a new data object"
You: "Launch the wizard to add a data object"
```

#### Opening the Add Form Wizard
```
You: "Open the add form wizard"
You: "Show me the form creation wizard"
You: "I want to create a new form"
You: "Launch the wizard to add a form"
You: "Help me create a new form with the wizard"
```

### Direct MCP Tool Calls

If you're using an MCP client directly (not through Copilot), you can call:

```json
{
  "tool": "open_add_data_object_wizard",
  "parameters": {}
}
```

```json
{
  "tool": "open_add_form_wizard",
  "parameters": {}
}
```

## What Happens

### Add Data Object Wizard Flow
1. MCP client sends request to MCP server
2. Server validates model is loaded
3. Opens Add Data Object Wizard webview
4. User follows wizard steps:
   - Step 1: Select parent object
   - Step 2: Choose if object is a lookup
   - Step 3: Enter object name and description
5. Wizard creates the data object
6. Tree view refreshes to show new object

### Add Form Wizard Flow
1. MCP client sends request to MCP server
2. Server validates model is loaded
3. Opens Add Form Wizard webview
4. User follows wizard steps:
   - Step 1: Select owner data object
   - Step 2: Choose required role (if any)
   - Step 3: Specify if creating new instance
   - Step 4: Select target object or action
   - Step 5: Set form name and title
5. Wizard creates form and page init flow
6. Tree view refreshes and opens form details

## Response Format

Both tools return:
```json
{
  "success": true,
  "view": "appdna.mcp.openAddFormWizard",
  "message": "View opened successfully"
}
```

On error:
```json
{
  "success": false,
  "error": "No App DNA file is currently loaded"
}
```

## Integration Points

### Command Flow
```
GitHub Copilot
    ↓ (natural language)
MCP Server (port 3000)
    ↓ (tool call: open_add_form_wizard)
ViewTools.openAddFormWizard()
    ↓ (HTTP request to port 3002)
HTTP Bridge
    ↓ (executeCommand)
appdna.mcp.openAddFormWizard
    ↓ (validates model loaded)
appdna.addForm
    ↓ (calls showAddFormWizard)
addFormWizardView.js
    ↓ (creates webview)
User sees wizard in VS Code
```

### Error Handling

**Model Not Loaded**
```
Error: "No App DNA file is currently loaded"
Solution: Open or create an AppDNA model file first
```

**HTTP Bridge Not Available**
```
Error: "HTTP bridge connection failed: ECONNREFUSED"
Solution: Ensure the extension is running and HTTP bridge is started
```

**Extension Not Active**
```
Error: "extension running and HTTP bridge started?"
Solution: Activate the AppDNA extension by opening a workspace with a model file
```

## Example Conversation with GitHub Copilot

```
User: I need to add a new form to my AppDNA model

Copilot: I can help you with that! I'll open the Add Form Wizard which will guide 
you through creating a new form step by step.

[Copilot calls open_add_form_wizard tool]

Copilot: The Add Form Wizard is now open. It will walk you through:
1. Selecting the owner data object
2. Choosing any required roles
3. Specifying if you're creating a new instance
4. Selecting the target object or action
5. Setting the form name and title

The wizard will also automatically create a page init flow for your form.
```

## Testing

### Manual Testing
1. Start the MCP server in VS Code
2. Ask GitHub Copilot to "open the add form wizard"
3. Verify the wizard opens in a webview panel
4. Complete the wizard and verify the form is created

### Automated Testing
Run the test suite:
```bash
npm test
```

The test file `src/test/mcp-wizard-tools.test.ts` verifies:
- Tool methods exist
- Methods are callable
- Proper error handling

## Tips

1. **Pre-load Model**: Always ensure an AppDNA model is loaded before using wizards
2. **Natural Language**: Use simple, direct language with Copilot for best results
3. **Context**: Provide context if needed: "I'm working on the Customer module and need to add a form"
4. **Follow-up**: After opening a wizard, you can ask Copilot questions about what to enter

## Related Tools

- `create_data_object` - Create data objects programmatically via MCP
- `open_object_details_view` - View/edit existing data objects
- `open_form_details_view` - View/edit existing forms
- `list_data_objects` - List all data objects (helps choose owner/target)

## Troubleshooting

### Wizard Doesn't Open
1. Check MCP server is running: Look for "AppDNA MCP Server" in Output panel
2. Verify model is loaded: Tree view should show data objects
3. Check HTTP bridge: Port 3002 should be listening
4. Restart extension if needed

### Tool Not Found in Copilot
1. Reset Copilot tool cache: Command Palette → "MCP: Reset Cached Tools"
2. Restart VS Code
3. Verify extension version is 1.0.22 or higher

### Wizard Closes Immediately
1. Check for validation errors in the Output panel
2. Ensure all required data exists (e.g., Role objects for form wizard)
3. Try using the command palette directly: "AppDNA: Add Form"

## Version History

- **v1.0.21**: Added open_add_data_object_wizard and open_add_form_wizard tools
- Total MCP tools: 65
- Testing: Unit tests included
- Documentation: Updated MCP_README.md

## Support

For issues or questions:
1. Check the Output panel: "AppDNA MCP Server" channel
2. Review MCP_README.md for detailed documentation
3. Report issues on GitHub: derivative-programming/vscode-extension

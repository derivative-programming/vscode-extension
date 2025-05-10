# VS Code Extension: AppDNA

This extension provides a professional UI for building AppDNA model files based on a schema. It includes the following features:

- **Tree View**: Navigate the JSON structure easily.
- **Form-Based Editor**: Edit JSON properties using a dynamic form.
- **Right-Click Context Menus**: Modify items with options like Add, Edit, Remove, and Duplicate.
- **Live JSON Preview**: View the generated JSON in real-time.
- **GitHub Copilot Integration**: Interact with user stories via Model Context Protocol (MCP).

## Getting Started

1. Open this project in Visual Studio Code.
2. Press `F5` to launch the extension in a new Extension Development Host window.
3. Use the tree view and form editor to create and manage JSON files.

## Features

### Model Context Protocol (MCP) Server

The extension includes an MCP server that enables GitHub Copilot to interact with user stories:

- **Start/Stop Server**: Use the Command Palette to control the MCP server
- **User Story Creation**: Create user stories with format validation
- **User Story Listing**: Get a list of all user stories in the model

For more details, see [MCP_README.md](MCP_README.md).

## Development

- Modify the `src/extension.ts` file to add new features.
- Use the `get_vscode_api` tool to fetch the latest VS Code API references.
- Extend the MCP server in the `src/mcp` directory.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any bugs or feature requests.

# AppDNA MCP Server Documentation

## Overview

The AppDNA VS Code extension includes a Model Context Protocol (MCP) server that enables GitHub Copilot to interact with user stories. This integration allows you to create and list user stories directly through Copilot's Agent Mode.

## Features

The MCP server provides two main tools:

1. **createUserStory**: Create a new user story with proper format validation
2. **listUserStories**: List all existing user stories

## Using the MCP Server

### Starting and Stopping the Server

1. Open the VS Code Command Palette (Ctrl+Shift+P or ⌘+Shift+P)
2. Type "AppDNA: Start MCP Server" to start the server
3. Type "AppDNA: Stop MCP Server" to stop the server

### User Story Format

User stories must follow one of these formats:

- `A [Role name] wants to [View all, view, add, update, delete] a [object name]`
- `As a [Role name], I want to [View all, view, add, update, delete] a [object name]`

Example valid stories:
- "As a User, I want to add a task"
- "A Manager wants to view all reports"

### Using with GitHub Copilot

Once the MCP server is running, you can ask GitHub Copilot to:

1. Create a new user story: "Create a user story: As a Project Manager, I want to view all tasks"
2. List all user stories: "Show me all user stories in this project"

### Error Handling

If a story format is invalid, the MCP server will return an error message with examples of correct formats.

## Technical Details

The MCP server uses the standard input/output (stdio) transport mechanism for communication and follows the Model Context Protocol specification. It registers itself with VS Code through the mcp.json configuration file in the .vscode folder.

## Developer Notes

- The server integrates with the existing ModelService to read and write user stories to the model
- If the model file isn't loaded, it maintains an in-memory array of user stories
- The validation logic is shared with the existing user story view component

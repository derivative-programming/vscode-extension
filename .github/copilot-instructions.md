<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

IMPORTANT: The following are instructions for how AI assistants should interact with the codebase.

I'm running on windows

# AppDNA VS Code Extension - Coding Guidelines

This is a VS Code extension project that provides a graphical interface for editing, validating, and managing AppDNA model files (JSON) using a dynamic UI generated from an external JSON schema. Please use the get_vscode_api with a query as input to fetch the latest VS Code API references.

Always be careful and create accurate code.

Full extension description is in file 'EXTENSION-DESCRIPTION.md'

## Architecture Overview

- **Layered Architecture**:
  - UI layer (webviews in JavaScript)
  - Model manipulation layer (ModelService in TypeScript) 
  - Data access layer (ModelDataProvider in TypeScript)
  - Validation layer (schemaValidator in TypeScript)

- **Language Split**: `src/` uses TypeScript, but `src/webviews/` uses JavaScript because VS Code extensions run this code separately in webviews.

- **Central Service**: ModelService is the singleton service that manages loading, caching, and saving the AppDNA model file, exposing methods to manipulate the model.

## Critical Developer Workflows

### Build & Development
- `npm run watch` - Start TypeScript watch mode (default build task)
- `npm run compile` - One-time TypeScript compilation
- `npm run package` - Production build for publishing
- Extension entry point: `./dist/extension.js` (webpack bundled)

### Webview Communication Pattern
All webviews follow this message-passing pattern:
```javascript
// Webview → Extension
vscode.postMessage({ 
    command: 'commandName', 
    data: { /* payload */ } 
});

// Extension → Webview  
panel.webview.postMessage({
    command: 'responseCommand',
    data: { /* response */ }
});
```

### Command Logging Requirement
**CRITICAL**: For all commands sent to you, log them in `/copilot-command-history.txt` with completion status and architecture notes.

## UI/UX Guidelines

1. **Schema-Driven Development**: Always load and parse `app-dna.schema.json` to obtain all possible properties instead of hardcoding values.

2. **Dynamic Form Generation**: Iterate over schema's non-array properties to dynamically generate form inputs and UI elements.

3. **Enum Handling**: If schema property uses an enum, use a select dropdown with **alphabetically sorted options**: `schema.enum.slice().sort().map(...)`

4. **Property Existence Pattern**: For controls that modify JSON properties, show a checkbox to control property existence:
   - Unchecked = property doesn't exist in JSON (control is read-only)
   - Checked = property exists (control is editable)
   - Checkbox should be smaller and left-justified against its control

5. **Professional Design**: Use VS Code's design language with proper CSS variables (`var(--vscode-*)`)

6. **Tooltips**: Show schema descriptions as tooltips when hovering over controls

7. **Alphabetical Ordering**: Display properties in alphabetical order when iterating over schema objects

## Data Flow Guidelines

- **File Loading**: ModelService → ModelDataProvider → loads JSON into memory
- **Change Management**: All changes made in-memory, only written to disk on explicit save
- **File Watching**: Monitors model file for external changes, ignores extension-triggered saves
- **Validation**: Real-time validation using JSON schema with visual feedback

## Coding Style Guidelines

### JavaScript Preferences
- Double quotes preferred over single quotes
- Single quotes preferred over backticks  
- Regular string concatenation preferred for short templates
- Avoid nested template literals - create smaller ones separately

### TypeScript/JavaScript Split
- Use TypeScript for extension logic (`src/*.ts`)
- Use JavaScript for webview content (`src/webviews/*.js`)
- Webviews communicate via message passing, not direct function calls

### File Organization
- Small files preferred over large files
- Comments at top of each file with name, purpose, and last modified date
- Architecture learnings go in `ai-agent-architecture-notes.md`

### UI Patterns
- Delete operations are not exposed - use `isIgnored` property pattern instead
- Empty lines in code files are acceptable and encouraged for readability

## Extension Components

- **Tree View**: `src/providers/jsonTreeDataProvider.ts` - Hierarchical model structure in sidebar
- **Webviews**: `src/webviews/*.js` - Show object details in editor panels with forms
- **Commands**: `src/commands/*.ts` - Handle user actions like adding objects, saving files
- **Services**: `src/services/modelService.ts` - Central data service (singleton pattern)

## Key Integration Points

### Schema Integration
- Schema file: `app-dna.schema.json` (drives all UI generation)
- Never hardcode property names or types
- All dropdowns use sorted enums from schema

### VS Code API Integration
- Use `get_vscode_api` tool for latest API references
- Webview panels use message passing exclusively
- Command registration in `package.json` contributes section

### File System Integration
- Model files typically named `app-dna.json` (configurable)
- File watcher pattern prevents save conflicts
- All file operations go through ModelService/ModelDataProvider

## Architecture Documentation

Detailed architecture notes are organized in:
- `docs/architecture/` - Specific component architectures 
- `ai-agent-architecture-notes.md` - AI agent learning index
- Individual `.md` files for major features (e.g., `PAGE-PREVIEW-TESTING.md`)

Reference these files for deep architectural understanding of complex components like the tree view, webview communication patterns, and UI synchronization strategies.
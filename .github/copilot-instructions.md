<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

IMPORTANT: The following are instructions for how AI assistants should interact with the codebase.

I'm running on windows

# AppDNA VS Code Extension - Coding Guidelines

This is a VS Code extension project that provides a graphical interface for editing, validating, and managing AppDNA model files (JSON) using a dynamic UI generated from an external JSON schema. Please use the get_vscode_api with a query as input to fetch the latest VS Code API references.

Always be careful and create accurate code.

Full extension description is in file 'EXTENSION-DESCRIPTION.md'

## Architecture Overview

- The extension has a layered architecture:
  - UI layer (webviews in JavaScript)
  - Model manipulation layer (ModelService in TypeScript)
  - Data access layer (ModelDataProvider in TypeScript)
  - Validation layer (schemaValidator in TypeScript)

- Note that src/ folder uses TypeScript, but src/webviews/ subfolders use JavaScript because VS Code extensions run this code separately in webviews.

- The ModelService is the central service that manages loading, caching, and saving the AppDNA model file, exposing methods to manipulate the model.

## UI/UX Guidelines

1. Always load and parse the external JSON schema from "app-dna.schema.json" to obtain all possible properties instead of hardcoding values.

2. Iterate over the schema's non-array properties and use them to dynamically generate form inputs and other UI elements.

3. Use the JSON schema to validate user input and provide real-time feedback on errors or warnings.

4. If the schema property uses an enum, a select dropdown should be used to restrict data entered.

5. A clean, professional, responsive design should be used, similar to the default VS Code design.

6. Tabs should be left justified.

7. If a control allows a change of a value in the JSON file that follows the schema, we need to handle the case where the property is missing from the JSON file. If a control allows a change of a property in the JSON file, a checkbox should be shown to the right of it. If the checkbox is unchecked then the control should be read-only. If checked, the control can be modified. An unchecked value means the property does not exist in the JSON file. The checkbox should be relatively smaller than the control and left justified against its corresponding control.

8. Small files are preferred over large files.

9. If you are iterating over all properties in a schema object to allow the user to edit them, you should display the properties in alphabetical order.

10. If a control allows a change of a value in the JSON file that follows the schema, and the schema has a description of the property, the description should be shown in a tooltip when hovering over the control.

11. Read-only controls should have a different background to indicate they're read-only.
 
12. Drop down controls do not need a placeholder 'Select ...' options.

## Data Flow Guidelines

- Files are loaded into the ModelService via ModelDataProvider
- Changes are made in-memory and only written to disk when the user clicks save
- A file watcher monitors the model file for external changes
- Changes triggered by the extension's save function are ignored by the watcher

## Coding Style Guidelines

13. For all commands sent to you, log them in a text file: /copilot-command-history.txt

14. Comments in the code are encouraged and preferred.

15. Delete operations are not given to the user. A user will be able to set an item's property 'isIgnored' (or similar) to true to have it ignored. The user will not be able to delete the item from the JSON file. The user will be able to set the property back to false to have it included again.

16. Empty lines in a code file are acceptable.

17. Double quotes are preferred over single quotes, and single quotes over backticks in JavaScript.

18. In JavaScript, regular string concatenation is preferred over using template literals that only span a few lines. Backticks will be avoided except for rare cases where multi-line templates are significantly clearer.

19. Template literals should not be built inside large template literals. Create the smaller ones separately.

20. When converting pascal or camel to human readable text with spaces, capital letters that are together should be kept together. For example:
   - "DNAApp" → "DNA App", not "D N A App"
   - "AppDNA" → "App DNA", not "App D N A" 
   - "AppDNATest" → "App DNA Test", not "App D N A Test"
   - "AppDNATest123" → "App DNA Test 123", not "App D N A Test 123"

21. In each file, add comments at the top with the file name, a brief description of the file's purpose, and the date it was created or last modified. This will help in understanding the context of the code and its evolution over time.

22. In the file ai-agent-architecture-notes.md, add items that you learn along the way about the code base that you can use in the future to quickly understand the code base. This will help you to learn the code base faster and be more efficient in the future.

## Extension Components

- **Tree View**: Displays hierarchical model structure in the sidebar
- **Webviews**: Show object details in editor panels with forms for editing
- **Commands**: Handle user actions like adding objects, saving files
- **Services**: Manage data and operations (e.g., ModelService)

## File Structure

- `src/extension.ts` - Main entry point
- `src/commands/*.ts` - Command implementations
- `src/services/modelService.ts` - Central data service
- `src/data/models/*.ts` - Type-specific model classes
- `src/webviews/*.js` - JavaScript webview implementation
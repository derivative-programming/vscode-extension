# AppDNA VS Code Extension Architecture Notes

*Last updated: May 4, 2025*

## Overview
The AppDNA VS Code extension provides a graphical interface for editing, validating, and managing AppDNA model files (JSON) using a dynamic UI generated from an external JSON schema. This document contains key architectural observations to help quickly understand the codebase.

## Core Architecture

### Extension Initialization Flow
1. The extension starts in `extension.ts` with the `activate` function
2. It sets up the extension context, initializes the ModelService
3. Creates file watchers for the model file
4. Initializes the tree view with JsonTreeDataProvider
5. Registers all commands via registerCommands.ts

### Key Components

#### ModelService (Singleton)
- Central service that manages loading, caching, and saving the AppDNA model file
- Provides methods to manipulate the model (getAllObjects, getAllReports, etc.)
- Acts as a facade over the ModelDataProvider for data operations
- Direct file manipulation without creating backups (preserves original files)

#### JsonTreeDataProvider
- Manages the tree view in the sidebar showing the model structure
- Creates tree items for objects, namespaces, reports, etc.
- Uses ModelService to access model data

#### Webviews
- JavaScript files in the `webviews` folder handle UI for editing objects
- These run in a separate context (not TypeScript)
- Communicate with the extension via postMessage API
- Dynamically generate UI based on the schema properties

#### Commands
- Registered in `registerCommands.ts` 
- Include operations like adding objects, saving files, generating code

### Data Flow

1. **Loading**: ModelService loads the JSON file → ModelDataProvider parses and validates → In-memory model created
2. **Display**: JsonTreeDataProvider accesses model via ModelService → Renders tree view
3. **Editing**: User selects object in tree → Webview opens with UI generated from schema → Changes made in UI
4. **Saving**: Save command → ModelService.saveToFile → Updates JSON file on disk directly (no backups)

### Schema Structure
- Complex schema defined in `app-dna.schema.json`
- Root element with properties like appName, projectName
- Namespaces that contain objects
- Objects with properties, reports, workflows, etc.
- TypeScript interfaces in `data/interfaces` match the schema structure

### UI/UX Conventions
- Schema descriptions are shown as tooltips
- Enum properties are displayed as dropdowns
- Properties are displayed alphabetically
- Checkboxes control property presence in JSON file
- Read-only controls have a distinct background
- No delete operations exposed - properties like `isIgnored` are used instead

## Important File Relationships

- `extension.ts` → initializes → `ModelService`
- `extension.ts` → creates → `JsonTreeDataProvider`
- `JsonTreeDataProvider` → uses → `ModelService` 
- `commands/*.ts` → call → `ModelService` methods
- `webviews/*.js` → communicate with → extension via messages

## Special Patterns

1. **Dynamic UI Generation**:
   - Schema is loaded and parsed to discover all possible properties
   - UI elements are generated based on property types (enum → dropdown)

2. **File Watching Logic**:
   - Extension monitors model file for changes
   - Saves triggered by the extension are ignored by the watcher
   - External changes trigger a refresh of the tree view

3. **Property Existence Control**:
   - Checkboxes control whether a property appears in the JSON
   - Unchecked = property is omitted from the file

4. **Webview Email Pre-population Pattern**:
   - For reliable pre-population of fields in VS Code webviews, use a handshake pattern:
     1. The webview JS sends a `webviewReady` message to the extension after DOMContentLoaded.
     2. The extension responds with a `setEmailValue` message containing the value to pre-populate.
     3. The webview JS sets the field value on receiving this message.
   - This avoids race conditions where the extension sends a message before the webview is ready.

5. **Secret Storage for Email**:
   - To pre-populate the email field after logout, do NOT delete the email from VS Code secret storage on logout. Only delete the API key.
   - This allows the extension to retrieve and pre-populate the email field for user convenience on subsequent logins.

## Model Services API and Login Flow (2025-05-04)
- The extension authenticates users via the Model Services API endpoint: https://modelservicesapi.derivative-programming.com/api/v1_0/logins
- Login request body: { "email": string, "password": string }
- Response: { "success": boolean, "message": string, "modelServicesAPIKey": string, "validationError": [ { "property": string, "message": string } ] }
- On successful login, the API key is stored in VS Code secret storage and used for subsequent authenticated requests.
- The user's email is also stored in secret storage (and not deleted on logout) to enable pre-population of the login form for convenience.
- The login webview uses a handshake pattern: the webview JS sends a `webviewReady` message, and the extension responds with the saved email for pre-population.
- The login page provides a registration link for new users and displays terms/disclaimers about data usage and liability.

## Code Style Conventions
- Double quotes preferred over single quotes
- Regular concatenation preferred over template literals for short strings
- TypeScript for extension code, JavaScript for webviews

## Extension Points

The model can be extended by:
- Updating `app-dna.schema.json` with new properties (UI will automatically reflect changes)
- Adding new commands in `registerCommands.ts`
- Creating new webview implementations for different object types

## Testing Framework

The extension uses a multi-level testing approach:

1. **Unit Tests** (`test/` directory):
   - Focus on testing individual components
   - Use a separate TypeScript configuration (`test/tsconfig.json`) that extends the main one
   - Set `rootDir` to `..` to allow access to both test and source files
   - Primary test files: `extension.test.ts` and `emptyProject.test.ts`

2. **End-to-End Tests** (`test-e2e/` directory):
   - Test the full extension in an actual VS Code window
   - Use a completely separate TypeScript configuration
   - Create temporary workspaces to test extension functionality
   - Focus on testing user-facing functionality like UI elements and commands

3. **TypeScript Configuration Separation**:
   - Main `tsconfig.json`: 
     - Focuses only on source code with `"rootDir": "src"`
     - Explicitly includes only `src/**/*` files
     - Excludes test directories to avoid compilation errors
   - Test configs:
     - Extend from the main config but override critical settings
     - Allow compilation of test files without mixing contexts

4. **Key Test Files**:
   - `runTest.ts`: Sets up the VS Code test environment
   - `emptyProject.test.ts`: Tests extension behavior with no model file
   - `clean-project.test.ts`: E2E tests for clean project scenarios

Both test suites verify critical extension functionality including command registration, UI visibility, and context-sensitive behaviors.

## Configuration Files

The extension uses two types of files:

1. **Model Files** (`app-dna.json`):
   - Contains the actual model data following the schema
   - Core file that defines objects, reports, namespaces, etc.

2. **Config Files** (`app-dna.config.json`):
   - Created alongside model files when using "Add File" command
   - Contains extension-specific settings like validation preferences and code generation options
   - Does not include backup settings as backups are not supported
   - Can be manually edited to customize extension behavior

## Code Generation

The `codeGenerator.ts` module provides functionality to generate code from model objects:

1. Supports generating both TypeScript and C# model classes
2. Makes API calls to an external model service for code generation
3. Has a fallback code generation capability if the API is unavailable
4. Creates basic class definitions with appropriate properties and types

The code generator demonstrates the extension's end-to-end capabilities beyond just model editing.
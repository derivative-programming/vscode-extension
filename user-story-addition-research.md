# User Story Addition Research - AppDNA VS Code Extension

## Executive Summary

This document provides a comprehensive overview of how user stories are added and managed in the AppDNA VS Code extension. The system supports multiple ways to add user stories with robust validation and integration with the model structure.

## Current User Story Addition Methods

### 1. UI-Based Addition (Primary Method)

**Entry Points:**
- VS Code Command: `appdna.showUserStories`
- Tree View: USER STORIES → Stories
- Location: `src/webviews/userStoriesView.js`

**Process Flow:**
1. User clicks "Add User Story" button (+ icon) in the Stories webview
2. Modal dialog opens with text area for story input
3. User enters story text (supports multiple stories, one per line)
4. System validates format and role/object existence
5. Story is added to model and saved

**Validation Rules:**
- **Format Validation**: Supports two main patterns:
  - `A [Role Name] wants to [action] [a|an|all] [Object Name(s)]`
  - `As a [Role Name], I want to [action] [a|an|all] [Object Name(s)]`
  - Special "view all" format: `...wants to view all [objects] in a [container]`
  - Actions: view, add, create, update, edit, delete, remove
- **Role Validation**: Role must exist in Role data objects with lookup items
- **Object Validation**: Referenced data objects must exist in the model
- **Duplicate Prevention**: Prevents duplicate story text

### 2. CSV Import Method

**Process:**
- Upload CSV via the upload button in the Stories webview
- CSV format: `storyNumber,storyText` (header row required)
- Bulk validation and import with error reporting
- Location: Same webview handles CSV processing

### 3. MCP (Model Context Protocol) Integration

**Tools Available:**
- `create_user_story`: Programmatic story creation via MCP server
- `list_user_stories`: Retrieve all stories via MCP
- Location: `src/mcp/tools/userStoryTools.ts`

**MCP Features:**
- Validates format and role existence
- Supports both model storage and in-memory fallback
- Provides detailed error messages for invalid formats

## Data Model Structure

### Schema Definition
**File:** `app-dna.schema.json` (lines 159-186)

```json
"userStory": {
  "type": "array",
  "description": "Array of user story items",
  "items": {
    "type": "object",
    "properties": {
      "name": { "type": "string", "description": "Name of item" },
      "storyNumber": { "type": "string", "description": "" },
      "storyText": { "type": "string", "description": "" },
      "isIgnored": { 
        "type": "string", 
        "enum": ["true", "false"],
        "description": "will be ignored by the code generator array loop"
      },
      "isStoryProcessed": { 
        "type": "string", 
        "enum": ["true", "false"],
        "description": ""
      }
    }
  }
}
```

### Model Classes
- **Interface:** `src/data/interfaces/userStory.interface.ts` - `UserStorySchema`
- **Model:** `src/data/models/userStoryModel.ts` - `UserStoryModel`
- **Namespace:** `src/data/models/namespaceModel.ts` - Contains `userStory[]` array

### Storage Location
- **Path:** `root.namespace[0].userStory[]`
- **Format:** Array of UserStory objects within the first namespace
- **Persistence:** Stored in the main AppDNA JSON file

## Architecture Components

### Service Layer
- **ModelService:** Central singleton service for model operations
- **ModelDataProvider:** Handles data loading/saving operations
- **Location:** `src/services/modelService.ts`, `src/data/models/ModelDataProvider.ts`

### UI Layer
- **Primary View:** `src/webviews/userStoriesView.js` (JavaScript for webview)
- **Wrapper:** `src/webviews/userStoriesView.ts` (TypeScript wrapper)
- **Communication:** Message passing between webview and extension

### Command Layer
- **Registration:** `src/commands/registerCommands.ts`
- **Commands:**
  - `appdna.showUserStories` - Opens the Stories view
  - `appdna.showUserStoryRoleRequirements` - Opens role requirements view

### Tree View Integration
- **Provider:** `src/providers/jsonTreeDataProvider.ts`
- **Hierarchy:** USER STORIES → Stories (shows user story management)

## User Story Format Examples

### Valid Formats
```
A Manager wants to view all reports
A User wants to add a task
A Admin wants to delete a record
As a Manager, I want to view all employees
As a User, I want to update my profile
A Manager wants to view all tasks in a project
A User wants to view all items in the application
```

### Special Cases
- **Application Context:** "in the application" is allowed without validation
- **Container Objects:** "in a [container object]" requires container object to exist
- **Multiple Stories:** One story per line in the UI text area

## Validation Process

### 1. Format Validation
- Regex patterns in `isValidUserStoryFormat()` function
- Supports both "A [Role]..." and "As a [Role]..." formats
- Actions must be from approved list (view, add, create, update, edit, delete, remove)

### 2. Role Validation
- Extracts role name using `extractRoleFromUserStory()`
- Validates role exists in Role data objects via `isValidRole()`
- Checks both `name` and `displayName` fields in lookup items

### 3. Object Validation
- Extracts referenced objects using `extractDataObjectsFromUserStory()`
- Validates objects exist in the model
- Special handling for "application" context

### 4. Duplicate Prevention
- Checks existing stories by `storyText` field
- Prevents duplicate entries during both UI and CSV import

## Integration Points

### Related Views
1. **Role Requirements:** Maps roles to data object access permissions
2. **Page Mapping:** Maps user stories to specific pages/reports
3. **User Journey:** Tracks story fulfillment across pages
4. **QA:** Quality assurance tracking for stories

### Code Generation
- Stories marked as `isIgnored: "true"` are excluded from code generation
- `isStoryProcessed` field tracks processing status
- Integration with model AI processing workflows

## Error Handling

### UI Feedback
- Real-time validation feedback in modal dialog
- Error messages for format violations, missing roles/objects
- Success confirmation with story addition details

### MCP Error Responses
- Structured error objects with specific error messages
- Fallback to in-memory storage if model unavailable
- Detailed validation failure explanations

## File Monitoring
- FileWatcher monitors AppDNA file for external changes
- Refreshes views when file is modified externally
- Handles unsaved changes tracking via ModelService

## Future Enhancement Opportunities

### Identified Areas for Improvement
1. **Batch Operations:** Enhanced bulk editing capabilities
2. **Story Templates:** Predefined story patterns for common scenarios
3. **Advanced Filtering:** More sophisticated search and filter options
4. **Story Relationships:** Linking related stories or dependencies
5. **Auto-completion:** Smart suggestions for roles and objects during entry

### Current Limitations
- Single namespace support (uses first namespace only)
- Limited story number field usage
- No story priority or categorization system
- No story archiving or versioning

## Command Line Integration

The extension includes MCP server capabilities that allow external tools to interact with user stories programmatically:

```bash
# Via MCP tools (when server is running)
create_user_story(title="US001", description="A Manager wants to view all reports")
list_user_stories()
```

## Testing and Quality Assurance

### Validation Testing
- Format validation tests for all supported patterns
- Role existence validation
- Object existence validation
- Duplicate prevention testing

### Integration Testing
- CSV import/export functionality
- Model file persistence
- Webview communication
- Command registration and execution

---

*Last Updated: September 19, 2025*
*Documentation covers extension version based on current codebase analysis*
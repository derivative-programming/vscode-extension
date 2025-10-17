# MCP User Story Creation via HTTP Bridge

**Created:** October 16, 2025  
**Purpose:** Enable MCP server to create user stories in ModelService with full validation via HTTP POST

## Overview

The MCP server can now create user stories that are properly added to the AppDNA model through an HTTP POST endpoint. This ensures full integration with the extension's validation and model management.

## Architecture

```
GitHub Copilot
    ↓
MCP Server (create_user_story tool)
    ↓
HTTP POST to localhost:3001/api/user-stories
    ↓
MCP Bridge (Data Bridge)
    ↓
ModelService.getCurrentModel()
    ↓
Add story to namespace.userStory[]
    ↓
ModelService.markUnsavedChanges()
```

## Implementation Details

### 1. HTTP Bridge POST Endpoint

**Location:** `src/services/mcpBridge.ts`

**Endpoint:** `POST http://localhost:3001/api/user-stories`

**Request Body:**
```json
{
  "storyText": "A Manager wants to view all reports",
  "storyNumber": "US-001"  // Optional
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "story": {
    "name": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "storyText": "A Manager wants to view all reports",
    "storyNumber": "US-001"
  },
  "message": "User story added successfully (unsaved changes)"
}
```

**Response (Error - 400/409/500):**
```json
{
  "success": false,
  "error": "Error message here"
}
```

**Validation Performed:**
- Checks storyText is provided
- Validates model structure and namespace exists
- **Extracts and validates role** - checks role exists in Role data object
- **Extracts and validates data objects** - checks all objects exist in model
- Checks for duplicate story text (409 Conflict if exists)
- Generates UUID for `name` field
- Marks model as having unsaved changes

### 2. MCP Tool Method

**Location:** `src/mcp/tools/userStoryTools.ts`

**Method:** `create_user_story(parameters)`

**Process:**
1. Validates storyText format using regex patterns
2. If format invalid, returns error with examples
3. If format valid, calls `postToBridge()` to create story
4. Returns success or error response

**Format Validation:**
- `A [Role] wants to [action] [object]`
- `A [Role] wants to view all [objects] in a [container]`
- `As a [Role], I want to [action] [object]`
- `As a [Role], I want to view all [objects] in a [container]`

**Actions supported:** view, add, create, update, edit, delete, remove

### 3. New Helper Method

**Method:** `postToBridge(endpoint, data)`

Similar to `fetchFromBridge()` but uses POST method:
- Serializes data to JSON
- Sets proper headers
- Handles HTTP status codes (200-299 = success)
- Returns parsed response or throws error

### 4. MCP Server Tool Registration

**Location:** `src/mcp/server.ts`

**Tool name:** `create_user_story`

**Updated Description:** "Create a new user story with format validation and add it to the AppDNA model via HTTP bridge"

**Input Schema:**
- `title` (optional string): Story number/identifier
- `description` (required string): Story text

**Output Schema:**
- `success` (boolean): Whether creation succeeded
- `story` (object, optional): Created story with name, storyText, storyNumber
- `error` (string, optional): Error message if failed
- `message` (string, optional): Success message
- `note` (string, optional): Additional notes
- `validatedFormat` (boolean, optional): Whether format was valid

## Usage Examples

### Via MCP Tool (GitHub Copilot)

```
create_user_story(
  title="US-123",
  description="A Manager wants to view all reports"
)
```

**Success Response:**
```json
{
  "success": true,
  "story": {
    "name": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "storyText": "A Manager wants to view all reports",
    "storyNumber": "US-123"
  },
  "message": "User story created successfully",
  "note": "Story added to AppDNA model via MCP bridge (unsaved changes)",
  "validatedFormat": true
}
```

**Format Error Response:**
```json
{
  "success": false,
  "error": "Invalid format. Examples of correct formats:\n- \"A Manager wants to view all reports\"\n- \"A Manager wants to view all tasks in a project\"\n- \"A User wants to add a task\"\n- \"As a User, I want to update an employee\"\n- \"As a Manager, I want to view all items in the application\"",
  "validatedFormat": false
}
```

**Bridge Error Response:**
```json
{
  "success": false,
  "error": "Failed to create story: Duplicate story text already exists",
  "note": "Could not connect to extension or validation failed",
  "validatedFormat": true
}
```

### Direct HTTP POST (Testing)

```bash
curl -X POST http://localhost:3001/api/user-stories \
  -H "Content-Type: application/json" \
  -d '{
    "storyText": "A Manager wants to view all reports",
    "storyNumber": "US-123"
  }'
```

## Key Features

### 1. Full Validation
- Format validation at MCP layer
- **Role validation** - extracts role and validates it exists in model
- **Data object validation** - extracts objects and validates they exist
- Duplicate detection at bridge layer
- Model structure validation
- Proper error messages at each layer

### 2. Unsaved Changes Tracking
- Calls `modelService.markUnsavedChanges()`
- User sees indicator that file needs saving
- Integrates with extension's save workflow

### 3. Proper UUID Generation
- Uses GUID generation for `name` field
- Matches extension's pattern
- Ensures unique identifiers

### 4. Optional Story Number
- `storyNumber` field is optional
- Can be provided via `title` parameter
- Useful for tracking/reference

### 5. Error Handling
- Clear error messages for each failure type
- HTTP status codes indicate error type
- Format validation happens before HTTP call

## Error Scenarios

| Error Type | HTTP Status | Message |
|------------|-------------|---------|
| Missing storyText | 400 | "storyText is required" |
| Invalid format | N/A (MCP layer) | Format examples shown |
| Invalid model | 400 | "Model structure is invalid or namespace not found" |
| **Role not extracted** | 400 | "Unable to extract role from user story text" |
| **Role not found** | 400 | 'Role "{roleName}" does not exist in model' |
| **Object(s) not found** | 400 | 'Data object(s) "{objects}" do not exist in model' |
| Duplicate story | 409 | "Duplicate story text already exists" |
| Bridge unavailable | N/A (MCP layer) | "Could not connect to extension" |
| Other errors | 500 | Error message from exception |

## Files Modified

1. **src/services/mcpBridge.ts**
   - Added CORS support for POST requests
   - Added POST `/api/user-stories` endpoint
   - Implemented validation and model manipulation
   - Generates UUIDs and marks unsaved changes

2. **src/mcp/tools/userStoryTools.ts**
   - Updated `create_user_story()` to use HTTP bridge
   - Added `postToBridge()` helper method
   - Improved error handling and responses

3. **src/mcp/server.ts**
   - Updated tool description
   - Updated input/output schemas
   - Added `validatedFormat` and `note` fields

## Benefits

1. **Real Integration**: Stories are actually added to the model, not just validated
2. **Consistent Workflow**: Uses same model manipulation as webview
3. **Proper State Management**: Marks unsaved changes correctly
4. **Full Validation**: Validates format before making HTTP call
5. **Clear Feedback**: Detailed success/error messages
6. **Extensible**: Pattern can be used for other POST operations

## Validation Helper Methods

The HTTP bridge includes several helper methods for validation (ported from userStoriesView.js):

1. **`extractRoleFromUserStory(text)`** - Extracts role name from story text
2. **`extractDataObjectsFromUserStory(text)`** - Extracts data object names with variants
3. **`isValidRole(roleName, modelService)`** - Validates role exists in Role lookup items
4. **`validateDataObjects(objects, modelService)`** - Validates all objects exist
5. **`addSingularPluralVariants(name, array)`** - Adds singular/plural/PascalCase variants
6. **`toPascalCase(name)`** - Converts spaced names to PascalCase

These methods ensure the same validation logic is used in both the webview and MCP bridge.

## Testing Checklist

- [ ] Valid story format creates story successfully
- [ ] Invalid story format returns validation error
- [ ] **Story with non-existent role returns 400 error**
- [ ] **Story with non-existent object returns 400 error**
- [ ] **Story with valid role and objects creates successfully**
- [ ] Duplicate story text returns 409 error
- [ ] Created story appears in model
- [ ] Model marked as having unsaved changes
- [ ] Story has valid UUID in `name` field
- [ ] Optional `storyNumber` field works correctly
- [ ] Error messages are clear and actionable
- [ ] Extension not running returns appropriate error

## Future Enhancements

Possible additions:
- ~~Role validation (check role exists)~~ ✅ IMPLEMENTED
- ~~Data object validation (check objects exist)~~ ✅ IMPLEMENTED  
- Batch story creation (multiple stories in one call)
- Story update endpoint (PUT)
- Story delete endpoint (DELETE)
- Advanced object matching (parent-child relationships)
- Custom validation rules per namespace

## Related Documentation

- `docs/architecture/mcp-story-structure-correction.md` - Story format details
- `docs/architecture/mcp-in-memory-removal.md` - In-memory removal rationale
- `docs/architecture/MCP-BRIDGE-UNIFIED-ARCHITECTURE.md` - Bridge architecture

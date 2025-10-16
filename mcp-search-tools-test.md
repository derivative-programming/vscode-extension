# MCP Search Tools Test
**Date**: October 16, 2025
**Purpose**: Test data object search and user story search tools from the MCP server

## Test Plan

### 1. Data Object Search Tests

#### Test 1.1: List All Data Objects
- Tool: `list_data_objects`
- Parameters: none
- Expected: Returns all data objects from the model

#### Test 1.2: Search by Name
- Tool: `list_data_objects`
- Parameters: `search_name="User"`
- Expected: Returns data objects containing "User" in the name

#### Test 1.3: Search by Name with Space Handling
- Tool: `list_data_objects`
- Parameters: `search_name="UserRole"`
- Expected: Should find both "UserRole" and "User Role" (space-agnostic)

#### Test 1.4: Filter by isLookup
- Tool: `list_data_objects`
- Parameters: `is_lookup="true"`
- Expected: Returns only lookup data objects

#### Test 1.5: Filter by Parent Object
- Tool: `list_data_objects`
- Parameters: `parent_object_name="Customer"`
- Expected: Returns data objects with "Customer" as parent

#### Test 1.6: Combined Filters
- Tool: `list_data_objects`
- Parameters: `search_name="Role"`, `is_lookup="true"`
- Expected: Returns lookup objects containing "Role"

### 2. User Story Search Tests

#### Test 2.1: List All User Stories
- Tool: `list_user_stories`
- Parameters: none
- Expected: Returns all user stories from the model

#### Test 2.2: Search by Text (Case-Insensitive)
- Tool: `search_user_stories`
- Parameters: `query="manager"`, `caseSensitive=false`
- Expected: Finds stories containing "Manager", "manager", "MANAGER", etc.

#### Test 2.3: Search by Text (Case-Sensitive)
- Tool: `search_user_stories`
- Parameters: `query="Manager"`, `caseSensitive=true`
- Expected: Only finds stories with exact case "Manager"

#### Test 2.4: Search in Title and Description
- Tool: `search_user_stories`
- Parameters: `query="view"`
- Expected: Finds stories with "view" in either storyNumber or storyText

#### Test 2.5: Search by Role
- Tool: `search_user_stories_by_role`
- Parameters: `role="Manager"`
- Expected: Finds stories where "Manager" is the role

#### Test 2.6: Search by Role (Different Case)
- Tool: `search_user_stories_by_role`
- Parameters: `role="manager"`
- Expected: Should still find "Manager" stories (case-insensitive)

## Test Results

### Data Object Search Results

#### Test 1.1: List All Data Objects
**Status**: ⏳ Pending
**Command**: List all data objects
**Result**: 

---

#### Test 1.2: Search by Name
**Status**: ⏳ Pending
**Command**: Search for data objects with name containing "User"
**Result**: 

---

#### Test 1.3: Space Handling Test
**Status**: ⏳ Pending
**Command**: Search for "UserRole" (should also find "User Role")
**Result**: 

---

### User Story Search Results

#### Test 2.1: List All User Stories
**Status**: ⏳ Pending
**Command**: List all user stories
**Result**: 

---

#### Test 2.2: Case-Insensitive Search
**Status**: ⏳ Pending
**Command**: Search for "manager" (case-insensitive)
**Result**: 

---

#### Test 2.3: Case-Sensitive Search
**Status**: ⏳ Pending
**Command**: Search for "Manager" (case-sensitive)
**Result**: 

---

## Comparison Analysis

### Space Handling
- **Data Objects**: ✅ Implements space-agnostic search
- **User Stories**: ❌ Does NOT implement space-agnostic search
- **Issue**: Inconsistency - recommendation to add space handling to user stories

### Case Sensitivity
- **Data Objects**: Always case-insensitive
- **User Stories**: Configurable case sensitivity
- **Issue**: Inconsistency - recommendation to add case sensitivity option to data objects

### Fallback Behavior
- **Data Objects**: Returns empty on bridge failure
- **User Stories**: Falls back to in-memory storage
- **Reason**: Different data sources and use cases

### Search Scope
- **Data Objects**: Searches only the `name` field
- **User Stories**: Searches both `storyText` and `storyNumber` fields
- **Reason**: Different data structures

## Recommendations Based on Test Results

1. ✅ Add space-agnostic search to user story search
2. ✅ Add case sensitivity option to data object search
3. ✅ Document why fallback behaviors differ
4. ✅ Consider extracting common search logic into shared utility
5. ✅ Add unit tests for both search implementations

## Notes
- MCP Server: `appdna-extension`
- Server Location: `dist/mcp/server.js`
- Configuration: `.vscode/mcp.json`

# MCP Search Tools Comparison: Data Objects vs User Stories

**Created**: October 16, 2025  
**Purpose**: Compare and analyze the search implementations for `list_data_objects` and `search_user_stories` MCP tools

## Overview

The MCP server provides search functionality for both data objects and user stories. While both serve similar purposes (finding items by text), they have different implementations with distinct features and trade-offs.

## Tool Comparison Matrix

| Feature | `list_data_objects` | `search_user_stories` |
|---------|--------------------|-----------------------|
| **Tool Name** | `list_data_objects` | `search_user_stories` |
| **Primary Purpose** | List/filter data objects | Search user stories by text |
| **Required Parameters** | None (all optional) | `query` (required) |
| **Optional Parameters** | `search_name`, `is_lookup`, `parent_object_name` | `caseSensitive` |
| **Case Sensitivity** | Always case-insensitive | Configurable (default: false) |
| **Space Handling** | ✅ Removes spaces for matching | ❌ No space removal |
| **Search Fields** | `name` only | `storyText` + `storyNumber` |
| **Filter Types** | Multiple (text, boolean, exact-match) | Single substring search |
| **Fallback Strategy** | Returns empty on bridge failure | Uses in-memory storage |
| **Bridge Endpoint** | `/api/data-objects` | `/api/user-stories` |

## Detailed Analysis

### 1. Parameter Design

#### Data Objects (Multi-Filter Approach)
```typescript
{
  search_name?: string,      // Optional text filter
  is_lookup?: string,        // Optional boolean filter ("true" or "false")
  parent_object_name?: string // Optional exact-match filter
}
```

**Pros**:
- Supports multiple simultaneous filters
- Clear semantic meaning for each parameter
- Can filter by structural properties (isLookup, parent)

**Cons**:
- More complex API surface
- Requires understanding of data object structure

#### User Stories (Simple Query Approach)
```typescript
{
  query: string,            // Required search text
  caseSensitive?: boolean   // Optional case sensitivity flag
}
```

**Pros**:
- Simple, intuitive API
- Familiar search pattern
- Explicit case sensitivity control

**Cons**:
- Limited to text search only
- Cannot filter by structural properties

### 2. Search Algorithm Differences

#### Data Objects: Space-Agnostic Search
```typescript
// Searches BOTH with spaces and without spaces
const searchLower = search_name.toLowerCase();
const searchNoSpaces = search_name.replace(/\s+/g, '').toLowerCase();

filteredObjects = filteredObjects.filter((obj: any) => {
    const nameLower = (obj.name || '').toLowerCase();
    const nameNoSpaces = (obj.name || '').replace(/\s+/g, '').toLowerCase();
    
    // Matches "UserRole" OR "User Role"
    return nameLower.includes(searchLower) || nameNoSpaces.includes(searchNoSpaces);
});
```

**Benefits**:
- More forgiving search (finds "userRole", "UserRole", "User Role")
- Better UX for Pascal/camelCase names
- Handles naming inconsistencies

#### User Stories: Simple Substring Search
```typescript
// Simple substring search with optional case sensitivity
const searchText = isCaseSensitive 
    ? storyText + " " + storyNumber
    : (storyText + " " + storyNumber).toLowerCase();
const searchQuery = isCaseSensitive ? query : query.toLowerCase();

return searchText.includes(searchQuery);
```

**Benefits**:
- Straightforward implementation
- Predictable behavior
- Searches across multiple fields (storyText + storyNumber)

### 3. Fallback Behavior

#### Data Objects: Fail Closed
```typescript
catch (error) {
    return {
        success: false,
        objects: [],
        count: 0,
        note: "Could not load data objects from bridge",
        warning: `Could not connect to extension: ${error.message}`
    };
}
```

**Rationale**: Data objects are tightly coupled to the model file; without bridge access, there's no meaningful data to return.

#### User Stories: Fail Open
```typescript
catch (error) {
    // Fallback to in-memory storage if bridge is not available
    const inMemoryStories = this.getInMemoryUserStories();
    // ... filter and return in-memory stories
    return {
        success: true,
        stories: matchingStories,
        count: matchingStories.length,
        note: "Stories loaded from MCP server memory (bridge not available)",
        warning: `Could not connect to extension: ${error.message}`
    };
}
```

**Rationale**: MCP server maintains in-memory user stories for testing/demo purposes, so fallback is useful.

### 4. Return Schema Differences

#### Data Objects
```typescript
{
    success: boolean,
    objects: Array<{
        name: string,
        isLookup: boolean,
        parentObjectName: string | null
    }>,
    count: number,
    filters: {  // Shows applied filters
        search_name: string | null,
        is_lookup: string | null,
        parent_object_name: string | null
    },
    note?: string,
    warning?: string
}
```

#### User Stories
```typescript
{
    success: boolean,
    query: string,  // Echoes search query
    caseSensitive: boolean,  // Echoes case sensitivity setting
    stories: Array<{
        title: string,
        description: string,
        isIgnored: boolean
    }>,
    count: number,
    note?: string,
    warning?: string
}
```

## Inconsistencies & Issues

### 1. **Inconsistent Space Handling**
- **Issue**: Data objects uses space removal for better matching, user stories doesn't
- **Impact**: User searching for "UserRole" won't find "User Role" in user stories
- **Recommendation**: Add space-removal logic to user story search

### 2. **Different Fallback Strategies**
- **Issue**: Data objects fails closed, user stories fails open
- **Impact**: Different behavior when bridge is unavailable
- **Current Status**: This is intentional but should be documented
- **Recommendation**: Add architectural decision record (ADR) explaining the choice

### 3. **Case Sensitivity Inconsistency**
- **Issue**: Data objects is always case-insensitive, user stories has configurable case sensitivity
- **Impact**: Different search behaviors across tools
- **Recommendation**: Consider adding case sensitivity option to data objects

### 4. **Parameter Naming Convention**
- **Issue**: Data objects uses underscores (`search_name`, `is_lookup`), following MCP snake_case convention
- **Status**: This is correct for MCP tools
- **Note**: Both tools correctly follow snake_case for external API

## Recommendations

### High Priority

1. **Add Space-Removal to User Story Search**
   ```typescript
   // In search_user_stories method
   const searchLower = query.toLowerCase();
   const searchNoSpaces = query.replace(/\s+/g, '').toLowerCase();
   
   const searchText = isCaseSensitive 
       ? storyText + " " + storyNumber
       : (storyText + " " + storyNumber).toLowerCase();
   const searchTextNoSpaces = searchText.replace(/\s+/g, '');
   
   return searchText.includes(searchQuery) || 
          searchTextNoSpaces.includes(searchNoSpaces);
   ```

2. **Document Fallback Strategy**
   - Create ADR explaining why data objects fails closed
   - Document in-memory storage use case for user stories

### Medium Priority

3. **Consider Unified Search Interface**
   - Extract common search logic into shared utility
   - Standardize space-removal, case-sensitivity handling
   - Example:
   ```typescript
   class SearchUtils {
       static flexibleMatch(
           haystack: string, 
           needle: string, 
           options: { caseSensitive?: boolean, spaceAgnostic?: boolean }
       ): boolean {
           // Unified search logic
       }
   }
   ```

4. **Add Case Sensitivity to Data Objects**
   - Add optional `case_sensitive` parameter
   - Default to `false` for backward compatibility

### Low Priority

5. **Harmonize Return Schemas**
   - Consider adding `filters` echo to all search tools
   - Standardize optional field naming

6. **Add Search Highlighting**
   - Return match positions for UI highlighting
   - Useful for both webview and CLI interfaces

## Testing Recommendations

### Unit Tests Needed

1. **Space-handling tests**:
   - Search "UserRole" finds "User Role"
   - Search "User Role" finds "UserRole"
   - Search "user role" finds "UserRole" (case-insensitive)

2. **Case sensitivity tests**:
   - User stories with `caseSensitive: true` is case-sensitive
   - User stories with `caseSensitive: false` is case-insensitive
   - Data objects is always case-insensitive

3. **Fallback tests**:
   - Data objects returns empty when bridge fails
   - User stories returns in-memory data when bridge fails

4. **Multi-filter tests** (data objects):
   - Apply search_name + is_lookup simultaneously
   - Apply all three filters simultaneously
   - Verify filter echoing in response

### Integration Tests Needed

1. **Bridge connectivity**:
   - Test with running extension
   - Test without running extension
   - Verify warning messages

2. **Real data scenarios**:
   - Search existing model file data
   - Verify accurate filtering
   - Test edge cases (empty strings, special characters)

## Architecture Notes

### Why Different Approaches?

**Data Objects**: 
- Structural filtering is important (isLookup, parentObjectName)
- Names often use PascalCase/camelCase convention
- No standalone existence outside model file

**User Stories**:
- Natural language text (less formatting conventions)
- May be created in MCP server for testing
- Simple substring search is sufficient

### Future Considerations

1. **Fuzzy Matching**: Consider using Levenshtein distance or similar for typo tolerance
2. **Ranking**: Add relevance scoring for search results
3. **Highlighting**: Return match positions for UI highlighting
4. **Pagination**: Add offset/limit parameters for large result sets
5. **Sorting**: Add sort options (name, relevance, etc.)

## References

- **Implementation**: `src/mcp/tools/userStoryTools.ts`
- **Server Registration**: `src/mcp/server.ts` (lines 150-260)
- **Bridge Endpoints**: `src/services/httpBridgeService.ts`
- **Related Docs**: 
  - `MCP-BRIDGE-UNIFIED-ARCHITECTURE.md`
  - `MCP-COMMAND-BRIDGE-DESIGN.md`

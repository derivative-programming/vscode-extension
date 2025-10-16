# MCP Search Tools Comparison - Test Results
**Date**: October 16, 2025  
**Test Environment**: Live MCP Bridge on localhost:3001  
**Data Source**: Active AppDNA model file

## Test Summary

✅ **Bridge Status**: Active and responding  
✅ **Data Objects**: 87 objects loaded  
✅ **User Stories**: 109 stories loaded  

---

## Test Results

### TEST 1: Data Object Search

#### Available Data Objects (Sample)
```
Found 87 data objects total

Sample objects:
- AIAssistant (isLookup: False, parent: OpenAIAccount)
- AIAssistantFile (isLookup: False, parent: AIAssistant)
- AIAssistantThread (isLookup: False, parent: AIAssistant)
- AIAssistantType (isLookup: True, parent: Pac)
- OrgUserRole (contains: User + Role)
```

#### Search Test: Objects containing "User"
**Implementation**: The MCP server's `list_data_objects` tool implements space-agnostic search:
```typescript
// Removes spaces for matching
const searchLower = search_name.toLowerCase();
const searchNoSpaces = search_name.replace(/\s+/g, '').toLowerCase();

filteredObjects = filteredObjects.filter((obj: any) => {
    const nameLower = (obj.name || '').toLowerCase();
    const nameNoSpaces = (obj.name || '').replace(/\s+/g, '').toLowerCase();
    
    // Matches BOTH with and without spaces
    return nameLower.includes(searchLower) || nameNoSpaces.includes(searchNoSpaces);
});
```

**Result**: ✅ Space-agnostic search working
- Search "UserRole" will match "User Role", "UserRole", "user role", etc.
- Found objects like "OrgUserRole"

---

### TEST 2: User Story Search

#### Available User Stories (Sample)
```
Found 109 user stories total

Sample stories:
1. "As a Admin, I want to Update a Customer"
2. "As a Admin, I want to view a Customer"
3. "As a Admin, I want to view all Organizations in a Customer"
4. "As a Admin, I want to view a Organization"
5. "As a User, I want to view all Customer Report Favorites in a Customer"
```

#### Search Test: Stories containing "Admin"
**Implementation**: The MCP server's `search_user_stories` tool uses simple substring search:
```typescript
// Simple substring search without space removal
const searchText = isCaseSensitive 
    ? storyText + " " + storyNumber
    : (storyText + " " + storyNumber).toLowerCase();
const searchQuery = isCaseSensitive ? query : query.toLowerCase();

return searchText.includes(searchQuery);
```

**Result**: ✅ Basic search working, ❌ NO space-agnostic matching
- Search "Admin" finds "As a Admin, I want to..."
- Search would NOT find compound words split with spaces (e.g., "ReportFavorite" wouldn't match "Report Favorite")

---

## Key Findings

### 1. Space Handling Comparison

| Tool | Space-Agnostic? | Example |
|------|-----------------|---------|
| **list_data_objects** | ✅ YES | "UserRole" matches "User Role" |
| **search_user_stories** | ❌ NO | "UserRole" does NOT match "User Role" |

**Impact**: Inconsistent search behavior across tools. Users may be confused why space handling works in one but not the other.

### 2. Case Sensitivity Comparison

| Tool | Case Control | Default Behavior |
|------|--------------|------------------|
| **list_data_objects** | ❌ Always case-insensitive | No option to change |
| **search_user_stories** | ✅ Configurable | Defaults to case-insensitive |

**Impact**: User stories offer more flexibility, but data objects cannot do case-sensitive searches.

### 3. Search Scope Comparison

| Tool | Fields Searched | Notes |
|------|----------------|-------|
| **list_data_objects** | `name` only | Single field, but has additional filters (isLookup, parentObjectName) |
| **search_user_stories** | `storyText` + `storyNumber` | Multiple fields searched simultaneously |

**Impact**: Different approaches based on data structure, which makes sense.

### 4. Filter Options Comparison

| Tool | Available Filters | Complexity |
|------|------------------|------------|
| **list_data_objects** | `search_name`, `is_lookup`, `parent_object_name` | Multiple optional filters, can combine |
| **search_user_stories** | `query`, `caseSensitive` | Simple query-based search |

**Impact**: Data objects has more sophisticated filtering for structural properties.

### 5. Fallback Behavior

| Tool | Bridge Unavailable Behavior | Rationale |
|------|----------------------------|-----------|
| **list_data_objects** | Returns empty array | Data only exists in model file |
| **search_user_stories** | Returns in-memory stories | MCP server maintains test data |

**Impact**: Different fallback strategies based on data sources and use cases.

---

## Issues Identified

### 🔴 Critical: Space Handling Inconsistency

**Problem**: User stories don't use space-agnostic search like data objects do.

**Example Scenario**:
```
User searches for: "ReportFavorite"
Data Objects: ✅ Would find "Report Favorite"
User Stories: ❌ Would NOT find "Report Favorite"
```

**Impact**: User confusion, missed search results

**Recommendation**: Add space-removal logic to `search_user_stories`

### 🟡 Medium: Case Sensitivity Inconsistency

**Problem**: Data objects cannot perform case-sensitive searches.

**Example Scenario**:
```
User needs to distinguish: "API" vs "api"
Data Objects: ❌ Cannot differentiate (always case-insensitive)
User Stories: ✅ Can use caseSensitive=true
```

**Impact**: Limited search precision for data objects

**Recommendation**: Add optional `case_sensitive` parameter to `list_data_objects`

### 🟢 Low: Lack of Unified Search Logic

**Problem**: Search logic is duplicated with slight variations across tools.

**Impact**: Harder to maintain, potential for bugs

**Recommendation**: Extract common search logic into shared utility class

---

## Recommendations

### 1. ✅ HIGH PRIORITY: Add Space-Agnostic Search to User Stories

**Change Required in**: `src/mcp/tools/userStoryTools.ts`

```typescript
// Current implementation
public async search_user_stories(parameters: any): Promise<any> {
    const { query, caseSensitive } = parameters;
    const isCaseSensitive = caseSensitive === true;
    
    const matchingStories = response.filter((story: any) => {
        const storyText = story.storyText || "";
        const storyNumber = story.storyNumber || "";
        
        const searchText = isCaseSensitive 
            ? storyText + " " + storyNumber
            : (storyText + " " + storyNumber).toLowerCase();
        const searchQuery = isCaseSensitive ? query : query.toLowerCase();
        
        return searchText.includes(searchQuery);
    });
}

// IMPROVED implementation
public async search_user_stories(parameters: any): Promise<any> {
    const { query, caseSensitive } = parameters;
    const isCaseSensitive = caseSensitive === true;
    
    const matchingStories = response.filter((story: any) => {
        const storyText = story.storyText || "";
        const storyNumber = story.storyNumber || "";
        
        const searchText = isCaseSensitive 
            ? storyText + " " + storyNumber
            : (storyText + " " + storyNumber).toLowerCase();
        const searchTextNoSpaces = searchText.replace(/\s+/g, '');
        
        const searchQuery = isCaseSensitive ? query : query.toLowerCase();
        const searchQueryNoSpaces = query.replace(/\s+/g, '').toLowerCase();
        
        // Match with spaces OR without spaces
        return searchText.includes(searchQuery) || 
               searchTextNoSpaces.includes(searchQueryNoSpaces);
    });
}
```

### 2. ✅ MEDIUM PRIORITY: Add Case Sensitivity to Data Objects

**Change Required in**: `src/mcp/tools/userStoryTools.ts`

Add optional `case_sensitive` parameter to `list_data_objects`:

```typescript
public async list_data_objects(parameters?: any): Promise<any> {
    const { search_name, is_lookup, parent_object_name, case_sensitive } = parameters || {};
    const isCaseSensitive = case_sensitive === true; // Default: false
    
    // Apply search_name filter
    if (search_name && typeof search_name === 'string') {
        const searchLower = isCaseSensitive ? search_name : search_name.toLowerCase();
        const searchNoSpaces = search_name.replace(/\s+/g, '');
        const searchNoSpacesLower = isCaseSensitive ? searchNoSpaces : searchNoSpaces.toLowerCase();
        
        filteredObjects = filteredObjects.filter((obj: any) => {
            const name = obj.name || '';
            const nameCompare = isCaseSensitive ? name : name.toLowerCase();
            const nameNoSpaces = name.replace(/\s+/g, '');
            const nameNoSpacesCompare = isCaseSensitive ? nameNoSpaces : nameNoSpaces.toLowerCase();
            
            return nameCompare.includes(searchLower) || nameNoSpacesCompare.includes(searchNoSpacesLower);
        });
    }
}
```

### 3. ✅ LOW PRIORITY: Create Shared Search Utility

**New File**: `src/mcp/tools/searchUtils.ts`

```typescript
export class SearchUtils {
    /**
     * Flexible search matching with space-agnostic and case sensitivity options
     */
    static flexibleMatch(
        haystack: string,
        needle: string,
        options: {
            caseSensitive?: boolean;
            spaceAgnostic?: boolean;
        } = {}
    ): boolean {
        const { caseSensitive = false, spaceAgnostic = true } = options;
        
        const haystackCompare = caseSensitive ? haystack : haystack.toLowerCase();
        const needleCompare = caseSensitive ? needle : needle.toLowerCase();
        
        // Direct match
        if (haystackCompare.includes(needleCompare)) {
            return true;
        }
        
        // Space-agnostic match
        if (spaceAgnostic) {
            const haystackNoSpaces = haystack.replace(/\s+/g, '');
            const haystackNoSpacesCompare = caseSensitive ? haystackNoSpaces : haystackNoSpaces.toLowerCase();
            const needleNoSpaces = needle.replace(/\s+/g, '');
            const needleNoSpacesCompare = caseSensitive ? needleNoSpaces : needleNoSpaces.toLowerCase();
            
            return haystackNoSpacesCompare.includes(needleNoSpacesCompare);
        }
        
        return false;
    }
}
```

### 4. ✅ DOCUMENTATION: Add Architecture Decision Record

**New File**: `docs/architecture/mcp-search-fallback-strategy.md`

Document why data objects and user stories have different fallback behaviors when the bridge is unavailable.

---

## Testing Checklist

- [x] Verified MCP bridge is accessible (port 3001)
- [x] Confirmed 87 data objects loaded
- [x] Confirmed 109 user stories loaded
- [x] Tested data object space-agnostic search
- [x] Tested user story basic search
- [x] Identified space handling inconsistency
- [x] Identified case sensitivity inconsistency
- [ ] Unit tests for space-agnostic user story search
- [ ] Unit tests for case-sensitive data object search
- [ ] Integration tests with real model data
- [ ] Performance tests with large datasets

---

## Conclusion

The MCP server search tools are **functional but inconsistent**. The most critical issue is the space-handling difference between `list_data_objects` and `search_user_stories`, which could lead to user confusion and missed search results.

**Priority Actions**:
1. Add space-agnostic search to user stories (HIGH)
2. Add case sensitivity option to data objects (MEDIUM)
3. Create shared search utility for consistency (LOW)
4. Document architectural decisions (MEDIUM)

**Current Status**: ⚠️ Functional with identified improvements needed

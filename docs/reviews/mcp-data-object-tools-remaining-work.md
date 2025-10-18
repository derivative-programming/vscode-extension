# MCP Data Object Tools - Remaining Work Items

**Date:** October 18, 2025  
**Status:** Architecture fixed ✅, Additional enhancements available

## ✅ COMPLETED
1. **Architecture Fix** - DataObjectTools class now properly used
2. **list_data_objects** - Working with search and filters
3. **Documentation** - Comprehensive review and refactoring docs created

---

## 📋 REMAINING WORK ITEMS

### 🟡 Medium Priority - Documentation Clarity

#### Issue: Misleading Tool Count
`MCP_README.md` lists "Data Object Tools (5+ tools)" but this is confusing:
- Actually 1 data manipulation tool (`list_data_objects`)
- The "5+ tools" are view-opening tools (different category)

#### Recommended Fix:
Update `MCP_README.md` section to clarify:

```markdown
#### **Data Object Management** (1 tool)
1. **list_data_objects** - List all data objects with optional search and filters
   - Search by name (case-insensitive, also searches without spaces)
   - Filter by isLookup status (true/false)
   - Filter by parent object name (case-insensitive)

#### **Data Object Views** (5 tools)
- **open_object_details_view** - View/edit data object details
- **open_data_objects_list_view** - Browse all data objects
- **open_data_object_usage_analysis_view** - Impact analysis for objects
- **open_data_object_size_analysis_view** - Storage and capacity planning
- **open_database_size_forecast_view** - Database growth projections
```

**Effort:** 5 minutes  
**Impact:** Reduces user confusion

---

### 🟠 Medium-High Priority - Missing CRUD Tools

Currently only 1 data manipulation tool exists. To match user story tools, we need:

#### 1. **get_data_object_details**
Get full details of a specific data object by name.

**Implementation:**
- Tool in `dataObjectTools.ts`
- Bridge endpoint: `GET /api/data-objects/:name`
- Returns: Full object with all properties, not just summary

**Input:**
```typescript
{ object_name: string }
```

**Output:**
```typescript
{
  success: boolean,
  object: {
    name: string,
    isLookup: boolean,
    parentObjectName: string | null,
    properties: Array<Property>,
    // ... other fields
  }
}
```

**Effort:** 2-3 hours  
**Priority:** HIGH - Most commonly needed after list

---

#### 2. **get_data_object_schema**
Return schema definition for data objects (similar to `get_user_story_schema`).

**Implementation:**
- Tool in `dataObjectTools.ts`
- No bridge needed (static schema info)

**Output:**
```typescript
{
  success: boolean,
  schema: {
    type: "object",
    description: "Data object structure",
    properties: { ... },
    example: { ... }
  }
}
```

**Effort:** 1 hour  
**Priority:** MEDIUM - Helpful for AI understanding

---

#### 3. **add_data_object**
Create a new data object.

**Implementation:**
- Tool in `dataObjectTools.ts`
- Bridge endpoint: `POST /api/data-objects`
- Validates object name, type, etc.

**Input:**
```typescript
{
  name: string,
  isLookup: boolean,
  parentObjectName?: string,
  // ... other required fields
}
```

**Output:**
```typescript
{
  success: boolean,
  object: { ... },
  message: string
}
```

**Effort:** 4-6 hours  
**Priority:** MEDIUM - Useful but less urgent than read operations

---

#### 4. **list_data_object_properties**
List all properties of a specific data object.

**Implementation:**
- Tool in `dataObjectTools.ts`
- Bridge endpoint: `GET /api/data-objects/:name/properties`

**Input:**
```typescript
{ object_name: string }
```

**Output:**
```typescript
{
  success: boolean,
  object_name: string,
  properties: Array<{
    name: string,
    dataType: string,
    isRequired: boolean,
    // ... other property fields
  }>,
  count: number
}
```

**Effort:** 3-4 hours  
**Priority:** MEDIUM - Common operation

---

#### 5. **add_data_object_property**
Add a property to an existing data object.

**Implementation:**
- Tool in `dataObjectTools.ts`
- Bridge endpoint: `POST /api/data-objects/:name/properties`

**Input:**
```typescript
{
  object_name: string,
  property: {
    name: string,
    dataType: string,
    isRequired: boolean,
    // ... other property fields
  }
}
```

**Effort:** 4-6 hours  
**Priority:** MEDIUM-LOW - Nice to have

---

### 🟢 Low Priority - Testing

#### Missing Test Coverage
Currently only manual testing with `curl` commands.

**Recommended:**
1. Create automated test script for data object tools
2. Test all search/filter combinations
3. Test error scenarios (bridge down, invalid input)
4. Test edge cases (empty results, special characters in names)

**Example Test Script:**
```javascript
// test/mcp-data-object-tools.test.js
const tests = [
  { name: 'List all objects', params: {}, expectCount: '>0' },
  { name: 'Search by name', params: { search_name: 'customer' }, expectContains: 'customer' },
  { name: 'Filter lookup tables', params: { is_lookup: 'true' }, expectAllLookup: true },
  { name: 'Filter by parent', params: { parent_object_name: 'Order' }, expectParent: 'Order' },
  { name: 'Combined filters', params: { search_name: 'status', is_lookup: 'true' } },
  { name: 'No results', params: { search_name: 'NONEXISTENT' }, expectCount: 0 },
  { name: 'Case insensitive', params: { search_name: 'CUSTOMER' }, expectContains: 'customer' }
];
```

**Effort:** 4-6 hours  
**Priority:** LOW - Nice to have but not blocking

---

### 🔵 Optional Enhancements

#### 1. **Batch Operations**
- `list_data_objects_by_names` - Get multiple objects at once
- Useful for AI to gather context efficiently

#### 2. **Analytics Tools**
- `get_data_object_usage_stats` - Usage analytics for specific object
- `get_data_object_relationships` - Parent/child relationship graph
- `analyze_data_object_complexity` - Complexity metrics

#### 3. **Validation Tools**
- `validate_data_object` - Check object against schema
- `find_data_object_issues` - Detect missing properties, invalid references

---

## 📅 Suggested Implementation Order

### Phase 1: Quick Wins (1-2 days)
1. ✅ Fix documentation in `MCP_README.md` (5 min)
2. ✅ Implement `get_data_object_schema` (1 hour)
3. ✅ Implement `get_data_object_details` (2-3 hours)

### Phase 2: Core CRUD (3-5 days)
1. Add bridge endpoint `/api/data-objects/:name`
2. Implement `list_data_object_properties` (3-4 hours)
3. Add bridge endpoint `/api/data-objects/:name/properties`
4. Implement `add_data_object` (4-6 hours)
5. Add bridge endpoint `POST /api/data-objects`

### Phase 3: Advanced Features (5-7 days)
1. Implement `add_data_object_property` (4-6 hours)
2. Create automated test suite (4-6 hours)
3. Add analytics tools (optional)
4. Add validation tools (optional)

---

## 🎯 Immediate Next Step

**Recommendation:** Start with **Phase 1** items to get quick value:

1. **Update Documentation** (5 minutes)
   - Fix `MCP_README.md` to clarify tool categories
   - Prevents user confusion immediately

2. **Implement `get_data_object_schema`** (1 hour)
   - Simple to implement (no bridge needed)
   - Helps AI understand data object structure
   - Follows pattern from user story tools

3. **Implement `get_data_object_details`** (2-3 hours)
   - Most commonly needed after `list_data_objects`
   - Requires new bridge endpoint but straightforward
   - High value for AI interactions

**Total Time for Phase 1:** ~4 hours  
**Value:** High - Brings data object tools to feature parity with user story tools for read operations

---

## 📊 Current vs Target State

### Current State
- ✅ 1 data manipulation tool (`list_data_objects`)
- ✅ 5 view-opening tools
- ✅ Proper architecture (DataObjectTools class)
- ❌ No CRUD operations beyond list
- ❌ No property management
- ❌ Misleading documentation

### Target State (Phase 1)
- ✅ 3 data manipulation tools (list, get_details, get_schema)
- ✅ 5 view-opening tools
- ✅ Proper architecture
- ✅ Clear documentation
- ⚠️ Basic CRUD (read-only)

### Target State (Phase 2)
- ✅ 5+ data manipulation tools (add, properties, etc.)
- ✅ Complete CRUD operations
- ✅ Property management
- ✅ Clear documentation

---

## 💡 Summary

**Architecture Issue:** ✅ FIXED  
**Documentation:** 🟡 Needs clarity update  
**Feature Completeness:** 🟠 Only 1 of ~8 needed tools exist  
**Testing:** 🔵 Manual only, automation recommended  

**Recommended Next Action:** Implement Phase 1 items for quick wins and feature parity with user story tools.

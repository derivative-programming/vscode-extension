# Page Init Flow Details View - Output Var Tab Review
**Last Updated:** November 9, 2025

## Executive Summary

Review of the page init flow details view output var tab implementation to identify properties that should be hidden according to the todo list requirements. The output var tab currently displays all properties from the schema, but four properties should be hidden from both the UI and MCP tools:

1. **defaultValue**
2. **fKObjectName** 
3. **isFK**
4. **isFKLookup**

## Current Implementation

### Files Reviewed

1. **UI Template:**
   - `src/webviews/pageinits/components/templates/outputVarsTableTemplate.js`

2. **MCP Tools:**
   - `src/mcp/tools/pageInitTools.ts`
   - `src/mcp/server.ts`

3. **Schema:**
   - `app-dna.schema.json` (lines 1358-1428)

### Current Output Var Properties Display Order

The output var tab currently shows properties in this order (from `outputVarsTableTemplate.js` lines 11-28):

```javascript
const allowedOrder = [
    "conditionalVisiblePropertyName",
    "dataSize",
    "dataType",
    "defaultValue",              // ❌ SHOULD BE HIDDEN
    "fKObjectName",              // ❌ SHOULD BE HIDDEN
    "labelText",
    "isAutoRedirectURL",
    "isFK",                      // ❌ SHOULD BE HIDDEN
    "isFKLookup",                // ❌ SHOULD BE HIDDEN
    "isLabelVisible",
    "isHeaderText",
    "isIgnored",
    "isLink",
    "isVisible",
    "sourceObjectName",
    "sourcePropertyName"
];
```

### Current MCP Tool Schema

The MCP tool `get_page_init_flow_schema()` (lines 19-240 in `pageInitTools.ts`) includes all four properties that should be hidden:

- **defaultValue** (line 96-100)
- **fKObjectName** (line 101-105)
- **isFK** (line 112-117)
- **isFKLookup** (line 118-123)

## Changes Required

### 1. Hide Properties in UI Template

**File:** `src/webviews/pageinits/components/templates/outputVarsTableTemplate.js`

**Current Code (lines 4-8):**
```javascript
function getOutputVarPropertiesToHide() {
    return [
        // Keep all properties visible by default for page init output vars
    ];
}
```

**Required Change:**
```javascript
function getOutputVarPropertiesToHide() {
    return [
        'defaultValue',
        'fKObjectName', 
        'isFK',
        'isFKLookup'
    ];
}
```

**Current Code (lines 11-28):**
```javascript
const allowedOrder = [
    "conditionalVisiblePropertyName",
    "dataSize",
    "dataType",
    "defaultValue",              // Remove this line
    "fKObjectName",              // Remove this line
    "labelText",
    "isAutoRedirectURL",
    "isFK",                      // Remove this line
    "isFKLookup",                // Remove this line
    "isLabelVisible",
    "isHeaderText",
    "isIgnored",
    "isLink",
    "isVisible",
    "sourceObjectName",
    "sourcePropertyName"
];
```

**Required Change:**
```javascript
const allowedOrder = [
    "conditionalVisiblePropertyName",
    "dataSize",
    "dataType",
    "labelText",
    "isAutoRedirectURL",
    "isLabelVisible",
    "isHeaderText",
    "isIgnored",
    "isLink",
    "isVisible",
    "sourceObjectName",
    "sourcePropertyName"
];
```

### 2. Remove Properties from MCP Schema Tool

**File:** `src/mcp/tools/pageInitTools.ts`

**Location:** Method `get_page_init_flow_schema()` (lines 19-240)

Remove the following property definitions from the `objectWorkflowOutputVar.items.properties` object:

**Lines to Remove:**

1. **defaultValue** (lines ~96-100):
```typescript
defaultValue: {
    type: "string",
    required: false,
    description: "Default value for this output variable if not set by the flow.",
    examples: ["0", "", "NULL", "[]"]
},
```

2. **fKObjectName** (lines ~101-105):
```typescript
fKObjectName: {
    type: "string",
    required: false,
    description: "Name of the foreign key object target (data object name). Case-sensitive.",
    examples: ["Customer", "Order", "Status", "Role"]
},
```

3. **isFK** (lines ~112-117):
```typescript
isFK: {
    type: "string",
    required: false,
    enum: ["true", "false"],
    description: "Is this output variable a foreign key reference? String \"true\" or \"false\".",
    examples: ["true", "false"]
},
```

4. **isFKLookup** (lines ~118-123):
```typescript
isFKLookup: {
    type: "string",
    required: false,
    enum: ["true", "false"],
    description: "Is this output variable a foreign key to a lookup object? String \"true\" or \"false\".",
    examples: ["true", "false"]
},
```

### 3. Remove Properties from MCP Get Tool

**File:** `src/mcp/tools/pageInitTools.ts`

**Location:** Method `get_page_init_flow()` (lines 248-500+)

Search for and remove any references to these properties in the returned output var data:
- `defaultValue`
- `fKObjectName`
- `isFK`
- `isFKLookup`

### 4. Update MCP Update Tool

**File:** `src/mcp/tools/pageInitTools.ts`

**Location:** Method `update_page_init_flow_output_var()` (lines 790-900+)

**Required Changes:**
- Add validation to reject updates to the hidden properties
- Remove these properties from the Zod schema validation
- Update the tool description to note these properties are not supported

### 5. Update MCP Add Tool

**File:** `src/mcp/tools/pageInitTools.ts`

**Location:** Method `add_page_init_flow_output_var()` (lines 674-788)

**Required Changes:**
- Add validation to reject these properties in new output vars
- Remove these properties from the Zod schema validation
- Update the tool description to note these properties are not supported

### 6. Update MCP Server Tool Registrations

**File:** `src/mcp/server.ts`

**Locations:**
1. `get_page_init_flow_schema` registration (~line 2688-2713)
2. `get_page_init_flow` registration (~line 2715-2750)
3. `add_page_init_flow_output_var` registration (~line 2795-2862)
4. `update_page_init_flow_output_var` registration (~line 2864-2920+)

**Required Changes:**
- Update Zod schemas to exclude the four hidden properties
- Update tool descriptions to clarify that these properties are not available for page init flow output vars

## Rationale

Based on the schema definition (lines 1358-1428 in `app-dna.schema.json`), page init flow output variables support these properties, but they are not appropriate for page initialization:

### Why Hide These Properties?

1. **defaultValue**: Page init flows prepare data dynamically; default values don't make sense in this context since the flow itself determines the values.

2. **fKObjectName**: Page init flows output data for display/processing, not database relationships. Foreign key relationships are defined at the data object level, not in page initialization output.

3. **isFK**: Same rationale as fKObjectName - FK relationships are data model concerns, not page initialization concerns.

4. **isFKLookup**: Same rationale as fKObjectName - lookup relationships are data model concerns, not page initialization output concerns.

### What Remains?

After hiding these properties, the output var tab will show:

**Display Properties:**
- `conditionalVisiblePropertyName` - Controls conditional visibility
- `labelText` - Display label
- `isLabelVisible` - Label visibility control
- `isHeaderText` - Header text flag
- `isVisible` - General visibility control
- `isAutoRedirectURL` - Auto redirect flag
- `isLink` - Link display flag

**Data Properties:**
- `dataSize` - Data size specification
- `dataType` - SQL Server data type
- `sourceObjectName` - Source data object
- `sourcePropertyName` - Source property

**System Properties:**
- `isIgnored` - Ignore flag (for soft delete pattern)

## Testing Plan

### UI Testing
1. Open a page init flow details view
2. Navigate to Output Variables tab
3. Verify that defaultValue, fKObjectName, isFK, and isFKLookup are NOT visible
4. Verify remaining properties are displayed in correct order
5. Test adding a new output variable - verify hidden properties are not shown
6. Test editing an existing output variable - verify hidden properties are not shown

### MCP Tool Testing
1. Call `get_page_init_flow_schema()` - verify hidden properties are not in schema
2. Call `get_page_init_flow()` - verify hidden properties are not in returned data
3. Call `add_page_init_flow_output_var()` with hidden properties - verify they are rejected
4. Call `update_page_init_flow_output_var()` with hidden properties - verify they are rejected

### Integration Testing
1. Verify existing page init flows with these properties still load correctly
2. Verify existing output vars with these properties display correctly (properties just hidden from view)
3. Verify saving/updating doesn't remove existing values of hidden properties
4. Verify MCP tools work with GitHub Copilot after changes

## Migration Considerations

### Existing Data Handling

**Important:** Hidden properties may already exist in existing page init flow output vars in user models. The implementation must:

1. **Preserve Existing Data**: Don't delete or modify existing values of hidden properties when loading/saving
2. **Hide from View**: Simply don't display these properties in the UI
3. **Prevent New Values**: Don't allow setting these properties in new or updated output vars through UI or MCP tools
4. **Read-Only Access**: Existing values remain in the model file but are not exposed through the extension

### Backward Compatibility

This change is **backward compatible** because:
- Existing model files with these properties will continue to work
- Values are preserved in the model file
- Only UI and MCP tool access is restricted
- Schema still defines these properties (they're just hidden in the page init context)

## Implementation Priority

**High Priority** - This aligns with the todo list requirements and removes unnecessary/confusing properties from the page init flow output var interface.

## Related Todo Items

From `todo.md` (lines 14-20):
```markdown
- page init flow
  - output var
    - Default Value:
      - hide on page init flow details view ✓
      - remove from mcp tool get page init flow schema ✓
      - remove from mcp tool get page init flow ✓
      - remove from mcp tool update page init flow output var ✓
      - remove from mcp tool add page init flow output var ✓
```

Similar patterns needed for:
- FK Object Name
- Is FK
- Is FK Lookup

## Conclusion

The page init flow output var tab currently displays four properties that should be hidden based on architectural requirements. The properties (defaultValue, fKObjectName, isFK, isFKLookup) are not appropriate for page initialization workflows as they represent database relationship concerns rather than page initialization output concerns.

The changes required are straightforward:
1. Update UI template to hide properties
2. Update MCP tools to exclude properties from schema and operations
3. Test thoroughly to ensure backward compatibility
4. Preserve existing data in model files while preventing new usage

This review provides the complete implementation plan to align the output var tab with the requirements specified in the todo list.

# General Flow MCP Tools - Architecture Review

**Review Date:** November 2, 2025  
**Reviewer:** AI Agent  
**Files Reviewed:**
- `src/mcp/tools/generalFlowTools.ts` (1515 lines)
- `src/mcp/server.ts` (general flow tool registrations)
- `src/mcp/tools/viewTools.ts` (general flow view tools)

---

## Overview

The General Flow MCP Tools provide GitHub Copilot and other MCP clients with comprehensive programmatic access to general flow management in the AppDNA model. General flows are reusable business logic workflows (objectWorkflow with `isPage="false"`) that can be called from multiple places in the application.

---

## Available Tools Summary

### Total: 10 General Flow Tools

#### Schema & Query Tools (4)
1. **`get_general_flow_schema`** - Get complete schema definition for general flows
2. **`get_general_flow`** - Retrieve specific general flow by name
3. **`list_general_flows`** - List all general flows with filtering
4. **`update_general_flow`** - Update general flow properties

#### Parameter Management Tools (3)
5. **`add_general_flow_param`** - Add input parameter to general flow
6. **`update_general_flow_param`** - Update parameter properties
7. **`move_general_flow_param`** - Reorder parameters

#### Output Variable Management Tools (3)
8. **`add_general_flow_output_var`** - Add output variable
9. **`update_general_flow_output_var`** - Update output variable properties
10. **`move_general_flow_output_var`** - Reorder output variables

### View Tools (3)
11. **`open_general_workflows_list_view`** - Opens list view of all general flows
12. **`open_add_general_flow_wizard`** - Opens wizard to create new general flows
13. **`open_general_workflow_details_view`** - Opens details view (⚠️ NOT IMPLEMENTED)

---

## Detailed Tool Analysis

### 1. get_general_flow_schema

**Purpose:** Returns complete schema definition for general flows including all properties, validation rules, and examples.

**Key Features:**
- ✅ Comprehensive schema documentation
- ✅ Includes filter criteria for identifying general flows
- ✅ Documents all properties with types, enums, patterns
- ✅ Includes child arrays (objectWorkflowParam, objectWorkflowOutputVar)
- ✅ Provides examples for each property

**Schema Highlights:**
```typescript
filterCriteria: {
    isPage: 'false',
    isDynaFlow: 'false or not set',
    isDynaFlowTask: 'false or not set',
    namePattern: 'Does not end with "initobjwf" or "initreport"'
}
```

**Properties Documented:**
- `name` - PascalCase workflow identifier
- `isPage` - Must be "false" for general flows
- `isAuthorizationRequired` - Authorization flag
- `roleRequired` - Required role name
- `isExposedInBusinessObject` - API exposure flag
- `isCustomLogicOverwritten` - Custom code flag
- `isDynaFlowTask` - Must be "false" or not set
- `isRequestRunViaDynaFlowAllowed` - DynaFlow execution permission
- `pageIntroText` - Introduction text
- `pageTitleText` - Title text

**Assessment:** ✅ **Excellent** - Comprehensive and well-documented

---

### 2. get_general_flow

**Purpose:** Retrieve specific general flow with all details.

**Parameters:**
- `general_flow_name` (required) - Case-insensitive
- `owner_object_name` (optional) - Case-insensitive

**Returns:**
- Complete general flow object
- Owner object name
- Element counts (params, output vars, total)

**Features:**
- ✅ Supports search with or without owner object
- ✅ Case-insensitive matching
- ✅ Returns element counts for quick reference
- ✅ Removes temporary `_ownerObjectName` property
- ✅ Helpful error messages with suggestions

**Example Response:**
```json
{
    "success": true,
    "general_flow": { ... },
    "owner_object_name": "Order",
    "element_counts": {
        "paramCount": 3,
        "outputVarCount": 2,
        "totalElements": 5
    },
    "note": "General flow retrieved successfully..."
}
```

**Assessment:** ✅ **Excellent** - Well-implemented with good UX

---

### 3. list_general_flows

**Purpose:** List all general flows with optional filtering.

**Parameters:**
- `general_flow_name` (optional) - Exact match filter
- `owner_object` (optional) - Exact match filter

**Returns:** Array of general flow summaries:
```typescript
{
    name: string,
    ownerObject: string,
    roleRequired: string,
    paramCount: number,
    outputVarCount: number
}
```

**Features:**
- ✅ Summary view for quick scanning
- ✅ Includes counts for params/output vars
- ✅ Case-insensitive filtering
- ✅ Returns filter criteria used
- ✅ Suggests using `get_general_flow` for full details

**Assessment:** ✅ **Excellent** - Efficient listing with appropriate summary data

---

### 4. update_general_flow

**Purpose:** Update properties of an existing general flow.

**Parameters:**
- `general_flow_name` (required, case-sensitive)
- `updates` object with optional properties

**Updatable Properties:**
```typescript
{
    titleText?: string,
    isInitObjWFSubscribedToParams?: 'true' | 'false',
    layoutName?: string,
    introText?: string,
    codeDescription?: string,
    isHeaderVisible?: 'true' | 'false',
    isIgnored?: 'true' | 'false',
    sortOrder?: string
}
```

**⚠️ Issues Found:**

1. **Limited Property Support** - Only supports 8 properties out of ~10 available in schema
   - Missing: `isAuthorizationRequired`, `roleRequired`, `isExposedInBusinessObject`, `isCustomLogicOverwritten`, `isRequestRunViaDynaFlowAllowed`, `pageIntroText`, `pageTitleText`
   - Some properties have different names than schema (e.g., `introText` vs `pageIntroText`)

2. **Inconsistent Naming** - Uses different property names than schema:
   - Tool uses: `titleText`, `introText`
   - Schema uses: `pageTitleText`, `pageIntroText`

3. **Unexpected Properties** - Includes properties not in general flow schema:
   - `isInitObjWFSubscribedToParams` - Not documented in schema
   - `layoutName` - Not documented in schema
   - `isHeaderVisible` - Not documented in schema
   - `sortOrder` - Not documented in schema

**Recommendation:** ⚠️ **Needs Update** - Align with actual general flow schema properties

---

### 5. add_general_flow_param

**Purpose:** Add new input parameter to general flow.

**Parameters:**
- `general_flow_name` (required, case-sensitive)
- `param` object with many optional properties (34 properties supported!)

**Key Properties:**
- `name` (required) - PascalCase parameter name
- Data type properties: `sqlServerDBDataType`, `sqlServerDBDataTypeSize`
- UI properties: `labelText`, `infoToolTipText`, `detailsText`
- Validation: `isRequired`, `validationRuleRegExMatchRequired`
- FK properties: `isFK`, `fKObjectName`, `isFKLookup`
- Security: `isSecured`
- Source mapping: `sourceObjectName`, `sourcePropertyName`

**Features:**
- ✅ Comprehensive property support
- ✅ All UI-specific properties included (appropriate for general flows that may be called from UI context)
- ✅ Foreign key configuration
- ✅ Validation rules

**Assessment:** ✅ **Excellent** - Very comprehensive parameter creation

---

### 6. update_general_flow_param

**Purpose:** Update existing parameter properties.

**Parameters:**
- `general_flow_name` (required, case-sensitive)
- `param_name` (required, case-sensitive)
- `updates` object with same 34 properties as add tool

**Features:**
- ✅ Supports all 34 parameter properties
- ✅ Can rename parameter via `name` property
- ✅ Partial updates (only specified properties changed)
- ✅ Validation ensures at least one property to update

**Assessment:** ✅ **Excellent** - Matches add_param comprehensiveness

---

### 7. move_general_flow_param

**Purpose:** Reorder parameters by moving to new position.

**Parameters:**
- `general_flow_name` (required, case-sensitive)
- `param_name` (required, case-sensitive)
- `new_position` (required, 0-based index)

**Features:**
- ✅ Simple position-based reordering
- ✅ Returns old and new positions for verification
- ✅ 0-based indexing clearly documented

**Assessment:** ✅ **Good** - Simple and effective

---

### 8. add_general_flow_output_var

**Purpose:** Add new output variable to general flow.

**Parameters:**
- `general_flow_name` (required, case-sensitive)
- `output_var` object with many optional properties

**Key Properties:**
- `name` (required) - PascalCase variable name
- Data type: `dataType`, `dataSize` (maps to sqlServerDBDataType, sqlServerDBDataTypeSize)
- Source mapping: `sourceObjectName`, `sourcePropertyName`
- **⚠️ UI Properties Included:**
  - `labelText`
  - `isVisible`
  - `isLabelVisible`
  - `isHeaderText`
  - `isLink`
  - `conditionalVisiblePropertyName`
- Button properties: `buttonNavURL`, `buttonObjectWFName`, `buttonText`
- FK properties: `isFK`, `fKObjectName`, `isFKLookup`

**⚠️ Issue:** Tool includes UI-specific properties that were just hidden in the view:
- `labelText`
- `isVisible`
- `isLabelVisible`
- `isHeaderText`
- `isLink`
- `conditionalVisiblePropertyName`

**Question:** Should these UI properties be available in MCP tools even though they're hidden in the UI?

**Recommendation:** 
- **Option A:** Keep them available in MCP tools (power users might need them)
- **Option B:** Remove them to match UI restrictions (consistency)
- **Option C:** Add a note explaining these are available but typically not used for general flows

**Assessment:** ⚠️ **Needs Decision** - UI property mismatch with view

---

### 9. update_general_flow_output_var

**Purpose:** Update existing output variable properties.

**Parameters:**
- `general_flow_name` (required, case-sensitive)
- `output_var_name` (required, case-sensitive)
- `updates` object with same properties as add tool

**Features:**
- ✅ Comprehensive property support
- ✅ Can rename output variable
- ✅ Partial updates supported

**⚠️ Same Issue:** Includes UI properties that are hidden in view.

**Assessment:** ⚠️ **Needs Decision** - Consistent with add_output_var issue

---

### 10. move_general_flow_output_var

**Purpose:** Reorder output variables by position.

**Parameters:**
- `general_flow_name` (required, case-sensitive)
- `output_var_name` (required, case-sensitive)
- `new_position` (required, 0-based index)

**Features:**
- ✅ Position-based reordering
- ✅ Returns old and new positions

**Assessment:** ✅ **Good** - Simple and effective

---

## View Tools Analysis

### 11. open_general_workflows_list_view

**Status:** ✅ **Implemented**

**Command:** `appdna.showGeneralList`

**Description:** Opens list view showing all general flows.

**Implementation:**
```typescript
public async openGeneralWorkflowsList(): Promise<any> {
    return this.executeCommand('appdna.showGeneralList');
}
```

**Assessment:** ✅ **Works** - Simple command execution

---

### 12. open_add_general_flow_wizard

**Status:** ✅ **Implemented**

**Command:** `appdna.addGeneralFlow`

**Description:** Opens wizard for creating new general flows.

**Implementation:**
```typescript
public async openAddGeneralFlowWizard(): Promise<any> {
    return this.executeCommand('appdna.addGeneralFlow');
}
```

**Assessment:** ✅ **Works** - Wizard provides guided creation

---

### 13. open_general_workflow_details_view

**Status:** ⚠️ **NOT IMPLEMENTED**

**Command:** Would execute `appdna.showGeneralFlowDetails`

**Current Implementation:**
```typescript
public async openGeneralWorkflowDetails(workflowName: string, initialTab?: string): Promise<any> {
    throw new Error('General Workflow Details view is not yet implemented. Create general workflow details handler to add this functionality.');
}
```

**⚠️ Critical Issue:** Tool is registered in MCP server but throws error when called!

**Registration in server.ts:**
```typescript
this.server.registerTool('open_general_workflow_details_view', {
    title: 'Open General Workflow Details View',
    description: 'Shows details for a specific general workflow',
    inputSchema: {
        workflow_name: z.string(),
        initial_tab: z.string().optional()
    }
    ...
}, async ({ workflow_name, initial_tab }) => {
    const result = await this.viewTools.openGeneralWorkflowDetails(workflow_name, initial_tab);
    // This will always throw an error!
});
```

**Fix Required:**
```typescript
public async openGeneralWorkflowDetails(workflowName: string, initialTab?: string): Promise<any> {
    // Use HTTP bridge similar to other detail views
    const encodedName = encodeURIComponent(workflowName);
    const tabParam = initialTab ? `&initialTab=${encodeURIComponent(initialTab)}` : '';
    return this.executeCommand(`http://localhost:3002/open-view?view=generalFlowDetails&workflowName=${encodedName}${tabParam}`);
}
```

**Assessment:** ❌ **BROKEN** - Throws error, needs implementation

---

## Missing Tools (Compared to Other Workflows)

### Comparison with Page Init and Form Tools

| Feature | General Flow | Page Init | Form |
|---------|-------------|-----------|------|
| Get schema | ✅ | ❌ | ✅ |
| Get item | ✅ | ❌ | ✅ |
| List items | ✅ | ❌ | ✅ |
| Update item | ✅ | ❌ | ✅ |
| Add params | ✅ | ❌ | ✅ |
| Update params | ✅ | ❌ | ✅ |
| Move params | ✅ | ❌ | ✅ |
| Add output vars | ✅ | ✅ | ✅ |
| Update output vars | ✅ | ✅ | ✅ |
| Move output vars | ✅ | ✅ | ✅ |
| Add buttons | ❌ | ❌ | ✅ |
| **Create new item** | ❌ | ❌ | ✅ |
| **Delete item** | ❌ | ❌ | ❌ |
| **Update full item** | ✅ | ❌ | ❌ |

### ⚠️ Notable Missing Tool:

#### `create_general_flow`
**Status:** Not implemented

**Would Enable:**
- Programmatic creation of new general flows
- Currently must use wizard via `open_add_general_flow_wizard`

**Should Include:**
- Owner object name
- General flow name
- Role required
- Action type
- Target object (for "Add" actions)

**Similar to:** `create_form` tool which exists for forms

**Recommendation:** 🔴 **High Priority** - Add `create_general_flow` tool for completeness

---

## Architecture Patterns

### HTTP Bridge Communication

All data tools use the HTTP bridge pattern:
```typescript
private async fetchFromBridge(endpoint: string): Promise<any> {
    const http = await import('http');
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3001,
            path: endpoint,
            method: 'GET'
        }, (res) => {
            // Handle response
        });
        req.end();
    });
}
```

**Advantages:**
✅ Decouples MCP tools from ModelService  
✅ Consistent with other tool implementations  
✅ Works across process boundaries

---

## Property Schema Compliance

### Settings Properties Comparison

| Property | In Schema | In View | In Update Tool | Notes |
|----------|-----------|---------|---------------|-------|
| name | ✅ | N/A | ❌ | Can't rename via update_general_flow |
| isPage | ✅ | ❌ Hidden | ❌ | Correctly hidden (must be "false") |
| isAuthorizationRequired | ✅ | ❌ Hidden | ❌ | ⚠️ Should be in update tool |
| roleRequired | ✅ | ❌ Hidden | ❌ | ⚠️ Should be in update tool |
| isExposedInBusinessObject | ✅ | ✅ | ❌ | ⚠️ Should be in update tool |
| isCustomLogicOverwritten | ✅ | ✅ | ❌ | ⚠️ Should be in update tool |
| isDynaFlowTask | ✅ | ❌ Hidden | ❌ | Correctly hidden (must be "false") |
| isRequestRunViaDynaFlowAllowed | ✅ | ✅ | ❌ | ⚠️ Should be in update tool |
| pageIntroText | ✅ | ✅ | ❌ | ⚠️ Tool uses "introText" instead |
| pageTitleText | ✅ | ✅ | ❌ | ⚠️ Tool uses "titleText" instead |
| titleText | ❌ | ❌ | ✅ | ⚠️ Not in schema, tool uses it |
| introText | ❌ | ❌ | ✅ | ⚠️ Not in schema, tool uses it |
| isInitObjWFSubscribedToParams | ❌ | ❌ | ✅ | ⚠️ Not in schema |
| layoutName | ❌ | ❌ | ✅ | ⚠️ Not in schema |
| isHeaderVisible | ❌ | ❌ | ✅ | ⚠️ Not in schema |
| sortOrder | ❌ | ❌ | ✅ | ⚠️ Not in schema |
| codeDescription | ❌ | ❌ | ✅ | ⚠️ Not in schema |

**Problems:**
1. ⚠️ **Missing Properties:** Update tool missing 7 schema properties
2. ⚠️ **Wrong Names:** Uses `titleText`/`introText` instead of `pageTitleText`/`pageIntroText`
3. ⚠️ **Extra Properties:** Includes 6 properties not in schema

---

### Output Variable Properties Comparison

| Property | In Schema | In View | In Tools | Decision Needed |
|----------|-----------|---------|----------|-----------------|
| name | ✅ | ✅ | ✅ | ✅ Correct |
| sourceObjectName | ✅ | ✅ | ✅ | ✅ Correct |
| sourcePropertyName | ✅ | ✅ | ✅ | ✅ Correct |
| defaultValue | ✅ | ✅ | ✅ | ✅ Correct |
| sqlServerDBDataType | ✅ | ✅ | ✅ (as dataType) | ✅ Correct |
| sqlServerDBDataTypeSize | ✅ | ✅ | ✅ (as dataSize) | ✅ Correct |
| isFK | ✅ | ✅ | ✅ | ✅ Correct |
| isFKLookup | ✅ | ✅ | ✅ | ✅ Correct |
| fKObjectName | ✅ | ✅ | ✅ | ✅ Correct |
| isIgnored | ✅ | ✅ | ✅ | ✅ Correct |
| **labelText** | ✅ | ❌ Hidden | ✅ Available | ⚠️ **Mismatch** |
| **isVisible** | ✅ | ❌ Hidden | ✅ Available | ⚠️ **Mismatch** |
| **isLabelVisible** | ✅ | ❌ Hidden | ✅ Available | ⚠️ **Mismatch** |
| **isHeaderText** | ✅ | ❌ Hidden | ✅ Available | ⚠️ **Mismatch** |
| **isLink** | ✅ | ❌ Hidden | ✅ Available | ⚠️ **Mismatch** |
| **conditionalVisiblePropertyName** | ✅ | ❌ Hidden | ✅ Available | ⚠️ **Mismatch** |

**Decision Required:** Should MCP tools expose UI properties that are hidden in the view?

---

## Testing Coverage

### Unit Tests
⚠️ **Status:** No dedicated tests found for `generalFlowTools.ts`

**Recommendation:** Add test file `src/test/mcp-general-flow-tools.test.ts`

### Manual Testing Checklist
- [ ] Get general flow schema
- [ ] Get general flow by name (with owner)
- [ ] Get general flow by name (without owner)
- [ ] List all general flows
- [ ] List general flows filtered by name
- [ ] List general flows filtered by owner
- [ ] Update general flow properties
- [ ] Add parameter to general flow
- [ ] Update parameter properties
- [ ] Move parameter position
- [ ] Add output variable to general flow
- [ ] Update output variable properties
- [ ] Move output variable position
- [ ] Open list view
- [ ] Open add wizard
- [ ] ❌ Open details view (currently broken)

---

## Error Handling

### Good Practices:
✅ Validates required parameters  
✅ Returns structured error responses  
✅ Includes helpful notes about bridge requirements  
✅ Suggests related tools in error messages

### Example Error Response:
```json
{
    "success": false,
    "error": "General flow not found",
    "validationErrors": ["General flow does not exist"],
    "note": "Use open_general_workflows_list_view to see available general flows."
}
```

---

## Performance Considerations

✅ **Schema Caching:** Schema is computed once and reused  
✅ **Efficient Queries:** Bridge API supports filtering to reduce data transfer  
✅ **Summary Lists:** list_general_flows returns minimal data, full details on demand

---

## Documentation Quality

### Tool Descriptions
✅ **Excellent:** All tools have clear, detailed descriptions  
✅ **Examples:** Schema includes examples for all properties  
✅ **Context:** Explanations clarify when to use each tool  

### Schema Documentation
✅ **Comprehensive:** get_general_flow_schema returns extensive documentation  
✅ **Type Information:** All types, enums, patterns documented  
✅ **Validation Rules:** Regex patterns and requirements explained

---

## Integration Points

### Bridge API Endpoints Used
- `/api/general-flows` - List/get general flows
- `/api/update-general-flow` - Update properties
- `/api/update-full-general-flow` - Full replacement
- `/api/add-general-flow-param` - Add parameter
- `/api/update-general-flow-param` - Update parameter
- `/api/move-general-flow-param` - Move parameter
- `/api/add-general-flow-output-var` - Add output var
- `/api/update-general-flow-output-var` - Update output var
- `/api/move-general-flow-output-var` - Move output var

### MCP Server Registration
All 10 data tools properly registered in `src/mcp/server.ts` with Zod schemas.

---

## Recommendations

### 🔴 Critical (Fix Immediately)

1. **Fix open_general_workflow_details_view**
   - Currently throws error
   - Need to implement HTTP bridge call
   - Should match pattern from other detail views

2. **Fix update_general_flow Property Schema**
   - Remove properties not in schema (isInitObjWFSubscribedToParams, layoutName, isHeaderVisible, sortOrder, codeDescription)
   - Add missing schema properties (isAuthorizationRequired, roleRequired, isExposedInBusinessObject, isCustomLogicOverwritten, isRequestRunViaDynaFlowAllowed)
   - Rename titleText → pageTitleText, introText → pageIntroText

### 🟡 High Priority (Address Soon)

3. **Add create_general_flow Tool**
   - Enable programmatic creation
   - Match pattern from create_form tool
   - Support same parameters as Add General Flow Wizard

4. **Decide on UI Property Exposure**
   - Either keep UI properties in tools (document why)
   - Or remove them for consistency with view
   - Document decision in both tools and view

5. **Add Unit Tests**
   - Test all 10 tools
   - Test error conditions
   - Test bridge connection failures
   - Test validation

### 🟢 Medium Priority (Plan For)

6. **Add update_full_general_flow Registration**
   - Tool exists but not registered in server.ts
   - Would allow full schema replacement

7. **Consider Adding Batch Operations**
   - Bulk add parameters
   - Bulk add output variables
   - Similar to form bulk operations

8. **Add Delete/Soft-Delete Tool**
   - Set isIgnored="true" on general flow
   - Consistent with data object patterns

---

## Final Assessment

### Overall Grade: B+ (85/100)

**Strengths:**
- ✅ Comprehensive parameter and output variable management
- ✅ Excellent schema documentation
- ✅ Good error handling with helpful messages
- ✅ Consistent HTTP bridge architecture
- ✅ Case-insensitive search for better UX
- ✅ Element counts for quick reference

**Critical Issues:**
- ❌ open_general_workflow_details_view throws error (broken tool)
- ⚠️ update_general_flow uses wrong/extra properties
- ⚠️ UI property mismatch between view and tools
- ⚠️ No create_general_flow tool
- ⚠️ No unit tests

**Minor Issues:**
- ⚠️ update_full_general_flow exists but not registered
- ⚠️ Limited to 8 updatable properties vs 10 in schema

**Verdict:** The general flow MCP tools are well-architected and comprehensive for parameter/output variable management, but have critical issues with the update and view tools that must be fixed. The schema documentation is excellent. Once the broken view tool is fixed and update properties are aligned with schema, this will be an A-grade implementation.

---

## Related Documentation

- `general-flow-details-view-review.md` - UI view architecture
- `MCP_README.md` - Complete MCP documentation
- `docs/VIEWS-REFERENCE.md` - View catalog
- `app-dna.schema.json` - Schema reference

---

**Review Completed:** November 2, 2025  
**Next Review:** After implementing recommendations

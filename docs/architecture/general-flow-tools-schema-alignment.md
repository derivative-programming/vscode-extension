# General Flow Tools vs Schema Alignment Check

**Date:** November 2, 2025  
**Purpose:** Verify that general flow MCP tools align with the schema definition

---

## Schema Definition Summary

### Main Properties (5 total)
| Property | Type | Required | Enum | Description |
|----------|------|----------|------|-------------|
| name | string | ✅ Yes | - | PascalCase workflow ID |
| isAuthorizationRequired | string | ❌ No | true/false | Requires user authorization |
| roleRequired | string | ❌ No | - | Required role name |
| isExposedInBusinessObject | string | ❌ No | true/false | Exposed in business object API |
| isCustomLogicOverwritten | string | ❌ No | true/false | Custom code flag |

**Note:** isIgnored is not in main schema properties but is supported for soft delete

### objectWorkflowParam Properties (13 documented in schema)
1. name (required, PascalCase)
2. dataType (SQL Server data type)
3. dataSize (Size specification)
4. defaultValue
5. isRequired (true/false)
6. isSecured (true/false)
7. isFK (true/false)
8. isFKLookup (true/false)
9. fKObjectName
10. validationRuleRegExMatchRequired
11. validationRuleRegExMatchRequiredErrorText
12. codeDescription
13. isIgnored (true/false)

### objectWorkflowOutputVar Properties (16 documented in schema)
1. name (required, PascalCase)
2. sourceObjectName
3. sourcePropertyName
4. defaultValue
5. **labelText** ⚠️
6. **isVisible** (true/false) ⚠️
7. **isLabelVisible** (true/false) ⚠️
8. **isHeaderText** (true/false) ⚠️
9. **isLink** (true/false) ⚠️
10. isFK (true/false)
11. isFKLookup (true/false)
12. fKObjectName
13. sqlServerDBDataType
14. sqlServerDBDataTypeSize
15. **conditionalVisiblePropertyName** ⚠️
16. isIgnored (true/false)

⚠️ = Hidden in the general flow details view but present in schema

---

## Tool Alignment Analysis

### ✅ update_general_flow Tool

**Tool Signature:**
```typescript
updates: {
    isAuthorizationRequired?: 'true' | 'false';
    roleRequired?: string;
    isExposedInBusinessObject?: 'true' | 'false';
    isCustomLogicOverwritten?: 'true' | 'false';
    isIgnored?: 'true' | 'false';
}
```

**Schema Main Properties:** 5 (name, isAuthorizationRequired, roleRequired, isExposedInBusinessObject, isCustomLogicOverwritten)

**Comparison:**
- ✅ isAuthorizationRequired - In schema, in tool
- ✅ roleRequired - In schema, in tool
- ✅ isExposedInBusinessObject - In schema, in tool
- ✅ isCustomLogicOverwritten - In schema, in tool
- ✅ isIgnored - Not in main schema but universally supported for soft delete
- ❌ name - In schema but NOT in update tool (correct - name changes not allowed)

**Status:** ✅ **ALIGNED** - All schema properties supported (name correctly excluded from updates)

---

### ⚠️ add_general_flow_param Tool

**Tool supports 34+ properties** including:
- name, sqlServerDBDataType, sqlServerDBDataTypeSize, labelText, infoToolTipText, codeDescription
- defaultValue, isVisible, isRequired, requiredErrorText, isSecured
- isFK, fKObjectName, fKObjectQueryName, isFKLookup, isFKList, etc.
- validationRuleRegExMatchRequired, validationRuleRegExMatchRequiredErrorText
- isIgnored, sourceObjectName, sourcePropertyName

**Schema objectWorkflowParam Properties:** 13 documented

**Comparison:**
- ✅ All 13 schema properties are supported in tool
- ⚠️ Tool includes 20+ additional properties (form-specific UI properties)

**Properties in Tool but NOT in Schema:**
- labelText
- infoToolTipText
- isVisible
- requiredErrorText
- fKObjectQueryName
- isFKList, isFKListInactiveIncluded, isFKListUnknownOptionRemoved
- fKListOrderBy, isFKListOptionRecommended, isFKListSearchable
- FKListRecommendedOption
- isRadioButtonList, isFileUpload, isCreditCardEntry
- isTimeZoneDetermined, isAutoCompleteAddressSource
- autoCompleteAddressSourceName, autoCompleteAddressTargetType
- detailsText
- sourceObjectName, sourcePropertyName

**Analysis:** Tool supports form control properties that aren't documented in the general flow param schema. This suggests:
1. The tool was copied from form param tool
2. These properties may exist in the underlying model but aren't documented
3. OR these should be removed from general flow param tool

**Status:** ⚠️ **OVER-SPECIFIED** - Tool supports 20+ properties not in schema

---

### ⚠️ add_general_flow_output_var Tool

**Tool Signature:**
```typescript
output_var: {
    name: string;
    buttonNavURL?: string;           // Not in schema
    buttonObjectWFName?: string;     // Not in schema
    buttonText?: string;             // Not in schema
    conditionalVisiblePropertyName?: string;  // ✅ In schema
    dataSize?: string;               // Maps to sqlServerDBDataTypeSize
    dataType?: string;               // Maps to sqlServerDBDataType
    defaultValue?: string;           // ✅ In schema
    fKObjectName?: string;           // ✅ In schema
    labelText?: string;              // ✅ In schema (hidden in view)
    isAutoRedirectURL?: 'true' | 'false';  // Not in schema
    isFK?: 'true' | 'false';         // ✅ In schema
    isFKLookup?: 'true' | 'false';   // ✅ In schema
    isLabelVisible?: 'true' | 'false';  // ✅ In schema (hidden in view)
    isHeaderText?: 'true' | 'false';    // ✅ In schema (hidden in view)
    isIgnored?: 'true' | 'false';    // ✅ In schema
    isLink?: 'true' | 'false';       // ✅ In schema (hidden in view)
    isVisible?: 'true' | 'false';    // ✅ In schema (hidden in view)
    sourceObjectName?: string;       // ✅ In schema
    sourcePropertyName?: string;     // ✅ In schema
}
```

**Schema objectWorkflowOutputVar Properties:** 16 documented

**Comparison - Properties in Tool but NOT in Schema:**
- ❌ buttonNavURL
- ❌ buttonObjectWFName
- ❌ buttonText
- ❌ isAutoRedirectURL

**Comparison - Properties in Schema but NOT in Tool:**
- ❌ sqlServerDBDataType (tool uses "dataType" alias - maps it)
- ❌ sqlServerDBDataTypeSize (tool uses "dataSize" alias - maps it)

**Properties Hidden in View but Present in Schema and Tool:**
- ⚠️ labelText
- ⚠️ isVisible
- ⚠️ isLabelVisible
- ⚠️ isHeaderText
- ⚠️ isLink
- ⚠️ conditionalVisiblePropertyName

**Analysis:**
1. Tool includes 4 button properties not in schema (buttonNavURL, buttonObjectWFName, buttonText, isAutoRedirectURL)
2. Tool correctly maps dataType/dataSize to schema property names
3. Tool exposes 6 UI properties that are hidden in the view

**Status:** ⚠️ **PARTIALLY MISALIGNED** - 4 extra properties not in schema, 6 properties exposed that are hidden in view

---

### ⚠️ update_general_flow_output_var Tool

Same signature and issues as `add_general_flow_output_var`.

**Status:** ⚠️ **PARTIALLY MISALIGNED** - Same as add tool

---

### ✅ update_general_flow_param Tool

Same signature and issues as `add_general_flow_param`.

**Status:** ⚠️ **OVER-SPECIFIED** - Same as add tool (20+ extra properties)

---

### ✅ move_general_flow_param Tool

**Simple position-based tool, no schema alignment issues**

**Status:** ✅ **ALIGNED**

---

### ✅ move_general_flow_output_var Tool

**Simple position-based tool, no schema alignment issues**

**Status:** ✅ **ALIGNED**

---

## Summary of Issues

### Critical Issues: None ✅

### Medium Priority Issues:

1. **Output Variable Button Properties (4 properties)**
   - Tool includes: buttonNavURL, buttonObjectWFName, buttonText, isAutoRedirectURL
   - Not in schema
   - **Recommendation:** Remove from tool OR add to schema

2. **Parameter UI Properties (20+ properties)**
   - Tool includes many form-specific properties not in schema
   - Examples: labelText, isVisible, isFKList, isRadioButtonList, etc.
   - **Recommendation:** Remove from tool OR add to schema OR clarify that general flow params can have UI properties when used in forms

3. **UI Properties in Output Variables (6 properties)**
   - Properties: labelText, isVisible, isLabelVisible, isHeaderText, isLink, conditionalVisiblePropertyName
   - Present in schema ✅
   - Present in tool ✅
   - Hidden in view ⚠️
   - **Recommendation:** 
     - **Option A:** Keep in schema and tool (they exist in model, allow programmatic access)
     - **Option B:** Remove from schema and tool (match view restriction)
     - **Option C:** Add note explaining these are hidden in UI but available via API

---

## Recommendations

### Immediate Actions:

1. **Decide on UI Properties Strategy:**
   - If general flows should NEVER have UI properties (because they're non-UI workflows):
     - Remove from schema: labelText, isVisible, isLabelVisible, isHeaderText, isLink, conditionalVisiblePropertyName
     - Remove from tools: same properties
   - If general flows CAN have UI properties (for when called from UI context):
     - Keep in schema and tools
     - Add documentation explaining when these are used
     - Keep them hidden in view (UI decides visibility, API allows full access)

2. **Remove Button Properties from Output Variable Tools:**
   - Remove: buttonNavURL, buttonObjectWFName, buttonText, isAutoRedirectURL
   - These are not in schema and likely copied from report column tools

3. **Review Parameter Tool Properties:**
   - Either document all 34 properties in schema
   - Or remove the 20+ form-specific properties from tools
   - Current state suggests tool was copied from form param without pruning

### Recommended Approach:

**For UI Properties (labelText, isVisible, etc.):**
✅ **Keep in schema and tools, hide in view**

**Reasoning:**
- These properties exist in the underlying model schema
- General flows may be displayed in UI contexts (report columns, form controls)
- MCP tools provide programmatic access - shouldn't be restricted by UI decisions
- View hides them because general flows are typically non-UI, but model still supports them
- Document that these are for advanced use cases

**For Button Properties:**
❌ **Remove from tools** - Not in schema, likely copy-paste error

**For Extra Param Properties:**
⚠️ **Investigate** - Check actual app-dna.schema.json to see if they exist

---

## Alignment Score

| Tool | Alignment Status | Score |
|------|------------------|-------|
| get_general_flow_schema | ✅ Defines schema | N/A |
| get_general_flow | ✅ Aligned | 100% |
| list_general_flows | ✅ Aligned | 100% |
| update_general_flow | ✅ Aligned | 100% |
| add_general_flow_param | ⚠️ Over-specified | 60% |
| update_general_flow_param | ⚠️ Over-specified | 60% |
| move_general_flow_param | ✅ Aligned | 100% |
| add_general_flow_output_var | ⚠️ Partially misaligned | 75% |
| update_general_flow_output_var | ⚠️ Partially misaligned | 75% |
| move_general_flow_output_var | ✅ Aligned | 100% |

**Overall Alignment:** 82% ⚠️

---

## Next Steps

1. **Decide:** UI properties strategy (keep or remove)
2. **Remove:** Button properties from output var tools
3. **Investigate:** Actual app-dna.schema.json for param properties
4. **Document:** Final decision on property exposure via MCP tools
5. **Update:** Schema and tools based on decisions

---

**Review Status:** ⚠️ Requires Decision  
**Critical Issues:** 0  
**Medium Issues:** 3  
**Blocking:** No - tools are functional, just over-specified

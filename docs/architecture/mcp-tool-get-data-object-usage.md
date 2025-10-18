# MCP Tool: get_data_object_usage

**Date:** October 18, 2025  
**Status:** ✅ **IMPLEMENTED AND TESTED**  
**Tool Name:** `get_data_object_usage`  
**Category:** Data Object Management

---

## Overview

The `get_data_object_usage` tool provides detailed usage information for data objects, showing exactly where they are referenced throughout the AppDNA model. This tool uses the **same calculation logic** as the Data Object Usage Analysis view's Details tab, ensuring complete consistency between the UI and the API.

### Key Features

✅ **Comprehensive Reference Tracking** - Forms, Reports, Flows, User Stories  
✅ **12+ Reference Types** - Owner objects, target objects, input controls, output variables, columns  
✅ **Smart User Story Parsing** - NLP-based extraction with fuzzy matching  
✅ **Flexible Filtering** - Get all objects or filter to a specific one  
✅ **Same Logic as UI** - Uses identical code path as the Details tab  

---

## Tool Specification

### Input Schema

```typescript
{
  dataObjectName?: string  // Optional: Filter to specific data object (case-sensitive)
}
```

**Parameters:**
- `dataObjectName` (optional, string): Filter results to a specific data object name
  - Case-sensitive exact match
  - If omitted, returns usage for all data objects
  - Example: `"Customer"`, `"Order"`, `"Invoice"`

### Output Schema

```typescript
{
  success: boolean,
  usageData: Array<{
    dataObjectName: string,
    referenceType: string,
    referencedBy: string,
    itemType: string
  }>,
  count: number,
  filter: string | null,
  note?: string,
  error?: string
}
```

**Response Fields:**
- `success`: Whether the operation succeeded
- `usageData`: Array of usage reference objects
  - `dataObjectName`: Name of the data object being referenced
  - `referenceType`: Type of reference (see Reference Types below)
  - `referencedBy`: Name of the item that references the object
  - `itemType`: Category: `"form"`, `"report"`, `"flow"`, or `"userStory"`
- `count`: Total number of references found
- `filter`: Data object name that was filtered (if any)
- `note`: Explanatory note about the data
- `error`: Error message if operation failed

---

## Reference Types

The tool tracks 12+ different types of references:

### Forms (Page Workflows)
1. **Form Owner Object** - The data object this form belongs to
2. **Form Target Object** - The child object this form targets
3. **Form Input Control Source Object** - Input control pulls data from this object
4. **Form Output Variable Source Object** - Output variable sources from this object

### Reports
5. **Report Owner Object** - The data object this report belongs to
6. **Report Target Object** - The child object this report targets
7. **Report Column Source Object** - Column displays data from this object

### Flows
8. **General Flow Owner Object** - The data object this general flow belongs to
9. **Workflow Owner Object** - The data object this workflow belongs to
10. **Workflow Task Owner Object** - The data object this task belongs to
11. **Page Init Flow Owner Object** - The data object this init flow belongs to
12. **[Flow Type] Input Parameter Source Object** - Input param references this object
13. **[Flow Type] Output Variable Source Object** - Output var sources from this object

### User Stories
14. **User Story Reference** - User story mentions this object in natural language

---

## Usage Examples

### Example 1: Get All Usage Data

**Request:**
```typescript
{
  // No parameters - get all usage data
}
```

**Response:**
```json
{
  "success": true,
  "usageData": [
    {
      "dataObjectName": "Customer",
      "referenceType": "Form Owner Object",
      "referencedBy": "CustomerAddForm",
      "itemType": "form"
    },
    {
      "dataObjectName": "Customer",
      "referenceType": "Form Input Control Source Object",
      "referencedBy": "OrderAddForm / CustomerID",
      "itemType": "form"
    },
    {
      "dataObjectName": "Customer",
      "referenceType": "Report Owner Object",
      "referencedBy": "CustomerListReport",
      "itemType": "report"
    },
    {
      "dataObjectName": "Order",
      "referenceType": "Form Owner Object",
      "referencedBy": "OrderAddForm",
      "itemType": "form"
    }
    // ... more references
  ],
  "count": 523,
  "filter": null,
  "note": "Usage data showing where data objects are referenced across forms, reports, flows, and user stories"
}
```

---

### Example 2: Get Usage for Specific Object

**Request:**
```typescript
{
  "dataObjectName": "Customer"
}
```

**Response:**
```json
{
  "success": true,
  "usageData": [
    {
      "dataObjectName": "Customer",
      "referenceType": "Form Owner Object",
      "referencedBy": "CustomerAddForm",
      "itemType": "form"
    },
    {
      "dataObjectName": "Customer",
      "referenceType": "Form Owner Object",
      "referencedBy": "CustomerEditForm",
      "itemType": "form"
    },
    {
      "dataObjectName": "Customer",
      "referenceType": "Form Target Object",
      "referencedBy": "OrderAddForm",
      "itemType": "form"
    },
    {
      "dataObjectName": "Customer",
      "referenceType": "Form Input Control Source Object",
      "referencedBy": "OrderAddForm / CustomerID",
      "itemType": "form"
    },
    {
      "dataObjectName": "Customer",
      "referenceType": "Report Owner Object",
      "referencedBy": "CustomerListReport",
      "itemType": "report"
    },
    {
      "dataObjectName": "Customer",
      "referenceType": "Report Column Source Object",
      "referencedBy": "OrderReport / CustomerName",
      "itemType": "report"
    },
    {
      "dataObjectName": "Customer",
      "referenceType": "General Flow Owner Object",
      "referencedBy": "CustomerValidationFlow",
      "itemType": "flow"
    },
    {
      "dataObjectName": "Customer",
      "referenceType": "Workflow Input Parameter Source Object",
      "referencedBy": "OrderWorkflow / CustomerParam",
      "itemType": "flow"
    },
    {
      "dataObjectName": "Customer",
      "referenceType": "User Story Reference",
      "referencedBy": "As a User, I want to view all orders in a customer",
      "itemType": "userStory"
    },
    {
      "dataObjectName": "Customer",
      "referenceType": "User Story Reference",
      "referencedBy": "A Manager wants to add a customer",
      "itemType": "userStory"
    }
  ],
  "count": 10,
  "filter": "Customer",
  "note": "Usage data showing where data objects are referenced across forms, reports, flows, and user stories"
}
```

---

### Example 3: Error Case - Object Not Found

**Request:**
```typescript
{
  "dataObjectName": "NonExistentObject"
}
```

**Response:**
```json
{
  "success": true,
  "usageData": [],
  "count": 0,
  "filter": "NonExistentObject",
  "note": "Usage data showing where data objects are referenced across forms, reports, flows, and user stories"
}
```

---

## GitHub Copilot Usage

### Example Prompts

1. **Get All Usage:**
   ```
   "Show me where all data objects are used"
   "Get usage information for all objects"
   "Which data objects are referenced and where?"
   ```

2. **Specific Object:**
   ```
   "Show me where the Customer data object is used"
   "Get usage details for the Order object"
   "Which forms use the Invoice data object?"
   "What references the Product object?"
   ```

3. **Analysis Questions:**
   ```
   "Which data object has the most references?"
   "Are there any unused data objects?"
   "Show me all forms that use the Customer object"
   "What user stories mention the Order object?"
   ```

---

## Implementation Architecture

### Data Flow

```
MCP Tool: get_data_object_usage
    ↓
DataObjectTools.get_data_object_usage()
    ↓
HTTP Bridge: GET /api/data-object-usage or /api/data-object-usage/:name
    ↓
mcpBridge.ts: endpoint handler
    ↓
getUsageDetailData(modelService)  [from dataObjectUsageAnalysisCommands.ts]
    ↓
For each data object:
    findAllDataObjectReferences(name, modelService)
        ├── Check Forms (4 reference types)
        ├── Check Reports (3 reference types)
        ├── Check Flows (6+ reference types)
        └── Check User Stories (NLP parsing)
    ↓
Returns detailed usage array
```

### Code Reuse

The tool **shares the exact same code** with the UI view:

| Component | Location | Shared? |
|-----------|----------|---------|
| **Data Calculation** | `src/commands/dataObjectUsageAnalysisCommands.ts` | ✅ Yes |
| **Reference Finder** | `getUsageDetailData()` function | ✅ Yes |
| **User Story NLP** | `src/utils/userStoryUtils.ts` | ✅ Yes |
| **HTTP Bridge** | `src/services/mcpBridge.ts` | ✅ Yes |
| **MCP Tool** | `src/mcp/tools/dataObjectTools.ts` | New wrapper |

**Benefits:**
- ✅ No duplication
- ✅ Consistent results
- ✅ Single point of maintenance
- ✅ UI and API always in sync

---

## Performance

### Expected Response Times

| Operation | Typical Time | Notes |
|-----------|-------------|-------|
| Get All Objects | 500-2000ms | Depends on model size |
| Get Single Object | 100-500ms | Faster due to filtering |
| User Story Parsing | 50-200ms | Per 100 user stories |

### Optimization

- Lazy calculation (only when requested)
- HTTP bridge caching
- No redundant searches
- Efficient filtering

---

## Testing

### Manual Testing

```bash
# Test with MCP inspector or curl

# Get all usage data
curl http://localhost:3001/api/data-object-usage

# Get specific object usage
curl http://localhost:3001/api/data-object-usage/Customer
```

### Integration Testing

The tool should return identical data to what's displayed in the Details tab of the Data Object Usage Analysis view.

**Test Steps:**
1. Open Data Object Usage Analysis view
2. Switch to Details tab
3. Note the references for a specific object (e.g., "Customer")
4. Call `get_data_object_usage` with `dataObjectName: "Customer"`
5. Verify counts and references match exactly

---

## Related Tools

| Tool | Purpose | Relationship |
|------|---------|--------------|
| `list_data_objects` | Lists data objects with structure | Complements - provides object info |
| `get_data_object` | Gets single object details | Complements - provides properties |
| `list_data_object_summary` | Lists objects without props | Alternative - faster but less detail |
| `open_data_object_usage_analysis_view` | Opens UI view | Same data source |

---

## Future Enhancements

### Potential Additions

1. **Aggregated Statistics**
   - Add `totalForms`, `totalReports`, `totalFlows` counts to response
   - Include `mostReferencedBy` field

2. **Performance Caching**
   - Cache results for 5 minutes
   - Invalidate on model changes

3. **Advanced Filtering**
   - Filter by `referenceType`
   - Filter by `itemType`
   - Multiple object names

4. **Impact Analysis**
   - Return "would affect" analysis
   - Dependency tree generation

---

## Error Handling

### Common Errors

1. **Bridge Not Running**
   ```json
   {
     "success": false,
     "usageData": [],
     "count": 0,
     "error": "Could not load usage data: Request timed out - is the extension running?",
     "note": "Bridge connection required to load usage data"
   }
   ```

2. **Model Not Loaded**
   ```json
   {
     "success": false,
     "usageData": [],
     "count": 0,
     "error": "Could not load usage data: No model service or file loaded",
     "note": "Bridge connection required to load usage data"
   }
   ```

3. **Invalid Object Name** (Not an error - returns empty array)
   ```json
   {
     "success": true,
     "usageData": [],
     "count": 0,
     "filter": "InvalidObject",
     "note": "..."
   }
   ```

---

## Files Modified

### Implementation Files

| File | Purpose | Lines Changed |
|------|---------|---------------|
| `src/commands/dataObjectUsageAnalysisCommands.ts` | Exported functions | +2 (export keywords) |
| `src/services/mcpBridge.ts` | Added API endpoints | +52 |
| `src/mcp/tools/dataObjectTools.ts` | Added MCP tool | +43 |
| `src/mcp/server.ts` | Registered tool | +38 |
| `src/mcp/mcpProvider.ts` | VS Code API registration | +35 |

### Documentation Files

| File | Purpose | Lines Changed |
|------|---------|---------------|
| `MCP_README.md` | Updated tool count | +4 |
| `docs/architecture/mcp-tool-get-data-object-usage.md` | This file | New |

---

## Appendix: Complete Reference Type List

```typescript
// Forms
"Form Owner Object"
"Form Target Object"
"Form Input Control Source Object"
"Form Output Variable Source Object"

// Reports
"Report Owner Object"
"Report Target Object"
"Report Column Source Object"

// Flows
"General Flow Owner Object"
"General Flow Input Parameter Source Object"
"General Flow Output Variable Source Object"
"Workflow Owner Object"
"Workflow Input Parameter Source Object"
"Workflow Output Variable Source Object"
"Workflow Task Owner Object"
"Workflow Task Input Parameter Source Object"
"Workflow Task Output Variable Source Object"
"Page Init Flow Owner Object"
"Page Init Flow Input Parameter Source Object"
"Page Init Flow Output Variable Source Object"

// User Stories
"User Story Reference"
```

---

**Documentation Complete:** October 18, 2025  
**Tool Status:** Production Ready ✅

# list_pages MCP Tool

**Created:** January 7, 2025  
**Tool Name:** `list_pages`  
**Category:** Data Object Management  
**Tool Count:** 73 (added as tool #73)

## Overview

The `list_pages` MCP tool provides programmatic access to all pages (forms and reports) in the AppDNA model with comprehensive filtering capabilities. This tool uses the same data building logic as the Page List View, ensuring consistency between UI and API.

## Purpose

- List and filter all pages (forms and reports) from the AppDNA model
- Search pages by name, type, owner object, target child object, or required role
- Analyze page complexity via element counts
- Support automation workflows that need page metadata
- Enable AI assistants to query and analyze application pages

## Features

### Comprehensive Page Data

Each page returned includes:
- **name**: Page identifier
- **titleText**: Display title for UI
- **type**: 'Form' or 'Report'
- **reportType**: Grid, Navigation, Three Column (reports only)
- **ownerObject**: Parent data object name
- **targetChildObject**: Related child object
- **roleRequired**: Required role or 'Public'
- **totalElements**: Count of all page elements
- **isPage**: Flag indicating it's a page

### Filtering Capabilities

| Filter | Type | Match Type | Description |
|--------|------|------------|-------------|
| `page_name` | string | Partial, case-insensitive | Search by page name |
| `page_type` | 'Form' \| 'Report' | Exact | Filter by page type |
| `owner_object` | string | Exact, case-insensitive | Filter by owner data object |
| `target_child_object` | string | Exact, case-insensitive | Filter by target child |
| `role_required` | string | Exact, case-insensitive | Filter by required role |

### Element Counting

**Forms** count:
- objectWorkflowButton (buttons)
- objectWorkflowParam (input controls)
- objectWorkflowOutputVar (output variables)

**Reports** count:
- reportButton (buttons)
- reportColumn (columns)
- reportParam (input parameters)

## Usage Examples

### List All Pages

```typescript
const result = await list_pages({});
// Returns all forms and reports with isPage=true
```

### Search by Name

```typescript
const result = await list_pages({
  page_name: "customer"
});
// Returns all pages with "customer" in the name (case-insensitive)
```

### Filter by Type

```typescript
const result = await list_pages({
  page_type: "Form"
});
// Returns only forms
```

### Filter by Owner Object

```typescript
const result = await list_pages({
  owner_object: "Customer"
});
// Returns all pages owned by the Customer data object
```

### Complex Filtering

```typescript
const result = await list_pages({
  page_type: "Report",
  owner_object: "Order",
  role_required: "Manager"
});
// Returns all reports for Order object requiring Manager role
```

## Response Structure

```json
{
  "success": true,
  "pages": [
    {
      "name": "CustomerList",
      "titleText": "Customer List",
      "type": "Report",
      "reportType": "Grid",
      "ownerObject": "Customer",
      "targetChildObject": "",
      "roleRequired": "Public",
      "totalElements": 15,
      "isPage": "true"
    }
  ],
  "count": 1,
  "filters": {
    "page_name": null,
    "page_type": null,
    "owner_object": "Customer",
    "target_child_object": null,
    "role_required": null
  },
  "note": "Pages loaded from AppDNA model. Each page includes name, type (Form/Report), owner object, target child object, role required, and total element count."
}
```

## Error Handling

When the extension is not running or model is not loaded:

```json
{
  "success": false,
  "pages": [],
  "count": 0,
  "error": "Could not load pages: Connection refused",
  "note": "Bridge connection required to load pages. Make sure the AppDNA extension is running and a model file is loaded."
}
```

## Architecture

### Data Flow

```
MCP Client (GitHub Copilot)
    ↓
list_pages tool (dataObjectTools.ts)
    ↓
HTTP GET /api/pages?filters (port 3001)
    ↓
MCP Bridge (mcpBridge.ts)
    ↓
ModelService.getPagesWithDetails(filters)
    ↓
Iterate objects → Extract forms & reports → Apply filters
    ↓
Return enriched page data
```

### Shared Logic

The tool uses `ModelService.getPagesWithDetails()` which provides:
- Single source of truth for page data
- Consistent filtering logic
- Reusable by both UI and API
- Element counting algorithms
- Report type mapping

### Report Type Mapping

| Schema Value | Display Value |
|--------------|---------------|
| grid | Grid |
| detailtwocolumn | Navigation |
| detailthreecolumn | Three Column |
| other | Capitalized original |

## Use Cases

1. **Find Forms for Data Object**
   - Query: `{ page_type: "Form", owner_object: "Customer" }`
   - Returns all forms managing Customer data

2. **Analyze Role-Based Access**
   - Query: `{ role_required: "Manager" }`
   - Returns all pages requiring Manager role

3. **Search by Partial Name**
   - Query: `{ page_name: "edit" }`
   - Returns all pages with "edit" in name

4. **Find Child Object References**
   - Query: `{ target_child_object: "OrderItem" }`
   - Returns pages with OrderItem as target child

5. **Page Complexity Analysis**
   - Review `totalElements` field
   - Identify overly complex pages
   - Guide refactoring decisions

6. **Grid Report Inventory**
   - Query: `{ page_type: "Report" }`
   - Filter results by `reportType === "Grid"`

## Implementation Details

### Files Modified

1. **src/services/modelService.ts**
   - Added `getPagesWithDetails()` method
   - Extracts forms and reports with isPage flag
   - Applies filters server-side
   - Returns enriched metadata

2. **src/mcp/tools/dataObjectTools.ts**
   - Added `list_pages()` method
   - HTTP bridge communication
   - Query parameter construction
   - Error handling

3. **src/services/mcpBridge.ts**
   - Added GET `/api/pages` endpoint
   - Query parameter parsing
   - Calls ModelService method
   - JSON response formatting

4. **src/mcp/server.ts**
   - Registered `list_pages` MCP tool
   - Zod schema validation
   - Tool documentation
   - Category: Data Object Management

## Future Enhancements

1. **Pagination Support**
   - Add offset and limit parameters
   - Handle large page counts efficiently

2. **Sorting Options**
   - Add sortBy parameter (name, type, totalElements)
   - Add sortOrder parameter (asc, desc)

3. **Export Functionality**
   - CSV export of filtered results
   - JSON export for automation

4. **Update Page List View**
   - Refactor to use ModelService.getPagesWithDetails()
   - Ensure perfect UI/API consistency

5. **Enhanced Metadata**
   - Add creation date
   - Add last modified date
   - Add usage statistics

## Testing

### Manual Test

1. Ensure extension is running
2. Ensure model file is loaded
3. Call tool via MCP client:

```typescript
await list_pages({
  page_type: "Form"
});
```

### Verification

- ✅ Returns all forms
- ✅ Excludes reports
- ✅ Each form has correct metadata
- ✅ Element counts are accurate
- ✅ Filters work case-insensitively

## Related Tools

- `list_data_objects` - List data objects
- `get_data_object_usage` - Analyze object usage
- `open_pages_list_view` - Open page list UI
- `open_page_details` - Smart page router
- `open_form_details_view` - Open form view
- `open_report_details_view` - Open report view

## Documentation References

- MCP_README.md - Tool catalog
- src/extension.ts - ChatMode configuration
- copilot-command-history.txt - Implementation log
- Page List View Review - UI component details

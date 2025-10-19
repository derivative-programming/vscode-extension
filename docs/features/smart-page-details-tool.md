# Smart Page Details MCP Tool Implementation

**Date:** October 19, 2025  
**Feature:** Intelligent page details router  
**Status:** ✅ Implemented

## Overview

Added a new MCP tool `open_page_details` that intelligently determines whether a page name refers to a form or report, then opens the appropriate details view automatically.

## Problem Statement

Previously, users needed to know whether a page was implemented as a form or report before opening its details view. They had to manually choose between:
- `open_form_details_view` - For forms
- `open_report_details_view` - For reports

This created friction when users just wanted to view/edit "a page" without knowing its underlying implementation type.

## Solution

Created a smart router tool that:
1. **Accepts any page name** (form or report)
2. **Automatically determines the type** by querying the HTTP bridge
3. **Routes to the appropriate view** (form or report details)
4. **Falls back gracefully** if type cannot be determined

## Implementation Details

### 1. New Method in ViewTools (`src/mcp/tools/viewTools.ts`)

**Method:** `openPageDetailsView(pageName: string, initialTab?: string)`

**Logic Flow:**
```
1. Query HTTP bridge for forms list (port 3001)
2. Check if pageName exists in forms
   ├─ YES → Call openFormDetails()
   └─ NO → Continue to step 3

3. Query HTTP bridge for reports list (port 3001)
4. Check if pageName exists in reports
   ├─ YES → Call openReportDetails()
   └─ NO → Continue to step 5

5. Fallback strategy (if bridge unavailable or name not found):
   ├─ Try openReportDetails() first (more common)
   └─ If fails, try openFormDetails()
   └─ If both fail, return helpful error message
```

**Key Features:**
- Uses HTTP bridge (port 3001) to fetch live data
- Graceful fallback when bridge unavailable
- Preserves `initialTab` parameter for both view types
- Detailed error messages for troubleshooting

### 2. New MCP Tool Registration (`src/mcp/server.ts`)

**Tool Name:** `open_page_details`

**Input Schema:**
```typescript
{
  pageName: string,        // Required: Name of page (form or report)
  initialTab?: string      // Optional: Initial tab to display
}
```

**Output Schema:**
```typescript
{
  success: boolean,
  view?: string,
  pageName?: string,
  pageType?: string,       // Type of page opened: "form" or "report"
  initialTab?: string,
  message?: string,
  error?: string
}
```

**Features:**
- Comprehensive input validation
- Detailed output including page type
- Error handling with descriptive messages

## Usage Examples

### With GitHub Copilot

```
"Show me the CustomerRegistration page details"
→ Tool determines it's a form and opens form details view

"Open the SalesReport page"
→ Tool determines it's a report and opens report details view

"View page CustomerDashboard settings tab"
→ Tool routes to correct view and opens settings tab
```

### Direct Tool Call

```json
{
  "tool": "open_page_details",
  "parameters": {
    "pageName": "CustomerRegistration",
    "initialTab": "settings"
  }
}
```

## Benefits

### 1. **Improved User Experience**
- Users don't need to know implementation details
- Natural language queries work better
- Reduces cognitive load

### 2. **Simplified Workflows**
- Single tool for all page details
- Consistent interface regardless of page type
- Less training required for new users

### 3. **Better Error Messages**
- Clear feedback when page not found
- Helpful suggestions in error messages
- Easier troubleshooting

### 4. **Future-Proof**
- Easy to extend to other page types
- HTTP bridge provides live data
- Type detection logic centralized

## Documentation Updates

Updated all documentation to reflect the new tool:

| File | Update |
|------|--------|
| `MCP_README.md` | Added to Form & Page Views section, tool count: 70 → 71 |
| `.github/copilot-instructions.md` | Updated tool count reference |
| `WIZARD-MCP-TOOLS-SUMMARY.md` | Updated tool count and category |
| `src/extension.ts` (ChatMode) | Added to YAML frontmatter, updated descriptions |

## Tool Count Update

**New Total:** 71 tools (was 70)

### Category Breakdown (Updated)
- User Story Management: 5 tools
- Role Management: 4 tools
- Lookup Management: 4 tools
- Data Object Management: 10 tools
- Wizard Tools: 3 tools
- User Story Views: 7 tools
- Data Object Views: 6 tools
- **Form & Page Views: 7 tools** (was 6, +1 for smart router)
- Workflow Views: 7 tools
- Report & API Views: 3 tools
- Analysis & Metrics Views: 3 tools
- System & Configuration Views: 9 tools
- Welcome & Help Views: 4 tools
- Schema Tools: 5 tools
- Utility Tools: 1 tool

## Technical Notes

### HTTP Bridge Endpoints Used
- `GET /api/forms` - Returns array of form objects with names
- `GET /api/reports` - Returns array of report objects with names

### Error Handling Strategy
1. **Bridge unavailable** - Fallback to direct view opening attempts
2. **Page not found** - Clear error message with suggestions
3. **View opening fails** - Try alternative view before giving up

### Performance Considerations
- Bridge requests timeout after 3 seconds
- Parallel checks not needed (sequential is fast enough)
- Results not cached (ensures always current data)

## Testing Checklist

- ✅ TypeScript compilation successful
- ✅ Tool registered in MCP server
- ✅ Method added to ViewTools
- ✅ Documentation updated across all files
- ✅ Tool count verified: 71 tools
- ✅ YAML frontmatter includes new tool

## Future Enhancements

Potential improvements for future versions:

1. **Caching** - Cache bridge responses for short duration
2. **Bulk Queries** - Determine types for multiple pages at once
3. **Type Hints** - Return confidence scores for type detection
4. **More Page Types** - Support APIs, workflows, etc.
5. **Fuzzy Matching** - Suggest similar names if exact match not found

## Related Tools

The smart router complements existing tools:
- `open_form_details_view` - Direct form opening (still available)
- `open_report_details_view` - Direct report opening (still available)
- `open_pages_list_view` - Browse all pages
- `open_page_preview_view` - Preview page UI

## Files Modified

1. **`src/mcp/tools/viewTools.ts`** - Added `openPageDetailsView()` method
2. **`src/mcp/server.ts`** - Registered `open_page_details` tool
3. **`MCP_README.md`** - Updated tool count and descriptions
4. **`.github/copilot-instructions.md`** - Updated tool count
5. **`WIZARD-MCP-TOOLS-SUMMARY.md`** - Updated tool count
6. **`src/extension.ts`** - Updated ChatMode content and YAML

## Summary

The `open_page_details` tool provides an intelligent, user-friendly way to access page details without requiring users to know whether a page is implemented as a form or report. This improves the developer experience and makes the extension more intuitive to use.

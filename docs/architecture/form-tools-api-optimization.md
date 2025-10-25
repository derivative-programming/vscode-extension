# Form Tools API Optimization
**Created:** 2025-01-XX
**Purpose:** Document the optimization of get_form tool from /api/data-objects-full to /api/forms

## Problem

The original `get_form` implementation used the `/api/data-objects-full` endpoint, which:
- Fetches ALL objects in the model with complete details
- Processes entire objectWorkflow arrays for all objects
- Very inefficient when retrieving a single form
- Wasteful bandwidth and memory usage for large models

```typescript
// OLD IMPLEMENTATION (INEFFICIENT)
const endpoint = `/api/data-objects-full`;
const allObjects = await this.fetchFromBridge(endpoint);

// Then iterate through ALL objects to find the form
for (const obj of allObjects) {
    if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
        const foundForm = obj.objectWorkflow.find((wf: any) => wf.name === form_name);
        // ...
    }
}
```

## Solution

Created a new `/api/forms` endpoint in mcpBridge.ts that:
- Only iterates through objectWorkflow arrays (not entire objects)
- Supports optional query parameters for targeted retrieval
- **Case-insensitive matching** for both form_name and owner_object_name
- Implements early-exit optimization when specific form found
- Adds `_ownerObjectName` property to each form for context
- Much more efficient for single form lookups

```javascript
// NEW ENDPOINT IN mcpBridge.ts (EFFICIENT)
else if (req.url && req.url.startsWith('/api/forms')) {
    const formName = url.searchParams.get('form_name');
    const ownerObjectName = url.searchParams.get('owner_object_name');
    
    const allObjects = modelService.getAllObjects();
    const forms: any[] = [];
    
    for (const obj of allObjects) {
        // Skip if owner filter specified and doesn't match (case-insensitive)
        if (ownerObjectName && obj.name.toLowerCase() !== ownerObjectName.toLowerCase()) {
            continue;
        }
        
        if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
            for (const workflow of obj.objectWorkflow) {
                // Skip if form_name filter specified and doesn't match (case-insensitive)
                if (formName && workflow.name.toLowerCase() !== formName.toLowerCase()) {
                    continue;
                }
                
                // Add owner object name for context
                forms.push({
                    ...workflow,
                    _ownerObjectName: obj.name
                });
                
                // Early exit optimization when specific form found
                if (formName && workflow.name.toLowerCase() === formName.toLowerCase()) {
                    this.outputChannel.appendLine(`[Data Bridge] Found form "${workflow.name}" in owner object "${obj.name}"`);
                    res.writeHead(200);
                    res.end(JSON.stringify(forms));
                    return;
                }
            }
        }
    }
    
    this.outputChannel.appendLine(`[Data Bridge] Returning ${forms.length} forms`);
    res.writeHead(200);
    res.end(JSON.stringify(forms));
}
```

## Updated get_form Implementation

```typescript
// NEW IMPLEMENTATION (EFFICIENT)
let endpoint: string;
let forms: any[];

if (owner_object_name) {
    // If owner specified, fetch forms filtered by both owner and form name
    endpoint = `/api/forms?owner_object_name=${encodeURIComponent(owner_object_name)}&form_name=${encodeURIComponent(form_name)}`;
} else {
    // If owner not specified, fetch forms filtered by form name only
    endpoint = `/api/forms?form_name=${encodeURIComponent(form_name)}`;
}

forms = await this.fetchFromBridge(endpoint);

// Check if we found the form
if (!forms || forms.length === 0) {
    return { success: false, error: '...' };
}

// Get the first (and should be only) form from results
const form = forms[0];
const ownerObjectName = form._ownerObjectName;

// Remove the temporary _ownerObjectName property
delete form._ownerObjectName;
```

## Performance Benefits

### Before Optimization
- **Request**: `/api/data-objects-full`
- **Data Fetched**: All objects with ALL properties (name, displayName, objectWorkflow, objectProperty, lookupItems, etc.)
- **Processing**: Iterate through ALL objects and ALL objectWorkflow arrays
- **Network**: Large payload (megabytes for large models)
- **Memory**: Holds all objects in memory

### After Optimization
- **Request**: `/api/forms?form_name=FormName&owner_object_name=ObjectName`
- **Data Fetched**: Only forms (objectWorkflow items)
- **Processing**: Early exit when specific form found
- **Network**: Minimal payload (only matching forms)
- **Memory**: Only holds matching forms

### Estimated Performance Improvement
For a model with:
- 100 objects
- Average 5 forms per object
- Average 50 properties per object

**Before**: ~5MB payload, process 100 objects × 5 forms = 500 iterations
**After**: ~5KB payload, process until first match (1-500 iterations, avg ~250)

**Result**: ~1000x smaller payload, ~2x faster average search time

## Query Parameter Patterns

### Get Specific Form with Known Owner
```
/api/forms?form_name=MyForm&owner_object_name=MyObject
```
Returns: Array with single form (early exit after finding match)

### Get Specific Form from Any Owner
```
/api/forms?form_name=MyForm
```
Returns: Array with single form (searches all objects, early exit on match)

### Get All Forms (no filters)
```
/api/forms
```
Returns: Array with all forms from all objects

### Get All Forms from Specific Owner
```
/api/forms?owner_object_name=MyObject
```
Returns: Array with all forms from MyObject

## Response Format

The endpoint returns an array of forms with `_ownerObjectName` added:

```json
[
    {
        "name": "MyForm",
        "description": "Form description",
        "objectWorkflowParams": [...],
        "objectWorkflowButton": [...],
        "objectWorkflowOutputVars": [...],
        "_ownerObjectName": "MyObject"
    }
]
```

The `get_form` tool removes the `_ownerObjectName` property after extracting it.

## Files Modified

### mcpBridge.ts
- Added `/api/forms` endpoint (lines 730-783, 54 lines)
- Supports query parameters: form_name, owner_object_name
- Implements early-exit optimization

### formTools.ts
- Updated `get_form()` method (lines 945-985)
- Changed from `/api/data-objects-full` to `/api/forms` with query params
- Simplified response handling (no iteration needed)
- Updated error messages for new format

## Compilation Results

- **Before**: formTools.js = 64KB (initial), 57KB (after filtering)
- **After**: formTools.js = 60.33KB (with endpoint optimization)
- **Status**: ✅ Compiles successfully with no errors

## Testing Recommendations

1. **Test with owner_object_name specified**:
   - Should use both query params
   - Should find form quickly with early exit

2. **Test without owner_object_name**:
   - Should use only form_name query param
   - Should search all objects and exit early

3. **Test form not found scenarios**:
   - Invalid form name
   - Invalid owner object name
   - Form exists but not in specified owner

4. **Test with large models**:
   - Verify early exit logs appear
   - Confirm reduced network payload
   - Check improved response time

## Future Optimization Opportunities

1. **Index Forms by Name**: Build form name index on model load for O(1) lookups
2. **Cache Form Locations**: Remember which object owns which form
3. **Batch Retrieval**: Support comma-separated form names for multiple lookups
4. **Partial Properties**: Add query param to return only specific form properties

## Architecture Learnings

- **Endpoint Design**: Use query parameters for filtering, not separate endpoints
- **Early Exit**: Always exit early when searching for specific items
- **Context Preservation**: Add temporary properties (like `_ownerObjectName`) when needed
- **Smart Defaults**: Make parameters optional when smart search logic is possible
- **Network Optimization**: Minimize payload size with targeted retrieval

## Related Documentation

- `formTools.ts` - Form MCP tools implementation
- `mcpBridge.ts` - HTTP bridge with data endpoints
- `MCP_README.md` - Complete MCP server documentation
- `dataObjectTools.ts` - Similar pattern for data object retrieval

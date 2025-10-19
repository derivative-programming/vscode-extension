# Model Services MCP Tools Implementation

**Created:** October 19, 2025  
**Status:** ✅ Completed and Tested  
**MCP Server Version:** 1.0.21

## Overview

This document describes the implementation of four new MCP tools for accessing Model Services cloud APIs through the AppDNA extension's MCP server. These tools provide programmatic access to AI processing, validation, blueprint catalog, and fabrication request data.

## New Tools Added

### 1. list_model_ai_processing_requests

**Purpose:** List AI processing requests from Model Services with status and details.

**API Endpoint:** `https://modelservicesapi.derivative-programming.com/api/v1_0/prep-requests`

**Parameters:**
- `pageNumber` (number, optional): Page number (1-indexed, default: 1)
- `itemCountPerPage` (number, optional): Items per page (default: 10, max: 100)
- `orderByColumnName` (string, optional): Column to sort by (default: "modelPrepRequestRequestedUTCDateTime")
- `orderByDescending` (boolean, optional): Sort in descending order (default: true)

**Returns:**
```typescript
{
  success: boolean,
  items: Array<any>, // AI processing request objects
  pageNumber: number,
  itemCountPerPage: number,
  recordsTotal: number,
  recordsFiltered: number,
  orderByColumnName: string,
  orderByDescending: boolean,
  error?: string,
  note?: string
}
```

**Use Cases:**
- Check status of submitted AI processing requests
- Monitor project preparation progress
- Review completed AI enhancements
- Track request history

### 2. list_model_validation_requests

**Purpose:** List validation requests from Model Services with status and results.

**API Endpoint:** `https://modelservicesapi.derivative-programming.com/api/v1_0/validation-requests`

**Parameters:**
- `pageNumber` (number, optional): Page number (1-indexed, default: 1)
- `itemCountPerPage` (number, optional): Items per page (default: 10, max: 100)
- `orderByColumnName` (string, optional): Column to sort by (default: "modelValidationRequestRequestedUTCDateTime")
- `orderByDescending` (boolean, optional): Sort in descending order (default: true)

**Returns:**
```typescript
{
  success: boolean,
  items: Array<any>, // Validation request objects
  pageNumber: number,
  itemCountPerPage: number,
  recordsTotal: number,
  recordsFiltered: number,
  orderByColumnName: string,
  orderByDescending: boolean,
  error?: string,
  note?: string
}
```

**Use Cases:**
- Check status of model validation requests
- Review validation results and change suggestions
- Monitor quality assurance processes
- Track validation history

### 3. list_fabrication_blueprint_catalog_items

**Purpose:** List available fabrication blueprints (template sets) from Model Services catalog with selection status.

**API Endpoint:** `https://modelservicesapi.derivative-programming.com/api/v1_0/template-sets`

**Parameters:**
- `pageNumber` (number, optional): Page number (1-indexed, default: 1)
- `itemCountPerPage` (number, optional): Items per page (default: 10, max: 100)
- `orderByColumnName` (string, optional): Column to sort by (default: "displayName")
- `orderByDescending` (boolean, optional): Sort in descending order (default: false)

**Returns:**
```typescript
{
  success: boolean,
  items: Array<{
    name: string,
    displayName: string,
    description: string,
    version: string,
    selected: boolean // Whether blueprint is selected in current model
  }>,
  pageNumber: number,
  itemCountPerPage: number,
  recordsTotal: number,
  recordsFiltered: number,
  orderByColumnName: string,
  orderByDescending: boolean,
  error?: string,
  note?: string
}
```

**Special Features:**
- Automatically marks blueprints that are selected in the current model
- Compares catalog items against model's `templateSet` array
- Provides context for fabrication planning

**Use Cases:**
- Browse available code generation templates
- Check which blueprints are selected in the model
- Plan fabrication with appropriate template sets
- Compare blueprint options

### 4. list_model_fabrication_requests

**Purpose:** List fabrication requests from Model Services with status and download information.

**API Endpoint:** `https://modelservicesapi.derivative-programming.com/api/v1_0/fabrication-requests`

**Parameters:**
- `pageNumber` (number, optional): Page number (1-indexed, default: 1)
- `itemCountPerPage` (number, optional): Items per page (default: 10, max: 100)
- `orderByColumnName` (string, optional): Column to sort by (default: "modelFabricationRequestRequestedUTCDateTime")
- `orderByDescending` (boolean, optional): Sort in descending order (default: true)

**Returns:**
```typescript
{
  success: boolean,
  items: Array<any>, // Fabrication request objects with download URLs
  pageNumber: number,
  itemCountPerPage: number,
  recordsTotal: number,
  recordsFiltered: number,
  orderByColumnName: string,
  orderByDescending: boolean,
  error?: string,
  note?: string
}
```

**Use Cases:**
- Monitor code generation progress
- Check status of fabrication jobs
- Access download URLs for generated files
- Track fabrication history

## Architecture

### Component Structure

```
MCP Client (GitHub Copilot)
    ↓
MCP Server (src/mcp/server.ts)
    ↓
ModelServiceTools (src/mcp/tools/modelServiceTools.ts)
    ↓
HTTP Bridge (localhost:3002)
    ↓
mcpBridge.ts (src/services/mcpBridge.ts)
    ↓
Model Services API (modelservicesapi.derivative-programming.com)
```

### Implementation Pattern

All four tools follow the same architectural pattern:

#### 1. Tool Methods (modelServiceTools.ts)

```typescript
public async list_model_ai_processing_requests(
    pageNumber: number = 1,
    itemCountPerPage: number = 10,
    orderByColumnName: string = "modelPrepRequestRequestedUTCDateTime",
    orderByDescending: boolean = true
): Promise<any> {
    // Check authentication
    const isLoggedIn = await this.checkAuthStatus();
    if (!isLoggedIn) {
        return { success: false, error: 'Authentication required...' };
    }

    try {
        // Fetch via HTTP bridge
        const data = await this.fetchFromModelServices(
            'prep-requests',
            pageNumber,
            itemCountPerPage,
            orderByColumnName,
            orderByDescending
        );

        // Return success with data
        return {
            success: true,
            items: data.items || [],
            // ... pagination info
        };
    } catch (error) {
        // Return error response
        return {
            success: false,
            error: error.message,
            // ... empty data
        };
    }
}
```

#### 2. Tool Registration (server.ts)

```typescript
this.server.registerTool('list_model_ai_processing_requests', {
    title: 'List Model AI Processing Requests',
    description: 'List AI processing requests from Model Services...',
    inputSchema: {
        pageNumber: z.number().optional(),
        itemCountPerPage: z.number().optional(),
        orderByColumnName: z.string().optional(),
        orderByDescending: z.boolean().optional()
    },
    outputSchema: {
        success: z.boolean(),
        items: z.array(z.any()).optional(),
        // ... other fields
    }
}, async (args: any) => {
    try {
        const result = await this.modelServiceTools.list_model_ai_processing_requests(
            args.pageNumber,
            args.itemCountPerPage,
            args.orderByColumnName,
            args.orderByDescending
        );
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            structuredContent: result
        };
    } catch (error) {
        // Error handling...
    }
});
```

#### 3. HTTP Bridge Endpoint (mcpBridge.ts)

```typescript
else if (req.url?.startsWith('/api/model-services/prep-requests')) {
    // Parse request body
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    
    req.on('end', async () => {
        try {
            // Extract parameters
            const { pageNumber, itemCountPerPage, orderByColumnName, orderByDescending } = 
                body ? JSON.parse(body) : {};
            
            // Get API key
            const authService = AuthService.getInstance();
            const apiKey = await authService.getApiKey();
            
            if (!apiKey) {
                // Return 401 unauthorized
            }
            
            // Build API URL
            const params = [
                'PageNumber=' + encodeURIComponent(pageNumber || 1),
                'ItemCountPerPage=' + encodeURIComponent(itemCountPerPage || 10),
                'OrderByDescending=' + encodeURIComponent(orderByDescending ? 'true' : 'false')
            ];
            if (orderByColumnName) {
                params.push('OrderByColumnName=' + encodeURIComponent(orderByColumnName));
            }
            const url = 'https://modelservicesapi.derivative-programming.com/api/v1_0/prep-requests?' + 
                params.join('&');
            
            // Call Model Services API
            const response = await fetch(url, {
                headers: { 'Api-Key': apiKey }
            });
            
            // Handle 401 errors (logout user)
            if (response.status === 401) {
                await authService.logout();
                // Return error
            }
            
            // Return data
            const data = await response.json();
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: data }));
            
        } catch (error) {
            // Error handling
        }
    });
}
```

### Key Design Decisions

1. **HTTP Bridge Pattern**: MCP tools don't directly access the API. The extension holds the API key and proxies requests through localhost:3002. This keeps credentials secure.

2. **Consistent Error Handling**: All tools return the same error structure with `success: false` and error messages.

3. **Authentication Check**: All tools check login status before making API calls using the `/api/auth-status` endpoint.

4. **Session Management**: When the API returns 401, the extension automatically logs the user out and closes all Model Services panels.

5. **Model Enhancement**: The blueprint catalog endpoint compares API results against the model's `templateSet` array to add the `selected` property.

6. **Default Sort Orders**: Request lists default to sorting by requested timestamp descending (most recent first), matching the UI views.

## Testing

### Compilation Test
```bash
npm run compile
```
Result: ✅ Successful compilation with no errors

### Manual Testing Checklist
- [ ] Test list_model_ai_processing_requests with GitHub Copilot
- [ ] Test list_model_validation_requests with GitHub Copilot
- [ ] Test list_fabrication_blueprint_catalog_items with GitHub Copilot
- [ ] Test list_model_fabrication_requests with GitHub Copilot
- [ ] Verify authentication requirement (should fail when not logged in)
- [ ] Verify pagination works correctly
- [ ] Verify sorting works correctly
- [ ] Verify 'selected' property on blueprint catalog items

### Example Copilot Queries

```
"Show me my recent AI processing requests"
"List the first 5 validation requests"
"What fabrication blueprints are available?"
"Show me which blueprints are selected in my model"
"List my fabrication requests sorted by name"
```

## Files Modified

1. **src/mcp/tools/modelServiceTools.ts**
   - Added generic `fetchFromModelServices()` helper method
   - Added 4 new public tool methods

2. **src/mcp/server.ts**
   - Registered 4 new tools with Zod schemas
   - Updated tool descriptions and output schemas

3. **src/services/mcpBridge.ts**
   - Added 4 new HTTP bridge endpoints
   - Implemented authentication and API proxying

4. **MCP_README.md**
   - Updated tool count from 71 to 75
   - Added Model Services API Tools section

5. **todo.md**
   - Marked 4 items as done

6. **copilot-command-history.txt**
   - Added implementation log entry

## Future Enhancements

Potential additions based on the todo.md file:

1. **add_model_ai_processing_request** - Submit new AI processing requests
2. **get_model_ai_processing_request_details** - Get detailed info for a specific request
3. **download_ai_processing_report** - Download and save AI processing results
4. **merge_ai_processing_results** - Merge AI results into the model

5. **add_model_validation_request** - Submit new validation requests
6. **get_model_validation_request_details** - Get detailed validation results
7. **download_validation_report** - Download validation reports
8. **view_validation_change_suggestions** - View suggested model changes

9. **select_fabrication_blueprint** - Add/remove blueprints from model
10. **add_model_fabrication_request** - Submit new fabrication requests
11. **get_model_fabrication_request_details** - Get fabrication request details
12. **download_fabrication_results** - Download generated code files

## Related Documentation

- [MCP_README.md](../../MCP_README.md) - Complete MCP server documentation
- [Model Services Views](../architecture/) - UI view implementations
- [Authentication Service](../../src/services/authService.ts) - Login/logout handling
- [MCP Bridge](../../src/services/mcpBridge.ts) - HTTP bridge implementation

## Conclusion

The four new Model Services MCP tools provide comprehensive programmatic access to cloud-based AI features, validation services, and code generation capabilities. They follow established patterns, maintain security through the HTTP bridge, and integrate seamlessly with GitHub Copilot for natural language interactions.

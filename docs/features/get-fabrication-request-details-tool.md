# get_model_fabrication_request_details Tool

**Category:** Model Services API Tools  
**Purpose:** Get detailed information for a specific fabrication request  
**Authentication Required:** Yes  
**Added:** January 2025

## Overview

The `get_model_fabrication_request_details` tool retrieves complete details for a single Model Fabrication Request by its request code. This tool is useful when you need to check the status, download URLs, or error information for a specific fabrication request without listing all requests.

## Use Cases

1. **Check Request Status**: Quickly check if a specific fabrication request is complete
2. **Retrieve Download URLs**: Get the result ZIP URL and report URL for a completed fabrication
3. **Error Investigation**: Retrieve error messages for failed fabrication requests
4. **Status Monitoring**: Poll for updates on a specific fabrication request's progress
5. **Direct Access**: Access a known fabrication request without paginating through lists
6. **Download Management**: Get direct links to download generated code and artifacts

## Parameters

- **requestCode** (required, string) - The unique identifier code for the fabrication request (e.g., "FAB123")

## Return Structure

### Success Response
```json
{
  "success": true,
  "item": {
    "modelFabricationRequestCode": "FAB123",
    "modelFabricationRequestDescription": "Project: MyApp, Blueprint: Customer Registration Form",
    "modelFabricationRequestRequestedUTCDateTime": "2025-10-20T12:00:00Z",
    "modelFabricationRequestIsStarted": true,
    "modelFabricationRequestIsCompleted": true,
    "modelFabricationRequestIsSuccessful": true,
    "modelFabricationRequestIsCanceled": false,
    "modelFabricationRequestReportUrl": "https://modelservicesapi.derivative-programming.com/fabrication-reports/FAB123.txt",
    "modelFabricationRequestResultUrl": "https://modelservicesapi.derivative-programming.com/fabrication-results/FAB123.zip",
    "modelFabricationRequestErrorMessage": null
  },
  "requestCode": "FAB123"
}
```

### Error Response (Not Found)
```json
{
  "success": false,
  "error": "No fabrication request found with code: FAB999",
  "item": null,
  "requestCode": "FAB999"
}
```

### Error Response (Authentication)
```json
{
  "success": false,
  "error": "Authentication required. Please log in to Model Services first using the open_login_view tool or click Login under Model Services in the tree view.",
  "item": null
}
```

## Status Interpretation

The status of the fabrication request can be determined from the boolean flags:

- **Completed Successfully**: IsCompleted && IsSuccessful && !IsCanceled
  - Result ZIP URL is available for download
  - Report URL contains execution details
  - No error message
  
- **Completed with Errors**: IsCompleted && !IsSuccessful && !IsCanceled
  - Error message explains what went wrong
  - Report URL may be available with diagnostic information
  - Result ZIP URL will be null
  
- **Processing**: IsStarted && !IsCompleted && !IsCanceled
  - Request is currently being processed (generating code)
  - Poll this endpoint periodically to check for completion
  
- **Pending**: !IsStarted && !IsCompleted && !IsCanceled
  - Request is queued but hasn't started processing yet
  
- **Canceled**: IsCanceled
  - Request was canceled by the user

## Example Usage with GitHub Copilot

```
"Get details for fabrication request FAB123"
"Check the status of fabrication request FAB456"
"Is fabrication request FAB789 complete?"
"Show me the error for fabrication request FAB999"
"Get the download URL for fabrication FAB111"
"Where can I download the results for fabrication FAB222?"
```

## Related Tools

- **list_model_fabrication_requests** - List all fabrication requests with pagination
- **get_model_fabrication_request_schema** - Get the JSON schema for fabrication request objects
- **open_fabrication_requests_view** - Open the fabrication requests UI view
- **list_fabrication_blueprint_catalog_items** - Browse available fabrication blueprints
- **select_fabrication_blueprint** - Add a blueprint to your model

## Implementation Details

### Architecture
- **API Endpoint**: `/api/v1_0/fabrication-requests?modelFabricationRequestCode={code}`
- **HTTP Bridge**: `http://localhost:3002/api/model-services/fabrication-request-details`
- **Method**: POST with JSON body containing requestCode
- **Timeout**: 30 seconds
- **Authentication**: Requires valid API key from AuthService

### Error Handling
- Returns 400 if requestCode is missing or empty
- Returns 401 if not authenticated to Model Services
- Returns 404 if no fabrication request found with the provided code
- Returns 500 for API or network errors
- Handles timeout with descriptive error message

### Code Location
- **Tool Method**: `src/mcp/tools/modelServiceTools.ts` - `get_model_fabrication_request_details()`
- **HTTP Bridge**: `src/services/mcpBridge.ts` - `/api/model-services/fabrication-request-details`
- **Registration**: `src/mcp/server.ts` - `get_model_fabrication_request_details` tool

## Result ZIP File Contents

When a fabrication request completes successfully, the result ZIP file typically contains:

- **Generated Source Code**: Complete implementation files in target language/framework
- **Configuration Files**: Project configuration, dependencies, build scripts
- **Documentation**: README, API docs, setup instructions
- **Database Scripts**: Schema creation, seed data, migrations (if applicable)
- **Tests**: Unit tests, integration tests (if included in blueprint)
- **Assets**: Images, styles, static resources (if applicable)

The exact contents depend on the specific fabrication blueprint used.

## Technical Notes

1. **Query Parameter**: Uses `modelFabricationRequestCode` query parameter to filter the list endpoint
2. **Single Item Extraction**: API returns paginated list, tool extracts first item
3. **Authentication Check**: Validates authentication before making HTTP request
4. **Session Handling**: Automatically logs out if API returns 401 (expired session)
5. **Error Transparency**: Returns descriptive error messages for troubleshooting
6. **Large Files**: Result ZIP files can be large (10MB+), download with appropriate timeout

## Testing Recommendations

### Manual Testing
1. Test with valid fabrication request code from your model
2. Test with non-existent request code (should return 404)
3. Test without authentication (should return auth error)
4. Test with pending, processing, and completed requests
5. Verify result ZIP URL is valid and downloadable

### Unit Testing
```typescript
// Test successful retrieval
const result = await modelServiceTools.get_model_fabrication_request_details('FAB123');
expect(result.success).toBe(true);
expect(result.item.modelFabricationRequestCode).toBe('FAB123');

// Test missing request code
const result = await modelServiceTools.get_model_fabrication_request_details('');
expect(result.success).toBe(false);
expect(result.error).toContain('required');

// Test not found
const result = await modelServiceTools.get_model_fabrication_request_details('INVALID');
expect(result.success).toBe(false);
expect(result.error).toContain('not found');
```

## Benefits

1. **Direct Access**: Get details without listing all fabrication requests
2. **Efficient**: Single API call for specific request
3. **Status Monitoring**: Perfect for polling completion status
4. **Download URLs**: Direct access to result ZIP and report files
5. **Error Visibility**: Clear error messages for troubleshooting
6. **Complete Data**: All request properties in one response
7. **Large File Ready**: Handles potentially large result ZIP files

## Workflow Example

Typical workflow using this tool:

1. Submit fabrication request (via UI or future tool)
2. Note the request code (e.g., "FAB123")
3. Poll for status: `get_model_fabrication_request_details("FAB123")`
4. Check `IsStarted` and `IsCompleted` flags
5. Once completed and successful, download from `resultUrl`
6. Review execution details in `reportUrl`
7. Extract and use generated code from ZIP file

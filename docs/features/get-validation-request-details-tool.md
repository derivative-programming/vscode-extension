# get_model_validation_request_details Tool

**Category:** Model Services API Tools  
**Purpose:** Get detailed information for a specific validation request  
**Authentication Required:** Yes  
**Added:** January 2025

## Overview

The `get_model_validation_request_details` tool retrieves complete details for a single Model Validation Request by its request code. This tool is useful when you need to check the status, results, or error information for a specific validation request without listing all requests.

## Use Cases

1. **Check Request Status**: Quickly check if a specific validation request is complete
2. **Retrieve Results**: Get the report URL and change suggestions URL for a completed validation
3. **Error Investigation**: Retrieve error messages for failed validation requests
4. **Status Monitoring**: Poll for updates on a specific validation request's progress
5. **Direct Access**: Access a known validation request without paginating through lists

## Parameters

- **requestCode** (required, string) - The unique identifier code for the validation request (e.g., "VAL123")

## Return Structure

### Success Response
```json
{
  "success": true,
  "item": {
    "modelValidationRequestCode": "VAL123",
    "modelValidationRequestDescription": "Project: MyApp, Version: 1.0.0",
    "modelValidationRequestRequestedUTCDateTime": "2025-10-20T12:00:00Z",
    "modelValidationRequestIsStarted": true,
    "modelValidationRequestIsCompleted": true,
    "modelValidationRequestIsSuccessful": true,
    "modelValidationRequestIsCanceled": false,
    "modelValidationRequestReportUrl": "https://modelservicesapi.derivative-programming.com/validation-reports/VAL123.txt",
    "modelValidationRequestChangeSuggestionsUrl": "https://modelservicesapi.derivative-programming.com/change-suggestions/VAL123.json",
    "modelValidationRequestErrorMessage": null
  },
  "requestCode": "VAL123"
}
```

### Error Response (Not Found)
```json
{
  "success": false,
  "error": "No validation request found with code: VAL999",
  "item": null,
  "requestCode": "VAL999"
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

The status of the validation request can be determined from the boolean flags:

- **Completed Successfully**: IsCompleted && IsSuccessful && !IsCanceled
  - Report and change suggestions URLs are available
  - No error message
  
- **Completed with Errors**: IsCompleted && !IsSuccessful && !IsCanceled
  - Error message explains what went wrong
  - Report URL may be available with diagnostic information
  
- **Processing**: IsStarted && !IsCompleted && !IsCanceled
  - Request is currently being processed
  - Poll this endpoint periodically to check for completion
  
- **Pending**: !IsStarted && !IsCompleted && !IsCanceled
  - Request is queued but hasn't started processing yet
  
- **Canceled**: IsCanceled
  - Request was canceled by the user

## Example Usage with GitHub Copilot

```
"Get details for validation request VAL123"
"Check the status of validation request VAL456"
"Is validation request VAL789 complete?"
"Show me the error for validation request VAL999"
"Get the change suggestions URL for validation VAL111"
```

## Related Tools

- **list_model_validation_requests** - List all validation requests with pagination
- **get_model_validation_request_schema** - Get the JSON schema for validation request objects
- **open_model_validation_requests_view** - Open the validation requests UI view

## Implementation Details

### Architecture
- **API Endpoint**: `/api/v1_0/validation-requests?modelValidationRequestCode={code}`
- **HTTP Bridge**: `http://localhost:3002/api/model-services/validation-request-details`
- **Method**: POST with JSON body containing requestCode
- **Timeout**: 30 seconds
- **Authentication**: Requires valid API key from AuthService

### Error Handling
- Returns 400 if requestCode is missing or empty
- Returns 401 if not authenticated to Model Services
- Returns 404 if no validation request found with the provided code
- Returns 500 for API or network errors
- Handles timeout with descriptive error message

### Code Location
- **Tool Method**: `src/mcp/tools/modelServiceTools.ts` - `get_model_validation_request_details()`
- **HTTP Bridge**: `src/services/mcpBridge.ts` - `/api/model-services/validation-request-details`
- **Registration**: `src/mcp/server.ts` - `get_model_validation_request_details` tool

## Technical Notes

1. **Query Parameter**: Uses `modelValidationRequestCode` query parameter to filter the list endpoint
2. **Single Item Extraction**: API returns paginated list, tool extracts first item
3. **Authentication Check**: Validates authentication before making HTTP request
4. **Session Handling**: Automatically logs out if API returns 401 (expired session)
5. **Error Transparency**: Returns descriptive error messages for troubleshooting

## Testing Recommendations

### Manual Testing
1. Test with valid validation request code from your model
2. Test with non-existent request code (should return 404)
3. Test without authentication (should return auth error)
4. Test with pending, processing, and completed requests

### Unit Testing
```typescript
// Test successful retrieval
const result = await modelServiceTools.get_model_validation_request_details('VAL123');
expect(result.success).toBe(true);
expect(result.item.modelValidationRequestCode).toBe('VAL123');

// Test missing request code
const result = await modelServiceTools.get_model_validation_request_details('');
expect(result.success).toBe(false);
expect(result.error).toContain('required');

// Test not found
const result = await modelServiceTools.get_model_validation_request_details('INVALID');
expect(result.success).toBe(false);
expect(result.error).toContain('not found');
```

## Benefits

1. **Direct Access**: Get details without listing all validation requests
2. **Efficient**: Single API call for specific request
3. **Status Monitoring**: Perfect for polling completion status
4. **Error Visibility**: Clear error messages for troubleshooting
5. **Complete Data**: All request properties in one response
6. **URL Access**: Direct access to report and change suggestions URLs

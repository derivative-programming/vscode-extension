# get_model_validation_request_schema Tool

**Category:** Model Services API Tools  
**Purpose:** Schema Documentation  
**Authentication Required:** No (static documentation)  
**Added:** January 2025

## Overview

The `get_model_validation_request_schema` tool returns the JSON schema definition for Model Validation Request objects returned by the Model Services API. This schema documentation tool helps AI agents and developers understand the structure, properties, data types, and status calculation rules for validation requests.

## Use Cases

1. **Understanding Validation Requests**: Learn about the structure of validation request objects without making API calls
2. **Building Integrations**: Use the schema to build tools that work with validation request data
3. **Documentation**: Reference the exact property names and types when working with validation requests
4. **AI Agent Learning**: Help AI agents understand how to interpret validation request responses

## Schema Properties

### Core Properties

- **modelValidationRequestCode** (string) - Unique identifier for the validation request
- **modelValidationRequestDescription** (string) - User-friendly description including project name and version
- **modelValidationRequestRequestedUTCDateTime** (string, ISO 8601) - When the request was submitted

### Status Flags

- **modelValidationRequestIsStarted** (boolean) - Whether processing has begun
- **modelValidationRequestIsCompleted** (boolean) - Whether request is finished
- **modelValidationRequestIsSuccessful** (boolean) - Whether request succeeded
- **modelValidationRequestIsCanceled** (boolean) - Whether request was canceled

### Result Properties

- **modelValidationRequestReportUrl** (string or null) - URL to the validation report (available after completion)
- **modelValidationRequestChangeSuggestionsUrl** (string or null) - URL to suggested improvements (available after completion)
- **modelValidationRequestErrorMessage** (string or null) - Error details if the request failed

## Status Calculation Rules

The status of a validation request is determined by the combination of flags:

- **"Completed Successfully"** = IsCompleted && IsSuccessful && !IsCanceled
- **"Completed with Errors"** = IsCompleted && !IsSuccessful && !IsCanceled
- **"Processing"** = IsStarted && !IsCompleted && !IsCanceled
- **"Pending"** = !IsStarted && !IsCompleted && !IsCanceled
- **"Canceled"** = IsCanceled

## Example Response

```json
{
  "success": true,
  "schema": {
    "type": "object",
    "properties": {
      "modelValidationRequestCode": {
        "type": "string",
        "description": "Unique identifier for the validation request"
      },
      "modelValidationRequestDescription": {
        "type": "string",
        "description": "User-friendly description of the validation request"
      },
      "modelValidationRequestRequestedUTCDateTime": {
        "type": "string",
        "format": "date-time",
        "description": "ISO 8601 timestamp when the validation request was submitted"
      },
      "modelValidationRequestIsStarted": {
        "type": "boolean",
        "description": "Indicates whether processing has begun"
      },
      "modelValidationRequestIsCompleted": {
        "type": "boolean",
        "description": "Indicates whether the request has finished processing"
      },
      "modelValidationRequestIsSuccessful": {
        "type": "boolean",
        "description": "Indicates whether the request completed successfully"
      },
      "modelValidationRequestIsCanceled": {
        "type": "boolean",
        "description": "Indicates whether the request was canceled"
      },
      "modelValidationRequestReportUrl": {
        "type": ["string", "null"],
        "description": "URL to the validation report (available after completion)"
      },
      "modelValidationRequestChangeSuggestionsUrl": {
        "type": ["string", "null"],
        "description": "URL to suggested improvements (available after completion)"
      },
      "modelValidationRequestErrorMessage": {
        "type": ["string", "null"],
        "description": "Error message if the request failed"
      }
    },
    "required": [
      "modelValidationRequestCode",
      "modelValidationRequestDescription",
      "modelValidationRequestRequestedUTCDateTime",
      "modelValidationRequestIsStarted",
      "modelValidationRequestIsCompleted",
      "modelValidationRequestIsSuccessful",
      "modelValidationRequestIsCanceled"
    ],
    "example": {
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
    }
  },
  "note": "This schema represents the validation request objects returned by the Model Services API. Use list_model_validation_requests to get all validation requests. Validation requests analyze your model and provide change suggestions to improve quality."
}
```

## Related Tools

- **list_model_validation_requests** - List all validation requests with their current status
- **get_model_ai_processing_request_schema** - Schema for AI processing requests
- **get_model_fabrication_request_schema** - Schema for fabrication requests

## Implementation

- **File:** `src/mcp/tools/modelServiceTools.ts`
- **Method:** `get_model_validation_request_schema()`
- **Registration:** `src/mcp/server.ts` (line ~1300)
- **No Parameters Required**

## Technical Notes

- This is a static documentation tool that doesn't make API calls
- No authentication required
- Returns the same schema information every time
- Helps AI agents understand validation request data structures
- Includes example object showing all properties in action
- All required properties are clearly marked in the schema

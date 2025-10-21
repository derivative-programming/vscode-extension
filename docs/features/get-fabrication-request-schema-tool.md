# get_model_fabrication_request_schema Tool

**Category:** Model Services API Tools  
**Purpose:** Schema Documentation  
**Authentication Required:** No (static documentation)  
**Added:** January 2025

## Overview

The `get_model_fabrication_request_schema` tool returns the JSON schema definition for Model Fabrication Request objects returned by the Model Services API. This schema documentation tool helps AI agents and developers understand the structure, properties, data types, and status calculation rules for fabrication requests.

## Use Cases

1. **Understanding Fabrication Requests**: Learn about the structure of fabrication request objects without making API calls
2. **Building Integrations**: Use the schema to build tools that work with fabrication request data
3. **Documentation**: Reference the exact property names and types when working with fabrication requests
4. **AI Agent Learning**: Help AI agents understand how to interpret fabrication request responses

## Schema Properties

### Core Properties

- **modelFabricationRequestCode** (string) - Unique identifier for the fabrication request
- **modelFabricationRequestDescription** (string) - User-friendly description including project name and blueprint
- **modelFabricationRequestRequestedUTCDateTime** (string, ISO 8601) - When the request was submitted

### Status Flags

- **modelFabricationRequestIsStarted** (boolean) - Whether processing has begun
- **modelFabricationRequestIsCompleted** (boolean) - Whether request is finished
- **modelFabricationRequestIsSuccessful** (boolean) - Whether request succeeded
- **modelFabricationRequestIsCanceled** (boolean) - Whether request was canceled

### Result Properties

- **modelFabricationRequestReportUrl** (string or null) - URL to the execution report (available after completion)
- **modelFabricationRequestResultUrl** (string or null) - URL to the fabricated result ZIP file (available after successful completion)
- **modelFabricationRequestErrorMessage** (string or null) - Error details if the request failed

## Status Calculation Rules

The status of a fabrication request is determined by the combination of flags:

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
      "modelFabricationRequestCode": {
        "type": "string",
        "description": "Unique identifier for the fabrication request"
      },
      "modelFabricationRequestDescription": {
        "type": "string",
        "description": "User-friendly description of the fabrication request"
      },
      "modelFabricationRequestRequestedUTCDateTime": {
        "type": "string",
        "format": "date-time",
        "description": "ISO 8601 timestamp when the fabrication request was submitted"
      },
      "modelFabricationRequestIsStarted": {
        "type": "boolean",
        "description": "Indicates whether processing has begun"
      },
      "modelFabricationRequestIsCompleted": {
        "type": "boolean",
        "description": "Indicates whether the request has finished processing"
      },
      "modelFabricationRequestIsSuccessful": {
        "type": "boolean",
        "description": "Indicates whether the request completed successfully"
      },
      "modelFabricationRequestIsCanceled": {
        "type": "boolean",
        "description": "Indicates whether the request was canceled"
      },
      "modelFabricationRequestReportUrl": {
        "type": ["string", "null"],
        "description": "URL to the execution report (available after completion)"
      },
      "modelFabricationRequestResultUrl": {
        "type": ["string", "null"],
        "description": "URL to the fabricated result (available after successful completion)"
      },
      "modelFabricationRequestErrorMessage": {
        "type": ["string", "null"],
        "description": "Error message if the request failed"
      }
    },
    "required": [
      "modelFabricationRequestCode",
      "modelFabricationRequestDescription",
      "modelFabricationRequestRequestedUTCDateTime",
      "modelFabricationRequestIsStarted",
      "modelFabricationRequestIsCompleted",
      "modelFabricationRequestIsSuccessful",
      "modelFabricationRequestIsCanceled"
    ],
    "example": {
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
    }
  },
  "note": "This schema represents the fabrication request objects returned by the Model Services API. Use list_model_fabrication_requests to get all fabrication requests. Fabrication requests generate code and artifacts from blueprints."
}
```

## Related Tools

- **list_model_fabrication_requests** - List all fabrication requests with their current status
- **list_fabrication_blueprint_catalog_items** - Browse available fabrication blueprints
- **select_fabrication_blueprint** - Add a blueprint to your model for fabrication
- **get_model_ai_processing_request_schema** - Schema for AI processing requests
- **get_model_validation_request_schema** - Schema for validation requests

## Implementation

- **File:** `src/mcp/tools/modelServiceTools.ts`
- **Method:** `get_model_fabrication_request_schema()`
- **Registration:** `src/mcp/server.ts` (line ~1330)
- **No Parameters Required**

## Technical Notes

- This is a static documentation tool that doesn't make API calls
- No authentication required
- Returns the same schema information every time
- Helps AI agents understand fabrication request data structures
- Includes example object showing all properties in action
- All required properties are clearly marked in the schema
- The resultUrl property points to a ZIP file containing generated code and artifacts

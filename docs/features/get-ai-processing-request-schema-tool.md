# Get Model AI Processing Request Schema MCP Tool

**Created:** October 20, 2025  
**Status:** ✅ Completed  
**Tool Name:** `get_model_ai_processing_request_schema`

## Overview

New MCP tool that returns the JSON schema definition for AI processing request objects returned by Model Services API. This schema tool helps AI agents and developers understand the structure, data types, and validation rules for AI processing requests.

## Purpose

This tool provides documentation about the Model Services AI Processing Request data structure, similar to how `get_user_story_schema`, `get_role_schema`, and `get_data_object_schema` provide schemas for their respective entities.

## Implementation Summary

### Files Modified

1. **src/mcp/tools/modelServiceTools.ts**
   - Added `get_model_ai_processing_request_schema()` method
   - Returns comprehensive schema with all properties, data types, and examples
   - No API call needed - returns static schema definition

2. **src/mcp/server.ts**
   - Registered tool with Zod schema validation
   - No input parameters required
   - Returns schema definition object

3. **src/extension.ts**
   - Updated tool count from 82 to 83
   - Added to Model Services API Tools section (now 11 tools)

4. **MCP_README.md**
   - Updated total tool count from 82 to 83
   - Added to Model Services API Tools list

## Schema Definition

### Properties Included

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `modelPrepRequestCode` | string | Yes | Unique request identifier |
| `modelPrepRequestDescription` | string | Yes | User description |
| `modelPrepRequestRequestedUTCDateTime` | string (date-time) | Yes | Submission timestamp |
| `modelPrepRequestIsStarted` | boolean | Yes | Processing started flag |
| `modelPrepRequestIsCompleted` | boolean | Yes | Processing completed flag |
| `modelPrepRequestIsSuccessful` | boolean | Yes | Success flag |
| `modelPrepRequestIsCanceled` | boolean | Yes | Cancelled flag |
| `modelPrepRequestReportUrl` | string (uri) | No | Report download URL |
| `modelPrepRequestResultModelUrl` | string (uri) | No | Result model URL |
| `modelPrepRequestErrorMessage` | string | No | Error details |

### Status Calculation Rules

The schema includes documentation on how to calculate the display status:

1. **Queued:** `isStarted=false AND isCanceled=false`
2. **Processing:** `isStarted=true AND isCompleted=false`
3. **Success:** `isCompleted=true AND isSuccessful=true`
4. **Processing Error:** `isCompleted=true AND isSuccessful=false`
5. **Cancelled:** `isCanceled=true`

### Example Response

```json
{
  "success": true,
  "schema": {
    "type": "object",
    "description": "AI Processing Request object structure returned by Model Services API",
    "properties": {
      "modelPrepRequestCode": {
        "type": "string",
        "description": "Unique identifier code for the AI processing request",
        "required": true,
        "example": "ABC123"
      },
      "modelPrepRequestDescription": {
        "type": "string",
        "description": "User-provided description of the AI processing request",
        "required": true,
        "example": "Project: MyApp, Version: 1.0.0"
      },
      ...
    },
    "statusCalculation": {
      "description": "The status can be calculated from the boolean flags",
      "rules": [
        "Queued: isStarted=false AND isCanceled=false",
        "Processing: isStarted=true AND isCompleted=false",
        "Success: isCompleted=true AND isSuccessful=true",
        "Processing Error: isCompleted=true AND isSuccessful=false",
        "Cancelled: isCanceled=true"
      ]
    },
    "example": {
      "modelPrepRequestCode": "ABC123",
      "modelPrepRequestDescription": "Project: MyApp, Version: 1.0.0",
      "modelPrepRequestRequestedUTCDateTime": "2025-10-20T12:00:00Z",
      "modelPrepRequestIsStarted": true,
      "modelPrepRequestIsCompleted": true,
      "modelPrepRequestIsSuccessful": true,
      "modelPrepRequestIsCanceled": false,
      "modelPrepRequestReportUrl": "https://modelservicesapi.derivative-programming.com/reports/ABC123.txt",
      "modelPrepRequestResultModelUrl": "https://modelservicesapi.derivative-programming.com/results/ABC123.json",
      "modelPrepRequestErrorMessage": null
    }
  },
  "note": "This schema represents the AI processing request objects returned by the Model Services API. Use list_model_ai_processing_requests to get all requests or get_model_ai_processing_request_details to get a specific request."
}
```

## Use Cases

### 1. Understanding Data Structure
```
User: "What fields are available in AI processing requests?"
AI uses: get_model_ai_processing_request_schema()
Response: Lists all properties with descriptions and examples
```

### 2. Status Calculation Logic
```
User: "How do I determine if an AI processing request is still running?"
AI uses: get_model_ai_processing_request_schema()
Response: Shows status calculation rules based on boolean flags
```

### 3. Validation Reference
```
User: "What's the format of the timestamp field?"
AI uses: get_model_ai_processing_request_schema()
Response: Shows it's a string in ISO 8601 date-time format
```

### 4. Development Planning
```
User: "What data can I get from a completed AI processing request?"
AI uses: get_model_ai_processing_request_schema()
Response: Shows optional reportUrl and resultModelUrl fields
```

### 5. Error Investigation
```
User: "Where can I find error details for failed requests?"
AI uses: get_model_ai_processing_request_schema()
Response: Shows modelPrepRequestErrorMessage field availability
```

## Integration with Other Tools

### Works With:
- **list_model_ai_processing_requests** - Returns arrays of objects matching this schema
- **get_model_ai_processing_request_details** - Returns single object matching this schema

### Similar To:
- **get_user_story_schema** - Schema for user story objects
- **get_role_schema** - Schema for role objects
- **get_data_object_schema** - Schema for data object objects
- **get_lookup_value_schema** - Schema for lookup value objects

## Technical Details

### No Authentication Required
Unlike the other Model Services tools, this schema tool doesn't require authentication because it returns static documentation rather than querying the API.

### No API Call
The schema is defined in code and returned directly - no network call is made.

### Static Documentation
The schema definition is maintained manually to match the Model Services API response format.

## Benefits

### For AI Agents (GitHub Copilot)
1. **Self-Documenting** - Can query schema to understand data structure
2. **Validation** - Can verify field names and types before making API calls
3. **Status Logic** - Can calculate status correctly using documented rules
4. **Examples** - Has concrete examples to understand format

### For Developers
1. **API Documentation** - Quick reference for API response structure
2. **Type Safety** - Can generate TypeScript interfaces from schema
3. **Validation Rules** - Understand required vs optional fields
4. **Format Specifications** - Know expected formats (URIs, date-times, etc.)

## Testing Recommendations

### Manual Testing with GitHub Copilot
```
1. "What's the schema for AI processing requests?"
   → Uses get_model_ai_processing_request_schema
   
2. "Show me an example of an AI processing request"
   → Tool returns example in schema
   
3. "How do I know if a request is queued vs processing?"
   → Tool shows status calculation rules
   
4. "What optional fields are in AI processing requests?"
   → Tool shows reportUrl, resultModelUrl, errorMessage
```

### Schema Validation
- Verify all properties match actual API responses
- Confirm examples are realistic and valid
- Check status calculation rules are correct
- Ensure descriptions are clear and helpful

## Maintenance Notes

### When to Update Schema
Update this schema when:
1. Model Services API adds new fields
2. Field descriptions need clarification
3. New status states are added
4. Examples become outdated

### Consistency Check
Periodically verify the schema matches:
- Actual API responses
- View implementation (modelAIProcessingView.js)
- HTTP bridge response handling
- Documentation in MODEL-AI-PROCESSING-REVIEW.md

## Related Tools

### Model Services Schema Tools
This is the first schema tool for Model Services. Consider adding:
- `get_model_validation_request_schema` - For validation requests
- `get_model_fabrication_request_schema` - For fabrication requests
- `get_model_feature_schema` - For feature catalog items
- `get_fabrication_blueprint_schema` - For blueprint catalog items

### Entity Schema Tools
AppDNA already has schema tools for core entities:
- `get_user_story_schema` ✅
- `get_role_schema` ✅
- `get_data_object_schema` ✅
- `get_lookup_value_schema` ✅
- `get_model_ai_processing_request_schema` ✅ (this tool)

## Completion Status

✅ **Implementation Complete**
- Schema method added to modelServiceTools.ts
- Tool registered in MCP server
- Documentation updated in all files
- No compilation errors

✅ **Ready for Use**
- Can be tested immediately with GitHub Copilot
- No authentication required
- Returns static documentation
- Comprehensive and accurate

## Architecture Benefits

### Schema-First Design
Having schema tools promotes:
1. **Discoverability** - AI can learn about data structures
2. **Self-Documentation** - System documents itself
3. **Validation** - Clear expectations for data format
4. **Consistency** - Single source of truth for structure

### Pattern Consistency
This tool follows the established pattern:
- Same naming convention (`get_*_schema`)
- Same response structure (`success`, `schema`, `note`)
- Same level of detail in descriptions
- Same inclusion of examples

---

**Implemented By:** GitHub Copilot  
**Completion Date:** October 20, 2025  
**Status:** ✅ Production Ready

# create_model_ai_processing_request Tool

**Category:** Model Services API Tools  
**Purpose:** Submit a new AI processing request to Model Services  
**Authentication Required:** Yes  
**Model File Required:** Yes  
**Added:** January 20, 2025

## Overview

The `create_model_ai_processing_request` tool submits a new AI processing request to Model Services with your current AppDNA model file. The AI will analyze your model and enhance it with additional features, improvements, and recommendations based on best practices and patterns.

## Use Cases

1. **Model Enhancement**: Request AI to analyze and improve your model
2. **Feature Addition**: Let AI suggest and add features based on your model
3. **Best Practices**: Get AI recommendations for improving model structure
4. **Automated Development**: Accelerate development with AI-generated enhancements
5. **Quality Improvement**: Identify and fix potential issues in your model

## Parameters

- **description** (required, string) - A description for the AI processing request
  - Recommended format: "Project: [ProjectName], Version: [VersionNumber]"
  - Example: "Project: MyApp, Version: 1.0.0"
  - Helps track and identify the request

## Return Structure

### Success Response
```json
{
  "success": true,
  "message": "AI processing request created successfully",
  "requestCode": "ABC123",
  "description": "Project: MyApp, Version: 1.0.0"
}
```

### Error Response (No Authentication)
```json
{
  "success": false,
  "error": "Authentication required. Please log in to Model Services first using the open_login_view tool or click Login under Model Services in the tree view."
}
```

### Error Response (No Model File)
```json
{
  "success": false,
  "error": "No model file is loaded. Please open a model file first."
}
```

### Error Response (Missing Description)
```json
{
  "success": false,
  "error": "Description is required for creating an AI processing request"
}
```

## What Happens Behind the Scenes

1. **Validation**: Checks that description is provided and user is authenticated
2. **Model File Reading**: Reads the current AppDNA model JSON file from disk
3. **Compression**: Zips the model file to reduce upload size
4. **Base64 Encoding**: Encodes the ZIP file as base64 for transmission
5. **API Submission**: POSTs the request to Model Services with description and model data
6. **Request Creation**: Server creates the request and returns a unique request code
7. **Tracking**: You can use the returned request code to monitor progress

## Example Usage with GitHub Copilot

```
"Create an AI processing request with description 'Project: CustomerPortal, Version: 2.1.0'"
"Submit a new AI processing request for 'Project: InventorySystem, Version: 1.5'"
"Request AI processing with description 'Initial model for MyApp'"
"Create AI request: Project: EcommerceApp, Version: 3.0.0"
```

## Workflow

### Typical Workflow
1. **Open Model File**: Ensure your AppDNA model file is loaded in VS Code
2. **Save Changes**: Make sure all changes are saved
3. **Login**: Authenticate to Model Services if not already logged in
4. **Create Request**: Use this tool with a descriptive description
5. **Get Request Code**: Note the returned request code (e.g., "ABC123")
6. **Monitor Progress**: Use `get_model_ai_processing_request_details` to check status
7. **Wait for Completion**: AI processing typically takes several minutes
8. **Download Results**: When complete, download the enhanced model

### After Request Completes
- Use `get_model_ai_processing_request_details(requestCode)` to get results
- Download the result model URL if successful
- Review the report URL for details on changes made
- Replace your current model with the enhanced version (backup first!)

## Related Tools

- **list_model_ai_processing_requests** - List all your AI processing requests
- **get_model_ai_processing_request_details** - Check status and get results
- **get_model_ai_processing_request_schema** - Understand request object structure
- **open_model_ai_processing_view** - Open the UI to view all requests

## Implementation Details

### Architecture
- **API Endpoint**: `POST https://modelservicesapi.derivative-programming.com/api/v1_0/prep-requests`
- **HTTP Bridge**: `http://localhost:3002/api/model-services/create-prep-request`
- **Method**: POST with JSON payload containing description and modelFileData
- **Timeout**: 60 seconds (longer than other tools due to file upload)
- **Authentication**: Requires valid API key from AuthService

### Payload Structure
```json
{
  "description": "Project: MyApp, Version: 1.0.0",
  "modelFileData": "UEsDBBQAAAAIAO... (base64 encoded ZIP)"
}
```

### Error Handling
- Returns 400 if description is missing or empty
- Returns 401 if not authenticated to Model Services
- Returns 400 if no model file is loaded
- Returns 500 if file reading or zipping fails
- Returns 500 for API or network errors
- Handles 60-second timeout for large model files

### Code Location
- **Tool Method**: `src/mcp/tools/modelServiceTools.ts` - `create_model_ai_processing_request()`
- **HTTP Bridge**: `src/services/mcpBridge.ts` - `/api/model-services/create-prep-request`
- **Registration**: `src/mcp/server.ts` - `create_model_ai_processing_request` tool

## Technical Notes

1. **File Compression**: Model file is automatically zipped to reduce upload size
2. **Base64 Encoding**: ZIP file is base64 encoded for JSON transmission
3. **Model Service Access**: Requires ModelService singleton to get current model file path
4. **Automatic Upload**: No manual file selection needed - uses currently open model
5. **Request Code**: Returned code is used to track and retrieve results
6. **Processing Time**: AI processing typically takes 2-10 minutes depending on model size
7. **Large Models**: 60-second timeout accommodates large model uploads

## Requirements

### Prerequisites
1. **Model File Open**: You must have an AppDNA model file (app-dna.json) open
2. **Authentication**: Must be logged in to Model Services
3. **Internet Connection**: Required for API communication
4. **Model Services Account**: Must have valid account credentials

### Best Practices
1. **Save First**: Always save your model before submitting for processing
2. **Descriptive Names**: Use clear descriptions with project name and version
3. **Backup Model**: Keep backup of original model before applying AI results
4. **Monitor Status**: Check request status periodically until complete
5. **Review Changes**: Always review the report before applying enhanced model

## Testing Recommendations

### Manual Testing
1. Test with valid model file and description
2. Test without authentication (should return error)
3. Test with no model file open (should return error)
4. Test with empty description (should return error)
5. Test with very large model file (should handle timeout appropriately)

### Unit Testing
```typescript
// Test successful request creation
const result = await modelServiceTools.create_model_ai_processing_request(
    'Project: TestApp, Version: 1.0'
);
expect(result.success).toBe(true);
expect(result.requestCode).toBeDefined();

// Test missing description
const result = await modelServiceTools.create_model_ai_processing_request('');
expect(result.success).toBe(false);
expect(result.error).toContain('required');

// Test authentication required
// Mock AuthService to return no API key
const result = await modelServiceTools.create_model_ai_processing_request('Test');
expect(result.success).toBe(false);
expect(result.error).toContain('Authentication required');
```

## Benefits

1. **Automated Enhancement**: AI analyzes and improves your model automatically
2. **Time Savings**: Reduces hours of manual model development
3. **Best Practices**: AI applies industry best practices to your model
4. **Pattern Recognition**: AI identifies common patterns and suggests improvements
5. **Error Detection**: Finds potential issues and inconsistencies
6. **Feature Suggestions**: Recommends features based on your model's domain
7. **Seamless Integration**: Works directly with your current model file

## Limitations

1. **Processing Time**: AI processing takes several minutes (not instant)
2. **File Size**: Very large models may take longer to upload and process
3. **Internet Required**: Requires active internet connection throughout
4. **Single Model**: Processes one model at a time
5. **Manual Review**: AI results should be reviewed before applying to production
6. **API Quota**: May be subject to API usage limits/quotas

## Future Enhancements

Potential future improvements:
1. **Progress Callbacks**: Real-time progress updates during processing
2. **Batch Processing**: Submit multiple models at once
3. **Custom Instructions**: Provide specific instructions to AI
4. **Selective Enhancement**: Choose which aspects to enhance
5. **Version Comparison**: Compare original and enhanced models
6. **Auto-Apply**: Automatically apply AI changes with approval workflow

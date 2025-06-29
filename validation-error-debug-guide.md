// filepath: c:\VR\Source\DP\vscode-extension\validation-error-debug-guide.md
// Debug guide for validation error display issue
// Created: June 29, 2025

# Validation Error Debug Guide

## Issue
User reports that validation errors only show "Validation Failed." instead of detailed field-specific error messages.

## Debugging Steps Added

### 1. Enhanced AuthService Debugging
Added comprehensive logging to both `login()` and `register()` methods:
- Full API response structure logging
- Validation error detection with multiple property name fallbacks
- Type checking for validation error arrays
- Clear distinction between validation errors and general errors

### 2. Enhanced Register View Debugging  
Added logging to both TypeScript and JavaScript parts:
- Error object properties logging in TypeScript
- Message reception logging in webview JavaScript
- Clear indication of which error handling path is taken

### 3. Multiple Property Name Support
API might use different property names for validation errors:
- `validationError` (from schema)
- `validationErrors` 
- `ValidationError`
- `ValidationErrors`

## How to Test

### 1. Open Developer Console
1. Open VS Code
2. Go to Help > Toggle Developer Tools
3. Go to Console tab to see debug messages

### 2. Trigger Registration Error
1. Open AppDNA extension
2. Go to Model Services > Register
3. Try to register with invalid data (e.g., invalid email format)
4. Watch the console for debug messages

### 3. Look for These Debug Messages

**In the console, you should see:**
```
[DEBUG] Register API response: {full JSON response}
[DEBUG] Registration failed. Full API response structure:
[DEBUG] data.success: false
[DEBUG] data.message: "Validation failed"
[DEBUG] data.validationError: [{...validation errors...}]
[DEBUG] typeof data.validationError: object
[DEBUG] Array.isArray(data.validationError): true
```

**And from the webview:**
```
[DEBUG-WEBVIEW] Received message: {command: "registerValidationError", ...}
[DEBUG-WEBVIEW] Showing validation errors: [{...errors...}]
```

## Expected API Response Format

According to the schema, validation errors should be:
```json
{
  "success": false,
  "message": "Validation failed",
  "validationError": [
    {
      "property": "email",
      "message": "Invalid email format"
    },
    {
      "property": "password", 
      "message": "Password too short"
    }
  ]
}
```

## Possible Issues to Check

### 1. API Response Format
- API might not be returning validation errors in expected format
- Property name might be different than `validationError`
- Validation errors might be nested differently

### 2. Network Issues
- API call might be failing entirely
- Response might be malformed JSON

### 3. Authentication Issues
- API might require different headers
- CORS issues preventing proper error responses

## Next Steps Based on Console Output

### If you see validation errors in console but not in UI:
- JavaScript message handling issue
- Check webview message reception logs

### If API response shows no validation errors:
- API not returning expected format
- Need to check actual API behavior
- May need to modify error handling logic

### If API call fails entirely:
- Network/CORS issues
- Invalid API endpoint
- Authentication problems

## Manual Test Commands

You can test the API directly to see the actual response:
```bash
# Test registration with invalid data
curl -X POST https://modelservicesapi.derivative-programming.com/api/v1_0/registers \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "short",
    "confirmPassword": "different", 
    "firstName": "",
    "lastName": "",
    "optIntoTerms": false
  }'
```

This will show you the exact API response format.

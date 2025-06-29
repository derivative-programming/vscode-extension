// filepath: c:\VR\Source\DP\vscode-extension\test-register-flow.md
// Test documentation for registration flow
// Created: June 29, 2025

# Registration Flow Test

## Overview
This document describes how to test the new user registration functionality.

## Test Steps

### 1. Ensure User is Not Logged In
- Open VS Code with the AppDNA extension
- Check the Model Services section in the tree view
- Should see both "Login" and "Register" options

### 2. Test Register View Opening
- Click on "Register" item in the Model Services tree
- Should open a new webview panel with the title "Register for AppDNA Model Services"
- Form should contain:
  - Email field
  - First Name field
  - Last Name field
  - Password field
  - Confirm Password field
  - Terms of Service checkbox

### 3. Test Form Validation
- Try submitting without filling all fields → Should show error
- Enter mismatched passwords → Should show error
- Don't check terms checkbox → Should show error
- Fill valid data and check terms → Should proceed to registration

### 4. Test Navigation Between Views
- Click "Sign in here" link → Should switch to login view
- From login view, click "Register here" link → Should switch back to register view

### 5. Test Successful Registration
- Fill in valid registration data
- Submit form
- Should show success message
- Panel should close automatically
- Tree view should refresh and show logged-in state
- Welcome view should open

## Expected API Call
```
POST https://modelservicesapi.derivative-programming.com/api/v1_0/registers
{
  "email": "test@example.com",
  "password": "password123",
  "confirmPassword": "password123", 
  "firstName": "John",
  "lastName": "Doe",
  "optIntoTerms": true
}
```

## Success Response
```
{
  "success": true,
  "modelServicesAPIKey": "api_key_here",
  "message": "Registration successful"
}
```

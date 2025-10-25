# Create Form Tool Implementation
**Created:** October 25, 2025
**Purpose:** Document the implementation of create_form and suggest_form_name_and_title MCP tools

## Overview

Added two new form management tools to enable programmatic form creation:
1. **suggest_form_name_and_title** - Helper tool to generate naming suggestions
2. **create_form** - Create new forms with automatic page init flow creation

These tools bring the total MCP tool count to **98 tools** (96 → 98).

## Tool 1: suggest_form_name_and_title

### Purpose
Generates suggested form name (PascalCase) and title (human-readable) based on context, following the same logic as the Add Form Wizard.

### Parameters
- **owner_object_name** (string, required) - Owner data object (case-sensitive)
- **role_required** (string, optional) - Role for authorization
- **action** (string, optional) - Action verb (e.g., "Save", "Delete")
- **target_child_object** (string, optional) - Target child object for "Add" scenarios

### Business Logic
**Form Name Generation (PascalCase):**
```
FormName = OwnerObject + Role + Action + TargetChildObject
```

Examples:
- Owner: "Customer", Action: "Add", Target: "Order" → `CustomerAddOrder`
- Owner: "Order", Role: "Manager", Action: "Approve" → `OrderManagerApprove`
- Owner: "Customer", Role: "Admin" → `CustomerAdmin`

**Title Generation (Human-Readable):**
```
Title = Action + " " + (TargetObject OR OwnerObject)
```

Examples:
- Action: "Add", Target: "Order" → `"Add Order"`
- Action: "Approve", Owner: "Order" → `"Approve Order"`
- No action, Owner: "Customer" → `"Customer"`

### Response Format
```json
{
  "success": true,
  "suggestions": {
    "form_name": "CustomerAddOrder",
    "title_text": "Add Order"
  },
  "context": {
    "owner_object_name": "Customer",
    "role_required": null,
    "action": null,
    "target_child_object": "Order"
  },
  "note": "Suggested names follow PascalCase convention..."
}
```

## Tool 2: create_form

### Purpose
Creates a new form (objectWorkflow) in a data object with automatic page init flow creation, matching the Add Form Wizard's behavior.

### Parameters (Required)
- **owner_object_name** (string) - Owner data object, case-sensitive exact match
- **form_name** (string) - Form identifier, PascalCase, unique case-insensitive across ALL objects
- **title_text** (string) - Human-readable title, max 100 characters

### Parameters (Optional)
- **role_required** (string) - Role for authorization (case-sensitive)
- **target_child_object** (string) - Target child object, case-sensitive exact match
- **action** (string) - Action verb, PascalCase format

### Validation Rules

#### 1. Form Name Validation
- **Format**: Must match `/^[A-Z][a-zA-Z0-9]*$/` (PascalCase)
- **Uniqueness**: Case-insensitive check across ALL objects
  - Iterates through all objectWorkflow arrays
  - Compares `form_name.toLowerCase()` with existing form names
- **Required**: Cannot be empty

#### 2. Title Text Validation
- **Required**: Cannot be empty
- **Length**: Max 100 characters

#### 3. Owner Object Validation
- **Exact Match**: Case-sensitive
- **Existence**: Must exist in model
- **Error**: "Owner object not found (case-sensitive match required)"

#### 4. Target Child Object Validation (if provided)
- **Exact Match**: Case-sensitive
- **Existence**: Must exist in model
- **Error**: "Target child object not found (case-sensitive match required)"

### Auto-Generated Components

#### 1. Form Object
```json
{
  "name": "{form_name}",
  "titleText": "{title_text}",
  "isPage": "true",
  "initObjectWorkflowName": "{form_name}InitObjWF",
  "objectWorkflowButton": [
    {
      "buttonText": "OK",
      "buttonType": "submit",
      "isVisible": "true"
    },
    {
      "buttonText": "Cancel",
      "buttonType": "cancel",
      "isVisible": "true"
    }
  ]
}
```

#### 2. Conditional Properties
If `role_required` is provided:
```json
{
  "isAuthorizationRequired": "true",
  "roleRequired": "{role_required}",
  "layoutName": "{role_required}Layout"
}
```

If `target_child_object` is provided:
```json
{
  "targetChildObject": "{target_child_object}"
}
```

If `action` is provided:
```json
{
  "workflowAction": "{action}"
}
```

#### 3. Page Init Flow
```json
{
  "name": "{form_name}InitObjWF",
  "titleText": "{title_text} Page Init",
  "objectWorkflowOutputVar": []
}
```

### API Endpoint

Created new POST endpoint in `mcpBridge.ts`:
```
POST /api/create-form
Body: {
  ownerObjectName: string,
  form: object,
  pageInitFlow: object
}
```

The endpoint:
1. Validates owner object exists
2. Ensures `objectWorkflow` array exists
3. Adds both form and page init flow
4. Marks model as having unsaved changes
5. Returns success with created objects

### Response Format

**Success:**
```json
{
  "success": true,
  "form": { /* form object with hidden properties filtered */ },
  "page_init_flow": { /* page init flow object */ },
  "owner_object_name": "Customer",
  "message": "Form \"CustomerAddOrder\" and page init flow \"CustomerAddOrderInitObjWF\" created successfully",
  "note": "Form has been added to the model with default OK and Cancel buttons..."
}
```

**Validation Error:**
```json
{
  "success": false,
  "error": "Validation failed",
  "validationErrors": [
    "Form name must be in PascalCase format...",
    "Form name \"MyForm\" already exists in object \"Customer\""
  ],
  "note": "Please fix the validation errors and try again."
}
```

## Implementation Files

### 1. formTools.ts
**Added Methods:**
- `suggest_form_name_and_title()` - 95 lines
- `create_form()` - 230 lines
- `convertToHumanReadable()` - Helper method (8 lines)

**Total File Size:** 1,393 lines (was 1,088 lines, +305 lines)

### 2. mcpBridge.ts
**Added Endpoint:**
- `/api/create-form` (POST) - 70 lines
- Located after `/api/forms` (GET) endpoint
- Uses same pattern as other POST endpoints

### 3. server.ts (MCP stdio server)
**Registered Tools:**
- `suggest_form_name_and_title` - 65 lines registration
- `create_form` - 95 lines registration
- Total: 98 tools (was 96 tools)

### 4. mcpProvider.ts (VS Code Language Model API)
**Registered Tools:**
- `suggest_form_name_and_title` - 30 lines
- `create_form` - 30 lines
- Total: 25 tools (was 23 tools)

### 5. extension.ts (ChatMode generation)
**Updates:**
- Tool count: 96 → 98
- Added both tools to YAML list
- Added new "Form Management Tools" section (2 tools)

### 6. MCP_README.md
**Updates:**
- Tool count: 96 → 98
- Expanded "Form Management" section from 2 to 4 tools
- Added detailed descriptions for both new tools

## Usage Examples

### Example 1: Get Suggestions First
```javascript
// Step 1: Get naming suggestions
suggest_form_name_and_title({
  owner_object_name: "Customer",
  target_child_object: "Order"
})
// Returns: { form_name: "CustomerAddOrder", title_text: "Add Order" }

// Step 2: Create the form
create_form({
  owner_object_name: "Customer",
  form_name: "CustomerAddOrder",
  title_text: "Add Order",
  target_child_object: "Order"
})
```

### Example 2: Create with Role Authorization
```javascript
create_form({
  owner_object_name: "Order",
  form_name: "OrderManagerApprove",
  title_text: "Approve Order",
  role_required: "Manager",
  action: "Approve"
})
// Auto-sets: isAuthorizationRequired="true", layoutName="ManagerLayout"
```

### Example 3: Simple Form
```javascript
create_form({
  owner_object_name: "Customer",
  form_name: "CustomerEdit",
  title_text: "Edit Customer"
})
// Creates basic form with OK/Cancel buttons and page init flow
```

## Validation Matrix

| Validation | Type | When | Error Message |
|------------|------|------|---------------|
| form_name format | PascalCase | Always | "Form name must be in PascalCase format..." |
| form_name uniqueness | Case-insensitive | Always | "Form name '{name}' already exists in object '{obj}'" |
| form_name required | Not empty | Always | "Form name is required and cannot be empty" |
| title_text required | Not empty | Always | "Title text is required and cannot be empty" |
| title_text length | ≤ 100 chars | Always | "Title text cannot exceed 100 characters" |
| owner_object_name | Case-sensitive match | Always | "Owner object '{name}' not found (case-sensitive...)" |
| target_child_object | Case-sensitive match | If provided | "Target child object '{name}' not found..." |

## Architecture Patterns Followed

1. **Wizard Parity**: Matches Add Form Wizard logic exactly
2. **Case Sensitivity**: Exact match for object/role names, case-insensitive for form uniqueness
3. **Auto-Generation**: Page init flow created automatically
4. **Smart Defaults**: OK/Cancel buttons, isPage="true"
5. **Property Filtering**: Hidden properties removed from responses (matches get_form)
6. **HTTP Bridge**: Uses existing bridge pattern for model manipulation
7. **Validation First**: All validation before any model changes
8. **Error Messaging**: Clear, actionable error messages

## Integration Points

### MCP Server
- stdio server (port 3000): 98 tools registered
- HTTP bridge (port 3001): Inherits all tools
- VS Code API: 25 tools registered

### Model Changes
- Creates 2 objectWorkflow items (form + page init flow)
- Marks model as unsaved
- No automatic save (user controls when to save)

### UI Integration
- Form appears in tree view after creation (requires refresh)
- Can be opened in Form Details View
- Page init flow appears under owner object

## Testing Recommendations

1. **Test PascalCase Validation**:
   - Valid: "MyForm", "Form1", "AddCustomer"
   - Invalid: "myForm", "my-form", "my form", "123Form"

2. **Test Case-Insensitive Uniqueness**:
   - Create "MyForm"
   - Attempt "myform" (should fail)
   - Attempt "MYFORM" (should fail)

3. **Test Role Authorization**:
   - With role_required → verify isAuthorizationRequired="true"
   - Without role_required → verify isAuthorizationRequired="false"

4. **Test Page Init Flow**:
   - Verify flow name: "{formName}InitObjWF"
   - Verify initObjectWorkflowName set correctly
   - Verify both added to objectWorkflow array

5. **Test Validation Errors**:
   - Empty form_name
   - Invalid PascalCase
   - Duplicate name
   - Non-existent owner
   - Non-existent target

6. **Test Suggestions**:
   - Various combinations of parameters
   - Verify PascalCase output
   - Verify human-readable title

## Future Enhancements

Planned additional form tools (Phase 2):
1. `add_form_param` - Add input parameters
2. `add_form_button` - Add custom buttons  
3. `update_form` - Update form properties
4. `add_form_output_var` - Add output variables
5. `update_form_param` - Update existing parameter
6. `update_form_button` - Update existing button

This would bring form tools to 10 total, providing comprehensive form management capabilities.

## Related Documentation

- `formTools.ts` - Implementation (1,393 lines)
- `mcpBridge.ts` - API endpoint (line 786-855)
- `addFormWizardView.js` - Wizard implementation (967 lines)
- `form-tools-api-optimization.md` - API optimization docs
- `MCP_README.md` - Complete tool catalog

# Select/Unselect Model Feature - Name and Version Matching

**Date:** October 19, 2025  
**Status:** ✅ Implemented  
**Tool Names:** `select_model_feature`, `unselect_model_feature`

## Overview

The `select_model_feature` and `unselect_model_feature` MCP tools now require **both name AND version** parameters to ensure precise feature identification. This prevents accidentally selecting or unselecting the wrong version of a feature when multiple versions exist in the Model Services catalog.

## Changes Made

### 1. Tool Signatures Updated

**Before:**
```typescript
// select_model_feature
public async select_model_feature(
    featureName: string,
    description?: string,    // ❌ Removed - should come from catalog
    version?: string         // ❌ Was optional
): Promise<any>

// unselect_model_feature
public async unselect_model_feature(
    featureName: string      // ❌ Only matched on name
): Promise<any>
```

**After:**
```typescript
// select_model_feature
public async select_model_feature(
    featureName: string,     // ✅ Required - exact name from catalog
    version: string          // ✅ Required - exact version from catalog
): Promise<any>

// unselect_model_feature
public async unselect_model_feature(
    featureName: string,     // ✅ Required - exact name
    version: string          // ✅ Required - exact version
): Promise<any>
```

### 2. Matching Logic Updated

**Before:**
```typescript
// Only matched on name
const existingFeatureIndex = namespace.modelFeature.findIndex(f => f.name === featureName);
```

**After:**
```typescript
// Matches on BOTH name AND version
const existingFeatureIndex = namespace.modelFeature.findIndex(f => 
    f.name === featureName && f.version === version
);
```

### 3. MCP Tool Schema Updated

**select_model_feature inputSchema:**
```typescript
inputSchema: {
    featureName: z.string().describe('Exact name of the feature from the catalog (case-sensitive, must match catalog item name exactly)'),
    version: z.string().describe('Exact version of the feature from the catalog (must match catalog item version exactly)')
}
```

**unselect_model_feature inputSchema:**
```typescript
inputSchema: {
    featureName: z.string().describe('Exact name of the feature to remove (case-sensitive, must match existing feature name)'),
    version: z.string().describe('Exact version of the feature to remove (must match existing feature version)')
}
```

### 4. Response Messages Updated

**Before:**
```
Feature 'User Authentication' added to model successfully
```

**After:**
```
Feature 'User Authentication' version '1.2.0' added to model successfully
```

## Files Modified

1. **src/mcp/tools/modelServiceTools.ts**
   - Updated method signatures
   - Updated JSDoc comments
   - Removed description parameter from POST data

2. **src/mcp/server.ts**
   - Updated tool registrations
   - Made version required (not optional)
   - Added version to outputSchema
   - Updated tool descriptions

3. **src/services/mcpBridge.ts**
   - Updated findIndex to match on name AND version
   - Updated log messages to include version
   - Updated response messages
   - Removed description from request destructuring

4. **MCP_README.md**
   - Updated tool descriptions
   - Added notes about name AND version matching

5. **src/extension.ts**
   - Updated ChatMode instruction file
   - Added "(requires exact name AND version match)" to descriptions

6. **copilot-command-history.txt**
   - Documented the changes

## Usage Examples

### Selecting a Feature

**GitHub Copilot Query:**
```
Add the "User Authentication" feature version "1.2.0" to my model
```

**MCP Tool Call:**
```json
{
  "tool": "select_model_feature",
  "arguments": {
    "featureName": "User Authentication",
    "version": "1.2.0"
  }
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Feature 'User Authentication' version '1.2.0' added to model successfully",
  "featureName": "User Authentication",
  "version": "1.2.0",
  "alreadyExists": false
}
```

### Unselecting a Feature

**GitHub Copilot Query:**
```
Remove the "User Authentication" feature version "1.2.0" from my model
```

**MCP Tool Call:**
```json
{
  "tool": "unselect_model_feature",
  "arguments": {
    "featureName": "User Authentication",
    "version": "1.2.0"
  }
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Feature 'User Authentication' version '1.2.0' removed from model successfully",
  "featureName": "User Authentication",
  "version": "1.2.0",
  "wasCompleted": false,
  "notFound": false
}
```

**Error Response (Completed Feature):**
```json
{
  "success": false,
  "error": "Cannot remove feature 'User Authentication' version '1.2.0' because it is marked as completed. Completed features have been processed by AI and cannot be removed.",
  "featureName": "User Authentication",
  "version": "1.2.0",
  "wasCompleted": true
}
```

## Rationale

### Why Match on Both Name AND Version?

1. **Catalog May Have Multiple Versions:**
   - The Model Services catalog can contain multiple versions of the same feature
   - Version 1.0.0 might have different functionality than version 2.0.0
   - Users need to select the exact version they want

2. **Prevents Accidental Operations:**
   - Without version matching, the tool might select/unselect the wrong version
   - Example: Model has "Auth v1.0" and user wants to add "Auth v2.0"
   - Name-only matching would incorrectly report "already exists"

3. **Matches UI Behavior:**
   - The Model Feature Catalog UI displays both name and version
   - Users see the version they're selecting/unselecting
   - The tools should behave the same way as the UI

4. **Version Tracking:**
   - Features can be upgraded (remove v1.0, add v2.0)
   - Version information is preserved in the model
   - AI processing results are tied to specific versions

### Why Remove Description Parameter?

1. **Description Comes from Catalog:**
   - Each feature in the catalog has its own description
   - The description should not be user-provided
   - When selecting a feature, its catalog description is used

2. **Consistency:**
   - ModelFeatureModel gets description from the catalog
   - Users shouldn't override catalog descriptions
   - Maintains data integrity

3. **Simplicity:**
   - One less parameter to provide
   - Reduces chance of user error
   - Tool is easier to use

## Technical Details

### ModelFeatureModel Structure

```typescript
class ModelFeatureModel {
    name: string;           // Feature name from catalog
    version: string;        // Feature version from catalog
    description: string;    // Description from catalog
    isCompleted: string;    // "true" if processed by AI, "false" or undefined otherwise
}
```

### Namespace Structure

```typescript
{
    name: "Default",
    modelFeature: [
        {
            name: "User Authentication",
            version: "1.2.0",
            description: "Implements user login and authentication",
            isCompleted: "false"
        },
        {
            name: "User Authentication",
            version: "2.0.0",
            description: "Enhanced authentication with OAuth support",
            isCompleted: "false"
        }
    ]
}
```

Both features can coexist because matching is done on name AND version.

### Completion Status Validation

When unselecting a feature, the tool checks:
```typescript
if (namespace.modelFeature[featureIndex].isCompleted === "true") {
    // Cannot remove - feature was processed by AI
    return error;
}
```

This prevents removal of features that have been analyzed and integrated by the AI processing system.

## Testing Checklist

- [x] Compile TypeScript successfully
- [x] Update all tool registrations
- [x] Update HTTP bridge handlers
- [x] Update MCP README
- [x] Update ChatMode instructions
- [x] Document changes in copilot-command-history.txt
- [ ] Manual test: Select feature with name and version
- [ ] Manual test: Unselect feature with name and version
- [ ] Manual test: Try to unselect completed feature (should fail)
- [ ] Manual test: Try to select existing feature (should report already exists)
- [ ] Manual test: Select different versions of same feature

## Future Enhancements

1. **Batch Operations:**
   - Add `select_multiple_features` tool
   - Add `unselect_multiple_features` tool

2. **Version Validation:**
   - Verify version exists in catalog before selecting
   - Suggest available versions if invalid version provided

3. **Feature Dependencies:**
   - Check feature dependencies before selection
   - Auto-select required features
   - Warn if removing a feature that other features depend on

4. **Version Upgrade:**
   - Add `upgrade_feature_version` tool
   - Automatically remove old version and add new version
   - Preserve custom settings

## References

- Model Services API: `modelservicesapi.derivative-programming.com`
- MCP SDK: Version 1.20.0
- Zod Validation: For schema definitions
- HTTP Bridge: Ports 3001 (data), 3002 (commands), 3000 (MCP)

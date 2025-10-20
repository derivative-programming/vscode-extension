# Fabrication Blueprint Selection MCP Tools

**Date:** October 20, 2025  
**Status:** ✅ Implemented  
**Tool Names:** `select_fabrication_blueprint`, `unselect_fabrication_blueprint`

## Overview

The `select_fabrication_blueprint` and `unselect_fabrication_blueprint` MCP tools allow programmatic selection and removal of fabrication blueprints (template sets) from the AppDNA model. These tools mirror the functionality available in the Fabrication Blueprint Catalog view where users can toggle blueprints via checkboxes.

## Tool Signatures

### select_fabrication_blueprint

```typescript
public async select_fabrication_blueprint(
    blueprintName: string,     // Required - exact name from catalog
    version: string            // Required - exact version from catalog
): Promise<any>
```

**Purpose:** Add a fabrication blueprint from the catalog to the model's `templateSet` array.

**Behavior:**
- Creates `templateSet` array if it doesn't exist
- Matches on both name AND version for precise identification
- If blueprint already exists (same name and version) and is disabled, re-enables it (sets `isDisabled = "false"`)
- If blueprint already exists and is enabled, no changes made (returns success with `alreadyExists: true`)
- If blueprint doesn't exist, creates new `TemplateSetModel` instance and adds to array
- Marks model as having unsaved changes

### unselect_fabrication_blueprint

```typescript
public async unselect_fabrication_blueprint(
    blueprintName: string,     // Required - exact name to remove
    version: string            // Required - exact version to remove
): Promise<any>
```

**Purpose:** Remove a fabrication blueprint from the model's `templateSet` array.

**Behavior:**
- Searches `templateSet` array for matching blueprint (by name AND version)
- If found, removes it using `splice()`
- If not found, returns error with `notFound: true`
- Marks model as having unsaved changes

## Key Differences from Model Features

| Aspect | Model Features | Fabrication Blueprints |
|--------|---------------|------------------------|
| **Data Model** | `ModelFeatureModel` | `TemplateSetModel` |
| **Storage Location** | `rootModel.namespace[0].modelFeature` | `rootModel.templateSet` |
| **Matching** | Name AND version | Name AND version |
| **Completion Check** | Cannot remove if `isCompleted === "true"` | Can always remove |
| **Disabled State** | No disabled concept | Has `isDisabled` property |
| **Re-enable on Select** | Not applicable | Re-enables if `isDisabled === "true"` |

## TemplateSetModel Structure

```typescript
class TemplateSetModel {
    name?: string;          // Blueprint name (primary identifier)
    title?: string;         // Display title/label
    version?: string;       // Version string
    isDisabled?: string;    // "true" or "false" - disabled blueprints are not used
}
```

## Usage Examples

### Selecting a Blueprint

**GitHub Copilot Query:**
```
Add the "React Frontend" blueprint version "2.1.0" to my model
```

**MCP Tool Call:**
```json
{
  "tool": "select_fabrication_blueprint",
  "arguments": {
    "blueprintName": "React Frontend",
    "version": "2.1.0"
  }
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Blueprint 'React Frontend' added to model successfully",
  "blueprintName": "React Frontend",
  "alreadyExists": false
}
```

**Already Exists Response:**
```json
{
  "success": true,
  "message": "Blueprint 'React Frontend' is already in the model",
  "blueprintName": "React Frontend",
  "alreadyExists": true
}
```

**Re-enabled Response:**
```json
{
  "success": true,
  "message": "Blueprint 'React Frontend' was re-enabled in the model",
  "blueprintName": "React Frontend",
  "alreadyExists": true
}
```

### Unselecting a Blueprint

**GitHub Copilot Query:**
```
Remove the "React Frontend" blueprint version "2.1.0" from my model
```

**MCP Tool Call:**
```json
{
  "tool": "unselect_fabrication_blueprint",
  "arguments": {
    "blueprintName": "React Frontend",
    "version": "2.1.0"
  }
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Blueprint 'React Frontend' removed from model successfully",
  "blueprintName": "React Frontend",
  "notFound": false
}
```

**Not Found Response:**
```json
{
  "success": false,
  "error": "Blueprint 'React Frontend' not found in the model",
  "blueprintName": "React Frontend",
  "notFound": true
}
```

## Implementation Details

### HTTP Bridge Pattern

Both tools use the HTTP bridge on port 3002 to communicate with the extension:

```typescript
POST http://localhost:3002/api/execute-command
Content-Type: application/json

{
  "command": "select_fabrication_blueprint",
  "blueprintName": "React Frontend",
  "title": "React Frontend Template",
  "version": "2.1.0"
}
```

### Selection Logic (in mcpBridge.ts)

```typescript
// Ensure templateSet array exists
if (!rootModel.templateSet || !Array.isArray(rootModel.templateSet)) {
    rootModel.templateSet = [];
}

// Check if blueprint already exists (match on name AND version)
const existingIndex = rootModel.templateSet.findIndex(t => 
    t.name === blueprintName && t.version === version
);

if (existingIndex === -1) {
    // Add new blueprint
    const newBlueprint = new TemplateSetModel({
        name: blueprintName,
        title: "",
        version: version,
        isDisabled: "false"
    });
    rootModel.templateSet.push(newBlueprint);
    modelService.markUnsavedChanges();
} else if (rootModel.templateSet[existingIndex].isDisabled === "true") {
    // Re-enable disabled blueprint
    rootModel.templateSet[existingIndex].isDisabled = "false";
    modelService.markUnsavedChanges();
} else {
    // Already exists and is enabled
    // No changes needed
}
```

### Unselection Logic (in mcpBridge.ts)

```typescript
// Find blueprint in templateSet array (match on name AND version)
const blueprintIndex = rootModel.templateSet.findIndex(t => 
    t.name === blueprintName && t.version === version
);

if (blueprintIndex !== -1) {
    // Remove the blueprint
    rootModel.templateSet.splice(blueprintIndex, 1);
    modelService.markUnsavedChanges();
} else {
    // Blueprint not found
    // Return 404 error
}
```

## MCP Server Registration

### select_fabrication_blueprint Schema

```typescript
this.server.registerTool('select_fabrication_blueprint', {
    title: 'Select Fabrication Blueprint',
    description: 'Add a fabrication blueprint (template set) from the catalog to your AppDNA model. Matching is done on both name AND version. The blueprint will be added to the root templateSet array. If the blueprint already exists (same name and version), it will be re-enabled if disabled. The model is updated in memory and marked as having unsaved changes. Use list_fabrication_blueprint_catalog_items to find available blueprints first.',
    inputSchema: {
        blueprintName: z.string().describe('Exact name of the blueprint from the catalog (case-sensitive, must match catalog item name exactly)'),
        version: z.string().describe('Exact version of the blueprint from the catalog (must match catalog item version exactly)')
    },
    outputSchema: {
        success: z.boolean(),
        message: z.string().optional(),
        blueprintName: z.string().optional(),
        version: z.string().optional(),
        alreadyExists: z.boolean().optional().describe('True if blueprint was already in the model'),
        error: z.string().optional()
    }
});
```

### unselect_fabrication_blueprint Schema

```typescript
this.server.registerTool('unselect_fabrication_blueprint', {
    title: 'Unselect Fabrication Blueprint',
    description: 'Remove a fabrication blueprint (template set) from your AppDNA model. Matching is done on both name AND version. The blueprint will be removed from the root templateSet array. The model is updated in memory and marked as having unsaved changes.',
    inputSchema: {
        blueprintName: z.string().describe('Exact name of the blueprint to remove (case-sensitive, must match existing blueprint name)'),
        version: z.string().describe('Exact version of the blueprint to remove (must match existing blueprint version)')
    },
    outputSchema: {
        success: z.boolean(),
        message: z.string().optional(),
        blueprintName: z.string().optional(),
        version: z.string().optional(),
        notFound: z.boolean().optional().describe('True if the blueprint was not found in the model'),
        error: z.string().optional()
    }
});
```

## Files Modified

1. **src/mcp/tools/modelServiceTools.ts**
   - Added `select_fabrication_blueprint()` method
   - Added `unselect_fabrication_blueprint()` method

2. **src/mcp/server.ts**
   - Registered both tools with Zod schemas
   - Added tool handlers with error handling

3. **src/services/mcpBridge.ts**
   - Added `select_fabrication_blueprint` handler in `/api/execute-command`
   - Added `unselect_fabrication_blueprint` handler in `/api/execute-command`
   - Uses `TemplateSetModel` for blueprint instances

4. **MCP_README.md**
   - Updated tool count from 77 to 79
   - Added tool descriptions

5. **src/extension.ts**
   - Updated ChatMode tools list
   - Updated tool count to 82 (includes view tools)

6. **todo.md**
   - Marked both tools as done

7. **copilot-command-history.txt**
   - Documented the implementation

## Common Use Cases

### 1. Selecting Multiple Blueprints

```
Add the React Frontend, Node.js Backend, and PostgreSQL Database blueprints to my model
```

GitHub Copilot will call the tool three times:
- `select_fabrication_blueprint("React Frontend")`
- `select_fabrication_blueprint("Node.js Backend")`
- `select_fabrication_blueprint("PostgreSQL Database")`

### 2. Replacing a Blueprint

```
Remove the MySQL Database blueprint and add the PostgreSQL Database blueprint
```

GitHub Copilot will:
1. Call `unselect_fabrication_blueprint("MySQL Database")`
2. Call `select_fabrication_blueprint("PostgreSQL Database")`

### 3. Listing and Selecting

```
Show me available fabrication blueprints and add the ones for REST API
```

GitHub Copilot will:
1. Call `list_fabrication_blueprint_catalog_items()` to see available blueprints
2. Call `select_fabrication_blueprint()` for REST API related blueprints

### 4. Checking Current Selection

```
What fabrication blueprints are currently selected in my model?
```

GitHub Copilot will call `list_fabrication_blueprint_catalog_items()` and filter for items with `selected: true`.

## Error Handling

### No Model Loaded
```json
{
  "success": false,
  "error": "No model file is loaded. Please load a model file first.",
  "blueprintName": "React Frontend"
}
```

### Model Access Error
```json
{
  "success": false,
  "error": "Failed to get current model.",
  "blueprintName": "React Frontend"
}
```

### Blueprint Not Found (Unselect)
```json
{
  "success": false,
  "error": "Blueprint 'NonExistent' not found in the model",
  "blueprintName": "NonExistent",
  "notFound": true
}
```

### Extension Communication Error
```json
{
  "success": false,
  "error": "Failed to connect to extension: ECONNREFUSED. Is the extension running?"
}
```

## Testing Checklist

- [x] Compile TypeScript successfully
- [x] Update all tool registrations
- [x] Update HTTP bridge handlers
- [x] Update MCP README
- [x] Update ChatMode instructions
- [x] Document changes in copilot-command-history.txt
- [ ] Manual test: Select blueprint with name only
- [ ] Manual test: Select blueprint with name, title, and version
- [ ] Manual test: Unselect blueprint
- [ ] Manual test: Try to select already-selected blueprint
- [ ] Manual test: Try to select disabled blueprint (should re-enable)
- [ ] Manual test: Try to unselect non-existent blueprint

## Future Enhancements

1. **Batch Operations**
   - `select_multiple_blueprints` - Select multiple blueprints at once
   - `unselect_multiple_blueprints` - Remove multiple blueprints at once

2. **Blueprint Dependencies**
   - Check if blueprint has dependencies
   - Auto-select required blueprints
   - Warn if removing a blueprint that others depend on

3. **Blueprint Validation**
   - Verify blueprint exists in catalog before selecting
   - Suggest similar blueprints if name doesn't match exactly
   - Check for conflicts between selected blueprints

4. **Blueprint Configuration**
   - `configure_blueprint` - Set blueprint-specific options
   - `get_blueprint_config` - Retrieve blueprint configuration
   - Store configuration in model alongside blueprint selection

5. **Blueprint Metadata**
   - `get_blueprint_details` - Full details from catalog
   - `list_blueprint_files` - Preview files that will be generated
   - `get_blueprint_requirements` - Check prerequisites

## Related Tools

- **list_fabrication_blueprint_catalog_items** - List available blueprints with selection status
- **list_model_fabrication_requests** - List fabrication requests (for generating code from blueprints)
- **select_model_feature** - Select model features (similar pattern, but for features not blueprints)
- **unselect_model_feature** - Unselect model features

## References

- Fabrication Blueprint Catalog View: `src/commands/fabricationBlueprintCatalogCommands.ts`
- TemplateSetModel: `src/data/models/templateSetModel.ts`
- Model Services API: `modelservicesapi.derivative-programming.com`
- MCP SDK: Version 1.20.0
- HTTP Bridge: Ports 3001 (data), 3002 (commands), 3000 (MCP)

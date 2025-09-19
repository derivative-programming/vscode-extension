# Test: ObjectWorkflowOutputVar Source References

## Summary of Changes

Extended data object usage analysis to include `objectWorkflowOutputVar` source references for:

### Forms (Page Workflows)
- **New Reference Type**: "Form Output Variable Source Object"
- **Detection Logic**: Checks `objectWorkflowOutputVar.sourceObjectName` property
- **Format**: "FormName / OutputVarName"

### Flows (General Flow, Workflow, Page Init Flow, Workflow Task)
- **New Reference Types**:
  - "General Flow Output Variable Source Object"
  - "Workflow Output Variable Source Object" 
  - "Page Init Flow Output Variable Source Object"
  - "Workflow Task Output Variable Source Object"
- **Detection Logic**: Checks `objectWorkflowOutputVar.sourceObjectName` property
- **Format**: "FlowName / OutputVarName"

### Flow Input Parameters (Enhanced)
- **New Reference Types**:
  - "General Flow Input Parameter Source Object"
  - "Workflow Input Parameter Source Object"
  - "Page Init Flow Input Parameter Source Object"
  - "Workflow Task Input Parameter Source Object"
- **Detection Logic**: Checks `objectWorkflowParam.sourceObjectName` or `fKObjectName` fallback
- **Format**: "FlowName / ParamName"

## Implementation Details

### Schema Support
✅ `app-dna.schema.json` includes `sourceObjectName` and `sourcePropertyName` for both:
- `objectWorkflowParam` (lines ~1325-1340)
- `objectWorkflowOutputVar` (lines ~1420-1425)

### Model Support
✅ Both models already include the properties:
- `ObjectWorkflowParamModel` - Added in previous updates
- `ObjectWorkflowOutputVarModel` - Already included `sourceObjectName` and `sourcePropertyName`

### Interface Support
✅ Both interfaces include the properties:
- `ObjectWorkflowParamSchema` - Updated with index signature
- `ObjectWorkflowOutputVarSchema` - Already included properties

## Expected Results

When a data object is referenced as a source in:
1. **Form input parameters** → "Form Input Control Source Object" reference
2. **Form output variables** → "Form Output Variable Source Object" reference  
3. **Flow input parameters** → "[FlowType] Input Parameter Source Object" reference
4. **Flow output variables** → "[FlowType] Output Variable Source Object" reference

All these references will be:
- Counted in the summary tab under "Form References" or "Flow References"
- Displayed in the detail tab with appropriate reference types
- Clickable via Actions column to open the parent form/flow details

## Testing Scenarios

To test, create model data with:
1. Form with `objectWorkflowParam` having `sourceObjectName: "TestObject"`
2. Form with `objectWorkflowOutputVar` having `sourceObjectName: "TestObject"`
3. General Flow with `objectWorkflowParam` having `sourceObjectName: "TestObject"`
4. General Flow with `objectWorkflowOutputVar` having `sourceObjectName: "TestObject"`

Expected: TestObject should show 4 references (2 form, 2 flow) in usage analysis.
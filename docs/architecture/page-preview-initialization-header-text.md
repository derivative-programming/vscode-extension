# Page Initialization Flow Header Text Feature

## Overview
This feature displays page initialization flow output variables as header text above form controls (for forms) or above the filter section (for reports) in the page preview view.

## Implementation Details

### When Header Text is Displayed
- For **forms**: When a form has an `initObjectWorkflowName` property that references a page initialization flow
- For **reports**: When a report has an `initObjectWorkflowName` property that references a page initialization flow

### Output Variable Requirements
Header text is displayed for output variables that meet these criteria:
1. `isHeaderText` property is set to `"true"`
2. `isIgnored` property is not set to `"true"` (or doesn't exist)

### Display Format
Each qualifying output variable is displayed as:
```
[labelText]: [output var name] value
```

Where:
- `labelText` comes from the output variable's `labelText` property (fallback to `name` or 'Header')
- `output var name` is the actual name of the output variable
- "value" is literal text indicating this is where the runtime value would appear

### Visual Styling
- Header text appears in a styled container with a light background and border
- Each header text item is displayed on its own line
- Label text is bold, value text is italicized
- Uses VS Code theme colors for consistency

### Code Location
- **File**: `src/webviews/pagepreview/components/htmlGenerator.js`
- **Helper Functions**:
  - `findInitializationWorkflow()` - Locates the initialization workflow by name
  - `generatePageInitHeaderText()` - Generates the HTML for header text display
- **Integration Points**:
  - `generateFormPreviewHTML()` - Adds header text after form header, before auto-submit notification
  - `generateReportPreviewHTML()` - Adds header text after action buttons, before filters

### Example Usage
1. Create a page initialization flow with output variables
2. Set `isHeaderText: "true"` on desired output variables  
3. Reference the initialization flow in a form or report using `initObjectWorkflowName`
4. View the page in Page Preview to see the header text displayed

### Related Todo Item
This implementation addresses the todo item:
> "if the form has a page initialization flow assigned, review the page init flow output vars. If isHeaderText=true then we need to display it as a name value pair in the format '[labelText]: [output var name] value' above the input controls"

And the report equivalent:
> "if the report has a page initialization flow assigned, review the page init flow output vars. If isHeaderText=true then we need to display it as a name value pair in the format '[labelText]: [output var name] value' above the form filter section"

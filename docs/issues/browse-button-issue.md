# Add "Browse Data Objects" lookup buttons for sourceObjectName fields in workflow detail views

The report and form detail views correctly implement "Browse Data Objects" lookup buttons for sourceObjectName fields, but several workflow detail views are missing this functionality. This creates an inconsistent user experience where some views have lookup assistance while others require manual entry.

## Current State

**✅ Views WITH lookup buttons:**
- Report Details View → Columns tab → sourceObjectName field
- Form Details View → Input Controls tab → sourceObjectName field (in objectWorkflowParam)

**❌ Views MISSING lookup buttons:**
- Form Details View → Output Variables tab → sourceObjectName field (in objectWorkflowOutputVar)  
- Page Init Flow Details View → Output Variables tab → sourceObjectName field (in objectWorkflowOutputVar)
- General Flow Details View → Output Variables tab → sourceObjectName field (in objectWorkflowOutputVar)
- General Flow Details View → Input Controls tab → sourceObjectName field (in objectWorkflowParam)

## Implementation Pattern

The working implementation is found in:
- `src/webviews/reports/components/templates/columnsTableTemplate.js` lines 117-121
- `src/webviews/forms/components/templates/paramsTableTemplate.js` lines 98-102

Pattern:
```javascript
} else if (columnKey === "sourceObjectName") {
    browseButton = `<button type="button" class="lookup-button" data-prop="${columnKey}" data-index="${index}" ${!propertyExists ? "disabled" : ""} title="Browse Data Objects">
        <span class="codicon codicon-search"></span>
    </button>`;
    controlContainer = `<div class="control-with-button">${inputField}${browseButton}</div>`;
```

## Files to Modify

1. `src/webviews/forms/components/templates/outputVarsTableTemplate.js` - Add browse button for sourceObjectName 
2. `src/webviews/pageinits/components/templates/outputVarsTableTemplate.js` - Add browse button for sourceObjectName
3. `src/webviews/generalFlow/components/templates/outputVarsTableTemplate.js` - Add browse button for sourceObjectName
4. `src/webviews/generalFlow/components/templates/paramsListTemplate.js` - Add browse button for sourceObjectName

The browse button should be enabled/disabled based on the property existence checkbox state, following the same pattern as the working implementations.

# Page Preview View - Testing Guide

## Overview
The Page Preview View provides a user-friendly way to preview forms and reports with role-based filtering before opening the full details view.

## How to Test

### 1. Access the Page Preview View
- Open the AppDNA tree view in VS Code
- Expand the **PAGES** node (requires `showAdvancedProperties` to be `true` in config)
- Click the **Preview** button (eye icon) next to the PAGES node
- Or use keyboard shortcut: `Alt + A + V`
- Or access via Command Palette: "Show Page Preview"

### 2. Features to Test

#### Role Filtering
- [ ] Checkbox list shows all roles found in forms/reports
- [ ] "Public Pages" option appears if there are pages without role requirements
- [ ] All checkboxes start checked by default
- [ ] Unchecking a role hides pages requiring that role from the dropdown
- [ ] Page dropdown updates in real-time as role filters change

#### Page Selection
- [ ] Dropdown shows forms and reports filtered by selected roles
- [ ] Page names are displayed clearly (titleText or name property)
- [ ] Selecting "Select a page to preview..." shows no preview
- [ ] Selecting a specific page shows the preview section

#### Form Preview Display
- [ ] Form header shows title and role information
- [ ] Parameters section shows placeholder input fields
- [ ] Buttons section shows actual buttons from the form configuration
- [ ] "View Full Form Details" link opens the actual form details view
- [ ] Preview styling matches VS Code theme

#### Navigation Integration
- [ ] "View Full Form Details" link successfully opens form details view
- [ ] Form details view opens with correct form selected
- [ ] Both views can be open simultaneously

#### Data Refresh
- [ ] Refresh button updates data from current model
- [ ] External changes to model file trigger automatic refresh
- [ ] Success indicator appears after refresh (checkmark icon)

### 3. Expected Behavior

#### Form Preview Structure
```
┌─────────────────────────────────┐
│           Form Title            │
│         Form Preview            │
│        (Role: Admin)            │
├─────────────────────────────────┤
│          Parameters             │
│  Sample Input Field             │
│  [Preview input field]          │
├─────────────────────────────────┤
│      Available Actions          │
│  [Cancel] [Save] [Custom]       │
├─────────────────────────────────┤
│     View Full Form Details      │
└─────────────────────────────────┘
```

#### Report Preview (Future)
- Currently shows placeholder with visualization type information
- Framework prepared for future implementation

### 4. Integration Points
- **Tree View**: Preview button appears on PAGES node when advanced properties are enabled
- **Command System**: Registered as `appdna.showPagePreview` command
- **External Change Handling**: Integrated with extension's file watch system
- **Model Service**: Uses same data extraction as Page Flow Diagram view

### 5. Troubleshooting
- If PAGES node is not visible: Check `showAdvancedProperties` in app-dna.config.json
- If no pages appear: Ensure forms/reports have `isPage="true"` property
- If preview is empty: Check browser console for JavaScript errors
- If form details don't open: Verify form names match between preview and model

### 6. Technical Details
- Reuses page extraction logic from Page Flow Diagram view for consistency
- Follows established extension patterns (wrapper classes, modular structure)
- Responsive design works on different screen sizes
- Professional VS Code theme integration

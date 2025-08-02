# Page Preview Conditional Button Visibility (2025-07-26)
**Feature:** Added conditional visibility indicators for buttons with conditionalVisiblePropertyName property
- **Requirement:** If a button has the property conditionalVisiblePropertyName set, show a {?} with the button and hover text describing when it is shown
- **Implementation:** Conditional visibility indicator appears as orange `{?}` next to button text when conditionalVisiblePropertyName exists
- **Hover Text:** Shows "Conditional button - shown when [property name] is true" when hovering over the indicator
- **CSS Styling:**
  1. **Color:** Uses VS Code orange theme variable (`var(--vscode-charts-orange)`)
  2. **Typography:** Bold font, 11px size, with 4px left margin
  3. **Cursor:** Help cursor on hover with opacity transition effects
  4. **Position:** Inline with button text for seamless integration
- **Button Types Supported:**
  1. **Form Buttons:** objectWorkflowButton arrays in forms (primary/secondary buttons)
  2. **Report Action Buttons:** reportButton arrays for add/edit/delete actions
  3. **Breadcrumb Buttons:** Navigation breadcrumb buttons in reports
  4. **Back Buttons:** Report back navigation buttons
  5. **Grid Action Buttons:** Buttons within report grid columns (isButton="true")
  6. **Detail View Buttons:** Buttons in detail two-column and three-column report views
- **Schema Integration:** Property `conditionalVisiblePropertyName` is a string field in the schema with description "If button is conditional dependent on third field"
- **User Experience:** Clear visual indication of conditional buttons without cluttering the interface
- **Files Modified:** `src/webviews/pagepreview/components/htmlGenerator.js`
- **Security:** Uses proper HTML escaping and avoids nested template literals per coding guidelines

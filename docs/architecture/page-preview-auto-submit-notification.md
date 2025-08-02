# Page Preview Auto-Submit Notification (2025-07-26)
**Feature:** Added auto-submit notification to form previews when `isAutoSubmit` property is true
- **Property Source:** `isAutoSubmit` is a string enum ("true"/"false") in the objectWorkflow schema
- **Display Logic:** Shows prominent notice "Note: this form will be automatically submitted" when isAutoSubmit="true"
- **Implementation Details:**
  1. **HTML Structure:** Added `<div class="auto-submit-notice">` with notification text
  2. **Positioning:** Displayed prominently after form header and before form parameters
  3. **Conditional Display:** Only shows when `workflowObj.isAutoSubmit === "true"`
  4. **Styling:** Uses VS Code notification theme colors for visual prominence
- **CSS Implementation:**
  1. **Desktop Styles:** `.auto-submit-notice` with notification colors, padding, and border styling
  2. **Mobile Styles:** Responsive design with smaller padding and font size for mobile devices
  3. **Visual Design:** Uses info notification colors with subtle background and border
- **Files Modified:** `src/webviews/pagepreview/components/htmlGenerator.js`
- **User Experience:** Users are clearly informed when a form will auto-submit, preventing confusion
- **Integration:** Works seamlessly with existing form preview structure and responsive design

# Page Preview Form Footer Text Implementation (2025-07-26)
**Feature:** Added support for displaying `formFooterText` in form previews when the property has a value
- **Property Source:** `formFooterText` is a string property in the objectWorkflow schema (app-dna.schema.json)
- **Display Logic:** Footer text is shown below the form buttons, left-justified, when the property exists and has a value
- **Implementation Details:**
  1. **HTML Structure:** Added `<div class="form-footer-text" id="formFooterText"></div>` after the form buttons container
  2. **Styling:** Added CSS for both desktop and mobile views with proper spacing and text styling
  3. **Display Function:** Enhanced `showFormPreview()` to check for `workflow.formFooterText` and display it
  4. **Conditional Display:** Footer text div is only shown when text exists (hidden by default with `display: none`)
- **CSS Implementation:**
  1. **Desktop Styles:** `.form-footer-text` with 15px top margin, 12px font-size, and description color
  2. **Mobile Styles:** Same styling applied in mobile media query for responsive design
  3. **Positioning:** Left-justified text placement below the button row
- **Files Modified:** `src/webviews/pagepreview/components/htmlGenerator.js`
- **User Experience:** Users can now see form footer text in the preview, matching the actual form layout
- **Integration:** Works seamlessly with existing form preview functionality and role-based filtering

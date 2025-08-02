# Recent Changes

## Enhanced Add Output Variable Modal for Forms (2025-08-02)
**Enhancement:** Implemented Add Output Variable modal system similar to Input Controls, providing single and bulk add functionality with comprehensive validation.

**Key Changes:**
- **Modal-Based System:** Changed from direct add to modal-based system with tabs for single and bulk adding
- **Two-Tab Interface:** Single Output Variable tab for individual adds, Bulk Add tab for multiple variables at once
- **Comprehensive Validation:** Name validation (Pascal case, alphanumeric, unique, max 100 chars)
- **Real-time Feedback:** Error messages displayed for validation failures
- **Auto-focus:** Input fields automatically focused based on active tab
- **Enter Key Support:** Single add supports Enter key for quick submission
- **Bulk Processing:** Bulk add validates all names and reports specific errors per name

**Technical Implementation:**
- **New Files Created:** 
  - `addOutputVariableModalTemplate.js` - HTML template for the modal
  - `addOutputVariableModalFunctionality.js` - JavaScript functionality
- **Integration Points:**
  - Updated `clientScriptTemplate.js` to include new modal templates
  - Modified `domInitialization.js` to call modal instead of direct add
  - Added `addOutputVarWithName` message handler in `formDetailsView.js`
  - Created `addOutputVarToFormWithName` function with webview refresh support
- **Pattern Consistency:** Follows same architectural pattern as Input Controls add system

## Enhanced Add Button Modal for Forms (2025-08-02)
**Enhancement:** Updated the form details view "Add Button" functionality to use a modal dialog that prompts the user for button text with uniqueness validation.

**Key Changes:**
- **User Input Required:** The "Add Button" button now shows a modal asking for button text instead of auto-generating names
- **Uniqueness Validation:** Real-time validation ensures button text is unique within the form (checks both buttonText and buttonName properties)
- **Button Type Set:** New buttons automatically have buttonType set to 'other' as per requirements
- **Enter Key Support:** Users can press Enter in the text input to add the button
- **Error Feedback:** Clear error messages shown for empty or duplicate button text

**Files Modified:**
- `src/webviews/forms/components/scripts/domInitialization.js` - Updated to show modal instead of direct command
- `src/webviews/forms/components/templates/modalTemplates.js` - Updated add button modal template with text input
- `src/webviews/forms/components/templates/addButtonModalFunctionality.js` - New file with modal functionality and validation
- `src/webviews/forms/components/templates/clientScriptTemplate.js` - Included new modal functionality
- `src/webviews/forms/formDetailsView.js` - Added new `addButtonWithText` command handler and function
- `src/webviews/forms/styles/detailsViewStyles.js` - Added styling for error messages and help text

**Technical Implementation:**
- Created `addButtonToFormWithText()` function that accepts buttonText and buttonType from user input
- Added `addButtonWithText` message command alongside existing `addButton` command
- Modal validation checks existing buttons array for both buttonText and buttonName conflicts
- Generated buttonName from buttonText by removing special characters for internal identification

## Bulk Add Property Modal Enter Key Fix (2025-08-02)
**Issue Fixed:** In the bulk add tab of the property modal, pressing Enter would submit the modal instead of allowing new lines in the textarea.

**Root Cause:** The bulk properties textarea had Enter key handling that was intercepting Enter key presses and submitting the form, preventing normal textarea behavior.

**Solution Implemented:**
- Removed all Enter key event handling from the `#bulkProps` textarea
- Allows normal textarea behavior where Enter creates new lines
- Users must explicitly click the "Add Properties" button to submit
- Prevents accidental form submission when users just want to add line breaks

**Files Modified:**
- `src/webviews/objects/components/templates/propertyModalFunctionality.js`

**User Experience Improvement:**
- Users can now press Enter to create new lines when typing multiple property names
- No risk of accidental form submission
- Must explicitly click button to submit, making the action intentional

**Key Learning:** For bulk add textareas where users need to enter multiple items on separate lines, avoid Enter key handling altogether to preserve normal textarea behavior. Let users explicitly submit via button clicks.

## Bulk Add Property Save Issue Fix (2025-08-02)
**Issue Fixed:** In the bulk add tab of the property modal, when adding multiple properties, only the first property would be saved to the model despite all properties appearing in the UI.

**Root Cause:** The `propertyAdded` event listener in `saveSubmitHandlers.js` was set up with `{ once: true }`, meaning it would only handle the first event and then remove itself. When bulk adding, each call to `addNewProperty()` dispatched a `propertyAdded` event, but only the first one triggered the model update.

**Solution Implemented:**
1. Modified `addNewProperty()` function to accept an optional `skipEventDispatch` parameter
2. Updated bulk add logic to skip individual event dispatches during bulk operations 
3. Added a single `propertyAdded` event dispatch after all properties are added in bulk

**Files Modified:**
- `src/webviews/objects/components/scripts/propertyManagement.js` - Added skipEventDispatch parameter
- `src/webviews\objects\components\templates\propertyModalFunctionality.js` - Updated bulk add to use skipEventDispatch and dispatch single event

**Technical Details:**
- Single property add: Works as before with immediate event dispatch
- Bulk property add: Skips individual events, dispatches one event after all properties added
- Event listener remains `{ once: true }` but now only receives one event per bulk operation
- Preserves existing model update and unsaved changes functionality

**Key Learning:** When implementing bulk operations, be careful about event-driven architectures that expect single events. Consider whether individual events or batch events are more appropriate.

## Auto-Selection of New Properties (2025-08-02)
**Feature Added:** When a new property is added to a data object, it is now automatically selected in the list view if the list view is currently active.

**Implementation Details:**
- Modified `addNewProperty()` function in `propertyManagement.js` to detect if list view is active
- Enhanced `reloadPropertiesListView()` function with `selectIndex` parameter to allow selection of specific items
- Added logic to automatically select the newly added property and show its details form
- Preserved existing functionality for table view and non-active list view scenarios

**Files Modified:**
- `src/webviews/objects/components/scripts/propertyManagement.js`
- `src/webviews/objects/components/templates/clientScriptTemplate.js`

**Key Learning:** UI automation should be context-aware - only auto-select when the user is actively working in the list view to avoid disrupting other workflows.

## WebView List Selection Fix (2025-08-02)
**Issue Fixed:** Property list selection was being lost when typing in form fields in the data object details view properties tab.

**Root Cause:** The `setupRealTimeUpdates()` function in `saveSubmitHandlers.js` was replacing the `propsList` DOM element with a clone to remove duplicate event listeners, which reset the selected index.

**Solution Implemented:**
- Added `data-handlers-attached` attribute check to prevent unnecessary element replacement
- Enhanced selection preservation logic when element replacement is required
- Modified `reloadPropertiesListView()` to accept `preserveSelection` parameter
- Prevented unnecessary list view reloading when updating from within the list view

**Key Learning:** When cloning DOM elements to remove event listeners, always preserve important state like selected indices, form values, and other UI state.

## Add Input Control Modal Implementation (2025-01-27)
**New Feature Added:** Implemented modal functionality for adding input controls (parameters) to forms, replacing the simple direct command with a rich modal interface similar to the "Add Column" modal in reports view.

**Key Learnings:**
- **Pattern Consistency:** Forms and reports views use different communication patterns - reports use `updateModel` commands for bulk operations while forms use individual commands like `addParam`
- **Modal Architecture:** Modal templates and functionality are injected into client script template via string interpolation, requiring careful escaping and modular design
- **File Organization:** New modal functionality follows established patterns with separate template and functionality files in components/templates directory
- **Command Naming:** Used `addParamWithName` command to distinguish from existing `addParam` command that generates default names
- **Validation Reuse:** Validation logic (PascalCase, alpha-only, uniqueness) follows same patterns as reports view for consistency

**Technical Implementation:**
- **Template:** `addInputControlModalTemplate.js` - HTML structure with single/bulk tabs
- **Functionality:** `addInputControlModalFunctionality.js` - Event handlers and validation logic
- **Integration:** Updated `clientScriptTemplate.js` to inject modal code
- **Backend:** Added `addParamWithName` command handler and `addParamToFormWithName` function
- **UI Updates:** Modified `domInitialization.js` to use modal instead of direct command

**Architecture Patterns Observed:**
1. **Modular Script Injection:** Client scripts use template literals to inject modular functionality
2. **Command Variation:** Different views (forms vs reports) handle bulk operations differently
3. **Template Reuse:** Modal patterns can be reused across views with appropriate customization
4. **Validation Consistency:** Same validation rules applied across all add operations for user consistency

## Page Preview View Implementation (2025-07-20)
**New Feature Added:** Created a comprehensive page preview view that allows users to visually preview forms and reports with role-based filtering.

**RESOLVED (2025-07-20):** JavaScript execution error preventing dropdown population:
- **Error:** `Uncaught ReferenceError: handleRoleChange is not defined` at HTMLInputElement.onchange
- **Root Cause:** Special characters in role names breaking HTML syntax, plus improper JavaScript string concatenation in onclick handlers
- **Location:** Page preview HTML generation in `htmlGenerator.js`  
- **Impact:** Role filter checkboxes failed to execute, preventing dropdown population
- **Solutions Applied:**
  1. Fixed role name escaping for HTML id attributes and data-role attributes
  2. Updated handleRoleChange function to use data attributes instead of parsing ids
  3. Fixed form button onclick handler generation to prevent JavaScript syntax errors
  4. Extracted contextObjectName variable to handle undefined values safely
- **Status:** ✅ COMPLETE - Page preview dropdown should now populate correctly

- **Architecture:** Modular design following established extension patterns with separate directories for components and helpers
- **Key Features:**
  1. **Role-based Filtering:** Checkbox list showing all available roles plus "Public Pages" option, similar to page flow view
  2. **Page Selection:** Dropdown populated with forms and reports filtered by selected roles, displaying format "[name] - [title]"
  3. **Form Preview:** Visual representation of selected forms with placeholder fields, buttons, and styling
  4. **Navigation Integration:** "View Full Page Details" button located under the preview section opens the actual form/report details view
  5. **Automatic Refresh:** Real-time data updates when model changes externally
- **Technical Implementation:**
  - **Main View:** `src/webviews/pagepreview/pagePreviewView.js` - Panel management and message handling
  - **HTML Generator:** `src/webviews/pagepreview/components/htmlGenerator.js` - Complete HTML/CSS/JavaScript generation
  - **Wrapper:** `src/webviews/pagePreviewView.js` - Follows established wrapper pattern for consistency
- **UI/UX Design:**
  - Clean, professional interface matching VS Code design language
  - Responsive design with mobile-friendly controls
  - Simplified header with just the title (no refresh button)
  - Form preview includes header, parameters section, and buttons
  - "View Full Page Details" button positioned under the preview section for better UX flow
  - Report preview placeholder prepared for future implementation
  - **Dropdown Display:** Shows "[name] - [title]" format (or just name if title is identical) for better identification
- **Integration:**
  - **Command:** `appdna.showPagePreview` with keyboard shortcut `Alt+A V`
  - **Tree View:** Added preview button to PAGES node alongside existing page flow button
  - **Refresh Handling:** Integrated with extension's external file change handling system
  - **Reuses:** Page extraction logic from existing page flow view for consistency
- **Future Extensibility:** Framework prepared for report preview implementation when requirements are defined
- **Files Created/Modified:**
  - New directory structure: `src/webviews/pagepreview/` with components and helpers
  - Updated: `registerCommands.ts`, `package.json`, `jsonTreeDataProvider.ts` for full integration

## Page Preview Title Enhancement (2025-07-26)
**Enhancement:** Dynamic preview title that changes based on selected page
- **Issue:** Preview section had static "Page Preview" title regardless of selected page
- **Solution:** Added dynamic title that shows "[page name] Preview" format when a page is selected
- **Implementation:**
  1. Added `id="previewTitle"` to the preview title element in HTML generator
  2. Updated `showFormPreview()` function to set title using `page.name + " Preview"`
  3. Updated `showReportPreview()` function to set title using `page.name + " Preview"`
  4. Updated `hidePreview()` function to reset title back to default "Page Preview"
- **Files Modified:** `src/webviews/pagepreview/components/htmlGenerator.js`
- **User Experience:** Users now see clear indication of which page they are previewing using the page name

## Page Dropdown Alphabetical Sorting (2025-07-26)
**Enhancement:** Page dropdown now displays items in alphabetical order
- **Issue:** Pages were displayed in the order they were filtered, not alphabetically
- **Solution:** Added sorting logic to display pages alphabetically by their display text
- **Implementation:**
  1. Added sorting function that compares display text (name - title format) case-insensitively
  2. Sorting applied after filtering but before populating dropdown options
  3. Uses `localeCompare()` for proper string comparison including international characters
- **Files Modified:** `src/webviews/pagepreview/components/htmlGenerator.js`
- **User Experience:** Users can now easily find pages in the dropdown as they are sorted alphabetically

## Page Selection Refresh Button (2025-07-26)
**Enhancement:** Added refresh icon button to page selection section
- **Feature:** Refresh button in the top-right of the "Select Page" section to reload pages from model in memory
- **Implementation:**
  1. Added flex header layout with title on left and refresh button on right
  2. Refresh button uses VS Code codicon-style refresh icon (SVG)
  3. Button styled to match VS Code theme colors with hover and active states
  4. `handleRefreshPages()` function sends 'refresh' command to extension
  5. Reuses existing refresh mechanism from pagePreviewView.js
- **Files Modified:** `src/webviews/pagepreview/components/htmlGenerator.js`
- **User Experience:** Users can manually refresh page data without closing and reopening the view

## Page Preview Codicon Integration Fix (2025-07-26)
**Bug Fix:** Fixed refresh icon button display by implementing proper VS Code codicon support
- **Issue:** Refresh button was using custom SVG instead of VS Code codicons, causing display inconsistencies
- **Root Cause:** Page preview view was missing codicon CSS integration that other views use
- **Solution:** Implemented complete codicon support following model feature catalog pattern
- **Implementation:**
  1. Added codicon CSS localResourceRoots to webview panel configuration
  2. Generated codicon URI using webview.asWebviewUri for proper security
  3. Updated generateHTMLContent() to accept and include codicon CSS link in HTML head
  4. Replaced custom SVG with proper `<span class="codicon codicon-refresh"></span>`
  5. Updated refresh button CSS to match VS Code design patterns (transparent background, hover effects)
  6. Set codicon font-size to 16px for consistent icon sizing
- **Files Modified:** 
  - `src/webviews/pagepreview/pagePreviewView.js`
  - `src/webviews/pagepreview/components/htmlGenerator.js`
- **User Experience:** Refresh button now displays correctly with proper VS Code styling and icon consistency

## Page Preview Refresh Functionality Fix (2025-07-26)
**Bug Fix:** Fixed refresh button not reloading dropdown due to data structure mismatch
- **Issue:** Clicking refresh button caused "Cannot read properties of undefined (reading 'filter')" error
- **Root Cause:** Message handler expected `message.data.pages` but extension was sending `message.data.allObjects`
- **Analysis:** 
  1. Refresh button called `handleRefreshPages()` → sent 'refresh' command to extension
  2. Extension called `refreshPagePreviewData()` → sent 'updatePageData' with `allObjects`
  3. Webview message handler tried to use `message.data.pages` which was undefined
  4. `updatePageDropdown()` called `allPages.filter()` on undefined variable
- **Solution:** Updated message handler to properly extract pages from allObjects data
- **Implementation:**
  1. Modified 'updatePageData' handler to process `message.data.allObjects`
  2. Added page extraction logic (forms from objectWorkflow, reports from report array)
  3. Added safety check in `updatePageDropdown()` for undefined/non-array `allPages` 
  4. Ensured extracted pages include objectName and pageType properties
- **Files Modified:** `src/webviews/pagepreview/components/htmlGenerator.js`
- **User Experience:** Refresh button now properly reloads dropdown with current model data

## Page Preview Filter Functionality (2025-07-26)
**Feature:** Added filter and cancel filter buttons with modal for filtering dropdown items
- **Implementation:** Filter icon button that shows modal, cancel filter button that appears when filter is active
- **UI Design:**
  1. **Button Layout:** Filter and cancel filter buttons positioned between title and refresh button
  2. **Toggle Behavior:** Filter button hidden when filter active, cancel filter button shown instead
  3. **Modal Design:** Centered modal with proper VS Code styling and overlay
  4. **Accessibility:** Keyboard support (Enter to apply, Escape to close), click overlay to close
- **Filter Logic:**
  1. **Cascading Filters:** Text filter applied after role filtering for combined functionality
  2. **Search Scope:** Searches both page name and titleText (case insensitive)
  3. **Real-time Updates:** Dropdown updates immediately when filter applied or cleared
  4. **State Management:** Filter state preserved across role changes
- **User Experience:**
  1. **Intuitive Controls:** Filter button becomes cancel button when filter active
  2. **Visual Feedback:** Clear indication when filter is applied
  3. **Easy Clearing:** Single click to clear filter and return to full list
  4. **Search As You Type:** Modal remembers previous filter text
- **Technical Implementation:**
  1. **Global State:** `currentFilter` variable tracks active filter text
  2. **Button Management:** `updateFilterButtonVisibility()` controls button display
  3. **Filter Application:** Text filter applied in `updatePageDropdown()` after role filtering
  4. **Event Handling:** Modal keyboard events and overlay click handling
- **Integration:** Works seamlessly with existing role filtering and alphabetical sorting
- **Files Modified:** `src/webviews/pagepreview/components/htmlGenerator.js`
- **User Experience:** Users can easily filter large page lists by name or title text

## Page Count Display (2025-07-26)
**Feature:** Added page count display showing total and filtered counts in select page section
- **Display Logic:**
  1. **No Filtering:** Shows "X pages" (total count only)
  2. **Role Filtering Only:** Shows "X of Y pages shown" (role-filtered vs total)
  3. **Text Filtering Active:** Shows "X of Y pages shown (Z total)" (text-filtered vs role-filtered vs total)
- **UI Design:**
  1. **Positioning:** Below dropdown, right-aligned, italic text
  2. **Styling:** Uses VS Code description foreground color (subtle/muted)
  3. **Size:** 12px font size for unobtrusive display
  4. **Updates:** Real-time updates as filtering changes
- **Technical Implementation:**
  1. **Function:** `updatePageCountDisplay(totalPages, filteredCount, roleFilteredCount)`
  2. **Integration:** Called from `updatePageDropdown()` with current counts
  3. **String Building:** Uses concatenation for compatibility (no template literals)
  4. **Element:** `<div class="page-count-display" id="pageCountDisplay">`
- **User Experience:** Provides clear feedback on filtering effectiveness and total available pages
- **Files Modified:** `src/webviews/pagepreview/components/htmlGenerator.js`

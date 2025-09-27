# Page Usage Tab - Usage Column Explanation Note

**Date:** September 27, 2025
**Status:** ✅ COMPLETED

## Request
Add a note about what the Usage column means in the page usage tab.

## Implementation

### Added Explanatory Note
- Added an informational note between the header actions and table container
- Note explains that the Usage column shows "how many user story journeys include each page"
- Clarifies that "Higher values indicate pages that are frequently used across multiple user scenarios"

### Visual Design
- Used VS Code's info icon (codicon-info) for clear visual indication
- Applied informational styling with blue accent border
- Positioned prominently but non-intrusively above the table
- Used consistent VS Code theme colors and typography

### Technical Implementation
- Added HTML structure in page usage tab content
- Included CSS styling that matches VS Code design language
- Used semantic markup with proper accessibility considerations

## CSS Styling Features
- **Background:** VS Code text code block background for subtle distinction
- **Border:** Standard panel border with blue left accent
- **Typography:** 13px font size for readability without overwhelming
- **Icon:** Blue-themed info icon that aligns with content
- **Spacing:** Proper margins and padding for visual hierarchy

## User Experience Benefits
- **Clarity:** Users immediately understand what Usage numbers represent
- **Context:** Explains the relationship between page usage and user story journeys
- **Discoverability:** Positioned where users naturally look before examining table data
- **Non-intrusive:** Informational without cluttering the interface

## Files Modified
- `src/commands/userStoriesJourneyCommands.ts` - Added HTML structure and CSS styling

## Testing
- Webpack compilation successful ✅
- No breaking changes introduced ✅
- Maintains consistent VS Code theme integration ✅
- Responsive layout preserved ✅
# User Stories Tab CSV Export Fix

**Date:** September 27, 2025
**Status:** ✅ COMPLETED

## Issue Found
The User Stories tab CSV export was missing the "Journey Page Distance" column that is displayed in the table.

## Problem Analysis
- Table displays 4 columns: Story Number, Story Text, Page, Journey Page Distance
- CSV export function `saveJourneyDataToCSV()` only exported 3 columns: Story Number, Story Text, Page
- Journey Page Distance column was completely missing from the exported CSV file

## Implementation

### Changes Made (userStoriesJourneyCommands.ts)
- Updated `saveJourneyDataToCSV()` function to include Journey Page Distance column
- Added "Journey Page Distance" to CSV header
- Added logic to handle journey page distance values:
  - Exports actual distance value if available and not -1
  - Exports empty string if undefined or -1 (indicating no calculation done)
- Maintained proper CSV escaping for all fields

### Technical Details
- Journey page distance values are handled as numbers when available
- Empty/undefined/invalid (-1) values are exported as empty strings for CSV clarity
- Maintains data consistency with table display logic
- Preserves existing CSV formatting and structure

## Files Modified
- `src/commands/userStoriesJourneyCommands.ts` - Updated saveJourneyDataToCSV function

## Testing
- Webpack compilation successful ✅
- No breaking changes introduced ✅
- CSV export now includes all 4 table columns ✅

## Data Handling
- Properly handles undefined/null journey page distances
- Treats -1 values as "not calculated" (empty in CSV)
- Maintains number formatting for valid distance values

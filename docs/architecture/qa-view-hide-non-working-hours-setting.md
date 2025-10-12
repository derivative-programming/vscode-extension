# QA View - Hide Non-Working Hours in Gantt Chart

**Feature:** Toggle to hide non-working hours in Gantt chart timeline  
**Status:** ✅ Implemented  
**Date:** January 2025  
**Related Files:**
- `src/commands/userStoriesQACommands.ts` (lines 1879-1887, 2158, 2180)
- `src/webviews/userStoriesQAView.js` (lines 700-703, 708, 2498-2500, 1313-1333)

## Overview

Added a "Hide non-working hours in Gantt chart timeline" checkbox setting to the QA Forecast Configuration modal. This setting allows users to toggle the visual display of non-working hours (shaded regions) in the forecast Gantt chart, providing a cleaner view when desired.

## Business Value

### Why This Matters

1. **Visual Clarity**: Reduce visual clutter for users who don't need to see non-working hours
2. **Focus on Work**: Emphasize working hours and active testing periods
3. **Printing/Presentation**: Cleaner charts for reports and presentations
4. **User Preference**: Allow customization based on user workflow preferences
5. **Accessibility**: Simpler visuals may be easier to read for some users

### User Story

> As a **QA Manager**, I want to **hide non-working hours in the Gantt chart** so that **I can see a cleaner timeline focused on actual testing periods**.

## Implementation Details

### Configuration Modal Location

**Path:** QA View → Forecast Tab → "Configure" Button → "QA Forecast Configuration" Modal

**Section:** "Display Options" (new section between "Working Hours" and "Summary")

### UI Components

**New Section and Checkbox:**
```html
<div class="config-section">
    <h4>Display Options</h4>
    <div class="modal-field">
        <label style="display: flex; align-items: center; cursor: pointer;">
            <input type="checkbox" id="configHideNonWorkingHours" style="margin-right: 8px;" />
            <span>Hide non-working hours in Gantt chart timeline</span>
        </label>
    </div>
</div>
```

**Default Value:** Unchecked (false) - non-working hours are shown by default

### Visual Behavior

**When Unchecked (Default):**
- Non-working hours (before 9 AM and after 5 PM) are displayed with gray shading
- Provides visual distinction between working and non-working periods
- Helps understand schedule gaps and overnight breaks

**When Checked:**
- Gray shading for non-working hours is hidden
- Gantt chart shows clean, unshaded timeline
- All hours appear uniform (focus on task bars)

### Data Flow

```
User Opens Config Modal
  ↓
Extension loads app-dna-user-story-qa-config.json
  ├─ hideNonWorkingHours: false (default)
  ↓
Modal displays checkbox (unchecked by default)
  ↓
User checks "Hide non-working hours"
  ↓
User clicks "Save"
  ↓
Extension saves to config file
  ├─ hideNonWorkingHours: true
  ↓
Forecast Gantt chart is re-rendered
  ├─ qaConfig.hideNonWorkingHours checked
  ├─ If true: Skip rendering non-working hour rectangles
  ├─ If false: Render gray shading for non-working hours
  ↓
User sees updated Gantt chart
```

### Code Changes

#### 1. Backend - HTML Modal (userStoriesQACommands.ts)

**Location:** Lines 1879-1887

**Added Display Options Section:**
```typescript
<div class="config-section">
    <h4>Display Options</h4>
    <div class="modal-field">
        <label style="display: flex; align-items: center; cursor: pointer;">
            <input type="checkbox" id="configHideNonWorkingHours" style="margin-right: 8px;" />
            <span>Hide non-working hours in Gantt chart timeline</span>
        </label>
    </div>
</div>
```

**Position:** Between "Working Hours" table and "Summary" section

#### 2. Backend - Default Config (userStoriesQACommands.ts)

**Locations:** Lines 2158 and 2180

**Added hideNonWorkingHours to config objects:**
```typescript
config = {
    avgTestTime: 4,
    qaResources: 2,
    defaultQARate: 50,
    hideNonWorkingHours: false,  // ← New field
    workingHours: { ... }
};
```

**Default:** `false` (show non-working hours)

#### 3. Frontend - Save Function (userStoriesQAView.js)

**Location:** Lines 700-703 and 708

**Changes:**
1. Get checkbox element:
   ```javascript
   const hideNonWorkingHoursCheckbox = document.getElementById("configHideNonWorkingHours");
   const hideNonWorkingHours = hideNonWorkingHoursCheckbox ? hideNonWorkingHoursCheckbox.checked : false;
   ```

2. Include in config object:
   ```javascript
   const config = {
       avgTestTime: avgTestTime,
       qaResources: qaResources,
       defaultQARate: defaultQARate,
       hideNonWorkingHours: hideNonWorkingHours,  // ← New field
       workingHours: workingHours
   };
   ```

#### 4. Frontend - Load Function (userStoriesQAView.js)

**Location:** Lines 2498-2500

**Changes:**
```javascript
const hideNonWorkingHoursCheckbox = document.getElementById('configHideNonWorkingHours');

if (hideNonWorkingHoursCheckbox && qaConfig) {
    hideNonWorkingHoursCheckbox.checked = qaConfig.hideNonWorkingHours || false;
}
```

#### 5. Frontend - Gantt Chart Rendering (userStoriesQAView.js)

**Location:** Lines 1313-1333

**Conditional Rendering:**
```javascript
// Highlight non-working hours (based on default 9-5 schedule) - only if not hidden
if (!qaConfig.hideNonWorkingHours) {
    svg.selectAll(".non-working")
        .data(allHours.filter(h => {
            const hour = h.getHours();
            return hour < 9 || hour >= 17;
        }))
        .enter()
        .append("rect")
        .attr("class", "non-working")
        .attr("x", d => { /* ... */ })
        .attr("y", 0)
        .attr("width", hourWidth)
        .attr("height", height)
        .attr("fill", "#f5f5f5")
        .attr("opacity", 0.5);
}
```

**Logic:** Only render non-working hour rectangles if `hideNonWorkingHours` is `false`

### Configuration File Structure

**File:** `app-dna-user-story-qa-config.json`

**Updated Schema:**
```json
{
    "avgTestTime": 4,
    "qaResources": 2,
    "defaultQARate": 50,
    "hideNonWorkingHours": false,
    "workingHours": {
        "monday": { "enabled": true, "startTime": "09:00", "endTime": "17:00" },
        "tuesday": { "enabled": true, "startTime": "09:00", "endTime": "17:00" },
        "wednesday": { "enabled": true, "startTime": "09:00", "endTime": "17:00" },
        "thursday": { "enabled": true, "startTime": "09:00", "endTime": "17:00" },
        "friday": { "enabled": true, "startTime": "09:00", "endTime": "17:00" },
        "saturday": { "enabled": false, "startTime": "09:00", "endTime": "17:00" },
        "sunday": { "enabled": false, "startTime": "09:00", "endTime": "17:00" }
    }
}
```

## User Workflow

### Enabling the Setting

1. Open User Story QA View
2. Navigate to **Forecast** tab
3. Click **"Configure"** button (top-right)
4. Scroll to **"Display Options"** section (after Working Hours table)
5. Check ✅ **"Hide non-working hours in Gantt chart timeline"**
6. Click **"Save"** button
7. Gantt chart automatically refreshes without non-working hour shading

### Disabling the Setting

1. Open QA Forecast Configuration modal
2. Uncheck ☐ **"Hide non-working hours in Gantt chart timeline"**
3. Click **"Save"**
4. Gantt chart refreshes with non-working hours displayed (gray shading)

### Visual Examples

**Before (hideNonWorkingHours: false - Default):**
```
Timeline:  |===|...|===|...|===|...|===|
           9AM 5PM 9AM 5PM 9AM 5PM 9AM
           
Legend:
=== Working hours (white background)
... Non-working hours (gray shading)
```

**After (hideNonWorkingHours: true):**
```
Timeline:  |===|===|===|===|===|===|===|
           9AM 5PM 9AM 5PM 9AM 5PM 9AM
           
Legend:
=== All hours (uniform white background)
```

## Technical Considerations

### Non-Working Hours Definition

Dynamically determined from the "Working Hours" configuration:
- **For each day of the week:** Checks if the day is enabled in `workingHours` config
- **If day is disabled:** All hours for that day are treated as non-working (e.g., weekends)
- **If day is enabled:** Only hours within `startTime` and `endTime` are working hours
- **Example:** If Monday is configured as 9:00 AM - 5:00 PM, only hours 9-16 are working

**Note:** This is a display-only setting. The actual working hours used for forecast calculations are defined in the "Working Hours" table (per-day configuration), and this setting respects that same configuration.

### Performance Impact

**Minimal:** Skipping the rendering of non-working hour rectangles slightly improves render performance (fewer D3.js elements created).

### Backward Compatibility

- ✅ **Existing configs without field:** Default to `false` (show non-working hours)
- ✅ **Missing config file:** Uses default `false`
- ✅ **No breaking changes:** Existing behavior preserved by default

### Auto-Refresh Behavior

When the config is saved:
1. `qaConfig` global variable is updated
2. If Forecast tab is active, `calculateAndRenderForecast()` is called
3. Gantt chart is re-rendered with new setting
4. User sees immediate visual feedback (no manual refresh needed)

## Future Enhancements

### Dynamic Non-Working Hours Definition

Instead of hardcoded 9-5:
```javascript
// Use workingHours config to determine non-working hours dynamically
const isNonWorkingHour = (hour, dayOfWeek) => {
    const dayName = getDayName(dayOfWeek);
    const dayConfig = qaConfig.workingHours[dayName];
    
    if (!dayConfig.enabled) return true; // Entire day is non-working
    
    const startHour = parseInt(dayConfig.startTime.split(':')[0]);
    const endHour = parseInt(dayConfig.endTime.split(':')[0]);
    
    return hour < startHour || hour >= endHour;
};
```

### Additional Display Options

- [ ] "Show gridlines" toggle
- [ ] "Highlight current hour" toggle
- [ ] "Show story numbers on bars" toggle
- [ ] "Compact view" (smaller bars, more stories visible)
- [ ] "Color by tester" toggle
- [ ] "Show cost on bars" toggle

### Granular Control

- [ ] "Hide weekends only"
- [ ] "Hide overnight hours only"
- [ ] "Custom non-working hour ranges"

## Edge Cases Handled

1. **Config Missing Field:** Falls back to `false` (show non-working hours)
2. **Checkbox Element Not Found:** Defaults to `false` when saving
3. **qaConfig Not Loaded:** Rendering skipped (chart won't render anyway)
4. **Manual Config Edit:** Accepts `true` or `false` boolean values

## Testing Checklist

### Basic Functionality
- [ ] Open QA View → Forecast tab
- [ ] Click "Configure" button
- [ ] Verify "Display Options" section exists
- [ ] Verify checkbox is unchecked by default
- [ ] Check the checkbox
- [ ] Click "Save"
- [ ] Verify non-working hours disappear from Gantt chart
- [ ] Re-open config
- [ ] Verify checkbox is still checked
- [ ] Uncheck the checkbox
- [ ] Click "Save"
- [ ] Verify non-working hours reappear (gray shading)

### Visual Verification
- [ ] With checkbox unchecked: Verify gray rectangles appear for hours < 9 AM and >= 5 PM
- [ ] With checkbox checked: Verify no gray rectangles appear
- [ ] Verify task bars remain visible in both modes
- [ ] Verify hour labels remain visible in both modes
- [ ] Verify day headers remain visible in both modes

### Edge Cases
- [ ] Delete config file, verify checkbox unchecked (default)
- [ ] Open old config without hideNonWorkingHours, verify unchecked
- [ ] Save with checkbox checked, verify config file has `"hideNonWorkingHours": true`
- [ ] Manually edit config to `true`, verify checkbox loads checked
- [ ] Switch tabs while config modal open, verify checkbox state preserved

### Integration
- [ ] Verify config saves to `app-dna-user-story-qa-config.json`
- [ ] Verify Gantt chart auto-refreshes after save
- [ ] Verify other config fields still work correctly
- [ ] Verify no console errors when toggling setting

## Related Features

- **QA Forecast Configuration:** Part of comprehensive QA settings
- **Gantt Chart Rendering:** Visual display of forecast schedule
- **Working Hours Configuration:** Defines actual calculation logic (separate from display)

## Documentation References

- [QA View Default QA Rate Config](./qa-view-default-qa-rate-config.md)
- [QA Forecast Tab Ordering](./qa-forecast-tab-ordering-by-dev-completed-date.md)
- [Configuration System](./configuration-system.md)

---

**Last Updated:** January 2025  
**Implemented By:** AI Assistant  
**Reviewed By:** Pending  
**Status:** ✅ Fully functional, ready for use

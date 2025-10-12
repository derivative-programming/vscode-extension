# QA View - Default QA Rate Configuration

**Feature:** Default QA Rate ($/hr) setting in QA Forecast Configuration  
**Status:** ✅ Implemented  
**Date:** January 2025  
**Related Files:**
- `src/commands/userStoriesQACommands.ts` (lines 1862-1874, 2155-2169, 2177-2191)
- `src/webviews/userStoriesQAView.js` (lines 643-677, 699-712, 2479-2499)

## Overview

Added a "Default QA Rate ($/hr)" configuration setting to the QA Forecast Configuration modal. This setting allows users to specify the hourly cost rate for QA testing, which can be used for cost calculations in the forecast tab.

## Business Value

### Why This Matters

1. **Cost Visibility**: Track and forecast QA testing costs
2. **Budget Planning**: Estimate testing costs for sprint/release planning
3. **Resource Allocation**: Compare testing costs across different story sets
4. **ROI Analysis**: Calculate cost-effectiveness of quality assurance efforts

### User Story

> As a **Project Manager**, I want to **configure the default QA hourly rate** so that **I can forecast testing costs and manage QA budgets effectively**.

## Implementation Details

### Configuration Modal Location

**Path:** QA View → Forecast Tab → "Configure" Button → "QA Forecast Configuration" Modal

**Section:** "Testing Parameters" (first section of modal)

### UI Components

**New Field:**
```html
<div class="modal-field">
    <label>Default QA Rate ($/hr):</label>
    <input type="number" id="configDefaultQARate" min="0" max="500" step="1" value="50" />
</div>
```

**Position:** After "Available QA Resources" field, before "Working Hours" section

**Default Value:** $50/hour

**Validation:**
- Minimum: $0/hour
- Maximum: $500/hour
- Step: $1
- Must be non-negative number

### Data Flow

```
User Opens Config Modal
  ↓
Extension loads app-dna-user-story-qa-config.json
  ├─ avgTestTime: 4
  ├─ qaResources: 2
  ├─ defaultQARate: 50  ← New field
  └─ workingHours: { ... }
  ↓
Modal displays current values
  ├─ Average Test Time: 4 hours
  ├─ QA Resources: 2 testers
  ├─ Default QA Rate: $50/hr  ← New field
  └─ Working Hours table
  ↓
User edits defaultQARate (e.g., to $75)
  ↓
User clicks "Save"
  ↓
Webview validates: defaultQARate >= 0
  ↓
Extension saves to app-dna-user-story-qa-config.json
  ↓
Config available for cost calculations
```

### Code Changes

#### 1. Backend - HTML Modal (userStoriesQACommands.ts)

**Location:** Lines 1862-1874

**Added Input Field:**
```typescript
<div class="modal-field">
    <label>Default QA Rate ($/hr):</label>
    <input type="number" id="configDefaultQARate" min="0" max="500" step="1" value="50" />
</div>
```

#### 2. Backend - Default Config (userStoriesQACommands.ts)

**Location:** Lines 2155-2169 and 2177-2191

**Added defaultQARate to config objects:**
```typescript
config = {
    avgTestTime: 4,
    qaResources: 2,
    defaultQARate: 50,  // ← New field
    workingHours: { ... }
};
```

**Two Locations:**
1. When loading existing config (if file not found)
2. When handling errors loading config

#### 3. Frontend - Save Function (userStoriesQAView.js)

**Location:** Lines 643-677

**Changes:**
1. Get input element: `const defaultQARateInput = document.getElementById("configDefaultQARate");`
2. Validate it exists: `if (!avgTestTimeInput || !qaResourcesInput || !defaultQARateInput) return;`
3. Parse value: `const defaultQARate = parseFloat(defaultQARateInput.value);`
4. Validate value:
   ```javascript
   if (isNaN(defaultQARate) || defaultQARate < 0) {
       vscode.postMessage({
           command: "showErrorMessage",
           message: "Default QA rate must be a non-negative number"
       });
       return;
   }
   ```
5. Include in config object:
   ```javascript
   const config = {
       avgTestTime: avgTestTime,
       qaResources: qaResources,
       defaultQARate: defaultQARate,  // ← New field
       workingHours: workingHours
   };
   ```

#### 4. Frontend - Load Function (userStoriesQAView.js)

**Location:** Lines 2479-2499

**Changes:**
1. Get input element: `const defaultQARateInput = document.getElementById('configDefaultQARate');`
2. Populate value:
   ```javascript
   if (defaultQARateInput && qaConfig) {
       defaultQARateInput.value = qaConfig.defaultQARate || 50;
   }
   ```

### Configuration File Structure

**File:** `app-dna-user-story-qa-config.json`

**Updated Schema:**
```json
{
    "avgTestTime": 4,
    "qaResources": 2,
    "defaultQARate": 50,
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

### Setting the Rate

1. Open User Story QA View
2. Navigate to **Forecast** tab
3. Click **"Configure"** button (top-right)
4. Modal opens: "QA Forecast Configuration"
5. Locate **"Testing Parameters"** section
6. Find **"Default QA Rate ($/hr)"** field (third input)
7. Enter desired hourly rate (e.g., `75`)
8. Click **"Save"** button
9. Modal closes, config is saved

### Validation Scenarios

**Valid Inputs:**
- `50` (default)
- `0` (free/volunteer QA)
- `100.50` (decimal rates)
- `500` (maximum)

**Invalid Inputs:**
- `-10` → Error: "Default QA rate must be a non-negative number"
- *(empty)* → Error: "Default QA rate must be a non-negative number"
- `abc` → Browser validation prevents non-numeric input

### Edge Cases Handled

1. **Missing Config File**: Uses default value of $50/hour
2. **Config Missing Rate Field**: Falls back to $50/hour when loading
3. **Existing Configs**: Backward compatible - old configs without rate will show $50/hour
4. **Zero Rate**: Allowed (useful for internal/volunteer QA)
5. **Decimal Rates**: Supported (e.g., $75.50/hour)

## Future Enhancements

### Ready for Cost Calculations

The `defaultQARate` is now available in `qaConfig` for use in:

1. **Forecast Tab - Cost Column**
   - Show estimated cost per story: `avgTestTime * defaultQARate`
   - Show total cost: `sum of all story costs`

2. **Summary Statistics**
   - Add "Estimated Total Cost" metric
   - Add "Cost per Story" average

3. **Export Enhancement**
   - Include cost data in CSV export
   - Add cost column to forecast export

4. **Visualization**
   - Cost over time chart
   - Cost distribution by status
   - Budget vs. actual comparison

### Example Calculation (Not Yet Implemented)

```javascript
// Future forecast cost calculation
forecastData.forEach(item => {
    const testHours = avgTestTime;  // e.g., 4 hours
    const hourlyRate = qaConfig.defaultQARate;  // e.g., $50/hr
    item.estimatedCost = testHours * hourlyRate;  // $200 per story
});

const totalCost = forecastData.reduce((sum, item) => sum + item.estimatedCost, 0);
// Total Cost: $4,800 (24 stories × $200)
```

## Comparison with Dev View

| Feature | Dev View | QA View |
|---------|----------|---------|
| **Rate Field Name** | "Default Developer Rate ($/hr)" | "Default QA Rate ($/hr)" |
| **Default Value** | $60/hour | $50/hour |
| **Config Property** | `defaultDeveloperRate` | `defaultQARate` |
| **Config File** | `app-dna-user-story-dev-config.json` | `app-dna-user-story-qa-config.json` |
| **Location** | Dev View → Details Tab → Configure | QA View → Forecast Tab → Configure |
| **Section** | "Settings" (last section) | "Testing Parameters" (first section) |
| **Current Usage** | ✅ Used in Cost tab calculations | ⏳ Ready for future cost features |

## Testing Checklist

### Basic Functionality
- [ ] Open QA View
- [ ] Navigate to Forecast tab
- [ ] Click "Configure" button
- [ ] Verify "Default QA Rate ($/hr)" field is visible
- [ ] Verify default value is 50
- [ ] Change value to 75
- [ ] Click "Save"
- [ ] Re-open configuration modal
- [ ] Verify value is still 75

### Validation
- [ ] Try entering -10 (should show error)
- [ ] Try entering 0 (should accept)
- [ ] Try entering 500 (should accept - max value)
- [ ] Try entering 600 (should prevent - exceeds max)
- [ ] Try entering text (browser should prevent)
- [ ] Try entering decimal 75.50 (should accept)

### Edge Cases
- [ ] Delete config file, verify default $50 appears
- [ ] Open old config without defaultQARate, verify $50 fallback
- [ ] Set rate to $0, verify it saves and loads correctly
- [ ] Set rate to $500, verify it saves and loads correctly

### Integration
- [ ] Verify config saves to `app-dna-user-story-qa-config.json`
- [ ] Verify `qaConfig` global variable includes `defaultQARate`
- [ ] Verify no console errors when saving/loading
- [ ] Verify other config fields still work (avgTestTime, qaResources, workingHours)

## Related Features

- **User Story Dev View Configuration**: Similar hourly rate field for developers
- **QA Forecast Tab**: Will use this rate for cost calculations
- **QA Configuration System**: Part of comprehensive QA settings management

## Documentation References

- [QA Configuration System](./configuration-system-qa-view.md) *(create if needed)*
- [Dev View Configuration](./configuration-system.md)
- [QA Forecast Tab](./qa-forecast-tab-ordering-by-dev-completed-date.md)

---

**Last Updated:** January 2025  
**Implemented By:** AI Assistant  
**Reviewed By:** Pending  
**Status:** ✅ Ready for cost calculation features

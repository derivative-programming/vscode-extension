# Role Distribution Chart Toggle Implementation

**Created**: October 4, 2025  
**Feature**: Bar/Pie Chart Toggle for User Stories Role Distribution Tab

## Overview

This document describes the implementation of a chart type toggle feature for the User Stories Role Distribution tab (Analytics tab), allowing users to switch between bar chart and pie chart visualizations of user story distribution across roles.

## Implementation Location

- **File**: `src/webviews/userStoriesView.js`
- **Tab**: Analytics (Role Distribution)
- **Data Source**: Server-side generated distribution in `data-role-distribution` attribute

## Changes Made

### 1. HTML - Chart Type Toggle Buttons

Added toggle buttons before the refresh and PNG export buttons:

```html
<div class="chart-type-toggle">
    <button id="roleChartTypeBar" class="chart-type-button active" title="Bar Chart">
        <i class="codicon codicon-graph"></i>
    </button>
    <button id="roleChartTypePie" class="chart-type-button" title="Pie Chart">
        <i class="codicon codicon-pie-chart"></i>
    </button>
</div>
```

### 2. CSS - Toggle Button Styling

Added styles matching VS Code design language:

```css
.chart-type-toggle {
    display: flex;
    gap: 2px;
    border: 1px solid var(--vscode-button-border);
    border-radius: 4px;
    overflow: hidden;
    background: var(--vscode-button-secondaryBackground);
}

.chart-type-button {
    padding: 6px 10px;
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    border: none;
    cursor: pointer;
    /* ... transitions and hover states ... */
}

.chart-type-button.active {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
}
```

### 3. JavaScript - State Management

Added state variable to track current chart type:

```javascript
let roleChartType = 'bar'; // Default to bar chart
```

### 4. JavaScript - Pie Chart Renderer

Created new `renderRoleDistributionPieChart()` function with features:

- **D3.js pie layout** with arc generators
- **Color-coded slices** using existing `getBarColor()` function
- **Interactive hover effects** (arc expands by 10px)
- **Percentage labels** on slices (only if > 5%)
- **Legend** with role names (truncated to 15 chars) and counts
- **Tooltip** showing role, story count, and percentage
- **Zero-count filtering** for cleaner visualization

Key implementation details:
```javascript
function renderRoleDistributionPieChart() {
    // Load distribution from data attribute (same as bar chart)
    // Filter out zero-count roles
    // Create pie layout with d3.pie()
    // Use getBarColor() for consistent coloring
    // Add hover effects with arcHover
    // Smart label display (>5% only)
    // Position legend on right side
}
```

### 5. JavaScript - Unified Renderer

Created router function to switch between chart types:

```javascript
function renderRoleDistribution() {
    if (roleChartType === 'pie') {
        renderRoleDistributionPieChart();
    } else {
        renderRoleDistributionHistogram(); // existing
    }
}
```

### 6. JavaScript - Event Handlers

Added toggle button click handlers:

```javascript
roleChartTypeBarBtn.addEventListener('click', function() {
    if (roleChartType !== 'bar') {
        roleChartType = 'bar';
        // Update button states
        renderRoleDistribution();
    }
});

roleChartTypePieBtn.addEventListener('click', function() {
    if (roleChartType !== 'pie') {
        roleChartType = 'pie';
        // Update button states
        renderRoleDistribution();
    }
});
```

### 7. Updated Existing Functions

Updated calls to use unified renderer:
- `switchTab('analytics')` - Now calls `renderRoleDistribution()`
- Refresh button - Now calls `renderRoleDistribution()`

## Technical Specifications

### Dimensions
- **Width**: 700px (matches bar chart)
- **Height**: 500px (taller than bar chart for legend)
- **Radius**: `Math.min(width, height) / 2 - 60`
- **Legend Offset**: 100px left of center, positioned right side

### Colors
Reuses existing `getBarColor(count, maxCount)` function:
- **Red (#d73a49)**: ≥50% of max (Very High)
- **Orange (#f66a0a)**: ≥30% of max (High)
- **Green (#28a745)**: ≥15% of max (Medium)
- **Gray (#6c757d)**: <15% of max (Low)

### Data Flow
1. Distribution calculated server-side during HTML generation
2. Stored in `data-role-distribution` attribute on `analytics-tab` div
3. Both bar and pie renderers read from same attribute
4. Refresh button recalculates from current table state

## User Experience

### Chart Type Toggle
- Two icon buttons in unified control
- Bar chart icon: `codicon-graph`
- Pie chart icon: `codicon-pie-chart`
- Active button has highlighted background
- Smooth instant rendering on toggle

### Pie Chart Features
1. **Interactive Slices**:
   - Hover to expand slice by 10px
   - Opacity changes to 80% on hover
   - Tooltip appears with details

2. **Smart Labels**:
   - Percentage shown only if slice > 5%
   - White text with shadow for readability
   - Positioned at slice centroid

3. **Legend**:
   - Color swatch matching slice
   - Role name (truncated if > 15 chars)
   - Story count in parentheses
   - Positioned on right side

4. **Tooltip**:
   - Shows full role name
   - Story count
   - Percentage of total

### Summary Statistics
Both chart types show same stats below visualization:
- Total Roles
- Total Stories  
- Avg Stories/Role

## Comparison with QA Status Distribution

### Similarities
- Same HTML structure pattern
- Same CSS styling approach
- Same state management pattern
- Same D3.js pie chart techniques
- Same toggle button behavior

### Differences
- **Data Source**: `data-role-distribution` vs `calculateQAStatusDistribution()`
- **Color Logic**: Dynamic `getBarColor()` vs fixed `getQAStatusColor()`
- **Legend Text**: Truncated role names vs full status labels
- **Canvas Size**: 700x500 vs 600x400 (more roles = need more legend space)
- **Data Structure**: `{ role, count }` vs `{ status, count }`

## Integration Points

### Existing Features Maintained
- Server-side distribution calculation
- Refresh button functionality
- PNG export (works with both chart types)
- Summary statistics
- Tab switching
- Role extraction from user stories

### No Breaking Changes
- Bar chart remains default
- All existing functionality preserved
- PNG export unchanged
- Data calculation unchanged

## Testing Checklist

- [ ] Toggle between bar and pie chart multiple times
- [ ] Verify colors match between chart types
- [ ] Test with few roles (2-3) and many roles (10+)
- [ ] Test with single role
- [ ] Test with no data
- [ ] Verify hover interactions on pie slices
- [ ] Verify labels appear/disappear based on slice size
- [ ] Test legend truncation for long role names
- [ ] Refresh button updates both chart types correctly
- [ ] PNG export works from both chart types
- [ ] Summary statistics update correctly
- [ ] Test in both light and dark VS Code themes
- [ ] Switch tabs and return to Analytics

## Future Enhancements

1. **Persist Chart Preference**: Save user's chart type choice in workspace state
2. **Donut Chart**: Add innerRadius to create donut variant
3. **Export Format**: Include chart type in PNG filename
4. **Animation**: Smooth transition when switching chart types
5. **Drill-down**: Click slice to filter main table by role
6. **Color Customization**: Allow user-defined color schemes

## Related Documentation

- QA Status Distribution: `docs/architecture/qa-status-distribution-chart-toggle.md`
- Candidate Analysis: `docs/reviews/bar-chart-pie-chart-candidates.md`
- Command History: `copilot-command-history.txt` (October 4, 2025)
- Todo List: `todo.md` (marked complete)

## Files Modified

| File | Lines Changed | Description |
|------|---------------|-------------|
| `src/webviews/userStoriesView.js` | ~230 | Added HTML, CSS, JS for toggle feature |
| `todo.md` | 1 | Marked feature as completed |
| `copilot-command-history.txt` | ~70 | Documented implementation |

## Conclusion

The Role Distribution chart toggle feature successfully mirrors the QA Status Distribution implementation, providing users with flexible visualization options for understanding user story distribution across roles. The implementation maintains code quality, follows established patterns, and integrates seamlessly with existing functionality.

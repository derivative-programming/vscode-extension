# QA Status Distribution Chart Toggle Feature

**Created**: October 4, 2025  
**Feature**: Bar/Pie Chart Toggle for User Story QA Status Distribution

## Overview

This document describes the implementation of a chart type toggle feature for the User Story QA Status Distribution tab, allowing users to switch between bar chart and pie chart visualizations of QA testing status data.

## User Interface

### Toggle Location
The chart type toggle is located in the histogram actions area at the top-right of the Status Distribution tab, positioned before the refresh and export PNG buttons.

### Toggle Design
- Two icon buttons in a unified control:
  - **Bar Chart Button**: Uses `codicon-graph` icon
  - **Pie Chart Button**: Uses `codicon-pie-chart` icon
- Active button is highlighted with VS Code theme colors
- Buttons styled to match VS Code's design language

## Technical Architecture

### State Management

**Current Chart Type Variable**:
```javascript
let currentChartType = 'bar'; // Default to bar chart
```

### Rendering Functions

1. **`renderQAStatusDistributionHistogram()`**
   - Original bar chart rendering function
   - Uses D3.js bar chart with scales and axes
   - Displays horizontal bars with status labels

2. **`renderQAStatusDistributionPieChart()`** (NEW)
   - Pie chart rendering using D3.js pie layout
   - Features:
     - Color-coded slices matching bar chart colors
     - Interactive hover effects (slice expands)
     - Percentage labels on slices (only if > 5%)
     - Legend with status labels and counts
     - Tooltip showing status, count, and percentage
     - Filters out zero-count statuses

3. **`renderQAStatusDistribution()`** (NEW)
   - Unified rendering function
   - Routes to appropriate renderer based on `currentChartType`
   - Called by all refresh and update operations

### Data Flow

```
calculateQAStatusDistribution()
    ↓
renderQAStatusDistribution()
    ↓
    ├── currentChartType === 'bar' → renderQAStatusDistributionHistogram()
    └── currentChartType === 'pie' → renderQAStatusDistributionPieChart()
```

### Event Handlers

**Chart Type Toggle Buttons**:
```javascript
chartTypeBarBtn.addEventListener('click', function() {
    if (currentChartType !== 'bar') {
        currentChartType = 'bar';
        // Update button states
        // Re-render visualization
    }
});

chartTypePieBtn.addEventListener('click', function() {
    if (currentChartType !== 'pie') {
        currentChartType = 'pie';
        // Update button states
        // Re-render visualization
    }
});
```

## D3.js Pie Chart Implementation

### Key Components

1. **Pie Layout**:
   ```javascript
   const pie = d3.pie()
       .value(d => d.count)
       .sort(null); // Maintain original order
   ```

2. **Arc Generator**:
   ```javascript
   const arc = d3.arc()
       .innerRadius(0)
       .outerRadius(radius);
   
   const arcHover = d3.arc()
       .innerRadius(0)
       .outerRadius(radius + 10); // Larger for hover
   ```

3. **Interactive Features**:
   - Hover effect: Arc expands by 10 pixels
   - Opacity change: Slice becomes 80% opaque on hover
   - Tooltip appears with detailed information
   - Smooth transitions (200ms for show, 500ms for hide)

4. **Smart Labeling**:
   - Only shows percentage labels when slice > 5%
   - Prevents label clutter on small slices
   - Labels positioned at slice centroids
   - White text with shadow for readability

5. **Legend**:
   - Positioned to the right of the pie chart
   - Shows color swatch, status label, and count
   - Uses same colors as the slices

## Color Scheme

Both chart types use the same semantic colors:
- **Pending**: Gray (`#858585`)
- **Ready to Test**: Blue (`#0078d4`)
- **Started**: Orange (`#f39c12`)
- **Success**: Green (`#28a745`)
- **Failure**: Red (`#d73a49`)

## CSS Styling

### Chart Type Toggle
```css
.chart-type-toggle {
    display: flex;
    gap: 2px;
    border: 1px solid var(--vscode-button-border);
    border-radius: 4px;
    overflow: hidden;
}

.chart-type-button {
    padding: 6px 10px;
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    /* ... transitions and styling ... */
}

.chart-type-button.active {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
}
```

## Integration Points

### Existing Features Maintained
- Filter system: Works with both chart types
- Refresh button: Re-renders current chart type
- PNG export: Works with both chart types
- Summary statistics: Displayed below both chart types
- Tab switching: Respects current chart type selection

### Message Passing
No new messages required; feature works entirely within the webview client-side.

## User Experience Flow

1. User opens User Story QA view
2. Clicks "Status Distribution" tab
3. Default bar chart is displayed
4. User clicks pie chart icon button
5. Visualization smoothly transitions to pie chart
6. User can toggle back and forth at any time
7. Current selection persists during refresh operations
8. Both charts maintain same data and color coding

## Future Enhancements

Possible improvements for future iterations:
1. **Persist Chart Type Preference**: Store user's preference in workspace state
2. **Animation**: Add smooth transitions when switching between chart types
3. **Additional Chart Types**: Donut chart, stacked bar chart, etc.
4. **Export Options**: Include chart type in filename when exporting PNG
5. **Keyboard Shortcuts**: Add hotkeys for toggling chart types

## Testing Considerations

### Test Scenarios
1. Toggle between bar and pie chart multiple times
2. Filter data and verify both chart types update correctly
3. Refresh data and verify chart type persists
4. Export PNG from both chart types
5. Test with empty data (no stories)
6. Test with single status (all stories in one category)
7. Verify colors match between chart types
8. Test hover interactions on pie chart
9. Verify labels appear/disappear based on slice size
10. Test in both light and dark VS Code themes

### Browser Compatibility
- Requires D3.js library (already included)
- Uses modern JavaScript features (ES6)
- CSS uses VS Code theme variables
- Should work in all VS Code webview environments

## Related Documentation

- Main Extension Description: `EXTENSION-DESCRIPTION.md`
- Command History: `copilot-command-history.txt`
- Todo List: `todo.md`
- User Story QA Commands: `src/commands/userStoriesQACommands.ts`
- User Story QA View: `src/webviews/userStoriesQAView.js`

## Architecture Patterns Used

1. **State Management**: Simple variable for chart type state
2. **Routing Pattern**: Unified render function routes to specific renderer
3. **Event-Driven Updates**: Button clicks trigger state change and re-render
4. **Code Reuse**: Both charts share data calculation and color mapping
5. **Progressive Enhancement**: Bar chart remains default, pie chart as option

## Files Modified Summary

| File | Changes |
|------|---------|
| `userStoriesQACommands.ts` | Added HTML for toggle buttons, CSS for toggle styling |
| `userStoriesQAView.js` | Added pie chart renderer, unified renderer, event handlers, state variable |
| `todo.md` | Marked feature as completed |
| `copilot-command-history.txt` | Documented implementation |

## Conclusion

This feature enhances the User Story QA Status Distribution view by providing users with multiple visualization options. The implementation follows existing patterns, maintains code quality, and provides a smooth user experience with intuitive controls.

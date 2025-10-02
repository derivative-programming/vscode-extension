# Page Usage Distribution vs Role Distribution - Implementation Comparison

**Date:** October 2, 2025  
**Purpose:** Side-by-side comparison of reference implementation and new design

---

## Overview

This document shows how the new Role Distribution tab maps to the existing Page Usage Distribution tab, demonstrating the reuse of proven patterns.

---

## Tab Structure Comparison

### Page Usage Distribution (Reference)
```
Page Usage Distribution
├── Header
│   ├── Title: "Page Usage Distribution"
│   ├── Description: "Distribution of pages across usage frequency categories"
│   └── Actions: [Refresh Button] [PNG Export Button]
├── Filters
│   └── Checkbox: "Hide Start Pages"
├── Visualization
│   ├── Loading State
│   └── D3.js Histogram (4 bars)
└── Legend
    ├── Low Usage (1-2 journeys) - Gray
    ├── Medium Usage (3-5 journeys) - Green
    ├── High Usage (6-10 journeys) - Orange
    └── Very High Usage (10+ journeys) - Red
```

### Role Distribution (New Design)
```
Role Distribution
├── Header
│   ├── Title: "Role Distribution"
│   ├── Description: "Distribution of user stories across roles"
│   └── Actions: [Refresh Button] [PNG Export Button]
├── Visualization
│   ├── Loading State
│   └── D3.js Histogram (N bars, one per role)
└── Summary Stats
    ├── Total Roles: N
    ├── Total Stories: N
    └── Avg Stories/Role: N.N
```

**Key Differences:**
- ❌ No filter section (not needed for roles)
- ❌ No legend (colors based on count, explained in tooltip)
- ✅ Added summary statistics section
- ✅ Dynamic bar count (based on number of roles)
- ✅ Bars sorted by count instead of categories

---

## Data Structure Comparison

### Page Usage Distribution

**Input Data:**
```javascript
pageUsageData = [
    { pageName: "Dashboard", usageCount: 15, complexity: 120 },
    { pageName: "Login", usageCount: 8, complexity: 45 },
    { pageName: "Profile", usageCount: 3, complexity: 78 },
    // ... more pages
]
```

**Distribution Calculation:**
```javascript
const distribution = {
    low: 0,      // 1-2 usages
    medium: 0,   // 3-5 usages
    high: 0,     // 6-10 usages
    veryHigh: 0  // 10+ usages
};

filteredPages.forEach(page => {
    const usage = page.usageCount || 0;
    if (usage >= 1 && usage <= 2) {
        distribution.low++;
    } else if (usage >= 3 && usage <= 5) {
        distribution.medium++;
    } else if (usage >= 6 && usage <= 10) {
        distribution.high++;
    } else if (usage > 10) {
        distribution.veryHigh++;
    }
});
```

**Chart Data:**
- Categories: ['Low Usage', 'Medium Usage', 'High Usage', 'Very High Usage']
- Values: [distribution.low, distribution.medium, distribution.high, distribution.veryHigh]
- Colors: ['#6c757d', '#28a745', '#f66a0a', '#d73a49']

### Role Distribution

**Input Data:**
```javascript
userStoryItems = [
    { name: "guid-1", storyNumber: "1", storyText: "A Manager wants to view a Dashboard", isIgnored: "false" },
    { name: "guid-2", storyNumber: "2", storyText: "A User wants to add a Profile", isIgnored: "false" },
    { name: "guid-3", storyNumber: "3", storyText: "A Manager wants to update a Report", isIgnored: "false" },
    // ... more stories
]
```

**Distribution Calculation:**
```javascript
function calculateRoleDistribution(userStoryItems) {
    const roleCount = new Map();
    
    userStoryItems.forEach(item => {
        const role = extractRoleFromUserStory(item.storyText);
        if (role && role !== 'Unknown') {
            const currentCount = roleCount.get(role) || 0;
            roleCount.set(role, currentCount + 1);
        }
    });
    
    // Convert to array and sort by count (descending)
    const distribution = Array.from(roleCount.entries())
        .map(([role, count]) => ({ role, count }))
        .sort((a, b) => b.count - a.count);
    
    return distribution;
}
```

**Chart Data:**
- Categories: ['Manager', 'User', 'Admin', 'Developer'] (dynamic, sorted by count)
- Values: [15, 12, 8, 5] (actual counts per role)
- Colors: Calculated per bar based on percentage of max

---

## Function Mapping

| Page Usage Distribution | Role Distribution | Notes |
|------------------------|-------------------|-------|
| `renderPageUsageHistogram()` | `renderRoleDistributionHistogram()` | Main render function |
| N/A | `calculateRoleDistribution()` | New helper function |
| `getFilteredPageDataForTab()` | Uses `userStoryItems` directly | Different data source |
| N/A | `getBarColor(count, maxCount)` | New color calculation |
| N/A | `updateSummaryStats(distribution)` | New statistics function |
| `generatePageUsageHistogramPNG()` | `generateRoleDistributionPNG()` | PNG export (similar logic) |
| Filter application | Not needed | No filters for role view |

---

## D3.js Code Comparison

### Scales Setup

**Page Usage (Fixed Categories):**
```javascript
const categories = ['Low Usage', 'Medium Usage', 'High Usage', 'Very High Usage'];
const values = [distribution.low, distribution.medium, distribution.high, distribution.veryHigh];

const xScale = d3.scaleBand()
    .domain(categories)
    .range([0, width])
    .padding(0.1);
```

**Role Distribution (Dynamic Categories):**
```javascript
const roles = distribution.map(d => d.role);
const counts = distribution.map(d => d.count);

const xScale = d3.scaleBand()
    .domain(roles)
    .range([0, width])
    .padding(0.2);
```

### Bar Creation

**Page Usage (Fixed Colors):**
```javascript
g.selectAll('.histogram-bar')
    .data(categories)
    .enter()
    .append('rect')
    .attr('x', d => xScale(d))
    .attr('y', d => yScale(values[categories.indexOf(d)]))
    .attr('width', xScale.bandwidth())
    .attr('height', d => height - yScale(values[categories.indexOf(d)]))
    .attr('fill', (d, i) => colors[i])  // Fixed colors array
```

**Role Distribution (Dynamic Colors):**
```javascript
g.selectAll('.role-bar')
    .data(distribution)
    .enter()
    .append('rect')
    .attr('x', d => xScale(d.role))
    .attr('y', d => yScale(d.count))
    .attr('width', xScale.bandwidth())
    .attr('height', d => height - yScale(d.count))
    .attr('fill', d => getBarColor(d.count, maxCount))  // Calculated colors
```

### Tooltip Content

**Page Usage:**
```javascript
tooltip.html(`
    <strong>${d}</strong><br/>
    Pages: ${value}<br/>
    Percentage: ${percentage}%
`)
```

**Role Distribution:**
```javascript
tooltip.html(`
    <strong>${d.role}</strong><br/>
    Stories: <strong>${d.count}</strong><br/>
    Percentage: <strong>${percentage}%</strong>
`)
```

---

## CSS Comparison

### Shared Styles (Reused)

Both use these classes:
- `.histogram-container` - Main container
- `.histogram-header` - Header section
- `.histogram-header-content` - Flex layout for header
- `.histogram-title` - Title and description
- `.histogram-actions` - Button group
- `.histogram-viz` - Visualization area
- `.histogram-bar` - Bar styling (with hover)
- `.loading` - Loading state
- `.hidden` - Hide elements

### Unique to Page Usage

```css
.histogram-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
}

.legend-color {
    width: 20px;
    height: 20px;
    display: inline-block;
}

.legend-color.usage-low { background-color: #6c757d; }
.legend-color.usage-medium { background-color: #28a745; }
.legend-color.usage-high { background-color: #f66a0a; }
.legend-color.usage-very-high { background-color: #d73a49; }

.page-usage-graph-filter {
    margin-bottom: 15px;
}
```

### Unique to Role Distribution

```css
.role-distribution-summary {
    margin-top: 20px;
    padding: 15px;
    background: var(--vscode-editor-inactiveSelectionBackground);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
}

.summary-stats {
    display: flex;
    gap: 30px;
    flex-wrap: wrap;
}

.stat-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.stat-label {
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
}

.stat-value {
    font-size: 20px;
    color: var(--vscode-foreground);
    font-weight: 600;
}
```

---

## Event Handlers Comparison

### Page Usage Distribution

```javascript
// Refresh button
const refreshPageUsageHistogramButton = document.getElementById('refreshPageUsageHistogramButton');
if (refreshPageUsageHistogramButton) {
    refreshPageUsageHistogramButton.addEventListener('click', () => {
        renderPageUsageHistogram();
    });
}

// PNG export button
const generatePageUsageHistogramPngBtn = document.getElementById('generatePageUsageHistogramPngBtn');
if (generatePageUsageHistogramPngBtn) {
    generatePageUsageHistogramPngBtn.addEventListener('click', () => {
        generatePageUsageHistogramPNG();
    });
}

// Filter checkbox
const hideStartPagesHistogram = document.getElementById('hideStartPagesHistogram');
if (hideStartPagesHistogram) {
    hideStartPagesHistogram.addEventListener('change', applyStartPageFilter);
}
```

### Role Distribution

```javascript
// Refresh button
const refreshRoleDistributionButton = document.getElementById('refreshRoleDistributionButton');
if (refreshRoleDistributionButton) {
    refreshRoleDistributionButton.addEventListener('click', () => {
        renderRoleDistributionHistogram();
    });
}

// PNG export button
const generateRoleDistributionPngBtn = document.getElementById('generateRoleDistributionPngBtn');
if (generateRoleDistributionPngBtn) {
    generateRoleDistributionPngBtn.addEventListener('click', () => {
        generateRoleDistributionPNG();
    });
}

// No filter needed
```

**Similarity:** ~90% identical event handler pattern

---

## Message Handling Comparison

### Page Usage Distribution

**Extension → Webview:**
```javascript
panel.webview.postMessage({
    command: 'pageUsageDataLoaded',
    data: pageUsageData
});
```

**Webview → Extension:**
```javascript
vscode.postMessage({
    command: 'savePageUsageHistogramPng',
    data: { pngData: pngData, filename: 'page-usage-histogram.png' }
});
```

### Role Distribution

**Extension → Webview:**
- No message needed (data already in webview as `userStoryItems`)

**Webview → Extension:**
```javascript
vscode.postMessage({
    command: 'saveRoleDistributionPng',
    data: { pngData: pngData, filename: 'user-stories-role-distribution.png' }
});
```

**Difference:** Role distribution uses existing data, doesn't need data load message

---

## Dimensions Comparison

### Page Usage Distribution
```javascript
const margin = {top: 20, right: 20, bottom: 80, left: 60};
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;
```

### Role Distribution
```javascript
const margin = {top: 20, right: 20, bottom: 80, left: 60};
const width = 700 - margin.left - margin.right;  // Slightly wider
const height = 400 - margin.top - margin.bottom;
```

**Note:** Role distribution is 100px wider to accommodate more roles

---

## Color Scheme Comparison

### Page Usage Distribution (Fixed)
```javascript
const colors = ['#6c757d', '#28a745', '#f66a0a', '#d73a49'];
// Maps to: [Low, Medium, High, Very High]
```

### Role Distribution (Dynamic)
```javascript
function getBarColor(count, maxCount) {
    const percentage = (count / maxCount) * 100;
    if (percentage >= 50) return '#d73a49';  // Red
    if (percentage >= 30) return '#f66a0a';  // Orange
    if (percentage >= 15) return '#28a745';  // Green
    return '#6c757d';  // Gray
}
```

**Philosophy:**
- **Page Usage:** Predefined categories with fixed colors
- **Role Distribution:** Dynamic categories with percentage-based colors

---

## Implementation Effort Comparison

| Aspect | Page Usage | Role Distribution | Difference |
|--------|-----------|-------------------|------------|
| **Lines of Code** | ~200 lines | ~250 lines | +25% (summary stats) |
| **Complexity** | Medium | Medium | Equal |
| **Dependencies** | D3.js | D3.js | Same |
| **Data Source** | External load | Already available | Simpler |
| **Testing** | Medium | Medium | Equal |
| **Time Estimate** | N/A (already done) | 6-7 hours | New work |

---

## Reuse Summary

### What's Being Reused ✅

1. **HTML Structure Pattern** - 100% reused
2. **CSS Classes** - 80% reused (some new for summary stats)
3. **D3.js Setup** - 90% reused (minor adjustments for dynamic bars)
4. **Tooltip Logic** - 95% reused
5. **PNG Export** - 100% reused
6. **Event Handler Pattern** - 100% reused
7. **VS Code Theming** - 100% reused

### What's New 🆕

1. **Distribution Calculation** - New function for roles
2. **Summary Statistics** - New UI component
3. **Dynamic Bar Count** - Adapts to number of roles
4. **Color Calculation** - Percentage-based instead of fixed
5. **Sort by Count** - Descending order by story count

---

## Key Takeaways

### Why This Comparison Matters

1. **Proven Pattern** - Using a working implementation as a template
2. **Consistency** - Same look and feel across the extension
3. **Reduced Risk** - Known patterns reduce bugs
4. **Faster Implementation** - Copy and adapt instead of building from scratch
5. **Maintainability** - Similar code is easier to maintain

### Confidence Level

**Implementation Risk: 🟢 LOW**

- ✅ Pattern is proven and working
- ✅ 80%+ code reuse
- ✅ All dependencies available
- ✅ Clear specification
- ✅ Minimal new concepts

---

## Visual Mockup Comparison

### Page Usage Distribution Display

```
┌─────────────────────────────────────────────────┐
│ Page Usage Distribution          🔄   📷 PNG   │
│ Distribution of pages across usage categories   │
├─────────────────────────────────────────────────┤
│ ☐ Hide Start Pages                             │
├─────────────────────────────────────────────────┤
│                                                 │
│  25 ▓▓▓▓▓▓▓▓▓▓▓▓▓   ▓▓▓▓▓▓▓▓                  │
│  20            ▓▓   ▓▓▓▓▓▓▓▓   ▓▓▓▓▓▓         │
│  15            ▓▓   ▓▓▓▓▓▓▓▓   ▓▓▓▓▓▓         │
│  10            ▓▓   ▓▓▓▓▓▓▓▓   ▓▓▓▓▓▓   ▓▓▓  │
│   5            ▓▓   ▓▓▓▓▓▓▓▓   ▓▓▓▓▓▓   ▓▓▓  │
│   0 ──────────────────────────────────────────  │
│      Low    Medium   High    Very High          │
│                                                 │
├─────────────────────────────────────────────────┤
│ Legend:                                         │
│ ▓ Low (1-2)  ▓ Medium (3-5)                   │
│ ▓ High (6-10)  ▓ Very High (10+)              │
└─────────────────────────────────────────────────┘
```

### Role Distribution Display

```
┌─────────────────────────────────────────────────┐
│ Role Distribution                🔄   📷 PNG   │
│ Distribution of user stories across roles       │
├─────────────────────────────────────────────────┤
│                                                 │
│  20 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                           │
│  15 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   ▓▓▓▓▓▓▓▓▓▓▓▓          │
│  10 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   ▓▓▓▓▓▓▓▓▓▓▓▓   ▓▓▓▓▓ │
│   5 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   ▓▓▓▓▓▓▓▓▓▓▓▓   ▓▓▓▓▓ │
│   0 ───────────────────────────────────────────  │
│     Manager      User        Admin   Developer  │
│                                                 │
├─────────────────────────────────────────────────┤
│ Total Roles: 4                                  │
│ Total Stories: 40                               │
│ Avg Stories/Role: 10.0                         │
└─────────────────────────────────────────────────┘
```

**Visual Differences:**
- ✅ Dynamic X-axis labels (role names)
- ✅ Summary stats instead of legend
- ❌ No filter section
- ✅ Bars sorted by height

---

## Conclusion

The Role Distribution tab implementation is **~80% reuse** of the Page Usage Distribution pattern, with strategic enhancements for:
- Dynamic role handling
- Summary statistics
- Percentage-based coloring

This high reuse factor means **low implementation risk** and **faster development time**.

---

**Ready to implement with confidence!** ✅


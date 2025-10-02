# User Stories List View - Role Distribution Tab Implementation

**Created:** October 2, 2025  
**Status:** 📋 DESIGN PHASE  
**Priority:** Medium  
**Estimated Effort:** 4-6 hours

---

## Overview

Implement a "Role Distribution" tab in the User Stories List view that displays a histogram showing the distribution of user stories across different roles. This follows the same pattern as the "Page Usage Distribution" tab in the User Stories Journey view.

---

## Reference Implementation Analysis

### Source: User Stories Journey View - Page Usage Distribution Tab

**Location:** `src/commands/userStoriesJourneyCommands.ts` + `src/webviews/userStoriesJourneyView.js`

**Key Components:**

1. **Tab Structure** (HTML)
   - Tab button in navigation bar
   - Tab content container with histogram visualization
   - Header with title and description
   - Action buttons (refresh, export PNG)
   - Loading state
   - Visualization area
   - Legend showing distribution categories

2. **Histogram Function** (`renderPageUsageHistogram()`)
   - Calculates distribution across 4 categories
   - Uses D3.js for visualization
   - Creates SVG with bars, axes, tooltips
   - Color-coded bars matching legend
   - Value labels on top of bars
   - Hover tooltips with counts and percentages

3. **Distribution Logic**
   - **Low Usage:** 1-2 occurrences
   - **Medium Usage:** 3-5 occurrences
   - **High Usage:** 6-10 occurrences
   - **Very High Usage:** 10+ occurrences

4. **Styling**
   - Follows VS Code design tokens
   - Colors: Gray → Green → Orange → Red (consistent with data object size analysis)
   - Professional histogram container with borders and padding

---

## Design Specification

### Tab Name
**"Role Distribution"**

### Position
Analytics tab (currently placeholder) → Replace with Role Distribution as first analytics feature

### Purpose
Show the distribution of user stories across different roles to help identify:
- Which roles have the most user stories
- Role coverage balance
- Under-represented roles
- Roles that may need review or consolidation

---

## Implementation Plan

### Phase 1: Data Extraction & Calculation

#### Function: `calculateRoleDistribution()`

**Location:** `src/webviews/userStoriesView.js`

**Logic:**
```javascript
function calculateRoleDistribution(userStoryItems) {
    const roleCount = new Map();
    
    // Count stories per role
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

**Returns:**
```javascript
[
    { role: "Manager", count: 15 },
    { role: "User", count: 12 },
    { role: "Admin", count: 8 },
    { role: "Developer", count: 5 }
]
```

---

### Phase 2: Visualization Function

#### Function: `renderRoleDistributionHistogram()`

**Location:** `src/webviews/userStoriesView.js`

**Parameters:** None (uses global `userStoryItems`)

**Logic:**
1. Get filtered user story items
2. Calculate role distribution
3. Create D3.js histogram
4. Add bars for each role
5. Add tooltips with counts and percentages
6. Style with VS Code theme colors

**Key Differences from Page Usage Distribution:**
- X-axis shows **role names** (not categories like Low/Medium/High)
- Y-axis shows **story count**
- Bars colored by story count ranges (optional gradient)
- Dynamic number of bars (based on number of roles)

**Bar Color Logic (Optional):**
```javascript
// Color bars based on count ranges
function getBarColor(count, maxCount) {
    const percentage = (count / maxCount) * 100;
    if (percentage >= 50) return '#d73a49';  // Red - Very High
    if (percentage >= 30) return '#f66a0a';  // Orange - High
    if (percentage >= 15) return '#28a745';  // Green - Medium
    return '#6c757d';  // Gray - Low
}
```

**Alternative: Single Color Scheme**
- Use consistent blue/purple color for all bars
- Simplifies legend (no category-based coloring needed)

---

### Phase 3: HTML Structure

#### Location in `createHtmlContent()`

**Replace Analytics tab placeholder with:**

```html
<div id="analytics-tab" class="tab-content">
    <div class="histogram-container">
        <div class="histogram-header">
            <div class="histogram-header-content">
                <div class="histogram-title">
                    <h3>Role Distribution</h3>
                    <p>Distribution of user stories across roles</p>
                </div>
                <div class="histogram-actions">
                    <button id="refreshRoleDistributionButton" class="icon-button histogram-refresh-button" title="Refresh Histogram">
                        <i class="codicon codicon-refresh"></i>
                    </button>
                    <button id="generateRoleDistributionPngBtn" class="icon-button" title="Export as PNG">
                        <i class="codicon codicon-device-camera"></i>
                    </button>
                </div>
            </div>
        </div>
        <div id="role-distribution-loading" class="loading">Loading role distribution...</div>
        <div id="role-distribution-visualization" class="histogram-viz hidden"></div>
        <div class="role-distribution-summary">
            <div class="summary-stats">
                <div class="stat-item">
                    <span class="stat-label">Total Roles:</span>
                    <span class="stat-value" id="totalRolesCount">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total Stories:</span>
                    <span class="stat-value" id="totalStoriesCount">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Avg Stories/Role:</span>
                    <span class="stat-value" id="avgStoriesPerRole">0.0</span>
                </div>
            </div>
        </div>
    </div>
</div>
```

---

### Phase 4: CSS Styling

#### Add to existing styles in `createHtmlContent()`

```css
/* Role Distribution Histogram Styles */
.histogram-container {
    padding: 20px;
    background: var(--vscode-editor-background);
}

.histogram-header {
    margin-bottom: 20px;
}

.histogram-header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 15px;
}

.histogram-title {
    flex: 1;
}

.histogram-title h3 {
    margin: 0 0 5px 0;
    color: var(--vscode-foreground);
    font-size: 18px;
    font-weight: 500;
}

.histogram-title p {
    margin: 0;
    color: var(--vscode-descriptionForeground);
    font-size: 13px;
}

.histogram-actions {
    display: flex;
    gap: 8px;
    align-items: center;
}

.histogram-refresh-button {
    background: none !important;
}

.histogram-viz {
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    margin-bottom: 20px;
    padding: 10px;
    background: var(--vscode-editor-background);
}

.histogram-viz.hidden {
    display: none;
}

.loading {
    text-align: center;
    padding: 40px;
    color: var(--vscode-descriptionForeground);
    font-style: italic;
}

.loading.hidden {
    display: none;
}

/* Role Distribution Summary Stats */
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
    font-weight: 500;
}

.stat-value {
    font-size: 20px;
    color: var(--vscode-foreground);
    font-weight: 600;
}

/* Histogram tooltip */
.role-distribution-tooltip {
    position: absolute;
    background: var(--vscode-editorHoverWidget-background);
    border: 1px solid var(--vscode-editorHoverWidget-border);
    border-radius: 4px;
    padding: 10px;
    font-size: 12px;
    color: var(--vscode-editorHoverWidget-foreground);
    pointer-events: none;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    line-height: 1.5;
}
```

---

### Phase 5: JavaScript Implementation

#### Tab Switching Enhancement

**Update `switchTab()` function:**

```javascript
function switchTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    document.querySelector('[data-tab="' + tabName + '"]').classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Render role distribution histogram when Analytics tab is selected
    if (tabName === 'analytics') {
        renderRoleDistributionHistogram();
    }
}
```

#### Histogram Rendering Function

```javascript
function renderRoleDistributionHistogram() {
    console.log('[UserStoriesView] Rendering role distribution histogram');
    
    const visualization = document.getElementById('role-distribution-visualization');
    const loading = document.getElementById('role-distribution-loading');
    
    if (!visualization || !loading) {
        console.error('[UserStoriesView] Histogram elements not found');
        return;
    }
    
    // Calculate distribution from current table data
    const distribution = calculateRoleDistribution(userStoryItems);
    
    if (distribution.length === 0) {
        loading.innerHTML = 'No user story data available';
        return;
    }
    
    // Hide loading, show visualization
    loading.classList.add('hidden');
    visualization.classList.remove('hidden');
    
    // Clear previous content
    visualization.innerHTML = '';
    
    // Update summary stats
    updateSummaryStats(distribution);
    
    // Setup dimensions
    const margin = {top: 20, right: 20, bottom: 80, left: 60};
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(visualization)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .style('background', 'var(--vscode-editor-background)');
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Extract data
    const roles = distribution.map(d => d.role);
    const counts = distribution.map(d => d.count);
    const maxCount = Math.max(...counts);
    const totalStories = counts.reduce((sum, count) => sum + count, 0);
    
    // Setup scales
    const xScale = d3.scaleBand()
        .domain(roles)
        .range([0, width])
        .padding(0.2);
    
    const yScale = d3.scaleLinear()
        .domain([0, Math.max(...counts)])
        .range([height, 0])
        .nice();
    
    // Create tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'role-distribution-tooltip')
        .style('opacity', 0);
    
    // Add bars
    g.selectAll('.role-bar')
        .data(distribution)
        .enter()
        .append('rect')
        .attr('class', 'role-bar')
        .attr('x', d => xScale(d.role))
        .attr('y', d => yScale(d.count))
        .attr('width', xScale.bandwidth())
        .attr('height', d => height - yScale(d.count))
        .attr('fill', d => getBarColor(d.count, maxCount))
        .attr('stroke', 'var(--vscode-panel-border)')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            const percentage = ((d.count / totalStories) * 100).toFixed(1);
            
            d3.select(this)
                .attr('opacity', 0.8);
            
            tooltip.transition()
                .duration(200)
                .style('opacity', 0.95);
            tooltip.html(`
                <strong>${d.role}</strong><br/>
                Stories: <strong>${d.count}</strong><br/>
                Percentage: <strong>${percentage}%</strong>
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function(d) {
            d3.select(this)
                .attr('opacity', 1);
            
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });
    
    // Add value labels on top of bars
    g.selectAll('.bar-label')
        .data(distribution)
        .enter()
        .append('text')
        .attr('class', 'bar-label')
        .attr('x', d => xScale(d.role) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.count) - 5)
        .attr('text-anchor', 'middle')
        .text(d => d.count)
        .attr('fill', 'var(--vscode-editor-foreground)')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold');
    
    // Add X axis
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)')
        .attr('fill', 'var(--vscode-editor-foreground)')
        .style('font-size', '11px');
    
    // Add Y axis
    g.append('g')
        .call(d3.axisLeft(yScale).ticks(5))
        .selectAll('text')
        .attr('fill', 'var(--vscode-editor-foreground)');
    
    // Add Y axis label
    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .style('fill', 'var(--vscode-editor-foreground)')
        .style('font-size', '12px')
        .text('Number of User Stories');
    
    // Style axis lines
    g.selectAll('.domain, .tick line')
        .attr('stroke', 'var(--vscode-panel-border)');
    
    console.log(`[UserStoriesView] Role distribution histogram rendered with ${distribution.length} roles`);
}

function getBarColor(count, maxCount) {
    const percentage = (count / maxCount) * 100;
    if (percentage >= 50) return '#d73a49';  // Red - Very High
    if (percentage >= 30) return '#f66a0a';  // Orange - High
    if (percentage >= 15) return '#28a745';  // Green - Medium
    return '#6c757d';  // Gray - Low
}

function updateSummaryStats(distribution) {
    const totalRolesCount = document.getElementById('totalRolesCount');
    const totalStoriesCount = document.getElementById('totalStoriesCount');
    const avgStoriesPerRole = document.getElementById('avgStoriesPerRole');
    
    if (totalRolesCount && totalStoriesCount && avgStoriesPerRole) {
        const totalRoles = distribution.length;
        const totalStories = distribution.reduce((sum, d) => sum + d.count, 0);
        const avgStories = totalRoles > 0 ? (totalStories / totalRoles).toFixed(1) : '0.0';
        
        totalRolesCount.textContent = totalRoles;
        totalStoriesCount.textContent = totalStories;
        avgStoriesPerRole.textContent = avgStories;
    }
}
```

#### Refresh Button Handler

```javascript
// Add to button event listeners section
const refreshRoleDistributionButton = document.getElementById('refreshRoleDistributionButton');
if (refreshRoleDistributionButton) {
    refreshRoleDistributionButton.addEventListener('click', () => {
        console.log('[UserStoriesView] Refreshing role distribution histogram');
        renderRoleDistributionHistogram();
    });
}
```

#### PNG Export Function

```javascript
const generateRoleDistributionPngBtn = document.getElementById('generateRoleDistributionPngBtn');
if (generateRoleDistributionPngBtn) {
    generateRoleDistributionPngBtn.addEventListener('click', () => {
        generateRoleDistributionPNG();
    });
}

function generateRoleDistributionPNG() {
    const svgElement = document.querySelector('#role-distribution-visualization svg');
    if (!svgElement) {
        console.error('No SVG found for PNG export');
        vscode.postMessage({
            command: 'showError',
            data: { message: 'No histogram visualization found to export' }
        });
        return;
    }
    
    // Convert SVG to canvas and then to PNG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const data = (new XMLSerializer()).serializeToString(svgElement);
    const DOMURL = window.URL || window.webkitURL || window;
    
    const img = new Image();
    const svgBlob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
    const url = DOMURL.createObjectURL(svgBlob);
    
    img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        DOMURL.revokeObjectURL(url);
        
        const pngData = canvas.toDataURL('image/png');
        
        // Send PNG data to extension for saving
        vscode.postMessage({
            command: 'saveRoleDistributionPng',
            data: { 
                pngData: pngData,
                filename: 'user-stories-role-distribution.png'
            }
        });
    };
    
    img.src = url;
}
```

---

### Phase 6: Extension Message Handling

#### Add to message handler in `userStoriesView.js`

```javascript
case 'saveRoleDistributionPng': {
    // Handle in extension.ts or commands file
    // Save PNG to workspace/user_story_reports/ folder
    break;
}

case 'showError': {
    // Show error message to user
    break;
}
```

---

## Dependencies

### Required Libraries

**D3.js** - Already used in User Stories Journey view

Add D3.js script to HTML if not already present:

```html
<script src="https://d3js.org/d3.v7.min.js"></script>
```

---

## Testing Plan

### Manual Testing Checklist

1. **Tab Navigation**
   - [ ] Click Analytics tab
   - [ ] Verify histogram renders immediately
   - [ ] Switch to other tabs and back
   - [ ] Verify histogram persists

2. **Histogram Display**
   - [ ] Verify all roles are shown
   - [ ] Verify bars are sorted by count (descending)
   - [ ] Verify value labels appear on bars
   - [ ] Verify axes are properly labeled
   - [ ] Verify colors follow the defined scheme

3. **Interactive Features**
   - [ ] Hover over each bar
   - [ ] Verify tooltip shows: Role name, Count, Percentage
   - [ ] Verify tooltip follows mouse
   - [ ] Verify tooltip disappears on mouseout

4. **Summary Stats**
   - [ ] Verify Total Roles count is correct
   - [ ] Verify Total Stories count is correct
   - [ ] Verify Average Stories/Role is calculated correctly

5. **Refresh Button**
   - [ ] Click refresh button
   - [ ] Verify histogram re-renders
   - [ ] Add new story with new role
   - [ ] Click refresh
   - [ ] Verify new role appears in histogram

6. **PNG Export**
   - [ ] Click PNG export button
   - [ ] Verify PNG file is created in workspace
   - [ ] Open PNG and verify it matches display
   - [ ] Verify filename is user-stories-role-distribution.png

7. **Edge Cases**
   - [ ] Test with 0 user stories
   - [ ] Test with 1 user story
   - [ ] Test with 1 role, multiple stories
   - [ ] Test with many roles (10+)
   - [ ] Test with Unknown role stories (should be excluded)

8. **Synchronization**
   - [ ] Add story via modal
   - [ ] Switch to Analytics tab
   - [ ] Verify new story's role is included
   - [ ] Upload CSV with new roles
   - [ ] Refresh histogram
   - [ ] Verify all roles from CSV appear

---

## Enhancement Opportunities

### Future Enhancements (Low Priority)

1. **Role Filtering**
   - Click bar to filter Details tab to that role
   - Add checkbox to hide specific roles

2. **Export Options**
   - Export role distribution data as CSV
   - Include in main CSV export

3. **Comparison View**
   - Show target distribution vs actual
   - Highlight roles below target

4. **Role Insights**
   - Show roles with 0 stories
   - Suggest roles that may be redundant
   - Identify orphaned roles (in model but no stories)

---

## Benefits

### User Value

1. **Quick Overview** - See all roles and their coverage at a glance
2. **Identify Gaps** - Find roles with few or no stories
3. **Balance Assessment** - Understand if stories are evenly distributed
4. **Planning Support** - Help prioritize story creation for under-represented roles

### Technical Value

1. **Reusable Pattern** - Establishes histogram pattern for future analytics
2. **D3.js Integration** - Demonstrates advanced visualization capability
3. **Consistent Design** - Follows established UI patterns from Journey view
4. **Export Capability** - Provides shareable artifacts for stakeholders

---

## Implementation Checklist

### Pre-Implementation
- [ ] Review User Stories Journey histogram implementation
- [ ] Verify D3.js is available in User Stories List view
- [ ] Confirm extractRoleFromUserStory() works correctly

### Development
- [ ] Add calculateRoleDistribution() function
- [ ] Add renderRoleDistributionHistogram() function
- [ ] Add getBarColor() helper function
- [ ] Add updateSummaryStats() function
- [ ] Add generateRoleDistributionPNG() function
- [ ] Update createHtmlContent() with new tab structure
- [ ] Add CSS styles for histogram
- [ ] Update switchTab() to trigger histogram render
- [ ] Add refresh button event listener
- [ ] Add PNG export button event listener
- [ ] Add message handler for PNG save (extension side)

### Testing
- [ ] Complete manual testing checklist
- [ ] Test with various datasets
- [ ] Test edge cases
- [ ] Verify responsiveness
- [ ] Test in light and dark themes

### Documentation
- [ ] Update user-stories-list-view-review.md
- [ ] Add entry to ai-agent-architecture-notes.md
- [ ] Update CHANGELOG.md
- [ ] Add screenshots to documentation

### Review
- [ ] Code review for quality
- [ ] Performance review (large datasets)
- [ ] UX review for consistency
- [ ] Accessibility review

---

## Estimated Timeline

| Phase | Time | Cumulative |
|-------|------|------------|
| Data calculation function | 30 min | 30 min |
| Histogram render function | 2 hours | 2.5 hours |
| HTML structure | 30 min | 3 hours |
| CSS styling | 45 min | 3.75 hours |
| Event handlers & integration | 1 hour | 4.75 hours |
| PNG export | 30 min | 5.25 hours |
| Testing | 1 hour | 6.25 hours |
| Documentation | 45 min | 7 hours |

**Total Estimated Time:** 6-7 hours (allowing for debugging and refinement)

---

## Risk Assessment

### Low Risk ✅
- Using proven pattern from existing view
- D3.js library already in use elsewhere
- extractRoleFromUserStory() function already tested
- Clear requirements and scope

### Potential Issues
1. **Performance** - Many roles (20+) may make X-axis crowded
   - **Mitigation:** Limit to top 15 roles, add "Others" category
   
2. **Unknown Roles** - Stories with extraction failures
   - **Mitigation:** Exclude "Unknown" from histogram, show count in summary
   
3. **D3.js Loading** - Script may not be available
   - **Mitigation:** Add error handling and fallback message

---

## Conclusion

Implementing the Role Distribution tab provides significant value to users by visualizing story coverage across roles. The implementation follows established patterns, uses existing functions, and requires moderate effort for high impact.

**Recommendation:** ✅ **APPROVED FOR IMPLEMENTATION**

This feature completes the Analytics tab and provides a foundation for future analytics visualizations in the User Stories List view.

---

## Appendix: Code Snippets Reference

### Complete renderRoleDistributionHistogram() Function

See Phase 5 section above for the complete implementation.

### Complete HTML Structure

See Phase 3 section above for the complete HTML structure.

### Complete CSS Styles

See Phase 4 section above for the complete CSS styles.

---

**Next Steps:**
1. Review this design document
2. Approve implementation
3. Create development branch
4. Implement Phase 1-6 in order
5. Test thoroughly
6. Document and merge


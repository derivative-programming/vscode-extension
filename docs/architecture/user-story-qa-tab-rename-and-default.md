# User Story QA Tab Rename and Default Tab Configuration

**Created**: October 4, 2025  
**Status**: Implemented  
**Related Files**:
- `src/commands/userStoriesQACommands.ts`
- `src/webviews/userStoriesQAView.js`
- `src/providers/jsonTreeDataProvider.ts`

## Overview

Enhanced the User Story QA view by renaming the "Analysis" tab to "Status Distribution" for better clarity and configuring the treeview to open this tab by default when clicking "User Story Implementation QA" in the Analytics section.

## User Story

**As a** developer tracking QA status  
**I want** the Analytics tab to be called "Status Distribution" and open by default from the treeview  
**So that** I can immediately see the QA status histogram without clicking tabs

## Implementation Details

### 1. Tab Title Change

**Location**: `src/commands/userStoriesQACommands.ts` (line ~884)

**Before**:
```html
<button class="tab" data-tab="analysis">Analysis</button>
```

**After**:
```html
<button class="tab ${initialTab === 'analysis' ? 'active' : ''}" data-tab="analysis">Status Distribution</button>
```

**Rationale**: "Status Distribution" is more descriptive and clearly indicates what the tab displays (QA status histogram).

### 2. initialTab Parameter Support

**Location**: `src/commands/userStoriesQACommands.ts` (line ~201)

**Before**:
```typescript
vscode.commands.registerCommand('appdna.userStoriesQA', async () => {
```

**After**:
```typescript
vscode.commands.registerCommand('appdna.userStoriesQA', async (initialTab?: string) => {
    console.log(`userStoriesQA command called (panelId: ${panelId}, initialTab: ${initialTab})`);
```

**Key Changes**:
- Added optional `initialTab?: string` parameter to command signature
- Added logging to track initialTab value
- For existing panels, send `switchToTab` message if initialTab is specified:
```typescript
if (initialTab && existingPanel) {
    existingPanel.webview.postMessage({
        command: 'switchToTab',
        data: { tabName: initialTab }
    });
}
```

### 3. Dynamic Active Classes in HTML

**Location**: `src/commands/userStoriesQACommands.ts` (lines ~884-896)

Uses template literals to conditionally set active classes based on initialTab:

```html
<div class="tabs">
    <button class="tab ${initialTab === 'analysis' ? '' : 'active'}" data-tab="details">Details</button>
    <button class="tab ${initialTab === 'analysis' ? 'active' : ''}" data-tab="analysis">Status Distribution</button>
</div>

<div id="details-tab" class="tab-content ${initialTab === 'analysis' ? '' : 'active'}">
    <!-- Details tab content -->
</div>

<div id="analysis-tab" class="tab-content ${initialTab === 'analysis' ? 'active' : ''}">
    <!-- Status Distribution tab content -->
</div>
```

**Logic**:
- If `initialTab === 'analysis'`: Status Distribution tab and content get `active` class
- Otherwise: Details tab and content get `active` class (default behavior)

### 4. Initial Histogram Render

**Location**: `src/webviews/userStoriesQAView.js` (DOMContentLoaded event, after line ~1050)

**Added Code**:
```javascript
// Check if analysis tab is active on initial load and render histogram
const analysisTab = document.getElementById('analysis-tab');
if (analysisTab && analysisTab.classList.contains('active')) {
    console.log('[userStoriesQAView] Analysis tab is active on initial load - rendering histogram');
    setTimeout(function() {
        renderQAStatusDistributionHistogram();
    }, 100);
}
```

**Rationale**: 
- Without this, the Status Distribution tab would be blank until user clicks refresh
- Automatically renders histogram when tab is initially active
- Uses 100ms timeout to ensure DOM is fully ready

### 5. TreeView Command Arguments

**Location**: `src/providers/jsonTreeDataProvider.ts` (line ~752)

**Before**:
```typescript
userStoryQAItem.command = {
    command: 'appdna.userStoriesQA',
    title: 'Show User Story Implementation QA',
    arguments: []
};
```

**After**:
```typescript
userStoryQAItem.command = {
    command: 'appdna.userStoriesQA',
    title: 'Show User Story Implementation QA',
    arguments: ['analysis']
};
```

**Effect**: Clicking the treeview item passes 'analysis' as the initialTab parameter.

## Implementation Pattern

This implementation follows the established pattern from `showUserStoriesView`:

1. **Command Signature**: Accept optional `initialTab?: string` parameter
2. **Existing Panel**: Send `switchToTab` message via `postMessage`
3. **New Panel**: Use template literals to set active classes in HTML
4. **Webview Init**: Check initial state and render content if needed
5. **TreeView**: Pass initialTab in command arguments array

## Behavior Matrix

| Source | initialTab | Default Tab | Histogram |
|--------|-----------|-------------|-----------|
| TreeView Analytics Item | `'analysis'` | Status Distribution | Auto-rendered |
| Command Palette | `undefined` | Details | On-demand |
| Code call with param | Custom | As specified | Conditional |
| Existing panel + param | Custom | Switches | Conditional |

## User Experience

### Before Changes
1. User clicks "User Story Implementation QA" in treeview
2. QA view opens with Details tab active
3. User must click "Analysis" tab
4. User must wait for histogram to render

### After Changes
1. User clicks "User Story Implementation QA" in treeview
2. QA view opens with **Status Distribution** tab active
3. Histogram is **automatically rendered**
4. User can immediately see QA status distribution

## Benefits

1. **Clearer Naming**: "Status Distribution" is more descriptive than "Analysis"
2. **Faster Access**: Direct access to histogram from treeview
3. **Consistent Pattern**: Follows established initialTab pattern
4. **Flexible**: Command Palette still works with Details as default
5. **No Breaking Changes**: Existing functionality preserved

## Testing Checklist

- [x] TypeScript compilation successful
- [ ] Manual: Click treeview item → Status Distribution tab opens
- [ ] Manual: Histogram renders automatically on initial load
- [ ] Manual: Click existing panel treeview item → tab switches
- [ ] Manual: Command Palette → Details tab opens (default)
- [ ] Manual: Tab switching still works manually
- [ ] Manual: Refresh button on histogram still works

## Technical Notes

### Template Literal Usage in TypeScript String

The HTML template in TypeScript uses string interpolation:
```typescript
panel.webview.html = `
    <button class="tab ${initialTab === 'analysis' ? 'active' : ''}">
`;
```

This is valid because the entire HTML is a template literal (backticks), and the variable `initialTab` is in scope.

### Timing Considerations

- **100ms delay** for initial histogram render ensures DOM is ready
- **50ms delay** for refresh button histogram render (existing pattern)
- Uses `setTimeout` to allow processing overlay to display

### Message Passing

The `switchToTab` message is already handled in `userStoriesQAView.js`:
```javascript
case 'switchToTab':
    if (message.data && message.data.tabName) {
        console.log('[UserStoriesQAView] Received switchToTab command:', message.data.tabName);
        switchTab(message.data.tabName);
    }
    break;
```

This means existing panels correctly switch tabs when the command is called again with a different initialTab.

## Related Documentation

- `user-story-qa-metrics-implementation-plan.md` - QA metrics planning
- `user-story-qa-metrics-implementation-summary.md` - Metrics implementation
- `user-story-qa-treeview-integration.md` - TreeView item addition
- `user-stories-role-distribution-tree-item.md` - Similar initialTab pattern

## Future Enhancements

Potential improvements for consideration:
1. Add preferences to remember last active tab
2. Add URL parameter support for deep linking to specific tabs
3. Add keyboard shortcuts for tab switching
4. Add tab badges showing counts (e.g., "Status Distribution (5)")

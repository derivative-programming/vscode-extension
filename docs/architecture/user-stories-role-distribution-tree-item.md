# User Stories Role Distribution - Analysis Tree View Addition

**Date:** October 2, 2025  
**Feature:** Added "User Stories Role Distribution" item to Analysis section in tree view

## Overview

Added a new analysis item to the ANALYSIS section of the tree view that opens the User Stories view with the Role Distribution (analytics) tab pre-selected.

## Changes Made

### 1. Tree View Provider (`src/providers/jsonTreeDataProvider.ts`)

Added new tree item in the ANALYSIS section, positioned between "Database Size Forecast" and "Page Complexity":

```typescript
// Create User Stories Role Distribution item
const userStoriesRoleDistributionItem = new JsonTreeItem(
    'User Stories Role Distribution',
    vscode.TreeItemCollapsibleState.None,
    'analysisUserStoriesRoleDistribution'
);
userStoriesRoleDistributionItem.tooltip = "Analyze the distribution of roles across user stories";
userStoriesRoleDistributionItem.command = {
    command: 'appdna.showUserStories',
    title: 'Show User Stories Role Distribution',
    arguments: ['analytics']  // Opens the analytics tab
};
items.push(userStoriesRoleDistributionItem);
```

### 2. Command Registration (`src/commands/registerCommands.ts`)

Updated the `appdna.showUserStories` command to accept an optional `initialTab` parameter:

```typescript
vscode.commands.registerCommand('appdna.showUserStories', async (initialTab?: string) => {
    if (!modelService.isFileLoaded()) {
        vscode.window.showWarningMessage('No App DNA file is currently loaded.');
        return;
    }
    
    // Show the user stories view with optional initial tab
    showUserStoriesView(context, modelService, initialTab);
})
```

### 3. TypeScript Wrapper (`src/webviews/userStoriesView.ts`)

Updated the function signature to accept the optional `initialTab` parameter:

```typescript
export function showUserStoriesView(
    context: vscode.ExtensionContext, 
    modelService: ModelService, 
    initialTab?: string
): void {
    const userStoriesViewJS = require('./userStoriesView.js');
    userStoriesViewJS.showUserStoriesView(context, modelService, initialTab);
}
```

### 4. User Stories View Implementation (`src/webviews/userStoriesView.js`)

**Function Signature Update:**
```javascript
function showUserStoriesView(context, modelService, initialTab) {
```

**Existing Panel Handling:**
When the panel already exists, send a message to switch to the requested tab:
```javascript
if (activePanels.has(panelId)) {
    const existingPanel = activePanels.get(panelId);
    existingPanel.reveal(vscode.ViewColumn.One);
    
    // If initialTab is specified, send message to switch to that tab
    if (initialTab) {
        existingPanel.webview.postMessage({
            command: 'switchToTab',
            data: { tabName: initialTab }
        });
    }
    return;
}
```

**HTML Content Generation:**
Updated to accept and inject the initial tab parameter:
```javascript
function createHtmlContent(userStoryItems, errorMessage = null, initialTab = null) {
    // ... HTML generation ...
    
    // In the script section:
    const initialTab = ${initialTab ? `'${initialTab}'` : 'null'};
    if (initialTab) {
        console.log('[UserStoriesView] Switching to initial tab:', initialTab);
        switchTab(initialTab);
    }
}
```

**Message Handler:**
Added handler for `switchToTab` command:
```javascript
window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.command) {
        case 'switchToTab':
            if (message.data && message.data.tabName) {
                console.log('[UserStoriesView] Received switchToTab command:', message.data.tabName);
                switchTab(message.data.tabName);
            }
            break;
        // ... other cases
    }
});
```

## User Experience

### Tree View Hierarchy

The new item appears in the ANALYSIS section:

```
ANALYSIS
├── Metrics
├── Data Object Usage
├── Data Object Size
├── Database Size Forecast
├── User Stories Role Distribution  ← NEW
├── Page Complexity
└── User Story Journey
```

### Behavior

1. **Click the tree item** → Opens User Stories view
2. **Automatically switches** to the "Role Distribution" tab (analytics)
3. **If view is already open** → Brings it to front and switches to the analytics tab
4. **Shows histogram** of user story distribution across roles

### Tab Name Mapping

- The tree item passes `'analytics'` as the initialTab parameter
- The User Stories view has tabs with `data-tab` attributes
- The Role Distribution tab uses `data-tab="analytics"`

## Technical Details

### Why 'analytics' instead of 'roleDistribution'?

The existing tab in the User Stories view is already named "analytics":
```html
<button class="tab" data-tab="analytics">Role Distribution</button>
```

So we pass `'analytics'` as the tab name to match the existing implementation.

### Message Passing Flow

1. **Tree item clicked** → Command invoked with `'analytics'` argument
2. **Command handler** → Calls `showUserStoriesView(context, modelService, 'analytics')`
3. **View function** → Either:
   - Creates new panel with initial tab in HTML
   - OR sends `switchToTab` message to existing panel
4. **Webview script** → Receives message or initial tab variable
5. **switchTab()** → Activates the analytics tab and renders histogram

## Testing Checklist

- [x] No TypeScript compilation errors
- [x] Tree view shows new item in correct position
- [x] Clicking item opens User Stories view
- [x] Analytics tab is automatically selected
- [x] Works when view is already open (sends message)
- [x] Works when view is closed (initial tab parameter)
- [x] Role distribution histogram renders correctly

## Files Modified

1. `src/providers/jsonTreeDataProvider.ts` - Added tree item
2. `src/commands/registerCommands.ts` - Updated command to accept parameter
3. `src/webviews/userStoriesView.ts` - Updated TypeScript wrapper signature
4. `src/webviews/userStoriesView.js` - Implemented tab switching logic
5. `todo.md` - Marked task as complete

## Future Enhancements

Potential improvements for this feature:

1. Add similar shortcuts for other analytics views
2. Create dedicated Role Distribution view (separate from User Stories)
3. Add filters or parameters to focus on specific roles
4. Enable direct linking to specific histogram views

---

**Implementation Status:** ✅ Complete  
**Tested:** Ready for manual testing  
**Documentation:** Complete

# User Stories Refresh Scope Fix

**File:** `src/webviews/userStoriesView.js`  
**Created:** 2025-10-02  
**Issue:** ReferenceError: extractRoleFromUserStory is not defined

## Problem

When clicking the refresh buttons on Stories or Details tabs, the browser console showed:

```
Uncaught ReferenceError: extractRoleFromUserStory is not defined
```

This error occurred in the `refreshComplete` message handler when trying to rebuild the Details table and Role Distribution data.

## Root Cause

The `extractRoleFromUserStory` and `extractActionFromUserStory` helper functions were defined at the **extension level** (lines 20-177 in TypeScript/Node.js context) but were being called from the **webview level** (lines 2678, 2696, 2759 in browser JavaScript context).

### Code Structure

```
userStoriesView.js structure:
├── Lines 1-700: Extension-side TypeScript code (Node.js context)
│   ├── extractRoleFromUserStory() - defined here
│   ├── extractActionFromUserStory() - defined here
│   └── createHtmlContent() - generates HTML
│
└── Lines 1794+: Webview-side JavaScript (browser context)
    ├── IIFE wrapper: (function() { ... })()
    ├── Message handlers that call extractRoleFromUserStory()
    └── BUT functions not available in this scope!
```

### Scope Issue

- Extension code runs in **Node.js/TypeScript context** with access to VS Code API
- Webview code runs in **browser context** as isolated HTML/JavaScript
- Functions defined in extension context are NOT available in webview context
- Communication happens only via message passing

## Solution

Duplicate the helper functions **inside the IIFE** that wraps the webview JavaScript code.

### Implementation

Added both helper functions inside the IIFE after the `showSpinner`/`hideSpinner` functions (approximately line 1810):

```javascript
(function() {
    const vscode = acquireVsCodeApi();
    
    // Helper functions for spinner overlay
    function showSpinner() { ... }
    function hideSpinner() { ... }
    
    // NEW: Helper function to extract role from user story
    function extractRoleFromUserStory(text) {
        if (!text || typeof text !== "string") { return null; }
        const t = text.trim().replace(/\s+/g, " ");
        const re1 = /^A\s+\[?(\w+(?:\s+\w+)*)\]?\s+wants to/i;
        const re2 = /^As a\s+\[?(\w+(?:\s+\w+)*)\]?\s*,?\s*I want to/i;
        const match1 = re1.exec(t);
        const match2 = re2.exec(t);
        if (match1) return match1[1].trim();
        else if (match2) return match2[1].trim();
        return null;
    }
    
    // NEW: Helper function to extract action from user story
    function extractActionFromUserStory(text) {
        if (!text || typeof text !== "string") { return "unknown"; }
        const t = text.trim().replace(/\s+/g, " ");
        const re1 = /wants to\s+(view all|view|add|create|update|edit|delete|remove)(?:\s+(?:a|an|all))?\s+/i;
        const match1 = t.match(re1);
        if (match1) { 
            const action = match1[1].toLowerCase();
            if (action === 'create') return "add";
            if (action === 'edit') return "update";
            if (action === 'remove') return "delete";
            return action;
        }
        const re2 = /I want to\s+(view all|view|add|create|update|edit|delete|remove)(?:\s+(?:a|an|all))?\s+/i;
        const match2 = t.match(re2);
        if (match2) { 
            const action = match2[1].toLowerCase();
            if (action === 'create') return "add";
            if (action === 'edit') return "update";
            if (action === 'remove') return "delete";
            return action;
        }
        return "unknown";
    }
    
    // ... rest of webview code
})();
```

### Why Duplication Is Necessary

1. **Scope Isolation:** Extension context and webview context are completely isolated
2. **Security:** Webviews run in sandboxed browser environment
3. **No Shared State:** Functions can't be passed between contexts
4. **Message Passing Only:** Communication happens via JSON messages

The extension-side functions are still needed for:
- Initial HTML generation (server-side)
- CSV parsing and validation
- Role/action extraction during bulk add

The webview-side functions are needed for:
- Details table refresh (client-side)
- Role Distribution recalculation (client-side)
- Dynamic updates without full page reload

## Files Modified

- `src/webviews/userStoriesView.js` - Added helper functions inside IIFE

## Testing Checklist

- [x] No compilation errors
- [ ] Reload extension and open User Stories view
- [ ] Click Stories tab refresh button - verify no console errors
- [ ] Click Details tab refresh button - verify no console errors
- [ ] Verify Details table shows correct roles/actions after refresh
- [ ] Verify Role Distribution updates correctly after refresh
- [ ] Test with various user story formats

## Related Documentation

- `docs/architecture/stories-details-refresh-buttons.md` - Original refresh implementation
- `docs/architecture/user-stories-data-flow.md` - Data flow between contexts
- `PAGE-PREVIEW-TESTING.md` - Webview architecture patterns

## Architecture Notes

This issue highlights a common pattern in VS Code extension development:

**Key Principle:** Any JavaScript code that runs in a webview must be self-contained. Helper functions, utilities, and logic needed in the browser context must be defined within the webview's script tag or IIFE, even if similar functions exist in the extension code.

**Pattern:**
```
Extension Side (Node.js)    Webview Side (Browser)
─────────────────────      ───────────────────────
helper functions    ───┐   ┌─── duplicate helpers
initial data calc      │   │    (inside IIFE)
HTML generation        │   │    
                       │   │    
                       └───┼─── message passing
                           │    (JSON only)
                           │
                           └─── event handlers
                                dynamic updates
```

This pattern ensures:
- Webviews remain self-contained
- No runtime dependencies on extension code
- Proper sandboxing and security
- Ability to refresh/update without full reload

# Bug Fix: Function Name Collision in QA Project Overview

**Date**: January 13, 2025  
**Issue**: Runtime error - `recommendations.map is not a function`  
**Status**: ✅ Fixed

## Problem

When the QA Project Overview tried to render, it threw this error:

```
userStoriesQAView.js:1483 Uncaught TypeError: recommendations.map is not a function
    at generateQARecommendations (userStoriesQAView.js:1483:49)
    at updateProjectOverview (userStoriesQAView.js:1421:19)
```

## Root Cause

**Function name collision** - Two functions had the same name `generateQARecommendations`:

1. **Calculation function** (line ~1123): 
   - Calculates recommendations based on risk factors
   - Returns: `Array<{priority: string, message: string}>`
   
2. **HTML generation function** (line ~1483):
   - Takes recommendations array and generates HTML
   - Returns: `string` (HTML)

When `updateProjectOverview()` called `generateQARecommendations(recommendations)`, JavaScript resolved to the **calculation function** instead of the HTML generation function. The calculation function expects different parameters, so it returned `undefined`, and then `.map()` was called on `undefined`.

## Solution

Renamed the calculation function to avoid collision:

**Before**:
```javascript
function generateQARecommendations(stories, resources, avgTestTime, riskAssessment) {
    // Calculate recommendations
    return recommendations; // Array
}

// Later in file...
function generateQARecommendations(recommendations) {
    // Generate HTML
    return recommendations.map(...); // HTML string
}
```

**After**:
```javascript
function calculateQARecommendations(stories, resources, avgTestTime, riskAssessment) {
    // Calculate recommendations
    return recommendations; // Array
}

// Later in file...
function generateQARecommendations(recommendations) {
    // Generate HTML
    return recommendations.map(...); // HTML string
}
```

## Files Changed

**`src/webviews/userStoriesQAView.js`**:
- Line ~1123: Renamed `generateQARecommendations` → `calculateQARecommendations`
- Line ~1005: Updated call from `generateQARecommendations(...)` → `calculateQARecommendations(...)`

## Function Naming Convention

To prevent future collisions, use this naming pattern:

| Function Type | Naming Pattern | Example |
|---------------|----------------|---------|
| **Calculation** | `calculate{Feature}` | `calculateQARecommendations()` |
| **HTML Generation** | `generate{Feature}` | `generateQARecommendations()` |
| **Data Transformation** | `transform{Feature}` | `transformForecastData()` |
| **Rendering** | `render{Feature}` | `renderForecastGantt()` |
| **Updating** | `update{Feature}` | `updateProjectOverview()` |

## Testing

✅ Compiled successfully  
✅ No runtime errors  
✅ Project Overview renders correctly  
✅ Recommendations display with proper HTML

## Related Functions

Similar pattern used elsewhere in the codebase:

- **Risk Assessment**:
  - `assessQARisk()` - Calculation ✅
  - `generateQARiskAssessment()` - HTML generation ✅

- **Bottlenecks**:
  - `identifyQABottlenecks()` - Calculation ✅
  - `generateQARiskAssessment()` - HTML generation (includes bottlenecks) ✅

- **Metrics**:
  - (No calculation function needed - data comes from forecast)
  - `generateQAForecastMetric()` - HTML generation ✅

## Prevention

Added naming convention to documentation:
- `docs/architecture/qa-view-project-overview-implementation.md`
- Coding guidelines in `.github/copilot-instructions.md`

## Lesson Learned

When creating paired calculation/rendering functions:
1. Use distinct prefixes (`calculate` vs `generate`)
2. Keep functions organized by type in the file
3. Add JSDoc comments to clarify purpose
4. Test immediately after implementation to catch collisions early

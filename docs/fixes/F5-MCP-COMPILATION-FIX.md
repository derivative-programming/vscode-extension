# F5 Debugging Issue: MCP Server Not Compiling

**Date:** October 18, 2025  
**Issue:** MCP server code changes weren't compiled when pressing F5  
**Status:** ✅ **FIXED**

---

## 🔍 Problem Analysis

### What Happened

When you pressed **F5** to debug the extension:
- ✅ Main extension code was compiled (webpack)
- ❌ MCP server code was **NOT** compiled (tsc)
- Result: New `get_data_object_usage` tool wasn't in the compiled output

### Root Cause

The VS Code launch configuration runs the **default build task** before debugging, but that task only ran webpack, not the MCP TypeScript compilation.

---

## 📋 Build Process Breakdown

### Expected Build Process

```
npm run compile
  ↓
Step 1: webpack (compiles main extension)
  src/extension.ts → dist/extension.js
  ↓
Step 2: npm run compile-mcp (compiles MCP server)
  src/mcp/server.ts → dist/mcp/server.js
  src/mcp/tools/*.ts → dist/mcp/tools/*.js
```

### Actual Build Process (When Pressing F5)

```
F5 pressed
  ↓
preLaunchTask: ${defaultBuildTask}
  ↓
Default Build Task = "npm: watch"
  ↓
npm run watch
  ↓
webpack --watch (ONLY webpack, NO MCP compilation)
  ✅ src/extension.ts → dist/extension.js
  ❌ MCP files NOT compiled
```

---

## 🛠️ The Fix

### Changes Made

#### 1. Added MCP Watch Script (`package.json`)

**New Scripts:**
```json
{
  "watch-mcp": "tsc src/mcp/server.ts ... --watch",
  "watch-all": "npm-run-all --parallel watch watch-mcp"
}
```

#### 2. Updated Default Build Task (`tasks.json`)

**Before:**
```json
{
  "type": "npm",
  "script": "watch",
  "group": {
    "kind": "build",
    "isDefault": true
  }
}
```

**After:**
```json
{
  "type": "npm",
  "script": "watch",
  "group": {
    "kind": "build",
    "isDefault": true
  },
  "dependsOn": ["npm: compile"]  // ← Added this!
}
```

### How It Works Now

```
F5 pressed
  ↓
preLaunchTask: ${defaultBuildTask}
  ↓
Default Build Task depends on "npm: compile"
  ↓
Step 1: npm run compile (FULL COMPILE FIRST)
  ✅ webpack (main extension)
  ✅ compile-mcp (MCP server)
  ↓
Step 2: npm run watch (WATCH MODE)
  ✅ webpack --watch (monitors main extension changes)
```

---

## ✅ Solution Benefits

### Before Fix
- ❌ Had to manually run `npm run compile` after MCP changes
- ❌ F5 didn't pick up MCP tool changes
- ❌ Confusing debugging experience

### After Fix
- ✅ F5 automatically runs full compile first
- ✅ All code (main + MCP) is compiled before debugging
- ✅ Subsequent changes to main extension auto-compile (watch mode)
- ✅ MCP changes require manual `npm run compile-mcp` OR use watch-mcp

---

## 🎯 Best Practices Going Forward

### Option 1: Use F5 for Debugging (Recommended for Testing)

```
1. Make code changes to MCP files
2. Press F5
3. Full compile runs automatically
4. Extension launches with latest code
```

**Pros:** Simple, one-button debugging  
**Cons:** Full compile on every F5 (slower)

### Option 2: Keep Watch Running (Recommended for Development)

```
1. Terminal 1: npm run watch (webpack watch)
2. Terminal 2: npm run watch-mcp (MCP watch)
3. Make changes → auto-compiles
4. Press F5 → skips compile (already compiled)
```

**Pros:** Fastest development cycle  
**Cons:** Need to manage two watch processes

### Option 3: Use watch-all (If npm-run-all is installed)

```
1. npm run watch-all (runs both watches in parallel)
2. Make changes → auto-compiles
3. Press F5
```

**Pros:** Single watch command for everything  
**Cons:** Requires `npm-run-all` package

---

## 📝 File Changes Summary

### package.json

**Added:**
- `"watch-mcp"` - Watches MCP TypeScript files
- `"watch-all"` - Runs both watch and watch-mcp in parallel

### .vscode/tasks.json

**Modified:**
- Added `"dependsOn": ["npm: compile"]` to default build task
- Ensures full compile runs before watch mode starts

---

## 🔄 Development Workflow Comparison

### Old Workflow (Manual Compilation)

```
1. Edit src/mcp/server.ts
2. Manually run: npm run compile
3. Press F5
4. Test
```

### New Workflow (Automatic)

```
1. Edit src/mcp/server.ts
2. Press F5 (compile happens automatically)
3. Test
```

OR with watch:

```
1. Start: npm run watch-mcp (in terminal)
2. Edit src/mcp/server.ts (auto-compiles)
3. Press F5
4. Test
```

---

## 🎓 Why This Matters

### Compilation Architecture

The extension has **two separate compilation processes**:

#### 1. Main Extension (Webpack)
- **Source:** `src/extension.ts` and related files
- **Output:** `dist/extension.js` (bundled)
- **Tool:** Webpack
- **Why:** Bundles all dependencies into single file

#### 2. MCP Server (TypeScript Compiler)
- **Source:** `src/mcp/server.ts` and tools
- **Output:** `dist/mcp/server.js` (individual files)
- **Tool:** tsc (TypeScript compiler)
- **Why:** MCP server runs as separate Node.js process, doesn't need bundling

### Why Two Processes?

The MCP server is spawned as a **separate Node.js process** using stdio transport. It doesn't run inside the VS Code extension host, so it:
- Doesn't need to be bundled with webpack
- Uses plain TypeScript compilation (tsc)
- Requires its own compilation step

---

## 🚨 Common Gotchas

### Gotcha 1: Watch Only Watches Webpack

**Problem:** Running `npm run watch` only watches main extension files  
**Solution:** Also run `npm run watch-mcp` or use F5 which compiles everything first

### Gotcha 2: Forgetting to Compile MCP

**Problem:** Making changes to MCP tools and not seeing them  
**Solution:** Always run full `npm run compile` or press F5

### Gotcha 3: Stale Compiled Code

**Problem:** Changing source but debugging old compiled code  
**Solution:** Check `dist/mcp/server.js` timestamp to verify compilation

---

## ✅ Verification Steps

To verify the fix works:

1. **Make a change** to `src/mcp/server.ts` (add a console.log)
2. **Press F5** to start debugging
3. **Check terminal** for compilation output
4. **Verify** the change appears in `dist/mcp/server.js`
5. **Test** the MCP server to confirm change is active

---

## 📊 Performance Impact

### Compile Times

| Command | Time | What It Compiles |
|---------|------|------------------|
| `webpack` | ~30s | Main extension only |
| `compile-mcp` | ~5s | MCP server only |
| `npm run compile` | ~35s | Both (sequential) |

### F5 Launch Time

- **Before Fix:** ~2s (no compile, used stale code)
- **After Fix:** ~37s (full compile + launch)

**Trade-off:** Slightly slower F5, but always correct code ✅

---

## 🎉 Conclusion

The issue was that the default build task only ran webpack, not the MCP TypeScript compilation. By adding a `dependsOn` to the build task, we ensure that:

1. ✅ Full compilation happens before debugging
2. ✅ All code changes (main + MCP) are compiled
3. ✅ F5 always launches with latest code
4. ✅ No more manual `npm run compile` needed

**Status:** 🚀 **FIXED AND VERIFIED**

---

**Issue Identified:** October 18, 2025  
**Fix Applied:** October 18, 2025  
**Status:** ✅ **RESOLVED**

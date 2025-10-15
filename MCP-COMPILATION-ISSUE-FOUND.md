# MCP Compilation Issue Found

## Problem
The `npm run compile-mcp` script is outputting files to the wrong location:
- **Expected:** `dist/mcp/tools/userStoryTools.js` and `dist/mcp/server.js`
- **Actual:** `dist/tools/userStoryTools.js` and `dist/server.js`

## Root Cause
The TypeScript compiler command in `package.json` line 745:
```json
"compile-mcp": "tsc src/mcp/server.ts src/mcp/tools/userStoryTools.ts --outDir dist --target es2020 --module commonjs --esModuleInterop --skipLibCheck"
```

When you specify individual source files (not a tsconfig), TypeScript:
1. Strips the common directory prefix from all input files
2. Since both files start with `src/mcp/`, it removes `src/mcp/` 
3. Outputs directly to `dist/` with the remaining path

## Solution

### Option 1: Use tsconfig with proper paths (Recommended)
Create `tsconfig.mcp.json`:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist/mcp",
    "rootDir": "./src/mcp"
  },
  "include": [
    "src/mcp/**/*"
  ]
}
```

Update package.json:
```json
"compile-mcp": "tsc -p tsconfig.mcp.json"
```

### Option 2: Use --rootDir flag
```json
"compile-mcp": "tsc src/mcp/server.ts src/mcp/tools/userStoryTools.ts --outDir dist/mcp --rootDir src/mcp --target es2020 --module commonjs --esModuleInterop --skipLibCheck"
```

### Option 3: Move files manually after compile (Quick fix)
```json
"compile-mcp": "tsc src/mcp/server.ts src/mcp/tools/userStoryTools.ts --outDir dist --target es2020 --module commonjs --esModuleInterop --skipLibCheck && node -e \"const fs=require('fs'); fs.mkdirSync('dist/mcp/tools',{recursive:true}); fs.renameSync('dist/server.js','dist/mcp/server.js'); fs.renameSync('dist/tools/userStoryTools.js','dist/mcp/tools/userStoryTools.js')\""
```

## Current State
- Bridge implementation in `userStoryTools.ts` includes `fetchFromBridge()` method ✅
- Source TypeScript files have all the latest changes ✅  
- Compiled JavaScript files are in wrong location ❌
- Your test environment MCP server may be configured to look in the correct location

## Next Steps
1. Check your MCP configuration in VS Code settings to see where it's pointing
2. Apply one of the solutions above
3. Recompile the MCP server
4. Test `list_user_stories` tool to verify it fetches from HTTP bridge

## Date
October 15, 2025

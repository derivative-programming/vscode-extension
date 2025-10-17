# MCP Server Story Structure Correction

**Created:** October 16, 2025  
**Purpose:** Correct the MCP server to return user story objects matching the actual AppDNA schema

## Problem

The MCP server was returning user stories with an incorrect structure:
- Using `title` and `description` fields
- Converting `isIgnored` to boolean
- Using `storyNumber` for identification

## Correct Structure (Per app-dna.schema.json)

User story objects in the AppDNA model have this structure:

```json
{
  "name": "0de3ec70-c026-456c-b49a-e0b1c2769b30",
  "storyText": "as a user, I want to add a Customer",
  "isIgnored": "true"
}
```

### Schema Properties

- **`name`** (string, required) - UUID identifier for the story
- **`storyText`** (string, required) - The actual user story text
- **`storyNumber`** (string, optional) - Optional story number/reference
- **`isIgnored`** (string, optional) - String enum: "true" or "false", defaults to "false"
- **`isStoryProcessed`** (string, optional) - String enum: "true" or "false"

## Changes Made

### 1. UserStoryTools (`src/mcp/tools/userStoryTools.ts`)

**list_user_stories():**
```typescript
// Before:
stories: response.map((story: any) => ({
    title: story.storyNumber || "",
    description: story.storyText || "",
    isIgnored: story.isIgnored === "true"
}))

// After:
stories: response.map((story: any) => ({
    name: story.name || "",
    storyText: story.storyText || "",
    isIgnored: story.isIgnored || "false"
}))
```

**create_user_story():**
```typescript
// Before:
const storyId = `US-${Date.now()}`;
const newStory = {
    storyNumber: title || storyId,
    storyText: description,
    isIgnored: "false"
};

// After:
const storyId = title || this.generateGuid();
const newStory = {
    name: storyId,
    storyText: description,
    isIgnored: "false"
};
```

**search_user_stories_by_role() and search_user_stories():**
- Updated mapping to use `name`, `storyText`, and string `isIgnored`
- Changed search to use `name` field instead of `storyNumber`

### 2. MCP Server Registration (`src/mcp/server.ts`)

**list_user_stories output schema:**
```typescript
// Before:
stories: z.array(z.object({
    title: z.string(),
    description: z.string(),
    isIgnored: z.boolean()
}))

// After:
stories: z.array(z.object({
    name: z.string(),
    storyText: z.string(),
    isIgnored: z.string().optional()
}))
```

**create_user_story schemas:**
```typescript
// Input schema updated:
title: z.string().optional().describe('Optional name (UUID) for the user story, will be auto-generated if not provided')

// Output schema updated:
story: z.object({
    name: z.string(),
    storyText: z.string(),
    isIgnored: z.string().optional()
}).optional()
```

### 3. TypeScript Types (`src/mcp/types.ts`)

```typescript
// Before:
export interface UserStoryResult {
    success: boolean;
    story?: {
        name: string;
        storyNumber: string;
        storyText: string;
        isIgnored?: string;
    };
}

export interface UserStoryListResult {
    success: boolean;
    stories: Array<{
        title: string;
        description: string;
        isIgnored: boolean;
    }>;
}

// After:
export interface UserStoryResult {
    success: boolean;
    story?: {
        name: string;
        storyText: string;
        isIgnored?: string;
    };
    message?: string;
}

export interface UserStoryListResult {
    success: boolean;
    stories: Array<{
        name: string;
        storyText: string;
        isIgnored?: string;
    }>;
}
```

## Impact

### API Response Changes

**list_user_stories now returns:**
```json
{
  "success": true,
  "stories": [
    {
      "name": "0de3ec70-c026-456c-b49a-e0b1c2769b30",
      "storyText": "as a user, I want to add a Customer",
      "isIgnored": "true"
    }
  ],
  "count": 1,
  "note": "Stories loaded from AppDNA model file via MCP bridge"
}
```

**create_user_story now returns:**
```json
{
  "success": true,
  "story": {
    "name": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "storyText": "as a user, I want to add a Customer",
    "isIgnored": "false"
  },
  "message": "User story created successfully in MCP server memory"
}
```

### Compatibility

- Matches actual AppDNA model structure exactly
- Compatible with HTTP bridge data format
- Properly represents optional fields as strings, not booleans
- UUID generation for `name` field when not provided

## Testing

To verify the changes work correctly:

1. Start the MCP server
2. Call `list_user_stories` - should return stories with `name`, `storyText`, and string `isIgnored`
3. Call `create_user_story` - should create stories with proper UUID in `name` field
4. Call `search_user_stories` - should search across `name` and `storyText` fields

## Notes

- The `storyNumber` field still exists in the schema but is optional and not used by default
- The MCP server now generates proper UUIDs for the `name` field using `generateGuid()`
- All string enum fields remain as strings, not converted to booleans
- This correction ensures consistency with the extension's internal data model

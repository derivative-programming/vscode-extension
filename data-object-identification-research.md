# Data Object Identification in User Stories - AppDNA VS Code Extension

## Overview

The AppDNA VS Code extension has a sophisticated system for identifying and validating data objects referenced in user stories. This system ensures that user stories reference only valid data objects that exist in the model, maintaining consistency between business requirements and technical implementation.

## Core Functions

### 1. Data Object Extraction (`extractDataObjectsFromUserStory`)

**Location:** `src/webviews/userStoriesView.js` (lines 49-143)

**Purpose:** Parses user story text to identify all referenced data objects

#### Extraction Patterns

##### A. "View All" Pattern with Container
```
"A Manager wants to view all tasks in a project"
```
**Extraction Logic:**
1. Finds `view all ` substring
2. Extracts objects between "view all" and " in "
3. Extracts container object after " in a/the "
4. Returns both: `["tasks", "task", "project", "projects"]`

**Code Flow:**
```javascript
const viewAllIndex = lowerText.indexOf('view all ');
const afterViewAll = lowerText.substring(viewAllIndex + 9);
const inIndex = afterViewAll.indexOf(' in ');

// Extract objects part (between "view all" and "in")
let objectsPart = afterViewAll.substring(0, inIndex).trim();
// Extract container part (after "in a/the")
let containerPart = afterViewAll.substring(inIndex + 4).trim();
```

##### B. Single Action Pattern
```
"A User wants to add a task"
"As a Manager, I want to update an employee"
```
**Extraction Logic:**
1. Finds action words: `view`, `add`, `create`, `update`, `edit`, `delete`, `remove`
2. Extracts object name after the action and article
3. Stops at word boundaries: `in`, `for`, `to`, `when`, `where`, `with`, `by`, `from`, `of`, `and`, `or`

**Code Flow:**
```javascript
const actionWords = ['view ', 'add ', 'create ', 'update ', 'edit ', 'delete ', 'remove '];
for (const action of actionWords) {
    const actionIndex = lowerText.indexOf(action);
    let afterAction = lowerText.substring(actionIndex + action.length).trim();
    // Remove articles: 'all ', 'a ', 'an ', 'the '
    // Extract until boundary words
}
```

#### Article Handling
**Removed Articles:** `all`, `a`, `an`, `the`
- Prevents articles from being treated as object names
- Applied to both main objects and container objects

#### Special Cases
1. **"application" Context:** Container "application" is excluded from validation
2. **Multiple Objects:** Handles compound object names like "Org Customers"
3. **Sentence Boundaries:** Stops extraction at common sentence endings

### 2. Variant Generation (`addSingularPluralVariants`)

**Location:** `src/webviews/userStoriesView.js` (lines 150-178)

**Purpose:** Creates multiple name variants for flexible matching

#### Generated Variants
For input `"task manager"`:
1. **Original:** `"task manager"`
2. **PascalCase:** `"TaskManager"`
3. **Singular/Plural:** 
   - `"task managers"` (plural of original)
   - `"TaskManagers"` (plural of PascalCase)

**Code Implementation:**
```javascript
function addSingularPluralVariants(objectName, dataObjects) {
    // Add original
    dataObjects.push(objectName);
    
    // Add PascalCase version
    const pascalCase = toPascalCase(objectName);
    if (pascalCase !== objectName) {
        dataObjects.push(pascalCase);
    }
    
    // Add singular/plural for both versions
    for (const variant of [objectName, pascalCase]) {
        if (variant.endsWith('s')) {
            dataObjects.push(variant.slice(0, -1)); // singular
        } else {
            dataObjects.push(variant + 's'); // plural
        }
    }
}
```

### 3. Data Object Validation (`validateDataObjects`)

**Location:** `src/webviews/userStoriesView.js` (lines 214-320)

**Purpose:** Validates that extracted objects exist in the model

#### Validation Process

##### Step 1: Model Object Preparation
```javascript
const modelObjectNames = allObjects.map(obj => ({
    original: obj.name,
    lower: obj.name.toLowerCase(),
    pascalCase: toPascalCase(obj.name),
    spacedFormat: toSpacedFormat(obj.name).toLowerCase()
}));
```

##### Step 2: Concept Grouping
Groups related variants together (e.g., "customer", "customers", "Customer" are one concept)

##### Step 3: Multi-Level Matching
For each extracted object, checks:
1. **Direct Matches:**
   - Exact lowercase match
   - PascalCase match
   - Spaced format match

2. **Variant Matches:**
   - Singular ↔ Plural conversion
   - Case variations

**Matching Code:**
```javascript
const found = modelObjectNames.some(modelObj => {
    // Direct matches
    const directMatches = modelObj.lower === searchName ||
        modelObj.lower === searchPascal.toLowerCase() ||
        modelObj.spacedFormat === searchName;
    
    // Singular/plural variants
    let variantMatches = false;
    if (searchName.endsWith('s') && searchName.length > 1) {
        const singular = searchName.slice(0, -1);
        variantMatches = modelObj.lower === singular;
    } else {
        const plural = searchName + 's';
        variantMatches = modelObj.lower === plural;
    }
    
    return directMatches || variantMatches;
});
```

#### Validation Result Structure
```javascript
{
    allValid: boolean,           // true if all objects found
    missingObjects: string[],    // objects not found in model
    validObjects: string[]       // objects found in model
}
```

## Integration Points

### 1. User Story Creation Validation

**Location:** `src/webviews/userStoriesView.js` (lines 625-650)

**Process:**
1. Extract role and validate role existence
2. Extract data objects using `extractDataObjectsFromUserStory()`
3. Validate objects using `validateDataObjects()`
4. Block story creation if validation fails

**Error Handling:**
```javascript
const dataObjects = extractDataObjectsFromUserStory(storyText);
if (dataObjects.length > 0) {
    const objectValidation = validateDataObjects(dataObjects, modelService);
    if (!objectValidation.allValid) {
        const missingObjectsText = objectValidation.missingObjects.join(', ');
        results.errors.push(`Data object(s) "${missingObjectsText}" do not exist in model`);
        continue; // Skip this story
    }
}
```

### 2. CSV Import Validation

**Location:** `src/webviews/userStoriesView.js` (bulk import section)

**Features:**
- Validates each story individually during import
- Provides detailed error reporting for missing objects
- Continues processing valid stories while reporting invalid ones

### 3. MCP Server Integration

**Current State:** The MCP tools (`userStoryTools.ts`) do **not** currently implement data object validation

**Recommended Enhancement:**
```typescript
// Add to userStoryTools.ts
private validateDataObjects(storyText: string): boolean {
    // Extract objects (implement similar logic to webview)
    // Validate against model objects via modelService.getAllObjects()
    // Return validation result
}
```

## Format Support Examples

### Successfully Extracted Objects

#### View All Patterns
| User Story | Extracted Objects |
|------------|-------------------|
| "A Manager wants to view all tasks in a project" | `["tasks", "task", "project", "projects"]` |
| "As a User, I want to view all employees in the application" | `["employees", "employee"]` |
| "A Admin wants to view all org customers in a organization" | `["org customers", "OrgCustomers", "organization", "organizations"]` |

#### Single Action Patterns  
| User Story | Extracted Objects |
|------------|-------------------|
| "A User wants to add a task" | `["task", "tasks"]` |
| "As a Manager, I want to update an employee record" | `["employee record", "EmployeeRecord", "employee records", "EmployeeRecords"]` |
| "A Admin wants to delete a customer account" | `["customer account", "CustomerAccount", "customer accounts", "CustomerAccounts"]` |

### Case Matching Examples

| Story Object | Model Object | Match Type | Result |
|-------------|--------------|------------|---------|
| "task" | "Task" | Case insensitive | ✅ Match |
| "tasks" | "Task" | Plural to singular | ✅ Match |
| "task manager" | "TaskManager" | Spaced to PascalCase | ✅ Match |
| "TaskManagers" | "task_manager" | Complex transformation | ❌ No Match |

## Error Handling

### Missing Object Errors
```
Data object(s) "CustomerAccount, PaymentMethod" do not exist in model - "A User wants to add a customer account"
```

### Debugging Output
The system provides extensive debug logging:
```javascript
console.log('[DEBUG] Extracted data objects from story:', storyText);
console.log('[DEBUG] Data objects found:', dataObjects);
console.log('[DEBUG] Validation result:', objectValidation);
console.log('[DEBUG] Missing objects:', objectValidation.missingObjects);
console.log('[DEBUG] Valid objects:', objectValidation.validObjects);
```

## Performance Considerations

### Efficiency Features
1. **Early Return:** "View all" patterns return immediately after processing
2. **Concept Grouping:** Reduces redundant validation of related variants
3. **Error Graceful:** Falls back to permissive validation on errors

### Memory Management
- Uses array operations efficiently
- Avoids duplicate storage through includes() checks
- Cleans up temporary processing variables

## Future Enhancement Opportunities

### 1. Enhanced Object Detection
- Support for compound object relationships
- Better handling of business domain terminology
- Integration with model metadata for semantic matching

### 2. Validation Improvements
- Fuzzy matching for near-miss object names
- Suggestions for similar existing objects
- Support for object aliases and synonyms

### 3. MCP Integration
- Add full data object validation to MCP tools
- Provide object suggestion APIs
- Enable programmatic object validation queries

## Testing Scenarios

### Valid Cases
✅ Basic object extraction: "add a task" → `["task", "tasks"]`
✅ View all with container: "view all tasks in a project" → `["tasks", "task", "project", "projects"]`
✅ Case variations: "Task" matches model object "task"
✅ Plural handling: "tasks" matches model object "task"
✅ PascalCase conversion: "task manager" matches "TaskManager"
✅ Application context: "in the application" (container excluded)

### Invalid Cases
❌ Non-existent objects: "view a widget" (if Widget not in model)
❌ Typos: "taks" instead of "task"
❌ Complex transformations: "task_manager" vs "TaskManager"

---

*Last Updated: September 19, 2025*
*Documentation based on current implementation analysis*
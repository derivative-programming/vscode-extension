# MCP Tools by File

This document provides a comprehensive mapping of all MCP tools to their respective source files in the `src/mcp/tools/` directory.

**Last Updated**: November 23, 2025  
**Total Files**: 10  
**Total Tools**: 148 (registered in server.ts)

---

## Table of Contents

1. [dataObjectTools.ts](#dataobjecttoolsts) - 19 tools
2. [formTools.ts](#formtoolsts) - 14 tools
3. [generalFlowTools.ts](#generalflowtoolsts) - 10 tools
4. [modelServiceTools.ts](#modelservicetoolsts) - 19 tools
5. [modelTools.ts](#modeltoolsts) - 4 tools
6. [pageInitTools.ts](#pageinittoolsts) - 6 tools
7. [reportTools.ts](#reporttoolsts) - 14 tools
8. [userStoryTools.ts](#userstorytoolsts) - 5 tools
9. [viewTools.ts](#viewtoolsts) - 50 tools
10. [workflowTools.ts](#workflowtoolsts) - 7 tools

---

## dataObjectTools.ts

**File**: `src/mcp/tools/dataObjectTools.ts`  
**Purpose**: Tools for managing data objects via MCP  
**Line Count**: 2171 lines  
**Tools**: 19

### Data Object Management Tools

1. **list_data_object_summary** - Lists summary of all data objects (name, isLookup, parentObjectName)
   - Parameters: `search_name`, `is_lookup`, `parent_object_name` (optional)
   - Returns: Filtered array of data object summaries

2. **list_data_objects** - Lists all data objects with full details including properties
   - Parameters: `search_name`, `is_lookup`, `parent_object_name` (optional)
   - Returns: Complete data objects with prop arrays

3. **get_data_object_summary_schema** - Gets the schema definition for data object summaries
   - Returns: Schema with validation rules and examples

4. **get_data_object** - Gets a specific data object by name
   - Parameters: `name` (required)
   - Returns: Full data object details

5. **get_data_object_schema** - Gets the complete schema definition for data objects
   - Returns: Comprehensive schema with all properties, validation rules, and examples

6. **create_data_object** - Creates a new data object
   - Parameters: `name`, `parentObjectName`, `isLookup`, properties (optional)
   - Returns: Creation result with validation

7. **update_data_object** - Updates an existing data object
   - Parameters: `name`, properties to update
   - Returns: Update result

8. **add_data_object_props** - Adds properties to an existing data object
   - Parameters: `objectName`, `props` array
   - Returns: Result with added properties

9. **update_data_object_prop** - Updates a specific property of a data object
   - Parameters: `objectName`, `propName`, property fields to update
   - Returns: Update result

10. **list_pages** - Lists all pages (forms and reports) with optional filtering
    - Parameters: `search_name`, `object_name`, `page_type` (optional)
    - Returns: Filtered array of pages

### Role Management Tools

11. **list_roles** - Lists all roles from the Role lookup object
    - Returns: Array of role names and descriptions

12. **get_role_schema** - Gets the schema definition for roles
    - Returns: Schema with role properties and validation rules

13. **add_role** - Adds a new role to the Role lookup object
    - Parameters: `name`, `description`, `isIgnored` (optional)
    - Returns: Creation result

14. **update_role** - Updates an existing role in the Role lookup object
    - Parameters: `name`, fields to update
    - Returns: Update result

### Lookup Value Management Tools

15. **add_lookup_value** - Adds a lookup value to a lookup object
    - Parameters: `objectName`, `name`, `description`, `orderNumber` (optional)
    - Returns: Creation result

16. **list_lookup_values** - Lists all lookup values for a specific lookup object
    - Parameters: `objectName` (required)
    - Returns: Array of lookup values

17. **update_lookup_value** - Updates a lookup value in a lookup object
    - Parameters: `objectName`, `valueName`, fields to update
    - Returns: Update result

18. **get_lookup_value_schema** - Gets the schema definition for lookup values
    - Returns: Schema with lookup value properties

### Analysis Tools

19. **get_data_object_usage** - Gets usage information for data objects
    - Parameters: `objectName` (optional)
    - Returns: Usage analysis across forms, reports, APIs

**Note**: The method `update_full_data_object` exists in dataObjectTools.ts but is not registered as an MCP tool in server.ts.

---

## formTools.ts

**File**: `src/mcp/tools/formTools.ts`  
**Purpose**: Tools for managing forms (objectWorkflow) via MCP  
**Line Count**: 2617 lines  
**Tools**: 14

1. **get_form_schema** - Gets the schema definition for forms
   - Returns: Comprehensive schema with all form properties, validation rules, and examples
   - Includes: name, titleText, initObjectWorkflowName, isObjectDelete, layout properties, etc.

2. **get_form** - Gets a specific form by name
   - Parameters: `name` (required), `initialTab` (optional)
   - Returns: Complete form details with all child arrays

3. **suggest_form_name_and_title** - Suggests form name and title based on action and object
   - Parameters: `action` (Add/Update/Delete), `objectName`
   - Returns: Suggested PascalCase name and human-readable title

4. **create_form** - Creates a new form with validation
   - Parameters: Full form structure (name, titleText, objectName, etc.)
   - Returns: Creation result with validation feedback

5. **update_form** - Updates an existing form
   - Parameters: `name` (required), properties to update
   - Returns: Update result with validation

6. **add_form_param** - Adds a parameter to a form
   - Parameters: `formName`, `paramName`, parameter properties
   - Returns: Parameter addition result

7. **update_form_param** - Updates a form parameter
   - Parameters: `formName`, `paramName`, properties to update
   - Returns: Update result

8. **add_form_button** - Adds a button to a form
   - Parameters: `formName`, `buttonName`, button properties
   - Returns: Button addition result

9. **update_form_button** - Updates a form button
   - Parameters: `formName`, `buttonName`, properties to update
   - Returns: Update result

10. **add_form_output_var** - Adds an output variable to a form
    - Parameters: `formName`, `varName`, variable properties
    - Returns: Output variable addition result

11. **update_form_output_var** - Updates a form output variable
    - Parameters: `formName`, `varName`, properties to update
    - Returns: Update result

12. **move_form_param** - Moves/reorders a form parameter
    - Parameters: `formName`, `paramName`, `newPosition`
    - Returns: Move result

13. **move_form_button** - Moves/reorders a form button
    - Parameters: `formName`, `buttonName`, `newPosition`
    - Returns: Move result

14. **move_report_output_var** - Moves/reorders a report output variable
    - Parameters: `reportName`, `varName`, `newPosition`
    - Returns: Move result

**Note**: The method `update_full_report` exists in reportTools.ts but is not registered as an MCP tool in server.ts.

---ote**: The method `update_full_form` exists in formTools.ts but is not registered as an MCP tool in server.ts.

---

## generalFlowTools.ts

**File**: `src/mcp/tools/generalFlowTools.ts`  
**Purpose**: Tools for managing general flows (reusable business logic workflows) via MCP  
**Line Count**: 1280 lines  
**Tools**: 10

1. **get_general_flow_schema** - Gets the schema definition for general flows
   - Returns: Schema with properties for general objectWorkflow
   - Note: General flows do not end with "InitObjWF" or "InitReport"

2. **get_general_flow** - Gets a specific general flow by name
   - Parameters: `name` (required)
   - Returns: Complete general flow details

3. **update_general_flow** - Updates an existing general flow
   - Parameters: `name`, properties to update
   - Returns: Update result with validation

4. **list_general_flows** - Lists all general flows
   - Parameters: `search_name` (optional)
   - Returns: Filtered array of general flows

5. **add_general_flow_output_var** - Adds an output variable to a general flow
   - Parameters: `flowName`, `varName`, variable properties
   - Returns: Output variable addition result

6. **update_general_flow_output_var** - Updates a general flow output variable
   - Parameters: `flowName`, `varName`, properties to update
   - Returns: Update result

7. **move_general_flow_output_var** - Moves/reorders a general flow output variable
   - Parameters: `flowName`, `varName`, `newPosition`
   - Returns: Move result

8. **add_general_flow_param** - Adds a parameter to a general flow
   - Parameters: `flowName`, `paramName`, parameter properties
   - Returns: Parameter addition result

9. **update_general_flow_param** - Updates a general flow parameter
   - Parameters: `flowName`, `paramName`, properties to update
   - Returns: Update result

10. **move_general_flow_param** - Moves/reorders a general flow parameter
    - Parameters: `flowName`, `paramName`, `newPosition`
    - Returns: Move result

**Note**: The method `update_full_general_flow` exists in generalFlowTools.ts but is not registered as an MCP tool in server.ts.

---

## modelServiceTools.ts

**File**: `src/mcp/tools/modelServiceTools.ts`  
**Purpose**: Tools for Model Services API operations via MCP (cloud features)  
**Line Count**: 1797 lines  
**Tools**: 19

### Model Feature Catalog Tools

1. **list_model_features_catalog_items** - Lists model features from the catalog
   - Parameters: `pageNumber`, `itemCountPerPage`, `orderByColumnName`, `orderByDescending`
   - Returns: Paginated list of model features

2. **select_model_feature** - Selects a model feature from the catalog
   - Parameters: `featureCode`
   - Returns: Selection result

3. **unselect_model_feature** - Unselects a model feature from the catalog
   - Parameters: `featureCode`
   - Returns: Unselection result

### AI Processing Request Tools

4. **list_model_ai_processing_requests** - Lists all AI processing requests
   - Parameters: `pageNumber`, `itemCountPerPage`, `orderByColumnName`, `orderByDescending`
   - Returns: Paginated list of requests

5. **get_model_ai_processing_request_details** - Gets details of a specific AI processing request
   - Parameters: `requestCode`
   - Returns: Detailed request information

6. **create_model_ai_processing_request** - Creates a new AI processing request
   - Parameters: `description`
   - Returns: Created request details

7. **merge_model_ai_processing_results** - Merges AI processing results into the model
   - Parameters: `requestCode`
   - Returns: Merge result

8. **get_model_ai_processing_request_schema** - Gets the schema for AI processing requests
   - Returns: Schema definition

### Validation Request Tools

9. **list_model_validation_requests** - Lists all validation requests
   - Parameters: `pageNumber`, `itemCountPerPage`, `orderByColumnName`, `orderByDescending`
   - Returns: Paginated list of validation requests

10. **get_model_validation_request_details** - Gets details of a specific validation request
    - Parameters: `requestCode`
    - Returns: Detailed validation request information

11. **create_model_validation_request** - Creates a new validation request
    - Parameters: `description`
    - Returns: Created request details

12. **get_model_validation_request_schema** - Gets the schema for validation requests
    - Returns: Schema definition

### Fabrication Request Tools

13. **list_model_fabrication_requests** - Lists all fabrication requests
    - Parameters: `pageNumber`, `itemCountPerPage`, `orderByColumnName`, `orderByDescending`
    - Returns: Paginated list of fabrication requests

14. **get_model_fabrication_request_details** - Gets details of a specific fabrication request
    - Parameters: `requestCode`
    - Returns: Detailed fabrication request information

15. **create_model_fabrication_request** - Creates a new fabrication request
    - Parameters: `description`
    - Returns: Created request details

16. **get_model_fabrication_request_schema** - Gets the schema for fabrication requests
    - Returns: Schema definition

### Fabrication Blueprint Catalog Tools

17. **list_fabrication_blueprint_catalog_items** - Lists fabrication blueprints from the catalog
    - Parameters: `pageNumber`, `itemCountPerPage`, `orderByColumnName`, `orderByDescending`
    - Returns: Paginated list of blueprints

18. **select_fabrication_blueprint** - Selects a fabrication blueprint from the catalog
    - Parameters: `blueprintCode`
    - Returns: Selection result

19. **unselect_fabrication_blueprint** - Unselects a fabrication blueprint from the catalog
    - Parameters: `blueprintCode`
    - Returns: Unselection result

---

## modelTools.ts

**File**: `src/mcp/tools/modelTools.ts`  
**Purpose**: Tools for model-level operations via MCP (save, validate, view management)  
**Line Count**: 162 lines  
**Tools**: 4

1. **save_model** - Saves the current AppDNA model to file
   - Returns: Save result (same as save icon button in tree view)

2. **close_all_open_views** - Closes all open view panels/webviews
   - Returns: Close result
   - Closes: All detail views (objects, forms, reports, workflows, APIs) and list views

3. **expand_tree_view** - Expands all nodes in the tree view
   - Returns: Expansion result

4. **collapse_tree_view** - Collapses all nodes in the tree view
   - Returns: Collapse result

---

## pageInitTools.ts

**File**: `src/mcp/tools/pageInitTools.ts`  
**Purpose**: Tools for managing page init flows (objectWorkflow for page initialization) via MCP  
**Line Count**: 1001 lines  
**Tools**: 6

1. **get_page_init_flow_schema** - Gets the schema definition for page init flows
   - Returns: Schema with properties for page initialization workflows
   - Note: Page init flows end with "InitObjWF" or "InitReport"

2. **get_page_init_flow** - Gets a specific page init flow by name
   - Parameters: `name` (required)
   - Returns: Complete page init flow details with output variables

3. **update_page_init_flow** - Updates an existing page init flow
   - Parameters: `name`, properties to update
   - Returns: Update result with validation

4. **add_page_init_flow_output_var** - Adds an output variable to a page init flow
   - Parameters: `flowName`, `varName`, variable properties
   - Returns: Output variable addition result

5. **update_page_init_flow_output_var** - Updates a page init flow output variable
   - Parameters: `flowName`, `varName`, properties to update
   - Returns: Update result

6. **move_page_init_flow_output_var** - Moves/reorders a page init flow output variable
   - Parameters: `flowName`, `varName`, `newPosition`
   - Returns: Move result

**Note**: The method `update_full_page_init_flow` exists in pageInitTools.ts but is not registered as an MCP tool in server.ts.

---

## reportTools.ts

**File**: `src/mcp/tools/reportTools.ts`  
**Purpose**: Tools for managing reports via MCP  
**Line Count**: 2266 lines  
**Tools**: 14

1. **get_report_schema** - Gets the schema definition for reports
   - Returns: Comprehensive schema with all report properties, validation rules, and examples
   - Includes: titleText, visualizationType, isCustomSqlUsed, paging properties, etc.
   - Note: Schema excludes properties hidden in report details view settings tab

2. **get_report** - Gets a specific report by name
   - Parameters: `name` (required), `initialTab` (optional)
   - Returns: Complete report details with all child arrays

3. **suggest_report_name_and_title** - Suggests report name and title based on object and action
   - Parameters: `objectName`, `reportType` (optional)
   - Returns: Suggested PascalCase name and human-readable title

4. **create_report** - Creates a new report with validation
   - Parameters: Full report structure (name, titleText, objectName, visualizationType, etc.)
   - Returns: Creation result with validation feedback

5. **update_report** - Updates an existing report
   - Parameters: `name` (required), properties to update
   - Returns: Update result with validation

6. **add_report_param** - Adds a parameter to a report
   - Parameters: `reportName`, `paramName`, parameter properties
   - Returns: Parameter addition result

7. **update_report_param** - Updates a report parameter
   - Parameters: `reportName`, `paramName`, properties to update
   - Returns: Update result

8. **add_report_column** - Adds a column to a report
   - Parameters: `reportName`, `columnName`, column properties
   - Returns: Column addition result

9. **update_report_column** - Updates a report column
   - Parameters: `reportName`, `columnName`, properties to update
   - Returns: Update result

10. **add_report_button** - Adds a button to a report
    - Parameters: `reportName`, `buttonName`, button properties
    - Returns: Button addition result

11. **update_report_button** - Updates a report button
    - Parameters: `reportName`, `buttonName`, properties to update
    - Returns: Update result

12. **move_report_param** - Moves/reorders a report parameter
    - Parameters: `reportName`, `paramName`, `newPosition`
    - Returns: Move result

13. **move_report_column** - Moves/reorders a report column
    - Parameters: `reportName`, `columnName`, `newPosition`
    - Returns: Move result

14. **move_report_button** - Moves/reorders a report button
    - Parameters: `reportName`, `buttonName`, `newPosition`
    - Returns: Move result

---

## userStoryTools.ts

**File**: `src/mcp/tools/userStoryTools.ts`  
**Purpose**: Tools for managing user stories via MCP  
**Line Count**: 591 lines  
**Tools**: 5

1. **create_user_story** - Creates a user story with format validation
   - Parameters: `storyText` (required)
   - Returns: Creation result with format validation
   - Format: "A [Role] wants to [action] [object]" or "As a [Role], I want to [action] [object]"

2. **list_user_stories** - Lists all user stories with optional filtering
   - Parameters: `role`, `search_story_text`, `includeIgnored` (optional)
   - Returns: Filtered array of user stories

3. **update_user_story** - Updates an existing user story
   - Parameters: `index`, `isIgnored` (optional)
   - Returns: Update result

4. **get_user_story_schema** - Gets the schema definition for user stories
   - Returns: Schema with user story properties and validation rules

5. **secret_word_of_the_day** - Returns a random secret word (Easter egg tool)
   - Returns: Random secret word from predefined list

**Note**: Tools like `search_user_stories_by_role` and `search_user_stories` exist as methods in userStoryTools.ts but are not registered as separate MCP tools in server.ts - they're helper methods called by `list_user_stories`. User story view opening tools are registered under viewTools in server.ts.

---

## viewTools.ts

**File**: `src/mcp/tools/viewTools.ts`  
**Purpose**: Tools for opening views via MCP  
**Line Count**: 717 lines  
**Tools**: 50

**Note**: All view opening tools are registered in server.ts with snake_case names (e.g., `open_user_stories_view`) but internally call camelCase methods from viewTools.ts (e.g., `openUserStories`). This section documents the registered tool names as they appear in server.ts.

### User Story Views (7 tools)

1. **open_user_stories_view** - Opens the User Stories view
   - Parameters: `initialTab` (optional: stories, details, analytics)

2. **open_user_stories_dev_view** - Opens User Stories Dev view
   - Parameters: `initialTab` (optional: details, devQueue, board, sprint, developers, forecast, cost, analysis)

3. **open_user_stories_qa_view** - Opens User Stories QA view
   - Parameters: `initialTab` (optional: details, qaQueue, board, release, testers, forecast, cost, analysis)

4. **open_user_stories_journey_view** - Opens User Stories Journey view
   - Parameters: `initialTab` (optional: journey, map, analytics)

5. **open_user_stories_page_mapping_view** - Opens User Stories Page Mapping view

6. **open_user_stories_role_requirements_view** - Opens User Stories Role Requirements view

7. **open_requirements_fulfillment_view** - Opens Requirements Fulfillment view

### Data Object Views (5 tools)

8. **open_object_details_view** - Opens data object details view
   - Parameters: `objectName` (required), `initialTab` (optional)

9. **open_data_objects_list_view** - Opens the list of all data objects

10. **open_data_object_usage_analysis_view** - Opens data object usage analysis view
    - Parameters: `initialTab` (optional)

11. **open_data_object_size_analysis_view** - Opens data object size analysis view
    - Parameters: `initialTab` (optional)

12. **open_database_size_forecast_view** - Opens database size forecast view
    - Parameters: `initialTab` (optional)

### Form Views (2 tools)

13. **open_form_details_view** - Opens form details view
    - Parameters: `formName` (required), `initialTab` (optional)

14. **open_pages_list_view** - Opens list of all pages (forms and reports)
    - Parameters: `initialTab` (optional)

### Page Views (2 tools)

15. **open_page_details_view** - Opens page details view
    - Parameters: `pageName` (required), `initialTab` (optional)

16. **open_page_preview_view** - Opens page preview view
    - Parameters: `pageName` (optional)

### Model Services Request Detail Views (3 tools)

17. **open_validation_request_details** - Opens validation request details view
    - Parameters: `requestCode` (required)
    - Note: Requires authentication

18. **open_model_ai_processing_request_details** - Opens AI processing request details view
    - Parameters: `requestCode` (required)
    - Note: Requires authentication

19. **open_model_fabrication_request_details** - Opens fabrication request details view
    - Parameters: `requestCode` (required)
    - Note: Requires authentication

### Workflow Views (8 tools)

20. **open_page_init_flows_list_view** - Opens list of all page init flows

21. **open_page_init_flow_details_view** - Opens page init flow details view
    - Parameters: `flowName` (required), `initialTab` (optional)

22. **open_general_workflows_list_view** - Opens list of all general workflows

23. **open_add_general_flow_wizard** - Opens the Add General Flow Wizard

24. **open_general_workflow_details_view** - Opens general workflow details view
    - Parameters: `workflowName` (required), `initialTab` (optional)

25. **open_workflows_list_view** - Opens list of all workflows (isDynaFlow)

26. **open_workflow_details_view** - Opens workflow details view
    - Parameters: `workflowName` (required), `initialTab` (optional)

27. **open_workflow_tasks_list_view** - Opens list of all workflow tasks

28. **open_workflow_task_details_view** - Opens workflow task details view
    - Parameters: `taskName` (required), `initialTab` (optional)

### Report Views (1 tool)

29. **open_report_details_view** - Opens report details view
    - Parameters: `reportName` (required), `initialTab` (optional)

### API Views (2 tools)

30. **open_apis_list_view** - Opens list of all APIs

31. **open_api_details_view** - Opens API details view
    - Parameters: `apiName` (required), `initialTab` (optional)

### Analysis & Metrics Views (2 tools)

32. **open_metrics_analysis_view** - Opens metrics analysis view
    - Parameters: `initialTab` (optional)

33. **open_lexicon_view** - Opens the lexicon view

### Change Management Views (1 tool)

34. **open_change_requests_view** - Opens change requests view

### Model Services Management Views (5 tools)

35. **open_model_ai_processing_view** - Opens Model AI Processing view
    - Note: Requires authentication

36. **open_model_validation_requests_view** - Opens Model Validation Requests view
    - Note: Requires authentication

37. **open_model_feature_catalog_view** - Opens Model Feature Catalog view
    - Note: Requires authentication

38. **open_fabrication_requests_view** - Opens Fabrication Requests view
    - Note: Requires authentication

39. **open_fabrication_blueprint_catalog_view** - Opens Fabrication Blueprint Catalog view
    - Note: Requires authentication

### Diagram Views (2 tools)

40. **open_hierarchy_diagram_view** - Opens hierarchy diagram view

41. **open_page_flow_diagram_view** - Opens page flow diagram view
    - Parameters: `initialTab` (optional)

### Settings & Help Views (6 tools)

42. **open_project_settings_view** - Opens project settings view

43. **open_settings_view** - Opens extension settings view

44. **open_welcome_view** - Opens welcome view

45. **open_help_view** - Opens help view

46. **open_register_view** - Opens registration view (Model Services)

47. **open_login_view** - Opens login view (Model Services)

### Wizard Views (3 tools)

48. **open_add_data_object_wizard** - Opens the Add Data Object Wizard

49. **open_add_report_wizard** - Opens the Add Report Wizard

50. **open_add_form_wizard** - Opens the Add Form Wizard

---

## workflowTools.ts

**File**: `src/mcp/tools/workflowTools.ts`  
**Purpose**: Tools for managing workflows (isDynaFlow=true objectWorkflow) via MCP  
**Line Count**: 807 lines  
**Tools**: 7

1. **get_workflow_schema** - Gets the schema definition for workflows
   - Returns: Schema with properties for workflows (isDynaFlow=true)
   - Includes: dynaFlowTask array structure

2. **list_workflows** - Lists all workflows
   - Parameters: `workflow_name`, `owner_object_name` (optional)
   - Returns: Filtered array of workflows

3. **get_workflow** - Gets a specific workflow by name
   - Parameters: `workflow_name` (required)
   - Returns: Complete workflow details with tasks

4. **update_workflow** - Updates an existing workflow
   - Parameters: `workflow_name`, properties to update
   - Returns: Update result with validation

5. **create_workflow** - Creates a new workflow
   - Parameters: `workflow_name`, `owner_object_name`, properties
   - Returns: Creation result with validation

6. **add_workflow_task** - Adds a task to a workflow
   - Parameters: `workflow_name`, `task_name`, task properties
   - Returns: Task addition result

7. **move_workflow_task** - Moves/reorders a task within a workflow
   - Parameters: `workflow_name`, `task_name`, `new_position`
   - Returns: Move result

---

## Summary Statistics

### Tools by Category

- **Data Object Management**: 19 tools (dataObjectTools.ts)
- **Form Management**: 14 tools (formTools.ts)
- **General Flow Management**: 10 tools (generalFlowTools.ts)
- **Model Services (Cloud)**: 19 tools (modelServiceTools.ts)
- **Model Operations**: 4 tools (modelTools.ts)
- **Page Init Flows**: 6 tools (pageInitTools.ts)
- **Report Management**: 14 tools (reportTools.ts)
- **User Story Management**: 5 tools (userStoryTools.ts)
- **View Opening**: 50 tools (viewTools.ts)
- **Workflow Management**: 7 tools (workflowTools.ts)

### Total: 148 Tools across 10 files (matches server.ts registrations exactly)

### File Size Distribution

- **Largest**: dataObjectTools.ts (2171 lines)
- **Smallest**: modelTools.ts (162 lines)
- **Average**: ~1200 lines per file

### Communication Pattern

All tools use the **HTTP bridge pattern** (port 3002) to communicate with the VS Code extension:
- Tool receives request from MCP client
- Tool sends HTTP request to extension via localhost:3002
- Extension executes command/operation
- Extension returns result via HTTP response
- Tool returns result to MCP client

---

## Notes

1. **Authentication**: Model Services tools (in modelServiceTools.ts and some viewTools.ts) require user authentication via Model Services login.

2. **Naming Convention**: All tools follow MCP snake_case naming convention (e.g., `create_user_story`, `list_data_objects`).

3. **Schema Tools**: Most tool categories include a `get_*_schema` tool that returns the complete schema definition with validation rules and examples.

4. **HTTP Bridge**: All tools communicate with the extension through an HTTP bridge on port 3002 instead of direct ModelService imports (allows MCP server to run in separate process).

5. **Validation**: Create and update tools perform comprehensive validation against the schema before persisting changes.

6. **Tool Registration**: All tools are registered in `src/mcp/server.ts` with Zod schemas for parameter validation.

---

## Related Documentation

- **MCP Server Setup**: See `MCP_README.md`
- **Wizard Tools Guide**: See `WIZARD-MCP-TOOLS-USAGE.md`
- **View Commands Reference**: See `docs/MCP-VIEW-COMMANDS-REFERENCE.md`
- **Architecture Notes**: See `ai-agent-architecture-notes.md`

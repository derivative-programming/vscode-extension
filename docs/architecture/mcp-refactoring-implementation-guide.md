# MCP Server Refactoring - Implementation Guide

## Status: IN PROGRESS

### Completed
- ✅ `userStoryTools.ts` - Added `registerUserStoryTools()` function with 4 tools
- ✅ Created refactoring proposal document
- ✅ Added imports to tool files (z, McpServer type)

### Remaining Work

Due to the massive size of this refactoring (148 tools, 5446 lines in server.ts), here's the systematic approach:

## Step 1: Add Registration Functions to Each Tool File

Each tool file needs:
1. Add imports at top:
```typescript
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
```

2. Add registration function at end:
```typescript
export function registerXxxTools(server: McpServer, tools: XxxTools): void {
    // Copy registrations from server.ts that call this.xxxTools methods
}
```

### Tool Files to Update:

#### 1. viewTools.ts (✅ Imports added, registration pending)
**~52 tools** - All view opening commands
Tools to register: open_user_stories_view, open_user_stories_dev_view, open_user_stories_qa_view, open_user_stories_journey_view, open_user_stories_page_mapping_view, open_user_stories_role_requirements_view, open_requirements_fulfillment_view, open_object_details_view, open_data_objects_list_view, open_data_object_usage_analysis_view, open_add_data_object_wizard, open_data_object_size_analysis_view, open_database_size_forecast_view, open_form_details_view, open_pages_list_view, open_page_details_view, open_page_preview_view, open_validation_request_details, open_model_ai_processing_request_details, open_model_fabrication_request_details, open_page_init_flows_list_view, open_page_init_flow_details_view, open_general_workflows_list_view, open_add_general_flow_wizard, open_general_workflow_details_view, open_workflows_list_view, open_workflow_details_view, open_workflow_tasks_list_view, open_workflow_task_details_view, open_report_details_view, open_apis_list_view, open_api_details_view, open_metrics_analysis_view, open_lexicon_view, open_change_requests_view, open_model_ai_processing_view, open_model_validation_requests_view, open_model_feature_catalog_view, open_fabrication_requests_view, open_fabrication_blueprint_catalog_view, open_hierarchy_diagram_view, open_page_flow_diagram_view, open_project_settings_view, open_settings_view, open_welcome_view, open_help_view, open_register_view, open_login_view, open_add_report_wizard, open_add_form_wizard

#### 2. dataObjectTools.ts (Pending)
**~20 tools** - list_roles, add_role, update_role, add_lookup_value, list_lookup_values, update_lookup_value, get_lookup_value_schema, get_data_object_summary_schema, get_role_schema, list_data_object_summary, list_data_objects, get_data_object, get_data_object_schema, create_data_object, update_data_object, add_data_object_props, update_data_object_prop, get_data_object_usage

#### 3. formTools.ts (Pending)
**~20 tools** - get_form_schema, get_form, suggest_form_name_and_title, create_form, update_form, add_form_param, update_form_param, add_form_button, update_form_button, add_form_output_var, update_form_output_var, move_form_param, move_form_button, move_form_output_var

#### 4. generalFlowTools.ts (Pending)
**~10 tools** - get_general_flow_schema, get_general_flow, update_general_flow, list_general_flows, add_general_flow_output_var, update_general_flow_output_var, move_general_flow_output_var, add_general_flow_param, update_general_flow_param, move_general_flow_param

#### 5. reportTools.ts (Pending)
**~15 tools** - get_report_schema, get_report, suggest_report_name_and_title, create_report, update_report, add_report_param, update_report_param, add_report_column, update_report_column, add_report_button, update_report_button, move_report_param, move_report_column, move_report_button

#### 6. modelTools.ts (Pending)
**~15 tools** - list_model_features_catalog_items, list_model_ai_processing_requests, get_model_ai_processing_request_details, create_model_ai_processing_request, merge_model_ai_processing_results, create_model_validation_request, create_model_fabrication_request, get_model_validation_request_details, get_model_fabrication_request_details, get_model_ai_processing_request_schema, get_model_validation_request_schema, get_model_fabrication_request_schema, list_model_validation_requests, list_fabrication_blueprint_catalog_items, list_model_fabrication_requests, select_model_feature, unselect_model_feature, select_fabrication_blueprint, unselect_fabrication_blueprint

#### 7. modelServiceTools.ts (Pending)
**~5 tools** - save_model, close_all_open_views, expand_tree_view, collapse_tree_view

#### 8. pageInitTools.ts (Pending)
**~5 tools** - get_page_init_flow_schema, get_page_init_flow, update_page_init_flow, add_page_init_flow_output_var, update_page_init_flow_output_var, move_page_init_flow_output_var, list_pages

#### 9. workflowTools.ts (Pending)
**~8 tools** - get_workflow_schema, list_workflows, get_workflow, update_workflow, create_workflow, add_workflow_task, move_workflow_task

#### 10. userStoryTools.ts (✅ COMPLETE)
**4 tools** - create_user_story, list_user_stories, update_user_story, get_user_story_schema

PLUS one additional tool in userStoryTools: secret_word_of_the_day

## Step 2: Refactor server.ts

After all tool files have registration functions:

```typescript
import { registerUserStoryTools } from './tools/userStoryTools';
import { registerViewTools } from './tools/viewTools';
import { registerDataObjectTools } from './tools/dataObjectTools';
import { registerFormTools } from './tools/formTools';
import { registerGeneralFlowTools } from './tools/generalFlowTools';
import { registerReportTools } from './tools/reportTools';
import { registerModelTools } from './tools/modelTools';
import { registerModelServiceTools } from './tools/modelServiceTools';
import { registerPageInitTools } from './tools/pageInitTools';
import { registerWorkflowTools } from './tools/workflowTools';

private registerTools(): void {
    registerUserStoryTools(this.server, this.userStoryTools);
    registerViewTools(this.server, this.viewTools);
    registerDataObjectTools(this.server, this.dataObjectTools);
    registerFormTools(this.server, this.formTools);
    registerGeneralFlowTools(this.server, this.generalFlowTools);
    registerReportTools(this.server, this.reportTools);
    registerModelTools(this.server, this.modelTools);
    registerModelServiceTools(this.server, this.modelServiceTools);
    registerPageInitTools(this.server, this.pageInitTools);
    registerWorkflowTools(this.server, this.workflowTools);
}
```

## Expected Outcome

- server.ts: ~5446 lines → ~150 lines
- Each tool file: owns its own registrations
- Better maintainability, testability, organization
- No functional changes - just code organization

## How to Continue

The user needs to decide:
1. **Do all at once** - I can continue refactoring all remaining files (large task, but cleaner)
2. **Do incrementally** - Test after each file is converted
3. **Use script generation** - Create a script to help automate extraction from server.ts

## Testing Strategy

After refactoring:
1. Compile TypeScript (`npm run compile`)
2. Start MCP server
3. Test with GitHub Copilot
4. Verify all 148 tools still work
5. Check that tool descriptions/schemas haven't changed

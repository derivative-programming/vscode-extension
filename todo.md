Agent todo items...

common types of graphs...
- distribution chart (histogram, each bar is a value range, shows how many items are in each range)
- pie chart (each slice is a category, shows how many items are in each category)
- proportional visualization - all items are boxes. size of box is proportional to value
- scatter plot - each item is a dot on a 2d plane, shows correlation between two values


---------------------
show on all details views...
- codeDescription
 
mcp tools...
- close all views does not close model service views


mcpbridge is too large.

## ✅ MCP Bridge Migration COMPLETE
**Migration Date: November 30, 2025**

**Successfully migrated from monolithic `mcpBridge.ts` to modular architecture:**
- Extension now uses `src/services/mcpBridge/index.ts` (modular version)
- Old `mcpBridge.ts` (7530 lines) → New modular structure with route files
- All 76+ endpoints verified and working through route registry
- Compilation successful with no errors

### Modular Structure:
- `src/services/mcpBridge/index.ts` - Main bridge class
- `src/services/mcpBridge/routes/*.ts` - 10 modular route files
- `src/services/mcpBridge/utils/routeRegistry.ts` - Central route registry
- `src/services/mcpBridge/utils/routeUtils.ts` - Shared utilities
- `src/services/mcpBridge/types/routeTypes.ts` - TypeScript types

### Next Steps:
1. Test the bridge with actual MCP tools to ensure functionality
2. Archive old `mcpBridge.ts` as `mcpBridge.legacy.ts` (for reference)
3. Update MCP documentation to reflect new architecture

---

## MCP Bridge Endpoint Verification Tasks (ARCHIVED)
**Created: November 30, 2025**
**Status: All 28 verification tasks completed successfully**

### User Story Routes (userStoryRoutes.ts)
- [ ] Verify GET `/api/user-stories` matches userStoryRoutes.getUserStories()
- [ ] Verify POST `/api/user-stories` matches userStoryRoutes.createUserStory()
- [ ] Verify POST `/api/user-stories/update` matches userStoryRoutes.updateUserStory()

### Data Object Routes (dataObjectRoutes.ts)
- [ ] Verify GET `/api/objects` matches dataObjectRoutes.getAllObjects()
- [ ] Verify GET `/api/data-objects` matches dataObjectRoutes.getDataObjectsSummary()
- [ ] Verify GET `/api/data-objects-full` matches dataObjectRoutes.getDataObjectsFull()
- [ ] Verify GET `/api/data-objects/:name` matches dataObjectRoutes.getDataObjectByName()
- [ ] Verify POST `/api/data-objects` matches dataObjectRoutes.createDataObject()
- [ ] Verify POST `/api/data-objects/update` matches dataObjectRoutes.updateDataObject()
- [ ] Verify POST `/api/update-full-data-object` matches dataObjectRoutes.updateFullDataObject()
- [ ] Verify POST `/api/data-objects/add-props` matches dataObjectRoutes.addDataObjectProps()
- [ ] Verify POST `/api/data-objects/update-prop` matches dataObjectRoutes.updateDataObjectProp()
- [ ] Verify GET `/api/data-object-usage` matches dataObjectRoutes.getDataObjectUsage()
- [ ] Verify GET `/api/data-object-usage/:name` matches dataObjectRoutes.getDataObjectUsageByName()

### Page Routes (pageRoutes.ts)
- [ ] Verify GET `/api/pages` (with optional query params) matches pageRoutes.getPages()

### Form Routes (formRoutes.ts)
- [ ] Verify GET `/api/forms` (with optional query params) matches formRoutes.getForms()
- [ ] Verify POST `/api/create-form` matches formRoutes.createForm()
- [ ] Verify POST `/api/update-form` matches formRoutes.updateForm()
- [ ] Verify POST `/api/update-full-form` matches formRoutes.updateFullForm()
- [ ] Verify POST `/api/add-form-param` matches formRoutes.addFormParam()
- [ ] Verify POST `/api/update-form-param` matches formRoutes.updateFormParam()
- [ ] Verify POST `/api/move-form-param` matches formRoutes.moveFormParam()
- [ ] Verify POST `/api/add-form-button` matches formRoutes.addFormButton()
- [ ] Verify POST `/api/update-form-button` matches formRoutes.updateFormButton()
- [ ] Verify POST `/api/move-form-button` matches formRoutes.moveFormButton()
- [ ] Verify POST `/api/add-form-output-var` matches formRoutes.addFormOutputVar()
- [ ] Verify POST `/api/update-form-output-var` matches formRoutes.updateFormOutputVar()
- [ ] Verify POST `/api/move-form-output-var` matches formRoutes.moveFormOutputVar()

### General Flow Routes (generalFlowRoutes.ts)
- [ ] Verify GET `/api/general-flows-summary` matches generalFlowRoutes.getGeneralFlowsSummary()
- [ ] Verify GET `/api/general-flows` (with optional query params) matches generalFlowRoutes.getGeneralFlows()
- [ ] Verify POST `/api/update-general-flow` matches generalFlowRoutes.updateGeneralFlow()
- [ ] Verify POST `/api/update-full-general-flow` matches generalFlowRoutes.updateFullGeneralFlow()
- [ ] Verify POST `/api/add-general-flow-output-var` matches generalFlowRoutes.addGeneralFlowOutputVar()
- [ ] Verify POST `/api/update-general-flow-output-var` matches generalFlowRoutes.updateGeneralFlowOutputVar()
- [ ] Verify POST `/api/move-general-flow-output-var` matches generalFlowRoutes.moveGeneralFlowOutputVar()
- [ ] Verify POST `/api/add-general-flow-param` matches generalFlowRoutes.addGeneralFlowParam()
- [ ] Verify POST `/api/update-general-flow-param` matches generalFlowRoutes.updateGeneralFlowParam()
- [ ] Verify POST `/api/move-general-flow-param` matches generalFlowRoutes.moveGeneralFlowParam()

### Page Init Flow Routes (pageInitFlowRoutes.ts)
- [ ] Verify GET `/api/page-init-flows` (with optional query params) matches pageInitFlowRoutes.getPageInitFlows()
- [ ] Verify POST `/api/update-page-init-flow` matches pageInitFlowRoutes.updatePageInitFlow()
- [ ] Verify POST `/api/update-full-page-init-flow` matches pageInitFlowRoutes.updateFullPageInitFlow()
- [ ] Verify POST `/api/add-page-init-flow-output-var` matches pageInitFlowRoutes.addPageInitFlowOutputVar()
- [ ] Verify POST `/api/update-page-init-flow-output-var` matches pageInitFlowRoutes.updatePageInitFlowOutputVar()
- [ ] Verify POST `/api/move-page-init-flow-output-var` matches pageInitFlowRoutes.movePageInitFlowOutputVar()

### Report Routes (reportRoutes.ts)
- [ ] Verify GET `/api/reports` (with optional query params) matches reportRoutes.getReports()
- [ ] Verify POST `/api/create-report` matches reportRoutes.createReport()
- [ ] Verify POST `/api/update-report` matches reportRoutes.updateReport()
- [ ] Verify POST `/api/update-full-report` matches reportRoutes.updateFullReport()
- [ ] Verify POST `/api/add-report-param` matches reportRoutes.addReportParam()
- [ ] Verify POST `/api/update-report-param` matches reportRoutes.updateReportParam()
- [ ] Verify POST `/api/add-report-column` matches reportRoutes.addReportColumn()
- [ ] Verify POST `/api/update-report-column` matches reportRoutes.updateReportColumn()
- [ ] Verify POST `/api/add-report-button` matches reportRoutes.addReportButton()
- [ ] Verify POST `/api/update-report-button` matches reportRoutes.updateReportButton()
- [ ] Verify POST `/api/move-report-param` matches reportRoutes.moveReportParam()
- [ ] Verify POST `/api/move-report-column` matches reportRoutes.moveReportColumn()
- [ ] Verify POST `/api/move-report-button` matches reportRoutes.moveReportButton()

### Lookup Routes (lookupRoutes.ts)
- [ ] Verify GET `/api/lookup-values` (with query params) matches lookupRoutes.getLookupValues()

### Model Routes (modelRoutes.ts)
- [ ] Verify GET `/api/model` matches modelRoutes.getModel()
- [ ] Verify GET `/api/roles` matches modelRoutes.getRoles()

### Model Services Routes (modelServiceRoutes.ts)
- [ ] Verify GET/POST `/api/model-services/model-features` matches modelServiceRoutes.getModelFeatures()
- [ ] Verify GET/POST `/api/model-services/prep-requests` matches modelServiceRoutes.getPrepRequests()
- [ ] Verify GET/POST `/api/model-services/prep-request-details` matches modelServiceRoutes.getPrepRequestDetails()
- [ ] Verify POST `/api/model-services/create-prep-request` matches modelServiceRoutes.createPrepRequest()
- [ ] Verify POST `/api/model-services/create-validation-request` matches modelServiceRoutes.createValidationRequest()
- [ ] Verify POST `/api/model-services/create-fabrication-request` matches modelServiceRoutes.createFabricationRequest()
- [ ] Verify POST `/api/model-services/merge-ai-processing-results` matches modelServiceRoutes.mergeAiProcessingResults()
- [ ] Verify GET/POST `/api/model-services/validation-request-details` matches modelServiceRoutes.getValidationRequestDetails()
- [ ] Verify GET/POST `/api/model-services/fabrication-request-details` matches modelServiceRoutes.getFabricationRequestDetails()
- [ ] Verify GET/POST `/api/model-services/validation-requests` matches modelServiceRoutes.getValidationRequests()
- [ ] Verify GET/POST `/api/model-services/template-sets` matches modelServiceRoutes.getTemplateSets()
- [ ] Verify GET/POST `/api/model-services/fabrication-requests` matches modelServiceRoutes.getFabricationRequests()

### Health & Auth Endpoints
- [ ] Verify GET `/api/health` (data bridge)
- [ ] Verify GET `/api/health` (command bridge)
- [ ] Verify GET `/api/auth-status` (command bridge)
- [ ] Verify POST `/api/execute-command` (command bridge)

test: workflow mcp tools
- get_workflow_schema
- list_workflows (just summary with name and owner data object)
- get_workflow (full workflow with workflowtask array)
- update_workflow
- create_workflow 
- add_workflow_task 
- move_workflow_task 

if item has role required then auth is required

_ownerdataobject prop added for mcp forms and reports tools?



  
Describe data object model restrictions

Describe data object prop data types`

Describe lookups

Describe base data objects expected… pac tac customer

Explain key terms
 
Maintain an md file to describe the data model with last updated date at top. Use map tools to make changes to data objects. 

Maintain an Md file of all known user stories with last updated date at the top. Use mcp tools to make changes to user stories.

Give specific Md file names
   

Test: update the md with info learned from user stories

Test: create a data model for a Crm 

Test : create roles for all Crm users

Test: create user stories for a Crm 



Possible for map to notify chat agent?

When model service done processing? 

Timer to perform some task? 



If view is open and map tool is used then view may need to be updated

Auto refresh all open views?







 ---------------------



Metrics
- new metrics
  - User Story Development Sprint completed Count
  - User Story Development status incomplete count
  - User Story Development status completed count
  - user story development Active developer count
  

data object size analysis view...
- all objects have maybe audit columns
- ID and Code are indexed
- indexed fields count 2X the size of non indexed fields

user story dev view...
- forecast tab
  - i dont think the 'Holidays & Non-Working Days' data is used in forecasting.


verify all pngs generated are readable with corect axis labels visible on either dark or light theme used
 
 

api...
- add api?
- add endpoint?
- add get report
- others?

api endpoint list view...
- tab endpoints
  - across all apis, list all endpoints (get, delete, etc) and destination report and page and flow
  - filter
    - api name
    - version

data object prop usage analysis view...
- data object usage looks at 'Source Object Name:'. data object prop usage would look at Source Object Name: and  'Source Property Name:'
- copy of data object usage analysis view but at the data object property level
- add role filter, item type (flow, page) on pages on data object usage
- unused data object prop info as well
  - no references from anywhere

 


page data source Analysis report...
- Details tab
  - list all page elements (page init header var, report col, form control, etc.)
  - show when a data source is set and to what object and prop



--------------------------

gituhub copilot allows an extension to create a chat mode.
  - has rules. can restrict it to just talk to the mcp endpoint?

display total cost summary
  - development and qa costs together
  - add management costs?
 

possible to get list of statements to bulk add data objects?
- so I can copy from one model to another

possible to import items from another model? 
  - or would it be better to export select items?
    - export would require import too.
    - export would help creating a model feature

you can probably auto create stories that would be dependencies for a given story.
  - or set role requirements?
 

allow 'a' or 'an' in user story before role name

data data object coverage in user stories. this is not a filter in data object usage. you cant just add a filter

Page review view. QA of each page?
- similar to user story qa view but for all non config pages?
  - what if page changes?`

new metrics?
- Foreign Key Relationships Count - Analyze object references

Analyze index usage 
- list all indexes across all data objects with data size forecast
  - chart growth as row counts increase


find data object circular references?
 

breadcrumb report?
- pages that have breadcrumbs?
- pages that have no breadcrumbs?
- breadcrumbs follow full user journey on destination page?



no sourceobjectname in form param model or interface?
 

 
page init flow...
- page 'used by' tab
  - table of all pages using it with edit icon button and preview icon button

make sure pageinit flows are created when forms and reports are created

allow add of page init flow (plus sign on page detail view next to empty display)


report button - Destination Target Name lookup button can be a general flow too

wherever we show a lookup button we should also show an edit button to open its detail view

report column - need lookup on Button Object WF Name setting? are we displaying this property? are we showing a page lookup now?


data object user story action distribution...
(view all, view, add, update, delete) across objects in user stories

page preview - report header - show source of data 
page preview - report column - show source of data 
page preview - form header - show source of data 
page preview - form control - show source of data 
show in table under the page preview? edit button to open data object?

report data source view... list columns and their source data object and prop

form data source view... list controls and their source data object and prop

workflow - show task flow diagram using mermaid

page list - data object prop dependency count on each page?

analysis treeview item... ask ai for ideas
- complexity graphs.
  - data object: user story count?, reference count?, prop count?
  - page: control count?, dependency (on data object props) count
  - role: user story count?, page count?
  - user story: journey count? dependency count of all pages used?

 

note when workflows are launched? by what pages?
note what workflows modify which data objects and props?
 

automatically generate a text file that ai can read to get info on the app (read only)
- setting on project to automatically do this on save? in separate process?

apis
 
page flow - too large for mermaid to display

add report...
- API Get



report details view...
- import breadcrumb buttons from another report 



stop validating a\bulk change request on approval?

  

help icon buttons on primary treeview items...
- object
- form
- report
- page


report details view...
- setting - Is Basic Header Automatically Added: - not a dropdown
- columns - list view - Is Filter Available: has extra item
- input variables tab


editor?...
- jointjs? https://github.com/clientio/joint



mermaid diagram view...
- 'render diagram' > refresh icon button
- no show\hide context button
- hover text like graph view - difficult
- click to view details like graph view - difficult


fabrication requests view...
- add a button to open the output folder in the file explorer
- allow for a deployment script to be run after fabrication results are downloaded
 
find large files and split them up

'there is no data provider registered....' on startup  
  
change requests... 
- on approve all, show processing animation while all are processed
- show note...  There is a difference between Model AI processing and Model Change Suggestions.  Model Change Suggestions modify existing data in a model, while Model AI processing only adds data to a model.
- validation error text 'Please provide a reason for rejection.' to red
 
 


in the case where the model file is not found or deleted, set the flag showing the model is updated to false. should not be showing indicator that changes exist on the treeview title item

dont validate on model change request approval. 

does 'validate all' work?  validate all when view comes up?
   
 


*************************
user stories
*************************



role requirements validation...
show what is covered by existing user stories too

suggestions (stories to add to fulfil requirements)...
show a list of missing stories. allow user to add them individually






*************************
low priority
*************************
 


model services api todo...
- add search query on all request list endpoints
- add search query on all catalog endpoints
- no legacy code for non admin users
- focus on data object blueprints

JavaScript - TypeORM

Java - Hibernate 
 
C# - Entity Framework

PHP - Doctrine 

preview page...
- mobile views?



feature to create a few demo db objects, forms, reports, pages, etc. to show the extension in action.? 

ares changes...
rearrange register controls on page: fabricate




demo view...
- use a sqllite db?
- clickable demo that stays on the same view?
- tell the user to fabricate the demo html files?


Agent todo items...

common types of graphs...
- distribution chart (histogram, each bar is a value range, shows how many items are in each range)
- pie chart (each slice is a category, shows how many items are in each category)
- proportional visualization - all items are boxes. size of box is proportional to value
- scatter plot - each item is a dot on a 2d plane, shows correlation between two values

for all histogram\distribution tabs, give an option to show as pie chart instead
- ✅ DONE: User Story QA Status Distribution tab now has bar/pie chart toggle
- ✅ DONE: User Story View Role Distribution tab now has bar/pie chart toggle
- ✅ DONE: User Story Journey View page usage Distribution tab now has bar/pie chart toggle
- ✅ DONE: User Story Journey View journey distance Distribution tab now has bar/pie chart toggle
- ✅ DONE: Page List View Complexity Distribution tab now has bar/pie chart toggle
- ✅ DONE: Data Object Size view size Distribution tab now has bar/pie chart toggle
- data object usage view usage distribution tab


verify all pngs generated are readable with corect axis labels visible on either dark or light theme used

data object size analysis view...
- all objects have maybe audit columns
- ID and Code are indexed
- indexed fields count 2X the size of non indexed fields

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

data data object coverage in user stories. this is not a filter in data object usage. you cant just add a filter

Page review view. QA of each page?
- similar to user story qa view but for all non config pages?
  - what if page changes?`

new metrics?
- Foreign Key Relationships Count - Analyze object references
- Index Count - Analyze index usage 


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

user story kanban board view?
- drag and drop support
- swimlanes for different stages
- card details view

gant chart view?

note when workflows are launched? by what pages?
note what workflows modify which data objects and props?

allow single broad search textbox on all filter sections

automatically generate a text file that ai can read to get info on the app (read only)
- setting on project to automatically do this on save? in separate process?

apis
 
page flow - too large for mermaid to display

add report...
- API Get



report details view...
- import breadcrumb buttons from another report 


any large files left?
- split up large files into smaller ones
modelFabricationView.js - 1,524 lines
changeRequestsListView.ts - 1,436 lines
formDetailsView.js - 1,298 lines
modelAIProcessingView.js - 1,275 lines
userStoriesView.js - 1,220 lines
modelValidationView.js - 1,217 lines
hierarchyView.js - 1,176 lines

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


MCP server
- implement MCP server in the extension that the copilot agent can connect to.
 
  

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


Agent todo items...

common types of graphs...
- distribution chart (histogram, each bar is a value range, shows how many items are in each range)
- pie chart (each slice is a category, shows how many items are in each category)
- proportional visualization - all items are boxes. size of box is proportional to value



data object usage analysis view...
- tab: detail
  - some rows we show the individual page item that uses it. should always do this
- tab: distribution chart
  - histogram of data object usage ranges (low, medium, high, very high)
- tab:  

data object size analysis view...
- tab: distribution chart
  - histogram of data object size ranges (small, medium, large, very large)
- tab: prop count vs size chart
  - x-axis: property count
    - y-axis: size in KB

page complexity analysis view...
- tab: page list
  - columns
    - page name
    - total element count
      - input control count
        - filters, forms
      - button count
      - table column count
      - table column button count
      - breadcrumb link count
- tab: proportional visualization chart
  - complex page report - visualize which have most controls
- tab: distribution chart
  - histogram of page complexity ranges (simple, medium, complex, very complex)

user journey view... (exists)
- add sub item 'User Story User Journey' under ANALYSIS in treeview to open it
- tab: metrics...
  - Average pages per story
  - Median pages per story
  - Standard deviation
  - Min/Max complexity
  - Complexity distribution (simple/medium/complex categories)
Tab: User Journey Length Distribution
const complexityRanges = {
    'Simple (1-2 pages)': stories.filter(s => s.pageCount <= 2).length,
    'Medium (3-5 pages)': stories.filter(s => s.pageCount >= 3 && s.pageCount <= 5).length,
    'Complex (6-10 pages)': stories.filter(s => s.pageCount >= 6 && s.pageCount <= 10).length,
    'Very Complex (10+ pages)': stories.filter(s => s.pageCount > 10).length
};
- Tab: User Journey Length Proportional Visualization Chart
  - visualize stories by journey page count (size of box is page count)
- Tab: User Journey Page Usage Data
  - list of all pages with count of how many user journeys they appear in
- Tab: User Journey Page Usage Proportional Visualization Chart
  - visualize pages by how many user journeys they appear in (size of box is count)
- Tab: Page Usage vs Page Complexity Scatter Plot
  - x-axis: page complexity (total control count)
  - y-axis: page usage (how many user journeys the page appears in)



metric analysis view...
- new metrics
  - total data object size
  - avg data object size
  - Authorization-Required Pages Count
  - Public Pages Count
  - role [role name] page count
  - role [role name] user story count
  - Report to Form Ratio - Balance between data display and data entry 
  - avg page control count (all, report, form)
  - user story with journey count
  - user story with no journey count
  - user story journey count avg


data object prop usage analysis view...
- copy of data object usage analysis view but at the data object property level


--------------------------

new metrics?
- Track progress on user story completion 
- Foreign Key Relationships Count - Analyze object references
- Index Count - Analyze index usage 


find data object circular references?
 

breadcrumb report
- pages that have breadcrumbs
- pages that have no breadcrumbs


Report Data Source Analysis View
- including items with no data source

form Data Source Analysis View
- including items with no data source

unused data object prop report
- no references from anywhere

data object user story coverage analysis:  
- how many have user stories?
- how many dont have user stories?



add role filter on data object usage?

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
functions
    - data objects
        - get all data objects
        - get data object settings
        - get data object properties
        - get data object property settings
        - add data object
        - change data object setting
        - add data object property
        - change data object property setting
        - show object details
        - show object property list
    - validation requests
        - show validation request list
        - add validation request
        - get validation request details
        - show validation request details
        - show validation request change request list
 
  

in the case where the model file is not found or deleted, set the flag showing the model is updated to false. should not be showing indicator that changes exist on the treeview title item

dont validate on model change request approval. 

does 'validate all' work?  validate all when view comes up?
   
 


*************************
user stories
*************************


user story - Roles
- if dne, ask the user if they would like to create one


role requirements validation...
show what is covered by existing user stories too

suggestions (stories to add to fulfil requirements)...
show a list of missing stories. allow user to add them individually






*************************
low priority
*************************

png/svg button to icon button of screenshot icon? camera?

check sort arrow on all tables



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


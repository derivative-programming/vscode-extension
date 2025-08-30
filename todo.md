Agent todo items...



workflow - need add existing dft button


workflow details view - owner object display needs an edit button

general flow - input params - unnecessary settings

general flow - output vars  - unnecessary settings


allow add of general flow

allow add of page init flow (plus sign on page detail view next to empty display)

need lookup buttons on fk object name settings on flow view..
- general flow - input var
- general flow - output var
- page init flow - output var


report - add general flow modal - need lookup on Button Object WF Name setting

report column - need lookup on Button Object WF Name setting? are we displaying this property? are we showing a page lookup now?


report details view - test allow creation of column async flow button

report details  column - add button - multiselect
 
add report col by selection of one or more properties in data object lineage

form details button tab button type setting dropdown?  

data object reference list view - show where it is used - with counts - new view ...
- report header
- report column
- form control
- form header
- form output var
- init page flow output var
- general flow output var
- workflow

data object user story  reference count

data object prop reference list view - show where prop is used - new view off - with counts -  data object reference list view ....
- report header
- report column
- form control
- form header
- form output var
- init page flow output var
- general flow output var


user stories - page coverage view?
list all pages and show which have been mapped to a user story?


data object user story action distribution...
(view all, view, add, update, delete) across objects in user stories

page preview - report header - show source of data 
page preview - report column - show source of data 
page preview - form header - show source of data 
page preview - form control - show source of data 


`
report data source view... list columns and their source data object and prop

form data source view... list controls and their source data object and prop

workflow - show task flow diagram using mermaid

page usage...
in all user journeys we can get a count of pages that are used most

page list - data object prop dependency count on each page?

analysis treeview item... ask ai for ideas
- metrics - page count, user story count, data object count, workflow count, form count, report count
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


allow export on all tables

automatically generate a txt file that ai can read to get info on the app (read only)

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
 
  
test:When completed, create a report item in the owner data object report array. Add the new report item to the treeview. Open the new report item in the report details view.

in the case where the model file is not found or deleted, set the flag showing the model is updated to false. should not be showing indicator that changes exist on the treeview title item

dont validate on model change request approval. 

does 'validate all' work?  validate all when view comes up?
   

report items...
extension...
{
                "name": "CustomerUserCustomerRoleTest",
                "titleText": "Customer User Customer Role",
                "visualizationType": "grid",
                "isCustomSqlUsed": "false",
                "isPage": "true",
                "reportColumn": [
                  {
                    "name": "TestCol"
                  }
                ],
                "reportButton": [
                  {
                    "buttonName": "Back",
                    "buttonText": "Back",
                    "buttonType": "back"
                  },
                  {
                    "buttonName": "TestBtn"
                  }
                ],
                "reportParam": [
                  {
                    "name": "TestFilter"
                  }
                ],
                "isAuthorizationRequired": "true",
                "roleRequired": "User",
                "layoutName": "UserLayout",
                "targetChildObject": "CustomerRole"
              }
win app...

              {
                "isCustomSqlUsed": "false",
                "isPage": "true",
                "layoutName": "UserLayout",
                "name": "CustomerUserCustomerEmailRequestListTest",
                "reportButton": [
                  {
                    "buttonName": "Back",
                    "buttonText": "Back",
                    "buttonType": "back"
                  },
                  {
                    "buttonName": "TestBtn",
                    "buttonText": "Test Btn",
                    "buttonType": "other"
                  },
                  {
                    "buttonName": "CustomerUserCustomerEmailRequestListTestBreadcrumb",
                    "buttonType": "breadcrumb",
                    "destinationContextObjectName": "Customer",
                    "destinationTargetName": "CustomerUserCustomerEmailRequestListTest"
                  }
                ],
                "reportColumn": [
                  {
                    "isButton": "false",
                    "name": "TestCol"
                  },
                  {
                    "buttonText": "TestDestBtn",
                    "destinationContextObjectName": "CustomerEmailRequest",
                    "destinationTargetName": "CustomerEmailRequestConfigDetails",
                    "isButton": "true",
                    "isVisible": "true",
                    "name": "TestDestBtnLinkCustomerEmailRequestCode",
                    "sourceObjectName": "CustomerEmailRequest",
                    "sourcePropertyName": "Code",
                    "sqlServerDBDataType": "uniqueidentifier"
                  },
                  {//TODO async flow btn
                    "buttonText": "TestAsyncFlowBtn",
                    "destinationContextObjectName": "CustomerEmailRequest",
                    "destinationTargetName": "CustomerEmailRequestAdminGetAttachment",
                    "isButton": "true",
                    "isButtonAsyncObjWF": "true",
                    "isVisible": "true",
                    "name": "TestAsyncFlowBtnLinkCustomerEmailRequestCode",
                    "sourceObjectName": "CustomerEmailRequest",
                    "sourcePropertyName": "Code",
                    "sqlServerDBDataType": "uniqueidentifier"
                  }
                ],
                "reportParam": [
                  {
                    "name": "TestFilter"
                  }
                ],
                "roleRequired": "User",
                "targetChildObject": "CustomerEmailRequest",
                "titleText": "Customer User Customer Email Request List Test",
                "visualizationType": "Grid"
              },


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


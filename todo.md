Agent todo items...



report details view...
- allow creation of column destination button
- allow creation of column async flow button
- add button - multiselect
- add button - breadcrumb

prop subscriptions
"propSubscription": [
              {
                "destinationContextObjectName": "AIAssistantThread",
                "destinationTargetName": "AIAssistantThreadConfigDetails",
                "isIgnored": "true"
              }
            ],

report...
- columns - subscribe to owner obj properties
- columns - subscribe to target child obj properties


forms...
- columns - subscribe to owner obj properties
- columns - subscribe to target child obj properties


  
objectworkflows where ispage = false...
- new treeview item functions



 

apis
 

preview form...
- show actual lookup items in dropdowns
- header display

preview report grid view...
- header display

- preview report navigation view...
- header display

preview report three column view...
- header display


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

 

many labels: "Sql Server DB Data Type" > "DB Data Type"

help icon buttons on primary treeview items...
- object
- form
- report
- page

form detail view...
- input variables tab
 
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
                  {//TODO breadcrumb
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
                  {//TODO dest btn
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

when adding or importing a story, checkbox to optionally automatically add the object and role if they do not exist. checkbox on each

user story - Roles
- open role data object details page
- if dne, ask the user if they would like to create one

user story - Role requirements page...
option to add a role object if dne
list all roles in dropdown
button to open role lookup item list
for each role, what objects should they be able to view all, view, add, update, and/or delete
down to the data object property, not just data object name
simple checkbox to mark each requirement.
one big grid to see all possibilities and easily check what is required
generate user stories from this
show what is covered by existing user stories too
show a list of missing stories. allow user to add them individually
restricting access to actions is just as important as allowing access to actions
can restrict at object level too
filter on multiple roles?
access options... unassigned, allowed, required, not allowed (radio buttons)
go down a list, not a table. it will be so long the column headers will be out of sight
option to hide lines not assigned yet
each data object has a collapsible list under it, showing all properties
allow restrict all or allow all option on all actions for one click update
assignment at object level sets all properties to that value

role requirements validation...
if you cant view or view all, you cant edit or delete

user story - story list
on user story list show the page that fulfils it and view\edit icon buttons.
show number of pages from login that it needs to reach it to perform the action.

user story - page mapping...
need to be able to map a user story to one or more pages that cover it
create a new json file that holds this data
button to run process to make best guess
lookup icon next to each page name textbox. filter on role and object in story
allow multiple pages per story

user story - fulfillment report...
give requirements and stories and story-page mapping, show which requirements are not fulfilled. 
mapped page must have a path from the login page
role must be allowed to view all pages in path

user story journey - user page flowchart...
show a flowchart that shows what the user must do to get there

user story journey- page preview...
show page preview view with highlighted buttons on how to get there.

user story - QA...
show a list of all user stories and track which have been QA'd
hold qa notes
status - pending, started, success, failure

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


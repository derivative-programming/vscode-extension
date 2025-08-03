Agent todo items...

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



demo view...
- use a sqllite db?
- clickable demo that stays on the same view?
- tell the user to fabricate the demo html files?

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

create many diff treeview report items? under report treeview item?...
- navigation page
- table page
- detail page


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

 


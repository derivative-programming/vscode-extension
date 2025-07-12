Agent todo items...

any large files left?
- split up large files into smaller ones
modelFabricationView.js - 1,524 lines
changeRequestsListView.ts - 1,436 lines
formDetailsView.js - 1,298 lines
modelAIProcessingView.js - 1,275 lines
userStoriesView.js - 1,220 lines
modelValidationView.js - 1,217 lines
hierarchyView.js - 1,176 lines
 

test all views in dark mode

stop validating a\bulk change request on approval?

obj view add prop modal...
- add lookup tab. sample json created...
{
  "fKObjectName": "DataSourceType",
  "fKObjectPropertyName": "DataSourceTypeID",
  "isFK": "true",
  "isFKLookup": "true",
  "name": "DataSourceTypeID"
},

data obj lookup item tab...
- onece checked, the checkbox should be disabled and not editable
- custom int prop 1 value doesnt change when list selection changes

prop subscriptions
 

many labels: "Sql Server DB Data Type" > "DB Data Type"


help icon buttons on primary treeview items...
- object
- form
- report
- page

test:issue with default values in the inactive dropdowns 

form detail view...
- rename tabs
- rename columns to controls
- add form wizard

treeview...
- add Page treeview item
- move reports and forms under page treeview item

create many diff treeview report items? under report treeview item?...
- navigation page
- table page
- detail page

page treeview item...
- page flow diagram
  - form buttons have a destinationtargetname property that holds the name of its form or report destination
  - report buttons have a destinationtargetname property that holds the name of its form or report destination
  - report columns can have a buttondestinationtargetname property that holds the name of its form or report destination
- allow filtering on role required on page flow diagram

sample page views...
- form
- report grid
- report two col nav
- report three col detail

demo view...
- use a sqllite db?
- clickable demo that stays on the same view?
- tell the user to fabricate the demo html files?

cant use ctrl-a as first part of sequence. its select all.

report details view...
- default values for inactive dropdowns seem incorrct. formdetails view too.

fabrication requests view...
- add a button to open the output folder in the file explorer
- allow for a deployment script to be run after fabrication results are downloaded
 
find large files and split them up


'there is no data provider registered....' on startup  

'list' and 'table' view icon toggle buttons
 
add report wizard has dif step design than add data object wizard

report details view...
- allow creation of column destination button
- allow creation of column async flow button
- add button - multiselect
- add button - breadcrumb
- import breadcrumb buttons from another report
- columns - subscribe to owner obj properties
- columns - subscribe to target child obj properties

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
        - show object property table
    - validation requests
        - show validation request list
        - add validation request
        - get validation request details
        - show validation request details
        - show validation request change request list

add report...
- API Get

  
test:When completed, create a report item in the owner data object report array. Add the new report item to the treeview. Open the new report item in the report details view.

in the case where the model file is not found or deleted, set the flag showing the model is updated to false. should not be showing indicator that changes exist on the treeview title item

dont validate on model change request approval. 

does 'validate all' work?  validate all when view comes up?
   
bulk add on enter key should not submit modal form

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

model services api todo...
- add search query on all request list endpoints
- add search query on all catalog endpoints
- no legacy code for non admin users
- focus on data object blueprints

JavaScript - TypeORM

Java - Hibernate 
 
C# - Entity Framework

PHP - Doctrine 



ares changes...
rearrange register controls on page: fabricate

 


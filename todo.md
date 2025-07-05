Agent todo items...

tell users about the repo with the win app version of the extension
- help view
- readme

welcome view...
- add text describing the types of uis that can be generated (fabricated) from the model



welcome view new Step 3. text...
- Add pre-configured features to your model to get a head start. They are added during the 'AI Processing' Phase.

cant use ctrl-a as first part of sequence. its select all.


fabrication requests view...
- details modal should not close if clicking outside the modal (others do this correctly already)
- add a button to open the output folder in the file explorer
- allow for a deployment script to be run after fabrication results are downloaded


register view...
- remove cancel button


- object Hierarchy Diagram view...
- 'Show Lookup Data Objects' should not hide items if its children are non-lookup items
- reset button should reset the view to the initial state. seems like its a little differnt.
- details modal should have a close (x) button in the top right corner
- details modal should have close button in the bottom right corner
- details modal should show data type on each property
- 'Expand All' should use icon instead of text
- 'Collapse All' should use icon instead of text
- no blue background on icon buttons

'there is no data provider registered....' on startup  

'list' and 'table' view icon toggle buttons
 

report details view...
- separate tab for breadcrumb buttons
- allow creation of column destination button
- allow creation of column async flow button

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



update welcome...
If we can create a model of your application, then we can generate a large amount of source code automatically. The source code generated can be for many different language (.net, python, etc.) and for many diffierent application types (Web, IOS App, Android App, Augmented Reality App, Virtual Reality App, etc.). Once generated, you can pull in any of the generated source code you like into your own source code repository.  
 

 
help view...
link to discussion board

test:When completed, create a report item in the owner data object report array. Add the new report item to the treeview. Open the new report item in the report details view.

in the case where the model file is not found or deleted, set the flag showing the model is updated to false. should not be showing indicator that changes exist on the treeview title item

add welcome step to update project settings view

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

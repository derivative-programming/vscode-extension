Agent todo items...


data object details view properties tab...
- add a object name search modal. for 'fk object name' 

make extension repo public
 
Add User Story modal...
when opening modal, focus on the 'story text' textbox so the cursor will be inside it.


Object Heirarchy diagram...
When open, focus on the 'search objects' textbox so the cursor will be inside it.


add data object wizard step 1...
when open, put focus on the 'Yes' radio button.
On enter key, hit the 'next' button

add data object wizard step 2...
- when open, focus on the 'search parent objects' textbox
- on enter key, hit the next button if its enabled
- Display of step 2 depends on the value of step 1. If I go back to step 1 and change the value, then step 2 should update to reflect the new value.

data object wizard step 3...
- when open, focus on the 'data object name' textbox
- on enter key, hit the 'create object' button if its enabled

data object view - add propert modal - single property tab...
- when open, focus on the 'property name' textbox
- on enter key, hit the 'add property' button if its enabled

data object view - add propert modal - bulk properties tab...
- when open, focus on the 'property name' textbox
- on enter key, hit the 'add properties' button if its enabled

report details view - add column modal - single column tab...
- when open, focus on the 'column name' textbox
- on enter key, hit the 'add column' button if its enabled

report details view - add column modal - bulk columns tab...
- when open, focus on the 'column name' textbox
- on enter key, hit the 'add columns' button if its enabled

report details view - add button modal...
- when open, focus on the 'button name' textbox
- on enter key, hit the 'add button' button if its enabled

report details view - add parameter modal - single parameter tab...
- when open, focus on the 'parameter name' textbox
- on enter key, hit the 'add parameter' button if its enabled

report details view - add parameter modal - bulk parameters tab...
- when open, focus on the 'parameter name' textbox
- on enter key, hit the 'add parameters' button if its enabled

report details view - all tabs...
for some reason at the bottom of all tabs there is an embedded 'Add Column' section and 'add filter' section

object details view...
- hide setting 'is lookup'
- lookup item list
    only show if is lookup object
    -buttons ... add, move up, move down
    - list
    - properties... customIntProp1Value, description, displayName, isActive.
    - add button... modal, allow single or bulk.
 
test 'add' buttons...
- data object details - properties tab
- add lookup item
- report details - columns tab
- report details - buttons tab
- report details - parameters tab
  

change requests... 
- on approve all, show processing animation while all are processed
- show note...  There is a difference between Model AI processing and Model Change Suggestions.  Model Change Suggestions modify existing data in a model, while Model AI processing only adds data to a model.
- validation error text 'Please provide a reason for rejection.' to red
 
  
 
model fabrication download...
 When done, show a message to the user that the results have been downloaded and unzipped into the fabrication_results folder. Instruct the user to create and run a script to copy the desired files from the fabrication_results folder to the project source code folder.  
 

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
- grid
- detail
- API Get
- Navigation

add db object...
- general
- lookup



update welcome...
If we can create a model of your application, then we can generate a large amount of source code automatically. The source code generated can be for many different language (.net, python, etc.) and for many diffierent application types (Web, IOS App, Android App, Augmented Reality App, Virtual Reality App, etc.). Once generated, you can pull in any of the generated source code you like into your own source code repository.  

Step 3. text...
- Add pre-configured features to your model to get a head start. They are added during the 'AI Processing' Phase.

val error...'It is not necessary to have Lookup in the name'

max length validation rules?
100 chars by default... report col, rpt filter.
50... lookup item names

examples...
this...
{
    "name": "TestLookup",
    "parentObjectName": "Pac",
    "prop": [
        {
        "name": "PacID",
        "sqlServerDBDataType": "int",
        "isFK": "true",
        "isNotPublishedToSubscriptions": "true",
        "isFKConstraintSuppressed": "false"
        }
    ],
    "propSubscription": [],
    "modelPkg": [],
    "lookupItem": []
}
win app...
{
    "isLookup": "true",
    "lookupItem": [
        {
        "description": "",
        "displayName": "",
        "isActive": "true",
        "name": "Unknown"
        }
    ],
    "modelPkg": [],
    "name": "TestLookip",
    "parentObjectName": "Pac",
    "prop": [
        {
        "isFK": "true",
        "isFKConstraintSuppressed": "false",
        "isFKLookup": "true",
        "isNotPublishedToSubscriptions": "true",
        "name": "PacID",
        "sqlServerDBDataType": "int"
        }
    ],
    "propSubscription": []
    },


this...
{
"name": "TestObj",
"parentObjectName": "Pac",
"prop": [
    {
    "name": "NewProp"
    },
    {
    "name": "PacID",
    "sqlServerDBDataType": "int",
    "isFK": "true",
    "isNotPublishedToSubscriptions": "true",
    "isFKConstraintSuppressed": "false"
    }
],
"propSubscription": [],
"modelPkg": [],
"lookupItem": []
}
win app....
{
"lookupItem": [],
"modelPkg": [],
"name": "TestObj",
"parentObjectName": "Pac",
"prop": [
    {
    "name": "NewProp"
    },
    {
    "isFK": "true",
    "isFKConstraintSuppressed": "false",
    "isNotPublishedToSubscriptions": "true",
    "name": "PacID",
    "sqlServerDBDataType": "int"
    }
],
"propSubscription": []
}



add report...
The 'REPORT' treeview item needs a 'plus'(+) icon button so we can add a report. On click, view a new 'Add Report Wizard' view.  Similar design to the 'Add Data Object Wizard' view.

First step will be to select the 'Owner Data Object'.  

If there is a 'Role' data object then the next step is to select the Role required to run the report. (show a list of Role data object lookupItem arran items. show the displayName of the lookup item).  

next step is to select the visualization type. (show 'grid' as 'Table', hide the chart items, hide tree, hide cards, show DetailTwoColumn as 'Navigation', show DetailThreeColumn as 'Detail', hide FolderWithdetail). 

if grid is selected, then the next step is to select the target data object. This is the data object that will primarily be shown in the table. Generally is a child of the owner data object.

next step is to ask for the report name. prefill the textbox in the format...
- [Owner Data Object Name] + [Role required] + ' ' + [Target Data Object Name if grid] + ['Detail' if DetailThreeColumn]  + ['Dashboard' if DetailTwoColumn].  No spaces or special characters are allowed. It cannot start with a number. 100 characters max. Ask for pascal case, similar to as we ask when creating a data object.

next step is to ask for the report Title. Prefile the textbox with a title derived from the report name. 100 characters max.

When completed, create a report item in the owner data object report array. Add the new report item to the treeview. Open the new report item in the report details view.
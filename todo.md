Agent todo items...

'there is no data provider registered....' on startup

make extension repo public

 
object details view...
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


max length validation rules?
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

  
test step 2 if no role data obect
 


test:When completed, create a report item in the owner data object report array. Add the new report item to the treeview. Open the new report item in the report details view.

in the case where the model file is not foudn or deleted, set the flag showing the model is updated to false. should not be showing indicator that changes exist on the treeview title item
 

add welcome step to update project settings view
   


need to adjust datetimes to timezone in profile, or local computer timezone
  

cancel option on model ai processing request?

dont validate on model change request approval. 

does 'validate all' work?  validate all when view comes up?


normal users should not get legacy code
 
  
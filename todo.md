Agent todo items...
    
  
treeview...
- add a filter button. show a textbox to filter the treeview by name.  The filter should be case insensitive and should match any part of the name.  The filter should be applied to all nodes in the treeview, including sub-nodes.  The filter should be cleared when the user clicks the 'Clear Filter' button.

data object title treeview item...
- add a button to show the heirarchy of all of the data objects in a new view. all data objects have a parent and child relationship.  The view should show the parent data object at the top, with all of its child data objects below it.  The view should also show the properties of each data object, with the property name and value. the view should be scrollable and should allow the user to expand and collapse each data object to show or hide its properties.  The view should also allow the user to filter the data objects by name, as described above. the diagram should flow left to right, with the parent data object on the left and its child data objects on the right.  The view should also allow the user to zoom in and out, and to pan around the diagram.  The view should also allow the user to select a data object to show its details in a separate view.
- the add button on the data object title treeview item seems to only be visible when you hover over it.  It should always be visible, or at least more visible.  It is too easy to miss it.


Add data object wizard view...
- step 1: is the object a lookup object?

- step 2: select a parent data object.  The parent data object should be selected from a list of all data objects.  The list should be searchable, and should allow the user to filter the data objects by name, as described above. A selection is requred.  if this is a lookup object, the parent object is 'Pac' and is not changeable.

- step 3: enter a name for the new data object.  The name should be validated to ensure that it is not empty, does not contain spaces, and contains only alpha characters.  If the name is invalid, an error message should be displayed. Use PascalCase for the name.  The name should be unique, and should not already exist in the model.  If the name already exists, an error message should be displayed.


fitler reprot items...
On Report Title treeview item add a filter icon button. On click, show a textbox to filter the treeview by name.  The filter should be case insensitive and should match any part of the name.  The filter should be applied to all nodes in the treeview, including sub-nodes.  The filter should be cleared when the user clicks the 'Clear Filter' button.


change requests... 
- show note...  There is a difference between Model AI processing and Model Change Suggestions.  Model Change Suggestions modify existing data in a model, while Model AI processing only adds data to a model.
- validation error test 'Please provide a reason for rejection.' to red
 

- implement 'add property' 
i need to handle the 'add property' button. I need to ask for the property name but i also need to give an option to allow the user to 'bulk add' multiple properties and give them a multi line textbox to add a property for each line entered. validation rules... 1. no spaces allowed in names. 2. alpha characters only.
 

sub folders...
- put a ".app_dna_" at the start of the folder names
      
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



home page...

  
step 2: should watch for login event and refresh the welcome view

step 2: button  'View Model Feature Catalog' to show view, only show if model loaded

step 3: button  'Request Model AI Processing' to show view, only show if model loaded

step 4: button  'Request Model Validation' to show view, only show if model loaded



step 5: button 'View Fabrication Blueprint Catalog' to show view, only show if model loaded

step 6: button  'Request Model Fabrication' to show view, only show if model loaded

 
  
   

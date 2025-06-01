Agent todo items...
    
  
treeview...


obj hierarchy view...
- refresh button should recalculate hierarchy.
- (copilot assigned) zoom in and zoom out buttons are having issues. when you use one of them, the other stops working.
- zoom in and zoom out buttons should have icons on buttons.

object details view...
- (copilot assigned) tab title shows 'Details for <object name>'.  Should be 'Details for <object name> Data Object'.

report details view...
- (copilot assigned) when model file is updated, refresh the report details view. we do this with the object details view now.
- (copilot assigned) report details buttons tab should work similar to the object details 'properties' tab
- report details columns tab should work similar to the object details 'properties' tab
- report details parameters tab should work similar to the object details 'properties' tab

Add data object wizard view...
- (copilot assigned) fix dark blue color.


filter report items...
(copilot assigned) On Report Title treeview item add a filter icon button. On click, show a textbox to filter the treeview by name.  The filter should be case insensitive and should match any part of the name.  The filter should be applied to all nodes in the treeview, including sub-nodes.  The filter should be cleared when the user clicks the 'Clear Filter' button.


change requests... 
- show note...  There is a difference between Model AI processing and Model Change Suggestions.  Model Change Suggestions modify existing data in a model, while Model AI processing only adds data to a model.
- validation error text 'Please provide a reason for rejection.' to red
 

- implement 'add property' 
i need to handle the 'add property' button. I need to ask for the property name but i also need to give an option to allow the user to 'bulk add' multiple properties and give them a multi line textbox to add a property for each line entered. validation rules... 1. no spaces allowed in names. 2. alpha characters only.
 

sub folders...
- put a ".app_dna_" at the start of the folder names
      
model fabrication download...
 When done, show a message to the user that the results have been downloaded and unzipped into the fabrication_results folder. Instruct the user to create and run a script to copy the desired files from the fabrication_results folder to the project source code folder.  

model fabrication request details...
- (copilot assigned) fix display when downloading results.
- display the fabrication request code under the status.

model validation request details...
- (copilot assigned) show text instead of text boxes, similar to the fabrication request details view.


model ai processing request details...
- (copilot assigned) show text instead of text boxes, similar to the fabrication request details view.

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

  
(copilot assigned) step 2: should watch for login event and refresh the welcome view

step 3: button  'View Model Feature Catalog' to show view, only show if model loaded

step 4: button  'Request Model AI Processing' to show view, only show if model loaded

step 5: button  'Request Model Validation' to show view, only show if model loaded

step 6: button 'View Fabrication Blueprint Catalog' to show view, only show if model loaded

step 7: button  'Request Model Fabrication' to show view, only show if model loaded


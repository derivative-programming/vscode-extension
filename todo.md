Agent todo items...
    

allow log if issues in extension. 
- on github?


welcome...
- disable fabrication button until blueprint selected
- show link to open source link of extension on github

obj hierarchy view...
- refresh button should recalculate hierarchy.
 
model fabrication req details...
- 'Fabrication results have been downloaded and extracted successfully.' is in green background with black text. hard to read


report details view...
- test all tabs
    - settings
    - columns
    - buttons
    - params

- report details view - parameters tab should work similar to the object details view 'properties' tab, including the list and table view options


change requests... 
- on approve all, show processing animation while all are processed
- show note...  There is a difference between Model AI processing and Model Change Suggestions.  Model Change Suggestions modify existing data in a model, while Model AI processing only adds data to a model.
- validation error text 'Please provide a reason for rejection.' to red
 

- implement 'add property' 
i need to handle the 'add property' button. I need to ask for the property name but i also need to give an option to allow the user to 'bulk add' multiple properties and give them a multi line textbox to add a property for each line entered. validation rules... 1. no spaces allowed in names. 2. alpha characters only.
  
      
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


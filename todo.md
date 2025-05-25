Agent todo items...
    
 
model feature catalog view...
- add intro text to the top of the page under title

model validation request list...
- add intro text to the top of the page under title 

model change request list...
- fix display of intro text.    
 
fabrication blueprint catalog view...
- intro text should be under the title 
 
   
model validation rejection validaiton using an alert instead of validaiton error text... Please provide a reason for rejection.
     

change requests...
- on approval verify the old value is still the same. if not, show as 'out of date' in status
- implement apply. if old value does not match the current value. reject with reason 'out of date'.
- show note...  There is a difference between Model AI processing and Model Change Suggestions.  Model Change Suggestions modify existing data in a model, while Model AI processing only adds data to a model.
 
 

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

 

step 1: create button to create a new model,  


step 2: should be 'register or login to AppDNA Model Services'.   move all other later steps +1

step 2: button  'View Model Feature Catalog' to show view, only show if model loaded

step 3: button  'Request Model AI Processing' to show view, only show if model loaded

step 4: button  'Request Model Validation' to show view, only show if model loaded



step 5: button 'View Fabrication Blueprint Catalog' to show view, only show if model loaded

step 6: button  'Request Model Fabrication' to show view, only show if model loaded

 


left sidebar tree view...
 
test: switch location of expand and collapse

 
 

save button... keyboard shortcut of 'ctrl-a S'.  adding db object is ctrl-a O
  

Model Feature catalog....

add a filter textbox

allow sort on selected checkbox column



fabrication blueprint catalog....


add a filter textbox

allow sort on selected checkbox column

  
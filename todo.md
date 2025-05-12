Agent todo items...
   
model ai processing details...
- model ai processing result has a property modelPrepRequestResultModelUrl.
- the api has an endpoint https://modelservicesapi.derivative-programming.com/api/v1_0/model-merge that accepts a POST request with a json body {
"modelFileData": "string",
"additionsModelUrl": "string"
}
- i need a 'merge results into model' button that will call this endpoint with the model file data and the modelPrepRequestResultModelUrl.
- the response of merge is resultModelUrl.  download this and save it to the model file.



model feature catalog view...
- use similar style and design as the model validation request list.
- use similar paging controls and page range display as the model validation request list.
 
 
when the model file changes, we automatically update the model singleton. It should also update any open 'model feature catalog' views or 'fabrication blueprint catalog' views.
 
fabrication blueprint catalog view...
- use similar style and design as the model validation request list.
- use similar paging controls and page range display as the model validation request list.
  

 

project settings view... test change on all settings 
   
  
- model service request lists (validation, ai processing, fabrication)
    - page size dropdown
    - if one is processing or queued on the page, auto refresh every minute.
 

handle if no connection using model services
 

model validation rejection validaiton using an alert instead of validaiton error text... Please provide a reason for rejection.
     

change requests...
- approve all button
- reject all button
- on approval verify the old value is still the same. if not, show as 'out of date' in status
- show rejection reason under the rejection status? 
- Apply all approved btn
- implement apply. if old value does not match the current value. reject with reason 'out of date'.
- show rejection reason in button column.   
- show note...  There is a difference between Model AI processing and Model Change Requests.  Model Change requests modify existing data in a model, while Model AI processing only adds data to a model.
- both sort arrows are displayed.
- use checkboxes on each row, instead of 'apply all, rejected, approved' buttons.   
 
 

- implement 'add property' 
i need to handle the 'add property' button. I need to ask for the property name but i also need to give an option to allow the user to 'bulk add' multiple properties and give them a multi line textbox to add a property for each line entered. validation rules... 1. no spaces allowed in names. 2. alpha characters only.

welcome screen...
- show steps in this workflow
    - create a new project model
        - A model is held in a json file in your project.
    - From Model Services, add Model Features
        - select from a catalog of features 
    - From Model Services, request Model AI Processing
        - submit the model to the Model AI processing service
        - download the model results when complete
            - AI processing adds data to the model.  It does not change existing data in the model.
    - From Model Services, request Model Validation
        - submit the model to the Model Validation service
        - download the model results when complete
        - approve and apply any change requests
            - Model Validation modifies existing data in the model.  It does not add new data to the model.
    - From Model Services, select Blueprint Selection
        - blueprints define the type of files you want to fabricate.
    - From Model Services, request Model Fabrication
        - submit the model to the Model Fabrication service
        - download the fabrication results when complete
        - in the fabrication_results folder, you will find generated source code. Copy what you need to your project from here to your source code folder.

 
sub folders...
- put a ".app_dna_" at the start of the folder names
    
treeview...
clicking an item that is already open should not open it again.  It should just focus on the already open item.

all views...
- if the model file chagnes, reload the view

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

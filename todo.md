Agent todo items...
 

model fabrication request details...
on model fabrication request list view, on click of the details button, show the details of the request in a modal.  This should show the details of the request, including the status, and any errors that occurred during processing. This is similar to the model validation details modal, but no 'download report', 'view report', or 'view change requests' buttons.

model fabrication download...
  The user should be able to download the results of the request from this modal. the modelFabricationRequestResultUrl has the url of a zip file that contains the results of the request.  The user should be able to download this file from the details modal.  On download...
- create a fabrication_results folder in the project directory if it does not exist.
- delete the contents of the fabrication_results folder if it exists.
- download the zip file to the fabrication_results folder.
- unzip the zip file into the fabrication_results folder.
- show a message to the user that the results have been downloaded and unzipped into the fabrication_results folder.
- show a processing animation during the download and unzip process. During the unzip process, you should be able to know the number of files in the zip, so you can show a progress bar to the user.  iterate through the files, update the progress bar, and unzip the individual file into the fabrication_results folder.  When done, show a message to the user that the results have been downloaded and unzipped into the fabrication_results folder. Instruct the user to create and run a script to copy the desired files from the fabrication_results folder to the project source code folder.  

 
model ai processing details...
on model ai processing request list view, on click of the details button, show the details of the request in a modal.  This should show the details of the request, including the status, and any errors that occurred during processing. This is similar to the model validation details modal, but no 'download report', 'view report', or 'view change requests' buttons.

project tree view item...
In the tree view we current show a 'Data Objects' item.  I also need a tree view item to show other setting of the project. Create a 'Project' treeview Item above the 'Data Objects'. Create a 'Settings' sub item under the 'Project' treeview item.

project settings view...
When the 'Project' item is selected, show the project properties view in primary pane.  This will show all the simple name\value properties of the rootModel node and the first namespaceModel node.  This will be similar to the settings tab of a Object details view (but no tab)

lexicon treeview item...
Under the 'Project' 'Settings' treeview item, show a 'Lexicon' item. On click of the Lexicon item, show a 'Lexicon' view in the primary pane. The lexicon view will show all lexicon items in the first root namespace item. Show a table of name\value pairs with a row for each lexicon item. The first column will show the 'internalTextValue' property and the second column will show the displayTextValue in a textbox. When the user modifies the textbox, it also modifies the corresponding displayTextValue in the model held in modelservice memory.

Allow sort on the first Lexicon column 'Name' and second lexicon column 'Value'

Allow a search to filter the displayed rows using text typed by the user


user stories treeview item...
Under the 'Project' 'Settings' treeview item, show a 'User Stories' item. On click of the 'User Stories' item, show a 'User Stories' view in the primary pane. The 'User Stories' view will show all userStory items in the first root namespace item. Show a table with a row for each userStory item. show a column for the storyNumber and a column for the storyText. 

Allow sort on the two columns

Allow a search to filter the displayed rows using text typed by the user


add user story...
show an 'Add User Story' button. When clicked, show a modal dialog with a  textbox for the user to enter the story text. show a label letting the user know the expected format of the story text. something like... 'Format... \'A [Role name] wants to [View all, view, add, update, delete] a [object" +
    " name]'. When the user clicks 'OK', add a new userStory item to the model with the entered value as storyText. name will be a new guid value. storyNumber will be NULL. isIgnored and isStoryProcessed is false.
Validate that the new story text follows the format, but the role or object does not need to already exist. validate that the story text does not already exist. 
 
user story csv...
allow download of a csv file of the two columns.

allow upload of a csv with a single column holding story text, or two columns holding story number and story text columns. if no story number in the row, try to add the storyitem. use similar validation as the add modal. if validaiton is not passed, then skip the row.


prepop request description...
on add of model validation request, prepop description with root node values projectName and projectVersion Number  in format  'Project: [projectName], Version: [projectVersion]'


on add of model ai processing request, prepop description with root node values projectName and projectVersion Number  in format  'Project: [projectName], Version: [projectVersion]'


on add of model fabrication request, prepop description with root node values projectName and projectVersion Number  in format  'Project: [projectName], Version: [projectVersion]'


 

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
- show a details button for each change request. when clicked, show the details of the change request in a new view.
- Apply all approved btn
- implement apply. if old value does not match the current value. reject with reason 'out of date'.
- show rejection reason in button column.   
- show note...  There is a difference between Model AI processing and Model Change Requests.  Model Change requests modify existing data in a model, while Model AI processing only adds data to a model.
- both sort arrows are displayed.
- use checkboxes on each row, instead of 'apply all, rejected, approved' buttons.  

- ai processing requests (similar to validation requests)
    - https://modelservicesapi.derivative-programming.com/api/v1_0/prep-requests 
    - show the details of each request.     
    - details
        - download report
        - view report
        - download results (merge)

- fabrication requests
    - https://modelservicesapi.derivative-programming.com/api/v1_0/fabrication-requests 
    - show the details of each request.     
    - download results
        - to fabrication_results sub folder

Model Features...
- add a 'Model Features' item under 'Project' in the tree view.  This will show all the features in the model.  The user can select a feature and see the details of that feature.  The user can also add a new feature to the model.
- create a model feature list view

Lexicon...
- add a 'Lexicon' item under 'Project' in the tree view.  This will show all the lexicons in the model.  The user can select a lexicon and see the details of that lexicon.  The user can also add a new lexicon to the model.
- create a lexicon list view

User Stories...
- add a 'User Stories' item under 'Project' in the tree view.  This will show all the user stories in the model.  The user can select a user story and see the details of that user story.  The user can also add a new user story to the model.
- create a user story list view

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

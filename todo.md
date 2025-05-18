Agent todo items...
     
model feature catalog view...
- [✓] click on row should check the checkbox
- selecting an item should set the unsaved changes flag
- add intro text to the top of the page under title
- use similar paging controls and page range display as the model validation request list.

model ai processing request list...
- refresh button should show a spinner when clicked
- Add modal: switch add and cancel button locations

model validation request list...
- add intro text to the top of the page under title
- Add modal: switch add and cancel button locations
- refresh button should show a spinner when clicked

model change request list...
- fix display of intro text.    
- disable alert when bulk approving change request
- show spinner when procesing 'approve selected'
- show spinner when procesing 'reject selected'
- show spinner when procesing 'apply all approved'
 
fabrication blueprint catalog view...
- click on row should check the checkbox
- selecting an item should set the unsaved changes flag
- intro text should be under the title
- use similar paging controls and page range display as the model validation request list.
  
model fabrication request list...
- add intro text to the top of the page under title
- details button is not working
 

test change on all settings ..
- project settings - done
- lexicon - done
- user stories - done
- model feature catalog - done
- model fabrication blueprint catalog - done
- object details - settings tab - done
- object details - properties tab
- 

   
  
- model service request lists (validation, ai processing, fabrication)
    - page size dropdown
    - if one is processing or queued on the page, auto refresh every minute.


model validation rejection validaiton using an alert instead of validaiton error text... Please provide a reason for rejection.
     

change requests...
- on approval verify the old value is still the same. if not, show as 'out of date' in status
- implement apply. if old value does not match the current value. reject with reason 'out of date'.
- show note...  There is a difference between Model AI processing and Model Change Requests.  Model Change requests modify existing data in a model, while Model AI processing only adds data to a model.
 
 

- implement 'add property' 
i need to handle the 'add property' button. I need to ask for the property name but i also need to give an option to allow the user to 'bulk add' multiple properties and give them a multi line textbox to add a property for each line entered. validation rules... 1. no spaces allowed in names. 2. alpha characters only.
 
 
if prep merging then warn user to save their work first.

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

Agent todo items...
 
- mv list columns
    - page size dropdown

- val req list...
    - if one is processing or queued on the page, auto refresh every minute.

val details page...
- show as a modal on val list page, instead of a new sub-page

add val request...
- prepop desc with name of project and version number. example: 'Project: Ajust Underpayments, Version: 2.0.113'
     
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
    - show all requests in a list view. 
    - show the status of each request. 
    - show the details of each request.  
    - add a request
    - cancel a request
    - refresh list button
    - details
        - download report
        - view report
        - download results (merge)

- fabrication requests
    - show all requests in a list view. 
    - show the status of each request. 
    - show the details of each request.  
    - add a request
    - cancel a request
    - refresh list
    - download results
        - to fabrication_results sub folder

- implement 'add property' 
i need to handle the 'add property' button. I need to ask for the property name but i also need to give an option to allow the user to 'bulk add' multiple properties and give them a multi line textbox to add a property for each line entered. validation rules... 1. no spaces allowed in names. 2. alpha characters only.

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

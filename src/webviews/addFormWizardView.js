/**
 * addFormWizardView.js
 * Add Form Wizard webview implementation for AppDNA extension
 * Created: 2025-01-19
 * Last modified: 2025-01-19
 */

const vscode = require('vscode');

/**
 * Shows the Add Form Wizard in a webview
 * @param {Object} modelService - The ModelService instance
 */
function showAddFormWizard(modelService) {
    // Get all objects for owner object selection
    let allObjects = [];
    let roleObjects = [];
    if (modelService && modelService.isFileLoaded()) {
        allObjects = modelService.getAllObjects();
        // Filter to get Role objects (only exact match for 'Role')
        roleObjects = allObjects.filter(obj => obj.name === 'Role');
    }
    
    // Generate the HTML for the wizard
    const panel = vscode.window.createWebviewPanel(
        "addFormWizard", 
        "Add Form Wizard",
        vscode.ViewColumn.One, 
        {
            enableScripts: true
        }
    );

    panel.webview.html = generateWizardHTML(allObjects, roleObjects);
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'createForm':
                    try {
                        const { ownerObjectName, roleRequired, isCreatingNewInstance, targetObjectName, action, formName, formTitle } = message.data;
                        
                        // Find the owner object
                        const ownerObject = allObjects.find(obj => obj.name === ownerObjectName);
                        
                        if (!ownerObject) {
                            panel.webview.postMessage({ 
                                command: "error", 
                                message: "Owner object not found" 
                            });
                            return;
                        }
                        
                        if (!ownerObject.objectWorkflow) {
                            ownerObject.objectWorkflow = [];
                        }
                        
                        // Create the new form
                        const newForm = {
                            name: formName,
                            titleText: formTitle,
                            isPage: "true",
                            objectWorkflowButton: [
                                {
                                    buttonText: "OK",
                                    buttonType: "submit",
                                    isVisible: "true"
                                },
                                {
                                    buttonText: "Cancel",
                                    buttonType: "cancel",
                                    isVisible: "true"
                                }
                            ]
                        };

                        // Add optional properties based on wizard selections
                        if (roleRequired) {
                            newForm.isAuthorizationRequired = "true";
                            newForm.roleRequired = roleRequired;
                            newForm.layoutName = roleRequired + "Layout";
                        } else {
                            newForm.isAuthorizationRequired = "false";
                        }
                        
                        if (isCreatingNewInstance && targetObjectName) {
                            newForm.targetChildObject = targetObjectName;
                        } else if (action) {
                            newForm.workflowAction = action;
                        }
                        
                        // Add the new form to the owner object
                        ownerObject.objectWorkflow.push(newForm);
                        
                        // Mark model as having unsaved changes
                        modelService.markUnsavedChanges();

                        // Notify the webview of unsaved changes status
                        panel.webview.postMessage({
                            command: "modelValidationUnsavedChangesStatus",
                            hasUnsavedChanges: modelService.hasUnsavedChangesInMemory()
                        });
                        
                        // Send success message
                        panel.webview.postMessage({ 
                            command: "success", 
                            message: `Form "${formName}" created successfully!`
                        });
                        
                        // Close the wizard after a short delay
                        setTimeout(() => {
                            panel.dispose();
                            
                            // Refresh the tree view
                            vscode.commands.executeCommand('appdna.refresh');
                            
                            // Find and open the new form in the form details view
                            setTimeout(() => {
                                try {
                                    const { showFormDetails } = require('./formDetailsView');
                                    const JsonTreeItem = require('../models/types').JsonTreeItem;
                                    
                                    // Create a tree item for the new form
                                    const formItem = new JsonTreeItem(
                                        formName,
                                        vscode.TreeItemCollapsibleState.None,
                                        `form:${ownerObjectName}:${formName}`
                                    );
                                    formItem.label = formName;
                                    formItem.contextValue = `form formItem:${ownerObjectName}:${formName}`;
                                    formItem.iconPath = new vscode.ThemeIcon('edit');
                                    formItem.description = ownerObjectName;
                                    
                                    // Open the form details view
                                    showFormDetails(formItem, modelService);
                                } catch (error) {
                                    console.log('Could not auto-open form details:', error.message);
                                }
                            }, 500);
                            
                        }, 2000);
                        
                    } catch (error) {
                        panel.webview.postMessage({ 
                            command: "error", 
                            message: `Failed to create form: ${error.message}` 
                        });
                    }
                    return;
                    
                case "validateName":
                    try {
                        const { formName } = message.data;
                        
                        // Validate name is not empty
                        if (!formName) {
                            panel.webview.postMessage({ 
                                command: "nameValidation", 
                                isValid: false, 
                                message: "Form name cannot be empty"
                            });
                            return;
                        }
                        
                        // Validate name format (PascalCase, starts with letter, alphanumeric only)
                        const namePattern = /^[A-Z][a-zA-Z0-9]*$/;
                        if (!namePattern.test(formName)) {
                            panel.webview.postMessage({ 
                                command: "nameValidation", 
                                isValid: false, 
                                message: "Form name must start with a letter and contain only letters and numbers (PascalCase)"
                            });
                            return;
                        }
                        
                        // Check for duplicate names across all forms
                        const allForms = modelService.getAllForms();
                        const duplicateExists = allForms.some(form => form.name === formName);
                        
                        if (duplicateExists) {
                            panel.webview.postMessage({ 
                                command: "nameValidation", 
                                isValid: false, 
                                message: "A form with this name already exists"
                            });
                            return;
                        }
                        
                        // Name is valid
                        panel.webview.postMessage({ 
                            command: "nameValidation", 
                            isValid: true, 
                            message: "Form name is valid"
                        });
                        
                    } catch (error) {
                        panel.webview.postMessage({ 
                            command: "nameValidation", 
                            isValid: false, 
                            message: "Error validating name"
                        });
                    }
                    return;
                    
                case "validateTitle":
                    try {
                        const { formTitle } = message.data;
                        
                        // Validate title is not empty
                        if (!formTitle) {
                            panel.webview.postMessage({ 
                                command: "titleValidation", 
                                isValid: false, 
                                message: "Form title cannot be empty"
                            });
                            return;
                        }
                        
                        // Validate title length does not exceed 100 characters
                        if (formTitle.length > 100) {
                            panel.webview.postMessage({ 
                                command: "titleValidation", 
                                isValid: false, 
                                message: "Form title cannot exceed 100 characters"
                            });
                            return;
                        }
                        
                        // Title is valid
                        panel.webview.postMessage({ 
                            command: "titleValidation", 
                            isValid: true, 
                            message: "Form title is valid"
                        });
                        
                    } catch (error) {
                        panel.webview.postMessage({ 
                            command: "titleValidation", 
                            isValid: false, 
                            message: "Error validating title"
                        });
                    }
                    return;
            }
        },
        undefined,
        []
    );
}

/**
 * Generates the HTML for the Add Form Wizard
 * @param {Array} allObjects All objects for owner selection
 * @param {Array} roleObjects Role objects for role selection
 * @returns {string} HTML content
 */
function generateWizardHTML(allObjects, roleObjects) {
    // Generate owner object options
    let ownerOptions = '';
    if (allObjects && allObjects.length > 0) {
        ownerOptions = allObjects
            .map(obj => `<option value="${obj.name}">${obj.name}</option>`)
            .join('');
    }
    
    // Generate role options
    let roleOptions = '';
    if (roleObjects.length > 0) {
        roleOptions = roleObjects
            .filter(obj => obj.lookupItem && Array.isArray(obj.lookupItem))
            .flatMap(obj => obj.lookupItem)
            .filter(item => item.displayName)
            .map(item => `<option value="${item.displayName}">${item.displayName}</option>`)
            .join('');
    }
    
    // Generate target object options (same as owner options, excluding owner)
    let targetOptions = '';
    if (allObjects && allObjects.length > 0) {
        targetOptions = allObjects
            .map(obj => `<option value="${obj.name}">${obj.name}</option>`)
            .join('');
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Add Form Wizard</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    padding: 20px;
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                }
                .step {
                    display: none;
                    margin-bottom: 20px;
                }
                .step.active {
                    display: block;
                }
                h2 {
                    margin-top: 0;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 10px;
                }
                .form-group {
                    margin-bottom: 15px;
                }
                label {
                    display: block;
                    margin-bottom: 5px;
                }
                input[type="text"], select {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid var(--vscode-input-border);
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                }
                input[type="text"]:focus, select:focus {
                    outline: 1px solid var(--vscode-focusBorder);
                    border-color: var(--vscode-focusBorder);
                }
                .button-container {
                    display: flex;
                    justify-content: space-between;
                    gap: 10px;
                    margin-top: 20px;
                }
                button {
                    padding: 8px 16px;
                    border: 1px solid var(--vscode-button-border);
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    cursor: pointer;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                button:disabled {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    cursor: not-allowed;
                }
                .primary-button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
                .secondary-button {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                .progress-indicator {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    padding: 10px 0;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                .progress-step {
                    flex: 1;
                    text-align: center;
                    padding: 8px;
                    border-radius: 3px;
                    background-color: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    margin: 0 2px;
                    font-size: 12px;
                }
                .progress-step.active {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
                .success-message {
                    color: var(--vscode-charts-green);
                    margin-top: 10px;
                    font-weight: bold;
                }
                .error-message {
                    color: var(--vscode-errorForeground);
                    margin-top: 10px;
                    font-weight: bold;
                }
                .validation-message {
                    font-size: 12px;
                    margin-top: 5px;
                }
                .validation-message.valid {
                    color: var(--vscode-charts-green);
                }
                .validation-message.invalid {
                    color: var(--vscode-errorForeground);
                }
                .description {
                    font-size: 14px;
                    color: var(--vscode-descriptionForeground);
                    margin-bottom: 15px;
                }
                .radio-group {
                    margin: 10px 0;
                }
                .radio-option {
                    margin: 5px 0;
                }
                .radio-option input[type="radio"] {
                    margin-right: 8px;
                    width: auto;
                }
                .radio-option label {
                    display: inline;
                    margin-bottom: 0;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <div class="progress-indicator">
                <div class="progress-step step-1 active">Step 1: Owner Object</div>
                <div class="progress-step step-2">Step 2: Role${roleObjects.length > 0 ? '' : ' (Skip)'}</div>
                <div class="progress-step step-3">Step 3: New Instance</div>
                <div class="progress-step step-4">Step 4: Target/Action</div>
                <div class="progress-step step-5">Step 5: Form Details</div>
            </div>
            
            <!-- Step 1: Owner Data Object Selection -->
            <div id="step1" class="step active">
                <h2>Step 1: Select Owner Data Object</h2>
                <div class="description">
                    Select the primary data object that this form will be associated with. This object will be the main context for the form.
                </div>
                <div class="form-group">
                    <label for="ownerObject">Owner Data Object:</label>
                    <select id="ownerObject">
                        <option value="">Please select an owner object...</option>
                        ${ownerOptions}
                    </select>
                </div>
                <div class="button-container">
                    <div></div> <!-- Spacer to push Next button to the right -->
                    <button type="button" id="step1NextBtn" class="primary-button" disabled>Next</button>
                </div>
            </div>
            
            <!-- Step 2: Role Selection (if Role objects exist) -->
            <div id="step2" class="step">
                <h2>Step 2: Select Required Role</h2>
                <div class="description">
                    ${roleObjects.length > 0 
                        ? 'Select the role required to access this form. Users must have this role to use the form.'
                        : 'No Role data objects found. This step will be skipped.'
                    }
                </div>
                <div class="form-group" ${roleObjects.length === 0 ? 'style="display:none;"' : ''}>
                    <label for="roleRequired">Required Role:</label>
                    <select id="roleRequired">
                        <option value="">No role required</option>
                        ${roleOptions}
                    </select>
                </div>
                <div class="button-container">
                    <button type="button" id="step2BackBtn" class="secondary-button">Back</button>
                    <button type="button" id="step2NextBtn" class="primary-button">Next</button>
                </div>
            </div>
            
            <!-- Step 3: New Instance Question -->
            <div id="step3" class="step">
                <h2>Step 3: Form Purpose</h2>
                <div class="description">
                    Will this form create a new instance of a data object?
                </div>
                <div class="radio-group">
                    <div class="radio-option">
                        <input type="radio" id="newInstanceYes" name="newInstance" value="yes">
                        <label for="newInstanceYes">Yes - This form will create a new data object instance</label>
                    </div>
                    <div class="radio-option">
                        <input type="radio" id="newInstanceNo" name="newInstance" value="no">
                        <label for="newInstanceNo">No - This form will work with the owner object</label>
                    </div>
                </div>
                <div class="button-container">
                    <button type="button" id="step3BackBtn" class="secondary-button">Back</button>
                    <button type="button" id="step3NextBtn" class="primary-button" disabled>Next</button>
                </div>
            </div>
            
            <!-- Step 4a: Target Object Selection (if creating new instance) -->
            <div id="step4a" class="step">
                <h2>Step 4: Select Target Data Object</h2>
                <div class="description">
                    Select the data object type that will be created by this form.
                </div>
                <div class="form-group">
                    <label for="targetObject">Target Data Object:</label>
                    <select id="targetObject">
                        <option value="">Please select a target object...</option>
                        ${targetOptions}
                    </select>
                </div>
                <div class="button-container">
                    <button type="button" id="step4aBackBtn" class="secondary-button">Back</button>
                    <button type="button" id="step4aNextBtn" class="primary-button" disabled>Next</button>
                </div>
            </div>
            
            <!-- Step 4b: Action Selection (if not creating new instance) -->
            <div id="step4b" class="step">
                <h2>Step 4: Select Action</h2>
                <div class="description">
                    Describe the action this form will perform on the owner data object. Use PascalCase format (e.g., Save, Delete, UpdateStatus, ProcessOrder). This field is optional.
                </div>
                <div class="form-group">
                    <label for="formAction">Form Action:</label>
                    <input type="text" id="formAction" placeholder="Enter action (e.g., Save, Delete, UpdateStatus)">
                    <div id="formActionValidation" class="validation-message"></div>
                </div>
                <div class="button-container">
                    <button type="button" id="step4bBackBtn" class="secondary-button">Back</button>
                    <button type="button" id="step4bNextBtn" class="primary-button">Next</button>
                </div>
            </div>
            
            <!-- Step 5: Form Details -->
            <div id="step5" class="step">
                <h2>Step 5: Form Name and Title</h2>
                <div class="description">
                    Provide a name and title for the new form. The name will be used internally, while the title will be displayed to users.
                </div>
                <div class="form-group">
                    <label for="formName">Form Name:</label>
                    <input type="text" id="formName" placeholder="Enter form name (PascalCase, e.g., CustomerAdminSave)">
                    <div id="formNameValidation" class="validation-message"></div>
                </div>
                <div class="form-group">
                    <label for="formTitle">Form Title:</label>
                    <input type="text" id="formTitle" placeholder="Enter form title (e.g., Customer Admin Save)">
                    <div id="formTitleValidation" class="validation-message"></div>
                </div>
                <div class="button-container">
                    <button type="button" id="step5BackBtn" class="secondary-button">Back</button>
                    <button type="button" id="createFormBtn" class="primary-button" disabled>Create Form</button>
                </div>
            </div>
            
            <div id="message"></div>

            <script>
                const vscode = acquireVsCodeApi();
                
                let currentStep = 1;
                let selectedOwner = '';
                let selectedRole = '';
                let isCreatingNewInstance = null;
                let selectedTarget = '';
                let selectedAction = '';
                let hasRoleObjects = ${roleObjects.length > 0};
                
                // Initialize the wizard
                window.addEventListener('load', () => {
                    showStep(1);
                });
                
                function showStep(stepNumber) {
                    // Hide all steps
                    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
                    document.querySelectorAll('.progress-step').forEach(step => step.classList.remove('active'));
                    
                    // Show current step
                    document.getElementById('step' + stepNumber).classList.add('active');
                    
                    // Handle progress indicator - map 4a and 4b to step-4
                    let progressStepNumber = stepNumber;
                    if (stepNumber === '4a' || stepNumber === '4b') {
                        progressStepNumber = 4;
                    }
                    document.querySelector('.step-' + progressStepNumber).classList.add('active');
                    
                    currentStep = stepNumber;
                    
                    // Set focus on appropriate element with delay to ensure DOM is updated
                    setTimeout(() => {
                        if (stepNumber === 1) {
                            // Focus on the 'Owner Data Object' dropdown when step 1 opens
                            const ownerObject = document.getElementById('ownerObject');
                            if (ownerObject) {
                                ownerObject.focus();
                            }
                        } else if (stepNumber === 2) {
                            // Focus on the 'Required Role' dropdown when step 2 opens
                            const roleRequired = document.getElementById('roleRequired');
                            if (roleRequired) {
                                roleRequired.focus();
                            }
                        } else if (stepNumber === 3) {
                            // Focus on the first radio button when step 3 opens
                            const newInstanceYes = document.getElementById('newInstanceYes');
                            if (newInstanceYes) {
                                newInstanceYes.focus();
                            }
                        } else if (stepNumber === '4a') {
                            // Focus on target object dropdown
                            const targetObject = document.getElementById('targetObject');
                            if (targetObject) {
                                targetObject.focus();
                            }
                        } else if (stepNumber === '4b') {
                            // Focus on form action textbox
                            const formAction = document.getElementById('formAction');
                            if (formAction) {
                                formAction.focus();
                            }
                        } else if (stepNumber === 5) {
                            // Focus on form name input when step 5 opens
                            const formName = document.getElementById('formName');
                            if (formName) {
                                formName.focus();
                            }
                        }
                    }, 100); // Small delay to ensure DOM is updated
                }
                
                function nextStep() {
                    let nextStepNumber = currentStep + 1;
                    
                    // Skip role step if no role objects
                    if (nextStepNumber === 2 && !hasRoleObjects) {
                        nextStepNumber = 3;
                    }
                    
                    // Handle step 4 branching based on new instance choice
                    if (nextStepNumber === 4) {
                        if (isCreatingNewInstance === true) {
                            showStep('4a');
                            return;
                        } else {
                            showStep('4b');
                            return;
                        }
                    }
                    
                    if (nextStepNumber <= 5) {
                        showStep(nextStepNumber);
                    }
                }
                
                function previousStep() {
                    let prevStepNumber = currentStep - 1;
                    
                    // Handle step 4 variants going back
                    if (currentStep === '4a' || currentStep === '4b') {
                        prevStepNumber = 3;
                    } else if (currentStep === 5) {
                        // Going back from step 5 to appropriate step 4
                        if (isCreatingNewInstance === true) {
                            showStep('4a');
                            return;
                        } else {
                            showStep('4b');
                            return;
                        }
                    }
                    
                    // Skip role step if no role objects
                    if (prevStepNumber === 2 && !hasRoleObjects) {
                        prevStepNumber = 1;
                    }
                    
                    if (prevStepNumber >= 1) {
                        showStep(prevStepNumber);
                    }
                }
                
                function generateFormName() {
                    const owner = selectedOwner || 'Object';
                    const role = selectedRole || '';
                    const target = selectedTarget || '';
                    
                    // Use 'Add' as default action when creating new instance, otherwise use selectedAction
                    const action = isCreatingNewInstance === true ? (selectedAction || 'Add') : (selectedAction || '');
                    
                    let name = owner;
                    if (role) name += role;
                    if (action) name += action;
                    if (target && isCreatingNewInstance) name += target;
                    
                    document.getElementById('formName').value = name;
                    validateFormName();
                }
                
                function generateFormTitle() {
                    const owner = selectedOwner ? convertToHumanReadable(selectedOwner) : 'Object';
                    const target = selectedTarget ? convertToHumanReadable(selectedTarget) : '';
                    
                    // Use 'Add' as default action when creating new instance, otherwise use selectedAction
                    const action = isCreatingNewInstance === true ? (selectedAction || 'Add') : (selectedAction || '');
                    const actionReadable = action ? convertToHumanReadable(action) : '';
                    
                    let title = '';
                    
                    // Format: [Action] [OwnerObjectName] or [Action] [ChildObjectName]
                    if (actionReadable) {
                        title = actionReadable + ' ';
                        // Use child object name if creating new instance, otherwise use owner object name
                        if (target && isCreatingNewInstance) {
                            title += target;
                        } else {
                            title += owner;
                        }
                    } else {
                        // If no action, just use the object name
                        if (target && isCreatingNewInstance) {
                            title = target;
                        } else {
                            title = owner;
                        }
                    }
                    
                    document.getElementById('formTitle').value = title;
                    validateFormTitle();
                }
                
                function convertToHumanReadable(text) {
                    if (!text) return '';
                    return text.replace(/([A-Z])/g, ' $1').trim();
                }
                
                function validateFormName() {
                    const formName = document.getElementById('formName').value;
                    if (formName) {
                        vscode.postMessage({
                            command: 'validateName',
                            data: { formName }
                        });
                    } else {
                        document.getElementById('formNameValidation').textContent = '';
                        document.getElementById('formNameValidation').className = 'validation-message';
                        updateCreateButton();
                    }
                }
                
                function validateFormTitle() {
                    const formTitle = document.getElementById('formTitle').value;
                    if (formTitle) {
                        vscode.postMessage({
                            command: 'validateTitle',
                            data: { formTitle }
                        });
                    } else {
                        document.getElementById('formTitleValidation').textContent = '';
                        document.getElementById('formTitleValidation').className = 'validation-message';
                        updateCreateButton();
                    }
                }
                
                function updateCreateButton() {
                    const formName = document.getElementById('formName').value.trim();
                    const formTitle = document.getElementById('formTitle').value.trim();
                    const nameValid = document.getElementById('formNameValidation').classList.contains('valid');
                    const titleValid = document.getElementById('formTitleValidation').classList.contains('valid');
                    
                    document.getElementById('createFormBtn').disabled = !(formName && formTitle && nameValid && titleValid);
                }
                
                // Message handling
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'success':
                            document.getElementById('message').innerHTML = '<div class="success-message">' + message.message + '</div>';
                            break;
                        case 'error':
                            document.getElementById('message').innerHTML = '<div class="error-message">' + message.message + '</div>';
                            break;
                        case 'nameValidation':
                            const nameValidation = document.getElementById('formNameValidation');
                            nameValidation.textContent = message.message;
                            nameValidation.className = 'validation-message ' + (message.isValid ? 'valid' : 'invalid');
                            updateCreateButton();
                            break;
                        case 'titleValidation':
                            const titleValidation = document.getElementById('formTitleValidation');
                            titleValidation.textContent = message.message;
                            titleValidation.className = 'validation-message ' + (message.isValid ? 'valid' : 'invalid');
                            updateCreateButton();
                            break;
                    }
                });
                
                // Step 1: Owner Object Selection
                document.getElementById('ownerObject').addEventListener('change', function() {
                    selectedOwner = this.value;
                    document.getElementById('step1NextBtn').disabled = !selectedOwner;
                });
                
                document.getElementById('step1NextBtn').addEventListener('click', nextStep);
                
                // Handle step 1 keyboard navigation
                document.getElementById('step1').addEventListener('keydown', function(event) {
                    if (event.key === 'Enter' && !document.getElementById('step1NextBtn').disabled) {
                        event.preventDefault();
                        document.getElementById('step1NextBtn').click();
                    }
                });
                
                // Step 2: Role Selection
                document.getElementById('roleRequired').addEventListener('change', function() {
                    selectedRole = this.value;
                });
                
                document.getElementById('step2BackBtn').addEventListener('click', previousStep);
                document.getElementById('step2NextBtn').addEventListener('click', nextStep);
                
                // Handle step 2 keyboard navigation
                document.getElementById('step2').addEventListener('keydown', function(event) {
                    if (event.key === 'Enter' && !document.getElementById('step2NextBtn').disabled) {
                        event.preventDefault();
                        document.getElementById('step2NextBtn').click();
                    }
                });
                
                // Step 3: New Instance Selection
                document.querySelectorAll('input[name="newInstance"]').forEach(radio => {
                    radio.addEventListener('change', function() {
                        isCreatingNewInstance = this.value === 'yes';
                        document.getElementById('step3NextBtn').disabled = false;
                    });
                });
                
                document.getElementById('step3BackBtn').addEventListener('click', previousStep);
                document.getElementById('step3NextBtn').addEventListener('click', nextStep);
                
                // Handle step 3 keyboard navigation
                document.getElementById('step3').addEventListener('keydown', function(event) {
                    if (event.key === 'Enter' && !document.getElementById('step3NextBtn').disabled) {
                        event.preventDefault();
                        document.getElementById('step3NextBtn').click();
                    }
                });
                
                // Step 4a: Target Object Selection
                document.getElementById('targetObject').addEventListener('change', function() {
                    selectedTarget = this.value;
                    document.getElementById('step4aNextBtn').disabled = !selectedTarget;
                });
                
                document.getElementById('step4aBackBtn').addEventListener('click', previousStep);
                document.getElementById('step4aNextBtn').addEventListener('click', () => {
                    showStep(5);
                    generateFormName();
                    generateFormTitle();
                });
                
                // Handle step 4a keyboard navigation
                document.getElementById('step4a').addEventListener('keydown', function(event) {
                    if (event.key === 'Enter' && !document.getElementById('step4aNextBtn').disabled) {
                        event.preventDefault();
                        document.getElementById('step4aNextBtn').click();
                    }
                });
                
                // Step 4b: Action Selection
                document.getElementById('formAction').addEventListener('input', function() {
                    selectedAction = this.value.trim();
                    validateFormAction();
                    // Next button is always enabled since action is optional
                    document.getElementById('step4bNextBtn').disabled = false;
                });
                
                function validateFormAction() {
                    const formAction = document.getElementById('formAction').value.trim();
                    const validationDiv = document.getElementById('formActionValidation');
                    
                    if (!formAction) {
                        // Empty is allowed - clear validation
                        validationDiv.textContent = '';
                        validationDiv.className = 'validation-message';
                        return;
                    }
                    
                    // Validate PascalCase format (starts with capital letter, no spaces, alphanumeric only)
                    const pascalCasePattern = /^[A-Z][a-zA-Z0-9]*$/;
                    if (!pascalCasePattern.test(formAction)) {
                        validationDiv.textContent = 'Action must be in PascalCase format (e.g., Save, Delete, UpdateStatus)';
                        validationDiv.className = 'validation-message invalid';
                    } else {
                        validationDiv.textContent = 'Valid action format';
                        validationDiv.className = 'validation-message valid';
                    }
                }
                
                document.getElementById('step4bBackBtn').addEventListener('click', previousStep);
                document.getElementById('step4bNextBtn').addEventListener('click', () => {
                    showStep(5);
                    generateFormName();
                    generateFormTitle();
                });
                
                // Handle step 4b keyboard navigation
                document.getElementById('step4b').addEventListener('keydown', function(event) {
                    if (event.key === 'Enter' && !document.getElementById('step4bNextBtn').disabled) {
                        event.preventDefault();
                        document.getElementById('step4bNextBtn').click();
                    }
                });
                
                // Step 5: Form Details
                document.getElementById('formName').addEventListener('input', validateFormName);
                document.getElementById('formTitle').addEventListener('input', validateFormTitle);
                
                document.getElementById('step5BackBtn').addEventListener('click', previousStep);
                document.getElementById('createFormBtn').addEventListener('click', function() {
                    const formData = {
                        ownerObjectName: selectedOwner,
                        roleRequired: selectedRole,
                        isCreatingNewInstance: isCreatingNewInstance,
                        targetObjectName: selectedTarget,
                        action: selectedAction,
                        formName: document.getElementById('formName').value.trim(),
                        formTitle: document.getElementById('formTitle').value.trim()
                    };
                    
                    vscode.postMessage({
                        command: 'createForm',
                        data: formData
                    });
                });
                
                // Handle step 5 keyboard navigation
                document.getElementById('step5').addEventListener('keydown', function(event) {
                    if (event.key === 'Enter' && !document.getElementById('createFormBtn').disabled) {
                        event.preventDefault();
                        document.getElementById('createFormBtn').click();
                    }
                });
            </script>
        </body>
        </html>
    `;
}

module.exports = {
    showAddFormWizard
};

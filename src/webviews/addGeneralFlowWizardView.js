/**
 * addGeneralFlowWizardView.js
 * Add General Flow Wizard webview implementation for AppDNA extension
 * Created: 2025-08-31
 * Last modified: 2025-08-31
 */

const vscode = require('vscode');

/**
 * Shows the Add General Flow Wizard in a webview
 * @param {Object} modelService - The ModelService instance
 * @param {vscode.ExtensionContext} context - Extension context
 */
function showAddGeneralFlowWizard(modelService, context) {
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
        "addGeneralFlowWizard", 
        "Add General Flow Wizard",
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
                case 'createGeneralFlow':
                    try {
                        const { ownerObjectName, roleRequired, isCreatingNewInstance, targetObjectName, action, flowName, flowTitle } = message.data;
                        
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
                        
                        // Create the new general flow
                        const newGeneralFlow = {
                            name: flowName,
                            titleText: flowTitle,
                            objectWorkflowOutputVar: [],
                            isPage: "false",
                            isExposedInBusinessObject: "true"
                        };

                        // Add optional properties based on wizard selections
                        if (roleRequired) {
                            newGeneralFlow.isAuthorizationRequired = "true";
                            newGeneralFlow.roleRequired = roleRequired;
                        } else {
                            newGeneralFlow.isAuthorizationRequired = "false";
                        }
                        
                        if (isCreatingNewInstance && targetObjectName) {
                            newGeneralFlow.targetChildObject = targetObjectName;
                        }
                        
                        // Add the general flow to the owner object
                        ownerObject.objectWorkflow.push(newGeneralFlow);
                        
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
                            message: `General flow "${flowName}" created successfully!`
                        });
                        
                        // Close the wizard after a short delay
                        setTimeout(() => {
                            panel.dispose();
                            
                            // Refresh the tree view
                            vscode.commands.executeCommand('appdna.refresh');
                            
                            // Find and open the new general flow in the general flow details view
                            setTimeout(() => {
                                try {
                                    const { showGeneralFlowDetails } = require('./generalFlowDetailsView');
                                    const JsonTreeItem = require('../models/types').JsonTreeItem;
                                    
                                    // Create a tree item for the new general flow
                                    const flowItem = new JsonTreeItem(
                                        flowName,
                                        vscode.TreeItemCollapsibleState.None,
                                        `generalWorkflowItem:${ownerObjectName}:${flowName}`
                                    );
                                    flowItem.label = flowName;
                                    flowItem.contextValue = `generalWorkflowItem:${ownerObjectName}:${flowName}`;
                                    flowItem.iconPath = new vscode.ThemeIcon('symbol-method');
                                    flowItem.description = ownerObjectName;
                                    
                                    // Open the general flow details view
                                    showGeneralFlowDetails(flowItem, modelService, context, 'settings');
                                } catch (error) {
                                    console.log('Could not auto-open general flow details:', error.message);
                                }
                            }, 500);
                            
                        }, 2000);
                        
                    } catch (error) {
                        panel.webview.postMessage({ 
                            command: "error", 
                            message: `Failed to create general flow: ${error.message}` 
                        });
                    }
                    return;
                    
                case "validateName":
                    try {
                        const { flowName } = message.data;
                        
                        // Validate name is not empty
                        if (!flowName) {
                            panel.webview.postMessage({ 
                                command: "nameValidation", 
                                isValid: false, 
                                message: "General flow name cannot be empty"
                            });
                            return;
                        }
                        
                        // Validate name format (PascalCase, starts with letter, alphanumeric only)
                        const namePattern = /^[A-Z][a-zA-Z0-9]*$/;
                        if (!namePattern.test(flowName)) {
                            panel.webview.postMessage({ 
                                command: "nameValidation", 
                                isValid: false, 
                                message: "General flow name must start with a letter and contain only letters and numbers (PascalCase)"
                            });
                            return;
                        }
                        
                        // Check for duplicate names across all general flows
                        const allGeneralFlows = modelService.getAllGeneralFlows();
                        const duplicateExists = allGeneralFlows.some(flow => flow.name === flowName);
                        
                        if (duplicateExists) {
                            panel.webview.postMessage({ 
                                command: "nameValidation", 
                                isValid: false, 
                                message: "A general flow with this name already exists"
                            });
                            return;
                        }
                        
                        // Name is valid
                        panel.webview.postMessage({ 
                            command: "nameValidation", 
                            isValid: true, 
                            message: "General flow name is valid"
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
                        const { flowTitle } = message.data;
                        
                        // Validate title is not empty
                        if (!flowTitle) {
                            panel.webview.postMessage({ 
                                command: "titleValidation", 
                                isValid: false, 
                                message: "General flow title cannot be empty"
                            });
                            return;
                        }
                        
                        // Validate title length does not exceed 100 characters
                        if (flowTitle.length > 100) {
                            panel.webview.postMessage({ 
                                command: "titleValidation", 
                                isValid: false, 
                                message: "General flow title cannot exceed 100 characters"
                            });
                            return;
                        }
                        
                        // Title is valid
                        panel.webview.postMessage({ 
                            command: "titleValidation", 
                            isValid: true, 
                            message: "General flow title is valid"
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
 * Generates the HTML for the Add General Flow Wizard
 * @param {Array} allObjects All objects for owner selection
 * @param {Array} roleObjects Role objects for role selection
 * @returns {string} HTML content
 */
function generateWizardHTML(allObjects, roleObjects) {
    // Generate owner object options
    const ownerOptions = allObjects.map(obj => 
        `<option value="${obj.name}">${obj.name}</option>`
    ).join('');
    
    // Generate role options (extract from Role objects' lookupItem arrays)
    let roleOptions = '';
    if (roleObjects.length > 0) {
        roleOptions = roleObjects
            .filter(obj => obj.lookupItem && Array.isArray(obj.lookupItem))
            .flatMap(obj => obj.lookupItem)
            .filter(item => item.displayName)
            .map(item => `<option value="${item.displayName}">${item.displayName}</option>`)
            .join('');
    }
    
    // Generate target object options (excluding role objects for cleaner selection)
    const targetOptions = allObjects.filter(obj => obj.name !== 'Role').map(obj => 
        `<option value="${obj.name}">${obj.name}</option>`
    ).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Add General Flow Wizard</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                    margin: 0;
                }
                .step {
                    display: none;
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
                <div class="step-1 progress-step active">1. Owner</div>
                <div class="step-2 progress-step">2. Security</div>
                <div class="step-3 progress-step">3. Purpose</div>
                <div class="step-4 progress-step">4. Target/Action</div>
                <div class="step-5 progress-step">5. Details</div>
            </div>
            
            <!-- Step 1: Owner Object Selection -->
            <div id="step1" class="step active">
                <h2>Step 1: Select Owner Object</h2>
                <div class="description">
                    Choose the data object that will own this general flow. This object will contain the new workflow.
                </div>
                <div class="form-group">
                    <label for="ownerObject">Owner Object:</label>
                    <select id="ownerObject">
                        <option value="">Please select an owner object...</option>
                        ${ownerOptions}
                    </select>
                </div>
                <div class="button-container">
                    <button type="button" id="step1NextBtn" class="primary-button" disabled>Next</button>
                </div>
            </div>
            
            <!-- Step 2: Role Selection -->
            <div id="step2" class="step">
                <h2>Step 2: Security Configuration</h2>
                <div class="description">
                    ${roleOptions.length > 0 ? 
                        'Configure security for this general flow. You can optionally require a specific role to execute this workflow.' : 
                        'No role options found in the model. The general flow will be created without role-based security.'
                    }
                </div>
                ${roleOptions.length > 0 ? `
                <div class="form-group">
                    <label for="roleObject">Required Role (Optional):</label>
                    <select id="roleObject">
                        <option value="">No role required</option>
                        ${roleOptions}
                    </select>
                </div>
                ` : '<p>Role-based security is not available in this model.</p>'}
                <div class="button-container">
                    <button type="button" id="step2BackBtn" class="secondary-button">Back</button>
                    <button type="button" id="step2NextBtn" class="primary-button">Next</button>
                </div>
            </div>
            
            <!-- Step 3: New Instance Question -->
            <div id="step3" class="step">
                <h2>Step 3: General Flow Purpose</h2>
                <div class="description">
                    Will this general flow create a new instance of a data object?
                </div>
                <div class="radio-group">
                    <div class="radio-option">
                        <input type="radio" id="newInstanceYes" name="newInstance" value="yes">
                        <label for="newInstanceYes">Yes - This general flow will create a new data object instance</label>
                    </div>
                    <div class="radio-option">
                        <input type="radio" id="newInstanceNo" name="newInstance" value="no">
                        <label for="newInstanceNo">No - This general flow will work with existing data</label>
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
                    Select the data object type that will be created by this general flow.
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
                    Describe the action this general flow will perform. Use PascalCase format (e.g., Process, Calculate, Validate, Update). This field is optional.
                </div>
                <div class="form-group">
                    <label for="flowAction">General Flow Action:</label>
                    <input type="text" id="flowAction" placeholder="Enter action (e.g., Process, Calculate, Validate)">
                    <div id="flowActionValidation" class="validation-message"></div>
                </div>
                <div class="button-container">
                    <button type="button" id="step4bBackBtn" class="secondary-button">Back</button>
                    <button type="button" id="step4bNextBtn" class="primary-button">Next</button>
                </div>
            </div>
            
            <!-- Step 5: General Flow Details -->
            <div id="step5" class="step">
                <h2>Step 5: General Flow Name and Title</h2>
                <div class="description">
                    Provide a name and title for the new general flow. The name will be used internally, while the title will be displayed to users.
                </div>
                <div class="form-group">
                    <label for="flowName">General Flow Name:</label>
                    <input type="text" id="flowName" placeholder="Enter general flow name (PascalCase, e.g., ProcessCustomerData)">
                    <div id="flowNameValidation" class="validation-message"></div>
                </div>
                <div class="form-group">
                    <label for="flowTitle">General Flow Title:</label>
                    <input type="text" id="flowTitle" placeholder="Enter general flow title (e.g., Process Customer Data)">
                    <div id="flowTitleValidation" class="validation-message"></div>
                </div>
                <div class="button-container">
                    <button type="button" id="step5BackBtn" class="secondary-button">Back</button>
                    <button type="button" id="createGeneralFlowBtn" class="primary-button" disabled>Create General Flow</button>
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
                let hasRoleObjects = ${roleOptions.length > 0};
                
                // Initialize the wizard
                window.addEventListener('load', () => {
                    showStep(1);
                });
                
                function showStep(stepNumber) {
                    // Hide all steps
                    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
                    
                    // Remove active class from all progress steps
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
                            // Focus on owner object dropdown
                            const ownerObject = document.getElementById('ownerObject');
                            if (ownerObject) {
                                ownerObject.focus();
                            }
                        } else if (stepNumber === 2) {
                            // Focus on role object dropdown if it exists
                            const roleObject = document.getElementById('roleObject');
                            if (roleObject) {
                                roleObject.focus();
                            }
                        } else if (stepNumber === 3) {
                            // Focus on first radio button
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
                            // Focus on general flow action textbox
                            const flowAction = document.getElementById('flowAction');
                            if (flowAction) {
                                flowAction.focus();
                            }
                        } else if (stepNumber === 5) {
                            // Focus on general flow name input when step 5 opens
                            const flowName = document.getElementById('flowName');
                            if (flowName) {
                                flowName.focus();
                            }
                        }
                    }, 100); // Small delay to ensure DOM is updated
                }
                
                function nextStep() {
                    if (currentStep === 3) {
                        // Decide whether to show step 4a or 4b based on user choice
                        if (isCreatingNewInstance) {
                            showStep('4a');
                        } else {
                            showStep('4b');
                        }
                    } else if (currentStep === '4a' || currentStep === '4b') {
                        showStep(5);
                        generateFlowName();
                        generateFlowTitle();
                    } else {
                        showStep(currentStep + 1);
                    }
                }
                
                function previousStep() {
                    if (currentStep === '4a' || currentStep === '4b') {
                        showStep(3);
                    } else if (currentStep === 5) {
                        // Go back to either 4a or 4b depending on previous choice
                        if (isCreatingNewInstance) {
                            showStep('4a');
                        } else {
                            showStep('4b');
                        }
                    } else {
                        showStep(currentStep - 1);
                    }
                }
                
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
                if (hasRoleObjects) {
                    document.getElementById('roleObject').addEventListener('change', function() {
                        selectedRole = this.value;
                    });
                }
                
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
                    generateFlowName();
                    generateFlowTitle();
                });
                
                // Handle step 4a keyboard navigation
                document.getElementById('step4a').addEventListener('keydown', function(event) {
                    if (event.key === 'Enter' && !document.getElementById('step4aNextBtn').disabled) {
                        event.preventDefault();
                        document.getElementById('step4aNextBtn').click();
                    }
                });
                
                // Step 4b: Action Selection
                document.getElementById('flowAction').addEventListener('input', function() {
                    selectedAction = this.value.trim();
                    validateFlowAction();
                    // Next button is always enabled since action is optional
                    document.getElementById('step4bNextBtn').disabled = false;
                });
                
                function validateFlowAction() {
                    const flowAction = document.getElementById('flowAction').value.trim();
                    const validationDiv = document.getElementById('flowActionValidation');
                    
                    if (!flowAction) {
                        // Empty is allowed - clear validation
                        validationDiv.textContent = '';
                        validationDiv.className = 'validation-message';
                        return;
                    }
                    
                    // Validate PascalCase format (starts with capital letter, no spaces, alphanumeric only)
                    const pascalCasePattern = /^[A-Z][a-zA-Z0-9]*$/;
                    if (!pascalCasePattern.test(flowAction)) {
                        validationDiv.textContent = 'Action must be in PascalCase format (e.g., Process, Calculate, Validate)';
                        validationDiv.className = 'validation-message invalid';
                    } else {
                        validationDiv.textContent = 'Valid action format';
                        validationDiv.className = 'validation-message valid';
                    }
                }
                
                document.getElementById('step4bBackBtn').addEventListener('click', previousStep);
                document.getElementById('step4bNextBtn').addEventListener('click', () => {
                    showStep(5);
                    generateFlowName();
                    generateFlowTitle();
                });
                
                // Handle step 4b keyboard navigation
                document.getElementById('step4b').addEventListener('keydown', function(event) {
                    if (event.key === 'Enter' && !document.getElementById('step4bNextBtn').disabled) {
                        event.preventDefault();
                        document.getElementById('step4bNextBtn').click();
                    }
                });
                
                // Step 5: General Flow Details
                document.getElementById('flowName').addEventListener('input', validateFlowName);
                document.getElementById('flowTitle').addEventListener('input', validateFlowTitle);
                
                document.getElementById('step5BackBtn').addEventListener('click', previousStep);
                document.getElementById('createGeneralFlowBtn').addEventListener('click', function() {
                    const flowData = {
                        ownerObjectName: selectedOwner,
                        roleRequired: selectedRole,
                        isCreatingNewInstance: isCreatingNewInstance,
                        targetObjectName: selectedTarget,
                        action: selectedAction,
                        flowName: document.getElementById('flowName').value.trim(),
                        flowTitle: document.getElementById('flowTitle').value.trim()
                    };
                    
                    vscode.postMessage({
                        command: 'createGeneralFlow',
                        data: flowData
                    });
                });
                
                // Handle step 5 keyboard navigation
                document.getElementById('step5').addEventListener('keydown', function(event) {
                    if (event.key === 'Enter' && !document.getElementById('createGeneralFlowBtn').disabled) {
                        event.preventDefault();
                        document.getElementById('createGeneralFlowBtn').click();
                    }
                });
                
                function generateFlowName() {
                    const owner = selectedOwner || 'Object';
                    const role = selectedRole || '';
                    const target = selectedTarget || '';
                    
                    // Use 'Add' as default action when creating new instance, otherwise use selectedAction
                    const action = isCreatingNewInstance === true ? (selectedAction || 'Add') : (selectedAction || '');
                    
                    let name = owner;
                    if (role) name += role;
                    if (action) name += action;
                    if (target && isCreatingNewInstance) name += target;
                    
                    document.getElementById('flowName').value = name;
                    validateFlowName();
                }
                
                function generateFlowTitle() {
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
                    
                    document.getElementById('flowTitle').value = title;
                    validateFlowTitle();
                }
                
                function validateFlowName() {
                    const flowName = document.getElementById('flowName').value;
                    if (flowName) {
                        vscode.postMessage({
                            command: 'validateName',
                            data: { flowName }
                        });
                    } else {
                        document.getElementById('flowNameValidation').textContent = '';
                        document.getElementById('flowNameValidation').className = 'validation-message';
                        updateCreateButton();
                    }
                }
                
                function validateFlowTitle() {
                    const flowTitle = document.getElementById('flowTitle').value;
                    if (flowTitle) {
                        vscode.postMessage({
                            command: 'validateTitle',
                            data: { flowTitle }
                        });
                    } else {
                        document.getElementById('flowTitleValidation').textContent = '';
                        document.getElementById('flowTitleValidation').className = 'validation-message';
                        updateCreateButton();
                    }
                }
                
                function updateCreateButton() {
                    const flowName = document.getElementById('flowName').value.trim();
                    const flowTitle = document.getElementById('flowTitle').value.trim();
                    const nameValid = document.getElementById('flowNameValidation').classList.contains('valid') || !flowName;
                    const titleValid = document.getElementById('flowTitleValidation').classList.contains('valid') || !flowTitle;
                    
                    document.getElementById('createGeneralFlowBtn').disabled = !flowName || !flowTitle || !nameValid || !titleValid;
                }
                
                function convertToHumanReadable(text) {
                    if (!text) return '';
                    return text.replace(/([A-Z])/g, ' $1').trim();
                }
                
                // Handle validation responses
                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    switch (message.command) {
                        case 'nameValidation':
                            const nameValidationDiv = document.getElementById('flowNameValidation');
                            nameValidationDiv.textContent = message.message;
                            nameValidationDiv.className = message.isValid ? 'validation-message valid' : 'validation-message invalid';
                            updateCreateButton();
                            break;
                            
                        case 'titleValidation':
                            const titleValidationDiv = document.getElementById('flowTitleValidation');
                            titleValidationDiv.textContent = message.message;
                            titleValidationDiv.className = message.isValid ? 'validation-message valid' : 'validation-message invalid';
                            updateCreateButton();
                            break;
                            
                        case 'success':
                            const messageDiv = document.getElementById('message');
                            messageDiv.innerHTML = '<div class="success-message">' + message.message + '</div>';
                            break;
                            
                        case 'error':
                            const errorDiv = document.getElementById('message');
                            errorDiv.innerHTML = '<div class="error-message">' + message.message + '</div>';
                            break;
                    }
                });
            </script>
        </body>
        </html>
    `;
}

module.exports = {
    showAddGeneralFlowWizard
};

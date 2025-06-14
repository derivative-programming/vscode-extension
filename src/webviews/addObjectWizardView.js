"use strict";
const vscode = require("vscode");
const { showObjectDetails } = require("./objects/objectDetailsView");

// Track the active wizard panel to avoid duplicates
let activeWizardPanel = null;

/**
 * Shows the Add Object Wizard in a webview
 * @param {Object} modelService ModelService instance
 */
function showAddObjectWizard(modelService) {
    // If a wizard panel already exists, reveal it instead of creating a new one
    if (activeWizardPanel) {
        activeWizardPanel.reveal(vscode.ViewColumn.One);
        return;
    }
    
    // Create webview panel
    const panel = vscode.window.createWebviewPanel(
        "addObjectWizard", 
        "Add Data Object Wizard",
        vscode.ViewColumn.One, 
        { 
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );
    
    // Track the panel
    activeWizardPanel = panel;
    
    // Remove from tracking when disposed
    panel.onDidDispose(() => {
        activeWizardPanel = null;
    });
    
    // Get all objects from the model service for validation and parent selection
    let allObjects = [];
    if (modelService && modelService.isFileLoaded()) {
        allObjects = modelService.getAllObjects();
    }
    
    // Generate the HTML for the wizard
    panel.webview.html = generateWizardHTML(allObjects);
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case "createObject":
                    try {
                        const { isLookupObject, parentObjectName, objectName } = message.data;
                        
                        // Get the current model
                        if (!modelService.isFileLoaded()) {
                            throw new Error("No model file is loaded");
                        }
                        
                        const model = modelService.getCurrentModel();
                        if (!model) {
                            throw new Error("Failed to get current model");
                        }
                        
                        // Ensure root exists
                        if (!model.namespace) {
                            model.namespace = [];
                        }
                        
                        // If no namespaces exist, create a default namespace
                        if (model.namespace.length === 0) {
                            model.namespace.push({ name: "Default", object: [] });
                        }
                        
                        // Ensure each namespace has an "object" array
                        model.namespace.forEach((ns) => {
                            if (!ns.object) {
                                ns.object = [];
                            }
                        });
                        
                        // Determine which namespace to use
                        let targetNsIndex = 0; // Default to first namespace
                        
                        // For non-lookup objects, find the namespace containing the parent object
                        if (!isLookupObject && parentObjectName) {
                            for (let i = 0; i < model.namespace.length; i++) {
                                const ns = model.namespace[i];
                                if (ns.object && ns.object.some(obj => obj.name === parentObjectName)) {
                                    targetNsIndex = i;
                                    break;
                                }
                            }
                        }
                        
                        // Create new object
                        const newObject = {
                            name: objectName,
                            parentObjectName: parentObjectName || ""
                        };
                        
                        // Add properties based on the parent
                        if (parentObjectName) {
                            const parentObjectIDProp = {
                                name: parentObjectName + "ID",
                                sqlServerDBDataType: "int",
                                isFK: "true",
                                isNotPublishedToSubscriptions: "true",
                                isFKConstraintSuppressed: "false"
                            };
                            
                            newObject.prop = [parentObjectIDProp];
                        } else {
                            newObject.prop = [];
                        }
                        
                        // Initialize additional arrays
                        newObject.propSubscription = [];
                        newObject.modelPkg = [];
                        newObject.lookupItem = [];
                        
                        // Add the object to the namespace
                        model.namespace[targetNsIndex].object.push(newObject);
                        
                        // Mark that there are unsaved changes
                        modelService.markUnsavedChanges();
                        
                        // Refresh the tree view
                        vscode.commands.executeCommand("appdna.refresh");
                        
                        // Select the newly created object in the tree view (after a short delay to allow refresh)
                        setTimeout(() => {
                            vscode.commands.executeCommand("appdna.selectDataObject", objectName);
                        }, 300);
                        
                        // Show success message and close the wizard
                        panel.webview.postMessage({ command: "objectCreated", objectName });
                        
                        // Open the Data Object Details view for the newly created object
                        const mockTreeItem = { label: objectName };
                        showObjectDetails(mockTreeItem, modelService);
                        
                        // If successful, close the panel after a short delay to allow the user to see the success message
                        setTimeout(() => {
                            if (activeWizardPanel === panel) {
                                panel.dispose();
                            }
                        }, 2000);
                        
                    } catch (error) {
                        // Send error back to the webview
                        panel.webview.postMessage({ 
                            command: "error", 
                            message: error.message || "An error occurred while creating the object"
                        });
                    }
                    return;
                    
                case "validateName":
                    try {
                        const { objectName } = message.data;
                        
                        // Validate name is not empty
                        if (!objectName) {
                            panel.webview.postMessage({ 
                                command: "nameValidation", 
                                isValid: false, 
                                message: "Object name cannot be empty"
                            });
                            return;
                        }
                        
                        // Validate name has no spaces
                        if (objectName.includes(" ")) {
                            panel.webview.postMessage({ 
                                command: "nameValidation", 
                                isValid: false, 
                                message: "Object name cannot contain spaces"
                            });
                            return;
                        }
                        
                        // Validate name is alpha only
                        if (!/^[a-zA-Z]+$/.test(objectName)) {
                            panel.webview.postMessage({ 
                                command: "nameValidation", 
                                isValid: false, 
                                message: "Object name must contain only letters"
                            });
                            return;
                        }
                        
                        // Validate name follows PascalCase
                        if (objectName[0] !== objectName[0].toUpperCase()) {
                            panel.webview.postMessage({ 
                                command: "nameValidation", 
                                isValid: false, 
                                message: "Object name must be in pascal case (example... ToDoItem)"
                            });
                            return;
                        }
                        
                        // Validate name is unique
                        if (modelService && modelService.isFileLoaded()) {
                            const allObjects = modelService.getAllObjects();
                            if (allObjects.some(obj => obj.name === objectName)) {
                                panel.webview.postMessage({ 
                                    command: "nameValidation", 
                                    isValid: false, 
                                    message: "An object with this name already exists"
                                });
                                return;
                            }
                        }
                        
                        // Name is valid
                        panel.webview.postMessage({ 
                            command: "nameValidation", 
                            isValid: true, 
                            message: ""
                        });
                    } catch (error) {
                        panel.webview.postMessage({ 
                            command: "nameValidation", 
                            isValid: false, 
                            message: error.message || "An error occurred during validation"
                        });
                    }
                    return;
                    
                case "cancel":
                    panel.dispose();
                    return;
            }
        }
    );
}

/**
 * Generates the HTML for the Add Object Wizard
 * @param {Array} allObjects All objects in the model for parent selection
 * @returns {string} HTML content for the webview
 */
function generateWizardHTML(allObjects) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Add Data Object Wizard</title>
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
                    margin-top: 20px;
                }
                button {
                    padding: 6px 14px;
                    color: var(--vscode-button-foreground);
                    background-color: var(--vscode-button-background);
                    border: none;
                    cursor: pointer;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .validation-message {
                    color: var(--vscode-errorForeground);
                    font-size: 12px;
                    margin-top: 5px;
                    min-height: 18px;
                }
                .input-note {
                    color: var(--vscode-descriptionForeground);
                    font-size: 12px;
                    margin-top: 3px;
                    font-style: italic;
                }
                .search-container {
                    position: relative;
                    margin-bottom: 10px;
                }
                .search-container input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid var(--vscode-input-border);
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                }
                .progress-indicator {
                    display: flex;
                    margin-bottom: 20px;
                    justify-content: space-between;
                }
                .progress-step {
                    flex: 1;
                    text-align: center;
                    padding: 8px;
                    background-color: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    margin: 0 2px;
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
            </style>
        </head>
        <body>
            <div class="progress-indicator">
                <div class="progress-step step-1 active">Step 1: Object Type</div>
                <div class="progress-step step-2">Step 2: Parent Object</div>
                <div class="progress-step step-3">Step 3: Object Name</div>
            </div>
            
            <div id="step1" class="step active">
                <h2>Step 1: Object Type</h2>
                <div class="form-group">
                    <p>Is this a lookup object?</p>
                    <div>
                        <label>
                            <input type="radio" name="isLookup" value="yes"> Yes
                        </label>
                        <label>
                            <input type="radio" name="isLookup" value="no"> No
                        </label>
                    </div>
                </div>
                <div class="button-container">
                    <button type="button" id="cancelBtn">Cancel</button>
                    <button type="button" id="step1NextBtn" disabled>Next</button>
                </div>
            </div>
            
            <div id="step2" class="step">
                <h2>Step 2: Parent Object</h2>
                <div id="parentObjectSelection">
                    <div class="form-group" id="parentSelectionForm">
                        <label for="parentObject">Select a parent object:</label>
                        <div class="search-container">
                            <input type="text" id="parentSearch" placeholder="Search parent objects...">
                        </div>
                        <select id="parentObject" size="10" style="height: 200px;">
                            ${allObjects.map(obj => `<option value="${obj.name}">${obj.name}</option>`).join('')}
                        </select>
                        <div class="validation-message" id="parentValidationMessage"></div>
                    </div>
                </div>
                <div class="button-container">
                    <button type="button" id="step2BackBtn">Back</button>
                    <button type="button" id="step2NextBtn" disabled>Next</button>
                </div>
            </div>
            
            <div id="step3" class="step">
                <h2>Step 3: Object Name</h2>
                <div class="form-group">
                    <label for="objectName">Enter object name:</label>
                    <input type="text" id="objectName">
                    <div class="input-note">Use pascal case naming (example: ToDoItem). No spaces allowed. Alpha characters only.</div>
                    <div class="validation-message" id="nameValidationMessage"></div>
                </div>
                <div class="button-container">
                    <button type="button" id="step3BackBtn">Back</button>
                    <button type="button" id="createBtn" disabled>Create Object</button>
                </div>
            </div>
            
            <div id="successMessage" class="success-message" style="display: none;"></div>
            <div id="errorMessage" class="error-message" style="display: none;"></div>
            
            <script>
                (function() {
                    const vscode = acquireVsCodeApi();
                    
                    // State management
                    let currentStep = 1;
                    let isLookupObject = null;
                    let selectedParentObject = null;
                    let objectName = "";
                    let nameIsValid = false;
                    
                    // Step 1 elements
                    const step1 = document.getElementById('step1');
                    const isLookupRadios = document.querySelectorAll('input[name="isLookup"]');
                    const step1NextBtn = document.getElementById('step1NextBtn');
                    
                    // Step 2 elements
                    const step2 = document.getElementById('step2');
                    const parentObjectSelect = document.getElementById('parentObject');
                    const parentSearch = document.getElementById('parentSearch');
                    const parentValidationMessage = document.getElementById('parentValidationMessage');
                    const parentSelectionForm = document.getElementById('parentSelectionForm');
                    const step2BackBtn = document.getElementById('step2BackBtn');
                    const step2NextBtn = document.getElementById('step2NextBtn');
                    
                    // Step 3 elements
                    const step3 = document.getElementById('step3');
                    const objectNameInput = document.getElementById('objectName');
                    const nameValidationMessage = document.getElementById('nameValidationMessage');
                    const step3BackBtn = document.getElementById('step3BackBtn');
                    const createBtn = document.getElementById('createBtn');
                    
                    // General elements
                    const cancelBtn = document.getElementById('cancelBtn');
                    const successMessage = document.getElementById('successMessage');
                    const errorMessage = document.getElementById('errorMessage');
                    
                    // Step indicator elements
                    const stepIndicators = document.querySelectorAll('.progress-step');
                    
                    // Handle step 1 selection
                    isLookupRadios.forEach(radio => {
                        radio.addEventListener('change', () => {
                            isLookupObject = radio.value === 'yes';
                            step1NextBtn.disabled = false;
                        });
                    });
                    
                    // Handle step 1 next button
                    step1NextBtn.addEventListener('click', () => {
                        // Move to step 2
                        showStep(2);
                        
                        // If it's a lookup object, set parent to 'Pac' and disable selection
                        if (isLookupObject) {
                            selectedParentObject = 'Pac';
                            parentSelectionForm.innerHTML = '<p>For lookup objects, the parent object is fixed to "Pac"</p>';
                            step2NextBtn.disabled = false;
                        } else {
                            // For regular objects, enable parent selection
                            step2NextBtn.disabled = !selectedParentObject;
                        }
                    });
                    
                    // Handle parent object selection
                    if (parentObjectSelect) {
                        parentObjectSelect.addEventListener('change', () => {
                            if (parentObjectSelect.value) {
                                selectedParentObject = parentObjectSelect.value;
                                step2NextBtn.disabled = false;
                                parentValidationMessage.textContent = '';
                            } else {
                                selectedParentObject = null;
                                step2NextBtn.disabled = true;
                                parentValidationMessage.textContent = 'Please select a parent object';
                            }
                        });
                    }
                    
                    // Handle parent search filtering
                    if (parentSearch) {
                        parentSearch.addEventListener('input', () => {
                            const searchValue = parentSearch.value.toLowerCase();
                            Array.from(parentObjectSelect.options).forEach(option => {
                                const optionText = option.text.toLowerCase();
                                option.style.display = optionText.includes(searchValue) ? '' : 'none';
                            });
                        });
                    }
                    
                    // Handle step 2 navigation
                    step2BackBtn.addEventListener('click', () => {
                        showStep(1);
                    });
                    
                    step2NextBtn.addEventListener('click', () => {
                        showStep(3);
                    });
                    
                    // Handle step 3 navigation
                    step3BackBtn.addEventListener('click', () => {
                        showStep(2);
                    });
                    
                    // Handle object name input and validation
                    objectNameInput.addEventListener('input', () => {
                        objectName = objectNameInput.value.trim();
                        validateObjectName();
                    });
                    
                    // Validate object name
                    function validateObjectName() {
                        if (objectName) {
                            vscode.postMessage({
                                command: 'validateName',
                                data: { objectName }
                            });
                        } else {
                            nameIsValid = false;
                            nameValidationMessage.textContent = 'Object name cannot be empty';
                            createBtn.disabled = true;
                        }
                    }
                    
                    // Create object button handler
                    createBtn.addEventListener('click', () => {
                        // Disable the button to prevent multiple submissions
                        createBtn.disabled = true;
                        
                        vscode.postMessage({
                            command: 'createObject',
                            data: {
                                isLookupObject,
                                parentObjectName: selectedParentObject,
                                objectName
                            }
                        });
                    });
                    
                    // Cancel button handler
                    cancelBtn.addEventListener('click', () => {
                        vscode.postMessage({ command: 'cancel' });
                    });
                    
                    // Function to show the specified step
                    function showStep(step) {
                        // Hide all steps and update indicators
                        document.querySelectorAll('.step').forEach(el => {
                            el.classList.remove('active');
                        });
                        
                        stepIndicators.forEach((indicator, index) => {
                            indicator.classList.toggle('active', index + 1 === step);
                        });
                        
                        // Show the requested step
                        document.getElementById('step' + step).classList.add('active');
                        currentStep = step;
                    }
                    
                    // Handle messages from the extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'nameValidation':
                                nameIsValid = message.isValid;
                                nameValidationMessage.textContent = message.message;
                                createBtn.disabled = !nameIsValid;
                                break;
                                
                            case 'objectCreated':
                                successMessage.textContent = \`Object "\${message.objectName}" was created successfully!\`;
                                successMessage.style.display = 'block';
                                
                                // Disable all inputs and buttons
                                document.querySelectorAll('input, select, button').forEach(el => {
                                    el.disabled = true;
                                });
                                break;
                                
                            case 'error':
                                errorMessage.textContent = message.message;
                                errorMessage.style.display = 'block';
                                // Re-enable the create button
                                createBtn.disabled = false;
                                break;
                        }
                    });
                })();
            </script>
        </body>
        </html>
    `;
}

// Export functions
module.exports = {
    showAddObjectWizard
};
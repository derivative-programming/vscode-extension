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
                        
                        
                        // Initialize additional arrays
                        newObject.propSubscription = [];
                        newObject.modelPkg = [];
                        newObject.lookupItem = [];
                        newObject.isLookup = "false"; // Default to false unless specified

                        if (isLookupObject) {
                            newObject.isLookup = String(isLookupObject);
                        }

                        if(newObject.isLookup === "true") {
                            newObject.lookupItem = [
                                {
                                    "description": "",
                                    "displayName": "",
                                    "isActive": "true",
                                    "name": "Unknown"
                                }
                            ];
                        }

                        
                        // Add properties based on the parent
                        if (parentObjectName) {
                            const parentObjectIDProp = {
                                name: parentObjectName + "ID",
                                sqlServerDBDataType: "int",
                                isFK: "true",
                                isNotPublishedToSubscriptions: "true",
                                isFKConstraintSuppressed: "false"
                            };

                            if(newObject.isLookup === "true") {
                                parentObjectIDProp.isFKLookup = "true";
                            }
                            
                            newObject.prop = [parentObjectIDProp];
                        } else {
                            newObject.prop = [];
                        }
                        
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
                        const { objectName, isLookupObject } = message.data;
                        
                        // Validate name is not empty
                        if (!objectName) {
                            panel.webview.postMessage({ 
                                command: "nameValidation", 
                                isValid: false, 
                                message: "Object name cannot be empty"
                            });
                            return;
                        }
                        
                        // Validate name length does not exceed 100 characters
                        if (objectName.length > 100) {
                            panel.webview.postMessage({ 
                                command: "nameValidation", 
                                isValid: false, 
                                message: "Object name cannot exceed 100 characters"
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
                        
                        // Validate lookup object name doesn't contain "Lookup"
                        if (isLookupObject && objectName.toLowerCase().includes('lookup')) {
                            panel.webview.postMessage({ 
                                command: "nameValidation", 
                                isValid: false, 
                                message: "It is not necessary to have Lookup in the name"
                            });
                            return;
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
                    
                case "validateBulkObjects":
                    try {
                        const { input } = message.data;
                        const lines = input.split('\n').filter(line => line.trim());
                        const results = [];
                        const validObjects = [];
                        const allObjects = modelService.getAllObjects();
                        
                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i].trim();
                            const lineNumber = i + 1;
                            
                            // Parse the line format
                            let objectName = '';
                            let parentObjectName = '';
                            let isLookupObject = false;
                            
                            const childMatch = line.match(/^(.+?)\s+is\s+a\s+child\s+of\s+(.+)$/i);
                            const lookupMatch = line.match(/^(.+?)\s+is\s+a\s+lookup$/i);
                            
                            if (childMatch) {
                                objectName = childMatch[1].trim();
                                parentObjectName = childMatch[2].trim();
                                isLookupObject = false;
                            } else if (lookupMatch) {
                                objectName = lookupMatch[1].trim();
                                parentObjectName = 'Pac';
                                isLookupObject = true;
                            } else {
                                results.push({
                                    line: `Line ${lineNumber}: "${line}"`,
                                    isValid: false,
                                    message: 'Invalid format. Use "[ObjectName] is a child of [ParentObjectName]" or "[ObjectName] is a lookup"'
                                });
                                continue;
                            }
                            
                            // Validate object name
                            if (!objectName) {
                                results.push({
                                    line: `Line ${lineNumber}`,
                                    isValid: false,
                                    message: "Object name cannot be empty"
                                });
                                continue;
                            }
                            
                            if (objectName.length > 100) {
                                results.push({
                                    line: `Line ${lineNumber}`,
                                    isValid: false,
                                    message: "Object name cannot exceed 100 characters"
                                });
                                continue;
                            }
                            
                            if (objectName.includes(" ")) {
                                results.push({
                                    line: `Line ${lineNumber}`,
                                    isValid: false,
                                    message: "Object name cannot contain spaces"
                                });
                                continue;
                            }
                            
                            if (!/^[a-zA-Z]+$/.test(objectName)) {
                                results.push({
                                    line: `Line ${lineNumber}`,
                                    isValid: false,
                                    message: "Object name must contain only letters"
                                });
                                continue;
                            }
                            
                            if (objectName[0] !== objectName[0].toUpperCase()) {
                                results.push({
                                    line: `Line ${lineNumber}`,
                                    isValid: false,
                                    message: "Object name must be in pascal case (example: ToDoItem)"
                                });
                                continue;
                            }
                            
                            // Check for duplicate names within input
                            const duplicateInInput = validObjects.some(obj => obj.objectName === objectName);
                            if (duplicateInInput) {
                                results.push({
                                    line: `Line ${lineNumber}`,
                                    isValid: false,
                                    message: "Duplicate object name in input"
                                });
                                continue;
                            }
                            
                            // Check if object already exists
                            if (allObjects.some(obj => obj.name === objectName)) {
                                results.push({
                                    line: `Line ${lineNumber}`,
                                    isValid: false,
                                    message: "An object with this name already exists"
                                });
                                continue;
                            }
                            
                            // Additional validation for lookup objects
                            if (isLookupObject && objectName.toLowerCase().includes('lookup')) {
                                results.push({
                                    line: `Line ${lineNumber}`,
                                    isValid: false,
                                    message: "It is not necessary to have 'Lookup' in the name"
                                });
                                continue;
                            }
                            
                            // Validate parent object for non-lookup objects
                            if (!isLookupObject) {
                                if (!parentObjectName) {
                                    results.push({
                                        line: `Line ${lineNumber}`,
                                        isValid: false,
                                        message: "Parent object name cannot be empty"
                                    });
                                    continue;
                                }
                                
                                // Check if parent exists in model or in the current input being validated
                                const parentExistsInModel = allObjects.some(obj => obj.name === parentObjectName);
                                const parentExistsInInput = validObjects.some(obj => obj.objectName === parentObjectName);
                                
                                if (!parentExistsInModel && !parentExistsInInput) {
                                    results.push({
                                        line: `Line ${lineNumber}`,
                                        isValid: false,
                                        message: `Parent object "${parentObjectName}" does not exist`
                                    });
                                    continue;
                                }
                            }
                            
                            // If we get here, the object is valid
                            results.push({
                                line: `Line ${lineNumber}`,
                                objectName: objectName,
                                isValid: true,
                                message: isLookupObject ? 
                                    `Lookup object "${objectName}" is valid` : 
                                    `Object "${objectName}" with parent "${parentObjectName}" is valid`
                            });
                            
                            validObjects.push({
                                objectName,
                                parentObjectName,
                                isLookupObject
                            });
                        }
                        
                        panel.webview.postMessage({
                            command: "bulkValidationResults",
                            results: results,
                            validObjects: validObjects
                        });
                        
                    } catch (error) {
                        panel.webview.postMessage({
                            command: "bulkError",
                            message: error.message || "An error occurred during validation"
                        });
                    }
                    return;
                    
                case "createBulkObjects":
                    try {
                        const { objects } = message.data;
                        
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
                        
                        // Determine which namespace to use (default to first namespace)
                        let targetNsIndex = 0;
                        
                        let createdCount = 0;
                        
                        // Create objects in order (dependencies first)
                        for (const objData of objects) {
                            const { objectName, parentObjectName, isLookupObject } = objData;
                            
                            const newObject = {
                                name: objectName,
                                parentObjectName: parentObjectName || ""
                            };
                            
                            // Initialize additional arrays
                            newObject.propSubscription = [];
                            newObject.modelPkg = [];
                            newObject.lookupItem = [];
                            newObject.isLookup = "false"; // Default to false unless specified
                            
                            if (isLookupObject) {
                                newObject.isLookup = String(isLookupObject);
                            }
                            
                            if(newObject.isLookup === "true") {
                                newObject.lookupItem = [
                                    {
                                        "description": "",
                                        "displayName": "",
                                        "isActive": "true",
                                        "name": "Unknown"
                                    }
                                ];
                            }
                            
                            // Add properties based on the parent
                            if (parentObjectName) {
                                const parentObjectIDProp = {
                                    name: parentObjectName + "ID",
                                    sqlServerDBDataType: "int",
                                    isFK: "true",
                                    isNotPublishedToSubscriptions: "true",
                                    isFKConstraintSuppressed: "false"
                                };

                                if(newObject.isLookup === "true") {
                                    parentObjectIDProp.isFKLookup = "true";
                                }
                                
                                newObject.prop = [parentObjectIDProp];
                            } else {
                                newObject.prop = [];
                            }
                            
                            // Add the object to the namespace
                            model.namespace[targetNsIndex].object.push(newObject);
                            createdCount++;
                        }
                        
                        // Mark that there are unsaved changes
                        modelService.markUnsavedChanges();
                        
                        // Refresh the tree view
                        vscode.commands.executeCommand("appdna.refresh");
                        
                        // Send success message
                        panel.webview.postMessage({ 
                            command: "bulkObjectsCreated", 
                            count: createdCount 
                        });
                        
                        // Close the wizard after a delay
                        setTimeout(() => {
                            if (activeWizardPanel === panel) {
                                panel.dispose();
                            }
                        }, 2000);
                        
                    } catch (error) {
                        panel.webview.postMessage({
                            command: "bulkError",
                            message: error.message || "An error occurred while creating objects"
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
                    padding: 8px 16px;
                    color: var(--vscode-button-foreground);
                    background-color: var(--vscode-button-background);
                    border: none;
                    cursor: pointer;
                    border-radius: 3px;
                    box-sizing: border-box;
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    line-height: 1.2;
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
                .bulk-add-btn {
                    margin-top: 10px;
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                .bulk-add-btn:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                }
                /* Modal button layout & secondary style */
                .modal-buttons {
                    justify-content: flex-end;
                    gap: 10px;
                }
                .secondary-btn {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                .secondary-btn:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                }
                .modal {
                    display: none;
                    position: fixed;
                    z-index: 1000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                }
                .modal-content {
                    background-color: var(--vscode-editor-background);
                    margin: 10% auto;
                    padding: 20px;
                    border: 1px solid var(--vscode-panel-border);
                    width: 80%;
                    max-width: 600px;
                    border-radius: 4px;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 10px;
                }
                .modal-close {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: var(--vscode-foreground);
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .modal-close:hover {
                    background-color: var(--vscode-toolbar-hoverBackground);
                }
                .bulk-input {
                    width: 100%;
                    height: 200px;
                    padding: 10px;
                    border: 1px solid var(--vscode-input-border);
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    font-family: var(--vscode-font-family);
                    resize: vertical;
                    box-sizing: border-box;
                }
                .bulk-input:focus {
                    outline: 1px solid var(--vscode-focusBorder);
                    border-color: var(--vscode-focusBorder);
                }
                .bulk-validation {
                    max-height: 150px;
                    overflow-y: auto;
                    margin: 10px 0;
                    padding: 10px;
                    background-color: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                }
                .bulk-error {
                    color: var(--vscode-errorForeground);
                    margin: 2px 0;
                    font-size: 12px;
                }
                .bulk-success {
                    color: var(--vscode-charts-green);
                    margin: 2px 0;
                    font-size: 12px;
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
                <div style="text-align: left; margin-top: 10px;">
                    <button type="button" id="bulkAddBtn" class="bulk-add-btn">Bulk Add</button>
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
                    <div class="input-note">Use pascal case naming (example: ToDoItem). Use singular naming (e.g., "User" not "Users"). No spaces allowed. Alpha characters only. Maximum 100 characters.</div>
                    <div class="validation-message" id="nameValidationMessage"></div>
                </div>
                <div class="button-container">
                    <button type="button" id="step3BackBtn">Back</button>
                    <button type="button" id="createBtn" disabled>Create Object</button>
                </div>
            </div>
            
            <div id="successMessage" class="success-message" style="display: none;"></div>
            <div id="errorMessage" class="error-message" style="display: none;"></div>
            
            <!-- Bulk Add Modal -->
            <div id="bulkAddModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Bulk Add Data Objects</h3>
                        <button class="modal-close" id="modalClose">&times;</button>
                    </div>
                    <div class="form-group">
                        <label for="bulkInput">Enter data objects (one per line):</label>
                        <textarea id="bulkInput" class="bulk-input" placeholder="Enter data objects using one of these formats:&#10;ObjectName is a child of ParentObjectName&#10;ObjectName is a lookup&#10;&#10;Example:&#10;Customer is a child of Pac&#10;OrderStatus is a lookup&#10;Order is a child of Customer"></textarea>
                        <div class="input-note">
                            Format: "[ObjectName] is a child of [ParentObjectName]" or "[ObjectName] is a lookup".<br>
                            Use singular naming (e.g., "User" not "Users"). Objects must be PascalCase with no spaces.
                        </div>
                    </div>
                    <div id="bulkValidation" class="bulk-validation" style="display: none;"></div>
                    <div class="button-container modal-buttons">
                        <button type="button" id="bulkValidate">Validate</button>
                        <button type="button" id="bulkCreate" disabled>Create Objects</button>
                        <button type="button" id="bulkCancel" class="secondary-btn">Cancel</button>
                    </div>
                </div>
            </div>
            
            <script>
                (function() {
                    const vscode = acquireVsCodeApi();
                    
                    // Objects data passed from extension
                    const allObjects = ${JSON.stringify(allObjects)};
                    
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
                    
                    // Bulk add modal elements
                    const bulkAddBtn = document.getElementById('bulkAddBtn');
                    const bulkAddModal = document.getElementById('bulkAddModal');
                    const modalClose = document.getElementById('modalClose');
                    const bulkInput = document.getElementById('bulkInput');
                    const bulkValidation = document.getElementById('bulkValidation');
                    const bulkCancel = document.getElementById('bulkCancel');
                    const bulkValidate = document.getElementById('bulkValidate');
                    const bulkCreate = document.getElementById('bulkCreate');
                    
                    // Step indicator elements
                    const stepIndicators = document.querySelectorAll('.progress-step');
                    
                    // Handle step 1 selection
                    isLookupRadios.forEach(radio => {
                        radio.addEventListener('change', () => {
                            isLookupObject = radio.value === 'yes';
                            step1NextBtn.disabled = false;
                        });
                    });
                    
                    // Handle step 1 keyboard navigation
                    step1.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter' && !step1NextBtn.disabled) {
                            event.preventDefault();
                            step1NextBtn.click();
                        }
                    });
                    
                    // Handle step 1 next button
                    step1NextBtn.addEventListener('click', () => {
                        // Update step 2 display based on lookup object selection first
                        updateStep2Display();
                        
                        // Then move to step 2
                        showStep(2);
                    });
                    
                    // Function to update step 2 display based on lookup object selection
                    function updateStep2Display() {
                        if (isLookupObject) {
                            selectedParentObject = 'Pac';
                            parentSelectionForm.innerHTML = '<p>For lookup objects, the parent object is fixed to "Pac"</p>';
                            step2NextBtn.disabled = false;
                        } else {
                            // For regular objects, restore parent selection
                            parentSelectionForm.innerHTML = \`
                                <label for="parentObject">Select a parent object:</label>
                                <div class="search-container">
                                    <input type="text" id="parentSearch" placeholder="Search parent objects...">
                                </div>
                                <select id="parentObject" size="10" style="height: 200px;">
                                    \${allObjects.map(obj => \`<option value="\${obj.name}">\${obj.name}</option>\`).join('')}
                                </select>
                                <div class="validation-message" id="parentValidationMessage"></div>
                            \`;
                            
                            // Re-setup event listeners for the new elements
                            const newParentObjectSelect = document.getElementById('parentObject');
                            const newParentSearch = document.getElementById('parentSearch');
                            const newParentValidationMessage = document.getElementById('parentValidationMessage');
                            
                            if (newParentObjectSelect) {
                                newParentObjectSelect.addEventListener('change', () => {
                                    if (newParentObjectSelect.value) {
                                        selectedParentObject = newParentObjectSelect.value;
                                        step2NextBtn.disabled = false;
                                        newParentValidationMessage.textContent = '';
                                    } else {
                                        selectedParentObject = null;
                                        step2NextBtn.disabled = true;
                                        newParentValidationMessage.textContent = 'Please select a parent object';
                                    }
                                });
                            }
                            
                            if (newParentSearch) {
                                newParentSearch.addEventListener('input', () => {
                                    const searchValue = newParentSearch.value.toLowerCase();
                                    Array.from(newParentObjectSelect.options).forEach(option => {
                                        const optionText = option.text.toLowerCase();
                                        option.style.display = optionText.includes(searchValue) ? '' : 'none';
                                    });
                                });
                            }
                            
                            // Reset parent selection state
                            selectedParentObject = null;
                            step2NextBtn.disabled = true;
                        }
                    }
                    
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
                    
                    // Handle step 2 keyboard navigation
                    step2.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter' && !step2NextBtn.disabled) {
                            event.preventDefault();
                            step2NextBtn.click();
                        }
                    });
                    
                    // Handle step 3 navigation
                    step3BackBtn.addEventListener('click', () => {
                        showStep(2);
                    });
                    
                    // Handle step 3 keyboard navigation
                    step3.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter' && !createBtn.disabled) {
                            event.preventDefault();
                            createBtn.click();
                        }
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
                                data: { objectName, isLookupObject }
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
                    
                    // Bulk add modal handlers
                    let bulkObjects = [];
                    let bulkValidationResults = [];
                    
                    bulkAddBtn.addEventListener('click', () => {
                        bulkAddModal.style.display = 'block';
                        bulkInput.focus();
                    });
                    
                    modalClose.addEventListener('click', () => {
                        bulkAddModal.style.display = 'none';
                        bulkInput.value = '';
                        bulkValidation.style.display = 'none';
                        bulkCreate.disabled = true;
                        bulkObjects = [];
                        bulkValidationResults = [];
                    });
                    
                    bulkCancel.addEventListener('click', () => {
                        bulkAddModal.style.display = 'none';
                        bulkInput.value = '';
                        bulkValidation.style.display = 'none';
                        bulkCreate.disabled = true;
                        bulkObjects = [];
                        bulkValidationResults = [];
                    });
                    
                    // Close modal when clicking outside
                    bulkAddModal.addEventListener('click', (e) => {
                        if (e.target === bulkAddModal) {
                            bulkCancel.click();
                        }
                    });
                    
                    bulkValidate.addEventListener('click', () => {
                        const input = bulkInput.value.trim();
                        if (!input) {
                            bulkValidation.innerHTML = '<div class="bulk-error">Please enter at least one data object.</div>';
                            bulkValidation.style.display = 'block';
                            bulkCreate.disabled = true;
                            return;
                        }
                        
                        vscode.postMessage({
                            command: 'validateBulkObjects',
                            data: { input }
                        });
                    });
                    
                    bulkCreate.addEventListener('click', () => {
                        if (bulkObjects.length === 0) return;
                        
                        bulkCreate.disabled = true;
                        vscode.postMessage({
                            command: 'createBulkObjects',
                            data: { objects: bulkObjects }
                        });
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
                        
                        // Focus management for each step
                        setTimeout(() => {
                            if (step === 1) {
                                // Focus on the 'Yes' radio button
                                const yesRadio = document.querySelector('input[name="isLookup"][value="yes"]');
                                if (yesRadio) {
                                    yesRadio.focus();
                                }
                            } else if (step === 2) {
                                // Focus on the search parent objects textbox
                                // For regular objects, the search input is dynamically created, so we need to get it fresh
                                const currentParentSearch = document.getElementById('parentSearch');
                                if (currentParentSearch) {
                                    currentParentSearch.focus();
                                }
                            } else if (step === 3) {
                                // Focus on the data object name textbox
                                if (objectNameInput) {
                                    objectNameInput.focus();
                                }
                            }
                        }, 100); // Small delay to ensure DOM is updated
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
                                
                            case 'bulkValidationResults':
                                bulkValidationResults = message.results;
                                bulkObjects = message.validObjects;
                                
                                let validationHtml = '';
                                let hasErrors = false;
                                let validCount = 0;
                                
                                bulkValidationResults.forEach(result => {
                                    if (result.isValid) {
                                        validationHtml += \`<div class="bulk-success">✓ \${result.objectName}: \${result.message}</div>\`;
                                        validCount++;
                                    } else {
                                        validationHtml += \`<div class="bulk-error">✗ \${result.line}: \${result.message}</div>\`;
                                        hasErrors = true;
                                    }
                                });
                                
                                if (validCount > 0 && !hasErrors) {
                                    validationHtml += \`<div class="bulk-success" style="margin-top: 10px; font-weight: bold;">\${validCount} object(s) ready to create</div>\`;
                                    bulkCreate.disabled = false;
                                } else {
                                    bulkCreate.disabled = true;
                                }
                                
                                bulkValidation.innerHTML = validationHtml;
                                bulkValidation.style.display = 'block';
                                break;
                                
                            case 'bulkObjectsCreated':
                                bulkAddModal.style.display = 'none';
                                successMessage.textContent = \`\${message.count} object(s) created successfully!\`;
                                successMessage.style.display = 'block';
                                
                                // Reset bulk modal state
                                bulkInput.value = '';
                                bulkValidation.style.display = 'none';
                                bulkCreate.disabled = true;
                                bulkObjects = [];
                                bulkValidationResults = [];
                                
                                // Disable all inputs and buttons
                                document.querySelectorAll('input, select, button').forEach(el => {
                                    el.disabled = true;
                                });
                                break;
                                
                            case 'bulkError':
                                errorMessage.textContent = message.message;
                                errorMessage.style.display = 'block';
                                bulkCreate.disabled = false;
                                break;
                        }
                    });
                    
                    // Set initial focus when the wizard loads
                    setTimeout(() => {
                        showStep(1); // This will trigger focus on the Yes radio button
                    }, 100);
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
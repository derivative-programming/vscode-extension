/**
 * addReportWizardView.js
 * Add Report Wizard webview implementation for AppDNA extension
 * Created: 2025-06-15
 */

"use strict";
const vscode = require("vscode");
const { showReportDetails } = require("./reports/reportDetailsView");

// Track the active wizard panel to avoid duplicates
let activeWizardPanel = null;

/**
 * Shows the Add Report Wizard in a webview
 * @param {Object} modelService ModelService instance
 * @param {vscode.ExtensionContext} context Extension context
 */
function showAddReportWizard(modelService, context) {
    // If a wizard panel already exists, reveal it instead of creating a new one
    if (activeWizardPanel) {
        activeWizardPanel.reveal(vscode.ViewColumn.One);
        return;
    }
    
    // Create webview panel
    const panel = vscode.window.createWebviewPanel(
        "addReportWizard", 
        "Add Report Wizard",
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
    
    // Get all objects from the model service for owner and target selection
    let allObjects = [];
    let roleObjects = [];
    if (modelService && modelService.isFileLoaded()) {
        allObjects = modelService.getAllObjects();
        // Filter to get Role objects (only exact match for 'Role')
        roleObjects = allObjects.filter(obj => obj.name === 'Role');
    }
    
    // Generate the HTML for the wizard
    panel.webview.html = generateWizardHTML(allObjects, roleObjects);
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case "createReport":
                    try {
                        const { ownerObjectName, roleRequired, visualizationType, targetObjectName, reportName, reportTitle } = message.data;
                        
                        // Get the current model
                        if (!modelService.isFileLoaded()) {
                            throw new Error("No model file is loaded");
                        }
                        
                        const model = modelService.getCurrentModel();
                        if (!model) {
                            throw new Error("Failed to get current model");
                        }
                        
                        // Find the owner object
                        let ownerObject = null;
                        if (model.namespace) {
                            for (const ns of model.namespace) {
                                if (ns.object) {
                                    const found = ns.object.find(obj => obj.name === ownerObjectName);
                                    if (found) {
                                        ownerObject = found;
                                        break;
                                    }
                                }
                            }
                        }
                        
                        if (!ownerObject) {
                            throw new Error(`Owner object "${ownerObjectName}" not found`);
                        }
                        
                        // Ensure the owner object has a report array
                        if (!ownerObject.report) {
                            ownerObject.report = [];
                        }
                        
                        // Create new report object
                        const newReport = {
                            name: reportName,
                            titleText: reportTitle,
                            visualizationType: visualizationType,
                            isCustomSqlUsed: "false",
                            isPage: "true",
                            reportColumn: [],
                            reportButton: [],
                            reportParam: []
                        };
                        
                        newReport.reportButton.push({
                            buttonName: "Back",
                            buttonText: "Back",
                            buttonType: "back"
                        });

                        // Add optional properties based on wizard selections
                        if (roleRequired) {
                            newReport.isAuthorizationRequired = "true";
                            newReport.roleRequired = roleRequired;
                            newReport.layoutName = roleRequired + "Layout";
                        }
                        
                        if (targetObjectName && visualizationType === "Grid") {
                            newReport.targetChildObject = targetObjectName;
                        }
                        
                        // Create page init flow for the report
                        const pageInitFlowName = reportName + "InitReport";
                        const pageInitFlow = {
                            name: pageInitFlowName,
                            titleText: reportTitle + " Initialization",
                            objectWorkflowOutputVar: []
                        };
                        
                        // Ensure the owner object has an objectWorkflow array
                        if (!ownerObject.objectWorkflow) {
                            ownerObject.objectWorkflow = [];
                        }
                        
                        // Add the page init flow to the owner object
                        ownerObject.objectWorkflow.push(pageInitFlow);
                        
                        // Set the report's initObjectWorkflowName to reference the page init flow
                        newReport.initObjectWorkflowName = pageInitFlowName;
                        
                        // Add the new report to the owner object
                        ownerObject.report.push(newReport);
                        
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
                            message: `Report "${reportName}" created successfully!`
                        });
                        
                        // Close the wizard after a short delay
                        setTimeout(() => {
                            panel.dispose();
                            
                            // Refresh the tree view
                            vscode.commands.executeCommand('appdna.refresh');
                            
                            // Open the report details view
                            const reportNode = {
                                label: reportName,
                                objectName: ownerObjectName,
                                reportName: reportName,
                                contextValue: 'report'
                            };
                            showReportDetails(reportNode, modelService, context);
                            
                        }, 1500);
                        
                    } catch (error) {
                        // Send error back to the webview
                        panel.webview.postMessage({ 
                            command: "error", 
                            message: error.message || "An error occurred while creating the report"
                        });
                    }
                    return;
                    
                case "validateName":
                    try {
                        const { reportName } = message.data;
                        
                        // Validate name is not empty
                        if (!reportName) {
                            panel.webview.postMessage({ 
                                command: "nameValidation", 
                                isValid: false, 
                                message: "Report name cannot be empty"
                            });
                            return;
                        }
                        
                        // Validate name length does not exceed 100 characters
                        if (reportName.length > 100) {
                            panel.webview.postMessage({ 
                                command: "nameValidation", 
                                isValid: false, 
                                message: "Report name cannot exceed 100 characters"
                            });
                            return;
                        }
                        
                        // Validate name has no spaces or special characters
                        if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(reportName)) {
                            panel.webview.postMessage({ 
                                command: "nameValidation", 
                                isValid: false, 
                                message: "Report name must start with a letter and contain only letters and numbers (PascalCase)"
                            });
                            return;
                        }
                        
                        // Check for duplicate names across all reports
                        const allReports = modelService.getAllReports();
                        const duplicateExists = allReports.some(report => report.name === reportName);
                        
                        if (duplicateExists) {
                            panel.webview.postMessage({ 
                                command: "nameValidation", 
                                isValid: false, 
                                message: "A report with this name already exists"
                            });
                            return;
                        }
                        
                        // Name is valid
                        panel.webview.postMessage({ 
                            command: "nameValidation", 
                            isValid: true, 
                            message: "Report name is valid"
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
                        const { reportTitle } = message.data;
                        
                        // Validate title is not empty
                        if (!reportTitle) {
                            panel.webview.postMessage({ 
                                command: "titleValidation", 
                                isValid: false, 
                                message: "Report title cannot be empty"
                            });
                            return;
                        }
                        
                        // Validate title length does not exceed 100 characters
                        if (reportTitle.length > 100) {
                            panel.webview.postMessage({ 
                                command: "titleValidation", 
                                isValid: false, 
                                message: "Report title cannot exceed 100 characters"
                            });
                            return;
                        }
                        
                        // Title is valid
                        panel.webview.postMessage({ 
                            command: "titleValidation", 
                            isValid: true, 
                            message: "Report title is valid"
                        });
                        
                    } catch (error) {
                        panel.webview.postMessage({ 
                            command: "titleValidation", 
                            isValid: false, 
                            message: "Error validating title"
                        });
                    }
                    return;
                    
                case "getChildObjects":
                    try {
                        const { parentObjectName } = message.data;
                        
                        // Get child objects of the selected parent
                        const childObjects = allObjects.filter(obj => obj.parentObjectName === parentObjectName);
                        
                        panel.webview.postMessage({
                            command: "childObjects",
                            childObjects: childObjects
                        });
                        
                    } catch (error) {
                        panel.webview.postMessage({
                            command: "error",
                            message: "Error retrieving child objects"
                        });
                    }
                    return;
            }
        }
    );
}

/**
 * Generates the HTML for the Add Report Wizard
 * @param {Array} allObjects All objects in the model for owner and target selection
 * @param {Array} roleObjects Role objects for role selection
 * @returns {string} HTML content for the webview
 */
function generateWizardHTML(allObjects, roleObjects) {
    // Generate options for owner object selection
    const ownerObjectOptions = allObjects
        .filter(obj => obj.name) // Only objects with names
        .map(obj => `<option value="${obj.name}">${obj.name}</option>`)
        .join('');
    
    // Generate options for role selection (if Role objects exist)
    let roleOptions = '';
    if (roleObjects.length > 0) {
        roleOptions = roleObjects
            .filter(obj => obj.lookupItem && Array.isArray(obj.lookupItem))
            .flatMap(obj => obj.lookupItem)
            .filter(item => item.displayName)
            .map(item => `<option value="${item.displayName}">${item.displayName}</option>`)
            .join('');
    }
    
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Add Report Wizard</title>
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
                .viz-option {
                    padding: 10px;
                    margin: 5px 0;
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 3px;
                    cursor: pointer;
                    background-color: var(--vscode-input-background);
                }
                .viz-option:hover {
                    background-color: var(--vscode-list-hoverBackground);
                }
                .viz-option:focus {
                    outline: 1px solid var(--vscode-focusBorder);
                    outline-offset: 2px;
                }
                .viz-option.selected {
                    background-color: var(--vscode-list-activeSelectionBackground);
                    color: var(--vscode-list-activeSelectionForeground);
                    border-color: var(--vscode-focusBorder);
                }
                .viz-title {
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .viz-description {
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                }
            </style>
        </head>
        <body>
            <div class="progress-indicator">
                <div class="progress-step step-1 active">Step 1: Owner Object</div>
                <div class="progress-step step-2">Step 2: Role${roleObjects.length > 0 ? '' : ' (Skip)'}</div>
                <div class="progress-step step-3">Step 3: Visualization</div>
                <div class="progress-step step-4">Step 4: Target Object</div>
                <div class="progress-step step-5">Step 5: Report Details</div>
            </div>
            
            <!-- Step 1: Owner Data Object Selection -->
            <div id="step1" class="step active">
                <h2>Step 1: Select Owner Data Object</h2>
                <div class="description">
                    Select the data object that will own this report. The report will be created within this object.
                </div>
                <div class="form-group">
                    <label for="ownerObject">Owner Data Object:</label>
                    <select id="ownerObject">
                        <option value="">Select an object...</option>
                        ${ownerObjectOptions}
                    </select>
                </div>
                <div class="button-container">
                    <button type="button" id="cancelBtn" class="secondary-button">Cancel</button>
                    <button type="button" id="step1NextBtn" class="primary-button" disabled>Next</button>
                </div>
            </div>
            
            <!-- Step 2: Role Selection (if Role objects exist) -->
            <div id="step2" class="step">
                <h2>Step 2: Select Required Role</h2>
                <div class="description">
                    ${roleObjects.length > 0 
                        ? 'Select the role required to run this report. Users must have this role to access the report.'
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
            
            <!-- Step 3: Visualization Type Selection -->
            <div id="step3" class="step">
                <h2>Step 3: Select Visualization Type</h2>
                <div class="description">
                    Choose how you want the report data to be displayed.
                </div>
                <div class="form-group">
                    <div class="viz-option" data-value="Grid" tabindex="0">
                        <div class="viz-title">Table</div>
                        <div class="viz-description">Display data in a tabular format with rows and columns</div>
                    </div>
                    <div class="viz-option" data-value="DetailTwoColumn" tabindex="0">
                        <div class="viz-title">Navigation</div>
                        <div class="viz-description">Two-column detail view for navigation and content</div>
                    </div>
                    <div class="viz-option" data-value="DetailThreeColumn" tabindex="0">
                        <div class="viz-title">Detail</div>
                        <div class="viz-description">Three-column detail view for comprehensive information display</div>
                    </div>
                </div>
                <div class="button-container">
                    <button type="button" id="step3BackBtn" class="secondary-button">Back</button>
                    <button type="button" id="step3NextBtn" class="primary-button" disabled>Next</button>
                </div>
            </div>
            
            <!-- Step 4: Target Object Selection (for grid visualization) -->
            <div id="step4" class="step">
                <h2>Step 4: Select Target Data Object</h2>
                <div class="description">
                    Select the data object that will be primarily displayed in the table. This is typically a child object of the owner data object.
                </div>
                <div class="form-group">
                    <label for="targetObject">Target Data Object:</label>
                    <select id="targetObject">
                        <option value="">Select target object...</option>
                    </select>
                </div>
                <div class="button-container">
                    <button type="button" id="step4BackBtn" class="secondary-button">Back</button>
                    <button type="button" id="step4NextBtn" class="primary-button" disabled>Next</button>
                </div>
            </div>
            
            <!-- Step 5: Report Name and Title -->
            <div id="step5" class="step">
                <h2>Step 5: Report Details</h2>
                <div class="description">
                    Provide the name and title for your report.
                </div>
                <div class="form-group">
                    <label for="reportName">Report Name (PascalCase, no spaces, max 100 characters):</label>
                    <input type="text" id="reportName" placeholder="ReportName">
                    <div id="nameValidation" class="validation-message"></div>
                </div>
                <div class="form-group">
                    <label for="reportTitle">Report Title (max 100 characters):</label>
                    <input type="text" id="reportTitle" placeholder="Report Title">
                    <div id="titleValidation" class="validation-message"></div>
                </div>
                <div class="button-container">
                    <button type="button" id="step5BackBtn" class="secondary-button">Back</button>
                    <button type="button" id="createReportBtn" class="primary-button" disabled>Create Report</button>
                </div>
            </div>
            
            <div id="messages"></div>
            
            <script>
                const vscode = acquireVsCodeApi();
                let currentStep = 1;
                let hasRoleObjects = ${roleObjects.length > 0};
                let selectedVisualization = '';
                let selectedOwnerObject = '';
                let selectedRole = '';
                let selectedTargetObject = '';
                
                // Navigation functions
                function showStep(stepNumber) {
                    // Hide all steps
                    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
                    document.querySelectorAll('.progress-step').forEach(step => step.classList.remove('active'));
                    
                    // Show current step
                    document.getElementById('step' + stepNumber).classList.add('active');
                    document.querySelector('.step-' + stepNumber).classList.add('active');
                    
                    currentStep = stepNumber;
                    
                    // Focus management for each step
                    setTimeout(() => {
                        if (stepNumber === 4) {
                            // Focus on the target data object dropdown
                            const targetObjectDropdown = document.getElementById('targetObject');
                            if (targetObjectDropdown) {
                                targetObjectDropdown.focus();
                            }
                        }
                        
                        if (stepNumber === 3) {
                            // Focus on the step3 element to enable Enter key functionality
                            const step3Element = document.getElementById('step3');
                            if (step3Element) {
                                step3Element.focus();
                            }
                        }
                        
                        if (stepNumber === 2) {
                            // Focus on the 'Required Role' dropdown when step 2 opens
                            const roleRequired = document.getElementById('roleRequired');
                            if (roleRequired) {
                                roleRequired.focus();
                            }
                        } 
                        
                        if (stepNumber === 1) {
                            // Focus on the owner data object dropdown
                            const ownerObjectSelect = document.getElementById('ownerObject');
                            if (ownerObjectSelect) {
                                ownerObjectSelect.focus();
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
                    
                    // Skip target object step if not grid visualization
                    if (nextStepNumber === 4 && selectedVisualization !== 'Grid') {
                        nextStepNumber = 5;
                    }
                    
                    if (nextStepNumber <= 5) {
                        showStep(nextStepNumber);
                    }
                }
                
                function previousStep() {
                    let prevStepNumber = currentStep - 1;
                    
                    // Skip role step if no role objects
                    if (prevStepNumber === 2 && !hasRoleObjects) {
                        prevStepNumber = 1;
                    }
                    
                    // Skip target object step if not grid visualization
                    if (prevStepNumber === 4 && selectedVisualization !== 'Grid') {
                        prevStepNumber = 3;
                    }
                    
                    if (prevStepNumber >= 1) {
                        showStep(prevStepNumber);
                    }
                }
                
                // Step 1: Owner Object Selection
                document.getElementById('ownerObject').addEventListener('change', function() {
                    selectedOwnerObject = this.value;
                    document.getElementById('step1NextBtn').disabled = !this.value;
                    
                    // Request child objects for target selection
                    if (this.value) {
                        vscode.postMessage({
                            command: 'getChildObjects',
                            data: { parentObjectName: this.value }
                        });
                    }
                });
                
                document.getElementById('step1NextBtn').addEventListener('click', nextStep);
                
                // Handle step 1 keyboard navigation
                document.getElementById('step1').addEventListener('keydown', (event) => {
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
                
                // Step 3: Visualization Type Selection
                document.querySelectorAll('.viz-option').forEach(option => {
                    option.addEventListener('click', function() {
                        // Remove selection from all options
                        document.querySelectorAll('.viz-option').forEach(opt => opt.classList.remove('selected'));
                        
                        // Select this option
                        this.classList.add('selected');
                        selectedVisualization = this.dataset.value;
                        
                        document.getElementById('step3NextBtn').disabled = false;
                    });
                    
                    // Add keyboard support for visualization options
                    option.addEventListener('keydown', function(event) {
                        if (event.key === ' ' || event.key === 'Enter') {
                            event.preventDefault();
                            this.click();
                        }
                    });
                });
                
                document.getElementById('step3BackBtn').addEventListener('click', previousStep);
                document.getElementById('step3NextBtn').addEventListener('click', function() {
                    // If grid is selected, go to target object step, otherwise skip to report details
                    if (selectedVisualization === 'Grid') {
                        nextStep();
                    } else {
                        showStep(5);
                        generateReportName();
                    }
                });
                
                // Step 3: Handle keyboard navigation
                document.getElementById('step3').addEventListener('keydown', function(event) {
                    if (event.key === 'Enter' && !document.getElementById('step3NextBtn').disabled) {
                        event.preventDefault();
                        document.getElementById('step3NextBtn').click();
                    }
                });
                
                // Step 4: Target Object Selection
                document.getElementById('targetObject').addEventListener('change', function() {
                    selectedTargetObject = this.value;
                    document.getElementById('step4NextBtn').disabled = !this.value;
                });
                
                // Handle Enter key for step 4 target object dropdown
                document.getElementById('targetObject').addEventListener('keydown', function(event) {
                    if (event.key === 'Enter' && this.value) {
                        event.preventDefault();
                        document.getElementById('step4NextBtn').click();
                    }
                });
                
                document.getElementById('step4BackBtn').addEventListener('click', previousStep);
                document.getElementById('step4NextBtn').addEventListener('click', function() {
                    nextStep();
                    generateReportName();
                });
                
                // Helper function to update Create Report button state
                function updateCreateButtonState() {
                    const reportName = document.getElementById('reportName').value;
                    const nameValidation = document.getElementById('nameValidation');
                    const titleValidation = document.getElementById('titleValidation');
                    
                    const nameValid = nameValidation.classList.contains('valid');
                    const titleValid = titleValidation.classList.contains('valid') || titleValidation.textContent === '';
                    
                    document.getElementById('createReportBtn').disabled = !reportName || !nameValid || !titleValid;
                }
                
                // Step 5: Report Details
                document.getElementById('reportName').addEventListener('input', function() {
                    const reportName = this.value;
                    
                    if (reportName) {
                        vscode.postMessage({
                            command: 'validateName',
                            data: { reportName: reportName }
                        });
                    } else {
                        document.getElementById('nameValidation').textContent = '';
                        document.getElementById('nameValidation').className = 'validation-message';
                        updateCreateButtonState();
                    }
                });
                
                document.getElementById('reportTitle').addEventListener('input', function() {
                    const reportTitle = this.value;
                    
                    if (reportTitle) {
                        vscode.postMessage({
                            command: 'validateTitle',
                            data: { reportTitle: reportTitle }
                        });
                    } else {
                        document.getElementById('titleValidation').textContent = '';
                        document.getElementById('titleValidation').className = 'validation-message';
                        updateCreateButtonState();
                    }
                });
                
                document.getElementById('step5BackBtn').addEventListener('click', function() {
                    if (selectedVisualization === 'Grid') {
                        previousStep();
                    } else {
                        showStep(3);
                    }
                });
                
                document.getElementById('createReportBtn').addEventListener('click', function() {
                    const reportName = document.getElementById('reportName').value;
                    const reportTitle = document.getElementById('reportTitle').value;
                    
                    if (!reportName) {
                        showMessage('Please enter a report name.', 'error');
                        return;
                    }
                    
                    if (!reportTitle) {
                        showMessage('Please enter a report title.', 'error');
                        return;
                    }
                    
                    vscode.postMessage({
                        command: 'createReport',
                        data: {
                            ownerObjectName: selectedOwnerObject,
                            roleRequired: selectedRole,
                            visualizationType: selectedVisualization,
                            targetObjectName: selectedTargetObject,
                            reportName: reportName,
                            reportTitle: reportTitle
                        }
                    });
                });
                
                // Cancel button
                document.getElementById('cancelBtn').addEventListener('click', function() {
                    window.close();
                });
                
                // Generate report name based on selections
                function generateReportName() {
                    let generatedName = '';
                    
                    if (selectedOwnerObject) {
                        generatedName += selectedOwnerObject;
                    }
                    
                    if (selectedRole) {
                        generatedName += selectedRole;
                    }
                    
                    if (selectedVisualization === 'Grid' && selectedTargetObject) {
                        generatedName += selectedTargetObject + 'List';
                    } else if (selectedVisualization === 'Grid') {
                        generatedName += 'List';
                    } else if (selectedVisualization === 'DetailThreeColumn') {
                        generatedName += 'Detail';
                    } else if (selectedVisualization === 'DetailTwoColumn') {
                        generatedName += 'Dashboard';
                    }
                    
                    // Set the generated name
                    document.getElementById('reportName').value = generatedName;
                    
                    // Generate title from name
                    const title = generatedName.replace(/([A-Z])/g, ' $1').trim();
                    document.getElementById('reportTitle').value = title;
                    
                    // Trigger validation
                    if (generatedName) {
                        vscode.postMessage({
                            command: 'validateName',
                            data: { reportName: generatedName }
                        });
                    }
                    
                    // Trigger title validation
                    if (title) {
                        vscode.postMessage({
                            command: 'validateTitle',
                            data: { reportTitle: title }
                        });
                    }
                }
                
                // Handle messages from extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    switch (message.command) {
                        case 'success':
                            showMessage(message.message, 'success');
                            break;
                        case 'error':
                            showMessage(message.message, 'error');
                            break;
                        case 'nameValidation':
                            const validationElement = document.getElementById('nameValidation');
                            validationElement.textContent = message.message;
                            validationElement.className = 'validation-message ' + (message.isValid ? 'valid' : 'invalid');
                            updateCreateButtonState();
                            break;
                        case 'titleValidation':
                            const titleValidationElement = document.getElementById('titleValidation');
                            titleValidationElement.textContent = message.message;
                            titleValidationElement.className = 'validation-message ' + (message.isValid ? 'valid' : 'invalid');
                            updateCreateButtonState();
                            break;
                        case 'childObjects':
                            const targetSelect = document.getElementById('targetObject');
                            targetSelect.innerHTML = '<option value="">Select target object...</option>';
                            
                            message.childObjects.forEach(obj => {
                                if (obj.name) {
                                    const option = document.createElement('option');
                                    option.value = obj.name;
                                    option.textContent = obj.name;
                                    targetSelect.appendChild(option);
                                }
                            });
                            break;
                    }
                });
                
                function showMessage(message, type) {
                    const messagesDiv = document.getElementById('messages');
                    messagesDiv.innerHTML = '<div class="' + type + '-message">' + message + '</div>';
                }
                
                // Set initial focus when the wizard loads
                setTimeout(() => {
                    showStep(1); // This will trigger focus on the owner object dropdown
                }, 100);
            </script>
        </body>
        </html>
    `;
}

module.exports = {
    showAddReportWizard
};

"use strict";
const vscode = require("vscode");
const path = require("path");
const { loadSchema, getFormSchemaProperties, getFormParamsSchema, getFormButtonsSchema, getFormOutputVarsSchema } = require("./helpers/schemaLoader");
const { generateDetailsView } = require("./components/detailsViewGenerator");

// Track current panels to avoid duplicates
const activePanels = new Map();

// Registry to track all open form details panels
const openPanels = new Map();

// Store context for later use
let currentContext = undefined;

/**
 * Opens a webview panel displaying details for a form
 * @param {Object} item The tree item representing the form
 * @param {Object} modelService The ModelService instance
 * @param {vscode.ExtensionContext} context Extension context (optional, uses stored context if not provided)
 */
function showFormDetails(item, modelService, context) {
    // Store context for later use if provided
    if (context) {
        currentContext = context;
    }
    
    // Use provided context or fallback to stored context
    const extensionContext = context || currentContext;
    
    if (!extensionContext) {
        console.error('Extension context not available for form details view');
        vscode.window.showErrorMessage('Extension context not available. Please try again.');
        return;
    }
    
    // Create a normalized panel ID to ensure consistency
    const normalizedLabel = item.label.trim().toLowerCase();
    const panelId = `formDetails-${normalizedLabel}`;
    
    console.log(`showFormDetails called for ${item.label} (normalized: ${normalizedLabel}, panelId: ${panelId})`);
    
    // Check if panel already exists for this form
    if (activePanels.has(panelId)) {
        console.log(`Panel already exists for ${item.label}, revealing existing panel`);
        // Panel exists, reveal it instead of creating a new one
        activePanels.get(panelId).reveal(vscode.ViewColumn.One);
        return;
    }
      // Create webview panel
    const panel = vscode.window.createWebviewPanel(
        "formDetails", 
        `Details for ${item.label} Form`,
        vscode.ViewColumn.One, 
        { 
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(extensionContext.extensionPath, 'node_modules', '@vscode', 'codicons', 'dist'))
            ]
        }
    );
      
    // Track this panel in both activePanels and openPanels
    console.log(`Adding new panel to activePanels and openPanels with id: ${panelId}`);
    activePanels.set(panelId, panel);
    openPanels.set(panelId, { panel, item, modelService });
    
    // Remove from tracking when disposed
    panel.onDidDispose(() => {
        console.log(`Panel disposed, removing from tracking: ${panelId}`);
        activePanels.delete(panelId);
        openPanels.delete(panelId);
    });
    
    // Get the full form data from ModelService
    let formData;
    let formReference = null;
    
    if (modelService && typeof modelService.isFileLoaded === "function" && modelService.isFileLoaded()) {
        console.log("Using ModelService to get form data");
        
        // Find the form in the model by name
        const allPageWorkflows = modelService.getAllPageObjectWorkflows();
        formData = allPageWorkflows.find(workflow => {
            const workflowName = workflow.name || workflow.titleText || 'Unnamed Form';
            return workflowName.trim().toLowerCase() === item.label.trim().toLowerCase();
        });
        
        // Store a reference to the actual form in the model
        if (formData) {
            formReference = formData;
        } else {
            console.warn(`Form ${item.label} not found in model service data`);
            formData = { name: item.label, error: "Form not found in model" };
        }
    } else {
        console.warn("ModelService not available or not loaded");
        formData = { name: item.label, error: "ModelService not available" };
    }
    
    // Ensure the form has essential properties to avoid errors
    if (!formData) {
        formData = { name: item.label };
    }
    
    // Initialize the array properties if they don't exist
    // Based on the mappings:
    // reportColumn = objectWorkflowParam
    // reportButton = objectWorkflowButton  
    // reportParam = objectWorkflowOutputVar
    if (!formData.objectWorkflowParam) {
        formData.objectWorkflowParam = [];
    }
    if (!formData.objectWorkflowButton) {
        formData.objectWorkflowButton = [];
    }
    if (!formData.objectWorkflowOutputVar) {
        formData.objectWorkflowOutputVar = [];
    }
    
    // Get schema for generating the HTML
    const schema = loadSchema();
    const formSchemaProps = getFormSchemaProperties(schema);
    const formParamsSchema = getFormParamsSchema(schema);
    const formButtonsSchema = getFormButtonsSchema(schema);
    const formOutputVarsSchema = getFormOutputVarsSchema(schema);
    
    // Generate codicon URI for the webview
    const codiconsUri = panel.webview.asWebviewUri(
        vscode.Uri.file(path.join(extensionContext.extensionPath, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css'))
    );
    
    try {
        // Set the HTML content with the full form data
        panel.webview.html = generateDetailsView(
            formData, 
            formSchemaProps, 
            formParamsSchema, 
            formButtonsSchema, 
            formOutputVarsSchema,
            codiconsUri
        );
    } catch (error) {
        console.error("Error generating details view:", error);
        console.error("Form data:", JSON.stringify(formData, null, 2));
        console.error("Schema props:", Object.keys(formSchemaProps));
        console.error("Params schema:", Object.keys(formParamsSchema));
        console.error("Buttons schema:", Object.keys(formButtonsSchema));
        console.error("Output vars schema:", Object.keys(formOutputVarsSchema));
        
        // Show error to user
        vscode.window.showErrorMessage(`Failed to open Form Details: ${error.message}`);
        return;
    }
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case "updateModel":
                    if (modelService && formReference) {
                        // Directly update the model instance and reload the webview
                        updateModelDirectly(message.data, formReference, modelService, panel);
                    } else {
                        console.warn("Cannot update model directly: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "updateSettings":
                    if (modelService && formReference) {
                        // Update settings properties directly on the form
                        updateSettingsDirectly(message.data, formReference, modelService);
                    } else {
                        console.warn("Cannot update settings: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "updateForm":
                    if (modelService && formReference) {
                        // Handle form data updates (for backward compatibility with old UI code)
                        // Update all properties provided in the data
                        Object.keys(message.data).forEach(property => {
                            formReference[property] = message.data[property];
                        });
                        
                        // Mark that there are unsaved changes
                        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
                            modelService.markUnsavedChanges();
                            console.log("[DEBUG] Model marked as having unsaved changes");
                        }
                        
                        // Refresh the tree view to reflect any visible changes
                        vscode.commands.executeCommand("appdna.refresh");
                    } else {
                        console.warn("Cannot update form: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "updateButton":
                    if (modelService && formReference) {
                        // Update button properties directly on the form
                        updateButtonDirectly(message.data, formReference, modelService);
                    } else {
                        console.warn("Cannot update button: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "updateParam":
                    if (modelService && formReference) {
                        // Update param properties directly on the form
                        updateParamDirectly(message.data, formReference, modelService);
                    } else {
                        console.warn("Cannot update param: ModelService not available or formReference not found");
                    }
                    return;
                    
                case "updateOutputVar":
                    if (modelService && formReference) {
                        // Update output variable properties directly on the form
                        updateOutputVarDirectly(message.data, formReference, modelService);
                    } else {
                        console.warn("Cannot update output variable: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "updateOutputVarProperty":
                    if (modelService && formReference) {
                        // Update a single property of an output variable
                        updateOutputVarProperty(message, formReference, modelService);
                    } else {
                        console.warn("Cannot update output variable property: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "removeOutputVarProperty":
                    if (modelService && formReference) {
                        // Remove a property from an output variable
                        removeOutputVarProperty(message, formReference, modelService);
                    } else {
                        console.warn("Cannot remove output variable property: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "moveParam":
                    if (modelService && formReference) {
                        // Move param in the array
                        moveParamInArray(message.data, formReference, modelService, panel);
                    } else {
                        console.warn("Cannot move param: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "reorderFormParam":
                    if (modelService && formReference) {
                        // Handle parameter reordering from parameter management functions
                        moveParamInArray(message.data, formReference, modelService, panel);
                    } else {
                        console.warn("Cannot reorder param: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "moveButton":
                    if (modelService && formReference) {
                        // Move button in the array - data is directly on message object
                        const moveData = { fromIndex: message.fromIndex, toIndex: message.toIndex };
                        moveButtonInArray(moveData, formReference, modelService, panel);
                    } else {
                        console.warn("Cannot move button: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "reorderFormButton":
                    if (modelService && formReference) {
                        // Handle button reordering from button management functions
                        moveButtonInArray(message.data, formReference, modelService, panel);
                    } else {
                        console.warn("Cannot reorder button: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "copyOutputVar":
                    if (modelService && formReference) {
                        // Copy an output variable
                        copyOutputVarInArray(message, formReference, modelService);
                    } else {
                        console.warn("Cannot copy output variable: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "moveOutputVar":
                    if (modelService && formReference) {
                        // Move output variable in the array - data is directly on message object
                        const moveData = { fromIndex: message.fromIndex, toIndex: message.toIndex };
                        moveOutputVarInArray(moveData, formReference, modelService, panel);
                    } else {
                        console.warn("Cannot move output variable: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "reorderFormOutputVar":
                    if (modelService && formReference) {
                        // Handle output variable reordering from output variable management functions
                        moveOutputVarInArray(message.data, formReference, modelService, panel);
                    } else {
                        console.warn("Cannot reorder output variable: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "reverseParam":
                    if (modelService && formReference) {
                        // Reverse param array
                        reverseParamArray(formReference, modelService, panel);
                    } else {
                        console.warn("Cannot reverse params: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "reverseButton":
                case "reverseButtons":  // Handle both singular and plural
                    if (modelService && formReference) {
                        // Reverse button array
                        reverseButtonArray(formReference, modelService, panel);
                    } else {
                        console.warn("Cannot reverse buttons: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "reverseOutputVar":
                    if (modelService && formReference) {
                        // Reverse output variable array
                        reverseOutputVarArray(formReference, modelService, panel);
                    } else {
                        console.warn("Cannot reverse output variables: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "copyParam":
                    if (modelService && formReference) {
                        // Copy parameter in the array
                        copyParamInArray(message.data, formReference, modelService);
                    } else {
                        console.warn("Cannot copy parameter: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "copyButton":
                    if (modelService && formReference) {
                        // Copy button in the array
                        copyButtonInArray(message.data, formReference, modelService);
                    } else {
                        console.warn("Cannot copy button: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "addParam":
                    if (modelService && formReference) {
                        // Add a new parameter to the form
                        addParamToForm(formReference, modelService, panel);
                    } else {
                        console.warn("Cannot add parameter: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "addParamWithName":
                    if (modelService && formReference) {
                        // Add a new parameter to the form with specified name
                        addParamToFormWithName(formReference, modelService, message.data.name, panel);
                    } else {
                        console.warn("Cannot add parameter with name: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "addButton":
                    if (modelService && formReference) {
                        // Add a new button to the form
                        addButtonToForm(formReference, modelService);
                    } else {
                        console.warn("Cannot add button: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "addButtonWithText":
                    if (modelService && formReference) {
                        // Add a new button to the form with user-specified text and type
                        addButtonToFormWithText(formReference, modelService, message.data, panel);
                    } else {
                        console.warn("Cannot add button with text: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "addOutputVar":
                    if (modelService && formReference) {
                        // Add a new output variable to the form
                        addOutputVarToForm(formReference, modelService);
                    } else {
                        console.warn("Cannot add output variable: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "addOutputVarWithName":
                    if (modelService && formReference) {
                        // Add a new output variable to the form with specified name
                        addOutputVarToFormWithName(formReference, modelService, message.data.name, panel);
                    } else {
                        console.warn("Cannot add output variable with name: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "updateParamFull":
                    if (modelService && formReference) {
                        // Update the complete parameter with new data
                        updateParamFull(message.data, formReference, modelService);
                    } else {
                        console.warn("Cannot update parameter: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "openPagePreview":
                    console.log('[DEBUG] FormDetails - Open page preview requested for form name:', JSON.stringify(message.formName));
                    console.log('[DEBUG] FormDetails - Message object:', JSON.stringify(message));
                    // Use VS Code command to open page preview instead of calling directly
                    try {
                        // Execute the page preview command which handles context properly
                        vscode.commands.executeCommand('appdna.showPagePreview').then(() => {
                            // Wait a brief moment for the page preview to open, then select the form
                            setTimeout(() => {
                                try {
                                    const { getPagePreviewPanel } = require("../pagepreview/pagePreviewView");
                                    const pagePreviewResult = getPagePreviewPanel();
                                    const pagePreviewPanel = pagePreviewResult ? pagePreviewResult.panel : null;
                                    
                                    if (pagePreviewPanel && pagePreviewPanel.webview && message.formName) {
                                        console.log('[DEBUG] FormDetails - Sending select page message to opened page preview for:', JSON.stringify(message.formName));
                                        pagePreviewPanel.webview.postMessage({
                                            command: 'selectPageAndShowPreview',
                                            data: { pageName: message.formName }
                                        });
                                    } else {
                                        console.warn('[WARN] FormDetails - Page preview panel not available after opening');
                                        console.log('[DEBUG] FormDetails - Panel result:', !!pagePreviewResult);
                                        console.log('[DEBUG] FormDetails - Panel exists:', !!pagePreviewPanel);
                                        console.log('[DEBUG] FormDetails - Panel webview exists:', !!(pagePreviewPanel && pagePreviewPanel.webview));
                                        console.log('[DEBUG] FormDetails - Form name provided:', !!message.formName);
                                    }
                                } catch (error) {
                                    console.error('[ERROR] FormDetails - Failed to select form in page preview:', error);
                                }
                            }, 1000); // Wait 1 second for page preview to fully load
                        }).catch((error) => {
                            console.error('[ERROR] FormDetails - Failed to open page preview via command:', error);
                            vscode.window.showErrorMessage(`Failed to open page preview: ${error.message}`);
                        });
                        
                    } catch (error) {
                        console.error('[ERROR] FormDetails - Failed to execute page preview command:', error);
                        vscode.window.showErrorMessage(`Failed to open page preview: ${error.message}`);
                    }
                    return;
            }
        }
    );
}

/**
 * Refreshes all open form details webviews with the latest model data
 */
function refreshAll() {
    console.log(`Refreshing all open panels, count: ${openPanels.size}`);
    for (const { panel, item, modelService } of openPanels.values()) {
        if (panel && !panel._disposed) {
            // Use the same normalization as in showFormDetails
            const normalizedLabel = item.label.trim().toLowerCase();
            const panelId = `formDetails-${normalizedLabel}`;
            console.log(`Refreshing panel for ${item.label} (normalized: ${normalizedLabel}, panelId: ${panelId})`);
            
            // Get the latest form data
            let formData;
            if (modelService && typeof modelService.isFileLoaded === "function" && modelService.isFileLoaded()) {
                const allPageWorkflows = modelService.getAllPageObjectWorkflows();
                formData = allPageWorkflows.find(workflow => {
                    const workflowName = workflow.name || workflow.titleText || 'Unnamed Form';
                    return workflowName.trim().toLowerCase() === normalizedLabel;
                });
            }
            if (!formData) {
                formData = { name: item.label, error: "Form not found in model" };
            }
            
            // Initialize the array properties if they don't exist
            if (!formData.objectWorkflowParam) {
                formData.objectWorkflowParam = [];
            }
            if (!formData.objectWorkflowButton) {
                formData.objectWorkflowButton = [];
            }
            if (!formData.objectWorkflowOutputVar) {
                formData.objectWorkflowOutputVar = [];
            }
            
            // Get schema for generating the HTML
            const schema = loadSchema();
            const formSchemaProps = getFormSchemaProperties(schema);
            const formParamsSchema = getFormParamsSchema(schema);
            const formButtonsSchema = getFormButtonsSchema(schema);
            const formOutputVarsSchema = getFormOutputVarsSchema(schema);
            
            // Update the HTML content
            panel.webview.html = generateDetailsView(
                formData, 
                formSchemaProps, 
                formParamsSchema, 
                formButtonsSchema, 
                formOutputVarsSchema
            );
        }
    }
}

/**
 * Gets an array of items from all open panels
 * @returns {Array} Array of items from open panels
 */
function getOpenPanelItems() {
    console.log(`Getting items from ${openPanels.size} open panels`);
    const items = [];
    for (const { item } of openPanels.values()) {
        items.push(item);
    }
    return items;
}

/**
 * Closes all currently open form details panels
 */
function closeAllPanels() {
    console.log(`Closing all panels, count: ${openPanels.size}`);
    for (const { panel } of openPanels.values()) {
        if (panel && !panel._disposed) {
            panel.dispose();
        }
    }
    // Clear the panels maps
    activePanels.clear();
    openPanels.clear();
}

// Helper functions for updating the model
function updateModelDirectly(data, formReference, modelService, panel = null) {
    try {
        console.log("[DEBUG] updateModelDirectly called for form");
        console.log("[DEBUG] formReference before update:", JSON.stringify(formReference, null, 2));
        
        // Update parameters if provided
        if (data.params) {
            formReference.objectWorkflowParam = data.params;
        }
        
        // Update buttons if provided
        if (data.buttons) {
            formReference.objectWorkflowButton = data.buttons;
        }
        
        // Update output variables if provided
        if (data.outputVars) {
            formReference.objectWorkflowOutputVar = data.outputVars;
        }
        
        console.log("[DEBUG] formReference after update:", JSON.stringify(formReference, null, 2));
        
        // Mark that there are unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
            console.log("[DEBUG] Model marked as having unsaved changes");
        }
        
        // Reload the webview with updated model data
        if (panel && !panel._disposed) {
            console.log("[DEBUG] Reloading webview with updated model data");
            
            // Get schema for regenerating the HTML
            const schema = loadSchema();
            const formSchemaProps = getFormSchemaProperties(schema);
            const formParamsSchema = getFormParamsSchema(schema);
            const formButtonsSchema = getFormButtonsSchema(schema);
            const formOutputVarsSchema = getFormOutputVarsSchema(schema);
            
            // Regenerate and update the webview HTML with updated model data
            panel.webview.html = generateDetailsView(
                formReference, 
                formSchemaProps, 
                formParamsSchema, 
                formButtonsSchema, 
                formOutputVarsSchema
            );
            
            // If preserveTab was specified, restore the active tab
            // We use a small delay to ensure the webview DOM is fully updated
            if (data.preserveTab) {
                console.log("[DEBUG] Preserving tab:", data.preserveTab);
                // Alternative: Use setImmediate or just send immediately and let client handle timing
                panel.webview.postMessage({
                    command: 'restoreTab',
                    tabId: data.preserveTab
                });
            }
        }
        
        // Refresh the tree view to reflect any visible changes
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error updating model directly:", error);
    }
}

/**
 * Updates settings properties directly on the form in the ModelService instance
 * @param {Object} data The data containing property update information
 * @param {Object} formReference Direct reference to the form in the model
 * @param {Object} modelService The ModelService instance 
 */
function updateSettingsDirectly(data, formReference, modelService) {
    try {
        console.log("[DEBUG] updateSettingsDirectly called for form");
        console.log("[DEBUG] formReference before update:", JSON.stringify(formReference, null, 2));
        
        // Extract property information from the data
        const { property, exists, value } = data;
        console.log("[DEBUG] updateSettingsDirectly received:", property, value, typeof value);
        
        if (property) {
            if (exists) {
                // Add or update the property
                formReference[property] = value;
            } else {
                // Remove the property
                delete formReference[property];
            }
            
            console.log("[DEBUG] formReference after update:", JSON.stringify(formReference, null, 2));
            
            // Mark that there are unsaved changes
            if (modelService && typeof modelService.markUnsavedChanges === 'function') {
                modelService.markUnsavedChanges();
                console.log("[DEBUG] Model marked as having unsaved changes");
            }
            
            // Refresh the tree view to reflect any visible changes
            vscode.commands.executeCommand("appdna.refresh");
        }
    } catch (error) {
        console.error("Error updating settings directly:", error);
    }
}

function updateButtonDirectly(data, formReference, modelService) {
    console.log(`updateButtonDirectly called with data:`, data);
    
    if (!formReference || !data || data.index === undefined || !modelService) {
        console.error("Missing required data for button update");
        return;
    }
    
    try {
        // Initialize the buttons array if it doesn't exist
        if (!formReference.objectWorkflowButton) {
            formReference.objectWorkflowButton = [];
        }
        
        // Check if the button exists
        if (data.index >= formReference.objectWorkflowButton.length) {
            console.error(`Button index ${data.index} out of bounds`);
            return;
        }
        
        // Get the button
        const button = formReference.objectWorkflowButton[data.index];
        
        if (!button) {
            console.error(`Button at index ${data.index} is undefined`);
            return;
        }
        
        // Handle full button update
        if (data.button) {
            formReference.objectWorkflowButton[data.index] = data.button;
            modelService.markUnsavedChanges();
            vscode.commands.executeCommand("appdna.refresh");
            return;
        }
        
        // Handle individual property update
        if (data.property) {
            if (data.exists) {
                // Update the property with the new value
                button[data.property] = data.value;
            } else {
                // Remove the property
                delete button[data.property];
            }
            
            // Mark as having unsaved changes and refresh
            modelService.markUnsavedChanges();
            vscode.commands.executeCommand("appdna.refresh");
        }
    } catch (error) {
        console.error("Error updating button:", error);
    }
}

function updateParamDirectly(data, formReference, modelService) {
    console.log(`updateParamDirectly called with data:`, data);
    
    if (!formReference || !data || data.index === undefined || !modelService) {
        console.error("Missing required data for parameter update");
        return;
    }
    
    try {
        // Initialize the parameters array if it doesn't exist
        if (!formReference.objectWorkflowParam) {
            formReference.objectWorkflowParam = [];
        }
        
        // Check if the parameter exists
        if (data.index >= formReference.objectWorkflowParam.length) {
            console.error(`Parameter index ${data.index} out of bounds`);
            return;
        }
        
        // Get the parameter
        const param = formReference.objectWorkflowParam[data.index];
        
        if (!param) {
            console.error(`Parameter at index ${data.index} is undefined`);
            return;
        }
        
        // Handle full parameter update
        if (data.param) {
            formReference.objectWorkflowParam[data.index] = data.param;
            modelService.markUnsavedChanges();
            vscode.commands.executeCommand("appdna.refresh");
            return;
        }
        
        // Handle individual property update
        if (data.property) {
            if (data.exists) {
                // Update the property with the new value
                param[data.property] = data.value;
            } else {
                // Remove the property
                delete param[data.property];
            }
            
            // Mark as having unsaved changes and refresh
            modelService.markUnsavedChanges();
            vscode.commands.executeCommand("appdna.refresh");
        }
    } catch (error) {
        console.error("Error updating parameter:", error);
    }
}

function updateOutputVarDirectly(data, formReference, modelService) {
    try {
        if (formReference) {
            console.log("[DEBUG] updateOutputVarDirectly called for form");
            
            // Support both new format (data.outputVar, data.index) and old format (data.property, data.exists, data.value)
            const { index, outputVar, property, exists, value } = data;
            
            // Log what we're receiving
            console.log("[DEBUG] updateOutputVarDirectly received:", data);
            
            // Ensure objectWorkflowOutputVar array exists
            if (!formReference.objectWorkflowOutputVar) {
                formReference.objectWorkflowOutputVar = [];
            }
            
            // Handle the case where we're receiving a complete outputVar object
            if (outputVar && typeof outputVar === 'object' && index >= 0) {
                if (index < formReference.objectWorkflowOutputVar.length) {
                    // Update existing output variable
                    formReference.objectWorkflowOutputVar[index] = outputVar;
                    console.log(`[DEBUG] Updated entire outputVar at index ${index}`);
                } else if (index === formReference.objectWorkflowOutputVar.length) {
                    // Add new output variable
                    formReference.objectWorkflowOutputVar.push(outputVar);
                    console.log(`[DEBUG] Added new outputVar at index ${index}`);
                } else {
                    console.error(`[DEBUG] Invalid index: ${index} for outputVar array of length ${formReference.objectWorkflowOutputVar.length}`);
                    return;
                }
                console.log(`[DEBUG] OutputVar after update:`, outputVar);
            }
            // Handle the case where we're updating a specific property
            else if (property && index >= 0 && index < formReference.objectWorkflowOutputVar.length) {
                const outputVar = formReference.objectWorkflowOutputVar[index];
                
                if (exists) {
                    // Set or update the property
                    outputVar[property] = value;
                    console.log(`[DEBUG] Set outputVar[${index}].${property} = ${value}`);
                } else {
                    // Remove the property
                    delete outputVar[property];
                    console.log(`[DEBUG] Removed outputVar[${index}].${property}`);
                }
                
                console.log(`[DEBUG] OutputVar after update:`, outputVar);
            }
            
            // Mark as having unsaved changes using the modelService
            if (modelService && typeof modelService.markUnsavedChanges === 'function') {
                modelService.markUnsavedChanges();
                console.log("[DEBUG] Marked unsaved changes via modelService");
            } else {
                console.warn("[DEBUG] modelService.markUnsavedChanges is not available");
            }
            
            vscode.commands.executeCommand("appdna.refresh");
        }
    } catch (error) {
        console.error("Error in updateOutputVarDirectly:", error);
    }
}

function updateOutputVarProperty(message, formReference, modelService) {
    console.log(`updateOutputVarProperty called with:`, message);
    
    if (!formReference || message.index === undefined || !message.property || !modelService) {
        console.error("Missing required data for output variable property update operation");
        return;
    }
    
    try {
        // Initialize the output variables array if it doesn't exist
        if (!formReference.objectWorkflowOutputVar) {
            formReference.objectWorkflowOutputVar = [];
        }
        
        // Check if the output variable exists
        if (message.index >= formReference.objectWorkflowOutputVar.length) {
            console.error(`Output variable index ${message.index} out of bounds`);
            return;
        }
        
        // Update the property
        formReference.objectWorkflowOutputVar[message.index][message.property] = message.value;
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Refresh the UI
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error updating output variable property:", error);
    }
}

function removeOutputVarProperty(message, formReference, modelService) {
    console.log(`removeOutputVarProperty called with:`, message);
    
    if (!formReference || message.index === undefined || !message.property || !modelService) {
        console.error("Missing required data for output variable property remove operation");
        return;
    }
    
    try {
        // Initialize the output variables array if it doesn't exist
        if (!formReference.objectWorkflowOutputVar) {
            formReference.objectWorkflowOutputVar = [];
        }
        
        // Check if the output variable exists
        if (message.index >= formReference.objectWorkflowOutputVar.length) {
            console.error(`Output variable index ${message.index} out of bounds`);
            return;
        }
        
        // Remove the property
        delete formReference.objectWorkflowOutputVar[message.index][message.property];
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Refresh the UI
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error removing output variable property:", error);
    }
}

/**
 * Moves a parameter in the objectWorkflowParam array
 * @param {Object} data Data containing fromIndex and toIndex
 * @param {Object} formReference Direct reference to the form object
 * @param {Object} modelService Model service instance
 * @param {Object} panel The webview panel to refresh
 */
function moveParamInArray(data, formReference, modelService, panel) {
    try {
        console.log("[DEBUG] moveParamInArray called");
        
        const { fromIndex, toIndex } = data;
        console.log("[DEBUG] Moving param from index", fromIndex, "to index", toIndex);
        
        if (!formReference.objectWorkflowParam || !Array.isArray(formReference.objectWorkflowParam)) {
            console.warn("[DEBUG] objectWorkflowParam array does not exist");
            return;
        }
        
        const array = formReference.objectWorkflowParam;
        
        // Validate indices
        if (fromIndex < 0 || fromIndex >= array.length || toIndex < 0 || toIndex >= array.length) {
            console.warn("[DEBUG] Invalid indices for move operation");
            return;
        }
        
        // Move the item
        const itemToMove = array.splice(fromIndex, 1)[0];
        array.splice(toIndex, 0, itemToMove);
        
        console.log("[DEBUG] Param moved successfully");
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
            console.log("[DEBUG] Marked unsaved changes after param move");
        }
        
        // Send message to webview to refresh the params list
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'refreshParamsList',
                data: formReference.objectWorkflowParam,
                newSelection: toIndex
            });
        }
        
        // Refresh the view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error moving param:", error);
    }
}

/**
 * Moves a button in the objectWorkflowButton array
 * @param {Object} data Data containing fromIndex and toIndex
 * @param {Object} formReference Direct reference to the form object
 * @param {Object} modelService Model service instance
 * @param {Object} panel The webview panel to refresh
 */
function moveButtonInArray(data, formReference, modelService, panel) {
    try {
        console.log("[DEBUG] moveButtonInArray called");
        
        const { fromIndex, toIndex } = data;
        console.log("[DEBUG] Moving button from index", fromIndex, "to index", toIndex);
        
        if (!formReference.objectWorkflowButton || !Array.isArray(formReference.objectWorkflowButton)) {
            console.warn("[DEBUG] objectWorkflowButton array does not exist");
            return;
        }
        
        const array = formReference.objectWorkflowButton;
        
        // Validate indices
        if (fromIndex < 0 || fromIndex >= array.length || toIndex < 0 || toIndex >= array.length) {
            console.warn("[DEBUG] Invalid indices for move operation");
            return;
        }
        
        // Move the item
        const itemToMove = array.splice(fromIndex, 1)[0];
        array.splice(toIndex, 0, itemToMove);
        
        console.log("[DEBUG] Button moved successfully");
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
            console.log("[DEBUG] Marked unsaved changes after button move");
        }
        
        // Send message to webview to refresh the buttons list
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'refreshButtonsList',
                data: formReference.objectWorkflowButton,
                newSelection: toIndex
            });
        }
        
        // Refresh the view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error moving button:", error);
    }
}

/**
 * Moves an output variable in the objectWorkflowOutputVar array
 * @param {Object} data Data containing fromIndex and toIndex
 * @param {Object} formReference Direct reference to the form object
 * @param {Object} modelService Model service instance
 * @param {Object} panel The webview panel to refresh
 */
function moveOutputVarInArray(data, formReference, modelService, panel) {
    try {
        console.log("[DEBUG] moveOutputVarInArray called");
        
        const { fromIndex, toIndex } = data;
        console.log("[DEBUG] Moving output var from index", fromIndex, "to index", toIndex);
        
        if (!formReference.objectWorkflowOutputVar || !Array.isArray(formReference.objectWorkflowOutputVar)) {
            console.warn("[DEBUG] objectWorkflowOutputVar array does not exist");
            return;
        }
        
        const array = formReference.objectWorkflowOutputVar;
        
        // Validate indices
        if (fromIndex < 0 || fromIndex >= array.length || toIndex < 0 || toIndex >= array.length) {
            console.warn("[DEBUG] Invalid indices for move operation");
            return;
        }
        
        // Move the item
        const itemToMove = array.splice(fromIndex, 1)[0];
        array.splice(toIndex, 0, itemToMove);
        
        console.log("[DEBUG] Output var moved successfully");
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
            console.log("[DEBUG] Marked unsaved changes after output var move");
        }
        
        // Send message to webview to refresh the output vars list
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'refreshOutputVarsList',
                data: formReference.objectWorkflowOutputVar,
                newSelection: toIndex
            });
        }
        
        // Refresh the view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error moving output var:", error);
    }
}

function reverseParamArray(formReference, modelService, panel) {
    console.log("reverseParamArray called for form");
    
    if (!formReference || !modelService) {
        console.error("Missing required data for parameter reverse operation");
        return;
    }
    
    try {
        // Use the form reference directly since it's already the form object
        const form = formReference;
        
        // Initialize the parameters array if it doesn't exist
        if (!form.objectWorkflowParam || form.objectWorkflowParam.length <= 1) {
            return; // Nothing to reverse with 0 or 1 elements
        }
        
        // Reverse the parameters array
        form.objectWorkflowParam.reverse();
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Send message to webview to refresh the params list
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'refreshParamsList',
                data: form.objectWorkflowParam
            });
        }
        
        // Refresh only the tree view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error reversing parameters:", error);
    }
}

function reverseButtonArray(formReference, modelService, panel) {
    try {
        console.log("[DEBUG] reverseButtonArray called for form");
        
        // Use the form reference directly since it's already the form object
        const form = formReference;
        
        if (!form.objectWorkflowButton || !Array.isArray(form.objectWorkflowButton)) {
            console.warn("[DEBUG] objectWorkflowButton array does not exist");
            return;
        }
        
        const array = form.objectWorkflowButton;
        
        if (array.length <= 1) {
            console.log("[DEBUG] Button array has 1 or fewer items, nothing to reverse");
            return;
        }
        
        // Reverse the array
        array.reverse();
        
        console.log("[DEBUG] Button array reversed successfully");
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Send message to webview to refresh the buttons list
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'refreshButtonsList',
                data: form.objectWorkflowButton
            });
        }
        
        // Refresh only the tree view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error reversing button array:", error);
    }
}

function reverseOutputVarArray(formReference, modelService, panel) {
    console.log("reverseOutputVarArray called for form");
    
    if (!formReference || !modelService) {
        console.error("Missing required data for output variables reverse operation");
        return;
    }
    
    try {
        // Use the form reference directly since it's already the form object
        const form = formReference;
        
        // Initialize the output variables array if it doesn't exist
        if (!form.objectWorkflowOutputVar) {
            form.objectWorkflowOutputVar = [];
            return; // Nothing to reverse in an empty array
        }
        
        // Check if there's anything to reverse
        if (form.objectWorkflowOutputVar.length <= 1) {
            return; // Nothing to reverse with 0 or 1 element
        }
        
        // Reverse the array
        form.objectWorkflowOutputVar.reverse();
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Send message to webview to refresh the output variables list
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'refreshOutputVarsList',
                data: form.objectWorkflowOutputVar
            });
        }
        
        // Refresh only the tree view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error reversing output variables array:", error);
    }
}

function copyParamInArray(data, formReference, modelService) {
    console.log(`copyParamInArray called with data:`, data);
    
    if (!formReference || !data || data.index === undefined || !modelService) {
        console.error("Missing required data for parameter copy operation");
        return;
    }
    
    try {
        // Use the form reference directly since it's already the form object
        const form = formReference;
        
        // Initialize the parameters array if it doesn't exist
        if (!form.objectWorkflowParam) {
            form.objectWorkflowParam = [];
        }
        
        // Check if the parameter exists
        if (data.index >= form.objectWorkflowParam.length) {
            console.error(`Parameter index ${data.index} out of bounds`);
            return;
        }
        
        // Get the parameter
        const param = form.objectWorkflowParam[data.index];
        
        if (!param) {
            console.error(`Parameter at index ${data.index} is undefined`);
            return;
        }
        
        // Create a deep copy of the parameter
        const paramCopy = JSON.parse(JSON.stringify(param));
        
        // If the parameter has a name, append " - Copy" to make it unique
        if (paramCopy.name) {
            paramCopy.name = `${paramCopy.name} - Copy`;
        }
        
        // Insert the copy after the original
        form.objectWorkflowParam.splice(data.index + 1, 0, paramCopy);
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Refresh the UI
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error copying parameter:", error);
    }
}

function copyButtonInArray(data, formReference, modelService) {
    console.log(`copyButtonInArray called with data:`, data);
    
    if (!formReference || !data || data.index === undefined || !modelService) {
        console.error("Missing required data for button copy operation");
        return;
    }
    
    try {
        // Use the form reference directly since it's already the form object
        const form = formReference;
        
        // Initialize the buttons array if it doesn't exist
        if (!form.objectWorkflowButton) {
            form.objectWorkflowButton = [];
        }
        
        // Check if the button exists
        if (data.index >= form.objectWorkflowButton.length) {
            console.error(`Button index ${data.index} out of bounds`);
            return;
        }
        
        // Get the button to copy
        const originalButton = form.objectWorkflowButton[data.index];
        
        if (!originalButton) {
            console.error(`Button at index ${data.index} is undefined`);
            return;
        }
        
        // Create a deep copy of the button
        const buttonCopy = JSON.parse(JSON.stringify(originalButton));
        
        // If the button has a buttonName, create a unique name for the copy
        if (buttonCopy.buttonName) {
            let baseName = buttonCopy.buttonName;
            let copyName = `${baseName}Copy`;
            let counter = 1;
            
            // Ensure the copied button name is unique
            while (form.objectWorkflowButton.some(b => b.buttonName === copyName)) {
                copyName = `${baseName}Copy${counter}`;
                counter++;
            }
            
            buttonCopy.buttonName = copyName;
        }
        
        // Insert the copy right after the original
        form.objectWorkflowButton.splice(data.index + 1, 0, buttonCopy);
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Refresh the UI
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error copying button:", error);
    }
}

/**
 * Copies an output variable in the array
 * @param {Object} message The message containing the index of the output variable to copy
 * @param {Object} formReference Reference to the current form
 * @param {Object} modelService Reference to the model service
 */
function copyOutputVarInArray(message, formReference, modelService) {
    console.log(`copyOutputVarInArray called with index:`, message.index);
    
    if (!formReference || message.index === undefined || !modelService) {
        console.error("Missing required data for output variable copy operation");
        return;
    }
    
    try {
        // Use the form reference directly since it's already the form object
        const form = formReference;
        
        // Initialize the output variables array if it doesn't exist
        if (!form.objectWorkflowOutputVar) {
            form.objectWorkflowOutputVar = [];
        }
        
        // Check if the output variable exists
        if (message.index >= form.objectWorkflowOutputVar.length) {
            console.error(`Output variable index ${message.index} out of bounds`);
            return;
        }
        
        // Get the output variable to copy
        const outputVarToCopy = form.objectWorkflowOutputVar[message.index];
        
        // Create a deep copy of the output variable
        const outputVarCopy = JSON.parse(JSON.stringify(outputVarToCopy));
        
        // If the output variable has a name, append " Copy" to the name
        if (outputVarCopy.name) {
            outputVarCopy.name += " Copy";
        }
        
        // Insert the copy after the original
        form.objectWorkflowOutputVar.splice(message.index + 1, 0, outputVarCopy);
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Refresh the UI
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error copying output variable:", error);
    }
}

function addParamToForm(formReference, modelService, panel) {
    console.log("addParamToForm called");
    
    if (!formReference || !modelService) {
        console.error("Missing required data to add parameter");
        return;
    }
    
    try {
        // Use the form reference directly since it's already the form object
        const form = formReference;
        
        // Initialize the parameters array if it doesn't exist
        if (!form.objectWorkflowParam) {
            form.objectWorkflowParam = [];
        }
        
        // Create a new parameter with a default name
        const newParam = {
            name: `New Parameter ${form.objectWorkflowParam.length + 1}`
        };
        
        // Add the new parameter to the array
        form.objectWorkflowParam.push(newParam);
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Send message to webview to refresh the params list
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'refreshParamsList',
                data: form.objectWorkflowParam,
                newSelection: form.objectWorkflowParam.length - 1 // Select the newly added item
            });
        }
        
        // Refresh the UI
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error adding parameter:", error);
    }
}

function addParamToFormWithName(formReference, modelService, paramName, panel) {
    console.log("addParamToFormWithName called with name:", paramName);
    
    if (!formReference || !modelService || !paramName) {
        console.error("Missing required data to add parameter with name");
        return;
    }
    
    try {
        // Use the form reference directly since it's already the form object
        const form = formReference;
        
        // Initialize the parameters array if it doesn't exist
        if (!form.objectWorkflowParam) {
            form.objectWorkflowParam = [];
        }
        
        // Create a new parameter with the specified name
        const newParam = {
            name: paramName
        };
        
        // Add the new parameter to the array
        form.objectWorkflowParam.push(newParam);
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Send message to webview to refresh the params list
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'refreshParamsList',
                data: form.objectWorkflowParam,
                newSelection: form.objectWorkflowParam.length - 1 // Select the newly added item
            });
        }
        
        // Refresh the UI
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error adding parameter with name:", error);
    }
}

function addButtonToForm(formReference, modelService) {
    console.log("addButtonToForm called");
    
    if (!formReference || !modelService) {
        console.error("Missing required data for adding a button");
        return;
    }
    
    try {
        // Use the form reference directly since it's already the form object
        const form = formReference;
        
        // Initialize the buttons array if it doesn't exist
        if (!form.objectWorkflowButton) {
            form.objectWorkflowButton = [];
        }
        
        // Create a new button with a default name
        const newButton = {
            buttonName: "NewButton" + (form.objectWorkflowButton.length + 1)
        };
        
        // Add the new button to the array
        form.objectWorkflowButton.push(newButton);
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Refresh the UI
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error adding button:", error);
    }
}

/**
 * Adds a new button to the form with user-specified text and type
 * @param {Object} formReference Reference to the form object
 * @param {Object} modelService ModelService instance
 * @param {Object} data Data containing buttonText and buttonType
 * @param {Object} panel The webview panel for sending refresh messages
 */
function addButtonToFormWithText(formReference, modelService, data, panel) {
    console.log("addButtonToFormWithText called with data:", data);
    
    if (!formReference || !modelService || !data) {
        console.error("Missing required data for adding a button with text");
        return;
    }
    
    try {
        // Use the form reference directly since it's already the form object
        const form = formReference;
        
        // Initialize the buttons array if it doesn't exist
        if (!form.objectWorkflowButton) {
            form.objectWorkflowButton = [];
        }
        
        // Create a new button with user-specified properties
        const newButton = {
            buttonText: data.buttonText,
            buttonType: data.buttonType || 'other'
        };
        
        // Add the new button to the array
        form.objectWorkflowButton.push(newButton);
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Send message to webview to refresh the buttons list and select the new button
        if (panel && panel.webview) {
            const newButtonIndex = form.objectWorkflowButton.length - 1; // New button is the last one
            panel.webview.postMessage({
                command: 'refreshButtonsList',
                data: form.objectWorkflowButton,
                newSelection: newButtonIndex
            });
        }
        
        // Refresh the tree view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error adding button with text:", error);
    }
}

/**
 * Adds a new output variable to the form
 * @param {Object} formReference Reference to the current form
 * @param {Object} modelService Reference to the model service
 */
function addOutputVarToForm(formReference, modelService) {
    console.log("addOutputVarToForm called");
    
    if (!formReference || !modelService) {
        console.error("Missing required data for adding output variable");
        return;
    }
    
    try {
        // Use the form reference directly since it's already the form object
        const form = formReference;
        
        // Initialize the output variables array if it doesn't exist
        if (!form.objectWorkflowOutputVar) {
            form.objectWorkflowOutputVar = [];
        }
        
        // Create a new output variable with a default name
        const newOutputVar = {
            name: `OutputVar${form.objectWorkflowOutputVar.length + 1}`
        };
        
        // Add the new output variable to the form
        form.objectWorkflowOutputVar.push(newOutputVar);
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Refresh the UI
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error adding output variable to form:", error);
    }
}

/**
 * Adds a new output variable to the form with user-specified name
 * @param {Object} formReference Reference to the form object
 * @param {Object} modelService ModelService instance
 * @param {string} outputVarName Name for the new output variable
 * @param {Object} panel The webview panel for sending refresh messages
 */
function addOutputVarToFormWithName(formReference, modelService, outputVarName, panel) {
    console.log("addOutputVarToFormWithName called with name:", outputVarName);
    
    if (!formReference || !modelService || !outputVarName) {
        console.error("Missing required data to add output variable with name");
        return;
    }
    
    try {
        // Use the form reference directly since it's already the form object
        const form = formReference;
        
        // Initialize the output variables array if it doesn't exist
        if (!form.objectWorkflowOutputVar) {
            form.objectWorkflowOutputVar = [];
        }
        
        // Create a new output variable with the specified name
        const newOutputVar = {
            name: outputVarName
        };
        
        // Add the new output variable to the array
        form.objectWorkflowOutputVar.push(newOutputVar);
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Send message to webview to refresh the output vars list
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'refreshOutputVarsList',
                data: form.objectWorkflowOutputVar,
                newSelection: form.objectWorkflowOutputVar.length - 1 // Select the newly added item
            });
        }
        
        // Refresh the UI
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error adding output variable with name:", error);
    }
}

function updateParamFull(data, formReference, modelService) {
    console.log(`updateParamFull called with data:`, data);
    
    if (!formReference || !data || data.index === undefined || !data.param || !modelService) {
        console.error("Missing required data for full parameter update");
        return;
    }
    
    try {
        // Use the form reference directly since it's already the form object
        const form = formReference;
        
        // Initialize the parameters array if it doesn't exist
        if (!form.objectWorkflowParam) {
            form.objectWorkflowParam = [];
        }
        
        // Check if the parameter exists
        if (data.index >= form.objectWorkflowParam.length) {
            console.error(`Parameter index ${data.index} out of bounds`);
            return;
        }
        
        // Update the parameter with the new data
        form.objectWorkflowParam[data.index] = data.param;
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Refresh the UI
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error updating full parameter:", error);
    }
}

module.exports = {
    showFormDetails,
    refreshAll,
    getOpenPanelItems,
    closeAllPanels
};

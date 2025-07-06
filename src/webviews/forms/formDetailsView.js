"use strict";
const vscode = require("vscode");
const { loadSchema, getFormSchemaProperties, getFormParamsSchema, getFormButtonsSchema, getFormOutputVarsSchema } = require("./helpers/schemaLoader");
const { formatLabel } = require("./helpers/formDataHelper");
const { generateDetailsView } = require("./components/detailsViewGenerator");

// Track current panels to avoid duplicates
const activePanels = new Map();

// Registry to track all open form details panels
const openPanels = new Map();

/**
 * Opens a webview panel displaying details for a form
 * @param {Object} item The tree item representing the form
 * @param {Object} modelService The ModelService instance
 */
function showFormDetails(item, modelService) {
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
            retainContextWhenHidden: true
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
    
    // Set the HTML content with the full form data
    panel.webview.html = generateDetailsView(
        formData, 
        formSchemaProps, 
        formParamsSchema, 
        formButtonsSchema, 
        formOutputVarsSchema
    );
    
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
                        console.warn("Cannot update param: ModelService not available or form reference not found");
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
                    
                case "moveParam":
                    if (modelService && formReference) {
                        // Move param in the array
                        moveParamInArray(message.data, formReference, modelService);
                    } else {
                        console.warn("Cannot move param: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "moveButton":
                    if (modelService && formReference) {
                        // Move button in the array
                        moveButtonInArray(message.data, formReference, modelService);
                    } else {
                        console.warn("Cannot move button: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "moveOutputVar":
                    if (modelService && formReference) {
                        // Move output variable in the array
                        moveOutputVarInArray(message.data, formReference, modelService);
                    } else {
                        console.warn("Cannot move output variable: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "reverseParam":
                    if (modelService && formReference) {
                        // Reverse param array
                        reverseParamArray(formReference, modelService);
                    } else {
                        console.warn("Cannot reverse params: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "reverseButton":
                    if (modelService && formReference) {
                        // Reverse button array
                        reverseButtonArray(formReference, modelService);
                    } else {
                        console.warn("Cannot reverse buttons: ModelService not available or form reference not found");
                    }
                    return;
                    
                case "reverseOutputVar":
                    if (modelService && formReference) {
                        // Reverse output variable array
                        reverseOutputVarArray(formReference, modelService);
                    } else {
                        console.warn("Cannot reverse output variables: ModelService not available or form reference not found");
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

// Helper functions for updating the model (simplified versions)
function updateModelDirectly(data, formReference, modelService, panel) {
    // Implementation would be similar to reports but for form properties
    console.log("updateModelDirectly called for form");
}

function updateSettingsDirectly(data, formReference, modelService) {
    // Implementation would be similar to reports but for form settings
    console.log("updateSettingsDirectly called for form");
}

function updateButtonDirectly(data, formReference, modelService) {
    // Implementation would be similar to reports but for form buttons
    console.log("updateButtonDirectly called for form");
}

function updateParamDirectly(data, formReference, modelService) {
    // Implementation would be similar to reports but for form params
    console.log("updateParamDirectly called for form");
}

function updateOutputVarDirectly(data, formReference, modelService) {
    // Implementation would be similar to reports but for form output variables
    console.log("updateOutputVarDirectly called for form");
}

function moveParamInArray(data, formReference, modelService) {
    // Implementation would be similar to reports but for form params
    console.log("moveParamInArray called for form");
}

function moveButtonInArray(data, formReference, modelService) {
    // Implementation would be similar to reports but for form buttons
    console.log("moveButtonInArray called for form");
}

function moveOutputVarInArray(data, formReference, modelService) {
    // Implementation would be similar to reports but for form output variables
    console.log("moveOutputVarInArray called for form");
}

function reverseParamArray(formReference, modelService) {
    // Implementation would be similar to reports but for form params
    console.log("reverseParamArray called for form");
}

function reverseButtonArray(formReference, modelService) {
    // Implementation would be similar to reports but for form buttons
    console.log("reverseButtonArray called for form");
}

function reverseOutputVarArray(formReference, modelService) {
    // Implementation would be similar to reports but for form output variables
    console.log("reverseOutputVarArray called for form");
}

module.exports = {
    showFormDetails,
    refreshAll,
    getOpenPanelItems,
    closeAllPanels
};

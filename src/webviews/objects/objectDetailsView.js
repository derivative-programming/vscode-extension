"use strict";
const vscode = require("vscode");
const { loadSchema, getObjectSchemaProperties, getPropItemsSchema } = require("./helpers/schemaLoader");
const { formatLabel } = require("./helpers/objectDataHelper");
const { generateDetailsView } = require("./components/detailsViewGenerator");

// Track current panels to avoid duplicates
const activePanels = new Map();

/**
 * Opens a webview panel displaying details for a data object
 * @param {Object} item The tree item representing the data object
 * @param {Object} modelService The ModelService instance
 */
function showObjectDetails(item, modelService) {
    console.log(`showObjectDetails called for ${item.label}`);
    
    // Check if panel already exists for this object
    const panelId = `objectDetails-${item.label}`;
    
    if (activePanels.has(panelId)) {
        // Panel exists, reveal it instead of creating a new one
        activePanels.get(panelId).reveal(vscode.ViewColumn.One);
        return;
    }
    
    // Create webview panel
    const panel = vscode.window.createWebviewPanel(
        "objectDetails", 
        `Details for ${item.label}`,
        vscode.ViewColumn.One, 
        { 
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );
    
    // Track this panel
    activePanels.set(panelId, panel);
    
    // Remove from tracking when disposed
    panel.onDidDispose(() => {
        activePanels.delete(panelId);
    });
    
    // Get the full object data from ModelService
    let objectData;
    let objectReference = null;
    
    if (modelService && typeof modelService.isFileLoaded === "function" && modelService.isFileLoaded()) {
        console.log("Using ModelService to get object data");
        
        // Find the object in the model by name
        const allObjects = modelService.getAllObjects();
        objectData = allObjects.find(obj => 
            obj.name && obj.name.trim().toLowerCase() === item.label.trim().toLowerCase()
        );
        
        // Store a reference to the actual object in the model
        if (objectData) {
            objectReference = objectData;
        } else {
            console.warn(`Object ${item.label} not found in model service data`);
            objectData = { name: item.label, error: "Object not found in model" };
        }
    } else {
        console.warn("ModelService not available or not loaded");
        objectData = { name: item.label, error: "ModelService not available" };
    }
    
    // Ensure the object has essential properties to avoid errors
    if (!objectData) {
        objectData = { name: item.label };
    }
    
    // Initialize the prop array if it doesn't exist
    if (!objectData.prop) {
        objectData.prop = [];
    }
    
    // Get schema for generating the HTML
    const schema = loadSchema();
    const objectSchemaProps = getObjectSchemaProperties(schema);
    const propItemsSchema = getPropItemsSchema(schema);
    
    // Set the HTML content with the full object data
    panel.webview.html = generateDetailsView(objectData, objectSchemaProps, propItemsSchema);
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case "updateModel":
                    if (modelService && objectReference) {
                        // Directly update the model instance
                        updateModelDirectly(message.data, objectReference, modelService);
                    } else {
                        console.warn("Cannot update model directly: ModelService not available or object reference not found");
                    }
                    return;
            }
        }
    );
}

/**
 * Updates object data directly in the ModelService instance
 * @param {Object} data The data to update (contains props array)
 * @param {Object} objectReference Direct reference to the object in the model
 * @param {Object} modelService The ModelService instance
 */
function updateModelDirectly(data, objectReference, modelService) {
    try {
        // Update props if provided
        if (data.props) {
            // Directly update the objectReference's props array
            objectReference.prop = data.props;
            
            // No need to call saveToFile as we're directly modifying the model instance
            // Just refresh the tree view to reflect any visible changes
            vscode.commands.executeCommand("appdna.refresh");
        }
    } catch (error) {
        console.error("Error updating model directly:", error);
    }
}

// Export the showObjectDetails function
module.exports = {
    showObjectDetails
};
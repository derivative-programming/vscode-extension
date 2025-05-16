"use strict";
const vscode = require("vscode");
const { loadSchema, getObjectSchemaProperties, getPropItemsSchema } = require("./helpers/schemaLoader");
const { formatLabel } = require("./helpers/objectDataHelper");
const { generateDetailsView } = require("./components/detailsViewGenerator");

// Track current panels to avoid duplicates
const activePanels = new Map();

// Registry to track all open object details panels
const openPanels = new Map();

/**
 * Opens a webview panel displaying details for a data object
 * @param {Object} item The tree item representing the data object
 * @param {Object} modelService The ModelService instance
 */
function showObjectDetails(item, modelService) {
    // Create a normalized panel ID to ensure consistency
    const normalizedLabel = item.label.trim().toLowerCase();
    const panelId = `objectDetails-${normalizedLabel}`;
    
    console.log(`showObjectDetails called for ${item.label} (normalized: ${normalizedLabel}, panelId: ${panelId})`);
    
    // Check if panel already exists for this object
    if (activePanels.has(panelId)) {
        console.log(`Panel already exists for ${item.label}, revealing existing panel`);
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
                    
                case "updateSettings":
                    if (modelService && objectReference) {
                        // Update settings properties directly on the object
                        updateSettingsDirectly(message.data, objectReference, modelService);
                    } else {
                        console.warn("Cannot update settings: ModelService not available or object reference not found");
                    }
                    return;
            }
        }
    );
}

/**
 * Refreshes all open object details webviews with the latest model data
 */
function refreshAll() {
    console.log(`Refreshing all open panels, count: ${openPanels.size}`);
    for (const { panel, item, modelService } of openPanels.values()) {
        if (panel && !panel._disposed) {
            // Use the same normalization as in showObjectDetails
            const normalizedLabel = item.label.trim().toLowerCase();
            const panelId = `objectDetails-${normalizedLabel}`;
            console.log(`Refreshing panel for ${item.label} (normalized: ${normalizedLabel}, panelId: ${panelId})`);
            
            // Get the latest object data
            let objectData;
            if (modelService && typeof modelService.isFileLoaded === "function" && modelService.isFileLoaded()) {
                const allObjects = modelService.getAllObjects();
                objectData = allObjects.find(obj =>
                    obj.name && obj.name.trim().toLowerCase() === normalizedLabel
                );
            }
            if (!objectData) {
                objectData = { name: item.label, error: "Object not found in model" };
            }
            if (!objectData.prop) {
                objectData.prop = [];
            }
            // Get schema for generating the HTML
            const schema = loadSchema();
            const objectSchemaProps = getObjectSchemaProperties(schema);
            const propItemsSchema = getPropItemsSchema(schema);
            // Update the HTML content
            panel.webview.html = generateDetailsView(objectData, objectSchemaProps, propItemsSchema);
        }
    }
}

/**
 * Updates object data directly in the ModelService instance
 * @param {Object} data The data to update (contains props array)
 * @param {Object} objectReference Direct reference to the object in the model
 * @param {Object} modelService The ModelService instance
 */
function updateModelDirectly(data, objectReference, modelService) {
    try {
        console.log("[DEBUG] updateModelDirectly called");
        console.log("[DEBUG] objectReference before update:", JSON.stringify(objectReference, null, 2));
        // Update props if provided
        if (data.props) {
            objectReference.prop = data.props;
            console.log("[DEBUG] objectReference after update:", JSON.stringify(objectReference, null, 2));
            // Just refresh the tree view to reflect any visible changes
            vscode.commands.executeCommand("appdna.refresh");
        }
    } catch (error) {
        console.error("Error updating model directly:", error);
    }
}

/**
 * Updates settings properties directly on the object in the ModelService instance
 * @param {Object} data The data containing property update information
 * @param {Object} objectReference Direct reference to the object in the model
 * @param {Object} modelService The ModelService instance 
 */
function updateSettingsDirectly(data, objectReference, modelService) {
    try {
        console.log("[DEBUG] updateSettingsDirectly called");
        console.log("[DEBUG] objectReference before update:", JSON.stringify(objectReference, null, 2));
        // Extract property information from the data
        const { property, exists, value } = data;
        console.log("[DEBUG] updateSettingsDirectly received:", property, value, typeof value);
        if (property) {
            if (exists) {
                // Add or update the property
                objectReference[property] = value;
            } else {
                // Remove the property
                delete objectReference[property];
            }
            console.log("[DEBUG] objectReference after update:", JSON.stringify(objectReference, null, 2));
            vscode.commands.executeCommand("appdna.refresh");
        }
    } catch (error) {
        console.error("Error updating settings directly:", error);
    }
}

// Export the showObjectDetails function
module.exports = {
    showObjectDetails,
    refreshAll
};
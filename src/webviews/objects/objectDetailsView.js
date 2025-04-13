"use strict";
const vscode = require("vscode");
const { loadSchema, getObjectSchemaProperties, getPropItemsSchema } = require("./helpers/schemaLoader");
const { getObjectData, saveObjectData } = require("./helpers/objectDataHelper");
const { generateDetailsView } = require("./components/detailsViewGenerator");

// Track current panels to avoid duplicates
const activePanels = new Map();

/**
 * Opens a webview panel displaying details for a data object
 * @param {Object} item The tree item representing the data object
 * @param {string} appDNAFilePath Path to the app-dna.json file
 */
function showObjectDetails(item, appDNAFilePath) {
    console.log(`showObjectDetails called for ${item.label} at ${appDNAFilePath}`);
    
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
    
    // Get the full object data
    let objectData = getObjectData(item.label, appDNAFilePath);
    
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
                case "save":
                    saveObjectData(message.data, appDNAFilePath);
                    return;
            }
        }
    );
}

// Export the showObjectDetails function
module.exports = {
    showObjectDetails
};
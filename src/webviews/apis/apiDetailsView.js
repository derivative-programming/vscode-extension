"use strict";
const vscode = require("vscode");
const path = require("path");
const { loadSchema, getApiSiteSchemaProperties } = require("./helpers/schemaLoader");
const { generateDetailsView } = require("./components/detailsViewGenerator");

// Track current panels to avoid duplicates
const activePanels = new Map();

// Registry to track all open API details panels
const openPanels = new Map();

// Store context for later use
let currentContext = undefined;

/**
 * Opens a webview panel displaying details for an API site
 * @param {Object} item The tree item representing the API site
 * @param {Object} modelService The ModelService instance
 * @param {vscode.ExtensionContext} context Extension context (optional, uses stored context if not provided)
 */
function showApiDetails(item, modelService, context) {
    // Store context for later use if provided
    if (context) {
        currentContext = context;
    }
    
    // Use provided context or fallback to stored context
    const extensionContext = context || currentContext;
    
    if (!extensionContext) {
        console.error('Extension context not available for API details view');
        vscode.window.showErrorMessage('Extension context not available. Please try again.');
        return;
    }
    
    // Create a normalized panel ID to ensure consistency
    const normalizedLabel = item.label.trim().toLowerCase();
    const panelId = `apiDetails-${normalizedLabel}`;
    
    console.log(`showApiDetails called for ${item.label} (normalized: ${normalizedLabel}, panelId: ${panelId})`);
    
    // Check if panel already exists for this API site
    if (activePanels.has(panelId)) {
        console.log(`Panel already exists for ${item.label}, revealing existing panel`);
        // Panel exists, reveal it instead of creating a new one
        activePanels.get(panelId).reveal(vscode.ViewColumn.One);
        return;
    }
    
    // Create webview panel
    const panel = vscode.window.createWebviewPanel(
        "apiDetails", 
        `Details for ${item.label} API Site`,
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
    
    // Get the full API site data from ModelService
    let apiSiteData;
    let apiSiteReference = null;
    
    if (modelService && typeof modelService.isFileLoaded === "function" && modelService.isFileLoaded()) {
        console.log("Using ModelService to get API site data");
        
        // Find the API site in the model by name
        const allApiSites = modelService.getAllApiSites();
        apiSiteData = allApiSites.find(apiSite => {
            const apiSiteName = apiSite.name || 'Unnamed API Site';
            return apiSiteName.trim().toLowerCase() === item.label.trim().toLowerCase();
        });
        
        // Store a reference to the actual API site in the model
        if (apiSiteData) {
            apiSiteReference = apiSiteData;
        } else {
            console.warn(`API site ${item.label} not found in model service data`);
            apiSiteData = { name: item.label, error: "API site not found in model" };
        }
    } else {
        console.warn("ModelService not available or not loaded");
        apiSiteData = { name: item.label, error: "ModelService not available" };
    }
    
    // Ensure the API site has essential properties to avoid errors
    if (!apiSiteData) {
        apiSiteData = { name: item.label };
    }
    
    // Initialize the array properties if they don't exist
    if (!apiSiteData.apiEnvironment) {
        apiSiteData.apiEnvironment = [];
    }
    if (!apiSiteData.apiEndPoint) {
        apiSiteData.apiEndPoint = [];
    }
    
    // Get schema for generating the HTML
    const schema = loadSchema();
    const apiSiteSchemaProps = getApiSiteSchemaProperties(schema);
    
    // Generate codicon URI for the webview
    const codiconsUri = panel.webview.asWebviewUri(
        vscode.Uri.file(path.join(extensionContext.extensionPath, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css'))
    );
    
    try {
        // Set the HTML content with the full API site data
        panel.webview.html = generateDetailsView(
            apiSiteData, 
            apiSiteSchemaProps, 
            codiconsUri
        );
        
        console.log(`API details view created successfully for ${item.label}`);
    } catch (error) {
        console.error("Error generating API details view HTML:", error);
        vscode.window.showErrorMessage(`Failed to generate API details view: ${error.message}`);
    }
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        message => {
            console.log("API Details received message:", message);
            
            switch (message.command) {
                case "updateSettings":
                    if (modelService && apiSiteReference) {
                        // Update settings properties directly on the API site
                        updateSettingsDirectly(message.data, apiSiteReference, modelService);
                    } else {
                        console.warn("Cannot update settings: ModelService not available or API site reference not found");
                    }
                    return;
                    
                case "addEndpointWithName":
                    if (modelService && apiSiteReference) {
                        // Add a new endpoint to the API site with specified name
                        addEndpointToApiSiteWithName(apiSiteReference, modelService, message.data.name, panel);
                    } else {
                        console.warn("Cannot add endpoint with name: ModelService not available or API site reference not found");
                    }
                    return;
                    
                case "updateEndpointFull":
                    if (modelService && apiSiteReference) {
                        // Update the complete endpoint with new data
                        updateEndpointFull(message.data, apiSiteReference, modelService);
                    } else {
                        console.warn("Cannot update endpoint: ModelService not available or API site reference not found");
                    }
                    return;
                    
                case "moveEndpointInArray":
                    if (modelService && apiSiteReference) {
                        // Move endpoint in the array
                        moveEndpointInArray(message.data, apiSiteReference, modelService, panel);
                    } else {
                        console.warn("Cannot move endpoint: ModelService not available or API site reference not found");
                    }
                    return;
                    
                case "reverseEndpointsArray":
                    if (modelService && apiSiteReference) {
                        // Reverse the endpoints array
                        reverseEndpointsArray(apiSiteReference, modelService, panel);
                    } else {
                        console.warn("Cannot reverse endpoints: ModelService not available or API site reference not found");
                    }
                    return;
                    
                case "sortEndpointsArray":
                    if (modelService && apiSiteReference) {
                        // Sort the endpoints array alphabetically
                        sortEndpointsArray(apiSiteReference, modelService, panel);
                    } else {
                        console.warn("Cannot sort endpoints: ModelService not available or API site reference not found");
                    }
                    return;
            }
        }
    );
}

/**
 * Helper function to update API site settings directly
 * @param {Object} data The update data
 * @param {Object} apiSiteRef Reference to the API site object
 * @param {Object} modelService The ModelService instance
 */
function updateSettingsDirectly(data, apiSiteRef, modelService) {
    try {
        console.log("[DEBUG] updateSettingsDirectly called for API site");
        console.log("[DEBUG] apiSiteRef before update:", JSON.stringify(apiSiteRef, null, 2));
        
        const { property, exists, value } = data || {};
        console.log("[DEBUG] updateSettingsDirectly received:", property, value, typeof value);
        
        if (!property) { 
            return; 
        }
        
        if (exists) {
            apiSiteRef[property] = value;
        } else {
            delete apiSiteRef[property];
        }
        
        console.log("[DEBUG] apiSiteRef after update:", JSON.stringify(apiSiteRef, null, 2));
        
        if (typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
            console.log("[DEBUG] Model marked as having unsaved changes");
            // Keep parity with Forms: trigger a tree refresh so unsaved indicator updates promptly
            vscode.commands.executeCommand("appdna.refresh");
        }
        
        console.log(`Updated API site property ${property}:`, exists ? value : '[removed]');
    } catch (e) {
        console.error('updateSettingsDirectly error:', e);
    }
}

/**
 * Refreshes all open API details webviews with the latest model data
 */
function refreshAll() {
    console.log("Refreshing all API details views...");
    
    for (const [panelId, panelInfo] of openPanels.entries()) {
        const { panel, item, modelService } = panelInfo;
        
        try {
            // Get the updated API site data
            let apiSiteData;
            if (modelService && typeof modelService.isFileLoaded === "function" && modelService.isFileLoaded()) {
                const allApiSites = modelService.getAllApiSites();
                apiSiteData = allApiSites.find(apiSite => {
                    const apiSiteName = apiSite.name || 'Unnamed API Site';
                    return apiSiteName.trim().toLowerCase() === item.label.trim().toLowerCase();
                });
            }
            
            if (!apiSiteData) {
                apiSiteData = { name: item.label, error: "API site not found in model" };
            }
            
            // Initialize array properties
            if (!apiSiteData.apiEnvironment) {
                apiSiteData.apiEnvironment = [];
            }
            if (!apiSiteData.apiEndPoint) {
                apiSiteData.apiEndPoint = [];
            }
            
            // Get schema for generating the HTML
            const schema = loadSchema();
            const apiSiteSchemaProps = getApiSiteSchemaProperties(schema);
            
            // Regenerate and update the webview HTML with updated model data
            let codiconsUri;
            try {
                const extCtx = currentContext;
                if (extCtx) {
                    codiconsUri = panel.webview.asWebviewUri(
                        vscode.Uri.file(path.join(extCtx.extensionPath, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css'))
                    );
                }
            } catch (e) {
                console.warn('Unable to resolve codicons URI during refresh:', e?.message);
            }

            panel.webview.html = generateDetailsView(
                apiSiteData, 
                apiSiteSchemaProps, 
                codiconsUri
            );
        } catch (error) {
            console.error(`Error refreshing API details panel ${panelId}:`, error);
        }
    }
}

/**
 * Get all open API details panel items for external operations
 * @returns {Array} Array of open panel items
 */
function getOpenPanelItems() {
    return Array.from(openPanels.values()).map(info => info.item);
}

/**
 * Close all open API details panels
 */
function closeAllPanels() {
    for (const panel of activePanels.values()) {
        panel.dispose();
    }
    activePanels.clear();
    openPanels.clear();
}

/**
 * Add an endpoint to the API site with specified name
 * @param {Object} apiSiteReference Direct reference to the API site object
 * @param {Object} modelService Model service instance
 * @param {string} endpointName Name for the new endpoint
 * @param {Object} panel The webview panel to refresh
 */
function addEndpointToApiSiteWithName(apiSiteReference, modelService, endpointName, panel) {
    console.log("addEndpointToApiSiteWithName called with name:", endpointName);
    
    if (!apiSiteReference || !modelService || !endpointName) {
        console.error("Missing required data to add endpoint with name");
        return;
    }
    
    try {
        // Initialize the endpoints array if it doesn't exist
        if (!apiSiteReference.apiEndPoint) {
            apiSiteReference.apiEndPoint = [];
        }
        
        // Create a new endpoint with the specified name
        const newEndpoint = {
            name: endpointName
        };
        
        // Add the new endpoint to the array
        apiSiteReference.apiEndPoint.push(newEndpoint);
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Send message to webview to refresh the endpoints list
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'refreshEndpointsList',
                data: apiSiteReference.apiEndPoint,
                newSelection: apiSiteReference.apiEndPoint.length - 1 // Select the newly added endpoint
            });
        }
        
        // Refresh the view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error adding endpoint:", error);
    }
}

/**
 * Update a complete endpoint with new data
 * @param {Object} data Data containing index and endpoint object
 * @param {Object} apiSiteReference Direct reference to the API site object
 * @param {Object} modelService Model service instance
 */
function updateEndpointFull(data, apiSiteReference, modelService) {
    console.log(`updateEndpointFull called with data:`, data);
    
    if (!apiSiteReference || !data || data.index === undefined || !data.endpoint || !modelService) {
        console.error("Missing required data for full endpoint update");
        return;
    }
    
    try {
        // Initialize the endpoints array if it doesn't exist
        if (!apiSiteReference.apiEndPoint) {
            apiSiteReference.apiEndPoint = [];
        }
        
        // Check if the endpoint exists
        if (data.index >= apiSiteReference.apiEndPoint.length) {
            console.error(`Endpoint index ${data.index} out of bounds`);
            return;
        }
        
        // Update the endpoint with the new data
        apiSiteReference.apiEndPoint[data.index] = data.endpoint;
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Refresh the view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error updating endpoint:", error);
    }
}

/**
 * Moves an endpoint in the apiEndPoint array
 * @param {Object} data Data containing fromIndex and toIndex
 * @param {Object} apiSiteReference Direct reference to the API site object
 * @param {Object} modelService Model service instance
 * @param {Object} panel The webview panel to refresh
 */
function moveEndpointInArray(data, apiSiteReference, modelService, panel) {
    console.log(`moveEndpointInArray called with data:`, data);
    
    if (!apiSiteReference || !data || data.fromIndex === undefined || data.toIndex === undefined || !modelService) {
        console.error("Missing required data for endpoint move");
        return;
    }
    
    try {
        // Initialize the endpoints array if it doesn't exist
        if (!apiSiteReference.apiEndPoint) {
            apiSiteReference.apiEndPoint = [];
        }
        
        const { fromIndex, toIndex } = data;
        const endpoints = apiSiteReference.apiEndPoint;
        
        // Validate indices
        if (fromIndex < 0 || fromIndex >= endpoints.length || toIndex < 0 || toIndex >= endpoints.length) {
            console.error("Invalid indices for endpoint move");
            return;
        }
        
        // Move the endpoint
        const [movedEndpoint] = endpoints.splice(fromIndex, 1);
        endpoints.splice(toIndex, 0, movedEndpoint);
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Send message to webview to refresh the endpoints list
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'refreshEndpointsList',
                data: apiSiteReference.apiEndPoint,
                newSelection: toIndex
            });
        }
        
        // Refresh the view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error moving endpoint:", error);
    }
}

/**
 * Reverses the endpoints array
 * @param {Object} apiSiteReference Direct reference to the API site object
 * @param {Object} modelService Model service instance
 * @param {Object} panel The webview panel to refresh
 */
function reverseEndpointsArray(apiSiteReference, modelService, panel) {
    console.log("reverseEndpointsArray called");
    
    if (!apiSiteReference || !modelService) {
        console.error("Missing required data for endpoints reverse");
        return;
    }
    
    try {
        // Initialize the endpoints array if it doesn't exist
        if (!apiSiteReference.apiEndPoint) {
            apiSiteReference.apiEndPoint = [];
        }
        
        // Reverse the array
        apiSiteReference.apiEndPoint.reverse();
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Send message to webview to refresh the endpoints list
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'refreshEndpointsList',
                data: apiSiteReference.apiEndPoint,
                newSelection: null // Don't maintain selection after reverse
            });
        }
        
        // Refresh the view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error reversing endpoints:", error);
    }
}

/**
 * Sorts the endpoints array alphabetically by name
 * @param {Object} apiSiteReference Direct reference to the API site object
 * @param {Object} modelService Model service instance
 * @param {Object} panel The webview panel to refresh
 */
function sortEndpointsArray(apiSiteReference, modelService, panel) {
    console.log("sortEndpointsArray called");
    
    if (!apiSiteReference || !modelService) {
        console.error("Missing required data for endpoints sort");
        return;
    }
    
    try {
        // Initialize the endpoints array if it doesn't exist
        if (!apiSiteReference.apiEndPoint) {
            apiSiteReference.apiEndPoint = [];
        }
        
        if (apiSiteReference.apiEndPoint.length < 2) {
            console.log("Not enough endpoints to sort");
            return;
        }
        
        // Sort the array alphabetically by name (case-insensitive)
        apiSiteReference.apiEndPoint.sort((a, b) => {
            const nameA = (a && a.name) ? a.name.toLowerCase() : '';
            const nameB = (b && b.name) ? b.name.toLowerCase() : '';
            return nameA.localeCompare(nameB);
        });
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Send message to webview to refresh the endpoints list
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'refreshEndpointsList',
                data: apiSiteReference.apiEndPoint,
                newSelection: null // Don't maintain selection after sort
            });
        }
        
        // Refresh the view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error sorting endpoints:", error);
    }
}

module.exports = {
    showApiDetails,
    refreshAll,
    getOpenPanelItems,
    closeAllPanels
};
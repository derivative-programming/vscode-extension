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
        const { property, exists, value } = data || {};
        if (!property) { 
            return; 
        }
        
        if (exists) {
            apiSiteRef[property] = value;
        } else {
            delete apiSiteRef[property];
        }
        
        if (typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
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
            panel.webview.html = generateDetailsView(
                apiSiteData, 
                apiSiteSchemaProps, 
                undefined // codiconsUri not available in this context
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

module.exports = {
    showApiDetails,
    refreshAll,
    getOpenPanelItems,
    closeAllPanels
};
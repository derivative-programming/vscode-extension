"use strict";
const vscode = require("vscode");
const { loadSchema, getReportSchemaProperties, getReportColumnsSchema, getReportButtonsSchema, getReportParamsSchema } = require("./helpers/schemaLoader");
const { formatLabel } = require("./helpers/reportDataHelper");
const { generateDetailsView } = require("./components/detailsViewGenerator");

// Track current panels to avoid duplicates
const activePanels = new Map();

// Registry to track all open report details panels
const openPanels = new Map();

/**
 * Opens a webview panel displaying details for a report
 * @param {Object} item The tree item representing the report
 * @param {Object} modelService The ModelService instance
 */
function showReportDetails(item, modelService) {
    // Create a normalized panel ID to ensure consistency
    const normalizedLabel = item.label.trim().toLowerCase();
    const panelId = `reportDetails-${normalizedLabel}`;
    
    console.log(`showReportDetails called for ${item.label} (normalized: ${normalizedLabel}, panelId: ${panelId})`);
    
    // Check if panel already exists for this report
    if (activePanels.has(panelId)) {
        console.log(`Panel already exists for ${item.label}, revealing existing panel`);
        // Panel exists, reveal it instead of creating a new one
        activePanels.get(panelId).reveal(vscode.ViewColumn.One);
        return;
    }
    
    // Create webview panel
    const panel = vscode.window.createWebviewPanel(
        "reportDetails", 
        `Report: ${item.label}`,
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
    
    // Get the full report data from ModelService
    let reportData;
    let reportReference = null;
    
    if (modelService && typeof modelService.isFileLoaded === "function" && modelService.isFileLoaded()) {
        console.log("Using ModelService to get report data");
        
        // Find the report in the model by name
        const allReports = modelService.getAllReports();
        reportData = allReports.find(rep => 
            rep.name && rep.name.trim().toLowerCase() === item.label.trim().toLowerCase()
        );
        
        // Store a reference to the actual report in the model
        if (reportData) {
            reportReference = reportData;
        } else {
            console.warn(`Report ${item.label} not found in model service data`);
            reportData = { name: item.label, error: "Report not found in model" };
        }
    } else {
        console.warn("ModelService not available or not loaded");
        reportData = { name: item.label, error: "ModelService not available" };
    }
    
    // Ensure the report has essential properties to avoid errors
    if (!reportData) {
        reportData = { name: item.label };
    }
    
    // Initialize the array properties if they don't exist
    if (!reportData.reportColumn) {
        reportData.reportColumn = [];
    }
    if (!reportData.reportButton) {
        reportData.reportButton = [];
    }
    if (!reportData.reportParam) {
        reportData.reportParam = [];
    }
    
    // Get schema for generating the HTML
    const schema = loadSchema();
    const reportSchemaProps = getReportSchemaProperties(schema);
    const reportColumnsSchema = getReportColumnsSchema(schema);
    const reportButtonsSchema = getReportButtonsSchema(schema);
    const reportParamsSchema = getReportParamsSchema(schema);
    
    // Set the HTML content with the full report data
    panel.webview.html = generateDetailsView(
        reportData, 
        reportSchemaProps, 
        reportColumnsSchema, 
        reportButtonsSchema, 
        reportParamsSchema
    );
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case "updateModel":
                    if (modelService && reportReference) {
                        // Directly update the model instance
                        updateModelDirectly(message.data, reportReference, modelService);
                    } else {
                        console.warn("Cannot update model directly: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "updateSettings":
                    if (modelService && reportReference) {
                        // Update settings properties directly on the report
                        updateSettingsDirectly(message.data, reportReference, modelService);
                    } else {
                        console.warn("Cannot update settings: ModelService not available or report reference not found");
                    }
                    return;
            }
        }
    );
}

/**
 * Refreshes all open report details webviews with the latest model data
 */
function refreshAll() {
    console.log(`Refreshing all open panels, count: ${openPanels.size}`);
    for (const { panel, item, modelService } of openPanels.values()) {
        if (panel && !panel._disposed) {
            // Use the same normalization as in showReportDetails
            const normalizedLabel = item.label.trim().toLowerCase();
            const panelId = `reportDetails-${normalizedLabel}`;
            console.log(`Refreshing panel for ${item.label} (normalized: ${normalizedLabel}, panelId: ${panelId})`);
            
            // Get the latest report data
            let reportData;
            if (modelService && typeof modelService.isFileLoaded === "function" && modelService.isFileLoaded()) {
                const allReports = modelService.getAllReports();
                reportData = allReports.find(rep =>
                    rep.name && rep.name.trim().toLowerCase() === normalizedLabel
                );
            }
            if (!reportData) {
                reportData = { name: item.label, error: "Report not found in model" };
            }
            
            // Initialize the array properties if they don't exist
            if (!reportData.reportColumn) {
                reportData.reportColumn = [];
            }
            if (!reportData.reportButton) {
                reportData.reportButton = [];
            }
            if (!reportData.reportParam) {
                reportData.reportParam = [];
            }
            
            // Get schema for generating the HTML
            const schema = loadSchema();
            const reportSchemaProps = getReportSchemaProperties(schema);
            const reportColumnsSchema = getReportColumnsSchema(schema);
            const reportButtonsSchema = getReportButtonsSchema(schema);
            const reportParamsSchema = getReportParamsSchema(schema);
            
            // Update the HTML content
            panel.webview.html = generateDetailsView(
                reportData, 
                reportSchemaProps, 
                reportColumnsSchema, 
                reportButtonsSchema, 
                reportParamsSchema
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
 * Closes all currently open report details panels
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

/**
 * Updates report data directly in the ModelService instance
 * @param {Object} data The data to update
 * @param {Object} reportReference Direct reference to the report in the model
 * @param {Object} modelService The ModelService instance
 */
function updateModelDirectly(data, reportReference, modelService) {
    try {
        console.log("[DEBUG] updateModelDirectly called for report");
        console.log("[DEBUG] reportReference before update:", JSON.stringify(reportReference, null, 2));
        
        // Update columns if provided
        if (data.columns) {
            reportReference.reportColumn = data.columns;
        }
        
        // Update buttons if provided
        if (data.buttons) {
            reportReference.reportButton = data.buttons;
        }
        
        // Update parameters if provided
        if (data.params) {
            reportReference.reportParam = data.params;
        }
        
        console.log("[DEBUG] reportReference after update:", JSON.stringify(reportReference, null, 2));
        
        // Mark that there are unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
            console.log("[DEBUG] Model marked as having unsaved changes");
        }
        
        // Just refresh the tree view to reflect any visible changes
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error updating model directly:", error);
    }
}

/**
 * Updates settings properties directly on the report in the ModelService instance
 * @param {Object} data The data containing property update information
 * @param {Object} reportReference Direct reference to the report in the model
 * @param {Object} modelService The ModelService instance 
 */
function updateSettingsDirectly(data, reportReference, modelService) {
    try {
        console.log("[DEBUG] updateSettingsDirectly called for report");
        console.log("[DEBUG] reportReference before update:", JSON.stringify(reportReference, null, 2));
        
        // Extract property information from the data
        const { property, exists, value } = data;
        console.log("[DEBUG] updateSettingsDirectly received:", property, value, typeof value);
        
        if (property) {
            if (exists) {
                // Add or update the property
                reportReference[property] = value;
            } else {
                // Remove the property
                delete reportReference[property];
            }
            
            console.log("[DEBUG] reportReference after update:", JSON.stringify(reportReference, null, 2));
            
            // Mark that there are unsaved changes
            if (modelService && typeof modelService.markUnsavedChanges === 'function') {
                modelService.markUnsavedChanges();
                console.log("[DEBUG] Model marked as having unsaved changes after settings update");
            } else {
                console.warn("[DEBUG] modelService.markUnsavedChanges is not available");
            }
            
            vscode.commands.executeCommand("appdna.refresh");
        }
    } catch (error) {
        console.error("Error updating settings directly:", error);
    }
}

// Export the functions
module.exports = {
    showReportDetails,
    refreshAll,
    getOpenPanelItems,
    closeAllPanels
};

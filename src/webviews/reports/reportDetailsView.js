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
        `Details for ${item.label} Report`,
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
                    
                case "updateButton":
                    if (modelService && reportReference) {
                        // Update button properties directly on the report
                        updateButtonDirectly(message.data, reportReference, modelService);
                    } else {
                        console.warn("Cannot update button: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "updateColumn":
                    if (modelService && reportReference) {
                        // Update column properties directly on the report
                        updateColumnDirectly(message.data, reportReference, modelService);
                    } else {
                        console.warn("Cannot update column: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "updateParam":
                    if (modelService && reportReference) {
                        // Update param properties directly on the report
                        updateParamDirectly(message.data, reportReference, modelService);
                    } else {
                        console.warn("Cannot update param: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "moveColumn":
                    if (modelService && reportReference) {
                        // Move column in the array
                        moveColumnInArray(message.data, reportReference, modelService);
                    } else {
                        console.warn("Cannot move column: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "moveButton":
                    if (modelService && reportReference) {
                        // Move button in the array
                        moveButtonInArray(message.data, reportReference, modelService);
                    } else {
                        console.warn("Cannot move button: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "moveParam":
                    if (modelService && reportReference) {
                        // Move param in the array
                        moveParamInArray(message.data, reportReference, modelService);
                    } else {
                        console.warn("Cannot move param: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "reverseColumn":
                    if (modelService && reportReference) {
                        // Reverse column array
                        reverseColumnArray(reportReference, modelService);
                    } else {
                        console.warn("Cannot reverse columns: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "reverseButton":
                    if (modelService && reportReference) {
                        // Reverse button array
                        reverseButtonArray(reportReference, modelService);
                    } else {
                        console.warn("Cannot reverse buttons: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "reverseParam":
                    if (modelService && reportReference) {
                        // Reverse param array
                        reverseParamArray(reportReference, modelService);
                    } else {
                        console.warn("Cannot reverse params: ModelService not available or report reference not found");
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

/**
 * Updates button properties directly in the model
 * @param {Object} data Data containing index, property, exists, and value
 * @param {Object} reportReference Direct reference to the report object
 * @param {Object} modelService Model service instance
 */
function updateButtonDirectly(data, reportReference, modelService) {
    try {
        console.log("[DEBUG] updateButtonDirectly called for report");
        console.log("[DEBUG] reportReference before update:", JSON.stringify(reportReference, null, 2));
        
        // Extract button information from the data
        const { index, property, exists, value } = data;
        console.log("[DEBUG] updateButtonDirectly received:", index, property, value, typeof value);
        
        if (typeof index === 'number' && property) {
            // Ensure reportButton array exists
            if (!reportReference.reportButton) {
                reportReference.reportButton = [];
            }
            
            // Ensure the button at the specified index exists
            if (!reportReference.reportButton[index]) {
                reportReference.reportButton[index] = {};
            }
            
            if (exists) {
                // Add or update the property
                reportReference.reportButton[index][property] = value;
            } else {
                // Remove the property
                delete reportReference.reportButton[index][property];
            }
            
            console.log("[DEBUG] reportReference after update:", JSON.stringify(reportReference, null, 2));
            
            // Mark that there are unsaved changes
            if (modelService && typeof modelService.markUnsavedChanges === 'function') {
                modelService.markUnsavedChanges();
                console.log("[DEBUG] Model marked as having unsaved changes after button update");
            } else {
                console.warn("[DEBUG] modelService.markUnsavedChanges is not available");
            }
            
            vscode.commands.executeCommand("appdna.refresh");
        }
    } catch (error) {
        console.error("Error updating button directly:", error);
    }
}

/**
 * Updates column properties directly in the model
 * @param {Object} data Data containing index, property, exists, and value
 * @param {Object} reportReference Direct reference to the report object
 * @param {Object} modelService Model service instance
 */
function updateColumnDirectly(data, reportReference, modelService) {
    try {
        console.log("[DEBUG] updateColumnDirectly called for report");
        console.log("[DEBUG] reportReference before update:", JSON.stringify(reportReference, null, 2));
        
        // Extract column information from the data
        const { index, property, exists, value } = data;
        console.log("[DEBUG] updateColumnDirectly received:", index, property, value, typeof value);
        
        if (typeof index === 'number' && property) {
            // Ensure reportColumn array exists
            if (!reportReference.reportColumn) {
                reportReference.reportColumn = [];
            }
            
            // Ensure the column at the specified index exists
            if (!reportReference.reportColumn[index]) {
                reportReference.reportColumn[index] = {};
            }
            
            if (exists) {
                // Add or update the property
                reportReference.reportColumn[index][property] = value;
            } else {
                // Remove the property
                delete reportReference.reportColumn[index][property];
            }
            
            console.log("[DEBUG] reportReference after update:", JSON.stringify(reportReference, null, 2));
            
            // Mark that there are unsaved changes
            if (modelService && typeof modelService.markUnsavedChanges === 'function') {
                modelService.markUnsavedChanges();
                console.log("[DEBUG] Model marked as having unsaved changes after column update");
            } else {
                console.warn("[DEBUG] modelService.markUnsavedChanges is not available");
            }
            
            vscode.commands.executeCommand("appdna.refresh");
        }
    } catch (error) {
        console.error("Error updating column directly:", error);
    }
}

/**
 * Updates parameter properties directly in the model
 * @param {Object} data Data containing index, property, exists, and value
 * @param {Object} reportReference Direct reference to the report object
 * @param {Object} modelService Model service instance
 */
function updateParamDirectly(data, reportReference, modelService) {
    try {
        if (reportReference) {
            console.log("[DEBUG] updateParamDirectly called for report");
            const { index, property, exists, value } = data;
            
            // Log what we're receiving
            console.log("[DEBUG] updateParamDirectly received:", index, property, value, typeof value);
            
            // Ensure reportParam array exists
            if (!reportReference.reportParam) {
                reportReference.reportParam = [];
            }
            
            // Ensure the param at the index exists
            if (index >= 0 && index < reportReference.reportParam.length) {
                const param = reportReference.reportParam[index];
                
                if (exists) {
                    // Set or update the property
                    param[property] = value;
                    console.log(`[DEBUG] Set param[${index}].${property} = ${value}`);
                } else {
                    // Remove the property
                    delete param[property];
                    console.log(`[DEBUG] Removed param[${index}].${property}`);
                }
                
                console.log(`[DEBUG] Param after update:`, param);
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
        console.error("Error updating param directly:", error);
    }
}

/**
 * Moves a column in the reportColumn array
 * @param {Object} data Data containing fromIndex and toIndex
 * @param {Object} reportReference Direct reference to the report object
 * @param {Object} modelService Model service instance
 */
function moveColumnInArray(data, reportReference, modelService) {
    try {
        console.log("[DEBUG] moveColumnInArray called");
        
        const { fromIndex, toIndex } = data;
        console.log("[DEBUG] Moving column from index", fromIndex, "to index", toIndex);
        
        if (!reportReference.reportColumn || !Array.isArray(reportReference.reportColumn)) {
            console.warn("[DEBUG] reportColumn array does not exist");
            return;
        }
        
        const array = reportReference.reportColumn;
        
        // Validate indices
        if (fromIndex < 0 || fromIndex >= array.length || toIndex < 0 || toIndex >= array.length) {
            console.warn("[DEBUG] Invalid indices for move operation");
            return;
        }
        
        // Move the item
        const itemToMove = array.splice(fromIndex, 1)[0];
        array.splice(toIndex, 0, itemToMove);
        
        console.log("[DEBUG] Column moved successfully");
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
            console.log("[DEBUG] Marked unsaved changes after column move");
        }
        
        // Refresh the view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error moving column:", error);
    }
}

/**
 * Moves a button in the reportButton array
 * @param {Object} data Data containing fromIndex and toIndex
 * @param {Object} reportReference Direct reference to the report object
 * @param {Object} modelService Model service instance
 */
function moveButtonInArray(data, reportReference, modelService) {
    try {
        console.log("[DEBUG] moveButtonInArray called");
        
        const { fromIndex, toIndex } = data;
        console.log("[DEBUG] Moving button from index", fromIndex, "to index", toIndex);
        
        if (!reportReference.reportButton || !Array.isArray(reportReference.reportButton)) {
            console.warn("[DEBUG] reportButton array does not exist");
            return;
        }
        
        const array = reportReference.reportButton;
        
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
        
        // Refresh the view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error moving button:", error);
    }
}

/**
 * Moves a parameter in the reportParam array
 * @param {Object} data Data containing fromIndex and toIndex
 * @param {Object} reportReference Direct reference to the report object
 * @param {Object} modelService Model service instance
 */
function moveParamInArray(data, reportReference, modelService) {
    try {
        console.log("[DEBUG] moveParamInArray called");
        
        const { fromIndex, toIndex } = data;
        console.log("[DEBUG] Moving param from index", fromIndex, "to index", toIndex);
        
        if (!reportReference.reportParam || !Array.isArray(reportReference.reportParam)) {
            console.warn("[DEBUG] reportParam array does not exist");
            return;
        }
        
        const array = reportReference.reportParam;
        
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
        
        // Refresh the view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error moving param:", error);
    }
}

/**
 * Reverses the reportColumn array
 * @param {Object} reportReference Direct reference to the report object
 * @param {Object} modelService Model service instance
 */
function reverseColumnArray(reportReference, modelService) {
    try {
        console.log("[DEBUG] reverseColumnArray called");
        
        if (!reportReference.reportColumn || !Array.isArray(reportReference.reportColumn)) {
            console.warn("[DEBUG] reportColumn array does not exist");
            return;
        }
        
        const array = reportReference.reportColumn;
        
        if (array.length <= 1) {
            console.log("[DEBUG] Array has 1 or fewer items, nothing to reverse");
            return;
        }
        
        // Reverse the array
        array.reverse();
        
        console.log("[DEBUG] Column array reversed successfully");
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
            console.log("[DEBUG] Marked unsaved changes after column reverse");
        }
        
        // Refresh the view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error reversing column array:", error);
    }
}

/**
 * Reverses the reportButton array
 * @param {Object} reportReference Direct reference to the report object
 * @param {Object} modelService Model service instance
 */
function reverseButtonArray(reportReference, modelService) {
    try {
        console.log("[DEBUG] reverseButtonArray called");
        
        if (!reportReference.reportButton || !Array.isArray(reportReference.reportButton)) {
            console.warn("[DEBUG] reportButton array does not exist");
            return;
        }
        
        const array = reportReference.reportButton;
        
        if (array.length <= 1) {
            console.log("[DEBUG] Array has 1 or fewer items, nothing to reverse");
            return;
        }
        
        // Reverse the array
        array.reverse();
        
        console.log("[DEBUG] Button array reversed successfully");
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
            console.log("[DEBUG] Marked unsaved changes after button reverse");
        }
        
        // Refresh the view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error reversing button array:", error);
    }
}

/**
 * Reverses the reportParam array
 * @param {Object} reportReference Direct reference to the report object
 * @param {Object} modelService Model service instance
 */
function reverseParamArray(reportReference, modelService) {
    try {
        console.log("[DEBUG] reverseParamArray called");
        
        if (!reportReference.reportParam || !Array.isArray(reportReference.reportParam)) {
            console.warn("[DEBUG] reportParam array does not exist");
            return;
        }
        
        const array = reportReference.reportParam;
        
        if (array.length <= 1) {
            console.log("[DEBUG] Array has 1 or fewer items, nothing to reverse");
            return;
        }
        
        // Reverse the array
        array.reverse();
        
        console.log("[DEBUG] Param array reversed successfully");
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
            console.log("[DEBUG] Marked unsaved changes after param reverse");
        }
        
        // Refresh the view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error reversing param array:", error);
    }
}

// Export the functions
module.exports = {
    showReportDetails,
    refreshAll,
    getOpenPanelItems,
    closeAllPanels
};

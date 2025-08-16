"use strict";
const vscode = require("vscode");
const path = require("path");
const { loadSchema, getReportSchemaProperties, getReportColumnsSchema, getReportButtonsSchema, getReportParamsSchema } = require("./helpers/schemaLoader");
const { formatLabel } = require("./helpers/reportDataHelper");
const { generateDetailsView } = require("./components/detailsViewGenerator");

// Track current panels to avoid duplicates
const activePanels = new Map();

// Registry to track all open report details panels
const openPanels = new Map();

// Store context for later use
let currentContext = undefined;

/**
 * Opens a webview panel displaying details for a report
 * @param {Object} item The tree item representing the report
 * @param {Object} modelService The ModelService instance
 * @param {vscode.ExtensionContext} context Extension context (optional, uses stored context if not provided)
 */
function showReportDetails(item, modelService, context) {
    // Store context for later use if provided
    if (context) {
        currentContext = context;
    }
    
    // Use provided context or fallback to stored context
    const extensionContext = context || currentContext;
    
    if (!extensionContext) {
        console.error('Extension context not available for report details view');
        vscode.window.showErrorMessage('Extension context not available. Please try again.');
        return;
    }
    
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
    
    // Generate codicon URI for the webview
    const codiconsUri = panel.webview.asWebviewUri(
        vscode.Uri.file(path.join(extensionContext.extensionPath, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css'))
    );
    
    // Set the HTML content with the full report data
    panel.webview.html = generateDetailsView(
        reportData, 
        reportSchemaProps, 
        reportColumnsSchema, 
        reportButtonsSchema, 
        reportParamsSchema,
        codiconsUri
    );
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {                case "updateModel":
                    if (modelService && reportReference) {
                        // Directly update the model instance and reload the webview
                        updateModelDirectly(message.data, reportReference, modelService, panel);
                    } else {
                        console.warn("Cannot update model directly: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "addColumn":
                    if (modelService && reportReference) {
                        // Add a new column to the report
                        addColumnToReport(reportReference, modelService, panel);
                    } else {
                        console.warn("Cannot add column: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "addColumnWithName":
                    if (modelService && reportReference) {
                        // Add a new column to the report with specified name
                        addColumnToReportWithName(reportReference, modelService, message.data.name, panel);
                    } else {
                        console.warn("Cannot add column with name: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "addButton":
                    if (modelService && reportReference) {
                        // Add a new button to the report
                        addButtonToReport(reportReference, modelService, panel);
                    } else {
                        console.warn("Cannot add button: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "addButtonWithName":
                    if (modelService && reportReference) {
                        // Add a new button to the report with specified name
                        addButtonToReportWithName(reportReference, modelService, message.data.name, panel);
                    } else {
                        console.warn("Cannot add button with name: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "addParam":
                    if (modelService && reportReference) {
                        // Add a new param to the report
                        addParamToReport(reportReference, modelService, panel);
                    } else {
                        console.warn("Cannot add param: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "addParamWithName":
                    if (modelService && reportReference) {
                        // Add a new param to the report with specified name
                        addParamToReportWithName(reportReference, modelService, message.data.name, panel);
                    } else {
                        console.warn("Cannot add param with name: ModelService not available or report reference not found");
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
                        moveColumnInArray(message.data, reportReference, modelService, panel);
                    } else {
                        console.warn("Cannot move column: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "moveButton":
                    if (modelService && reportReference) {
                        // Move button in the array
                        moveButtonInArray(message.data, reportReference, modelService, panel);
                    } else {
                        console.warn("Cannot move button: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "moveParam":
                    if (modelService && reportReference) {
                        // Move param in the array
                        moveParamInArray(message.data, reportReference, modelService, panel);
                    } else {
                        console.warn("Cannot move param: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "reverseColumn":
                    if (modelService && reportReference) {
                        // Reverse column array
                        reverseColumnArray(reportReference, modelService, panel);
                    } else {
                        console.warn("Cannot reverse columns: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "reverseButton":
                    if (modelService && reportReference) {
                        // Reverse button array
                        reverseButtonArray(reportReference, modelService, panel);
                    } else {
                        console.warn("Cannot reverse buttons: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "reverseParam":
                    if (modelService && reportReference) {
                        // Reverse param array
                        reverseParamArray(reportReference, modelService, panel);
                    } else {
                        console.warn("Cannot reverse params: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "openPagePreview":
                    console.log('[DEBUG] ReportDetails - Open page preview requested for report name:', JSON.stringify(message.formName));
                    console.log('[DEBUG] ReportDetails - Message object:', JSON.stringify(message));
                    // Use VS Code command to open page preview instead of calling directly
                    try {
                        // Execute the page preview command which handles context properly
                        vscode.commands.executeCommand('appdna.showPagePreview').then(() => {
                            // Wait a brief moment for the page preview to open, then select the report
                            setTimeout(() => {
                                try {
                                    const { getPagePreviewPanel } = require("../pagepreview/pagePreviewView");
                                    const pagePreviewResult = getPagePreviewPanel();
                                    const pagePreviewPanel = pagePreviewResult ? pagePreviewResult.panel : null;
                                    
                                    if (pagePreviewPanel && pagePreviewPanel.webview && message.formName) {
                                        console.log('[DEBUG] ReportDetails - Sending select page message to opened page preview for:', JSON.stringify(message.formName));
                                        pagePreviewPanel.webview.postMessage({
                                            command: 'selectPageAndShowPreview',
                                            data: { pageName: message.formName }
                                        });
                                    } else {
                                        console.warn('[WARN] ReportDetails - Page preview panel not available after opening');
                                        console.log('[DEBUG] ReportDetails - Panel result:', !!pagePreviewResult);
                                        console.log('[DEBUG] ReportDetails - Panel exists:', !!pagePreviewPanel);
                                        console.log('[DEBUG] ReportDetails - Panel webview exists:', !!(pagePreviewPanel && pagePreviewPanel.webview));
                                        console.log('[DEBUG] ReportDetails - Report name provided:', !!message.formName);
                                    }
                                } catch (error) {
                                    console.error('[ERROR] ReportDetails - Failed to select report in page preview:', error);
                                }
                            }, 1000); // Wait 1 second for page preview to fully load
                        }).catch((error) => {
                            console.error('[ERROR] ReportDetails - Failed to open page preview via command:', error);
                            vscode.window.showErrorMessage(`Failed to open page preview: ${error.message}`);
                        });
                        
                    } catch (error) {
                        console.error('[ERROR] ReportDetails - Failed to execute page preview command:', error);
                        vscode.window.showErrorMessage(`Failed to open page preview: ${error.message}`);
                    }
                    return;
                    
                case "showPageListView":
                    console.log('[DEBUG] ReportDetails - Show page list view requested');
                    try {
                        // Use VS Code command to open page list view
                        vscode.commands.executeCommand('appdna.pageList', message.data).then(() => {
                            console.log('[DEBUG] ReportDetails - Page list view opened successfully');
                        }).catch((error) => {
                            console.error('[ERROR] ReportDetails - Failed to open page list view via command:', error);
                            vscode.window.showErrorMessage(`Failed to open page list view: ${error.message}`);
                        });
                    } catch (error) {
                        console.error('[ERROR] ReportDetails - Failed to execute page list view command:', error);
                        vscode.window.showErrorMessage(`Failed to open page list view: ${error.message}`);
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
            
            // Generate codicon URI for the webview (use stored context)
            const extensionContext = currentContext;
            let codiconsUri = '';
            if (extensionContext) {
                codiconsUri = panel.webview.asWebviewUri(
                    vscode.Uri.file(path.join(extensionContext.extensionPath, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css'))
                );
            }
            
            // Update the HTML content
            panel.webview.html = generateDetailsView(
                reportData, 
                reportSchemaProps, 
                reportColumnsSchema, 
                reportButtonsSchema, 
                reportParamsSchema,
                codiconsUri
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
 * Updates report data directly in the ModelService instance and reloads the webview
 * @param {Object} data The data to update
 * @param {Object} reportReference Direct reference to the report in the model
 * @param {Object} modelService The ModelService instance
 * @param {Object} panel The webview panel to reload (optional)
 */
function updateModelDirectly(data, reportReference, modelService, panel = null) {
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
          // Reload the webview with updated model data
        if (panel && !panel._disposed) {
            console.log("[DEBUG] Reloading webview with updated model data");
            
            // Get schema for regenerating the HTML
            const schema = loadSchema();
            const reportSchemaProps = getReportSchemaProperties(schema);
            const reportColumnsSchema = getReportColumnsSchema(schema);
            const reportButtonsSchema = getReportButtonsSchema(schema);
            const reportParamsSchema = getReportParamsSchema(schema);
            
            // Generate codicon URI for the webview (use stored context)
            const extensionContext = currentContext;
            let codiconsUri = '';
            if (extensionContext) {
                codiconsUri = panel.webview.asWebviewUri(
                    vscode.Uri.file(path.join(extensionContext.extensionPath, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css'))
                );
            }
              // Regenerate and update the webview HTML with updated model data
            panel.webview.html = generateDetailsView(
                reportReference, 
                reportSchemaProps, 
                reportColumnsSchema, 
                reportButtonsSchema, 
                reportParamsSchema,
                codiconsUri
            );
            
            // If preserveTab was specified, restore the active tab
            // We use a small delay to ensure the webview DOM is fully updated
            if (data.preserveTab) {
                console.log("[DEBUG] Preserving tab:", data.preserveTab);
                // Alternative: Use setImmediate or just send immediately and let client handle timing
                panel.webview.postMessage({
                    command: 'restoreTab',
                    tabId: data.preserveTab,
                    newColumnIndex: data.newColumnIndex  // Pass the new column index for selection
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
 * @param {Object} panel The webview panel to refresh
 */
function moveColumnInArray(data, reportReference, modelService, panel) {
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
        
        // Send message to webview to refresh the columns list
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'refreshColumnsList',
                data: reportReference.reportColumn
            });
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
 * @param {Object} panel The webview panel to refresh
 */
function moveButtonInArray(data, reportReference, modelService, panel) {
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
        
        // Send message to webview to refresh the buttons list
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'refreshButtonsList',
                data: reportReference.reportButton
            });
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
 * @param {Object} panel The webview panel to refresh
 */
function moveParamInArray(data, reportReference, modelService, panel) {
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
        
        // Send message to webview to refresh the params list
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'refreshParamsList',
                data: reportReference.reportParam
            });
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
 * @param {Object} panel The webview panel to refresh
 */
function reverseColumnArray(reportReference, modelService, panel) {
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
        
        // Send message to webview to refresh the columns list
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'refreshColumnsList',
                data: reportReference.reportColumn
            });
        }
        
        // Refresh only the tree view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error reversing column array:", error);
    }
}

/**
 * Reverses the reportButton array
 * @param {Object} reportReference Direct reference to the report object
 * @param {Object} modelService Model service instance
 * @param {Object} panel The webview panel to refresh
 */
function reverseButtonArray(reportReference, modelService, panel) {
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
        
        // Send message to webview to refresh the buttons list
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'refreshButtonsList',
                data: reportReference.reportButton
            });
        }
        
        // Refresh only the tree view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error reversing button array:", error);
    }
}

/**
 * Reverses the reportParam array
 * @param {Object} reportReference Direct reference to the report object
 * @param {Object} modelService Model service instance
 * @param {Object} panel The webview panel to refresh
 */
function reverseParamArray(reportReference, modelService, panel) {
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
        
        // Send message to webview to refresh the params list
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'refreshParamsList',
                data: reportReference.reportParam
            });
        }
        
        // Refresh only the tree view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error reversing param array:", error);
    }
}

/**
 * Adds a new column to the report
 * @param {Object} reportReference Reference to the report object
 * @param {Object} modelService ModelService instance
 * @param {Object} panel The webview panel for sending refresh messages
 */
function addColumnToReport(reportReference, modelService, panel) {
    console.log("addColumnToReport called");
    
    if (!reportReference || !modelService) {
        console.error("Missing required data to add column");
        return;
    }
    
    try {
        // Initialize the columns array if it doesn't exist
        if (!reportReference.reportColumn) {
            reportReference.reportColumn = [];
        }
        
        // Create a new column with a default name
        const newColumn = {
            name: `NewColumn${reportReference.reportColumn.length + 1}`,
            isButton: 'false'
        };
        
        // Add the new column to the array
        reportReference.reportColumn.push(newColumn);
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Send message to webview to refresh the columns list and select the new column
        if (panel && panel.webview) {
            const newColumnIndex = reportReference.reportColumn.length - 1; // New column is the last one
            panel.webview.postMessage({
                command: 'refreshColumnsList',
                data: reportReference.reportColumn,
                newSelection: newColumnIndex
            });
        }
        
        // Refresh the tree view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error adding column:", error);
    }
}

/**
 * Adds a new column to the report with user-specified name
 * @param {Object} reportReference Reference to the report object
 * @param {Object} modelService ModelService instance
 * @param {string} columnName Name for the new column
 * @param {Object} panel The webview panel for sending refresh messages
 */
function addColumnToReportWithName(reportReference, modelService, columnName, panel) {
    console.log("addColumnToReportWithName called with name:", columnName);
    
    if (!reportReference || !modelService || !columnName) {
        console.error("Missing required data to add column with name");
        return;
    }
    
    try {
        // Initialize the columns array if it doesn't exist
        if (!reportReference.reportColumn) {
            reportReference.reportColumn = [];
        }
        
        // Create a new column with the specified name
        const newColumn = {
            name: columnName,
            isButton: 'false'
        };
        
        // Add the new column to the array
        reportReference.reportColumn.push(newColumn);
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Send message to webview to refresh the columns list and select the new column
        if (panel && panel.webview) {
            const newColumnIndex = reportReference.reportColumn.length - 1; // New column is the last one
            panel.webview.postMessage({
                command: 'refreshColumnsList',
                data: reportReference.reportColumn,
                newSelection: newColumnIndex
            });
        }
        
        // Refresh the tree view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error adding column with name:", error);
    }
}

/**
 * Adds a new button to the report
 * @param {Object} reportReference Reference to the report object
 * @param {Object} modelService ModelService instance
 * @param {Object} panel The webview panel for sending refresh messages
 */
function addButtonToReport(reportReference, modelService, panel) {
    console.log("addButtonToReport called");
    
    if (!reportReference || !modelService) {
        console.error("Missing required data to add button");
        return;
    }
    
    try {
        // Initialize the buttons array if it doesn't exist
        if (!reportReference.reportButton) {
            reportReference.reportButton = [];
        }
        
        // Create a new button with a default name
        const newButton = {
            buttonName: `NewButton${reportReference.reportButton.length + 1}`,
            buttonText: `New Button ${reportReference.reportButton.length + 1}`,
            buttonType: 'other'
        };
        
        // Add the new button to the array
        reportReference.reportButton.push(newButton);
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Send message to webview to refresh the buttons list and select the new button
        if (panel && panel.webview) {
            const newButtonIndex = reportReference.reportButton.length - 1; // New button is the last one
            panel.webview.postMessage({
                command: 'refreshButtonsList',
                data: reportReference.reportButton,
                newSelection: newButtonIndex
            });
        }
        
        // Refresh the tree view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error adding button:", error);
    }
}

/**
 * Adds a new button to the report with user-specified name
 * @param {Object} reportReference Reference to the report object
 * @param {Object} modelService ModelService instance
 * @param {string} buttonName Name for the new button
 * @param {Object} panel The webview panel for sending refresh messages
 */
function addButtonToReportWithName(reportReference, modelService, buttonName, panel) {
    console.log("addButtonToReportWithName called with name:", buttonName);
    
    if (!reportReference || !modelService || !buttonName) {
        console.error("Missing required data to add button with name");
        return;
    }
    
    try {
        // Initialize the buttons array if it doesn't exist
        if (!reportReference.reportButton) {
            reportReference.reportButton = [];
        }
        
        // Create a new button with the specified name
        const newButton = {
            buttonName: buttonName,
            buttonText: buttonName,
            buttonType: 'other'
        };
        
        // Add the new button to the array
        reportReference.reportButton.push(newButton);
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Send message to webview to refresh the buttons list and select the new button
        if (panel && panel.webview) {
            const newButtonIndex = reportReference.reportButton.length - 1; // New button is the last one
            panel.webview.postMessage({
                command: 'refreshButtonsList',
                data: reportReference.reportButton,
                newSelection: newButtonIndex
            });
        }
        
        // Refresh the tree view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error adding button with name:", error);
    }
}

/**
 * Adds a new param to the report
 * @param {Object} reportReference Reference to the report object
 * @param {Object} modelService ModelService instance
 * @param {Object} panel The webview panel for sending refresh messages
 */
function addParamToReport(reportReference, modelService, panel) {
    console.log("addParamToReport called");
    
    if (!reportReference || !modelService) {
        console.error("Missing required data to add param");
        return;
    }
    
    try {
        // Initialize the params array if it doesn't exist
        if (!reportReference.reportParam) {
            reportReference.reportParam = [];
        }
        
        // Create a new param with a default name
        const newParam = {
            name: `NewFilter${reportReference.reportParam.length + 1}`
        };
        
        // Add the new param to the array
        reportReference.reportParam.push(newParam);
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Send message to webview to refresh the params list and select the new param
        if (panel && panel.webview) {
            const newParamIndex = reportReference.reportParam.length - 1; // New param is the last one
            panel.webview.postMessage({
                command: 'refreshParamsList',
                data: reportReference.reportParam,
                newSelection: newParamIndex
            });
        }
        
        // Refresh the tree view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error adding param:", error);
    }
}

/**
 * Adds a new param to the report with user-specified name
 * @param {Object} reportReference Reference to the report object
 * @param {Object} modelService ModelService instance
 * @param {string} paramName Name for the new param
 * @param {Object} panel The webview panel for sending refresh messages
 */
function addParamToReportWithName(reportReference, modelService, paramName, panel) {
    console.log("addParamToReportWithName called with name:", paramName);
    
    if (!reportReference || !modelService || !paramName) {
        console.error("Missing required data to add param with name");
        return;
    }
    
    try {
        // Initialize the params array if it doesn't exist
        if (!reportReference.reportParam) {
            reportReference.reportParam = [];
        }
        
        // Create a new param with the specified name
        const newParam = {
            name: paramName
        };
        
        // Add the new param to the array
        reportReference.reportParam.push(newParam);
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Send message to webview to refresh the params list and select the new param
        if (panel && panel.webview) {
            const newParamIndex = reportReference.reportParam.length - 1; // New param is the last one
            panel.webview.postMessage({
                command: 'refreshParamsList',
                data: reportReference.reportParam,
                newSelection: newParamIndex
            });
        }
        
        // Refresh the tree view
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error adding param with name:", error);
    }
}

// Export the functions
module.exports = {
    showReportDetails,
    refreshAll,
    getOpenPanelItems,
    closeAllPanels
};

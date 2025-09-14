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
    
    // Get forms, reports, and data objects for search modals
    let allForms = [];
    let allReports = [];
    let allDataObjects = [];
    if (modelService && typeof modelService.getAllForms === "function" && typeof modelService.getAllReports === "function") {
        allForms = modelService.getAllForms();
        allReports = modelService.getAllReports();
    }
    if (modelService && typeof modelService.getAllObjects === "function") {
        allDataObjects = modelService.getAllObjects();
    }
    
    // Get the owner object information for this report
    let ownerObject = null;
    if (modelService && typeof modelService.getReportOwnerObject === "function") {
        ownerObject = modelService.getReportOwnerObject(reportData.name || item.label);
    }
    
    // Set the HTML content with the full report data
    panel.webview.html = generateDetailsView(
        reportData, 
        reportSchemaProps, 
        reportColumnsSchema, 
        reportButtonsSchema, 
        reportParamsSchema,
        codiconsUri,
        allForms,
        allReports,
        allDataObjects,
        ownerObject
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
                    
                case "addPropertyColumn":
                    if (modelService && reportReference) {
                        // Add a new column based on a data object property
                        addPropertyColumnToReport(reportReference, modelService, message.data, panel);
                    } else {
                        console.warn("Cannot add property column: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "getAvailableProperties":
                    if (modelService && reportReference) {
                        // Get available data object properties for the report
                        getAvailablePropertiesForReport(reportReference, modelService, panel);
                    } else {
                        console.warn("Cannot get available properties: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "addDestinationButtonColumn":
                    if (modelService && reportReference) {
                        // Add a new destination button column to the report
                        addDestinationButtonColumnToReport(reportReference, modelService, message.data, panel);
                    } else {
                        console.warn("Cannot add destination button column: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "addGeneralFlowButtonColumn":
                    if (modelService && reportReference) {
                        // Add a new general flow button column to the report
                        addGeneralFlowButtonColumnToReport(reportReference, modelService, message.data, panel);
                    } else {
                        console.warn("Cannot add general flow button column: ModelService not available or report reference not found");
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
                    
                case "addBreadcrumb":
                    if (modelService && reportReference) {
                        // Add a new breadcrumb button to the report
                        addBreadcrumbToReport(reportReference, modelService, message.data.pageName, panel);
                    } else {
                        console.warn("Cannot add breadcrumb: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "validateMultiSelectButton":
                    if (modelService && reportReference) {
                        // Validate the multi-select button and flow names
                        validateMultiSelectButtonNames(reportReference, modelService, message.data.buttonText, panel);
                    } else {
                        console.warn("Cannot validate multi-select button: ModelService not available or report reference not found");
                        // Send error back to webview
                        panel.webview.postMessage({
                            command: 'multiSelectButtonValidationResult',
                            data: { 
                                valid: false, 
                                error: "ModelService not available" 
                            }
                        });
                    }
                    return;
                    
                case "addMultiSelectButton":
                    if (modelService && reportReference) {
                        // Add a new multi-select button to the report
                        addMultiSelectButtonToReport(reportReference, modelService, message.data.buttonText, panel);
                    } else {
                        console.warn("Cannot add multi-select button: ModelService not available or report reference not found");
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
                    
                case "getOwnerSubscriptionState":
                    if (modelService && reportReference) {
                        // Get current owner subscription state
                        getOwnerSubscriptionState(reportReference, modelService, panel);
                    } else {
                        console.warn("Cannot get owner subscription state: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "updateOwnerSubscription":
                    if (modelService && reportReference) {
                        // Update owner subscription in propSubscription array
                        updateOwnerSubscription(message.data, reportReference, modelService, panel);
                    } else {
                        console.warn("Cannot update owner subscription: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "getTargetChildSubscriptionState":
                    if (modelService && reportReference) {
                        // Get current target child subscription state
                        getTargetChildSubscriptionState(reportReference, modelService, panel);
                    } else {
                        console.warn("Cannot get target child subscription state: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "updateTargetChildSubscription":
                    if (modelService && reportReference) {
                        // Update target child subscription in propSubscription array
                        updateTargetChildSubscription(message.data, reportReference, modelService, panel);
                    } else {
                        console.warn("Cannot update target child subscription: ModelService not available or report reference not found");
                    }
                    return;
                    
                case "openOwnerObjectDetails":
                    if (modelService && message.objectName) {
                        try {
                            // Create a mock tree item for the owner object
                            const ownerItem = {
                                label: message.objectName,
                                contextValue: 'object',
                                tooltip: `${message.objectName} Data Object`
                            };
                            
                            // Import and call the object details view
                            const { showObjectDetails } = require("../objects/objectDetailsView");
                            showObjectDetails(ownerItem, modelService, currentContext, 'settings');
                        } catch (error) {
                            console.error('[ERROR] ReportDetails - Failed to open owner object details:', error);
                            vscode.window.showErrorMessage(`Failed to open object details: ${error.message}`);
                        }
                    } else {
                        console.warn("Cannot open owner object details: ModelService not available or object name not provided");
                    }
                    return;
                    
                case "openPageInitFlowDetails":
                    if (modelService && message.flowName) {
                        try {
                            // Create a mock tree item for the page init flow
                            const flowItem = {
                                label: message.flowName,
                                contextValue: 'pageInit',
                                tooltip: `${message.flowName} Page Init Flow`
                            };
                            
                            // Import and call the page init details view
                            const { showPageInitDetails } = require("../pageinits/pageInitDetailsView");
                            showPageInitDetails(flowItem, modelService, extensionContext);
                        } catch (error) {
                            console.error('[ERROR] ReportDetails - Failed to open page init flow details:', error);
                            vscode.window.showErrorMessage(`Failed to open page init flow details: ${error.message}`);
                        }
                    } else {
                        console.warn("Cannot open page init flow details: ModelService not available or flow name not provided");
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
                    
                case "getGeneralFlowsForModal":
                    console.log('[DEBUG] ReportDetails - Getting general flows for modal');
                    if (modelService && typeof modelService.isFileLoaded === "function" && modelService.isFileLoaded()) {
                        // Get general flows using the same logic as tree view (jsonTreeDataProvider.ts)
                        const allObjects = modelService.getAllObjects();
                        let generalFlows = [];
                        
                        if (allObjects && allObjects.length > 0) {
                            for (const obj of allObjects) {
                                if (obj.objectWorkflow) {
                                    for (const workflow of obj.objectWorkflow) {
                                        if (workflow.name) {
                                            const workflowName = workflow.name.toLowerCase();
                                            
                                            // Check all criteria (matching tree view logic exactly):
                                            // 1. isDynaFlow property does not exist or is false
                                            const isDynaFlowOk = !workflow.isDynaFlow || workflow.isDynaFlow === "false";
                                            
                                            // 2. isDynaFlowTask property does not exist or is false  
                                            const isDynaFlowTaskOk = !workflow.isDynaFlowTask || workflow.isDynaFlowTask === "false";
                                            
                                            // 3. isPage property is false (matching tree view property check)
                                            const isPageOk = workflow.isPage === "false";
                                            
                                            // 4. name does not end with initobjwf (matching tree view endsWith check)
                                            const notInitObjWf = !workflowName.endsWith('initobjwf');
                                            
                                            // 5. name does not end with initreport (matching tree view endsWith check)
                                            const notInitReport = !workflowName.endsWith('initreport');
                                            
                                            if (isDynaFlowOk && isDynaFlowTaskOk && isPageOk && notInitObjWf && notInitReport) {
                                                const displayName = workflow.titleText || workflow.name;
                                                generalFlows.push({
                                                    name: workflow.name,
                                                    displayName: displayName,
                                                    objectName: obj.name || 'Unknown',
                                                    description: workflow.codeDescription || ''
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Sort by display name
                        generalFlows.sort((a, b) => a.displayName.localeCompare(b.displayName));
                        
                        console.log(`[DEBUG] ReportDetails - Found ${generalFlows.length} general flows`);
                        
                        // Send the general flows back to the webview
                        panel.webview.postMessage({
                            command: 'populateGeneralFlowsModal',
                            data: generalFlows
                        });
                    } else {
                        console.warn('Cannot get general flows: ModelService not available or file not loaded');
                        // Send empty array if no data available
                        panel.webview.postMessage({
                            command: 'populateGeneralFlowsModal',
                            data: []
                        });
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
            
            // Get forms, reports, and data objects for search modals
            const allForms = ModelService.getAllForms();
            const allReports = ModelService.getAllReports();
            const allDataObjects = ModelService.getAllObjects();
            
            // Get the owner object information for this report
            let ownerObject = null;
            if (modelService && typeof modelService.getReportOwnerObject === "function") {
                ownerObject = modelService.getReportOwnerObject(reportData.name || item.label);
            }
            
            // Update the HTML content
            panel.webview.html = generateDetailsView(
                reportData, 
                reportSchemaProps, 
                reportColumnsSchema, 
                reportButtonsSchema, 
                reportParamsSchema,
                codiconsUri,
                allForms,
                allReports,
                allDataObjects,
                ownerObject
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
            
            // Get forms, reports, and data objects for search modals
            const allForms = ModelService.getAllForms();
            const allReports = ModelService.getAllReports();
            const allDataObjects = ModelService.getAllObjects();
            
            // Get the owner object information for this report
            let ownerObject = null;
            if (modelService && typeof modelService.getReportOwnerObject === "function") {
                ownerObject = modelService.getReportOwnerObject(reportReference.name);
            }
            
              // Regenerate and update the webview HTML with updated model data
            panel.webview.html = generateDetailsView(
                reportReference, 
                reportSchemaProps, 
                reportColumnsSchema, 
                reportButtonsSchema, 
                reportParamsSchema,
                codiconsUri,
                allForms,
                allReports,
                allDataObjects,
                ownerObject
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

function addDestinationButtonColumnToReport(reportReference, modelService, data, panel) {
    console.log("addDestinationButtonColumnToReport called with data:", data);
    
    if (!reportReference || !modelService || !data || !data.name || !data.destinationPageName || !data.buttonText) {
        console.error("Missing required data to add destination button column");
        return;
    }
    
    try {
        // Initialize the columns array if it doesn't exist
        if (!reportReference.reportColumn) {
            reportReference.reportColumn = [];
        }
        
        // Determine sourceObjectName based on report's target child object or fallback to report owner
        const reportName = reportReference.name;
        const targetChildObject = modelService.getReportTargetChildObject(reportName);
        let sourceObjectName;
        
        if (targetChildObject && targetChildObject.name) {
            sourceObjectName = targetChildObject.name;
            console.log("Using target child object as sourceObjectName:", sourceObjectName);
        } else {
            // Fallback to report owner object name
            const reportOwnerObjectName = modelService.getReportOwnerObjectName(reportName);
            sourceObjectName = reportOwnerObjectName || "UnknownObject";
            console.log("Using report owner object as sourceObjectName:", sourceObjectName);
        }
        
        // Find the destination page to get its owner object name
        let destinationContextObjectName = data.destinationPageName; // Default fallback
        try {
            const destinationPageOwnerObjectName = modelService.getPageOwnerObjectName(data.destinationPageName);
            if (destinationPageOwnerObjectName) {
                destinationContextObjectName = destinationPageOwnerObjectName;
                console.log("Found destination page owner object:", destinationContextObjectName);
            }
        } catch (error) {
            console.warn("Could not determine destination page owner object, using page name as fallback:", error);
        }
        
        // Create a new destination button column with the required structure
        const newColumn = {
            name: data.name,
            buttonText: data.buttonText,
            destinationContextObjectName: destinationContextObjectName,
            destinationTargetName: data.destinationPageName,
            isButton: "true",
            isVisible: "true",
            sourceObjectName: destinationContextObjectName,
            sourcePropertyName: "Code",
            sqlServerDBDataType: "uniqueidentifier"
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
        console.error("Error adding destination button column:", error);
    }
}

function addGeneralFlowButtonColumnToReport(reportReference, modelService, data, panel) {
    console.log("addGeneralFlowButtonColumnToReport called with data:", data);
    
    if (!reportReference || !modelService || !data || !data.name || !data.generalFlowName || !data.buttonText) {
        console.error("Missing required data to add general flow button column");
        return;
    }
    
    try {
        // Initialize the columns array if it doesn't exist
        if (!reportReference.reportColumn) {
            reportReference.reportColumn = [];
        }
        
        // Determine sourceObjectName based on report's target child object or fallback to report owner
        const reportName = reportReference.name;
        const targetChildObject = modelService.getReportTargetChildObject(reportName);
        let sourceObjectName;
        
        if (targetChildObject && targetChildObject.name) {
            sourceObjectName = targetChildObject.name;
            console.log("Using target child object as sourceObjectName:", sourceObjectName);
        } else {
            // Fallback to report owner object name
            const reportOwnerObjectName = modelService.getReportOwnerObjectName(reportName);
            sourceObjectName = reportOwnerObjectName || "UnknownObject";
            console.log("Using report owner object as sourceObjectName:", sourceObjectName);
        }
        
        // Create a new general flow button column with the required structure
        const newColumn = {
            name: data.name,
            buttonText: data.buttonText,
            destinationTargetName: data.generalFlowName,
            destinationContextObjectName: data.generalFlowObjectName || "",
            isButton: "true",
            isButtonAsyncObjWF: "true",
            isVisible: "true",
            sourceObjectName: data.generalFlowObjectName,
            sourcePropertyName: "Code",
            sqlServerDBDataType: "uniqueidentifier"
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
        console.error("Error adding general flow button column:", error);
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
            buttonType: 'other',
            destinationContextObjectName: "",
            destinationTargetName: "",
            isVisible: "true",
            isEnabled: "true",
            isButtonCallToAction: "false"
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
            buttonType: 'other',
            destinationContextObjectName: "",
            destinationTargetName: "",
            isVisible: "true",
            isEnabled: "true",
            isButtonCallToAction: "false"
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
 * Adds a new breadcrumb button to the report
 * @param {Object} reportReference Reference to the report object
 * @param {Object} modelService ModelService instance
 * @param {string} pageName Name of the selected page for the breadcrumb
 * @param {Object} panel The webview panel for sending refresh messages
 */
function addBreadcrumbToReport(reportReference, modelService, pageName, panel) {
    console.log("addBreadcrumbToReport called with pageName:", pageName);
    
    if (!reportReference || !modelService || !pageName) {
        console.error("Missing required data to add breadcrumb");
        return;
    }
    
    try {
        // Initialize the buttons array if it doesn't exist
        if (!reportReference.reportButton) {
            reportReference.reportButton = [];
        }
        
        // Get the owner data object of the selected page
        console.log("DEBUG: About to call getPageOwnerObject with pageName:", pageName);
        const ownerObject = modelService.getPageOwnerObject(pageName);
        console.log("DEBUG: getPageOwnerObject returned:", ownerObject);
        const destinationContextObjectName = ownerObject ? ownerObject.name : '';
        console.log("DEBUG: destinationContextObjectName set to:", destinationContextObjectName);
        
        if (!ownerObject) {
            console.warn("WARNING: Could not find owner object for page:", pageName, "- breadcrumb will have empty destinationContextObjectName");
        }
        
        // Create a new breadcrumb button with the specified properties
        const newButton = {
            buttonName: `${pageName}Breadcrumb`,
            buttonType: 'breadcrumb',
            destinationTargetName: pageName,
            destinationContextObjectName: destinationContextObjectName,
            isVisible: "true",
            isEnabled: "true"
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
        console.error("Error adding breadcrumb:", error);
    }
}

/**
 * Validates that multi-select button name and flow name don't already exist
 * @param {Object} reportReference Reference to the report object
 * @param {Object} modelService ModelService instance
 * @param {string} buttonText Display text for the button
 * @param {Object} panel The webview panel for sending response messages
 */
function validateMultiSelectButtonNames(reportReference, modelService, buttonText, panel) {
    try {
        console.log("Validating multi-select button names for buttonText:", buttonText);
        
        if (!reportReference || !modelService || !buttonText) {
            panel.webview.postMessage({
                command: 'multiSelectButtonValidationResult',
                data: { 
                    valid: false, 
                    error: "Missing required data for validation" 
                }
            });
            return;
        }
        
        // Generate button name from text (Pascal case, remove spaces)
        const buttonName = buttonText.replace(/\s+/g, '');
        
        // Check if button with this name already exists in the report
        if (reportReference.reportButton && reportReference.reportButton.some(button => button.buttonName === buttonName)) {
            panel.webview.postMessage({
                command: 'multiSelectButtonValidationResult',
                data: { 
                    valid: false, 
                    error: "Button with this name already exists" 
                }
            });
            return;
        }
        
        // Get the report properties needed to construct the flow name
        const reportName = reportReference.name || 'UnknownReport';
        const destinationContextObjectName = modelService.getReportOwnerObjectName ? modelService.getReportOwnerObjectName(reportName) : '';
        const roleRequired = reportReference.roleRequired || '';
        const targetChildObject = reportReference.targetChildObject || '';
        
        // Construct the flow name: [OwnerObjectName][Role][TargetChildObjectName]MultiSelect[ButtonName]
        const flowName = (destinationContextObjectName || '') + (roleRequired || '') + (targetChildObject || '') + 'MultiSelect' + buttonName;
        
        // Check if a flow with this name already exists in the destination object
        if (destinationContextObjectName) {
            const allObjects = modelService.getAllObjects ? modelService.getAllObjects() : [];
            const targetObject = allObjects.find(obj => 
                obj.name && obj.name.trim().toLowerCase() === destinationContextObjectName.trim().toLowerCase()
            );
            
            if (targetObject && targetObject.objectWorkflow) {
                const existingFlow = targetObject.objectWorkflow.find(flow => 
                    flow.name && flow.name === flowName
                );
                
                if (existingFlow) {
                    panel.webview.postMessage({
                        command: 'multiSelectButtonValidationResult',
                        data: { 
                            valid: false, 
                            error: `General flow with name "${flowName}" already exists in object "${destinationContextObjectName}"` 
                        }
                    });
                    return;
                }
            }
        }
        
        // All validations passed - proceed to create the button
        panel.webview.postMessage({
            command: 'multiSelectButtonValidationResult',
            data: { 
                valid: true, 
                buttonText: buttonText 
            }
        });
        
    } catch (error) {
        console.error("Error validating multi-select button names:", error);
        panel.webview.postMessage({
            command: 'multiSelectButtonValidationResult',
            data: { 
                valid: false, 
                error: "Error during validation. Please try again." 
            }
        });
    }
}

/**
 * Creates a general flow (objectWorkflow) in the specified object for a multi-select button
 * @param {Object} modelService ModelService instance
 * @param {string} objectName Name of the object to add the flow to
 * @param {string} flowName Name of the flow to create
 * @param {string} roleRequired Role required for the flow
 */
function createGeneralFlowForMultiSelectButton(modelService, objectName, flowName, roleRequired) {
    try {
        console.log("Creating general flow:", { objectName, flowName, roleRequired });
        
        if (!modelService || !objectName || !flowName) {
            console.error("Missing required data to create general flow");
            return;
        }
        
        // Get all objects and find the target object
        const allObjects = modelService.getAllObjects ? modelService.getAllObjects() : [];
        const targetObject = allObjects.find(obj => 
            obj.name && obj.name.trim().toLowerCase() === objectName.trim().toLowerCase()
        );
        
        if (!targetObject) {
            console.error("Target object not found:", objectName);
            return;
        }
        
        // Initialize objectWorkflow array if it doesn't exist
        if (!targetObject.objectWorkflow) {
            targetObject.objectWorkflow = [];
        }
        
        // Check if flow with this name already exists
        const existingFlow = targetObject.objectWorkflow.find(flow => 
            flow.name && flow.name === flowName
        );
        
        if (existingFlow) {
            console.log("General flow already exists:", flowName);
            return;
        }
        
        // Create the new general flow
        const newFlow = {
            name: flowName,
            isPage: "false",
            roleRequired: roleRequired || "",
            objectWorkflowButton: []
        };
        
        // Add the flow to the object
        targetObject.objectWorkflow.push(newFlow);
        
        console.log("General flow created successfully:", flowName);
        
    } catch (error) {
        console.error("Error creating general flow:", error);
    }
}

/**
 * Adds a new multi-select button to the report
 * @param {Object} reportReference Reference to the report object
 * @param {Object} modelService ModelService instance
 * @param {string} buttonText Display text for the button
 * @param {Object} panel The webview panel for sending refresh messages
 */
function addMultiSelectButtonToReport(reportReference, modelService, buttonText, panel) {
    console.log("addMultiSelectButtonToReport called with buttonText:", buttonText);
    
    if (!reportReference || !modelService || !buttonText) {
        console.error("Missing required data to add multi-select button");
        return;
    }
    
    try {
        // Initialize the buttons array if it doesn't exist
        if (!reportReference.reportButton) {
            reportReference.reportButton = [];
        }
        
        // Generate a button name from the button text (Pascal case, remove spaces)
        const buttonName = buttonText.replace(/\s+/g, '');
        
        // Get the report name and required properties to construct destination target name
        const reportName = reportReference.name || 'UnknownReport';
        
        // Try to get the owner data object name of the report
        const destinationContextObjectName = modelService.getReportOwnerObjectName ? modelService.getReportOwnerObjectName(reportName) : '';
        
        // Get the role required and target child object from the report
        const roleRequired = reportReference.roleRequired || '';
        const targetChildObject = reportReference.targetChildObject || '';
        
        // Construct destinationTargetName: [OwnerObjectName][Role][TargetChildObjectName]MultiSelect[ButtonName]
        const destinationTargetName = (destinationContextObjectName || '') + (roleRequired || '') + (targetChildObject || '') + 'MultiSelect' + buttonName;
        
        // Create a new multi-select processing button with the specified properties
        const newButton = {
            buttonType: "multiSelectProcessing",
            buttonName: buttonName,
            buttonText: buttonText,
            destinationContextObjectName: destinationContextObjectName,
            destinationTargetName: destinationTargetName,
            isVisible: "true",
            isEnabled: "true"
        };
        
        // Add the new button to the array
        reportReference.reportButton.push(newButton);

        // Also create a general flow in the destination context object
        if (destinationContextObjectName) {
            createGeneralFlowForMultiSelectButton(modelService, destinationContextObjectName, destinationTargetName, roleRequired);
        }
        
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
        console.error("Error adding multi-select button:", error);
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

/**
 * Gets the current owner subscription state from propSubscription array
 * @param {Object} reportReference Direct reference to the report object
 * @param {Object} modelService Model service instance
 * @param {Object} panel The webview panel to send response
 */
function getOwnerSubscriptionState(reportReference, modelService, panel) {
    try {
        console.log("[DEBUG] Getting owner subscription state");
        
        // Get the owner object for this report
        const reportName = reportReference.name;
        const ownerObject = modelService.getReportOwnerObject(reportName);
        
        if (!ownerObject) {
            console.warn("[DEBUG] Could not find owner object for report:", reportName);
            // Send default state (unchecked)
            if (panel && panel.webview) {
                panel.webview.postMessage({
                    command: 'setOwnerSubscriptionState',
                    data: { isEnabled: false }
                });
            }
            return;
        }
        
        const objectName = ownerObject.name;
        
        // Check if ownerObject has propSubscription array
        if (!ownerObject.propSubscription || !Array.isArray(ownerObject.propSubscription)) {
            console.log("[DEBUG] Owner object has no propSubscription array");
            // Send default state (unchecked)
            if (panel && panel.webview) {
                panel.webview.postMessage({
                    command: 'setOwnerSubscriptionState',
                    data: { isEnabled: false }
                });
            }
            return;
        }
        
        // Look for subscription that matches our criteria
        const subscription = ownerObject.propSubscription.find(sub => 
            sub.destinationContextObjectName === objectName &&
            sub.destinationTargetName === reportName
        );
        
        // If subscription exists:
        //   - If isIgnored property doesn't exist, treat as enabled (isIgnored=false)
        //   - If isIgnored="true", treat as disabled
        //   - If isIgnored="false" or any other value, treat as enabled
        // If no subscription exists, treat as disabled
        const isEnabled = subscription ? subscription.isIgnored !== "true" : false;
        
        console.log("[DEBUG] Owner subscription found:", !!subscription);
        console.log("[DEBUG] Owner subscription isIgnored:", subscription ? subscription.isIgnored : "N/A");
        console.log("[DEBUG] Owner subscription state:", isEnabled);
        
        // Send the current state to the webview
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'setOwnerSubscriptionState',
                data: { isEnabled: isEnabled }
            });
        }
        
    } catch (error) {
        console.error("Error getting owner subscription state:", error);
        // Send default state on error
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'setOwnerSubscriptionState',
                data: { isEnabled: false }
            });
        }
    }
}

/**
 * Updates the owner subscription in the propSubscription array
 * @param {Object} data The subscription data
 * @param {Object} reportReference Direct reference to the report object
 * @param {Object} modelService Model service instance
 * @param {Object} panel The webview panel to refresh
 */
function updateOwnerSubscription(data, reportReference, modelService, panel) {
    try {
        console.log("[DEBUG] Updating owner subscription:", data);
        
        // Get the owner object for this report
        const reportName = reportReference.name;
        const ownerObject = modelService.getReportOwnerObject(reportName);
        
        if (!ownerObject) {
            console.error("[ERROR] Could not find owner object for report:", reportName);
            return;
        }
        
        const objectName = ownerObject.name;
        
        // Initialize propSubscription array if it doesn't exist
        if (!ownerObject.propSubscription) {
            ownerObject.propSubscription = [];
        }
        
        // Look for existing subscription
        let subscription = ownerObject.propSubscription.find(sub => 
            sub.destinationContextObjectName === objectName &&
            sub.destinationTargetName === reportName
        );
        
        if (data.isEnabled) {
            // Enable subscription
            if (subscription) {
                // Update existing subscription
                subscription.isIgnored = "false";
            } else {
                // Create new subscription
                subscription = {
                    destinationContextObjectName: objectName,
                    destinationTargetName: reportName,
                    isIgnored: "false"
                };
                ownerObject.propSubscription.push(subscription);
            }
            console.log("[DEBUG] Owner subscription enabled");
        } else {
            // Disable subscription
            if (subscription) {
                subscription.isIgnored = "true";
                console.log("[DEBUG] Owner subscription disabled (set isIgnored=true)");
            } else {
                // Create new subscription that's ignored
                subscription = {
                    destinationContextObjectName: objectName,
                    destinationTargetName: reportName,
                    isIgnored: "true"
                };
                ownerObject.propSubscription.push(subscription);
                console.log("[DEBUG] Owner subscription created as disabled");
            }
        }
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        console.log("[DEBUG] Owner subscription updated successfully");
        
    } catch (error) {
        console.error("Error updating owner subscription:", error);
    }
}

/**
 * Gets the current target child subscription state from propSubscription array
 * @param {Object} reportReference Direct reference to the report object
 * @param {Object} modelService Model service instance
 * @param {Object} panel The webview panel to send response
 */
function getTargetChildSubscriptionState(reportReference, modelService, panel) {
    try {
        console.log("[DEBUG] Getting target child subscription state");
        
        // Get the target child object for this report
        const reportName = reportReference.name;
        const targetChildObject = modelService.getReportTargetChildObject(reportName);
        
        if (!targetChildObject) {
            console.warn("[DEBUG] Could not find target child object for report:", reportName);
            // Send default state (unchecked and disabled)
            if (panel && panel.webview) {
                panel.webview.postMessage({
                    command: 'setTargetChildSubscriptionState',
                    data: { isEnabled: false, isDisabled: true }
                });
            }
            return;
        }
        
        const targetChildObjectName = targetChildObject.name;
        
        // Check if targetChildObject has propSubscription array
        if (!targetChildObject.propSubscription || !Array.isArray(targetChildObject.propSubscription)) {
            console.log("[DEBUG] Target child object has no propSubscription array");
            // Send default state (unchecked but enabled since target child exists)
            if (panel && panel.webview) {
                panel.webview.postMessage({
                    command: 'setTargetChildSubscriptionState',
                    data: { isEnabled: false, isDisabled: false }
                });
            }
            return;
        }
        
        // Look for subscription that matches our criteria
        const subscription = targetChildObject.propSubscription.find(sub => 
            sub.destinationContextObjectName === targetChildObjectName &&
            sub.destinationTargetName === reportName
        );
        
        // If subscription exists:
        //   - If isIgnored property doesn't exist, treat as enabled (isIgnored=false)
        //   - If isIgnored="true", treat as disabled
        //   - If isIgnored="false" or any other value, treat as enabled
        // If no subscription exists, treat as disabled
        const isEnabled = subscription ? subscription.isIgnored !== "true" : false;
        
        console.log("[DEBUG] Target child subscription found:", !!subscription);
        console.log("[DEBUG] Target child subscription isIgnored:", subscription ? subscription.isIgnored : "N/A");
        console.log("[DEBUG] Target child subscription state:", isEnabled);
        
        // Send the current state to the webview (enabled since target child exists)
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'setTargetChildSubscriptionState',
                data: { isEnabled: isEnabled, isDisabled: false }
            });
        }
        
    } catch (error) {
        console.error("Error getting target child subscription state:", error);
        // Send default state on error
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'setTargetChildSubscriptionState',
                data: { isEnabled: false, isDisabled: true }
            });
        }
    }
}

/**
 * Updates the target child subscription in the propSubscription array
 * @param {Object} data The subscription data
 * @param {Object} reportReference Direct reference to the report object
 * @param {Object} modelService Model service instance
 * @param {Object} panel The webview panel to refresh
 */
function updateTargetChildSubscription(data, reportReference, modelService, panel) {
    try {
        console.log("[DEBUG] Updating target child subscription:", data);
        
        // Get the target child object for this report
        const reportName = reportReference.name;
        const targetChildObject = modelService.getReportTargetChildObject(reportName);
        
        if (!targetChildObject) {
            console.error("[ERROR] Could not find target child object for report:", reportName);
            return;
        }
        
        const targetChildObjectName = targetChildObject.name;
        
        // Initialize propSubscription array if it doesn't exist
        if (!targetChildObject.propSubscription) {
            targetChildObject.propSubscription = [];
        }
        
        // Look for existing subscription
        let subscription = targetChildObject.propSubscription.find(sub => 
            sub.destinationContextObjectName === targetChildObjectName &&
            sub.destinationTargetName === reportName
        );
        
        if (data.isEnabled) {
            // Enable subscription
            if (subscription) {
                // Update existing subscription
                subscription.isIgnored = "false";
            } else {
                // Create new subscription
                subscription = {
                    destinationContextObjectName: targetChildObjectName,
                    destinationTargetName: reportName,
                    isIgnored: "false"
                };
                targetChildObject.propSubscription.push(subscription);
            }
            console.log("[DEBUG] Target child subscription enabled");
        } else {
            // Disable subscription
            if (subscription) {
                subscription.isIgnored = "true";
                console.log("[DEBUG] Target child subscription disabled (set isIgnored=true)");
            } else {
                // Create new subscription that's ignored
                subscription = {
                    destinationContextObjectName: targetChildObjectName,
                    destinationTargetName: reportName,
                    isIgnored: "true"
                };
                targetChildObject.propSubscription.push(subscription);
                console.log("[DEBUG] Target child subscription created as disabled");
            }
        }
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        console.log("[DEBUG] Target child subscription updated successfully");
        
    } catch (error) {
        console.error("Error updating target child subscription:", error);
    }
}

/**
 * Adds a new column to the report based on a data object property
 * @param {Object} reportReference Reference to the report object
 * @param {Object} modelService ModelService instance
 * @param {Object} data The property data including sourceObjectName, sourcePropertyName, dataType, dataSize
 * @param {Object} panel The webview panel for sending refresh messages
 */
function addPropertyColumnToReport(reportReference, modelService, data, panel) {
    console.log("addPropertyColumnToReport called with data:", data);
    
    if (!reportReference || !modelService || !data || !data.name) {
        console.error("Missing required data to add property column");
        return;
    }
    
    try {
        // Initialize the columns array if it doesn't exist
        if (!reportReference.reportColumn) {
            reportReference.reportColumn = [];
        }
        
        // Check if a column with this name already exists
        const existingColumn = reportReference.reportColumn.find(col => col.name === data.name);
        if (existingColumn) {
            console.warn("Column with name '" + data.name + "' already exists");
            
            // Send error message back to webview
            if (panel && panel.webview) {
                panel.webview.postMessage({
                    command: 'showColumnError',
                    data: {
                        error: "Column '" + data.name + "' already exists in the report."
                    }
                });
            }
            return;
        }
        
        // Create a new column with property metadata
        const newColumn = {
            name: data.name,
            isButton: 'false'
        };
        
        // Handle lookup properties vs regular properties
        if (data.isLookupProperty) {
            // For lookup properties, use the lookup object metadata
            newColumn.sourceObjectName = data.sourceObjectName; // The lookup object name
            newColumn.sourcePropertyName = data.sourcePropertyName; // The lookup property name
            newColumn.sourceLookupObjImplementationObjName = data.sourceLookupObjImplementationObjName; // The original data object name
        } else {
            // For regular properties
            newColumn.sourceObjectName = data.sourceObjectName || '';
            newColumn.sourcePropertyName = data.sourcePropertyName || '';
        }
        
        // Add data type if provided
        if (data.dataType) {
            newColumn.sqlServerDBDataType = data.dataType;
        }
        
        // Add data size if provided
        if (data.dataSize) {
            newColumn.sqlServerDBDataTypeSize = data.dataSize;
        }

        if (data.isVisible) {
            newColumn.isVisible = data.isVisible;
        }
        
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
        console.error("Error adding property column:", error);
    }
}

/**
 * Gets available data object properties for the report and sends them to the webview
 * @param {Object} reportReference Reference to the report object
 * @param {Object} modelService ModelService instance  
 * @param {Object} panel The webview panel to send response
 */
function getAvailablePropertiesForReport(reportReference, modelService, panel) {
    console.log("getAvailablePropertiesForReport called");
    
    try {
        const propertiesData = [];
        
        // Get all data objects from the model
        const allObjects = modelService.getAllObjects();
        
        // Function to get parent hierarchy for an object
        function getParentHierarchy(objectName) {
            const parents = [];
            let currentObjectName = objectName;
            
            while (currentObjectName) {
                const obj = allObjects.find(o => o.name && o.name.toLowerCase() === currentObjectName.toLowerCase());
                if (obj && obj.parentObjectName) {
                    const parentObj = allObjects.find(p => p.name && p.name.toLowerCase() === obj.parentObjectName.toLowerCase());
                    if (parentObj && !parents.find(p => p.name === parentObj.name)) {
                        parents.push(parentObj);
                        currentObjectName = parentObj.name;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }
            
            return parents;
        }
        
        // Function to extract properties from an object
        function extractPropertiesFromObject(obj) {
            const properties = [];
            
            if (obj.prop && Array.isArray(obj.prop)) {
                obj.prop.forEach(prop => {
                    if (prop.name) {
                        // Add the regular property
                        properties.push({
                            name: prop.name,
                            dataType: prop.sqlServerDBDataType || '',
                            dataSize: prop.sqlServerDBDataTypeSize || '',
                            fullPath: `${obj.name}.${prop.name}`,
                            isFKLookup: prop.isFKLookup === 'true',
                            fKObjectName: prop.fKObjectName || ''
                        });
                        
                        // If this is a FK lookup property, add the lookup object properties
                        if (prop.isFKLookup === 'true' && prop.fKObjectName) {
                            const lookupObject = allObjects.find(o => o.name && o.name.toLowerCase() === prop.fKObjectName.toLowerCase());
                            if (lookupObject && lookupObject.prop && Array.isArray(lookupObject.prop)) {
                                lookupObject.prop.forEach(lookupProp => {
                                    if (lookupProp.name) {
                                        properties.push({
                                            name: `${prop.name}.${lookupObject.name}.${lookupProp.name}`,
                                            dataType: lookupProp.sqlServerDBDataType || '',
                                            dataSize: lookupProp.sqlServerDBDataTypeSize || '',
                                            fullPath: `${obj.name}.${prop.name}.${lookupObject.name}.${lookupProp.name}`,
                                            isLookupProperty: true,
                                            sourceLookupObjImplementationObjName: obj.name,
                                            sourceObjectName: lookupObject.name,
                                            sourcePropertyName: lookupProp.name,
                                            parentPropertyName: prop.name
                                        });
                                    }
                                });
                            }
                        }
                    }
                });
            }
            
            return properties;
        }
        
        // Start with target child object if it exists
        const reportName = reportReference.name;
        const targetChildObject = modelService.getReportTargetChildObject(reportName);
        
        if (targetChildObject) {
            // Add target child object properties first
            const targetProperties = extractPropertiesFromObject(targetChildObject);
            if (targetProperties.length > 0) {
                propertiesData.push({
                    objectName: targetChildObject.name,
                    properties: targetProperties
                });
            }
            
            // Add parent hierarchy properties
            const parentHierarchy = getParentHierarchy(targetChildObject.name);
            parentHierarchy.forEach(parentObj => {
                const parentProperties = extractPropertiesFromObject(parentObj);
                if (parentProperties.length > 0) {
                    propertiesData.push({
                        objectName: parentObj.name,
                        properties: parentProperties
                    });
                }
            });
        } else {
            // If no target child, get the report owner object
            const reportOwnerObject = modelService.getReportOwnerObject(reportName);
            if (reportOwnerObject) {
                const ownerProperties = extractPropertiesFromObject(reportOwnerObject);
                if (ownerProperties.length > 0) {
                    propertiesData.push({
                        objectName: reportOwnerObject.name,
                        properties: ownerProperties
                    });
                }
                
                // Add parent hierarchy properties for the owner object
                const parentHierarchy = getParentHierarchy(reportOwnerObject.name);
                parentHierarchy.forEach(parentObj => {
                    const parentProperties = extractPropertiesFromObject(parentObj);
                    if (parentProperties.length > 0) {
                        propertiesData.push({
                            objectName: parentObj.name,
                            properties: parentProperties
                        });
                    }
                });
            }
        }
        
        // Send the properties data to the webview
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'populateAvailableProperties',
                data: propertiesData
            });
        }
        
        console.log("Available properties data sent:", propertiesData.length, "objects");
        
    } catch (error) {
        console.error("Error getting available properties:", error);
        
        // Send empty data on error
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'populateAvailableProperties',
                data: []
            });
        }
    }
}

// Export the functions
module.exports = {
    showReportDetails,
    refreshAll,
    getOpenPanelItems,
    closeAllPanels
};

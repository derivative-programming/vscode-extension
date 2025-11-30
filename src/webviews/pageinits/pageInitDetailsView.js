"use strict";
const vscode = require("vscode");
const path = require("path");
const { loadSchema, getPageInitSchemaProperties, getPageInitOutputVarsSchema } = require("./helpers/schemaLoader");
const { generateDetailsView } = require("./components/detailsViewGenerator");

// Track current panels to avoid duplicates
const activePanels = new Map();
// Registry to track all open page init details panels
const openPanels = new Map();
// Store context for later use
let currentContext = undefined;

/**
 * Opens a webview panel displaying details for a Page Init workflow
 * The item.label is the workflow title/name; item.ownerObjectName optional for context.
 * @param {string} initialTab Optional tab to open initially
 */
function showPageInitDetails(item, modelService, context, initialTab) {
    if (context) { currentContext = context; }
    const extensionContext = context || currentContext;
    if (!extensionContext) {
        console.error('Extension context not available for page init details view');
        vscode.window.showErrorMessage('Extension context not available. Please try again.');
        return;
    }

    const normalizedLabel = (item.label || '').trim().toLowerCase();
    const panelId = `pageInitDetails-${normalizedLabel}`;
    if (activePanels.has(panelId)) {
        console.log(`Panel already exists for ${item.label}, revealing existing panel with initialTab: ${initialTab}`);
        const existingPanel = activePanels.get(panelId);
        existingPanel.reveal(vscode.ViewColumn.One);
        
        // If initialTab is specified, send a message to switch to that tab
        if (initialTab) {
            existingPanel.webview.postMessage({
                command: 'switchTab',
                tab: initialTab
            });
        }
        return;
    }

    const panel = vscode.window.createWebviewPanel(
        "pageInitDetails",
        `Details for ${item.label} Page Init Flow`,
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(extensionContext.extensionPath, 'node_modules', '@vscode', 'codicons', 'dist'))
            ]
        }
    );

    activePanels.set(panelId, panel);
    openPanels.set(panelId, { panel, item, modelService });
    panel.onDidDispose(() => {
        activePanels.delete(panelId);
        openPanels.delete(panelId);
    });

    // Resolve the actual workflow from the model
    let flowData;
    let flowReference = null;
    if (modelService && typeof modelService.isFileLoaded === "function" && modelService.isFileLoaded()) {
        const allObjects = modelService.getAllObjects();
        // find workflow by name suffix match in any object's objectWorkflow
        const targetName = (item.label || '').trim().toLowerCase();
        for (const obj of allObjects) {
            const list = Array.isArray(obj.objectWorkflow) ? obj.objectWorkflow : [];
            const found = list.find(wf => (wf.name || wf.titleText || '').trim().toLowerCase() === targetName);
            if (found) {
                flowData = found;
                flowReference = found; // hold reference
                break;
            }
        }
        if (!flowData) {
            flowData = { name: item.label, error: "Workflow not found in model" };
        }
    } else {
        flowData = { name: item.label, error: "ModelService not available" };
    }

    // Ensure arrays exist
    if (!flowData.objectWorkflowOutputVar) { flowData.objectWorkflowOutputVar = []; }

    // Load schema
    const schema = loadSchema();
    const flowSchemaProps = getPageInitSchemaProperties(schema);
    const flowOutputVarsSchema = getPageInitOutputVarsSchema(schema);

    const codiconsUri = panel.webview.asWebviewUri(
        vscode.Uri.file(path.join(extensionContext.extensionPath, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css'))
    );

    try {
        const allDataObjects = modelService && modelService.isFileLoaded() ? modelService.getAllObjects() : [];
        
        // Get the owner data object for this page init flow
        const ownerObject = modelService && modelService.isFileLoaded() && flowData ? 
            modelService.getPageInitOwnerObject(flowData.name) : null;

        panel.webview.html = generateDetailsView(
            flowData,
            flowSchemaProps,
            flowOutputVarsSchema,
            codiconsUri,
            allDataObjects,
            ownerObject,
            initialTab
        );
    } catch (error) {
        console.error("Error generating page init details view:", error);
        vscode.window.showErrorMessage(`Failed to open Page Init Details: ${error.message}`);
        return;
    }

    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case "updateSettings":
                    if (modelService && flowReference) {
                        updateSettingsDirectly(message.data, flowReference, modelService);
                    }
                    return;
                case "updateOutputVar":
                    if (modelService && flowReference) {
                        updateOutputVarProperty(message.data, flowReference, modelService);
                    }
                    return;
                case "removeOutputVarProperty":
                    if (modelService && flowReference) {
                        removeOutputVarProperty(message, flowReference, modelService);
                    }
                    return;
                case "moveOutputVar":
                    if (modelService && flowReference) {
                        moveOutputVarInArray(message.data, flowReference, modelService, panel);
                    }
                    return;
                case "reverseOutputVar":
                    if (modelService && flowReference) {
                        reverseOutputVarArray(flowReference, modelService, panel);
                    }
                    return;
                case "addOutputVar":
                    if (modelService && flowReference) {
                        // Add a new output variable to the page init
                        addOutputVarToPageInit(flowReference, modelService);
                    } else {
                        console.warn("Cannot add output variable: ModelService not available or flow reference not found");
                    }
                    return;
                case "addOutputVarWithName":
                    if (modelService && flowReference) {
                        // Add a new output variable to the page init with specified name
                        addOutputVarToPageInitWithName(flowReference, modelService, message.data.name, panel);
                    } else {
                        console.warn("Cannot add output variable with name: ModelService not available or flow reference not found");
                    }
                    return;
                    
                case "openOwnerObjectDetails":
                    console.log('[DEBUG] PageInitDetails - Open owner object details requested for object name:', JSON.stringify(message.objectName));
                    try {
                        if (message.objectName) {
                            // Execute the object details command to open the owner object
                            vscode.commands.executeCommand('appdna.showDetails', {
                                label: message.objectName,
                                objectType: 'object'
                            });
                        } else {
                            console.error('[ERROR] PageInitDetails - No object name provided for opening owner object details');
                            vscode.window.showErrorMessage('No object name provided for opening details');
                        }
                    } catch (error) {
                        console.error('[ERROR] PageInitDetails - Failed to open owner object details:', error);
                        vscode.window.showErrorMessage(`Failed to open owner object details: ${error.message}`);
                    }
                    return;
            }
        }
    );
}

function updateSettingsDirectly(data, flowRef, modelService) {
    try {
        const { property, exists, value } = data || {};
    if (!property) { return; }
        if (exists) {
            flowRef[property] = value;
        } else {
            delete flowRef[property];
        }
        if (typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
    } catch (e) {
        console.error('updateSettingsDirectly error:', e);
    }
}

function updateOutputVarProperty(data, flowRef, modelService) {
    try {
        const { index, property, exists, value } = data || {};
    if (index === undefined || index === null || !property) { return; }
        const list = flowRef.objectWorkflowOutputVar || (flowRef.objectWorkflowOutputVar = []);
        const target = list[index];
    if (!target) { return; }
        if (exists) {
            target[property] = value;
        } else {
            delete target[property];
        }
        if (typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
    } catch (e) {
        console.error('updateOutputVarProperty error:', e);
    }
}

function removeOutputVarProperty(message, flowRef, modelService) {
    try {
        const { index, property } = (message && message.data) || {};
    if (index === undefined || index === null || !property) { return; }
        const list = flowRef.objectWorkflowOutputVar || [];
    if (!list[index]) { return; }
        delete list[index][property];
    if (typeof modelService.markUnsavedChanges === 'function') { modelService.markUnsavedChanges(); }
    } catch (e) {
        console.error('removeOutputVarProperty error:', e);
    }
}

function moveOutputVarInArray(data, flowRef, modelService, panel) {
    try {
        const { fromIndex, toIndex } = data || {};
        const list = flowRef.objectWorkflowOutputVar || [];
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length) { return; }
        const [moved] = list.splice(fromIndex, 1);
        list.splice(toIndex, 0, moved);
    if (typeof modelService.markUnsavedChanges === 'function') { modelService.markUnsavedChanges(); }
        panel.webview.postMessage({ command: 'refreshOutputVarsList', data: list, newSelection: toIndex });
    } catch (e) {
        console.error('moveOutputVarInArray error:', e);
    }
}

function reverseOutputVarArray(flowRef, modelService, panel) {
    try {
        const list = flowRef.objectWorkflowOutputVar || [];
        list.reverse();
    if (typeof modelService.markUnsavedChanges === 'function') { modelService.markUnsavedChanges(); }
        panel.webview.postMessage({ command: 'refreshOutputVarsList', data: list, newSelection: 0 });
    } catch (e) {
        console.error('reverseOutputVarArray error:', e);
    }
}

/**
 * Adds a new output variable to the page init
 * @param {Object} flowReference Reference to the current page init flow
 * @param {Object} modelService Reference to the model service
 */
function addOutputVarToPageInit(flowReference, modelService) {
    console.log("addOutputVarToPageInit called");
    
    if (!flowReference || !modelService) {
        console.error("Missing required data for adding output variable");
        return;
    }
    
    try {
        // Use the flow reference directly since it's already the flow object
        const flow = flowReference;
        
        // Initialize the output variables array if it doesn't exist
        if (!flow.objectWorkflowOutputVar) {
            flow.objectWorkflowOutputVar = [];
        }
        
        // Create a new output variable with a default name
        const newOutputVar = {
            name: `OutputVar${flow.objectWorkflowOutputVar.length + 1}`
        };
        
        // Add the new output variable to the flow
        flow.objectWorkflowOutputVar.push(newOutputVar);
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Refresh the UI
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error adding output variable to page init:", error);
    }
}

/**
 * Adds a new output variable to the page init with user-specified name
 * @param {Object} flowReference Reference to the page init flow object
 * @param {Object} modelService ModelService instance
 * @param {string} outputVarName Name for the new output variable
 * @param {Object} panel The webview panel for sending refresh messages
 */
function addOutputVarToPageInitWithName(flowReference, modelService, outputVarName, panel) {
    console.log("addOutputVarToPageInitWithName called with name:", outputVarName);
    
    if (!flowReference || !modelService || !outputVarName) {
        console.error("Missing required data to add output variable with name");
        return;
    }
    
    try {
        // Use the flow reference directly since it's already the flow object
        const flow = flowReference;
        
        // Initialize the output variables array if it doesn't exist
        if (!flow.objectWorkflowOutputVar) {
            flow.objectWorkflowOutputVar = [];
        }
        
        // Create a new output variable with the specified name
        const newOutputVar = {
            name: outputVarName
        };
        
        // Add the new output variable to the array
        flow.objectWorkflowOutputVar.push(newOutputVar);
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Send message to webview to refresh the output vars list
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'refreshOutputVarsList',
                data: flow.objectWorkflowOutputVar,
                newSelection: flow.objectWorkflowOutputVar.length - 1 // Select the newly added item
            });
        }
        
        // Refresh the UI
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error adding output variable with name:", error);
    }
}

function refreshAll() {
    for (const [id, entry] of openPanels.entries()) {
        try {
            const { panel, item, modelService } = entry;
            if (panel && !panel.disposed) {
                showPageInitDetails(item, modelService, currentContext);
            }
        } catch (e) { console.error('refreshAll pageinit error:', e); }
    }
}

function getOpenPanelItems() {
    const items = [];
    for (const [, entry] of openPanels.entries()) {
    if (entry && entry.item) { items.push(entry.item); }
    }
    return items;
}

function closeAllPanels() {
    for (const [, entry] of openPanels.entries()) {
        try { entry.panel.dispose(); } catch {}
    }
    activePanels.clear();
    openPanels.clear();
}

module.exports = {
    showPageInitDetails,
    refreshAll,
    getOpenPanelItems,
    closeAllPanels
};

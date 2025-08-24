"use strict";
const vscode = require("vscode");
const path = require("path");
const { loadSchema, getWorkflowSchemaProperties, getWorkflowDynaFlowTaskSchema } = require("./helpers/schemaLoader");
const { generateDetailsView } = require("./components/detailsViewGenerator");

// Track current panels to avoid duplicates
const activePanels = new Map();
// Registry to track all open workflow details panels
const openPanels = new Map();
// Store context for later use
let currentContext = undefined;

/**
 * Opens a webview panel displaying details for a DynaFlow workflow (isDynaFlow=true)
 * The item.label is the workflow title/name
 */
function showWorkflowDetails(item, modelService, context) {
    if (context) { currentContext = context; }
    const extensionContext = context || currentContext;
    if (!extensionContext) {
        console.error('Extension context not available for workflow details view');
        vscode.window.showErrorMessage('Extension context not available. Please try again.');
        return;
    }

    const normalizedLabel = (item.label || '').trim().toLowerCase();
    const panelId = `workflowDetails-${normalizedLabel}`;
    if (activePanels.has(panelId)) {
        activePanels.get(panelId).reveal(vscode.ViewColumn.One);
        return;
    }

    const panel = vscode.window.createWebviewPanel(
        "workflowDetails",
        `Details for ${item.label} Workflow`,
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

    // Resolve the actual workflow from the model (DynaFlow only: isDynaFlow === "true")
    let flowData;
    let flowReference = null;
    let ownerObject = null;
    if (modelService && typeof modelService.isFileLoaded === "function" && modelService.isFileLoaded()) {
        const allObjects = modelService.getAllObjects();
        const targetName = (item.label || '').trim().toLowerCase();
        for (const obj of allObjects) {
            const list = Array.isArray(obj.objectWorkflow) ? obj.objectWorkflow : [];
            const found = list.find(wf => {
                const n = (wf.titleText || wf.name || '').trim().toLowerCase();
                if (n !== targetName) { return false; }
                return wf.isDynaFlow === "true";
            });
            if (found) { flowData = found; flowReference = found; ownerObject = obj; break; }
        }
        if (!flowData) { flowData = { name: item.label, error: "Workflow not found in model" }; }
    } else {
        flowData = { name: item.label, error: "ModelService not available" };
    }

    // Ensure arrays exist
    if (!flowData.dynaFlowTask) { flowData.dynaFlowTask = []; }

    // Load schema
    const schema = loadSchema();
    const flowSchemaProps = getWorkflowSchemaProperties(schema);
    const flowDynaFlowTaskSchema = getWorkflowDynaFlowTaskSchema(schema);

    const codiconsUri = panel.webview.asWebviewUri(
        vscode.Uri.file(path.join(extensionContext.extensionPath, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css'))
    );

    try {
        const allDataObjects = modelService && modelService.isFileLoaded() ? modelService.getAllObjects() : [];
        panel.webview.html = generateDetailsView(
            flowData,
            flowSchemaProps,
            flowDynaFlowTaskSchema,
            codiconsUri,
            allDataObjects,
            ownerObject
        );
    } catch (error) {
        console.error("Error generating workflow details view:", error);
        vscode.window.showErrorMessage(`Failed to open Workflow Details: ${error.message}`);
        return;
    }

    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case "updateSettings":
                    if (modelService && flowReference) { updateSettingsDirectly(message.data, flowReference, modelService); }
                    return;
                case "updateWorkflowTask":
                    if (modelService && flowReference) {
                        updateWorkflowTaskProperty(message.data, flowReference, modelService);
                    }
                    return;
                case "removeWorkflowTaskProperty":
                    if (modelService && flowReference) {
                        removeWorkflowTaskProperty(message, flowReference, modelService);
                    }
                    return;
                case "moveWorkflowTask":
                    if (modelService && flowReference) {
                        moveWorkflowTaskInArray(message.data, flowReference, modelService, panel);
                    }
                    return;
                case "reverseWorkflowTask":
                    if (modelService && flowReference) {
                        reverseWorkflowTaskArray(flowReference, modelService, panel);
                    }
                    return;
                case "addWorkflowTask":
                    if (modelService && flowReference) {
                        // Add a new workflow task to the workflow
                        addWorkflowTaskToWorkflow(flowReference, modelService);
                    } else {
                        console.warn("Cannot add workflow task: ModelService not available or flow reference not found");
                    }
                    return;
                case "addWorkflowTaskWithName":
                    if (modelService && flowReference) {
                        // Add a new workflow task to the workflow with specified name
                        addWorkflowTaskToWorkflowWithName(flowReference, modelService, message.data.name, panel);
                    } else {
                        console.warn("Cannot add workflow task with name: ModelService not available or flow reference not found");
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
        if (exists) { flowRef[property] = value; } else { delete flowRef[property]; }
        if (typeof modelService.markUnsavedChanges === 'function') { modelService.markUnsavedChanges(); }
    } catch (e) { console.error('updateSettingsDirectly error:', e); }
}

function updateWorkflowTaskProperty(data, flowRef, modelService) {
    try {
        const { index, property, exists, value } = data || {};
        if (index === undefined || index === null || !property) { return; }
        const list = flowRef.dynaFlowTask || (flowRef.dynaFlowTask = []);
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
        console.error('updateWorkflowTaskProperty error:', e);
    }
}

function removeWorkflowTaskProperty(message, flowRef, modelService) {
    try {
        const { index, property } = (message && message.data) || {};
        if (index === undefined || index === null || !property) { return; }
        const list = flowRef.dynaFlowTask || [];
        if (!list[index]) { return; }
        delete list[index][property];
        if (typeof modelService.markUnsavedChanges === 'function') { modelService.markUnsavedChanges(); }
    } catch (e) {
        console.error('removeWorkflowTaskProperty error:', e);
    }
}

function moveWorkflowTaskInArray(data, flowRef, modelService, panel) {
    try {
        const { fromIndex, toIndex } = data || {};
        const list = flowRef.dynaFlowTask || [];
        if (fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length) { return; }
        const [moved] = list.splice(fromIndex, 1);
        list.splice(toIndex, 0, moved);
        if (typeof modelService.markUnsavedChanges === 'function') { modelService.markUnsavedChanges(); }
        panel.webview.postMessage({ command: 'refreshWorkflowTasksList', data: list, newSelection: toIndex });
    } catch (e) {
        console.error('moveWorkflowTaskInArray error:', e);
    }
}

function reverseWorkflowTaskArray(flowRef, modelService, panel) {
    try {
        const list = flowRef.dynaFlowTask || [];
        list.reverse();
        if (typeof modelService.markUnsavedChanges === 'function') { modelService.markUnsavedChanges(); }
        panel.webview.postMessage({ command: 'refreshWorkflowTasksList', data: list, newSelection: 0 });
    } catch (e) {
        console.error('reverseWorkflowTaskArray error:', e);
    }
}

/**
 * Adds a new workflow task to the workflow
 * @param {Object} flowReference Reference to the current workflow
 * @param {Object} modelService Reference to the model service
 */
function addWorkflowTaskToWorkflow(flowReference, modelService) {
    console.log("addWorkflowTaskToWorkflow called");
    
    if (!flowReference || !modelService) {
        console.error("Missing required data for adding workflow task");
        return;
    }
    
    try {
        // Use the flow reference directly since it's already the flow object
        const flow = flowReference;
        
        // Initialize the workflow tasks array if it doesn't exist
        if (!flow.dynaFlowTask) {
            flow.dynaFlowTask = [];
        }
        
        // Create a new workflow task with a default name
        const newWorkflowTask = {
            name: `WorkflowTask${flow.dynaFlowTask.length + 1}`
        };
        
        // Add the new workflow task to the flow
        flow.dynaFlowTask.push(newWorkflowTask);
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Refresh the UI
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error adding workflow task to workflow:", error);
    }
}

/**
 * Adds a new workflow task to the workflow with user-specified name
 * @param {Object} flowReference Reference to the workflow object
 * @param {Object} modelService ModelService instance
 * @param {string} workflowTaskName Name for the new workflow task
 * @param {Object} panel The webview panel for sending refresh messages
 */
function addWorkflowTaskToWorkflowWithName(flowReference, modelService, workflowTaskName, panel) {
    console.log("addWorkflowTaskToWorkflowWithName called with name:", workflowTaskName);
    
    if (!flowReference || !modelService || !workflowTaskName) {
        console.error("Missing required data to add workflow task with name");
        return;
    }
    
    try {
        // Use the flow reference directly since it's already the flow object
        const flow = flowReference;
        
        // Initialize the workflow tasks array if it doesn't exist
        if (!flow.dynaFlowTask) {
            flow.dynaFlowTask = [];
        }
        
        // Create a new workflow task with the specified name
        const newWorkflowTask = {
            name: workflowTaskName
        };
        
        // Add the new workflow task to the array
        flow.dynaFlowTask.push(newWorkflowTask);
        
        // Mark as having unsaved changes
        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
            modelService.markUnsavedChanges();
        }
        
        // Send message to webview to refresh the workflow tasks list
        if (panel && panel.webview) {
            panel.webview.postMessage({
                command: 'refreshWorkflowTasksList',
                data: flow.dynaFlowTask,
                newSelection: flow.dynaFlowTask.length - 1 // Select the newly added item
            });
        }
        
        // Refresh the UI
        vscode.commands.executeCommand("appdna.refresh");
    } catch (error) {
        console.error("Error adding workflow task with name:", error);
    }
}

function refreshAll() {
    for (const [id, entry] of openPanels.entries()) {
        try {
            const { panel, item, modelService } = entry;
            if (panel && !panel.disposed) {
                showWorkflowDetails(item, modelService);
            }
        } catch (e) { console.error('refreshAll workflow error:', e); }
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
    showWorkflowDetails,
    refreshAll,
    getOpenPanelItems,
    closeAllPanels
};

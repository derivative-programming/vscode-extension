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
                case "getAvailableWorkflowTasks":
                    if (modelService) {
                        // Get all DynaFlowTask objects that have isDynaFlowTask=true
                        getAvailableWorkflowTasksForSelection(modelService, panel);
                    } else {
                        console.warn("Cannot get available workflow tasks: ModelService not available");
                    }
                    return;
                case "addExistingWorkflowTasksToWorkflow":
                    if (modelService && flowReference) {
                        // Add existing workflow tasks to the workflow
                        addExistingWorkflowTasksToWorkflow(flowReference, modelService, message.data.taskNames, panel);
                    } else {
                        console.warn("Cannot add existing workflow tasks: ModelService not available or flow reference not found");
                    }
                    return;
                case "openOwnerObjectDetails":
                    console.log('[DEBUG] WorkflowDetails - Open owner object details requested for object name:', JSON.stringify(message.objectName));
                    try {
                        if (message.objectName) {
                            // Execute the object details command to open the owner object
                            vscode.commands.executeCommand('appdna.showDetails', {
                                label: message.objectName,
                                objectType: 'object'
                            });
                        } else {
                            console.error('[ERROR] WorkflowDetails - No object name provided for opening owner object details');
                        }
                    } catch (error) {
                        console.error('[ERROR] WorkflowDetails - Failed to open owner object details:', error);
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
        
        // Generate a default name that doesn't conflict
        let taskCounter = flow.dynaFlowTask.length + 1;
        let workflowTaskName = `WorkflowTask${taskCounter}`;
        
        // Ensure the name is unique in the current workflow
        while (flow.dynaFlowTask.some(task => task.name === workflowTaskName)) {
            taskCounter++;
            workflowTaskName = `WorkflowTask${taskCounter}`;
        }
        
        // Use the enhanced function to add the workflow task properly
        addWorkflowTaskToWorkflowWithName(flowReference, modelService, workflowTaskName, null);
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
        
        // Find the DynaFlowTask data object
        const allObjects = modelService.getAllObjects();
        const dynaFlowTaskObject = allObjects.find(obj => 
            obj.name && obj.name.trim().toLowerCase() === 'dynaflowtask'
        );
        
        if (!dynaFlowTaskObject) {
            console.error("DynaFlowTask data object not found in model");
            vscode.window.showErrorMessage("DynaFlowTask data object must exist in the model to add workflow tasks.");
            return;
        }
        
        // Check for duplicate names in both the current workflow and DynaFlowTask object
        // 1. Check current workflow dynaFlowTask array
        if (!flow.dynaFlowTask) {
            flow.dynaFlowTask = [];
        }
        
        const duplicateInWorkflow = flow.dynaFlowTask.some(task => 
            task.name && task.name.trim().toLowerCase() === workflowTaskName.trim().toLowerCase()
        );
        
        if (duplicateInWorkflow) {
            console.error(`Workflow task with name "${workflowTaskName}" already exists in current workflow`);
            vscode.window.showErrorMessage(`A workflow task named "${workflowTaskName}" already exists in this workflow.`);
            return;
        }
        
        // 2. Check DynaFlowTask object's objectWorkflow array for isDynaFlowTask=true items
        if (!dynaFlowTaskObject.objectWorkflow) {
            dynaFlowTaskObject.objectWorkflow = [];
        }
        
        const duplicateInDynaFlowTask = dynaFlowTaskObject.objectWorkflow.some(workflow => 
            workflow.isDynaFlowTask === "true" && 
            workflow.name && 
            workflow.name.trim().toLowerCase() === workflowTaskName.trim().toLowerCase()
        );
        
        if (duplicateInDynaFlowTask) {
            console.error(`DynaFlowTask workflow with name "${workflowTaskName}" already exists in DynaFlowTask object`);
            vscode.window.showErrorMessage(`A DynaFlowTask workflow named "${workflowTaskName}" already exists.`);
            return;
        }
        
        // Create a new workflow task in the current workflow's dynaFlowTask array
        const newWorkflowTask = {
            name: workflowTaskName
        };
        
        // Add the new workflow task to the current workflow
        flow.dynaFlowTask.push(newWorkflowTask);
        
        // Create a corresponding objectWorkflow item in the DynaFlowTask object
        const newDynaFlowTaskWorkflow = {
            name: workflowTaskName,
            isDynaFlowTask: "true",
            isPage: "false",
            isAuthorizationRequired: "false",
            objectWorkflowParam: [],
            objectWorkflowOutputVar: [],
            objectWorkflowButton: []
        };
        
        // Add the new workflow to the DynaFlowTask object
        dynaFlowTaskObject.objectWorkflow.push(newDynaFlowTaskWorkflow);
        
        console.log(`Added workflow task "${workflowTaskName}" to both current workflow and DynaFlowTask object`);
        
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
        vscode.window.showErrorMessage(`Error adding workflow task: ${error.message}`);
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

function getAvailableWorkflowTasksForSelection(modelService, panel) {
    console.log('[DEBUG] Getting available workflow tasks for selection');
    
    try {
        const allObjects = modelService.getAllObjects();
        console.log(`[DEBUG] Total objects in model: ${allObjects.length}`);
        
        // Debug: Show all unique name values
        const uniqueNames = [...new Set(allObjects.map(obj => obj.name))].sort();
        console.log('[DEBUG] All name values in model:', uniqueNames);
        
        // Look for objects with "Task" in the name
        const taskObjects = allObjects.filter(obj => 
            obj.name && obj.name.toLowerCase().includes('task')
        );
        console.log(`[DEBUG] Objects with 'task' in name: ${taskObjects.length}`);
        if (taskObjects.length > 0) {
            console.log('[DEBUG] Task object names:', taskObjects.map(obj => obj.name));
            console.log('[DEBUG] Sample task object:', JSON.stringify(taskObjects[0], null, 2));
        }
        
        // Debug: Show all DynaFlowTask objects regardless of isDynaFlowTask
        const allDynaFlowTaskObjects = allObjects.filter(obj => obj.name === 'DynaFlowTask');
        console.log(`[DEBUG] Total DynaFlowTask objects: ${allDynaFlowTaskObjects.length}`);
        
        if (allDynaFlowTaskObjects.length > 0) {
            console.log('[DEBUG] Sample DynaFlowTask object:', JSON.stringify(allDynaFlowTaskObjects[0], null, 2));
        }
        
        // Now we need to look for workflow tasks within the DynaFlowTask object's objectWorkflow array
        let dynaFlowTaskWorkflows = [];
        const dynaFlowTaskObject = allObjects.find(obj => obj.name === 'DynaFlowTask');
        if (dynaFlowTaskObject && Array.isArray(dynaFlowTaskObject.objectWorkflow)) {
            dynaFlowTaskWorkflows = dynaFlowTaskObject.objectWorkflow.filter(workflow => 
                workflow.isDynaFlowTask === "true"
            );
        }
        
        console.log(`[DEBUG] Found ${dynaFlowTaskWorkflows.length} workflow tasks in DynaFlowTask object with isDynaFlowTask=true`);
        
        console.log(`[DEBUG] Found ${dynaFlowTaskWorkflows.length} workflow tasks in DynaFlowTask object with isDynaFlowTask=true`);
        
        // Send the available tasks back to the webview
        panel.webview.postMessage({
            command: 'availableWorkflowTasksResponse',
            data: dynaFlowTaskWorkflows
        });
        
    } catch (error) {
        console.error('[ERROR] Failed to get available workflow tasks:', error);
        panel.webview.postMessage({
            command: 'availableWorkflowTasksResponse',
            data: []
        });
    }
}

function addExistingWorkflowTasksToWorkflow(flowReference, modelService, taskNames, panel) {
    console.log('[DEBUG] Adding existing workflow tasks to workflow:', taskNames);
    
    try {
        if (!Array.isArray(taskNames) || taskNames.length === 0) {
            console.warn('[WARN] No valid task names provided');
            return;
        }
        
        // Find the DynaFlowTask object and get the workflow tasks from it
        const allObjects = modelService.getAllObjects();
        const dynaFlowTaskObject = allObjects.find(obj => obj.name === 'DynaFlowTask');
        
        if (!dynaFlowTaskObject || !Array.isArray(dynaFlowTaskObject.objectWorkflow)) {
            console.warn('[WARN] DynaFlowTask object not found or has no objectWorkflow array');
            return;
        }
        
        // Find the workflow tasks that match the selected names
        const selectedWorkflowTasks = dynaFlowTaskObject.objectWorkflow.filter(workflow => 
            workflow.isDynaFlowTask === "true" && 
            taskNames.includes(workflow.name)
        );
        
        if (selectedWorkflowTasks.length === 0) {
            console.warn('[WARN] No matching workflow tasks found for provided names');
            return;
        }
        
        // Ensure the dynaFlowTask array exists
        if (!Array.isArray(flowReference.dynaFlowTask)) {
            flowReference.dynaFlowTask = [];
        }
        
        // Add each selected task to the workflow
        let addedCount = 0;
        selectedWorkflowTasks.forEach(workflowTask => {
            // Check if this task is already in the workflow by name
            const existingTask = flowReference.dynaFlowTask.find(wt => 
                wt.name === workflowTask.name
            );
            
            if (!existingTask) {
                // Create a new workflow task entry
                const newWorkflowTask = {
                    name: workflowTask.name
                };
                
                flowReference.dynaFlowTask.push(newWorkflowTask);
                addedCount++;
                console.log(`[DEBUG] Added existing task ${workflowTask.name} to workflow`);
            } else {
                console.log(`[DEBUG] Task ${workflowTask.name} already exists in workflow`);
            }
        });
        
        if (addedCount > 0) {
            // Mark as having unsaved changes
            if (modelService && typeof modelService.markUnsavedChanges === 'function') {
                modelService.markUnsavedChanges();
            }
            
            console.log(`[SUCCESS] Added ${addedCount} existing workflow tasks to workflow`);
            
            // Send message to webview to refresh the workflow tasks list
            if (panel && panel.webview) {
                panel.webview.postMessage({
                    command: 'refreshWorkflowTasksList',
                    data: flowReference.dynaFlowTask,
                    newSelection: flowReference.dynaFlowTask.length - addedCount // Select one of the newly added items
                });
            }
        } else {
            console.log('[INFO] No new workflow tasks were added (all already existed)');
        }
        
    } catch (error) {
        console.error('[ERROR] Failed to add existing workflow tasks:', error);
        vscode.window.showErrorMessage(`Failed to add workflow tasks: ${error.message}`);
    }
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

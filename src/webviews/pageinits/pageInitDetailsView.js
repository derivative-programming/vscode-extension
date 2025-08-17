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
 */
function showPageInitDetails(item, modelService, context) {
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
        activePanels.get(panelId).reveal(vscode.ViewColumn.One);
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
            const found = list.find(wf => (wf.titleText || wf.name || '').trim().toLowerCase() === targetName);
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
        const ownerObject = null; // Not needed for initial scope

        panel.webview.html = generateDetailsView(
            flowData,
            flowSchemaProps,
            flowOutputVarsSchema,
            codiconsUri,
            allDataObjects,
            ownerObject
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

function refreshAll() {
    for (const [id, entry] of openPanels.entries()) {
        try {
            const { panel, item, modelService } = entry;
            if (panel && !panel.disposed) {
                showPageInitDetails(item, modelService);
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

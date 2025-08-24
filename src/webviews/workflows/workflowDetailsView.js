"use strict";
const vscode = require("vscode");
const path = require("path");
const { loadSchema, getWorkflowSchemaProperties } = require("./helpers/schemaLoader");
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

    // Load schema
    const schema = loadSchema();
    const flowSchemaProps = getWorkflowSchemaProperties(schema);

    const codiconsUri = panel.webview.asWebviewUri(
        vscode.Uri.file(path.join(extensionContext.extensionPath, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css'))
    );

    try {
        const allDataObjects = modelService && modelService.isFileLoaded() ? modelService.getAllObjects() : [];
        panel.webview.html = generateDetailsView(
            flowData,
            flowSchemaProps,
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

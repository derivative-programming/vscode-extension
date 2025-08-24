"use strict";
const vscode = require("vscode");
const path = require("path");
const { loadSchema, getGeneralFlowSchemaProperties, getGeneralFlowParamsSchema, getGeneralFlowOutputVarsSchema } = require("./helpers/schemaLoader");
const { generateDetailsView } = require("./components/detailsViewGenerator");

// Track current panels to avoid duplicates
const activePanels = new Map();
// Registry to track all open general flow details panels
const openPanels = new Map();
// Store context for later use
let currentContext = undefined;

/**
 * Opens a webview panel displaying details for a General workflow
 * The item.label is the workflow title/name
 */
function showGeneralFlowDetails(item, modelService, context) {
    if (context) { currentContext = context; }
    const extensionContext = context || currentContext;
    if (!extensionContext) {
        console.error('Extension context not available for general flow details view');
        vscode.window.showErrorMessage('Extension context not available. Please try again.');
        return;
    }

    const normalizedLabel = (item.label || '').trim().toLowerCase();
    const panelId = `generalFlowDetails-${normalizedLabel}`;
    if (activePanels.has(panelId)) {
        activePanels.get(panelId).reveal(vscode.ViewColumn.One);
        return;
    }

    const panel = vscode.window.createWebviewPanel(
        "generalFlowDetails",
        `Details for ${item.label} General Flow`,
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

    // Resolve the actual workflow from the model (General flows are non-page objectWorkflow not ending with init...)
    let flowData;
    let flowReference = null;
    if (modelService && typeof modelService.isFileLoaded === "function" && modelService.isFileLoaded()) {
        const allObjects = modelService.getAllObjects();
        const targetName = (item.label || '').trim().toLowerCase();
        for (const obj of allObjects) {
            const list = Array.isArray(obj.objectWorkflow) ? obj.objectWorkflow : [];
            const found = list.find(wf => {
                const n = (wf.titleText || wf.name || '').trim().toLowerCase();
                if (n !== targetName) { return false; }
                const isDynaFlowOk = !wf.isDynaFlow || wf.isDynaFlow === "false";
                const isDynaFlowTaskOk = !wf.isDynaFlowTask || wf.isDynaFlowTask === "false";
                const isPageOk = wf.isPage === "false";
                const nn = (wf.name || '').toLowerCase();
                const notInitObjWf = !nn.endsWith('initobjwf');
                const notInitReport = !nn.endsWith('initreport');
                return isDynaFlowOk && isDynaFlowTaskOk && isPageOk && notInitObjWf && notInitReport;
            });
            if (found) { flowData = found; flowReference = found; break; }
        }
        if (!flowData) { flowData = { name: item.label, error: "Workflow not found in model" }; }
    } else {
        flowData = { name: item.label, error: "ModelService not available" };
    }

    // Ensure arrays exist
    if (!flowData.objectWorkflowParam) { flowData.objectWorkflowParam = []; }
    if (!flowData.objectWorkflowOutputVar) { flowData.objectWorkflowOutputVar = []; }

    // Load schema
    const schema = loadSchema();
    const flowSchemaProps = getGeneralFlowSchemaProperties(schema);
    const flowParamsSchema = getGeneralFlowParamsSchema(schema);
    const flowOutputVarsSchema = getGeneralFlowOutputVarsSchema(schema);

    const codiconsUri = panel.webview.asWebviewUri(
        vscode.Uri.file(path.join(extensionContext.extensionPath, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css'))
    );

    try {
        const allDataObjects = modelService && modelService.isFileLoaded() ? modelService.getAllObjects() : [];
        const ownerObject = null; // Not in scope for general flows yet

        panel.webview.html = generateDetailsView(
            flowData,
            flowSchemaProps,
            flowParamsSchema,
            flowOutputVarsSchema,
            codiconsUri,
            allDataObjects,
            ownerObject
        );
    } catch (error) {
        console.error("Error generating general flow details view:", error);
        vscode.window.showErrorMessage(`Failed to open General Flow Details: ${error.message}`);
        return;
    }

    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case "updateSettings":
                    if (modelService && flowReference) { updateSettingsDirectly(message.data, flowReference, modelService); }
                    return;
                case "updateParamFull":
                    if (modelService && flowReference) { updateParamFull(message.data, flowReference, modelService); }
                    return;
                case "updateParam":
                    if (modelService && flowReference) { updateParamProperty(message.data, flowReference, modelService); }
                    return;
                case "removeParamProperty":
                    if (modelService && flowReference) { removeParamProperty(message, flowReference, modelService); }
                    return;
                case "moveParam":
                    if (modelService && flowReference) { moveParamInArray(message.data, flowReference, modelService, panel); }
                    return;
                case "reverseParams":
                    if (modelService && flowReference) { reverseParamArray(flowReference, modelService, panel); }
                    return;
                case "reverseParam":
                    if (modelService && flowReference) { reverseParamArray(flowReference, modelService, panel); }
                    return;
                case "addParam":
                    if (modelService && flowReference) { addParamToGeneral(flowReference, modelService); }
                    return;
                case "addParamWithName":
                    if (modelService && flowReference) { addParamToGeneralWithName(flowReference, modelService, message.data?.name, panel); }
                    return;

                case "updateOutputVar":
                    if (modelService && flowReference) { updateOutputVarProperty(message.data, flowReference, modelService); }
                    return;
                case "removeOutputVarProperty":
                    if (modelService && flowReference) { removeOutputVarProperty(message, flowReference, modelService); }
                    return;
                case "moveOutputVar":
                    if (modelService && flowReference) { 
                        // Handle both Forms format (direct fromIndex/toIndex) and General Flow format (data wrapper)
                        const moveData = message.data ? message.data : { fromIndex: message.fromIndex, toIndex: message.toIndex };
                        moveOutputVarInArray(moveData, flowReference, modelService, panel); 
                    }
                    return;
                case "reverseOutputVar":
                    if (modelService && flowReference) { reverseOutputVarArray(flowReference, modelService, panel); }
                    return;
                case "addOutputVar":
                    if (modelService && flowReference) { addOutputVarToGeneral(flowReference, modelService); }
                    return;
                case "addOutputVarWithName":
                    if (modelService && flowReference) { addOutputVarToGeneralWithName(flowReference, modelService, message.data?.name, panel); }
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

function updateParamProperty(data, flowRef, modelService) {
    try {
        const { index, property, exists, value } = data || {};
        if (index === undefined || index === null || !property) { return; }
        const list = flowRef.objectWorkflowParam || (flowRef.objectWorkflowParam = []);
        const target = list[index];
        if (!target) { return; }
        if (exists) { target[property] = value; } else { delete target[property]; }
        if (typeof modelService.markUnsavedChanges === 'function') { modelService.markUnsavedChanges(); }
    } catch (e) { console.error('updateParamProperty error:', e); }
}

function removeParamProperty(message, flowRef, modelService) {
    try {
        const { index, property } = (message && message.data) || {};
        if (index === undefined || index === null || !property) { return; }
        const list = flowRef.objectWorkflowParam || [];
        if (!list[index]) { return; }
        delete list[index][property];
        if (typeof modelService.markUnsavedChanges === 'function') { modelService.markUnsavedChanges(); }
    } catch (e) { console.error('removeParamProperty error:', e); }
}

function moveParamInArray(data, flowRef, modelService, panel) {
    try {
        const { fromIndex, toIndex } = data || {};
        const list = flowRef.objectWorkflowParam || [];
        if (fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length) { return; }
        const [moved] = list.splice(fromIndex, 1);
        list.splice(toIndex, 0, moved);
        if (typeof modelService.markUnsavedChanges === 'function') { modelService.markUnsavedChanges(); }
        panel.webview.postMessage({ command: 'refreshParamsList', data: list, newSelection: toIndex });
    } catch (e) { console.error('moveParamInArray error:', e); }
}

function reverseParamArray(flowRef, modelService, panel) {
    try {
        const list = flowRef.objectWorkflowParam || [];
        list.reverse();
        if (typeof modelService.markUnsavedChanges === 'function') { modelService.markUnsavedChanges(); }
        panel.webview.postMessage({ command: 'refreshParamsList', data: list, newSelection: 0 });
    } catch (e) { console.error('reverseParamArray error:', e); }
}

function addParamToGeneral(flowReference, modelService) {
    if (!flowReference || !modelService) { return; }
    try {
        const flow = flowReference;
        if (!flow.objectWorkflowParam) { flow.objectWorkflowParam = []; }
        const newParam = { name: `Param${flow.objectWorkflowParam.length + 1}` };
        flow.objectWorkflowParam.push(newParam);
        if (typeof modelService.markUnsavedChanges === 'function') { modelService.markUnsavedChanges(); }
        vscode.commands.executeCommand("appdna.refresh");
    } catch (e) { console.error('addParamToGeneral error:', e); }
}

function addParamToGeneralWithName(flowReference, modelService, name, panel) {
    if (!flowReference || !modelService || !name) { return; }
    try {
        const flow = flowReference;
        if (!flow.objectWorkflowParam) { flow.objectWorkflowParam = []; }
        const newParam = { name };
        flow.objectWorkflowParam.push(newParam);
        if (typeof modelService.markUnsavedChanges === 'function') { modelService.markUnsavedChanges(); }
        if (panel && panel.webview) {
            panel.webview.postMessage({ command: 'refreshParamsList', data: flow.objectWorkflowParam, newSelection: flow.objectWorkflowParam.length - 1 });
        }
        vscode.commands.executeCommand("appdna.refresh");
    } catch (e) { console.error('addParamToGeneralWithName error:', e); }
}

function updateOutputVarProperty(data, flowRef, modelService) {
    try {
        const { index, property, exists, value } = data || {};
        if (index === undefined || index === null || !property) { return; }
        const list = flowRef.objectWorkflowOutputVar || (flowRef.objectWorkflowOutputVar = []);
        const target = list[index];
        if (!target) { return; }
        if (exists) { target[property] = value; } else { delete target[property]; }
        if (typeof modelService.markUnsavedChanges === 'function') { modelService.markUnsavedChanges(); }
    } catch (e) { console.error('updateOutputVarProperty error:', e); }
}

function removeOutputVarProperty(message, flowRef, modelService) {
    try {
        const { index, property } = (message && message.data) || {};
        if (index === undefined || index === null || !property) { return; }
        const list = flowRef.objectWorkflowOutputVar || [];
        if (!list[index]) { return; }
        delete list[index][property];
        if (typeof modelService.markUnsavedChanges === 'function') { modelService.markUnsavedChanges(); }
    } catch (e) { console.error('removeOutputVarProperty error:', e); }
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
    } catch (e) { console.error('moveOutputVarInArray error:', e); }
}

function reverseOutputVarArray(flowRef, modelService, panel) {
    try {
        const list = flowRef.objectWorkflowOutputVar || [];
        list.reverse();
        if (typeof modelService.markUnsavedChanges === 'function') { modelService.markUnsavedChanges(); }
        panel.webview.postMessage({ command: 'refreshOutputVarsList', data: list, newSelection: 0 });
    } catch (e) { console.error('reverseOutputVarArray error:', e); }
}

function addOutputVarToGeneral(flowReference, modelService) {
    if (!flowReference || !modelService) { return; }
    try {
        const flow = flowReference;
        if (!flow.objectWorkflowOutputVar) { flow.objectWorkflowOutputVar = []; }
        const newOutputVar = { name: `OutputVar${flow.objectWorkflowOutputVar.length + 1}` };
        flow.objectWorkflowOutputVar.push(newOutputVar);
        if (typeof modelService.markUnsavedChanges === 'function') { modelService.markUnsavedChanges(); }
        vscode.commands.executeCommand("appdna.refresh");
    } catch (e) { console.error('addOutputVarToGeneral error:', e); }
}

function addOutputVarToGeneralWithName(flowReference, modelService, outputVarName, panel) {
    if (!flowReference || !modelService || !outputVarName) { return; }
    try {
        const flow = flowReference;
        if (!flow.objectWorkflowOutputVar) { flow.objectWorkflowOutputVar = []; }
        const newOutputVar = { name: outputVarName };
        flow.objectWorkflowOutputVar.push(newOutputVar);
        if (typeof modelService.markUnsavedChanges === 'function') { modelService.markUnsavedChanges(); }
        if (panel && panel.webview) {
            panel.webview.postMessage({ command: 'refreshOutputVarsList', data: flow.objectWorkflowOutputVar, newSelection: flow.objectWorkflowOutputVar.length - 1 });
        }
        vscode.commands.executeCommand("appdna.refresh");
    } catch (e) { console.error('addOutputVarToGeneralWithName error:', e); }
}

function refreshAll() {
    for (const [id, entry] of openPanels.entries()) {
        try {
            const { panel, item, modelService } = entry;
            if (panel && !panel.disposed) {
                showGeneralFlowDetails(item, modelService);
            }
        } catch (e) { console.error('refreshAll generalFlow error:', e); }
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
    showGeneralFlowDetails,
    refreshAll,
    getOpenPanelItems,
    closeAllPanels
};

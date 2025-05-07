// SEARCH_TAG: command registration for VS Code extension
// Registers all extension commands.

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import JSZip from 'jszip';
import { JsonTreeItem } from '../models/types';
import { JsonTreeDataProvider } from '../providers/jsonTreeDataProvider';
import { openJsonEditor } from '../webviews/jsonEditor';
import { addFileCommand, addObjectCommand, removeObjectCommand, generateCodeCommand } from './objectCommands';
import { newProjectCommand, openProjectCommand, saveProjectCommand } from './projectCommands';
import * as objectDetailsView from '../webviews/objectDetailsView';
import { ModelService } from '../services/modelService';
import { openModelExplorer } from '../webviews/modelExplorerView';
import { showWelcomeView } from '../webviews/welcomeView';
import { showLoginView } from '../webviews/loginView';
import { AuthService } from '../services/authService';
import { showValidationRequestDetailsView } from '../webviews/validationRequestDetailsView'; // Import the new details view function

/**
 * Registers all commands for the AppDNA extension
 * @param context Extension context
 * @param jsonTreeDataProvider The tree data provider
 * @param appDNAFilePath Path to the app-dna.json file
 * @param modelService The model service instance
 */
export function registerCommands(
    context: vscode.ExtensionContext,
    jsonTreeDataProvider: JsonTreeDataProvider,
    appDNAFilePath: string | null,
    modelService: ModelService
): void {
    // Register refresh command
    const refreshCommand = vscode.commands.registerCommand('appdna.refresh', () => {
        jsonTreeDataProvider.refresh();
    });
    context.subscriptions.push(refreshCommand);

    // Register refresh view command for the title bar button
    context.subscriptions.push(
        vscode.commands.registerCommand("appdna.refreshView", async () => {
            // Reload the model file into memory
            if (appDNAFilePath) {
                try {
                    await modelService.loadFile(appDNAFilePath);
                } catch (err) {
                    vscode.window.showErrorMessage("Failed to reload model: " + (err && err.message ? err.message : err));
                }
            }
            // Refresh the tree view
            jsonTreeDataProvider.refresh();
            // Refresh all open object details webviews (if implemented)
            if (objectDetailsView && typeof objectDetailsView.refreshAll === "function") {
                objectDetailsView.refreshAll();
            }
        })
    );

    // Register edit command
    const editCommand = vscode.commands.registerCommand('appdna.editObject', (node: JsonTreeItem) => {
        openJsonEditor(context, node.label);
    });
    context.subscriptions.push(editCommand);

    // Register add file command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.addFile', async () => {
            await addFileCommand(context, appDNAFilePath, jsonTreeDataProvider, modelService);
        })
    );

    // Register add object command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.addObject', async () => {
            await addObjectCommand(appDNAFilePath, jsonTreeDataProvider, modelService);
        })
    );

    // Register remove object command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.removeObject', async (node: JsonTreeItem) => {
            await removeObjectCommand(node, appDNAFilePath, jsonTreeDataProvider, modelService);
        })
    );

    // Register new project command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.newProject', async () => {
            await newProjectCommand(jsonTreeDataProvider);
        })
    );

    // Register open project command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.openProject', async () => {
            await openProjectCommand(jsonTreeDataProvider);
        })
    );

    // Register save project command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.saveProject', async () => {
            await saveProjectCommand(jsonTreeDataProvider);
        })
    );

    // Register generate code command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.generateCode', async () => {
            await generateCodeCommand(appDNAFilePath, modelService);
        })
    );

    // Register show details command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showDetails', (node: JsonTreeItem) => {
            // Ensure the objectDetailsView module is loaded correctly
            if (!objectDetailsView || typeof objectDetailsView.showObjectDetails !== 'function') {
                vscode.window.showErrorMessage('Failed to load objectDetailsView module. Please check the extension setup.');
                return;
            }

            // Use the objectDetailsView implementation with modelService only
            objectDetailsView.showObjectDetails(node, modelService);
        })
    );
    
    // Register list all objects command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.listAllObjects', async () => {
            if (!modelService.isFileLoaded()) {
                vscode.window.showWarningMessage('No App DNA file is currently loaded.');
                return;
            }
            
            // Open the model explorer webview for objects
            openModelExplorer(context, modelService, 'objects');
        })
    );
    
    // Register list all reports command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.listAllReports', async () => {
            if (!modelService.isFileLoaded()) {
                vscode.window.showWarningMessage('No App DNA file is currently loaded.');
                return;
            }
            
            // Open the model explorer webview for reports
            openModelExplorer(context, modelService, 'reports');
        })
    );

    // Register save file command for the sidebar save button
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.saveFile', async () => {
            console.log("[DEBUG] Save command triggered");

            if (!modelService.isFileLoaded()) {
                vscode.window.showWarningMessage("No App DNA file is currently loaded.");
                return;
            }
            const model = modelService.getCurrentModel();
            if (!model) {
                vscode.window.showErrorMessage("No model is loaded in memory.");
                return;
            }
            // Debug: print the in-memory model structure
            try {
                console.log("[DEBUG] In-memory model before save:", JSON.stringify(model, null, 2));
            } catch (e) {
                console.log("[DEBUG] Could not stringify model");
            }
            try {
                await modelService.saveToFile(model);
                vscode.window.showInformationMessage("Model saved successfully.");
            } catch (err) {
                vscode.window.showErrorMessage("Failed to save model: " + (err && err.message ? err.message : err));
            }
        })
    );

    // Register show welcome view command
    const showWelcomeCommand = vscode.commands.registerCommand('appdna.showWelcome', () => {
        showWelcomeView(context);
    });
    context.subscriptions.push(showWelcomeCommand);
    
    // Register login command for Model Services
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.loginModelServices', async () => {
            // Initialize auth service with extension context
            const authService = AuthService.getInstance();
            authService.initialize(context);
            
            // Show login webview and refresh tree view on successful login
            await showLoginView(context, () => {
                // Refresh the tree view to update icons and available services
                jsonTreeDataProvider.refresh();
                vscode.commands.executeCommand('appdna.refreshView');
            });
        })
    );
    
    // Register logout command for Model Services
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.logoutModelServices', async () => {
            const authService = AuthService.getInstance();
            authService.initialize(context);
            
            // Confirm logout
            const confirmed = await vscode.window.showWarningMessage(
                "Are you sure you want to log out from Model Services?",
                { modal: true },
                "Yes", "No"
            );
            
            if (confirmed === "Yes") {
                await authService.logout();
                vscode.window.showInformationMessage("Logged out from Model Services");
                
                // Refresh the tree view to update icons and available services
                jsonTreeDataProvider.refresh();
            }
        })
    );

    // Register model validation command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.modelValidation', async () => {
            const panel = vscode.window.createWebviewPanel(
                'modelValidation',
                'Model Validation Requests',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                }
            );
            const scriptUri = panel.webview.asWebviewUri(
                vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'modelValidationView.js')
            );
            panel.webview.html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-">
                    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-eval' 'unsafe-inline' ${panel.webview.cspSource}; style-src 'unsafe-inline' ${panel.webview.cspSource};">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Model Validation Requests</title>
                    <style>
                        body { font-family: var(--vscode-font-family); margin: 0; padding: 0; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
                        table { border-collapse: collapse; width: 100%; margin-top: 1em; }
                        th, td { border: 1px solid var(--vscode-editorWidget-border); padding: 6px 10px; text-align: left; }
                        th { background: var(--vscode-sideBar-background); cursor: pointer; }
                        tr:nth-child(even) { background: var(--vscode-sideBarSectionHeader-background); }
                        #paging { margin: 1em 0; text-align: center; }
                        button { margin: 0 4px; }
                    </style>
                </head>
                <body>
                    <h2>Model Validation Requests</h2>
                    <div id="paging"></div>
                    <table id="validationTable"></table>
                    <script src="${scriptUri}"></script>
                </body>
                </html>
            `;
            // Handler for messages from the webview
            async function fetchAndSend(pageNumber, itemCountPerPage, orderByColumnName, orderByDescending) {
                const authService = require('../services/authService').AuthService.getInstance();
                const apiKey = await authService.getApiKey();
                if (!apiKey) {
                    panel.webview.postMessage({ command: 'setValidationData', data: { items: [], pageNumber: 1, itemCountPerPage: 10, recordsTotal: 0 } });
                    vscode.window.showErrorMessage('You must be logged in to use Model Validation.');
                    return;
                }
                const params = [
                    'PageNumber=' + encodeURIComponent(pageNumber || 1),
                    'ItemCountPerPage=' + encodeURIComponent(itemCountPerPage || 10),
                    'OrderByDescending=' + encodeURIComponent(orderByDescending ? 'true' : 'false')
                ];
                if (orderByColumnName) {
                    params.push('OrderByColumnName=' + encodeURIComponent(orderByColumnName));
                }
                const url = 'https://modelservicesapi.derivative-programming.com/api/v1_0/validation-requests?' + params.join('&');
                // Log the API call details
                console.log("[DEBUG] Model Validation API called. URL:", url, "Options:", { headers: { 'Api-Key': '[REDACTED]' } });
                try {
                    const res = await fetch(url, {
                        headers: { 'Api-Key': apiKey }
                    });
                    const data = await res.json();
                    panel.webview.postMessage({ command: 'setValidationData', data });
                } catch (err) {
                    panel.webview.postMessage({ command: 'setValidationData', data: { items: [], pageNumber: 1, itemCountPerPage: 10, recordsTotal: 0 } });
                    vscode.window.showErrorMessage('Failed to fetch validation requests: ' + (err && err.message ? err.message : err));
                }
            }
            panel.webview.onDidReceiveMessage(async (msg) => {
                console.log("[Extension] Received message from webview:", msg.command);
                if (msg.command === 'webviewReady') {
                    console.log("[Extension] Handling webviewReady");
                    await fetchAndSend(1, 10, 'modelValidationRequestRequestedUTCDateTime', true);
                } else if (msg.command === 'requestPage') {
                    console.log("[Extension] Handling requestPage:", msg.pageNumber, msg.itemCountPerPage, msg.orderByColumnName, msg.orderByDescending);
                    await fetchAndSend(msg.pageNumber, msg.itemCountPerPage, msg.orderByColumnName, msg.orderByDescending);
                } else if (msg.command === 'addValidationRequest') {
                    console.log("[Extension] Handling addValidationRequest:", msg.data);
                    // Retrieve API key for authenticated call
                    const authService = AuthService.getInstance();
                    authService.initialize(context);
                    const apiKey = await authService.getApiKey();
                    if (!apiKey) {
                        console.error("[Extension] No API key found for addValidationRequest");
                        vscode.window.showErrorMessage('You must be logged in to add a validation request.');
                        panel.webview.postMessage({ command: "validationRequestFailed" }); // Notify webview of failure
                        return;
                    }
                    // POST a new validation request with modelFileData
                    const desc = msg.data.description || '';
                    // Ensure model file path is available
                    if (!appDNAFilePath) {
                        console.error("[Extension] No model file path available for addValidationRequest");
                        vscode.window.showErrorMessage('No model file is loaded to attach to request.');
                        panel.webview.postMessage({ command: "validationRequestFailed" }); // Notify webview of failure
                        return;
                    }
                    // Read and encode model file
                    let modelFileData: string;
                    try {
                        // Read model JSON and create a ZIP archive
                        const fileContent = fs.readFileSync(appDNAFilePath, 'utf8');
                        const zip = new JSZip();
                        zip.file('model.json', fileContent);
                        const archive = await zip.generateAsync({ type: 'nodebuffer' });
                        modelFileData = archive.toString('base64');
                    } catch (e) {
                        console.error("[Extension] Failed to read or zip model file:", e);
                        vscode.window.showErrorMessage('Failed to read or zip model file for request: ' + (e.message || e));
                        panel.webview.postMessage({ command: "validationRequestFailed" }); // Notify webview of failure
                        return;
                    }
                    const payload = { description: desc, modelFileData };
                    const addUrl = 'https://modelservicesapi.derivative-programming.com/api/v1_0/validation-requests';
                    console.log("[Extension] Calling ADD API. URL:", addUrl);
                    try {
                        const res2 = await fetch(addUrl, {
                            method: 'POST',
                            headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        console.log("[Extension] ADD API response status:", res2.status);
                        if (!res2.ok) {
                            throw new Error(`API responded with status ${res2.status}`);
                        }
                        
                        // Notify webview that request was successful
                        console.log("[Extension] Sending validationRequestReceived to webview");
                        panel.webview.postMessage({ command: "validationRequestReceived" });
                    
                        // Refresh first page after adding
                        console.log("[Extension] Refreshing data after successful add...");
                        await fetchAndSend(1, 10, 'modelValidationRequestRequestedUTCDateTime', true);
                        console.log("[Extension] Data refresh complete after add.");
                    } catch (err) {
                        console.error("[Extension] Failed to add validation request:", err);
                        // Notify webview that request failed
                        console.log("[Extension] Sending validationRequestFailed to webview");
                        panel.webview.postMessage({ command: "validationRequestFailed" });
                        vscode.window.showErrorMessage('Failed to add validation request: ' + (err && err.message ? err.message : err));
                    }
                } else if (msg.command === 'showValidationRequestDetails') { // Handle showing details
                    console.log("[Extension] Handling showValidationRequestDetails for code:", msg.requestCode);
                    if (!msg.requestCode) {
                        vscode.window.showErrorMessage('Missing request code for details view.');
                        return;
                    }
                    // Call function to open the details webview
                    showValidationRequestDetailsView(context, msg.requestCode);
                } else if (msg.command === 'cancelValidationRequest') { // Handle cancel request from list view
                    console.log("[Extension] Handling cancelValidationRequest for code:", msg.requestCode);
                    if (!msg.requestCode) {
                        vscode.window.showErrorMessage('Missing request code for cancel operation.');
                        return;
                    }
                    
                    // Cancel the validation request
                    try {
                        const authService = AuthService.getInstance();
                        const apiKey = await authService.getApiKey();
                        
                        if (!apiKey) {
                            vscode.window.showErrorMessage('You must be logged in to cancel a validation request.');
                            panel.webview.postMessage({ command: "validationRequestFailed" });
                            return;
                        }
                        
                        const url = `https://modelservicesapi.derivative-programming.com/api/v1_0/validation-requests/${encodeURIComponent(msg.requestCode)}`;
                        console.log("[Extension] Sending cancel request to URL:", url);
                        
                        const response = await fetch(url, {
                            method: 'DELETE',
                            headers: { 'Api-Key': apiKey }
                        });
                        
                        if (!response.ok) {
                            throw new Error(`API responded with status ${response.status}`);
                        }
                        
                        console.log("[Extension] Validation request successfully cancelled");
                        vscode.window.showInformationMessage(`Validation request cancelled successfully.`);
                        
                        // Send success message back to webview to hide spinner and refresh
                        panel.webview.postMessage({ command: "validationRequestCancelled" });
                        
                        // Refresh the list after cancelling
                        await fetchAndSend(1, 10, 'modelValidationRequestRequestedUTCDateTime', true);
                    } catch (error) {
                        console.error("[Extension] Failed to cancel validation request:", error);
                        vscode.window.showErrorMessage(`Failed to cancel request: ${error.message}`);
                        panel.webview.postMessage({ command: "validationRequestFailed" });
                    }
                }
            });
        })
    );

    // Register model AI processing command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.modelAIProcessing', async () => {
            const panel = vscode.window.createWebviewPanel(
                'modelAIProcessing',
                'Model AI Processing Requests',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                }
            );
            const scriptUri = panel.webview.asWebviewUri(
                vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'modelAIProcessingView.js')
            );
            panel.webview.html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-">
                    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-eval' 'unsafe-inline' ${panel.webview.cspSource}; style-src 'unsafe-inline' ${panel.webview.cspSource};">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Model AI Processing Requests</title>
                    <style>
                        body { font-family: var(--vscode-font-family); margin: 0; padding: 0; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
                        table { border-collapse: collapse; width: 100%; margin-top: 1em; }
                        th, td { border: 1px solid var(--vscode-editorWidget-border); padding: 6px 10px; text-align: left; }
                        th { background: var(--vscode-sideBar-background); cursor: pointer; }
                        tr:nth-child(even) { background: var(--vscode-sideBarSectionHeader-background); }
                        #paging { margin: 1em 0; text-align: center; }
                        button { margin: 0 4px; }
                    </style>
                </head>
                <body>
                    <h2>Model AI Processing Requests</h2>
                    <div id="paging"></div>
                    <table id="processingTable"></table>
                    <script src="${scriptUri}"></script>
                </body>
                </html>
            `;
            
            // Handler for messages from the webview
            async function fetchAndSend(pageNumber, itemCountPerPage, orderByColumnName, orderByDescending) {
                const authService = require('../services/authService').AuthService.getInstance();
                const apiKey = await authService.getApiKey();
                if (!apiKey) {
                    panel.webview.postMessage({ command: 'setProcessingData', data: { items: [], pageNumber: 1, itemCountPerPage: 10, recordsTotal: 0 } });
                    vscode.window.showErrorMessage('You must be logged in to use Model AI Processing.');
                    return;
                }
                const params = [
                    'PageNumber=' + encodeURIComponent(pageNumber || 1),
                    'ItemCountPerPage=' + encodeURIComponent(itemCountPerPage || 10),
                    'OrderByDescending=' + encodeURIComponent(orderByDescending ? 'true' : 'false')
                ];
                if (orderByColumnName) {
                    params.push('OrderByColumnName=' + encodeURIComponent(orderByColumnName));
                }
                const url = 'https://modelservicesapi.derivative-programming.com/api/v1_0/prep-requests?' + params.join('&');
                // Log the API call details
                console.log("[DEBUG] Model AI Processing API called. URL:", url, "Options:", { headers: { 'Api-Key': '[REDACTED]' } });
                try {
                    const res = await fetch(url, {
                        headers: { 'Api-Key': apiKey }
                    });
                    const data = await res.json();
                    panel.webview.postMessage({ command: 'setProcessingData', data });
                } catch (err) {
                    panel.webview.postMessage({ command: 'setProcessingData', data: { items: [], pageNumber: 1, itemCountPerPage: 10, recordsTotal: 0 } });
                    vscode.window.showErrorMessage('Failed to fetch processing requests: ' + (err && err.message ? err.message : err));
                }
            }
            
            panel.webview.onDidReceiveMessage(async (msg) => {
                console.log("[Extension] Received message from webview:", msg.command);
                if (msg.command === 'webviewReady') {
                    console.log("[Extension] Handling webviewReady");
                    await fetchAndSend(1, 10, 'modelPrepRequestRequestedUTCDateTime', true);
                } else if (msg.command === 'requestPage') {
                    console.log("[Extension] Handling requestPage:", msg.pageNumber, msg.itemCountPerPage, msg.orderByColumnName, msg.orderByDescending);
                    await fetchAndSend(msg.pageNumber, msg.itemCountPerPage, msg.orderByColumnName, msg.orderByDescending);
                } else if (msg.command === 'addProcessingRequest') {
                    console.log("[Extension] Handling addProcessingRequest:", msg.data);
                    // Retrieve API key for authenticated call
                    const authService = AuthService.getInstance();
                    authService.initialize(context);
                    const apiKey = await authService.getApiKey();
                    if (!apiKey) {
                        console.error("[Extension] No API key found for addProcessingRequest");
                        vscode.window.showErrorMessage('You must be logged in to add a processing request.');
                        panel.webview.postMessage({ command: "processingRequestFailed" }); // Notify webview of failure
                        return;
                    }
                    // POST a new processing request with modelFileData
                    const desc = msg.data.description || '';
                    // Ensure model file path is available
                    if (!appDNAFilePath) {
                        console.error("[Extension] No model file path available for addProcessingRequest");
                        vscode.window.showErrorMessage('No model file is loaded to attach to request.');
                        panel.webview.postMessage({ command: "processingRequestFailed" }); // Notify webview of failure
                        return;
                    }
                    // Read and encode model file
                    let modelFileData: string;
                    try {
                        // Read model JSON and create a ZIP archive
                        const fileContent = fs.readFileSync(appDNAFilePath, 'utf8');
                        const zip = new JSZip();
                        zip.file('model.json', fileContent);
                        const archive = await zip.generateAsync({ type: 'nodebuffer' });
                        modelFileData = archive.toString('base64');
                    } catch (e) {
                        console.error("[Extension] Failed to read or zip model file:", e);
                        vscode.window.showErrorMessage('Failed to read or zip model file for request: ' + (e.message || e));
                        panel.webview.postMessage({ command: "processingRequestFailed" }); // Notify webview of failure
                        return;
                    }
                    const payload = { description: desc, modelFileData };
                    const addUrl = 'https://modelservicesapi.derivative-programming.com/api/v1_0/prep-requests';
                    console.log("[Extension] Calling ADD API. URL:", addUrl);
                    try {
                        const res2 = await fetch(addUrl, {
                            method: 'POST',
                            headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        console.log("[Extension] ADD API response status:", res2.status);
                        if (!res2.ok) {
                            throw new Error(`API responded with status ${res2.status}`);
                        }
                        
                        // Notify webview that request was successful
                        console.log("[Extension] Sending processingRequestReceived to webview");
                        panel.webview.postMessage({ command: "processingRequestReceived" });
                    
                        // Refresh first page after adding
                        console.log("[Extension] Refreshing data after successful add...");
                        await fetchAndSend(1, 10, 'modelPrepRequestRequestedUTCDateTime', true);
                        console.log("[Extension] Data refresh complete after add.");
                    } catch (err) {
                        console.error("[Extension] Failed to add processing request:", err);
                        // Notify webview that request failed
                        console.log("[Extension] Sending processingRequestFailed to webview");
                        panel.webview.postMessage({ command: "processingRequestFailed" });
                        vscode.window.showErrorMessage('Failed to add processing request: ' + (err && err.message ? err.message : err));
                    }
                } else if (msg.command === 'cancelProcessingRequest') {
                    console.log("[Extension] Handling cancelProcessingRequest for code:", msg.requestCode);
                    if (!msg.requestCode) {
                        vscode.window.showErrorMessage('Missing request code for cancel operation.');
                        return;
                    }
                    
                    // Cancel the processing request
                    try {
                        const authService = AuthService.getInstance();
                        const apiKey = await authService.getApiKey();
                        
                        if (!apiKey) {
                            vscode.window.showErrorMessage('You must be logged in to cancel a processing request.');
                            panel.webview.postMessage({ command: "processingRequestFailed" });
                            return;
                        }
                        
                        const url = `https://modelservicesapi.derivative-programming.com/api/v1_0/prep-requests/${encodeURIComponent(msg.requestCode)}`;
                        console.log("[Extension] Sending cancel request to URL:", url);
                        
                        const response = await fetch(url, {
                            method: 'DELETE',
                            headers: { 'Api-Key': apiKey }
                        });
                        
                        if (!response.ok) {
                            throw new Error(`API responded with status ${response.status}`);
                        }
                        
                        console.log("[Extension] Processing request successfully cancelled");
                        vscode.window.showInformationMessage(`Processing request cancelled successfully.`);
                        
                        // Send success message back to webview to hide spinner and refresh
                        panel.webview.postMessage({ command: "processingRequestCancelled" });
                        
                        // Refresh the list after cancelling
                        await fetchAndSend(1, 10, 'modelPrepRequestRequestedUTCDateTime', true);
                    } catch (error) {
                        console.error("[Extension] Failed to cancel processing request:", error);
                        vscode.window.showErrorMessage(`Failed to cancel request: ${error.message}`);
                        panel.webview.postMessage({ command: "processingRequestFailed" });
                    }
                }
            });
        })
    );

    // Register model fabrication command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.modelFabrication', async () => {
            const panel = vscode.window.createWebviewPanel(
                'modelFabrication',
                'Model Fabrication Requests',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                }
            );
            const scriptUri = panel.webview.asWebviewUri(
                vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'modelFabricationView.js')
            );
            panel.webview.html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-eval' 'unsafe-inline' ${panel.webview.cspSource}; style-src 'unsafe-inline' ${panel.webview.cspSource};">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Model Fabrication Requests</title>
                    <style>
                        body { font-family: var(--vscode-font-family); margin: 0; padding: 0; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
                        table { border-collapse: collapse; width: 100%; margin-top: 1em; }
                        th, td { border: 1px solid var(--vscode-editorWidget-border); padding: 6px 10px; text-align: left; }
                        th { background: var(--vscode-sideBar-background); cursor: pointer; }
                        tr:nth-child(even) { background: var(--vscode-sideBarSectionHeader-background); }
                        #paging { margin: 1em 0; text-align: center; }
                        button { margin: 0 4px; }
                    </style>
                </head>
                <body>
                    <h2>Model Fabrication Requests</h2>
                    <div id="paging"></div>
                    <table id="fabricationTable"></table>
                    <script src="${scriptUri}"></script>
                </body>
                </html>
            `;
            // Handler for messages from the webview
            async function fetchAndSend(pageNumber, itemCountPerPage, orderByColumnName, orderByDescending) {
                const authService = require('../services/authService').AuthService.getInstance();
                const apiKey = await authService.getApiKey();
                if (!apiKey) {
                    panel.webview.postMessage({ command: 'setFabricationData', data: { items: [], pageNumber: 1, itemCountPerPage: 10, recordsTotal: 0 } });
                    vscode.window.showErrorMessage('You must be logged in to use Model Fabrication.');
                    return;
                }
                const params = [
                    'PageNumber=' + encodeURIComponent(pageNumber || 1),
                    'ItemCountPerPage=' + encodeURIComponent(itemCountPerPage || 10),
                    'OrderByDescending=' + encodeURIComponent(orderByDescending ? 'true' : 'false')
                ];
                if (orderByColumnName) {
                    params.push('OrderByColumnName=' + encodeURIComponent(orderByColumnName));
                }
                const url = 'https://modelservicesapi.derivative-programming.com/api/v1_0/fabrication-requests?' + params.join('&');
                // Log the API call details
                console.log("[DEBUG] Model Fabrication API called. URL:", url, "Options:", { headers: { 'Api-Key': '[REDACTED]' } });
                try {
                    const res = await fetch(url, {
                        headers: { 'Api-Key': apiKey }
                    });
                    const data = await res.json();
                    panel.webview.postMessage({ command: 'setFabricationData', data });
                } catch (err) {
                    panel.webview.postMessage({ command: 'setFabricationData', data: { items: [], pageNumber: 1, itemCountPerPage: 10, recordsTotal: 0 } });
                    vscode.window.showErrorMessage('Failed to fetch fabrication requests: ' + (err && err.message ? err.message : err));
                }
            }
            
            panel.webview.onDidReceiveMessage(async (msg) => {
                console.log("[Extension] Received message from webview:", msg.command);
                if (msg.command === 'webviewReady') {
                    console.log("[Extension] Handling webviewReady");
                    await fetchAndSend(1, 10, 'modelFabricationRequestRequestedUTCDateTime', true);
                } else if (msg.command === 'requestPage') {
                    console.log("[Extension] Handling requestPage:", msg.pageNumber, msg.itemCountPerPage, msg.orderByColumnName, msg.orderByDescending);
                    await fetchAndSend(msg.pageNumber, msg.itemCountPerPage, msg.orderByColumnName, msg.orderByDescending);
                } else if (msg.command === 'addFabricationRequest') {
                    console.log("[Extension] Handling addFabricationRequest:", msg.data);
                    // Retrieve API key for authenticated call
                    const authService = AuthService.getInstance();
                    authService.initialize(context);
                    const apiKey = await authService.getApiKey();
                    if (!apiKey) {
                        console.error("[Extension] No API key found for addFabricationRequest");
                        vscode.window.showErrorMessage('You must be logged in to add a fabrication request.');
                        panel.webview.postMessage({ command: "fabricationRequestFailed" }); // Notify webview of failure
                        return;
                    }
                    // POST a new fabrication request with modelFileData
                    const desc = msg.data.description || '';
                    // Ensure model file path is available
                    if (!appDNAFilePath) {
                        console.error("[Extension] No model file path available for addFabricationRequest");
                        vscode.window.showErrorMessage('No model file is loaded to attach to request.');
                        panel.webview.postMessage({ command: "fabricationRequestFailed" }); // Notify webview of failure
                        return;
                    }
                    // Read and encode model file
                    let modelFileData: string;
                    try {
                        // Read model JSON and create a ZIP archive
                        const fileContent = fs.readFileSync(appDNAFilePath, 'utf8');
                        const zip = new JSZip();
                        zip.file('model.json', fileContent);
                        const archive = await zip.generateAsync({ type: 'nodebuffer' });
                        modelFileData = archive.toString('base64');
                    } catch (e) {
                        console.error("[Extension] Failed to read or zip model file:", e);
                        vscode.window.showErrorMessage('Failed to read or zip model file for request: ' + (e.message || e));
                        panel.webview.postMessage({ command: "fabricationRequestFailed" }); // Notify webview of failure
                        return;
                    }
                    const payload = { description: desc, modelFileData };
                    const addUrl = 'https://modelservicesapi.derivative-programming.com/api/v1_0/fabrication-requests';
                    console.log("[Extension] Calling ADD API. URL:", addUrl);
                    try {
                        const res2 = await fetch(addUrl, {
                            method: 'POST',
                            headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        console.log("[Extension] ADD API response status:", res2.status);
                        if (!res2.ok) {
                            throw new Error(`API responded with status ${res2.status}`);
                        }
                        
                        // Notify webview that request was successful
                        console.log("[Extension] Sending fabricationRequestReceived to webview");
                        panel.webview.postMessage({ command: "fabricationRequestReceived" });
                    
                        // Refresh first page after adding
                        console.log("[Extension] Refreshing data after successful add...");
                        await fetchAndSend(1, 10, 'modelFabricationRequestRequestedUTCDateTime', true);
                        console.log("[Extension] Data refresh complete after add.");
                    } catch (err) {
                        console.error("[Extension] Failed to add fabrication request:", err);
                        // Notify webview that request failed
                        console.log("[Extension] Sending fabricationRequestFailed to webview");
                        panel.webview.postMessage({ command: "fabricationRequestFailed" });
                        vscode.window.showErrorMessage('Failed to add fabrication request: ' + (err && err.message ? err.message : err));
                    }
                } else if (msg.command === 'showFabricationRequestDetails') { // Handle showing details
                    console.log("[Extension] Handling showFabricationRequestDetails for code:", msg.requestCode);
                    if (!msg.requestCode) {
                        vscode.window.showErrorMessage('Missing request code for details view.');
                        return;
                    }
                    // Call function to open the details webview if implemented
                    vscode.window.showInformationMessage(`Viewing details for fabrication request: ${msg.requestCode}`);
                } else if (msg.command === 'cancelFabricationRequest') { // Handle cancel request from list view
                    console.log("[Extension] Handling cancelFabricationRequest for code:", msg.requestCode);
                    if (!msg.requestCode) {
                        vscode.window.showErrorMessage('Missing request code for cancel operation.');
                        return;
                    }
                    
                    // Cancel the fabrication request
                    try {
                        const authService = AuthService.getInstance();
                        const apiKey = await authService.getApiKey();
                        
                        if (!apiKey) {
                            vscode.window.showErrorMessage('You must be logged in to cancel a fabrication request.');
                            panel.webview.postMessage({ command: "fabricationRequestFailed" });
                            return;
                        }
                        
                        const url = `https://modelservicesapi.derivative-programming.com/api/v1_0/fabrication-requests/${encodeURIComponent(msg.requestCode)}`;
                        console.log("[Extension] Sending cancel request to URL:", url);
                        
                        const response = await fetch(url, {
                            method: 'DELETE',
                            headers: { 'Api-Key': apiKey }
                        });
                        
                        if (!response.ok) {
                            throw new Error(`API responded with status ${response.status}`);
                        }
                        
                        console.log("[Extension] Fabrication request successfully cancelled");
                        vscode.window.showInformationMessage(`Fabrication request cancelled successfully.`);
                        
                        // Send success message back to webview to hide spinner and refresh
                        panel.webview.postMessage({ command: "fabricationRequestCancelled" });
                        
                        // Refresh the list after cancelling
                        await fetchAndSend(1, 10, 'modelFabricationRequestRequestedUTCDateTime', true);
                    } catch (error) {
                        console.error("[Extension] Failed to cancel fabrication request:", error);
                        vscode.window.showErrorMessage(`Failed to cancel request: ${error.message}`);
                        panel.webview.postMessage({ command: "fabricationRequestFailed" });
                    }
                }
            });
        })
    );
}
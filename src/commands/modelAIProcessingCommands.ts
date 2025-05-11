// filepath: c:\\VR\\Source\\DP\\vscode-extension\\src\\commands\\modelValidationCommands.ts
// Description: Handles registration of model validation related commands.
// Created: May 11, 2025

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import JSZip from 'jszip';
import { showValidationRequestDetailsView } from '../webviews/validationRequestDetailsView';
import { ModelService } from '../services/modelService';
import { AuthService } from '../services/authService'; // Assuming AuthService is in services

export function registerModelAIProcessingCommands(
    context: vscode.ExtensionContext,
    appDNAFilePath: string | null,
    modelService: ModelService
): void {
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
                if (msg.command === 'ModelAIProcessingWebviewReady') {
                    console.log("[Extension] Handling ModelAIProcessingWebviewReady");
                    await fetchAndSend(1, 10, 'modelPrepRequestRequestedUTCDateTime', true);
                } else if (msg.command === 'ModelAIProcessingRequestPage') {
                    console.log("[Extension] Handling ModelAIProcessingRequestPage:", msg.pageNumber, msg.itemCountPerPage, msg.orderByColumnName, msg.orderByDescending);
                    await fetchAndSend(msg.pageNumber, msg.itemCountPerPage, msg.orderByColumnName, msg.orderByDescending);                } else if (msg.command === 'modelAIProcessingGetRootNodeProjectInfo') {
                    // Provide projectName and projectVersionNumber from the in-memory rootModel
                    if (modelService && modelService.isFileLoaded()) {
                        const rootModel = modelService.getCurrentModel();
                        panel.webview.postMessage({
                            command: 'modelAIProcessingSetRootNodeProjectInfo',
                            projectName: rootModel?.projectName || '',
                            projectVersionNumber: rootModel?.projectVersionNumber || ''
                        });
                    } else {
                        panel.webview.postMessage({
                            command: 'modelAIProcessingSetRootNodeProjectInfo',
                            projectName: '',
                            projectVersionNumber: ''
                        });
                    }
                } else if (msg.command === 'ModelAIProcessingAddRequest') {
                    console.log("[Extension] Handling ModelAIProcessingAddRequest:", msg.data);
                    // Retrieve API key for authenticated call
                    const authService = AuthService.getInstance();
                    authService.initialize(context);
                    const apiKey = await authService.getApiKey();
                    if (!apiKey) {
                        console.error("[Extension] No API key found for ModelAIProcessingAddRequest");
                        vscode.window.showErrorMessage('You must be logged in to add a processing request.');
                        panel.webview.postMessage({ command: "ModelAIProcessingRequestFailed" }); // Notify webview of failure
                        return;
                    }
                    // POST a new processing request with modelFileData
                    const desc = msg.data.description || '';
                    // Ensure model file path is available
                    if (!appDNAFilePath) {
                        console.error("[Extension] No model file path available for ModelAIProcessingAddRequest");
                        vscode.window.showErrorMessage('No model file is loaded to attach to request.');
                        panel.webview.postMessage({ command: "ModelAIProcessingRequestFailed" }); // Notify webview of failure
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
                        panel.webview.postMessage({ command: "ModelAIProcessingRequestFailed" }); // Notify webview of failure
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
                        console.log("[Extension] Sending ModelAIProcessingRequestReceived to webview");
                        panel.webview.postMessage({ command: "ModelAIProcessingRequestReceived" });
                    
                        // Refresh first page after adding
                        console.log("[Extension] Refreshing data after successful add...");
                        await fetchAndSend(1, 10, 'modelPrepRequestRequestedUTCDateTime', true);
                        console.log("[Extension] Data refresh complete after add.");
                    } catch (err) {
                        console.error("[Extension] Failed to add processing request:", err);
                        // Notify webview that request failed
                        console.log("[Extension] Sending ModelAIProcessingRequestFailed to webview");
                        panel.webview.postMessage({ command: "ModelAIProcessingRequestFailed" });
                        vscode.window.showErrorMessage('Failed to add processing request: ' + (err && err.message ? err.message : err));
                    }
                } else if (msg.command === 'ModelAIProcessingShowRequestDetails') { // Handle showing details
                    console.log("[Extension] Handling ModelAIProcessingShowRequestDetails for code:", msg.requestCode);
                    if (!msg.requestCode) {
                        vscode.window.showErrorMessage('Missing request code for details view.');
                        return;
                    }
                    // Call function to open the details webview if implemented
                    vscode.window.showInformationMessage(`Viewing details for processing request: ${msg.requestCode}`);
                } else if (msg.command === 'ModelAIProcessingCancelRequest') { // Handle cancel request from list view
                    console.log("[Extension] Handling ModelAIProcessingCancelRequest for code:", msg.requestCode);
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
                            panel.webview.postMessage({ command: "ModelAIProcessingRequestFailed" });
                            return;
                        }
                          const url = `https://modelservicesapi.derivative-programming.com/api/v1_0/prep-requests?modelPrepRequestCode=${encodeURIComponent(msg.requestCode)}`;
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
                        panel.webview.postMessage({ command: "ModelAIProcessingRequestCancelled" });
                        
                        // Refresh the list after cancelling
                        await fetchAndSend(1, 10, 'modelPrepRequestRequestedUTCDateTime', true);
                    } catch (error) {
                        console.error("[Extension] Failed to cancel processing request:", error);
                        vscode.window.showErrorMessage(`Failed to cancel request: ${error.message}`);
                        panel.webview.postMessage({ command: "ModelAIProcessingRequestFailed" });
                    }                } else if (msg.command === 'ModelAIProcessingShowDetails') {
                    console.log("[Extension] Handling ModelAIProcessingShowDetails for item:", msg.item);
                    if (!msg.item) {
                        vscode.window.showErrorMessage('Missing item data for details.');
                        return;
                    }
                    // Implement detailed view for the processing item if needed
                    vscode.window.showInformationMessage(`Viewing detailed information for processing request`);
                } else if (msg.command === 'ModelAIProcessingFetchRequestDetails') {
                    console.log("[Extension] Handling ModelAIProcessingFetchRequestDetails for code:", msg.requestCode);
                    if (!msg.requestCode) {
                        panel.webview.postMessage({ 
                            command: "ModelAIProcessingDetailsError", 
                            error: "Missing request code for details." 
                        });
                        return;
                    }
                    
                    try {
                        // Fetch the details for the specific request
                        const authService = AuthService.getInstance();
                        const apiKey = await authService.getApiKey();
                        
                        if (!apiKey) {
                            panel.webview.postMessage({ 
                                command: "ModelAIProcessingDetailsError", 
                                error: "You must be logged in to view request details." 
                            });
                            return;
                        }
                          // Construct URL for fetching a specific processing request details using query parameter
                        const url = `https://modelservicesapi.derivative-programming.com/api/v1_0/prep-requests?modelPrepRequestCode=${encodeURIComponent(msg.requestCode)}`;
                        console.log("[Extension] Fetching processing request details from URL:", url);
                        
                        const response = await fetch(url, {
                            headers: { 'Api-Key': apiKey }
                        });
                          if (!response.ok) {
                            throw new Error(`API responded with status ${response.status}`);
                        }
                        
                        const responseData = await response.json();
                        console.log("[Extension] Processing request details fetched successfully:", responseData);
                        
                        // Extract the first item from the items array if it exists
                        if (responseData.items && Array.isArray(responseData.items) && responseData.items.length > 0) {
                            const details = responseData.items[0];
                            panel.webview.postMessage({ 
                                command: "ModelAIProcessingRequestDetailsData", 
                                data: details 
                            });
                        } else {
                            panel.webview.postMessage({ 
                                command: "ModelAIProcessingDetailsError", 
                                error: 'No details found for this processing request.' 
                            });
                        }
                    } catch (error) {
                        console.error("[Extension] Failed to fetch processing request details:", error);
                        panel.webview.postMessage({ 
                            command: "ModelAIProcessingDetailsError", 
                            error: `Failed to fetch request details: ${error.message}` 
                        });
                    }
                }
            });
        })
    );
}

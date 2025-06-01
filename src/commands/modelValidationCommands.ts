// filepath: c:\\VR\\Source\\DP\\vscode-extension\\src\\commands\\modelValidationCommands.ts
// Description: Handles registration of model validation related commands.
// Created: May 11, 2025

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import JSZip from 'jszip';
import { ModelService } from '../services/modelService';
import { AuthService } from '../services/authService'; // Assuming AuthService is in services
import { handleApiError } from '../utils/apiErrorHandler';
import { getWorkspaceRoot, getValidationReportsPath, getValidationChangeRequestsPath, getCompatibleFilePath } from '../utils/appDnaFolderUtils';

// Track active panels to avoid duplicates
const activePanels = new Map<string, vscode.WebviewPanel>();

export function registerModelValidationCommands(
    context: vscode.ExtensionContext,
    appDNAFilePath: string | null,
    modelService: ModelService
): void {
        // Register model validation command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.modelValidation', async () => {
            // Create a consistent panel ID
            const panelId = 'modelValidation';
            console.log(`modelValidation command called (panelId: ${panelId})`);
            
            // Check if panel already exists
            if (activePanels.has(panelId)) {
                console.log(`Panel already exists for model validation, revealing existing panel`);
                // Panel exists, reveal it instead of creating a new one
                activePanels.get(panelId)?.reveal(vscode.ViewColumn.One);
                return;
            }
            
            // Create new panel if one doesn't exist
            const panel = vscode.window.createWebviewPanel(
                'modelValidation',
                'Model Validation Requests',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                }
            );
            
            // Track this panel
            console.log(`Adding new panel to activePanels with id: ${panelId}`);
            activePanels.set(panelId, panel);
            
            // Remove from tracking when disposed
            panel.onDidDispose(() => {
                console.log(`Panel disposed, removing from tracking: ${panelId}`);
                activePanels.delete(panelId);
            });
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
                try {                        const res = await fetch(url, {
                            headers: { 'Api-Key': apiKey }
                        });
                        
                        // Check for unauthorized errors
                        if (await handleApiError(context, res, 'Failed to fetch validation data')) {
                            // If true, the error was handled (was a 401)
                            panel.webview.postMessage({ 
                                command: 'modelValidationSetValidationData', 
                                data: { items: [], pageNumber: 1, itemCountPerPage: 10, recordsTotal: 0 } 
                            });
                            return;
                        }
                        
                        const data = await res.json();
                        panel.webview.postMessage({ command: 'modelValidationSetValidationData', data });
                } catch (err) {
                    panel.webview.postMessage({ command: 'modelValidationSetValidationData', data: { items: [], pageNumber: 1, itemCountPerPage: 10, recordsTotal: 0 } });
                    vscode.window.showErrorMessage('Failed to fetch validation requests: ' + (err && err.message ? err.message : err));
                }
            }
            panel.webview.onDidReceiveMessage(async (msg) => {
                console.log("[Extension] Received message from webview:", msg.command);
                if (msg.command === 'modelValidationGetRootNodeProjectInfo') {
                    // Provide projectName and projectVersionNumber from the in-memory rootModel
                    if (modelService && modelService.isFileLoaded()) {
                        const rootModel = modelService.getCurrentModel();
                        panel.webview.postMessage({
                            command: 'modelValidationSetRootNodeProjectInfo',
                            projectName: rootModel?.projectName || '',
                            projectVersionNumber: rootModel?.projectVersionNumber || ''
                        });
                    } else {
                        panel.webview.postMessage({
                            command: 'modelValidationSetRootNodeProjectInfo',
                            projectName: '',
                            projectVersionNumber: ''
                        });
                    }
                } else if (msg.command === 'modelValidationWebviewReady') {
                    console.log("[Extension] Handling modelValidationWebviewReady");
                    await fetchAndSend(1, 10, 'modelValidationRequestRequestedUTCDateTime', true);
                } else if (msg.command === 'modelValidationRequestPage') {
                    console.log("[Extension] Handling modelValidationRequestPage:", msg.pageNumber, msg.itemCountPerPage, msg.orderByColumnName, msg.orderByDescending);
                    await fetchAndSend(msg.pageNumber, msg.itemCountPerPage, msg.orderByColumnName, msg.orderByDescending);
                } else if (msg.command === 'modelValidationAddValidationRequest') {
                    console.log("[Extension] Handling modelValidationAddValidationRequest:", msg.data);
                    // Retrieve API key for authenticated call
                    const authService = AuthService.getInstance();
                    authService.initialize(context);
                    const apiKey = await authService.getApiKey();
                    if (!apiKey) {
                        console.error("[Extension] No API key found for addValidationRequest");
                        vscode.window.showErrorMessage('You must be logged in to add a validation request.');
                        panel.webview.postMessage({ command: "modelValidationRequestFailed" }); // Notify webview of failure
                        return;
                    }
                    // POST a new validation request with modelFileData
                    const desc = msg.data.description || '';
                    // Ensure model file path is available
                    if (!appDNAFilePath) {
                        console.error("[Extension] No model file path available for addValidationRequest");
                        vscode.window.showErrorMessage('No model file is loaded to attach to request.');
                        panel.webview.postMessage({ command: "modelValidationRequestFailed" }); // Notify webview of failure
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
                        panel.webview.postMessage({ command: "modelValidationRequestFailed" }); // Notify webview of failure
                        return;
                    }
                    const payload = { description: desc, modelFileData };
                    const addUrl = 'https://modelservicesapi.derivative-programming.com/api/v1_0/validation-requests';
                    console.log("[Extension] Calling ADD API. URL:", addUrl);
                    try {                        const res2 = await fetch(addUrl, {
                            method: 'POST',
                            headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        console.log("[Extension] ADD API response status:", res2.status);
                        
                        // Check for unauthorized errors
                        if (await handleApiError(context, res2, 'Failed to add model validation request')) {
                            // If true, the error was handled (was a 401)
                            panel.webview.postMessage({ command: "modelValidationRequestFailed" });
                            return;
                        }
                        
                        // Notify webview that request was successful
                        console.log("[Extension] Sending modelValidationRequestReceived to webview");
                        panel.webview.postMessage({ command: "modelValidationRequestReceived" });
                    
                        // Refresh first page after adding
                        console.log("[Extension] Refreshing data after successful add...");
                        await fetchAndSend(1, 10, 'modelValidationRequestRequestedUTCDateTime', true);
                        console.log("[Extension] Data refresh complete after add.");
                    } catch (err) {
                        console.error("[Extension] Failed to add model validation request:", err);
                        // Notify webview that request failed
                        console.log("[Extension] Sending modelValidationRequestFailed to webview");
                        panel.webview.postMessage({ command: "modelValidationRequestFailed" });
                        vscode.window.showErrorMessage('Failed to add model validation request: ' + (err && err.message ? err.message : err));
                    }
                } else if (msg.command === 'modelValidationFetchValidationDetails') {
                    console.log("[Extension] Handling modelValidationFetchValidationDetails for code:", msg.requestCode);
                    if (!msg.requestCode) {
                        vscode.window.showErrorMessage('Missing request code for details.');
                        panel.webview.postMessage({ 
                            command: 'modelValidationDetailsError', 
                            error: 'Missing request code' 
                        });
                        return;
                    }
                    
                    // Fetch validation request details directly and send to webview for modal display
                    try {
                        const authService = AuthService.getInstance();
                        const apiKey = await authService.getApiKey();
                        
                        if (!apiKey) {
                            console.error("[Extension] No API key found for fetchValidationDetails");
                            vscode.window.showErrorMessage('You must be logged in to view validation details.');
                            panel.webview.postMessage({ 
                                command: 'modelValidationDetailsError', 
                                error: 'Authentication required' 
                            });
                            return;
                        }
                        
                        // Use query string parameter for the request code instead of path parameter
                        const url = `https://modelservicesapi.derivative-programming.com/api/v1_0/validation-requests?modelValidationRequestCode=${encodeURIComponent(msg.requestCode)}`;
                        console.log("[Extension] Fetching validation details from URL:", url);
                        
                        const response = await fetch(url, {
                            headers: { 'Api-Key': apiKey }
                        });
                          // Check for unauthorized errors
                        if (await handleApiError(context, response, 'Failed to fetch validation details')) {
                            // If true, the error was handled (was a 401)
                            panel.webview.postMessage({ 
                                command: 'modelValidationDetailsError', 
                                error: 'Your session has expired. Please log in again.' 
                            });
                            return;
                        }
                        
                        const responseData = await response.json();
                        console.log("[Extension] Sending details to webview:", responseData);
                        
                        // Extract the first item from the items array if it exists
                        if (responseData.items && Array.isArray(responseData.items) && responseData.items.length > 0) {
                            const details = responseData.items[0];
                            panel.webview.postMessage({ command: 'modelValidationSetValidationDetails', data: details });
                        } else {
                            panel.webview.postMessage({ 
                                command: 'modelValidationDetailsError', 
                                error: 'No details found for this validation request.' 
                            });
                        }
                    } catch (error) {
                        console.error("[Extension] Failed to fetch validation details:", error);
                        panel.webview.postMessage({ 
                            command: 'modelValidationDetailsError', 
                            error: `Failed to load details: ${error.message}` 
                        });
                    }
                } else if (msg.command === 'modelValidationCheckReportExists') {
                    console.log("[Extension] Checking if report exists locally for request code:", msg.requestCode);
                    if (!msg.requestCode) {
                        panel.webview.postMessage({ 
                            command: 'modelValidationReportExistsResult', 
                            exists: false,
                            requestCode: msg.requestCode,
                            error: 'Missing request code'
                        });
                        return;
                    }
                    
                    try {
                        // Check if report file exists in the workspace using new .app_dna structure
                        const workspaceRoot = getWorkspaceRoot();
                        const validationReportsPath = getValidationReportsPath(workspaceRoot);
                        const reportPath = getCompatibleFilePath(workspaceRoot, 'validation_reports', validationReportsPath, `validation_report_${msg.requestCode}.html`);
                        const exists = fs.existsSync(reportPath);
                        
                        console.log("[Extension] Report exists:", exists, "for path:", reportPath);
                        panel.webview.postMessage({ 
                            command: 'modelValidationReportExistsResult', 
                            exists: exists,
                            requestCode: msg.requestCode
                        });
                    } catch (error) {
                        console.error("[Extension] Error checking if report exists:", error);
                        panel.webview.postMessage({ 
                            command: 'modelValidationReportExistsResult', 
                            exists: false,
                            requestCode: msg.requestCode,
                            error: error.message
                        });
                    }
                } else if (msg.command === 'modelValidationCheckChangeRequestsExist') {
                    console.log("[Extension] Checking if change requests exist for request code:", msg.requestCode);
                    if (!msg.requestCode) {
                        panel.webview.postMessage({ 
                            command: 'modelValidationChangeRequestsExistResult', 
                            exists: false,
                            requestCode: msg.requestCode,
                            error: 'Missing request code'
                        });
                        return;
                    }
                    
                    try {
                        // Check if change requests file exists in the workspace using new .app_dna structure
                        const workspaceRoot = getWorkspaceRoot();
                        const validationChangeRequestsPath = getValidationChangeRequestsPath(workspaceRoot);
                        const changeRequestsPath = getCompatibleFilePath(workspaceRoot, 'validation_change_requests', validationChangeRequestsPath, `${msg.requestCode}.json`);
                        const exists = fs.existsSync(changeRequestsPath);
                        
                        console.log("[Extension] Change requests file check. Path:", changeRequestsPath, "Exists:", exists);
                        panel.webview.postMessage({ 
                            command: 'modelValidationChangeRequestsExistResult', 
                            exists: exists,
                            requestCode: msg.requestCode
                        });
                    } catch (error) {
                        console.error("[Extension] Error checking if change requests exist:", error);
                        panel.webview.postMessage({ 
                            command: 'modelValidationChangeRequestsExistResult', 
                            exists: false,
                            requestCode: msg.requestCode,
                            error: error.message
                        });
                    }
                } else if (msg.command === 'modelValidationDownloadReport') {
                    console.log("[Extension] Handling modelValidationDownloadReport for request code:", msg.requestCode);
                    if (!msg.requestCode || !msg.url) {
                        vscode.window.showErrorMessage('Missing parameters for report download.');
                        panel.webview.postMessage({ 
                            command: 'modelValidationReportDownloadError', 
                            error: 'Missing request code or URL'
                        });
                        return;
                    }
                    
                    // Notify webview that download has started
                    panel.webview.postMessage({ command: 'modelValidationReportDownloadStarted' });
                    
                    try {
                        const authService = AuthService.getInstance();
                        const apiKey = await authService.getApiKey();
                        
                        if (!apiKey) {
                            throw new Error('Authentication required');
                        }
                        
                        // Create directory for reports if it doesn't exist using new .app_dna structure
                        const workspaceRoot = getWorkspaceRoot();
                        const reportsDir = getValidationReportsPath(workspaceRoot);
                        
                        // Download the report
                        const response = await fetch(msg.url, {
                            headers: { 'Api-Key': apiKey }
                        });
                        
                        if (!response.ok) {
                            throw new Error(`Failed to download report: ${response.status} ${response.statusText}`);
                        }
                        
                        // Get the report content as text
                        let reportContent = await response.text();

                        // --- Start: Logic to extract Change Requests from report content ---
                        const startMarker = "GENChangeRequestArrayStart";
                        const endMarker = "GENChangeRequestArrayEnd";
                        const startIndex = reportContent.indexOf(startMarker);
                        const endIndex = reportContent.indexOf(endMarker);

                        let changeRequestsExtracted = false;
                        if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
                            const jsonStartIndex = startIndex + startMarker.length;
                            const jsonContent = reportContent.substring(jsonStartIndex, endIndex).trim();
                            
                            const changeRequestsDirPath = getValidationChangeRequestsPath(workspaceRoot);
                            
                            try {
                                JSON.parse(jsonContent); // Validate JSON
                                const changeRequestsFilePath = path.join(changeRequestsDirPath, `${msg.requestCode}.json`);
                                fs.writeFileSync(changeRequestsFilePath, jsonContent, 'utf8');
                                console.log("[Extension] Change requests extracted and saved to:", changeRequestsFilePath);
                                
                                // Remove the change requests from the original report content
                                reportContent = reportContent.substring(0, startIndex) + reportContent.substring(endIndex + endMarker.length);
                                changeRequestsExtracted = true;
                            } catch (jsonError) {
                                console.error("[Extension] Error parsing or saving extracted change requests JSON:", jsonError);
                                vscode.window.showWarningMessage(`Failed to extract or save change requests from report: ${jsonError.message}`);
                                // Do not set changeRequestsExtracted to true, proceed with full report
                            }
                        }
                        // --- End: Logic to extract Change Requests ---
                        
                        // Save the main report content to file (now an HTML file)
                        const reportPath = path.join(reportsDir, `validation_report_${msg.requestCode}.html`);
                        fs.writeFileSync(reportPath, reportContent, 'utf8');
                        
                        // Open the report in editor
                        const reportUri = vscode.Uri.file(reportPath);
                        // await vscode.commands.executeCommand('vscode.open', reportUri); // Do not auto-open, let user click View Report
                        
                        // Notify webview of success
                        panel.webview.postMessage({ 
                            command: 'modelValidationReportDownloadSuccess', 
                            requestCode: msg.requestCode, 
                            changeRequestsExtracted: changeRequestsExtracted 
                        });
                    } catch (error) {
                        console.error("[Extension] Error downloading report:", error);
                        panel.webview.postMessage({ 
                            command: 'modelValidationReportDownloadError', 
                            error: error.message,
                            requestCode: msg.requestCode
                        });
                    }
                } else if (msg.command === 'modelValidationViewReport') {
                    console.log("[Extension] Handling modelValidationViewReport for request code:", msg.requestCode);
                    if (!msg.requestCode) {
                        vscode.window.showErrorMessage('Missing request code for viewing report.');
                        return;
                    }
                    
                    try {
                        // Open existing report using new .app_dna structure
                        const workspaceRoot = getWorkspaceRoot();
                        const validationReportsPath = getValidationReportsPath(workspaceRoot);
                        const reportPath = getCompatibleFilePath(workspaceRoot, 'validation_reports', validationReportsPath, `validation_report_${msg.requestCode}.html`);
                        
                        if (!fs.existsSync(reportPath)) {
                            throw new Error('Report file not found');
                        }
                        
                        // Open the report in editor
                        const reportUri = vscode.Uri.file(reportPath);
                        await vscode.commands.executeCommand('vscode.open', reportUri);
                    } catch (error) {
                        console.error("[Extension] Error viewing report:", error);
                        vscode.window.showErrorMessage(`Failed to open report: ${error.message}`);
                    }
                } else if (msg.command === 'modelValidationViewChangeRequests') {
                    console.log("[Extension] Handling modelValidationViewChangeRequests for request code:", msg.requestCode);
                    if (!msg.requestCode) {
                        vscode.window.showErrorMessage('Missing request code for viewing change requests.');
                        return;
                    }
                    
                    try {
                        // Import and use the showChangeRequestsListView function directly
                        const { showChangeRequestsListView } = require('../webviews/changeRequestsListView');
                        await showChangeRequestsListView(context, msg.requestCode);
                    } catch (error) {
                        console.error("[Extension] Error showing change requests:", error);
                        vscode.window.showErrorMessage(`Failed to show change requests: ${error.message}`);
                    }
                } else if (msg.command === 'modelValidationCancelValidationRequest') { // Handle cancel request from list view
                    console.log("[Extension] Handling modelValidationCancelValidationRequest for code:", msg.requestCode);
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
                            panel.webview.postMessage({ command: "modelValidationRequestFailed" });
                            return;
                        }
                        
                        const url = `https://modelservicesapi.derivative-programming.com/api/v1_0/validation-requests/${encodeURIComponent(msg.requestCode)}`;
                        console.log("[Extension] Sending cancel request to URL:", url);
                        
                        const response = await fetch(url, {
                            method: 'DELETE',
                            headers: { 'Api-Key': apiKey }
                        });
                          // Check for unauthorized errors
                        if (await handleApiError(context, response, 'Failed to cancel model validation request')) {
                            // If true, the error was handled (was a 401)
                            panel.webview.postMessage({ command: "modelValidationRequestFailed" });
                            return;
                        }
                        
                        console.log("[Extension] Validation request successfully cancelled");
                        vscode.window.showInformationMessage(`Validation request cancelled successfully.`);
                        
                        // Send success message back to webview to hide spinner and refresh
                        panel.webview.postMessage({ command: "modelValidationRequestCancelled" });
                        
                        // Refresh the list after cancelling
                        await fetchAndSend(1, 10, 'modelValidationRequestRequestedUTCDateTime', true);
                    } catch (error) {
                        console.error("[Extension] Failed to cancel model validation request:", error);
                        vscode.window.showErrorMessage(`Failed to cancel request: ${error.message}`);
                        panel.webview.postMessage({ command: "modelValidationRequestFailed" });
                    }
                }
            });
        })
    );    // Register show project settings command
}

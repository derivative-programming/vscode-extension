// Description: Handles registration of model AI processing related commands.
// Created: May 11, 2025
// Last modified: July 17, 2023

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import JSZip from 'jszip';
import { ModelService } from '../services/modelService';
import { AuthService } from '../services/authService';
import { getWorkspaceRoot, getAIProcessingReportsPath, getCompatibleFilePath } from '../utils/appDnaFolderUtils';

// Local helper function to handle API errors with panel/UI updates
function handleApiError(error: any, panel: vscode.WebviewPanel, errorCommand: string, defaultData: any = {}): void {
    console.error(`[ModelAIProcessingCommands] API Error:`, error);
    
    // Send error message to the webview panel
    panel.webview.postMessage({ 
        command: errorCommand, 
        ...defaultData
    });
    
    // Show error message in VS Code
    vscode.window.showErrorMessage('API Error: ' + (error && error.message ? error.message : error));
}

// Track active panels to avoid duplicates
const activePanels = new Map<string, vscode.WebviewPanel>();

export function registerModelAIProcessingCommands(
    context: vscode.ExtensionContext,
    appDNAFilePath: string | null,
    modelService: ModelService
): void {
    // Register model AI processing command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.modelAIProcessing', async () => {
            // Create a consistent panel ID
            const panelId = 'modelAIProcessing';
            console.log(`modelAIProcessing command called (panelId: ${panelId})`);
            
            // Check if panel already exists
            if (activePanels.has(panelId)) {
                console.log(`Panel already exists for model AI processing, revealing existing panel`);
                // Panel exists, reveal it instead of creating a new one
                activePanels.get(panelId)?.reveal(vscode.ViewColumn.One);
                return;
            }
            
            // Create new panel if one doesn't exist
            const panel = vscode.window.createWebviewPanel(
                'modelAIProcessing',
                'Model AI Processing Requests',
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
                    handleApiError(err, panel, 'setProcessingData', { items: [], pageNumber: 1, itemCountPerPage: 10, recordsTotal: 0 });
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
                } else if (msg.command === 'modelAIProcessingCheckUnsavedChanges') {
                    // Check if model has unsaved changes
                    const hasUnsavedChanges = modelService && modelService.hasUnsavedChangesInMemory();
                    panel.webview.postMessage({
                        command: 'modelAIProcessingUnsavedChangesStatus',
                        hasUnsavedChanges: hasUnsavedChanges || false
                    });
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
                        handleApiError(err, panel, "ModelAIProcessingRequestFailed");
                    }
                } else if (msg.command === 'ModelAIProcessingCancelRequest') {
                    // Handle cancel request from list view
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
                          const url = `https://modelservicesapi.derivative-programming.com/api/v1_0/prep-requests/${encodeURIComponent(msg.requestCode)}`;
                        console.log("[Extension] Sending cancel request to URL:", url);
                          const response = await fetch(url, {
                            method: 'DELETE',
                            headers: { 'Api-Key': apiKey }
                        });
                          // Check for unauthorized errors
                        if (response.status === 401) {
                            console.error("[Extension] Unauthorized error when canceling processing request");
                            
                            // Log the user out
                            const authService = AuthService.getInstance();
                            await authService.logout();
                            
                            // Show error message
                            vscode.window.showErrorMessage('Your session has expired. Please log in again.');
                            
                            // Show login view
                            await vscode.commands.executeCommand('appdna.login');
                            
                            // Notify webview
                            panel.webview.postMessage({ command: "ModelAIProcessingRequestFailed" });
                            return;
                        }
                        
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
                        handleApiError(error, panel, "ModelAIProcessingRequestFailed");
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
                        }                          // Construct URL for fetching a specific processing request details using query parameter
                        const url = `https://modelservicesapi.derivative-programming.com/api/v1_0/prep-requests?modelPrepRequestCode=${encodeURIComponent(msg.requestCode)}`;
                        console.log("[Extension] Fetching processing request details from URL:", url);
                        
                        const response = await fetch(url, {
                            headers: { 'Api-Key': apiKey }
                        });
                            // Check for unauthorized errors
                        if (response.status === 401) {
                            console.error("[Extension] Unauthorized error when fetching processing request details");
                            
                            // Log the user out
                            const authService = AuthService.getInstance();
                            await authService.logout();
                            
                            // Show error message
                            vscode.window.showErrorMessage('Your session has expired. Please log in again.');
                            
                            // Show login view
                            await vscode.commands.executeCommand('appdna.login');
                            
                            // Notify webview
                            panel.webview.postMessage({ 
                                command: "ModelAIProcessingDetailsError", 
                                error: 'Your session has expired. Please log in again.' 
                            });
                            return;
                        }
                        
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
                        handleApiError(error, panel, "ModelAIProcessingDetailsError", { error: `Failed to fetch request details: ${error.message}` });
                    }                } else if (msg.command === 'modelAIProcessingCheckReportExists') {
                    console.log("[Extension] Checking if report exists locally for request code:", msg.requestCode);
                    try {
                        const workspaceRoot = getWorkspaceRoot();
                        const aiProcessingReportsPath = getAIProcessingReportsPath(workspaceRoot);
                        const filePath = getCompatibleFilePath(workspaceRoot, '.app_dna_ai_processing_reports', aiProcessingReportsPath, `${msg.requestCode}.txt`);
                        
                        const exists = fs.existsSync(filePath);
                        
                        console.log("[Extension] Report file status:", exists ? "Exists" : "Does not exist", "at path:", filePath);
                        
                        // Inform the webview whether the file exists
                        panel.webview.postMessage({ 
                            command: 'modelAIProcessingReportExistsResult', 
                            exists: exists,
                            requestCode: msg.requestCode
                        });
                        
                    } catch (error) {
                        console.error("[Extension] Error checking if report exists:", error);
                        panel.webview.postMessage({ 
                            command: 'modelAIProcessingReportExistsResult', 
                            exists: false,
                            requestCode: msg.requestCode,
                            error: error.message
                        });
                    }
                } else if (msg.command === 'modelAIProcessingDownloadReport') {
                    console.log("[Extension] Received download report request for URL:", msg.url);
                    await downloadAIProcessingReport(panel, msg.url, msg.requestCode);
                } else if (msg.command === 'modelAIProcessingViewReport') {
                    console.log("[Extension] Opening existing report for request code:", msg.requestCode);
                    await openAIProcessingReport(panel, msg.requestCode);
                } else if (msg.command === 'modelAIProcessingMergeResults') {
                    console.log("[Extension] Handling modelAIProcessingMergeResults for URL:", msg.url);
                    console.log("[Extension] Request code:", msg.requestCode);
                      if (!msg.url || !msg.requestCode) {
                        console.error("[Extension] Missing URL or request code for merge operation");
                        vscode.window.showErrorMessage('Missing URL or request code for merge operation.');
                        return;
                    }
                    
                    // Ensure model file path is available
                    if (!appDNAFilePath) {
                        console.error("[Extension] No model file path available for merge operation");
                        vscode.window.showErrorMessage('No model file is loaded to merge results into.');
                        return;
                    }
                    
                    console.log("[Extension] Model file path for merge:", appDNAFilePath);
                    
                    // Check for unsaved changes before proceeding with merge
                    if (modelService.hasUnsavedChangesInMemory()) {
                        console.log("[Extension] Unsaved changes detected");
                        const result = await vscode.window.showWarningMessage(
                            'You have unsaved changes that will be lost if you merge AI processing results. Save changes first?',
                            'Save and Merge',
                            'Merge without Saving',
                            'Cancel'
                        );
                        
                        if (result === 'Save and Merge') {
                            try {
                                const model = modelService.getCurrentModel();
                                if (model) {
                                    await modelService.saveToFile(model);
                                }
                            } catch (saveError) {
                                console.error("[Extension] Error saving model:", saveError);
                                vscode.window.showErrorMessage(`Failed to save model: ${saveError.message}`);
                                return;
                            }
                        } else if (result === 'Cancel') {
                            console.log("[Extension] Merge operation cancelled");
                            return;
                        }
                        // If "Merge without Saving" was selected, we continue without saving
                    }
                    
                    try {
                        // Show progress notification
                        console.log("[Extension] Sending merge started notification to webview");
                        panel.webview.postMessage({ command: "modelAIProcessingMergeStarted" });
                        
                        // Retrieve API key for authenticated call
                        console.log("[Extension] Retrieving API key");
                        const authService = AuthService.getInstance();
                        authService.initialize(context);
                        const apiKey = await authService.getApiKey();
                        
                        if (!apiKey) {
                            console.error("[Extension] No API key available");
                            throw new Error('You must be logged in to merge results into model.');
                        }
                        
                        console.log("[Extension] API key retrieved successfully");
                          // Read model file and create a ZIP archive
                        console.log("[Extension] Reading model file:", appDNAFilePath);
                        const fileContent = fs.readFileSync(appDNAFilePath, 'utf8');
                        console.log("[Extension] File content length:", fileContent.length);
                        
                        // Create a ZIP archive like we do for model validation
                        console.log("[Extension] Creating ZIP archive for model file");
                        const zip = new JSZip();
                        zip.file('model.json', fileContent);
                        const archive = await zip.generateAsync({ type: 'nodebuffer' });
                        const modelFileData = archive.toString('base64');
                        console.log("[Extension] Zipped Base64 encoded length:", modelFileData.length);
                        
                        // Prepare payload for merge API
                        const payload = {
                            modelFileData,
                            additionsModelUrl: msg.url
                        };
                        
                        // Call merge API
                        const mergeUrl = 'https://modelservicesapi.derivative-programming.com/api/v1_0/model-merge';
                        console.log("[Extension] Calling model-merge API. URL:", mergeUrl);
                        console.log("[Extension] Payload additionsModelUrl:", payload.additionsModelUrl);
                        
                        console.log("[Extension] Sending API request");
                        const response = await fetch(mergeUrl, {
                            method: 'POST',
                            headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        
                        console.log("[Extension] API response status:", response.status);
                        console.log("[Extension] API response status text:", response.statusText);
                        
                        if (!response.ok) {
                            throw new Error(`API responded with status ${response.status}: ${response.statusText}`);
                        }
                          console.log("[Extension] Parsing API response JSON");
                        const mergeResult = await response.json();
                        console.log("[Extension] Merge result:", JSON.stringify(mergeResult));
                        
                        // Check if the operation was successful according to the API
                        if (mergeResult.success === false) {
                            console.error("[Extension] API reported merge failure:", mergeResult.message);
                            
                            // Get detailed error message
                            let errorMessage = 'API reported merge failure';
                            if (mergeResult.message) {
                                errorMessage += ': ' + mergeResult.message;
                            }
                            if (mergeResult.validationErrors && mergeResult.validationErrors.length > 0) {
                                errorMessage += ' - ' + mergeResult.validationErrors.join('; ');
                            }
                            
                            throw new Error(errorMessage);
                        }
                        
                        if (!mergeResult.resultModelUrl) {
                            console.error("[Extension] No resultModelUrl in response");
                            throw new Error('No result model URL returned from merge operation');
                        }
                        
                        // Download the merged model
                        console.log("[Extension] Downloading merged model from:", mergeResult.resultModelUrl);
                        const modelResponse = await fetch(mergeResult.resultModelUrl, {
                            headers: { 'Api-Key': apiKey }
                        });
                        
                        console.log("[Extension] Model download response status:", modelResponse.status);
                        
                        if (!modelResponse.ok) {
                            throw new Error(`Failed to download merged model: ${modelResponse.status}: ${modelResponse.statusText}`);
                        }
                        
                        // Parse the downloaded model
                        console.log("[Extension] Parsing downloaded model JSON");
                        const mergedModelData = await modelResponse.json();
                        console.log("[Extension] Merged model data keys:", Object.keys(mergedModelData));
                        console.log("[Extension] Has root property:", mergedModelData.hasOwnProperty('root'));
                        
                        // Update the model in memory and save to disk
                        console.log("[Extension] Updating model from JSON");
                        try {
                            await modelService.updateModelFromJson(mergedModelData);
                            console.log("[Extension] Model successfully updated");
                        } catch (updateError) {
                            console.error("[Extension] Error updating model:", updateError);
                            throw updateError;
                        }
                        
                        // Notify webview that merge was successful
                        console.log("[Extension] Sending merge success notification to webview");
                        panel.webview.postMessage({ command: "modelAIProcessingMergeSuccess" });
                        vscode.window.showInformationMessage('Successfully merged AI processing results into model.');
                    } catch (error) {
                        handleApiError(error, panel, "modelAIProcessingMergeError", { error: error.message });
                    }
                }
            });
        })
    );
}

/**
 * Downloads a report from the API and saves it to a local file.
 * @param panel The webview panel.
 * @param url The URL of the report to download.
 * @param requestCode The AI processing request code for naming the file.
 */
async function downloadAIProcessingReport(panel: vscode.WebviewPanel, url: string, requestCode: string) {
    const authService = AuthService.getInstance();
    const apiKey = await authService.getApiKey();

    if (!apiKey) {
        vscode.window.showErrorMessage('You must be logged in to download AI processing reports.');
        panel.webview.postMessage({ command: 'modelAIProcessingReportDownloadError', error: 'Authentication required.' });
        return;
    }

    if (!url) {
        vscode.window.showErrorMessage('No report URL available for this AI processing request.');
        panel.webview.postMessage({ command: 'modelAIProcessingReportDownloadError', error: 'No report URL available.' });
        return;
    }

    // Notify the webview that download has started
    panel.webview.postMessage({ command: 'modelAIProcessingReportDownloadStarted' });

    try {
        // Download the report content
        console.log("[Extension] Downloading report from URL:", url);
        const response = await fetch(url, {
            headers: { 'Api-Key': apiKey }
        });

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        // Get the report content as text
        const reportContent = await response.text();

        // Create AI processing reports directory if it doesn't exist using new .app_dna structure
        const workspaceRoot = getWorkspaceRoot();
        const processingDirPath = getAIProcessingReportsPath(workspaceRoot);

        // Save the report content to a file
        const filePath = path.join(processingDirPath, `${requestCode}.txt`);
        fs.writeFileSync(filePath, reportContent);

        // Don't open the file automatically - let the user hit 'View Report' to open it
        console.log("[Extension] Report downloaded and saved to:", filePath);
        panel.webview.postMessage({ command: 'modelAIProcessingReportDownloadSuccess' });
        vscode.window.showInformationMessage(`Report downloaded and saved to: ${filePath}`);
        
    } catch (error) {
        handleApiError(error, panel, 'modelAIProcessingReportDownloadError', { error: error.message });
    }
}

/**
 * Opens an existing report file in the editor.
 * @param panel The webview panel.
 * @param requestCode The AI processing request code.
 */
async function openAIProcessingReport(panel: vscode.WebviewPanel, requestCode: string) {
    try {
        const workspaceRoot = getWorkspaceRoot();
        const aiProcessingReportsPath = getAIProcessingReportsPath(workspaceRoot);
        const filePath = getCompatibleFilePath(workspaceRoot, '.app_dna_ai_processing_reports', aiProcessingReportsPath, `${requestCode}.txt`);
        
        // Check if file exists before trying to open it
        if (!fs.existsSync(filePath)) {
            throw new Error('Report file does not exist');
        }

        // Open the file in a new editor tab
        const fileUri = vscode.Uri.file(filePath);
        const document = await vscode.workspace.openTextDocument(fileUri);
        await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.One });
        
        panel.webview.postMessage({ command: 'reportOpened' });
        console.log("[Extension] Report opened successfully:", filePath);
        
    } catch (error) {
        handleApiError(error, panel, 'reportOpenError', { error: error.message });
    }
}

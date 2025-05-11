// filepath: c:\\VR\\Source\\DP\\vscode-extension\\src\\commands\\modelValidationCommands.ts
// Description: Handles registration of model validation related commands.
// Created: May 11, 2025

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import JSZip from 'jszip';
import { showFabricationRequestDetailsView } from '../webviews/fabricationRequestDetailsView';
import { ModelService } from '../services/modelService';
import { AuthService } from '../services/authService'; // Assuming AuthService is in services

export function registerModelFabricationCommands(
    context: vscode.ExtensionContext,
    appDNAFilePath: string | null,
    modelService: ModelService
): void {
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
                if (msg.command === 'ModelFabricationWebviewReady') {
                    console.log("[Extension] Handling ModelFabricationWebviewReady");
                    await fetchAndSend(1, 10, 'modelFabricationRequestRequestedUTCDateTime', true);
                } else if (msg.command === 'ModelFabricationRequestPage') {
                    console.log("[Extension] Handling ModelFabricationRequestPage:", msg.pageNumber, msg.itemCountPerPage, msg.orderByColumnName, msg.orderByDescending);
                    await fetchAndSend(msg.pageNumber, msg.itemCountPerPage, msg.orderByColumnName, msg.orderByDescending);                } else if (msg.command === 'modelFabricationGetRootNodeProjectInfo') {
                    // Provide projectName and projectVersionNumber from the in-memory rootModel
                    if (modelService && modelService.isFileLoaded()) {
                        const rootModel = modelService.getCurrentModel();
                        panel.webview.postMessage({
                            command: 'modelFabricationSetRootNodeProjectInfo',
                            projectName: rootModel?.projectName || '',
                            projectVersionNumber: rootModel?.projectVersionNumber || ''
                        });
                    } else {
                        panel.webview.postMessage({
                            command: 'modelFabricationSetRootNodeProjectInfo',
                            projectName: '',
                            projectVersionNumber: ''
                        });
                    }
                } else if (msg.command === 'ModelFabricationAddRequest') {
                    console.log("[Extension] Handling ModelFabricationAddRequest:", msg.data);
                    // Retrieve API key for authenticated call
                    const authService = AuthService.getInstance();
                    authService.initialize(context);
                    const apiKey = await authService.getApiKey();
                    if (!apiKey) {
                        console.error("[Extension] No API key found for ModelFabricationAddRequest");
                        vscode.window.showErrorMessage('You must be logged in to add a fabrication request.');
                        panel.webview.postMessage({ command: "ModelFabricationRequestFailed" }); // Notify webview of failure
                        return;
                    }
                    // POST a new fabrication request with modelFileData
                    const desc = msg.data.description || '';
                    // Ensure model file path is available
                    if (!appDNAFilePath) {
                        console.error("[Extension] No model file path available for ModelFabricationAddRequest");
                        vscode.window.showErrorMessage('No model file is loaded to attach to request.');
                        panel.webview.postMessage({ command: "ModelFabricationRequestFailed" }); // Notify webview of failure
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
                        panel.webview.postMessage({ command: "ModelFabricationRequestFailed" }); // Notify webview of failure
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
                        console.log("[Extension] Sending ModelFabricationRequestReceived to webview");
                        panel.webview.postMessage({ command: "ModelFabricationRequestReceived" });
                    
                        // Refresh first page after adding
                        console.log("[Extension] Refreshing data after successful add...");
                        await fetchAndSend(1, 10, 'modelFabricationRequestRequestedUTCDateTime', true);
                        console.log("[Extension] Data refresh complete after add.");
                    } catch (err) {
                        console.error("[Extension] Failed to add fabrication request:", err);
                        // Notify webview that request failed
                        console.log("[Extension] Sending ModelFabricationRequestFailed to webview");
                        panel.webview.postMessage({ command: "ModelFabricationRequestFailed" });
                        vscode.window.showErrorMessage('Failed to add fabrication request: ' + (err && err.message ? err.message : err));
                    }
                } else if (msg.command === 'ModelFabricationShowRequestDetails') { // Handle showing details
                    console.log("[Extension] Handling ModelFabricationShowRequestDetails for code:", msg.requestCode);
                    if (!msg.requestCode) {
                        vscode.window.showErrorMessage('Missing request code for details view.');
                        return;
                    }
                    // Use the showFabricationRequestDetailsView function
                    showFabricationRequestDetailsView(context, msg.requestCode);
                } else if (msg.command === 'ModelFabricationFetchRequestDetails') { // Handle fetch request details for showing in modal
                    console.log("[Extension] Handling ModelFabricationFetchRequestDetails for code:", msg.requestCode);
                    if (!msg.requestCode) {
                        vscode.window.showErrorMessage('Missing request code for details view.');
                        return;
                    }
                    
                    // Fetch fabrication request details and return to webview for modal display
                    try {
                        const authService = AuthService.getInstance();
                        const apiKey = await authService.getApiKey();
                        
                        if (!apiKey) {
                            console.error("[Extension] No API key found for fetch fabrication details");
                            vscode.window.showErrorMessage('You must be logged in to view fabrication details.');
                            return;
                        }
                        
                        // Use query string parameter for the request code
                        const url = `https://modelservicesapi.derivative-programming.com/api/v1_0/fabrication-requests?modelFabricationRequestCode=${encodeURIComponent(msg.requestCode)}`;
                        console.log("[Extension] Fetching fabrication details from URL:", url);
                        
                        const response = await fetch(url, {
                            headers: { 'Api-Key': apiKey }
                        });
                        
                        if (!response.ok) {
                            throw new Error(`API responded with status ${response.status}`);
                        }
                        
                        const responseData = await response.json();
                        
                        // Extract the first item from the items array if it exists
                        if (responseData.items && Array.isArray(responseData.items) && responseData.items.length > 0) {
                            const details = responseData.items[0];
                            panel.webview.postMessage({ 
                                command: 'ModelFabricationRequestDetailsData', 
                                data: details 
                            });
                        } else {
                            panel.webview.postMessage({ 
                                command: 'ModelFabricationRequestDetailsError', 
                                error: 'No details found for this fabrication request.' 
                            });
                        }
                    } catch (error) {
                        console.error("[Extension] Failed to fetch fabrication details:", error);
                        panel.webview.postMessage({ 
                            command: 'ModelFabricationRequestDetailsError', 
                            error: `Failed to load details: ${error.message}` 
                        });
                    }
                } else if (msg.command === 'ModelFabricationDownloadResults') { // Handle downloading fabrication results
                    console.log("[Extension] Handling ModelFabricationDownloadResults for URL:", msg.url);
                    if (!msg.url || !msg.requestCode) {
                        vscode.window.showErrorMessage('Missing parameters for results download.');
                        return;
                    }
                    
                    // Tell the webview that download has started
                    panel.webview.postMessage({ command: 'modelFabricationResultDownloadStarted' });
                    
                    // Download and extract fabrication results
                    try {
                        const authService = AuthService.getInstance();
                        const apiKey = await authService.getApiKey();
                        
                        if (!apiKey) {
                            throw new Error('You must be logged in to download fabrication results.');
                        }
                        
                        // Create directory for fabrication results if it doesn't exist
                        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                        if (!workspaceFolder) {
                            throw new Error('No workspace folder found');
                        }
                        
                        const fabricationResultsDir = path.join(workspaceFolder.uri.fsPath, 'fabrication_results');
                        console.log("[Extension] Creating/cleaning fabrication results directory:", fabricationResultsDir);
                        
                        // Create or clean directory
                        if (fs.existsSync(fabricationResultsDir)) {
                            // Clean the directory by removing all files
                            const entries = fs.readdirSync(fabricationResultsDir);
                            for (const entry of entries) {
                                const entryPath = path.join(fabricationResultsDir, entry);
                                if (fs.statSync(entryPath).isDirectory()) {
                                    fs.rmdirSync(entryPath, { recursive: true });
                                } else {
                                    fs.unlinkSync(entryPath);
                                }
                            }
                        } else {
                            fs.mkdirSync(fabricationResultsDir, { recursive: true });
                        }
                        
                        // Download the results with progress reporting
                        console.log("[Extension] Downloading fabrication results from URL:", msg.url);
                        
                        const response = await fetch(msg.url, {
                            headers: { 'Api-Key': apiKey }
                        });
                        
                        if (!response.ok) {
                            throw new Error(`Failed to download results: ${response.status} ${response.statusText}`);
                        }
                        
                        // Get total size from Content-Length header 
                        const contentLength = response.headers.get('content-length');
                        const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
                        console.log(`[Extension] Total download size: ${totalSize} bytes`);
                        
                        // Create a reader from the response body
                        const reader = response.body?.getReader();
                        if (!reader) {
                            throw new Error("Failed to create reader from response");
                        }
                        
                        // Create a write stream for the zip file
                        const zipPath = path.join(fabricationResultsDir, 'fabrication_results.zip');
                        const fileStream = fs.createWriteStream(zipPath);
                        
                        let receivedBytes = 0;
                        let lastProgressUpdate = 0;
                        
                        // Process the data as it comes in
                        while (true) {
                            const { done, value } = await reader.read();
                            
                            if (done) {
                                console.log("[Extension] Download read complete");
                                break;
                            }
                            
                            // Write chunk to file
                            if (value) {
                                fileStream.write(Buffer.from(value));
                                receivedBytes += value.length;
                                
                                // Update progress at least every 1%
                                if (totalSize > 0) {
                                    const percent = Math.floor((receivedBytes / totalSize) * 100);
                                    if (percent > lastProgressUpdate) {
                                        lastProgressUpdate = percent;
                                        console.log(`[Extension] Download progress: ${percent}%`);
                                        panel.webview.postMessage({ 
                                            command: 'modelFabricationDownloadProgress',
                                            percent: percent
                                        });
                                    }
                                }
                            }
                        }
                        
                        // Close the file
                        fileStream.end();
                        
                        // Wait for the file to be fully written
                        await new Promise<void>(resolve => {
                            fileStream.on('finish', () => {
                                resolve();
                            });
                        });
                        
                        // Unzip the file with progress reporting
                        console.log("[Extension] Extracting fabrication results...");
                        const zip = new JSZip();
                        const zipContent = await zip.loadAsync(fs.readFileSync(zipPath));
                        
                        // Get number of files for progress reporting
                        const fileCount = Object.keys(zipContent.files).length;
                        console.log(`[Extension] Extracting ${fileCount} files from zip`);
                        
                        // Notify webview that extraction has started
                        panel.webview.postMessage({ 
                            command: 'modelFabricationExtractionStarted',
                            fileCount: fileCount
                        });
                        
                        // Extract all files with progress updates
                        const extractionPromises = [];
                        let extractedCount = 0;
                        let lastExtractionUpdate = 0;
                        
                        zipContent.forEach((relativePath, zipEntry) => {
                            if (!zipEntry.dir) {
                                const promise = zipEntry.async('nodebuffer').then(content => {
                                    const outputPath = path.join(fabricationResultsDir, relativePath);
                                    const outputDir = path.dirname(outputPath);
                                    
                                    // Create directory if it doesn't exist
                                    if (!fs.existsSync(outputDir)) {
                                        fs.mkdirSync(outputDir, { recursive: true });
                                    }
                                    
                                    // Write file
                                    fs.writeFileSync(outputPath, content);
                                    
                                    // Update extraction progress
                                    extractedCount++;
                                    const percent = Math.floor((extractedCount / fileCount) * 100);
                                    if (percent > lastExtractionUpdate) {
                                        lastExtractionUpdate = percent;
                                        console.log(`[Extension] Extraction progress: ${percent}% (${extractedCount}/${fileCount} files)`);
                                        panel.webview.postMessage({ 
                                            command: 'modelFabricationExtractionProgress',
                                            extracted: extractedCount,
                                            total: fileCount,
                                            percent: percent
                                        });
                                    }
                                });
                                extractionPromises.push(promise);
                            }
                        });
                        
                        // Wait for all extraction promises to complete
                        await Promise.all(extractionPromises);
                        
                        // Clean up zip file
                        fs.unlinkSync(zipPath);
                        
                        console.log("[Extension] Fabrication results successfully extracted to:", fabricationResultsDir);
                        
                        // Show success message
                        vscode.window.showInformationMessage(
                            'Fabrication results have been downloaded and extracted to the fabrication_results folder. ' +
                            'Review the files and copy needed files to your project.'
                        );
                        
                        // Notify webview that download is complete
                        panel.webview.postMessage({ 
                            command: 'modelFabricationResultDownloadSuccess',
                            requestCode: msg.requestCode
                        });
                        
                    } catch (error) {
                        console.error("[Extension] Error downloading fabrication results:", error);
                        vscode.window.showErrorMessage(`Failed to download fabrication results: ${error.message}`);
                        panel.webview.postMessage({ 
                            command: 'modelFabricationResultDownloadError',
                            error: error.message
                        });
                    }
                } else if (msg.command === 'ModelFabricationCancelRequest') { // Handle cancel request from list view
                    console.log("[Extension] Handling ModelFabricationCancelRequest for code:", msg.requestCode);
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
                            panel.webview.postMessage({ command: "ModelFabricationRequestFailed" });
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
                        panel.webview.postMessage({ command: "ModelFabricationRequestCancelled" });
                        
                        // Refresh the list after cancelling
                        await fetchAndSend(1, 10, 'modelFabricationRequestRequestedUTCDateTime', true);
                    } catch (error) {
                        console.error("[Extension] Failed to cancel fabrication request:", error);
                        vscode.window.showErrorMessage(`Failed to cancel request: ${error.message}`);
                        panel.webview.postMessage({ command: "ModelFabricationRequestFailed" });
                    }
                } else if (msg.command === 'ModelFabricationShowDetails') {
                    console.log("[Extension] Handling ModelFabricationShowDetails for item:", msg.item);
                    if (!msg.item) {
                        vscode.window.showErrorMessage('Missing item data for details.');
                        return;
                    }
                    // Implement detailed view for the fabrication item if needed
                    vscode.window.showInformationMessage(`Viewing detailed information for fabrication request`);
                }
            });
        })
    );
}

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
import { showValidationRequestDetailsView } from '../webviews/validationRequestDetailsView';
// Import showChangeRequestsListView and alias getWebviewContent
import { getWebviewContent as getChangeRequestsViewHtml, showChangeRequestsListView } from '../webviews/changeRequestsListView';

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
                    panel.webview.postMessage({ command: 'modelValidationSetValidationData', data });
                } catch (err) {
                    panel.webview.postMessage({ command: 'modelValidationSetValidationData', data: { items: [], pageNumber: 1, itemCountPerPage: 10, recordsTotal: 0 } });
                    vscode.window.showErrorMessage('Failed to fetch validation requests: ' + (err && err.message ? err.message : err));
                }
            }
            panel.webview.onDidReceiveMessage(async (msg) => {
                console.log("[Extension] Received message from webview:", msg.command);
                if (msg.command === 'modelValidationWebviewReady') {
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
                        console.log("[Extension] Sending modelValidationRequestReceived to webview");
                        panel.webview.postMessage({ command: "modelValidationRequestReceived" });
                    
                        // Refresh first page after adding
                        console.log("[Extension] Refreshing data after successful add...");
                        await fetchAndSend(1, 10, 'modelValidationRequestRequestedUTCDateTime', true);
                        console.log("[Extension] Data refresh complete after add.");
                    } catch (err) {
                        console.error("[Extension] Failed to add validation request:", err);
                        // Notify webview that request failed
                        console.log("[Extension] Sending modelValidationRequestFailed to webview");
                        panel.webview.postMessage({ command: "modelValidationRequestFailed" });
                        vscode.window.showErrorMessage('Failed to add validation request: ' + (err && err.message ? err.message : err));
                    }
                } else if (msg.command === 'modelValidationShowValidationRequestDetails') { // Handle showing details
                    console.log("[Extension] Handling modelValidationShowValidationRequestDetails for code:", msg.requestCode);
                    if (!msg.requestCode) {
                        vscode.window.showErrorMessage('Missing request code for details view.');
                        return;
                    }
                    
                    // This is now deprecated - we'll use modal instead via fetchValidationDetails
                    showValidationRequestDetailsView(context, msg.requestCode);
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
                        
                        if (!response.ok) {
                            throw new Error(`API responded with status ${response.status}`);
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
                        // Check if report file exists in the workspace
                        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                        if (!workspaceFolder) {
                            throw new Error('No workspace folder found');
                        }
                        
                        const reportPath = path.join(workspaceFolder.uri.fsPath, 'validation_reports', `validation_report_${msg.requestCode}.html`);
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
                        // Check if change requests file exists in the workspace
                        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                        if (!workspaceFolder) {
                            throw new Error('No workspace folder found');
                        }
                        
                        // CORRECTED: Filename should be <requestCode>.json directly in validation_change_requests folder
                        const changeRequestsPath = path.join(workspaceFolder.uri.fsPath, 'validation_change_requests', `${msg.requestCode}.json`);
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
                        
                        // Create directory for reports if it doesn't exist
                        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                        if (!workspaceFolder) {
                            throw new Error('No workspace folder found');
                        }
                        
                        const reportsDir = path.join(workspaceFolder.uri.fsPath, 'validation_reports');
                        if (!fs.existsSync(reportsDir)) {
                            fs.mkdirSync(reportsDir, { recursive: true });
                        }
                        
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
                            
                            const changeRequestsDirPath = path.join(workspaceFolder.uri.fsPath, 'validation_change_requests');
                            if (!fs.existsSync(changeRequestsDirPath)) {
                                fs.mkdirSync(changeRequestsDirPath, { recursive: true });
                            }
                            
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
                        // Open existing report
                        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                        if (!workspaceFolder) {
                            throw new Error('No workspace folder found');
                        }
                        
                        const reportPath = path.join(workspaceFolder.uri.fsPath, 'validation_reports', `validation_report_${msg.requestCode}.html`);
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
                        
                        if (!response.ok) {
                            throw new Error(`API responded with status ${response.status}`);
                        }
                        
                        console.log("[Extension] Validation request successfully cancelled");
                        vscode.window.showInformationMessage(`Validation request cancelled successfully.`);
                        
                        // Send success message back to webview to hide spinner and refresh
                        panel.webview.postMessage({ command: "modelValidationRequestCancelled" });
                        
                        // Refresh the list after cancelling
                        await fetchAndSend(1, 10, 'modelValidationRequestRequestedUTCDateTime', true);
                    } catch (error) {
                        console.error("[Extension] Failed to cancel validation request:", error);
                        vscode.window.showErrorMessage(`Failed to cancel request: ${error.message}`);
                        panel.webview.postMessage({ command: "modelValidationRequestFailed" });
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
                if (msg.command === 'ModelAIProcessingWebviewReady') {
                    console.log("[Extension] Handling ModelAIProcessingWebviewReady");
                    await fetchAndSend(1, 10, 'modelPrepRequestRequestedUTCDateTime', true);
                } else if (msg.command === 'ModelAIProcessingRequestPage') {
                    console.log("[Extension] Handling ModelAIProcessingRequestPage:", msg.pageNumber, msg.itemCountPerPage, msg.orderByColumnName, msg.orderByDescending);
                    await fetchAndSend(msg.pageNumber, msg.itemCountPerPage, msg.orderByColumnName, msg.orderByDescending);
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
                        panel.webview.postMessage({ command: "ModelAIProcessingRequestCancelled" });
                        
                        // Refresh the list after cancelling
                        await fetchAndSend(1, 10, 'modelPrepRequestRequestedUTCDateTime', true);
                    } catch (error) {
                        console.error("[Extension] Failed to cancel processing request:", error);
                        vscode.window.showErrorMessage(`Failed to cancel request: ${error.message}`);
                        panel.webview.postMessage({ command: "ModelAIProcessingRequestFailed" });
                    }
                } else if (msg.command === 'ModelAIProcessingShowDetails') {
                    console.log("[Extension] Handling ModelAIProcessingShowDetails for item:", msg.item);
                    if (!msg.item) {
                        vscode.window.showErrorMessage('Missing item data for details.');
                        return;
                    }
                    // Implement detailed view for the processing item if needed
                    vscode.window.showInformationMessage(`Viewing detailed information for processing request`);
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
                if (msg.command === 'ModelFabricationWebviewReady') {
                    console.log("[Extension] Handling ModelFabricationWebviewReady");
                    await fetchAndSend(1, 10, 'modelFabricationRequestRequestedUTCDateTime', true);
                } else if (msg.command === 'ModelFabricationRequestPage') {
                    console.log("[Extension] Handling ModelFabricationRequestPage:", msg.pageNumber, msg.itemCountPerPage, msg.orderByColumnName, msg.orderByDescending);
                    await fetchAndSend(msg.pageNumber, msg.itemCountPerPage, msg.orderByColumnName, msg.orderByDescending);
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
                    // Call function to open the details webview if implemented
                    vscode.window.showInformationMessage(`Viewing details for fabrication request: ${msg.requestCode}`);
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
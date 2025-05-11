// src/webviews/modelAIProcessingDetailsView.ts
// Handles creating and managing the webview for displaying AI processing request details.
// Last modified: May 11, 2025

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AuthService } from '../services/authService';

/**
 * Shows a webview panel with details for a specific model AI processing request.
 * @param context The extension context.
 * @param requestCode The unique code of the AI processing request to display.
 */
export async function showModelAIProcessingDetailsView(context: vscode.ExtensionContext, requestCode: string) {
    const panel = vscode.window.createWebviewPanel(
        'modelAIProcessingDetails', // Identifies the type of the webview. Used internally
        `AI Processing Details: ${requestCode}`, // Title of the panel displayed to the user
        vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
        {
            enableScripts: true, // Allow scripts to run in the webview
            retainContextWhenHidden: true, // Keep the state even when not visible
        }
    );

    // Get path to script run in the webview
    const scriptPathOnDisk = vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'modelAIProcessingDetailsView.js');
    // And get the special URI to use with the webview
    const scriptUri = panel.webview.asWebviewUri(scriptPathOnDisk);

    // Set the HTML content for the webview
    panel.webview.html = getWebviewContent(scriptUri, requestCode);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {                case 'modelAIProcessingDetailsWebviewReady':
                    console.log("[Extension] modelAIProcessingDetailsView webview is ready for code:", requestCode);
                    // Webview is ready, fetch details and send them
                    await fetchAndSendDetails(panel, requestCode);
                    return;
                    
                case 'modelAIProcessingDownloadReport':
                    console.log("[Extension] Received download report request for URL:", message.url);
                    await downloadReport(panel, message.url, message.requestCode);
                    return;
                    
                case 'modelAIProcessingCheckReportExists':
                    console.log("[Extension] Checking if report exists locally for request code:", message.requestCode);
                    await checkReportExists(panel, message.requestCode);
                    return;
                    
                case 'modelAIProcessingViewReport':
                    console.log("[Extension] Opening existing report for request code:", message.requestCode);
                    await openExistingReport(panel, message.requestCode);
                    return;
                    
                case 'showMessage':
                    // Handle showing messages from the webview
                    if (message.type === 'error') {
                        vscode.window.showErrorMessage(message.message);
                    } else {
                        vscode.window.showInformationMessage(message.message);
                    }
                    return;
            }
        },
        undefined,
        context.subscriptions
    );
}

/**
 * Checks if a report exists locally for the given request code.
 * @param panel The webview panel.
 * @param requestCode The AI processing request code.
 */
async function checkReportExists(panel: vscode.WebviewPanel, requestCode: string) {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder is open');
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const processingDirPath = path.join(workspaceRoot, '.app_dna_ai_processing_reports');
        const filePath = path.join(processingDirPath, `${requestCode}.txt`);
        
        const exists = fs.existsSync(filePath);
        
        console.log("[Extension] Report file status:", exists ? "Exists" : "Does not exist", "at path:", filePath);
        
        // Inform the webview whether the file exists
        panel.webview.postMessage({ 
            command: 'modelAIProcessingReportExistsResult', 
            exists: exists,
            requestCode: requestCode
        });
        
    } catch (error) {
        console.error("[Extension] Error checking if report exists:", error);
        panel.webview.postMessage({ 
            command: 'modelAIProcessingReportExistsResult', 
            exists: false,
            requestCode: requestCode,
            error: error.message
        });
    }
}

/**
 * Opens an existing report file in the editor.
 * @param panel The webview panel.
 * @param requestCode The AI processing request code.
 */
async function openExistingReport(panel: vscode.WebviewPanel, requestCode: string) {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder is open');
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const processingDirPath = path.join(workspaceRoot, '.app_dna_ai_processing_reports');
        const filePath = path.join(processingDirPath, `${requestCode}.txt`);
        
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
        console.error("[Extension] Failed to open report:", error);
        vscode.window.showErrorMessage(`Failed to open report: ${error.message}`);
        panel.webview.postMessage({ 
            command: 'reportOpenError', 
            error: error.message
        });
    }
}

/**
 * Downloads a report from the API and saves it to a local file.
 * @param panel The webview panel.
 * @param url The URL of the report to download.
 * @param requestCode The AI processing request code for naming the file.
 */
async function downloadReport(panel: vscode.WebviewPanel, url: string, requestCode: string) {
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

        // Create AI processing reports directory if it doesn't exist
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder is open');
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const processingDirPath = path.join(workspaceRoot, '.app_dna_ai_processing_reports');
        
        if (!fs.existsSync(processingDirPath)) {
            fs.mkdirSync(processingDirPath, { recursive: true });
        }

        // Save the report content to a file
        const filePath = path.join(processingDirPath, `${requestCode}.txt`);
        fs.writeFileSync(filePath, reportContent);

        // Don't open the file automatically - let the user hit 'View Report' to open it
        console.log("[Extension] Report downloaded and saved to:", filePath);
        panel.webview.postMessage({ command: 'modelAIProcessingReportDownloadSuccess' });
        vscode.window.showInformationMessage(`Report downloaded and saved to: ${filePath}`);
        
    } catch (error) {
        console.error("[Extension] Failed to download report:", error);
        vscode.window.showErrorMessage(`Failed to download report: ${error.message}`);
        panel.webview.postMessage({ command: 'modelAIProcessingReportDownloadError', error: error.message });
    }
}

/**
 * Fetches AI processing request details from the API and sends them to the webview.
 * @param panel The webview panel.
 * @param requestCode The request code to fetch details for.
 */
async function fetchAndSendDetails(panel: vscode.WebviewPanel, requestCode: string) {
    const authService = AuthService.getInstance();
    const apiKey = await authService.getApiKey();

    if (!apiKey) {
        vscode.window.showErrorMessage('You must be logged in to view AI processing request details.');
        panel.webview.postMessage({ command: 'modelAIProcessingSetError', text: 'Authentication required.' });
        return;
    }

    // Use query string parameter for the request code instead of path parameter
    const url = `https://modelservicesapi.derivative-programming.com/api/v1_0/prep-requests?modelPrepRequestCode=${encodeURIComponent(requestCode)}`;
    console.log("[Extension] Fetching AI processing details from URL:", url);

    try {
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
            panel.webview.postMessage({ command: 'modelAIProcessingSetRequestDetails', data: details });
        } else {
            panel.webview.postMessage({ command: 'modelAIProcessingSetError', text: 'No details found for this AI processing request.' });
        }

    } catch (error) {
        console.error("[Extension] Failed to fetch AI processing details:", error);
        vscode.window.showErrorMessage(`Failed to fetch details for request ${requestCode}: ${error.message}`);
        panel.webview.postMessage({ command: 'modelAIProcessingSetError', text: `Failed to load details: ${error.message}` });
    }
}

/**
 * Generates the HTML content for the details webview.
 * @param scriptUri The URI of the webview's JavaScript file.
 * @param requestCode The request code being displayed.
 * @returns HTML string.
 */
function getWebviewContent(scriptUri: vscode.Uri, requestCode: string): string {
    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${scriptUri.toString().split('/').slice(0, -1).join('/')}; script-src 'nonce-${nonce}';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AI Processing Details: ${requestCode}</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-editor-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                }
                h1 {
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                    font-size: 1.5em;
                    font-weight: normal;
                }
                .detail-item {
                    margin-bottom: 15px;
                }
                .detail-label {
                    font-weight: bold;
                    color: var(--vscode-descriptionForeground);
                    display: block;
                    margin-bottom: 5px;
                }
                .detail-value {
                    font-family: var(--vscode-editor-font-family);
                    white-space: pre-wrap; /* Preserve whitespace and wrap */
                    word-wrap: break-word; /* Break long words */
                    background-color: var(--vscode-input-background);
                    padding: 5px 8px;
                    border-radius: 3px;
                    border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
                    display: block; /* Make it block level */
                }
                .detail-value a {
                    color: var(--vscode-textLink-foreground);
                    text-decoration: none;
                }
                .detail-value a:hover {
                    text-decoration: underline;
                }
                .error-message {
                    color: var(--vscode-errorForeground);
                    background-color: var(--vscode-inputValidation-errorBackground);
                    border: 1px solid var(--vscode-inputValidation-errorBorder);
                    padding: 10px;
                    border-radius: 3px;
                }
                .loading-message {
                    color: var(--vscode-descriptionForeground);
                    font-style: italic;
                }
                .action-container {
                    margin-top: 20px;
                }
                .download-button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 6px 12px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-family: var(--vscode-font-family);
                    font-size: 13px;
                }
                .download-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .download-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .spinner {
                    display: inline-block;
                    width: 12px;
                    height: 12px;
                    border: 2px solid var(--vscode-button-foreground);
                    border-radius: 50%;
                    border-top-color: transparent;
                    margin-right: 6px;
                    vertical-align: middle;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .request-code-footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid var(--vscode-panel-border);
                    font-family: var(--vscode-editor-font-family);
                    font-size: 0.9em;
                    color: var(--vscode-descriptionForeground);
                }
                .code-display {
                    font-family: var(--vscode-editor-font-family);
                    font-size: 1em;
                    color: var(--vscode-editor-foreground);
                    background-color: var(--vscode-input-background);
                    padding: 5px 8px;
                    border-radius: 3px;
                    border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
                    display: inline-block;
                    margin-left: 10px;
                }
            </style>
        </head>
        <body>
            <h1>AI Processing Request Details</h1>
            <div id="details-container">
                <p class="loading-message">Loading details for ${requestCode}...</p>
            </div>
            
            <div class="request-code-footer">
                <span>AI Processing Request Code:</span>
                <span class="code-display">${requestCode}</span>
            </div>

            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

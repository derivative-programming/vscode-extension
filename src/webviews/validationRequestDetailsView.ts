// src/webviews/validationRequestDetailsView.ts
// Handles creating and managing the webview for displaying validation request details.
// Last modified: May 5, 2025

import * as vscode from 'vscode';
import { AuthService } from '../services/authService';

/**
 * Shows a webview panel with details for a specific model validation request.
 * @param context The extension context.
 * @param requestCode The unique code of the validation request to display.
 */
export async function showValidationRequestDetailsView(context: vscode.ExtensionContext, requestCode: string) {
    const panel = vscode.window.createWebviewPanel(
        'validationRequestDetails', // Identifies the type of the webview. Used internally
        `Validation Details: ${requestCode}`, // Title of the panel displayed to the user
        vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
        {
            enableScripts: true, // Allow scripts to run in the webview
            retainContextWhenHidden: true, // Keep the state even when not visible
        }
    );

    // Get path to script run in the webview
    const scriptPathOnDisk = vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'validationRequestDetailsView.js'); // Reverted filename
    // And get the special URI to use with the webview
    const scriptUri = panel.webview.asWebviewUri(scriptPathOnDisk);

    // Set the HTML content for the webview
    panel.webview.html = getWebviewContent(scriptUri, requestCode);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case 'webviewReady':
                    console.log("[Extension] validationRequestDetailsView webview is ready for code:", requestCode);
                    // Webview is ready, fetch details and send them
                    await fetchAndSendDetails(panel, requestCode);
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
 * Fetches validation request details from the API and sends them to the webview.
 * @param panel The webview panel.
 * @param requestCode The request code to fetch details for.
 */
async function fetchAndSendDetails(panel: vscode.WebviewPanel, requestCode: string) {
    const authService = AuthService.getInstance();
    const apiKey = await authService.getApiKey();

    if (!apiKey) {
        vscode.window.showErrorMessage('You must be logged in to view validation request details.');
        panel.webview.postMessage({ command: 'setError', text: 'Authentication required.' });
        return;
    }

    // Use query string parameter for the request code instead of path parameter
    const url = `https://modelservicesapi.derivative-programming.com/api/v1_0/validation-requests?modelValidationRequestCode=${encodeURIComponent(requestCode)}`;
    console.log("[Extension] Fetching validation details from URL:", url);

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
            panel.webview.postMessage({ command: 'setRequestDetails', data: details });
        } else {
            panel.webview.postMessage({ command: 'setError', text: 'No details found for this validation request.' });
        }

    } catch (error) {
        console.error("[Extension] Failed to fetch validation details:", error);
        vscode.window.showErrorMessage(`Failed to fetch details for request ${requestCode}: ${error.message}`);
        panel.webview.postMessage({ command: 'setError', text: `Failed to load details: ${error.message}` });
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
            <title>Validation Details: ${requestCode}</title>
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
            </style>
        </head>
        <body>
            <h1>Validation Request Details</h1>
            <div id="details-container">
                <p class="loading-message">Loading details for ${requestCode}...</p>
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

// src/webviews/changeRequestsListView.ts
// Handles creating and managing the webview for displaying change requests.
// Last modified: May 6, 2025

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Loads change requests from a JSON file and sends them to the webview.
 * @param panel The webview panel.
 * @param requestCode The validation request code used to find the change requests file.
 */
async function loadAndSendChangeRequests(panel: vscode.WebviewPanel, requestCode: string) {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder is open');
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const changeRequestsFilePath = path.join(workspaceRoot, 'change_requests', `${requestCode}.json`);
        
        // Check if file exists
        if (!fs.existsSync(changeRequestsFilePath)) {
            throw new Error(`Change requests file not found: ${changeRequestsFilePath}`);
        }

        // Read the change requests data from the file
        const fileContent = fs.readFileSync(changeRequestsFilePath, 'utf8');
        
        // Parse the JSON content
        let changeRequests;
        try {
            changeRequests = JSON.parse(fileContent);
            console.log(`[Extension] JSON Parse successful, data type: ${typeof changeRequests}, is array: ${Array.isArray(changeRequests)}`);
            
            // If the parsed data is not an array, try to find an array in it
            if (!Array.isArray(changeRequests)) {
                console.log(`[Extension] Parsed data is not an array, object keys:`, Object.keys(changeRequests));
                
                // Check if it's a response object from the API with a "changeRequests" property
                if (changeRequests.changeRequests && Array.isArray(changeRequests.changeRequests)) {
                    console.log(`[Extension] Found array in property: changeRequests with length: ${changeRequests.changeRequests.length}`);
                    changeRequests = changeRequests.changeRequests;
                } else if (changeRequests.items && Array.isArray(changeRequests.items)) {
                    console.log(`[Extension] Found array in property: items with length: ${changeRequests.items.length}`);
                    changeRequests = changeRequests.items;
                } else {
                    // Look for any array property that might contain the change requests
                    for (const key of Object.keys(changeRequests)) {
                        if (Array.isArray(changeRequests[key])) {
                            console.log(`[Extension] Found array in property: ${key} with length: ${changeRequests[key].length}`);
                            changeRequests = changeRequests[key];
                            break;
                        }
                    }
                }
            }
        } catch (error) {
            console.error("[Extension] JSON parse error:", error);
            throw new Error(`Failed to parse change requests file: ${error.message}`);
        }
        
        if (!Array.isArray(changeRequests)) {
            console.log("[Extension] Change requests data is still not an array after parsing, converting to an array");
            // Convert to array if it's still not an array
            changeRequests = [changeRequests];
        }
        
        // Ensure changeRequests is never empty or undefined
        if (!changeRequests || changeRequests.length === 0) {
            changeRequests = [];
            console.log("[Extension] No change requests found in file");
        }
        
        // Ensure each change request has required properties
        changeRequests = changeRequests.map((cr: any) => {
            // Ensure we have required properties
            return {
                Code: cr.Code || cr.code || `cr-${Math.random().toString(36).substr(2, 9)}`,
                Description: cr.Description || cr.description || "No description",
                PropertyName: cr.PropertyName || cr.propertyName || cr.PropertyPath || cr.propertyPath || "Unknown property",
                OldValue: cr.OldValue !== undefined ? cr.OldValue : (cr.oldValue !== undefined ? cr.oldValue : ""),
                NewValue: cr.NewValue !== undefined ? cr.NewValue : (cr.newValue !== undefined ? cr.newValue : ""),
                IsApproved: cr.IsApproved || cr.isApproved || false,
                IsRejected: cr.IsRejected || cr.isRejected || false,
                IsProcessed: cr.IsProcessed || cr.isProcessed || false,
                IsAutomatedChangeAvailable: cr.IsAutomatedChangeAvailable !== undefined ? cr.IsAutomatedChangeAvailable : true,
                ...cr // Keep all original properties
            };
        });
        
        console.log(`[Extension] Loaded ${changeRequests.length} change requests from ${changeRequestsFilePath}`);
        console.log("[Extension] First change request sample:", changeRequests.length > 0 ? JSON.stringify(changeRequests[0]) : "No change requests");
        
        // Send the data to the webview
        panel.webview.postMessage({ 
            command: 'setChangeRequestsData', 
            data: changeRequests,
            requestCode: requestCode
        });
        
    } catch (error) {
        console.error("[Extension] Failed to load change requests:", error);
        vscode.window.showErrorMessage(`Failed to load change requests: ${error.message}`);
        panel.webview.postMessage({ command: 'setError', text: `Failed to load change requests: ${error.message}` });
    }
}

/**
 * Shows a webview panel with change requests loaded from a JSON file.
 * @param context The extension context.
 * @param requestCode The unique code of the validation request which generated these change requests.
 */
export async function showChangeRequestsListView(context: vscode.ExtensionContext, requestCode: string) {
    const panel = vscode.window.createWebviewPanel(
        'changeRequestsList', // Identifies the type of the webview. Used internally
        `Change Requests: ${requestCode}`, // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Use the main editor column, not a side panel
        {
            enableScripts: true, // Allow scripts to run in the webview
            retainContextWhenHidden: true, // Keep the state even when not visible
            localResourceRoots: [
                vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews'),
                vscode.Uri.joinPath(context.extensionUri, 'media') // If you have other local resources
            ]
        }
    );

    // Get path to script run in the webview
    const scriptPathOnDisk = vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'changeRequestsListView.js');
    // And get the special URI to use with the webview
    const scriptUri = panel.webview.asWebviewUri(scriptPathOnDisk);
    const cspSource = panel.webview.cspSource;

    // Set the HTML content for the webview
    panel.webview.html = getWebviewContent(scriptUri, requestCode, cspSource, panel.webview);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case 'webviewReady':
                    console.log("[Extension] changeRequestsListView webview is ready for code:", requestCode);
                    // Webview is ready, load the change requests
                    await loadAndSendChangeRequests(panel, requestCode);
                    return;
                    
                case 'approveChangeRequest':
                    await handleApproveChangeRequest(panel, message.requestCode, message.changeRequestCode);
                    return;
                    
                case 'rejectChangeRequest':
                    await handleRejectChangeRequest(panel, message.requestCode, message.changeRequestCode, message.reason);
                    return;
                    
                case 'applyChangeRequest':
                    await handleApplyChangeRequest(panel, message.requestCode, message.changeRequestCode);
                    return;

                // Add handlers for batch operations
                case 'approveAllChangeRequests':
                    await handleApproveAllChangeRequests(panel, message.requestCode);
                    return;

                case 'rejectAllChangeRequests':
                    await handleRejectAllChangeRequests(panel, message.requestCode, message.reason);
                    return;

                case 'applyAllChangeRequests':
                    await handleApplyAllChangeRequests(panel, message.requestCode);
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
 * Generates the HTML content for the change requests webview.
 * @param scriptUri The URI of the webview's JavaScript file.
 * @param requestCode The request code being displayed.
 * @param cspSource The Content Security Policy source for the webview.
 * @param webview For generating webview URIs if needed for other assets like codicons.
 * @returns HTML string.
 */
function getWebviewContent(scriptUri: vscode.Uri, requestCode: string, cspSource: string, webview: vscode.Webview): string {
    const nonce = getNonce();

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${cspSource} https://unpkg.com/ https://cdnjs.cloudflare.com/; script-src 'nonce-${nonce}'; font-src ${cspSource} https://unpkg.com/ https://cdnjs.cloudflare.com/; img-src ${cspSource} data:;">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Change Requests: ${requestCode}</title>
            <link href="https://unpkg.com/@vscode/codicons@0.0.36/dist/codicon.css" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-editor-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 15px;
                    margin: 0;
                    overflow-x: hidden;
                }
                
                .change-requests-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 0;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    margin-bottom: 15px;
                }
                
                .change-requests-header h1 {
                    margin: 0;
                    font-size: 1.5em;
                    font-weight: normal;
                }
                
                .toolbar {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 15px;
                }
                
                .filter-controls {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }
                
                .filter-controls label {
                    font-size: 0.9em;
                    color: var(--vscode-descriptionForeground);
                }
                
                .filter-controls select {
                    background-color: var(--vscode-dropdown-background);
                    color: var(--vscode-dropdown-foreground);
                    border: 1px solid var(--vscode-dropdown-border);
                    padding: 4px 8px;
                    border-radius: 2px;
                    font-family: inherit;
                }
                
                .refresh-button {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: none;
                    padding: 4px 8px;
                    cursor: pointer;
                    border-radius: 2px;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                
                .refresh-button:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                }
                
                .action-button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 4px 8px;
                    cursor: pointer;
                    border-radius: 2px;
                    font-size: 0.9em;
                }
                
                .action-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                
                .action-button.reject {
                    background-color: var(--vscode-errorForeground);
                }
                
                .action-button.reject:hover {
                    opacity: 0.9;
                }
                
                .action-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .batch-actions {
                    display: flex;
                    gap: 10px;
                }
                
                .change-requests-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    table-layout: fixed;
                }
                
                .change-requests-table th {
                    text-align: left;
                    padding: 8px;
                    background-color: var(--vscode-editor-lineHighlightBackground);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    font-weight: 600;
                    position: sticky;
                    top: 0;
                    z-index: 1;
                }
                
                .change-requests-table td {
                    padding: 8px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    vertical-align: top;
                }
                
                .change-requests-table tr:hover {
                    background-color: var(--vscode-list-hoverBackground);
                }
                
                .status-badge {
                    display: inline-block;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 0.8em;
                    text-align: center;
                    font-weight: 500;
                }
                
                .status-badge.pending {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
                
                .status-badge.approved {
                    background-color: var(--vscode-testing-iconPassed);
                    color: var(--vscode-editor-background);
                }
                
                .status-badge.rejected {
                    background-color: var(--vscode-testing-iconFailed);
                    color: var(--vscode-editor-background);
                }
                
                .status-badge.applied {
                    background-color: var(--vscode-charts-green);
                    color: var(--vscode-editor-background);
                }
                
                .details-row {
                    display: none;
                    padding: 10px;
                    background-color: var(--vscode-editor-lineHighlightBackground);
                }
                
                .details-row.expanded {
                    display: table-row;
                }
                
                .modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.4);
                    z-index: 10;
                    align-items: center;
                    justify-content: center;
                }
                
                .modal-content {
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                    border-radius: 4px;
                    box-sizing: border-box;
                    min-height: 80px;
                    width: 400px;
                    max-width: 90%;
                }

                .modal-title {
                    margin-top: 0;
                    margin-bottom: 15px;
                    font-size: 1.2em;
                }

                .form-group {
                    margin-bottom: 15px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 600;
                }

                .form-group textarea {
                    width: 100%;
                    min-height: 80px;
                    padding: 8px;
                    border-radius: 2px;
                    border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    box-sizing: border-box;
                    font-family: var(--vscode-font-family);
                }
                
                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 15px;
                }
                
                .spinner-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.3);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 20;
                }
                
                .spinner {
                    border: 4px solid var(--vscode-editor-widget-background);
                    border-top: 4px solid var(--vscode-button-background);
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .empty-state {
                    padding: 40px;
                    text-align: center;
                    color: var(--vscode-descriptionForeground);
                }
                
                .truncate {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .mono {
                    font-family: var(--vscode-editor-font-family);
                }
            </style>
        </head>
        <body>
            <div class="spinner-overlay" id="spinnerOverlay">
                <div class="spinner"></div>
            </div>
            
            <div class="change-requests-header">
                <h1>Change Requests</h1>
                <div>Validation Request: <span id="requestCodeDisplay" class="mono">${requestCode}</span></div>
            </div>
            
            <div class="toolbar">
                <div class="filter-controls">
                    <label for="statusFilter">Status:</label>
                    <select id="statusFilter">
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="processed">Applied</option>
                    </select>
                    <button id="refreshButton" class="refresh-button" title="Refresh Data">
                        <i class="codicon codicon-refresh"></i>
                        <span>Refresh</span>
                    </button>
                </div>
                
                <div class="batch-actions">
                    <button id="approveAllBtn" class="action-button" title="Approve all pending change requests">Approve All</button>
                    <button id="rejectAllBtn" class="action-button reject" title="Reject all pending change requests">Reject All</button>
                    <button id="applyAllBtn" class="action-button" title="Apply all approved change requests">Apply All</button>
                </div>
            </div>
            
            <!-- This is where the table will be rendered -->
            <div id="changeRequestsContainer">
                <div class="empty-state">
                    <p>Loading change requests...</p>
                </div>
            </div>

            <!-- Individual Reject Modal -->
            <div id="rejectModal" class="modal">
                <div class="modal-content">
                    <h3 class="modal-title">Reject Change Request</h3>
                    <div class="form-group">
                        <label for="rejectionReason">Rejection Reason:</label>
                        <textarea id="rejectionReason" placeholder="Please provide a reason for rejection..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button id="cancelReject" class="action-button">Cancel</button>
                        <button id="confirmReject" class="action-button reject">Confirm Reject</button>
                    </div>
                </div>
            </div>

            <!-- Batch Reject Modal -->
            <div id="batchRejectModal" class="modal">
                <div class="modal-content">
                    <h3 class="modal-title">Reject All Pending Change Requests</h3>
                    <div class="form-group">
                        <label for="batchRejectionReason">Rejection Reason:</label>
                        <textarea id="batchRejectionReason" placeholder="Please provide a reason for rejecting all pending change requests..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button id="cancelBatchReject" class="action-button">Cancel</button>
                        <button id="confirmBatchReject" class="action-button reject">Confirm Reject All</button>
                    </div>
                </div>
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

/**
 * Handles approving a specific change request.
 * @param panel The webview panel.
 * @param requestCode The validation request code.
 * @param changeRequestCode The specific change request code to approve.
 */
async function handleApproveChangeRequest(panel: vscode.WebviewPanel, requestCode: string, changeRequestCode: string) {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder is open');
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const changeRequestsFilePath = path.join(workspaceRoot, 'change_requests', `${requestCode}.json`);
        
        // Read file contents
        if (!fs.existsSync(changeRequestsFilePath)) {
            throw new Error(`Change requests file not found: ${changeRequestsFilePath}`);
        }
        
        const fileContent = fs.readFileSync(changeRequestsFilePath, 'utf8');
        let changeRequestsData = JSON.parse(fileContent);
        
        // Find the target data array
        let targetArray = changeRequestsData;
        if (!Array.isArray(changeRequestsData)) {
            if (changeRequestsData.changeRequests && Array.isArray(changeRequestsData.changeRequests)) {
                targetArray = changeRequestsData.changeRequests;
            } else if (changeRequestsData.items && Array.isArray(changeRequestsData.items)) {
                targetArray = changeRequestsData.items;
            } else {
                for (const key of Object.keys(changeRequestsData)) {
                    if (Array.isArray(changeRequestsData[key])) {
                        targetArray = changeRequestsData[key];
                        break;
                    }
                }
            }
        }
        
        // Find and update the specific change request
        const changeRequestIndex = targetArray.findIndex(
            (cr: any) => (cr.Code === changeRequestCode || cr.code === changeRequestCode)
        );
        
        if (changeRequestIndex === -1) {
            throw new Error(`Change request with code ${changeRequestCode} not found`);
        }
        
        // Update the change request status
        targetArray[changeRequestIndex].IsApproved = true;
        targetArray[changeRequestIndex].IsRejected = false;
        
        // Save the updated file
        fs.writeFileSync(changeRequestsFilePath, JSON.stringify(changeRequestsData, null, 2), 'utf8');
        
        // Reload and send updated data to the webview
        await loadAndSendChangeRequests(panel, requestCode);
        
        // Show a success message
        vscode.window.showInformationMessage(`Change request ${changeRequestCode} approved successfully`);
        
    } catch (error) {
        console.error("[Extension] Failed to approve change request:", error);
        vscode.window.showErrorMessage(`Failed to approve change request: ${error.message}`);
        panel.webview.postMessage({ command: 'setError', text: `Failed to approve change request: ${error.message}` });
    }
}

/**
 * Handles rejecting a specific change request.
 * @param panel The webview panel.
 * @param requestCode The validation request code.
 * @param changeRequestCode The specific change request code to reject.
 * @param reason The reason for rejection.
 */
async function handleRejectChangeRequest(panel: vscode.WebviewPanel, requestCode: string, changeRequestCode: string, reason?: string) {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder is open');
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const changeRequestsFilePath = path.join(workspaceRoot, 'change_requests', `${requestCode}.json`);
        
        // Read file contents
        if (!fs.existsSync(changeRequestsFilePath)) {
            throw new Error(`Change requests file not found: ${changeRequestsFilePath}`);
        }
        
        const fileContent = fs.readFileSync(changeRequestsFilePath, 'utf8');
        let changeRequestsData = JSON.parse(fileContent);
        
        // Find the target data array
        let targetArray = changeRequestsData;
        if (!Array.isArray(changeRequestsData)) {
            if (changeRequestsData.changeRequests && Array.isArray(changeRequestsData.changeRequests)) {
                targetArray = changeRequestsData.changeRequests;
            } else if (changeRequestsData.items && Array.isArray(changeRequestsData.items)) {
                targetArray = changeRequestsData.items;
            } else {
                for (const key of Object.keys(changeRequestsData)) {
                    if (Array.isArray(changeRequestsData[key])) {
                        targetArray = changeRequestsData[key];
                        break;
                    }
                }
            }
        }
        
        // Find and update the specific change request
        const changeRequestIndex = targetArray.findIndex(
            (cr: any) => (cr.Code === changeRequestCode || cr.code === changeRequestCode)
        );
        
        if (changeRequestIndex === -1) {
            throw new Error(`Change request with code ${changeRequestCode} not found`);
        }
        
        // Update the change request status
        targetArray[changeRequestIndex].IsApproved = false;
        targetArray[changeRequestIndex].IsRejected = true;
        
        // Add rejection reason if provided
        if (reason) {
            targetArray[changeRequestIndex].RejectionReason = reason;
        }
        
        // Save the updated file
        fs.writeFileSync(changeRequestsFilePath, JSON.stringify(changeRequestsData, null, 2), 'utf8');
        
        // Reload and send updated data to the webview
        await loadAndSendChangeRequests(panel, requestCode);
        
        // Show a success message
        vscode.window.showInformationMessage(`Change request ${changeRequestCode} rejected successfully`);
        
    } catch (error) {
        console.error("[Extension] Failed to reject change request:", error);
        vscode.window.showErrorMessage(`Failed to reject change request: ${error.message}`);
        panel.webview.postMessage({ command: 'setError', text: `Failed to reject change request: ${error.message}` });
    }
}

/**
 * Handles applying a specific change request to the model.
 * @param panel The webview panel.
 * @param requestCode The validation request code.
 * @param changeRequestCode The specific change request code to apply.
 */
async function handleApplyChangeRequest(panel: vscode.WebviewPanel, requestCode: string, changeRequestCode: string) {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder is open');
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const changeRequestsFilePath = path.join(workspaceRoot, 'change_requests', `${requestCode}.json`);
        
        // Read file contents
        if (!fs.existsSync(changeRequestsFilePath)) {
            throw new Error(`Change requests file not found: ${changeRequestsFilePath}`);
        }
        
        const fileContent = fs.readFileSync(changeRequestsFilePath, 'utf8');
        let changeRequestsData = JSON.parse(fileContent);
        
        // Find the target data array
        let targetArray = changeRequestsData;
        if (!Array.isArray(changeRequestsData)) {
            if (changeRequestsData.changeRequests && Array.isArray(changeRequestsData.changeRequests)) {
                targetArray = changeRequestsData.changeRequests;
            } else if (changeRequestsData.items && Array.isArray(changeRequestsData.items)) {
                targetArray = changeRequestsData.items;
            } else {
                for (const key of Object.keys(changeRequestsData)) {
                    if (Array.isArray(changeRequestsData[key])) {
                        targetArray = changeRequestsData[key];
                        break;
                    }
                }
            }
        }
        
        // Find the specific change request
        const changeRequestIndex = targetArray.findIndex(
            (cr: any) => (cr.Code === changeRequestCode || cr.code === changeRequestCode)
        );
        
        if (changeRequestIndex === -1) {
            throw new Error(`Change request with code ${changeRequestCode} not found`);
        }
        
        const changeRequest = targetArray[changeRequestIndex];
        
        // Ensure the change request is approved before applying
        if (!changeRequest.IsApproved) {
            throw new Error(`Change request ${changeRequestCode} must be approved before it can be applied`);
        }
        
        // Import required utilities
        const { XPathUtils } = require('../utils/xpathUtils');
        
        // Get the model service instance to find the current model file path
        const { ModelService } = require('../services/modelService');
        const modelService = ModelService.getInstance();
        
        // Get the model file path
        const modelFilePath = modelService.getCurrentFilePath();
        if (!modelFilePath) {
            throw new Error('No model file path is available');
        }
        
        // Read the model file directly
        const modelFileContent = fs.readFileSync(modelFilePath, 'utf8');
        const modelJson = JSON.parse(modelFileContent);
        
        // Get the property path from the change request
        const propertyPath = changeRequest.PropertyPath || changeRequest.propertyPath;
        
        // Get the new value to set
        const newValue = changeRequest.NewValue || changeRequest.newValue;
        
        if (propertyPath) {
            // We have an explicit path, use it to apply the change
            console.log(`[Extension] Applying change to path: ${propertyPath}`);
            
            // Apply the change using XPathUtils
            const changeApplied = XPathUtils.setValue(modelJson, propertyPath, newValue);
            
            if (!changeApplied) {
                throw new Error(`Failed to apply change: could not find property at path ${propertyPath}`);
            }
        } else {
            // If there's no explicit PropertyPath, try to construct one from PropertyName
            const propertyName = changeRequest.PropertyName || changeRequest.propertyName;
            if (!propertyName) {
                throw new Error('Change request does not specify a property path or name');
            }
            
            // Simplified approach: Try to find the property in the model
            console.log(`[Extension] No explicit property path found. Using simplified approach with property name: ${propertyName}`);
            
            // Apply the change using the appropriate method based on property format
            let changeApplied = false;
            
            // Method 1: Try to use property name as a direct path (for simple cases like 'name', 'description')
            changeApplied = XPathUtils.setValue(modelJson, `root/${propertyName}`, newValue);
            
            if (!changeApplied) {
                // Method 2: For more complex cases, try to search for objects with a matching property
                vscode.window.showWarningMessage(`Could not automatically locate path for property: ${propertyName}. Please provide a full XPath in the change request.`);
                throw new Error(`Could not apply change: property path not found for ${propertyName}`);
            }
        }
        
        // Save the modified model JSON back to the file
        fs.writeFileSync(modelFilePath, JSON.stringify(modelJson, null, 2), 'utf8');
        
        // Mark the change request as processed
        changeRequest.IsProcessed = true;
        
        // Save the updated change requests file
        fs.writeFileSync(changeRequestsFilePath, JSON.stringify(changeRequestsData, null, 2), 'utf8');
        
        // Reload and send updated data to the webview
        await loadAndSendChangeRequests(panel, requestCode);
        
        // Show a success message
        vscode.window.showInformationMessage(`Change request ${changeRequestCode} applied successfully`);
        
    } catch (error) {
        console.error("[Extension] Failed to apply change request:", error);
        vscode.window.showErrorMessage(`Failed to apply change request: ${error.message}`);
        panel.webview.postMessage({ command: 'setError', text: `Failed to apply change request: ${error.message}` });
    }
}

/**
 * Handles approving all pending change requests.
 * @param panel The webview panel.
 * @param requestCode The validation request code.
 */
async function handleApproveAllChangeRequests(panel: vscode.WebviewPanel, requestCode: string) {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder is open');
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const changeRequestsFilePath = path.join(workspaceRoot, 'change_requests', `${requestCode}.json`);
        
        // Read file contents
        if (!fs.existsSync(changeRequestsFilePath)) {
            throw new Error(`Change requests file not found: ${changeRequestsFilePath}`);
        }
        
        const fileContent = fs.readFileSync(changeRequestsFilePath, 'utf8');
        let changeRequestsData = JSON.parse(fileContent);
        
        // Find the target data array
        let targetArray = changeRequestsData;
        if (!Array.isArray(changeRequestsData)) {
            if (changeRequestsData.changeRequests && Array.isArray(changeRequestsData.changeRequests)) {
                targetArray = changeRequestsData.changeRequests;
            } else if (changeRequestsData.items && Array.isArray(changeRequestsData.items)) {
                targetArray = changeRequestsData.items;
            } else {
                for (const key of Object.keys(changeRequestsData)) {
                    if (Array.isArray(changeRequestsData[key])) {
                        targetArray = changeRequestsData[key];
                        break;
                    }
                }
            }
        }
        
        // Count number of updated requests
        let approvedCount = 0;
        
        // Update all pending change requests
        for (const changeRequest of targetArray) {
            // If not processed or rejected - approve it
            if (!changeRequest.IsProcessed && !changeRequest.IsRejected) {
                changeRequest.IsApproved = true;
                changeRequest.IsRejected = false;
                approvedCount++;
            }
        }
        
        // Save the updated file
        fs.writeFileSync(changeRequestsFilePath, JSON.stringify(changeRequestsData, null, 2), 'utf8');
        
        // Reload and send updated data to the webview
        await loadAndSendChangeRequests(panel, requestCode);
        
        // Show a success message
        vscode.window.showInformationMessage(`${approvedCount} change requests approved successfully`);
        
    } catch (error) {
        console.error("[Extension] Failed to approve all change requests:", error);
        vscode.window.showErrorMessage(`Failed to approve all change requests: ${error.message}`);
        panel.webview.postMessage({ command: 'setError', text: `Failed to approve all change requests: ${error.message}` });
    }
}

/**
 * Handles rejecting all pending change requests.
 * @param panel The webview panel.
 * @param requestCode The validation request code.
 * @param reason The reason for rejection.
 */
async function handleRejectAllChangeRequests(panel: vscode.WebviewPanel, requestCode: string, reason?: string) {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder is open');
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const changeRequestsFilePath = path.join(workspaceRoot, 'change_requests', `${requestCode}.json`);
        
        // Read file contents
        if (!fs.existsSync(changeRequestsFilePath)) {
            throw new Error(`Change requests file not found: ${changeRequestsFilePath}`);
        }
        
        const fileContent = fs.readFileSync(changeRequestsFilePath, 'utf8');
        let changeRequestsData = JSON.parse(fileContent);
        
        // Find the target data array
        let targetArray = changeRequestsData;
        if (!Array.isArray(changeRequestsData)) {
            if (changeRequestsData.changeRequests && Array.isArray(changeRequestsData.changeRequests)) {
                targetArray = changeRequestsData.changeRequests;
            } else if (changeRequestsData.items && Array.isArray(changeRequestsData.items)) {
                targetArray = changeRequestsData.items;
            } else {
                for (const key of Object.keys(changeRequestsData)) {
                    if (Array.isArray(changeRequestsData[key])) {
                        targetArray = changeRequestsData[key];
                        break;
                    }
                }
            }
        }
        
        // Count number of updated requests
        let rejectedCount = 0;
        
        // Update all pending change requests
        for (const changeRequest of targetArray) {
            // If not processed or approved - reject it
            if (!changeRequest.IsProcessed && !changeRequest.IsApproved) {
                changeRequest.IsApproved = false;
                changeRequest.IsRejected = true;
                if (reason) {
                    changeRequest.RejectionReason = reason;
                }
                rejectedCount++;
            }
        }
        
        // Save the updated file
        fs.writeFileSync(changeRequestsFilePath, JSON.stringify(changeRequestsData, null, 2), 'utf8');
        
        // Reload and send updated data to the webview
        await loadAndSendChangeRequests(panel, requestCode);
        
        // Show a success message
        vscode.window.showInformationMessage(`${rejectedCount} change requests rejected successfully`);
        
    } catch (error) {
        console.error("[Extension] Failed to reject all change requests:", error);
        vscode.window.showErrorMessage(`Failed to reject all change requests: ${error.message}`);
        panel.webview.postMessage({ command: 'setError', text: `Failed to reject all change requests: ${error.message}` });
    }
}

/**
 * Handles applying all approved change requests to the model.
 * @param panel The webview panel.
 * @param requestCode The validation request code.
 */
async function handleApplyAllChangeRequests(panel: vscode.WebviewPanel, requestCode: string) {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder is open');
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const changeRequestsFilePath = path.join(workspaceRoot, 'change_requests', `${requestCode}.json`);
        
        // Read file contents
        if (!fs.existsSync(changeRequestsFilePath)) {
            throw new Error(`Change requests file not found: ${changeRequestsFilePath}`);
        }
        
        const fileContent = fs.readFileSync(changeRequestsFilePath, 'utf8');
        let changeRequestsData = JSON.parse(fileContent);
        
        // Find the target data array
        let targetArray = changeRequestsData;
        if (!Array.isArray(changeRequestsData)) {
            if (changeRequestsData.changeRequests && Array.isArray(changeRequestsData.changeRequests)) {
                targetArray = changeRequestsData.changeRequests;
            } else if (changeRequestsData.items && Array.isArray(changeRequestsData.items)) {
                targetArray = changeRequestsData.items;
            } else {
                for (const key of Object.keys(changeRequestsData)) {
                    if (Array.isArray(changeRequestsData[key])) {
                        targetArray = changeRequestsData[key];
                        break;
                    }
                }
            }
        }
        
        // Import required utilities
        const { XPathUtils } = require('../utils/xpathUtils');
        const { ModelService } = require('../services/modelService');
        const modelService = ModelService.getInstance();
        
        // Get the model file path
        const modelFilePath = modelService.getCurrentFilePath();
        if (!modelFilePath) {
            throw new Error('No model file path is available');
        }
        
        // Read the model file directly
        const modelFileContent = fs.readFileSync(modelFilePath, 'utf8');
        const modelJson = JSON.parse(modelFileContent);
        
        // Count number of updated requests
        let appliedCount = 0;
        let failedCount = 0;
        
        // Apply all approved change requests
        for (const changeRequest of targetArray) {
            // If approved and not processed and has automation available - apply it
            if (changeRequest.IsApproved && !changeRequest.IsProcessed && changeRequest.IsAutomatedChangeAvailable) {
                try {
                    // Get the property path from the change request
                    const propertyPath = changeRequest.PropertyPath || changeRequest.propertyPath;
                    
                    // Get the new value to set
                    const newValue = changeRequest.NewValue || changeRequest.newValue;
                    
                    if (propertyPath) {
                        // Apply the change using XPathUtils
                        const changeApplied = XPathUtils.setValue(modelJson, propertyPath, newValue);
                        
                        if (changeApplied) {
                            // Mark as processed
                            changeRequest.IsProcessed = true;
                            appliedCount++;
                            console.log(`[Extension] Successfully applied change to path: ${propertyPath}`);
                        } else {
                            failedCount++;
                            console.error(`[Extension] Failed to apply change: could not find property at path ${propertyPath}`);
                            // Keep trying other changes
                        }
                    } else {
                        // If there's no explicit PropertyPath, try to use the PropertyName
                        const propertyName = changeRequest.PropertyName || changeRequest.propertyName;
                        
                        if (propertyName) {
                            // Try to use property name as a direct path
                            const changeApplied = XPathUtils.setValue(modelJson, `root/${propertyName}`, newValue);
                            
                            if (changeApplied) {
                                // Mark as processed
                                changeRequest.IsProcessed = true;
                                appliedCount++;
                                console.log(`[Extension] Successfully applied change to property: ${propertyName}`);
                            } else {
                                failedCount++;
                                console.error(`[Extension] Failed to apply change: could not find property ${propertyName}`);
                                // Keep trying other changes
                            }
                        } else {
                            failedCount++;
                            console.error("[Extension] Change request does not specify a property path or name");
                            // Keep trying other changes
                        }
                    }
                } catch (e) {
                    failedCount++;
                    console.error(`[Extension] Error applying change:`, e);
                    // Keep trying other changes
                }
            }
        }
        
        // Save the model if any changes were applied
        if (appliedCount > 0) {
            // Write the modified JSON directly to the model file
            fs.writeFileSync(modelFilePath, JSON.stringify(modelJson, null, 2), 'utf8');
        }
        
        // Save the updated change requests file
        fs.writeFileSync(changeRequestsFilePath, JSON.stringify(changeRequestsData, null, 2), 'utf8');
        
        // Reload and send updated data to the webview
        await loadAndSendChangeRequests(panel, requestCode);
        
        // Show a success message with details
        if (appliedCount > 0) {
            const message = failedCount > 0 ?
                `Applied ${appliedCount} change requests successfully with ${failedCount} failures` :
                `${appliedCount} change requests applied successfully`;
            vscode.window.showInformationMessage(message);
        } else if (failedCount > 0) {
            vscode.window.showErrorMessage(`Failed to apply ${failedCount} change requests`);
        } else {
            vscode.window.showInformationMessage(`No change requests to apply`);
        }
        
    } catch (error) {
        console.error("[Extension] Failed to apply all change requests:", error);
        vscode.window.showErrorMessage(`Failed to apply all change requests: ${error.message}`);
        panel.webview.postMessage({ command: 'setError', text: `Failed to apply all change requests: ${error.message}` });
    }
}
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
        // CORRECTED: Ensure this path matches where change requests are saved
        const changeRequestsFilePath = path.join(workspaceRoot, 'validation_change_requests', `${requestCode}.json`);
        
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
        panel.webview.postMessage({ command: 'modelValidationSetError', text: `Failed to load change requests: ${error.message}` });
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
                    return;                case 'applyAllChangeRequests':
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
export function getWebviewContent(scriptUri: vscode.Uri, requestCode: string, cspSource: string, webview: vscode.Webview): string {
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
                
                .action-controls {
                    display: flex;
                    gap: 10px;
                    align-items: center;
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
                    margin-bottom: 4px;
                    display: block;
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
                
                .action-button.secondary {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                
                .action-button.secondary:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                }
                
                .action-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .checkbox-cell {
                    text-align: center;
                    vertical-align: middle;
                    width: 5%;
                }
                
                input[type="checkbox"] {
                    cursor: pointer;
                    width: 16px;
                    height: 16px;
                }
                
                input[type="checkbox"]:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }                .batch-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 10px;
                    margin-bottom: 10px;
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
                
                .rejection-reason {
                    margin-top: 4px;
                    color: var(--vscode-errorForeground);
                    font-size: 0.85em;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 100%;
                    white-space: nowrap;
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
                    white-space: normal;
                    word-break: break-word;
                    overflow-wrap: break-word;
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
                <h1>Model Change Suggestions</h1>
                <div>Validation Request: <span id="requestCodeDisplay" class="mono">${requestCode}</span></div>
            </div>            <div class="toolbar">
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
                <div class="action-controls">
                    <button id="applyAllApprovedBtn" class="action-button" title="Apply all approved change requests that haven't been applied yet">Apply All Approved</button>
                </div>
            </div>
            
            <div class="batch-actions">
                <button id="approveSelectedBtn" class="action-button" title="Approve all selected change requests that haven't been processed">Approve Selected</button>
                <button id="rejectSelectedBtn" class="action-button reject" title="Reject all selected change requests that haven't been processed">Reject Selected</button>
            </div>
            
            <!-- This is where the table will be rendered -->
            <div id="changeRequestsContainer">
                <div class="empty-state">
                    <p>Loading change requests...</p>
                </div>
            </div>            <!-- Individual Reject Modal -->
            <div id="rejectModal" class="modal">
                <div class="modal-content">
                    <h3 class="modal-title">Reject Change Request</h3>
                    <div class="form-group">
                        <label for="rejectionReason">Rejection Reason:</label>
                        <textarea id="rejectionReason" placeholder="Please provide a reason for rejection..."></textarea>
                    </div>                    <div class="form-actions">
                        <button id="confirmReject" class="action-button reject">Confirm Reject</button>
                        <button id="cancelReject" class="action-button secondary">Cancel</button>
                    </div>
                </div>
            </div>
            
            <!-- Batch Reject Modal -->
            <div id="batchRejectModal" class="modal">
                <div class="modal-content">
                    <h3 class="modal-title">Reject Selected Change Suggestions</h3>
                    <div class="form-group">
                        <label for="batchRejectionReason">Rejection Reason:</label>
                        <textarea id="batchRejectionReason" placeholder="Please provide a reason for rejecting the selected suggestions..."></textarea>
                    </div>                    <div class="form-actions">
                        <button id="confirmBatchReject" class="action-button reject">Confirm Reject</button>
                        <button id="cancelBatchReject" class="action-button secondary">Cancel</button>
                    </div>
                </div>
            </div>
            
            <!-- Confirmation Modal -->
            <div id="confirmModal" class="modal">
                <div class="modal-content">
                    <h3 class="modal-title">Are you sure?</h3>
                    <div class="form-group">
                        <p id="confirmMessage"></p>
                    </div>                    <div class="form-actions">
                        <button id="confirmAction" class="action-button">Confirm</button>
                        <button id="cancelConfirm" class="action-button secondary">Cancel</button>
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
        const changeRequestsFilePath = path.join(workspaceRoot, 'validation_change_requests', `${requestCode}.json`);
        
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
        
        // Notify webview that the operation is complete
        panel.webview.postMessage({ command: 'operationComplete' });
        
        // Show no success message
        // vscode.window.showInformationMessage(`Change request ${changeRequestCode} approved successfully`);
          } catch (error) {
        console.error("[Extension] Failed to approve change request:", error);
        vscode.window.showErrorMessage(`Failed to approve change request: ${error.message}`);
        panel.webview.postMessage({ command: 'modelValidationSetError', text: `Failed to approve change request: ${error.message}` });
        // Ensure we notify the webview to hide the spinner
        panel.webview.postMessage({ command: 'operationComplete' });
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
        const changeRequestsFilePath = path.join(workspaceRoot, 'validation_change_requests', `${requestCode}.json`);
        
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
        
        // Notify webview that the operation is complete
        panel.webview.postMessage({ command: 'operationComplete' });
        
        // Show no success message
        // vscode.window.showInformationMessage(`Change request ${changeRequestCode} rejected successfully`);
          } catch (error) {
        console.error("[Extension] Failed to reject change request:", error);
        vscode.window.showErrorMessage(`Failed to reject change request: ${error.message}`);
        panel.webview.postMessage({ command: 'modelValidationSetError', text: `Failed to reject change request: ${error.message}` });
        // Ensure we notify the webview to hide the spinner
        panel.webview.postMessage({ command: 'operationComplete' });
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
        const changeRequestsFilePath = path.join(workspaceRoot, 'validation_change_requests', `${requestCode}.json`);
        
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
        
        // Check for unsaved changes
        if (modelService.hasUnsavedChangesInMemory()) {
            // Ask the user what to do about unsaved changes
            const result = await vscode.window.showWarningMessage(
                'You have unsaved changes that will be lost if you apply this change request. Save changes first?',
                'Save and Apply',
                'Apply without Saving',
                'Cancel'
            );
            
            if (result === 'Save and Apply') {
                // Save current model
                const model = modelService.getCurrentModel();
                if (model) {
                    await modelService.saveToFile(model);
                }
            } else if (result === 'Cancel') {
                console.log("[Extension] Apply change request cancelled due to unsaved changes");
                panel.webview.postMessage({ command: 'modelValidationSetStatus', text: 'Operation cancelled. Your unsaved changes have been preserved.' });
                return;
            }
            // If "Apply without Saving" was selected, we continue without saving
        }
        
        // Get the model file path
        const modelFilePath = modelService.getCurrentFilePath();
        if (!modelFilePath) {
            throw new Error('No model file path is available');
        }
        
        // Read the model file directly
        const modelFileContent = fs.readFileSync(modelFilePath, 'utf8');
        const modelJson = JSON.parse(modelFileContent);
        
        // Get property information from the change request
        const modelXPath = changeRequest.ModelXPath || changeRequest.modelXPath;
        const propertyPath = changeRequest.PropertyPath || changeRequest.propertyPath;
        const propertyName = changeRequest.PropertyName || changeRequest.propertyName;
        const oldValue = changeRequest.OldValue !== undefined ? changeRequest.OldValue : changeRequest.oldValue;
        const newValue = changeRequest.NewValue !== undefined ? changeRequest.NewValue : changeRequest.newValue;
        
        // Validate that we have the necessary information to proceed
        if (!modelXPath && !propertyPath && !propertyName) {
            throw new Error('Change request does not specify a property location (ModelXPath, PropertyPath, or PropertyName)');
        }
        
        let targetObject = null;
        let currentValue = null;
        
        // First try to use ModelXPath if available - this is the most precise way to locate the property
        if (modelXPath) {
            console.log(`[Extension] Using ModelXPath to locate property: ${modelXPath}`);
            
            // Use getValue with JSONPath instead of query which doesn't exist
            const result = XPathUtils.getValue(modelJson, modelXPath);
            
            if (result === undefined) {
                throw new Error(`No objects found at XPath: ${modelXPath}`);
            }
            
            // Handle the case where JSONPath might return an array of results or a single object
            targetObject = Array.isArray(result) ? result[0] : result;
                    
            if (!targetObject) {
                throw new Error(`No matching object found at XPath: ${modelXPath}`);
            }
            
            // If we have the object but need to access a specific property
            if (propertyName) {
                // Get the current value if it exists, or undefined if not
                currentValue = targetObject[propertyName];
                
                // Continue even if property doesn't exist, we'll create it when applying the change
                console.log(`[Extension] Property '${propertyName}' ${currentValue === undefined ? "not found" : "found"} in object at XPath: ${modelXPath}`);
            } else {
                // Get the entire object value
                currentValue = targetObject;
            }
            
            console.log(`[Extension] Found target object using ModelXPath, property: ${propertyName}, currentValue:`, currentValue);
        }
        // Fall back to PropertyPath if ModelXPath isn't available or didn't work
        else if (propertyPath) {
            console.log(`[Extension] Using PropertyPath to locate property: ${propertyPath}`);
            currentValue = XPathUtils.getValue(modelJson, propertyPath);
            
            // Allow property to not exist - we'll create it when applying changes
            if (currentValue === undefined) {
                console.log(`[Extension] Property not found at path: ${propertyPath}, will be created`);
            }
        }
        // Last resort - try to construct a path from PropertyName
        else if (propertyName) {
            const constructedPath = `root/${propertyName}`;
            console.log(`[Extension] Using constructed path to locate property: ${constructedPath}`);
            currentValue = XPathUtils.getValue(modelJson, constructedPath);
            
            // Allow property to not exist - we'll create it when applying changes
            if (currentValue === undefined) {
                console.log(`[Extension] Property not found at constructed path: ${constructedPath}, will be created`);
            }
        }
        
        // Verify the current value matches the old value from the change request
        if (currentValue !== undefined && JSON.stringify(currentValue) !== JSON.stringify(oldValue)) {
            console.error(`[Extension] Value mismatch: Current value (${JSON.stringify(currentValue)}) ` + 
                         `doesn't match expected old value (${JSON.stringify(oldValue)})`);
            
            // Mark as rejected with out of date reason
            changeRequest.IsApproved = false;
            changeRequest.IsRejected = true;
            changeRequest.RejectionReason = "The property value has changed since this request was created. Changes are out of date.";
            changeRequest.IsProcessed = true; // Mark as processed since we've handled it
            
            // Save the updated change requests file
            fs.writeFileSync(changeRequestsFilePath, JSON.stringify(changeRequestsData, null, 2), 'utf8');
            
            // Reload and send updated data to the webview
            await loadAndSendChangeRequests(panel, requestCode);
            
            // Show a warning message
            vscode.window.showWarningMessage(`Change request ${changeRequestCode} rejected: Current model value doesn't match the expected old value`);
            return;
        }
        
        // Apply the change based on how we found the property
        let changeApplied = false;
        
        if (modelXPath && targetObject) {
            if (propertyName) {
                // Update the property in the found object
                console.log(`[Extension] Updating property '${propertyName}' in object at XPath: ${modelXPath}`);
                targetObject[propertyName] = newValue;
                changeApplied = true;
            } else {
                // The entire object is being replaced
                console.log(`[Extension] Replacing entire object at XPath: ${modelXPath}`);
                
                // This is more complex and would require finding the parent object and index
                // For now, we'll throw an error since this case is less common
                throw new Error(`Replacing entire objects via ModelXPath is not yet supported`);
            }
        } else if (propertyPath) {
            // Use PropertyPath to set the value
            console.log(`[Extension] Setting value at PropertyPath: ${propertyPath}`);
            changeApplied = XPathUtils.setValue(modelJson, propertyPath, newValue);
        } else if (propertyName) {
            // Use the constructed path to set the value
            const constructedPath = `root/${propertyName}`;
            console.log(`[Extension] Setting value at constructed path: ${constructedPath}`);
            changeApplied = XPathUtils.setValue(modelJson, constructedPath, newValue);
        }
        
        if (!changeApplied) {
            throw new Error(`Failed to apply change: could not set the new value`);
        }
        
        // Save the modified model JSON back to the file
        fs.writeFileSync(modelFilePath, JSON.stringify(modelJson, null, 2), 'utf8');
        
        // Mark the change request as processed
        changeRequest.IsProcessed = true;
        
        // Save the updated change requests file
        fs.writeFileSync(changeRequestsFilePath, JSON.stringify(changeRequestsData, null, 2), 'utf8');
        
        // Reload and send updated data to the webview
        await loadAndSendChangeRequests(panel, requestCode);
        
        // Show no success message
        // vscode.window.showInformationMessage(`Change request ${changeRequestCode} applied successfully`);
        
    } catch (error) {
        console.error("[Extension] Failed to apply change request:", error);
        vscode.window.showErrorMessage(`Failed to apply change request: ${error.message}`);
        panel.webview.postMessage({ command: 'modelValidationSetError', text: `Failed to apply change request: ${error.message}` });
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
        const changeRequestsFilePath = path.join(workspaceRoot, 'validation_change_requests', `${requestCode}.json`);
        
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
        
        // Check for unsaved changes
        if (modelService.hasUnsavedChangesInMemory()) {
            // Ask the user what to do about unsaved changes
            const result = await vscode.window.showWarningMessage(
                'You have unsaved changes that will be lost if you apply all change requests. Save changes first?',
                'Save and Apply All',
                'Apply All without Saving',
                'Cancel'
            );
            
            if (result === 'Save and Apply All') {
                // Save current model
                const model = modelService.getCurrentModel();
                if (model) {
                    await modelService.saveToFile(model);
                }
            } else if (result === 'Cancel') {
                console.log("[Extension] Apply all change requests cancelled due to unsaved changes");
                panel.webview.postMessage({ command: 'modelValidationSetStatus', text: 'Operation cancelled. Your unsaved changes have been preserved.' });
                return;
            }
            // If "Apply All without Saving" was selected, we continue without saving
        }
        
        // Get the model file path
        const modelFilePath = modelService.getCurrentFilePath();
        if (!modelFilePath) {
            throw new Error('No model file path is available');
        }
        
        // Read the model file directly
        const modelFileContent = fs.readFileSync(modelFilePath, 'utf8');
        const modelJson = JSON.parse(modelFileContent);
        
        // Count successful applications
        let appliedCount = 0;
        let rejectedCount = 0;        // Filter for approved but not processed change requests
        const approvableRequests = targetArray.filter(
            (cr: any) => cr.IsApproved && !cr.IsProcessed
        );
        
        // Process each change request
        for (const changeRequest of approvableRequests) {
            try {
                // Get property information from the change request
                const modelXPath = changeRequest.ModelXPath || changeRequest.modelXPath;
                const propertyPath = changeRequest.PropertyPath || changeRequest.propertyPath;
                const propertyName = changeRequest.PropertyName || changeRequest.propertyName;
                const oldValue = changeRequest.OldValue !== undefined ? changeRequest.OldValue : changeRequest.oldValue;
                const newValue = changeRequest.NewValue !== undefined ? changeRequest.NewValue : changeRequest.newValue;
                
                // Validate that we have the necessary information to proceed
                if (!modelXPath && !propertyPath && !propertyName) {
                    console.warn(`[Extension] Change request ${changeRequest.Code} does not specify a property location`);
                    continue;
                }
                
                let targetObject = null;
                let currentValue = null;
                
                // First try to use ModelXPath if available - this is the most precise way to locate the property
                if (modelXPath) {
                    console.log(`[Extension] Using ModelXPath to locate property: ${modelXPath}`);
                    
                    // Use getValue with JSONPath
                    const result = XPathUtils.getValue(modelJson, modelXPath);
                    
                    if (result === undefined) {
                        throw new Error(`No objects found at XPath: ${modelXPath}`);
                    }
                    
                    // Handle the case where JSONPath might return an array of results or a single object
                    targetObject = Array.isArray(result) ? result[0] : result;
                    
                    if (!targetObject) {
                        throw new Error(`No matching object found at XPath: ${modelXPath}`);
                    }
                    
                    // If we have the object but need to access a specific property within it
                    if (propertyName) {
                        // Get the current value if it exists, or undefined if not
                        currentValue = targetObject[propertyName];
                        
                        // Continue even if property doesn't exist, we'll create it when applying the change
                        console.log(`[Extension] Property '${propertyName}' ${currentValue === undefined ? "not found" : "found"} in object at XPath: ${modelXPath}`);
                    } else {
                        // Get the entire object value
                        currentValue = targetObject;
                    }
                }
                // Fall back to PropertyPath if ModelXPath isn't available or didn't work
                else if (propertyPath) {
                    console.log(`[Extension] Using PropertyPath to locate property: ${propertyPath}`);
                    currentValue = XPathUtils.getValue(modelJson, propertyPath);
                    
                    // Allow property to not exist - we'll create it when applying changes
                    if (currentValue === undefined) {
                        console.log(`[Extension] Property not found at path: ${propertyPath}, will be created`);
                    }
                }
                // Last resort - try to construct a path from PropertyName
                else if (propertyName) {
                    const constructedPath = `root/${propertyName}`;
                    console.log(`[Extension] Using constructed path to locate property: ${constructedPath}`);
                    currentValue = XPathUtils.getValue(modelJson, constructedPath);
                    
                    // Allow property to not exist - we'll create it when applying changes
                    if (currentValue === undefined) {
                        console.log(`[Extension] Property not found at constructed path: ${constructedPath}, will be created`);
                    }
                }
                
                // Verify the current value matches the old value from the change request
                if (currentValue !== undefined && JSON.stringify(currentValue) !== JSON.stringify(oldValue)) {
                    console.error(`[Extension] Value mismatch for change request ${changeRequest.Code}: ` + 
                                 `Current value (${JSON.stringify(currentValue)}) ` + 
                                 `doesn't match expected old value (${JSON.stringify(oldValue)})`);
                    
                    // Mark as rejected with out of date reason
                    changeRequest.IsApproved = false;
                    changeRequest.IsRejected = true;
                    changeRequest.RejectionReason = "The property value has changed since this request was created. Changes are out of date.";
                    changeRequest.IsProcessed = true; // Mark as processed since we've handled it
                    rejectedCount++;
                    continue;
                }
                
                // Apply the change based on how we found the property
                let changeApplied = false;
                
                if (modelXPath && targetObject) {
                    if (propertyName) {
                        // Update the property in the found object
                        console.log(`[Extension] Updating property '${propertyName}' in object at XPath: ${modelXPath}`);
                        targetObject[propertyName] = newValue;
                        changeApplied = true;
                    } else {
                        // The entire object is being replaced
                        throw new Error(`Replacing entire objects via ModelXPath is not yet supported`);
                    }
                } else if (propertyPath) {
                    // Use PropertyPath to set the value
                    console.log(`[Extension] Setting value at PropertyPath: ${propertyPath}`);
                    changeApplied = XPathUtils.setValue(modelJson, propertyPath, newValue);
                } else if (propertyName) {
                    // Use the constructed path to set the value
                    const constructedPath = `root/${propertyName}`;
                    console.log(`[Extension] Setting value at constructed path: ${constructedPath}`);
                    changeApplied = XPathUtils.setValue(modelJson, constructedPath, newValue);
                }
                
                if (!changeApplied) {
                    throw new Error(`Failed to apply change: could not set the new value`);
                }
                
                // Mark as successfully processed
                changeRequest.IsProcessed = true;
                appliedCount++;
                
            } catch (error) {
                console.error(`[Extension] Error applying change request ${changeRequest.Code || changeRequest.code}:`, error);
                
                // Mark as failed
                changeRequest.IsRejected = true;
                changeRequest.RejectionReason = `Failed to apply: ${error.message}`;
                rejectedCount++;
            }
        }
        
        // Save the modified model JSON back to the file if any changes were applied
        if (appliedCount > 0) {
            fs.writeFileSync(modelFilePath, JSON.stringify(modelJson, null, 2), 'utf8');
        }
        
        // Save the updated change requests file
        fs.writeFileSync(changeRequestsFilePath, JSON.stringify(changeRequestsData, null, 2), 'utf8');
          // Reload and send updated data to the webview
        await loadAndSendChangeRequests(panel, requestCode);
        
        // Notify webview that the operation is complete
        panel.webview.postMessage({ command: 'operationComplete' });
        
        // Show a summary message
        if (appliedCount > 0 && rejectedCount > 0) {
            vscode.window.showInformationMessage(`Applied ${appliedCount} change requests. ${rejectedCount} change requests were rejected.`);
        } else if (appliedCount > 0) {
            vscode.window.showInformationMessage(`Successfully applied ${appliedCount} change requests.`);
        } else if (rejectedCount > 0) {
            vscode.window.showWarningMessage(`${rejectedCount} change requests were rejected. No changes were applied.`);
        } else {
            // vscode.window.showInformationMessage(`No change requests were applied.`);
        }
          } catch (error) {
        console.error("[Extension] Failed to apply all change requests:", error);
        vscode.window.showErrorMessage(`Failed to apply all change requests: ${error.message}`);
        panel.webview.postMessage({ command: 'modelValidationSetError', text: `Failed to apply all change requests: ${error.message}` });
        // Ensure we notify the webview to hide the spinner
        panel.webview.postMessage({ command: 'operationComplete' });
    }
}


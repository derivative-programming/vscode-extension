// modelValidationView.js
// Webview for displaying Model Validation requests in a paged, sortable table
// Last modified: May 4, 2025
// This file provides a professional, VS Code-consistent UI for model validation requests.

(function () {
    // Get VS Code API
    const vscode = acquireVsCodeApi();
    
    // State management
    let validationData = [];
    let pageNumber = 1;
    let itemCountPerPage = 10;
    let orderByColumn = "ModelValidationRequestRequestedUTCDateTime";
    let orderByDescending = true;
    let totalRecords = 0;
    const columns = [
        { key: "modelValidationRequestRequestedUTCDateTime", label: "Requested At" },
        { key: "modelValidationRequestDescription", label: "Description" },
        { key: "status", label: "Status" },
        { key: "viewDetails", label: "View" } // Added View column
    ];

    // Spinner control functions (moved to global scope within IIFE)
    function showSpinner() { 
        console.log("[Webview] showSpinner called");
        document.getElementById("spinnerOverlay").style.display = "flex"; 
    }
    function hideSpinner() { 
        console.log("[Webview] hideSpinner called");
        document.getElementById("spinnerOverlay").style.display = "none"; 
    }

    // Set up the UI
    initializeUI();

    // Event listeners
    window.addEventListener("message", function(event) {
        const message = event.data;
        console.log("[Webview] Received message:", message.command, message.data);
        if (message.command === "setValidationData") {
            console.log("[Webview] Handling setValidationData");
            validationData = message.data.items || [];
            pageNumber = message.data.pageNumber || 1;
            itemCountPerPage = message.data.itemCountPerPage || 10;
            orderByColumn = message.data.orderByColumnName || orderByColumn;
            orderByDescending = message.data.orderByDescending || false;
            totalRecords = message.data.recordsTotal || 0;
            renderTable();
            renderPaging();
            // Hide spinner when data is set
            hideSpinner();
        } else if (message.command === "validationRequestReceived" || message.command === "validationRequestFailed") {
            console.log("[Webview] Handling", message.command);
            // Hide spinner when validation request is received or failed
            hideSpinner();
        } else if (message.command === "validationRequestCancelled") {
            console.log("[Webview] Request cancelled successfully, refreshing data");
            hideSpinner();
            // Refresh the current page after a successful cancel
            requestPage(pageNumber);
        }
    });

    function initializeUI() {
        // Create main container structure
        document.body.innerHTML = `
            <link rel="stylesheet" href="https://unpkg.com/@vscode/codicons@latest/dist/codicon.css" />
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-editor-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 15px;
                    margin: 0;
                }
                
                .validation-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    box-sizing: border-box;
                }
                
                .validation-header {
                    padding: 10px 0;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    margin-bottom: 15px;
                }
                
                .validation-header h2 {
                    margin: 0;
                    font-size: 1.3em;
                    font-weight: normal;
                    color: var(--vscode-editor-foreground);
                }

                /* Added toolbar styles for refresh button */
                .toolbar {
                    display: flex;
                    justify-content: flex-end;
                    margin-bottom: 10px;
                }
                .refresh-button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 4px 8px;
                    cursor: pointer;
                    border-radius: 3px;
                    display: flex;
                    align-items: center;
                }
                .refresh-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .add-button {
                    margin-right: 8px;
                }
                /* Modal styles */
                .modal {
                    position: fixed;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    background: rgba(0,0,0,0.4);
                    display: none;
                    align-items: center; justify-content: center;
                }
                .modal-content {
                    background: var(--vscode-editor-background);
                    padding: 20px;
                    border-radius: 4px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    width: 300px;
                }
                .modal-content h3 {
                    margin-top: 0;
                    margin-bottom: 10px;
                    font-size: 1.1em;
                }
                .modal-content label {
                    display: block;
                    margin-bottom: 10px;
                }
                .modal-content input {
                    width: 100%;
                    padding: 4px;
                    /* Ensure input uses VS Code styles */
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
                    box-sizing: border-box; /* Include padding and border in width */
                }
                /* New styles for modal buttons */
                .modal-buttons {
                    display: flex;
                    justify-content: flex-end; /* Right justify buttons */
                    margin-top: 15px; /* Add space above buttons */
                    gap: 8px; /* Space between buttons */
                }
                .modal-button-secondary {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                .modal-button-secondary:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                }
                
                .validation-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                
                .table-container {
                    overflow: auto;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 3px;
                    background-color: var(--vscode-editor-background);
                }
                
                .validation-table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                }
                
                .validation-table th {
                    text-align: left;
                    padding: 8px 12px;
                    font-weight: 600;
                    background-color: var(--vscode-editor-lineHighlightBackground);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    position: sticky;
                    top: 0;
                    z-index: 1;
                    cursor: pointer;
                }
                
                .validation-table th:hover {
                    background-color: var(--vscode-list-hoverBackground);
                }
                
                .validation-table td {
                    padding: 8px 12px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .validation-table tr:hover {
                    background-color: var(--vscode-list-hoverBackground);
                }
                
                .validation-table a {
                    color: var(--vscode-textLink-foreground);
                    text-decoration: none;
                }
                
                .validation-table a:hover {
                    text-decoration: underline;
                }
                
                .footer-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 10px;
                }
                
                .paging-controls {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    justify-content: flex-end;
                }
                
                .paging-controls button {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: none;
                    padding: 4px 10px;
                    cursor: pointer;
                    border-radius: 3px;
                    min-height: 24px;
                }
                
                .paging-controls button:hover:not(:disabled) {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                }
                
                .paging-controls button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                .paging-controls span {
                    color: var(--vscode-descriptionForeground);
                }
                
                .success-badge {
                    background-color: var(--vscode-testing-iconPassed, #89D185);
                    color: var(--vscode-editor-background);
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 0.8em;
                    display: inline-block;
                    text-align: center;
                    font-weight: 500;
                }
                
                .failure-badge {
                    background-color: var(--vscode-testing-iconFailed, #f14c4c);
                    color: var(--vscode-editor-background);
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 0.8em;
                    display: inline-block;
                    text-align: center;
                    font-weight: 500;
                }

                .processing-badge {
                    background-color: var(--vscode-button-background, #0E639C); /* Changed from infoBackground */
                    color: var(--vscode-button-foreground, #FFFFFF); /* Ensure text is contrasty */
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 0.8em;
                    display: inline-block;
                    text-align: center;
                    font-weight: 500;
                }

                .view-button {
                    padding: 4px 8px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                    font-family: var(--vscode-font-family);
                }
                
                .view-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                
                .empty-state {
                    text-align: center;
                    padding: 40px 20px;
                    color: var(--vscode-descriptionForeground);
                    font-style: italic;
                    background-color: var(--vscode-editor-background);
                }

                /* Spinner overlay for processing */
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
                    z-index: 1000;
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
            </style>
            <div class="validation-container">
                <!-- Spinner overlay -->
                <div id="spinnerOverlay" class="spinner-overlay">
                    <div class="spinner"></div>
                </div>
                <div class="validation-header">
                    <h2>Model Validation Requests</h2>
                </div>
                <div class="toolbar">
                    <button id="addButton" class="refresh-button add-button" title="Add Request">
                        Add
                    </button>
                    <button id="refreshButton" class="refresh-button" title="Refresh Table">
                        Refresh
                    </button>
                </div>
                <div class="validation-content">
                    <div class="table-container">
                        <table id="validationTable" class="validation-table"></table>
                    </div>
                    <div class="footer-controls">
                        <div id="paging" class="paging-controls"></div>
                        <div class="table-info"><span id="record-info"></span></div>
                    </div>
                </div>
                <!-- Add Request Modal -->
                <div id="addModal" class="modal">
                    <div class="modal-content">
                        <h3>Add Validation Request</h3>
                        <label>Description:<br><input type="text" id="addDescription" /></label>
                        <div class="modal-buttons"> <!-- Button container -->
                            <button id="submitAdd" class="refresh-button">Add</button>
                            <button id="cancelAdd" class="refresh-button modal-button-secondary">Cancel</button> <!-- Apply secondary style -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Initial ready message
        vscode.postMessage({ command: "webviewReady" });

        // Attach refresh button handler
        document.getElementById("refreshButton").onclick = function() {
            requestPage(pageNumber);
        };
        // Attach add button handler
        document.getElementById("addButton").onclick = function() {
            document.getElementById("addModal").style.display = "flex";
            document.getElementById("addDescription").focus(); // Focus input on open
        };
        document.getElementById("cancelAdd").onclick = function() {
            document.getElementById("addModal").style.display = "none";
        };
        document.getElementById("submitAdd").onclick = function() {
            console.log("[Webview] Submit Add clicked");
            // Show spinner while sending request
            showSpinner();
            const desc = document.getElementById("addDescription").value;
            vscode.postMessage({ command: "addValidationRequest", data: { description: desc } });
            document.getElementById("addModal").style.display = "none";
            document.getElementById("addDescription").value = ''; // Clear input after submit
        };

        // Add keypress listener for Enter key in description input
        document.getElementById("addDescription").addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault(); // Prevent default Enter behavior (like adding newline)
                document.getElementById("submitAdd").click(); // Trigger submit button click
            }
        });
    }

    function renderTable() {
        const table = document.getElementById("validationTable");
        table.innerHTML = "";
        
        // Header
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        columns.forEach(function(col) {
            const th = document.createElement("th");
            th.textContent = col.label;
            th.style.cursor = "pointer";
            th.onclick = function () {
                if (orderByColumn === col.key) {
                    orderByDescending = !orderByDescending;
                } else {
                    orderByColumn = col.key;
                    orderByDescending = false;
                }
                requestPage(1);
            };
            if (orderByColumn === col.key) {
                th.textContent += orderByDescending ? " ▼" : " ▲";
            }
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Body
        const tbody = document.createElement("tbody");
        if (validationData.length === 0) {
            const emptyRow = document.createElement("tr");
            const emptyCell = document.createElement("td");
            emptyCell.colSpan = columns.length;
            emptyCell.className = "empty-state";
            emptyCell.textContent = "No validation requests found.";
            emptyRow.appendChild(emptyCell);
            tbody.appendChild(emptyRow);
        } else {
            validationData.forEach(function(item) {
                const row = document.createElement("tr");
                columns.forEach(function(col) {
                    const td = document.createElement("td");
                    if (col.key === "status") {
                        let status = "";
                        if (item.modelValidationRequestIsCanceled) {
                            status = "Cancelled";
                        } else if (!item.modelValidationRequestIsStarted) {
                            status = "Queued";
                        } else if (item.modelValidationRequestIsStarted && !item.modelValidationRequestIsCompleted) {
                            status = "Processing";
                        } else if (item.modelValidationRequestIsCompleted && !item.modelValidationRequestIsSuccessful) {
                            status = "Validation Error";
                        } else if (item.modelValidationRequestIsCompleted && item.modelValidationRequestIsSuccessful) {
                            status = "Validation Passed";
                        }
                        // Create badge element based on status
                        const badge = document.createElement("span");
                        if (status === "Processing") {
                            badge.className = "processing-badge";
                        } else if (status === "Validation Error") {
                            badge.className = "failure-badge";
                        } else if (status === "Validation Passed") {
                            badge.className = "success-badge";
                        }
                        badge.textContent = status;
                        td.appendChild(badge);
                    } else {
                        const value = item[col.key];
                        if (col.key === "viewDetails") { // View/action buttons column
                            // Check conditions for showing different buttons
                            const canCancel = !item.modelValidationRequestIsStarted && !item.modelValidationRequestIsCanceled;
                            const isCompleted = item.modelValidationRequestIsCompleted;
                            
                            if (canCancel) {
                                // Show Cancel Request button
                                const button = document.createElement("button");
                                button.className = "view-button"; 
                                button.textContent = "Cancel Request";
                                button.setAttribute("data-request-code", item.modelValidationRequestCode);
                                button.style.position = "relative";  // Ensure button has its own stacking context
                                button.style.zIndex = "2";  // Higher z-index than the row
                                
                                // Log that we're creating the button for debugging
                                console.log("[Webview] Created Cancel button for request:", item.modelValidationRequestCode);
                                
                                // Use addEventListener instead of onclick for better control
                                button.addEventListener("click", function(e) {
                                    console.log("[Webview] Cancel button click detected!");
                                    e.preventDefault();
                                    e.stopPropagation(); // Stop event from reaching the row
                                    
                                    const requestCode = this.getAttribute("data-request-code");
                                    console.log("[Webview] Cancel button clicked for request code:", requestCode);
                                    
                                    // Create a VS Code-friendly confirmation modal instead of using browser confirm()
                                    const confirmModal = document.createElement("div");
                                    confirmModal.className = "modal";
                                    confirmModal.style.display = "flex";
                                    confirmModal.innerHTML = `
                                        <div class="modal-content" style="width: 300px;">
                                            <h3>Cancel Validation Request</h3>
                                            <p>Are you sure you want to cancel this validation request?</p>
                                            <div class="modal-buttons">
                                                <button id="confirmCancel" class="refresh-button">Yes, Cancel</button>
                                                <button id="cancelCancel" class="refresh-button modal-button-secondary">No</button>
                                            </div>
                                        </div>
                                    `;
                                    
                                    document.body.appendChild(confirmModal);
                                    
                                    // Handle confirmation button
                                    document.getElementById("confirmCancel").addEventListener("click", function() {
                                        console.log("[Webview] User confirmed cancel, sending message to extension");
                                        showSpinner();
                                        document.body.removeChild(confirmModal);
                                        vscode.postMessage({
                                            command: "cancelValidationRequest",
                                            requestCode: requestCode
                                        });
                                    });
                                    
                                    // Handle cancel button
                                    document.getElementById("cancelCancel").addEventListener("click", function() {
                                        console.log("[Webview] User cancelled the cancel operation");
                                        document.body.removeChild(confirmModal);
                                    });
                                });
                                
                                td.appendChild(button);
                            } else if (isCompleted) {
                                // Show Details button only for completed requests
                                const button = document.createElement("button");
                                button.className = "view-button";
                                button.textContent = "Details";
                                button.onclick = function(e) {
                                    e.preventDefault();
                                    e.stopPropagation(); // Prevent row click handler
                                    console.log("[Webview] Details button clicked for request code:", item.modelValidationRequestCode);
                                    vscode.postMessage({
                                        command: "showValidationRequestDetails",
                                        requestCode: item.modelValidationRequestCode
                                    });
                                };
                                td.appendChild(button);
                            } else {
                                // For other cases, show no button
                                // const button = document.createElement("button");
                                // button.className = "view-button";
                                // button.disabled = true;
                                // button.style.opacity = "0.5";
                                // button.style.cursor = "not-allowed";
                                
                                // // Choose appropriate button text
                                // if (item.modelValidationRequestIsCanceled) {
                                //     button.textContent = "Cancelled";
                                // } else if (item.modelValidationRequestIsStarted) {
                                //     button.textContent = "Processing";
                                // } else {
                                //     button.textContent = "Unavailable";
                                // }
                                
                                // td.appendChild(button);
                            }
                        } else if (col.key === "modelValidationRequestRequestedUTCDateTime" && value) {
                            // Format date nicely
                            try {
                                const date = new Date(value);
                                td.textContent = date.toLocaleString();
                            } catch (e) {
                                td.textContent = value || "";
                            }
                        } else {
                            td.textContent = value || "";
                        }
                    }
                    row.appendChild(td);
                });
                
                // Add row click handler for item details
                row.addEventListener("click", function() {
                    vscode.postMessage({
                        command: "showValidationDetails",
                        item: item
                    });
                });
                
                tbody.appendChild(row);
            });
        }
        table.appendChild(tbody);
        
        // Update record info
        const start = validationData.length ? (pageNumber - 1) * itemCountPerPage + 1 : 0;
        const end = validationData.length ? Math.min(start + validationData.length - 1, totalRecords) : 0;
        document.getElementById("record-info").textContent = 
            validationData.length ? `Showing ${start} to ${end} of ${totalRecords} requests` : `No validation requests to display`;
    }

    function renderPaging() {
        const paging = document.getElementById("paging");
        paging.innerHTML = "";
        const totalPages = Math.ceil(totalRecords / itemCountPerPage);
        
        // First page button
        const first = document.createElement("button");
        first.textContent = "«";
        first.disabled = pageNumber <= 1;
        first.title = "First Page";
        first.onclick = function () { requestPage(1); };
        paging.appendChild(first);
        
        // Previous button
        const prev = document.createElement("button");
        prev.textContent = "‹";
        prev.disabled = pageNumber <= 1;
        prev.title = "Previous Page";
        prev.onclick = function () { requestPage(pageNumber - 1); };
        paging.appendChild(prev);
        
        // Page info
        const info = document.createElement("span");
        info.textContent = `Page ${pageNumber} of ${totalPages || 1}`;
        paging.appendChild(info);
        
        // Next button
        const next = document.createElement("button");
        next.textContent = "›";
        next.disabled = pageNumber >= totalPages;
        next.title = "Next Page";
        next.onclick = function () { requestPage(pageNumber + 1); };
        paging.appendChild(next);
        
        // Last page button
        const last = document.createElement("button");
        last.textContent = "»";
        last.disabled = pageNumber >= totalPages;
        last.title = "Last Page";
        last.onclick = function () { requestPage(totalPages); };
        paging.appendChild(last);
    }

    function requestPage(page) {
        vscode.postMessage({
            command: "requestPage",
            pageNumber: page,
            itemCountPerPage: itemCountPerPage,
            orderByColumnName: orderByColumn,
            orderByDescending: orderByDescending
        });
    }
})();
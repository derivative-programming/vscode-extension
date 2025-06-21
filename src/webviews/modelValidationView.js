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
    // Timer for auto-refresh functionality when processing/queued items exist
    let autoRefreshTimer = null;
    // Time interval for auto-refresh (1 minute in milliseconds)
    const AUTO_REFRESH_INTERVAL = 60000; // 1 minute in milliseconds
    const columns = [
        { key: "modelValidationRequestRequestedUTCDateTime", label: "Requested Date\\Time" },
        { key: "modelValidationRequestDescription", label: "Description" },
        { key: "status", label: "Status" },
        { key: "viewDetails", label: "Actions" } // Added Actions column
    ];

    // Spinner control functions (moved to global scope within IIFE)
    function showSpinner() { 
        console.log("[Webview] showSpinner called");
        document.getElementById("spinnerOverlay").style.display = "flex"; 
    }
    function hideSpinner() { 
        console.log("[Webview] hideSpinner called");
        document.getElementById("spinnerOverlay").style.display = "none"; 
    }    // Set up the UI
    initializeUI();

    // Clean up resources when page is unloaded
    // This ensures we don't leave timers running if the view is closed
    window.addEventListener("unload", function() {
        if (autoRefreshTimer) {
            clearInterval(autoRefreshTimer);
            autoRefreshTimer = null;
        }
    });

    // Event listeners
    window.addEventListener("message", function(event) {
        const message = event.data;
        console.log("[Webview] Received message:", message.command, message.data);
        if (message.command === "modelValidationSetValidationData") {
            console.log("[Webview] Handling modelValidationSetValidationData");
            validationData = message.data.items || [];
            pageNumber = message.data.pageNumber || 1;
            itemCountPerPage = message.data.itemCountPerPage || 10;
            orderByColumn = message.data.orderByColumnName || orderByColumn;
            orderByDescending = message.data.orderByDescending || false;
            totalRecords = message.data.recordsTotal || 0;            renderTable();
            renderPaging();
            // Hide spinner when data is set
            hideSpinner();
            // Check if we should set up auto-refresh based on current processing/queued items
            checkAndSetAutoRefresh();
        } else if (message.command === "modelValidationRequestReceived" || message.command === "modelValidationRequestFailed") {
            console.log("[Webview] Handling", message.command);
            // Hide spinner when validation request is received or failed
            hideSpinner();
        } else if (message.command === "modelValidationRequestCancelled") {
            console.log("[Webview] Request cancelled successfully, refreshing data");            hideSpinner();
            // Refresh the current page after a successful cancel
            requestPage(pageNumber);
            // After page refresh, checkAndSetAutoRefresh will be called
        } else if (message.command === "modelValidationSetValidationDetails") {
            console.log("[Webview] Received validation details data");
            renderDetailsInModal(message.data);
            hideSpinner();
        } else if (message.command === "modelValidationDetailsError") {
            console.log("[Webview] Error fetching validation details:", message.error);
            renderErrorInModal(message.error || "Failed to fetch validation details.");
            hideSpinner();
        } else if (message.command === "modelValidationReportDownloadStarted") {
            console.log("[Webview] Report download started");
            // Update the download button to show progress
            const reportButton = document.querySelector("#detailsModal .action-container .download-button");
            if (reportButton) {
                reportButton.disabled = true;
                reportButton.innerHTML = '<span class="spinner"></span> Downloading...';
            }
        } else if (message.command === "modelValidationReportDownloadSuccess") {
            console.log("[Webview] Report downloaded successfully, changeRequestsExtracted:", message.changeRequestsExtracted);
            // Update the download button to show success
            const reportButton = document.querySelector("#detailsModal .action-container .download-button");
            if (reportButton) {
                reportButton.disabled = false;
                reportButton.textContent = 'View Report';
                // Change the button action to view the report instead of downloading it
                reportButton.onclick = function() {
                    vscode.postMessage({
                        command: 'modelValidationViewReport',
                        requestCode: currentRequestCode
                    });
                };
            }
            // If change requests were extracted during download, refresh the change request button state
            if (message.changeRequestsExtracted) {
                vscode.postMessage({
                    command: 'modelValidationCheckChangeRequestsExist',
                    requestCode: currentRequestCode
                });
            }
        } else if (message.command === "modelValidationReportDownloadError") {
            console.log("[Webview] Report download error:", message.error);
            // Update the download button to allow retry
            const reportButton = document.querySelector("#detailsModal .action-container .download-button");
            if (reportButton) {
                reportButton.disabled = false;
                reportButton.textContent = 'Download Report';
            }
        } else if (message.command === "modelValidationReportExistsResult") {
            console.log("[Webview] Report exists locally:", message.exists);
            const reportButton = document.querySelector("#detailsModal .action-container .download-button");
            if (reportButton) {
                reportButton.disabled = false;
                // Update button text and action based on whether report exists locally
                if (message.exists) {
                    reportButton.textContent = 'View Report';
                    reportButton.onclick = function() {
                        vscode.postMessage({
                            command: 'modelValidationViewReport',
                            requestCode: currentRequestCode
                        });
                    };
                } else {
                    reportButton.textContent = 'Download Report';
                    reportButton.onclick = function() {
                        downloadReport(currentRequestCode);
                    };
                }
            }
        } else if (message.command === "modelValidationChangeRequestsExistResult") {
            console.log("[Webview] Change requests exist locally:", message.exists);
            const container = document.getElementById('changeRequestsButtonContainer');
            if (container) {
                container.innerHTML = '';
                
                // Only show the button if change requests exist
                if (message.exists) {
                    const changeRequestsButton = document.createElement('button');
                    changeRequestsButton.className = 'download-button';
                    changeRequestsButton.textContent = 'View Model Change Suggestions';
                    changeRequestsButton.addEventListener('click', function() {
                        openChangeRequests(currentRequestCode);
                    });
                    container.appendChild(changeRequestsButton);
                }
            }
        } else if (message.command === "modelValidationSetRootNodeProjectInfo") {
            const { projectName, projectVersionNumber } = message;
            let desc = "";
            if (projectName && projectVersionNumber) {
                desc = "Project: " + projectName + ", Version: " + projectVersionNumber;
            } else if (projectName) {
                desc = "Project: " + projectName;
            } else if (projectVersionNumber) {
                desc = "Version: " + projectVersionNumber;
            }
            document.getElementById("addDescription").value = desc;
        } else if (message.command === "modelValidationUnsavedChangesStatus") {
            console.log("[Webview] Received unsaved changes status:", message.hasUnsavedChanges);
            const warningElement = document.getElementById("unsavedChangesWarning");
            if (message.hasUnsavedChanges) {
                warningElement.style.display = "block";
            } else {
                warningElement.style.display = "none";
            }
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
                    margin-bottom: 15px;
                }                /* Added toolbar styles for refresh button */
                .toolbar {
                    display: flex;
                    justify-content: flex-end;
                    margin-bottom: 10px;
                    align-items: center;
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
                .refresh-only-button {
                    background: transparent;
                    color: var(--vscode-editor-foreground);
                    border: none;
                    padding: 4px 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .refresh-only-button:hover {
                    background-color: var(--vscode-toolbar-hoverBackground);
                }
                .add-button {
                    margin-right: 8px;
                }
                #autoRefreshIndicator {
                    margin-right: auto;
                }
                /* Modal styles */
                .modal {
                    position: fixed;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    background: rgba(0,0,0,0.4);
                    display: none;
                    align-items: center; justify-content: center;
                    z-index: 100; /* Add a high z-index to ensure modal appears above everything */
                }                .modal-content {
                    background: var(--vscode-editor-background);
                    padding: 20px;
                    border-radius: 4px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    width: 300px;
                    position: relative;
                    z-index: 101; /* Even higher z-index than the modal backdrop */
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
                
                /* Unsaved changes warning styles */
                .unsaved-changes-warning {
                    background-color: var(--vscode-inputValidation-errorBackground, #ff6b6b);
                    // color: var(--vscode-inputValidation-errorForeground, white);
                    padding: 8px 12px;
                    margin-bottom: 15px;
                    border-radius: 3px;
                    border: 1px solid var(--vscode-inputValidation-errorBorder, #ff4757);
                    font-weight: 500;
                    display: none; /* Initially hidden */
                }
                
                .validation-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                
                .table-container {
                    overflow: auto;
                    border: 0px solid var(--vscode-panel-border);
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
                    z-index: 2; /* Lower z-index than the modal */
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
                }                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                #autoRefreshIndicator .fa-sync-alt {
                    animation: spin 4s linear infinite;
                    display: inline-block;
                    margin-right: 5px;
                }
                
                /* Details Modal Specific Styles */                .details-modal-content {
                    width: 600px;
                    max-width: 80vw;
                    max-height: 80vh;
                    overflow-y: auto;
                    position: relative;
                    z-index: 101; /* Ensure details modal content is above everything */
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 10px;
                }
                
                .close-button {
                    background: none;
                    border: none;
                    font-size: 1.5em;
                    cursor: pointer;
                    color: var(--vscode-editor-foreground);
                    padding: 0;
                    margin: 0;
                }
                
                .detail-item {
                    margin-bottom: 15px;
                    display: flex;
                    align-items: baseline;
                }
                
                .detail-label {
                    flex: 0 0 120px;
                    font-weight: 600;
                    color: var(--vscode-descriptionForeground);
                }
                
                .detail-value {
                    flex: 1;
                }
                
                .loading-message {
                    color: var(--vscode-descriptionForeground);
                    font-style: italic;
                }
                
                .action-container {
                    margin-top: 20px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
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
                
                .error-message {
                    color: var(--vscode-errorForeground);
                    background-color: var(--vscode-inputValidation-errorBackground);
                    border: 1px solid var(--vscode-inputValidation-errorBorder);
                    padding: 10px;
                    border-radius: 3px;
                }
            </style>
            <div class="validation-container">
                <!-- Spinner overlay -->
                <div id="spinnerOverlay" class="spinner-overlay">
                    <div class="spinner"></div>
                </div>
                <div class="validation-header">
                    <h2>Model Validation Requests</h2>
                    
                    <p style="margin-top: -5px; margin-bottom: 15px; color: var(--vscode-descriptionForeground);">
                        Submit the model to the Model Validation service, download the results when complete, and approve and apply any change suggestions. Model Validation Change Requests adds and modifies the model.
                    </p>
                </div> 
                <div class="toolbar">
                    <button id="addButton" class="refresh-button add-button" title="Add Request">
                        Add
                    </button>
                    <button id="refreshButton" class="refresh-button" title="Refresh Table">
                            <span class="codicon codicon-refresh"></span>
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
                        <h3>Add Model Validation Request</h3>
                        <div id="unsavedChangesWarning" class="unsaved-changes-warning">
                            You have unsaved changes in your model. Please save your changes before requesting model services.
                        </div>
                        <label>Description:<br><input type="text" id="addDescription" /></label>                        <div class="modal-buttons"> <!-- Button container -->
                            <button id="submitAdd" class="refresh-button">Add</button>
                            <button id="cancelAdd" class="refresh-button modal-button-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
                <!-- Details Modal -->
                <div id="detailsModal" class="modal">
                    <div class="modal-content details-modal-content">
                        <div class="modal-header">
                            <h3>Model Validation Request Details</h3>
                            <button id="closeDetails" class="close-button">&times;</button>
                        </div>
                        <div id="details-container">
                            <p class="loading-message">Loading details...</p>
                        </div>
                        <div class="action-container"></div>
                        <div class="modal-buttons">
                            <button id="closeDetailsBtn" class="refresh-button modal-button-secondary">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
          // Initial ready message
        vscode.postMessage({ command: "modelValidationWebviewReady" });
        
        // Show spinner when initially loading the view
        showSpinner();

        
        // Replace refresh button text with standard VS Code codicon icon ONLY (no text)
        var refreshBtn = document.getElementById("refreshButton");
        if (refreshBtn) {
            refreshBtn.innerHTML = '<span class="codicon codicon-refresh" style="font-size:16px;"></span>';
            refreshBtn.title = "Refresh";
            refreshBtn.style.background = "none";
            refreshBtn.style.border = "none";
            refreshBtn.style.color = "var(--vscode-editor-foreground)";
            refreshBtn.style.padding = "4px 8px";
            refreshBtn.style.cursor = "pointer";
            refreshBtn.style.display = "flex";
            refreshBtn.style.alignItems = "center";
            refreshBtn.style.borderRadius = "4px";
            refreshBtn.style.transition = "background 0.15s";

            // Add hover effect: darker background on hover
            refreshBtn.addEventListener("mouseenter", function() {
                refreshBtn.style.background = "var(--vscode-toolbar-hoverBackground, #2a2d2e)";
            });
            refreshBtn.addEventListener("mouseleave", function() {
                refreshBtn.style.background = "none";
            });
        }
        
          // Attach refresh button handler
        document.getElementById("refreshButton").onclick = function() {
            // Show spinner while refreshing data
            showSpinner(); // Show spinner when refresh button is clicked
            requestPage(pageNumber);
            // Auto-refresh will be checked after data is loaded
        };
        // Attach add button handler
        document.getElementById("addButton").onclick = function() {
            // Fetch projectName and projectVersionNumber from extension
            vscode.postMessage({ command: "modelValidationGetRootNodeProjectInfo" });
            // Check for unsaved changes
            vscode.postMessage({ command: "modelValidationCheckUnsavedChanges" });
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
            vscode.postMessage({ command: "modelValidationAddValidationRequest", data: { description: desc } });
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
        
        // Replace add button text with standard VS Code codicon plus icon ONLY (no text)
        var addBtn = document.getElementById("addButton");
        if (addBtn) {
            addBtn.innerHTML = '<span class="codicon codicon-add" style="font-size:16px;"></span>';
            addBtn.title = "Add";
            addBtn.style.background = "none";
            addBtn.style.border = "none";
            addBtn.style.color = "var(--vscode-editor-foreground)";
            addBtn.style.padding = "4px 8px";
            addBtn.style.cursor = "pointer";
            addBtn.style.display = "flex";
            addBtn.style.alignItems = "center";
            addBtn.style.borderRadius = "4px";
            addBtn.style.transition = "background 0.15s";
            // Add hover effect: darker background on hover
            addBtn.addEventListener("mouseenter", function() {
                addBtn.style.background = "var(--vscode-toolbar-hoverBackground, #2a2d2e)";
            });
            addBtn.addEventListener("mouseleave", function() {
                addBtn.style.background = "none";
            });
        }
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
                                            <h3>Cancel Model Validation Request</h3>                                            <p>Are you sure you want to cancel this model validation request?</p>                                            <div class="modal-buttons">
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
                                            command: "modelValidationCancelValidationRequest",
                                            requestCode: requestCode
                                        });
                                    });
                                    
                                    // Handle cancel button
                                    document.getElementById("cancelCancel").addEventListener("click", function() {
                                        console.log("[Webview] User cancelled the cancel operation");
                                        document.body.removeChild(confirmModal);
                                    });
                                });
                                
                                td.appendChild(button);                            } else if (isCompleted && !item.modelValidationRequestIsCanceled) {
                                // Show Details button only for completed requests that aren't cancelled
                                const button = document.createElement("button");
                                button.className = "view-button";
                                button.textContent = "Details";
                                button.setAttribute("data-request-code", item.modelValidationRequestCode);
                                button.onclick = function(e) {
                                    e.preventDefault();
                                    e.stopPropagation(); // Prevent row click handler
                                    const requestCode = this.getAttribute("data-request-code");
                                    console.log("[Webview] Details button clicked for request code:", requestCode);
                                    
                                    // Show the details modal and fetch request details
                                    showDetailsModal(requestCode);
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
                            // Format date nicely with local time zone abbreviation
                            try {
                                let dateValue = value;
                                // If the value does not contain a timezone, treat as UTC by appending 'Z'
                                if (typeof dateValue === "string" && !dateValue.match(/[zZ]|[+-]\d{2}:?\d{2}$/)) {
                                    dateValue += "Z";
                                }
                                const date = new Date(dateValue);
                                td.textContent = date.toLocaleString(undefined, { timeZoneName: 'short' });
                            } catch (e) {
                                td.textContent = value || "";
                            }
                        } else {
                            td.textContent = value || "";
                        }
                    }                    row.appendChild(td);
                });
                
                tbody.appendChild(row);
            });
        }
        table.appendChild(tbody);
        
        // Update record info
        const start = validationData.length ? (pageNumber - 1) * itemCountPerPage + 1 : 0;
        const end = validationData.length ? Math.min(start + validationData.length - 1, totalRecords) : 0;
        document.getElementById("record-info").textContent = 
            totalRecords > 1 ? `Showing ${start} to ${end} of ${totalRecords} requests` : "";
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
        showSpinner(); // Show spinner whenever new data is being requested
        vscode.postMessage({
            command: "modelValidationRequestPage",
            pageNumber: page,
            itemCountPerPage: itemCountPerPage,
            orderByColumnName: orderByColumn,
            orderByDescending: orderByDescending
        });
    }

    // Details Modal Functions
    let currentRequestData = null;
    let currentRequestCode = null;

    // Initialize modal controls after the UI has been created
    document.getElementById("closeDetails").addEventListener("click", function() {
        hideDetailsModal();
    });
    document.getElementById("closeDetailsBtn").addEventListener("click", function() {
        hideDetailsModal();
    });

    /**
     * Shows the details modal and triggers a request to fetch validation details.
     * @param {string} requestCode - The validation request code.
     */
    function showDetailsModal(requestCode) {
        currentRequestCode = requestCode;
        const detailsContainer = document.getElementById("details-container");
        detailsContainer.innerHTML = '<p class="loading-message">Loading details...</p>';
        document.querySelector("#detailsModal .action-container").innerHTML = '';
        document.getElementById("detailsModal").style.display = "flex";
        
        // Request the details data from the extension
        vscode.postMessage({
            command: "modelValidationFetchValidationDetails",
            requestCode: requestCode
        });
    }

    /**
     * Hides the details modal.
     */
    function hideDetailsModal() {
        document.getElementById("detailsModal").style.display = "none";
        currentRequestData = null;
    }

    /**
     * Renders the validation request details in the modal.
     * @param {Object} data - The validation request details.
     */
    function renderDetailsInModal(data) {
        if (!data) {
            renderErrorInModal("No details received from the extension.");
            return;
        }

        currentRequestData = data;
        const detailsContainer = document.getElementById("details-container");
        
        // Clear loading message
        detailsContainer.innerHTML = '';

        // Define which fields to display and their labels
        const fieldsToShow = [
            { key: 'modelValidationRequestDescription', label: 'Description' },
            { key: 'modelValidationRequestRequestedUTCDateTime', label: 'Requested Date\\Time', type: 'datetime' },
            { key: 'status', label: 'Status', className: 'status-field' }, // Calculated status
            { key: 'modelValidationRequestCode', label: 'Request Code' }
        ];

        // Render each field
        fieldsToShow.forEach(field => {
            let value = data[field.key];
            let displayValue = '';

            // Special handling for status
            if (field.key === 'status') {
                value = calculateStatus(data);
                displayValue = `<span class="detail-value">${value || 'N/A'}</span>`;
            } else {
                // Handle different types
                if (value === null || typeof value === 'undefined') {
                    displayValue = '<span class="detail-value">N/A</span>';
                } else if (field.type === 'datetime') {
                    try {
                        // If the value does not end with 'Z' or contain a timezone, treat as UTC
                        let dateValue = value;
                        if (typeof dateValue === 'string' && !dateValue.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(dateValue)) {
                            dateValue += 'Z';
                        }
                        displayValue = `<span class="detail-value">${new Date(dateValue).toLocaleString(undefined, { timeZoneName: 'short' })}</span>`;
                    } catch (e) {
                        displayValue = `<span class="detail-value">${value} (Invalid Date)</span>`;
                    }
                } else {
                    // Default: display as text, escaping HTML
                    const textValue = String(value);
                    const escapedValue = textValue.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
                    displayValue = `<span class="detail-value">${escapedValue || 'N/A'}</span>`;
                }
            }

            // Create the item div
            const itemDiv = document.createElement('div');
            itemDiv.className = 'detail-item';
            if (field.className) {
                itemDiv.classList.add(field.className);
            }
            itemDiv.innerHTML = `
                <span class="detail-label">${field.label}:</span>
                ${displayValue}
            `;
            detailsContainer.appendChild(itemDiv);
        });

        // Add the action buttons
        const actionContainer = document.querySelector("#detailsModal .action-container");
        actionContainer.innerHTML = '';
        
        // Add report button if report URL is available
        if (data.modelValidationRequestReportUrl) {
            // First check if the report exists locally before showing the appropriate button
            vscode.postMessage({
                command: 'modelValidationCheckReportExists',
                requestCode: currentRequestCode
            });
            
            // Add a placeholder button that will be updated after checking if the file exists
            const reportButton = document.createElement('button');
            reportButton.className = 'download-button';
            reportButton.textContent = 'Checking...';
            reportButton.disabled = true;
            actionContainer.appendChild(reportButton);
        }

        // Check if change requests exist for this validation request
        vscode.postMessage({
            command: 'modelValidationCheckChangeRequestsExist',
            requestCode: currentRequestCode
        });
        
        // Add placeholder for change requests button - it will be updated when we get the response
        const changeRequestsButtonContainer = document.createElement('div');
        changeRequestsButtonContainer.id = 'changeRequestsButtonContainer';
        actionContainer.appendChild(changeRequestsButtonContainer);
    }

    /**
     * Renders an error in the details modal.
     * @param {string} message - The error message.
     */
    function renderErrorInModal(message) {
        const detailsContainer = document.getElementById("details-container");
        detailsContainer.innerHTML = `<div class="error-message">${message}</div>`;
    }

    /**
     * Calculates the display status based on the request flags.
     * @param {object} data - The request data object.
     * @returns {string} The calculated status string.
     */
    function calculateStatus(data) {
        if (data.modelValidationRequestIsCanceled) {
            return "Cancelled";
        } else if (!data.modelValidationRequestIsStarted) {
            return "Queued";
        } else if (data.modelValidationRequestIsStarted && !data.modelValidationRequestIsCompleted) {
            return "Processing";
        } else if (data.modelValidationRequestIsCompleted && !data.modelValidationRequestIsSuccessful) {
            return "Validation Error";
        } else if (data.modelValidationRequestIsCompleted && data.modelValidationRequestIsSuccessful) {
            return "Validation Passed";
        }
        return "Unknown"; // Default case
    }

    /**
     * Downloads the validation report.
     * @param {string} requestCode - The validation request code.
     */
    function downloadReport(requestCode) {
        vscode.postMessage({
            command: 'modelValidationDownloadReport',
            requestCode: requestCode,
            url: currentRequestData.modelValidationRequestReportUrl
        });
    }    /**
     * Opens change requests for the specified validation request.
     * @param {string} requestCode - The validation request code.
     */
    function openChangeRequests(requestCode) {
        vscode.postMessage({
            command: 'modelValidationViewChangeRequests',
            requestCode: requestCode
        });
    }

    /**
     * Checks if there are any processing or queued items and sets up auto-refresh accordingly.
     * This function examines the current data to determine if auto-refresh should be active.
     * If any items are in a processing or queued state, it will:
     *   1. Set up an interval to automatically refresh the page every minute
     *   2. Display a visual indicator showing that auto-refresh is active
     * If no items are processing/queued, it will clear any existing auto-refresh timer.
     */
    function checkAndSetAutoRefresh() {
        console.log("[Webview] Checking if auto-refresh should be active...");
        
        // Clear any existing timer
        if (autoRefreshTimer) {
            console.log("[Webview] Clearing existing auto-refresh timer");
            clearInterval(autoRefreshTimer);
            autoRefreshTimer = null;
        }
        
        // Check if there are any processing or queued items
        let hasProcessingOrQueuedItems = validationData.some(isProcessingOrQueued);
        
        // Update auto-refresh indicator
        updateAutoRefreshIndicator(hasProcessingOrQueuedItems);
        
        // If we have processing/queued items, set up auto-refresh timer
        if (hasProcessingOrQueuedItems) {
            console.log("[Webview] Processing or queued items found, setting up auto-refresh timer");
            autoRefreshTimer = setInterval(() => {
                console.log("[Webview] Auto-refreshing page due to processing/queued items");
                requestPage(pageNumber);
            }, AUTO_REFRESH_INTERVAL);
        }
    }
    
    /**
     * Determines if an item is in a processing or queued state.
     * @param {Object} item - The validation request item to check.
     * @returns {boolean} True if the item is processing or queued, false otherwise.
     */
    function isProcessingOrQueued(item) {
        // Item is queued if not started and not canceled
        const isQueued = !item.modelValidationRequestIsStarted && !item.modelValidationRequestIsCanceled;
        // Item is processing if started but not completed and not canceled
        const isProcessing = item.modelValidationRequestIsStarted && !item.modelValidationRequestIsCompleted && !item.modelValidationRequestIsCanceled;
        return isQueued || isProcessing;
    }

    /**
     * Updates the auto-refresh indicator in the UI.
     * Creates or updates a visual indicator to show users when auto-refresh is active,
     * which helps them understand that the page is automatically updating.
     * The indicator includes an animated spinning icon when active.
     * 
     * @param {boolean} isActive - Whether auto-refresh is active.
     */
    function updateAutoRefreshIndicator(isActive) {
        // Find or create the indicator element
        let indicator = document.getElementById("autoRefreshIndicator");
        
        if (!indicator) {
            indicator = document.createElement("div");
            indicator.id = "autoRefreshIndicator";
            indicator.style.fontSize = "0.8em";
            indicator.style.color = "var(--vscode-descriptionForeground)";
            indicator.style.marginRight = "10px";
            
            // Insert before the refresh button
            const toolbar = document.querySelector(".toolbar");
            if (toolbar) {
                toolbar.insertBefore(indicator, toolbar.firstChild);
            }
        }
        
        // Update indicator text based on active state
        if (isActive) {
            indicator.innerHTML = "<i class='fa fa-sync-alt'></i> Auto-refreshing every minute";
            indicator.style.display = "block";
        } else {
            indicator.style.display = "none";
        }
    }
})();
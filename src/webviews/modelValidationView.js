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
        { key: "modelValidationRequestIsSuccessful", label: "Successful" },
        { key: "modelValidationRequestReportUrl", label: "Report URL" }
    ];

    // Set up the UI
    initializeUI();

    // Event listeners
    window.addEventListener("message", function(event) {
        const message = event.data;
        if (message.command === "setValidationData") {
            validationData = message.data.items || [];
            pageNumber = message.data.pageNumber || 1;
            itemCountPerPage = message.data.itemCountPerPage || 10;
            orderByColumn = message.data.orderByColumnName || orderByColumn;
            orderByDescending = message.data.orderByDescending || false;
            totalRecords = message.data.recordsTotal || 0;
            renderTable();
            renderPaging();
        }
    });

    function initializeUI() {
        // Create main container structure
        document.body.innerHTML = `
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
                    background-color: var(--vscode-inputValidation-infoBackground, #007acc);
                    color: var(--vscode-editor-background);
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
            </style>
            <div class="validation-container">
                <div class="validation-header">
                    <h2>Model Validation Requests</h2>
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
            </div>
        `;
        
        // Initial ready message
        vscode.postMessage({ command: "webviewReady" });
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
                        if (item.modelValidationRequestIsCancelled) {
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
                        if (col.key === "modelValidationRequestIsSuccessful") {
                            const badge = document.createElement("span");
                            badge.className = value ? "success-badge" : "failure-badge";
                            badge.textContent = value ? "Success" : "Failed";
                            td.appendChild(badge);
                        } else if (col.key === "modelValidationRequestReportUrl" && value) {
                            const button = document.createElement("button");
                            button.className = "view-button";
                            button.textContent = "View Report";
                            button.onclick = function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                vscode.postMessage({
                                    command: "openExternalUrl",
                                    url: value
                                });
                            };
                            td.appendChild(button);
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
// Description: Handles the page list webview display.
// Created: August 3, 2025

(function() {
    // Acquire the VS Code API
    const vscode = acquireVsCodeApi();
    
    // Keep track of the current state
    let pageData = {
        items: [],
        totalRecords: 0,
        sortColumn: 'name',
        sortDescending: false
    };
    
    // Helper function to show spinner
    function showSpinner() {
        const spinnerOverlay = document.getElementById("spinner-overlay");
        if (spinnerOverlay) {
            spinnerOverlay.style.display = "flex";
        }
    }
    
    // Helper function to hide spinner
    function hideSpinner() {
        const spinnerOverlay = document.getElementById("spinner-overlay");
        if (spinnerOverlay) {
            spinnerOverlay.style.display = "none";
        }
    }
    
    // Set up the UI when the page loads
    document.addEventListener('DOMContentLoaded', function() {
        console.log("[Webview] DOM Content loaded for Page List");
        
        // Setup refresh button
        const refreshBtn = document.getElementById("refreshButton");
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

            // Add hover effect
            refreshBtn.addEventListener("mouseenter", function() {
                refreshBtn.style.background = "var(--vscode-toolbar-hoverBackground, #2a2d2e)";
            });
            refreshBtn.addEventListener("mouseleave", function() {
                refreshBtn.style.background = "none";
            });
        }
        
        // Attach refresh button handler
        refreshBtn.onclick = function() {
            requestRefresh();
        };
        
        // Tell the extension we're ready
        vscode.postMessage({ command: 'PageListWebviewReady' });
        
        // Show spinner while loading
        showSpinner();
    });
    
    // Helper function to request refresh
    function requestRefresh() {
        showSpinner();
        vscode.postMessage({ command: 'refresh' });
    }
    
    // Event listeners for messages from the extension
    window.addEventListener("message", function(event) {
        const message = event.data;
        console.log("[Webview] Received message:", message.command);
        
        if (message.command === "setPageData") {
            console.log("[Webview] Handling setPageData");
            pageData = message.data || { items: [], totalRecords: 0, sortColumn: 'name', sortDescending: false };
            
            renderTable();
            renderRecordInfo();
            
            // Hide spinner when data is loaded
            hideSpinner();
        }
    });
    
    function renderTable() {
        const table = document.getElementById("pageListTable");
        if (!table) {
            return;
        }
        
        // Clear the table
        table.innerHTML = "";
        
        // Create table header
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        
        // Define table columns
        const columns = [
            { key: "name", label: "Name", sortable: true },
            { key: "titleText", label: "Title Text", sortable: true },
            { key: "type", label: "Type", sortable: true },
            { key: "reportType", label: "Report Type", sortable: true },
            { key: "ownerObject", label: "Owner Object", sortable: true },
            { key: "roleRequired", label: "Role Required", sortable: true },
            { key: "actions", label: "Actions", sortable: false }
        ];
        
        // Create table header cells
        columns.forEach(column => {
            const th = document.createElement("th");
            
            if (column.sortable) {
                th.style.cursor = "pointer";
                th.addEventListener("click", () => {
                    // Toggle sort order if clicking the same column
                    let sortDescending = false;
                    if (pageData.sortColumn === column.key) {
                        sortDescending = !pageData.sortDescending;
                    }
                    
                    // Request sorted data
                    showSpinner();
                    vscode.postMessage({
                        command: "sortPages",
                        column: column.key,
                        descending: sortDescending
                    });
                });
                
                // Add sort indicator
                if (pageData.sortColumn === column.key) {
                    th.textContent = column.label + (pageData.sortDescending ? " ▼" : " ▲");
                } else {
                    th.textContent = column.label;
                }
            } else {
                th.textContent = column.label;
            }
            
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement("tbody");
        
        // Create rows for each item
        if (pageData.items && pageData.items.length > 0) {
            pageData.items.forEach(item => {
                const row = document.createElement("tr");
                
                columns.forEach(col => {
                    const td = document.createElement("td");
                    
                    if (col.key === "actions") {
                        // Create action buttons
                        const previewButton = document.createElement("button");
                        previewButton.className = "action-button";
                        previewButton.textContent = "Preview";
                        previewButton.title = "View page preview";
                        previewButton.onclick = function(e) {
                            e.stopPropagation();
                            vscode.postMessage({
                                command: "previewPage",
                                pageName: item.name
                            });
                        };
                        
                        const detailsButton = document.createElement("button");
                        detailsButton.className = "action-button";
                        detailsButton.textContent = "Details";
                        detailsButton.title = "View page details";
                        detailsButton.onclick = function(e) {
                            e.stopPropagation();
                            vscode.postMessage({
                                command: "viewDetails",
                                pageName: item.name,
                                pageType: item.type,
                                ownerObject: item.ownerObject
                            });
                        };
                        
                        td.appendChild(previewButton);
                        td.appendChild(detailsButton);
                    } else {
                        // For other columns, display the value
                        const value = item[col.key] || "";
                        td.textContent = value;
                        
                        // Add tooltip for longer text
                        if (value.length > 30) {
                            td.title = value;
                        }
                    }
                    
                    row.appendChild(td);
                });
                
                tbody.appendChild(row);
            });
        } else {
            // No items
            const row = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = 7; // Number of columns
            td.style.textAlign = "center";
            td.style.padding = "20px";
            td.style.color = "var(--vscode-descriptionForeground)";
            td.textContent = "No pages found. Pages must have isPage='true' property to appear here.";
            row.appendChild(td);
            tbody.appendChild(row);
        }
        
        table.appendChild(tbody);
    }
    
    function renderRecordInfo() {
        const recordInfoElement = document.getElementById("record-info");
        if (recordInfoElement) {
            const totalRecords = pageData.totalRecords || 0;
            if (totalRecords > 0) {
                recordInfoElement.textContent = `${totalRecords} page${totalRecords === 1 ? '' : 's'} found`;
            } else {
                recordInfoElement.textContent = "No pages to display";
            }
        }
    }
})();

// Description: Handles the fabrication blueprint catalog webview display.
// Created: May 11, 2025

(function() {
    // Acquire the VS Code API
    const vscode = acquireVsCodeApi();    // Keep track of the current state
    let templateSetData = {
        items: [],
        pageNumber: 1,
        itemCountPerPage: 10,
        recordsTotal: 0,
        recordsFiltered: 0
    };
    
    // Keep track of pagination and sorting
    let pageNumber = 1;
    let itemCountPerPage = 10; // Default to 10 items per page
    let orderByColumn = "title"; // Use title as default sort column
    let orderByDescending = false;
    let totalRecords = 0;
    
    // Keep track of selected templates
    let selectedTemplates = [];    // Helper function to request a page of data
    function requestPage(pageNum) {
        showSpinner();
        vscode.postMessage({
            command: "FabricationBlueprintCatalogRequestPage",
            pageNumber: pageNum,
            itemCountPerPage: itemCountPerPage,
            orderByColumnName: orderByColumn,
            orderByDescending: orderByDescending
        });
    }
    
    // Set up the UI when the page loads
    document.addEventListener('DOMContentLoaded', function() {
        console.log("[Webview] DOM Content loaded for Fabrication Blueprint Catalog");
        initializeUI();
        
        // Tell the extension we're ready
        vscode.postMessage({ command: 'FabricationBlueprintCatalogWebviewReady' });
        
        // Request the currently selected templates
        vscode.postMessage({ command: 'FabricationBlueprintCatalogGetSelectedTemplates' });
        
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
            requestPage(pageNumber);
        };
        
        // Show spinner while loading
        showSpinner();
    });
    
    // Event listeners for messages from the extension
    window.addEventListener("message", function(event) {
        const message = event.data;
        console.log("[Webview] Received message:", message.command);
          if (message.command === "setTemplateSetData") {
            console.log("[Webview] Handling setTemplateSetData");
            templateSetData = message.data || { items: [], pageNumber: 1, itemCountPerPage: 10, recordsTotal: 0 };
            pageNumber = templateSetData.pageNumber || 1;
            itemCountPerPage = templateSetData.itemCountPerPage || 10;
            orderByColumn = templateSetData.orderByColumnName || orderByColumn;
            orderByDescending = templateSetData.orderByDescending || false;
            totalRecords = templateSetData.recordsTotal || 0;
            
            renderTable();
            renderPaging();
            
            // Hide spinner when data is loaded
            hideSpinner();
        } else if (message.command === "FabricationBlueprintCatalogSetSelectedTemplates") {
            console.log("[Webview] Handling FabricationBlueprintCatalogSetSelectedTemplates");
            selectedTemplates = message.selectedTemplates || [];
            
            // Update checkboxes in the table if table is already rendered
            updateSelectedTemplatesInTable();
        } else if (message.command === "FabricationBlueprintCatalogTemplateUpdateSuccess") {
            console.log("[Webview] Template update success:", message.templateName, message.selected);
            hideSpinner();
            
            // Ensure the selectedTemplates array is properly updated
            if (message.selected) {
                // Add template to selectedTemplates if not already present
                const existingTemplate = selectedTemplates.find(t => t.name === message.templateName);
                if (!existingTemplate) {
                    selectedTemplates.push({
                        name: message.templateName,
                        isDisabled: "false"
                    });
                }
            } else {
                // Remove template from selectedTemplates
                const templateIndex = selectedTemplates.findIndex(t => t.name === message.templateName);
                if (templateIndex !== -1) {
                    selectedTemplates.splice(templateIndex, 1);
                }
            }
            
            // Find the checkbox for this template and update it (useful when multiple users are editing)
            const checkbox = document.querySelector(`input[data-template="${message.templateName}"]`);
            if (checkbox) {
                checkbox.checked = message.selected;
            }
        } else if (message.command === "FabricationBlueprintCatalogTemplateUpdateFailed") {
            console.log("[Webview] Template update failed:", message.templateName, message.reason);
            hideSpinner();
            
            // Find the checkbox and revert its state
            const checkbox = document.querySelector(`input[data-template="${message.templateName}"]`);
            if (checkbox) {
                // If template is disabled, it should be checked and disabled
                if (message.reason === "disabled") {
                    checkbox.checked = true;
                    checkbox.disabled = true;
                    checkbox.title = "This template is disabled and cannot be removed";
                    
                    // Ensure the disabled template is in selectedTemplates array
                    const existingTemplate = selectedTemplates.find(t => t.name === message.templateName);
                    if (!existingTemplate) {
                        selectedTemplates.push({
                            name: message.templateName,
                            isDisabled: "true"
                        });
                    } else {
                        existingTemplate.isDisabled = "true";
                    }
                } else {
                    // Get the current state from our selectedTemplates array
                    const isSelected = selectedTemplates.some(t => t.name === message.templateName);
                    checkbox.checked = isSelected;
                }
            }
        }
    });
    
    function initializeUI() {
        console.log("[Webview] Initializing UI");
        // Initially empty table and paging controls will be populated
    }
    
    function renderTable() {
        const table = document.getElementById("blueprintCatalogTable");
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
            { key: "selected", label: "Selected", sortable: false },
            { key: "title", label: "Name", sortable: true },
            { key: "description", label: "Description", sortable: true },
            { key: "displayVersion", label: "Version", sortable: true }
        ];
        
        // Create table header cells
        columns.forEach(column => {
            const th = document.createElement("th");
            
            if (column.sortable) {
                th.style.cursor = "pointer";
                th.addEventListener("click", () => {
                    // Toggle sort order if clicking the same column
                    if (orderByColumn === column.key) {
                        orderByDescending = !orderByDescending;
                    } else {
                        orderByColumn = column.key;
                        orderByDescending = false;
                    }
                    
                    // Request sorted data
                    showSpinner();
                    vscode.postMessage({
                        command: "FabricationBlueprintCatalogRequestPage",
                        pageNumber: pageNumber,
                        itemCountPerPage: itemCountPerPage,
                        orderByColumnName: orderByColumn,
                        orderByDescending: orderByDescending
                    });
                });
                
                // Add sort indicator
                if (orderByColumn === column.key) {
                    th.textContent = column.label + (orderByDescending ? " ▼" : " ▲");
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
        if (templateSetData.items && templateSetData.items.length > 0) {
            templateSetData.items.forEach(item => {
                const row = document.createElement("tr");
                
                // Add row click handler to toggle checkbox
                row.style.cursor = "pointer";
                row.addEventListener("click", (event) => {
                    // Only toggle if click wasn't on checkbox itself (to avoid double-toggling)
                    if (!event.target.matches('input[type="checkbox"]')) {
                        const checkbox = row.querySelector('input[data-template]');
                        if (checkbox && !checkbox.disabled) {
                            checkbox.checked = !checkbox.checked;
                            
                            // Trigger the change event to handle the selection change
                            const changeEvent = new Event('change', { bubbles: true });
                            checkbox.dispatchEvent(changeEvent);
                        }
                    }
                });
                
                columns.forEach(col => {
                    const td = document.createElement("td");
                    
                    if (col.key === "selected") {
                        // Create checkbox for selection
                        const checkboxContainer = document.createElement("div");
                        checkboxContainer.className = "checkbox-container";
                        
                        const checkbox = document.createElement("input");
                        checkbox.type = "checkbox";
                        checkbox.dataset.template = item.name;
                        
                        // Check if this template is selected
                        const selectedTemplate = selectedTemplates.find(t => t.name === item.name);
                        checkbox.checked = !!selectedTemplate;
                        
                        // Disable checkbox if the template is disabled
                        if (selectedTemplate && selectedTemplate.isDisabled === "true") {
                            checkbox.disabled = true;
                            checkbox.title = "This template is disabled and cannot be removed";
                        }
                          // Handle checkbox change
                        checkbox.addEventListener("change", function() {
                            const isChecked = this.checked;
                            
                            // Update the selectedTemplates array immediately to maintain state across page navigation
                            if (isChecked) {
                                // Add template to selectedTemplates if not already present
                                const existingTemplate = selectedTemplates.find(t => t.name === item.name);
                                if (!existingTemplate) {
                                    selectedTemplates.push({
                                        name: item.name,
                                        isDisabled: "false" // Default to not disabled for newly selected templates
                                    });
                                }
                            } else {
                                // Remove template from selectedTemplates
                                const templateIndex = selectedTemplates.findIndex(t => t.name === item.name);
                                if (templateIndex !== -1) {
                                    selectedTemplates.splice(templateIndex, 1);
                                }
                            }
                            
                            showSpinner();
                            vscode.postMessage({
                                command: "FabricationBlueprintCatalogToggleTemplate",
                                templateName: item.name,
                                title: item.title,
                                displayVersion: item.displayVersion,
                                selected: isChecked
                            });
                        });
                        
                        checkboxContainer.appendChild(checkbox);
                        td.appendChild(checkboxContainer);
                    } else {
                        // For other columns, display the value
                        td.textContent = item[col.key] || "";
                    }
                    
                    row.appendChild(td);
                });
                
                tbody.appendChild(row);
            });
        } else {
            // No items
            const row = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = columns.length;
            td.style.textAlign = "center";
            td.textContent = "No blueprint templates available.";
            row.appendChild(td);
            tbody.appendChild(row);
        }
        
        table.appendChild(tbody);
    }
    
    function updateSelectedTemplatesInTable() {
        // Update checkboxes in the table based on selectedTemplates
        const checkboxes = document.querySelectorAll('input[data-template]');
        
        checkboxes.forEach(checkbox => {
            const templateName = checkbox.dataset.template;
            const selectedTemplate = selectedTemplates.find(t => t.name === templateName);
            
            // Update checkbox state
            checkbox.checked = !!selectedTemplate;
            
            // Disable checkbox if the template is disabled
            if (selectedTemplate && selectedTemplate.isDisabled === "true") {
                checkbox.disabled = true;
                checkbox.title = "This template is disabled and cannot be removed";
            } else {
                checkbox.disabled = false;
                checkbox.title = "";
            }
        });
    }
      function renderPaging() {
        const pagingDiv = document.getElementById("paging");
        if (!pagingDiv) {
            return;
        }
        
        pagingDiv.innerHTML = "";
        
        // Calculate total pages
        const totalPages = Math.ceil(totalRecords / itemCountPerPage);
        
        // Update record info (similar to model feature catalog view)
        const start = templateSetData.items && templateSetData.items.length ? (pageNumber - 1) * itemCountPerPage + 1 : 0;
        const end = templateSetData.items && templateSetData.items.length ? Math.min(start + templateSetData.items.length - 1, totalRecords) : 0;
        const recordInfoElement = document.getElementById("record-info");
        if (recordInfoElement) {
            recordInfoElement.textContent = 
                templateSetData.items && templateSetData.items.length ? `Showing ${start} to ${end} of ${totalRecords} blueprints` : `No blueprints to display`;
        }
        
        if (totalRecords === 0) {
            return;
        }
        
        // Create paging controls matching model feature catalog view style
        // First page button
        const first = document.createElement("button");
        first.textContent = "«";
        first.disabled = pageNumber <= 1;
        first.title = "First Page";
        first.onclick = function () { 
            showSpinner();
            vscode.postMessage({
                command: "FabricationBlueprintCatalogRequestPage",
                pageNumber: 1,
                itemCountPerPage: itemCountPerPage,
                orderByColumnName: orderByColumn,
                orderByDescending: orderByDescending
            });
        };
        pagingDiv.appendChild(first);
        
        // Previous button
        const prev = document.createElement("button");
        prev.textContent = "‹";
        prev.disabled = pageNumber <= 1;
        prev.title = "Previous Page";
        prev.onclick = function () { 
            showSpinner();
            vscode.postMessage({
                command: "FabricationBlueprintCatalogRequestPage",
                pageNumber: pageNumber - 1,
                itemCountPerPage: itemCountPerPage,
                orderByColumnName: orderByColumn,
                orderByDescending: orderByDescending
            });
        };
        pagingDiv.appendChild(prev);
        
        // Page info
        const info = document.createElement("span");
        info.textContent = `Page ${pageNumber} of ${totalPages || 1}`;
        pagingDiv.appendChild(info);
        
        // Next button
        const next = document.createElement("button");
        next.textContent = "›";
        next.disabled = pageNumber >= totalPages;
        next.title = "Next Page";
        next.onclick = function () { 
            showSpinner();
            vscode.postMessage({
                command: "FabricationBlueprintCatalogRequestPage",
                pageNumber: pageNumber + 1,
                itemCountPerPage: itemCountPerPage,
                orderByColumnName: orderByColumn,
                orderByDescending: orderByDescending
            });
        };
        pagingDiv.appendChild(next);
        
        // Last page button
        const last = document.createElement("button");
        last.textContent = "»";
        last.disabled = pageNumber >= totalPages;
        last.title = "Last Page";
        last.onclick = function () { 
            showSpinner();
            vscode.postMessage({
                command: "FabricationBlueprintCatalogRequestPage",
                pageNumber: totalPages,
                itemCountPerPage: itemCountPerPage,
                orderByColumnName: orderByColumn,
                orderByDescending: orderByDescending
            });
        };
        pagingDiv.appendChild(last);
    }
    
    function showSpinner() {
        const overlay = document.getElementById('spinner-overlay');
        if (overlay) {
            overlay.style.display = 'block';
        }
    }
    
    function hideSpinner() {
        const overlay = document.getElementById('spinner-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
})();

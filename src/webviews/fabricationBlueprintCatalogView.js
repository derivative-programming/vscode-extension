// Description: Handles the fabrication blueprint catalog webview display.
// Created: May 11, 2025

(function() {
    // Acquire the VS Code API
    const vscode = acquireVsCodeApi();
      // Keep track of the current state
    let templateSetData = {
        items: [],
        pageNumber: 1,
        itemCountPerPage: 100,
        recordsTotal: 0,
        recordsFiltered: 0
    };
    
    // Keep track of pagination and sorting
    let pageNumber = 1;
    let itemCountPerPage = 100; // Default to 100 items per page
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
            templateSetData = message.data || { items: [], pageNumber: 1, itemCountPerPage: 100, recordsTotal: 0 };
            pageNumber = templateSetData.pageNumber || 1;
            itemCountPerPage = templateSetData.itemCountPerPage || 100;
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
                // Get the current state from our selectedTemplates array
                const isSelected = selectedTemplates.some(t => t.name === message.templateName);
                checkbox.checked = isSelected;
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
        
        if (totalRecords === 0) {
            return;
        }
        
        // Calculate total pages
        const totalPages = Math.ceil(totalRecords / itemCountPerPage);
        
        // Create paging controls similar to model validation view
        // First page button
        const firstButton = document.createElement("button");
        firstButton.textContent = "«";
        firstButton.disabled = pageNumber <= 1;
        firstButton.title = "First Page";
        firstButton.addEventListener("click", () => {
            if (pageNumber > 1) {
                showSpinner();
                vscode.postMessage({
                    command: "FabricationBlueprintCatalogRequestPage",
                    pageNumber: 1,
                    itemCountPerPage: itemCountPerPage,
                    orderByColumnName: orderByColumn,
                    orderByDescending: orderByDescending
                });
            }
        });
        
        // Previous button
        const prevButton = document.createElement("button");
        prevButton.textContent = "‹";
        prevButton.disabled = pageNumber <= 1;
        prevButton.title = "Previous Page";
        prevButton.addEventListener("click", () => {
            if (pageNumber > 1) {
                showSpinner();
                vscode.postMessage({
                    command: "FabricationBlueprintCatalogRequestPage",
                    pageNumber: pageNumber - 1,
                    itemCountPerPage: itemCountPerPage,
                    orderByColumnName: orderByColumn,
                    orderByDescending: orderByDescending
                });
            }
        });
        
        // Page info
        const pageSpan = document.createElement("span");
        pageSpan.textContent = ` Page ${pageNumber} of ${totalPages || 1} `;
        
        // Next button
        const nextButton = document.createElement("button");
        nextButton.textContent = "›";
        nextButton.disabled = pageNumber >= totalPages;
        nextButton.title = "Next Page";
        nextButton.addEventListener("click", () => {
            if (pageNumber < totalPages) {
                showSpinner();
                vscode.postMessage({
                    command: "FabricationBlueprintCatalogRequestPage",
                    pageNumber: pageNumber + 1,
                    itemCountPerPage: itemCountPerPage,
                    orderByColumnName: orderByColumn,
                    orderByDescending: orderByDescending
                });
            }
        });
        
        // Last page button
        const lastButton = document.createElement("button");
        lastButton.textContent = "»";
        lastButton.disabled = pageNumber >= totalPages;
        lastButton.title = "Last Page";
        lastButton.addEventListener("click", () => {
            if (pageNumber < totalPages) {
                showSpinner();
                vscode.postMessage({
                    command: "FabricationBlueprintCatalogRequestPage",
                    pageNumber: totalPages,
                    itemCountPerPage: itemCountPerPage,
                    orderByColumnName: orderByColumn,
                    orderByDescending: orderByDescending
                });
            }
        });
        
        // Items per page selector
        const perPageSelect = document.createElement("select");
        [10, 25, 50, 100].forEach(size => {
            const option = document.createElement("option");
            option.value = size;
            option.textContent = size + " items per page";
            option.selected = itemCountPerPage === size;
            perPageSelect.appendChild(option);
        });
        
        perPageSelect.addEventListener("change", () => {
            itemCountPerPage = parseInt(perPageSelect.value);
            showSpinner();
            vscode.postMessage({
                command: "FabricationBlueprintCatalogRequestPage",
                pageNumber: 1, // Reset to first page
                itemCountPerPage: itemCountPerPage,
                orderByColumnName: orderByColumn,
                orderByDescending: orderByDescending
            });
        });
        
        // Count summary
        const countSpan = document.createElement("span");
        countSpan.textContent = ` (${templateSetData.items ? templateSetData.items.length : 0} of ${totalRecords} items) `;
        
        // Append all elements
        pagingDiv.appendChild(firstButton);
        pagingDiv.appendChild(prevButton);
        pagingDiv.appendChild(pageSpan);
        pagingDiv.appendChild(nextButton);
        pagingDiv.appendChild(lastButton);
        pagingDiv.appendChild(document.createTextNode(" | "));
        pagingDiv.appendChild(perPageSelect);
        pagingDiv.appendChild(countSpan);
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

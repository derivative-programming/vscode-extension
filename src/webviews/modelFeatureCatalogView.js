// Description: Handles the model feature catalog webview display.
// Created: October 12, 2023

(function() {
    // Acquire the VS Code API
    const vscode = acquireVsCodeApi();
    
    // Keep track of the current state
    let featureData = {
        items: [],
        pageNumber: 1,
        itemCountPerPage: 10,
        recordsTotal: 0,
        recordsFiltered: 0
    };
    
    // Keep track of pagination and sorting
    let pageNumber = 1;
    let itemCountPerPage = 10;
    let orderByColumn = "name";
    let orderByDescending = false;
    let totalRecords = 0;
    
    // Keep track of selected features
    let selectedFeatures = [];
    
    // Set up the UI when the page loads
    document.addEventListener('DOMContentLoaded', function() {
        console.log("[Webview] DOM Content loaded for Model Feature Catalog");
        initializeUI();
        
        // Tell the extension we're ready
        vscode.postMessage({ command: 'ModelFeatureCatalogWebviewReady' });
        
        // Request the currently selected features
        vscode.postMessage({ command: 'ModelFeatureCatalogGetSelectedFeatures' });
        
        // Show spinner while loading
        showSpinner();
    });
    
    // Event listeners for messages from the extension
    window.addEventListener("message", function(event) {
        const message = event.data;
        console.log("[Webview] Received message:", message.command);
        
        if (message.command === "setFeatureData") {
            console.log("[Webview] Handling setFeatureData");
            featureData = message.data || { items: [], pageNumber: 1, itemCountPerPage: 10, recordsTotal: 0 };
            pageNumber = featureData.pageNumber || 1;
            itemCountPerPage = featureData.itemCountPerPage || 10;
            orderByColumn = featureData.orderByColumnName || orderByColumn;
            orderByDescending = featureData.orderByDescending || false;
            totalRecords = featureData.recordsTotal || 0;
            
            renderTable();
            renderPaging();
            
            // Hide spinner when data is loaded
            hideSpinner();
        } else if (message.command === "ModelFeatureCatalogSetSelectedFeatures") {
            console.log("[Webview] Handling ModelFeatureCatalogSetSelectedFeatures");
            selectedFeatures = message.selectedFeatures || [];
            
            // Update checkboxes in the table if table is already rendered
            updateSelectedFeaturesInTable();
        } else if (message.command === "ModelFeatureCatalogFeatureUpdateSuccess") {
            console.log("[Webview] Feature update success:", message.featureName, message.selected);
            hideSpinner();
            
            // Find the checkbox for this feature and update it (useful when multiple users are editing)
            const checkbox = document.querySelector(`input[data-feature="${message.featureName}"]`);
            if (checkbox) {
                checkbox.checked = message.selected;
            }
        } else if (message.command === "ModelFeatureCatalogFeatureUpdateFailed") {
            console.log("[Webview] Feature update failed:", message.featureName, message.reason);
            hideSpinner();
            
            // Find the checkbox and revert its state
            const checkbox = document.querySelector(`input[data-feature="${message.featureName}"]`);
            if (checkbox) {
                // If feature is completed, it should be checked and disabled
                if (message.reason === "completed") {
                    checkbox.checked = true;
                    checkbox.disabled = true;
                } else {
                    // Get the current state from our selectedFeatures array
                    const isSelected = selectedFeatures.some(f => f.name === message.featureName);
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
        const table = document.getElementById("featureCatalogTable");
        if (!table) return;
        
        // Clear the table
        table.innerHTML = "";
        
        // Create table header
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        
        // Define table columns
        const columns = [
            { key: "selected", label: "Selected", sortable: false },
            { key: "name", label: "Name", sortable: true },
            { key: "displayName", label: "Display Name", sortable: true },
            { key: "description", label: "Description", sortable: true },
            { key: "version", label: "Version", sortable: true }
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
                        command: "ModelFeatureCatalogRequestPage",
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
        if (featureData.items && featureData.items.length > 0) {
            featureData.items.forEach(item => {
                const row = document.createElement("tr");
                
                columns.forEach(col => {
                    const td = document.createElement("td");
                    
                    if (col.key === "selected") {
                        // Create checkbox for selection
                        const checkboxContainer = document.createElement("div");
                        checkboxContainer.className = "checkbox-container";
                        
                        const checkbox = document.createElement("input");
                        checkbox.type = "checkbox";
                        checkbox.dataset.feature = item.name;
                        
                        // Check if this feature is selected
                        const selectedFeature = selectedFeatures.find(f => f.name === item.name);
                        checkbox.checked = !!selectedFeature;
                        
                        // Disable checkbox if the feature is completed
                        if (selectedFeature && selectedFeature.isCompleted === "true") {
                            checkbox.disabled = true;
                            checkbox.title = "This feature is completed and cannot be removed";
                        }
                        
                        // Handle checkbox change
                        checkbox.addEventListener("change", function() {
                            const isChecked = this.checked;
                            showSpinner();
                            vscode.postMessage({
                                command: "ModelFeatureCatalogToggleFeature",
                                featureName: item.name,
                                description: item.description,
                                version: item.version,
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
            td.textContent = "No model features available.";
            row.appendChild(td);
            tbody.appendChild(row);
        }
        
        table.appendChild(tbody);
    }
    
    function updateSelectedFeaturesInTable() {
        // Update checkboxes in the table based on selectedFeatures
        const checkboxes = document.querySelectorAll('input[data-feature]');
        
        checkboxes.forEach(checkbox => {
            const featureName = checkbox.dataset.feature;
            const selectedFeature = selectedFeatures.find(f => f.name === featureName);
            
            // Update checkbox state
            checkbox.checked = !!selectedFeature;
            
            // Disable checkbox if the feature is completed
            if (selectedFeature && selectedFeature.isCompleted === "true") {
                checkbox.disabled = true;
                checkbox.title = "This feature is completed and cannot be removed";
            } else {
                checkbox.disabled = false;
                checkbox.title = "";
            }
        });
    }
    
    function renderPaging() {
        const pagingDiv = document.getElementById("paging");
        if (!pagingDiv) return;
        
        pagingDiv.innerHTML = "";
        
        if (totalRecords === 0) return;
        
        // Calculate total pages
        const totalPages = Math.ceil(totalRecords / itemCountPerPage);
        
        // Create paging controls
        const prevButton = document.createElement("button");
        prevButton.textContent = "Previous";
        prevButton.disabled = pageNumber <= 1;
        prevButton.addEventListener("click", () => {
            if (pageNumber > 1) {
                showSpinner();
                vscode.postMessage({
                    command: "ModelFeatureCatalogRequestPage",
                    pageNumber: pageNumber - 1,
                    itemCountPerPage: itemCountPerPage,
                    orderByColumnName: orderByColumn,
                    orderByDescending: orderByDescending
                });
            }
        });
        
        const nextButton = document.createElement("button");
        nextButton.textContent = "Next";
        nextButton.disabled = pageNumber >= totalPages;
        nextButton.addEventListener("click", () => {
            if (pageNumber < totalPages) {
                showSpinner();
                vscode.postMessage({
                    command: "ModelFeatureCatalogRequestPage",
                    pageNumber: pageNumber + 1,
                    itemCountPerPage: itemCountPerPage,
                    orderByColumnName: orderByColumn,
                    orderByDescending: orderByDescending
                });
            }
        });
        
        // Page selector
        const pageSpan = document.createElement("span");
        pageSpan.textContent = ` Page ${pageNumber} of ${totalPages} `;
        
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
                command: "ModelFeatureCatalogRequestPage",
                pageNumber: 1, // Reset to first page
                itemCountPerPage: itemCountPerPage,
                orderByColumnName: orderByColumn,
                orderByDescending: orderByDescending
            });
        });
        
        // Count summary
        const countSpan = document.createElement("span");
        countSpan.textContent = ` (${featureData.items ? featureData.items.length : 0} of ${totalRecords} items) `;
        
        // Append all elements
        pagingDiv.appendChild(prevButton);
        pagingDiv.appendChild(pageSpan);
        pagingDiv.appendChild(nextButton);
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

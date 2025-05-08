// src/webviews/changeRequestsListView.js
// Handles displaying and interacting with change requests in a webview.
// Last modified: May 6, 2025

(function() {
    const vscode = acquireVsCodeApi();
    const container = document.getElementById('changeRequestsContainer');
    const statusFilterSelect = document.getElementById('statusFilter');
    const refreshButton = document.getElementById('refreshButton');
    const spinnerOverlay = document.getElementById('spinnerOverlay');
    const rejectModal = document.getElementById('rejectModal');
    const rejectionReasonInput = document.getElementById('rejectionReason');
    const cancelRejectButton = document.getElementById('cancelReject');
    const confirmRejectButton = document.getElementById('confirmReject');
    const batchRejectModal = document.getElementById('batchRejectModal');
    const batchRejectionReasonInput = document.getElementById('batchRejectionReason');
    const cancelBatchRejectButton = document.getElementById('cancelBatchReject');
    const confirmBatchRejectButton = document.getElementById('confirmBatchReject');

    let changeRequestsData = [];
    let currentRequestCode = '';
    let currentChangeRequestCode = '';
    let sortConfig = {
        column: null,
        direction: 'asc'
    };

    // Listen for messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        console.log("[Webview] Received message:", message.command);

        switch (message.command) {
            case 'setChangeRequestsData':
                console.log("[Webview] Change requests data received:", message.data.length, "items");
                changeRequestsData = message.data || [];
                currentRequestCode = message.requestCode;
                renderChangeRequests();
                break;
                
            case 'modelValidationSetError':
                showError(message.text);
                hideSpinner();
                break;
        }
    });

    // Set up event listeners
    statusFilterSelect.addEventListener('change', renderChangeRequests);
    refreshButton.addEventListener('click', refreshData);
    cancelRejectButton.addEventListener('click', closeRejectModal);
    confirmRejectButton.addEventListener('click', submitRejection);
    cancelBatchRejectButton.addEventListener('click', closeBatchRejectModal);
    confirmBatchRejectButton.addEventListener('click', submitBatchRejection);

    // Add event listeners for batch action buttons
    document.getElementById('approveAllBtn').addEventListener('click', approveAllChangeRequests);
    document.getElementById('rejectAllBtn').addEventListener('click', openBatchRejectModal);
    document.getElementById('applyAllBtn').addEventListener('click', applyAllChangeRequests);

    /**
     * Shows the loading spinner overlay.
     */
    function showSpinner() {
        spinnerOverlay.style.display = 'flex';
    }

    /**
     * Hides the loading spinner overlay.
     */
    function hideSpinner() {
        spinnerOverlay.style.display = 'none';
    }

    /**
     * Opens the reject modal for a specific change request.
     * @param {string} changeRequestCode The change request code to reject.
     */
    function openRejectModal(changeRequestCode) {
        currentChangeRequestCode = changeRequestCode;
        rejectionReasonInput.value = '';
        rejectModal.style.display = 'flex';
        rejectionReasonInput.focus();
    }

    /**
     * Closes the reject modal.
     */
    function closeRejectModal() {
        rejectModal.style.display = 'none';
        currentChangeRequestCode = '';
    }

    /**
     * Opens the batch reject modal for all pending change requests.
     */
    function openBatchRejectModal() {
        const pendingRequests = getFilteredPendingRequests();
        
        if (pendingRequests.length === 0) {
            vscode.postMessage({
                command: 'showMessage',
                type: 'warning',
                message: 'There are no pending change requests to reject.'
            });
            return;
        }
        
        batchRejectionReasonInput.value = '';
        batchRejectModal.style.display = 'flex';
        batchRejectionReasonInput.focus();
    }

    /**
     * Closes the batch reject modal.
     */
    function closeBatchRejectModal() {
        batchRejectModal.style.display = 'none';
    }

    /**
     * Submits the rejection with reason.
     */
    function submitRejection() {
        const reason = rejectionReasonInput.value.trim();
        
        if (!reason) {
            vscode.postMessage({
                command: 'showMessage',
                type: 'error',
                message: 'Please provide a reason for rejection.'
            });
            return;
        }
        
        showSpinner();
        vscode.postMessage({
            command: 'rejectChangeRequest',
            requestCode: currentRequestCode,
            changeRequestCode: currentChangeRequestCode,
            reason: reason
        });
        
        closeRejectModal();
    }

    /**
     * Submits the batch rejection with reason.
     */
    function submitBatchRejection() {
        const reason = batchRejectionReasonInput.value.trim();
        
        if (!reason) {
            vscode.postMessage({
                command: 'showMessage',
                type: 'error',
                message: 'Please provide a reason for rejection.'
            });
            return;
        }
        
        const pendingRequests = getFilteredPendingRequests();
        
        if (pendingRequests.length === 0) {
            vscode.postMessage({
                command: 'showMessage',
                type: 'warning',
                message: 'There are no pending change requests to reject.'
            });
            return;
        }
        
        showSpinner();
        vscode.postMessage({
            command: 'rejectAllChangeRequests',
            requestCode: currentRequestCode,
            reason: reason
        });
        
        closeBatchRejectModal();
    }

    /**
     * Sends a request to the extension to refresh change requests data.
     */
    function refreshData() {
        showSpinner();
        vscode.postMessage({
            command: 'webviewReady'
        });
    }

    /**
     * Gets the current filter settings.
     * @returns {Object} The filter settings.
     */
    function getFilterSettings() {
        return {
            status: statusFilterSelect.value
        };
    }

    /**
     * Filters change requests based on the current filter settings.
     * @param {Array} data The change requests data.
     * @returns {Array} The filtered data.
     */
    function filterChangeRequests(data) {
        const filters = getFilterSettings();
        
        return data.filter(item => {
            // Status filter
            if (filters.status !== 'all') {
                if (filters.status === 'pending' && (item.IsApproved || item.IsRejected || item.IsProcessed)) {
                    return false;
                }
                if (filters.status === 'approved' && !item.IsApproved) {
                    return false;
                }
                if (filters.status === 'rejected' && !item.IsRejected) {
                    return false;
                }
                if (filters.status === 'processed' && !item.IsProcessed) {
                    return false;
                }
            }
            
            return true;
        });
    }

    /**
     * Gets all pending change requests that match the current filter.
     * @returns {Array} An array of pending change requests.
     */
    function getFilteredPendingRequests() {
        const filteredData = filterChangeRequests(changeRequestsData);
        return filteredData.filter(item => !item.IsApproved && !item.IsRejected && !item.IsProcessed);
    }

    /**
     * Gets all approved but not processed change requests that match the current filter.
     * @returns {Array} An array of approved but not processed change requests.
     */
    function getFilteredApprovedRequests() {
        const filteredData = filterChangeRequests(changeRequestsData);
        return filteredData.filter(item => item.IsApproved && !item.IsProcessed && item.IsAutomatedChangeAvailable);
    }

    /**
     * Sorts change requests data by the specified column.
     * @param {Array} data The data to sort.
     * @param {string} column The column to sort by.
     * @param {string} direction The direction to sort (asc or desc).
     * @returns {Array} The sorted data.
     */
    function sortChangeRequests(data, column, direction) {
        return [...data].sort((a, b) => {
            let valueA, valueB;

            // Handle different column types
            switch(column) {
                case 'Description':
                    valueA = a.Description || '';
                    valueB = b.Description || '';
                    break;
                case 'PropertyName':
                    valueA = a.PropertyName || '';
                    valueB = b.PropertyName || '';
                    break;
                case 'OldValue':
                    valueA = a.OldValue || '';
                    valueB = b.OldValue || '';
                    break;
                case 'NewValue':
                    valueA = a.NewValue || '';
                    valueB = b.NewValue || '';
                    break;
                case 'Status':
                    // Sort by status priority (Pending, Approved, Applied, Rejected)
                    valueA = getStatusPriority(a);
                    valueB = getStatusPriority(b);
                    break;
                default:
                    return 0;
            }

            // String comparison for text values
            if (typeof valueA === 'string' && typeof valueB === 'string') {
                return direction === 'asc' 
                    ? valueA.localeCompare(valueB) 
                    : valueB.localeCompare(valueA);
            } 
            
            // Number comparison for numeric values
            return direction === 'asc' 
                ? valueA - valueB 
                : valueB - valueA;
        });
    }

    /**
     * Gets a numeric priority for a change request status for sorting purposes.
     * @param {Object} item The change request.
     * @returns {number} A numeric priority (lower numbers come first).
     */
    function getStatusPriority(item) {
        if (item.IsRejected) return 4;
        if (item.IsProcessed) return 3;
        if (item.IsApproved) return 2;
        return 1; // Pending
    }

    /**
     * Determines the status text and badge class for a change request.
     * @param {Object} item The change request.
     * @returns {Object} The status text and badge class.
     */
    function getStatusInfo(item) {
        if (item.IsProcessed) {
            return { text: 'Applied', class: 'applied' };
        }
        if (item.IsRejected) {
            return { text: 'Rejected', class: 'rejected' };
        }
        if (item.IsApproved) {
            return { text: 'Approved', class: 'approved' };
        }
        return { text: 'Pending', class: 'pending' };
    }

    /**
     * Formats a date string into a readable format.
     * @param {string} dateString The date string to format.
     * @returns {string} The formatted date.
     */
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString();
        } catch (e) {
            return dateString;
        }
    }

    /**
     * Renders the change requests table.
     */
    function renderChangeRequests() {
        hideSpinner();
        
        if (!changeRequestsData || changeRequestsData.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No change requests available</h3>
                    <p>There are no change requests for this validation request.</p>
                </div>`;
            return;
        }
        
        let filteredData = filterChangeRequests(changeRequestsData);
        
        if (filteredData.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No matching change requests</h3>
                    <p>No change requests match your current filters.</p>
                </div>`;
            return;
        }

        // Apply sorting if a column is selected
        if (sortConfig.column) {
            filteredData = sortChangeRequests(filteredData, sortConfig.column, sortConfig.direction);
        }
        
        // Update batch action buttons state
        updateBatchActionsButtonsState();
        
        let tableHtml = `
            <table class="change-requests-table">
                <thead>
                    <tr>
                        <th class="sortable" data-column="Description" style="width: 35%">
                            Description
                            <span class="sort-icon">${getSortIcon('Description')}</span>
                        </th>
                        <th class="sortable" data-column="PropertyName" style="width: 15%">
                            Property
                            <span class="sort-icon">${getSortIcon('PropertyName')}</span>
                        </th>
                        <th class="sortable" data-column="OldValue" style="width: 15%">
                            Old Value
                            <span class="sort-icon">${getSortIcon('OldValue')}</span>
                        </th>
                        <th class="sortable" data-column="NewValue" style="width: 15%">
                            New Value
                            <span class="sort-icon">${getSortIcon('NewValue')}</span>
                        </th>
                        <th class="sortable" data-column="Status" style="width: 10%">
                            Status
                            <span class="sort-icon">${getSortIcon('Status')}</span>
                        </th>
                        <th style="width: 10%">Actions</th>
                    </tr>
                </thead>
                <tbody>`;
                
        filteredData.forEach(item => {
            const statusInfo = getStatusInfo(item);
            const isPending = !item.IsApproved && !item.IsRejected && !item.IsProcessed;
            
            tableHtml += `
                <tr data-code="${item.Code}">
                    <td class="truncate" title="${item.Description}">${item.Description}</td>
                    <td>${item.PropertyName}</td>
                    <td class="truncate" title="${item.OldValue}"><span class="mono">${item.OldValue}</span></td>
                    <td class="truncate" title="${item.NewValue}"><span class="mono">${item.NewValue}</span></td>
                    <td><span class="status-badge ${statusInfo.class}">${statusInfo.text}</span></td>
                    <td>
                        ${isPending ? `
                            <button class="action-button approve-btn" data-code="${item.Code}">Approve</button>
                            <button class="action-button reject-btn" data-code="${item.Code}">Reject</button>
                        ` : ''}
                        ${item.IsApproved && !item.IsProcessed && item.IsAutomatedChangeAvailable ? `
                            <button class="action-button apply-btn" data-code="${item.Code}">Apply</button>
                        ` : ''}
                    </td>
                </tr>`;
        });
        
        tableHtml += `
                </tbody>
            </table>`;
            
        container.innerHTML = tableHtml;
        
        // Add event listeners to action buttons
        document.querySelectorAll('.approve-btn').forEach(button => {
            button.addEventListener('click', function() {
                const code = this.getAttribute('data-code');
                approveChangeRequest(code);
            });
        });
        
        document.querySelectorAll('.reject-btn').forEach(button => {
            button.addEventListener('click', function() {
                const code = this.getAttribute('data-code');
                openRejectModal(code);
            });
        });
        
        document.querySelectorAll('.apply-btn').forEach(button => {
            button.addEventListener('click', function() {
                const code = this.getAttribute('data-code');
                applyChangeRequest(code);
            });
        });

        // Add event listeners to sortable column headers
        document.querySelectorAll('th.sortable').forEach(header => {
            header.addEventListener('click', function() {
                const column = this.getAttribute('data-column');
                handleColumnHeaderClick(column);
            });
        });
    }

    /**
     * Gets the appropriate sort icon based on the current sort configuration.
     * @param {string} column The column name.
     * @returns {string} HTML for the sort icon.
     */
    function getSortIcon(column) {
        if (sortConfig.column !== column) {
            return '↕';
        }
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    }

    /**
     * Handles column header clicks for sorting.
     * @param {string} column The column that was clicked.
     */
    function handleColumnHeaderClick(column) {
        // If clicked the same column, toggle direction
        if (sortConfig.column === column) {
            sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            // If clicked a new column, set it and default to ascending
            sortConfig.column = column;
            sortConfig.direction = 'asc';
        }
        
        // Re-render with new sort configuration
        renderChangeRequests();
    }

    /**
     * Updates the state (enabled/disabled) of batch action buttons based on the current data.
     */
    function updateBatchActionsButtonsState() {
        const pendingRequests = getFilteredPendingRequests();
        const approvedRequests = getFilteredApprovedRequests();
        
        const approveAllBtn = document.getElementById('approveAllBtn');
        const rejectAllBtn = document.getElementById('rejectAllBtn');
        const applyAllBtn = document.getElementById('applyAllBtn');
        
        // Enable/disable buttons based on if there are items to act on
        if (approveAllBtn) {
            approveAllBtn.disabled = pendingRequests.length === 0;
            approveAllBtn.title = pendingRequests.length === 0 ? 
                'No pending change requests to approve' : 
                `Approve all ${pendingRequests.length} pending change requests`;
        }
        
        if (rejectAllBtn) {
            rejectAllBtn.disabled = pendingRequests.length === 0;
            rejectAllBtn.title = pendingRequests.length === 0 ? 
                'No pending change requests to reject' : 
                `Reject all ${pendingRequests.length} pending change requests`;
        }
        
        if (applyAllBtn) {
            applyAllBtn.disabled = approvedRequests.length === 0;
            applyAllBtn.title = approvedRequests.length === 0 ? 
                'No approved change requests to apply' : 
                `Apply all ${approvedRequests.length} approved change requests`;
        }
    }

    /**
     * Approves all pending change requests.
     */
    function approveAllChangeRequests() {
        const pendingRequests = getFilteredPendingRequests();
        
        if (pendingRequests.length === 0) {
            vscode.postMessage({
                command: 'showMessage',
                type: 'warning',
                message: 'There are no pending change requests to approve.'
            });
            return;
        }
        
        // Confirm with the user
        if (confirm(`Are you sure you want to approve all ${pendingRequests.length} pending change requests?`)) {
            showSpinner();
            vscode.postMessage({
                command: 'approveAllChangeRequests',
                requestCode: currentRequestCode
            });
        }
    }

    /**
     * Applies all approved change requests.
     */
    function applyAllChangeRequests() {
        const approvedRequests = getFilteredApprovedRequests();
        
        if (approvedRequests.length === 0) {
            vscode.postMessage({
                command: 'showMessage',
                type: 'warning',
                message: 'There are no approved change requests to apply.'
            });
            return;
        }
        
        // Confirm with the user
        if (confirm(`Are you sure you want to apply all ${approvedRequests.length} approved change requests?`)) {
            showSpinner();
            vscode.postMessage({
                command: 'applyAllChangeRequests',
                requestCode: currentRequestCode
            });
        }
    }

    /**
     * Approves a change request.
     * @param {string} changeRequestCode The change request code to approve.
     */
    function approveChangeRequest(changeRequestCode) {
        showSpinner();
        vscode.postMessage({
            command: 'approveChangeRequest',
            requestCode: currentRequestCode,
            changeRequestCode: changeRequestCode
        });
    }

    /**
     * Applies a change request to the model.
     * @param {string} changeRequestCode The change request code to apply.
     */
    function applyChangeRequest(changeRequestCode) {
        showSpinner();
        vscode.postMessage({
            command: 'applyChangeRequest',
            requestCode: currentRequestCode,
            changeRequestCode: changeRequestCode
        });
    }

    /**
     * Renders an error message.
     * @param {string} message The error message to display.
     */
    function renderError(message) {
        hideSpinner();
        container.innerHTML = `
            <div class="empty-state" style="color: var(--vscode-errorForeground);">
                <h3>Error</h3>
                <p>${message}</p>
            </div>`;
    }

    // Send ready message to extension
    console.log("[Webview] Sending webviewReady message");
    vscode.postMessage({ command: 'webviewReady' });
})();
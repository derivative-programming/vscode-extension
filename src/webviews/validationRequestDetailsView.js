// src/webviews/validationRequestDetailsView.js
// Handles displaying the details of a specific validation request in a webview.
// Last modified: May 5, 2025

(function() {
    const vscode = acquireVsCodeApi();
    const container = document.getElementById('details-container');

    // Listen for messages from the extension
    window.addEventListener('message', event => {
        const message = event.data; // The JSON data our extension sent
        console.log("[Webview] Received message:", message.command);

        switch (message.command) {
            case 'setRequestDetails':
                console.log("[Webview] Full details data:", message.data);
                renderDetails(message.data);
                break;
            case 'setError':
                renderError(message.text);
                break;
            case 'cancelSuccess':
                // Update UI to reflect a successful cancel
                const cancelBtn = document.getElementById('cancelButton');
                if (cancelBtn) {
                    cancelBtn.disabled = true;
                    cancelBtn.textContent = 'Request Cancelled';
                }
                // Refresh the status display
                const statusValue = document.querySelector('.status-field .detail-value');
                if (statusValue) {
                    statusValue.textContent = 'Cancelled';
                }
                vscode.postMessage({ command: 'showMessage', type: 'info', message: 'Validation request cancelled successfully' });
                break;
            case 'cancelError':
                vscode.postMessage({ command: 'showMessage', type: 'error', message: message.text });
                break;
        }
    });

    /**
     * Renders the validation request details in the container.
     * @param {object} data The details object from the API.
     */
    function renderDetails(data) {
        if (!data) {
            renderError("No details received from the extension.");
            return;
        }

        // Print out the data structure to see what we're working with
        console.log("Data structure keys:", Object.keys(data));
        console.log("Description value:", data.modelValidationRequestDescription);
        console.log("Requested time value:", data.modelValidationRequestRequestedUTCDateTime);

        // Clear loading/error message
        container.innerHTML = '';

        // Define which fields to display and their labels - SIMPLIFIED
        const fieldsToShow = [
            { key: 'modelValidationRequestDescription', label: 'Description' },
            { key: 'modelValidationRequestRequestedUTCDateTime', label: 'Requested At', type: 'datetime' },
            { key: 'status', label: 'Status', className: 'status-field' } // Calculated status with a class for easy identification
        ];

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
                        displayValue = `<span class="detail-value">${new Date(value).toLocaleString()}</span>`;
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

            // Always display the item
            const itemDiv = document.createElement('div');
            itemDiv.className = 'detail-item';
            if (field.className) {
                itemDiv.classList.add(field.className);
            }
            itemDiv.innerHTML = `
                <span class="detail-label">${field.label}:</span>
                ${displayValue}
            `;
            container.appendChild(itemDiv);
        });

        // Add the Cancel Request button
        const actionDiv = document.createElement('div');
        actionDiv.className = 'action-container';
        
        // Check conditions for enabling the cancel button
        const canCancel = !data.modelValidationRequestIsStarted && !data.modelValidationRequestIsCanceled;
        
        actionDiv.innerHTML = `
            <button id="cancelButton" class="cancel-button" ${!canCancel ? 'disabled' : ''}>
                Cancel Request
            </button>
        `;
        container.appendChild(actionDiv);
        
        // Attach event handler to the cancel button
        document.getElementById('cancelButton').addEventListener('click', function() {
            if (canCancel) {
                if (confirm('Are you sure you want to cancel this validation request?')) {
                    // Send cancel request to extension
                    vscode.postMessage({ 
                        command: 'cancelRequest', 
                        requestCode: data.modelValidationRequestCode 
                    });
                    
                    // Disable the button immediately to prevent double clicks
                    this.disabled = true;
                    this.textContent = 'Cancelling...';
                }
            }
        });
    }

    /**
     * Calculates the display status based on the request flags.
     * @param {object} data The request data object.
     * @returns {string} The calculated status string.
     */
    function calculateStatus(data) {
        // Logic copied from modelValidationView.js for consistency
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
     * Renders an error message in the container.
     * @param {string} text The error message text.
     */
    function renderError(text) {
        container.innerHTML = `<div class="error-message">${text}</div>`;
    }

    // Send message to extension that webview is ready
    console.log("[Webview] Sending webviewReady");
    vscode.postMessage({ command: 'webviewReady' });

})();

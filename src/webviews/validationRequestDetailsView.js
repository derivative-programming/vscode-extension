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
            { key: 'status', label: 'Status' } // Calculated status
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
            itemDiv.innerHTML = `
                <span class="detail-label">${field.label}:</span>
                ${displayValue}
            `;
            container.appendChild(itemDiv);
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

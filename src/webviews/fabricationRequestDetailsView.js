// filepath: c:\VR\Source\DP\vscode-extension\src\webviews\fabricationRequestDetailsView.js
// src/webviews/fabricationRequestDetailsView.js
// Handles displaying the details of a specific model fabrication request in a webview.
// Last modified: May 8, 2025

(function() {
    const vscode = acquireVsCodeApi();
    const container = document.getElementById('details-container');
    let currentRequestData = null;

    // Listen for messages from the extension
    window.addEventListener('message', event => {
        const message = event.data; // The JSON data our extension sent
        console.log("[Webview] Received message:", message.command);

        switch (message.command) {
            case 'modelFabricationSetRequestDetails':
                console.log("[Webview] Full details data:", message.data);
                currentRequestData = message.data;
                renderDetails(message.data);
                break;
            case 'modelFabricationSetError':
                renderError(message.text);
                break;
            case 'modelFabricationResultDownloadStarted':
                updateButtonToProcessing();
                break;
            case 'modelFabricationResultDownloadSuccess':
                updateButtonAfterSuccess();
                vscode.postMessage({ 
                    command: 'showMessage', 
                    type: 'info', 
                    message: 'Fabrication results downloaded and extracted successfully. Check the fabrication_results folder.'
                });
                break;
            case 'modelFabricationResultDownloadError':
                updateButtonAfterError();
                vscode.postMessage({ 
                    command: 'showMessage', 
                    type: 'error', 
                    message: message.error || 'Failed to download fabrication results.'
                });
                break;
        }
    });

    /**
     * Updates the button to show a downloading state with animation.
     */
    function updateButtonToProcessing() {
        const button = document.querySelector('.download-button');
        if (button) {
            button.disabled = true;
            button.innerHTML = '<span class="spinner"></span> Downloading...';
        }
    }

    /**
     * Updates the button after a successful download.
     */
    function updateButtonAfterSuccess() {
        const button = document.querySelector('.download-button');
        if (button) {
            button.disabled = false;
            button.textContent = 'Download Results';
            button.className = 'download-button download-success';
        }
    }

    /**
     * Updates the button after a download error.
     */
    function updateButtonAfterError() {
        const button = document.querySelector('.download-button');
        if (button) {
            button.disabled = false;
            button.textContent = 'Retry Download';
        }
    }

    /**
     * Renders the fabrication request details in the container.
     * @param {object} data The details object from the API.
     */
    function renderDetails(data) {
        if (!data) {
            renderError("No details received from the extension.");
            return;
        }

        // Print out the data structure to see what we're working with
        console.log("Data structure keys:", Object.keys(data));

        // Clear loading/error message
        container.innerHTML = '';

        // Define which fields to display and their labels
        const fieldsToShow = [
            { key: 'modelFabricationRequestDescription', label: 'Description' },
            { key: 'modelFabricationRequestRequestedUTCDateTime', label: 'Requested At', type: 'datetime' },
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

        // Add error information if there were errors
        if (data.modelFabricationRequestIsCompleted && !data.modelFabricationRequestIsSuccessful) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'detail-item error-details';
            errorDiv.innerHTML = `
                <span class="detail-label">Error Details:</span>
                <span class="detail-value error-message">${data.modelFabricationRequestErrorMessage || 'No specific error details available.'}</span>
            `;
            container.appendChild(errorDiv);
        }

        // Add the action container for buttons
        const actionDiv = document.createElement('div');
        actionDiv.className = 'action-container';
        container.appendChild(actionDiv);
        
        // Add the download results button if URL is available and request was successful
        if (data.modelFabricationRequestResultUrl && data.modelFabricationRequestIsCompleted && data.modelFabricationRequestIsSuccessful) {
            const downloadButton = document.createElement('button');
            downloadButton.className = 'download-button';
            downloadButton.textContent = 'Download Results';
            downloadButton.addEventListener('click', function() {
                // Send message to extension to download the fabrication results
                vscode.postMessage({
                    command: 'modelFabricationDownloadResults',
                    url: data.modelFabricationRequestResultUrl,
                    requestCode: data.modelFabricationRequestCode
                });
            });
            actionDiv.appendChild(downloadButton);
        }
    }

    /**
     * Calculates the display status based on the request flags.
     * @param {object} data The request data object.
     * @returns {string} The calculated status string.
     */
    function calculateStatus(data) {
        if (data.modelFabricationRequestIsCanceled) {
            return "Cancelled";
        } else if (!data.modelFabricationRequestIsStarted) {
            return "Queued";
        } else if (data.modelFabricationRequestIsStarted && !data.modelFabricationRequestIsCompleted) {
            return "Processing";
        } else if (data.modelFabricationRequestIsCompleted && !data.modelFabricationRequestIsSuccessful) {
            return "Fabrication Error";
        } else if (data.modelFabricationRequestIsCompleted && data.modelFabricationRequestIsSuccessful) {
            return "Success";
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
    vscode.postMessage({ command: 'modelFabricationWebviewReady' });

})();
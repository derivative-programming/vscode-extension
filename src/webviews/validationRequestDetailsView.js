// src/webviews/validationRequestDetailsView.js
// Handles displaying the details of a specific validation request in a webview.
// Last modified: May 5, 2025

(function() {
    const vscode = acquireVsCodeApi();
    const container = document.getElementById('details-container');
    let currentRequestData = null;

    // Listen for messages from the extension
    window.addEventListener('message', event => {
        const message = event.data; // The JSON data our extension sent
        console.log("[Webview] Received message:", message.command);

        switch (message.command) {
            case 'setRequestDetails':
                console.log("[Webview] Full details data:", message.data);
                currentRequestData = message.data;
                renderDetails(message.data);
                break;
            case 'setError':
                renderError(message.text);
                break;
            case 'reportExistsResult':
                handleReportExistsResult(message);
                break;
            case 'reportDownloadStarted':
                updateButtonToProcessing();
                break;
            case 'reportDownloadSuccess':
                updateButtonAfterSuccess();
                vscode.postMessage({ 
                    command: 'showMessage', 
                    type: 'info', 
                    message: 'Report downloaded and opened successfully.'
                });
                break;
            case 'reportOpened':
                console.log("[Webview] Report opened successfully");
                break;
            case 'reportDownloadError':
                updateButtonAfterError();
                vscode.postMessage({ 
                    command: 'showMessage', 
                    type: 'error', 
                    message: message.error || 'Failed to download report.'
                });
                break;
            case 'reportOpenError':
                vscode.postMessage({ 
                    command: 'showMessage', 
                    type: 'error', 
                    message: message.error || 'Failed to open report.'
                });
                break;
        }
    });

    /**
     * Handles the result of checking if a report exists locally.
     * @param {object} message The message containing the exists result.
     */
    function handleReportExistsResult(message) {
        if (!currentRequestData) {
            console.error("[Webview] Cannot handle report exists result: no request data available");
            return;
        }

        const actionDiv = document.querySelector('.action-container');
        if (!actionDiv) {
            console.error("[Webview] Cannot handle report exists result: action container not found");
            return;
        }

        const exists = message.exists;
        console.log("[Webview] Report exists locally:", exists);
        
        // Create or update the report button
        let buttonText = exists ? "View Report" : "Download Report";
        let buttonCommand = exists ? "viewReport" : "downloadReport";
        
        // Remove any existing button
        const existingButton = actionDiv.querySelector('button');
        if (existingButton) {
            actionDiv.removeChild(existingButton);
        }
        
        // Create new button with appropriate text and command
        const reportButton = document.createElement('button');
        reportButton.className = 'download-button';
        reportButton.textContent = buttonText;
        reportButton.addEventListener('click', function() {
            if (buttonCommand === 'downloadReport') {
                // Send message to extension to download the report
                vscode.postMessage({
                    command: 'downloadReport',
                    url: currentRequestData.modelValidationRequestReportUrl,
                    requestCode: currentRequestData.modelValidationRequestCode
                });
            } else {
                // Send message to extension to view the existing report
                vscode.postMessage({
                    command: 'viewReport',
                    requestCode: currentRequestData.modelValidationRequestCode
                });
            }
        });
        
        actionDiv.appendChild(reportButton);
    }

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
            button.textContent = 'View Report';
            
            // Update the click handler to use viewReport instead of downloadReport
            button.onclick = function() {
                vscode.postMessage({
                    command: 'viewReport',
                    requestCode: currentRequestData.modelValidationRequestCode
                });
            };
        }
    }

    /**
     * Updates the button after a download error.
     */
    function updateButtonAfterError() {
        const button = document.querySelector('.download-button');
        if (button) {
            button.disabled = false;
            button.textContent = 'Download Report';
        }
    }

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

        // Add the Report button container if report URL is available
        if (data.modelValidationRequestReportUrl) {
            const actionDiv = document.createElement('div');
            actionDiv.className = 'action-container';
            
            // Add a placeholder button that will be updated after checking if the file exists
            const tempButton = document.createElement('button');
            tempButton.className = 'download-button';
            tempButton.textContent = 'Checking...';
            tempButton.disabled = true;
            
            actionDiv.appendChild(tempButton);
            container.appendChild(actionDiv);
            
            // Check if the report file already exists locally
            vscode.postMessage({
                command: 'checkReportExists',
                requestCode: data.modelValidationRequestCode
            });
        }
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

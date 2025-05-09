// filepath: c:\VR\Source\DP\vscode-extension\src\webviews\fabricationRequestDetailsView.js
// src/webviews/fabricationRequestDetailsView.js
// Handles displaying the details of a specific model fabrication request in a webview.
// Last modified: May 8, 2025

(function() {
    const vscode = acquireVsCodeApi();
    const container = document.getElementById('details-container');
    let currentRequestData = null;
    
    // For debugging progress updates
    let progressHistory = [];
    let lastMessageTimestamp = Date.now();

    // Listen for messages from the extension
    window.addEventListener('message', event => {
        const message = event.data; // The JSON data our extension sent
        const now = Date.now();
        const elapsed = now - lastMessageTimestamp;
        lastMessageTimestamp = now;
        
        console.log(`[Webview] Received message: ${message.command} (${elapsed}ms since last message)`, message);

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
                console.log("[Webview] Download started - updating UI");
                updateButtonToProcessing();
                showDownloadProgress();
                break;
            case 'modelFabricationDownloadProgress':
                const percent = message.percent || 0;
                // Store progress for debugging
                progressHistory.push({
                    time: new Date().toISOString(),
                    percent: percent
                });
                
                console.log(`[Webview] Download progress update: ${percent}% (history has ${progressHistory.length} entries)`);
                updateDownloadProgress(percent);
                
                // Force a UI refresh
                setTimeout(() => {
                    const progressBar = document.querySelector('#download-progress .progress-bar');
                    if (progressBar) {
                        console.log(`[Webview] Progress bar width is now: ${progressBar.style.width}`);
                    }
                }, 50);
                break;
            case 'modelFabricationExtractionStarted':
                console.log("[Webview] Extraction started - files:", message.fileCount);
                showExtractionProgress(message.fileCount);
                break;
            case 'modelFabricationExtractionProgress':
                console.log(`[Webview] Extraction progress: ${message.percent}% (${message.extracted}/${message.total} files)`);
                updateExtractionProgress(message.extracted, message.total, message.percent);
                break;
            case 'modelFabricationResultDownloadSuccess':
                console.log("[Webview] Download success");
                console.log("[Webview] Progress history:", JSON.stringify(progressHistory, null, 2));
                updateButtonAfterSuccess();
                hideProgressContainer();
                showSuccessMessage('Fabrication results have been downloaded and extracted successfully.');
                vscode.postMessage({ 
                    command: 'showMessage', 
                    type: 'info', 
                    message: 'Fabrication results downloaded and extracted successfully. Check the fabrication_results folder.'
                });
                break;
            case 'modelFabricationResultDownloadError':
                console.log("[Webview] Download error:", message.error);
                console.log("[Webview] Progress history:", JSON.stringify(progressHistory, null, 2));
                updateButtonAfterError();
                hideProgressContainer();
                vscode.postMessage({ 
                    command: 'showMessage', 
                    type: 'error', 
                    message: message.error || 'Failed to download fabrication results.'
                });
                break;
        }
    });

    /**
     * Shows a progress container for the download process.
     */
    function showDownloadProgress() {
        console.log("[Webview] Creating download progress UI");
        // Remove any existing progress container
        const existingContainer = document.querySelector('.progress-container');
        if (existingContainer) {
            console.log("[Webview] Removing existing progress container");
            existingContainer.remove();
        }
        
        // Create progress container
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container visible';
        progressContainer.id = 'download-progress';
        
        progressContainer.innerHTML = `
            <div class="progress-title">Downloading Fabrication Results</div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: 0%"></div>
            </div>
            <div class="progress-info">
                <span class="progress-percentage">0%</span>
                <span class="progress-bytes"></span>
            </div>
            <div class="status-message">Starting download...</div>
        `;
        
        // Add the progress container after the download button
        const actionContainer = document.querySelector('.action-container');
        if (actionContainer) {
            console.log("[Webview] Appending progress container after action container");
            actionContainer.after(progressContainer);
        } else {
            console.log("[Webview] No action container found, appending to main container");
            container.appendChild(progressContainer);
        }
        
        // Force DOM update
        setTimeout(() => {
            console.log("[Webview] Progress UI created, container:", document.getElementById('download-progress') ? "found" : "not found");
        }, 10);
    }

    /**
     * Updates the download progress bar.
     * @param {number} percent - The percentage of the download that is complete.
     */
    function updateDownloadProgress(percent) {
        const progressContainer = document.getElementById('download-progress');
        if (!progressContainer) {
            console.warn("[Webview] Progress container not found when updating progress to", percent);
            return;
        }
        
        const progressBar = progressContainer.querySelector('.progress-bar');
        const progressPercentage = progressContainer.querySelector('.progress-percentage');
        const statusMessage = progressContainer.querySelector('.status-message');
        
        if (progressBar) {
            console.log(`[Webview] Updating progress bar width to ${percent}%`);
            const prevWidth = progressBar.style.width;
            progressBar.style.width = `${percent}%`;
            console.log(`[Webview] Progress bar width changed from ${prevWidth} to ${progressBar.style.width}`);
        } else {
            console.warn("[Webview] Progress bar element not found");
        }
        
        if (progressPercentage) {
            progressPercentage.textContent = `${percent}%`;
        } else {
            console.warn("[Webview] Progress percentage element not found");
        }
        
        if (statusMessage) {
            statusMessage.textContent = `Downloading file... ${percent}% complete`;
        } else {
            console.warn("[Webview] Status message element not found");
        }
    }

    /**
     * Shows a progress container for the extraction process.
     * @param {number} fileCount - The total number of files to extract.
     */
    function showExtractionProgress(fileCount) {
        console.log("[Webview] Creating extraction progress UI");
        // Remove download progress if it exists
        const downloadProgress = document.getElementById('download-progress');
        if (downloadProgress) {
            console.log("[Webview] Removing download progress container");
            downloadProgress.remove();
        }
        
        // Create extraction progress container
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container visible';
        progressContainer.id = 'extraction-progress';
        
        progressContainer.innerHTML = `
            <div class="progress-title">Extracting Files</div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: 0%"></div>
            </div>
            <div class="progress-info">
                <span class="progress-percentage">0%</span>
                <span class="progress-files">0/${fileCount} files</span>
            </div>
            <div class="status-message">Starting extraction...</div>
        `;
        
        // Add the progress container after the download button
        const actionContainer = document.querySelector('.action-container');
        if (actionContainer) {
            console.log("[Webview] Appending extraction progress container after action container");
            actionContainer.after(progressContainer);
        } else {
            console.log("[Webview] No action container found, appending to main container");
            container.appendChild(progressContainer);
        }
    }

    /**
     * Updates the extraction progress bar.
     * @param {number} extracted - The number of files extracted.
     * @param {number} total - The total number of files to extract.
     * @param {number} percent - The percentage of extraction that is complete.
     */
    function updateExtractionProgress(extracted, total, percent) {
        const progressContainer = document.getElementById('extraction-progress');
        if (!progressContainer) {
            console.warn("[Webview] Extraction progress container not found");
            return;
        }
        
        const progressBar = progressContainer.querySelector('.progress-bar');
        const progressPercentage = progressContainer.querySelector('.progress-percentage');
        const progressFiles = progressContainer.querySelector('.progress-files');
        const statusMessage = progressContainer.querySelector('.status-message');
        
        if (progressBar) {
            console.log(`[Webview] Updating extraction progress bar width to ${percent}%`);
            progressBar.style.width = `${percent}%`;
        } else {
            console.warn("[Webview] Extraction progress bar element not found");
        }
        
        if (progressPercentage) {
            progressPercentage.textContent = `${percent}%`;
        } else {
            console.warn("[Webview] Extraction progress percentage element not found");
        }
        
        if (progressFiles) {
            progressFiles.textContent = `${extracted}/${total} files`;
        } else {
            console.warn("[Webview] Extraction progress files element not found");
        }
        
        if (statusMessage) {
            statusMessage.textContent = `Extracting files... ${percent}% complete`;
        } else {
            console.warn("[Webview] Extraction status message element not found");
        }
    }

    /**
     * Hides all progress containers.
     */
    function hideProgressContainer() {
        console.log("[Webview] Hiding all progress containers");
        const progressContainers = document.querySelectorAll('.progress-container');
        progressContainers.forEach(container => container.remove());
    }

    /**
     * Shows a success message after completion.
     * @param {string} message - The success message to display.
     */
    function showSuccessMessage(message) {
        console.log("[Webview] Showing success message:", message);
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.style.cssText = `
            margin: 15px 0;
            padding: 10px;
            background-color: var(--vscode-terminal-ansiGreen, rgba(137, 209, 133, 0.1));
            border-left: 3px solid var(--vscode-testing-iconPassed, #89D185);
            color: var(--vscode-editor-foreground);
        `;
        successMessage.textContent = message;
        
        // Find where to insert the message
        const actionContainer = document.querySelector('.action-container');
        if (actionContainer) {
            console.log("[Webview] Appending success message after action container");
            actionContainer.after(successMessage);
        }
    }

    /**
     * Updates the button to show a downloading state with animation.
     */
    function updateButtonToProcessing() {
        console.log("[Webview] Updating button to processing state");
        const button = document.querySelector('.download-button');
        if (button) {
            button.disabled = true;
            button.innerHTML = '<span class="spinner"></span> Downloading...';
        } else {
            console.warn("[Webview] Download button not found");
        }
    }

    /**
     * Updates the button after a successful download.
     */
    function updateButtonAfterSuccess() {
        console.log("[Webview] Updating button after success");
        const button = document.querySelector('.download-button');
        if (button) {
            button.disabled = false;
            button.textContent = 'Download Results';
            button.className = 'download-button download-success';
        } else {
            console.warn("[Webview] Download button not found");
        }
    }

    /**
     * Updates the button after a download error.
     */
    function updateButtonAfterError() {
        console.log("[Webview] Updating button after error");
        const button = document.querySelector('.download-button');
        if (button) {
            button.disabled = false;
            button.textContent = 'Retry Download';
        } else {
            console.warn("[Webview] Download button not found");
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
        console.log("[Webview] Rendering error message:", text);
        container.innerHTML = `<div class="error-message">${text}</div>`;
    }

    // Send message to extension that webview is ready
    console.log("[Webview] Sending webviewReady");
    vscode.postMessage({ command: 'modelFabricationWebviewReady' });

})();
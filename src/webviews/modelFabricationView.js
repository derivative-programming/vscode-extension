// modelFabricationView.js
// Webview for displaying Model Fabrication requests in a paged, sortable table
// Last modified: May 8, 2025
// This file provides a professional, VS Code-consistent UI for model fabrication requests.

(function () {
    // Get VS Code API
    const vscode = acquireVsCodeApi();
      // State management
    let fabricationData = [];
    let pageNumber = 1;
    let itemCountPerPage = 10;
    let orderByColumn = "ModelFabricationRequestRequestedUTCDateTime";
    let orderByDescending = true;
    let totalRecords = 0;
    let currentRequestData = null; // Store current request data for modal operations
    // Timer for auto-refresh functionality when processing/queued items exist
    let autoRefreshTimer = null;
    // Time interval for auto-refresh (1 minute in milliseconds)
    const AUTO_REFRESH_INTERVAL = 60000; // 1 minute in milliseconds
    const columns = [
        { key: "modelFabricationRequestRequestedUTCDateTime", label: "Requested Date\\Time" },
        { key: "modelFabricationRequestDescription", label: "Description" },
        { key: "status", label: "Status" },
        { key: "viewDetails", label: "Actions" } // Added Actions column
    ];

    // Spinner control functions (moved to global scope within IIFE)
    function showSpinner() { 
        console.log("[Webview] showSpinner called");
        document.getElementById("spinnerOverlay").style.display = "flex"; 
    }
    function hideSpinner() { 
        console.log("[Webview] hideSpinner called");
        document.getElementById("spinnerOverlay").style.display = "none"; 
    }

    // Add detailed modal UI handlers for download progress

    function updateModalDownloadProgress(percent) {
        console.log(`[Webview] Modal: Updating download progress to ${percent}%`);
        const progressContainer = document.getElementById("modal-progress-container");
        
        if (!progressContainer) {
            console.warn("[Webview] Modal: Cannot find progress container");
            return;
        }
        
        const progressBar = progressContainer.querySelector('.progress-bar');
        const percentText = progressContainer.querySelector('.progress-percentage');
        const statusMsg = progressContainer.querySelector('.status-message');
        
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
            console.log(`[Webview] Modal: Progress bar width set to ${percent}%`);
        }
        
        if (percentText) {
            percentText.textContent = `${percent}%`;
        }
        
        if (statusMsg) {
            statusMsg.textContent = `Downloading file... ${percent}% complete`;
        }
    }

    function showDownloadProgressInModal() {
        console.log("[Webview] Modal: Creating download progress UI");
        const progressContainer = document.getElementById("modal-progress-container");
        
        if (!progressContainer) {
            console.warn("[Webview] Modal: Cannot find progress container element");
            return;
        }
        
        progressContainer.className = "progress-container visible";
        progressContainer.innerHTML = `
            <div class="progress-title">Downloading Fabrication Results</div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: 0%"></div>
            </div>
            <div class="progress-info">
                <span class="progress-percentage">0%</span>
            </div>
            <div class="status-message">Starting download...</div>
        `;
        
        console.log("[Webview] Modal: Download progress UI created");
    }

    function showExtractionProgressInModal(fileCount) {
        console.log("[Webview] Modal: Creating extraction progress UI, files:", fileCount);
        const progressContainer = document.getElementById("modal-progress-container");
        
        if (!progressContainer) {
            console.warn("[Webview] Modal: Cannot find progress container element");
            return;
        }
        
        progressContainer.className = "progress-container visible";
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
        
        console.log("[Webview] Modal: Extraction progress UI created");
    }

    function updateExtractionProgressInModal(extracted, total, percent) {
        console.log(`[Webview] Modal: Updating extraction progress: ${percent}% (${extracted}/${total} files)`);
        const progressContainer = document.getElementById("modal-progress-container");
        
        if (!progressContainer) {
            console.warn("[Webview] Modal: Cannot find progress container for extraction update");
            return;
        }
        
        const progressBar = progressContainer.querySelector('.progress-bar');
        const percentText = progressContainer.querySelector('.progress-percentage');
        const filesText = progressContainer.querySelector('.progress-files');
        const statusMsg = progressContainer.querySelector('.status-message');
        
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
        
        if (percentText) {
            percentText.textContent = `${percent}%`;
        }
        
        if (filesText) {
            filesText.textContent = `${extracted}/${total} files`;
        }
        
        if (statusMsg) {
            statusMsg.textContent = `Extracting files... ${percent}% complete`;
        }
    }

    function downloadComplete() {
        console.log("[Webview] Modal: downloadComplete() called. Cleaning UI and showing success.");
        const modalContent = document.querySelector('#detailsModal .modal-content');

        if (!modalContent) {
            console.warn("[Webview] Modal: Cannot find #detailsModal .modal-content for cleanup.");
            return;
        }

        // 1. Hide and clear the main progress display area
        const mainProgressContainer = document.getElementById("modal-progress-container");
        if (mainProgressContainer) {
            console.log("[Webview] Clearing and hiding #modal-progress-container.");
            mainProgressContainer.innerHTML = ''; // Clear content to stop any lingering updates
            mainProgressContainer.className = "progress-container"; // Remove 'visible' class to hide
        } else {
            console.log("[Webview] #modal-progress-container not found for cleanup.");
        }

        // 2. Remove any other potential old/rogue progress containers (belt and suspenders)
        const legacyProgressContainers = modalContent.querySelectorAll('#download-progress-container, #extraction-progress-container');
        legacyProgressContainers.forEach(container => {
            console.log("[Webview] Removing legacy progress container:", container.id);
            container.remove();
        });
        
        const classBasedProgress = modalContent.querySelectorAll('.progress-container.visible');
         classBasedProgress.forEach(container => {
            // Check if it's not the main one (which should be gone) or already removed
            if (container && container.parentNode && container.id !== 'modal-progress-container') { 
                 console.log("[Webview] Removing visible progress container by class:", container.id || "no-id");
                 container.remove();
            }
         });

        // 3. Remove any pre-existing success messages to avoid duplication
        const existingSuccessMessages = modalContent.querySelectorAll('.success-message');
        existingSuccessMessages.forEach(msg => {
            console.log("[Webview] Removing existing success message.");
            msg.remove();
        });

        // 4. Show the new success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.style.cssText = `
            margin: 15px 0;
            padding: 10px;
            background-color: var(--vscode-terminal-ansiGreen, rgba(137, 209, 133, 0.1));
            border-left: 3px solid var(--vscode-testing-iconPassed, #89D185);
            color: var(--vscode-editor-background);
            display: block !important; 
        `;
        successMessage.textContent = 'Fabrication results have been downloaded and extracted successfully. Fabrication results have been downloaded and extracted to the fabrication_results folder. Review the files and copy needed files to your project.';
        
        const actionContainer = modalContent.querySelector('.action-container');
        if (actionContainer) {
            actionContainer.parentNode.insertBefore(successMessage, actionContainer.nextSibling);
            console.log("[Webview] Appended success message after .action-container.");
        } else {
            modalContent.appendChild(successMessage);
            console.log("[Webview] Appended success message to modalContent.");
        }
        
        // 5. Update the download button state
        const downloadButton = modalContent.querySelector('#downloadResultsButton'); // Use ID for specificity
        if (downloadButton) {
            console.log("[Webview] Updating #downloadResultsButton state.");
            downloadButton.disabled = false;
            downloadButton.textContent = 'Download Results'; // Consistent text
            downloadButton.classList.remove('downloading'); // If such a class is used for styling during download
            downloadButton.classList.add('download-success');
            
            const spinner = downloadButton.querySelector('.spinner'); // Remove spinner from button
            if (spinner) { 
                spinner.remove();
            }
        } else {
            console.log("[Webview] #downloadResultsButton not found in modalContent.");
        }
        console.log("[Webview] downloadComplete() finished.");
    }
    
    function downloadError(errorMessage) {
        console.log("[Webview] Modal: Download error:", errorMessage);
        const modalContent = document.querySelector('#detailsModal .modal-content');
        
        if (!modalContent) {
            return;
        }
        
        // Hide the progress container
        const progressContainer = document.getElementById("modal-progress-container");
        if (progressContainer) {
            progressContainer.innerHTML = '';
            progressContainer.className = "progress-container"; // Remove 'visible' class
        }
        
        // Show error message
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.style.cssText = `
            margin: 15px 0;
            padding: 10px;
            background-color: var(--vscode-inputValidation-errorBackground, rgba(190, 50, 50, 0.1));
            border-left: 3px solid var(--vscode-errorForeground, #F48771);
            color: var(--vscode-editor-foreground);
        `;
        errorElement.textContent = `Error: ${errorMessage || 'Unknown error occurred during download'}`;
        
        modalContent.appendChild(errorElement);
        
        // Update download button if it exists
        const dlButton = modalContent.querySelector('.download-button');
        if (dlButton) {
            dlButton.disabled = false;
            dlButton.textContent = 'Retry Download';
        }
    }    // Set up the UI
    initializeUI();

    // Clean up resources when page is unloaded
    // This ensures we don't leave timers running if the view is closed
    window.addEventListener("unload", function() {
        if (autoRefreshTimer) {
            clearInterval(autoRefreshTimer);
            autoRefreshTimer = null;
        }
    });

    // Event listeners
    window.addEventListener("message", function(event) {
        const message = event.data;
        console.log("[Webview] Received message:", message.command, message);        if (message.command === "setFabricationData") {
            console.log("[Webview] Handling setFabricationData");
            fabricationData = message.data.items || [];
            pageNumber = message.data.pageNumber || 1;
            itemCountPerPage = message.data.itemCountPerPage || 10;
            orderByColumn = message.data.orderByColumnName || orderByColumn;
            orderByDescending = message.data.orderByDescending || false;
            totalRecords = message.data.recordsTotal || 0;
            
            console.log("[Webview] Fabrication data received:", 
                { items: fabricationData.length, pageNumber, totalRecords, orderByColumn, orderByDescending });
            
            // If no items are found, show a notification
            if (fabricationData.length === 0) {
                console.log("[Webview] No fabrication requests found");
                if (totalRecords === 0) {
                    console.log("[Webview] Total records is also 0, likely no requests exist yet");
                }
            }
              renderTable();
            renderPaging();
            // Hide spinner when data is set
            hideSpinner();
            // Check if we should set up auto-refresh based on current processing/queued items
            checkAndSetAutoRefresh();
        } else if (message.command === "ModelFabricationRequestReceived" || message.command === "ModelFabricationRequestFailed") {
            console.log("[Webview] Handling", message.command);
            // Hide spinner when fabrication request is received or failed
            hideSpinner();        } else if (message.command === "ModelFabricationRequestCancelled") {
            console.log("[Webview] Request cancelled successfully, refreshing data");
            hideSpinner();
            // Refresh the current page after a successful cancel
            requestPage(pageNumber);
            // After page refresh, checkAndSetAutoRefresh will be called
        } else if (message.command === "ModelFabricationRequestDetailsData") {
            // Handle receiving details for displaying in modal
            console.log("[Webview] Received details for modal:", message.data);
            hideSpinner();
            showDetailsModal(message.data);
        } else if (message.command === "modelFabricationDownloadProgress") {
            // Update download progress
            console.log("[Webview] Download progress:", message.percent);
            updateModalDownloadProgress(message.percent);
        } else if (message.command === "modelFabricationExtractionStarted") {
            // Show extraction progress
            console.log("[Webview] Extraction started, file count:", message.fileCount);
            showExtractionProgressInModal(message.fileCount);
        } else if (message.command === "modelFabricationSetRootNodeProjectInfo") {
            const { projectName, projectVersionNumber } = message;
            let desc = "";
            if (projectName && projectVersionNumber) {
                desc = "Project: " + projectName + ", Version: " + projectVersionNumber;
            } else if (projectName) {
                desc = "Project: " + projectName;
            } else if (projectVersionNumber) {
                desc = "Version: " + projectVersionNumber;
            }
            document.getElementById("addDescription").value = desc;
        } else if (message.command === "modelFabricationUnsavedChangesStatus") {
            console.log("[Webview] Received unsaved changes status:", message.hasUnsavedChanges);
            const warningElement = document.getElementById("unsavedChangesWarning");
            if (message.hasUnsavedChanges) {
                warningElement.style.display = "block";
            } else {
                warningElement.style.display = "none";
            }
        } else if (message.command === "modelFabricationExtractionProgress") {
            // Update extraction progress
            console.log("[Webview] Extraction progress:", message.percent, `(${message.extracted}/${message.total})`);
            updateExtractionProgressInModal(message.extracted, message.total, message.percent);
        } else if (message.command === "modelFabricationResultDownloadSuccess") {
            console.log("[Webview] Received modelFabricationResultDownloadSuccess event.");
            const detailsModal = document.getElementById('detailsModal');
            if (detailsModal && detailsModal.style.display === 'flex') {
                console.log("[Webview] Details modal is visible. Executing downloadComplete().");
                downloadComplete(); // This function now handles all modal UI updates for success.
            } else {
                console.log("[Webview] Details modal is not visible or not found. Cannot run downloadComplete().");
            }
            hideSpinner(); // Hide any global spinner.
        } else if (message.command === "modelFabricationResultDownloadError") {
            console.log("[Webview] Download error:", message.error);
            // Update modal UI for download error if visible
            const detailsModal = document.getElementById('detailsModal');
            if (detailsModal && detailsModal.style.display === 'flex') {
                downloadError(message.error);
            }
            updateButtonAfterError();
            hideSpinner();
        } else if (message.command === 'modelFabricationResultDownloadStarted') {
            console.log("[Webview] Received download started event");
            
            // If we're in details modal, show progress there
            const detailsModal = document.getElementById('detailsModal');
            if (detailsModal && detailsModal.style.display === 'flex') {
                showDownloadProgressInModal();
            }
        } else if (message.command === 'modelFabricationDownloadProgress') {
            const percent = message.percent || 0;
            console.log(`[Webview] Received download progress update: ${percent}%`);
            
            // If we're in details modal, update progress there
            const detailsModal = document.getElementById('detailsModal');
            if (detailsModal && detailsModal.style.display === 'flex') {
                updateModalDownloadProgress(percent);
            }
        } else if (message.command === 'modelFabricationExtractionStarted') {
            console.log(`[Webview] Received extraction started event, files: ${message.fileCount}`);
            
            // If we're in details modal, show extraction progress there
            const detailsModal = document.getElementById('detailsModal');
            if (detailsModal && detailsModal.style.display === 'flex') {
                showExtractionProgressInModal(message.fileCount);
            }
        } else if (message.command === 'modelFabricationExtractionProgress') {
            console.log(`[Webview] Received extraction progress: ${message.percent}% (${message.extracted}/${message.total})`);
            
            // If we're in details modal, update extraction progress there
            const detailsModal = document.getElementById('detailsModal');
            if (detailsModal && detailsModal.style.display === 'flex') {
                updateExtractionProgressInModal(message.extracted, message.total, message.percent);
            }
        } else if (message.command === "modelFabricationReportExistsResult") {
            console.log("[Webview] Report exists locally:", message.exists, "for request code:", message.requestCode);
            const reportButton = document.querySelector("#detailsModal .action-container .download-button:not(#downloadResultsButton)");
            if (reportButton) {
                reportButton.disabled = false;
                // Update button text and action based on whether report exists locally
                if (message.exists) {
                    reportButton.textContent = 'View Report';
                    reportButton.onclick = function() {
                        vscode.postMessage({
                            command: 'modelFabricationViewReport',
                            requestCode: currentRequestData.modelFabricationRequestCode
                        });
                    };
                } else {
                    reportButton.textContent = 'Download Report';
                    reportButton.onclick = function() {
                        downloadErrorReport(currentRequestData.modelFabricationRequestCode);
                    };
                }
            }
        } else if (message.command === "modelFabricationReportDownloadStarted") {
            console.log("[Webview] Report download started");
            // Update the download button to show progress
            const reportButton = document.querySelector("#detailsModal .action-container .download-button:not(#downloadResultsButton)");
            if (reportButton) {
                reportButton.disabled = true;
                reportButton.innerHTML = '<span class="spinner"></span> Downloading...';
            }
        } else if (message.command === "modelFabricationReportDownloadSuccess") {
            console.log("[Webview] Report downloaded successfully");
            // Update the download button to show success
            const reportButton = document.querySelector("#detailsModal .action-container .download-button:not(#downloadResultsButton)");
            if (reportButton) {
                reportButton.disabled = false;
                reportButton.textContent = 'View Report';
                // Change the button action to view the report instead of downloading it
                reportButton.onclick = function() {
                    vscode.postMessage({
                        command: 'modelFabricationViewReport',
                        requestCode: currentRequestData.modelFabricationRequestCode
                    });
                };
            }
        } else if (message.command === "modelFabricationReportDownloadError") {
            console.log("[Webview] Report download error:", message.error);
            // Update the download button to allow retry
            const reportButton = document.querySelector("#detailsModal .action-container .download-button:not(#downloadResultsButton)");
            if (reportButton) {
                reportButton.disabled = false;
                reportButton.textContent = 'Download Report';
            }
        }
    });

    function initializeUI() {
        // Create main container structure
        document.body.innerHTML = `
            <link rel="stylesheet" href="https://unpkg.com/@vscode/codicons@latest/dist/codicon.css" />
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-editor-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 15px;
                    margin: 0;
                }
                
                .fabrication-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    box-sizing: border-box;
                }
                
                .fabrication-header {
                    padding: 10px 0;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    margin-bottom: 15px;
                }
                  .fabrication-header h2 {
                    margin: 0;
                    font-size: 1.3em;
                    font-weight: normal;
                    color: var(--vscode-editor-foreground);
                }
                
                .intro-text {
                    color: var(--vscode-descriptionForeground);
                    margin-top: 8px;
                    margin-bottom: 16px;
                    font-size: 0.9em;
                    line-height: 1.4;
                }

                /* Added toolbar styles for refresh button */
                .toolbar {
                    display: flex;
                    justify-content: flex-end;
                    margin-bottom: 10px;
                }
                .refresh-button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 4px 8px;
                    cursor: pointer;
                    border-radius: 3px;
                    display: flex;
                    align-items: center;
                }
                .refresh-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .refresh-only-button {
                    background: transparent;
                    color: var(--vscode-editor-foreground);
                    border: none;
                    padding: 4px 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .refresh-only-button:hover {
                    background-color: var(--vscode-toolbar-hoverBackground);
                }                .add-button {
                    margin-right: 8px;
                }
                #autoRefreshIndicator {
                    margin-right: auto;
                }
                /* Modal styles */
                .modal {
                    position: fixed;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    background: rgba(0,0,0,0.4);
                    display: none;
                    align-items: center; justify-content: center;
                    z-index: 1000;
                }
                .modal-content {
                    position: relative;
                    background: var(--vscode-editor-background);
                    padding: 20px;
                    border-radius: 4px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    width: 500px;
                    max-width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                .modal-content h3 {
                    margin-top: 0;
                    margin-bottom: 15px;
                    font-size: 1.2em;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 8px;
                }
                .modal-content label {
                    display: block;
                    margin-bottom: 10px;
                }
                .modal-content input {
                    width: 100%;
                    padding: 4px;
                    /* Ensure input uses VS Code styles */
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
                    box-sizing: border-box; /* Include padding and border in width */
                }
                /* New styles for modal buttons */
                .modal-buttons {
                    display: flex;
                    justify-content: flex-end; /* Right justify buttons */
                    margin-top: 15px; /* Add space above buttons */
                    gap: 8px; /* Space between buttons */
                }
                .modal-button-secondary {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                .modal-button-secondary:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                }
                
                /* Unsaved changes warning styles */
                .unsaved-changes-warning {
                    background-color: var(--vscode-inputValidation-errorBackground, #ff6b6b);
                    // color: var(--vscode-inputValidation-errorForeground, white);
                    padding: 8px 12px;
                    margin-bottom: 15px;
                    border-radius: 3px;
                    border: 1px solid var(--vscode-inputValidation-errorBorder, #ff4757);
                    font-weight: 500;
                    display: none; /* Initially hidden */
                }
                
                .fabrication-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                
                .table-container {
                    overflow: auto;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 3px;
                    background-color: var(--vscode-editor-background);
                }
                
                .fabrication-table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                }
                
                .fabrication-table th {
                    text-align: left;
                    padding: 8px 12px;
                    font-weight: 600;
                    background-color: var(--vscode-editor-lineHighlightBackground);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    position: sticky;
                    top: 0;
                    z-index: 1;
                    cursor: pointer;
                }
                
                .fabrication-table th:hover {
                    background-color: var(--vscode-list-hoverBackground);
                }
                
                .fabrication-table td {
                    padding: 8px 12px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .fabrication-table tr:hover {
                    background-color: var(--vscode-list-hoverBackground);
                }
                
                .fabrication-table a {
                    color: var(--vscode-textLink-foreground);
                    text-decoration: none;
                }
                
                .fabrication-table a:hover {
                    text-decoration: underline;
                }
                
                .footer-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 10px;
                }
                
                .paging-controls {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    justify-content: flex-end;
                }
                
                .paging-controls button {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: none;
                    padding: 4px 10px;
                    cursor: pointer;
                    border-radius: 3px;
                    min-height: 24px;
                }
                
                .paging-controls button:hover:not(:disabled) {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                }
                
                .paging-controls button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                .paging-controls span {
                    color: var(--vscode-descriptionForeground);
                }
                
                .success-badge {
                    background-color: var(--vscode-testing-iconPassed, #89D185);
                    color: var(--vscode-editor-background);
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 0.8em;
                    display: inline-block;
                    text-align: center;
                    font-weight: 500;
                }
                
                .failure-badge {
                    background-color: var(--vscode-testing-iconFailed, #f14c4c);
                    color: var(--vscode-editor-background);
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 0.8em;
                    display: inline-block;
                    text-align: center;
                    font-weight: 500;
                }

                .fabrication-badge {
                    background-color: var(--vscode-button-background, #0E639C); /* Changed from infoBackground */
                    color: var(--vscode-button-foreground, #FFFFFF); /* Ensure text is contrasty */
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 0.8em;
                    display: inline-block;
                    text-align: center;
                    font-weight: 500;
                }

                .view-button {
                    padding: 4px 8px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                    font-family: var(--vscode-font-family);
                }
                
                .view-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                
                .empty-state {
                    text-align: center;
                    padding: 40px 20px;
                    color: var(--vscode-descriptionForeground);
                    font-style: italic;
                    background-color: var(--vscode-editor-background);
                }

                /* Spinner overlay for processing */
                .spinner-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.3);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .spinner {
                    border: 4px solid var(--vscode-editor-widget-background);
                    border-top: 4px solid var(--vscode-button-background);
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    animation: spin 1s linear infinite;
                }                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                #autoRefreshIndicator .fa-sync-alt {
                    animation: spin 4s linear infinite;
                    display: inline-block;
                    margin-right: 5px;
                }
                
                /* Styles for details modal content */
                .detail-item {
                    margin-bottom: 15px;
                    display: flex;
                    align-items: baseline;
                }
                .detail-label {
                    flex: 0 0 120px;
                    font-weight: 600;
                    color: var(--vscode-descriptionForeground);
                }
                .detail-value {
                    flex: 1;
                }
                .error-message {
                    color: var(--vscode-errorForeground, #f14c4c);
                    margin: 20px 0;
                    padding: 10px;
                    border-radius: 3px;
                    background-color: var(--vscode-inputValidation-errorBackground, rgba(241, 76, 76, 0.1));
                    border-left: 3px solid var(--vscode-errorForeground, #f14c4c);
                }
                .error-details .detail-value {
                    color: var(--vscode-errorForeground, #f14c4c);
                }
                .action-container {
                    margin-top: 20px;
                    padding-top: 15px;
                    border-top: 1px solid var(--vscode-panel-border);
                    display: flex;
                    justify-content: flex-end;
                }
                .download-button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 6px 12px;
                    cursor: pointer;
                    border-radius: 3px;
                    font-family: var(--vscode-font-family);
                }
                .download-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .download-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .download-success {
                    background-color: var(--vscode-testing-iconPassed, #89D185);
                }
                .close-button {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    font-size: 16px;
                    color: var(--vscode-editor-foreground);
                    cursor: pointer;
                    opacity: 0.7;
                }
                .close-button:hover {
                    opacity: 1;
                }
            </style>
            <div class="fabrication-container">
                <!-- Spinner overlay -->
                <div id="spinnerOverlay" class="spinner-overlay">
                    <div class="spinner"></div>
                </div>            <div class="fabrication-header">
                    <h2>Model Fabrication Requests</h2>
                    <p class="intro-text">This page displays a list of fabrication requests for generating code based on your model. You can add a new request, view details of completed requests, and download fabrication results.</p>
                </div>
                <div class="toolbar">
                    <button id="addButton" class="refresh-button add-button" title="Add Request">
                        Add
                    </button>
                    <button id="refreshButton" class="refresh-button" title="Refresh Table">
                            <span class="codicon codicon-refresh"></span>
                        Refresh
                    </button>
                </div>
                <div class="fabrication-content">
                    <div class="table-container">
                        <table id="fabricationTable" class="fabrication-table"></table>
                    </div>
                    <div class="footer-controls">
                        <div id="paging" class="paging-controls"></div>
                        <div class="table-info"><span id="record-info"></span></div>
                    </div>
                </div>
                <!-- Add Request Modal -->
                <div id="addModal" class="modal">
                    <div class="modal-content">
                        <h3>Add Model Fabrication Request</h3>
                        <div id="unsavedChangesWarning" class="unsaved-changes-warning">
                            You have unsaved changes in your model. Please save your changes before requesting model services.
                        </div>
                        <label>Description:<br><input type="text" id="addDescription" /></label>                        
                        <div class="modal-buttons"> <!-- Button container -->
                            <button id="submitAdd" class="refresh-button">Add</button>
                            <button id="cancelAdd" class="refresh-button modal-button-secondary">Cancel</button> <!-- Cancel button always on the right -->
                        </div>
                    </div>
                </div>
                <!-- Fabrication Details Modal -->
                <div id="detailsModal" class="modal">
                    <div class="modal-content">
                        <button id="closeDetails" class="close-button">&times;</button>
                        <h3>Model Fabrication Request Details</h3>
                        <div id="detailsContent"></div>
                    </div>
                </div>
            </div>
        `;
          // Initial ready message
        vscode.postMessage({ command: "ModelFabricationWebviewReady" });
        
        // Show spinner when initially loading the view
        showSpinner();
        
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
        
        // Replace add button text with standard VS Code codicon plus icon ONLY (no text)
        var addBtn = document.getElementById("addButton");
        if (addBtn) {
            addBtn.innerHTML = '<span class="codicon codicon-add" style="font-size:16px;"></span>';
            addBtn.title = "Add";
            addBtn.style.background = "none";
            addBtn.style.border = "none";
            addBtn.style.color = "var(--vscode-editor-foreground)";
            addBtn.style.padding = "4px 8px";
            addBtn.style.cursor = "pointer";
            addBtn.style.display = "flex";
            addBtn.style.alignItems = "center";
            addBtn.style.borderRadius = "4px";
            addBtn.style.transition = "background 0.15s";

            // Add hover effect: darker background on hover
            addBtn.addEventListener("mouseenter", function() {
                addBtn.style.background = "var(--vscode-toolbar-hoverBackground, #2a2d2e)";
            });
            addBtn.addEventListener("mouseleave", function() {
                addBtn.style.background = "none";
            });
        }
        
        // Attach refresh button handler
        document.getElementById("refreshButton").onclick = function() {
            showSpinner(); // Show spinner when refresh button is clicked
            requestPage(pageNumber);
        };
        // Attach add button handler
        document.getElementById("addButton").onclick = function() {
            // Fetch projectName and projectVersionNumber from extension
            vscode.postMessage({ command: "modelFabricationGetRootNodeProjectInfo" });
            // Check for unsaved changes
            vscode.postMessage({ command: "modelFabricationCheckUnsavedChanges" });
            document.getElementById("addModal").style.display = "flex";
            document.getElementById("addDescription").focus(); // Focus input on open
        };
        document.getElementById("cancelAdd").onclick = function() {
            document.getElementById("addModal").style.display = "none";
        };
        document.getElementById("submitAdd").onclick = function() {
            console.log("[Webview] Submit Add clicked");
            // Show spinner while sending request
            showSpinner();
            const desc = document.getElementById("addDescription").value;
            vscode.postMessage({ command: "ModelFabricationAddRequest", data: { description: desc } });
            document.getElementById("addModal").style.display = "none";
            document.getElementById("addDescription").value = ''; // Clear input after submit
        };
        
        // Close details modal when X button is clicked
        document.getElementById("closeDetails").onclick = function() {
            document.getElementById("detailsModal").style.display = "none";
        };

        // Add keypress listener for Enter key in description input
        document.getElementById("addDescription").addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault(); // Prevent default Enter behavior (like adding newline)
                document.getElementById("submitAdd").click(); // Trigger submit button click
            }
        });
        
        // Close modal when clicking outside the modal content
        window.onclick = function(event) {
            if (event.target.className === "modal" && event.target.style.display === "flex") {
                event.target.style.display = "none";
            }
        };
    }    function renderTable() {
        console.log(`[Webview] renderTable() called at ${new Date().toISOString()}`);
        const table = document.getElementById("fabricationTable");
        table.innerHTML = "";
        
        // Header
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        columns.forEach(function(col) {
            const th = document.createElement("th");
            th.textContent = col.label;
            th.style.cursor = "pointer";
            th.onclick = function () {
                if (orderByColumn === col.key) {
                    orderByDescending = !orderByDescending;
                } else {
                    orderByColumn = col.key;
                    orderByDescending = false;
                }
                requestPage(1);
            };
            if (orderByColumn === col.key) {
                th.textContent += " ▼";
            }
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Body
        const tbody = document.createElement("tbody");
        if (fabricationData.length === 0) {
            const emptyRow = document.createElement("tr");
            const emptyCell = document.createElement("td");
            emptyCell.colSpan = columns.length;
            emptyCell.className = "empty-state";
            emptyCell.textContent = "No fabrication requests found.";
            emptyRow.appendChild(emptyCell);
            tbody.appendChild(emptyRow);
        } else {
            fabricationData.forEach(function(item) {
                const row = document.createElement("tr");
                columns.forEach(function(col) {
                    const td = document.createElement("td");
                    if (col.key === "status") {
                        let status = "";
                        if (item.modelFabricationRequestIsCanceled) {
                            status = "Cancelled";
                        } else if (!item.modelFabricationRequestIsStarted) {
                            status = "Queued";
                        } else if (item.modelFabricationRequestIsStarted && !item.modelFabricationRequestIsCompleted) {
                            status = "Processing";
                        } else if (item.modelFabricationRequestIsCompleted && !item.modelFabricationRequestIsSuccessful) {
                            status = "Fabrication Error";
                        } else if (item.modelFabricationRequestIsCompleted && item.modelFabricationRequestIsSuccessful) {
                            status = "Success";
                        }
                        // Create badge element based on status
                        const badge = document.createElement("span");
                        if (status === "Processing") {
                            badge.className = "fabrication-badge";
                        } else if (status === "Fabrication Error") {
                            badge.className = "failure-badge";
                        } else if (status === "Success") {
                            badge.className = "success-badge";
                        }
                        badge.textContent = status;
                        td.appendChild(badge);
                    } else {
                        const value = item[col.key];
                        if (col.key === "viewDetails") { // View/action buttons column
                            // Check conditions for showing different buttons
                            const canCancel = !item.modelFabricationRequestIsStarted && !item.modelFabricationRequestIsCanceled;
                            const isCompleted = item.modelFabricationRequestIsCompleted;
                            
                            if (canCancel) {
                                // Show Cancel Request button
                                const button = document.createElement("button");
                                button.className = "view-button"; 
                                button.textContent = "Cancel Request";
                                button.setAttribute("data-request-code", item.modelFabricationRequestCode);
                                button.style.position = "relative";  // Ensure button has its own stacking context
                                button.style.zIndex = "2";  // Higher z-index than the row
                                
                                // Log that we're creating the button for debugging
                                console.log("[Webview] Created Cancel button for request:", item.modelFabricationRequestCode);
                                
                                // Use addEventListener instead of onclick for better control
                                button.addEventListener("click", function(e) {
                                    console.log("[Webview] Cancel button click detected!");
                                    e.preventDefault();
                                    e.stopPropagation(); // Stop event from reaching the row
                                    
                                    const requestCode = this.getAttribute("data-request-code");
                                    console.log("[Webview] Cancel button clicked for request code:", requestCode);
                                    
                                    // Create a VS Code-friendly confirmation modal instead of using browser confirm()
                                    const confirmModal = document.createElement("div");
                                    confirmModal.className = "modal";
                                    confirmModal.style.display = "flex";                                    confirmModal.innerHTML = `
                                        <div class="modal-content" style="width: 300px;">
                                            <h3>Cancel Model Fabrication Request</h3>
                                            <p>Are you sure you want to cancel this model fabrication request?</p>                                            <div class="modal-buttons">
                                                <button id="confirmCancel" class="refresh-button">Yes, Cancel</button>
                                                <button id="cancelCancel" class="refresh-button modal-button-secondary">No</button>
                                            </div>
                                        </div>
                                    `;
                                    
                                    document.body.appendChild(confirmModal);
                                    
                                    // Handle confirmation button
                                    document.getElementById("confirmCancel").addEventListener("click", function() {
                                        console.log("[Webview] User confirmed cancel, sending message to extension");
                                        showSpinner();
                                        document.body.removeChild(confirmModal);
                                        vscode.postMessage({
                                            command: "ModelFabricationCancelRequest",
                                            requestCode: requestCode
                                        });
                                    });
                                    
                                    // Handle cancel button
                                    document.getElementById("cancelCancel").addEventListener("click", function() {
                                        console.log("[Webview] User cancelled the cancel operation");
                                        document.body.removeChild(confirmModal);
                                    });                                });
                                
                                td.appendChild(button);
                            } else if (isCompleted && !item.modelFabricationRequestIsCanceled) {
                                // Show Details button only for completed requests that aren't cancelled
                                const button = document.createElement("button");
                                button.className = "view-button";
                                button.textContent = "Details";
                                button.setAttribute("data-request-code", item.modelFabricationRequestCode);
                                
                                // Use addEventListener instead of onclick for better control
                                button.addEventListener("click", function(e) {
                                    e.preventDefault();
                                    e.stopPropagation(); // Prevent row click handler
                                    
                                    const requestCode = this.getAttribute("data-request-code");
                                    console.log("[Webview] Details button clicked for request code:", requestCode);
                                    
                                    // Show spinner while fetching details
                                    showSpinner();
                                    
                                    // Fetch request details to show in modal
                                    vscode.postMessage({
                                        command: "ModelFabricationFetchRequestDetails",
                                        requestCode: requestCode
                                    });
                                });
                                
                                td.appendChild(button);
                            } else {
                                // For other cases, show no button
                            }
                        } else if (col.key === "modelFabricationRequestRequestedUTCDateTime" && value) {
                            // Format date nicely
                            try {
                                const date = new Date(value);
                                td.textContent = date.toLocaleString();
                            } catch (e) {
                                td.textContent = value || "";
                            }
                        } else {
                            td.textContent = value || "";
                        }
                    }                    row.appendChild(td);
                });
                
                tbody.appendChild(row);
            });
        }
        table.appendChild(tbody);
        
        // Update record info
        const start = fabricationData.length ? (pageNumber - 1) * itemCountPerPage + 1 : 0;
        const end = fabricationData.length ? Math.min(start + fabricationData.length - 1, totalRecords) : 0;
        document.getElementById("record-info").textContent = 
            totalRecords > 1 ? `Showing ${start} to ${end} of ${totalRecords} requests` : "";
    }

    function renderPaging() {
        const paging = document.getElementById("paging");
        paging.innerHTML = "";
        const totalPages = Math.ceil(totalRecords / itemCountPerPage);
        
        // First page button
        const first = document.createElement("button");
        first.textContent = "«";
        first.disabled = pageNumber <= 1;
        first.title = "First Page";
        first.onclick = function () { requestPage(1); };
        paging.appendChild(first);
        
        // Previous button
        const prev = document.createElement("button");
        prev.textContent = "‹";
        prev.disabled = pageNumber <= 1;
        prev.title = "Previous Page";
        prev.onclick = function () { requestPage(pageNumber - 1); };
        paging.appendChild(prev);
        
        // Page info
        const info = document.createElement("span");
        info.textContent = `Page ${pageNumber} of ${totalPages || 1}`;
        paging.appendChild(info);
        
        // Next button
        const next = document.createElement("button");
        next.textContent = "›";
        next.disabled = pageNumber >= totalPages;
        next.title = "Next Page";
        next.onclick = function () { requestPage(pageNumber + 1); };
        paging.appendChild(next);
        
        // Last page button
        const last = document.createElement("button");
        last.textContent = "»";
        last.disabled = pageNumber >= totalPages;
        last.title = "Last Page";
        last.onclick = function () { requestPage(totalPages); };
        paging.appendChild(last);
    }

    /**
     * Shows the details modal with the fabrication request data
     * @param {Object} data The fabrication request details
     */    function showDetailsModal(data) {
        if (!data) {
            console.error("[Webview] No data provided for details modal");
            return;
        }

        // Store current request data for modal operations
        currentRequestData = data;

        const detailsContent = document.getElementById("detailsContent");
        detailsContent.innerHTML = "";

        // Define which fields to display and their labels
        const fieldsToShow = [
            { key: "modelFabricationRequestDescription", label: "Description" },
            { key: "modelFabricationRequestRequestedUTCDateTime", label: "Requested Date\\Time", type: "datetime" },
            { key: "status", label: "Status", className: "status-field" },
            { key: "modelFabricationRequestCode", label: "Request Code" }
        ];

        fieldsToShow.forEach(field => {
            let value = data[field.key];
            let displayValue = "";

            // Special handling for status
            if (field.key === "status") {
                let status = "";
                if (data.modelFabricationRequestIsCanceled) {
                    status = "Cancelled";
                } else if (!data.modelFabricationRequestIsStarted) {
                    status = "Queued";
                } else if (data.modelFabricationRequestIsStarted && !data.modelFabricationRequestIsCompleted) {
                    status = "Processing";
                } else if (data.modelFabricationRequestIsCompleted && !data.modelFabricationRequestIsSuccessful) {
                    status = "Fabrication Error";
                } else if (data.modelFabricationRequestIsCompleted && data.modelFabricationRequestIsSuccessful) {
                    status = "Success";
                }
                value = status;
                displayValue = `<span class="detail-value">${value || "N/A"}</span>`;
            } else {
                // Handle different types
                if (value === null || typeof value === "undefined") {
                    displayValue = '<span class="detail-value">N/A</span>';
                } else if (field.type === "datetime") {
                    try {
                        displayValue = `<span class="detail-value">${new Date(value).toLocaleString()}</span>`;
                    } catch (e) {
                        displayValue = `<span class="detail-value">${value} (Invalid Date)</span>`;
                    }
                } else {
                    // Default: display as text, escaping HTML
                    const textValue = String(value);
                    const escapedValue = textValue
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#039;");
                    displayValue = `<span class="detail-value">${escapedValue || "N/A"}</span>`;
                }
            }

            // Create the detail item
            const itemDiv = document.createElement("div");
            itemDiv.className = "detail-item";
            if (field.className) {
                itemDiv.classList.add(field.className);
            }
            itemDiv.innerHTML = `
                <span class="detail-label">${field.label}:</span>
                ${displayValue}
            `;
            detailsContent.appendChild(itemDiv);
        });

        // Add error information if there were errors
        if (data.modelFabricationRequestIsCompleted && !data.modelFabricationRequestIsSuccessful) {
            const errorDiv = document.createElement("div");
            errorDiv.className = "detail-item error-details";
            errorDiv.innerHTML = `
                <span class="detail-label">Error Details:</span>
                <span class="detail-value error-message">${data.modelFabricationRequestErrorMessage || "No specific error details available."}</span>
            `;
            detailsContent.appendChild(errorDiv);
        }        // Add action buttons container if needed
        if (data.modelFabricationRequestIsCompleted) {
            const actionDiv = document.createElement("div");
            actionDiv.className = "action-container";
            
            // Declare downloadButton outside the if block to make it available in the entire function scope
            let downloadButton = null;
              // Add download results button if request was successful
            if (data.modelFabricationRequestIsSuccessful && data.modelFabricationRequestResultUrl) {
                downloadButton = document.createElement("button");
                downloadButton.className = "download-button";
                downloadButton.id = "downloadResultsButton";
                downloadButton.textContent = "Download Results";
                downloadButton.onclick = function() {
                    // Instead of closing the modal, show downloading status on the button
                    downloadButton.disabled = true;
                    downloadButton.innerHTML = '<span class="spinner"></span> Downloading...';
                    
                    // Add a progress container
                    showDownloadProgressInModal();
                    
                    // Send message to extension to download the results
                    vscode.postMessage({
                        command: "ModelFabricationDownloadResults",
                        url: data.modelFabricationRequestResultUrl,
                        requestCode: data.modelFabricationRequestCode
                    });
                };
                actionDiv.appendChild(downloadButton);
            }
            
            // Add report download button if request failed and report URL is available
            if (!data.modelFabricationRequestIsSuccessful && data.modelFabricationRequestReportUrl) {
                // Add a placeholder button that will be updated after checking if the file exists
                const reportButton = document.createElement("button");
                reportButton.className = "download-button";
                reportButton.textContent = "Checking...";
                reportButton.disabled = true;
                actionDiv.appendChild(reportButton);
                
                // Check if the report file already exists locally
                vscode.postMessage({
                    command: "modelFabricationCheckReportExists",
                    requestCode: data.modelFabricationRequestCode
                });
            }
              // Add close button to action container - inserting before the download button to ensure it appears on the right
            const closeButton = document.createElement("button");
            closeButton.className = "refresh-button modal-button-secondary";
            closeButton.textContent = "Close";
            closeButton.style.marginLeft = "8px";
            closeButton.onclick = function() {
                document.getElementById("detailsModal").style.display = "none";
            };
            
            // Insert close button after download button to place it on the right
            if (downloadButton) {
                actionDiv.insertBefore(closeButton, downloadButton);
                actionDiv.insertBefore(downloadButton, closeButton);
            } else {
                actionDiv.appendChild(closeButton);
            }
            
            detailsContent.appendChild(actionDiv);
            
            // Add a container for the progress indicator
            const progressContainer = document.createElement("div");
            progressContainer.className = "progress-container";
            progressContainer.id = "modal-progress-container";
            detailsContent.appendChild(progressContainer);
        }

        // Display the modal
        document.getElementById("detailsModal").style.display = "flex";
    }
    
    /**
     * Updates the download button after successful download.
     */
    function updateButtonAfterSuccess() {
        const button = document.getElementById("downloadResultsButton");
        if (button) {
            button.disabled = false;
            button.textContent = "Download Results";
            button.className = "download-button download-success";
        }
        
        // Hide progress container
        const progressContainer = document.getElementById("modal-progress-container");
        if (progressContainer) {
            progressContainer.className = "progress-container";
        }
        
        // Show success message
        const successMessage = document.createElement("div");
        successMessage.className = "success-message";
        successMessage.style.cssText = `
            margin: 15px 0;
            padding: 10px;
            background-color: var(--vscode-terminal-ansiGreen, rgba(137, 209, 133, 0.1));
            border-left: 3px solid var(--vscode-testing-iconPassed, #89D185);
            color: var(--vscode-editor-background);
        `;
        successMessage.textContent = "Fabrication results have been downloaded and extracted successfully.";
        
        const actionContainer = document.querySelector(".action-container");
        if (actionContainer) {
            actionContainer.after(successMessage);
        }
    }
    
    /**
     * Updates the download button after a failed download.
     */
    function updateButtonAfterError() {
        const button = document.getElementById("downloadResultsButton");
        if (button) {
            button.disabled = false;
            button.textContent = "Retry Download";
        }
        
        // Hide progress container
        const progressContainer = document.getElementById("modal-progress-container");
        if (progressContainer) {
            progressContainer.className = "progress-container";
        }
    }

    /**
     * Downloads the fabrication error report.
     * @param {string} requestCode - The fabrication request code.
     */
    function downloadErrorReport(requestCode) {
        vscode.postMessage({
            command: 'modelFabricationDownloadReport',
            requestCode: requestCode,
            url: currentRequestData.modelFabricationRequestReportUrl
        });
    }    function requestPage(page) {
        vscode.postMessage({
            command: "ModelFabricationRequestPage",
            pageNumber: page,
            itemCountPerPage: itemCountPerPage,
            orderByColumnName: orderByColumn,
            orderByDescending: orderByDescending
        });
    }

    /**
     * Checks if there are any processing or queued items and sets up auto-refresh accordingly.
     * This function examines the current data to determine if auto-refresh should be active.
     * If any items are in a processing or queued state, it will:
     *   1. Set up an interval to automatically refresh the page every minute
     *   2. Display a visual indicator showing that auto-refresh is active
     * If no items are processing/queued, it will clear any existing auto-refresh timer.
     */
    function checkAndSetAutoRefresh() {
        console.log("[Webview] Checking if auto-refresh should be active...");
        
        // Clear any existing timer
        if (autoRefreshTimer) {
            console.log("[Webview] Clearing existing auto-refresh timer");
            clearInterval(autoRefreshTimer);
            autoRefreshTimer = null;
        }
        
        // Check if there are any processing or queued items
        let hasProcessingOrQueuedItems = fabricationData.some(isProcessingOrQueued);
        
        // Update auto-refresh indicator
        updateAutoRefreshIndicator(hasProcessingOrQueuedItems);
        
        // If we have processing/queued items, set up auto-refresh timer
        if (hasProcessingOrQueuedItems) {
            console.log("[Webview] Processing or queued items found, setting up auto-refresh timer");
            autoRefreshTimer = setInterval(() => {
                console.log("[Webview] Auto-refreshing page due to processing/queued items");
                requestPage(pageNumber);
            }, AUTO_REFRESH_INTERVAL);
        }
    }
    
    /**
     * Determines if an item is in a processing or queued state.
     * @param {Object} item - The fabrication request item to check.
     * @returns {boolean} True if the item is processing or queued, false otherwise.
     */
    function isProcessingOrQueued(item) {
        // Check if the item is cancelled first - cancelled items should not trigger auto-refresh
        if (item.modelFabricationRequestIsCanceled) {
            return false;
        }
        
        // Check if queued (not started yet)
        if (!item.modelFabricationRequestIsStarted) {
            return true;
        }
        
        // Check if processing (started but not completed)
        if (item.modelFabricationRequestIsStarted && !item.modelFabricationRequestIsCompleted) {
            return true;
        }
        
        // All other states (completed successful, completed with error) don't need auto-refresh
        return false;
    }

    /**
     * Updates the auto-refresh indicator in the UI.
     * Creates or updates a visual indicator to show users when auto-refresh is active,
     * which helps them understand that the page is automatically updating.
     * The indicator includes an animated spinning icon when active.
     * 
     * @param {boolean} isActive - Whether auto-refresh is active.
     */
    function updateAutoRefreshIndicator(isActive) {
        // Find or create the indicator element
        let indicator = document.getElementById("autoRefreshIndicator");
        
        if (!indicator) {
            indicator = document.createElement("div");
            indicator.id = "autoRefreshIndicator";
            indicator.style.fontSize = "0.8em";
            indicator.style.color = "var(--vscode-descriptionForeground)";
            indicator.style.marginRight = "10px";
            
            // Insert before the refresh button
            const toolbar = document.querySelector(".toolbar");
            if (toolbar) {
                toolbar.insertBefore(indicator, toolbar.firstChild);
            }
        }
        
        // Update indicator text based on active state
        if (isActive) {
            indicator.innerHTML = "<i class='fa fa-sync-alt'></i> Auto-refreshing every minute";
            indicator.style.display = "block";
        } else {
            indicator.style.display = "none";
        }
    }
})();
// filepath: c:\VR\Source\DP\vscode-extension\src\webviews\fabricationRequestDetailsView.ts
// src/webviews/fabricationRequestDetailsView.ts
// Functions for showing the model fabrication request details in a webview
// Last modified: May 8, 2025

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import JSZip from 'jszip';

/**
 * Shows the fabrication request details in a webview.
 * @param context The extension context
 * @param requestCode The fabrication request code
 */
export async function showFabricationRequestDetailsView(context: vscode.ExtensionContext, requestCode: string): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
        'fabricationRequestDetails',
        'Fabrication Request Details',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
        }
    );

    // Get path to HTML and JS files
    const htmlPath = vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'fabricationRequestDetailsView.html');
    const scriptPath = vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'fabricationRequestDetailsView.js');
    
    // Convert to webview URIs
    const scriptUri = panel.webview.asWebviewUri(scriptPath);
    
    // Read HTML content
    let htmlContent: string;
    try {
        htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');
    } catch (err) {
        console.error('[Extension] Failed to read HTML file:', err);
        vscode.window.showErrorMessage('Failed to load fabrication request details view');
        return;
    }
    
    // Replace script src with webview URI
    htmlContent = htmlContent.replace('src="fabricationRequestDetailsView.js"', `src="${scriptUri}"`);
    
    // Set HTML content
    panel.webview.html = htmlContent;

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(async (message) => {
        console.log('[Extension] Received message from fabrication details webview:', message.command);
        
        switch (message.command) {
            case 'modelFabricationWebviewReady':
                // Fetch details for the request
                await fetchFabricationDetails(panel, requestCode);
                break;
                
            case 'modelFabricationDownloadResults':
                // Download and unzip fabrication results
                await downloadFabricationResults(panel, message.url, message.requestCode);
                break;
                
            case 'showMessage':
                // Show message to user
                if (message.type === 'error') {
                    vscode.window.showErrorMessage(message.message);
                } else {
                    vscode.window.showInformationMessage(message.message);
                }
                break;
        }
    });
}

/**
 * Fetches fabrication request details from the API and sends them to the webview.
 * @param panel The webview panel
 * @param requestCode The fabrication request code
 */
async function fetchFabricationDetails(panel: vscode.WebviewPanel, requestCode: string): Promise<void> {
    try {
        const authService = require('../services/authService').AuthService.getInstance();
        const apiKey = await authService.getApiKey();
        
        if (!apiKey) {
            console.error("[Extension] No API key found for fetchFabricationDetails");
            panel.webview.postMessage({ 
                command: 'modelFabricationSetError', 
                text: 'You must be logged in to view fabrication details.' 
            });
            return;
        }
        
        // Use query string parameter for the request code instead of path parameter
        const url = `https://modelservicesapi.derivative-programming.com/api/v1_0/fabrication-requests?modelFabricationRequestCode=${encodeURIComponent(requestCode)}`;
        console.log("[Extension] Fetching fabrication details from URL:", url);
        
        const response = await fetch(url, {
            headers: { 'Api-Key': apiKey }
        });
        
        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log("[Extension] Sending details to webview:", responseData);
        
        // Extract the first item from the items array if it exists
        if (responseData.items && Array.isArray(responseData.items) && responseData.items.length > 0) {
            const details = responseData.items[0];
            panel.webview.postMessage({ command: 'modelFabricationSetRequestDetails', data: details });
        } else {
            panel.webview.postMessage({ 
                command: 'modelFabricationSetError', 
                text: 'No details found for this fabrication request.' 
            });
        }
    } catch (error) {
        console.error("[Extension] Failed to fetch fabrication details:", error);
        panel.webview.postMessage({ 
            command: 'modelFabricationSetError', 
            text: `Failed to load details: ${error.message}` 
        });
    }
}

/**
 * Downloads and unzips fabrication results.
 * @param panel The webview panel
 * @param url The download URL
 * @param requestCode The fabrication request code
 */
async function downloadFabricationResults(panel: vscode.WebviewPanel, url: string, requestCode: string): Promise<void> {
    // Notify webview that download has started
    console.log("[Extension] Download started - sending modelFabricationResultDownloadStarted event");
    panel.webview.postMessage({ command: 'modelFabricationResultDownloadStarted' });
    
    try {
        const authService = require('../services/authService').AuthService.getInstance();
        const apiKey = await authService.getApiKey();
        
        if (!apiKey) {
            console.log("[Extension] ERROR: No API key found for download");
            throw new Error('Authentication required');
        }
        
        // Create directory for fabrication results if it doesn't exist
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            console.log("[Extension] ERROR: No workspace folder found");
            throw new Error('No workspace folder found');
        }
        
        const fabricationResultsDir = path.join(workspaceFolder.uri.fsPath, 'fabrication_results');
        console.log("[Extension] Creating directory:", fabricationResultsDir);
        
        // Delete contents of fabrication_results folder if it exists
        if (fs.existsSync(fabricationResultsDir)) {
            console.log("[Extension] Deleting existing contents of fabrication_results directory");
            deleteDirectoryContents(fabricationResultsDir);
        } else {
            // Create the directory if it doesn't exist
            fs.mkdirSync(fabricationResultsDir, { recursive: true });
        }
        
        // Download the fabrication results with progress reporting
        console.log("[Extension] Fetching fabrication results from URL:", url);
        
        const response = await fetch(url, {
            headers: { 'Api-Key': apiKey }
        });
        
        if (!response.ok) {
            console.log(`[Extension] ERROR: Failed to download results: ${response.status} ${response.statusText}`);
            throw new Error(`Failed to download results: ${response.status} ${response.statusText}`);
        }
        
        // Get total size from Content-Length header
        const contentLength = response.headers.get('content-length');
        const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
        console.log(`[Extension] Download started - total size: ${totalSize} bytes`);
        
        // Create a reader from the response body
        const reader = response.body?.getReader();
        if (!reader) {
            console.log("[Extension] ERROR: Failed to create reader from response");
            throw new Error("Failed to create reader from response");
        }
        
        // Create a write stream for the zip file
        const zipPath = path.join(fabricationResultsDir, 'fabrication_results.zip');
        const fileStream = fs.createWriteStream(zipPath);
        
        let receivedBytes = 0;
        let lastProgressUpdate = 0;
        let progressUpdateCount = 0;
        
        // Process the data as it comes in
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                console.log("[Extension] Download read complete");
                break;
            }
            
            // Write chunk to file
            if (value) {
                fileStream.write(Buffer.from(value));
                receivedBytes += value.length;
                
                // Update progress only when there's a significant change (at least 1%)
                if (totalSize > 0) {
                    const percent = Math.round((receivedBytes / totalSize) * 100);
                    if (percent > lastProgressUpdate) {
                        lastProgressUpdate = percent;
                        progressUpdateCount++;
                        console.log(`[Extension] Download progress: ${percent}% (${receivedBytes}/${totalSize} bytes) - sending update #${progressUpdateCount}`);
                        
                        // Send progress update to webview
                        try {
                            panel.webview.postMessage({ 
                                command: 'modelFabricationDownloadProgress',
                                percent: percent
                            });
                        } catch (err) {
                            console.error("[Extension] ERROR sending download progress:", err);
                        }
                    }
                } else {
                    // If we don't know the total size, report based on bytes received
                    console.log(`[Extension] Download progress: ${receivedBytes} bytes received (unknown total size)`);
                }
            }
        }
        
        // Close the file
        fileStream.end();
        console.log("[Extension] Download file stream ended");
        
        // Wait for the file to be fully written
        await new Promise<void>(resolve => {
            fileStream.on('finish', () => {
                console.log("[Extension] File fully written to disk");
                resolve();
            });
        });
        
        // Unzip the file with progress reporting
        console.log("[Extension] Starting unzip operation");
        await unzipFabricationResults(panel, zipPath, fabricationResultsDir);
        
        // Delete the temporary zip file
        fs.unlinkSync(zipPath);
        console.log("[Extension] Temporary zip file deleted");
        
        // Notify webview of success
        console.log("[Extension] Download and extraction complete - sending success notification");
        panel.webview.postMessage({ command: 'modelFabricationResultDownloadSuccess' });
        
        // Show message to user
        vscode.window.showInformationMessage(
            'Fabrication results have been downloaded and extracted to the fabrication_results folder. ' +
            'Create and run a script to copy the desired files from the fabrication_results folder to your project source code folder.'
        );
    } catch (error) {
        console.error("[Extension] Error downloading fabrication results:", error);
        panel.webview.postMessage({ 
            command: 'modelFabricationResultDownloadError', 
            error: error.message
        });
    }
}

/**
 * Unzips the fabrication results file.
 * @param panel The webview panel for progress updates
 * @param zipPath The path to the zip file
 * @param outputDir The directory to extract files to
 */
async function unzipFabricationResults(panel: vscode.WebviewPanel, zipPath: string, outputDir: string): Promise<void> {
    try {
        console.log("[Extension] Unzipping fabrication results");
        
        // Read the zip file
        const zipData = fs.readFileSync(zipPath);
        
        // Load zip data
        const zip = await JSZip.loadAsync(zipData);
        
        // Get the number of files for progress tracking
        const fileCount = Object.keys(zip.files).length;
        console.log("[Extension] Extracting", fileCount, "files");
        
        // Notify the webview that extraction has started
        panel.webview.postMessage({ 
            command: 'modelFabricationExtractionStarted',
            fileCount: fileCount
        });
        
        // Counter for progress tracking
        let extractedCount = 0;
        let lastProgressUpdate = 0;
        
        // Extract each file
        const extractionPromises = [];
        zip.forEach((relativePath, zipEntry) => {
            // Skip directories
            if (zipEntry.dir) {
                extractedCount++;
                // Update progress for directories
                const progressPercent = Math.round((extractedCount / fileCount) * 100);
                if (progressPercent > lastProgressUpdate) {
                    lastProgressUpdate = progressPercent;
                    panel.webview.postMessage({
                        command: 'modelFabricationExtractionProgress',
                        extracted: extractedCount,
                        total: fileCount,
                        percent: progressPercent
                    });
                }
                return;
            }
            
            const extractPromise = zipEntry.async('nodebuffer').then(content => {
                const outputPath = path.join(outputDir, relativePath);
                const outputDir = path.dirname(outputPath);
                
                // Create directory if it doesn't exist
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }
                
                // Write file
                fs.writeFileSync(outputPath, content);
                
                // Update progress
                extractedCount++;
                const progressPercent = Math.round((extractedCount / fileCount) * 100);
                
                // Update progress only when there's a significant change
                if (progressPercent > lastProgressUpdate) {
                    lastProgressUpdate = progressPercent;
                    panel.webview.postMessage({
                        command: 'modelFabricationExtractionProgress',
                        extracted: extractedCount,
                        total: fileCount,
                        percent: progressPercent
                    });
                }
            });
            
            extractionPromises.push(extractPromise);
        });
        
        // Wait for all files to be extracted
        await Promise.all(extractionPromises);
        console.log("[Extension] Extraction complete");
    } catch (error) {
        console.error("[Extension] Error unzipping fabrication results:", error);
        throw error;
    }
}

/**
 * Deletes all files and subdirectories in a directory without removing the directory itself.
 * @param dirPath The path to the directory to clean
 */
function deleteDirectoryContents(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        return;
    }
    
    const entries = fs.readdirSync(dirPath);
    
    for (const entry of entries) {
        const entryPath = path.join(dirPath, entry);
        if (fs.lstatSync(entryPath).isDirectory()) {
            deleteDirectoryContents(entryPath);
            fs.rmdirSync(entryPath);
        } else {
            fs.unlinkSync(entryPath);
        }
    }
}
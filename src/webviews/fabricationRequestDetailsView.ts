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
    panel.webview.postMessage({ command: 'modelFabricationResultDownloadStarted' });
    
    try {
        const authService = require('../services/authService').AuthService.getInstance();
        const apiKey = await authService.getApiKey();
        
        if (!apiKey) {
            throw new Error('Authentication required');
        }
        
        // Create directory for fabrication results if it doesn't exist
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
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
        
        // Download the fabrication results
        console.log("[Extension] Downloading fabrication results from URL:", url);
        const response = await fetch(url, {
            headers: { 'Api-Key': apiKey }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to download results: ${response.status} ${response.statusText}`);
        }
        
        // Get the response as an array buffer
        const zipData = await response.arrayBuffer();
        
        // Save zip file temporarily
        const zipPath = path.join(fabricationResultsDir, 'fabrication_results.zip');
        fs.writeFileSync(zipPath, Buffer.from(zipData));
        
        // Unzip the file
        await unzipFabricationResults(panel, zipPath, fabricationResultsDir);
        
        // Delete the temporary zip file
        fs.unlinkSync(zipPath);
        
        // Notify webview of success
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
        
        // Counter for progress tracking
        let extractedCount = 0;
        
        // Extract each file
        const extractionPromises = [];
        zip.forEach((relativePath, zipEntry) => {
            // Skip directories
            if (zipEntry.dir) {
                extractedCount++;
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
                console.log(`[Extension] Extracted ${extractedCount}/${fileCount} (${progressPercent}%)`);
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
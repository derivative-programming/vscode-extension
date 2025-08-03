// userStoryRoleRequirementsView.js
// Shows the user story role requirements management view
// August 3, 2025

"use strict";

// Import VS Code module
const vscode = require('vscode');

// Track active panels to avoid duplicates
const activePanels = new Map();

// Track panel references for the single user story role requirements view
const userStoryRoleRequirementsPanel = {
    panel: null,
    context: null,
    modelService: null
};

/**
 * Gets the reference to the user story role requirements view panel if it's open
 * @returns {Object|null} The user story role requirements view panel info or null if not open
 */
function getUserStoryRoleRequirementsPanel() {
    if (activePanels.has('userStoryRoleRequirementsView')) {
        return {
            type: 'userStoryRoleRequirementsView',
            context: userStoryRoleRequirementsPanel.context,
            modelService: userStoryRoleRequirementsPanel.modelService
        };
    }
    return null;
}

/**
 * Closes the user story role requirements panel if it's open
 */
function closeUserStoryRoleRequirementsPanel() {
    console.log(`Closing user story role requirements panel if open`);
    const panel = activePanels.get('userStoryRoleRequirementsView');
    if (panel && !panel._disposed) {
        panel.dispose();
        activePanels.delete('userStoryRoleRequirementsView');
    }
    // Clean up userStoryRoleRequirementsPanel reference
    userStoryRoleRequirementsPanel.panel = null;
}

/**
 * Shows a user story role requirements view in a webview
 * @param {Object} context The extension context
 * @param {Object} modelService The model service instance
 */
function showUserStoryRoleRequirementsView(context, modelService) {
    if (!modelService || !modelService.isFileLoaded()) {
        // Use VS Code API from the imported context, not from a global vscode variable
        vscode.window.showErrorMessage("No project is currently loaded.");
        return;
    }

    // Create a consistent panel ID
    const panelId = 'userStoryRoleRequirementsView';
    console.log(`showUserStoryRoleRequirementsView called (panelId: ${panelId})`);
    
    // Store reference to context and modelService
    userStoryRoleRequirementsPanel.context = context;
    userStoryRoleRequirementsPanel.modelService = modelService;
    
    // Check if panel already exists
    if (activePanels.has(panelId)) {
        console.log(`Panel already exists for user story role requirements view, revealing existing panel`);
        // Panel exists, reveal it instead of creating a new one
        activePanels.get(panelId).reveal(vscode.ViewColumn.One);
        return;
    }
    
    // Create the webview panel
    const panel = vscode.window.createWebviewPanel(
        'userStoryRoleRequirementsView',
        'User Story - Role Requirements',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );
    
    // Track this panel
    console.log(`Adding new panel to activePanels with id: ${panelId}`);
    activePanels.set(panelId, panel);
    userStoryRoleRequirementsPanel.panel = panel;
    
    // Remove from tracking when disposed
    panel.onDidDispose(() => {
        console.log(`Panel disposed, removing from tracking: ${panelId}`);
        activePanels.delete(panelId);
        userStoryRoleRequirementsPanel.panel = null;
    });

    // Set up message handling
    panel.webview.onDidReceiveMessage(
        message => {
            handleMessage(message, panel, modelService);
        }
    );

    // Get webview content
    panel.webview.html = getWebviewContent(context, modelService);
}

/**
 * Handles messages from the webview
 * @param {Object} message Message from webview
 * @param {Object} panel Webview panel
 * @param {Object} modelService Model service instance
 */
function handleMessage(message, panel, modelService) {
    try {
        console.log(`Received message: ${message.command}`);
        
        switch (message.command) {
            case 'refresh':
                // Refresh the webview content
                panel.webview.html = getWebviewContent(userStoryRoleRequirementsPanel.context, modelService);
                break;
            
            case 'error':
                vscode.window.showErrorMessage(message.text || 'An error occurred');
                break;
                
            case 'info':
                vscode.window.showInformationMessage(message.text || 'Information');
                break;
                
            default:
                console.log(`Unknown command: ${message.command}`);
                break;
        }
    } catch (error) {
        console.error('Error handling message:', error);
        vscode.window.showErrorMessage(`Error handling message: ${error.message}`);
    }
}

/**
 * Builds the HTML content for the role requirements webview
 * @param {Object} context Extension context
 * @param {Object} modelService Model service instance
 * @returns {string} HTML content
 */
function getWebviewContent(context, modelService) {
    try {
        // Get all data objects from the model
        const allObjects = modelService.getAllObjects();
        
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>User Story - Role Requirements</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        margin: 0;
                        padding: 20px;
                    }
                    .container {
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    h1 {
                        color: var(--vscode-titleBar-activeForeground);
                        margin-bottom: 20px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                        padding-bottom: 10px;
                    }
                    .section {
                        margin-bottom: 30px;
                        padding: 20px;
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 4px;
                    }
                    .section h2 {
                        margin-top: 0;
                        color: var(--vscode-textLink-foreground);
                    }
                    .info-text {
                        margin-bottom: 20px;
                        color: var(--vscode-descriptionForeground);
                        line-height: 1.5;
                    }
                    .object-list {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 15px;
                        margin-top: 15px;
                    }
                    .object-item {
                        padding: 10px;
                        background-color: var(--vscode-input-background);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 3px;
                    }
                    .object-name {
                        font-weight: bold;
                        color: var(--vscode-textLink-foreground);
                        margin-bottom: 5px;
                    }
                    .property-count {
                        font-size: 0.9em;
                        color: var(--vscode-descriptionForeground);
                    }
                    .coming-soon {
                        text-align: center;
                        padding: 40px;
                        color: var(--vscode-descriptionForeground);
                        font-style: italic;
                        background-color: var(--vscode-textBlockQuote-background);
                        border-left: 4px solid var(--vscode-textBlockQuote-border);
                        margin: 20px 0;
                    }
                    .refresh-btn {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 16px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-family: var(--vscode-font-family);
                    }
                    .refresh-btn:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>User Story - Role Requirements</h1>
                    
                    <div class="section">
                        <h2>Overview</h2>
                        <div class="info-text">
                            This view will allow you to manage role requirements and permissions for data objects and their properties.
                            You'll be able to specify which roles can view all, view, add, update, and/or delete data objects down to the property level.
                        </div>
                    </div>

                    <div class="section">
                        <h2>Data Objects (${allObjects.length})</h2>
                        <div class="info-text">
                            The following data objects are available in your model:
                        </div>
                        <div class="object-list">
                            ${allObjects.map(obj => `
                                <div class="object-item">
                                    <div class="object-name">${obj.name || 'Unnamed Object'}</div>
                                    <div class="property-count">
                                        ${obj.properties ? obj.properties.length : 0} properties
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="coming-soon">
                        <h3>🚧 Coming Soon</h3>
                        <p>The full role requirements management interface is under development.</p>
                        <p>This will include:</p>
                        <ul style="text-align: left; display: inline-block;">
                            <li>Role selection dropdown</li>
                            <li>Object and property-level permissions grid</li>
                            <li>Bulk permission assignment tools</li>
                            <li>User story generation from requirements</li>
                            <li>Validation against existing user stories</li>
                        </ul>
                        <button class="refresh-btn" onclick="vscode.postMessage({command: 'refresh'})">
                            Refresh View
                        </button>
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    
                    // Log that the view is loaded
                    console.log('Role Requirements view loaded');
                </script>
            </body>
            </html>
        `;
    } catch (error) {
        console.error('Error generating webview content:', error);
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>User Story - Role Requirements - Error</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        padding: 20px;
                    }
                    .error {
                        color: var(--vscode-errorForeground);
                        background-color: var(--vscode-inputValidation-errorBackground);
                        border: 1px solid var(--vscode-inputValidation-errorBorder);
                        padding: 20px;
                        border-radius: 4px;
                    }
                </style>
            </head>
            <body>
                <h1>User Story - Role Requirements</h1>
                <div class="error">
                    <h2>Error Loading View</h2>
                    <p>An error occurred while loading the role requirements view:</p>
                    <pre>${error.message}</pre>
                </div>
            </body>
            </html>
        `;
    }
}

// Export functions for use by other modules
module.exports = {
    showUserStoryRoleRequirementsView,
    getUserStoryRoleRequirementsPanel,
    closeUserStoryRoleRequirementsPanel
};

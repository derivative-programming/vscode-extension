// lexiconView.js
// Shows the lexicon items in a table view
// May 9, 2025

"use strict";

// Import VS Code module
const vscode = require('vscode');

// Do NOT try to acquire VS Code API here at module scope
// acquireVsCodeApi() will be available only in the webview context

// Store lexicon items so we can modify them
// These arrays are just for reference, the actual data comes from the model
let lexiconItems = [];
let originalLexiconItems = [];

// Track active panels to avoid duplicates
const activePanels = new Map();

// Track panel references for the single lexicon view
const lexiconPanel = {
    panel: null,
    context: null,
    modelService: null
};

/**
 * Gets the reference to the lexicon view panel if it's open
 * @returns {Object|null} The lexicon view panel info or null if not open
 */
function getLexiconPanel() {
    if (activePanels.has('lexiconView')) {
        return {
            type: 'lexiconView',
            context: lexiconPanel.context,
            modelService: lexiconPanel.modelService
        };
    }
    return null;
}

/**
 * Closes the lexicon panel if it's open
 */
function closeLexiconPanel() {
    console.log(`Closing lexicon panel if open`);
    const panel = activePanels.get('lexiconView');
    if (panel && !panel._disposed) {
        panel.dispose();
        activePanels.delete('lexiconView');
    }
    // Clean up lexiconPanel reference
    lexiconPanel.panel = null;
}

/**
 * Shows a lexicon view in a webview
 * @param {Object} context The extension context
 * @param {Object} modelService The model service instance
 */
function showLexiconView(context, modelService) {
    if (!modelService || !modelService.isFileLoaded()) {
        // Use VS Code API from the imported context, not from a global vscode variable
        vscode.window.showErrorMessage("No project is currently loaded.");
        return;
    }    // Create a consistent panel ID
    const panelId = 'lexiconView';
    console.log(`showLexiconView called (panelId: ${panelId})`);
    
    // Store reference to context and modelService
    lexiconPanel.context = context;
    lexiconPanel.modelService = modelService;
    
    // Check if panel already exists
    if (activePanels.has(panelId)) {
        console.log(`Panel already exists for lexicon view, revealing existing panel`);
        // Panel exists, reveal it instead of creating a new one
        activePanels.get(panelId).reveal(vscode.ViewColumn.One);
        return;
    }
    
    // Create the webview panel
    const panel = vscode.window.createWebviewPanel(
        'lexiconView',
        'Lexicon',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );
    
    // Track this panel
    console.log(`Adding new panel to activePanels with id: ${panelId}`);
    activePanels.set(panelId, panel);
    lexiconPanel.panel = panel;
    
    // Remove from tracking when disposed
    panel.onDidDispose(() => {
        console.log(`Panel disposed, removing from tracking: ${panelId}`);
        activePanels.delete(panelId);
        lexiconPanel.panel = null;
    });

    // Get the model data
    const rootModel = modelService.getCurrentModel();
    if (!rootModel) {
        vscode.window.showErrorMessage("Failed to get model data. Check if the model file is loaded correctly.");
        return;
    }

    // Ensure rootModel.namespace exists and is an array
    if (!rootModel.namespace || !Array.isArray(rootModel.namespace) || rootModel.namespace.length === 0) {
        panel.webview.html = createHtmlContent([], "No namespaces found in the model.");
        return;
    }

    // Get lexicon items from the first namespace
    const firstNamespace = rootModel.namespace[0];
    const lexiconItems = (firstNamespace.lexicon || []).map(item => ({
        name: item.name || "",
        internalTextValue: item.internalTextValue || "",
        displayTextValue: item.displayTextValue || ""
    }));

    // Set the webview HTML content
    panel.webview.html = createHtmlContent(lexiconItems);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
            case 'updateLexiconItem':
                try {
                    // Get the current model data
                    const currentModel = modelService.getCurrentModel();
                    if (!currentModel || !currentModel.namespace || !Array.isArray(currentModel.namespace) || currentModel.namespace.length === 0) {
                        throw new Error("Model structure is invalid or namespace not found");
                    }

                    // Get the first namespace
                    const namespace = currentModel.namespace[0];
                    if (!namespace.lexicon || !Array.isArray(namespace.lexicon)) {
                        namespace.lexicon = [];
                    }                    // Find and update the lexicon item
                    const { index, displayTextValue } = message.data;
                    if (index >= 0 && index < namespace.lexicon.length) {
                        namespace.lexicon[index].displayTextValue = displayTextValue;

                        // Send updated item back to the webview
                        panel.webview.postMessage({
                            command: 'itemUpdated',
                            data: {
                                index,
                                item: namespace.lexicon[index]
                            }
                        });
                        
                        // Mark that there are unsaved changes
                        modelService.markUnsavedChanges();
                        
                        // Update the model in memory but don't save to disk
                        // The user will need to use the save button in the treeview to persist changes
                        console.log(`Updated lexicon item ${index} to: ${displayTextValue} (in memory only, not saved to file)`);
                    } else {
                        throw new Error(`Lexicon item with index ${index} not found`);
                    }                } catch (error) {                    console.error('Error updating lexicon item:', error);
                    // Use the imported vscode module directly
                    vscode.window.showErrorMessage(`Failed to update lexicon item: ${error.message}`);
                }
                break;
                
            case 'searchLexicon':
                panel.webview.postMessage({
                    command: 'filterItems',
                    data: {
                        searchText: message.data.searchText
                    }
                });
                break;
        }
    });
}

/**
 * Creates the HTML content for the lexicon view
 * @param {Array} lexiconItems Array of lexicon items
 * @param {String} errorMessage Optional error message
 * @returns {String} HTML content
 */
function createHtmlContent(lexiconItems, errorMessage = null) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Lexicon</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    padding: 20px;
                    background-color: var(--vscode-editor-background);
                }
                
                h1 {
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: var(--vscode-editor-foreground);
                }
                
                .header-container {
                    margin-bottom: 20px;
                }
                
                .subtitle {
                    margin: 0 0 10px 0;
                    color: var(--vscode-descriptionForeground);
                }
                
                hr {
                    border: 0;
                    height: 1px;
                    background-color: var(--vscode-panel-border);
                    margin: 0 0 20px 0;
                }
                
                .container {
                    margin-bottom: 20px;
                }
                
                .search-container {
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                }
                
                input[type="text"] {
                    padding: 8px;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 2px;
                    width: 300px;
                }
                
                .search-label {
                    margin-right: 10px;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                
                th {
                    padding: 10px;
                    text-align: left;
                    background-color: var(--vscode-editor-lineHighlightBackground);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    color: var(--vscode-editor-foreground);
                    cursor: pointer;
                }
                
                th:hover {
                    background-color: var(--vscode-list-hoverBackground);
                }
                
                td {
                    padding: 8px 10px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                
                tr:hover {
                    background-color: var(--vscode-list-hoverBackground);
                }
                
                input[type="text"].display-text {
                    width: 100%;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    padding: 4px 6px;
                    border-radius: 2px;
                }
                
                button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 2px;
                    cursor: pointer;
                    margin-right: 10px;
                }
                
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                
                .error-message {
                    color: var(--vscode-errorForeground);
                    padding: 10px;
                    margin: 10px 0;
                    background-color: var(--vscode-inputValidation-errorBackground);
                    border: 1px solid var(--vscode-inputValidation-errorBorder);
                    border-radius: 2px;
                }
                
                .table-container {
                    max-height: 70vh;
                    overflow-y: auto;
                    border: 1px solid var(--vscode-panel-border);
                }
            </style>
        </head>
        <body>
            <div class="header-container">
                <h1>Lexicon</h1>
                <p class="subtitle">Edit display values for model lexicon items to customize terminology.</p>
                <hr>
            </div>
            
            ${errorMessage ? `<div class="error-message">${errorMessage}</div>` : ''}
            
            <div class="container">
                <div class="search-container">
                    <span class="search-label">Search:</span>
                    <input type="text" id="searchInput" placeholder="Filter lexicon items...">
                </div>
                
                <div class="table-container">
                    <table id="lexiconTable">
                        <thead>
                            <tr>
                                <th data-sort="internalTextValue">Property</th>
                                <th data-sort="displayTextValue">Display Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${lexiconItems.map((item, index) => `
                                <tr data-index="${index}">
                                    <td>${item.internalTextValue || ''}</td>
                                    <td>
                                        <input 
                                            type="text" 
                                            class="display-text" 
                                            value="${item.displayTextValue || ''}" 
                                            data-index="${index}"
                                            data-original="${item.displayTextValue || ''}"
                                        >
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
              <!-- No controls needed as changes are saved automatically -->
              <script>
                (function() {
                    // Acquire VS Code API here inside the webview script
                    const vscode = acquireVsCodeApi();
                    
                    // Store lexicon items
                    const lexiconItems = ${JSON.stringify(lexiconItems)};
                      // Get elements
                    const table = document.getElementById('lexiconTable');
                    const searchInput = document.getElementById('searchInput');
                    const displayTextInputs = document.querySelectorAll('.display-text');
                      // Add event listener for all display text inputs
                    displayTextInputs.forEach(input => {
                        const originalValue = input.dataset.original;
                          input.addEventListener('change', event => {
                            const index = parseInt(event.target.dataset.index);
                            const newValue = event.target.value;
                            
                            // Check if value has changed
                            if (originalValue !== newValue) {
                                // Update the model in memory immediately but don't save to file
                                vscode.postMessage({
                                    command: 'updateLexiconItem',
                                    data: {
                                        index: index,
                                        displayTextValue: newValue
                                    }
                                });
                                
                                // Do NOT save changes automatically - rely on the save button in the treeview
                            }
                        });
                    });
                    
                    // Table sorting functionality
                    document.querySelectorAll('th[data-sort]').forEach(headerCell => {
                        headerCell.addEventListener('click', () => {
                            const sortKey = headerCell.dataset.sort;
                            const tbody = table.querySelector('tbody');
                            const rows = Array.from(tbody.querySelectorAll('tr'));
                            
                            // Current sort direction
                            const currentDirection = headerCell.dataset.direction === 'asc' ? 'desc' : 'asc';
                            headerCell.dataset.direction = currentDirection;
                            
                            // Clear all other headers
                            document.querySelectorAll('th').forEach(th => {
                                if (th !== headerCell) {
                                    delete th.dataset.direction;
                                }
                            });
                            
                            // Sort rows
                            rows.sort((a, b) => {
                                let aValue, bValue;
                                
                                if (sortKey === 'internalTextValue') {
                                    aValue = a.cells[0].textContent.toLowerCase();
                                    bValue = b.cells[0].textContent.toLowerCase();
                                } else {
                                    aValue = a.cells[1].querySelector('input').value.toLowerCase();
                                    bValue = b.cells[1].querySelector('input').value.toLowerCase();
                                }
                                
                                return currentDirection === 'asc' 
                                    ? aValue.localeCompare(bValue)
                                    : bValue.localeCompare(aValue);
                            });
                            
                            // Re-append rows in sorted order
                            rows.forEach(row => tbody.appendChild(row));
                        });
                    });
                    
                    // Handle search/filter functionality
                    searchInput.addEventListener('input', () => {
                        const searchText = searchInput.value.toLowerCase();
                        vscode.postMessage({
                            command: 'searchLexicon',
                            data: { searchText }
                        });
                        
                        // Filter the table rows
                        const rows = table.querySelectorAll('tbody tr');
                        rows.forEach(row => {
                            const name = row.cells[0].textContent.toLowerCase();
                            const value = row.cells[1].querySelector('input').value.toLowerCase();
                            
                            if (name.includes(searchText) || value.includes(searchText)) {
                                row.style.display = '';
                            } else {
                                row.style.display = 'none';
                            }
                        });
                    });
                    
                    // Handle messages from the extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        
                        switch (message.command) {
                            case 'itemUpdated':
                                // Update the item in our local data
                                const { index, item } = message.data;
                                if (index >= 0 && index < lexiconItems.length) {
                                    lexiconItems[index] = item;
                                }
                                break;
                        }
                    });
                })();
            </script>
        </body>
        </html>
    `;
}

module.exports = {
    showLexiconView,
    getLexiconPanel,
    closeLexiconPanel
};

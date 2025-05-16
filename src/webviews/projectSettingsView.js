// projectSettingsView.js
// Shows the project settings view in a webview panel
// May 9, 2025

"use strict";

// Import VS Code API for use in the extension context
const vscode = require('vscode');
const fs = require('fs');

// Track current panels to avoid duplicates
const activePanels = new Map();

// Cache for schema data
const schemaCache = {}; 

// Define properties to hide in the root settings section
const HIDDEN_ROOT_PROPERTIES = [
    "isBasicAuthenticationIncluded",
    "isDatabaseAuditColumnsCreated",
    "isInternalObjectApiCreated",
    "isValidationMissesLogged",
    "navButton",
    "suppressFillObjLookupTableScripts",
    "suppressUsingDatabaseDeclarationInScripts",
    "templateSet"
];

// Define properties to hide in the namespace settings section
const HIDDEN_NAMESPACE_PROPERTIES = [
    "apiSite",
    "favoriteListContextObjectName",
    "favoriteListDestinationTargetName",
    "isDynaFlowAvailable",
    "isModelFeatureConfigUserDBEditor",
    "isModelFeatureConfigUserDBVeiwer",
    "lexicon",
    "modelFeature",
    "scheduleListContextObjectName",
    "scheduleListDestinationTargetName",
    "userStory"
];

/**
 * Shows a project settings view in a webview
 * @param {Object} context The extension context
 * @param {Object} modelService The model service instance
 */
function showProjectSettings(context, modelService) {
    if (!modelService || !modelService.isFileLoaded()) {
        vscode.window.showErrorMessage("No project is currently loaded.");
        return;
    }

    // Create a normalized panel ID to ensure consistency
    const panelId = `projectSettings`;
    console.log(`showProjectSettings called (panelId: ${panelId})`);
    
    // Check if panel already exists 
    if (activePanels.has(panelId)) {
        console.log(`Panel already exists for project settings, revealing existing panel`);
        // Panel exists, reveal it instead of creating a new one
        activePanels.get(panelId).reveal(vscode.ViewColumn.One);
        return;
    }

    // Create webview panel
    const panel = vscode.window.createWebviewPanel(
        'projectSettings',
        'Project Settings',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );
    
    // Track this panel
    console.log(`Adding new panel to activePanels with id: ${panelId}`);
    activePanels.set(panelId, panel);
    
    // Remove from tracking when disposed
    panel.onDidDispose(() => {
        console.log(`Panel disposed, removing from tracking: ${panelId}`);
        activePanels.delete(panelId);
    });

    // Get the model data - this is a RootModel object
    const rootModel = modelService.getCurrentModel();
    if (!rootModel) {
        vscode.window.showErrorMessage("Failed to get model data. Check if the model file is loaded correctly.");
        return;
    }
    
    // Ensure rootModel.namespace exists and is an array
    if (!rootModel.namespace || !Array.isArray(rootModel.namespace)) {
        console.log("Root model does not have a namespace array. Creating one to avoid errors.");
        rootModel.namespace = [];
    }

    // Get schema path
    let schemaPath;
    try {
        schemaPath = modelService.getSchemaPath();
        if (!schemaPath) {
            throw new Error("Schema path is undefined");
        }
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found: ${schemaPath}`);
        }
        console.log(`Loading schema from: ${schemaPath}`);
    } catch (error) {
        console.error(`Error getting schema path: ${error.message}`);
        vscode.window.showErrorMessage(`Failed to locate schema file: ${error.message}`);
        // Continue without schema - we'll use an empty schema object
        displayWebviewWithoutSchema(panel, context, rootModel);
        return;
    }
    
    // Load the schema for validation and UI generation
    Promise.all([
        vscode.workspace.fs.readFile(vscode.Uri.file(schemaPath))
    ]).then(results => {
        try {
            const schemaContent = new TextDecoder().decode(results[0]);
            const schema = JSON.parse(schemaContent);
            schemaCache.schema = schema; // Cache the schema
            
            // Set the HTML content
            panel.webview.html = getWebviewContent(panel, context, rootModel, schema);
            
            // Handle messages from webview
            panel.webview.onDidReceiveMessage(message => {
                switch (message.command) {
                    case 'webviewReady':
                        // When webview is ready, send the root node and first namespace data
                        refreshWebviewData(panel, rootModel);
                        break;
                        
                    case 'updateSetting':
                        handleUpdateSetting(message.data, rootModel, modelService, panel);
                        break;
                }
            });
        } catch (err) {
            console.error("Error parsing schema:", err);
            vscode.window.showErrorMessage(`Failed to parse schema: ${err.message}`);
            displayWebviewWithoutSchema(panel, context, rootModel);
        }
    }).catch(err => {
        console.error("Error loading schema:", err);
        vscode.window.showErrorMessage(`Failed to load schema: ${err.message}`);
        displayWebviewWithoutSchema(panel, context, rootModel);
    });
}

/**
 * Displays the webview with a minimal schema when schema loading fails
 * @param {Object} panel The webview panel
 * @param {Object} context The extension context
 * @param {Object} rootModel The root model data
 */
function displayWebviewWithoutSchema(panel, context, rootModel) {
    // Create a minimal schema that allows basic editing
    const minimalSchema = {
        properties: {
            root: {
                properties: {
                    // Empty object to avoid errors when accessing properties
                },
                type: "object"
            }
        },
        type: "object"
    };
    
    // Set the webview HTML with minimal schema
    panel.webview.html = getWebviewContent(panel, context, rootModel, minimalSchema);
    
    // Handle messages from webview
    panel.webview.onDidReceiveMessage(message => {
        switch (message.command) {
            case 'webviewReady':
                // When webview is ready, send the root node and first namespace data
                refreshWebviewData(panel, rootModel);
                break;
                
            case 'updateSetting':
                handleUpdateSetting(message.data, rootModel, modelService, panel);
                break;
        }
    });
}

/**
 * Sends updated model data to the webview
 * @param {Object} panel The webview panel
 * @param {Object} rootModel The root model data
 */
function refreshWebviewData(panel, rootModel) {
    // Extract root properties
    const rootData = {
        properties: {}
    };
    
    // Copy direct properties from the root model, excluding namespace array
    for (const key in rootModel) {
        if (key !== 'namespace') {
            rootData.properties[key] = rootModel[key];
        }
    }
    
    // Get the first namespace, if it exists
    let firstNamespace = null;
    if (rootModel.namespace && Array.isArray(rootModel.namespace) && rootModel.namespace.length > 0) {
        firstNamespace = rootModel.namespace[0];
    }

    // Send data to the webview
    panel.webview.postMessage({
        command: 'setProjectData',
        rootData: rootData,
        namespaceData: firstNamespace
    });
}

/**
 * Handles updates to project settings
 * @param {Object} data The update data with property name, exists flag, and value
 * @param {Object} rootModel The root model object
 * @param {Object} modelService The model service
 * @param {Object} panel The webview panel
 */
function handleUpdateSetting(data, rootModel, modelService, panel) {
    const { section, property, exists, value } = data;
    
    try {
        // Update root properties or namespace based on the section
        if (section === 'root') {
            if (exists) {
                rootModel[property] = value;
            } else if (rootModel.hasOwnProperty(property)) {
                delete rootModel[property];
            }
        } else if (section === 'namespace') {
            if (rootModel.namespace && rootModel.namespace.length > 0) {
                if (exists) {
                    rootModel.namespace[0][property] = value;
                } else if (rootModel.namespace[0].hasOwnProperty(property)) {
                    delete rootModel.namespace[0][property];
                }
            }
        }
        
        // Save the updated model
        modelService.saveToFile(rootModel);
        
        // Instead of refreshing webview data (which can cause infinite recursion),
        // just send confirmation back to webview
        panel.webview.postMessage({
            command: 'settingUpdated',
            property: property,
            success: true
        });
        
    } catch (error) {
        console.error(`Error updating setting ${property}:`, error);
        panel.webview.postMessage({
            command: 'settingUpdated',
            property: property,
            success: false,
            error: error.message
        });
    }
}

/**
 * Creates the HTML content for the webview
 * @param {Object} panel The webview panel
 * @param {Object} context The extension context
 * @param {Object} model The model data
 * @param {Object} schema The JSON schema
 * @returns {string} The HTML content
 */
function getWebviewContent(panel, context, model, schema) {
    // Get webview-compliant URIs for CSS and script files
    const styleUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'styles', 'styles.css'));
    
    // Convert the hidden properties arrays to JSON for use in the webview
    const hiddenRootProps = JSON.stringify(HIDDEN_ROOT_PROPERTIES);
    const hiddenNamespaceProps = JSON.stringify(HIDDEN_NAMESPACE_PROPERTIES);
    
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Project Settings</title>
        <link rel="stylesheet" href="${styleUri}">
        <style>
            body {
                padding: 20px;
                color: var(--vscode-editor-foreground);
                font-family: var(--vscode-editor-font-family);
                background-color: var(--vscode-editor-background);
            }
            h2 {
                border-bottom: 1px solid var(--vscode-panel-border);
                padding-bottom: 8px;
            }
            .settings-section {
                margin-bottom: 20px;
            }
            .property-row {
                display: flex;
                margin-bottom: 8px;
                align-items: center;
            }
            .property-name {
                width: 170px;
                padding-right: 10px;
                text-align: right;
            }
            .control-with-checkbox {
                display: flex;
                flex-grow: 1;
                align-items: center;
            }
            .control-with-checkbox input[type="text"],
            .control-with-checkbox select {
                flex-grow: 1;
                margin-right: 10px;
                padding: 5px;
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
            }
            .control-with-checkbox input[type="checkbox"] {
                margin-left: 6px;
            }
            input[readonly],
            select[disabled] {
                background-color: var(--vscode-input-disabledBackground, #e9e9e9) !important;
                color: var(--vscode-input-disabledForeground, #999) !important;
                opacity: 0.8;
            }
            .section-title {
                font-size: 1.2em;
                font-weight: bold;
                margin: 15px 0 10px 0;
                color: var(--vscode-editor-foreground);
            }
        </style>
    </head>
    <body>
        <h2>Project Settings</h2>
        <p>Manage root-level project settings and namespace configuration.</p>

        <div class="settings-section">
            <div class="section-title">Root Settings</div>
            <div id="rootSettings">
                <!-- Will be populated dynamically -->
                <div class="loading">Loading root settings...</div>
            </div>
        </div>

        <div class="settings-section">
            <div class="section-title">Namespace Settings</div>
            <div id="namespaceSettings">
                <!-- Will be populated dynamically -->
                <div class="loading">Loading namespace settings...</div>
            </div>
        </div>

        <script>
            // Store the schema and properties for reference
            let schema = ${JSON.stringify(schema)};
            let rootData = {};
            let namespaceData = {};
            const vscode = acquireVsCodeApi();
            
            // Define the hidden properties arrays in the webview context
            const HIDDEN_ROOT_PROPERTIES = ${hiddenRootProps};
            const HIDDEN_NAMESPACE_PROPERTIES = ${hiddenNamespaceProps};
            
            // Initialize on DOM content loaded
            document.addEventListener('DOMContentLoaded', function() {
                // Notify the extension that the webview is ready to receive data
                vscode.postMessage({
                    command: 'webviewReady'
                });
            });

            // Listen for messages from the extension
            window.addEventListener('message', event => {
                const message = event.data;
                
                switch (message.command) {
                    case 'setProjectData':
                        // Update our cached data
                        rootData = message.rootData;
                        namespaceData = message.namespaceData;
                        
                        // Rebuild the UI with the new data
                        renderRootSettings();
                        renderNamespaceSettings();
                        break;
                        
                    case 'settingUpdated':
                        // Could add confirmation or error handling UI
                        if (!message.success) {
                            console.error('Failed to update setting:', message.property, message.error);
                        }
                        break;
                }
            });

            // Generate UI for root settings
            function renderRootSettings() {
                const container = document.getElementById('rootSettings');
                container.innerHTML = ''; // Clear existing content
                
                // Get root schema properties
                const rootSchema = schema.properties?.root?.properties || {};
                
                // Skip namespace property as it's handled separately
                const propertiesToDisplay = Object.keys(rootSchema)
                    .filter(key => key !== 'namespace' && !HIDDEN_ROOT_PROPERTIES.includes(key))
                    .sort(); // Sort alphabetically
                
                // No properties to display
                if (propertiesToDisplay.length === 0) {
                    container.innerHTML = '<p>No root properties found in schema.</p>';
                    return;
                }
                
                // Create rows for each property
                propertiesToDisplay.forEach(propName => {
                    const propSchema = rootSchema[propName];
                    const propValue = rootData.properties && rootData.properties[propName];
                    const propExists = rootData.properties && rootData.properties.hasOwnProperty(propName);
                    
                    // Create the property row
                    const row = createPropertyRow(propName, propSchema, propValue, propExists, 'root');
                    container.appendChild(row);
                });
            }

            // Generate UI for namespace settings
            function renderNamespaceSettings() {
                const container = document.getElementById('namespaceSettings');
                container.innerHTML = ''; // Clear existing content
                
                if (!namespaceData) {
                    container.innerHTML = '<p>No namespace found in the model.</p>';
                    return;
                }
                
                // Get namespace schema properties
                const namespaceSchema = schema.properties?.root?.properties?.namespace?.items?.properties || {};
                
                // Skip object property as that's the data objects collection
                const propertiesToDisplay = Object.keys(namespaceSchema)
                    .filter(key => key !== 'object' && !HIDDEN_NAMESPACE_PROPERTIES.includes(key))
                    .sort(); // Sort alphabetically
                
                // No properties to display
                if (propertiesToDisplay.length === 0) {
                    container.innerHTML = '<p>No namespace properties found in schema.</p>';
                    return;
                }
                
                // Add namespace name as first item as an editable field
                if (namespaceData.name !== undefined) {
                    const nameRow = document.createElement('div');
                    nameRow.className = 'property-row';
                    
                    const nameLabel = document.createElement('div');
                    nameLabel.className = 'property-name';
                    nameLabel.textContent = 'Namespace:';
                    nameRow.appendChild(nameLabel);
                    
                    const controlContainer = document.createElement('div');
                    controlContainer.className = 'control-with-checkbox';
                    
                    // Create input for namespace name
                    const nameInput = document.createElement('input');
                    nameInput.type = 'text';
                    nameInput.value = namespaceData.name;
                    nameInput.id = 'namespaceName';
                    nameInput.name = 'name';
                    nameInput.required = true;
                    nameInput.title = "Namespace name cannot be empty";
                    
                    // Add validation to prevent empty namespace
                    nameInput.addEventListener('input', function() {
                        // Trim the value to check if it's really empty
                        if (!this.value.trim()) {
                            this.setCustomValidity("Namespace name cannot be empty");
                            this.reportValidity();
                        } else {
                            this.setCustomValidity("");
                        }
                    });
                    
                    nameInput.addEventListener('change', function() {
                        // If empty after change, revert to previous value
                        if (!this.value.trim()) {
                            this.value = namespaceData.name;
                            this.setCustomValidity("Namespace name cannot be empty");
                            this.reportValidity();
                            return;
                        }
                        
                        // Update the namespace name
                        sendSettingUpdate('namespace', 'name', true, this.value);
                    });
                    
                    controlContainer.appendChild(nameInput);
                    
                    // Add checkbox for consistency with other fields (always checked since name is required)
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'setting-checkbox';
                    checkbox.checked = true;
                    checkbox.disabled = true; // Disable checkbox since namespace name is required
                    checkbox.title = "Namespace name is required and cannot be unchecked";
                    
                    controlContainer.appendChild(checkbox);
                    nameRow.appendChild(controlContainer);
                    container.appendChild(nameRow);
                }
                
                // Create rows for each property
                propertiesToDisplay.forEach(propName => {
                    // Skip the name property as we displayed it separately as a textbox
                    if (propName === 'name') return;
                    
                    const propSchema = namespaceSchema[propName];
                    const propValue = namespaceData[propName];
                    const propExists = namespaceData.hasOwnProperty(propName);
                    
                    // Create the property row
                    const row = createPropertyRow(propName, propSchema, propValue, propExists, 'namespace');
                    container.appendChild(row);
                });
            }

            /**
             * Creates a row for a property with appropriate controls based on schema
             * @param {string} propName The property name
             * @param {Object} propSchema The schema for this property
             * @param {*} value The current value
             * @param {boolean} exists Whether the property exists in the data
             * @param {string} section 'root' or 'namespace' 
             * @returns {HTMLElement} The property row
             */
            function createPropertyRow(propName, propSchema, value, exists, section) {
                const row = document.createElement('div');
                row.className = 'property-row';
                
                // Create the label
                const nameDiv = document.createElement('div');
                nameDiv.className = 'property-name';
                nameDiv.textContent = formatPropertyName(propName) + ':';
                row.appendChild(nameDiv);
                
                // Create the control container
                const controlContainer = document.createElement('div');
                controlContainer.className = 'control-with-checkbox';
                
                // Determine what type of control to create based on schema
                let inputElement;
                
                if (propSchema.enum && Array.isArray(propSchema.enum)) {
                    // Enum property - use dropdown
                    inputElement = document.createElement('select');
                    
                    // Add options
                    propSchema.enum.forEach(option => {
                        const optionEl = document.createElement('option');
                        optionEl.value = option;
                        optionEl.textContent = option;
                        inputElement.appendChild(optionEl);
                    });
                    
                    if (exists && value !== undefined) {
                        inputElement.value = value;
                    }
                    
                    inputElement.disabled = !exists;
                } else {
                    // Regular property - use text input
                    inputElement = document.createElement('input');
                    inputElement.type = 'text';
                    
                    if (exists && value !== undefined) {
                        inputElement.value = value;
                    }
                    
                    inputElement.readOnly = !exists;
                }
                
                // Add tooltip if there's a description
                if (propSchema.description) {
                    inputElement.title = propSchema.description;
                }
                
                inputElement.id = propName;
                inputElement.name = propName;
                
                // Set styles based on readonly/disabled state
                updateInputStyle(inputElement, exists);
                
                // Add change handler
                inputElement.addEventListener('change', function() {
                    sendSettingUpdate(section, propName, exists, this.value);
                });
                
                // Add the input to the container
                controlContainer.appendChild(inputElement);
                
                // Add checkbox for toggling property existence
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'setting-checkbox';
                checkbox.checked = exists;
                checkbox.dataset.prop = propName;
                
                // If property already exists, disable the checkbox to prevent unchecking
                if (exists) {
                    checkbox.disabled = true;
                    checkbox.title = "Property exists in model and cannot be removed";
                } else {
                    checkbox.title = "Toggle property existence";
                    
                    // Add change handler for checkbox (only for properties that don't exist yet)
                    checkbox.addEventListener('change', function() {
                        const isChecked = this.checked;
                        
                        if (inputElement.tagName === 'INPUT') {
                            inputElement.readOnly = !isChecked;
                        } else if (inputElement.tagName === 'SELECT') {
                            inputElement.disabled = !isChecked;
                        }
                        
                        // Update input styling
                        updateInputStyle(inputElement, isChecked);
                        
                        // If enabling, ensure we have a default value
                        if (isChecked) {
                            // For select elements with no value, select the first option
                            if (inputElement.tagName === 'SELECT' && (!inputElement.value || inputElement.value === "")) {
                                if (inputElement.options.length > 0) {
                                    inputElement.value = inputElement.options[0].value;
                                }
                            }
                        }
                        
                        // Send update to extension
                        sendSettingUpdate(section, propName, isChecked, isChecked ? inputElement.value : null);
                    });
                }
                
                controlContainer.appendChild(checkbox);
                row.appendChild(controlContainer);
                
                return row;
            }
            
            /**
             * Updates the styling for an input based on its enabled/disabled state
             * @param {HTMLElement} inputElement The input or select element
             * @param {boolean} enabled Whether the control is enabled
             */
            function updateInputStyle(inputElement, enabled) {
                if (!enabled) {
                    inputElement.style.backgroundColor = 'var(--vscode-input-disabledBackground, #e9e9e9)';
                    inputElement.style.color = 'var(--vscode-input-disabledForeground, #999)';
                    inputElement.style.opacity = '0.8';
                } else {
                    inputElement.style.backgroundColor = 'var(--vscode-input-background)';
                    inputElement.style.color = 'var(--vscode-input-foreground)';
                    inputElement.style.opacity = '1';
                }
            }
            
            /**
             * Formats a property name into a human-readable label
             * @param {string} name The property name in camelCase or PascalCase
             * @returns {string} The formatted name with spaces
             */
            function formatPropertyName(name) {
                // Handle cases where capital letters are together (e.g., DNA -> DNA not D N A)
                return name
                    // Insert a space before all caps if not preceded by a capital letter
                    .replace(/([^A-Z])([A-Z])/g, '$1 $2')
                    // Insert a space before all numbers if not preceded by a number
                    .replace(/([^0-9])([0-9])/g, '$1 $2')
                    // Capitalize the first letter
                    .replace(/^./, function(str) { return str.toUpperCase(); });
            }

            /**
             * Sends a setting update message to the extension
             * @param {string} section The section ('root' or 'namespace')
             * @param {string} property The property name
             * @param {boolean} exists Whether the property should exist
             * @param {any} value The property value
             */
            function sendSettingUpdate(section, property, exists, value) {
                vscode.postMessage({
                    command: 'updateSetting',
                    data: {
                        section: section,
                        property: property,
                        exists: exists,
                        value: value
                    }
                });
            }
        </script>
    </body>
    </html>`;
}

module.exports = {
    showProjectSettings
};
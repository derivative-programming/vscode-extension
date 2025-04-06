"use strict";
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

// Track current panels to avoid duplicates
const activePanels = new Map();

/**
 * Loads and parses the JSON schema
 * @returns {Object} The parsed schema object
 */
function loadSchema() {
    console.log('[loadSchema] __dirname:', __dirname);
    // First try parent folder app-dna.schema.json
    const primarySchemaPath = path.join(__dirname, '..', 'app-dna.schema.json');
    if (!fs.existsSync(primarySchemaPath)) {
        console.log('[loadSchema] Not found at:', primarySchemaPath);
        // Fallback to local folder
        const fallbackPath = path.join(__dirname, 'app-dna.schema.json');
        if (!fs.existsSync(fallbackPath)) {
            console.log('[loadSchema] Not found at:', fallbackPath, 'Returning empty schema.');
            return {};
        }
        return JSON.parse(fs.readFileSync(fallbackPath, 'utf-8')) || {};
    }
    return JSON.parse(fs.readFileSync(primarySchemaPath, 'utf-8')) || {};
}

/**
 * Opens a webview panel displaying details for a data object
 * @param {Object} item The tree item representing the data object
 * @param {string} appDNAFilePath Path to the app-dna.json file
 */
function showObjectDetails(item, appDNAFilePath) {
    console.log(`showObjectDetails called for ${item.label} at ${appDNAFilePath}`);
    
    // Check if panel already exists for this object
    const panelId = `objectDetails-${item.label}`;
    
    if (activePanels.has(panelId)) {
        // Panel exists, reveal it instead of creating a new one
        activePanels.get(panelId).reveal(vscode.ViewColumn.One);
        return;
    }
    
    // Create webview panel
    const panel = vscode.window.createWebviewPanel(
        'objectDetails', 
        `Details for ${item.label}`,
        vscode.ViewColumn.One, 
        { 
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );
    
    // Track this panel
    activePanels.set(panelId, panel);
    
    // Remove from tracking when disposed
    panel.onDidDispose(() => {
        activePanels.delete(panelId);
    });
    
    // Get the full object data
    const objectData = getObjectData(item.label, appDNAFilePath);
    
    // Get schema property descriptions (simplified for initial implementation)
    const propertyDescriptions = {};
    
    // Set the HTML content with the full object data
    panel.webview.html = getObjectDetailsContent(objectData, propertyDescriptions);
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'save':
                    saveObjectData(message.data, appDNAFilePath);
                    return;
            }
        }
    );
}

/**
 * Gets object data from the app-dna.json file
 * @param {string} objectName Name of the object to retrieve
 * @param {string} appDNAFilePath Path to the app-dna.json file
 * @returns {Object} The object data
 */
function getObjectData(objectName, appDNAFilePath) {
    try {
        if (!appDNAFilePath || !fs.existsSync(appDNAFilePath)) {
            return { name: objectName, error: "AppDNA file not found" };
        }
        
        const fileContent = fs.readFileSync(appDNAFilePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);
        
        let objectData = null;
        
        // Ensure the object name is trimmed and case-insensitive for matching
        const normalizedObjectName = objectName.trim().toLowerCase();

        // Find the object in any namespace
        if (jsonData.root && jsonData.root.namespace) {
            for (const ns of jsonData.root.namespace) {
                if (Array.isArray(ns.object)) {
                    const obj = ns.object.find(o => o.name.trim().toLowerCase() === normalizedObjectName);
                    if (obj) {
                        objectData = obj;
                        objectData.namespaceName = ns.name;
                        break;
                    }
                }
            }
        }
        
        return objectData || { name: objectName, error: "Object not found" };
    } catch (error) {
        console.error('Error reading object data:', error);
        return { name: objectName, error: error.message };
    }
}

/**
 * Saves object data back to the app-dna.json file
 * @param {Object} data The data to save
 * @param {string} appDNAFilePath Path to the app-dna.json file
 */
function saveObjectData(data, appDNAFilePath) {
    try {
        if (!appDNAFilePath || !fs.existsSync(appDNAFilePath)) {
            vscode.window.showErrorMessage('AppDNA file not found. Cannot save changes.');
            return;
        }
        
        const fileContent = fs.readFileSync(appDNAFilePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);
        
        // Find and update the object
        let updated = false;
        
        if (jsonData.root && jsonData.root.namespace) {
            for (const ns of jsonData.root.namespace) {
                if (Array.isArray(ns.object)) {
                    const objIndex = ns.object.findIndex(o => o.name === data.name);
                    if (objIndex >= 0) {
                        // Update the object properties
                        if (data.settings) {
                            // Update basic properties
                            for (const [key, value] of Object.entries(data.settings)) {
                                if (key !== 'prop' && key !== 'report' && key !== 'objectWorkflow') {
                                    ns.object[objIndex][key] = value;
                                }
                            }
                        }
                        
                        // Update props if provided
                        if (data.props) {
                            ns.object[objIndex].prop = data.props;
                        }
                        
                        updated = true;
                        break;
                    }
                }
            }
        }
        
        if (updated) {
            fs.writeFileSync(appDNAFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');
            vscode.window.showInformationMessage('Object updated successfully');
            
            // Try to refresh the tree view if possible
            try {
                vscode.commands.executeCommand('appdna.refresh');
            } catch (error) {
                console.error('Could not refresh tree view:', error);
            }
        } else {
            vscode.window.showErrorMessage('Failed to update object: Object not found');
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to save changes: ${error.message}`);
    }
}

/**
 * Generates the HTML content for the object details webview
 * @param {Object} object The object data to display
 * @param {Object} propertyDescriptions Schema property descriptions
 * @returns {string} HTML content
 */
function getObjectDetailsContent(object, propertyDescriptions) {
    const schema = loadSchema();
    console.log('[getObjectDetailsContent] Full schema:\n', JSON.stringify(schema, null, 2));

    let objectSchemaProps = schema.properties?.root?.properties?.namespace?.items?.properties?.object?.items?.properties || {};
    console.log('[getObjectDetailsContent] Attempting standard path. Keys:', Object.keys(objectSchemaProps));

    if (!Object.keys(objectSchemaProps).length) {
        objectSchemaProps = schema.definitions?.Object?.properties || {};
        console.log('[getObjectDetailsContent] Using fallback path: schema.definitions.Object.properties. Keys:', Object.keys(objectSchemaProps));
    }
    
    const props = object.prop || [];
    
    // Remove complex properties from settings
    delete object.prop;
    delete object.report;
    delete object.objectWorkflow;

    const settingsHtml = Object.entries(objectSchemaProps)
        .filter(([key, desc]) => desc.type !== 'array' && key !== 'name')
        .sort((a, b) => a[0].localeCompare(b[0])) // Sort alphabetically by property name
        .map(([key, desc]) => {
            // Check if property has enum values
            const hasEnum = desc.enum && Array.isArray(desc.enum);
            
            // Get description for tooltip
            const tooltip = desc.description ? `title="${desc.description}"` : '';
            
            // Generate appropriate input field based on whether it has enum values
            let inputField = '';
            if (hasEnum) {
                // Generate select dropdown for enum values
                inputField = `<select id="${key}" name="${key}" ${tooltip} ${!object.hasOwnProperty(key) ? 'disabled' : ''}>
                    <option value="">Select ${formatLabel(key)}</option>
                    ${desc.enum.map(option => 
                        `<option value="${option}" ${object[key] === option ? 'selected' : ''}>${option}</option>`
                    ).join('')}
                </select>`;
            } else {
                // Generate text input for non-enum values
                inputField = `<input type="text" id="${key}" name="${key}" value="${object[key] || ''}" ${tooltip} ${!object.hasOwnProperty(key) ? 'readonly' : ''}>`;
            }
            
            return `<div class="form-row">
                <label for="${key}" ${tooltip}>${formatLabel(key)}:</label>
                ${inputField}
                <input type="checkbox" class="setting-checkbox" data-prop="${key}" data-is-enum="${hasEnum}" ${object.hasOwnProperty(key) ? 'checked' : ''} style="margin-left: 5px; transform: scale(0.8);" title="Toggle property existence">
            </div>`;
        }).join('');

    if (!settingsHtml.trim()) {
        return `<h1>${object.name}</h1><div>No schema properties found for this object.</div>`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Object Details: ${object.name}</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
            padding: 15px;
            margin: 0;
        }

        /* Tabs styling */
        .tabs {
            display: flex;
            justify-content: flex-start; /* Left-justified tabs */
            border-bottom: 1px solid var(--vscode-editorGroup-border);
            margin-bottom: 10px;
        }

        .tab {
            padding: 10px 15px;
            cursor: pointer;
            border: 1px solid transparent;
            border-bottom: none;
            background-color: var(--vscode-tab-inactiveBackground);
            color: var(--vscode-tab-inactiveForeground);
        }

        .tab.active {
            background-color: var(--vscode-tab-activeBackground);
            color: var(--vscode-tab-activeForeground);
            border-color: var(--vscode-editorGroup-border);
        }

        /* Tab content styling */
        .tab-content {
            display: none;
            padding: 15px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            border: 1px solid var(--vscode-editorGroup-border);
        }

        .tab-content.active {
            display: block;
        }

        /* View icons styling */
        .view-icons {
            display: flex;
            justify-content: flex-start;
            margin-bottom: 10px;
        }

        .icon {
            padding: 5px 10px;
            cursor: pointer;
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            margin-right: 5px;
            border-radius: 3px;
        }

        .icon.active {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        /* Form row styling */
        .form-row {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }

        .form-row label {
            flex: 0 0 150px;
            font-weight: bold;
        }

        .form-row input[type="text"],
        .form-row select {
            flex: 1;
            padding: 5px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
        }

        /* Read-only controls styling */
        input[readonly], select[disabled] {
            background-color: var(--vscode-input-disabledBackground, #e9e9e9);
            color: var(--vscode-input-disabledForeground, #999);
        }

        /* Checkbox styling */
        input[type="checkbox"] {
            margin-left: 5px;
            transform: scale(0.8);
        }

        /* Table styling */
        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid var(--vscode-editorGroup-border);
        }

        th {
            background-color: var(--vscode-editor-lineHighlightBackground);
        }

        /* Button styling */
        button {
            padding: 6px 14px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }

        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        /* List and details container */
        .list-container {
            width: 30%;
            float: left;
            padding-right: 15px;
        }

        .details-container {
            width: 65%;
            float: left;
        }

        #propsList {
            width: 100%;
            height: 300px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
        }

        .actions {
            margin-top: 15px;
            text-align: right;
        }

        /* Clear fix */
        .view-content:after {
            content: "";
            display: table;
            clear: both;
        }
    </style>
</head>
<body>
    <h1>Details for ${object.name}</h1>
    
    <div class="tabs">
        <div class="tab active" data-tab="settings">Settings</div>
        <div class="tab" data-tab="props">Properties (${props.length})</div>
    </div>
    
    <div id="settings" class="tab-content active">
        ${object.error ? 
            `<div class="error">${object.error}</div>` : 
            `<form id="settingsForm">
                ${settingsHtml}
            </form>
            
            <div class="actions">
                <button id="saveSettings">Save Settings</button>
            </div>`
        }
    </div>
    
    <div id="props" class="tab-content">
        <div class="view-icons">
            <span class="icon table-icon active" data-view="table">Table View</span>
            <span class="icon list-icon" data-view="list">List View</span>
        </div>

        <div id="tableView" class="view-content active">
            ${object.error ? 
                `<div class="error">${object.error}</div>` : 
                `<table id="propsTable">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Data Type</th>
                            <th>Size</th>
                            <th>Is FK</th>
                            <th>FK Object</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${props.map((prop, index) => `
                            <tr data-index="${index}">
                                <td>
                                    <span class="prop-name">${prop.name || 'Unnamed Property'}</span>
                                    <input type="hidden" name="name" value="${prop.name || ''}">
                                </td>
                                <td>
                                    <select name="sqlServerDBDataType" ${!prop.hasOwnProperty('sqlServerDBDataType') ? 'disabled' : ''}>
                                        <option value="" ${!prop.sqlServerDBDataType ? 'selected' : ''}>Select type</option>
                                        <option value="nvarchar" ${prop.sqlServerDBDataType === 'nvarchar' ? 'selected' : ''}>nvarchar</option>
                                        <option value="int" ${prop.sqlServerDBDataType === 'int' ? 'selected' : ''}>int</option>
                                        <option value="bit" ${prop.sqlServerDBDataType === 'bit' ? 'selected' : ''}>bit</option>
                                        <option value="datetime" ${prop.sqlServerDBDataType === 'datetime' ? 'selected' : ''}>datetime</option>
                                    </select>
                                    <input type="checkbox" class="prop-checkbox" data-prop="sqlServerDBDataType" data-index="${index}" ${prop.hasOwnProperty('sqlServerDBDataType') ? 'checked' : ''} style="margin-left: 5px; transform: scale(0.8);" title="Toggle property existence">
                                </td>
                                <td>
                                    <input type="text" name="sqlServerDBDataTypeSize" value="${prop.sqlServerDBDataTypeSize || ''}" ${!prop.hasOwnProperty('sqlServerDBDataTypeSize') ? 'readonly' : ''}>
                                    <input type="checkbox" class="prop-checkbox" data-prop="sqlServerDBDataTypeSize" data-index="${index}" ${prop.hasOwnProperty('sqlServerDBDataTypeSize') ? 'checked' : ''} style="margin-left: 5px; transform: scale(0.8);" title="Toggle property existence">
                                </td>
                                <td>
                                    <select name="isFK" ${!prop.hasOwnProperty('isFK') ? 'disabled' : ''}>
                                        <option value="">Select</option>
                                        <option value="true" ${prop.isFK === 'true' ? 'selected' : ''}>Yes</option>
                                        <option value="false" ${prop.isFK === 'false' ? 'selected' : ''}>No</option>
                                    </select>
                                    <input type="checkbox" class="prop-checkbox" data-prop="isFK" data-index="${index}" ${prop.hasOwnProperty('isFK') ? 'checked' : ''} style="margin-left: 5px; transform: scale(0.8);" title="Toggle property existence">
                                </td>
                                <td>
                                    <input type="text" name="fKObjectName" value="${prop.fKObjectName || ''}" ${!prop.hasOwnProperty('fKObjectName') ? 'readonly' : ''}>
                                    <input type="checkbox" class="prop-checkbox" data-prop="fKObjectName" data-index="${index}" ${prop.hasOwnProperty('fKObjectName') ? 'checked' : ''} style="margin-left: 5px; transform: scale(0.8);" title="Toggle property existence">
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <button id="addProp">Add Property</button>
                
                <div class="actions">
                    <button id="saveProps">Save Properties</button>
                </div>`
            }
        </div>

        <div id="listView" class="view-content">
            <div class="list-container">
                <select id="propsList" size="10">
                    ${props.map((prop, index) => `<option value="${index}">${prop.name || 'Unnamed Property'}</option>`).join('')}
                </select>
            </div>
            <div class="details-container">
                <form id="propDetailsForm">
                    <div class="form-row">
                        <label for="propDataType">Data Type:</label>
                        <select id="propDataType" name="sqlServerDBDataType" disabled>
                            <option value="">Select type</option>
                            <option value="nvarchar">nvarchar</option>
                            <option value="int">int</option>
                            <option value="bit">bit</option>
                            <option value="datetime">datetime</option>
                        </select>
                        <input type="checkbox" id="propDataTypeEditable" title="Enable editing" style="margin-left: 5px; transform: scale(0.8);">
                    </div>
                    <div class="form-row">
                        <label for="propFKObject">FK Object:</label>
                        <input type="text" id="propFKObject" name="fKObjectName" value="" readonly>
                        <input type="checkbox" id="propFKObjectEditable" title="Enable editing" style="margin-left: 5px; transform: scale(0.8);">
                    </div>
                    <div class="form-row">
                        <label for="propIsFK">Is FK:</label>
                        <select id="propIsFK" name="isFK" disabled>
                            <option value="">Select</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                        <input type="checkbox" id="propIsFKEditable" title="Enable editing" style="margin-left: 5px; transform: scale(0.8);">
                    </div>
                    <div class="form-row">
                        <label for="propSize">Size:</label>
                        <input type="text" id="propSize" name="sqlServerDBDataTypeSize" value="" readonly>
                        <input type="checkbox" id="propSizeEditable" title="Enable editing" style="margin-left: 5px; transform: scale(0.8);">
                    </div>
                    <div class="actions">
                        <button id="savePropDetails">Save Property</button>
                    </div>
                </form>
            </div>
        </div>

        <script>
            (function() {
                const vscode = acquireVsCodeApi();

                // Tab switching
                document.querySelectorAll('.tab').forEach(tab => {
                    tab.addEventListener('click', () => {
                        const tabId = tab.getAttribute('data-tab');

                        // Update active tab
                        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                        tab.classList.add('active');

                        // Update visible tab content
                        document.querySelectorAll('.tab-content').forEach(content => {
                            content.classList.remove('active');
                            if (content.id === tabId) {
                                content.classList.add('active');
                            }
                        });
                    });
                });

                // View switching - using event delegation for better reliability
                document.querySelector('.view-icons').addEventListener('click', (event) => {
                    // Check if the clicked element is an icon or a child of an icon
                    const iconElement = event.target.closest('.icon');
                    if (!iconElement) return;
                    
                    const view = iconElement.getAttribute('data-view');
                    console.log('Switching to view:', view);
                    
                    // Update active state of icons
                    document.querySelectorAll('.view-icons .icon').forEach(icon => {
                        icon.classList.remove('active');
                    });
                    iconElement.classList.add('active');
                    
                    // Hide all views
                    document.querySelectorAll('.view-content').forEach(content => {
                        content.style.display = 'none';
                        content.classList.remove('active');
                    });
                    
                    // Show selected view
                    const viewElement = document.getElementById(view + 'View');
                    if (viewElement) {
                        viewElement.style.display = 'block';
                        viewElement.classList.add('active');
                        console.log('Activated view:', view + 'View');
                    } else {
                        console.error('View not found:', view + 'View');
                    }
                });

                // Set initial view on page load
                window.addEventListener('DOMContentLoaded', () => {
                    const defaultView = document.querySelector('.view-icons .icon.active');
                    if (defaultView) {
                        defaultView.click();
                    } else {
                        // Fallback to first icon if no active icon found
                        const firstIcon = document.querySelector('.view-icons .icon');
                        if (firstIcon) firstIcon.click();
                    }
                });

                // List item selection
                const propsList = document.getElementById('propsList');
                const propDetailsForm = document.getElementById('propDetailsForm');

                propsList.addEventListener('change', (event) => {
                    const selectedIndex = event.target.value;
                    const prop = ${JSON.stringify(props)}[selectedIndex];

                    // Update form fields with property values
                    document.getElementById('propDataType').value = prop.sqlServerDBDataType || '';
                    document.getElementById('propSize').value = prop.sqlServerDBDataTypeSize || '';
                    document.getElementById('propIsFK').value = prop.isFK || '';
                    document.getElementById('propFKObject').value = prop.fKObjectName || '';
                    
                    // Set checkbox states based on property existence
                    document.getElementById('propDataTypeEditable').checked = prop.hasOwnProperty('sqlServerDBDataType');
                    document.getElementById('propSizeEditable').checked = prop.hasOwnProperty('sqlServerDBDataTypeSize');
                    document.getElementById('propIsFKEditable').checked = prop.hasOwnProperty('isFK');
                    document.getElementById('propFKObjectEditable').checked = prop.hasOwnProperty('fKObjectName');
                    
                    // Trigger the change event on checkboxes to update read-only state
                    document.querySelectorAll('#propDetailsForm input[type="checkbox"]').forEach(checkbox => {
                        const event = new Event('change');
                        checkbox.dispatchEvent(event);
                    });
                });

                const toggleEditable = (checkboxId, inputId) => {
                    const checkbox = document.getElementById(checkboxId);
                    const input = document.getElementById(inputId);
                    
                    if (!checkbox || !input) return;

                    // Apply styling based on current checkbox state
                    const updateInputStyle = () => {
                        if (input.tagName === 'INPUT') {
                            input.readOnly = !checkbox.checked;
                        } else if (input.tagName === 'SELECT') {
                            input.disabled = !checkbox.checked;
                        }
                        
                        // Apply consistent styling
                        if (!checkbox.checked) {
                            input.style.backgroundColor = 'var(--vscode-input-disabledBackground, #e9e9e9)';
                            input.style.color = 'var(--vscode-input-disabledForeground, #999)';
                        } else {
                            input.style.backgroundColor = '';
                            input.style.color = '';
                        }
                    };

                    // Set initial state
                    updateInputStyle();

                    // Add event listener
                    checkbox.addEventListener('change', updateInputStyle);
                };

                toggleEditable('propDataTypeEditable', 'propDataType');
                toggleEditable('propSizeEditable', 'propSize');
                toggleEditable('propIsFKEditable', 'propIsFK');
                toggleEditable('propFKObjectEditable', 'propFKObject');

                // Save property details
                document.getElementById('savePropDetails')?.addEventListener('click', () => {
                    const form = document.getElementById('propDetailsForm');
                    if (!form) return;

                    const formData = new FormData(form);
                    const propDetails = {};

                    for (const [key, value] of formData.entries()) {
                        propDetails[key] = value;
                    }

                    vscode.postMessage({
                        command: 'save',
                        data: {
                            name: "${object.name}",
                            prop: propDetails
                        }
                    });
                });

                // Initialize settings form checkboxes
                document.querySelectorAll('.setting-checkbox').forEach(checkbox => {
                    const propName = checkbox.getAttribute('data-prop');
                    const isEnum = checkbox.getAttribute('data-is-enum') === 'true';
                    let inputField;
                    
                    if (isEnum) {
                        inputField = document.querySelector('select[name="' + propName + '"]');
                    } else {
                        inputField = document.querySelector('input[name="' + propName + '"]');
                    }
                    
                    if (!inputField) return;
                    
                    // Set initial state - apply correct input type handling
                    if (isEnum) {
                        inputField.disabled = !checkbox.checked;
                    } else {
                        inputField.readOnly = !checkbox.checked;
                    }
                    
                    // Apply initial styling
                    if (!checkbox.checked) {
                        inputField.style.backgroundColor = 'var(--vscode-input-disabledBackground, #e9e9e9)';
                        inputField.style.color = 'var(--vscode-input-disabledForeground, #999)';
                    }
                    
                    // Add event listener to toggle readOnly/disabled state
                    checkbox.addEventListener('change', () => {
                        if (isEnum) {
                            inputField.disabled = !checkbox.checked;
                        } else {
                            inputField.readOnly = !checkbox.checked;
                        }
                        
                        if (checkbox.checked) {
                            inputField.style.backgroundColor = '';
                            inputField.style.color = '';
                        } else {
                            inputField.style.backgroundColor = 'var(--vscode-input-disabledBackground, #e9e9e9)';
                            inputField.style.color = 'var(--vscode-input-disabledForeground, #999)';
                        }
                    });
                });
                
                // Initialize table view checkboxes
                document.querySelectorAll('.prop-checkbox').forEach(checkbox => {
                    const propName = checkbox.getAttribute('data-prop');
                    const rowIndex = checkbox.getAttribute('data-index');
                    const row = document.querySelector('tr[data-index="' + rowIndex + '"]');
                    const inputField = row.querySelector('[name="' + propName + '"]');
                    
                    // Add event listener to toggle readOnly/disabled state
                    checkbox.addEventListener('change', () => {
                        if (inputField.tagName === 'INPUT') {
                            inputField.readOnly = !checkbox.checked;
                            if (!checkbox.checked) {
                                inputField.style.backgroundColor = 'var(--vscode-input-disabledBackground, #e9e9e9)';
                                inputField.style.color = 'var(--vscode-input-disabledForeground, #999)';
                            } else {
                                inputField.style.backgroundColor = '';
                                inputField.style.color = '';
                            }
                        } else if (inputField.tagName === 'SELECT') {
                            inputField.disabled = !checkbox.checked;
                            if (!checkbox.checked) {
                                inputField.style.backgroundColor = 'var(--vscode-input-disabledBackground, #e9e9e9)';
                                inputField.style.color = 'var(--vscode-input-disabledForeground, #999)';
                            } else {
                                inputField.style.backgroundColor = '';
                                inputField.style.color = '';
                            }
                        }
                    });
                });

                // Handle saving settings
                document.getElementById('saveSettings')?.addEventListener('click', () => {
                    const form = document.getElementById('settingsForm');
                    if (!form) return;
                    
                    const formData = new FormData(form);
                    const settings = {};
                    
                    // Only include properties with checked checkboxes
                    document.querySelectorAll('.setting-checkbox').forEach(checkbox => {
                        const propName = checkbox.getAttribute('data-prop');
                        if (checkbox.checked) {
                            settings[propName] = formData.get(propName);
                        }
                    });
                    
                    vscode.postMessage({
                        command: 'save',
                        data: {
                            name: "${object.name}",
                            settings: settings
                        }
                    });
                });
                
                // Handle saving properties table
                document.getElementById('saveProps')?.addEventListener('click', () => {
                    const tableRows = document.querySelectorAll('#propsTable tbody tr');
                    const props = [];
                    
                    tableRows.forEach(row => {
                        const index = row.getAttribute('data-index');
                        const prop = {};
                        
                        // Only include properties with checked checkboxes
                        row.querySelectorAll('.prop-checkbox').forEach(checkbox => {
                            const propName = checkbox.getAttribute('data-prop');
                            if (checkbox.checked) {
                                const input = row.querySelector('[name="' + propName + '"]');
                                prop[propName] = input.value;
                            }
                        });
                        
                        if (Object.keys(prop).length > 0) {
                            props.push(prop);
                        }
                    });
                    
                    vscode.postMessage({
                        command: 'save',
                        data: {
                            name: "${object.name}",
                            props: props
                        }
                    });
                });
            })();
        </script>
    </div>
</body>
</html>`;
}

/**
 * Formats a property key into a readable label
 * @param {string} key The property key to format
 * @returns {string} The formatted label
 */
function formatLabel(key) {
    // Insert a space before all uppercase letters and capitalize the first letter
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
}

// Export the showObjectDetails function
module.exports = {
    showObjectDetails
};
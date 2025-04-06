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
        .filter(([_, desc]) => desc.type !== 'array')
        .map(([key]) => {
            return `<div class="form-row">
                <label for="${key}">${formatLabel(key)}:</label>
                <input type="text" id="${key}" name="${key}" value="${object[key] || ''}">
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
        :root {
            --container-padding: 20px;
            --input-padding-vertical: 6px;
            --input-padding-horizontal: 8px;
            --input-margin-vertical: 4px;
            --input-margin-horizontal: 0;
        }

        body, html {
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-foreground);
        }

        body {
            display: flex;
            flex-direction: column;
            padding: var(--container-padding);
        }
        
        h1 {
            margin-top: 0;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 10px;
        }
        
        .tabs {
            display: flex;
            margin-bottom: 10px;
        }
        
        .tab {
            padding: 8px 16px;
            cursor: pointer;
            border: 1px solid var(--vscode-panel-border);
            border-bottom: none;
            background-color: var(--vscode-tab-inactiveBackground);
            color: var(--vscode-tab-inactiveForeground);
            margin-right: 4px;
            border-top-left-radius: 3px;
            border-top-right-radius: 3px;
        }
        
        .tab.active {
            background-color: var(--vscode-tab-activeBackground);
            color: var(--vscode-tab-activeForeground);
            border-bottom: 1px solid var(--vscode-tab-activeBackground);
            position: relative;
            top: 1px;
        }
        
        .tab-content {
            display: none;
            padding: 20px;
            border: 1px solid var(--vscode-panel-border);
            flex-grow: 1;
            overflow: auto;
        }
        
        .tab-content.active {
            display: flex;
            flex-direction: column;
        }
        
        .view-icons {
            display: flex;
            margin-bottom: 10px;
        }
        
        .icon {
            padding: 8px 16px;
            cursor: pointer;
            border: 1px solid var(--vscode-panel-border);
            background-color: var(--vscode-tab-inactiveBackground);
            color: var(--vscode-tab-inactiveForeground);
            margin-right: 4px;
            border-radius: 3px;
        }
        
        .icon.active {
            background-color: var(--vscode-tab-activeBackground);
            color: var(--vscode-tab-activeForeground);
        }
        
        .view-content {
            display: none;
        }
        
        .view-content.active {
            display: block;
        }
        
        input, select, textarea {
            padding: var(--input-padding-vertical) var(--input-padding-horizontal);
            margin: var(--input-margin-vertical) var(--input-margin-horizontal);
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
        }
        
        button {
            padding: var(--input-padding-vertical) var(--input-padding-horizontal);
            margin: var(--input-margin-vertical) var(--input-margin-horizontal);
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            cursor: pointer;
        }
        
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 20px;
        }
        
        th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        th {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
        }
        
        .form-row {
            display: flex;
            margin-bottom: 10px;
        }
        
        .form-row label {
            width: 150px;
            padding-right: 10px;
        }
        
        .form-row input, .form-row select {
            flex: 1;
        }
        
        .list-container {
            width: 30%;
            float: left;
        }
        
        .details-container {
            width: 70%;
            float: left;
        }
        
        ul {
            list-style-type: none;
            padding: 0;
        }
        
        ul li {
            padding: 8px;
            cursor: pointer;
            border: 1px solid var(--vscode-panel-border);
            margin-bottom: 4px;
            background-color: var(--vscode-tab-inactiveBackground);
            color: var(--vscode-tab-inactiveForeground);
        }
        
        ul li:hover {
            background-color: var(--vscode-tab-hoverBackground);
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
                                <td><input type="text" name="name" value="${prop.name || ''}"></td>
                                <td>
                                    <select name="sqlServerDBDataType">
                                        <option value="" ${!prop.sqlServerDBDataType ? 'selected' : ''}>Select type</option>
                                        <option value="nvarchar" ${prop.sqlServerDBDataType === 'nvarchar' ? 'selected' : ''}>nvarchar</option>
                                        <option value="int" ${prop.sqlServerDBDataType === 'int' ? 'selected' : ''}>int</option>
                                        <option value="bit" ${prop.sqlServerDBDataType === 'bit' ? 'selected' : ''}>bit</option>
                                        <option value="datetime" ${prop.sqlServerDBDataType === 'datetime' ? 'selected' : ''}>datetime</option>
                                    </select>
                                </td>
                                <td><input type="text" name="sqlServerDBDataTypeSize" value="${prop.sqlServerDBDataTypeSize || ''}"></td>
                                <td>
                                    <select name="isFK">
                                        <option value="">Select</option>
                                        <option value="true" ${prop.isFK === 'true' ? 'selected' : ''}>Yes</option>
                                        <option value="false" ${prop.isFK === 'false' ? 'selected' : ''}>No</option>
                                    </select>
                                </td>
                                <td><input type="text" name="fKObjectName" value="${prop.fKObjectName || ''}"></td>
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
                        <label for="propName">Name:</label>
                        <input type="text" id="propName" name="name" value="" readonly>
                        <input type="checkbox" id="propNameEditable" title="Enable editing" style="margin-left: 5px; transform: scale(0.8);">
                    </div>
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
                        <label for="propSize">Size:</label>
                        <input type="text" id="propSize" name="sqlServerDBDataTypeSize" value="" readonly>
                        <input type="checkbox" id="propSizeEditable" title="Enable editing" style="margin-left: 5px; transform: scale(0.8);">
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
                        <label for="propFKObject">FK Object:</label>
                        <input type="text" id="propFKObject" name="fKObjectName" value="" readonly>
                        <input type="checkbox" id="propFKObjectEditable" title="Enable editing" style="margin-left: 5px; transform: scale(0.8);">
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

                // View switching
                document.querySelectorAll('.view-icons .icon').forEach(icon => {
                    icon.addEventListener('click', () => {
                        const view = icon.getAttribute('data-view');

                        // Update active icon
                        document.querySelectorAll('.view-icons .icon').forEach(i => i.classList.remove('active'));
                        icon.classList.add('active');

                        // Update visible view content
                        document.querySelectorAll('.view-content').forEach(content => {
                            content.classList.remove('active');
                            if (content.id === view + 'View') {
                                content.classList.add('active');
                            }
                        });
                    });
                });

                // List item selection
                const propsList = document.getElementById('propsList');
                const propDetailsForm = document.getElementById('propDetailsForm');

                propsList.addEventListener('change', (event) => {
                    const selectedIndex = event.target.value;
                    const prop = ${JSON.stringify(props)}[selectedIndex];

                    document.getElementById('propName').value = prop.name || '';
                    document.getElementById('propDataType').value = prop.sqlServerDBDataType || '';
                    document.getElementById('propSize').value = prop.sqlServerDBDataTypeSize || '';
                    document.getElementById('propIsFK').value = prop.isFK || '';
                    document.getElementById('propFKObject').value = prop.fKObjectName || '';
                });

                const toggleEditable = (checkboxId, inputId) => {
                    const checkbox = document.getElementById(checkboxId);
                    const input = document.getElementById(inputId);

                    checkbox.addEventListener('change', () => {
                        input.readOnly = !checkbox.checked;
                        input.disabled = !checkbox.checked;
                    });
                };

                toggleEditable('propNameEditable', 'propName');
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
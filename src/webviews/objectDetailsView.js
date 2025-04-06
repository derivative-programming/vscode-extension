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
    
    // Get the prop items schema properties
    const propItemsSchema = schema.properties?.root?.properties?.namespace?.items?.properties?.object?.items?.properties?.prop?.items?.properties || {};
    console.log('[getObjectDetailsContent] Prop items schema properties:', Object.keys(propItemsSchema));
    
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
    
    // Create header columns for all prop item properties and sort them alphabetically
    // Make sure 'name' is always the first column
    const propColumns = Object.keys(propItemsSchema).filter(key => key !== 'name').sort();
    propColumns.unshift('name');

    // Generate table headers
    const tableHeaders = propColumns.map(key => 
        `<th>${formatLabel(key)}</th>`
    ).join('');

    // Generate table rows for all properties
    const tableRows = props.map((prop, index) => {
        const cells = propColumns.map(propKey => {
            const propSchema = propItemsSchema[propKey] || {};
            const hasEnum = propSchema.enum && Array.isArray(propSchema.enum);
            const tooltip = propSchema.description ? `title="${propSchema.description}"` : '';
            
            // Special handling for the name column
            if (propKey === 'name') {
                return `<td>
                    <span class="prop-name">${prop.name || 'Unnamed Property'}</span>
                    <input type="hidden" name="name" value="${prop.name || ''}">
                </td>`;
            }
            
            let inputField = '';
            if (hasEnum) {
                inputField = `<select name="${propKey}" ${tooltip} ${!prop.hasOwnProperty(propKey) ? 'disabled' : ''}>
                    ${propSchema.enum.map(option => 
                        `<option value="${option}" ${prop[propKey] === option ? 'selected' : ''}>${option}</option>`
                    ).join('')}
                </select>`;
            } else {
                inputField = `<input type="text" name="${propKey}" value="${prop[propKey] || ''}" ${tooltip} ${!prop.hasOwnProperty(propKey) ? 'readonly' : ''}>`;
            }
            
            return `<td>
                <div class="control-with-checkbox">
                    ${inputField}
                    <input type="checkbox" class="prop-checkbox" data-prop="${propKey}" data-index="${index}" ${prop.hasOwnProperty(propKey) ? 'checked' : ''} title="Toggle property existence">
                </div>
            </td>`;
        }).join('');
        
        return `<tr data-index="${index}">${cells}</tr>`;
    }).join('');

    // Generate list view form fields for all properties
    const listViewFields = propColumns.filter(key => key !== 'name').map(propKey => {
        const propSchema = propItemsSchema[propKey] || {};
        const hasEnum = propSchema.enum && Array.isArray(propSchema.enum);
        const tooltip = propSchema.description ? `title="${propSchema.description}"` : '';
        
        const fieldId = `prop${propKey}`;
        
        let inputField = '';
        if (hasEnum) {
            inputField = `<select id="${fieldId}" name="${propKey}" ${tooltip} disabled>
                ${propSchema.enum.map(option => 
                    `<option value="${option}">${option}</option>`
                ).join('')}
            </select>`;
        } else {
            inputField = `<input type="text" id="${fieldId}" name="${propKey}" value="" ${tooltip} readonly>`;
        }
        
        return `<div class="form-row">
            <label for="${fieldId}" ${tooltip}>${formatLabel(propKey)}:</label>
            ${inputField}
            <input type="checkbox" id="${fieldId}Editable" data-field-id="${fieldId}" title="Toggle property existence" style="margin-left: 5px; transform: scale(0.8);">
        </div>`;
    }).join('');

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
            justify-content: space-between;
            margin-bottom: 10px;
            width: 100%;
        }
        
        .view-icons-left {
            display: flex;
            justify-content: flex-start;
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

        .add-prop-button {
            margin-left: auto;
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

        /* Consistent input and select styling */
        input[type="text"], select {
            padding: 5px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 2px;
            min-height: 24px;
        }

        /* Read-only controls styling */
        input[readonly], select[disabled] {
            background-color: var(--vscode-input-disabledBackground, #e9e9e9);
            color: var(--vscode-input-disabledForeground, #999);
            opacity: 0.8;
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

        .table-container {
            width: 100%;
            overflow-x: auto; /* Enable horizontal scrolling */
        }

        th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid var(--vscode-editorGroup-border);
            white-space: nowrap; /* Prevent text wrapping */
            min-width: 150px; /* Set minimum column width to 150px */
        }

        /* Name column should be wider to accommodate longer object names */
        th:first-child, td:first-child {
            min-width: 200px;
        }

        /* Improve table cell alignment and spacing */
        td input[type="text"], td select {
            width: calc(100% - 30px); /* Leave room for the checkbox */
            min-height: 24px;
            vertical-align: middle;
            display: inline-block;
        }

        /* Control with checkbox container */
        .control-with-checkbox {
            display: flex;
            align-items: center;
            width: 100%;
        }

        .control-with-checkbox input[type="text"],
        .control-with-checkbox select {
            flex: 1;
            min-width: 100px; /* Ensure minimum width for controls */
        }

        .control-with-checkbox input[type="checkbox"] {
            margin-left: 5px;
            flex: 0 0 auto;
        }

        th {
            background-color: var(--vscode-editor-lineHighlightBackground);
            position: sticky;
            top: 0; /* Make headers sticky when scrolling vertically */
            z-index: 1;
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

        /* Parent object field should be read-only */
        #parentObjectName {
            background-color: var(--vscode-input-disabledBackground, #e9e9e9);
            color: var(--vscode-input-disabledForeground, #999);
            opacity: 0.8;
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
            <div class="view-icons-left">
                <span class="icon table-icon active" data-view="table">Table View</span>
                <span class="icon list-icon" data-view="list">List View</span>
            </div>
            <button id="addProp" class="add-prop-button">Add Property</button>
        </div>

        <div id="tableView" class="view-content active">
            ${object.error ? 
                `<div class="error">${object.error}</div>` : 
                `<div class="table-container">
                    <table id="propsTable">
                        <thead>
                            <tr>
                                ${tableHeaders}
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
                
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
            <div id="propertyDetailsContainer" class="details-container" style="display: none;">
                <form id="propDetailsForm">
                    ${listViewFields}
                    <div class="actions">
                        <button id="savePropDetails">Save Property</button>
                    </div>
                </form>
            </div>
        </div>

        <script>
            (function() {
                const vscode = acquireVsCodeApi();
                const props = ${JSON.stringify(props)};
                const propColumns = ${JSON.stringify(propColumns)};
                const propItemsSchema = ${JSON.stringify(propItemsSchema)};

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

                    // Apply consistent styling to all selects and inputs
                    applyConsistentStyling();
                    
                    // Make parent object name read-only without a checkbox
                    const parentObjectNameField = document.getElementById('parentObjectName');
                    if (parentObjectNameField) {
                        parentObjectNameField.readOnly = true;
                        const parentCheckbox = parentObjectNameField.nextElementSibling;
                        if (parentCheckbox && parentCheckbox.classList.contains('setting-checkbox')) {
                            parentCheckbox.style.display = 'none';
                        }
                    }
                });

                // Helper function to apply consistent styling to all inputs and selects
                function applyConsistentStyling() {
                    // Style all select elements consistently
                    document.querySelectorAll('select').forEach(select => {
                        if (select.disabled) {
                            select.style.backgroundColor = 'var(--vscode-input-disabledBackground, #e9e9e9)';
                            select.style.color = 'var(--vscode-input-disabledForeground, #999)';
                            select.style.opacity = '0.8';
                        } else {
                            select.style.backgroundColor = 'var(--vscode-input-background)';
                            select.style.color = 'var(--vscode-input-foreground)';
                            select.style.opacity = '1';
                        }
                    });

                    // Style all readonly inputs consistently
                    document.querySelectorAll('input[readonly]').forEach(input => {
                        input.style.backgroundColor = 'var(--vscode-input-disabledBackground, #e9e9e9)';
                        input.style.color = 'var(--vscode-input-disabledForeground, #999)';
                        input.style.opacity = '0.8';
                    });
                }

                // List item selection
                const propsList = document.getElementById('propsList');
                const propDetailsForm = document.getElementById('propDetailsForm');
                const propertyDetailsContainer = document.getElementById('propertyDetailsContainer');
                propsList.addEventListener('change', (event) => {
                    const selectedIndex = event.target.value;
                    const prop = props[selectedIndex];

                    // Show property details container when an item is selected
                    propertyDetailsContainer.style.display = 'block';

                    // Update form fields with property values
                    propColumns.forEach(propKey => {
                        if (propKey === 'name') return; // Skip name field as it's in the list
                        
                        const fieldId = 'prop' + propKey;
                        const field = document.getElementById(fieldId);
                        const checkbox = document.getElementById(fieldId + 'Editable');
                        
                        if (field && checkbox) {
                            if (field.tagName === 'SELECT') {
                                field.value = prop[propKey] || '';
                                field.disabled = !prop.hasOwnProperty(propKey);
                            } else {
                                field.value = prop[propKey] || '';
                                field.readOnly = !prop.hasOwnProperty(propKey);
                            }
                            
                            checkbox.checked = prop.hasOwnProperty(propKey);
                            
                            if (!checkbox.checked) {
                                field.style.backgroundColor = 'var(--vscode-input-disabledBackground, #e9e9e9)';
                                field.style.color = 'var(--vscode-input-disabledForeground, #999)';
                                field.style.opacity = '0.8';
                            } else {
                                field.style.backgroundColor = 'var(--vscode-input-background)';
                                field.style.color = 'var(--vscode-input-foreground)';
                                field.style.opacity = '1';
                            }
                        }
                    });
                });

                propsList.addEventListener('click', (event) => {
                    if (!propsList.value) {
                        propertyDetailsContainer.style.display = 'none';
                    }
                });

                window.addEventListener('DOMContentLoaded', () => {
                    const defaultView = document.querySelector('.view-icons .icon.active');
                    if (defaultView) {
                        defaultView.click();
                    } else {
                        const firstIcon = document.querySelector('.view-icons .icon');
                        if (firstIcon) firstIcon.click();
                    }

                    applyConsistentStyling();

                    if (propsList && (!propsList.value || propsList.value === "")) {
                        if (propertyDetailsContainer) {
                            propertyDetailsContainer.style.display = 'none';
                        }
                    }
                    
                    propColumns.forEach(propKey => {
                        if (propKey === 'name') return;
                        
                        const fieldId = 'prop' + propKey;
                        toggleEditable(fieldId + 'Editable', fieldId);
                    });
                });

                const toggleEditable = (checkboxId, inputId) => {
                    const checkbox = document.getElementById(checkboxId);
                    const input = document.getElementById(inputId);
                    if (!checkbox || !input) return;

                    const updateInputStyle = () => {
                        if (input.tagName === 'INPUT') {
                            input.readOnly = !checkbox.checked;
                        } else if (input.tagName === 'SELECT') {
                            input.disabled = !checkbox.checked;
                        }
                        if (!checkbox.checked) {
                            input.style.backgroundColor = 'var(--vscode-input-disabledBackground, #e9e9e9)';  
                            input.style.color = 'var(--vscode-input-disabledForeground, #999)';
                            input.style.opacity = '0.8';
                        } else {
                            input.style.backgroundColor = 'var(--vscode-input-background)';
                            input.style.color = 'var(--vscode-input-foreground)';
                            input.style.opacity = '1';
                        }
                    };

                    updateInputStyle();

                    checkbox.addEventListener('change', updateInputStyle);
                };

                document.getElementById('savePropDetails')?.addEventListener('click', (event) => {
                    event.preventDefault();
                    const form = document.getElementById('propDetailsForm');
                    if (!form) return;
                    
                    const selectedIndex = propsList.value;
                    if (selectedIndex === null || selectedIndex === undefined) return;
                    
                    const prop = { ...props[selectedIndex] };
                    
                    propColumns.forEach(propKey => {
                        if (propKey === 'name') return;
                        
                        const fieldId = 'prop' + propKey;
                        const field = document.getElementById(fieldId);
                        const checkbox = document.getElementById(fieldId + 'Editable');
                        
                        if (checkbox && checkbox.checked && field) {
                            prop[propKey] = field.value;
                        } else if (checkbox && !checkbox.checked) {
                            delete prop[propKey];
                        }
                    });
                    
                    const updatedProps = [...props];
                    updatedProps[selectedIndex] = prop;
                    
                    vscode.postMessage({
                        command: 'save',
                        data: {
                            name: "${object.name}",
                            props: updatedProps
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
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
}

// Export the showObjectDetails function
module.exports = {
    showObjectDetails
};
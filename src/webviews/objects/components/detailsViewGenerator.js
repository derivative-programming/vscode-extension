"use strict";
const { formatLabel } = require("../helpers/objectDataHelper");
const { getDetailViewStyles } = require("../styles/detailsViewStyles");

/**
 * Generates the HTML content for the object details webview
 * @param {Object} object The object data to display
 * @param {Object} objectSchemaProps Schema properties for the object
 * @param {Object} propItemsSchema Schema properties for property items
 * @returns {string} HTML content
 */
function generateDetailsView(object, objectSchemaProps, propItemsSchema) {
    const props = object.prop || [];
    
    // Remove complex properties from settings
    const objectForSettings = { ...object };
    delete objectForSettings.prop;
    delete objectForSettings.report;
    delete objectForSettings.objectWorkflow;

    // Generate the settings tab content
    const settingsHtml = generateSettingsTabContent(objectForSettings, objectSchemaProps);
    
    // Generate the properties tab content
    const { tableHeaders, tableRows } = generatePropsTableContent(props, propItemsSchema);
    const listViewFields = generatePropsListViewContent(propItemsSchema);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" width="device-width, initial-scale=1.0">
    <title>Object Details: ${object.name}</title>
    <style>
        ${getDetailViewStyles()}
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

        ${generateClientScript(props, propItemsSchema, object.name)}
    </div>
</body>
</html>`;
}

/**
 * Generates the settings tab HTML content
 * @param {Object} object The object data for settings
 * @param {Object} objectSchemaProps Schema properties for the object
 * @returns {string} HTML content for settings tab
 */
function generateSettingsTabContent(object, objectSchemaProps) {
    return Object.entries(objectSchemaProps)
        .filter(([key, desc]) => {
            // Exclude 'objectDocument' and 'objectButton' properties
            if (key === "objectDocument" || key === "objectButton") {
                return false;
            }
            // Keep other non-array properties that are not 'name'
            return desc.type !== "array" && key !== "name";
        })
        .sort((a, b) => a[0].localeCompare(b[0])) // Sort alphabetically by property name
        .map(([key, desc]) => {
            // Check if property has enum values
            const hasEnum = desc.enum && Array.isArray(desc.enum);
            // Check if it's a boolean enum (containing only true/false values)
            const isBooleanEnum = hasEnum && desc.enum.length === 2 && 
                desc.enum.every(val => val === true || val === false || val === "true" || val === "false");
            
            // Get description for tooltip
            const tooltip = desc.description ? `title="${desc.description}"` : "";
            
            // Generate appropriate input field based on whether it has enum values
            let inputField = "";
            if (hasEnum) {
                // Generate select dropdown for enum values - Always show options, but disable if property doesn't exist
                inputField = `<select id="${key}" name="${key}" ${tooltip} ${!object.hasOwnProperty(key) ? "disabled" : ""}>
                    ${desc.enum.map(option => {
                        // If it's a boolean enum and the property doesn't exist or is null, default to 'false'
                        const isSelected = isBooleanEnum && !object.hasOwnProperty(key) ? 
                            (option === false || option === "false") : 
                            object[key] === option;
                        
                        return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                    }).join("")}
                </select>`;
            } else {
                // Generate text input for non-enum values
                inputField = `<input type="text" id="${key}" name="${key}" value="${object[key] || ""}" ${tooltip} ${!object.hasOwnProperty(key) ? "readonly" : ""}>`;
            }
            
            return `<div class="form-row">
                <label for="${key}" ${tooltip}>${formatLabel(key)}:</label>
                ${inputField}
                <input type="checkbox" class="setting-checkbox" data-prop="${key}" data-is-enum="${hasEnum}" ${object.hasOwnProperty(key) ? "checked" : ""} style="margin-left: 5px; transform: scale(0.8);" title="Toggle property existence">
            </div>`;
        }).join("");
}

/**
 * Generates the properties table HTML content
 * @param {Array} props The property items
 * @param {Object} propItemsSchema Schema properties for property items
 * @returns {Object} Object containing tableHeaders and tableRows HTML
 */
function generatePropsTableContent(props, propItemsSchema) {
    // Create header columns for all prop item properties and sort them alphabetically
    // Make sure 'name' is always the first column
    const propColumns = Object.keys(propItemsSchema).filter(key => key !== "name").sort();
    propColumns.unshift("name");

    // Generate table headers
    const tableHeaders = propColumns.map(key => 
        `<th>${formatLabel(key)}</th>`
    ).join("");

    // Generate table rows for all properties
    const tableRows = props.map((prop, index) => {
        const cells = propColumns.map(propKey => {
            const propSchema = propItemsSchema[propKey] || {};
            const hasEnum = propSchema.enum && Array.isArray(propSchema.enum);
            // Check if it's a boolean enum (containing only true/false values)
            const isBooleanEnum = hasEnum && propSchema.enum.length === 2 && 
                propSchema.enum.every(val => val === true || val === false || val === "true" || val === "false");
            
            const tooltip = propSchema.description ? `title="${propSchema.description}"` : "";
            
            // Special handling for the name column
            if (propKey === "name") {
                return `<td>
                    <span class="prop-name">${prop.name || "Unnamed Property"}</span>
                    <input type="hidden" name="name" value="${prop.name || ""}">
                </td>`;
            }
            
            let inputField = "";
            if (hasEnum) {
                // Always show all options in the dropdown but disable it if property doesn't exist
                inputField = `<select name="${propKey}" ${tooltip} ${!prop.hasOwnProperty(propKey) ? "disabled" : ""}>
                    ${propSchema.enum.map(option => {
                        // If it's a boolean enum and the property doesn't exist or is null, default to 'false'
                        const isSelected = isBooleanEnum && !prop.hasOwnProperty(propKey) ? 
                            (option === false || option === "false") : 
                            prop[propKey] === option;
                        
                        return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                    }).join("")}
                </select>`;
            } else {
                inputField = `<input type="text" name="${propKey}" value="${prop[propKey] || ""}" ${tooltip} ${!prop.hasOwnProperty(propKey) ? "readonly" : ""}>`;
            }
            
            return `<td>
                <div class="control-with-checkbox">
                    ${inputField}
                    <input type="checkbox" class="prop-checkbox" data-prop="${propKey}" data-index="${index}" ${prop.hasOwnProperty(propKey) ? "checked" : ""} title="Toggle property existence">
                </div>
            </td>`;
        }).join("");
        
        return `<tr data-index="${index}">${cells}</tr>`;
    }).join("");

    return { tableHeaders, tableRows, propColumns };
}

/**
 * Generates the properties list view HTML content
 * @param {Object} propItemsSchema Schema properties for property items
 * @returns {string} HTML content for list view fields
 */
function generatePropsListViewContent(propItemsSchema) {
    // Create header columns for all prop item properties and sort them alphabetically
    // Make sure 'name' is always the first column
    const propColumns = Object.keys(propItemsSchema).filter(key => key !== "name").sort();
    propColumns.unshift("name");

    // Generate list view form fields for all properties
    return propColumns.filter(key => key !== "name").map(propKey => {
        const propSchema = propItemsSchema[propKey] || {};
        const hasEnum = propSchema.enum && Array.isArray(propSchema.enum);
        // Check if it's a boolean enum (containing only true/false values)
        const isBooleanEnum = hasEnum && propSchema.enum.length === 2 && 
            propSchema.enum.every(val => val === true || val === false || val === "true" || val === "false");
            
        const tooltip = propSchema.description ? `title="${propSchema.description}"` : "";
        
        const fieldId = `prop${propKey}`;
        
        let inputField = "";
        if (hasEnum) {
            // Always display all enum options even when disabled
            inputField = `<select id="${fieldId}" name="${propKey}" ${tooltip} disabled>
                ${propSchema.enum.map(option => {
                    // Default to 'false' for boolean enums
                    const isSelected = isBooleanEnum ? (option === false || option === "false") : false;
                    
                    return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                }).join("")}
            </select>`;
        } else {
            inputField = `<input type="text" id="${fieldId}" name="${propKey}" value="" ${tooltip} readonly>`;
        }
        
        return `<div class="form-row">
            <label for="${fieldId}" ${tooltip}>${formatLabel(propKey)}:</label>
            ${inputField}
            <input type="checkbox" id="${fieldId}Editable" data-field-id="${fieldId}" title="Toggle property existence" style="margin-left: 5px; transform: scale(0.8);">
        </div>`;
    }).join("");
}

/**
 * Generates client-side JavaScript for the details view
 * @param {Array} props The property items array 
 * @param {Object} propItemsSchema Schema for property items
 * @param {string} objectName The name of the object for display and messaging
 * @returns {string} HTML script tag with JavaScript
 */
function generateClientScript(props, propItemsSchema, objectName) {
    // Create header columns for all prop item properties and sort them alphabetically
    // Make sure 'name' is always the first column
    const propColumns = Object.keys(propItemsSchema).filter(key => key !== "name").sort();
    propColumns.unshift("name");

    return `<script>
            (function() {
                const vscode = acquireVsCodeApi();
                const props = ${JSON.stringify(props)};
                const propColumns = ${JSON.stringify(propColumns)};
                const propItemsSchema = ${JSON.stringify(propItemsSchema)};
                const objectName = "${objectName || ''}";

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

                // Initialize toggleEditable function for better checkbox behavior
                function initializeToggleEditableBehavior() {
                    // Process each checkbox in the Settings tab to correctly toggle its corresponding control
                    document.querySelectorAll(".setting-checkbox").forEach(checkbox => {
                        const propName = checkbox.getAttribute("data-prop");
                        const inputElement = document.getElementById(propName);
                        
                        if (inputElement) {
                            // Initial state setup
                            if (inputElement.tagName === "INPUT") {
                                inputElement.readOnly = !checkbox.checked;
                            } else if (inputElement.tagName === "SELECT") {
                                inputElement.disabled = !checkbox.checked;
                            }
                            
                            // Style based on checkbox state
                            updateInputStyle(inputElement, checkbox.checked);
                            
                            // Add event listener for checkbox state changes
                            checkbox.addEventListener("change", function() {
                                if (inputElement.tagName === "INPUT") {
                                    inputElement.readOnly = !this.checked;
                                } else if (inputElement.tagName === "SELECT") {
                                    inputElement.disabled = !this.checked;
                                }
                                updateInputStyle(inputElement, this.checked);
                            });
                        }
                    });
                    
                    // Process each checkbox in the Properties tab table view
                    // Using parent-child relationship to find the related input in the same table cell
                    document.querySelectorAll(".prop-checkbox").forEach(checkbox => {
                        // Find the closest table cell (td) containing this checkbox
                        const tableCell = checkbox.closest("td");
                        if (!tableCell) return;
                        
                        // Find the input or select element within this same table cell
                        const inputElement = tableCell.querySelector("input[type='text'], select");
                        if (!inputElement) return;
                        
                        // Initial state setup
                        if (inputElement.tagName === "INPUT") {
                            inputElement.readOnly = !checkbox.checked;
                        } else if (inputElement.tagName === "SELECT") {
                            inputElement.disabled = !checkbox.checked;
                        }
                        
                        // Style based on checkbox state
                        updateInputStyle(inputElement, checkbox.checked);
                        
                        // Add event listener for checkbox state changes
                        checkbox.addEventListener("change", function() {
                            if (inputElement.tagName === "INPUT") {
                                inputElement.readOnly = !this.checked;
                            } else if (inputElement.tagName === "SELECT") {
                                inputElement.disabled = !this.checked;
                            }
                            updateInputStyle(inputElement, this.checked);
                        });
                    });
                }
                
                // Helper function to update input styles based on checkbox state
                function updateInputStyle(inputElement, isChecked) {
                    if (!isChecked) {
                        inputElement.style.backgroundColor = "var(--vscode-input-disabledBackground, #e9e9e9)";
                        inputElement.style.color = "var(--vscode-input-disabledForeground, #999)";
                        inputElement.style.opacity = "0.8";
                    } else {
                        inputElement.style.backgroundColor = "var(--vscode-input-background)";
                        inputElement.style.color = "var(--vscode-input-foreground)";
                        inputElement.style.opacity = "1";
                    }
                }
                
                // Call the function when DOM is fully loaded
                window.addEventListener("DOMContentLoaded", function() {
                    // Initialize the behavior for all checkboxes
                    initializeToggleEditableBehavior();
                });

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

                // Update the toggleEditable function to ensure consistent behavior across all tabs and views
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

                // Apply the toggleEditable function to checkboxes in the Settings tab
                const settingsCheckboxes = document.querySelectorAll('.setting-checkbox');
                settingsCheckboxes.forEach(checkbox => {
                    const inputId = checkbox.getAttribute('data-prop');
                    toggleEditable(checkbox.id, inputId);
                });

                // Apply the toggleEditable function to checkboxes in the Properties tab table view
                const tableCheckboxes = document.querySelectorAll('.prop-checkbox');
                tableCheckboxes.forEach(checkbox => {
                    const inputId = checkbox.getAttribute('data-prop');
                    toggleEditable(checkbox.id, inputId);
                });

                // Ensure consistent behavior for checkboxes in Settings and Properties tabs
                window.addEventListener("DOMContentLoaded", () => {
                    // Apply toggleEditable to Settings tab checkboxes
                    document.querySelectorAll(".setting-checkbox").forEach(checkbox => {
                        const inputId = checkbox.getAttribute("data-prop");
                        toggleEditable(checkbox.id, inputId);
                    });

                    // Apply toggleEditable to Properties tab table view checkboxes
                    document.querySelectorAll(".prop-checkbox").forEach(checkbox => {
                        const inputId = checkbox.getAttribute("data-prop");
                        toggleEditable(checkbox.id, inputId);
                    });
                });

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
                            name: objectName,
                            props: updatedProps
                        }
                    });
                });
            })();
        </script>`;
}

module.exports = {
    generateDetailsView
};
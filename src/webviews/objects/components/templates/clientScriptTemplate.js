"use strict";

/**
 * Generates client-side JavaScript for the details view
 * @param {Array} props The property items array 
 * @param {Object} propItemsSchema Schema for property items
 * @param {string} objectName The name of the object for display and messaging
 * @returns {string} HTML script tag with JavaScript
 */
function getClientScriptTemplate(props, propItemsSchema, objectName) {
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

                // Helper function to get property modal HTML
                function getPropertyModalHtml() {
                    ${getPropertyModalHtml.toString().replace(/^function getPropertyModalHtml\(\) \{|\}$/g, '')}
                }

                ${getPropertyModalFunctionality()}

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

                // Function to add a new property
                function addNewProperty(propName) {
                    // Create new property object
                    const newProp = { name: propName };
                    
                    // Add to properties array
                    props.push(newProp);
                    
                    // Add to properties list in list view
                    const propsList = document.getElementById("propsList");
                    const option = document.createElement("option");
                    option.value = props.length - 1;
                    option.textContent = propName;
                    propsList.appendChild(option);
                    
                    // Add to table in table view
                    const tableBody = document.querySelector("#propsTable tbody");
                    const row = document.createElement("tr");
                    row.setAttribute("data-index", props.length - 1);
                    
                    // Create cells for each property column
                    propColumns.forEach(propKey => {
                        const cell = document.createElement("td");
                        
                        if (propKey === "name") {
                            cell.innerHTML = '<span class="prop-name">' + propName + '</span>' +
                                '<input type="hidden" name="name" value="' + propName + '">';
                        } else {
                            const propSchema = propItemsSchema[propKey] || {};
                            const hasEnum = propSchema.enum && Array.isArray(propSchema.enum);
                            const isBooleanEnum = hasEnum && propSchema.enum.length === 2 && 
                                propSchema.enum.every(val => val === true || val === false || val === "true" || val === "false");
                            
                            const tooltip = propSchema.description ? 'title="' + propSchema.description + '"' : "";
                            
                            let inputHTML = "";
                            if (hasEnum) {
                                inputHTML = '<select name="' + propKey + '" ' + tooltip + ' disabled>';
                                
                                // Create options
                                propSchema.enum.forEach(option => {
                                    const isSelected = isBooleanEnum ? 
                                        (option === false || option === "false") : false;
                                    
                                    inputHTML += '<option value="' + option + '" ' + 
                                        (isSelected ? "selected" : "") + '>' + option + '</option>';
                                });
                                
                                inputHTML += '</select>';
                            } else {
                                inputHTML = '<input type="text" name="' + propKey + '" value="" ' + tooltip + ' readonly>';
                            }
                            
                            cell.innerHTML = '<div class="control-with-checkbox">' +
                                inputHTML +
                                '<input type="checkbox" class="prop-checkbox" data-prop="' + propKey + 
                                '" data-index="' + (props.length - 1) + '" title="Toggle property existence">' +
                                '</div>';
                        }
                        
                        row.appendChild(cell);
                    });
                    
                    tableBody.appendChild(row);
                    
                    // Initialize checkbox behavior for the new row
                    initializeCheckboxBehaviorForRow(row);
                }
                
                // Initialize checkbox behavior for a table row
                function initializeCheckboxBehaviorForRow(row) {
                    row.querySelectorAll(".prop-checkbox").forEach(checkbox => {
                        const tableCell = checkbox.closest("td");
                        if (!tableCell) return;
                        
                        const inputElement = tableCell.querySelector("input[type='text'], select");
                        if (!inputElement) return;
                        
                        if (inputElement.tagName === "INPUT") {
                            inputElement.readOnly = !checkbox.checked;
                        } else if (inputElement.tagName === "SELECT") {
                            inputElement.disabled = !checkbox.checked;
                        }
                        
                        updateInputStyle(inputElement, checkbox.checked);
                        
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
                    
                    // Initialize the behavior for all checkboxes
                    initializeToggleEditableBehavior();
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

                // Add Property button click handler
                document.getElementById("addProp").addEventListener("click", function() {
                    // Call the function to create and show the modal
                    createPropertyModal();
                });

                // Save Properties button click handler
                document.getElementById("saveProps")?.addEventListener("click", function() {
                    // Get all property data from the table
                    const updatedProps = [];
                    const rows = document.querySelectorAll("#propsTable tbody tr");
                    
                    rows.forEach(row => {
                        const index = parseInt(row.getAttribute("data-index"));
                        const prop = { ...props[index] }; // Start with existing prop data
                        
                        // Update with values from the form
                        propColumns.forEach(propKey => {
                            const input = row.querySelector('[name="' + propKey + '"]');
                            const checkbox = row.querySelector('.prop-checkbox[data-prop="' + propKey + '"]');
                            
                            if (propKey === "name") {
                                // Name is always required
                                prop.name = input ? input.value : prop.name;
                            } else if (checkbox && checkbox.checked && input) {
                                // Only include property if its checkbox is checked
                                prop[propKey] = input.value;
                            } else if (checkbox && !checkbox.checked) {
                                // Remove property if checkbox is unchecked
                                delete prop[propKey];
                            }
                        });
                        
                        updatedProps.push(prop);
                    });
                    
                    // Send updated properties to the extension
                    vscode.postMessage({
                        command: "save",
                        data: {
                            name: objectName,
                            props: updatedProps
                        }
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

// Import required templates
const { getPropertyModalHtml } = require("./propertyModalTemplate");
const { getPropertyModalFunctionality } = require("./propertyModalFunctionality");

module.exports = {
    getClientScriptTemplate
};
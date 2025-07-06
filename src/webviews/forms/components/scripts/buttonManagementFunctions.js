"use strict";

/**
 * File: buttonManagementFunctions.js
 * Purpose: Button management functions for the forms detail view
 * Created: 2025-07-06
 */

/**
 * Gets button management functions for the forms detail view
 * @returns {string} JavaScript code for button management
 */
function getButtonManagementFunctions() {
    return `
    // Button tab functionality and management functions
function initializeButtonTabFunctionality() {
    // Initialize buttons view state
    let buttonsViewType = 'table'; // Default to table view
    const buttonsTableView = document.getElementById('buttons-table-view');
    const buttonsListView = document.getElementById('buttons-list-view');
    
    // View type switcher for buttons
    const buttonsViewSwitcher = document.getElementById('buttons-view-switcher');
    if (buttonsViewSwitcher) {
        buttonsViewSwitcher.addEventListener('change', function() {
            const viewType = this.value;
            buttonsViewType = viewType;
            
            if (viewType === 'table') {
                if (buttonsTableView) {
                    buttonsTableView.style.display = 'block';
                }
                if (buttonsListView) {
                    buttonsListView.style.display = 'none';
                }
            } else {
                if (buttonsTableView) {
                    buttonsTableView.style.display = 'none';
                }
                if (buttonsListView) {
                    buttonsListView.style.display = 'block';
                }
            }
        });
    }
    
    // Button list functionality
    const buttonsList = document.getElementById('buttonsList');
    const buttonDetailsContainer = document.getElementById('buttonDetailsContainer');
    
    if (buttonsList && buttonDetailsContainer) {
        buttonsList.addEventListener('change', (event) => {
            const selectedIndex = event.target.value;
            const button = currentButtons[selectedIndex];
            
            // Show button details container when an item is selected
            buttonDetailsContainer.style.display = 'block';
            
            // Update form fields with button values
            Object.keys(buttonSchemaProps).forEach(buttonKey => {
                if (buttonKey === 'buttonName') {
                    return; // Skip name field as it's in the list
                }
                
                const fieldId = 'button' + buttonKey;
                const field = document.getElementById(fieldId);
                const checkbox = document.getElementById(fieldId + 'Editable');
                
                if (field && checkbox) {
                    // Check if property exists and is not null or undefined
                    const propertyExists = button.hasOwnProperty(buttonKey) && button[buttonKey] !== null && button[buttonKey] !== undefined;
                    
                    if (field.tagName === 'SELECT') {
                        if (propertyExists) {
                            // If property exists, use its value
                            field.value = button[buttonKey];
                        } else {
                            // If property doesn't exist, use default value logic
                            const schema = buttonSchemaProps[buttonKey] || {};
                            if (schema.default !== undefined) {
                                // Use the schema's default value if available
                                field.value = schema.default;
                            } else {
                                // Otherwise, leave the default that was set in the HTML template
                                // The template already handles boolean enums and first-option defaults
                            }
                        }
                        field.disabled = !propertyExists;
                    } else {
                        field.value = propertyExists ? button[buttonKey] : '';
                        field.readOnly = !propertyExists;
                    }
                    
                    checkbox.checked = propertyExists;
                    
                    // If the property exists, disable the checkbox to prevent unchecking
                    if (propertyExists) {
                        checkbox.disabled = true;
                        checkbox.setAttribute('data-originally-checked', 'true');
                    } else {
                        checkbox.disabled = false;
                        checkbox.removeAttribute('data-originally-checked');
                    }
                }
            });
        });
    }
}

// Button checkbox functionality
function initializeButtonCheckboxes() {
    document.querySelectorAll('.button-checkbox').forEach(checkbox => {
        const propName = checkbox.getAttribute('data-prop');
        const index = checkbox.getAttribute('data-index');
        
        // Find the input element within the same table cell
        const tableCell = checkbox.closest('td');
        if (!tableCell) {
            return;
        }
        
        const inputElement = tableCell.querySelector('input[type="text"], select');
        if (!inputElement) {
            return;
        }
        
        // Set initial state
        if (inputElement.tagName === 'INPUT') {
            inputElement.readOnly = !checkbox.checked;
        } else if (inputElement.tagName === 'SELECT') {
            inputElement.disabled = !checkbox.checked;
        }
        
        updateInputStyle(inputElement, checkbox.checked);
        
        checkbox.addEventListener('change', function() {
            // Don't allow unchecking of properties that already exist in the model
            if (this.hasAttribute('data-originally-checked')) {
                this.checked = true;
                return;
            }
            
            if (this.checked) {
                // Enable the input field
                if (inputElement.tagName === 'INPUT') {
                    inputElement.readOnly = false;
                } else if (inputElement.tagName === 'SELECT') {
                    inputElement.disabled = false;
                }
                updateInputStyle(inputElement, true);
                
                // Disable the checkbox to prevent unchecking
                this.disabled = true;
                this.setAttribute('data-originally-checked', 'true');
                
                // If the checkbox is checked, ensure we have a valid value for select elements
                if (inputElement.tagName === 'SELECT' && (!inputElement.value || inputElement.value === '')) {
                    const propKey = this.getAttribute('data-prop');
                    const schema = buttonSchemaProps[propKey] || {};
                    
                    // If schema has a default value, use it
                    if (schema && schema.default !== undefined) {
                        inputElement.value = schema.default;
                    } 
                    // Otherwise, select the first option
                    else if (inputElement.options.length > 0) {
                        inputElement.value = inputElement.options[0].value;
                    }
                }
            } else {
                // Disable the input field
                if (inputElement.tagName === 'INPUT') {
                    inputElement.readOnly = true;
                } else if (inputElement.tagName === 'SELECT') {
                    inputElement.disabled = true;
                }
                updateInputStyle(inputElement, false);
            }
            
            // Send message to update the model
            vscode.postMessage({
                command: 'updateButton',
                data: {
                    index: parseInt(index),
                    property: propName,
                    exists: this.checked,
                    value: this.checked ? inputElement.value : null
                }
            });
        });
    });
}

// Button table input change handlers
function initializeButtonTableInputs() {
    document.querySelectorAll('#buttons-table input[type="text"], #buttons-table select').forEach(input => {
        const updateButton = () => {
            const tableCell = input.closest('td');
            if (!tableCell) {
                return;
            }
            
            const checkbox = tableCell.querySelector('.button-checkbox');
            if (!checkbox || !checkbox.checked) {
                return;
            }
            
            const propName = checkbox.getAttribute('data-prop');
            const index = checkbox.getAttribute('data-index');
            
            // Send message to update the model
            vscode.postMessage({
                command: 'updateButton',
                data: {
                    index: parseInt(index),
                    property: propName,
                    exists: true,
                    value: input.value
                }
            });
        };
        
        if (input.tagName === 'SELECT') {
            input.addEventListener('change', updateButton);
        } else {
            input.addEventListener('input', updateButton);
            input.addEventListener('change', updateButton);
        }
    });
}

// Button CRUD operations
function initializeButtonCrudOperations() {
    // Handle button edit events
    document.querySelectorAll('.edit-button').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            if (!index) {
                return;
            }
            
            currentEditingIndex = parseInt(index);
            
            // Get the button data for editing
            const buttonData = currentButtons[currentEditingIndex];
            if (!buttonData) {
                return;
            }
            
            // Populate the form fields in the edit modal
            Object.keys(buttonData).forEach(key => {
                const input = document.getElementById("button-" + key);
                if (input) {
                    input.value = buttonData[key];
                    
                    // Check the toggle checkbox
                    const toggleCheckbox = document.getElementById("button-" + key + "-toggle");
                    if (toggleCheckbox) {
                        toggleCheckbox.checked = true;
                    }
                }
            });
            
            // Open the modal
            openModal('button-modal');
        });
    });
    
    // Handle button copy events
    document.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            if (!index) {
                return;
            }
            
            vscode.postMessage({
                command: 'copyButton',
                data: { index: parseInt(index) }
            });
        });
    });
    
    // Handle button move-up and move-down events
    document.querySelectorAll('.move-up-button').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            if (!index) {
                return;
            }
            
            vscode.postMessage({
                command: 'moveButton',
                data: { 
                    index: parseInt(index),
                    direction: 'up'
                }
            });
        });
    });
    
    document.querySelectorAll('.move-down-button').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            if (!index) {
                return;
            }
            
            vscode.postMessage({
                command: 'moveButton',
                data: { 
                    index: parseInt(index),
                    direction: 'down'
                }
            });
        });
    });
}

// Button action buttons
function initializeButtonActionButtons() {
    // Button add and reverse buttons event handlers
    document.getElementById('add-button-btn')?.addEventListener('click', () => {
        vscode.postMessage({
            command: 'addButton'
        });
    });
    
    document.getElementById('reverse-buttons-btn')?.addEventListener('click', () => {
        vscode.postMessage({
            command: 'reverseButton'
        });
    });
    
    // Button save functionality
    document.getElementById('save-button')?.addEventListener('click', function() {
        const updatedButton = {};
        
        // Get all toggle checkboxes in the form
        document.querySelectorAll('#button-form .property-toggle').forEach(checkbox => {
            const property = checkbox.getAttribute('data-property');
            if (property && checkbox.checked) {
                const input = document.getElementById("button-" + property);
                if (input) {
                    updatedButton[property] = input.value;
                }
            }
        });
        
        // Ensure we have a valid index
        if (currentEditingIndex >= 0) {
            // Send updated button data
            vscode.postMessage({
                command: 'updateButton',
                data: {
                    index: currentEditingIndex,
                    button: updatedButton
                }
            });
            
            // Close the modal
            closeModal('button-modal');
            currentEditingIndex = -1;
        }
    });
    
    // Button cancel functionality
    document.getElementById('cancel-button')?.addEventListener('click', function() {
        closeModal('button-modal');
        currentEditingIndex = -1;
    });
}

// Button field generator
function generateButtonFields(button) {
    const fieldsContainer = document.getElementById('button-fields-container');
    const buttonSchemaProps = window.buttonSchemaProps || {};
    
    Object.entries(buttonSchemaProps).sort((a, b) => a[0].localeCompare(b[0])).forEach(([propName, schema]) => {
        const value = button[propName] || '';
        const hasEnum = schema.enum && Array.isArray(schema.enum);
        
        const fieldHtml = document.createElement('div');
        fieldHtml.className = 'form-row';
        
        const label = document.createElement('label');
        label.setAttribute('for', 'button-' + propName);
        if (schema.description) {
            label.setAttribute('title', schema.description);
        }
        label.textContent = formatPropertyLabel(propName) + ':';
        fieldHtml.appendChild(label);
        
        let input;
        if (hasEnum) {
            input = document.createElement('select');
            schema.enum.forEach(option => {
                const optionEl = document.createElement('option');
                optionEl.value = option;
                optionEl.textContent = option;
                if (value === option) {
                    optionEl.selected = true;
                }
                input.appendChild(optionEl);
            });
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.value = value;
        }
        
        input.id = 'button-' + propName;
        input.name = propName;
        if (schema.description) {
            input.setAttribute('title', schema.description);
        }
        
        fieldHtml.appendChild(input);
        fieldsContainer.appendChild(fieldHtml);
    });
}
    `;
}

module.exports = {
    getButtonManagementFunctions
};

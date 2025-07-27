"use strict";

/**
 * File: buttonManagementFunctions.js
 * Purpose: Provides functions for managing buttons in the report details view
 * Created: 2025-07-06
 */

/**
 * Provides functions for managing buttons in the report details view
 * @returns {string} JavaScript code as a string for button management
 */
function getButtonManagementFunctions() {
    return `
    // --- BUTTONS TAB FUNCTIONALITY ---
    // Button checkbox functionality similar to properties tab
    document.querySelectorAll('.button-checkbox').forEach(checkbox => {
        const propName = checkbox.getAttribute('data-prop');
        const index = checkbox.getAttribute('data-index');
        
        // Find the input element within the same table cell
        const tableCell = checkbox.closest('td');
        if (!tableCell) return;
        
        const inputElement = tableCell.querySelector('input[type="text"], select');
        if (!inputElement) return;
        
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
                    // For select elements with no value, select the first option
                    if (inputElement.options.length > 0) {
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
            
            // Update the local currentButtons array
            const buttonIndex = parseInt(index);
            if (this.checked) {
                // Add or update the property in the local array
                currentButtons[buttonIndex][propName] = inputElement.value;
            } else {
                // Remove the property from the local array
                delete currentButtons[buttonIndex][propName];
            }
        });
    });
    
    // Handle input changes for buttons table
    document.querySelectorAll('#buttons-table input[type="text"], #buttons-table select').forEach(input => {
        const updateButton = () => {
            const tableCell = input.closest('td');
            if (!tableCell) return;
            
            const checkbox = tableCell.querySelector('.button-checkbox');
            if (!checkbox || !checkbox.checked) return;
            
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
            
            // Update the local currentButtons array
            const buttonIndex = parseInt(index);
            currentButtons[buttonIndex][propName] = input.value;
        };
        
        if (input.tagName === 'SELECT') {
            input.addEventListener('change', updateButton);
        } else {
            input.addEventListener('input', updateButton);
            input.addEventListener('change', updateButton);
        }
    });

    // Button list change handler for list view
    const buttonsList = document.getElementById('buttonsList');
    const buttonDetailsContainer = document.getElementById('buttonDetailsContainer');
    if (buttonsList && buttonDetailsContainer) {
        buttonsList.addEventListener('change', (event) => {
            const selectedIndex = event.target.value;
            const button = currentButtons[selectedIndex];

            // Show button details container when an item is selected
            buttonDetailsContainer.style.display = 'block';

            // Update form fields with button values
            Object.keys(buttonSchema).forEach(buttonKey => {
                if (buttonKey === 'buttonName') return; // Skip buttonName field as it's in the list
                
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
                            const schema = buttonSchema[buttonKey] || {};
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
                    
                    updateInputStyle(field, checkbox.checked);
                }
            });
        });
        
        // Initialize toggle editable behavior for button list view form fields
        Object.keys(buttonSchema).forEach(buttonKey => {
            if (buttonKey === 'buttonName') return;
            
            const fieldId = 'button' + buttonKey;
            const field = document.getElementById(fieldId);
            const checkbox = document.getElementById(fieldId + 'Editable');
            
            if (field && checkbox) {
                // Set initial state
                updateInputStyle(field, checkbox.checked);
                
                // Add event listener for checkbox state changes
                checkbox.addEventListener('change', function() {
                    // Get the currently selected button index
                    const selectedIndex = buttonsList.value;
                    if (selectedIndex === '') return;
                    
                    if (field.tagName === 'INPUT') {
                        field.readOnly = !this.checked;
                    } else if (field.tagName === 'SELECT') {
                        field.disabled = !this.checked;
                    }
                    updateInputStyle(field, this.checked);
                    
                    // Disable the checkbox if it's checked to prevent unchecking
                    if (this.checked) {
                        this.disabled = true;
                        this.setAttribute('data-originally-checked', 'true');
                        
                        // If this is a select element, make sure it has a valid value
                        if (field.tagName === 'SELECT' && (!field.value || field.value === '')) {
                            if (field.options.length > 0) {
                                field.value = field.options[0].value;
                            }
                        }
                    }
                    
                    // Send message to update the model
                    vscode.postMessage({
                        command: 'updateButton',
                        data: {
                            index: parseInt(selectedIndex),
                            property: buttonKey,
                            exists: this.checked,
                            value: this.checked ? field.value : null
                        }
                    });
                    
                    // Update the local currentButtons array
                    const currentButtonIndex = parseInt(selectedIndex);
                    if (this.checked) {
                        // Add or update the property in the local array
                        currentButtons[currentButtonIndex][buttonKey] = field.value;
                    } else {
                        // Remove the property from the local array
                        delete currentButtons[currentButtonIndex][buttonKey];
                    }
                });
                
                // Update model when input value changes
                const updateInputHandler = function() {
                    const selectedIndex = buttonsList.value;
                    if (selectedIndex === '' || !checkbox.checked) return;
                    
                    // Send message to update the model
                    vscode.postMessage({
                        command: 'updateButton',
                        data: {
                            index: parseInt(selectedIndex),
                            property: buttonKey,
                            exists: true,
                            value: field.value
                        }
                    });
                    
                    // Update the local currentButtons array
                    const currentButtonIndex = parseInt(selectedIndex);
                    currentButtons[currentButtonIndex][buttonKey] = field.value;
                };
                
                if (field.tagName === 'SELECT') {
                    field.addEventListener('change', updateInputHandler);
                } else {
                    field.addEventListener('input', updateInputHandler);
                    field.addEventListener('change', updateInputHandler);
                }
            }
        });
    }

    // Function to add a new button to the report
    function addNewButton(buttonName) {
        const newButton = {
            buttonName: buttonName,
            buttonType: 'other'
        };
                    
        const buttonText = generateButtonText(buttonName);
        newButton.buttonText = buttonText;

        // If buttonText starts with 'Add' then its an 'add' button type
        if (buttonText.startsWith('Add')) {
            newButton.buttonType = 'add';
        }
        
        // Add to current buttons array for immediate backend update
        const updatedButtons = [...currentButtons, newButton];
        
        // Get the currently active tab to preserve it after reload
        const activeTab = document.querySelector('.tab.active');
        const currentTabId = activeTab ? activeTab.getAttribute('data-tab') : 'buttons';
        
        // Send message to update the model - backend will reload the view
        vscode.postMessage({
            command: 'updateModel',
            data: {
                buttons: updatedButtons,
                preserveTab: currentTabId
            }
        });
        
        // Note: View will be automatically reloaded by backend after model update
        // No need to update frontend UI here - backend will regenerate entire view
    }
    `;
}

module.exports = {
    getButtonManagementFunctions
};

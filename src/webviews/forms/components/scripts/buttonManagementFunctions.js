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
    // --- BUTTONS TAB FUNCTIONALITY ---
    
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
                };
                
                if (field.tagName === 'SELECT') {
                    field.addEventListener('change', updateInputHandler);
                } else {
                    field.addEventListener('input', updateInputHandler);
                    field.addEventListener('change', updateInputHandler);
                }
            }
        });
        
        // Initialize buttonsList - hide details if no button is selected
        if (buttonsList && buttonDetailsContainer && (!buttonsList.value || buttonsList.value === "")) {
            buttonDetailsContainer.style.display = 'none';
        }
    }

    // Button list view button handlers
    function initializeButtonListButtons() {
        const buttonsList = document.getElementById('buttonsList');
        
        // Handle copy, move up/down, and reverse buttons for buttons
        document.getElementById('copyButtonButton')?.addEventListener('click', () => {
            if (!buttonsList.value) {
                return;
            }
            
            const selectedIndex = parseInt(buttonsList.value);
            vscode.postMessage({
                command: 'copyButton',
                index: selectedIndex
            });
        });
        
        document.getElementById('moveUpButtonButton')?.addEventListener('click', () => {
            if (!buttonsList.value) {
                return;
            }
            
            const selectedIndex = parseInt(buttonsList.value);
            if (selectedIndex > 0) {
                vscode.postMessage({
                    command: 'moveButton',
                    fromIndex: selectedIndex,
                    toIndex: selectedIndex - 1
                });
            }
        });
        
        document.getElementById('moveDownButtonButton')?.addEventListener('click', () => {
            if (!buttonsList.value) {
                return;
            }
            
            const selectedIndex = parseInt(buttonsList.value);
            if (selectedIndex < currentButtons.length - 1) {
                vscode.postMessage({
                    command: 'moveButton',
                    fromIndex: selectedIndex,
                    toIndex: selectedIndex + 1
                });
            }
        });
        
        document.getElementById('reverseButtonsButton')?.addEventListener('click', () => {
            vscode.postMessage({
                command: 'reverseButtons'
            });
        });
    }
    
    // Button tab functionality
    function initializeButtonTabFunctionality() {
        // Set up view switching for the buttons tab
        const buttonsListViewIcon = document.querySelector('.view-icons[data-tab="buttons"] .list-icon');
        const buttonsTableViewIcon = document.querySelector('.view-icons[data-tab="buttons"] .table-icon');
        const buttonsListView = document.getElementById('buttons-list-view');
        const buttonsTableView = document.getElementById('buttons-table-view');
        
        if (buttonsListViewIcon && buttonsTableViewIcon) {
            // List view button
            buttonsListViewIcon.addEventListener('click', () => {
                buttonsTableViewIcon.classList.remove('active');
                buttonsListViewIcon.classList.add('active');
                buttonsTableView.classList.remove('active');
                buttonsListView.classList.add('active');
            });
            
            // Table view button
            buttonsTableViewIcon.addEventListener('click', () => {
                buttonsListViewIcon.classList.remove('active');
                buttonsTableViewIcon.classList.add('active');
                buttonsListView.classList.remove('active');
                buttonsTableView.classList.add('active');
            });
        }
        
        // Initialize button list view buttons
        initializeButtonListButtons();
    }
    
    // Initialize all button functionality
    initializeButtonTabFunctionality();
    `;
}

module.exports = {
    getButtonManagementFunctions
};

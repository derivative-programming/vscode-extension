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
                
                // Handle browse button state for destinationTargetName field
                if (propName === 'destinationTargetName') {
                    const browseButton = tableCell.querySelector('.lookup-button');
                    if (browseButton) {
                        browseButton.disabled = false;
                    }
                }
                
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
                
                // Handle browse button state for destinationTargetName field
                if (propName === 'destinationTargetName') {
                    const browseButton = tableCell.querySelector('.lookup-button');
                    if (browseButton) {
                        browseButton.disabled = true;
                    }
                }
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
                    
                    // Handle browse button state for destinationTargetName field in list view
                    if (buttonKey === 'destinationTargetName') {
                        const controlContainer = field.parentElement;
                        if (controlContainer && controlContainer.classList.contains('control-with-button')) {
                            const browseButton = controlContainer.querySelector('.lookup-button');
                            if (browseButton) {
                                browseButton.disabled = !propertyExists;
                            }
                        }
                    }
                    
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
                    
                    // Handle browse button state for destinationTargetName field in list view
                    if (buttonKey === 'destinationTargetName') {
                        const controlContainer = field.parentElement;
                        if (controlContainer && controlContainer.classList.contains('control-with-button')) {
                            const browseButton = controlContainer.querySelector('.lookup-button');
                            if (browseButton) {
                                browseButton.disabled = !this.checked;
                            }
                        }
                    }
                    
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

    // Add button button click handler
    document.getElementById('add-button-btn').addEventListener('click', function() {
        // Use the new add button modal instead of the edit modal
        createAddButtonModal();
    });

    // Function to add a new button to the report (called from add button modal)
    function addNewButton(buttonName) {
        // Send message to add a new button with the specified name
        vscode.postMessage({
            command: 'addButtonWithName',
            data: {
                name: buttonName
            }
        });
        
        // Note: UI will be automatically updated by the refreshButtonsList message
        // which will select the newly added button
    }

    // Function to create and show the Add Button modal
    let buttonModalCreationInProgress = false;
    function createAddButtonModal() {
        console.log('[DEBUG] createAddButtonModal called');
        
        // Prevent multiple simultaneous modal creation
        if (buttonModalCreationInProgress) {
            console.log('[DEBUG] Button modal creation already in progress, ignoring duplicate call');
            return;
        }
        buttonModalCreationInProgress = true;
        
        // Check if modal already exists and clean up any existing modals first
        const existingModals = document.querySelectorAll('.modal');
        console.log('[DEBUG] Existing modals before button modal creation:', existingModals.length);
        if (existingModals.length > 0) {
            console.log('[DEBUG] Cleaning up existing modals');
            existingModals.forEach((existingModal, index) => {
                try {
                    if (existingModal.parentNode) {
                        existingModal.parentNode.removeChild(existingModal);
                        console.log('[DEBUG] Removed existing modal', index);
                    }
                } catch (error) {
                    console.error('[ERROR] Failed to remove existing modal', index, ':', error);
                }
            });
        }
        // Create modal dialog for adding buttons
        const modal = document.createElement("div");
        modal.className = "modal";
        
        // Import the modal HTML template (need to create this)
        const modalContent = getAddButtonModalHtml();
        
        // Set the modal content
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);
        
        // Wait for DOM to be ready before attaching event listeners
        setTimeout(() => {
            // Show the modal
            modal.style.display = "flex";
            
            // Attach event listeners after modal is in DOM and visible
            attachButtonModalEventListeners(modal);
            
            // Focus on the button name input when modal opens (single button tab is active by default)
            const buttonNameInput = modal.querySelector("#buttonName");
            if (buttonNameInput) {
                buttonNameInput.focus();
            }
        }, 10);
    }

    // Function to attach event listeners to the button modal
    function attachButtonModalEventListeners(modal) {
        // Tab switching in modal
        modal.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                // Update active tab
                modal.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                // Update visible tab content
                modal.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                    if (content.id === tabId) {
                        content.classList.add('active');
                    }
                });
                
                // Set focus based on which tab is now active
                setTimeout(() => {
                    if (tabId === 'singleAdd') {
                        const buttonNameInput = modal.querySelector("#buttonName");
                        if (buttonNameInput) {
                            buttonNameInput.focus();
                        }
                    } else if (tabId === 'bulkAdd') {
                        const bulkButtonsTextarea = modal.querySelector("#bulkButtons");
                        if (bulkButtonsTextarea) {
                            bulkButtonsTextarea.focus();
                        }
                    }
                }, 10);
            });
        });

        // Close modal when clicking the x button
        modal.querySelector(".close-button").addEventListener("click", function() {
            document.body.removeChild(modal);
            buttonModalCreationInProgress = false; // Reset flag when modal is closed
        });

        // Close modal when clicking outside the modal content
        modal.addEventListener("click", function(event) {
            if (event.target === modal) {
                document.body.removeChild(modal);
                buttonModalCreationInProgress = false; // Reset flag when modal is closed
            }
        });
        
        // Add Enter key handling for single button input
        const buttonNameInput = modal.querySelector("#buttonName");
        if (buttonNameInput) {
            buttonNameInput.addEventListener("keypress", function(event) {
                if (event.key === "Enter") {
                    event.preventDefault(); // Prevent default Enter behavior
                    const addButton = modal.querySelector("#addSingleButton");
                    if (addButton && !addButton.disabled) {
                        addButton.click();
                    }
                }
            });
        }
        
        // Note: No Enter key handling for bulk buttons textarea - users can press Enter to create new lines
        // Users must click the "Add Buttons" button to submit

        // Validate button name function
        function validateButtonName(name) {
            if (!name) {
                return "Button name cannot be empty";
            }
            if (name.length > 100) {
                return "Button name cannot exceed 100 characters";
            }
            if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
                return "Button name must start with a letter and contain only letters and numbers";
            }
            if (currentButtons.some(button => button.buttonName === name)) {
                return "Button with this name already exists";
            }
            return null; // Valid
        }
        
        // Add single button button event listener
        const addButton = modal.querySelector("#addSingleButton");
        if (addButton) {
            console.log('[DEBUG] Add single button button found, attaching event listener');
            addButton.addEventListener("click", function() {
                const buttonName = modal.querySelector("#buttonName").value.trim();
                const errorElement = modal.querySelector("#singleValidationError");
                
                const validationError = validateButtonName(buttonName);
                if (validationError) {
                    errorElement.textContent = validationError;
                    return;
                }
                
                // Clear any previous error
                errorElement.textContent = "";
                
                try {
                    console.log('[DEBUG] Adding new button:', buttonName);
                    
                    // Add the new button - backend will handle selection
                    addNewButton(buttonName);
                    
                    console.log('[DEBUG] Attempting to close button modal');
                    // Close the modal
                    document.body.removeChild(modal);
                    buttonModalCreationInProgress = false; // Reset flag when modal is closed
                    console.log('[DEBUG] Button modal closed successfully');
                } catch (error) {
                    console.error("Error adding button:", error);
                    errorElement.textContent = "Error adding button. Please try again.";
                }
            });
        } else {
            console.error('[ERROR] Add single button button not found in modal');
        }
        
        // Add bulk buttons button event listener
        const bulkAddButton = modal.querySelector("#addBulkButtons");
        if (bulkAddButton) {
            console.log('[DEBUG] Add bulk buttons button found, attaching event listener');
            bulkAddButton.addEventListener("click", function() {
                const bulkButtons = modal.querySelector("#bulkButtons").value;
                const buttonNames = bulkButtons.split("\\n").map(name => name.trim()).filter(name => name);
                const errorElement = modal.querySelector("#bulkValidationError");
                
                // Validate all button names
                const errors = [];
                const validButtons = [];
                
                buttonNames.forEach(name => {
                    const validationError = validateButtonName(name);
                    if (validationError) {
                        errors.push('"' + name + '": ' + validationError);
                    } else {
                        validButtons.push(name);
                    }
                });
                
                if (errors.length > 0) {
                    errorElement.innerHTML = errors.join("<br>");
                    return;
                }
                
                // Clear any previous error
                errorElement.textContent = "";
                
                try {
                    console.log('[DEBUG] Adding bulk buttons:', validButtons);
                    
                    // Add all buttons in sequence (since backend doesn't handle bulk add yet)
                    let currentIndex = 0;
                    function addNextButton() {
                        if (currentIndex < validButtons.length) {
                            addNewButton(validButtons[currentIndex]);
                            currentIndex++;
                            // Add a small delay between additions to ensure proper backend processing
                            setTimeout(addNextButton, 50);
                        }
                    }
                    addNextButton();
                    
                    console.log('[DEBUG] Attempting to close bulk button modal');
                    // Close the modal
                    document.body.removeChild(modal);
                    buttonModalCreationInProgress = false; // Reset flag when modal is closed
                    console.log('[DEBUG] Bulk button modal closed successfully');
                } catch (error) {
                    console.error("Error adding bulk buttons:", error);
                    errorElement.textContent = "Error adding buttons. Please try again.";
                }
            });
        } else {
            console.error('[ERROR] Add bulk buttons button not found in modal');
        }
    }
    `;
}

module.exports = {
    getButtonManagementFunctions
};

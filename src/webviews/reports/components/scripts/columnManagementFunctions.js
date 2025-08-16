"use strict";

/**
 * File: columnManagementFunctions.js
 * Purpose: Provides functions for managing columns in the report details view
 * Created: 2025-07-06
 */

/**
 * Provides functions for managing columns in the report details view
 * @returns {string} JavaScript code as a string for column management
 */
function getColumnManagementFunctions() {
    return `
    // --- COLUMNS FUNCTIONALITY ---
    // Column list change handler for list view
    const columnsList = document.getElementById('columnsList');
    const columnDetailsContainer = document.getElementById('columnDetailsContainer');
    if (columnsList && columnDetailsContainer) {
        columnsList.addEventListener('change', (event) => {
            const selectedIndex = event.target.value;
            const column = currentColumns[selectedIndex];

            // Show column details container when an item is selected
            columnDetailsContainer.style.display = 'block';

            // Update form fields with column values
            Object.keys(columnSchema).forEach(columnKey => {
                if (columnKey === 'name') return; // Skip name field as it's in the list
                
                const fieldId = 'column' + columnKey;
                const field = document.getElementById(fieldId);
                const checkbox = document.getElementById(fieldId + 'Editable');
                
                if (field && checkbox) {
                    // Check if property exists and is not null or undefined
                    const propertyExists = column.hasOwnProperty(columnKey) && column[columnKey] !== null && column[columnKey] !== undefined;
                    
                    if (field.tagName === 'SELECT') {
                        if (propertyExists) {
                            // If property exists, use its value
                            field.value = column[columnKey];
                        } else {
                            // If property doesn't exist, use default value logic
                            const schema = columnSchema[columnKey] || {};
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
                        field.value = propertyExists ? column[columnKey] : '';
                        field.readOnly = !propertyExists;
                    }
                    
                    checkbox.checked = propertyExists;
                    
                    // Handle browse button state for destinationTargetName and sourceObjectName fields in list view
                    if (columnKey === 'destinationTargetName' || columnKey === 'sourceObjectName') {
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
        
        // Initialize toggle editable behavior for column list view form fields
        Object.keys(columnSchema).forEach(columnKey => {
            if (columnKey === 'name') return;
            
            const fieldId = 'column' + columnKey;
            const field = document.getElementById(fieldId);
            const checkbox = document.getElementById(fieldId + 'Editable');
            
            if (field && checkbox) {
                // Set initial state
                updateInputStyle(field, checkbox.checked);
                
                // Add event listener for checkbox state changes
                checkbox.addEventListener('change', function() {
                    if (field.tagName === 'INPUT') {
                        field.readOnly = !this.checked;
                    } else if (field.tagName === 'SELECT') {
                        field.disabled = !this.checked;
                    }
                    updateInputStyle(field, this.checked);
                    
                    // Handle browse button state for destinationTargetName field in list view
                    if (columnKey === 'destinationTargetName') {
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
                        
                        // If the checkbox is checked, ensure we have a valid value
                        if (field.tagName === 'SELECT' && (!field.value || field.value === "")) {
                            // For select elements with no value, select the first option
                            if (field.options.length > 0) {
                                field.selectedIndex = 0;
                            }
                        }
                    }
                    
                    // Update the column in the model when checkbox changes
                    const selectedIndex = columnsList.value;
                    if (selectedIndex !== '' && selectedIndex >= 0) {
                        // Update the local currentColumns array first
                        const currentColumnIndex = parseInt(selectedIndex);
                        if (this.checked) {
                            // Add or update the property in the local array
                            currentColumns[currentColumnIndex][columnKey] = field.value;
                        } else {
                            // Remove the property from the local array
                            delete currentColumns[currentColumnIndex][columnKey];
                        }
                        
                        vscode.postMessage({
                            command: 'updateColumn',
                            data: {
                                index: currentColumnIndex,
                                property: columnKey,
                                exists: this.checked,
                                value: this.checked ? field.value : undefined
                            }
                        });
                    }
                });
                
                // Add event listener for field value changes
                field.addEventListener('input', function() {
                    if (checkbox.checked) {
                        const selectedIndex = columnsList.value;
                        if (selectedIndex !== '' && selectedIndex >= 0) {
                            const currentColumnIndex = parseInt(selectedIndex);
                            
                            // Update the local currentColumns array first
                            currentColumns[currentColumnIndex][columnKey] = this.value;
                            
                            vscode.postMessage({
                                command: 'updateColumn',
                                data: {
                                    index: currentColumnIndex,
                                    property: columnKey,
                                    exists: true,
                                    value: this.value
                                }
                            });
                        }
                    }
                });
                
                // Also listen for change events (e.g., from modal interactions)
                field.addEventListener('change', function() {
                    if (checkbox.checked) {
                        const selectedIndex = columnsList.value;
                        if (selectedIndex !== '' && selectedIndex >= 0) {
                            const currentColumnIndex = parseInt(selectedIndex);
                            
                            // Update the local currentColumns array first
                            currentColumns[currentColumnIndex][columnKey] = this.value;
                            
                            vscode.postMessage({
                                command: 'updateColumn',
                                data: {
                                    index: currentColumnIndex,
                                    property: columnKey,
                                    exists: true,
                                    value: this.value
                                }
                            });
                        }
                    }
                });
            }
        });
    }

    // Column checkbox functionality similar to properties tab
    document.querySelectorAll('.column-checkbox').forEach(checkbox => {
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
                
                // Handle browse button state for destinationTargetName and sourceObjectName fields
                if (propName === 'destinationTargetName' || propName === 'sourceObjectName') {
                    const browseButton = tableCell.querySelector('.lookup-button');
                    if (browseButton) {
                        browseButton.disabled = true;
                    }
                }
            }
            
            // Send message to update the model
            vscode.postMessage({
                command: 'updateColumn',
                data: {
                    index: parseInt(index),
                    property: propName,
                    exists: this.checked,
                    value: this.checked ? inputElement.value : null
                }
            });
            
            // Update the local currentColumns array
            const columnIndex = parseInt(index);
            if (this.checked) {
                // Add or update the property in the local array
                currentColumns[columnIndex][propName] = inputElement.value;
            } else {
                // Remove the property from the local array
                delete currentColumns[columnIndex][propName];
            }
        });
    });
    
    // Handle input changes for columns table
    document.querySelectorAll('#columns-table input[type="text"], #columns-table select').forEach(input => {
        const updateColumn = () => {
            const tableCell = input.closest('td');
            if (!tableCell) return;
            
            const checkbox = tableCell.querySelector('.column-checkbox');
            if (!checkbox || !checkbox.checked) return;
            
            const propName = checkbox.getAttribute('data-prop');
            const index = checkbox.getAttribute('data-index');
            
            // Send message to update the model
            vscode.postMessage({
                command: 'updateColumn',
                data: {
                    index: parseInt(index),
                    property: propName,
                    exists: true,
                    value: input.value
                }
            });
            
            // Update the local currentColumns array
            const columnIndex = parseInt(index);
            currentColumns[columnIndex][propName] = input.value;
        };
        
        if (input.tagName === 'SELECT') {
            input.addEventListener('change', updateColumn);
        } else {
            input.addEventListener('input', updateColumn);
            input.addEventListener('change', updateColumn);
        }
    });

    // Add column button click handler
    document.getElementById('add-column-btn').addEventListener('click', function() {
        console.log('[DEBUG] Add column button clicked');
        // Use the new add column modal instead of the edit modal
        createAddColumnModal();
    });

    // Subscribe to Owner Properties checkbox handler
    const subscribeOwnerCheckbox = document.getElementById('subscribeOwnerProperties');
    if (subscribeOwnerCheckbox) {
        // Initialize checkbox state based on existing propSubscription
        initializeOwnerSubscriptionCheckbox();
        
        subscribeOwnerCheckbox.addEventListener('change', function() {
            handleOwnerSubscriptionToggle(this.checked);
        });
    }

    // Subscribe to Target Child Properties checkbox handler
    const subscribeTargetChildCheckbox = document.getElementById('subscribeTargetChildProperties');
    if (subscribeTargetChildCheckbox) {
        // Initialize checkbox state based on existing propSubscription
        initializeTargetChildSubscriptionCheckbox();
        
        subscribeTargetChildCheckbox.addEventListener('change', function() {
            handleTargetChildSubscriptionToggle(this.checked);
        });
    }

    // Function to initialize the subscription checkbox state
    function initializeOwnerSubscriptionCheckbox() {
        // Send message to get current subscription state
        vscode.postMessage({
            command: 'getOwnerSubscriptionState'
        });
    }

    // Function to initialize the target child subscription checkbox state
    function initializeTargetChildSubscriptionCheckbox() {
        // Send message to get current target child subscription state
        vscode.postMessage({
            command: 'getTargetChildSubscriptionState'
        });
    }

    // Function to handle subscription checkbox toggle
    function handleOwnerSubscriptionToggle(isChecked) {
        console.log('[DEBUG] Owner subscription toggle:', isChecked);
        
        // Send message to update the propSubscription
        vscode.postMessage({
            command: 'updateOwnerSubscription',
            data: {
                isEnabled: isChecked
            }
        });
    }

    // Function to handle target child subscription checkbox toggle
    function handleTargetChildSubscriptionToggle(isChecked) {
        console.log('[DEBUG] Target child subscription toggle:', isChecked);
        
        // Send message to update the target child propSubscription
        vscode.postMessage({
            command: 'updateTargetChildSubscription',
            data: {
                isEnabled: isChecked
            }
        });
    }

    // Function to add a new column (called from add column modal)
    function addNewColumn(columnName) {
        // Send message to add a new column with the specified name
        vscode.postMessage({
            command: 'addColumnWithName',
            data: {
                name: columnName
            }
        });
        
        // Note: UI will be automatically updated by the refreshColumnsList message
        // which will select the newly added column
    }

    // Function to create and show the Add Column modal
    let columnModalCreationInProgress = false;
    function createAddColumnModal() {
        console.log('[DEBUG] createAddColumnModal called');
        
        // Prevent multiple simultaneous modal creation
        if (columnModalCreationInProgress) {
            console.log('[DEBUG] Modal creation already in progress, ignoring duplicate call');
            return;
        }
        columnModalCreationInProgress = true;
        
        // Check if modal already exists and clean up any existing modals first
        const existingModals = document.querySelectorAll('.modal');
        console.log('[DEBUG] Existing modals before creation:', existingModals.length);
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
        
        // Create modal dialog for adding columns
        const modal = document.createElement("div");
        modal.className = "modal";
        console.log('[DEBUG] Created new modal element');
        
        // Import the modal HTML template
        const modalContent = getAddColumnModalHtml();
        
        // Set the modal content
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);
        console.log('[DEBUG] Modal added to DOM');
        
        // Wait for DOM to be ready before attaching event listeners
        setTimeout(() => {
            console.log('[DEBUG] Setting up modal display and event listeners');
            // Show the modal
            modal.style.display = "flex";
            
            // Attach event listeners after modal is in DOM and visible
            attachColumnModalEventListeners(modal);
            
            // Focus on the column name input when modal opens (single column tab is active by default)
            const columnNameInput = modal.querySelector("#columnName");
            if (columnNameInput) {
                columnNameInput.focus();
            }
            
            // Reset the modal creation flag
            columnModalCreationInProgress = false;
        }, 10);
    }

    // Function to attach event listeners to the column modal
    function attachColumnModalEventListeners(modal) {
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
                        const columnNameInput = modal.querySelector("#columnName");
                        if (columnNameInput) {
                            columnNameInput.focus();
                        }
                    } else if (tabId === 'bulkAdd') {
                        const bulkColumnsTextarea = modal.querySelector("#bulkColumns");
                        if (bulkColumnsTextarea) {
                            bulkColumnsTextarea.focus();
                        }
                    }
                }, 10);
            });
        });

        // Close modal when clicking the x button
        const closeButton = modal.querySelector(".close-button");
        if (closeButton) {
            console.log('[DEBUG] Close button found, attaching event listener');
            closeButton.addEventListener("click", function() {
                console.log('[DEBUG] Close button clicked');
                document.body.removeChild(modal);
                columnModalCreationInProgress = false; // Reset flag when modal is closed
            });
        } else {
            console.error('[ERROR] Close button not found in modal');
        }

        // Close modal when clicking outside the modal content
        modal.addEventListener("click", function(event) {
            console.log('[DEBUG] Modal clicked, target:', event.target.className);
            if (event.target === modal) {
                console.log('[DEBUG] Clicked outside modal content, closing');
                document.body.removeChild(modal);
                columnModalCreationInProgress = false; // Reset flag when modal is closed
            }
        });
        
        // Add Enter key handling for single column input
        const columnNameInput = modal.querySelector("#columnName");
        if (columnNameInput) {
            columnNameInput.addEventListener("keypress", function(event) {
                if (event.key === "Enter") {
                    event.preventDefault(); // Prevent default Enter behavior
                    const addButton = modal.querySelector("#addSingleColumn");
                    if (addButton && !addButton.disabled) {
                        addButton.click();
                    }
                }
            });
        }
        
        // Note: No Enter key handling for bulk columns textarea - users can press Enter to create new lines
        // Users must click the "Add Columns" button to submit

        // Validate column name function
        function validateColumnName(name) {
            if (!name) {
                return "Column name cannot be empty";
            }
            if (name.length > 100) {
                return "Column name cannot exceed 100 characters";
            }
            if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
                return "Column name must start with a letter and contain only letters and numbers";
            }
            if (currentColumns.some(column => column.name === name)) {
                return "Column with this name already exists";
            }
            return null; // Valid
        }
        
        // Helper function to generate header text from column name
        function generateHeaderText(columnName) {
            // Convert PascalCase to space-separated words
            // Handle cases like "FirstName" -> "First Name", "AppDNA" -> "App DNA"
            return columnName.replace(/([a-z])([A-Z])/g, '$1 $2')
                            .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
        }
        
        // Add single column button event listener
        const addButton = modal.querySelector("#addSingleColumn");
        if (addButton) {
            console.log('[DEBUG] Add single column button found, attaching event listener');
            addButton.addEventListener("click", function() {
            const columnName = modal.querySelector("#columnName").value.trim();
            const errorElement = modal.querySelector("#singleValidationError");
            
            const validationError = validateColumnName(columnName);
            if (validationError) {
                errorElement.textContent = validationError;
                return;
            }
            
            // Clear any previous error
            errorElement.textContent = "";
            
            // Generate header text from column name
            const headerText = generateHeaderText(columnName);
            
            try {
                console.log('[DEBUG] Adding new column:', columnName);
                
                // Add the new column - backend will refresh the list
                addNewColumn(columnName);
                
                console.log('[DEBUG] Attempting to close modal');
                // Close the modal
                document.body.removeChild(modal);
                columnModalCreationInProgress = false; // Reset flag when modal is closed
                console.log('[DEBUG] Modal closed successfully');
            } catch (error) {
                console.error("Error adding column:", error);
                errorElement.textContent = "Error adding column. Please try again.";
            }
        });
        } else {
            console.error('[ERROR] Add single column button not found in modal');
        }
        
        // Add bulk columns button event listener
        modal.querySelector("#addBulkColumns").addEventListener("click", function() {
            const bulkColumns = modal.querySelector("#bulkColumns").value;
            const columnNames = bulkColumns.split("\\n").map(name => name.trim()).filter(name => name);
            const errorElement = modal.querySelector("#bulkValidationError");
            
            // Validate all column names
            const errors = [];
            const validColumns = [];
            
            columnNames.forEach(name => {
                const validationError = validateColumnName(name);
                if (validationError) {
                    errors.push("\\"" + name + "\\": " + validationError);
                } else {
                    validColumns.push(name);
                }
            });
            
            if (errors.length > 0) {
                errorElement.innerHTML = errors.join("<br>");
                return;
            }
            
            // Clear any previous error
            errorElement.innerHTML = "";
            
            try {
                console.log('[DEBUG] Adding bulk columns:', validColumns);
                
                // Add all valid columns using individual commands
                validColumns.forEach(name => {
                    addNewColumn(name);
                });
                
                // Close the modal
                document.body.removeChild(modal);
            } catch (error) {
                console.error("Error adding columns:", error);
                errorElement.textContent = "Error adding columns. Please try again.";
            }
        });
    }
    `;
}

module.exports = {
    getColumnManagementFunctions
};


"use strict";

/**
 * Generates JavaScript code for client-side functionality
 * @param {Array} columns The report columns
 * @param {Array} buttons The report buttons
 * @param {Array} params The report parameters
 * @param {Object} columnSchema Schema for columns
 * @param {Object} buttonSchema Schema for buttons
 * @param {Object} paramSchema Schema for parameters
 * @param {string} reportName The name of the report
 * @returns {string} JavaScript code
 */
function getClientScriptTemplate(columns, buttons, params, columnSchema, buttonSchema, paramSchema, reportName) {
    return `
        // Store current data
        let currentColumns = ${JSON.stringify(columns)};
        let currentButtons = ${JSON.stringify(buttons)};
        let currentParams = ${JSON.stringify(params)};
        let currentEditingIndex = -1;
        
        // Tab switching functionality
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and content
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                tab.classList.add('active');
                const tabId = tab.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });
          // View switching functionality for each tab
        document.addEventListener('click', (event) => {
            // Check if the clicked element is a view icon
            const iconElement = event.target.closest('.icon');
            if (!iconElement) return;
            
            const view = iconElement.getAttribute('data-view');
            const viewIconsContainer = iconElement.closest('.view-icons');
            const currentTab = viewIconsContainer ? viewIconsContainer.getAttribute('data-tab') : null;
            
            console.log('Switching to view:', view, 'in tab:', currentTab);
            
            if (!currentTab) return;
            
            // Update active state of icons within this tab
            viewIconsContainer.querySelectorAll('.icon').forEach(icon => {
                icon.classList.remove('active');
            });
            iconElement.classList.add('active');
            
            // Hide all views in the current tab
            const currentTabContent = document.getElementById(currentTab);
            if (currentTabContent) {
                currentTabContent.querySelectorAll('.view-content').forEach(content => {
                    content.style.display = 'none';
                    content.classList.remove('active');
                });
                
                // Show selected view in the current tab
                const viewElement = document.getElementById(currentTab + view.charAt(0).toUpperCase() + view.slice(1) + 'View');
                if (viewElement) {
                    viewElement.style.display = 'block';
                    viewElement.classList.add('active');
                    console.log('Activated view:', currentTab + view.charAt(0).toUpperCase() + view.slice(1) + 'View');
                } else {
                    console.error('View not found:', currentTab + view.charAt(0).toUpperCase() + view.slice(1) + 'View');
                }
            }
        });
        
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
        
        // Settings tab functionality
        document.querySelectorAll('.setting-checkbox').forEach(checkbox => {
            const propertyName = checkbox.getAttribute('data-prop');
            const isEnum = checkbox.getAttribute('data-is-enum') === 'true';
            const inputField = document.getElementById('setting-' + propertyName);
            
            // Set initial state of the input field
            if (inputField) {
                if (isEnum) {
                    inputField.disabled = !checkbox.checked;
                } else {
                    inputField.readOnly = !checkbox.checked;
                }
                
                // Set initial styling based on checkbox state
                updateInputStyle(inputField, checkbox.checked);
            }
            
            checkbox.addEventListener('change', function() {
                const propertyName = this.getAttribute('data-prop');
                const isEnum = this.getAttribute('data-is-enum') === 'true';
                const inputField = document.getElementById('setting-' + propertyName);
                
                // Don't allow unchecking of properties that already exist in the model
                if (this.hasAttribute('data-originally-checked')) {
                    this.checked = true;
                    return;
                }
                
                if (this.checked) {
                    // Enable the input field
                    if (isEnum) {
                        inputField.disabled = false;
                    } else {
                        inputField.readOnly = false;
                    }
                    updateInputStyle(inputField, true);
                    
                    // Disable the checkbox to prevent unchecking
                    this.disabled = true;
                    this.setAttribute('data-originally-checked', 'true');
                    
                    // If the checkbox is checked, ensure we have a valid value for select elements
                    if (isEnum && (!inputField.value || inputField.value === '')) {
                        // For select elements with no value, select the first option
                        if (inputField.options.length > 0) {
                            inputField.value = inputField.options[0].value;
                        }
                    }
                } else {
                    // Disable the input field
                    if (isEnum) {
                        inputField.disabled = true;
                    } else {
                        inputField.readOnly = true;
                    }
                    updateInputStyle(inputField, false);
                }
                
                // Send message to update the model
                vscode.postMessage({
                    command: 'updateSettings',
                    data: {
                        property: propertyName,
                        exists: this.checked,
                        value: this.checked ? inputField.value : null
                    }
                });
            });
        });
        
        // Handle input changes for settings
        document.querySelectorAll('[id^="setting-"]').forEach(input => {
            // For select elements, listen for change
            if (input.tagName === 'SELECT') {
                input.addEventListener('change', function() {
                    const propertyName = this.name;
                    const checkbox = this.parentElement.querySelector('.setting-checkbox[data-prop="' + propertyName + '"]');
                    
                    if (checkbox && checkbox.checked) {
                        // Send message to update the model
                        vscode.postMessage({
                            command: 'updateSettings',
                            data: {
                                property: propertyName,
                                exists: true,
                                value: this.value
                            }
                        });
                    }
                });
            } else {
                // For text inputs, listen for both input and change events
                input.addEventListener('input', function() {
                    const propertyName = this.name;
                    const checkbox = this.parentElement.querySelector('.setting-checkbox[data-prop="' + propertyName + '"]');
                    
                    if (checkbox && checkbox.checked) {
                        // Send message to update the model
                        vscode.postMessage({
                            command: 'updateSettings',
                            data: {
                                property: propertyName,
                                exists: true,
                                value: this.value
                            }
                        });
                    }
                });
                
                input.addEventListener('change', function() {
                    const propertyName = this.name;
                    const checkbox = this.parentElement.querySelector('.setting-checkbox[data-prop="' + propertyName + '"]');
                    
                    if (checkbox && checkbox.checked) {
                        // Send message to update the model
                        vscode.postMessage({
                            command: 'updateSettings',
                            data: {
                                property: propertyName,
                                exists: true,
                                value: this.value
                            }
                        });
                    }
                });
            }
        });
        
        // Initialize styling for readonly/disabled inputs
        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('[id^="setting-"]').forEach(input => {
                const isReadOnly = input.readOnly || input.disabled;
                updateInputStyle(input, !isReadOnly);
            });
              // Initialize button list view - hide details if no button is selected
            let buttonsList = document.getElementById('buttonsList');
            let buttonDetailsContainer = document.getElementById('buttonDetailsContainer');
            if (buttonsList && buttonDetailsContainer && (!buttonsList.value || buttonsList.value === "")) {
                buttonDetailsContainer.style.display = 'none';
            }
              // Initialize column list view - hide details if no column is selected
            let columnsList = document.getElementById('columnsList');
            let columnDetailsContainer = document.getElementById('columnDetailsContainer');
            if (columnsList && columnDetailsContainer && (!columnsList.value || columnsList.value === "")) {
                columnDetailsContainer.style.display = 'none';
            }
              // Initialize params list view - hide details if no param is selected
            let paramsList = document.getElementById('paramsList');
            let paramDetailsContainer = document.getElementById('paramDetailsContainer');
            if (paramsList && paramDetailsContainer && (!paramsList.value || paramsList.value === "")) {
                paramDetailsContainer.style.display = 'none';
            }
        });
        
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
            };
            
            if (input.tagName === 'SELECT') {
                input.addEventListener('change', updateButton);
            } else {
                input.addEventListener('input', updateButton);
                input.addEventListener('change', updateButton);
            }
        });
        
        // --- COLUMNS FUNCTIONALITY ---        // Column list change handler for list view
        columnsList = document.getElementById('columnsList');
        columnDetailsContainer = document.getElementById('columnDetailsContainer');
        if (columnsList && columnDetailsContainer) {
            columnsList.addEventListener('change', (event) => {
                const selectedIndex = event.target.value;
                const column = currentColumns[selectedIndex];

                // Show column details container when an item is selected
                columnDetailsContainer.style.display = 'block';

                // Update form fields with column values
                Object.keys(${JSON.stringify(columnSchema)}).forEach(columnKey => {
                    if (columnKey === 'name') return; // Skip name field as it's in the list
                    
                    const fieldId = 'column' + columnKey;
                    const field = document.getElementById(fieldId);
                    const checkbox = document.getElementById(fieldId + 'Editable');
                    
                    if (field && checkbox) {
                        // Check if property exists and is not null or undefined
                        const propertyExists = column.hasOwnProperty(columnKey) && column[columnKey] !== null && column[columnKey] !== undefined;
                        
                        if (field.tagName === 'SELECT') {
                            field.value = propertyExists ? column[columnKey] : '';
                            field.disabled = !propertyExists;
                        } else {
                            field.value = propertyExists ? column[columnKey] : '';
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
            
            // Initialize toggle editable behavior for column list view form fields
            Object.keys(${JSON.stringify(columnSchema)}).forEach(columnKey => {
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
                            vscode.postMessage({
                                command: 'updateColumn',
                                data: {
                                    index: parseInt(selectedIndex),
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
                                vscode.postMessage({
                                    command: 'updateColumn',
                                    data: {
                                        index: parseInt(selectedIndex),
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
                    command: 'updateColumn',
                    data: {
                        index: parseInt(index),
                        property: propName,
                        exists: this.checked,
                        value: this.checked ? inputElement.value : null
                    }
                });
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
            // Reset form and show modal for adding a new column
            document.getElementById('column-form').reset();
            document.querySelector('#column-modal .modal-title').textContent = 'Add Column';
            currentEditingIndex = -1;
            document.getElementById('column-modal').style.display = 'block';
        });
        
        // Edit column button click handlers
        document.querySelectorAll('.edit-column-btn').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                editColumn(index);
            });
        });
        
        // Function to edit a column
        function editColumn(index) {
            const column = currentColumns[index];
            currentEditingIndex = index;
            
            // Reset form and fill with column data
            const form = document.getElementById('column-form');
            form.reset();
            
            // Fill the form with column data
            for (const prop in column) {
                const input = document.getElementById('column-' + prop);
                if (input) {
                    input.value = column[prop] || '';
                }
            }
            
            // Update modal title and show
            document.querySelector('#column-modal .modal-title').textContent = 'Edit Column';
            document.getElementById('column-modal').style.display = 'block';
        }
        
        // Function to save column changes
        function saveColumnChanges() {
            const form = document.getElementById('column-form');
            const newColumn = {};
            
            // Get all input values
            Object.keys(${JSON.stringify(columnSchema)}).forEach(prop => {
                const input = document.getElementById('column-' + prop);
                if (input && input.value) {
                    newColumn[prop] = input.value;
                }
            });
            
            // Ensure required fields are set
            if (!newColumn.name) {
                alert('Column name is required!');
                return;
            }
            
            if (currentEditingIndex >= 0) {
                // Update existing column
                currentColumns[currentEditingIndex] = newColumn;
            } else {
                // Add new column
                currentColumns.push(newColumn);
            }
            
            // Send message to update the model
            vscode.postMessage({
                command: 'updateModel',
                data: {
                    columns: currentColumns
                }
            });
            
            // Close the modal
            document.getElementById('column-modal').style.display = 'none';
        }
          // --- BUTTONS FUNCTIONALITY ---
        // Button list change handler for list view
        buttonsList = document.getElementById('buttonsList');
        buttonDetailsContainer = document.getElementById('buttonDetailsContainer');
        if (buttonsList && buttonDetailsContainer) {
            buttonsList.addEventListener('change', (event) => {
                const selectedIndex = event.target.value;
                const button = currentButtons[selectedIndex];

                // Show button details container when an item is selected
                buttonDetailsContainer.style.display = 'block';

                // Update form fields with button values
                Object.keys(${JSON.stringify(buttonSchema)}).forEach(buttonKey => {
                    if (buttonKey === 'buttonName') return; // Skip buttonName field as it's in the list
                    
                    const fieldId = 'button' + buttonKey;
                    const field = document.getElementById(fieldId);
                    const checkbox = document.getElementById(fieldId + 'Editable');
                    
                    if (field && checkbox) {
                        // Check if property exists and is not null or undefined
                        const propertyExists = button.hasOwnProperty(buttonKey) && button[buttonKey] !== null && button[buttonKey] !== undefined;
                        
                        if (field.tagName === 'SELECT') {
                            field.value = propertyExists ? button[buttonKey] : '';
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
            Object.keys(${JSON.stringify(buttonSchema)}).forEach(buttonKey => {
                if (buttonKey === 'buttonName') return;
                
                const fieldId = 'button' + buttonKey;
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
                        
                        // Update the button in the model when checkbox changes
                        const selectedIndex = buttonsList.value;
                        if (selectedIndex !== '' && selectedIndex >= 0) {
                            vscode.postMessage({
                                command: 'updateButton',
                                data: {
                                    index: parseInt(selectedIndex),
                                    property: buttonKey,
                                    exists: this.checked,
                                    value: this.checked ? field.value : undefined
                                }
                            });
                        }
                    });
                    
                    // Add event listener for field value changes
                    field.addEventListener('input', function() {
                        if (checkbox.checked) {
                            const selectedIndex = buttonsList.value;
                            if (selectedIndex !== '' && selectedIndex >= 0) {
                                vscode.postMessage({
                                    command: 'updateButton',
                                    data: {
                                        index: parseInt(selectedIndex),
                                        property: buttonKey,
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
        
        // Add button button click handler
        document.getElementById('add-button-btn').addEventListener('click', function() {
            // Reset form and show modal for adding a new button
            document.getElementById('button-form').reset();
            document.querySelector('#button-modal .modal-title').textContent = 'Add Button';
            currentEditingIndex = -1;
            document.getElementById('button-modal').style.display = 'block';
        });
        
        // Edit button button click handlers
        document.querySelectorAll('.edit-button-btn').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                editButton(index);
            });
        });
        
        // Function to edit a button
        function editButton(index) {
            const button = currentButtons[index];
            currentEditingIndex = index;
            
            // Reset form and fill with button data
            const form = document.getElementById('button-form');
            form.reset();
            
            // Fill the form with button data
            for (const prop in button) {
                const input = document.getElementById('button-' + prop);
                if (input) {
                    input.value = button[prop] || '';
                }
            }
            
            // Update modal title and show
            document.querySelector('#button-modal .modal-title').textContent = 'Edit Button';
            document.getElementById('button-modal').style.display = 'block';
        }
        
        // Function to save button changes
        function saveButtonChanges() {
            const form = document.getElementById('button-form');
            const newButton = {};
            
            // Get all input values
            Object.keys(${JSON.stringify(buttonSchema)}).forEach(prop => {
                const input = document.getElementById('button-' + prop);
                if (input && input.value) {
                    newButton[prop] = input.value;
                }
            });
            
            // Ensure required fields are set
            if (!newButton.buttonName) {
                alert('Button name is required!');
                return;
            }
            
            if (currentEditingIndex >= 0) {
                // Update existing button
                currentButtons[currentEditingIndex] = newButton;
                
                // Update the corresponding option in the buttons list
                const buttonsList = document.getElementById('buttonsList');
                if (buttonsList) {
                    const option = buttonsList.options[currentEditingIndex];
                    if (option) {
                        option.textContent = newButton.buttonName || newButton.name || 'Unnamed Button';
                    }
                }
            } else {
                // Add new button
                currentButtons.push(newButton);
                
                // Add to buttons list in list view
                const buttonsList = document.getElementById('buttonsList');
                if (buttonsList) {
                    const option = document.createElement('option');
                    option.value = currentButtons.length - 1;
                    option.textContent = newButton.buttonName || newButton.name || 'Unnamed Button';
                    buttonsList.appendChild(option);
                }
            }
            
            // Send message to update the model
            vscode.postMessage({
                command: 'updateModel',
                data: {
                    buttons: currentButtons
                }
            });
            
            // Close the modal
            document.getElementById('button-modal').style.display = 'none';
        }
        
        // --- PARAMETERS FUNCTIONALITY ---        // Parameter list change handler for list view
        paramsList = document.getElementById('paramsList');
        paramDetailsContainer = document.getElementById('paramDetailsContainer');
        if (paramsList && paramDetailsContainer) {
            paramsList.addEventListener('change', (event) => {
                const selectedIndex = event.target.value;
                const param = currentParams[selectedIndex];

                // Show param details container when an item is selected
                paramDetailsContainer.style.display = 'block';

                // Update form fields with param values
                Object.keys(${JSON.stringify(paramSchema)}).forEach(paramKey => {
                    if (paramKey === 'name') return; // Skip name field as it's in the list
                    
                    const fieldId = 'param' + paramKey;
                    const field = document.getElementById(fieldId);
                    const checkbox = document.getElementById(fieldId + 'Editable');
                    
                    if (field && checkbox) {
                        // Check if property exists and is not null or undefined
                        const propertyExists = param.hasOwnProperty(paramKey) && param[paramKey] !== null && param[paramKey] !== undefined;
                        
                        if (field.tagName === 'SELECT') {
                            field.value = propertyExists ? param[paramKey] : '';
                            field.disabled = !propertyExists;
                        } else {
                            field.value = propertyExists ? param[paramKey] : '';
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
            
            // Initialize toggle editable behavior for param list view form fields
            Object.keys(${JSON.stringify(paramSchema)}).forEach(paramKey => {
                if (paramKey === 'name') return;
                
                const fieldId = 'param' + paramKey;
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
                        
                        // Update the param in the model when checkbox changes
                        const selectedIndex = paramsList.value;
                        if (selectedIndex !== '' && selectedIndex >= 0) {
                            vscode.postMessage({
                                command: 'updateParam',
                                data: {
                                    index: parseInt(selectedIndex),
                                    property: paramKey,
                                    exists: this.checked,
                                    value: this.checked ? field.value : undefined
                                }
                            });
                        }
                    });
                    
                    // Add event listener for field value changes
                    field.addEventListener('input', function() {
                        if (checkbox.checked) {
                            const selectedIndex = paramsList.value;
                            if (selectedIndex !== '' && selectedIndex >= 0) {
                                vscode.postMessage({
                                    command: 'updateParam',
                                    data: {
                                        index: parseInt(selectedIndex),
                                        property: paramKey,
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

        // Parameter checkbox functionality for table view similar to properties tab
        document.querySelectorAll('.param-checkbox').forEach(checkbox => {
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
                    command: 'updateParam',
                    data: {
                        index: parseInt(index),
                        property: propName,
                        exists: this.checked,
                        value: this.checked ? inputElement.value : null
                    }
                });
            });
        });
        
        // Handle input changes for params table
        document.querySelectorAll('#params-table input[type="text"], #params-table select').forEach(input => {
            const updateParam = () => {
                const tableCell = input.closest('td');
                if (!tableCell) return;
                
                const checkbox = tableCell.querySelector('.param-checkbox');
                if (!checkbox || !checkbox.checked) return;
                
                const propName = checkbox.getAttribute('data-prop');
                const index = checkbox.getAttribute('data-index');
                
                // Send message to update the model
                vscode.postMessage({
                    command: 'updateParam',
                    data: {
                        index: parseInt(index),
                        property: propName,
                        exists: true,
                        value: input.value
                    }
                });
            };
            
            if (input.tagName === 'SELECT') {
                input.addEventListener('change', updateParam);
            } else {
                input.addEventListener('input', updateParam);
                input.addEventListener('change', updateParam);
            }
        });
        
        // Add parameter button click handler
        document.getElementById('add-param-btn').addEventListener('click', function() {
            // Reset form and show modal for adding a new parameter
            document.getElementById('param-form').reset();
            document.querySelector('#param-modal .modal-title').textContent = 'Add Parameter';
            currentEditingIndex = -1;
            document.getElementById('param-modal').style.display = 'block';
        });
        
        // Edit parameter button click handlers
        document.querySelectorAll('.edit-param-btn').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                editParam(index);
            });
        });
        
        // Function to edit a parameter
        function editParam(index) {
            const param = currentParams[index];
            currentEditingIndex = index;
            
            // Reset form and fill with parameter data
            const form = document.getElementById('param-form');
            form.reset();
            
            // Fill the form with parameter data
            for (const prop in param) {
                const input = document.getElementById('param-' + prop);
                if (input) {
                    input.value = param[prop] || '';
                }
            }
            
            // Update modal title and show
            document.querySelector('#param-modal .modal-title').textContent = 'Edit Parameter';
            document.getElementById('param-modal').style.display = 'block';
        }
        
        // Function to save parameter changes
        function saveParamChanges() {
            const form = document.getElementById('param-form');
            const newParam = {};
            
            // Get all input values
            Object.keys(${JSON.stringify(paramSchema)}).forEach(prop => {
                const input = document.getElementById('param-' + prop);
                if (input && input.value) {
                    newParam[prop] = input.value;
                }
            });
            
            // Ensure required fields are set
            if (!newParam.name) {
                alert('Parameter name is required!');
                return;
            }
            
            if (currentEditingIndex >= 0) {
                // Update existing parameter
                currentParams[currentEditingIndex] = newParam;
            } else {
                // Add new parameter
                currentParams.push(newParam);
            }
            
            // Send message to update the model
            vscode.postMessage({
                command: 'updateModel',
                data: {
                    params: currentParams
                }
            });
            
            // Close the modal
            document.getElementById('param-modal').style.display = 'none';
        }
        // --- COPY FUNCTIONALITY ---
        // Set up copy button functionality for columns list
        const copyColumnsButton = document.getElementById('copyColumnsButton');
        if (copyColumnsButton) {
            copyColumnsButton.addEventListener('click', () => {
                try {
                    // Get all column names from the list
                    const columnsList = document.getElementById('columnsList');
                    if (!columnsList) return;
                    
                    const columnList = [];
                    for (let i = 0; i < columnsList.options.length; i++) {
                        columnList.push(columnsList.options[i].text);
                    }
                    
                    // Create formatted text for copying
                    const textToCopy = columnList.join('\\n');
                    
                    // Copy to clipboard using the modern Clipboard API
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(textToCopy).then(() => {
                            console.log('Columns copied to clipboard');
                            // Provide visual feedback
                            const originalText = copyColumnsButton.textContent;
                            copyColumnsButton.textContent = 'Copied!';
                            setTimeout(() => {
                                copyColumnsButton.textContent = originalText;
                            }, 2000);
                        }).catch(err => {
                            console.error('Failed to copy columns: ', err);
                        });
                    } else {
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = textToCopy;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        
                        // Provide visual feedback
                        const originalText = copyColumnsButton.textContent;
                        copyColumnsButton.textContent = 'Copied!';
                        setTimeout(() => {
                            copyColumnsButton.textContent = originalText;
                        }, 2000);
                    }
                } catch (err) {
                    console.error('Error copying columns: ', err);
                }
            });
        }

        // Set up copy button functionality for buttons list
        const copyButtonsButton = document.getElementById('copyButtonsButton');
        if (copyButtonsButton) {
            copyButtonsButton.addEventListener('click', () => {
                try {
                    // Get all button names from the list
                    const buttonsList = document.getElementById('buttonsList');
                    if (!buttonsList) return;
                    
                    const buttonList = [];
                    for (let i = 0; i < buttonsList.options.length; i++) {
                        buttonList.push(buttonsList.options[i].text);
                    }
                    
                    // Create formatted text for copying
                    const textToCopy = buttonList.join('\\n');
                    
                    // Copy to clipboard using the modern Clipboard API
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(textToCopy).then(() => {
                            console.log('Buttons copied to clipboard');
                            // Provide visual feedback
                            const originalText = copyButtonsButton.textContent;
                            copyButtonsButton.textContent = 'Copied!';
                            setTimeout(() => {
                                copyButtonsButton.textContent = originalText;
                            }, 2000);
                        }).catch(err => {
                            console.error('Failed to copy buttons: ', err);
                        });
                    } else {
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = textToCopy;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        
                        // Provide visual feedback
                        const originalText = copyButtonsButton.textContent;
                        copyButtonsButton.textContent = 'Copied!';
                        setTimeout(() => {
                            copyButtonsButton.textContent = originalText;
                        }, 2000);
                    }
                } catch (err) {
                    console.error('Error copying buttons: ', err);
                }
            });
        }

        // Set up copy button functionality for parameters list
        const copyParamsButton = document.getElementById('copyParamsButton');
        if (copyParamsButton) {
            copyParamsButton.addEventListener('click', () => {
                try {
                    // Get all parameter names from the list
                    const paramsList = document.getElementById('paramsList');
                    if (!paramsList) return;
                    
                    const paramList = [];
                    for (let i = 0; i < paramsList.options.length; i++) {
                        paramList.push(paramsList.options[i].text);
                    }
                    
                    // Create formatted text for copying
                    const textToCopy = paramList.join('\\n');
                    
                    // Copy to clipboard using the modern Clipboard API
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(textToCopy).then(() => {
                            console.log('Parameters copied to clipboard');
                            // Provide visual feedback
                            const originalText = copyParamsButton.textContent;
                            copyParamsButton.textContent = 'Copied!';
                            setTimeout(() => {
                                copyParamsButton.textContent = originalText;
                            }, 2000);
                        }).catch(err => {
                            console.error('Failed to copy parameters: ', err);
                        });
                    } else {
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = textToCopy;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        
                        // Provide visual feedback
                        const originalText = copyParamsButton.textContent;
                        copyParamsButton.textContent = 'Copied!';
                        setTimeout(() => {
                            copyParamsButton.textContent = originalText;
                        }, 2000);
                    }
                } catch (err) {
                    console.error('Error copying parameters: ', err);
                }
            });
        }
        
        // --- MOVE UP/DOWN FUNCTIONALITY ---
        
        // Helper function to move an item in a select list and update model
        function moveListItem(listId, arrayName, direction) {
            const selectElement = document.getElementById(listId);
            if (!selectElement || selectElement.selectedIndex === -1) {
                return; // No item selected
            }
            
            const selectedIndex = selectElement.selectedIndex;
            const newIndex = direction === 'up' ? selectedIndex - 1 : selectedIndex + 1;
            
            // Check bounds
            if (newIndex < 0 || newIndex >= selectElement.options.length) {
                return; // Already at first/last position
            }
            
            // Move the option in the select list
            const selectedOption = selectElement.options[selectedIndex];
            const targetOption = selectElement.options[newIndex];
            
            // Swap the options
            const tempText = selectedOption.text;
            const tempValue = selectedOption.value;
            
            selectedOption.text = targetOption.text;
            selectedOption.value = targetOption.value;
            
            targetOption.text = tempText;
            targetOption.value = tempValue;
            
            // Update selection to follow the moved item
            selectElement.selectedIndex = newIndex;
            
            // Send message to update the model
            vscode.postMessage({
                command: 'move' + arrayName.charAt(0).toUpperCase() + arrayName.slice(1),
                data: {
                    fromIndex: selectedIndex,
                    toIndex: newIndex
                }
            });
        }
        
        // Set up move up/down functionality for columns
        const moveUpColumnsButton = document.getElementById('moveUpColumnsButton');
        const moveDownColumnsButton = document.getElementById('moveDownColumnsButton');
        
        if (moveUpColumnsButton) {
            moveUpColumnsButton.addEventListener('click', () => {
                moveListItem('columnsList', 'column', 'up');
            });
        }
        
        if (moveDownColumnsButton) {
            moveDownColumnsButton.addEventListener('click', () => {
                moveListItem('columnsList', 'column', 'down');
            });
        }
        
        // Set up move up/down functionality for buttons
        const moveUpButtonsButton = document.getElementById('moveUpButtonsButton');
        const moveDownButtonsButton = document.getElementById('moveDownButtonsButton');
        
        if (moveUpButtonsButton) {
            moveUpButtonsButton.addEventListener('click', () => {
                moveListItem('buttonsList', 'button', 'up');
            });
        }
        
        if (moveDownButtonsButton) {
            moveDownButtonsButton.addEventListener('click', () => {
                moveListItem('buttonsList', 'button', 'down');
            });
        }
        
        // Set up move up/down functionality for parameters
        const moveUpParamsButton = document.getElementById('moveUpParamsButton');
        const moveDownParamsButton = document.getElementById('moveDownParamsButton');
        
        if (moveUpParamsButton) {
            moveUpParamsButton.addEventListener('click', () => {
                moveListItem('paramsList', 'param', 'up');
            });
        }
        
        if (moveDownParamsButton) {
            moveDownParamsButton.addEventListener('click', () => {
                moveListItem('paramsList', 'param', 'down');
            });
        }
          // Helper function to update move button states based on selection
        function updateMoveButtonStates() {
            // Update columns move buttons
            columnsList = document.getElementById('columnsList');
            const moveUpColumns = document.getElementById('moveUpColumnsButton');
            const moveDownColumns = document.getElementById('moveDownColumnsButton');
            
            if (columnsList && moveUpColumns && moveDownColumns) {
                const selectedIndex = columnsList.selectedIndex;
                const hasSelection = selectedIndex !== -1;
                const isFirst = selectedIndex === 0;
                const isLast = selectedIndex === columnsList.options.length - 1;
                
                moveUpColumns.disabled = !hasSelection || isFirst;
                moveDownColumns.disabled = !hasSelection || isLast;
            }
              // Update buttons move buttons
            buttonsList = document.getElementById('buttonsList');
            const moveUpButtons = document.getElementById('moveUpButtonsButton');
            const moveDownButtons = document.getElementById('moveDownButtonsButton');
            
            if (buttonsList && moveUpButtons && moveDownButtons) {
                const selectedIndex = buttonsList.selectedIndex;
                const hasSelection = selectedIndex !== -1;
                const isFirst = selectedIndex === 0;
                const isLast = selectedIndex === buttonsList.options.length - 1;
                
                moveUpButtons.disabled = !hasSelection || isFirst;
                moveDownButtons.disabled = !hasSelection || isLast;
            }
              // Update params move buttons
            paramsList = document.getElementById('paramsList');
            const moveUpParams = document.getElementById('moveUpParamsButton');
            const moveDownParams = document.getElementById('moveDownParamsButton');
            
            if (paramsList && moveUpParams && moveDownParams) {
                const selectedIndex = paramsList.selectedIndex;
                const hasSelection = selectedIndex !== -1;
                const isFirst = selectedIndex === 0;
                const isLast = selectedIndex === paramsList.options.length - 1;
                
                moveUpParams.disabled = !hasSelection || isFirst;
                moveDownParams.disabled = !hasSelection || isLast;
            }
        }
          // Add event listeners to update move button states when selection changes
        columnsList = document.getElementById('columnsList');
        if (columnsList) {
            columnsList.addEventListener('change', updateMoveButtonStates);
        }
        
        buttonsList = document.getElementById('buttonsList');
        if (buttonsList) {
            buttonsList.addEventListener('change', updateMoveButtonStates);
        }
        
        paramsList = document.getElementById('paramsList');
        if (paramsList) {
            paramsList.addEventListener('change', updateMoveButtonStates);
        }
        
        // Initialize move button states on page load
        document.addEventListener('DOMContentLoaded', function() {
            updateMoveButtonStates();
        });
        
        // Also update move button states after existing functionality
        if (typeof updateMoveButtonStates === 'function') {
            setTimeout(updateMoveButtonStates, 100);
        }
    `;
}

module.exports = {
    getClientScriptTemplate
};

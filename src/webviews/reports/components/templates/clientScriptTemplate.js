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
        
        // View switching functionality for buttons tab
        const viewIconsContainer = document.querySelector('.view-icons');
        if (viewIconsContainer) {
            viewIconsContainer.addEventListener('click', (event) => {
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
            const buttonsList = document.getElementById('buttonsList');
            const buttonDetailsContainer = document.getElementById('buttonDetailsContainer');
            if (buttonsList && buttonDetailsContainer && (!buttonsList.value || buttonsList.value === "")) {
                buttonDetailsContainer.style.display = 'none';
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
        
        // --- COLUMNS FUNCTIONALITY ---
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
        const buttonsList = document.getElementById('buttonsList');
        const buttonDetailsContainer = document.getElementById('buttonDetailsContainer');
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
        
        // --- PARAMETERS FUNCTIONALITY ---
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
    `;
}

module.exports = {
    getClientScriptTemplate
};

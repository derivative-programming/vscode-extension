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
        
        // Settings tab functionality
        document.querySelectorAll('.setting-checkbox').forEach(checkbox => {
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
                    inputField.style.backgroundColor = 'var(--vscode-input-background)';
                    inputField.style.color = 'var(--vscode-input-foreground)';
                    inputField.style.opacity = '1';
                } else {
                    // Disable the input field
                    if (isEnum) {
                        inputField.disabled = true;
                    } else {
                        inputField.readOnly = true;
                    }
                    inputField.style.backgroundColor = 'var(--vscode-input-disabledBackground, #e9e9e9)';
                    inputField.style.color = 'var(--vscode-input-disabledForeground, #999)';
                    inputField.style.opacity = '0.8';
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
                if (isReadOnly) {
                    input.style.backgroundColor = 'var(--vscode-input-disabledBackground, #e9e9e9)';
                    input.style.color = 'var(--vscode-input-disabledForeground, #999)';
                    input.style.opacity = '0.8';
                } else {
                    input.style.backgroundColor = 'var(--vscode-input-background)';
                    input.style.color = 'var(--vscode-input-foreground)';
                    input.style.opacity = '1';
                }
            });
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
            if (!newButton.name) {
                alert('Button name is required!');
                return;
            }
            
            if (currentEditingIndex >= 0) {
                // Update existing button
                currentButtons[currentEditingIndex] = newButton;
            } else {
                // Add new button
                currentButtons.push(newButton);
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

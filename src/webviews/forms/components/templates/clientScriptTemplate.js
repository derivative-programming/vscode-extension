"use strict";

/**
 * Gets the JavaScript code for modal functionality
 * @returns {string} JavaScript code for modal functionality
 */
function getModalFunctionality() {
    return `
    // Modal handling functions
    function openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }
    
    function closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
    
    // Close button functionality for all modals
    document.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Close modals when clicking outside the modal content
    window.addEventListener('click', function(event) {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });`;
}

/**
 * Gets the JavaScript code for client-side script
 * @param {Array} params The form parameters
 * @param {Array} buttons The form buttons
 * @param {Array} outputVars The form output variables
 * @param {Object} paramSchema Schema for parameters
 * @param {Object} buttonSchema Schema for buttons
 * @param {Object} outputVarSchema Schema for output variables
 * @param {string} formName The name of the form
 * @returns {string} JavaScript code for client-side functionality
 */
function getClientScriptTemplate(params, buttons, outputVars, paramSchema, buttonSchema, outputVarSchema, formName) {
    return `
        // Store current data
        let currentParams = ${JSON.stringify(params)};
        let currentButtons = ${JSON.stringify(buttons)};
        let currentOutputVars = ${JSON.stringify(outputVars)};
        let currentEditingIndex = -1;
        
        // Set up VS Code message listener for tab restoration
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'restoreTab') {
                console.log('[DEBUG] Restoring tab:', message.tabId);
                restoreActiveTab(message.tabId);
            }
        });

        // Function to restore the active tab with retry logic
        function restoreActiveTab(tabId) {
            function attemptRestore() {
                // Remove active class from all tabs and tab contents
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Add active class to the specified tab and its content
                const targetTab = document.querySelector('.tab[data-tab="' + tabId + '"]');
                const targetContent = document.getElementById(tabId);
                
                if (targetTab && targetContent) {
                    targetTab.classList.add('active');
                    targetContent.classList.add('active');
                    console.log('[DEBUG] Successfully restored tab:', tabId);
                    return true;
                } else {
                    console.warn('[DEBUG] Elements not ready yet for tab:', tabId);
                    return false;
                }
            }
            
            // Try immediately first
            if (!attemptRestore()) {
                // If not successful, try again after a short delay
                setTimeout(() => {
                    if (!attemptRestore()) {
                        // Last try after a longer delay
                        setTimeout(attemptRestore, 500);
                    }
                }, 100);
            }
        }
        
        // Initialize tab functionality
        document.addEventListener('DOMContentLoaded', function() {
            // Tab switching
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', function() {
                    const tabId = this.getAttribute('data-tab');
                    
                    // Remove active class from all tabs and tab contents
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    
                    // Add active class to clicked tab and corresponding content
                    this.classList.add('active');
                    document.getElementById(tabId).classList.add('active');
                    
                    // Notify VS Code about tab change for persistence
                    const vscode = acquireVsCodeApi();
                    vscode.postMessage({
                        command: 'tabChanged',
                        tabId: tabId,
                        formName: '${formName}'
                    });
                });
            });
            
            // Settings tab functionality
            const settingCheckboxes = document.querySelectorAll('.setting-checkbox');
            
            // Function to update input styling based on enabled/disabled state
            function updateInputStyle(input, isEnabled) {
                if (isEnabled) {
                    input.style.backgroundColor = 'var(--vscode-input-background)';
                    input.style.color = 'var(--vscode-input-foreground)';
                    input.style.opacity = '1';
                    input.style.cursor = 'auto';
                } else {
                    input.style.backgroundColor = 'var(--vscode-input-disabledBackground, #e9e9e9)';
                    input.style.color = 'var(--vscode-input-disabledForeground, #999)';
                    input.style.opacity = '0.8';
                    input.style.cursor = 'not-allowed';
                }
            }
            
            // Initialize input styling based on checkbox state
            settingCheckboxes.forEach(checkbox => {
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
                
                // Add change event listener
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
                            inputField.value = '';  // Clear the value
                        }
                        updateInputStyle(inputField, false);
                    }
                    
                    // Send message to update the model in real-time
                    const vscode = acquireVsCodeApi();
                    vscode.postMessage({
                        command: 'updateFormSettings',
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
                            const vscode = acquireVsCodeApi();
                            vscode.postMessage({
                                command: 'updateFormSettings',
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
                            const vscode = acquireVsCodeApi();
                            vscode.postMessage({
                                command: 'updateFormSettings',
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
            
            // Add param button functionality
            document.getElementById('add-param-btn').addEventListener('click', function() {
                openModal('param-modal');
                document.getElementById('param-index').value = -1;  // -1 indicates new param
                
                // Reset the form
                const fieldsContainer = document.getElementById('param-fields-container');
                while (fieldsContainer.firstChild) {
                    fieldsContainer.removeChild(fieldsContainer.firstChild);
                }
                
                // Generate input fields based on schema
                generateParamFields({});
            });
            
            // Add button button functionality
            document.getElementById('add-button-btn').addEventListener('click', function() {
                openModal('button-modal');
                document.getElementById('button-index').value = -1;  // -1 indicates new button
                
                // Reset the form
                const fieldsContainer = document.getElementById('button-fields-container');
                while (fieldsContainer.firstChild) {
                    fieldsContainer.removeChild(fieldsContainer.firstChild);
                }
                
                // Generate input fields based on schema
                generateButtonFields({});
            });
            
            // Add output variable button functionality
            document.getElementById('add-output-var-btn').addEventListener('click', function() {
                openModal('output-var-modal');
                document.getElementById('output-var-index').value = -1;  // -1 indicates new output var
                
                // Reset the form
                const fieldsContainer = document.getElementById('output-var-fields-container');
                while (fieldsContainer.firstChild) {
                    fieldsContainer.removeChild(fieldsContainer.firstChild);
                }
                
                // Generate input fields based on schema
                generateOutputVarFields({});
            });
            
            // Table row edit handlers - Parameters
            document.querySelectorAll('.edit-param-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'), 10);
                    const param = currentParams[index];
                    currentEditingIndex = index;
                    
                    document.getElementById('param-index').value = index;
                    
                    // Reset the form
                    const fieldsContainer = document.getElementById('param-fields-container');
                    while (fieldsContainer.firstChild) {
                        fieldsContainer.removeChild(fieldsContainer.firstChild);
                    }
                    
                    // Generate input fields based on schema and populate with param data
                    generateParamFields(param);
                    
                    openModal('param-modal');
                });
            });
            
            // Table row edit handlers - Buttons
            document.querySelectorAll('.edit-button-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'), 10);
                    const buttonData = currentButtons[index];
                    currentEditingIndex = index;
                    
                    document.getElementById('button-index').value = index;
                    
                    // Reset the form
                    const fieldsContainer = document.getElementById('button-fields-container');
                    while (fieldsContainer.firstChild) {
                        fieldsContainer.removeChild(fieldsContainer.firstChild);
                    }
                    
                    // Generate input fields based on schema and populate with button data
                    generateButtonFields(buttonData);
                    
                    openModal('button-modal');
                });
            });
            
            // Table row edit handlers - Output Variables
            document.querySelectorAll('.edit-output-var-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'), 10);
                    const outputVar = currentOutputVars[index];
                    currentEditingIndex = index;
                    
                    document.getElementById('output-var-index').value = index;
                    
                    // Reset the form
                    const fieldsContainer = document.getElementById('output-var-fields-container');
                    while (fieldsContainer.firstChild) {
                        fieldsContainer.removeChild(fieldsContainer.firstChild);
                    }
                    
                    // Generate input fields based on schema and populate with output var data
                    generateOutputVarFields(outputVar);
                    
                    openModal('output-var-modal');
                });
            });
            
            // Save param modal handler
            document.getElementById('save-param').addEventListener('click', function() {
                const index = parseInt(document.getElementById('param-index').value, 10);
                const param = {};
                
                // Collect form field data
                document.querySelectorAll('#param-fields-container input, #param-fields-container select').forEach(input => {
                    param[input.name] = input.value;
                });
                
                // Send to VS Code
                const vscode = acquireVsCodeApi();
                vscode.postMessage({
                    command: 'updateFormParam',
                    param: param,
                    index: index
                });
                
                closeModal('param-modal');
            });
            
            // Save button modal handler
            document.getElementById('save-button').addEventListener('click', function() {
                const index = parseInt(document.getElementById('button-index').value, 10);
                const buttonData = {};
                
                // Collect form field data
                document.querySelectorAll('#button-fields-container input, #button-fields-container select').forEach(input => {
                    buttonData[input.name] = input.value;
                });
                
                // Send to VS Code
                const vscode = acquireVsCodeApi();
                vscode.postMessage({
                    command: 'updateFormButton',
                    button: buttonData,
                    index: index
                });
                
                closeModal('button-modal');
            });
            
            // Save output var modal handler
            document.getElementById('save-output-var').addEventListener('click', function() {
                const index = parseInt(document.getElementById('output-var-index').value, 10);
                const outputVar = {};
                
                // Collect form field data
                document.querySelectorAll('#output-var-fields-container input, #output-var-fields-container select').forEach(input => {
                    outputVar[input.name] = input.value;
                });
                
                // Send to VS Code
                const vscode = acquireVsCodeApi();
                vscode.postMessage({
                    command: 'updateFormOutputVar',
                    outputVar: outputVar,
                    index: index
                });
                
                closeModal('output-var-modal');
            });
            
            // Cancel button handlers
            document.getElementById('cancel-param').addEventListener('click', function() {
                closeModal('param-modal');
            });
            
            document.getElementById('cancel-button').addEventListener('click', function() {
                closeModal('button-modal');
            });
            
            document.getElementById('cancel-output-var').addEventListener('click', function() {
                closeModal('output-var-modal');
            });
            
            // Move up/down and reorder functionality
            setupReorderingButtons();
        });
        
        // Param field generator
        function generateParamFields(param) {
            const fieldsContainer = document.getElementById('param-fields-container');
            const paramSchemaProps = ${JSON.stringify(paramSchema)};
            
            Object.entries(paramSchemaProps).sort((a, b) => a[0].localeCompare(b[0])).forEach(([propName, schema]) => {
                const value = param[propName] || '';
                const hasEnum = schema.enum && Array.isArray(schema.enum);
                const tooltip = schema.description ? \`title="\${schema.description}"\` : '';
                
                const fieldHtml = document.createElement('div');
                fieldHtml.className = 'form-row';
                
                const label = document.createElement('label');
                label.setAttribute('for', \`param-\${propName}\`);
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
                
                input.id = \`param-\${propName}\`;
                input.name = propName;
                if (schema.description) {
                    input.setAttribute('title', schema.description);
                }
                
                fieldHtml.appendChild(input);
                fieldsContainer.appendChild(fieldHtml);
            });
        }
        
        // Button field generator
        function generateButtonFields(button) {
            const fieldsContainer = document.getElementById('button-fields-container');
            const buttonSchemaProps = ${JSON.stringify(buttonSchema)};
            
            Object.entries(buttonSchemaProps).sort((a, b) => a[0].localeCompare(b[0])).forEach(([propName, schema]) => {
                const value = button[propName] || '';
                const hasEnum = schema.enum && Array.isArray(schema.enum);
                const tooltip = schema.description ? \`title="\${schema.description}"\` : '';
                
                const fieldHtml = document.createElement('div');
                fieldHtml.className = 'form-row';
                
                const label = document.createElement('label');
                label.setAttribute('for', \`button-\${propName}\`);
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
                
                input.id = \`button-\${propName}\`;
                input.name = propName;
                if (schema.description) {
                    input.setAttribute('title', schema.description);
                }
                
                fieldHtml.appendChild(input);
                fieldsContainer.appendChild(fieldHtml);
            });
        }
        
        // Output var field generator
        function generateOutputVarFields(outputVar) {
            const fieldsContainer = document.getElementById('outputVarDetailsForm');
            if (!fieldsContainer) return;
            
            const outputVarSchemaProps = ${JSON.stringify(outputVarSchema)};
            
            // Only handle the form fields that are already in the DOM
            Object.keys(outputVarSchemaProps).forEach(propName => {
                if (propName === 'name') return; // Skip name field as it's in the list
                
                const fieldId = 'outputVar' + propName;
                const field = document.getElementById(fieldId);
                const checkbox = document.getElementById(fieldId + 'Editable');
                
                if (field && checkbox) {
                    // Check if property exists and is not null or undefined
                    const propertyExists = outputVar.hasOwnProperty(propName) && outputVar[propName] !== null && outputVar[propName] !== undefined;
                    
                    if (field.tagName === 'SELECT') {
                        field.value = propertyExists ? outputVar[propName] : '';
                        field.disabled = !propertyExists;
                    } else {
                        field.value = propertyExists ? outputVar[propName] : '';
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
                input.name = propName;
                if (schema.description) {
                    input.setAttribute('title', schema.description);
                }
                
                fieldHtml.appendChild(input);
                fieldsContainer.appendChild(fieldHtml);
            });
        }
        
        // Setup reordering buttons
        function setupReorderingButtons() {
            // Parameters reordering
            document.querySelectorAll('.move-param-up').forEach(button => {
                button.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'), 10);
                    if (index > 0) {
                        moveArrayItem('param', index, index - 1);
                    }
                });
            });
            
            document.querySelectorAll('.move-param-down').forEach(button => {
                button.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'), 10);
                    if (index < currentParams.length - 1) {
                        moveArrayItem('param', index, index + 1);
                    }
                });
            });
            
            // Buttons reordering
            document.querySelectorAll('.move-button-up').forEach(button => {
                button.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'), 10);
                    if (index > 0) {
                        moveArrayItem('button', index, index - 1);
                    }
                });
            });
            
            document.querySelectorAll('.move-button-down').forEach(button => {
                button.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'), 10);
                    if (index < currentButtons.length - 1) {
                        moveArrayItem('button', index, index + 1);
                    }
                });
            });
            
            // Output Variables reordering
            document.querySelectorAll('.move-output-var-up').forEach(button => {
                button.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'), 10);
                    if (index > 0) {
                        moveArrayItem('outputVar', index, index - 1);
                    }
                });
            });
            
            document.querySelectorAll('.move-output-var-down').forEach(button => {
                button.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'), 10);
                    if (index < currentOutputVars.length - 1) {
                        moveArrayItem('outputVar', index, index + 1);
                    }
                });
            });
            
            // Reverse buttons
            document.getElementById('reverse-params-btn').addEventListener('click', function() {
                reverseArray('param');
            });
            
            document.getElementById('reverse-buttons-btn').addEventListener('click', function() {
                reverseArray('button');
            });
            
            document.getElementById('reverse-output-vars-btn').addEventListener('click', function() {
                reverseArray('outputVar');
            });
        }
        
        function moveArrayItem(type, fromIndex, toIndex) {
            let array, command;
            
            switch(type) {
                case 'param':
                    array = currentParams;
                    command = 'reorderFormParam';
                    break;
                case 'button':
                    array = currentButtons;
                    command = 'reorderFormButton';
                    break;
                case 'outputVar':
                    array = currentOutputVars;
                    command = 'reorderFormOutputVar';
                    break;
                default:
                    return;
            }
            
            // Notify VS Code about the reordering
            const vscode = acquireVsCodeApi();
            vscode.postMessage({
                command: command,
                fromIndex: fromIndex,
                toIndex: toIndex
            });
        }
        
        function reverseArray(type) {
            let command;
            
            switch(type) {
                case 'param':
                    command = 'reverseFormParams';
                    break;
                case 'button':
                    command = 'reverseFormButtons';
                    break;
                case 'outputVar':
                    command = 'reverseFormOutputVars';
                    break;
                default:
                    return;
            }
            
            // Notify VS Code about the reversal
            const vscode = acquireVsCodeApi();
            vscode.postMessage({
                command: command
            });
        }
        
        // --- BUTTONS TAB FUNCTIONALITY ---
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
                    if (buttonsTableView) buttonsTableView.style.display = 'block';
                    if (buttonsListView) buttonsListView.style.display = 'none';
                } else {
                    if (buttonsTableView) buttonsTableView.style.display = 'none';
                    if (buttonsListView) buttonsListView.style.display = 'block';
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
                Object.keys(${JSON.stringify(buttonSchema)}).forEach(buttonKey => {
                    if (buttonKey === 'buttonName') return; // Skip name field as it's in the list
                    
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
                    }
                });
            });
        }
        
        // Button checkbox functionality similar to params
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
        
        // Handle button edit events
        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                if (!index) return;
                
                currentEditingIndex = parseInt(index);
                
                // Get the button data for editing
                const buttonData = currentButtons[currentEditingIndex];
                if (!buttonData) return;
                
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
                if (!index) return;
                
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
                if (!index) return;
                
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
                if (!index) return;
                
                vscode.postMessage({
                    command: 'moveButton',
                    data: { 
                        index: parseInt(index),
                        direction: 'down'
                    }
                });
            });
        });
        
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

        // --- OUTPUT VARIABLES TAB FUNCTIONALITY ---
        
        // Set up view switching for the output variables tab
        const outputVarsListViewIcon = document.querySelector('.view-icons[data-tab="outputVars"] .list-icon');
        const outputVarsTableViewIcon = document.querySelector('.view-icons[data-tab="outputVars"] .table-icon');
        const outputVarsListView = document.getElementById('outputVarsListView');
        const outputVarsTableView = document.getElementById('outputVarsTableView');
        
        if (outputVarsListViewIcon && outputVarsTableViewIcon) {
            // List view button
            outputVarsListViewIcon.addEventListener('click', () => {
                outputVarsTableViewIcon.classList.remove('active');
                outputVarsListViewIcon.classList.add('active');
                outputVarsTableView.classList.remove('active');
                outputVarsListView.classList.add('active');
            });
            
            // Table view button
            outputVarsTableViewIcon.addEventListener('click', () => {
                outputVarsListViewIcon.classList.remove('active');
                outputVarsTableViewIcon.classList.add('active');
                outputVarsListView.classList.remove('active');
                outputVarsTableView.classList.add('active');
            });
        }
        
        // Output variable list change handler for list view
        const outputVarsList = document.getElementById('outputVarsList');
        const outputVarDetailsContainer = document.getElementById('outputVarDetailsContainer');
        if (outputVarsList && outputVarDetailsContainer) {
            outputVarsList.addEventListener('change', (event) => {
                const selectedIndex = event.target.value;
                const outputVar = currentOutputVars[selectedIndex];

                // Show output variable details container when an item is selected
                outputVarDetailsContainer.style.display = 'block';
                
                // Update form fields with output variable values
                generateOutputVarFields(outputVar);
            });
            
            // Initialize toggle editable behavior for output variable list view form fields
            Object.keys(${JSON.stringify(outputVarSchema)}).forEach(outputVarKey => {
                if (outputVarKey === 'name') return;
                
                const fieldId = 'outputVar' + outputVarKey;
                const checkbox = document.getElementById(fieldId + 'Editable');
                const field = document.getElementById(fieldId);
                
                if (checkbox && field) {
                    checkbox.addEventListener('change', (event) => {
                        const isChecked = event.target.checked;
                        
                        if (field.tagName === 'SELECT') {
                            field.disabled = !isChecked;
                        } else {
                            field.readOnly = !isChecked;
                        }
                        
                        updateInputStyle(field, isChecked);
                    });
                }
            });
            
            // Initialize outputVarsList - hide details if no output variable is selected
            if (outputVarsList && outputVarDetailsContainer && (!outputVarsList.value || outputVarsList.value === "")) {
                outputVarDetailsContainer.style.display = 'none';
            }
            
            // Handle copy, move up/down, and reverse buttons for output variables
            document.getElementById('copyOutputVarButton')?.addEventListener('click', () => {
                if (!outputVarsList.value) return;
                
                const selectedIndex = parseInt(outputVarsList.value);
                vscode.postMessage({
                    command: 'copyOutputVar',
                    index: selectedIndex
                });
            });
            
            document.getElementById('moveUpOutputVarButton')?.addEventListener('click', () => {
                if (!outputVarsList.value) return;
                
                const selectedIndex = parseInt(outputVarsList.value);
                if (selectedIndex > 0) {
                    vscode.postMessage({
                        command: 'moveOutputVar',
                        fromIndex: selectedIndex,
                        toIndex: selectedIndex - 1
                    });
                }
            });
            
            document.getElementById('moveDownOutputVarButton')?.addEventListener('click', () => {
                if (!outputVarsList.value) return;
                
                const selectedIndex = parseInt(outputVarsList.value);
                if (selectedIndex < currentOutputVars.length - 1) {
                    vscode.postMessage({
                        command: 'moveOutputVar',
                        fromIndex: selectedIndex,
                        toIndex: selectedIndex + 1
                    });
                }
            });
            
            document.getElementById('reverseOutputVarButton')?.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'reverseOutputVar'
                });
            });
        }
        
        // Add output variable button
        document.getElementById('add-output-var-btn')?.addEventListener('click', () => {
            vscode.postMessage({
                command: 'addOutputVar'
            });
        });
        
        // Handle checkbox changes in output variables table
        document.querySelectorAll('.outputvar-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', event => {
                const index = parseInt(event.target.dataset.index);
                const prop = event.target.dataset.prop;
                const isChecked = event.target.checked;
                
                const row = event.target.closest('tr');
                const input = row.querySelector(`[name="${prop}"]`);
                
                if (input) {
                    if (input.tagName === 'SELECT') {
                        input.disabled = !isChecked;
                    } else {
                        input.readOnly = !isChecked;
                    }
                    
                    updateInputStyle(input, isChecked);
                    
                    // If adding the property, initialize it with a default value
                    if (isChecked && (!currentOutputVars[index][prop] || currentOutputVars[index][prop] === '')) {
                        // Default value depends on the input type
                        let defaultValue = input.tagName === 'SELECT' ? input.options[0].value : '';
                        
                        vscode.postMessage({
                            command: 'updateOutputVarProperty',
                            index: index,
                            property: prop,
                            value: defaultValue
                        });
                    }
                    // If removing the property, send message to backend
                    else if (!isChecked) {
                        vscode.postMessage({
                            command: 'removeOutputVarProperty',
                            index: index,
                            property: prop
                        });
                    }
                }
            });
        });
        
        // Listen for input changes in output variable fields in table view
        document.querySelectorAll('#outputVars-table input[type="text"], #outputVars-table select').forEach(input => {
            if (input.type === 'checkbox') return; // Skip checkbox inputs
            
            input.addEventListener('change', event => {
                const row = event.target.closest('tr');
                if (!row) return;
                
                const index = parseInt(row.dataset.index);
                const property = event.target.name;
                
                vscode.postMessage({
                    command: 'updateOutputVarProperty',
                    index: index,
                    property: property,
                    value: event.target.value
                });
            });
        });
`;
}

module.exports = {
    getModalFunctionality,
    getClientScriptTemplate
};

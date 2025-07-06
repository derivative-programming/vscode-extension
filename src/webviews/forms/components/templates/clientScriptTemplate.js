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
            const fieldsContainer = document.getElementById('output-var-fields-container');
            const outputVarSchemaProps = ${JSON.stringify(outputVarSchema)};
            
            Object.entries(outputVarSchemaProps).sort((a, b) => a[0].localeCompare(b[0])).forEach(([propName, schema]) => {
                const value = outputVar[propName] || '';
                const hasEnum = schema.enum && Array.isArray(schema.enum);
                const tooltip = schema.description ? \`title="\${schema.description}"\` : '';
                
                const fieldHtml = document.createElement('div');
                fieldHtml.className = 'form-row';
                
                const label = document.createElement('label');
                label.setAttribute('for', \`output-var-\${propName}\`);
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
                
                input.id = \`output-var-\${propName}\`;
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
        
        // Utility function to format property labels
        function formatPropertyLabel(prop) {
            if (!prop) return '';
            
            // Handle acronyms by keeping capital letters that are together as one unit
            return prop
                .replace(/([a-z])([A-Z])/g, '$1 $2')  // camelCase to space-separated
                .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')  // PascalCase to space-separated
                .replace(/^./, match => match.toUpperCase());  // Capitalize first letter
        }
    `;
}

module.exports = {
    getModalFunctionality,
    getClientScriptTemplate
};

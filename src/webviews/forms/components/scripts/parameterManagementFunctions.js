"use strict";

/**
 * File: parameterManagementFunctions.js
 * Purpose: Parameter management functions for the forms detail view
 * Created: 2025-07-06
 */

/**
 * Gets parameter management functions for the forms detail view
 * @returns {string} JavaScript code for parameter management
 */
function getParameterManagementFunctions() {
    return `
    // --- PARAMETERS TAB FUNCTIONALITY ---
    
    // Parameter list change handler for list view
    const paramsList = document.getElementById('paramsList');
    const paramDetailsContainer = document.getElementById('paramDetailsContainer');
    
    if (paramsList && paramDetailsContainer) {
        paramsList.addEventListener('change', (event) => {
            const selectedIndex = event.target.value;
            const param = currentParams[selectedIndex];

            // Show param details container when an item is selected
            paramDetailsContainer.style.display = 'block';

            // Update form fields with param values
            Object.keys(paramSchema).forEach(paramKey => {
                if (paramKey === 'name') return; // Skip name field as it's in the list
                
                const fieldId = 'param' + paramKey;
                const field = document.getElementById(fieldId);
                const checkbox = document.getElementById(fieldId + 'Editable');
                
                if (field && checkbox) {
                    // Check if property exists and is not null or undefined
                    const propertyExists = param.hasOwnProperty(paramKey) && param[paramKey] !== null && param[paramKey] !== undefined;
                    
                    if (field.tagName === 'SELECT') {
                        if (propertyExists) {
                            // If property exists, use its value
                            field.value = param[paramKey];
                        } else {
                            // If property doesn't exist, use default value logic
                            const schema = paramSchema[paramKey] || {};
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
        Object.keys(paramSchema).forEach(paramKey => {
            if (paramKey === 'name') return;
            
            const fieldId = 'param' + paramKey;
            const field = document.getElementById(fieldId);
            const checkbox = document.getElementById(fieldId + 'Editable');
            
            if (field && checkbox) {
                // Set initial state
                updateInputStyle(field, checkbox.checked);
                
                // Add event listener for checkbox state changes
                checkbox.addEventListener('change', function() {
                    // Get the currently selected param index
                    const selectedIndex = paramsList.value;
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
                        command: 'updateParam',
                        data: {
                            index: parseInt(selectedIndex),
                            property: paramKey,
                            exists: this.checked,
                            value: this.checked ? field.value : null
                        }
                    });
                    
                    // Update the local currentParams array
                    const currentParamIndex = parseInt(selectedIndex);
                    if (this.checked) {
                        // Add or update the property in the local array
                        currentParams[currentParamIndex][paramKey] = field.value;
                    } else {
                        // Remove the property from the local array
                        delete currentParams[currentParamIndex][paramKey];
                    }
                });
                
                // Update model when input value changes
                const updateInputHandler = function() {
                    const selectedIndex = paramsList.value;
                    if (selectedIndex === '' || !checkbox.checked) return;
                    
                    // Send message to update the model
                    vscode.postMessage({
                        command: 'updateParam',
                        data: {
                            index: parseInt(selectedIndex),
                            property: paramKey,
                            exists: true,
                            value: field.value
                        }
                    });
                    
                    // Update the local currentParams array
                    const currentParamIndex = parseInt(selectedIndex);
                    currentParams[currentParamIndex][paramKey] = field.value;
                };
                
                if (field.tagName === 'SELECT') {
                    field.addEventListener('change', updateInputHandler);
                } else {
                    field.addEventListener('input', updateInputHandler);
                    field.addEventListener('change', updateInputHandler);
                }
            }
        });
        
        // Initialize paramsList - hide details if no param is selected
        if (paramsList && paramDetailsContainer && (!paramsList.value || paramsList.value === "")) {
            paramDetailsContainer.style.display = 'none';
        }
    }

    // Parameter table checkbox functionality (for parameters table view)
    document.querySelectorAll('.property-toggle').forEach(checkbox => {
        const propName = checkbox.getAttribute('data-property');
        const row = checkbox.closest('tr');
        if (!row) return;
        
        const index = row.getAttribute('data-param-index');
        
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
            
            // Update the local currentParams array
            const paramIndex = parseInt(index);
            if (this.checked) {
                // Add or update the property in the local array
                currentParams[paramIndex][propName] = inputElement.value;
            } else {
                // Remove the property from the local array
                delete currentParams[paramIndex][propName];
            }
        });
    });

    // Handle input changes for parameters table
    document.querySelectorAll('#params-table input[type="text"], #params-table select').forEach(input => {
        const updateParam = () => {
            const tableCell = input.closest('td');
            if (!tableCell) return;
            
            const checkbox = tableCell.querySelector('.property-toggle');
            if (!checkbox || !checkbox.checked) return;
            
            const propName = checkbox.getAttribute('data-property');
            const row = checkbox.closest('tr');
            if (!row) return;
            
            const index = row.getAttribute('data-param-index');
            
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
            
            // Update the local currentParams array
            const paramIndex = parseInt(index);
            currentParams[paramIndex][propName] = input.value;
        };
        
        if (input.tagName === 'SELECT') {
            input.addEventListener('change', updateParam);
        } else {
            input.addEventListener('input', updateParam);
            input.addEventListener('change', updateParam);
        }
    });

    // Parameter field generator
    function generateParamFields(param) {
        const fieldsContainer = document.getElementById('param-fields-container');
        const paramSchemaProps = window.paramSchemaProps || {};
        
        Object.entries(paramSchemaProps).sort((a, b) => a[0].localeCompare(b[0])).forEach(([propName, schema]) => {
            const value = param[propName] || '';
            const hasEnum = schema.enum && Array.isArray(schema.enum);
            
            const fieldHtml = document.createElement('div');
            fieldHtml.className = 'form-row';
            
            const label = document.createElement('label');
            label.setAttribute('for', 'param-' + propName);
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
            
            input.id = 'param-' + propName;
            input.name = propName;
            if (schema.description) {
                input.setAttribute('title', schema.description);
            }
            
            fieldHtml.appendChild(input);
            fieldsContainer.appendChild(fieldHtml);
        });
    }

    // Parameter reordering functionality
    function setupParameterReordering() {
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
        
        // Reverse buttons
        document.getElementById('reverse-params-btn')?.addEventListener('click', function() {
            reverseArray('param');
        });
        
        // Copy button for parameters
        document.getElementById('copyParamsButton')?.addEventListener('click', () => {
            try {
                // Get all parameter names from the list
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
                        const copyButton = document.getElementById('copyParamsButton');
                        if (copyButton) {
                            const originalText = copyButton.textContent;
                            copyButton.textContent = 'Copied!';
                            setTimeout(() => {
                                copyButton.textContent = originalText;
                            }, 2000);
                        }
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
                    const copyButton = document.getElementById('copyParamsButton');
                    if (copyButton) {
                        const originalText = copyButton.textContent;
                        copyButton.textContent = 'Copied!';
                        setTimeout(() => {
                            copyButton.textContent = originalText;
                        }, 2000);
                    }
                }
            } catch (err) {
                console.error('Error copying parameters: ', err);
            }
        });
    }

    // Array item moving function for parameters
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
        
        // Send message to extension to update the model
        vscode.postMessage({
            command: command,
            data: {
                fromIndex: fromIndex,
                toIndex: toIndex
            }
        });
    }
    
    // Array reversal function for parameters
    function reverseArray(type) {
        let array, command;
        
        switch(type) {
            case 'param':
                array = currentParams;
                command = 'reverseFormParams';
                break;
            case 'button':
                array = currentButtons;
                command = 'reverseFormButtons';
                break;
            case 'outputVar':
                array = currentOutputVars;
                command = 'reverseFormOutputVars';
                break;
            default:
                return;
        }
        
        // Send message to extension to update the model
        vscode.postMessage({
            command: command
        });
    }

    // Initialize parameter tab functionality
    function initializeParameterTabFunctionality() {
        setupParameterReordering();
    }
    
    // Initialize all parameter functionality
    initializeParameterTabFunctionality();
    `;
}

module.exports = {
    getParameterManagementFunctions
};

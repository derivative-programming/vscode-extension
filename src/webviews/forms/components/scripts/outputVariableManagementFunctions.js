"use strict";

/**
 * File: outputVariableManagementFunctions.js
 * Purpose: Output variable management functions for the forms detail view
 * Created: 2025-07-06
 */

/**
 * Gets output variable management functions for the forms detail view
 * @returns {string} JavaScript code for output variable management
 */
function getOutputVariableManagementFunctions() {
    return `
    // --- OUTPUT VARIABLES TAB FUNCTIONALITY ---
    
    // Output variable list change handler for list view
    const outputVarsList = document.getElementById('outputVarsList');
    const outputVarDetailsContainer = document.getElementById('outputVarDetailsContainer');
    
    if (outputVarsList && outputVarDetailsContainer) {
        outputVarsList.addEventListener('change', (event) => {
            const selectedIndex = event.target.value;
            const outputVar = currentOutputVars[selectedIndex];

            // Only proceed if we have a valid output variable object
            if (!outputVar) {
                outputVarDetailsContainer.style.display = 'none';
                return;
            }

            // Show output variable details container when an item is selected
            outputVarDetailsContainer.style.display = 'block';

            // Update form fields with output var values
            Object.keys(outputVarSchema).forEach(outputVarKey => {
                if (outputVarKey === 'name') return; // Skip name field as it's in the list
                
                const fieldId = 'outputVar' + outputVarKey;
                const field = document.getElementById(fieldId);
                const checkbox = document.getElementById(fieldId + 'Editable');
                
                if (field && checkbox) {
                    // Check if property exists and is not null or undefined
                    const propertyExists = outputVar.hasOwnProperty(outputVarKey) && outputVar[outputVarKey] !== null && outputVar[outputVarKey] !== undefined;
                    
                    if (field.tagName === 'SELECT') {
                        if (propertyExists) {
                            // If property exists, use its value
                            field.value = outputVar[outputVarKey];
                        } else {
                            // If property doesn't exist, use default value logic
                            const schema = outputVarSchema[outputVarKey] || {};
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
                        field.value = propertyExists ? outputVar[outputVarKey] : '';
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
                    
                    // Set browse button state for sourceObjectName field
                    if (outputVarKey === 'sourceObjectName') {
                        const browseButton = field.parentElement.querySelector('.lookup-button');
                        if (browseButton) {
                            browseButton.disabled = !propertyExists;
                            console.log('List view: set browse button state for', outputVarKey, 'disabled:', !propertyExists, 'propertyExists:', propertyExists);
                        }
                    }
                }
            });
        });
        
        // Initialize toggle editable behavior for output variable list view form fields
        Object.keys(outputVarSchema).forEach(outputVarKey => {
            if (outputVarKey === 'name') return;
            
            const fieldId = 'outputVar' + outputVarKey;
            const field = document.getElementById(fieldId);
            const checkbox = document.getElementById(fieldId + 'Editable');
            
            if (field && checkbox) {
                // Set initial state
                updateInputStyle(field, checkbox.checked);
                
                // Set initial browse button state for sourceObjectName field
                if (outputVarKey === 'sourceObjectName') {
                    const browseButton = field.parentElement.querySelector('.lookup-button');
                    if (browseButton) {
                        browseButton.disabled = !checkbox.checked;
                        console.log('List view: initialized browse button state for', outputVarKey, 'disabled:', !checkbox.checked);
                    }
                }
                
                // Add event listener for checkbox state changes
                checkbox.addEventListener('change', function() {
                    // Get the currently selected output variable index
                    const selectedIndex = outputVarsList.value;
                    if (selectedIndex === '') return;
                    
                    if (field.tagName === 'INPUT') {
                        field.readOnly = !this.checked;
                    } else if (field.tagName === 'SELECT') {
                        field.disabled = !this.checked;
                    }
                    updateInputStyle(field, this.checked);
                    
                    // Enable/disable browse button for sourceObjectName field
                    if (outputVarKey === 'sourceObjectName') {
                        const browseButton = field.parentElement.querySelector('.lookup-button');
                        if (browseButton) {
                            browseButton.disabled = !this.checked;
                            console.log('List view: checkbox changed for', outputVarKey, 'checked:', this.checked, 'button disabled:', !this.checked);
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
                        command: 'updateOutputVar',
                        data: {
                            index: parseInt(selectedIndex),
                            property: outputVarKey,
                            exists: this.checked,
                            value: this.checked ? field.value : null
                        }
                    });
                    
                    // Update the local currentOutputVars array
                    const currentOutputVarIndex = parseInt(selectedIndex);
                    if (this.checked) {
                        // Add or update the property in the local array
                        currentOutputVars[currentOutputVarIndex][outputVarKey] = field.value;
                    } else {
                        // Remove the property from the local array
                        delete currentOutputVars[currentOutputVarIndex][outputVarKey];
                    }
                });
                
                // Update model when input value changes
                const updateInputHandler = function() {
                    const selectedIndex = outputVarsList.value;
                    if (selectedIndex === '' || !checkbox.checked) return;
                    
                    // Send message to update the model
                    vscode.postMessage({
                        command: 'updateOutputVar',
                        data: {
                            index: parseInt(selectedIndex),
                            property: outputVarKey,
                            exists: true,
                            value: field.value
                        }
                    });
                    
                    // Update the local currentOutputVars array
                    const currentOutputVarIndex = parseInt(selectedIndex);
                    currentOutputVars[currentOutputVarIndex][outputVarKey] = field.value;
                };
                
                if (field.tagName === 'SELECT') {
                    field.addEventListener('change', updateInputHandler);
                } else {
                    field.addEventListener('input', updateInputHandler);
                    field.addEventListener('change', updateInputHandler);
                }
            }
        });
        
        // Initialize outputVarsList - hide details if no output variable is selected
        if (outputVarsList && outputVarDetailsContainer && (!outputVarsList.value || outputVarsList.value === "")) {
            outputVarDetailsContainer.style.display = 'none';
        }
    }

    // Output variable table checkbox functionality (for output variables table view)
    document.querySelectorAll('.outputvar-checkbox').forEach(checkbox => {
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
                
                // Enable/disable browse button for sourceObjectName field
                if (propName === 'sourceObjectName') {
                    const browseButton = tableCell.querySelector('.lookup-button');
                    if (browseButton) {
                        browseButton.disabled = false;
                        console.log('Enabled browse button for', propName);
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
                
                // Enable/disable browse button for sourceObjectName field
                if (propName === 'sourceObjectName') {
                    const browseButton = tableCell.querySelector('.lookup-button');
                    if (browseButton) {
                        browseButton.disabled = true;
                        console.log('Disabled browse button for', propName);
                    }
                }
            }
            
            // Send message to update the model
            vscode.postMessage({
                command: 'updateOutputVar',
                data: {
                    index: parseInt(index),
                    property: propName,
                    exists: this.checked,
                    value: this.checked ? inputElement.value : null
                }
            });
            
            // Update the local currentOutputVars array
            const outputVarIndex = parseInt(index);
            if (this.checked) {
                // Add or update the property in the local array
                currentOutputVars[outputVarIndex][propName] = inputElement.value;
            } else {
                // Remove the property from the local array
                delete currentOutputVars[outputVarIndex][propName];
            }
        });
    });

    // Handle input changes for output variables table
    document.querySelectorAll('#outputVars-table input[type="text"], #outputVars-table select').forEach(input => {
        const updateOutputVar = () => {
            const tableCell = input.closest('td');
            if (!tableCell) return;
            
            const checkbox = tableCell.querySelector('.outputvar-checkbox');
            if (!checkbox || !checkbox.checked) return;
            
            const propName = checkbox.getAttribute('data-prop');
            const index = checkbox.getAttribute('data-index');
            
            // Send message to update the model
            vscode.postMessage({
                command: 'updateOutputVar',
                data: {
                    index: parseInt(index),
                    property: propName,
                    exists: true,
                    value: input.value
                }
            });
            
            // Update the local currentOutputVars array
            const outputVarIndex = parseInt(index);
            currentOutputVars[outputVarIndex][propName] = input.value;
        };
        
        if (input.tagName === 'SELECT') {
            input.addEventListener('change', updateOutputVar);
        } else {
            input.addEventListener('input', updateOutputVar);
            input.addEventListener('change', updateOutputVar);
        }
    });

    // Output variable tab functionality
    function initializeOutputVariableTabFunctionality() {
        // Initialize output variable buttons
        initializeOutputVariableButtons();
    }

    // Output variable button handlers
    function initializeOutputVariableButtons() {
        const outputVarsList = document.getElementById('outputVarsList');
        
        // Handle copy, move up/down, and reverse buttons for output variables
        document.getElementById('copyOutputVarButton')?.addEventListener('click', () => {
            try {
                // Get all output variable names from the list
                if (!outputVarsList) return;
                
                const outputVarList = [];
                for (let i = 0; i < outputVarsList.options.length; i++) {
                    outputVarList.push(outputVarsList.options[i].text);
                }
                
                // Create formatted text for copying
                const textToCopy = outputVarList.join('\\n');
                
                // Copy to clipboard using the modern Clipboard API
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        console.log('Output variables copied to clipboard');
                        // Provide visual feedback
                        const copyButton = document.getElementById('copyOutputVarButton');
                        if (copyButton) {
                            const originalText = copyButton.textContent;
                            copyButton.textContent = 'Copied!';
                            setTimeout(() => {
                                copyButton.textContent = originalText;
                            }, 2000);
                        }
                    }).catch(err => {
                        console.error('Failed to copy output variables: ', err);
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
                    const copyButton = document.getElementById('copyOutputVarButton');
                    if (copyButton) {
                        const originalText = copyButton.textContent;
                        copyButton.textContent = 'Copied!';
                        setTimeout(() => {
                            copyButton.textContent = originalText;
                        }, 2000);
                    }
                }
            } catch (err) {
                console.error('Error copying output variables: ', err);
            }
        });
        
        document.getElementById('moveUpOutputVarButton')?.addEventListener('click', () => {
            if (!outputVarsList.value) {
                return;
            }
            
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
            if (!outputVarsList.value) {
                return;
            }
            
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
    
    // Initialize output variable functionality
    initializeOutputVariableTabFunctionality();
    `;
}

module.exports = {
    getOutputVariableManagementFunctions
};

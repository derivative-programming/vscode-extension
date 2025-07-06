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
    // Output variable tab functionality
function initializeOutputVariableTabFunctionality() {
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
}

// Output variable list functionality
function initializeOutputVariableListView() {
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
        const outputVarSchemaProps = window.outputVarSchemaProps || {};
        Object.keys(outputVarSchemaProps).forEach(outputVarKey => {
            if (outputVarKey === 'name') {
                return;
            }
            
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
    }
}

// Output variable button handlers
function initializeOutputVariableButtons() {
    const outputVarsList = document.getElementById('outputVarsList');
    
    // Handle copy, move up/down, and reverse buttons for output variables
    document.getElementById('copyOutputVarButton')?.addEventListener('click', () => {
        if (!outputVarsList.value) {
            return;
        }
        
        const selectedIndex = parseInt(outputVarsList.value);
        vscode.postMessage({
            command: 'copyOutputVar',
            index: selectedIndex
        });
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
    
    // Add output variable button
    document.getElementById('add-output-var-btn')?.addEventListener('click', () => {
        vscode.postMessage({
            command: 'addOutputVar'
        });
    });
}

// Output variable table functionality
function initializeOutputVariableTableView() {
    // Handle checkbox changes in output variables table
    document.querySelectorAll('.outputvar-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', event => {
            const index = parseInt(event.target.dataset.index);
            const prop = event.target.dataset.prop;
            const isChecked = event.target.checked;
            
            const row = event.target.closest('tr');
            const input = row.querySelector('[name="' + prop + '"]');
            
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
        if (input.type === 'checkbox') {
            return; // Skip checkbox inputs
        }
        
        input.addEventListener('change', event => {
            const row = event.target.closest('tr');
            if (!row) {
                return;
            }
            
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
}

// Output variable CRUD operations
function initializeOutputVariableCrudOperations() {
    // Handle output variable edit events
    document.querySelectorAll('.edit-outputvar').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            if (!index) {
                return;
            }
            
            const outputVarIndex = parseInt(index);
            
            // Get the output variable data for editing
            const outputVarData = currentOutputVars[outputVarIndex];
            if (!outputVarData) {
                return;
            }
            
            // Set the index in the hidden field
            document.getElementById('output-var-index').value = outputVarIndex;
            
            // Populate the form fields in the edit modal
            Object.keys(outputVarData).forEach(key => {
                const input = document.getElementById("output-var-" + key);
                if (input) {
                    input.value = outputVarData[key];
                    
                    // Check the toggle checkbox
                    const toggleCheckbox = document.getElementById("output-var-" + key + "-toggle");
                    if (toggleCheckbox) {
                        toggleCheckbox.checked = true;
                    }
                }
            });
            
            // Open the modal
            openModal('output-var-modal');
        });
    });
    
    // Handle output variable copy events
    document.querySelectorAll('.copy-outputvar').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            if (!index) {
                return;
            }
            
            vscode.postMessage({
                command: 'copyOutputVar',
                index: parseInt(index)
            });
        });
    });

    // Handle output variable move up events
    document.querySelectorAll('.move-up-outputvar').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            if (index > 0) {
                vscode.postMessage({
                    command: 'moveOutputVar',
                    fromIndex: index,
                    toIndex: index - 1
                });
            }
        });
    });

    // Handle output variable move down events
    document.querySelectorAll('.move-down-outputvar').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            if (index < currentOutputVars.length - 1) {
                vscode.postMessage({
                    command: 'moveOutputVar',
                    fromIndex: index,
                    toIndex: index + 1
                });
            }
        });
    });
}

// Output variable field generator
function generateOutputVarFields(outputVar) {
    const fieldsContainer = document.getElementById('outputVarDetailsForm');
    if (!fieldsContainer) {
        return;
    }
    
    const outputVarSchemaProps = window.outputVarSchemaProps || {};
    
    // Only handle the form fields that are already in the DOM
    Object.keys(outputVarSchemaProps).forEach(propName => {
        if (propName === 'name') {
            return; // Skip name field as it's in the list
        }
        
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
    });
}
    `;
}

module.exports = {
    getOutputVariableManagementFunctions
};

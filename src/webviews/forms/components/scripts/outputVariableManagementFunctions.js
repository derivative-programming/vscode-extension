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
        
        // Initialize output variable buttons
        initializeOutputVariableButtons();
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
    }
    
    // Initialize output variable functionality
    initializeOutputVariableTabFunctionality();
    `;
}

module.exports = {
    getOutputVariableManagementFunctions
};

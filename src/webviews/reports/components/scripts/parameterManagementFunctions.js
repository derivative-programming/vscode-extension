"use strict";

/**
 * File: parameterManagementFunctions.js
 * Purpose: Provides functions for managing parameters (filters) in the report details view
 * Created: 2025-07-06
 */

/**
 * Provides functions for managing parameters in the report details view
 * @returns {string} JavaScript code as a string for parameter management
 */
function getParameterManagementFunctions() {
    return `
    // --- PARAMETERS FUNCTIONALITY ---
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
                        // Update the local currentParams array first
                        const currentParamIndex = parseInt(selectedIndex);
                        if (this.checked) {
                            // Add or update the property in the local array
                            currentParams[currentParamIndex][paramKey] = field.value;
                        } else {
                            // Remove the property from the local array
                            delete currentParams[currentParamIndex][paramKey];
                        }
                        
                        vscode.postMessage({
                            command: 'updateParam',
                            data: {
                                index: currentParamIndex,
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
                            const currentParamIndex = parseInt(selectedIndex);
                            
                            // Update the local currentParams array first
                            currentParams[currentParamIndex][paramKey] = this.value;
                            
                            vscode.postMessage({
                                command: 'updateParam',
                                data: {
                                    index: currentParamIndex,
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

    // Add parameter button click handler
    document.getElementById('add-param-btn').addEventListener('click', function() {
        // Use the new add parameter modal instead of the edit modal
        createAddParamModal();
    });

    // Function to add a new parameter (called from add parameter modal)
    function addNewParam(paramName) {
        const newParam = {
            name: paramName
        };
        
        // Add to current parameters array for immediate backend update
        const updatedParams = [...currentParams, newParam];
        
        // Get the currently active tab to preserve it after reload
        const activeTab = document.querySelector('.tab.active');
        const currentTabId = activeTab ? activeTab.getAttribute('data-tab') : 'params';
        
        // Send message to update the model - backend will reload the view
        vscode.postMessage({
            command: 'updateModel',
            data: {
                params: updatedParams,
                preserveTab: currentTabId
            }
        });
        
        // Note: View will be automatically reloaded by backend after model update
        // No need to update frontend UI here - backend will regenerate entire view
    }

    // Function to create and show the Add Parameter modal
    function createAddParamModal() {
        // Create modal dialog for adding parameters
        const modal = document.createElement("div");
        modal.className = "modal";
        
        // Import the modal HTML template
        const modalContent = getAddParamModalHtml();
        
        // Set the modal content
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);
        
        // Wait for DOM to be ready before attaching event listeners
        setTimeout(() => {
            // Show the modal
            modal.style.display = "flex";
            
            // Attach event listeners after modal is in DOM and visible
            attachParamModalEventListeners(modal);
            
            // Focus on the parameter name input when modal opens (single parameter tab is active by default)
            const paramNameInput = modal.querySelector("#paramName");
            if (paramNameInput) {
                paramNameInput.focus();
            }
        }, 10);
    }

    // Function to attach event listeners to the parameter modal
    function attachParamModalEventListeners(modal) {
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
                        const paramNameInput = modal.querySelector("#paramName");
                        if (paramNameInput) {
                            paramNameInput.focus();
                        }
                    } else if (tabId === 'bulkAdd') {
                        const bulkParamsTextarea = modal.querySelector("#bulkParams");
                        if (bulkParamsTextarea) {
                            bulkParamsTextarea.focus();
                        }
                    }
                }, 10);
            });
        });

        // Close modal when clicking the x button
        modal.querySelector(".close-button").addEventListener("click", function() {
            document.body.removeChild(modal);
        });

        // Close modal when clicking outside the modal content
        modal.addEventListener("click", function(event) {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Add Enter key handling for single parameter input
        const paramNameInput = modal.querySelector("#paramName");
        if (paramNameInput) {
            paramNameInput.addEventListener("keypress", function(event) {
                if (event.key === "Enter") {
                    event.preventDefault(); // Prevent default Enter behavior
                    const addButton = modal.querySelector("#addSingleParam");
                    if (addButton && !addButton.disabled) {
                        addButton.click();
                    }
                }
            });
        }
        
        // Add Enter key handling for bulk parameters textarea (Enter submits, Shift+Enter for new line)
        const bulkParamsTextarea = modal.querySelector("#bulkParams");
        if (bulkParamsTextarea) {
            bulkParamsTextarea.addEventListener("keydown", function(event) {
                if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault(); // Prevent default Enter behavior
                    const addButton = modal.querySelector("#addBulkParams");
                    if (addButton && !addButton.disabled) {
                        addButton.click();
                    }
                }
                // Shift+Enter will allow new line (default behavior)
            });
        }

        // Validate parameter name function
        function validateParamName(name) {
            if (!name) {
                return "Parameter name cannot be empty";
            }
            if (name.length > 100) {
                return "Parameter name cannot exceed 100 characters";
            }
            if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
                return "Parameter name must start with a letter and contain only letters and numbers";
            }
            if (currentParams.some(param => param.name === name)) {
                return "Parameter with this name already exists";
            }
            return null; // Valid
        }
        
        // Add single parameter button event listener
        modal.querySelector("#addSingleParam").addEventListener("click", function() {
            const paramName = modal.querySelector("#paramName").value.trim();
            const errorElement = modal.querySelector("#singleValidationError");
            
            const validationError = validateParamName(paramName);
            if (validationError) {
                errorElement.textContent = validationError;
                return;
            }
            
            // Add the new parameter - backend will reload view
            addNewParam(paramName);
            
            // Close the modal
            document.body.removeChild(modal);
        });
        
        // Add bulk parameters button event listener
        modal.querySelector("#addBulkParams").addEventListener("click", function() {
            const bulkParams = modal.querySelector("#bulkParams").value;
            const paramNames = bulkParams.split("\\n").map(name => name.trim()).filter(name => name);
            const errorElement = modal.querySelector("#bulkValidationError");
            
            // Validate all parameter names
            const errors = [];
            const validParams = [];
            
            paramNames.forEach(name => {
                const validationError = validateParamName(name);
                if (validationError) {
                    errors.push("\\"" + name + "\\": " + validationError);
                } else {
                    validParams.push(name);
                }
            });
            
            if (errors.length > 0) {
                errorElement.innerHTML = errors.join("<br>");
                return;
            }
            
            // Add all valid parameters at once
            const newParams = validParams.map(name => ({
                name: name
            }));

            // Add all parameters in one operation
            const updatedParams = [...currentParams, ...newParams];
            
            // Get the currently active tab to preserve it after reload
            const activeTab = document.querySelector('.tab.active');
            const currentTabId = activeTab ? activeTab.getAttribute('data-tab') : 'params';
            
            // Send message to update the model - backend will reload the view
            vscode.postMessage({
                command: 'updateModel',
                data: {
                    params: updatedParams,
                    preserveTab: currentTabId
                }
            });
            
            // Close the modal
            document.body.removeChild(modal);
        });
    }
    `;
}

module.exports = {
    getParameterManagementFunctions
};

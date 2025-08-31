"use strict";

/**
 * File: endpointManagementFunctions.js
 * Purpose: Endpoint management functions for the API details view
 * Created: 2025-01-27
 */

/**
 * Gets endpoint management functions for the API details view
 * @returns {string} JavaScript code for endpoint management
 */
function getEndpointManagementFunctions() {
    return `
    // --- ENDPOINTS TAB FUNCTIONALITY ---
    
    // Endpoint list change handler for list view
    const endpointsList = document.getElementById('endpointsList');
    const endpointDetailsContainer = document.getElementById('endpointDetailsContainer');
    
    if (endpointsList && endpointDetailsContainer) {
        endpointsList.addEventListener('change', (event) => {
            const selectedIndex = event.target.value;
            const endpoint = currentEndpoints[selectedIndex];

            // Only proceed if we have a valid endpoint object
            if (!endpoint) {
                endpointDetailsContainer.style.display = 'none';
                return;
            }

            // Show endpoint details container when an item is selected
            endpointDetailsContainer.style.display = 'block';

            // Update form fields with endpoint values
            Object.keys(endpointSchema).forEach(endpointKey => {
                if (endpointKey === 'name') return; // Skip name field as it's in the list
                
                const fieldId = 'endpoint' + endpointKey;
                const field = document.getElementById(fieldId);
                const checkbox = document.getElementById(fieldId + 'Editable');
                
                if (field && checkbox) {
                    // Check if property exists and is not null or undefined
                    const propertyExists = endpoint.hasOwnProperty(endpointKey) && endpoint[endpointKey] !== null && endpoint[endpointKey] !== undefined;
                    
                    if (field.tagName === 'SELECT') {
                        if (propertyExists) {
                            // If property exists, use its value
                            field.value = endpoint[endpointKey];
                        } else {
                            // If property doesn't exist, use default value logic
                            const schema = endpointSchema[endpointKey] || {};
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
                        field.value = propertyExists ? endpoint[endpointKey] : '';
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
                    
                    // Set browse button state for specific fields (if any)
                    // This follows the form pattern for browse buttons
                    if (endpointKey === 'sourceObjectName' || endpointKey === 'targetObjectName') {
                        const browseButton = document.querySelector('[data-field-id="' + fieldId + '"].lookup-button');
                        if (browseButton) {
                            browseButton.disabled = !checkbox.checked;
                        }
                    }
                }
            });
        });
    }

    // Handle endpoint property changes
    function handleEndpointPropertyChange(fieldId, newValue) {
        const selectedIndex = parseInt(endpointsList?.value);
        if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= currentEndpoints.length) {
            console.warn('No valid endpoint selected for property change');
            return;
        }

        // Extract property name from field ID (remove 'endpoint' prefix)
        const propertyName = fieldId.replace('endpoint', '');
        
        console.log(\`Endpoint property change: \${propertyName} = \${newValue}\`);

        // Create a copy of the current endpoint data
        const updatedEndpoint = { ...currentEndpoints[selectedIndex] };
        
        if (newValue === '' || newValue === null || newValue === undefined) {
            // Remove the property if value is empty
            delete updatedEndpoint[propertyName];
        } else {
            // Set the property value
            updatedEndpoint[propertyName] = newValue;
        }

        // Update the endpoints array
        currentEndpoints[selectedIndex] = updatedEndpoint;

        // Send the update to the extension
        vscode.postMessage({
            command: 'updateEndpointFull',
            data: {
                index: selectedIndex,
                endpoint: updatedEndpoint
            }
        });
    }

    // Handle endpoint property checkbox changes (enable/disable editing)
    function handleEndpointPropertyCheckboxChange(checkboxId, isChecked) {
        const fieldId = checkboxId.replace('Editable', '');
        const field = document.getElementById(fieldId);
        
        if (!field) return;

        if (isChecked) {
            // Enable editing
            if (field.tagName === 'SELECT') {
                field.disabled = false;
                // Set default value for select elements
                if (field.options.length > 0) {
                    field.value = field.options[0].value;
                }
            } else if (field.tagName === 'INPUT') {
                field.readOnly = false;
                // Keep existing value or set empty
                field.value = field.value || '';
            }
            
            // Update styling
            updateInputStyle(field, true);
            
            // Trigger property change to add the property
            handleEndpointPropertyChange(fieldId, field.value);
        } else {
            // Disable editing and remove property
            if (field.tagName === 'SELECT') {
                field.disabled = true;
            } else if (field.tagName === 'INPUT') {
                field.readOnly = true;
            }
            field.value = '';
            
            // Update styling
            updateInputStyle(field, false);
            
            handleEndpointPropertyChange(fieldId, '');
        }
    }

    // Update input styling based on enabled/disabled state (matching form pattern)
    function updateInputStyle(inputElement, isEnabled) {
        if (isEnabled) {
            inputElement.style.backgroundColor = '';
            inputElement.style.color = '';
            inputElement.style.opacity = '';
            inputElement.style.cursor = '';
        } else {
            inputElement.style.backgroundColor = 'var(--vscode-input-disabledBackground, #e9e9e9)';
            inputElement.style.color = 'var(--vscode-input-disabledForeground, #999)';
            inputElement.style.opacity = '0.8';
            inputElement.style.cursor = 'not-allowed';
        }
    }

    // Copy endpoints list functionality
    function copyEndpointsList() {
        const endpointNames = currentEndpoints.map(endpoint => endpoint.name || 'Unnamed Endpoint').join('\\n');
        navigator.clipboard.writeText(endpointNames)
            .then(() => console.log('Endpoints list copied to clipboard'))
            .catch(() => console.log('Failed to copy endpoints list'));
    }

    // Move endpoint up
    function moveEndpointUp() {
        const selectedIndex = parseInt(endpointsList?.value);
        if (isNaN(selectedIndex) || selectedIndex <= 0) return;

        vscode.postMessage({
            command: 'moveEndpointInArray',
            data: {
                fromIndex: selectedIndex,
                toIndex: selectedIndex - 1
            }
        });
    }

    // Move endpoint down
    function moveEndpointDown() {
        const selectedIndex = parseInt(endpointsList?.value);
        if (isNaN(selectedIndex) || selectedIndex >= currentEndpoints.length - 1) return;

        vscode.postMessage({
            command: 'moveEndpointInArray',
            data: {
                fromIndex: selectedIndex,
                toIndex: selectedIndex + 1
            }
        });
    }

    // Reverse endpoints array
    function reverseEndpoints() {
        if (currentEndpoints.length < 2) return;

        vscode.postMessage({
            command: 'reverseEndpointsArray',
            data: {}
        });
    }

    // Set up endpoint event listeners
    function setupEndpointEventListeners() {
        // Endpoints list buttons
        const copyEndpointsButton = document.getElementById('copyEndpointsButton');
        if (copyEndpointsButton) {
            copyEndpointsButton.addEventListener('click', copyEndpointsList);
        }

        const moveUpEndpointsButton = document.getElementById('moveUpEndpointsButton');
        if (moveUpEndpointsButton) {
            moveUpEndpointsButton.addEventListener('click', moveEndpointUp);
        }

        const moveDownEndpointsButton = document.getElementById('moveDownEndpointsButton');
        if (moveDownEndpointsButton) {
            moveDownEndpointsButton.addEventListener('click', moveEndpointDown);
        }

        const reverseEndpointsButton = document.getElementById('reverseEndpointsButton');
        if (reverseEndpointsButton) {
            reverseEndpointsButton.addEventListener('click', reverseEndpoints);
        }

        // Initialize toggle editable behavior for endpoint list view form fields  
        Object.keys(endpointSchema).forEach(endpointKey => {
            if (endpointKey === 'name') return;
            
            const fieldId = 'endpoint' + endpointKey;
            const field = document.getElementById(fieldId);
            const checkbox = document.getElementById(fieldId + 'Editable');
            
            if (field && checkbox) {
                // Set initial state
                updateInputStyle(field, checkbox.checked);
                
                // Add event listener for checkbox state changes
                checkbox.addEventListener('change', function() {
                    // Get the currently selected endpoint index
                    const selectedIndex = endpointsList.value;
                    if (selectedIndex === '') return;
                    
                    if (field.tagName === 'INPUT') {
                        field.readOnly = !this.checked;
                    } else if (field.tagName === 'SELECT') {
                        field.disabled = !this.checked;
                    }
                    updateInputStyle(field, this.checked);
                    
                    // Handle browse button state for specific fields
                    if (endpointKey === 'sourceObjectName' || endpointKey === 'targetObjectName') {
                        const browseButton = document.querySelector('[data-field-id="' + fieldId + '"].lookup-button');
                        if (browseButton) {
                            browseButton.disabled = !this.checked;
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
                    const selectedEndpointIndex = parseInt(selectedIndex);
                    const updatedEndpoint = { ...currentEndpoints[selectedEndpointIndex] };
                    
                    if (this.checked) {
                        // Add or update the property in the endpoint
                        updatedEndpoint[endpointKey] = field.value;
                    } else {
                        // Remove the property from the endpoint
                        delete updatedEndpoint[endpointKey];
                    }
                    
                    // Update local array and send to backend
                    currentEndpoints[selectedEndpointIndex] = updatedEndpoint;
                    vscode.postMessage({
                        command: 'updateEndpointFull',
                        data: {
                            index: selectedEndpointIndex,
                            endpoint: updatedEndpoint
                        }
                    });
                });
                
                // Update model when input value changes
                const updateInputHandler = function() {
                    const selectedIndex = endpointsList.value;
                    if (selectedIndex === '' || !checkbox.checked) return;
                    
                    // Send message to update the model
                    const selectedEndpointIndex = parseInt(selectedIndex);
                    const updatedEndpoint = { ...currentEndpoints[selectedEndpointIndex] };
                    updatedEndpoint[endpointKey] = field.value;
                    
                    // Update local array and send to backend
                    currentEndpoints[selectedEndpointIndex] = updatedEndpoint;
                    vscode.postMessage({
                        command: 'updateEndpointFull',
                        data: {
                            index: selectedEndpointIndex,
                            endpoint: updatedEndpoint
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
        
        // Initialize endpointsList - hide details if no endpoint is selected
        if (endpointsList && endpointDetailsContainer && (!endpointsList.value || endpointsList.value === "")) {
            endpointDetailsContainer.style.display = 'none';
        }
    }
    `;
}

module.exports = {
    getEndpointManagementFunctions
};
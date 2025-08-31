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
                            field.disabled = false;
                            checkbox.checked = true;
                        } else {
                            // If property doesn't exist, reset
                            field.value = '';
                            field.disabled = true;
                            checkbox.checked = false;
                        }
                    } else {
                        if (propertyExists) {
                            // If property exists, use its value
                            field.value = endpoint[endpointKey];
                            field.disabled = false;
                            checkbox.checked = true;
                        } else {
                            // If property doesn't exist, reset
                            field.value = '';
                            field.disabled = true;
                            checkbox.checked = false;
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
            field.disabled = false;
            // Set default value for enums
            if (field.tagName === 'SELECT' && field.options.length > 1) {
                field.value = field.options[1].value; // First non-empty option
            } else if (field.tagName === 'INPUT') {
                // Keep existing value or set empty
                field.value = field.value || '';
            }
            // Trigger property change to add the property
            handleEndpointPropertyChange(fieldId, field.value);
        } else {
            // Disable editing and remove property
            field.disabled = true;
            field.value = '';
            handleEndpointPropertyChange(fieldId, '');
        }
    }

    // Add endpoint functionality
    function addEndpoint() {
        console.log('Add endpoint clicked');
        // Show modal for adding new endpoint with name
        const name = prompt('Enter endpoint name:');
        if (name && name.trim()) {
            vscode.postMessage({
                command: 'addEndpointWithName',
                data: { name: name.trim() }
            });
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
        // Add endpoint button
        const addEndpointBtn = document.getElementById('add-endpoint-btn');
        if (addEndpointBtn) {
            addEndpointBtn.addEventListener('click', addEndpoint);
        }

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

        // Endpoint property change listeners
        Object.keys(endpointSchema).forEach(endpointKey => {
            if (endpointKey === 'name') return;
            
            const fieldId = 'endpoint' + endpointKey;
            const field = document.getElementById(fieldId);
            const checkbox = document.getElementById(fieldId + 'Editable');
            
            if (field) {
                field.addEventListener('change', (e) => {
                    handleEndpointPropertyChange(fieldId, e.target.value);
                });
                
                field.addEventListener('input', (e) => {
                    handleEndpointPropertyChange(fieldId, e.target.value);
                });
            }
            
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    handleEndpointPropertyCheckboxChange(fieldId + 'Editable', e.target.checked);
                });
            }
        });
    }
    `;
}

module.exports = {
    getEndpointManagementFunctions
};
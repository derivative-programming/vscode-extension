"use strict";

/**
 * Provides event listeners for form submissions and property list selection
 * @returns {string} JavaScript code as a string for save and submit handlers
 */
function getSaveSubmitHandlers() {
    return `
    // Property list change handler
    propsList.addEventListener('change', (event) => {
        const selectedIndex = event.target.value;
        const prop = props[selectedIndex];

        // Show property details container when an item is selected
        propertyDetailsContainer.style.display = 'block';

        // Update form fields with property values
        propColumns.forEach(propKey => {
            if (propKey === 'name') return; // Skip name field as it's in the list
            
            const fieldId = 'prop' + propKey;
            const field = document.getElementById(fieldId);
            const checkbox = document.getElementById(fieldId + 'Editable');
            
            if (field && checkbox) {
                if (field.tagName === 'SELECT') {
                    field.value = prop[propKey] || '';
                    field.disabled = !prop.hasOwnProperty(propKey);
                } else {
                    field.value = prop[propKey] || '';
                    field.readOnly = !prop.hasOwnProperty(propKey);
                }
                
                checkbox.checked = prop.hasOwnProperty(propKey);
                
                if (!checkbox.checked) {
                    field.style.backgroundColor = 'var(--vscode-input-disabledBackground, #e9e9e9)';
                    field.style.color = 'var(--vscode-input-disabledForeground, #999)';
                    field.style.opacity = '0.8';
                } else {
                    field.style.backgroundColor = 'var(--vscode-input-background)';
                    field.style.color = 'var(--vscode-input-foreground)';
                    field.style.opacity = '1';
                }
            }
        });
    });

    // Hide property details when no property is selected
    propsList.addEventListener('click', (event) => {
        if (!propsList.value) {
            propertyDetailsContainer.style.display = 'none';
        }
    });

    // Add Property button click handler
    document.getElementById("addProp").addEventListener("click", function() {
        // Call the function to create and show the modal
        createPropertyModal();
        
        // After adding the property, update the model with the new property
        document.addEventListener('propertyAdded', function(e) {
            vscode.postMessage({
                command: "updateModel",
                data: {
                    name: objectName,
                    props: props
                }
            });
        }, { once: true });
    });

    // Add change event listeners to all form fields for real-time updates
    function setupRealTimeUpdates() {
        // For property details form
        const form = document.getElementById('propDetailsForm');
        if (form) {
            propColumns.forEach(propKey => {
                if (propKey === 'name') return;
                
                const fieldId = 'prop' + propKey;
                const field = document.getElementById(fieldId);
                const checkbox = document.getElementById(fieldId + 'Editable');
                
                if (field) {
                    // Add change event listener to input/select fields
                    field.addEventListener('change', () => updatePropertyField(propKey, field, checkbox));
                    field.addEventListener('input', () => updatePropertyField(propKey, field, checkbox));
                }
                
                if (checkbox) {
                    // Add change event listener to checkboxes
                    checkbox.addEventListener('change', () => {
                        if (checkbox.checked) {
                            field.readOnly = false;
                            field.disabled = false;
                            field.style.backgroundColor = 'var(--vscode-input-background)';
                            field.style.color = 'var(--vscode-input-foreground)';
                            field.style.opacity = '1';
                        } else {
                            field.readOnly = true;
                            field.disabled = true;
                            field.style.backgroundColor = 'var(--vscode-input-disabledBackground, #e9e9e9)';
                            field.style.color = 'var(--vscode-input-disabledForeground, #999)';
                            field.style.opacity = '0.8';
                            
                            // Update model with property removed
                            const selectedIndex = propsList.value;
                            if (selectedIndex !== null && selectedIndex !== undefined) {
                                const prop = props[selectedIndex];
                                delete prop[propKey];
                                
                                vscode.postMessage({
                                    command: "updateModel",
                                    data: {
                                        name: objectName,
                                        props: props
                                    }
                                });
                            }
                        }
                    });
                }
            });
        }
        
        // For table rows
        const rows = document.querySelectorAll("#propsTable tbody tr");
        rows.forEach(row => {
            const index = parseInt(row.getAttribute("data-index"));
            
            propColumns.forEach(propKey => {
                const input = row.querySelector('[name="' + propKey + '"]');
                const checkbox = row.querySelector('.prop-checkbox[data-prop="' + propKey + '"]');
                
                if (input) {
                    input.addEventListener('change', () => updateTableField(index, propKey, input, checkbox));
                    input.addEventListener('input', () => updateTableField(index, propKey, input, checkbox));
                }
                
                if (checkbox) {
                    checkbox.addEventListener('change', () => {
                        if (checkbox.checked) {
                            if (input) {
                                input.readOnly = false;
                                input.disabled = false;
                                input.style.backgroundColor = 'var(--vscode-input-background)';
                                input.style.color = 'var(--vscode-input-foreground)';
                                input.style.opacity = '1';
                                
                                // Update model with property added
                                props[index][propKey] = input.value;
                            }
                        } else {
                            if (input) {
                                input.readOnly = true;
                                input.disabled = true;
                                input.style.backgroundColor = 'var(--vscode-input-disabledBackground, #e9e9e9)';
                                input.style.color = 'var(--vscode-input-disabledForeground, #999)';
                                input.style.opacity = '0.8';
                                
                                // Update model with property removed
                                delete props[index][propKey];
                            }
                        }
                        
                        vscode.postMessage({
                            command: "updateModel",
                            data: {
                                name: objectName,
                                props: props
                            }
                        });
                    });
                }
            });
        });
    }

    // Helper function to update property from form fields
    function updatePropertyField(propKey, field, checkbox) {
        const selectedIndex = propsList.value;
        if (selectedIndex === null || selectedIndex === undefined) return;
        
        if (checkbox && checkbox.checked) {
            // Update the property in the model
            props[selectedIndex][propKey] = field.value;
            
            // Send update to extension
            vscode.postMessage({
                command: "updateModel",
                data: {
                    name: objectName,
                    props: props
                }
            });
        }
    }
    
    // Helper function to update property from table fields
    function updateTableField(index, propKey, input, checkbox) {
        if (checkbox && checkbox.checked) {
            // Update the property in the model
            props[index][propKey] = input.value;
            
            // Send update to extension
            vscode.postMessage({
                command: "updateModel",
                data: {
                    name: objectName,
                    props: props
                }
            });
        }
    }
    
    // Set up real-time update handlers after DOM is fully loaded
    document.addEventListener('DOMContentLoaded', setupRealTimeUpdates);
    // Also call it directly in case DOM is already loaded
    setupRealTimeUpdates();
    `;
}

module.exports = {
    getSaveSubmitHandlers
};
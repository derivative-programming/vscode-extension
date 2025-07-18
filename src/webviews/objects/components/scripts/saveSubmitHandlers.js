"use strict";

/**
 * Provides event listeners for form submissions and property list selection
 * @returns {string} JavaScript code as a string for save and submit handlers
 */
function getSaveSubmitHandlers() {
    return `
    // Add change event listeners to all form fields for real-time updates
    function setupRealTimeUpdates() {
        // Set up property list selection handlers
        const propsList = document.getElementById('propsList');
        const propertyDetailsContainer = document.getElementById('propertyDetailsContainer');
        
        if (propsList && propertyDetailsContainer) {
            // Remove existing event listeners to prevent duplicates
            const newPropsList = propsList.cloneNode(true);
            propsList.parentNode.replaceChild(newPropsList, propsList);
            
            // Property list change handler
            newPropsList.addEventListener('change', (event) => {
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
                        // Check if property exists and is not null or undefined
                        const propertyExists = prop.hasOwnProperty(propKey) && prop[propKey] !== null && prop[propKey] !== undefined;
                        
                        if (field.tagName === 'SELECT') {
                            if (propertyExists) {
                                // If property exists, use its value
                                field.value = prop[propKey];
                            } else {
                                // If property doesn't exist, use default value logic
                                const propSchema = propItemsSchema[propKey] || {};
                                if (propSchema.default !== undefined) {
                                    // Use the schema's default value if available
                                    field.value = propSchema.default;
                                } else {
                                    // Otherwise, leave the default that was set in the HTML template
                                    // The template already handles boolean enums and first-option defaults
                                }
                            }
                            field.disabled = !propertyExists;
                        } else {
                            field.value = propertyExists ? prop[propKey] : '';
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
                          if (!checkbox.checked) {
                            field.style.backgroundColor = 'var(--vscode-input-disabledBackground, #e9e9e9)';
                            field.style.color = 'var(--vscode-input-disabledForeground, #999)';
                            field.style.opacity = '0.8';
                        } else {
                            field.style.backgroundColor = 'var(--vscode-input-background)';
                            field.style.color = 'var(--vscode-input-foreground)';
                            field.style.opacity = '1';
                        }
                        
                        // Handle lookup button state for fKObjectName field
                        if (propKey === 'fKObjectName') {
                            const controlContainer = field.parentElement;
                            if (controlContainer && controlContainer.classList.contains('control-with-button')) {
                                const lookupButton = controlContainer.querySelector('.lookup-button');
                                if (lookupButton) {
                                    lookupButton.disabled = !propertyExists;
                                }
                            }
                        }
                    }
                });
            });

            // Hide property details when no property is selected
            newPropsList.addEventListener('click', (event) => {
                if (!newPropsList.value) {
                    propertyDetailsContainer.style.display = 'none';
                }
            });
        }
        
        // Add Property button event handler
        const addPropButton = document.getElementById("addProp");
        if (addPropButton) {
            // Remove existing event listeners to prevent duplicates
            const newAddPropButton = addPropButton.cloneNode(true);
            addPropButton.parentNode.replaceChild(newAddPropButton, addPropButton);
            
            newAddPropButton.addEventListener("click", function() {
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
        }
        
        // For property details form
        const form = document.getElementById('propDetailsForm');
        if (form) {
            propColumns.forEach(propKey => {
                if (propKey === 'name') return;
                
                const fieldId = 'prop' + propKey;
                const field = document.getElementById(fieldId);
                const checkbox = document.getElementById(fieldId + 'Editable');
                
                if (field) {
                    // Use debounced input for real-time feedback and change for final updates
                    let inputTimeout;
                    
                    field.addEventListener('input', () => {
                        // Clear previous timeout
                        clearTimeout(inputTimeout);
                        
                        // Set a new timeout to update after user stops typing
                        inputTimeout = setTimeout(() => {
                            updatePropertyField(propKey, field, checkbox);
                        }, 300); // 300ms delay
                    });
                    
                    // Also listen for change event (when field loses focus)
                    field.addEventListener('change', () => {
                        // Clear any pending input timeout since we're doing an immediate update
                        clearTimeout(inputTimeout);
                        updatePropertyField(propKey, field, checkbox);
                    });
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
                            
                            // Set default value for the field if it's currently empty
                            if (!field.value && field.tagName === 'SELECT') {
                                // For select elements, set to first option
                                if (field.options.length > 0) {
                                    field.value = field.options[0].value;
                                }
                            }
                            
                            // Update model with property added
                            const selectedIndex = propsList.value;
                            if (selectedIndex !== null && selectedIndex !== undefined) {
                                const prop = props[selectedIndex];
                                prop[propKey] = field.value;
                                
                                vscode.postMessage({
                                    command: "updateModel",
                                    data: {
                                        name: objectName,
                                        props: props
                                    }
                                });
                            }
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

        // For settings tab fields
        const settingsFields = document.querySelectorAll('.form-row input[type="text"], .form-row select');
        settingsFields.forEach(field => {
            const key = field.getAttribute('name');
            const checkbox = field.parentElement.querySelector('.setting-checkbox[data-prop="' + key + '"]');
            if (!key || !checkbox) return;

            // Helper to convert value to correct type if needed
            function getTypedValue(val) {
                // For this schema, all enums are type string, so always return as string
                return val;
            }

            // Listen for input and change events
            if (field.tagName === "SELECT") {
                field.addEventListener('change', function() {
                    if (checkbox.checked) {
                        const typedValue = getTypedValue(field.value);
                        console.log("[DEBUG] Sending dropdown value for "+key+":", typedValue, typeof typedValue);
                        vscode.postMessage({
                            command: "updateSettings",
                            data: {
                                property: key,
                                exists: true,
                                value: typedValue
                            }
                        });
                    }
                });
            } else {
                let settingsInputTimeout;
                
                field.addEventListener('input', function() {
                    if (checkbox.checked) {
                        // Clear previous timeout
                        clearTimeout(settingsInputTimeout);
                        
                        // Set a new timeout to update after user stops typing
                        settingsInputTimeout = setTimeout(() => {
                            vscode.postMessage({
                                command: "updateSettings",
                                data: {
                                    property: key,
                                    exists: true,
                                    value: field.value
                                }
                            });
                        }, 300); // 300ms delay
                    }
                });
                
                field.addEventListener('change', function() {
                    if (checkbox.checked) {
                        // Clear any pending input timeout since we're doing an immediate update
                        clearTimeout(settingsInputTimeout);
                        vscode.postMessage({
                            command: "updateSettings",
                            data: {
                                property: key,
                                exists: true,
                                value: field.value
                            }
                        });
                    }
                });
            }
        });

        // Listen for checkbox changes in settings tab
        const settingsCheckboxes = document.querySelectorAll('.setting-checkbox');
        settingsCheckboxes.forEach(checkbox => {
            const key = checkbox.getAttribute('data-prop');
            const field = checkbox.parentElement.querySelector('[name="' + key + '"]');
            if (!key || !field) return;            checkbox.addEventListener('change', function() {                if (checkbox.checked) {
                    // Don't allow parentObjectName or isLookup to be editable even when checkbox is checked
                    if (key !== 'parentObjectName' && key !== 'isLookup') {
                        field.readOnly = false;
                        field.disabled = false;
                    }
                    field.style.backgroundColor = 'var(--vscode-input-background)';
                    field.style.color = 'var(--vscode-input-foreground)';
                    field.style.opacity = '1';
                    vscode.postMessage({
                        command: "updateSettings",
                        data: {
                            property: key,
                            exists: true,
                            value: field.value
                        }
                    });
                } else {
                    field.readOnly = true;
                    field.disabled = true;
                    field.style.backgroundColor = 'var(--vscode-input-disabledBackground, #e9e9e9)';
                    field.style.color = 'var(--vscode-input-disabledForeground, #999)';
                    field.style.opacity = '0.8';
                    vscode.postMessage({
                        command: "updateSettings",
                        data: {
                            property: key,
                            exists: false,
                            value: null
                        }
                    });
                }
            });
        });
        
        // For table rows
        const rows = document.querySelectorAll("#propsTable tbody tr");
        rows.forEach(row => {
            const index = parseInt(row.getAttribute("data-index"));
            
            propColumns.forEach(propKey => {
                const input = row.querySelector('[name="' + propKey + '"]');
                const checkbox = row.querySelector('.prop-checkbox[data-prop="' + propKey + '"]');
                
                if (input) {
                    // Use debounced input for real-time feedback and change for final updates
                    let tableInputTimeout;
                    
                    input.addEventListener('input', () => {
                        // Clear previous timeout
                        clearTimeout(tableInputTimeout);
                        
                        // Set a new timeout to update after user stops typing
                        tableInputTimeout = setTimeout(() => {
                            updateTableField(index, propKey, input, checkbox);
                        }, 300); // 300ms delay
                    });
                    
                    // Also listen for change event (when field loses focus)
                    input.addEventListener('change', () => {
                        // Clear any pending input timeout since we're doing an immediate update
                        clearTimeout(tableInputTimeout);
                        updateTableField(index, propKey, input, checkbox);
                    });
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
                                
                                // Set default value for the field if it's currently empty
                                if (!input.value && input.tagName === 'SELECT') {
                                    // For select elements, set to first option
                                    if (input.options.length > 0) {
                                        input.value = input.options[0].value;
                                    }
                                }
                                
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
            
            // Reload the table view if it exists (to sync changes from list view)
            if (typeof window.reloadPropertiesTableView === 'function') {
                console.log('Calling reloadPropertiesTableView from updatePropertyField');
                setTimeout(() => window.reloadPropertiesTableView(), 10);
            }
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
            
            // Reload the list view if it exists (to sync changes from table view)
            if (typeof window.reloadPropertiesListView === 'function') {
                console.log('Calling reloadPropertiesListView from updateTableField');
                setTimeout(() => window.reloadPropertiesListView(), 10);
            }
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
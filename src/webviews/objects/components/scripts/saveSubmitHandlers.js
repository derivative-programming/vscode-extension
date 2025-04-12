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
    });

    // Save Properties button click handler
    document.getElementById("saveProps")?.addEventListener("click", function() {
        // Get all property data from the table
        const updatedProps = [];
        const rows = document.querySelectorAll("#propsTable tbody tr");
        
        rows.forEach(row => {
            const index = parseInt(row.getAttribute("data-index"));
            const prop = { ...props[index] }; // Start with existing prop data
            
            // Update with values from the form
            propColumns.forEach(propKey => {
                const input = row.querySelector('[name="' + propKey + '"]');
                const checkbox = row.querySelector('.prop-checkbox[data-prop="' + propKey + '"]');
                
                if (propKey === "name") {
                    // Name is always required
                    prop.name = input ? input.value : prop.name;
                } else if (checkbox && checkbox.checked && input) {
                    // Only include property if its checkbox is checked
                    prop[propKey] = input.value;
                } else if (checkbox && !checkbox.checked) {
                    // Remove property if checkbox is unchecked
                    delete prop[propKey];
                }
            });
            
            updatedProps.push(prop);
        });
        
        // Send updated properties to the extension
        vscode.postMessage({
            command: "save",
            data: {
                name: objectName,
                props: updatedProps
            }
        });
    });

    // Save property details from list view
    document.getElementById('savePropDetails')?.addEventListener('click', (event) => {
        event.preventDefault();
        const form = document.getElementById('propDetailsForm');
        if (!form) return;
        
        const selectedIndex = propsList.value;
        if (selectedIndex === null || selectedIndex === undefined) return;
        
        const prop = { ...props[selectedIndex] };
        
        propColumns.forEach(propKey => {
            if (propKey === 'name') return;
            
            const fieldId = 'prop' + propKey;
            const field = document.getElementById(fieldId);
            const checkbox = document.getElementById(fieldId + 'Editable');
            
            if (checkbox && checkbox.checked && field) {
                prop[propKey] = field.value;
            } else if (checkbox && !checkbox.checked) {
                delete prop[propKey];
            }
        });
        
        const updatedProps = [...props];
        updatedProps[selectedIndex] = prop;
        
        vscode.postMessage({
            command: 'save',
            data: {
                name: objectName,
                props: updatedProps
            }
        });
    });
    `;
}

module.exports = {
    getSaveSubmitHandlers
};
"use strict";

/**
 * Provides initialization logic that runs when the DOM is loaded
 * @returns {string} JavaScript code as a string for DOM initialization
 */
function getDOMInitialization() {
    return `
    // Set initial view on page load
    window.addEventListener('DOMContentLoaded', () => {
        const defaultView = document.querySelector('.view-icons .icon.active');
        if (defaultView) {
            defaultView.click();
        } else {
            // Fallback to first icon if no active icon found
            const firstIcon = document.querySelector('.view-icons .icon');
            if (firstIcon) firstIcon.click();
        }

        // Apply consistent styling to all selects and inputs
        applyConsistentStyling();
        
        // Make parent object name read-only without a checkbox
        const parentObjectNameField = document.getElementById('parentObjectName');
        if (parentObjectNameField) {
            parentObjectNameField.readOnly = true;
            const parentCheckbox = parentObjectNameField.nextElementSibling;
            if (parentCheckbox && parentCheckbox.classList.contains('setting-checkbox')) {
                parentCheckbox.style.display = 'none';
            }
        }
        
        // Initialize the behavior for all checkboxes
        initializeToggleEditableBehavior();

        // Hide property details if no property is selected
        if (propsList && (!propsList.value || propsList.value === "")) {
            if (propertyDetailsContainer) {
                propertyDetailsContainer.style.display = 'none';
            }
        }
        
        // Set up toggleEditable for each property field
        propColumns.forEach(propKey => {
            if (propKey === 'name') return;
            
            const fieldId = 'prop' + propKey;
            toggleEditable(fieldId + 'Editable', fieldId);
        });
    });
    `;
}

module.exports = {
    getDOMInitialization
};
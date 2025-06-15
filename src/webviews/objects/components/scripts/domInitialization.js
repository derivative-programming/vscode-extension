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
        initializeToggleEditableBehavior();        // Set up lookup button event handlers for fKObjectName fields
        document.addEventListener('click', (event) => {
            if (event.target.closest('.lookup-button')) {
                const button = event.target.closest('.lookup-button');
                if (button.disabled) return;
                
                const propKey = button.getAttribute('data-prop');
                if (propKey === 'fKObjectName') {
                    // Find the corresponding input field
                    let inputField = button.parentElement.querySelector('input[type="text"]');
                    
                    // If not found (table view), try using data-field-id for list view
                    if (!inputField) {
                        const fieldId = button.getAttribute('data-field-id');
                        if (fieldId) {
                            inputField = document.getElementById(fieldId);
                        }
                    }
                    
                    if (inputField) {
                        const currentValue = inputField.value;
                        createObjectSearchModal(currentValue, inputField);
                    }
                }
            }
        });

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
        
        // Set up copy button functionality
        const copyPropsButton = document.getElementById('copyPropsButton');
        if (copyPropsButton) {
            copyPropsButton.addEventListener('click', () => {
                try {
                    // Get all property names from the list
                    const propsList = document.getElementById('propsList');
                    if (!propsList) return;
                    
                    const propertyList = [];
                    for (let i = 0; i < propsList.options.length; i++) {
                        propertyList.push(propsList.options[i].text);
                    }
                    
                    // Create formatted text for copying
                    const textToCopy = propertyList.join('\\n');
                    
                    // Copy to clipboard using the modern Clipboard API
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(textToCopy).then(() => {
                            console.log('Properties copied to clipboard');
                            // Provide visual feedback
                            const originalText = copyPropsButton.textContent;
                            copyPropsButton.textContent = 'Copied!';
                            setTimeout(() => {
                                copyPropsButton.textContent = originalText;
                            }, 2000);
                        }).catch(err => {
                            console.error('Failed to copy properties: ', err);
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
                        const originalText = copyPropsButton.textContent;
                        copyPropsButton.textContent = 'Copied!';
                        setTimeout(() => {
                            copyPropsButton.textContent = originalText;
                        }, 2000);
                    }
                } catch (err) {
                    console.error('Error copying properties: ', err);
                }
            });
        }
    });
    `;
}

module.exports = {
    getDOMInitialization
};
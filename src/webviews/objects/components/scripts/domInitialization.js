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
        
        // Initialize lookup items functionality if the lookup items tab exists
        if (document.getElementById('lookupItems')) {
            initializeLookupItems();
        }        // Set up lookup button event handlers for fKObjectName fields
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
        
        // Set up copy button functionality using event delegation
        document.addEventListener('click', (event) => {
            if (event.target && event.target.id === 'copyPropsButton') {
                console.log('Copy button clicked via delegation!');
                event.preventDefault();
                try {
                    // Get all property names from the list
                    const propsList = document.getElementById('propsList');
                    console.log('Props list element found:', propsList);
                    if (!propsList) return;
                    
                    const propertyList = [];
                    for (let i = 0; i < propsList.options.length; i++) {
                        propertyList.push(propsList.options[i].text);
                    }
                    console.log('Property list to copy:', propertyList);
                    
                    // Create formatted text for copying
                    const textToCopy = propertyList.join('\\n');
                    console.log('Text to copy:', textToCopy);
                    
                    // Copy to clipboard using the modern Clipboard API
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(textToCopy).then(() => {
                            console.log('Properties copied to clipboard');
                            // Provide visual feedback
                            const copyPropsButton = document.getElementById('copyPropsButton');
                            if (copyPropsButton) {
                                const originalText = copyPropsButton.textContent;
                                copyPropsButton.textContent = 'Copied!';
                                setTimeout(() => {
                                    copyPropsButton.textContent = originalText;
                                }, 2000);
                            }
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
                        const copyPropsButton = document.getElementById('copyPropsButton');
                        if (copyPropsButton) {
                            const originalText = copyPropsButton.textContent;
                            copyPropsButton.textContent = 'Copied!';
                            setTimeout(() => {
                                copyPropsButton.textContent = originalText;
                            }, 2000);
                        }
                    }
                } catch (err) {
                    console.error('Error copying properties: ', err);
                }
            }
            
            // Handle lookup items copy button with event delegation
            if (event.target && event.target.id === 'copyLookupItemsButton') {
                console.log('Lookup items copy button clicked via delegation!');
                event.preventDefault();
                try {
                    // Get all lookup item names from the list
                    const lookupItemsList = document.getElementById('lookupItemsList');
                    console.log('Lookup items list element found:', lookupItemsList);
                    if (!lookupItemsList) return;
                    
                    const lookupItemList = [];
                    for (let i = 0; i < lookupItemsList.options.length; i++) {
                        lookupItemList.push(lookupItemsList.options[i].text);
                    }
                    console.log('Lookup item list to copy:', lookupItemList);
                    
                    // Create formatted text for copying
                    const textToCopy = lookupItemList.join('\\n');
                    console.log('Lookup items text to copy:', textToCopy);
                    
                    // Copy to clipboard using the modern Clipboard API
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(textToCopy).then(() => {
                            console.log('Lookup items copied to clipboard');
                            // Provide visual feedback
                            const copyLookupItemsButton = document.getElementById('copyLookupItemsButton');
                            if (copyLookupItemsButton) {
                                const originalText = copyLookupItemsButton.textContent;
                                copyLookupItemsButton.textContent = 'Copied!';
                                setTimeout(() => {
                                    copyLookupItemsButton.textContent = originalText;
                                }, 2000);
                            }
                        }).catch(err => {
                            console.error('Failed to copy lookup items: ', err);
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
                        const copyLookupItemsButton = document.getElementById('copyLookupItemsButton');
                        if (copyLookupItemsButton) {
                            const originalText = copyLookupItemsButton.textContent;
                            copyLookupItemsButton.textContent = 'Copied!';
                            setTimeout(() => {
                                copyLookupItemsButton.textContent = originalText;
                            }, 2000);
                        }
                    }
                } catch (err) {
                    console.error('Error copying lookup items: ', err);
                }
            }
        });
    });
    `;
}

module.exports = {
    getDOMInitialization
};
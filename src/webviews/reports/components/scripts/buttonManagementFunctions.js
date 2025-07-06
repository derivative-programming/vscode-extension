"use strict";

/**
 * File: buttonManagementFunctions.js
 * Purpose: Provides functions for managing buttons in the report details view
 * Created: 2025-07-06
 */

/**
 * Provides functions for managing buttons in the report details view
 * @returns {string} JavaScript code as a string for button management
 */
function getButtonManagementFunctions() {
    return `
    // --- BUTTONS TAB FUNCTIONALITY ---
    // Button checkbox functionality similar to properties tab
    document.querySelectorAll('.button-checkbox').forEach(checkbox => {
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
                command: 'updateButton',
                data: {
                    index: parseInt(index),
                    property: propName,
                    exists: this.checked,
                    value: this.checked ? inputElement.value : null
                }
            });
        });
    });
    
    // Handle input changes for buttons table
    document.querySelectorAll('#buttons-table input[type="text"], #buttons-table select').forEach(input => {
        const updateButton = () => {
            const tableCell = input.closest('td');
            if (!tableCell) return;
            
            const checkbox = tableCell.querySelector('.button-checkbox');
            if (!checkbox || !checkbox.checked) return;
            
            const propName = checkbox.getAttribute('data-prop');
            const index = checkbox.getAttribute('data-index');
            
            // Send message to update the model
            vscode.postMessage({
                command: 'updateButton',
                data: {
                    index: parseInt(index),
                    property: propName,
                    exists: true,
                    value: input.value
                }
            });
        };
        
        if (input.tagName === 'SELECT') {
            input.addEventListener('change', updateButton);
        } else {
            input.addEventListener('input', updateButton);
            input.addEventListener('change', updateButton);
        }
    });
    `;
}

module.exports = {
    getButtonManagementFunctions
};

"use strict";

/**
 * File: formControlUtilities.js  
 * Purpose: Provides form control utilities for schema-driven form generation and styling
 * Created: 2025-07-06
 */

/**
 * Provides form control utilities for schema-driven form generation and styling
 * @returns {string} JavaScript code as a string for form control utilities
 */
function getFormControlUtilities() {
    return `
    // Function to update input styling based on enabled/disabled state
    function updateInputStyle(inputElement, isEnabled) {
        if (!isEnabled) {
            inputElement.style.backgroundColor = "var(--vscode-input-disabledBackground, #e9e9e9)";
            inputElement.style.color = "var(--vscode-input-disabledForeground, #999)";
            inputElement.style.opacity = "0.8";
        } else {
            inputElement.style.backgroundColor = "var(--vscode-input-background)";
            inputElement.style.color = "var(--vscode-input-foreground)";
            inputElement.style.opacity = "1";
        }
    }
    
    // Function to set up settings input change handlers 
    function setupSettingsInputHandlers() {
        // Handle checkbox changes for settings
        document.querySelectorAll('.setting-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const propertyName = this.getAttribute('data-prop');
                const isEnum = this.getAttribute('data-is-enum') === 'true';
                const inputField = document.getElementById('setting-' + propertyName);
                
                if (inputField) {
                    if (this.checked) {
                        // Enable the input field
                        if (isEnum) {
                            inputField.disabled = false;
                        } else {
                            inputField.readOnly = false;
                        }
                        updateInputStyle(inputField, true);
                        
                        // Handle browse button state for targetChildObject field
                        if (propertyName === 'targetChildObject') {
                            const browseButton = inputField.parentElement.querySelector('.lookup-button');
                            if (browseButton) {
                                browseButton.disabled = false;
                            }
                        }
                        
                        // Disable the checkbox to prevent unchecking
                        this.disabled = true;
                    } else {
                        // Disable the input field
                        if (isEnum) {
                            inputField.disabled = true;
                        } else {
                            inputField.readOnly = true;
                        }
                        updateInputStyle(inputField, false);
                        
                        // Handle browse button state for targetChildObject field
                        if (propertyName === 'targetChildObject') {
                            const browseButton = inputField.parentElement.querySelector('.lookup-button');
                            if (browseButton) {
                                browseButton.disabled = true;
                            }
                        }
                    }
                    
                    // Send message to update the model
                    vscode.postMessage({
                        command: 'updateSettings',
                        data: {
                            property: propertyName,
                            exists: this.checked,
                            value: this.checked ? inputField.value : null
                        }
                    });
                }
            });
        });
        
        // Handle input changes for settings
        document.querySelectorAll('[id^="setting-"]').forEach(input => {
            // For select elements, listen for change
            if (input.tagName === 'SELECT') {
                input.addEventListener('change', function() {
                    const propertyName = this.name;
                    const checkbox = this.parentElement.querySelector('.setting-checkbox[data-prop="' + propertyName + '"]');
                    
                    if (checkbox && checkbox.checked) {
                        // Send message to update the model
                        vscode.postMessage({
                            command: 'updateSettings',
                            data: {
                                property: propertyName,
                                exists: true,
                                value: this.value
                            }
                        });
                    }
                });
            } else {
                // For text inputs, listen for both input and change events
                input.addEventListener('input', function() {
                    const propertyName = this.name;
                    const checkbox = this.parentElement.querySelector('.setting-checkbox[data-prop="' + propertyName + '"]');
                    
                    if (checkbox && checkbox.checked) {
                        // Send message to update the model
                        vscode.postMessage({
                            command: 'updateSettings',
                            data: {
                                property: propertyName,
                                exists: true,
                                value: this.value
                            }
                        });
                    }
                });
                
                input.addEventListener('change', function() {
                    const propertyName = this.name;
                    const checkbox = this.parentElement.querySelector('.setting-checkbox[data-prop="' + propertyName + '"]');
                    
                    if (checkbox && checkbox.checked) {
                        // Send message to update the model
                        vscode.postMessage({
                            command: 'updateSettings',
                            data: {
                                property: propertyName,
                                exists: true,
                                value: this.value
                            }
                        });
                    }
                });
            }
        });
    }
    `;
}

module.exports = {
    getFormControlUtilities
};

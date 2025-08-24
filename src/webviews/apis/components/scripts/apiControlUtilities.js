"use strict";

/**
 * File: apiControlUtilities.js  
 * Purpose: Provides API control utilities for schema-driven form generation and styling
 * Created: 2025-01-27
 * Modified: 2025-01-27 - Initial creation based on Forms formControlUtilities.js
 */

/**
 * Provides API control utilities for schema-driven form generation and styling
 * @returns {string} JavaScript code as a string for API control utilities
 */
function getAPIControlUtilities() {
    return `
    // Function to coerce values by their data type (APIs-specific)
    function coerceValueByType(raw, type) {
        if (type === 'enum') return raw;
        if (type === 'boolean') return String(raw).toLowerCase() === 'true';
        if (type === 'number' || type === 'integer') {
            const num = Number(raw);
            if (isNaN(num)) return undefined;
            return type === 'integer' ? Math.trunc(num) : num;
        }
        return raw;
    }
    
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
        console.log('[DEBUG] Setting up API settings input handlers');
        
        // Handle checkbox changes for settings
        document.querySelectorAll('.setting-checkbox').forEach(checkbox => {
            console.log('[DEBUG] Found setting checkbox for property:', checkbox.getAttribute('data-prop'));
            
            checkbox.addEventListener('change', function() {
                const propertyName = this.getAttribute('data-prop');
                const isEnum = this.getAttribute('data-is-enum') === 'true';
                const inputField = document.getElementById('setting-' + propertyName);
                
                console.log('[DEBUG] Checkbox changed for property:', propertyName, 'checked:', this.checked);
                
                if (inputField) {
                    const dataType = inputField.getAttribute('data-type') || 'string';
                    
                    // Check if this property was originally checked (API-specific logic)
                    if (this.hasAttribute('data-originally-checked')) {
                        this.checked = true; // guard against unchecking originally existing properties
                        return;
                    }
                    
                    if (this.checked) {
                        // Enable the input field
                        inputField.readOnly = false;
                        inputField.disabled = false;
                        inputField.style.removeProperty('background-color');
                        inputField.style.removeProperty('color');
                        
                        const value = coerceValueByType(inputField.value, dataType);
                        
                        // Send message to update the model
                        console.log('[DEBUG] Posting updateSettings message for checkbox enable:', propertyName, 'coerced value:', value);
                        vscode.postMessage({
                            command: 'updateSettings',
                            data: {
                                property: propertyName,
                                exists: true,
                                value: value
                            }
                        });
                        
                        // Disable the checkbox to prevent unchecking (API-specific behavior)
                        this.disabled = true;
                        this.setAttribute('data-originally-checked', 'true');
                        
                    } else {
                        // Disable the input field
                        inputField.readOnly = true;
                        inputField.disabled = true;
                        inputField.style.backgroundColor = 'var(--vscode-input-disabledBackground)';
                        inputField.style.color = 'var(--vscode-input-disabledForeground)';
                        
                        // Send message to update the model
                        console.log('[DEBUG] Posting updateSettings message for checkbox disable:', propertyName);
                        vscode.postMessage({
                            command: 'updateSettings',
                            data: {
                                property: propertyName,
                                exists: false,
                                value: null
                            }
                        });
                    }
                }
            });
        });
        
        // Handle input changes for settings
        document.querySelectorAll('[id^="setting-"]').forEach(input => {
            console.log('[DEBUG] Found setting input:', input.id, 'name:', input.name);
            
            // For both select and input elements, listen for change events
            input.addEventListener('change', function() {
                const propertyName = this.name;
                const checkbox = this.parentElement.querySelector('.setting-checkbox[data-prop="' + propertyName + '"]');
                const dataType = this.getAttribute('data-type') || 'string';
                
                console.log('[DEBUG] Input/Select changed for property:', propertyName, 'value:', this.value, 'type:', dataType);
                
                if (checkbox && checkbox.checked) {
                    const value = coerceValueByType(this.value, dataType);
                    // Send message to update the model
                    console.log('[DEBUG] Posting updateSettings message for input/select change:', propertyName, 'coerced value:', value);
                    vscode.postMessage({
                        command: 'updateSettings',
                        data: {
                            property: propertyName,
                            exists: true,
                            value: value
                        }
                    });
                }
            });
            
            // For text inputs, also listen for input events
            if (input.tagName === 'INPUT') {
                input.addEventListener('input', function() {
                    const propertyName = this.name;
                    const checkbox = this.parentElement.querySelector('.setting-checkbox[data-prop="' + propertyName + '"]');
                    const dataType = this.getAttribute('data-type') || 'string';
                    
                    console.log('[DEBUG] Input event for property:', propertyName, 'value:', this.value);
                    
                    if (checkbox && checkbox.checked) {
                        const value = coerceValueByType(this.value, dataType);
                        // Send message to update the model
                        console.log('[DEBUG] Posting updateSettings message for input event:', propertyName, 'coerced value:', value);
                        vscode.postMessage({
                            command: 'updateSettings',
                            data: {
                                property: propertyName,
                                exists: true,
                                value: value
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
    getAPIControlUtilities
};

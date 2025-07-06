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
    `;
}

module.exports = {
    getFormControlUtilities
};

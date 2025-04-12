"use strict";

/**
 * Provides utility functions for styling and controlling form inputs
 * @returns {string} JavaScript code as a string for form control utilities
 */
function getFormControlUtilities() {
    return `
    // Helper function to apply consistent styling to all inputs and selects
    function applyConsistentStyling() {
        // Style all select elements consistently
        document.querySelectorAll('select').forEach(select => {
            if (select.disabled) {
                select.style.backgroundColor = 'var(--vscode-input-disabledBackground, #e9e9e9)';
                select.style.color = 'var(--vscode-input-disabledForeground, #999)';
                select.style.opacity = '0.8';
            } else {
                select.style.backgroundColor = 'var(--vscode-input-background)';
                select.style.color = 'var(--vscode-input-foreground)';
                select.style.opacity = '1';
            }
        });

        // Style all readonly inputs consistently
        document.querySelectorAll('input[readonly]').forEach(input => {
            input.style.backgroundColor = 'var(--vscode-input-disabledBackground, #e9e9e9)';
            input.style.color = 'var(--vscode-input-disabledForeground, #999)';
            input.style.opacity = '0.8';
        });
    }

    // Helper function to update input styles based on checkbox state
    function updateInputStyle(inputElement, isChecked) {
        if (!isChecked) {
            inputElement.style.backgroundColor = "var(--vscode-input-disabledBackground, #e9e9e9)";
            inputElement.style.color = "var(--vscode-input-disabledForeground, #999)";
            inputElement.style.opacity = "0.8";
        } else {
            inputElement.style.backgroundColor = "var(--vscode-input-background)";
            inputElement.style.color = "var(--vscode-input-foreground)";
            inputElement.style.opacity = "1";
        }
    }
    
    // Update the toggleEditable function to ensure consistent behavior across all tabs and views
    const toggleEditable = (checkboxId, inputId) => {
        const checkbox = document.getElementById(checkboxId);
        const input = document.getElementById(inputId);
        if (!checkbox || !input) return;

        const updateInputStyle = () => {
            if (input.tagName === 'INPUT') {
                input.readOnly = !checkbox.checked;
            } else if (input.tagName === 'SELECT') {
                input.disabled = !checkbox.checked;
            }
            if (!checkbox.checked) {
                input.style.backgroundColor = 'var(--vscode-input-disabledBackground, #e9e9e9)';
                input.style.color = 'var(--vscode-input-disabledForeground, #999)';
                input.style.opacity = '0.8';
            } else {
                input.style.backgroundColor = 'var(--vscode-input-background)';
                input.style.color = 'var(--vscode-input-foreground)';
                input.style.opacity = '1';
            }
        };

        updateInputStyle();

        checkbox.addEventListener('change', updateInputStyle);
    };
    `;
}

module.exports = {
    getFormControlUtilities
};
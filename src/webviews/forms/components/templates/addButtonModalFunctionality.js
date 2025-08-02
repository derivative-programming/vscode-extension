"use strict";

/**
 * File: addButtonModalFunctionality.js
 * Purpose: Add Button modal functionality for forms detail view
 * Created: 2025-08-02
 */

/**
 * Creates the JavaScript functionality for the Add Button modal
 * @returns {string} JavaScript code as a string for the modal functionality
 */
function getAddButtonModalFunctionality() {
    return `
// Function to create and show the Add Button modal
function showAddButtonModal() {
    // Create modal dialog for adding buttons
    const modal = document.createElement("div");
    modal.className = "modal";
    
    // Import the modal HTML template
    const modalContent = getAddButtonModalHtml();
    
    // Set the modal content
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Show the modal
    setTimeout(() => {
        modal.style.display = "flex";
        // Focus on the button text input when modal opens
        const buttonTextInput = modal.querySelector("#button-text-input");
        if (buttonTextInput) {
            buttonTextInput.focus();
        }
    }, 10);
    
    // Close modal when clicking the x button
    modal.querySelector(".close-button").addEventListener("click", function() {
        document.body.removeChild(modal);
    });
    
    // Close modal when clicking outside the modal content
    modal.addEventListener("click", function(event) {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Add Enter key handling for button text input
    const buttonTextInput = modal.querySelector("#button-text-input");
    if (buttonTextInput) {
        buttonTextInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault(); // Prevent default Enter behavior
                const addButton = modal.querySelector("#save-add-button");
                if (addButton && !addButton.disabled) {
                    addButton.click();
                }
            }
        });
    }
    
    // Validate button text for uniqueness
    function validateButtonText(buttonText) {
        if (!buttonText || buttonText.trim() === "") {
            return "Button text cannot be empty";
        }
        
        // Check if button text is unique within the current form
        const existingButtons = currentButtons || [];
        const trimmedText = buttonText.trim();
        
        for (let i = 0; i < existingButtons.length; i++) {
            const button = existingButtons[i];
            if (button.buttonText && button.buttonText.trim().toLowerCase() === trimmedText.toLowerCase()) {
                return "A button with this text already exists in the form";
            }
        }
        
        return null; // No error
    }
    
    // Real-time validation as user types
    if (buttonTextInput) {
        buttonTextInput.addEventListener("input", function() {
            const buttonText = this.value;
            const errorDiv = modal.querySelector("#button-text-error");
            const saveButton = modal.querySelector("#save-add-button");
            
            const error = validateButtonText(buttonText);
            
            if (error) {
                errorDiv.textContent = error;
                errorDiv.style.display = "block";
                saveButton.disabled = true;
            } else {
                errorDiv.style.display = "none";
                saveButton.disabled = false;
            }
        });
    }
    
    // Cancel button functionality
    modal.querySelector("#cancel-add-button").addEventListener("click", function() {
        document.body.removeChild(modal);
    });
    
    // Save button functionality
    modal.querySelector("#save-add-button").addEventListener("click", function() {
        const buttonTextInput = modal.querySelector("#button-text-input");
        const buttonText = buttonTextInput.value.trim();
        
        // Final validation
        const error = validateButtonText(buttonText);
        if (error) {
            const errorDiv = modal.querySelector("#button-text-error");
            errorDiv.textContent = error;
            errorDiv.style.display = "block";
            return;
        }
        
        // Send message to backend to add the button with the user-specified text
        vscode.postMessage({
            command: 'addButtonWithText',
            data: {
                buttonText: buttonText,
                buttonType: 'other'
            }
        });
        
        // Close the modal
        document.body.removeChild(modal);
    });
}
`;
}

module.exports = {
    getAddButtonModalFunctionality
};

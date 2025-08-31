"use strict";

/**
 * addGeneralFlowButtonColumnModalFunctionality.js
 * Provides functionality for the Add General Flow Button Column modal
 * Created: 2025-01-27
 * Purpose: Handles modal interactions for creating general flow button columns
 */

/**
 * Creates the JavaScript functionality for the Add General Flow Button Column modal
 * @returns {string} JavaScript code as a string for the modal functionality
 */
function getAddGeneralFlowButtonColumnModalFunctionality() {
    return `
// Function to create and show the Add General Flow Button Column modal
function createAddGeneralFlowButtonColumnModal() {
    // Create modal dialog for adding general flow button columns
    const modal = document.createElement("div");
    modal.className = "modal";
    
    // Import the modal HTML template
    const modalContent = getAddGeneralFlowButtonColumnModalHtml();
    
    // Set the modal content
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Show the modal
    setTimeout(() => {
        modal.style.display = "flex";
        
        // Focus on the general flow input when modal opens
        const generalFlowInput = modal.querySelector("#generalFlowName");
        if (generalFlowInput) {
            generalFlowInput.focus();
        }
    }, 10);
    
    // Close modal functionality
    const closeButton = modal.querySelector('.close-button');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Browse general flow button functionality
    const browseButton = modal.querySelector("#browseGeneralFlow");
    if (browseButton) {
        browseButton.addEventListener("click", function() {
            const generalFlowInput = modal.querySelector("#generalFlowName");
            createGeneralFlowSearchModal(generalFlowInput.value, generalFlowInput);
        });
    }
    
    // Auto-generate column name when general flow or button text changes
    function updateColumnName() {
        const generalFlowInput = modal.querySelector("#generalFlowName");
        const buttonTextInput = modal.querySelector("#buttonText");
        const columnNameInput = modal.querySelector("#columnName");
        
        if (generalFlowInput && buttonTextInput && columnNameInput) {
            const generalFlowName = generalFlowInput.value.trim();
            const generalFlowObjectName = generalFlowInput.getAttribute('data-object-name') || '';
            const buttonText = buttonTextInput.value.trim();
            
            if (generalFlowName && buttonText && generalFlowObjectName) {
                // Generate column name in format: [button text]Link[general flow owner object name]Code
                // Convert to PascalCase and remove spaces/special characters
                const cleanButtonText = buttonText.replace(/[^a-zA-Z0-9]/g, '');
                const cleanObjectName = generalFlowObjectName.replace(/[^a-zA-Z0-9]/g, '');
                const columnName = cleanButtonText + "Link" + cleanObjectName + "Code";
                columnNameInput.value = columnName;
            } else {
                columnNameInput.value = '';
            }
        }
    }
    
    // Add event listeners for auto-generation
    const generalFlowInput = modal.querySelector("#generalFlowName");
    const buttonTextInput = modal.querySelector("#buttonText");
    
    if (generalFlowInput) {
        generalFlowInput.addEventListener("change", updateColumnName);
        generalFlowInput.addEventListener("input", updateColumnName);
    }
    
    if (buttonTextInput) {
        buttonTextInput.addEventListener("input", updateColumnName);
        buttonTextInput.addEventListener("change", updateColumnName);
    }
    
    // Add button functionality
    const addButton = modal.querySelector("#addGeneralFlowButtonColumn");
    if (addButton) {
        addButton.addEventListener("click", function() {
            const generalFlowInput = modal.querySelector("#generalFlowName");
            const buttonTextInput = modal.querySelector("#buttonText");
            const columnNameInput = modal.querySelector("#columnName");
            const errorElement = modal.querySelector("#validationError");
            
            const generalFlowName = generalFlowInput.value.trim();
            const generalFlowDisplayName = generalFlowName; // For input, name and display name are the same
            const objectName = generalFlowInput.getAttribute('data-object-name') || '';
            const buttonText = buttonTextInput.value.trim();
            const columnName = columnNameInput.value.trim();
            
            // Clear previous errors
            errorElement.textContent = "";
            
            // Validation
            if (!generalFlowName) {
                errorElement.textContent = "General flow is required.";
                generalFlowInput.focus();
                return;
            }
            
            if (!buttonText) {
                errorElement.textContent = "Button text is required.";
                buttonTextInput.focus();
                return;
            }
            
            if (!columnName) {
                errorElement.textContent = "Column name could not be generated.";
                return;
            }
            
            // Create the general flow button column data
            const columnData = {
                name: columnName,
                buttonText: buttonText,
                generalFlowName: generalFlowName,
                generalFlowDisplayName: generalFlowDisplayName,
                generalFlowObjectName: objectName,
                isButton: "true",
                isVisible: "true",
                sourcePropertyName: "Code",
                sqlServerDBDataType: "uniqueidentifier"
            };
            
            // Send message to add the general flow button column
            vscode.postMessage({
                command: 'addGeneralFlowButtonColumn',
                data: columnData
            });
            
            // Close the modal
            document.body.removeChild(modal);
        });
    }
    
    // Cancel button functionality
    const cancelButton = modal.querySelector("#cancelGeneralFlowButtonColumn");
    if (cancelButton) {
        cancelButton.addEventListener("click", function() {
            document.body.removeChild(modal);
        });
    }
    
    // Add Enter key handling for general flow input
    if (generalFlowInput) {
        generalFlowInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                const buttonTextInput = modal.querySelector("#buttonText");
                if (buttonTextInput) {
                    buttonTextInput.focus();
                }
            }
        });
    }
    
    // Add Enter key handling for button text input
    if (buttonTextInput) {
        buttonTextInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                const addButton = modal.querySelector("#addGeneralFlowButtonColumn");
                if (addButton && !addButton.disabled) {
                    addButton.click();
                }
            }
        });
    }
}
`;
}

module.exports = {
    getAddGeneralFlowButtonColumnModalFunctionality
};
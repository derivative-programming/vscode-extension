"use strict";

/**
 * File: addInputControlModalFunctionality.js
 * Purpose: Provides modal functionality for the Add Input Control modal in forms
 * Created: 2025-01-27
 */

/**
 * Creates the JavaScript functionality for the Add Input Control modal
 * @returns {string} JavaScript code as a string for the modal functionality
 */
function getAddInputControlModalFunctionality() {
    return `
// Function to create and show the Add Input Control modal
function createAddInputControlModal() {
    // Create modal dialog for adding input controls
    const modal = document.createElement("div");
    modal.className = "modal";
    
    // Import the modal HTML template
    const modalContent = getAddInputControlModalHtml();
    
    // Set the modal content
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Show the modal
    setTimeout(() => {
        modal.style.display = "flex";
        // Focus on the input control name input when modal opens (single input control tab is active by default)
        const inputControlNameInput = modal.querySelector("#inputControlName");
        if (inputControlNameInput) {
            inputControlNameInput.focus();
        }
    }, 10);
    
    // Tab switching in modal
    modal.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            // Update active tab
            modal.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            // Update visible tab content
            modal.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
            
            // Set focus based on which tab is now active
            setTimeout(() => {
                if (tabId === 'singleAdd') {
                    const inputControlNameInput = modal.querySelector("#inputControlName");
                    if (inputControlNameInput) {
                        inputControlNameInput.focus();
                    }
                } else if (tabId === 'bulkAdd') {
                    const bulkInputControlsTextarea = modal.querySelector("#bulkInputControls");
                    if (bulkInputControlsTextarea) {
                        bulkInputControlsTextarea.focus();
                    }
                }
            }, 10);
        });
    });
    
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
    
    // Add Enter key handling for single input control input
    const inputControlNameInput = modal.querySelector("#inputControlName");
    if (inputControlNameInput) {
        inputControlNameInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault(); // Prevent default Enter behavior
                const addButton = modal.querySelector("#addSingleInputControl");
                if (addButton && !addButton.disabled) {
                    addButton.click();
                }
            }
        });
    }
    
    // Validate input control name
    function validateInputControlName(name) {
        if (!name) {
            return "Input control name cannot be empty";
        }
        if (name.length > 100) {
            return "Input control name cannot exceed 100 characters";
        }
        if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
            return "Input control name must start with a letter and contain only letters and numbers";
        }
        if (currentParams.some(param => param.name === name)) {
            return "Input control with this name already exists";
        }
        return null; // Valid
    }
    
    // Add single input control button event listener
    modal.querySelector("#addSingleInputControl").addEventListener("click", function() {
        const inputControlName = modal.querySelector("#inputControlName").value.trim();
        const errorElement = modal.querySelector("#singleValidationError");
        
        const validationError = validateInputControlName(inputControlName);
        if (validationError) {
            errorElement.textContent = validationError;
            return;
        }
        
        // Add the new input control by sending individual add commands
        addNewInputControl(inputControlName);
        
        // Close the modal
        document.body.removeChild(modal);
    });
    
    // Add bulk input controls button event listener
    modal.querySelector("#addBulkInputControls").addEventListener("click", function() {
        const bulkInputControls = modal.querySelector("#bulkInputControls").value;
        const inputControlNames = bulkInputControls.split("\\n").map(name => name.trim()).filter(name => name);
        const errorElement = modal.querySelector("#bulkValidationError");
        
        // Validate all input control names
        const errors = [];
        const validInputControls = [];
        
        inputControlNames.forEach(name => {
            const validationError = validateInputControlName(name);
            if (validationError) {
                errors.push("\\"" + name + "\\": " + validationError);
            } else {
                validInputControls.push(name);
            }
        });
        
        if (errors.length > 0) {
            errorElement.innerHTML = errors.join("<br>");
            return;
        }
        
        // Add all valid input controls using individual commands
        validInputControls.forEach(name => {
            addNewInputControl(name);
        });
        
        // Close the modal
        document.body.removeChild(modal);
    });
}

// Function to add a new input control (called from add input control modal)
function addNewInputControl(inputControlName) {
    // Send message to add a new parameter with the specified name
    vscode.postMessage({
        command: 'addParamWithName',
        data: {
            name: inputControlName
        }
    });
}
`;
}

module.exports = {
    getAddInputControlModalFunctionality
};

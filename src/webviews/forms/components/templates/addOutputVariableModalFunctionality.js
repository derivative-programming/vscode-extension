"use strict";

/**
 * File: addOutputVariableModalFunctionality.js
 * Purpose: Provides modal functionality for the Add Output Variable modal in forms
 * Created: 2025-08-02
 */

/**
 * Creates the JavaScript functionality for the Add Output Variable modal
 * @returns {string} JavaScript code as a string for the modal functionality
 */
function getAddOutputVariableModalFunctionality() {
    return `
// Function to create and show the Add Output Variable modal
function createAddOutputVariableModal() {
    // Create modal dialog for adding output variables
    const modal = document.createElement("div");
    modal.className = "modal";
    
    // Import the modal HTML template
    const modalContent = getAddOutputVariableModalHtml();
    
    // Set the modal content
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Show the modal
    setTimeout(() => {
        modal.style.display = "flex";
        // Focus on the output variable name input when modal opens (single output variable tab is active by default)
        const outputVariableNameInput = modal.querySelector("#outputVariableName");
        if (outputVariableNameInput) {
            outputVariableNameInput.focus();
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
                    const outputVariableNameInput = modal.querySelector("#outputVariableName");
                    if (outputVariableNameInput) {
                        outputVariableNameInput.focus();
                    }
                } else if (tabId === 'bulkAdd') {
                    const bulkOutputVariablesTextarea = modal.querySelector("#bulkOutputVariables");
                    if (bulkOutputVariablesTextarea) {
                        bulkOutputVariablesTextarea.focus();
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
    
    // Add Enter key handling for single output variable input
    const outputVariableNameInput = modal.querySelector("#outputVariableName");
    if (outputVariableNameInput) {
        outputVariableNameInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault(); // Prevent default Enter behavior
                const addButton = modal.querySelector("#addSingleOutputVariable");
                if (addButton && !addButton.disabled) {
                    addButton.click();
                }
            }
        });
    }
    
    // Validate output variable name
    function validateOutputVariableName(name) {
        if (!name) {
            return "Output variable name cannot be empty";
        }
        if (name.length > 100) {
            return "Output variable name cannot exceed 100 characters";
        }
        if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
            return "Output variable name must start with a letter and contain only letters and numbers";
        }
        if (currentOutputVars.some(outputVar => outputVar.name === name)) {
            return "Output variable with this name already exists";
        }
        return null; // Valid
    }
    
    // Add single output variable button event listener
    modal.querySelector("#addSingleOutputVariable").addEventListener("click", function() {
        const outputVariableName = modal.querySelector("#outputVariableName").value.trim();
        const errorElement = modal.querySelector("#singleValidationError");
        
        const validationError = validateOutputVariableName(outputVariableName);
        if (validationError) {
            errorElement.textContent = validationError;
            return;
        }
        
        // Add the new output variable by sending individual add commands
        addNewOutputVariable(outputVariableName);
        
        // Close the modal
        document.body.removeChild(modal);
    });
    
    // Add bulk output variables button event listener
    modal.querySelector("#addBulkOutputVariables").addEventListener("click", function() {
        const bulkOutputVariables = modal.querySelector("#bulkOutputVariables").value;
        const outputVariableNames = bulkOutputVariables.split("\\n").map(name => name.trim()).filter(name => name);
        const errorElement = modal.querySelector("#bulkValidationError");
        
        // Validate all output variable names
        const errors = [];
        const validOutputVariables = [];
        
        outputVariableNames.forEach(name => {
            const validationError = validateOutputVariableName(name);
            if (validationError) {
                errors.push("\\"" + name + "\\": " + validationError);
            } else {
                validOutputVariables.push(name);
            }
        });
        
        if (errors.length > 0) {
            errorElement.innerHTML = errors.join("<br>");
            return;
        }
        
        // Add all valid output variables using individual commands
        validOutputVariables.forEach(name => {
            addNewOutputVariable(name);
        });
        
        // Close the modal
        document.body.removeChild(modal);
    });
}

// Function to add a new output variable (called from add output variable modal)
function addNewOutputVariable(outputVariableName) {
    // Send message to add a new output variable with the specified name
    vscode.postMessage({
        command: 'addOutputVarWithName',
        data: {
            name: outputVariableName
        }
    });
}
`;
}

module.exports = {
    getAddOutputVariableModalFunctionality
};

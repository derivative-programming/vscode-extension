"use strict";

/**
 * File: addWorkflowTaskModalFunctionality.js
 * Purpose: Provides modal functionality for the Add Workflow Task modal in workflows
 * Created: 2025-08-24
 */

/**
 * Creates the JavaScript functionality for the Add Workflow Task modal
 * @returns {string} JavaScript code as a string for the modal functionality
 */
function getAddWorkflowTaskModalFunctionality() {
    return `
// Function to create and show the Add Workflow Task modal
function createAddWorkflowTaskModal() {
    // Create modal dialog for adding workflow tasks
    const modal = document.createElement("div");
    modal.className = "modal";
    
    // Import the modal HTML template
    const modalContent = getAddWorkflowTaskModalHtml();
    
    // Set the modal content
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Show the modal
    setTimeout(() => {
        modal.style.display = "flex";
        // Focus on the workflow task name input when modal opens (single task tab is active by default)
        const workflowTaskNameInput = modal.querySelector("#workflowTaskName");
        if (workflowTaskNameInput) {
            workflowTaskNameInput.focus();
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
                    const workflowTaskNameInput = modal.querySelector("#workflowTaskName");
                    if (workflowTaskNameInput) {
                        workflowTaskNameInput.focus();
                    }
                } else if (tabId === 'bulkAdd') {
                    const bulkWorkflowTasksTextarea = modal.querySelector("#bulkWorkflowTasks");
                    if (bulkWorkflowTasksTextarea) {
                        bulkWorkflowTasksTextarea.focus();
                    }
                }
            }, 10);
        });
    });
    
    // Close modal when clicking the x button
    modal.querySelector(".close-button").addEventListener("click", function() {
        document.body.removeChild(modal);
    });
    
    // Close modal when clicking cancel buttons
    modal.querySelectorAll(".cancel-button").forEach(button => {
        button.addEventListener("click", function() {
            document.body.removeChild(modal);
        });
    });
    
    // Close modal when clicking outside the modal content
    modal.addEventListener("click", function(event) {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Add Enter key handling for single workflow task input
    const workflowTaskNameInput = modal.querySelector("#workflowTaskName");
    if (workflowTaskNameInput) {
        workflowTaskNameInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault(); // Prevent default Enter behavior
                const addButton = modal.querySelector("#addSingleWorkflowTask");
                if (addButton && !addButton.disabled) {
                    addButton.click();
                }
            }
        });
    }
    
    // Validate workflow task name
    function validateWorkflowTaskName(name) {
        if (!name) {
            return "Workflow task name cannot be empty";
        }
        if (name.length > 100) {
            return "Workflow task name cannot exceed 100 characters";
        }
        if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
            return "Workflow task name must start with a letter and contain only letters and numbers";
        }
        if (currentWorkflowTasks.some(workflowTask => workflowTask.name === name)) {
            return "Workflow task with this name already exists";
        }
        return null; // Valid
    }
    
    // Add single workflow task button event listener
    modal.querySelector("#addSingleWorkflowTask").addEventListener("click", function() {
        const workflowTaskName = modal.querySelector("#workflowTaskName").value.trim();
        const errorElement = modal.querySelector("#singleValidationError");
        
        const validationError = validateWorkflowTaskName(workflowTaskName);
        if (validationError) {
            errorElement.textContent = validationError;
            return;
        }
        
        // Add the new workflow task by sending individual add commands
        addNewWorkflowTask(workflowTaskName);
        
        // Close the modal
        document.body.removeChild(modal);
    });
    
    // Add bulk workflow tasks button event listener
    modal.querySelector("#addBulkWorkflowTasks").addEventListener("click", function() {
        const bulkWorkflowTasks = modal.querySelector("#bulkWorkflowTasks").value;
        const workflowTaskNames = bulkWorkflowTasks.split("\\n").map(name => name.trim()).filter(name => name);
        const errorElement = modal.querySelector("#bulkValidationError");
        
        // Validate all workflow task names
        const errors = [];
        const validWorkflowTasks = [];
        
        workflowTaskNames.forEach(name => {
            const validationError = validateWorkflowTaskName(name);
            if (validationError) {
                errors.push("\\"" + name + "\\": " + validationError);
            } else {
                validWorkflowTasks.push(name);
            }
        });
        
        if (errors.length > 0) {
            errorElement.innerHTML = errors.join("<br>");
            return;
        }
        
        // Add all valid workflow tasks using individual commands
        validWorkflowTasks.forEach(name => {
            addNewWorkflowTask(name);
        });
        
        // Close the modal
        document.body.removeChild(modal);
    });
}

// Function to add a new workflow task (called from add workflow task modal)
function addNewWorkflowTask(workflowTaskName) {
    // Send message to add a new workflow task with the specified name
    vscode.postMessage({
        command: 'addWorkflowTaskWithName',
        data: {
            name: workflowTaskName
        }
    });
}
`;
}

module.exports = {
    getAddWorkflowTaskModalFunctionality
};

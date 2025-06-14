"use strict";

/**
 * Creates the JavaScript functionality for the Add Property modal
 * @returns {string} JavaScript code as a string for the modal functionality
 */
function getPropertyModalFunctionality() {
    return `
// Function to create and show the Add Property modal
function createPropertyModal() {
    // Create modal dialog for adding properties
    const modal = document.createElement("div");
    modal.className = "modal";
    
    // Import the modal HTML template
    const modalContent = getPropertyModalHtml();
    
    // Set the modal content
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Show the modal
    setTimeout(() => {
        modal.style.display = "flex";
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
    
    // Validate property name
    function validatePropertyName(name) {
        if (!name) {
            return "Property name cannot be empty";
        }
        if (name.length > 100) {
            return "Property name cannot exceed 100 characters";
        }
        if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
            return "Property name must start with a letter and contain only letters and numbers";
        }
        if (props.some(p => p.name === name)) {
            return "Property with this name already exists";
        }
        return null; // Valid
    }
    
    // Add single property
    document.getElementById("addSingleProp").addEventListener("click", function() {
        const propName = document.getElementById("propName").value.trim();
        const errorElement = document.getElementById("singleValidationError");
        
        const validationError = validatePropertyName(propName);
        if (validationError) {
            errorElement.textContent = validationError;
            return;
        }
        
        // Add the new property
        addNewProperty(propName);
        
        // Close the modal
        document.body.removeChild(modal);
    });
    
    // Add bulk properties
    document.getElementById("addBulkProps").addEventListener("click", function() {
        const bulkProps = document.getElementById("bulkProps").value;
        const propNames = bulkProps.split("\\n").map(name => name.trim()).filter(name => name);
        const errorElement = document.getElementById("bulkValidationError");
        
        // Validate all property names
        const errors = [];
        const validProps = [];
        
        propNames.forEach(name => {
            const validationError = validatePropertyName(name);
            if (validationError) {
                errors.push("\\"" + name + "\\": " + validationError);
            } else {
                validProps.push(name);
            }
        });
        
        if (errors.length > 0) {
            errorElement.innerHTML = errors.join("<br>");
            return;
        }
        
        // Add all valid properties
        validProps.forEach(name => {
            addNewProperty(name);
        });
        
        // Close the modal
        document.body.removeChild(modal);
    });
}`;
}

module.exports = {
    getPropertyModalFunctionality
};
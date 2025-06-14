"use strict";

/**
 * Creates the JavaScript functionality for the Add Column modal
 * @returns {string} JavaScript code as a string for the modal functionality
 */
function getAddColumnModalFunctionality() {
    return `
// Function to create and show the Add Column modal
function createAddColumnModal() {
    // Create modal dialog for adding columns
    const modal = document.createElement("div");
    modal.className = "modal";
    
    // Import the modal HTML template
    const modalContent = getAddColumnModalHtml();
    
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
    modal.querySelector(".close").addEventListener("click", function() {
        document.body.removeChild(modal);
    });
    
    // Close modal when clicking outside the modal content
    modal.addEventListener("click", function(event) {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    });
      // Validate column name
    function validateColumnName(name) {
        if (!name) {
            return "Column name cannot be empty";
        }
        if (name.length > 100) {
            return "Column name cannot exceed 100 characters";
        }
        if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
            return "Column name must start with a letter and contain only letters and numbers";
        }
        if (currentColumns.some(column => column.name === name)) {
            return "Column with this name already exists";
        }
        return null; // Valid
    }
    
    // Helper function to generate header text from column name
    function generateHeaderText(columnName) {
        // Convert PascalCase to space-separated words
        // Handle cases like "FirstName" -> "First Name", "AppDNA" -> "App DNA"
        return columnName.replace(/([a-z])([A-Z])/g, '$1 $2')
                        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
    }
      // Add single column
    document.getElementById("addSingleColumn").addEventListener("click", function() {
        const columnName = document.getElementById("columnName").value.trim();
        const errorElement = document.getElementById("singleValidationError");
        
        const validationError = validateColumnName(columnName);
        if (validationError) {
            errorElement.textContent = validationError;
            return;
        }
        
        // Generate header text from column name
        const headerText = generateHeaderText(columnName);
        
        // Add the new column
        addNewColumn(columnName, headerText);
        
        // Close the modal
        document.body.removeChild(modal);
    });
    
    // Add bulk columns
    document.getElementById("addBulkColumns").addEventListener("click", function() {
        const bulkColumns = document.getElementById("bulkColumns").value;
        const columnNames = bulkColumns.split("\\n").map(name => name.trim()).filter(name => name);
        const errorElement = document.getElementById("bulkValidationError");
        
        // Validate all column names
        const errors = [];
        const validColumns = [];
        
        columnNames.forEach(name => {
            const validationError = validateColumnName(name);
            if (validationError) {
                errors.push("\\"" + name + "\\": " + validationError);
            } else {
                validColumns.push(name);
            }
        });
        
        if (errors.length > 0) {
            errorElement.innerHTML = errors.join("<br>");
            return;
        }
        
        // Add all valid columns
        validColumns.forEach(name => {
            const headerText = generateHeaderText(name);
            addNewColumn(name, headerText);
        });
        
        // Close the modal
        document.body.removeChild(modal);
    });
}`;
}

module.exports = {
    getAddColumnModalFunctionality
};
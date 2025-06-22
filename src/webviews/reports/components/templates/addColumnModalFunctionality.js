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
        // Focus on the column name input when modal opens (single column tab is active by default)
        const columnNameInput = modal.querySelector("#columnName");
        if (columnNameInput) {
            columnNameInput.focus();
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
                    const columnNameInput = modal.querySelector("#columnName");
                    if (columnNameInput) {
                        columnNameInput.focus();
                    }
                } else if (tabId === 'bulkAdd') {
                    const bulkColumnsTextarea = modal.querySelector("#bulkColumns");
                    if (bulkColumnsTextarea) {
                        bulkColumnsTextarea.focus();
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
      
    // Add Enter key handling for single column input
    const columnNameInput = modal.querySelector("#columnName");
    if (columnNameInput) {
        columnNameInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault(); // Prevent default Enter behavior
                const addButton = modal.querySelector("#addSingleColumn");
                if (addButton && !addButton.disabled) {
                    addButton.click();
                }
            }
        });
    }
    
    // Add Enter key handling for bulk columns textarea (Enter submits, Shift+Enter for new line)
    const bulkColumnsTextarea = modal.querySelector("#bulkColumns");
    if (bulkColumnsTextarea) {
        bulkColumnsTextarea.addEventListener("keydown", function(event) {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault(); // Prevent default Enter behavior
                const addButton = modal.querySelector("#addBulkColumns");
                if (addButton && !addButton.disabled) {
                    addButton.click();
                }
            }
            // Shift+Enter will allow new line (default behavior)
        });
    }
    
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
    }    // Add single column
    modal.querySelector("#addSingleColumn").addEventListener("click", function() {
        const columnName = modal.querySelector("#columnName").value.trim();
        const errorElement = modal.querySelector("#singleValidationError");
        
        const validationError = validateColumnName(columnName);
        if (validationError) {
            errorElement.textContent = validationError;
            return;
        }
        
        // Generate header text from column name
        const headerText = generateHeaderText(columnName);
        
        // Add the new column - backend will reload view
        addNewColumn(columnName, headerText);
        
        // Close the modal
        document.body.removeChild(modal);
    });
    
    // Add bulk columns
    modal.querySelector("#addBulkColumns").addEventListener("click", function() {
        const bulkColumns = modal.querySelector("#bulkColumns").value;
        const columnNames = bulkColumns.split("\\n").map(name => name.trim()).filter(name => name);
        const errorElement = modal.querySelector("#bulkValidationError");
        
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
        }        // Add all valid columns at once
        const newColumns = validColumns.map(name => ({
            name: name,
            headerText: generateHeaderText(name)
        }));
        
        // Add all columns in one operation
        const updatedColumns = [...currentColumns, ...newColumns];
        
        // Send message to update the model - backend will reload the view
        vscode.postMessage({
            command: 'updateModel',
            data: {
                columns: updatedColumns
            }
        });
        
        // Close the modal
        document.body.removeChild(modal);
    });
}`;
}

module.exports = {
    getAddColumnModalFunctionality
};
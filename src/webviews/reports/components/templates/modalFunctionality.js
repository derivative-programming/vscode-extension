"use strict";

/**
 * Returns JavaScript code for modal functionality
 * @returns {string} JavaScript code
 */
function getModalFunctionality() {
    return `
        // Modal functionality for columns
        function setupColumnModal() {
            const modal = document.getElementById("column-modal");
            const closeBtn = modal.querySelector(".close");
            const cancelBtn = document.getElementById("cancel-column-btn");
            const form = document.getElementById("column-form");
            
            // Close modal on clicking X or Cancel
            closeBtn.onclick = () => { modal.style.display = "none"; };
            cancelBtn.onclick = () => { modal.style.display = "none"; };
            
            // Close modal when clicking outside
            window.onclick = (event) => {
                if (event.target === modal) {
                    modal.style.display = "none";
                }
            };
            
            // Handle form submission
            form.onsubmit = (e) => {
                e.preventDefault();
                saveColumnChanges();
            };
        }
        
        // Modal functionality for buttons
        function setupButtonModal() {
            const modal = document.getElementById("button-modal");
            const closeBtn = modal.querySelector(".close");
            const editCancelBtn = document.getElementById("cancel-button-btn");
            const addCancelBtn = document.getElementById("add-button-cancel-btn");
            const editForm = document.getElementById("button-form");
            const addSaveBtn = document.getElementById("add-button-save-btn");
            
            // Close modal on clicking X
            closeBtn.onclick = () => { modal.style.display = "none"; };
            
            // Close modal on clicking Cancel buttons
            if (editCancelBtn) {
                editCancelBtn.onclick = () => { modal.style.display = "none"; };
            }
            if (addCancelBtn) {
                addCancelBtn.onclick = () => { modal.style.display = "none"; };
            }
            
            // Handle edit form submission
            if (editForm) {
                editForm.onsubmit = (e) => {
                    e.preventDefault();
                    saveButtonChanges();
                };
            }
            
            // Handle add button save
            if (addSaveBtn) {
                addSaveBtn.onclick = () => {
                    const buttonName = document.getElementById("button-name-input").value.trim();
                    const errorElement = document.getElementById("button-name-validation-error");
                    
                    // Validate button name
                    const validationError = validateButtonName(buttonName);
                    if (validationError) {
                        errorElement.textContent = validationError;
                        return;
                    }
                    
                    // Clear any previous errors
                    errorElement.textContent = "";
                    
                    // Add the new button
                    addNewButton(buttonName);
                    
                    // Close the modal
                    modal.style.display = "none";
                };
            }
        }
        
        // Validate button name (PascalCase, alpha only, no spaces)
        function validateButtonName(name) {
            if (!name) {
                return "Button name cannot be empty";
            }
            if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
                return "Button name must start with a letter and contain only letters and numbers";
            }
            // Check if button with this name already exists
            const existingButtons = reportData.reportButton || [];
            if (existingButtons.some(button => button.buttonName === name)) {
                return "Button with this name already exists";
            }
            return null; // Valid
        }
        
        // Modal functionality for parameters
        function setupParamModal() {
            const modal = document.getElementById("param-modal");
            const closeBtn = modal.querySelector(".close");
            const cancelBtn = document.getElementById("cancel-param-btn");
            const form = document.getElementById("param-form");
            
            // Close modal on clicking X or Cancel
            closeBtn.onclick = () => { modal.style.display = "none"; };
            cancelBtn.onclick = () => { modal.style.display = "none"; };
            
            // Handle form submission
            form.onsubmit = (e) => {
                e.preventDefault();
                saveParamChanges();
            };
        }
        
        // Initialize all modals
        setupColumnModal();
        setupButtonModal();
        setupParamModal();
    `;
}

module.exports = {
    getModalFunctionality
};

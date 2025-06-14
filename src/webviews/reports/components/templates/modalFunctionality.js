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
                    
                    // Clear any previous errors first
                    errorElement.textContent = "";
                    
                    // The actual validation will be done in the client script
                    // where current buttons data is available
                    // Just trigger a custom event to handle the validation and saving
                    const event = new CustomEvent('addButtonRequested', { 
                        detail: { buttonName: buttonName, errorElement: errorElement } 
                    });
                    document.dispatchEvent(event);
                };
            }
        }
        
        // Note: validateButtonName function is defined in client script where 
        // currentButtons data is available
        
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

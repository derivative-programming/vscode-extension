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
            const cancelBtn = document.getElementById("cancel-button-btn");
            const form = document.getElementById("button-form");
            
            // Close modal on clicking X or Cancel
            closeBtn.onclick = () => { modal.style.display = "none"; };
            cancelBtn.onclick = () => { modal.style.display = "none"; };
            
            // Handle form submission
            form.onsubmit = (e) => {
                e.preventDefault();
                saveButtonChanges();
            };
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

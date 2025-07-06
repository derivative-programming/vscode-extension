"use strict";

/**
 * File: domInitialization.js
 * Purpose: Handles DOM initialization and setup for the report details view
 * Created: 2025-07-06
 */

/**
 * Handles DOM initialization and setup
 * @returns {string} JavaScript code as a string for DOM initialization
 */
function getDOMInitialization() {
    return `
    // Initialize styling for readonly/disabled inputs
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('[id^="setting-"]').forEach(input => {
            const isReadOnly = input.readOnly || input.disabled;
            updateInputStyle(input, !isReadOnly);
        });

        // Initialize button list view - hide details if no button is selected
        let buttonsList = document.getElementById('buttonsList');
        let buttonDetailsContainer = document.getElementById('buttonDetailsContainer');
        if (buttonsList && buttonDetailsContainer && (!buttonsList.value || buttonsList.value === "")) {
            buttonDetailsContainer.style.display = 'none';
        }

        // Initialize column list view - hide details if no column is selected
        let columnsList = document.getElementById('columnsList');
        let columnDetailsContainer = document.getElementById('columnDetailsContainer');
        if (columnsList && columnDetailsContainer && (!columnsList.value || columnsList.value === "")) {
            columnDetailsContainer.style.display = 'none';
        }

        // Initialize params list view - hide details if no param is selected
        let paramsList = document.getElementById('paramsList');
        let paramDetailsContainer = document.getElementById('paramDetailsContainer');
        if (paramsList && paramDetailsContainer && (!paramsList.value || paramsList.value === "")) {
            paramDetailsContainer.style.display = 'none';
        }
        
        // Initialize modal functionality
        setupColumnModal();
        setupButtonModal();
        setupParamModal();
    });

    // Modal functionality for columns
    function setupColumnModal() {
        const modal = document.getElementById("column-modal");
        if (!modal) return;
        
        const closeBtn = modal.querySelector(".close");
        const cancelBtn = document.getElementById("cancel-column-btn");
        const form = document.getElementById("column-form");
        
        // Close modal on clicking X or Cancel
        if (closeBtn) {
            closeBtn.onclick = () => { modal.style.display = "none"; };
        }
        if (cancelBtn) {
            cancelBtn.onclick = () => { modal.style.display = "none"; };
        }
        
        // Close modal when clicking outside
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        };
        
        // Handle form submission
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                saveColumnChanges();
            };
        }
    }

    // Modal functionality for buttons
    function setupButtonModal() {
        const modal = document.getElementById("button-modal");
        if (!modal) return;
        
        const closeBtn = modal.querySelector(".close");
        const editCancelBtn = document.getElementById("cancel-button-btn");
        const addCancelBtn = document.getElementById("add-button-cancel-btn");
        const editForm = document.getElementById("button-form");
        const addSaveBtn = document.getElementById("add-button-save-btn");
        
        // Close modal on clicking X
        if (closeBtn) {
            closeBtn.onclick = () => { modal.style.display = "none"; };
        }
        
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
                
                // Trigger a custom event to handle the validation and saving
                const event = new CustomEvent('addButtonRequested', {
                    detail: { buttonName: buttonName, errorElement: errorElement }
                });
                document.dispatchEvent(event);
            };
        }
    }

    // Modal functionality for parameters
    function setupParamModal() {
        const modal = document.getElementById("param-modal");
        if (!modal) return;
        
        const closeBtn = modal.querySelector(".close");
        const cancelBtn = document.getElementById("cancel-param-btn");
        const form = document.getElementById("param-form");
        
        // Close modal on clicking X or Cancel
        if (closeBtn) {
            closeBtn.onclick = () => { modal.style.display = "none"; };
        }
        if (cancelBtn) {
            cancelBtn.onclick = () => { modal.style.display = "none"; };
        }
        
        // Handle form submission
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                saveParamChanges();
            };
        }
    }
    `;
}

module.exports = {
    getDOMInitialization
};

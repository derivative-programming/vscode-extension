"use strict";

/**
 * File: modalFunctionality.js
 * Purpose: Modal handling functions for the forms detail view
 * Created: 2025-07-06
 */

/**
 * Gets modal functionality for add/edit modals
 * @returns {string} JavaScript code for modal functionality
 */
function getModalFunctionality() {
    return `
    // Modal handling functions
    function openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    function closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    // Initialize modal functionality
    document.addEventListener('DOMContentLoaded', () => {
        // Close button functionality for all modals
        document.querySelectorAll('.close-button').forEach(button => {
            button.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // Close modals when clicking outside the modal content
        window.addEventListener('click', function(event) {
            document.querySelectorAll('.modal').forEach(modal => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    });
    `;
}

module.exports = {
    getModalFunctionality
};

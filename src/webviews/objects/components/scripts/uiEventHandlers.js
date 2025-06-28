"use strict";

/**
 * Handles UI event binding for tabs and view switching
 * @returns {string} JavaScript code as a string for UI event handling
 */
function getUIEventHandlers() {
    return `
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // Update active tab
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update visible tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });

    // View switching - using event delegation for better reliability
    document.querySelector('.view-icons').addEventListener('click', (event) => {
        // Check if the clicked element is an icon or a child of an icon
        const iconElement = event.target.closest('.icon');
        if (!iconElement) return;
        const view = iconElement.getAttribute('data-view');
        console.log('Switching to view:', view);
        
        // Update active state of icons
        document.querySelectorAll('.view-icons .icon').forEach(icon => {
            icon.classList.remove('active');
        });
        iconElement.classList.add('active');
        
        // Hide all views
        document.querySelectorAll('.view-content').forEach(content => {
            content.style.display = 'none';
            content.classList.remove('active');
        });
        
        // Show selected view
        const viewElement = document.getElementById(view + 'View'); 
        if (viewElement) {
            viewElement.style.display = 'block';
            viewElement.classList.add('active');
            console.log('Activated view:', view + 'View');
        } else {
            console.error('View not found:', view + 'View');
        }
    });
    `;
}

module.exports = {
    getUIEventHandlers
};
"use strict";

/**
 * File: uiEventHandlers.js
 * Purpose: Handles UI event binding for tabs and view switching in report details
 * Created: 2025-07-06
 */

/**
 * Handles UI event binding for tabs and view switching
 * @returns {string} JavaScript code as a string for UI event handling
 */
function getUIEventHandlers() {
    return `
    // Set up VS Code message listener for tab restoration
    window.addEventListener('message', event => {
        const message = event.data;
        if (message.command === 'restoreTab') {
            console.log('[DEBUG] Restoring tab:', message.tabId);
            restoreActiveTab(message.tabId);
        }
    });

    // DOM ready wrapper for UI event handlers
    document.addEventListener('DOMContentLoaded', () => {
        // Tab switching functionality
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and content
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                tab.classList.add('active');
                const tabId = tab.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });

        // View switching functionality for each tab
        document.addEventListener('click', (event) => {
            // Check if the clicked element is a view icon
            const iconElement = event.target.closest('.icon');
            if (!iconElement) return;
            
            const view = iconElement.getAttribute('data-view');
            const viewIconsContainer = iconElement.closest('.view-icons');
            const currentTab = viewIconsContainer ? viewIconsContainer.getAttribute('data-tab') : null;
            
            console.log('Switching to view:', view, 'in tab:', currentTab);
            
            if (!currentTab) return;
            
            // Update active state of icons within this tab
            viewIconsContainer.querySelectorAll('.icon').forEach(icon => {
                icon.classList.remove('active');
            });
            iconElement.classList.add('active');
            
            // Hide all views in the current tab
            const currentTabContent = document.getElementById(currentTab);
            if (currentTabContent) {
                currentTabContent.querySelectorAll('.view-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // Show selected view in the current tab
                const selectedView = currentTabContent.querySelector('.' + view + '-view');
                if (selectedView) {
                    selectedView.classList.add('active');
                }
            }
        });
    });

    // Function to restore the active tab with retry logic
    function restoreActiveTab(tabId) {
        function attemptRestore() {
            // Remove active class from all tabs and tab contents
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to the specified tab and its content
            const targetTab = document.querySelector('.tab[data-tab="' + tabId + '"]');
            const targetContent = document.getElementById(tabId);
            
            if (targetTab && targetContent) {
                targetTab.classList.add('active');
                targetContent.classList.add('active');
                console.log('[DEBUG] Successfully restored tab:', tabId);
                return true;
            } else {
                console.warn('[DEBUG] Elements not ready yet for tab:', tabId);
                return false;
            }
        }
        
        // Try immediately first
        if (!attemptRestore()) {
            // If elements not found, wait for DOM to be ready and try again
            setTimeout(() => {
                if (!attemptRestore()) {
                    console.error('[DEBUG] Failed to restore tab after retry:', tabId);
                }
            }, 50);
        }
    }
    `;
}

module.exports = {
    getUIEventHandlers
};

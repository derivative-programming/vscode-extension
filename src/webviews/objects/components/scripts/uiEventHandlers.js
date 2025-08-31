"use strict";

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
            // If not successful, try again after a short delay
            setTimeout(() => {
                if (!attemptRestore()) {
                    // Last try after a longer delay
                    setTimeout(attemptRestore, 500);
                }
            }, 100);
        }
    }

    // Tab switching and view switching - wrapped in DOMContentLoaded to ensure DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
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
                
                // Notify VS Code about tab change for persistence
                vscode.postMessage({
                    command: 'tabChanged',
                    tabId: tabId
                });
            });
        });

        // View switching - using event delegation for better reliability
        // Handle all view-icons containers (properties and lookup items)
        document.querySelectorAll('.view-icons').forEach(viewIconsContainer => {
            viewIconsContainer.addEventListener('click', (event) => {
                // Check if the clicked element is an icon or a child of an icon
                const iconElement = event.target.closest('.icon');
                if (!iconElement) return;
                const view = iconElement.getAttribute('data-view');
                console.log('Switching to view:', view);
                
                // Update active state of icons within this specific view-icons container
                viewIconsContainer.querySelectorAll('.icon').forEach(icon => {
                    icon.classList.remove('active');
                });
                iconElement.classList.add('active');
                
                // Find the parent tab content to scope view switching to the current tab
                const parentTabContent = viewIconsContainer.closest('.tab-content');
                if (parentTabContent) {
                    // Hide all views within this tab content
                    parentTabContent.querySelectorAll('.view-content').forEach(content => {
                        content.style.display = 'none';
                        content.classList.remove('active');
                    });
                    
                    // Show selected view within this tab content
                    const viewElement = parentTabContent.querySelector('#' + view + 'View');
                    if (viewElement) {
                        viewElement.style.display = 'block';
                        viewElement.classList.add('active');
                        console.log('Activated view:', view + 'View');
                        
                        // Completely reload the view content with current model data when switching views
                        setTimeout(() => {
                            if (view === 'propsTable' && typeof window.reloadPropertiesTableView === 'function') {
                                console.log('Reloading properties table view from view switch');
                                window.reloadPropertiesTableView();
                            } else if (view === 'propsList' && typeof window.reloadPropertiesListView === 'function') {
                                console.log('Reloading properties list view from view switch');
                                window.reloadPropertiesListView(true); // Preserve selection when switching views
                            } else if (view === 'lookupTable' && typeof window.reloadLookupItemsTableView === 'function') {
                                console.log('Reloading lookup items table view from view switch');
                                window.reloadLookupItemsTableView();
                            } else if (view === 'lookupList' && typeof window.reloadLookupItemsListView === 'function') {
                                console.log('Reloading lookup items list view from view switch');
                                window.reloadLookupItemsListView(true); // Preserve selection when switching views
                            }
                        }, 50);
                    } else {
                        console.error('View not found:', view + 'View');
                    }
                }
            });
        });
    });
    `;
}

module.exports = {
    getUIEventHandlers
};
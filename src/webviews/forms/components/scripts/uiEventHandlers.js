"use strict";

/**
 * File: uiEventHandlers.js
 * Purpose: Handles UI event binding for tabs and view switching in form details
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
                
                // Notify VS Code about tab change for persistence
                vscode.postMessage({
                    command: 'tabChanged',
                    tabId: tabId
                });
            });
        });

        // Settings tab checkbox functionality
        document.querySelectorAll('.setting-checkbox').forEach(checkbox => {
            const propertyName = checkbox.getAttribute('data-prop');
            const isEnum = checkbox.getAttribute('data-is-enum') === 'true';
            const inputField = document.getElementById('setting-' + propertyName);
            
            // Set initial state of the input field
            if (inputField) {
                if (isEnum) {
                    inputField.disabled = !checkbox.checked;
                } else {
                    inputField.readOnly = !checkbox.checked;
                }
                
                // Set initial styling based on checkbox state
                updateInputStyle(inputField, checkbox.checked);
            }
            
            checkbox.addEventListener('change', function() {
                // Don't allow unchecking of properties that already exist in the model
                if (this.hasAttribute('data-originally-checked')) {
                    this.checked = true;
                    return;
                }
                
                const propertyName = this.getAttribute('data-prop');
                const isEnum = this.getAttribute('data-is-enum') === 'true';
                const inputField = document.getElementById('setting-' + propertyName);
                
                if (inputField) {
                    if (this.checked) {
                        // Enable the input field
                        if (isEnum) {
                            inputField.disabled = false;
                        } else {
                            inputField.readOnly = false;
                        }
                        
                        // Disable the checkbox to prevent unchecking
                        this.disabled = true;
                        this.setAttribute('data-originally-checked', 'true');
                        
                        // If this is a select element, make sure it has a valid value
                        if (inputField.tagName === 'SELECT' && (!inputField.value || inputField.value === '')) {
                            if (inputField.options.length > 0) {
                                inputField.value = inputField.options[0].value;
                            }
                        }
                    } else {
                        // Disable the input field
                        if (isEnum) {
                            inputField.disabled = true;
                        } else {
                            inputField.readOnly = true;
                        }
                    }
                    
                    // Update styling based on checkbox state
                    updateInputStyle(inputField, this.checked);
                    
                    // Send updated data to VS Code
                    const currentData = {};
                    
                    document.querySelectorAll('.setting-input').forEach(input => {
                        const inputPropertyName = input.getAttribute('data-prop');
                        const correspondingCheckbox = document.querySelector('.setting-checkbox[data-prop="' + inputPropertyName + '"]');
                        
                        if (correspondingCheckbox && correspondingCheckbox.checked) {
                            const value = input.value.trim();
                            if (value !== '') {
                                currentData[inputPropertyName] = value;
                            }
                        }
                    });
                    
                    vscode.postMessage({
                        command: 'updateForm',
                        formId: formId,
                        data: currentData
                    });
                }
            });
        });
        
        // Settings input field change listeners
        document.querySelectorAll('.setting-input').forEach(input => {
            ['input', 'change'].forEach(eventType => {
                input.addEventListener(eventType, function() {
                    const currentData = {};
                    
                    document.querySelectorAll('.setting-input').forEach(settingInput => {
                        const propertyName = settingInput.getAttribute('data-prop');
                        const correspondingCheckbox = document.querySelector('.setting-checkbox[data-prop="' + propertyName + '"]');
                        
                        if (correspondingCheckbox && correspondingCheckbox.checked) {
                            const value = settingInput.value.trim();
                            if (value !== '') {
                                currentData[propertyName] = value;
                            }
                        }
                    });
                    
                    vscode.postMessage({
                        command: 'updateForm',
                        formId: formId,
                        data: currentData
                    });
                });
            });
        });

        // View switching functionality for each tab
        document.addEventListener('click', (event) => {
            // Check if the clicked element is a view icon
            const iconElement = event.target.closest('.icon');
            if (!iconElement) {
                return;
            }
            
            const view = iconElement.getAttribute('data-view');
            const viewIconsContainer = iconElement.closest('.view-icons');
            const currentTab = viewIconsContainer ? viewIconsContainer.getAttribute('data-tab') : null;
            
            console.log('Switching to view:', view, 'in tab:', currentTab);
            
            if (!currentTab) {
                return;
            }
            
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
                
                // Show selected view in the current tab based on naming convention
                // Tab naming varies between forms tabs:
                // params -> paramsListView/paramsTableView
                // buttons -> buttons-list-view/buttons-table-view (with hyphens!)
                // outputVars -> outputVarsListView/outputVarsTableView
                let viewId = '';
                if (currentTab === 'buttons') {
                    // Special case for buttons tab which uses hyphens
                    if (view === 'list') {
                        viewId = 'buttons-list-view';
                    } else if (view === 'table') {
                        viewId = 'buttons-table-view';
                    }
                } else {
                    // Standard pattern for params and outputVars tabs
                    if (view === 'list') {
                        viewId = currentTab + 'ListView';
                    } else if (view === 'table') {
                        viewId = currentTab + 'TableView';
                    }
                }
                
                const selectedView = document.getElementById(viewId);
                if (selectedView) {
                    selectedView.classList.add('active');
                    console.log('Successfully switched to view:', viewId);
                } else {
                    console.warn('Could not find view element with ID:', viewId);
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
            // If not successful, try again after a short delay
            setTimeout(() => {
                if (!attemptRestore()) {
                    // Last try after a longer delay
                    setTimeout(attemptRestore, 500);
                }
            }, 100);
        }
    }
    `;
}

module.exports = {
    getUIEventHandlers
};

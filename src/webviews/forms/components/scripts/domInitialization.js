"use strict";

/**
 * File: domInitialization.js
 * Purpose: DOM initialization and setup functions for the forms detail view
 * Created: 2025-07-06
 */

/**
 * Gets DOM initialization functions for the forms detail view
 * @returns {string} JavaScript code for DOM initialization
 */
function getDOMInitialization() {
    return `
    // Initialize all DOM event listeners and functionality
function initializeDOMEvents() {
    // Add param button functionality
    const addParamBtn = document.getElementById('add-param-btn');
    if (addParamBtn) {
        addParamBtn.addEventListener('click', function() {
            // Use the new add input control modal instead of direct message
            createAddInputControlModal();
        });
    }
    
    // Add button button functionality
    const addButtonBtn = document.getElementById('add-button-btn');
    if (addButtonBtn) {
        addButtonBtn.addEventListener('click', function() {
            // Show the add button modal instead of directly adding
            showAddButtonModal();
        });
    }
    
    // Add output variable button functionality
    const addOutputVarBtn = document.getElementById('add-output-var-btn');
    if (addOutputVarBtn) {
        addOutputVarBtn.addEventListener('click', function() {
            // Show the add output variable modal instead of directly adding
            createAddOutputVariableModal();
        });
    }
    
    // Save modal handlers
    setupSaveModalHandlers();
    
    // Cancel button handlers
    setupCancelButtonHandlers();
    
    // Set up settings input handlers for form changes
    setupSettingsInputHandlers();
    
    // Set up browse button event handlers for destinationTargetName and sourceObjectName fields
    setupPageBrowseButtonHandlers();
}

// Setup save modal handlers
function setupSaveModalHandlers() {
    // Save param modal handler
    document.getElementById('save-param').addEventListener('click', function() {
        const index = parseInt(document.getElementById('param-index').value, 10);
        const paramData = {};
        
        // Collect form field data
        document.querySelectorAll('#param-fields-container input, #param-fields-container select').forEach(input => {
            paramData[input.name] = input.value;
        });
        
        // Send to VS Code
        const vscode = acquireVsCodeApi();
        if (index === -1) {
            // This is a new parameter
            vscode.postMessage({
                command: 'addParam'
            });
        } else {
            // This is an update to an existing parameter
            vscode.postMessage({
                command: 'updateParam',
                data: {
                    param: paramData,
                    index: index
                }
            });
        }
        
        closeModal('param-modal');
    });
    
    // Save button modal handler
    document.getElementById('save-button').addEventListener('click', function() {
        const index = parseInt(document.getElementById('button-index').value, 10);
        const buttonData = {};
        
        // Collect form field data
        document.querySelectorAll('#button-fields-container input, #button-fields-container select').forEach(input => {
            buttonData[input.name] = input.value;
        });
        
        // Send to VS Code
        const vscode = acquireVsCodeApi();
        if (index === -1) {
            // This is a new button
            vscode.postMessage({
                command: 'addButton'
            });
        } else {
            // This is an update to an existing button
            vscode.postMessage({
                command: 'updateButton',
                data: {
                    button: buttonData,
                    index: index
                }
            });
        }
        
        closeModal('button-modal');
    });
    
    // Save output var modal handler
    document.getElementById('save-output-var').addEventListener('click', function() {
        const index = parseInt(document.getElementById('output-var-index').value, 10);
        const outputVar = {};
        
        // Collect form field data
        document.querySelectorAll('#output-var-fields-container input, #output-var-fields-container select').forEach(input => {
            outputVar[input.name] = input.value;
        });
        
        // Send to VS Code
        const vscode = acquireVsCodeApi();
        if (index === -1) {
            // This is a new output variable
            vscode.postMessage({
                command: 'addOutputVar'
            });
        } else {
            // This is an update to an existing output variable
            vscode.postMessage({
                command: 'updateOutputVar',
                data: {
                    outputVar: outputVar,
                    index: index
                }
            });
        }
        
        closeModal('output-var-modal');
    });
}

// Setup cancel button handlers
function setupCancelButtonHandlers() {
    // Cancel button handlers
    document.getElementById('cancel-param').addEventListener('click', function() {
        closeModal('param-modal');
    });
    
    document.getElementById('cancel-button').addEventListener('click', function() {
        closeModal('button-modal');
    });
    
    document.getElementById('cancel-output-var').addEventListener('click', function() {
        closeModal('output-var-modal');
    });
}

// Function to initialize view switching
function initializeViewSwitching() {
    // Initialize view switcher dropdowns
    const viewSwitchers = document.querySelectorAll('select[id$="-view-switcher"]');
    viewSwitchers.forEach(switcher => {
        switcher.addEventListener('change', function() {
            const view = this.value; // list or table
            const tabId = this.id.replace('-view-switcher', '');
            
            // Find the corresponding view icons
            const viewIcons = document.querySelector('.view-icons[data-tab="' + tabId + '"]');
            if (viewIcons) {
                // Simulate click on the appropriate icon to switch views
                const iconToClick = viewIcons.querySelector('.icon.' + view + '-icon');
                if (iconToClick) {
                    iconToClick.click();
                }
            }
        });
    });
    
    // Ensure list view is active by default for all tabs
    document.querySelectorAll('.tab-content').forEach(tabContent => {
        const tabId = tabContent.id;
        const listView = document.querySelector('#' + tabId + 'ListView') || document.querySelector('#' + tabId + '-list-view');
        const tableView = document.querySelector('#' + tabId + 'TableView') || document.querySelector('#' + tabId + '-table-view');
        
        if (listView && tableView) {
            // Set list view as active
            listView.classList.add('active');
            tableView.classList.remove('active');
            
            // Update icons
            const viewIcons = document.querySelector('.view-icons[data-tab="' + tabId + '"]');
            if (viewIcons) {
                const listIcon = viewIcons.querySelector('.list-icon');
                const tableIcon = viewIcons.querySelector('.table-icon');
                
                if (listIcon && tableIcon) {
                    listIcon.classList.add('active');
                    tableIcon.classList.remove('active');
                }
            }
            
            // Update dropdown if it exists
            const viewSwitcher = document.getElementById(tabId + '-view-switcher');
            if (viewSwitcher) {
                viewSwitcher.value = 'list';
            }
        }
    });
}

// Setup browse button handlers for destinationTargetName and sourceObjectName fields
function setupPageBrowseButtonHandlers() {
    // Use event delegation to handle lookup buttons for destinationTargetName fields
    document.addEventListener('click', (event) => {
        if (event.target.closest('.lookup-button')) {
            const button = event.target.closest('.lookup-button');
            if (button.disabled) return;
            
            const propKey = button.getAttribute('data-prop');
            if (propKey === 'destinationTargetName') {
                // Find the corresponding input field
                let inputField = button.parentElement.querySelector('input[type="text"]');
                
                // If not found (list view), try using data-field-id
                if (!inputField) {
                    const fieldId = button.getAttribute('data-field-id');
                    if (fieldId) {
                        inputField = document.getElementById(fieldId);
                    }
                }
                
                if (inputField) {
                    const currentValue = inputField.value;
                    createPageSearchModal(currentValue, inputField);
                }
            } else if (propKey === 'sourceObjectName') {
                // Handle data object browse functionality
                let inputField = button.parentElement.querySelector('input[type="text"]');
                
                // If not found (list view), try using data-field-id
                if (!inputField) {
                    const fieldId = button.getAttribute('data-field-id');
                    if (fieldId) {
                        inputField = document.getElementById(fieldId);
                    }
                }
                
                if (inputField) {
                    const currentValue = inputField.value;
                    createDataObjectSearchModal(currentValue, inputField);
                }
            }
        }
    });
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('[DEBUG] DOM loaded, initializing events');
    initializeDOMEvents();
});
    `;
}

module.exports = {
    getDOMInitialization
};

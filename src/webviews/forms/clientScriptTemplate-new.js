"use strict";

/**
 * Gets the JavaScript code for client-side script using modular architecture
 * @param {Array} params The form parameters
 * @param {Array} buttons The form buttons
 * @param {Array} outputVars The form output variables
 * @param {Object} paramSchema Schema for parameters
 * @param {Object} buttonSchema Schema for buttons
 * @param {Object} outputVarSchema Schema for output variables
 * @param {string} formName The name of the form
 * @returns {string} JavaScript code for client-side functionality
 */
function getClientScriptTemplate(params, buttons, outputVars, paramSchema, buttonSchema, outputVarSchema, formName) {
    // Ensure formName is never undefined to prevent "name is not defined" error
    const safeFormName = formName || 'Unknown Form';
    console.log("[DEBUG] getClientScriptTemplate called with formName:", formName, "safeFormName:", safeFormName);
    
    return `
        // Store current data and schemas globally for modular scripts
        let currentParams = ${JSON.stringify(params)};
        let currentButtons = ${JSON.stringify(buttons)};
        let currentOutputVars = ${JSON.stringify(outputVars)};
        let currentEditingIndex = -1;
        
        // Store schema props globally for modular scripts
        window.paramSchemaProps = ${JSON.stringify(paramSchema)};
        window.buttonSchemaProps = ${JSON.stringify(buttonSchema)};
        window.outputVarSchemaProps = ${JSON.stringify(outputVarSchema)};
        
        // Acquire VS Code API once and make it globally available
        const vscode = acquireVsCodeApi();
        
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
        
        // Initialize tab functionality
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize all modular functionality
            initializeModalFunctionality();
            initializeTabFunctionality();
            initializeSettingsTabFunctionality();
            initializeDOMEvents();
            initializeButtonTabFunctionality();
            initializeButtonCheckboxes();
            initializeButtonTableInputs();
            initializeButtonCrudOperations();
            initializeButtonActionButtons();
            initializeOutputVariableTabFunctionality();
            initializeOutputVariableListView();
            initializeOutputVariableButtons();
            initializeOutputVariableTableView();
            initializeOutputVariableCrudOperations();
        });
`;
}

module.exports = {
    getClientScriptTemplate
};

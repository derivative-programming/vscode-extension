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
    document.getElementById('add-param-btn').addEventListener('click', function() {
        openModal('param-modal');
        document.getElementById('param-index').value = -1;  // -1 indicates new param
        
        // Reset the form
        const fieldsContainer = document.getElementById('param-fields-container');
        while (fieldsContainer.firstChild) {
            fieldsContainer.removeChild(fieldsContainer.firstChild);
        }
        
        // Generate input fields based on schema
        generateParamFields({});
    });
    
    // Add button button functionality
    document.getElementById('add-button-btn').addEventListener('click', function() {
        openModal('button-modal');
        document.getElementById('button-index').value = -1;  // -1 indicates new button
        
        // Reset the form
        const fieldsContainer = document.getElementById('button-fields-container');
        while (fieldsContainer.firstChild) {
            fieldsContainer.removeChild(fieldsContainer.firstChild);
        }
        
        // Generate input fields based on schema
        generateButtonFields({});
    });
    
    // Add output variable button functionality
    document.getElementById('add-output-var-btn').addEventListener('click', function() {
        openModal('output-var-modal');
        document.getElementById('output-var-index').value = -1;  // -1 indicates new output var
        
        // Reset the form
        const fieldsContainer = document.getElementById('output-var-fields-container');
        while (fieldsContainer.firstChild) {
            fieldsContainer.removeChild(fieldsContainer.firstChild);
        }
        
        // Generate input fields based on schema
        generateOutputVarFields({});
    });
    
    // Save modal handlers
    setupSaveModalHandlers();
    
    // Cancel button handlers
    setupCancelButtonHandlers();
    
    // Move up/down and reorder functionality
    setupReorderingButtons();
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
        vscode.postMessage({
            command: 'updateFormParam',
            param: paramData,
            index: index
        });
        
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
        vscode.postMessage({
            command: 'updateFormButton',
            button: buttonData,
            index: index
        });
        
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
        vscode.postMessage({
            command: 'updateOutputVar',
            data: {
                outputVar: outputVar,
                index: index
            }
        });
        
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

// Setup reordering buttons
function setupReorderingButtons() {
    setupParameterReordering();
    
    // Buttons reordering
    document.querySelectorAll('.move-button-up').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'), 10);
            if (index > 0) {
                moveArrayItem('button', index, index - 1);
            }
        });
    });
    
    document.querySelectorAll('.move-button-down').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'), 10);
            if (index < currentButtons.length - 1) {
                moveArrayItem('button', index, index + 1);
            }
        });
    });
    
    // Output Variables reordering
    document.querySelectorAll('.move-output-var-up').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'), 10);
            if (index > 0) {
                moveArrayItem('outputVar', index, index - 1);
            }
        });
    });
    
    document.querySelectorAll('.move-output-var-down').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'), 10);
            if (index < currentOutputVars.length - 1) {
                moveArrayItem('outputVar', index, index + 1);
            }
        });
    });
    
    // Reverse buttons
    document.getElementById('reverse-buttons-btn').addEventListener('click', function() {
        reverseArray('button');
    });
    
    document.getElementById('reverse-output-vars-btn').addEventListener('click', function() {
        reverseArray('outputVar');
    });
    
    // Initialize view switching functionality
    initializeViewSwitching();
}
    `;
}

module.exports = {
    getDOMInitialization
};

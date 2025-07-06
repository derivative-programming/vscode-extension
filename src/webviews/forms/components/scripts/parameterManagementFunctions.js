"use strict";

/**
 * File: parameterManagementFunctions.js
 * Purpose: Parameter management functions for the forms detail view
 * Created: 2025-07-06
 */

/**
 * Gets parameter management functions for the forms detail view
 * @returns {string} JavaScript code for parameter management
 */
function getParameterManagementFunctions() {
    return `
    // Parameter field generator
function generateParamFields(param) {
    const fieldsContainer = document.getElementById('param-fields-container');
    const paramSchemaProps = window.paramSchemaProps || {};
    
    Object.entries(paramSchemaProps).sort((a, b) => a[0].localeCompare(b[0])).forEach(([propName, schema]) => {
        const value = param[propName] || '';
        const hasEnum = schema.enum && Array.isArray(schema.enum);
        
        const fieldHtml = document.createElement('div');
        fieldHtml.className = 'form-row';
        
        const label = document.createElement('label');
        label.setAttribute('for', 'param-' + propName);
        if (schema.description) {
            label.setAttribute('title', schema.description);
        }
        label.textContent = formatPropertyLabel(propName) + ':';
        fieldHtml.appendChild(label);
        
        let input;
        if (hasEnum) {
            input = document.createElement('select');
            schema.enum.forEach(option => {
                const optionEl = document.createElement('option');
                optionEl.value = option;
                optionEl.textContent = option;
                if (value === option) {
                    optionEl.selected = true;
                }
                input.appendChild(optionEl);
            });
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.value = value;
        }
        
        input.id = 'param-' + propName;
        input.name = propName;
        if (schema.description) {
            input.setAttribute('title', schema.description);
        }
        
        fieldHtml.appendChild(input);
        fieldsContainer.appendChild(fieldHtml);
    });
}

// Parameter reordering functionality
function setupParameterReordering() {
    // Parameters reordering
    document.querySelectorAll('.move-param-up').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'), 10);
            if (index > 0) {
                moveArrayItem('param', index, index - 1);
            }
        });
    });
    
    document.querySelectorAll('.move-param-down').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'), 10);
            if (index < currentParams.length - 1) {
                moveArrayItem('param', index, index + 1);
            }
        });
    });
    
    // Reverse buttons
    document.getElementById('reverse-params-btn').addEventListener('click', function() {
        reverseArray('param');
    });
}

// Array item moving function for parameters
function moveArrayItem(type, fromIndex, toIndex) {
    let array, command;
    
    switch(type) {
        case 'param':
            array = currentParams;
            command = 'reorderFormParam';
            break;
        case 'button':
            array = currentButtons;
            command = 'reorderFormButton';
            break;
        case 'outputVar':
            array = currentOutputVars;
            command = 'reorderFormOutputVar';
            break;
        default:
            return;
    }
    
    // Notify VS Code about the reordering
    const vscode = acquireVsCodeApi();
    vscode.postMessage({
        command: command,
        fromIndex: fromIndex,
        toIndex: toIndex
    });
}

// Array reversal function for parameters
function reverseArray(type) {
    let command;
    
    switch(type) {
        case 'param':
            command = 'reverseFormParams';
            break;
        case 'button':
            command = 'reverseFormButtons';
            break;
        case 'outputVar':
            command = 'reverseFormOutputVars';
            break;
        default:
            return;
    }
    
    // Notify VS Code about the reversal
    const vscode = acquireVsCodeApi();
    vscode.postMessage({
        command: command
    });
}
    `;
}

module.exports = {
    getParameterManagementFunctions
};

"use strict";

/**
 * Provides functions for managing properties in the details view
 * @returns {string} JavaScript code as a string for property management
 */
function getPropertyManagementFunctions() {
    return `
    // Function to add a new property
    function addNewProperty(propName) {
        // Create new property object
        const newProp = { name: propName };
        
        // Add to properties array
        props.push(newProp);
        
        // Add to properties list in list view
        const propsList = document.getElementById("propsList");
        const option = document.createElement("option");
        option.value = props.length - 1;
        option.textContent = propName;
        propsList.appendChild(option);
        
        // Add to table in table view
        const tableBody = document.querySelector("#propsTable tbody");
        const row = document.createElement("tr");
        row.setAttribute("data-index", props.length - 1);
        
        // Create cells for each property column
        propColumns.forEach(propKey => {
            const cell = document.createElement("td");
            
            if (propKey === "name") {
                cell.innerHTML = '<span class="prop-name">' + propName + '</span>' +
                    '<input type="hidden" name="name" value="' + propName + '">';
            } else {
                const propSchema = propItemsSchema[propKey] || {};
                const hasEnum = propSchema.enum && Array.isArray(propSchema.enum);
                const isBooleanEnum = hasEnum && propSchema.enum.length === 2 && 
                    propSchema.enum.every(val => val === true || val === false || val === "true" || val === "false");
                
                const tooltip = propSchema.description ? 'title="' + propSchema.description + '"' : "";
                
                let inputHTML = "";
                if (hasEnum) {
                    inputHTML = '<select name="' + propKey + '" ' + tooltip + ' disabled>';
                    
                    // Create options
                    propSchema.enum.forEach(option => {
                        const isSelected = isBooleanEnum ? 
                            (option === false || option === "false") : false;
                        
                        inputHTML += '<option value="' + option + '" ' + 
                            (isSelected ? "selected" : "") + '>' + option + '</option>';
                    });
                    
                    inputHTML += '</select>';
                } else {
                    inputHTML = '<input type="text" name="' + propKey + '" value="" ' + tooltip + ' readonly>';
                }
                
                cell.innerHTML = '<div class="control-with-checkbox">' +
                    inputHTML +
                    '<input type="checkbox" class="prop-checkbox" data-prop="' + propKey + 
                    '" data-index="' + (props.length - 1) + '" title="Toggle property existence">' +
                    '</div>';
            }
            
            row.appendChild(cell);
        });
        
        tableBody.appendChild(row);
        
        // Initialize checkbox behavior for the new row
        initializeCheckboxBehaviorForRow(row);
        
        // Update the properties counter in the tab label
        updatePropertiesCounter();
        
        // Dispatch propertyAdded event to trigger model update and mark unsaved changes
        document.dispatchEvent(new CustomEvent('propertyAdded'));
    }
    
    // Function to update the properties counter in the tab label
    function updatePropertiesCounter() {
        const propsTab = document.querySelector('.tab[data-tab="props"]');
        if (propsTab) {
            propsTab.textContent = "Properties (" + props.length + ")";
        }
    }
    
    // Initialize checkbox behavior for a table row
    function initializeCheckboxBehaviorForRow(row) {
        row.querySelectorAll(".prop-checkbox").forEach(checkbox => {
            const tableCell = checkbox.closest("td");
            if (!tableCell) return;
            
            const inputElement = tableCell.querySelector("input[type='text'], select");
            if (!inputElement) return;
            
            if (inputElement.tagName === "INPUT") {
                inputElement.readOnly = !checkbox.checked;
            } else if (inputElement.tagName === "SELECT") {
                inputElement.disabled = !checkbox.checked;
            }
            
            updateInputStyle(inputElement, checkbox.checked);
            
            checkbox.addEventListener("change", function() {
                if (inputElement.tagName === "INPUT") {
                    inputElement.readOnly = !this.checked;
                } else if (inputElement.tagName === "SELECT") {
                    inputElement.disabled = !this.checked;
                }
                updateInputStyle(inputElement, this.checked);
            });
        });
    }
    
    // Initialize toggleEditable function for better checkbox behavior
    function initializeToggleEditableBehavior() {
        // Process each checkbox in the Settings tab to correctly toggle its corresponding control
        document.querySelectorAll(".setting-checkbox").forEach(checkbox => {
            const propName = checkbox.getAttribute("data-prop");
            const inputElement = document.getElementById(propName);
            
            if (inputElement) {
                // Initial state setup
                if (inputElement.tagName === "INPUT") {
                    inputElement.readOnly = !checkbox.checked;
                } else if (inputElement.tagName === "SELECT") {
                    inputElement.disabled = !checkbox.checked;
                }
                
                // Style based on checkbox state
                updateInputStyle(inputElement, checkbox.checked);
                
                // Add event listener for checkbox state changes
                checkbox.addEventListener("change", function() {
                    if (inputElement.tagName === "INPUT") {
                        inputElement.readOnly = !this.checked;
                    } else if (inputElement.tagName === "SELECT") {
                        inputElement.disabled = !this.checked;
                    }
                    updateInputStyle(inputElement, this.checked);
                    
                    // Disable the checkbox if it's checked to prevent unchecking
                    if (this.checked) {
                        this.disabled = true;
                        this.setAttribute("data-originally-checked", "true");
                        
                        // If the checkbox is checked, ensure we have a valid value
                        if (inputElement.tagName === 'SELECT' && (!inputElement.value || inputElement.value === "")) {
                            // For select elements with no value, select the first option
                            if (inputElement.options.length > 0) {
                                inputElement.value = inputElement.options[0].value;
                            }
                        }
                        
                        // Send update message to the extension
                        vscode.postMessage({
                            command: "updateSettings",
                            data: {
                                property: propName,
                                exists: true,
                                value: inputElement.value
                            }
                        });
                    }
                });
            }
        });
        
        // Process each checkbox in the Properties tab table view
        document.querySelectorAll(".prop-checkbox").forEach(checkbox => {
            // Find the closest table cell (td) containing this checkbox
            const tableCell = checkbox.closest("td");
            if (!tableCell) return;
            
            // Find the input or select element within this same table cell
            const inputElement = tableCell.querySelector("input[type='text'], select");
            if (!inputElement) return;
            
            // Initial state setup
            if (inputElement.tagName === "INPUT") {
                inputElement.readOnly = !checkbox.checked;
            } else if (inputElement.tagName === "SELECT") {
                inputElement.disabled = !checkbox.checked;
            }
            
            // Initial state for lookup button
            const lookupButton = tableCell.querySelector(".lookup-button");
            if (lookupButton) {
                lookupButton.disabled = !checkbox.checked;
            }
            
            // Style based on checkbox state
            updateInputStyle(inputElement, checkbox.checked);
            
            // Add event listener for checkbox state changes
            checkbox.addEventListener("change", function() {
                if (inputElement.tagName === "INPUT") {
                    inputElement.readOnly = !this.checked;
                } else if (inputElement.tagName === "SELECT") {
                    inputElement.disabled = !this.checked;
                }
                updateInputStyle(inputElement, this.checked);
                
                // Handle lookup button state for fKObjectName field
                const lookupButton = tableCell.querySelector(".lookup-button");
                if (lookupButton) {
                    lookupButton.disabled = !this.checked;
                }
                
                // Disable the checkbox if it's checked to prevent unchecking
                if (this.checked) {
                    this.disabled = true;
                    this.setAttribute("data-originally-checked", "true");
                    
                    // If the checkbox is checked, ensure we have a valid value
                    if (inputElement.tagName === 'SELECT' && (!inputElement.value || inputElement.value === "")) {
                        // For select elements with no value, select the first option
                        if (inputElement.options.length > 0) {
                            inputElement.value = inputElement.options[0].value;
                        }
                    }
                }
            });
        });
    }
    `;
}

module.exports = {
    getPropertyManagementFunctions
};
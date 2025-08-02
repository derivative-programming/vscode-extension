"use strict";

/**
 * Provides functions for managing properties in the details view
 * @returns {string} JavaScript code as a string for property management
 */
function getPropertyManagementFunctions() {
    return `
    // Function to add a new property
    function addNewProperty(propName, skipEventDispatch = false) {
        // Create new property object
        const newProp = { name: propName };
        
        // Add to properties array
        props.push(newProp);
        const newPropIndex = props.length - 1;
        
        // Add to properties list in list view
        const propsList = document.getElementById("propsList");
        const option = document.createElement("option");
        option.value = newPropIndex;
        option.textContent = propName;
        propsList.appendChild(option);
        
        // Add to table in table view
        const tableBody = document.querySelector("#propsTable tbody");
        const row = document.createElement("tr");
        row.setAttribute("data-index", newPropIndex);
        
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
                    
                    // Create options - sort alphabetically
                    const sortedOptions = propSchema.enum.slice().sort(); // Create a copy and sort alphabetically
                    sortedOptions.forEach((option, index) => {
                        let isSelected = false;
                        
                        if (propSchema.default !== undefined) {
                            // Use the schema's default value if available
                            isSelected = option === propSchema.default;
                        } else if (isBooleanEnum) {
                            // Default to 'false' for boolean enums if no default specified
                            isSelected = (option === false || option === "false");
                        } else if (sortedOptions.indexOf(option) === 0) {
                            // For non-boolean enums with no default, select the first option
                            isSelected = true;
                        }
                        
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
                    '" data-index="' + newPropIndex + '" title="Toggle property existence">' +
                    '</div>';
            }
            
            row.appendChild(cell);
        });
        
        tableBody.appendChild(row);
        
        // Initialize checkbox behavior for the new row
        initializeCheckboxBehaviorForRow(row);
        
        // Update the properties counter in the tab label
        updatePropertiesCounter();
        
        // Dispatch propertyAdded event to trigger model update and mark unsaved changes (unless skipped for bulk operations)
        if (!skipEventDispatch) {
            document.dispatchEvent(new CustomEvent('propertyAdded'));
        }
        
        // Reload the list view to ensure the new property appears there too
        if (typeof window.reloadPropertiesListView === 'function') {
            console.log('Calling reloadPropertiesListView from addNewProperty');
            setTimeout(() => {
                // Check if we're currently in list view mode
                const listIcon = document.querySelector('.icon[data-view="propsList"]');
                const isListViewActive = listIcon && listIcon.classList.contains('active');
                
                if (isListViewActive) {
                    // Reload the list view and auto-select the newly added property
                    console.log('Auto-selecting newly added property:', propName, 'at index:', newPropIndex);
                    window.reloadPropertiesListView(false, newPropIndex);
                } else {
                    // Just reload without selecting if not in list view
                    window.reloadPropertiesListView();
                }
            }, 10);
        }
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
                // Initial state setup - ensure parentObjectName and isLookup are always disabled
                if (propName === 'parentObjectName' || propName === 'isLookup') {
                    if (inputElement.tagName === "INPUT") {
                        inputElement.readOnly = true;
                    } else if (inputElement.tagName === "SELECT") {
                        inputElement.disabled = true;
                    }
                } else {
                    // Normal behavior for other fields
                    if (inputElement.tagName === "INPUT") {
                        inputElement.readOnly = !checkbox.checked;
                    } else if (inputElement.tagName === "SELECT") {
                        inputElement.disabled = !checkbox.checked;
                    }
                }
                  // Style based on checkbox state
                updateInputStyle(inputElement, checkbox.checked);
                
                // Add event listener for checkbox state changes
                checkbox.addEventListener("change", function() {
                    // Don't allow parentObjectName or isLookup to be editable even when checkbox is checked
                    if (propName !== 'parentObjectName' && propName !== 'isLookup') {
                        if (inputElement.tagName === "INPUT") {
                            inputElement.readOnly = !this.checked;
                        } else if (inputElement.tagName === "SELECT") {
                            inputElement.disabled = !this.checked;
                        }
                    }
                    updateInputStyle(inputElement, this.checked);
                    
                    // Disable the checkbox if it's checked to prevent unchecking
                    if (this.checked) {
                        this.disabled = true;
                        this.setAttribute("data-originally-checked", "true");
                              // If the checkbox is checked, ensure we have a valid value
                    if (inputElement.tagName === 'SELECT' && (!inputElement.value || inputElement.value === "")) {
                        const propKey = this.getAttribute("data-prop");
                        const propSchema = propItemsSchema[propKey] || {};
                        
                        // If schema has a default value, use it
                        if (propSchema && propSchema.default !== undefined) {
                            inputElement.value = propSchema.default;
                        } 
                        // Otherwise, select the first option
                        else if (inputElement.options.length > 0) {
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
                        const propName = checkbox.getAttribute("data-prop");
                        const propSchema = propItemsSchema[propName] || {};
                        
                        // If schema has a default value, use it
                        if (propSchema && propSchema.default !== undefined) {
                            inputElement.value = propSchema.default;
                        } 
                        // Otherwise, select the first option
                        else if (inputElement.options.length > 0) {
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
"use strict";

/**
 * Creates the JavaScript functionality for the Add Property modal
 * @returns {string} JavaScript code as a string for the modal functionality
 */
function getPropertyModalFunctionality() {
    return `
// Function to create and show the Add Property modal
function createPropertyModal() {
    // Create modal dialog for adding properties
    const modal = document.createElement("div");
    modal.className = "modal";
    
    // Import the modal HTML template
    const modalContent = getPropertyModalHtml();
    
    // Set the modal content
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Show the modal
    setTimeout(() => {
        modal.style.display = "flex";
        // Focus on the property name input for the initially active tab (single property)
        const propNameInput = modal.querySelector("#propName");
        if (propNameInput) {
            propNameInput.focus();
        }
    }, 10);
    
    // Tab switching in modal
    modal.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            // Update active tab
            modal.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            // Update visible tab content
            modal.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
            
            // Focus on the appropriate input based on the active tab
            setTimeout(() => {
                if (tabId === 'singleAdd') {
                    const propNameInput = modal.querySelector("#propName");
                    if (propNameInput) {
                        propNameInput.focus();
                    }
                } else if (tabId === 'bulkAdd') {
                    const bulkPropsInput = modal.querySelector("#bulkProps");
                    if (bulkPropsInput) {
                        bulkPropsInput.focus();
                    }
                } else if (tabId === 'lookupAdd') {
                    const lookupObjectsList = modal.querySelector("#lookupObjectsList");
                    if (lookupObjectsList) {
                        lookupObjectsList.focus();
                    }
                }
            }, 10);
        });
    });
    
    // Close modal when clicking the x button
    modal.querySelector(".close-button").addEventListener("click", function() {
        document.body.removeChild(modal);
    });
    
    // Close modal when clicking outside the modal content
    modal.addEventListener("click", function(event) {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Validate property name
    function validatePropertyName(name) {
        if (!name) {
            return "Property name cannot be empty";
        }
        if (name.length > 100) {
            return "Property name cannot exceed 100 characters";
        }
        if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
            return "Property name must start with a letter and contain only letters and numbers";
        }
        if (props.some(p => p.name === name)) {
            return "Property with this name already exists";
        }
        return null; // Valid
    }
    
    // Populate lookup objects list
    function populateLookupObjectsList() {
        const lookupObjectsList = modal.querySelector("#lookupObjectsList");
        if (!lookupObjectsList || typeof allObjects === 'undefined') {
            return;
        }
        
        // Clear existing options
        lookupObjectsList.innerHTML = "";
        
        // Filter objects where isLookup = "true"
        const lookupObjects = allObjects.filter(obj => obj.isLookup === "true");
        
        // Get existing property names to check for duplicates
        const existingPropNames = props.map(p => p.name);
        
        lookupObjects.forEach(obj => {
            const potentialPropName = obj.name + "ID";
            
            // Only add if the property doesn't already exist
            if (!existingPropNames.includes(potentialPropName)) {
                const option = document.createElement("option");
                option.value = obj.name;
                option.textContent = obj.name;
                lookupObjectsList.appendChild(option);
            }
        });
        
        // Enable/disable the add button based on available options
        const addButton = modal.querySelector("#addLookupProp");
        if (addButton) {
            addButton.disabled = lookupObjectsList.options.length === 0;
        }
    }
    
    // Function to add a new lookup property
    function addNewLookupProperty(lookupObjectName) {
        const propertyName = lookupObjectName + "ID";
        
        // Create new lookup property object
        const newProp = {
            "name": propertyName,
            "fKObjectName": lookupObjectName,
            "fKObjectPropertyName": lookupObjectName + "ID",
            "isFK": "true",
            "isFKLookup": "true",
            "sqlServerDBDataType": "int"
        };
        
        // Add to properties array
        props.push(newProp);
        
        // Add to properties list in list view
        const propsList = document.getElementById("propsList");
        const option = document.createElement("option");
        option.value = props.length - 1;
        option.textContent = propertyName;
        propsList.appendChild(option);
        
        // Add to table in table view
        const tableBody = document.querySelector("#propsTable tbody");
        const row = document.createElement("tr");
        row.setAttribute("data-index", props.length - 1);
        
        // Create cells for each property column
        propColumns.forEach(propKey => {
            const cell = document.createElement("td");
            
            if (propKey === "name") {
                cell.innerHTML = '<span class="prop-name">' + propertyName + '</span>' +
                    '<input type="hidden" name="name" value="' + propertyName + '">';
            } else {
                const propSchema = propItemsSchema[propKey] || {};
                const hasEnum = propSchema.enum && Array.isArray(propSchema.enum);
                const isBooleanEnum = hasEnum && propSchema.enum.length === 2 && 
                    propSchema.enum.every(val => val === true || val === false || val === "true" || val === "false");
                
                const tooltip = propSchema.description ? 'title="' + propSchema.description + '"' : "";
                
                let inputHTML = "";
                let defaultValue = "";
                let isChecked = false;
                
                // Set default values for lookup properties
                if (newProp[propKey] !== undefined) {
                    defaultValue = newProp[propKey];
                    isChecked = true;
                }
                
                if (hasEnum) {
                    inputHTML = '<select name="' + propKey + '" ' + tooltip + (isChecked ? '' : ' disabled') + '>';
                    
                    // Create options - sort alphabetically
                    const sortedOptions = propSchema.enum.slice().sort(); // Create a copy and sort alphabetically
                    sortedOptions.forEach((option, index) => {
                        let isSelected = false;
                        
                        if (defaultValue !== "") {
                            isSelected = option === defaultValue;
                        } else if (propSchema.default !== undefined) {
                            isSelected = option === propSchema.default;
                        } else if (isBooleanEnum) {
                            isSelected = (option === false || option === "false");
                        } else if (sortedOptions.indexOf(option) === 0) {
                            isSelected = true;
                        }
                        
                        inputHTML += '<option value="' + option + '" ' + 
                            (isSelected ? "selected" : "") + '>' + option + '</option>';
                    });
                    
                    inputHTML += '</select>';
                } else {
                    inputHTML = '<input type="text" name="' + propKey + '" value="' + defaultValue + '" ' + 
                        tooltip + (isChecked ? '' : ' readonly') + '>';
                }
                
                cell.innerHTML = '<div class="control-with-checkbox">' +
                    inputHTML +
                    '<input type="checkbox" class="prop-checkbox" data-prop="' + propKey + 
                    '" data-index="' + (props.length - 1) + '" title="Toggle property existence"' +
                    (isChecked ? ' checked disabled' : '') + '>' +
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
    
    // Validate lookup property selection
    function validateLookupSelection() {
        const lookupObjectsList = modal.querySelector("#lookupObjectsList");
        const errorElement = modal.querySelector("#lookupValidationError");
        const addButton = modal.querySelector("#addLookupProp");
        
        if (!lookupObjectsList.value) {
            errorElement.textContent = "Please select a lookup data object";
            addButton.disabled = true;
            return false;
        }
        
        errorElement.textContent = "";
        addButton.disabled = false;
        return true;
    }
    
    // Add single property
    document.getElementById("addSingleProp").addEventListener("click", function() {
        const propName = document.getElementById("propName").value.trim();
        const errorElement = document.getElementById("singleValidationError");
        
        const validationError = validatePropertyName(propName);
        if (validationError) {
            errorElement.textContent = validationError;
            return;
        }
        
        // Add the new property
        addNewProperty(propName);
        
        // Close the modal
        document.body.removeChild(modal);
    });
    
    // Add bulk properties
    document.getElementById("addBulkProps").addEventListener("click", function() {
        const bulkProps = document.getElementById("bulkProps").value;
        const propNames = bulkProps.split("\\n").map(name => name.trim()).filter(name => name);
        const errorElement = document.getElementById("bulkValidationError");
        
        // Validate all property names
        const errors = [];
        const validProps = [];
        
        propNames.forEach(name => {
            const validationError = validatePropertyName(name);
            if (validationError) {
                errors.push("\\"" + name + "\\": " + validationError);
            } else {
                validProps.push(name);
            }
        });
        
        if (errors.length > 0) {
            errorElement.innerHTML = errors.join("<br>");
            return;
        }
        
        // Add all valid properties (skip individual event dispatch)
        validProps.forEach(name => {
            addNewProperty(name, true);
        });
        
        // Dispatch a single propertyAdded event after all properties are added for bulk operations
        if (validProps.length > 0) {
            document.dispatchEvent(new CustomEvent('propertyAdded'));
        }
        
        // Close the modal
        document.body.removeChild(modal);
    });
    
    // Populate lookup objects list when modal is created
    populateLookupObjectsList();
    
    // Handle lookup object selection change
    const lookupObjectsList = modal.querySelector("#lookupObjectsList");
    if (lookupObjectsList) {
        lookupObjectsList.addEventListener("change", function() {
            validateLookupSelection();
        });
        
        lookupObjectsList.addEventListener("dblclick", function() {
            if (this.value && !modal.querySelector("#addLookupProp").disabled) {
                modal.querySelector("#addLookupProp").click();
            }
        });
    }
    
    // Add lookup property
    const addLookupPropButton = modal.querySelector("#addLookupProp");
    if (addLookupPropButton) {
        addLookupPropButton.addEventListener("click", function() {
            const lookupObjectsList = modal.querySelector("#lookupObjectsList");
            const errorElement = modal.querySelector("#lookupValidationError");
            
            if (!validateLookupSelection()) {
                return;
            }
            
            const selectedObject = lookupObjectsList.value;
            
            // Add the new lookup property
            addNewLookupProperty(selectedObject);
            
            // Close the modal
            document.body.removeChild(modal);
        });
    }
    
    // Add Enter key handler for single property input
    const propNameInput = modal.querySelector("#propName");
    if (propNameInput) {
        propNameInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault(); // Prevent default Enter behavior
                const addButton = modal.querySelector("#addSingleProp");
                if (addButton && !addButton.disabled) {
                    addButton.click(); // Trigger add property button click
                }
            }
        });
    }
    
    // Add Enter key handler for bulk properties textarea - allow normal Enter behavior for new lines
    // Users must click the button to submit the form
    const bulkPropsInput = modal.querySelector("#bulkProps");
    if (bulkPropsInput) {
        // No special Enter key handling - allows normal textarea behavior where Enter creates new lines
        // This prevents accidental form submission when user just wants to add a new line
    }
    
    // Add Enter key handler for lookup objects list
    const lookupObjectsListForEnter = modal.querySelector("#lookupObjectsList");
    if (lookupObjectsListForEnter) {
        lookupObjectsListForEnter.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault(); // Prevent default Enter behavior
                const addButton = modal.querySelector("#addLookupProp");
                if (addButton && !addButton.disabled) {
                    addButton.click(); // Trigger add lookup property button click
                }
            }
        });
    }
}`;
}

module.exports = {
    getPropertyModalFunctionality
};
"use strict";

/**
 * File: modalFunctionality.js
 * Purpose: Provides modal template functions for the report details view
 * Created: 2025-07-06
 */

/**
 * Provides modal template functions for add column, parameter, and button modals
 * @returns {string} JavaScript code as a string for modal functionality
 */
function getModalFunctionality() {
    return `
    // Add Column Modal Template Function
    function getAddColumnModalHtml() {
        return "" +
    "<div class='modal-content'>" +
        "<span class='close-button'>&times;</span>" +
        "<h2>Add Column</h2>" +
        "<div class='tabs'>" +
            "<div class='tab active' data-tab='singleAdd'>Single Column</div>" +
            "<div class='tab' data-tab='bulkAdd'>Bulk Add</div>" +
        "</div>" +
        "<div id='singleAdd' class='tab-content active'>" +
            "<div class='form-row'>" +
                "<label for='columnName'>Column Name:</label>" +
                "<input type='text' id='columnName'>" +
                "<div class='field-note'>Use Pascal case (Example: FirstName). No spaces are allowed in names. Alpha characters only. Maximum 100 characters.</div>" +
            "</div>" +
            "<div id='singleValidationError' class='validation-error'></div>" +
            "<button id='addSingleColumn'>Add Column</button>" +
        "</div>" +
        "<div id='bulkAdd' class='tab-content'>" +
            "<div class='form-row'>" +
                "<label for='bulkColumns'>Column Names (one per line):</label>" +
                "<textarea id='bulkColumns' rows='5'></textarea>" +
                "<div class='field-note'>Use Pascal case (Example: FirstName). No spaces are allowed in names. Alpha characters only. Header text will be auto-generated from the column name. Maximum 100 characters.</div>" +
            "</div>" +
            "<div id='bulkValidationError' class='validation-error'></div>" +
            "<button id='addBulkColumns'>Add Columns</button>" +
        "</div>" +
    "</div>";
    }

    // Add Parameter Modal Template Function
    function getAddParamModalHtml() {
        return "" +
    "<div class='modal-content'>" +
        "<span class='close-button'>&times;</span>" +
        "<h2>Add Filter</h2>" +
        "<div class='tabs'>" +
            "<div class='tab active' data-tab='singleAdd'>Single Filter</div>" +
            "<div class='tab' data-tab='bulkAdd'>Bulk Add</div>" +
        "</div>" +
        "<div id='singleAdd' class='tab-content active'>" +
            "<div class='form-row'>" +
                "<label for='paramName'>Filter Name:</label>" +
                "<input type='text' id='paramName'>" +
                "<div class='field-note'>Use Pascal case (Example: FirstName). No spaces are allowed in names. Alpha characters only. Maximum 100 characters.</div>" +
            "</div>" +
            "<div id='singleValidationError' class='validation-error'></div>" +
            "<button id='addSingleParam'>Add Filter</button>" +
        "</div>" +
        "<div id='bulkAdd' class='tab-content'>" +
            "<div class='form-row'>" +
                "<label for='bulkParams'>Filter Names (one per line):</label>" +
                "<textarea id='bulkParams' rows='5'></textarea>" +
                "<div class='field-note'>Use Pascal case (Example: FirstName). No spaces are allowed in names. Alpha characters only. Maximum 100 characters.</div>" +
            "</div>" +
            "<div id='bulkValidationError' class='validation-error'></div>" +
            "<button id='addBulkParams'>Add Filters</button>" +
        "</div>" +
    "</div>";
    }

    // Add Button Modal Template Function
    function getAddButtonModalHtml() {
        return "" +
    "<div class='modal-content'>" +
        "<span class='close-button'>&times;</span>" +
        "<h2>Add Button</h2>" +
        "<div class='tabs'>" +
            "<div class='tab active' data-tab='singleAdd'>Single Button</div>" +
            "<div class='tab' data-tab='bulkAdd'>Bulk Add</div>" +
        "</div>" +
        "<div id='singleAdd' class='tab-content active'>" +
            "<div class='form-row'>" +
                "<label for='buttonName'>Button Name:</label>" +
                "<input type='text' id='buttonName'>" +
                "<div class='field-note'>Use Pascal case (Example: AddUser). No spaces are allowed in names. Alpha characters only. Maximum 100 characters.</div>" +
            "</div>" +
            "<div id='singleValidationError' class='validation-error'></div>" +
            "<button id='addSingleButton'>Add Button</button>" +
        "</div>" +
        "<div id='bulkAdd' class='tab-content'>" +
            "<div class='form-row'>" +
                "<label for='bulkButtons'>Button Names (one per line):</label>" +
                "<textarea id='bulkButtons' rows='5'></textarea>" +
                "<div class='field-note'>Use Pascal case (Example: AddUser). No spaces are allowed in names. Alpha characters only. Button text will be auto-generated from the button name. Maximum 100 characters.</div>" +
            "</div>" +
            "<div id='bulkValidationError' class='validation-error'></div>" +
            "<button id='addBulkButtons'>Add Buttons</button>" +
        "</div>" +
    "</div>";
    }

    // Function to create and show the Add Button modal
    function createAddButtonModal() {
        // Create modal dialog for adding buttons
        const modal = document.createElement("div");
        modal.className = "modal";
        
        // Import the modal HTML template
        const modalContent = getAddButtonModalHtml();
        
        // Set the modal content
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);
        
        // Wait for DOM to be ready before attaching event listeners
        setTimeout(() => {
            // Show the modal
            modal.style.display = "flex";
            
            // Attach event listeners after modal is in DOM and visible
            attachButtonModalEventListeners(modal);
            
            // Focus on the button name input when modal opens (single button tab is active by default)
            const buttonNameInput = modal.querySelector("#buttonName");
            if (buttonNameInput) {
                buttonNameInput.focus();
            }
        }, 10);
    }

    // Function to create and show the Add Column modal
    function createAddColumnModal() {
        // Create modal dialog for adding columns
        const modal = document.createElement("div");
        modal.className = "modal";
        
        // Import the modal HTML template
        const modalContent = getAddColumnModalHtml();
        
        // Set the modal content
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);
        
        // Wait for DOM to be ready before attaching event listeners
        setTimeout(() => {
            // Show the modal
            modal.style.display = "flex";
            
            // Attach event listeners after modal is in DOM and visible
            attachColumnModalEventListeners(modal);
            
            // Focus on the column name input when modal opens (single column tab is active by default)
            const columnNameInput = modal.querySelector("#columnName");
            if (columnNameInput) {
                columnNameInput.focus();
            }
        }, 10);
    }

    // Function to create and show the Add Parameter modal
    function createAddParamModal() {
        // Create modal dialog for adding parameters
        const modal = document.createElement("div");
        modal.className = "modal";
        
        // Import the modal HTML template
        const modalContent = getAddParamModalHtml();
        
        // Set the modal content
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);
        
        // Wait for DOM to be ready before attaching event listeners
        setTimeout(() => {
            // Show the modal
            modal.style.display = "flex";
            
            // Attach event listeners after modal is in DOM and visible
            attachParamModalEventListeners(modal);
            
            // Focus on the param name input when modal opens (single param tab is active by default)
            const paramNameInput = modal.querySelector("#paramName");
            if (paramNameInput) {
                paramNameInput.focus();
            }
        }, 10);
    }

    // Global helper functions for validation and text generation
    
    // Helper function to generate button text from button name
    function generateButtonText(buttonName) {
        // Convert PascalCase to space-separated words
        // Handle cases like "FirstName" -> "First Name", "AppDNA" -> "App DNA"
        return buttonName.replace(/([a-z])([A-Z])/g, '$1 $2')
                        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
    }

    // Function to attach event listeners to the button modal
    function attachButtonModalEventListeners(modal) {
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
                
                // Set focus based on which tab is now active
                setTimeout(() => {
                    if (tabId === 'singleAdd') {
                        const buttonNameInput = modal.querySelector("#buttonName");
                        if (buttonNameInput) {
                            buttonNameInput.focus();
                        }
                    } else if (tabId === 'bulkAdd') {
                        const bulkButtonsTextarea = modal.querySelector("#bulkButtons");
                        if (bulkButtonsTextarea) {
                            bulkButtonsTextarea.focus();
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
        
        // Add Enter key handling for single button input
        const buttonNameInput = modal.querySelector("#buttonName");
        if (buttonNameInput) {
            buttonNameInput.addEventListener("keypress", function(event) {
                if (event.key === "Enter") {
                    event.preventDefault(); // Prevent default Enter behavior
                    const addButton = modal.querySelector("#addSingleButton");
                    if (addButton && !addButton.disabled) {
                        addButton.click();
                    }
                }
            });
        }
        
        // Note: No Enter key handling for bulk buttons textarea - users can press Enter to create new lines
        // Users must click the "Add Buttons" button to submit

        // Validate button name function
        function validateButtonName(name) {
            if (!name) {
                return "Button name cannot be empty";
            }
            if (name.length > 100) {
                return "Button name cannot exceed 100 characters";
            }
            if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
                return "Button name must start with a letter and contain only letters and numbers";
            }
            if (currentButtons.some(button => button.buttonName === name)) {
                return "Button with this name already exists";
            }
            return null; // Valid
        }
        
        // Add single button button event listener
        modal.querySelector("#addSingleButton").addEventListener("click", function() {
            const buttonName = modal.querySelector("#buttonName").value.trim();
            const errorElement = modal.querySelector("#singleValidationError");
            
            const validationError = validateButtonName(buttonName);
            if (validationError) {
                errorElement.textContent = validationError;
                return;
            }
            
            // Generate button text from button name
            const buttonText = generateButtonText(buttonName);
            
            // Add the new button - backend will reload view
            addNewButton(buttonName);
            
            // Close the modal
            document.body.removeChild(modal);
        });
        
        // Add bulk buttons button event listener
        modal.querySelector("#addBulkButtons").addEventListener("click", function() {
            const bulkButtons = modal.querySelector("#bulkButtons").value;
            const buttonNames = bulkButtons.split("\\n").map(name => name.trim()).filter(name => name);
            const errorElement = modal.querySelector("#bulkValidationError");
            
            // Validate all button names
            const errors = [];
            const validButtons = [];
            
            buttonNames.forEach(name => {
                const validationError = validateButtonName(name);
                if (validationError) {
                    errors.push("\\"" + name + "\\": " + validationError);
                } else {
                    validButtons.push(name);
                }
            });
            
            if (errors.length > 0) {
                errorElement.innerHTML = errors.join("<br>");
                return;
            }
            
            // Add all valid buttons at once
            const newButtons = validButtons.map(name => ({
                buttonName: name,
                buttonType: "other",
                buttonText: generateButtonText(name)
            }));

            // Add all buttons in one operation
            const updatedButtons = [...currentButtons, ...newButtons];
            
            // Get the currently active tab to preserve it after reload
            const activeTab = document.querySelector('.tab.active');
            const currentTabId = activeTab ? activeTab.getAttribute('data-tab') : 'buttons';
            
            // Send message to update the model - backend will reload the view
            vscode.postMessage({
                command: 'updateModel',
                data: {
                    buttons: updatedButtons,
                    preserveTab: currentTabId
                }
            });
            
            // Close the modal
            document.body.removeChild(modal);
        });
    }

    // Function to attach event listeners to the column modal
    function attachColumnModalEventListeners(modal) {
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
                
                // Set focus based on which tab is now active
                setTimeout(() => {
                    if (tabId === 'singleAdd') {
                        const columnNameInput = modal.querySelector("#columnName");
                        if (columnNameInput) {
                            columnNameInput.focus();
                        }
                    } else if (tabId === 'bulkAdd') {
                        const bulkColumnsTextarea = modal.querySelector("#bulkColumns");
                        if (bulkColumnsTextarea) {
                            bulkColumnsTextarea.focus();
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
        
        // Add Enter key handling for single column input
        const columnNameInput = modal.querySelector("#columnName");
        if (columnNameInput) {
            columnNameInput.addEventListener("keypress", function(event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    const addButton = modal.querySelector("#addSingleColumn");
                    if (addButton && !addButton.disabled) {
                        addButton.click();
                    }
                }
            });
        }
        
        // Note: No Enter key handling for bulk columns textarea - users can press Enter to create new lines
        // Users must click the "Add Columns" button to submit

        // Add single column button event listener
        modal.querySelector("#addSingleColumn").addEventListener("click", function() {
            const columnName = modal.querySelector("#columnName").value.trim();
            const errorElement = modal.querySelector("#singleValidationError");
            
            // Validate column name
            const validationError = validateColumnName(columnName);
            if (validationError) {
                errorElement.textContent = validationError;
                return;
            }
            
            // Clear any validation errors
            errorElement.textContent = "";
            
            // Add the new column
            addNewColumn(columnName);
            
            // Close the modal
            document.body.removeChild(modal);
        });
        
        // Add bulk columns button event listener
        modal.querySelector("#addBulkColumns").addEventListener("click", function() {
            const bulkColumns = modal.querySelector("#bulkColumns").value;
            const columnNames = bulkColumns.split("\\n").map(name => name.trim()).filter(name => name);
            const errorElement = modal.querySelector("#bulkValidationError");
            
            // Validate all column names
            const errors = [];
            const validColumns = [];
            
            columnNames.forEach(name => {
                const validationError = validateColumnName(name);
                if (validationError) {
                    errors.push("\\"" + name + "\\": " + validationError);
                } else {
                    validColumns.push(name);
                }
            });
            
            if (errors.length > 0) {
                errorElement.innerHTML = errors.join("<br>");
                return;
            }
            
            // Add all valid columns at once
            const newColumns = validColumns.map(name => ({
                name: name,
                headerText: generateHeaderText(name)
            }));

            // Add all columns in one operation
            const updatedColumns = [...currentColumns, ...newColumns];
            
            // Get the currently active tab to preserve it after reload
            const activeTab = document.querySelector('.tab.active');
            const currentTabId = activeTab ? activeTab.getAttribute('data-tab') : 'columns';
            
            // Send message to update the model
            vscode.postMessage({
                command: 'updateModel',
                data: {
                    columns: updatedColumns,
                    preserveTab: currentTabId
                }
            });
            
            // Close the modal
            document.body.removeChild(modal);
        });
    }

    // Function to attach event listeners to the parameter modal
    function attachParamModalEventListeners(modal) {
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
                
                // Set focus based on which tab is now active
                setTimeout(() => {
                    if (tabId === 'singleAdd') {
                        const paramNameInput = modal.querySelector("#paramName");
                        if (paramNameInput) {
                            paramNameInput.focus();
                        }
                    } else if (tabId === 'bulkAdd') {
                        const bulkParamsTextarea = modal.querySelector("#bulkParams");
                        if (bulkParamsTextarea) {
                            bulkParamsTextarea.focus();
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
        
        // Add Enter key handling for single param input
        const paramNameInput = modal.querySelector("#paramName");
        if (paramNameInput) {
            paramNameInput.addEventListener("keypress", function(event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    const addButton = modal.querySelector("#addSingleParam");
                    if (addButton && !addButton.disabled) {
                        addButton.click();
                    }
                }
            });
        }
        
        // Note: No Enter key handling for bulk params textarea - users can press Enter to create new lines
        // Users must click the "Add Filters" button to submit

        // Add single param button event listener
        modal.querySelector("#addSingleParam").addEventListener("click", function() {
            const paramName = modal.querySelector("#paramName").value.trim();
            const errorElement = modal.querySelector("#singleValidationError");
            
            // Validate param name
            const validationError = validateParamName(paramName);
            if (validationError) {
                errorElement.textContent = validationError;
                return;
            }
            
            // Clear any validation errors
            errorElement.textContent = "";
            
            // Add the new param
            addNewParam(paramName);
            
            // Close the modal
            document.body.removeChild(modal);
        });
        
        // Add bulk params button event listener
        modal.querySelector("#addBulkParams").addEventListener("click", function() {
            const bulkParams = modal.querySelector("#bulkParams").value;
            const paramNames = bulkParams.split("\\n").map(name => name.trim()).filter(name => name);
            const errorElement = modal.querySelector("#bulkValidationError");
            
            // Validate all param names
            const errors = [];
            const validParams = [];
            
            paramNames.forEach(name => {
                const validationError = validateParamName(name);
                if (validationError) {
                    errors.push("\\"" + name + "\\": " + validationError);
                } else {
                    validParams.push(name);
                }
            });
            
            if (errors.length > 0) {
                errorElement.innerHTML = errors.join("<br>");
                return;
            }
            
            // Add all valid params at once
            const newParams = validParams.map(name => ({
                name: name
            }));

            // Add all params in one operation
            const updatedParams = [...currentParams, ...newParams];
            
            // Get the currently active tab to preserve it after reload
            const activeTab = document.querySelector('.tab.active');
            const currentTabId = activeTab ? activeTab.getAttribute('data-tab') : 'params';
            
            // Send message to update the model
            vscode.postMessage({
                command: 'updateModel',
                data: {
                    params: updatedParams,
                    preserveTab: currentTabId
                }
            });
            
            // Close the modal
            document.body.removeChild(modal);
        });
    }
    `;
}

module.exports = {
    getModalFunctionality
};

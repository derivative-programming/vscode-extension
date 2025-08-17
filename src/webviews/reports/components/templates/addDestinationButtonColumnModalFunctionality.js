"use strict";

/**
 * addDestinationButtonColumnModalFunctionality.js
 * Provides JavaScript functionality for the Add Destination Button Column modal
 * Created: 2025-08-17
 * Purpose: Handles modal interactions for creating destination button columns
 */

/**
 * Creates the JavaScript functionality for the Add Destination Button Column modal
 * @returns {string} JavaScript code as a string for the modal functionality
 */
function getAddDestinationButtonColumnModalFunctionality() {
    return `
// Function to create and show the Add Destination Button Column modal
function createAddDestinationButtonColumnModal() {
    // Create modal dialog for adding destination button columns
    const modal = document.createElement("div");
    modal.className = "modal";
    
    // Import the modal HTML template
    const modalContent = getAddDestinationButtonColumnModalHtml();
    
    // Set the modal content
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Show the modal
    setTimeout(() => {
        modal.style.display = "flex";
        // Focus on the destination page input when modal opens
        const destinationPageInput = modal.querySelector("#destinationPageName");
        if (destinationPageInput) {
            destinationPageInput.focus();
        }
    }, 10);
    
    // Close modal functionality
    const closeButton = modal.querySelector('.close-button');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Browse destination page button functionality
    const browseButton = modal.querySelector("#browseDestinationPage");
    if (browseButton) {
        browseButton.addEventListener("click", function() {
            const destinationPageInput = modal.querySelector("#destinationPageName");
            createPageSearchModal(destinationPageInput.value, destinationPageInput);
        });
    }
    
    // Auto-generate column name when destination page or button text changes
    function updateColumnName() {
        const destinationPageInput = modal.querySelector("#destinationPageName");
        const buttonTextInput = modal.querySelector("#buttonText");
        const columnNameInput = modal.querySelector("#columnName");
        
        const destinationPage = destinationPageInput.value.trim();
        const buttonText = buttonTextInput.value.trim();
        
        if (destinationPage && buttonText) {
            // Convert button text to PascalCase (remove spaces and capitalize words)
            const buttonTextPascal = buttonText.replace(/\\s+/g, '')
                .replace(/\\b\\w/g, l => l.toUpperCase());
            
            // Get the owner data object name of the destination page
            const ownerObjectName = getPageOwnerObjectName(destinationPage);
            
            if (ownerObjectName) {
                const columnName = buttonTextPascal + "Link" + ownerObjectName + "Code";
                columnNameInput.value = columnName;
            } else {
                // Fallback if owner object not found
                const columnName = buttonTextPascal + "Link" + destinationPage + "Code";
                columnNameInput.value = columnName;
            }
        } else {
            columnNameInput.value = "";
        }
    }
    
    // Helper function to get page owner object name
    function getPageOwnerObjectName(pageName) {
        console.log("getPageOwnerObjectName called with:", pageName);
        
        // Search through all data objects to find which one owns this page
        if (window.allDataObjects && Array.isArray(window.allDataObjects)) {
            console.log("Searching through", window.allDataObjects.length, "data objects for page:", pageName);
            
            // Search through all objects for forms (objectWorkflow)
            for (const object of window.allDataObjects) {
                if (object.objectWorkflow && Array.isArray(object.objectWorkflow)) {
                    const form = object.objectWorkflow.find(workflow => 
                        workflow.name === pageName && workflow.isPage === "true"
                    );
                    if (form) {
                        console.log("Found form", pageName, "in object", object.name);
                        return object.name; // Return the parent object name
                    }
                }
                
                // Search through reports
                if (object.report && Array.isArray(object.report)) {
                    const report = object.report.find(rep => 
                        rep.name === pageName && (rep.isPage === "true" || rep.isPage === undefined)
                    );
                    if (report) {
                        console.log("Found report", pageName, "in object", object.name);
                        return object.name; // Return the parent object name
                    }
                }
            }
            
            console.log("Page", pageName, "not found in any data object");
        } else {
            console.log("window.allDataObjects not available");
        }
        
        // If we can't find the owner, return the page name itself as fallback
        // The backend will handle the correct lookup when the column is actually created
        console.log("Returning page name as fallback:", pageName);
        return pageName;
    }
    
    // Add event listeners for auto-generation
    const destinationPageInput = modal.querySelector("#destinationPageName");
    const buttonTextInput = modal.querySelector("#buttonText");
    
    if (destinationPageInput) {
        destinationPageInput.addEventListener("input", updateColumnName);
        destinationPageInput.addEventListener("change", updateColumnName);
    }
    
    if (buttonTextInput) {
        buttonTextInput.addEventListener("input", updateColumnName);
        buttonTextInput.addEventListener("change", updateColumnName);
    }
    
    // Add button functionality
    const addButton = modal.querySelector("#addDestinationButtonColumn");
    if (addButton) {
        addButton.addEventListener("click", function() {
            const destinationPageInput = modal.querySelector("#destinationPageName");
            const buttonTextInput = modal.querySelector("#buttonText");
            const columnNameInput = modal.querySelector("#columnName");
            const errorElement = modal.querySelector("#validationError");
            
            const destinationPage = destinationPageInput.value.trim();
            const buttonText = buttonTextInput.value.trim();
            const columnName = columnNameInput.value.trim();
            
            // Clear previous errors
            errorElement.textContent = "";
            
            // Validation
            if (!destinationPage) {
                errorElement.textContent = "Destination page is required.";
                destinationPageInput.focus();
                return;
            }
            
            if (!buttonText) {
                errorElement.textContent = "Button text is required.";
                buttonTextInput.focus();
                return;
            }
            
            if (!columnName) {
                errorElement.textContent = "Column name could not be generated.";
                return;
            }
            
            // Get the owner object name for destinationContextObjectName
            const ownerObjectName = getPageOwnerObjectName(destinationPage);
            
            // Create the destination button column data
            const columnData = {
                name: columnName,
                buttonText: buttonText,
                destinationPageName: destinationPage,
                destinationContextObjectName: ownerObjectName || "",
                destinationTargetName: destinationPage,
                isButton: "true",
                isVisible: "true",
                sourcePropertyName: "Code",
                sqlServerDBDataType: "uniqueidentifier"
            };
            
            // Send message to add the destination button column
            vscode.postMessage({
                command: 'addDestinationButtonColumn',
                data: columnData
            });
            
            // Close the modal
            document.body.removeChild(modal);
        });
    }
    
    // Cancel button functionality
    const cancelButton = modal.querySelector("#cancelDestinationButtonColumn");
    if (cancelButton) {
        cancelButton.addEventListener("click", function() {
            document.body.removeChild(modal);
        });
    }
    
    // Add Enter key handling for destination page input
    if (destinationPageInput) {
        destinationPageInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                const buttonTextInput = modal.querySelector("#buttonText");
                if (buttonTextInput) {
                    buttonTextInput.focus();
                }
            }
        });
    }
    
    // Add Enter key handling for button text input
    if (buttonTextInput) {
        buttonTextInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                const addButton = modal.querySelector("#addDestinationButtonColumn");
                if (addButton && !addButton.disabled) {
                    addButton.click();
                }
            }
        });
    }
}
`;
}

module.exports = {
    getAddDestinationButtonColumnModalFunctionality
};

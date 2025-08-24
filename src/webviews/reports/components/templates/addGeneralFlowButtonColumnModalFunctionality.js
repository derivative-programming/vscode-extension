"use strict";

/**
 * addGeneralFlowButtonColumnModalFunctionality.js
 * Provides functionality for the Add General Flow Button Column modal
 * Created: 2025-01-27
 * Purpose: Handles modal interactions for creating general flow button columns
 */

/**
 * Creates the JavaScript functionality for the Add General Flow Button Column modal
 * @returns {string} JavaScript code as a string for the modal functionality
 */
function getAddGeneralFlowButtonColumnModalFunctionality() {
    return `
// Function to create and show the Add General Flow Button Column modal
function createAddGeneralFlowButtonColumnModal() {
    // Create modal dialog for adding general flow button columns
    const modal = document.createElement("div");
    modal.className = "modal";
    
    // Import the modal HTML template
    const modalContent = getAddGeneralFlowButtonColumnModalHtml();
    
    // Set the modal content
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Show the modal
    setTimeout(() => {
        modal.style.display = "flex";
        
        // Load general flows and populate the select list
        loadGeneralFlowsForModal(modal);
        
        // Focus on the general flow select when modal opens
        const generalFlowSelect = modal.querySelector("#generalFlowName");
        if (generalFlowSelect) {
            generalFlowSelect.focus();
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
    
    // Auto-generate column name when general flow or button text changes
    function updateColumnName() {
        const generalFlowSelect = modal.querySelector("#generalFlowName");
        const buttonTextInput = modal.querySelector("#buttonText");
        const columnNameInput = modal.querySelector("#columnName");
        
        if (generalFlowSelect && buttonTextInput && columnNameInput) {
            const selectedOption = generalFlowSelect.options[generalFlowSelect.selectedIndex];
            const generalFlowName = selectedOption ? selectedOption.getAttribute('data-flow-name') || selectedOption.value : '';
            const generalFlowObjectName = selectedOption ? selectedOption.getAttribute('data-object-name') || '' : '';
            const buttonText = buttonTextInput.value.trim();
            
            if (generalFlowName && buttonText && generalFlowObjectName) {
                // Generate column name in format: [button text]Link[general flow owner object name]Code
                // Convert to PascalCase and remove spaces/special characters
                const cleanButtonText = buttonText.replace(/[^a-zA-Z0-9]/g, '');
                const cleanObjectName = generalFlowObjectName.replace(/[^a-zA-Z0-9]/g, '');
                const columnName = cleanButtonText + "Link" + cleanObjectName + "Code";
                columnNameInput.value = columnName;
            } else {
                columnNameInput.value = '';
            }
        }
    }
    
    // Add event listeners for auto-generation
    const generalFlowSelect = modal.querySelector("#generalFlowName");
    const buttonTextInput = modal.querySelector("#buttonText");
    
    if (generalFlowSelect) {
        generalFlowSelect.addEventListener("change", updateColumnName);
    }
    
    if (buttonTextInput) {
        buttonTextInput.addEventListener("input", updateColumnName);
        buttonTextInput.addEventListener("change", updateColumnName);
    }
    
    // Add button functionality
    const addButton = modal.querySelector("#addGeneralFlowButtonColumn");
    if (addButton) {
        addButton.addEventListener("click", function() {
            const generalFlowSelect = modal.querySelector("#generalFlowName");
            const buttonTextInput = modal.querySelector("#buttonText");
            const columnNameInput = modal.querySelector("#columnName");
            const errorElement = modal.querySelector("#validationError");
            
            const selectedOption = generalFlowSelect.options[generalFlowSelect.selectedIndex];
            const generalFlowName = selectedOption ? selectedOption.getAttribute('data-flow-name') || selectedOption.value : '';
            const generalFlowDisplayName = selectedOption ? selectedOption.text : '';
            const objectName = selectedOption ? selectedOption.getAttribute('data-object-name') || '' : '';
            const buttonText = buttonTextInput.value.trim();
            const columnName = columnNameInput.value.trim();
            
            // Clear previous errors
            errorElement.textContent = "";
            
            // Validation
            if (!generalFlowName) {
                errorElement.textContent = "General flow is required.";
                generalFlowSelect.focus();
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
            
            // Create the general flow button column data
            const columnData = {
                name: columnName,
                buttonText: buttonText,
                generalFlowName: generalFlowName,
                generalFlowDisplayName: generalFlowDisplayName,
                generalFlowObjectName: objectName,
                isButton: "true",
                isVisible: "true",
                sourcePropertyName: "Code",
                sqlServerDBDataType: "uniqueidentifier"
            };
            
            // Send message to add the general flow button column
            vscode.postMessage({
                command: 'addGeneralFlowButtonColumn',
                data: columnData
            });
            
            // Close the modal
            document.body.removeChild(modal);
        });
    }
    
    // Cancel button functionality
    const cancelButton = modal.querySelector("#cancelGeneralFlowButtonColumn");
    if (cancelButton) {
        cancelButton.addEventListener("click", function() {
            document.body.removeChild(modal);
        });
    }
    
    // Add Enter key handling for general flow select
    if (generalFlowSelect) {
        generalFlowSelect.addEventListener("keypress", function(event) {
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
                const addButton = modal.querySelector("#addGeneralFlowButtonColumn");
                if (addButton && !addButton.disabled) {
                    addButton.click();
                }
            }
        });
    }
}

// Function to load general flows and populate the modal select list
function loadGeneralFlowsForModal(modal) {
    // Request general flows data from the extension
    vscode.postMessage({
        command: 'getGeneralFlowsForModal'
    });
    
    // Listen for the response (this will be handled by the main message listener)
    // The response will call populateGeneralFlowsModal function
}

// Function to populate the general flows select list
function populateGeneralFlowsModal(generalFlows, modal) {
    if (!modal) {
        // Find the modal by looking for the general flow select element
        modal = document.querySelector('#generalFlowName')?.closest('.modal');
    }
    
    if (!modal) {
        console.warn('Could not find general flow modal to populate');
        return;
    }
    
    const selectElement = modal.querySelector('#generalFlowName');
    if (!selectElement) {
        console.warn('Could not find general flow select element');
        return;
    }
    
    // Clear existing options
    selectElement.innerHTML = '';
    
    if (!generalFlows || generalFlows.length === 0) {
        selectElement.innerHTML = '<option value="" disabled selected>No general flows available</option>';
        return;
    }
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    defaultOption.textContent = 'Select a general flow...';
    selectElement.appendChild(defaultOption);
    
    // Add options for each general flow
    generalFlows.forEach(flow => {
        const option = document.createElement('option');
        option.value = flow.name;
        option.setAttribute('data-flow-name', flow.name);
        option.setAttribute('data-object-name', flow.objectName || '');
        option.textContent = flow.displayName || flow.name;
        if (flow.description) {
            option.title = flow.description;
        }
        selectElement.appendChild(option);
    });
    
    console.log(\`Populated general flows modal with \${generalFlows.length} flows\`);
}
`;
}

module.exports = {
    getAddGeneralFlowButtonColumnModalFunctionality
};
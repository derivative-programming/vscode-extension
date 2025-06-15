"use strict";

/**
 * objectSearchModalFunctionality.js
 * Provides JavaScript functionality for the Object Search modal
 * Created: 2024-12-27
 * Purpose: Handles modal interactions for selecting FK object names
 */

/**
 * Creates the JavaScript functionality for the Object Search modal
 * @returns {string} JavaScript code as a string for the modal functionality
 */
function getObjectSearchModalFunctionality() {
    return `
// Function to create and show the Object Search modal
function createObjectSearchModal(currentValue, targetInputElement) {
    // Create modal dialog for selecting object
    const modal = document.createElement("div");
    modal.className = "modal";
    
    // Import the modal HTML template
    const modalContent = getObjectSearchModalHtml();

    // Set the modal content
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Populate the object list
    const objectList = modal.querySelector("#objectList");
    const acceptButton = modal.querySelector("#acceptObjectSelection");
    
    // Initially disable the accept button
    acceptButton.disabled = true;
    
    // Get all available objects (this should be available from the main scope)
    let hasPreselectedOption = false;
    if (typeof allObjects !== 'undefined' && Array.isArray(allObjects)) {
        allObjects.forEach(obj => {
            if (obj.name) {
                const option = document.createElement("option");
                option.value = obj.name;
                option.textContent = obj.name;
                
                // Pre-select if it matches current value
                if (currentValue && obj.name === currentValue) {
                    option.selected = true;
                    hasPreselectedOption = true;
                }
                
                objectList.appendChild(option);
            }
        });
    }
    
    // Enable accept button if there's a pre-selected option
    if (hasPreselectedOption) {
        acceptButton.disabled = false;
    }
    
    // Add event listener to enable/disable accept button based on selection
    objectList.addEventListener("change", function() {
        const selectedOption = objectList.querySelector("option:checked");
        acceptButton.disabled = !selectedOption;
    });
    
    // Show the modal
    setTimeout(() => {
        modal.style.display = "flex";
    }, 10);
    
    // Handle Accept button
    acceptButton.addEventListener("click", function() {
        const selectedOption = objectList.querySelector("option:checked");
        if (selectedOption && targetInputElement) {
            targetInputElement.value = selectedOption.value;
            
            // Trigger change event to ensure any listeners are notified
            const changeEvent = new Event('change', { bubbles: true });
            targetInputElement.dispatchEvent(changeEvent);
            
            document.body.removeChild(modal);
        }
        // Note: If no option is selected, do nothing (button should be disabled anyway)
    });
    
    // Handle Cancel button  
    modal.querySelector("#cancelObjectSelection").addEventListener("click", function() {
        document.body.removeChild(modal);
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
    
    // Allow double-click on option to accept immediately (only if accept button is enabled)
    objectList.addEventListener("dblclick", function() {
        const acceptButton = modal.querySelector("#acceptObjectSelection");
        if (!acceptButton.disabled) {
            acceptButton.click();
        }
    });
}
`;
}

module.exports = {
    getObjectSearchModalFunctionality
};
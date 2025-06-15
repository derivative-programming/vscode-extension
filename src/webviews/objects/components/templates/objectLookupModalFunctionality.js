"use strict";

/**
 * objectLookupModalFunctionality.js  
 * Provides JavaScript functionality for the Object Lookup modal
 * Created: 2024-12-27
 * Purpose: Handles modal interactions for selecting FK object names
 */

/**
 * Creates the JavaScript functionality for the Object Lookup modal
 * @returns {string} JavaScript code as a string for the modal functionality
 */
function getObjectLookupModalFunctionality() {
    return `
// Function to create and show the Object Lookup modal
function createObjectLookupModal(currentValue, targetInputElement) {
    // Create modal dialog for selecting object
    const modal = document.createElement("div");
    modal.className = "modal";
    
    // Import the modal HTML template
    const modalContent = getObjectLookupModalHtml();
    
    // Set the modal content
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Populate the object list
    const objectList = modal.querySelector("#objectList");
    
    // Get all available objects (this should be available from the main scope)
    if (typeof allObjects !== 'undefined' && Array.isArray(allObjects)) {
        allObjects.forEach(obj => {
            if (obj.name) {
                const option = document.createElement("option");
                option.value = obj.name;
                option.textContent = obj.name;
                
                // Pre-select if it matches current value
                if (currentValue && obj.name === currentValue) {
                    option.selected = true;
                }
                
                objectList.appendChild(option);
            }
        });
    }
    
    // Show the modal
    setTimeout(() => {
        modal.style.display = "flex";
    }, 10);
    
    // Handle Accept button
    modal.querySelector("#acceptObjectSelection").addEventListener("click", function() {
        const selectedOption = objectList.querySelector("option:checked");
        if (selectedOption && targetInputElement) {
            targetInputElement.value = selectedOption.value;
            
            // Trigger change event to ensure any listeners are notified
            const changeEvent = new Event('change', { bubbles: true });
            targetInputElement.dispatchEvent(changeEvent);
        }
        document.body.removeChild(modal);
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
    
    // Allow double-click on option to accept immediately
    objectList.addEventListener("dblclick", function() {
        modal.querySelector("#acceptObjectSelection").click();
    });
}
`;
}

module.exports = {
    getObjectLookupModalFunctionality
};
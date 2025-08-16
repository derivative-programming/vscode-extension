"use strict";

/**
 * dataObjectSearchModalFunctionality.js
 * Provides JavaScript functionality for the Data Object Search modal
 * Created: 2025-01-16
 * Purpose: Handles modal interactions for selecting source object names from data objects
 */

/**
 * Creates the JavaScript functionality for the Data Object Search modal
 * @returns {string} JavaScript code as a string for the modal functionality
 */
function getDataObjectSearchModalFunctionality() {
    return `
// Function to create and show the Data Object Search modal
function createDataObjectSearchModal(currentValue, targetInputElement) {
    // Create modal dialog for selecting data object
    const modal = document.createElement("div");
    modal.className = "modal";
    
    // Import the modal HTML template
    const modalContent = getDataObjectSearchModalHtml();

    // Set the modal content
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Get DOM elements
    const dataObjectList = modal.querySelector("#dataObjectList");
    const dataObjectNameFilter = modal.querySelector("#dataObjectNameFilter");
    const acceptButton = modal.querySelector("#acceptDataObjectSelection");
    
    // Initially disable the accept button
    acceptButton.disabled = true;
    console.log("Data Object Search Modal: Accept button initially disabled:", acceptButton.disabled);
    
    // Populate the data object list
    if (typeof allDataObjects !== 'undefined' && allDataObjects) {
        console.log("Data Object Search Modal: Available data objects:", allDataObjects.length);
        
        // Clear existing options
        dataObjectList.innerHTML = "";
        
        // Add all data objects to the list (initially)
        allDataObjects.forEach(dataObject => {
            if (dataObject && dataObject.name) {
                const option = document.createElement("option");
                option.value = dataObject.name;
                option.textContent = dataObject.name;
                dataObjectList.appendChild(option);
            }
        });
        
        // Pre-select the current value if it exists
        if (currentValue && currentValue.trim() !== "") {
            dataObjectList.value = currentValue;
            // Enable accept button if current value matches an option
            acceptButton.disabled = dataObjectList.selectedIndex === -1;
            console.log("Data Object Search Modal: Pre-selected value:", currentValue, "button disabled:", acceptButton.disabled);
        }
    } else {
        console.warn("Data Object Search Modal: allDataObjects not available");
        // Show a message if no data objects are available
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "No data objects available";
        dataObjectList.appendChild(option);
    }
    
    // Filter functionality
    dataObjectNameFilter.addEventListener("input", function() {
        const filterText = dataObjectNameFilter.value.toLowerCase();
        console.log("Data Object Search Modal: Filtering by:", filterText);
        
        // Clear the list
        dataObjectList.innerHTML = "";
        
        if (typeof allDataObjects !== 'undefined' && allDataObjects) {
            // Filter and add matching data objects
            allDataObjects.forEach(dataObject => {
                if (dataObject && dataObject.name && 
                    dataObject.name.toLowerCase().includes(filterText)) {
                    const option = document.createElement("option");
                    option.value = dataObject.name;
                    option.textContent = dataObject.name;
                    dataObjectList.appendChild(option);
                }
            });
        }
        
        // Reset selection and disable accept button after filtering
        dataObjectList.selectedIndex = -1;
        acceptButton.disabled = true;
        console.log("Data Object Search Modal: After filtering, button disabled:", acceptButton.disabled);
    });
    
    // Handle selection changes to enable/disable accept button
    dataObjectList.addEventListener("change", function() {
        acceptButton.disabled = dataObjectList.selectedIndex === -1;
        console.log("Data Object Search Modal: Selection changed, button disabled:", acceptButton.disabled);
    });
    
    // Also handle click events to ensure button state updates on selection
    dataObjectList.addEventListener("click", function() {
        acceptButton.disabled = dataObjectList.selectedIndex === -1;
        console.log("Data Object Search Modal: List clicked, button disabled:", acceptButton.disabled);
    });
    
    // Show the modal
    setTimeout(() => {
        modal.style.display = "flex";
    }, 10);
    
    // Handle Accept button
    acceptButton.addEventListener("click", function() {
        if (dataObjectList.selectedIndex !== -1 && targetInputElement) {
            const selectedValue = dataObjectList.options[dataObjectList.selectedIndex].value;
            targetInputElement.value = selectedValue;
            
            // Trigger change event to ensure any listeners are notified
            const changeEvent = new Event('change', { bubbles: true });
            targetInputElement.dispatchEvent(changeEvent);
            
            console.log("Data Object Search Modal: Selected value:", selectedValue);
        }
        
        // Close and remove modal
        modal.remove();
    });
    
    // Handle Cancel button and close button
    modal.querySelector("#cancelDataObjectSelection").addEventListener("click", function() {
        modal.remove();
    });
    
    modal.querySelector(".close-button").addEventListener("click", function() {
        modal.remove();
    });
    
    // Handle clicking outside the modal
    modal.addEventListener("click", function(event) {
        if (event.target === modal) {
            modal.remove();
        }
    });
    
    // Handle Escape key
    modal.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
            modal.remove();
        }
    });
    
    // Handle Enter key for quick selection
    modal.addEventListener("keydown", function(event) {
        if (event.key === "Enter" && dataObjectList.selectedIndex !== -1) {
            acceptButton.click();
        }
    });
}
`;
}

module.exports = {
    getDataObjectSearchModalFunctionality
};
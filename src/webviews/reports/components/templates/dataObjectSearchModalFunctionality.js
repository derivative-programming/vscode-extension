"use strict";

/**
 * dataObjectSearchModalFunctionality.js
 * Provides JavaScript functionality for the Data Object Search modal in Reports webview
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
    
    // Get all available data objects (this should be available from the main scope)
    let hasPreselectedOption = false;
    
    // Sort data objects alphabetically by name
    if (typeof allDataObjects !== 'undefined' && Array.isArray(allDataObjects)) {
        allDataObjects.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // Function to populate the data object list based on filters
    function populateDataObjectList(filterText = '') {
        // Clear existing options
        dataObjectList.innerHTML = '';
        hasPreselectedOption = false;
        
        // Get available data objects
        let filteredObjects = allDataObjects || [];
        
        // Apply text filter if provided
        if (filterText) {
            const filterTextLower = filterText.toLowerCase();
            filteredObjects = filteredObjects.filter(obj => {
                const nameMatch = obj.name && obj.name.toLowerCase().includes(filterTextLower);
                return nameMatch;
            });
        }
        
        // Populate the list
        filteredObjects.forEach(obj => {
            if (obj.name) {
                const option = document.createElement("option");
                option.value = obj.name;
                option.textContent = obj.name;
                
                // Pre-select if it matches current value
                if (currentValue && obj.name === currentValue) {
                    option.selected = true;
                    hasPreselectedOption = true;
                }
                
                dataObjectList.appendChild(option);
            }
        });
        
        // Enable accept button if there's a pre-selected option
        if (hasPreselectedOption) {
            acceptButton.disabled = false;
            console.log("Data Object Search Modal: Accept button enabled due to pre-selection");
        } else {
            acceptButton.disabled = dataObjectList.selectedIndex === -1;
        }
    }
    
    // Initial population of data object list
    populateDataObjectList();
    
    // Function to update data object list with current filter values
    function updateDataObjectList() {
        const textFilter = dataObjectNameFilter.value.trim();
        populateDataObjectList(textFilter);
    }
    
    // Add event listener for text filter
    dataObjectNameFilter.addEventListener("input", function() {
        updateDataObjectList();
    });
    
    // Add event listener to enable/disable accept button based on selection
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
        
        // Close the modal
        document.body.removeChild(modal);
    });
    
    // Handle Cancel button and close button
    modal.querySelector("#cancelDataObjectSelection").addEventListener("click", function() {
        document.body.removeChild(modal);
    });
    
    modal.querySelector(".close-button").addEventListener("click", function() {
        document.body.removeChild(modal);
    });
    
    // Close modal when clicking outside the modal content
    modal.addEventListener("click", function(event) {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Handle Enter key to accept selection
    modal.addEventListener("keydown", function(event) {
        if (event.key === "Enter" && !acceptButton.disabled) {
            acceptButton.click();
        }
    });
}
`;
}

module.exports = {
    getDataObjectSearchModalFunctionality
};
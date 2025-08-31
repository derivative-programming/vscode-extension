"use strict";

/**
 * generalFlowSearchModalFunctionality.js
 * Provides JavaScript functionality for the General Flow Search modal
 * Created: 2025-01-27
 * Purpose: Handles modal interactions for browsing and selecting general flows
 */

/**
 * Creates the JavaScript functionality for the General Flow Search modal
 * @returns {string} JavaScript code as a string for the modal functionality
 */
function getGeneralFlowSearchModalFunctionality() {
    return `
// Function to create and show the General Flow Search modal
function createGeneralFlowSearchModal(currentValue, targetInputElement) {
    // Create modal dialog for selecting general flow
    const modal = document.createElement("div");
    modal.className = "modal";
    
    // Import the modal HTML template
    const modalContent = getGeneralFlowSearchModalHtml();

    // Set the modal content
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Get modal elements
    const generalFlowNameFilter = modal.querySelector("#generalFlowNameFilter");
    const generalFlowList = modal.querySelector("#generalFlowList");
    const acceptButton = modal.querySelector("#acceptGeneralFlowSelection");
    
    // Initially disable the accept button
    acceptButton.disabled = true;
    console.log("General Flow Search Modal: Accept button initially disabled:", acceptButton.disabled);
    
    // Get all available general flows
    let allGeneralFlows = [];
    let hasPreselectedOption = false;
    
    // Function to populate the general flow list based on filters
    function populateGeneralFlowList(filterText = '') {
        // Clear existing options
        generalFlowList.innerHTML = '';
        hasPreselectedOption = false;
        
        // Apply text filter if provided
        let filteredFlows = allGeneralFlows;
        if (filterText) {
            const filterTextLower = filterText.toLowerCase();
            filteredFlows = allGeneralFlows.filter(flow => {
                const nameMatch = flow.name.toLowerCase().includes(filterTextLower);
                const displayNameMatch = (flow.displayName || flow.name).toLowerCase().includes(filterTextLower);
                return nameMatch || displayNameMatch;
            });
        }
        
        filteredFlows.forEach(flow => {
            const option = document.createElement("option");
            option.value = flow.name;
            option.setAttribute('data-flow-name', flow.name);
            option.setAttribute('data-object-name', flow.objectName || '');
            option.textContent = flow.displayName || flow.name;
            
            // Pre-select if it matches current value
            if (currentValue && flow.name === currentValue) {
                option.selected = true;
                hasPreselectedOption = true;
            }
            
            generalFlowList.appendChild(option);
        });
        
        // Enable accept button if there's a pre-selected option
        if (hasPreselectedOption) {
            acceptButton.disabled = false;
            console.log("General Flow Search Modal: Accept button enabled due to pre-selection");
        } else {
            acceptButton.disabled = generalFlowList.selectedIndex === -1;
        }
    }
    
    // Function to update general flow list with current filter values
    function updateGeneralFlowList() {
        const textFilter = generalFlowNameFilter.value.trim();
        populateGeneralFlowList(textFilter);
    }
    
    // Add event listener for text filter
    generalFlowNameFilter.addEventListener("input", function() {
        updateGeneralFlowList();
    });
    
    // Add event listener to enable/disable accept button based on selection
    generalFlowList.addEventListener("change", function() {
        acceptButton.disabled = generalFlowList.selectedIndex === -1;
        console.log("General Flow Search Modal: Selection changed, button disabled:", acceptButton.disabled);
    });
    
    // Also handle click events to ensure button state updates on selection
    generalFlowList.addEventListener("click", function() {
        acceptButton.disabled = generalFlowList.selectedIndex === -1;
        console.log("General Flow Search Modal: List clicked, button disabled:", acceptButton.disabled);
    });
    
    // Request general flows data and populate when received
    vscode.postMessage({
        command: 'getGeneralFlowsForModal'
    });
    
    // Store reference for the populate function to be called from message handler
    window.currentGeneralFlowSearchModal = {
        modal: modal,
        populateCallback: function(generalFlows) {
            allGeneralFlows = generalFlows || [];
            // Sort general flows alphabetically by name
            allGeneralFlows.sort((a, b) => a.name.localeCompare(b.name));
            populateGeneralFlowList();
        }
    };
    
    // Show the modal
    setTimeout(() => {
        modal.style.display = "flex";
    }, 10);
    
    // Handle Accept button
    acceptButton.addEventListener("click", function() {
        if (generalFlowList.selectedIndex !== -1 && targetInputElement) {
            const selectedOption = generalFlowList.options[generalFlowList.selectedIndex];
            const selectedValue = selectedOption.value;
            targetInputElement.value = selectedValue;
            
            // Store additional data attributes for later use
            targetInputElement.setAttribute('data-flow-name', selectedOption.getAttribute('data-flow-name') || selectedValue);
            targetInputElement.setAttribute('data-object-name', selectedOption.getAttribute('data-object-name') || '');
            
            // Trigger change event to ensure any listeners are notified
            const changeEvent = new Event('change', { bubbles: true });
            targetInputElement.dispatchEvent(changeEvent);
            
            // Clean up the modal reference
            window.currentGeneralFlowSearchModal = null;
            document.body.removeChild(modal);
        }
        // Note: If no option is selected, do nothing (button should be disabled anyway)
    });
    
    // Handle Cancel button  
    modal.querySelector("#cancelGeneralFlowSelection").addEventListener("click", function() {
        // Clean up the modal reference
        window.currentGeneralFlowSearchModal = null;
        document.body.removeChild(modal);
    });
    
    // Close modal when clicking the x button
    modal.querySelector(".close-button").addEventListener("click", function() {
        // Clean up the modal reference
        window.currentGeneralFlowSearchModal = null;
        document.body.removeChild(modal);
    });
    
    // Close modal when clicking outside the modal content
    modal.addEventListener("click", function(event) {
        if (event.target === modal) {
            // Clean up the modal reference
            window.currentGeneralFlowSearchModal = null;
            document.body.removeChild(modal);
        }
    });
    
    // Allow double-click on option to accept immediately (only if accept button is enabled)
    generalFlowList.addEventListener("dblclick", function() {
        const acceptButton = modal.querySelector("#acceptGeneralFlowSelection");
        if (!acceptButton.disabled) {
            acceptButton.click();
        }
    });
}
`;
}

module.exports = {
    getGeneralFlowSearchModalFunctionality
};
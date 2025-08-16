"use strict";

/**
 * pageSearchModalFunctionality.js
 * Provides JavaScript functionality for the Page Search modal
 * Created: 2025-08-16
 * Purpose: Handles modal interactions for browsing and selecting destination target names
 */

/**
 * Creates the JavaScript functionality for the Page Search modal
 * @returns {string} JavaScript code as a string for the modal functionality
 */
function getPageSearchModalFunctionality() {
    return `
// Function to create and show the Page Search modal
function createPageSearchModal(currentValue, targetInputElement) {
    // Create modal dialog for selecting page
    const modal = document.createElement("div");
    modal.className = "modal";
    
    // Import the modal HTML template
    const modalContent = getPageSearchModalHtml();

    // Set the modal content
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Get modal elements
    const pageTypeFilter = modal.querySelector("#pageTypeFilter");
    const pageList = modal.querySelector("#pageList");
    const acceptButton = modal.querySelector("#acceptPageSelection");
    
    // Initially disable the accept button
    acceptButton.disabled = true;
    console.log("Page Search Modal: Accept button initially disabled:", acceptButton.disabled);
    
    // Get all available pages (forms and reports)
    let allPages = [];
    let hasPreselectedOption = false;
    
    // Collect forms (objectWorkflow items)
    if (typeof allForms !== 'undefined' && Array.isArray(allForms)) {
        allForms.forEach(form => {
            if (form.name) {
                allPages.push({
                    name: form.name,
                    type: 'form',
                    displayName: form.name + ' (Form)'
                });
            }
        });
    }
    
    // Collect reports
    if (typeof allReports !== 'undefined' && Array.isArray(allReports)) {
        allReports.forEach(report => {
            if (report.name) {
                allPages.push({
                    name: report.name,
                    type: 'report',
                    displayName: report.name + ' (Report)'
                });
            }
        });
    }
    
    // Sort pages alphabetically by name
    allPages.sort((a, b) => a.name.localeCompare(b.name));
    
    // Function to populate the page list based on filter
    function populatePageList(filterType = '') {
        // Clear existing options
        pageList.innerHTML = '';
        hasPreselectedOption = false;
        
        // Filter pages based on type
        const filteredPages = filterType ? allPages.filter(page => page.type === filterType) : allPages;
        
        filteredPages.forEach(page => {
            const option = document.createElement("option");
            option.value = page.name;
            option.textContent = page.displayName;
            
            // Pre-select if it matches current value
            if (currentValue && page.name === currentValue) {
                option.selected = true;
                hasPreselectedOption = true;
            }
            
            pageList.appendChild(option);
        });
        
        // Enable accept button if there's a pre-selected option
        if (hasPreselectedOption) {
            acceptButton.disabled = false;
            console.log("Page Search Modal: Accept button enabled due to pre-selection");
        } else {
            acceptButton.disabled = pageList.selectedIndex === -1;
        }
    }
    
    // Initial population of page list
    populatePageList();
    
    // Add event listener for type filter
    pageTypeFilter.addEventListener("change", function() {
        populatePageList(this.value);
    });
    
    // Add event listener to enable/disable accept button based on selection
    pageList.addEventListener("change", function() {
        acceptButton.disabled = pageList.selectedIndex === -1;
        console.log("Page Search Modal: Selection changed, button disabled:", acceptButton.disabled);
    });
    
    // Also handle click events to ensure button state updates on selection
    pageList.addEventListener("click", function() {
        acceptButton.disabled = pageList.selectedIndex === -1;
        console.log("Page Search Modal: List clicked, button disabled:", acceptButton.disabled);
    });
    
    // Show the modal
    setTimeout(() => {
        modal.style.display = "flex";
    }, 10);
    
    // Handle Accept button
    acceptButton.addEventListener("click", function() {
        if (pageList.selectedIndex !== -1 && targetInputElement) {
            const selectedValue = pageList.options[pageList.selectedIndex].value;
            targetInputElement.value = selectedValue;
            
            // Trigger change event to ensure any listeners are notified
            const changeEvent = new Event('change', { bubbles: true });
            targetInputElement.dispatchEvent(changeEvent);
            
            document.body.removeChild(modal);
        }
        // Note: If no option is selected, do nothing (button should be disabled anyway)
    });
    
    // Handle Cancel button  
    modal.querySelector("#cancelPageSelection").addEventListener("click", function() {
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
    pageList.addEventListener("dblclick", function() {
        const acceptButton = modal.querySelector("#acceptPageSelection");
        if (!acceptButton.disabled) {
            acceptButton.click();
        }
    });
}
`;
}

module.exports = {
    getPageSearchModalFunctionality
};

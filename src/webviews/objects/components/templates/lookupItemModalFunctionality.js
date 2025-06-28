"use strict";

/**
 * Creates the JavaScript functionality for the Add Lookup Item modal
 * @returns {string} JavaScript code as a string for the modal functionality
 */
function getLookupItemModalFunctionality() {
    return `
// Function to create and show the Add Lookup Item modal
function createLookupItemModal() {
    // Create modal dialog for adding lookup items
    const modal = document.createElement("div");
    modal.className = "modal";
    
    // Import the modal HTML template
    const modalContent = getLookupItemModalHtml();
    
    // Set the modal content
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Show the modal
    setTimeout(() => {
        modal.style.display = "flex";
        // Focus on the lookup item name input for the initially active tab (single lookup item)
        const lookupItemNameInput = modal.querySelector("#lookupItemName");
        if (lookupItemNameInput) {
            lookupItemNameInput.focus();
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
                    const lookupItemNameInput = modal.querySelector("#lookupItemName");
                    if (lookupItemNameInput) {
                        lookupItemNameInput.focus();
                    }
                } else if (tabId === 'bulkAdd') {
                    const bulkLookupItemsTextarea = modal.querySelector("#bulkLookupItems");
                    if (bulkLookupItemsTextarea) {
                        bulkLookupItemsTextarea.focus();
                    }
                }
            }, 10);
        });
    });
    
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
    
    // Add Enter key listener for single lookup item input
    modal.querySelector("#lookupItemName").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            modal.querySelector("#addSingleLookupItem").click();
        }
    });
    
    // Add Enter key listener for bulk lookup items textarea
    modal.querySelector("#bulkLookupItems").addEventListener("keypress", function(event) {
        if (event.key === "Enter" && event.ctrlKey) {
            modal.querySelector("#addBulkLookupItems").click();
        }
    });
    
    // Single lookup item add functionality
    modal.querySelector("#addSingleLookupItem").addEventListener("click", function() {
        const lookupItemNameInput = modal.querySelector("#lookupItemName");
        const lookupItemName = lookupItemNameInput.value.trim();
        const errorDiv = modal.querySelector("#singleValidationError");
        
        // Clear previous error
        errorDiv.textContent = "";
        
        // Validation
        if (!lookupItemName) {
            errorDiv.textContent = "Lookup item name is required.";
            lookupItemNameInput.focus();
            return;
        }
        
        // Check for valid name format (Pascal case, alpha characters only)
        if (!/^[A-Z][a-zA-Z]*$/.test(lookupItemName)) {
            errorDiv.textContent = "Lookup item name must be in Pascal case with alpha characters only (Example: ActiveStatus).";
            lookupItemNameInput.focus();
            return;
        }
        
        // Check for duplicate names
        const existingNames = lookupItems.map(item => item.name).filter(name => name);
        if (existingNames.includes(lookupItemName)) {
            errorDiv.textContent = "A lookup item with this name already exists.";
            lookupItemNameInput.focus();
            return;
        }
        
        // Create new lookup item with default values
        const newLookupItem = {
            name: lookupItemName,
            displayName: lookupItemName,
            description: '',
            isActive: 'true'
        };
        
        // Add to lookupItems array
        lookupItems.push(newLookupItem);
        
        // Update UI
        updateLookupItemsList();
        updateLookupItemsTable();
        updateLookupItemsCounter();
        
        // Select the new item
        const lookupItemsList = document.getElementById('lookupItemsList');
        if (lookupItemsList) {
            lookupItemsList.value = lookupItems.length - 1;
            selectedLookupItemIndex = lookupItems.length - 1;
            showLookupItemDetails(selectedLookupItemIndex);
        }
        
        // Save changes
        saveLookupItemsToModel();
        
        // Close modal
        document.body.removeChild(modal);
    });
    
    // Bulk lookup items add functionality
    modal.querySelector("#addBulkLookupItems").addEventListener("click", function() {
        const bulkLookupItemsTextarea = modal.querySelector("#bulkLookupItems");
        const bulkText = bulkLookupItemsTextarea.value.trim();
        const errorDiv = modal.querySelector("#bulkValidationError");
        
        // Clear previous error
        errorDiv.textContent = "";
        
        if (!bulkText) {
            errorDiv.textContent = "Please enter at least one lookup item name.";
            bulkLookupItemsTextarea.focus();
            return;
        }
        
        // Split by lines and filter out empty lines
        const lookupItemNames = bulkText.split('\\n')
            .map(name => name.trim())
            .filter(name => name.length > 0);
        
        if (lookupItemNames.length === 0) {
            errorDiv.textContent = "Please enter at least one valid lookup item name.";
            bulkLookupItemsTextarea.focus();
            return;
        }
        
        // Validate all names
        const existingNames = lookupItems.map(item => item.name).filter(name => name);
        const invalidNames = [];
        const duplicateNames = [];
        
        lookupItemNames.forEach(name => {
            // Check format
            if (!/^[A-Z][a-zA-Z]*$/.test(name)) {
                invalidNames.push(name);
            }
            // Check for duplicates with existing items
            if (existingNames.includes(name)) {
                duplicateNames.push(name);
            }
        });
        
        // Check for duplicates within the input
        const inputDuplicates = lookupItemNames.filter((name, index) => 
            lookupItemNames.indexOf(name) !== index
        );
        
        if (invalidNames.length > 0) {
            errorDiv.textContent = "Invalid names (must be Pascal case, alpha only): " + invalidNames.join(", ");
            bulkLookupItemsTextarea.focus();
            return;
        }
        
        if (duplicateNames.length > 0) {
            errorDiv.textContent = "Duplicate names (already exist): " + duplicateNames.join(", ");
            bulkLookupItemsTextarea.focus();
            return;
        }
        
        if (inputDuplicates.length > 0) {
            errorDiv.textContent = "Duplicate names in input: " + [...new Set(inputDuplicates)].join(", ");
            bulkLookupItemsTextarea.focus();
            return;
        }
        
        // Create new lookup items
        const newLookupItems = lookupItemNames.map(name => ({
            name: name,
            displayName: name,
            description: '',
            isActive: 'true'
        }));
        
        // Add to lookupItems array
        lookupItems.push(...newLookupItems);
        
        // Update UI
        updateLookupItemsList();
        updateLookupItemsTable();
        updateLookupItemsCounter();
        
        // Save changes
        saveLookupItemsToModel();
        
        // Close modal
        document.body.removeChild(modal);
    });
}
`;
}

module.exports = {
    getLookupItemModalFunctionality
};

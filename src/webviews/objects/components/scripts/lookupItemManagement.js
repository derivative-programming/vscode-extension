"use strict";

// lookupItemManagement.js
// Client-side JavaScript functions for managing lookup items
// Created: 2025-06-27

/**
 * Generates JavaScript functions for managing lookup items
 * @returns {string} JavaScript code for lookup item management
 */
function getLookupItemManagementFunctions() {
    return `
        // Lookup Item Management Functions
        let lookupItems = [];
        let selectedLookupItemIndex = null;

        function initializeLookupItems() {
            // Get lookup items from object data if available
            if (typeof window.objectData !== 'undefined' && window.objectData.lookupItem) {
                lookupItems = window.objectData.lookupItem || [];
            } else {
                // Initialize with empty array for testing
                lookupItems = [];
            }
            
            // Initialize lookup items list if it exists
            const lookupItemsList = document.getElementById('lookupItemsList');
            if (lookupItemsList) {
                // Only update the list if it's empty (to avoid overriding template population)
                if (lookupItemsList.options.length === 0) {
                    updateLookupItemsList();
                }
                
                // Add event listener for selection
                lookupItemsList.addEventListener('change', function() {
                    selectedLookupItemIndex = parseInt(this.value);
                    if (!isNaN(selectedLookupItemIndex)) {
                        showLookupItemDetails(selectedLookupItemIndex);
                    }
                });
            }

            // Initialize add lookup item button
            const addLookupItemBtn = document.getElementById('addLookupItem');
            if (addLookupItemBtn) {
                addLookupItemBtn.addEventListener('click', function() {
                    createLookupItemModal();
                });
            }

            // Initialize lookup item view switching
            const lookupViewIcons = document.querySelectorAll('#lookupItems .view-icons .icon');
            lookupViewIcons.forEach(icon => {
                icon.addEventListener('click', function() {
                    switchLookupItemView(this.dataset.view);
                });
            });

            // Initialize table view
            updateLookupItemsTable();
            
            // Update the lookup items counter in the tab label
            updateLookupItemsCounter();
            
            // Initialize move buttons
            initializeLookupItemMoveButtons();
        }

        function updateLookupItemsList() {
            const lookupItemsList = document.getElementById('lookupItemsList');
            if (!lookupItemsList) return;

            lookupItemsList.innerHTML = '';
            lookupItems.forEach((item, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = item.name || item.displayName || 'Unnamed Lookup Item';
                lookupItemsList.appendChild(option);
            });
        }

        function showLookupItemDetails(index) {
            const detailsContainer = document.getElementById('lookupItemDetailsContainer');
            const form = document.getElementById('lookupItemDetailsForm');
            
            if (!detailsContainer || !form || !lookupItems[index]) return;

            // Show the details container
            detailsContainer.style.display = 'block';

            // Populate form with lookup item data
            const lookupItem = lookupItems[index];
            
            // Clear all form fields first and set them to disabled/readonly state
            const inputs = form.querySelectorAll('input[type="text"], select');
            const checkboxes = form.querySelectorAll('input[type="checkbox"]');
            
            inputs.forEach(input => {
                // Clear the value completely for all inputs including customIntProp1Value
                input.value = '';
                
                if (input.type === 'text') {
                    input.readOnly = true;
                } else if (input.tagName === 'SELECT') {
                    // Reset to first option for selects
                    input.selectedIndex = 0;
                    input.disabled = true;
                }
                // Update styling to appear inactive
                updateInputStyle(input, false);
            });
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
                // Re-enable checkboxes that were previously disabled
                checkbox.disabled = false;
                checkbox.removeAttribute('data-originally-checked');
            });
            
            // Populate form fields with lookup item data and update checkboxes
            inputs.forEach(input => {
                const propName = input.name;
                if (propName && lookupItem.hasOwnProperty(propName) && lookupItem[propName] !== null && lookupItem[propName] !== undefined) {
                    // Set the actual value from the lookup item
                    input.value = lookupItem[propName];
                    
                    // Enable the input and check the corresponding checkbox
                    if (input.type === 'text') {
                        input.readOnly = false;
                    } else if (input.tagName === 'SELECT') {
                        input.disabled = false;
                    }
                    
                    // Update the visual styling to make it appear active
                    updateInputStyle(input, true);
                    
                    // Find and check the corresponding checkbox
                    const fieldId = input.id;
                    const checkbox = form.querySelector('input[type="checkbox"][data-field-id="' + fieldId + '"]');
                    if (checkbox) {
                        checkbox.checked = true;
                        // Disable the checkbox since the property exists (once checked, it stays checked)
                        checkbox.disabled = true;
                        checkbox.setAttribute('data-originally-checked', 'true');
                    }
                }
            });

            // Add save handler if not already added
            if (!form.dataset.listenerAdded) {
                form.addEventListener('change', function(e) {
                    if (selectedLookupItemIndex !== null) {
                        if (e.target.type === 'checkbox') {
                            // Handle checkbox toggle
                            const fieldId = e.target.getAttribute('data-field-id');
                            const inputElement = document.getElementById(fieldId);
                            if (inputElement) {
                                if (e.target.checked) {
                                    // Enable the field
                                    if (inputElement.type === 'text') {
                                        inputElement.readOnly = false;
                                    } else if (inputElement.tagName === 'SELECT') {
                                        inputElement.disabled = false;
                                    }
                                    updateInputStyle(inputElement, true);
                                    
                                    // Disable the checkbox to prevent unchecking (once checked, it stays checked)
                                    e.target.disabled = true;
                                    e.target.setAttribute('data-originally-checked', 'true');
                                    
                                    // Set a default value and save it
                                    const propName = inputElement.name;
                                    let defaultValue = '';
                                    if (inputElement.tagName === 'SELECT' && inputElement.options.length > 0) {
                                        defaultValue = inputElement.options[0].value;
                                        inputElement.value = defaultValue;
                                    }
                                    saveLookupItemChanges(selectedLookupItemIndex, propName, defaultValue);
                                } else {
                                    // Disable the field and remove the property
                                    if (inputElement.type === 'text') {
                                        inputElement.readOnly = true;
                                        inputElement.value = '';
                                    } else if (inputElement.tagName === 'SELECT') {
                                        inputElement.disabled = true;
                                    }
                                    updateInputStyle(inputElement, false);
                                    
                                    // Remove the property from the lookup item
                                    removeLookupItemProperty(selectedLookupItemIndex, inputElement.name);
                                }
                            }
                        } else {
                            // Handle regular field change
                            saveLookupItemChanges(selectedLookupItemIndex, e.target.name, e.target.value);
                        }
                    }
                });
                form.dataset.listenerAdded = 'true';
            }
            
            // Update move button states when showing details
            updateLookupItemMoveButtonStates();
        }

        function addNewLookupItem(lookupItemData) {
            // Use provided data or create default lookup item
            const newLookupItem = lookupItemData || {
                name: '',
                displayName: '',
                description: '',
                isActive: 'true'
            };

            lookupItems.push(newLookupItem);
            updateLookupItemsList();
            updateLookupItemsTable();
            
            // Select the new item if it has a name
            if (newLookupItem.name) {
                const lookupItemsList = document.getElementById('lookupItemsList');
                if (lookupItemsList) {
                    lookupItemsList.value = lookupItems.length - 1;
                    selectedLookupItemIndex = lookupItems.length - 1;
                    showLookupItemDetails(selectedLookupItemIndex);
                }
            }

            // Update the lookup items counter in the tab label
            updateLookupItemsCounter();

            // Save changes
            saveLookupItemsToModel();
        }

        // Function to update the lookup items counter in the tab label
        function updateLookupItemsCounter() {
            const lookupItemsTab = document.querySelector('.tab[data-tab="lookupItems"]');
            if (lookupItemsTab) {
                lookupItemsTab.textContent = "Lookup Items (" + lookupItems.length + ")";
            }
        }

        function saveLookupItemChanges(index, propertyName, value) {
            if (!lookupItems[index]) return;

            // Validate name property for maximum length
            if (propertyName === 'name' && value && value.length > 50) {
                // Show error and revert to previous value
                const form = document.getElementById('lookupItemDetailsForm');
                if (form) {
                    const nameInput = form.querySelector('input[name="name"]');
                    if (nameInput) {
                        nameInput.value = lookupItems[index][propertyName] || '';
                        // Show error message
                        alert('Lookup item name cannot be longer than 50 characters.');
                        nameInput.focus();
                    }
                }
                return;
            }

            lookupItems[index][propertyName] = value;
            
            // Update the list display if name or displayName changed
            if (propertyName === 'name' || propertyName === 'displayName') {
                updateLookupItemsList();
                const lookupItemsList = document.getElementById('lookupItemsList');
                if (lookupItemsList) {
                    lookupItemsList.value = index;
                }
            }

            // Save changes to model
            saveLookupItemsToModel();
        }

        function saveLookupItemsToModel() {
            vscode.postMessage({
                command: 'updateLookupItems',
                data: {
                    lookupItems: lookupItems
                }
            });
        }

        function switchLookupItemView(viewType) {
            const lookupListView = document.getElementById('lookupListView');
            const lookupTableView = document.getElementById('lookupTableView');
            const listIcon = document.querySelector('#lookupItems .list-icon');
            const tableIcon = document.querySelector('#lookupItems .table-icon');

            if (viewType === 'lookupListView') {
                if (lookupListView) lookupListView.classList.add('active');
                if (lookupTableView) lookupTableView.classList.remove('active');
                if (listIcon) listIcon.classList.add('active');
                if (tableIcon) tableIcon.classList.remove('active');
            } else if (viewType === 'lookupTableView') {
                if (lookupListView) lookupListView.classList.remove('active');
                if (lookupTableView) lookupTableView.classList.add('active');
                if (listIcon) listIcon.classList.remove('active');
                if (tableIcon) tableIcon.classList.add('active');
            }
        }

        // Delete lookup item functionality
        function deleteLookupItem(index) {
            if (index >= 0 && index < lookupItems.length) {
                lookupItems.splice(index, 1);
                updateLookupItemsList();
                
                // Hide details if the deleted item was selected
                if (selectedLookupItemIndex === index) {
                    const detailsContainer = document.getElementById('lookupItemDetailsContainer');
                    if (detailsContainer) {
                        detailsContainer.style.display = 'none';
                    }
                    selectedLookupItemIndex = null;
                }
                
                // Update the table view
                updateLookupItemsTable();
                
                // Update the lookup items counter in the tab label
                updateLookupItemsCounter();
                
                // Save changes
                saveLookupItemsToModel();
            }
        }

        function updateLookupItemsTable() {
            const tableBody = document.querySelector('#lookupItemsTable tbody');
            if (!tableBody) return;

            tableBody.innerHTML = '';
            
            // Use the schema-based lookup columns that are available globally
            const columnsToUse = typeof lookupColumns !== 'undefined' ? lookupColumns : ['name', 'displayName', 'description', 'isActive', 'customIntProp1Value'];
            
            lookupItems.forEach((item, index) => {
                const row = document.createElement('tr');
                row.dataset.index = index;
                
                // Add cells for each property
                columnsToUse.forEach(propKey => {
                    const cell = document.createElement('td');
                    
                    // Check if the property exists and is not null or undefined
                    const propertyExists = item.hasOwnProperty(propKey) && item[propKey] !== null && item[propKey] !== undefined;
                    
                    // Special handling for the name column
                    if (propKey === 'name') {
                        cell.innerHTML = '<span class="lookup-item-name">' + (item.name || "Unnamed Lookup Item") + '</span>' +
                            '<input type="hidden" name="name" value="' + (item.name || "") + '">';
                    } else {
                        // Get the schema for this property to determine if it has enum options
                        const propSchema = (typeof lookupItemsSchema !== 'undefined' && lookupItemsSchema[propKey]) || {};
                        const hasEnum = propSchema.enum && Array.isArray(propSchema.enum);
                        
                        let inputField = '';
                        if (hasEnum) {
                            // Create select dropdown for enum properties
                            inputField = '<select name="' + propKey + '" ' + (propertyExists ? '' : 'disabled') + '>';
                            propSchema.enum.forEach(option => {
                                const isSelected = propertyExists && item[propKey] === option;
                                inputField += '<option value="' + option + '" ' + (isSelected ? 'selected' : '') + '>' + option + '</option>';
                            });
                            inputField += '</select>';
                        } else {
                            // Create text input for regular properties
                            inputField = '<input type="text" name="' + propKey + '" value="' + (propertyExists ? item[propKey] : '') + '" ' + 
                                (propertyExists ? '' : 'readonly') + '>';
                        }
                        
                        // If the property exists, add a data attribute to indicate it was originally checked
                        const originallyChecked = propertyExists ? 'data-originally-checked="true"' : '';
                        
                        cell.innerHTML = '<div class="control-with-checkbox">' +
                            inputField +
                            '<input type="checkbox" class="lookup-item-checkbox" data-prop="' + propKey + 
                            '" data-index="' + index + '" ' + (propertyExists ? 'checked disabled' : '') + ' ' + originallyChecked + ' title="Toggle property existence">' +
                            '</div>';
                    }
                    
                    row.appendChild(cell);
                });
                
                tableBody.appendChild(row);
            });
            
            // Initialize checkbox behavior for table rows
            initializeLookupItemTableCheckboxes();
        }

        // Remove a property from a lookup item
        function removeLookupItemProperty(index, propertyName) {
            if (lookupItems[index] && lookupItems[index].hasOwnProperty(propertyName)) {
                delete lookupItems[index][propertyName];
                saveLookupItemsToModel();
                updateLookupItemsTable();
            }
        }

        // Initialize checkbox behavior for lookup item table
        function initializeLookupItemTableCheckboxes() {
            const table = document.getElementById('lookupItemsTable');
            if (!table) return;
            
            table.querySelectorAll('.lookup-item-checkbox').forEach(checkbox => {
                const tableCell = checkbox.closest('td');
                if (!tableCell) return;
                
                const inputElement = tableCell.querySelector('input[type="text"], select');
                if (!inputElement) return;
                
                // Set initial state
                updateInputStyle(inputElement, checkbox.checked);
                
                checkbox.addEventListener('change', function() {
                    const isChecked = this.checked;
                    const rowIndex = parseInt(this.getAttribute('data-index'));
                    const propName = this.getAttribute('data-prop');
                    
                    if (inputElement.tagName === 'INPUT') {
                        inputElement.readOnly = !isChecked;
                    } else if (inputElement.tagName === 'SELECT') {
                        inputElement.disabled = !isChecked;
                    }
                    
                    updateInputStyle(inputElement, isChecked);
                    
                    if (isChecked) {
                        // Set default value when enabling
                        let defaultValue = '';
                        if (inputElement.tagName === 'SELECT' && inputElement.options.length > 0) {
                            defaultValue = inputElement.options[0].value;
                            inputElement.value = defaultValue;
                        }
                        
                        // Disable the checkbox to prevent unchecking (once checked, it stays checked)
                        this.disabled = true;
                        this.setAttribute('data-originally-checked', 'true');
                        
                        // Save the property
                        if (!lookupItems[rowIndex]) lookupItems[rowIndex] = {};
                        lookupItems[rowIndex][propName] = defaultValue;
                    } else {
                        // Remove the property
                        if (lookupItems[rowIndex]) {
                            delete lookupItems[rowIndex][propName];
                        }
                        inputElement.value = '';
                    }
                    
                    saveLookupItemsToModel();
                });
                
                // Handle input changes
                inputElement.addEventListener('change', function() {
                    if (!checkbox.checked) return;
                    
                    const rowIndex = parseInt(checkbox.getAttribute('data-index'));
                    const propName = checkbox.getAttribute('data-prop');
                    
                    // Validate name property for maximum length
                    if (propName === 'name' && this.value && this.value.length > 50) {
                        // Show error and revert to previous value
                        this.value = lookupItems[rowIndex][propName] || '';
                        alert('Lookup item name cannot be longer than 50 characters.');
                        this.focus();
                        return;
                    }
                    
                    if (!lookupItems[rowIndex]) lookupItems[rowIndex] = {};
                    lookupItems[rowIndex][propName] = this.value;
                    
                    saveLookupItemsToModel();
                });
            });
        }

        // --- MOVE UP/DOWN FUNCTIONALITY ---
        
        // Helper function to move a lookup item in the list and update model
        function moveLookupItem(direction) {
            const lookupItemsList = document.getElementById('lookupItemsList');
            if (!lookupItemsList || lookupItemsList.selectedIndex === -1) {
                return; // No item selected
            }
            
            const selectedIndex = lookupItemsList.selectedIndex;
            const newIndex = direction === 'up' ? selectedIndex - 1 : selectedIndex + 1;
            
            // Check bounds
            if (newIndex < 0 || newIndex >= lookupItems.length) {
                return; // Already at first/last position
            }
            
            // Swap lookup items in the array
            const temp = lookupItems[selectedIndex];
            lookupItems[selectedIndex] = lookupItems[newIndex];
            lookupItems[newIndex] = temp;
            
            // Update the list view
            updateLookupItemsList();
            
            // Update the table view
            updateLookupItemsTable();
            
            // Maintain selection on the moved item
            lookupItemsList.selectedIndex = newIndex;
            selectedLookupItemIndex = newIndex;
            
            // Update move button states
            updateLookupItemMoveButtonStates();
            
            // Show details for the moved item
            showLookupItemDetails(newIndex);
            
            // Save changes to model
            saveLookupItemsToModel();
        }

        // Helper function to reverse the order of lookup items
        function reverseLookupItems() {
            if (lookupItems.length <= 1) return;
            
            // Remember the selected item
            const selectedItem = selectedLookupItemIndex !== null ? lookupItems[selectedLookupItemIndex] : null;
            
            // Reverse the array
            lookupItems.reverse();
            
            // Update views
            updateLookupItemsList();
            updateLookupItemsTable();
            
            // Try to reselect the same item if it was selected
            if (selectedItem && selectedLookupItemIndex !== null) {
                const newIndex = lookupItems.length - 1 - selectedLookupItemIndex;
                const lookupItemsList = document.getElementById('lookupItemsList');
                if (lookupItemsList && newIndex >= 0 && newIndex < lookupItems.length) {
                    lookupItemsList.selectedIndex = newIndex;
                    selectedLookupItemIndex = newIndex;
                    showLookupItemDetails(newIndex);
                }
            }
            
            // Update move button states
            updateLookupItemMoveButtonStates();
            
            // Save changes to model
            saveLookupItemsToModel();
        }

        // Helper function to update move button states based on selection
        function updateLookupItemMoveButtonStates() {
            const lookupItemsList = document.getElementById('lookupItemsList');
            const moveUpButton = document.getElementById('moveUpLookupItemsButton');
            const moveDownButton = document.getElementById('moveDownLookupItemsButton');
            
            if (lookupItemsList && moveUpButton && moveDownButton) {
                const selectedIndex = lookupItemsList.selectedIndex;
                const hasSelection = selectedIndex !== -1;
                const isFirst = selectedIndex === 0;
                const isLast = selectedIndex === lookupItems.length - 1;
                
                moveUpButton.disabled = !hasSelection || isFirst;
                moveDownButton.disabled = !hasSelection || isLast;
            }
        }

        // Initialize move button event listeners
        function initializeLookupItemMoveButtons() {
            const moveUpButton = document.getElementById('moveUpLookupItemsButton');
            const moveDownButton = document.getElementById('moveDownLookupItemsButton');
            const reverseButton = document.getElementById('reverseLookupItemsButton');
            const lookupItemsList = document.getElementById('lookupItemsList');
            
            if (moveUpButton) {
                moveUpButton.addEventListener('click', () => {
                    moveLookupItem('up');
                });
            }
            
            if (moveDownButton) {
                moveDownButton.addEventListener('click', () => {
                    moveLookupItem('down');
                });
            }
            
            if (reverseButton) {
                reverseButton.addEventListener('click', () => {
                    reverseLookupItems();
                });
            }
            
            if (lookupItemsList) {
                lookupItemsList.addEventListener('change', updateLookupItemMoveButtonStates);
            }
            
            // Initial state update
            updateLookupItemMoveButtonStates();
        }
    `;
}

module.exports = {
    getLookupItemManagementFunctions
};

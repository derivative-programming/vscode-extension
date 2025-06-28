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
                updateLookupItemsList();
                
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
                    addNewLookupItem();
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
            const inputs = form.querySelectorAll('input, select');
            
            inputs.forEach(input => {
                const propName = input.name;
                if (propName && lookupItem.hasOwnProperty(propName)) {
                    input.value = lookupItem[propName] || '';
                }
            });

            // Add save handler if not already added
            if (!form.dataset.listenerAdded) {
                form.addEventListener('change', function(e) {
                    if (selectedLookupItemIndex !== null) {
                        saveLookupItemChanges(selectedLookupItemIndex, e.target.name, e.target.value);
                    }
                });
                form.dataset.listenerAdded = 'true';
            }
        }

        function addNewLookupItem() {
            const newLookupItem = {
                name: '',
                displayName: '',
                description: '',
                isActive: 'true',
                customIntProp1Value: ''
            };

            lookupItems.push(newLookupItem);
            updateLookupItemsList();
            updateLookupItemsTable();
            
            // Select the new item
            const lookupItemsList = document.getElementById('lookupItemsList');
            if (lookupItemsList) {
                lookupItemsList.value = lookupItems.length - 1;
                selectedLookupItemIndex = lookupItems.length - 1;
                showLookupItemDetails(selectedLookupItemIndex);
            }

            // Save changes
            saveLookupItemsToModel();
        }

        function saveLookupItemChanges(index, propertyName, value) {
            if (!lookupItems[index]) return;

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
                
                // Save changes
                saveLookupItemsToModel();
            }
        }

        function updateLookupItemsTable() {
            const tableBody = document.querySelector('#lookupItemsTable tbody');
            if (!tableBody) return;

            tableBody.innerHTML = '';
            lookupItems.forEach((item, index) => {
                const row = document.createElement('tr');
                row.dataset.index = index;
                
                // Add cells for each property (sorted alphabetically)
                const propertyKeys = ['name', 'displayName', 'description', 'isActive', 'customIntProp1Value'];
                propertyKeys.forEach(key => {
                    const cell = document.createElement('td');
                    cell.dataset.prop = key;
                    cell.dataset.index = index;
                    cell.textContent = item[key] || '';
                    row.appendChild(cell);
                });
                
                // Add delete button cell
                const deleteCell = document.createElement('td');
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-lookup-item';
                deleteBtn.dataset.index = index;
                deleteBtn.textContent = 'Delete';
                deleteBtn.addEventListener('click', function() {
                    deleteLookupItem(parseInt(this.dataset.index));
                });
                deleteCell.appendChild(deleteBtn);
                row.appendChild(deleteCell);
                
                tableBody.appendChild(row);
            });
        }
    `;
}

module.exports = {
    getLookupItemManagementFunctions
};

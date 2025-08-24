"use strict";

function getDataObjectSearchModalFunctionality() {
    return `
        // Data Object Search Modal functionality
        function createDataObjectSearchModal(currentValue, targetInputField) {
            console.log('Creating data object search modal for Page Init');
            console.log('Current value:', currentValue);
            console.log('Target input field:', targetInputField);
            
            // Remove any existing modal
            const existingModal = document.getElementById('dataObjectSearchModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Create and insert the modal
            const modalHtml = \`
                <div id="dataObjectSearchModal" class="modal" style="display: block;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Select Data Object</h3>
                            <button type="button" class="close-button">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-row">
                                <label for="dataObjectFilter">Filter Data Objects:</label>
                                <input type="text" id="dataObjectFilter" placeholder="Type to filter data objects..." autocomplete="off">
                            </div>
                            <div class="form-row">
                                <label for="dataObjectSelect">Available Data Objects:</label>
                                <select id="dataObjectSelect" size="10" style="width: 100%; min-height: 200px;">
                                    <!-- Options will be populated dynamically -->
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" id="acceptDataObjectSelection">Accept</button>
                            <button type="button" class="cancel-button">Cancel</button>
                        </div>
                    </div>
                </div>\`;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modal = document.getElementById('dataObjectSearchModal');
            
            const filterInput = modal.querySelector('#dataObjectFilter');
            const selectElement = modal.querySelector('#dataObjectSelect');
            const acceptButton = modal.querySelector('#acceptDataObjectSelection');
            const closeButton = modal.querySelector('.close-button');
            const cancelButton = modal.querySelector('.cancel-button');
            
            // Populate data objects
            function populateDataObjects(filterText = '') {
                selectElement.innerHTML = '';
                
                if (!allDataObjects || allDataObjects.length === 0) {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = 'No data objects available';
                    option.disabled = true;
                    selectElement.appendChild(option);
                    return;
                }
                
                const filteredObjects = allDataObjects.filter(obj => 
                    obj.name && obj.name.toLowerCase().includes(filterText.toLowerCase())
                );
                
                filteredObjects.forEach(obj => {
                    const option = document.createElement('option');
                    option.value = obj.name;
                    option.textContent = obj.name;
                    if (obj.name === currentValue) {
                        option.selected = true;
                    }
                    selectElement.appendChild(option);
                });
                
                if (filteredObjects.length === 0) {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = 'No matching data objects found';
                    option.disabled = true;
                    selectElement.appendChild(option);
                }
            }
            
            // Initial population
            populateDataObjects();
            
            // Filter functionality
            filterInput.addEventListener('input', function() {
                populateDataObjects(this.value);
            });
            
            // Accept selection
            acceptButton.addEventListener('click', function() {
                const selectedValue = selectElement.value;
                if (selectedValue && targetInputField) {
                    targetInputField.value = selectedValue;
                    // Trigger change event to update the model
                    const changeEvent = new Event('input', { bubbles: true });
                    targetInputField.dispatchEvent(changeEvent);
                    console.log('Data object selected:', selectedValue);
                }
                modal.remove();
            });
            
            // Close handlers
            function closeModal() {
                modal.remove();
            }
            
            closeButton.addEventListener('click', closeModal);
            cancelButton.addEventListener('click', closeModal);
            
            // Close on escape key
            function handleEscape(event) {
                if (event.key === 'Escape') {
                    closeModal();
                    document.removeEventListener('keydown', handleEscape);
                }
            }
            document.addEventListener('keydown', handleEscape);
            
            // Close when clicking outside modal
            modal.addEventListener('click', function(event) {
                if (event.target === modal) {
                    closeModal();
                }
            });
            
            // Focus on filter input
            filterInput.focus();
        }
    `;
}

module.exports = { getDataObjectSearchModalFunctionality };

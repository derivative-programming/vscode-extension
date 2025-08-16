"use strict";

/**
 * File: domInitialization.js
 * Purpose: Handles DOM initialization and setup for the report details view
 * Created: 2025-07-06
 */

/**
 * Handles DOM initialization and setup
 * @returns {string} JavaScript code as a string for DOM initialization
 */
function getDOMInitialization() {
    return `
    // Initialize styling for readonly/disabled inputs
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('[id^="setting-"]').forEach(input => {
            const isReadOnly = input.readOnly || input.disabled;
            updateInputStyle(input, !isReadOnly);
        });

        // Initialize button list view - hide details if no button is selected
        let buttonsList = document.getElementById('buttonsList');
        let buttonDetailsContainer = document.getElementById('buttonDetailsContainer');
        if (buttonsList && buttonDetailsContainer && (!buttonsList.value || buttonsList.value === "")) {
            buttonDetailsContainer.style.display = 'none';
        }

        // Initialize column list view - hide details if no column is selected
        let columnsList = document.getElementById('columnsList');
        let columnDetailsContainer = document.getElementById('columnDetailsContainer');
        if (columnsList && columnDetailsContainer && (!columnsList.value || columnsList.value === "")) {
            columnDetailsContainer.style.display = 'none';
        }

        // Initialize params list view - hide details if no param is selected
        let paramsList = document.getElementById('paramsList');
        let paramDetailsContainer = document.getElementById('paramDetailsContainer');
        if (paramsList && paramDetailsContainer && (!paramsList.value || paramsList.value === "")) {
            paramDetailsContainer.style.display = 'none';
        }
        
        // Initialize modal functionality
        setupColumnModal();
        setupButtonModal();
        setupParamModal();
        
        // Setup list button event handlers
        setupListButtonHandlers();
        
        // Set up page browse button event handlers for destinationTargetName fields
        setupPageBrowseButtonHandlers();
    });

    // Modal functionality for columns
    function setupColumnModal() {
        const modal = document.getElementById("column-modal");
        if (!modal) return;
        
        const closeBtn = modal.querySelector(".close");
        const cancelBtn = document.getElementById("cancel-column-btn");
        const form = document.getElementById("column-form");
        
        // Close modal on clicking X or Cancel
        if (closeBtn) {
            closeBtn.onclick = () => { modal.style.display = "none"; };
        }
        if (cancelBtn) {
            cancelBtn.onclick = () => { modal.style.display = "none"; };
        }
        
        // Close modal when clicking outside
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        };
        
        // Handle form submission
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                saveColumnChanges();
            };
        }
    }

    // Modal functionality for buttons
    function setupButtonModal() {
        const modal = document.getElementById("button-modal");
        if (!modal) return;
        
        const closeBtn = modal.querySelector(".close");
        const editCancelBtn = document.getElementById("cancel-button-btn");
        const addCancelBtn = document.getElementById("add-button-cancel-btn");
        const editForm = document.getElementById("button-form");
        const addSaveBtn = document.getElementById("add-button-save-btn");
        
        // Close modal on clicking X
        if (closeBtn) {
            closeBtn.onclick = () => { modal.style.display = "none"; };
        }
        
        // Close modal on clicking Cancel buttons
        if (editCancelBtn) {
            editCancelBtn.onclick = () => { modal.style.display = "none"; };
        }
        if (addCancelBtn) {
            addCancelBtn.onclick = () => { modal.style.display = "none"; };
        }
        
        // Handle edit form submission
        if (editForm) {
            editForm.onsubmit = (e) => {
                e.preventDefault();
                saveButtonChanges();
            };
        }
        
        // Handle add button save
        if (addSaveBtn) {
            addSaveBtn.onclick = () => {
                const buttonName = document.getElementById("button-name-input").value.trim();
                const errorElement = document.getElementById("button-name-validation-error");
                
                // Clear any previous errors first
                errorElement.textContent = "";
                
                // Trigger a custom event to handle the validation and saving
                const event = new CustomEvent('addButtonRequested', {
                    detail: { buttonName: buttonName, errorElement: errorElement }
                });
                document.dispatchEvent(event);
            };
        }
    }

    // Modal functionality for parameters
    function setupParamModal() {
        const modal = document.getElementById("param-modal");
        if (!modal) return;
        
        const closeBtn = modal.querySelector(".close");
        const cancelBtn = document.getElementById("cancel-param-btn");
        const form = document.getElementById("param-form");
        
        // Close modal on clicking X or Cancel
        if (closeBtn) {
            closeBtn.onclick = () => { modal.style.display = "none"; };
        }
        if (cancelBtn) {
            cancelBtn.onclick = () => { modal.style.display = "none"; };
        }
        
        // Handle form submission
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                saveParamChanges();
            };
        }
    }
    
    // Setup list button event handlers for Copy, Move Up, Move Down, Reverse and Add buttons
    function setupListButtonHandlers() {
        // Add button event handlers
        const addColumnBtn = document.getElementById('add-column-btn');
        const addButtonBtn = document.getElementById('add-button-btn');
        const addBreadcrumbBtn = document.getElementById('add-breadcrumb-btn');
        const addParamBtn = document.getElementById('add-param-btn');
        
        if (addColumnBtn) {
            addColumnBtn.addEventListener('click', function() {
                createAddColumnModal();
            });
        }
        
        if (addButtonBtn) {
            addButtonBtn.addEventListener('click', function() {
                createAddButtonModal();
            });
        }
        
        if (addBreadcrumbBtn) {
            addBreadcrumbBtn.addEventListener('click', function() {
                createAddBreadcrumbModal();
            });
        }
        
        if (addParamBtn) {
            addParamBtn.addEventListener('click', function() {
                createAddParamModal();
            });
        }
        
        // Columns list buttons
        const copyColumnsButton = document.getElementById('copyColumnsButton');
        const moveUpColumnsButton = document.getElementById('moveUpColumnsButton');
        const moveDownColumnsButton = document.getElementById('moveDownColumnsButton');
        const reverseColumnsButton = document.getElementById('reverseColumnsButton');
        const columnsList = document.getElementById('columnsList');
        
        if (copyColumnsButton) {
            copyColumnsButton.addEventListener('click', () => {
                try {
                    // Get all column names from the list
                    if (!columnsList) return;
                    
                    const columnList = [];
                    for (let i = 0; i < columnsList.options.length; i++) {
                        columnList.push(columnsList.options[i].text);
                    }
                    
                    // Create formatted text for copying
                    const textToCopy = columnList.join('\\n');
                    
                    // Copy to clipboard using the modern Clipboard API
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(textToCopy).then(() => {
                            console.log('Columns copied to clipboard');
                            // Provide visual feedback
                            const originalText = copyColumnsButton.textContent;
                            copyColumnsButton.textContent = 'Copied!';
                            setTimeout(() => {
                                copyColumnsButton.textContent = originalText;
                            }, 2000);
                        }).catch(err => {
                            console.error('Failed to copy columns: ', err);
                        });
                    } else {
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = textToCopy;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        
                        // Provide visual feedback
                        const originalText = copyColumnsButton.textContent;
                        copyColumnsButton.textContent = 'Copied!';
                        setTimeout(() => {
                            copyColumnsButton.textContent = originalText;
                        }, 2000);
                    }
                } catch (err) {
                    console.error('Error copying columns: ', err);
                }
            });
        }
        
        if (moveUpColumnsButton) {
            moveUpColumnsButton.addEventListener('click', () => {
                const selectedIndex = columnsList ? columnsList.selectedIndex : -1;
                if (selectedIndex > 0) {
                    vscode.postMessage({
                        command: 'moveColumn',
                        data: { fromIndex: selectedIndex, toIndex: selectedIndex - 1 }
                    });
                    
                    // Update selection to the new position and refresh button states
                    setTimeout(() => {
                        if (columnsList) {
                            columnsList.selectedIndex = selectedIndex - 1;
                            updateMoveButtonStates(columnsList, moveUpColumnsButton, moveDownColumnsButton);
                        }
                    }, 100);
                }
            });
        }
        
        if (moveDownColumnsButton) {
            moveDownColumnsButton.addEventListener('click', () => {
                const selectedIndex = columnsList ? columnsList.selectedIndex : -1;
                const listLength = columnsList ? columnsList.options.length : 0;
                if (selectedIndex >= 0 && selectedIndex < listLength - 1) {
                    vscode.postMessage({
                        command: 'moveColumn',
                        data: { fromIndex: selectedIndex, toIndex: selectedIndex + 1 }
                    });
                    
                    // Update selection to the new position and refresh button states
                    setTimeout(() => {
                        if (columnsList) {
                            columnsList.selectedIndex = selectedIndex + 1;
                            updateMoveButtonStates(columnsList, moveUpColumnsButton, moveDownColumnsButton);
                        }
                    }, 100);
                }
            });
        }
        
        if (reverseColumnsButton) {
            reverseColumnsButton.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'reverseColumn'
                });
            });
        }
        
        // Buttons list buttons
        const copyButtonsButton = document.getElementById('copyButtonsButton');
        const moveUpButtonsButton = document.getElementById('moveUpButtonsButton');
        const moveDownButtonsButton = document.getElementById('moveDownButtonsButton');
        const reverseButtonsButton = document.getElementById('reverseButtonsButton');
        const buttonsList = document.getElementById('buttonsList');
        
        if (copyButtonsButton) {
            copyButtonsButton.addEventListener('click', () => {
                try {
                    // Get all button names from the list
                    if (!buttonsList) return;
                    
                    const buttonList = [];
                    for (let i = 0; i < buttonsList.options.length; i++) {
                        buttonList.push(buttonsList.options[i].text);
                    }
                    
                    // Create formatted text for copying
                    const textToCopy = buttonList.join('\\n');
                    
                    // Copy to clipboard using the modern Clipboard API
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(textToCopy).then(() => {
                            console.log('Buttons copied to clipboard');
                            // Provide visual feedback
                            const originalText = copyButtonsButton.textContent;
                            copyButtonsButton.textContent = 'Copied!';
                            setTimeout(() => {
                                copyButtonsButton.textContent = originalText;
                            }, 2000);
                        }).catch(err => {
                            console.error('Failed to copy buttons: ', err);
                        });
                    } else {
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = textToCopy;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        
                        // Provide visual feedback
                        const originalText = copyButtonsButton.textContent;
                        copyButtonsButton.textContent = 'Copied!';
                        setTimeout(() => {
                            copyButtonsButton.textContent = originalText;
                        }, 2000);
                    }
                } catch (err) {
                    console.error('Error copying buttons: ', err);
                }
            });
        }
        
        if (moveUpButtonsButton) {
            moveUpButtonsButton.addEventListener('click', () => {
                const selectedIndex = buttonsList ? buttonsList.selectedIndex : -1;
                if (selectedIndex > 0) {
                    vscode.postMessage({
                        command: 'moveButton',
                        data: { fromIndex: selectedIndex, toIndex: selectedIndex - 1 }
                    });
                    
                    // Update selection to the new position and refresh button states
                    setTimeout(() => {
                        if (buttonsList) {
                            buttonsList.selectedIndex = selectedIndex - 1;
                            updateMoveButtonStates(buttonsList, moveUpButtonsButton, moveDownButtonsButton);
                        }
                    }, 100);
                }
            });
        }
        
        if (moveDownButtonsButton) {
            moveDownButtonsButton.addEventListener('click', () => {
                const selectedIndex = buttonsList ? buttonsList.selectedIndex : -1;
                const listLength = buttonsList ? buttonsList.options.length : 0;
                if (selectedIndex >= 0 && selectedIndex < listLength - 1) {
                    vscode.postMessage({
                        command: 'moveButton',
                        data: { fromIndex: selectedIndex, toIndex: selectedIndex + 1 }
                    });
                    
                    // Update selection to the new position and refresh button states
                    setTimeout(() => {
                        if (buttonsList) {
                            buttonsList.selectedIndex = selectedIndex + 1;
                            updateMoveButtonStates(buttonsList, moveUpButtonsButton, moveDownButtonsButton);
                        }
                    }, 100);
                }
            });
        }
        
        if (reverseButtonsButton) {
            reverseButtonsButton.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'reverseButton'
                });
            });
        }
        
        // Parameters (Filters) list buttons
        const copyParamsButton = document.getElementById('copyParamsButton');
        const moveUpParamsButton = document.getElementById('moveUpParamsButton');
        const moveDownParamsButton = document.getElementById('moveDownParamsButton');
        const reverseParamsButton = document.getElementById('reverseParamsButton');
        const paramsList = document.getElementById('paramsList');
        
        if (copyParamsButton) {
            copyParamsButton.addEventListener('click', () => {
                try {
                    // Get all parameter names from the list
                    if (!paramsList) return;
                    
                    const paramList = [];
                    for (let i = 0; i < paramsList.options.length; i++) {
                        paramList.push(paramsList.options[i].text);
                    }
                    
                    // Create formatted text for copying
                    const textToCopy = paramList.join('\\n');
                    
                    // Copy to clipboard using the modern Clipboard API
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(textToCopy).then(() => {
                            console.log('Parameters copied to clipboard');
                            // Provide visual feedback
                            const originalText = copyParamsButton.textContent;
                            copyParamsButton.textContent = 'Copied!';
                            setTimeout(() => {
                                copyParamsButton.textContent = originalText;
                            }, 2000);
                        }).catch(err => {
                            console.error('Failed to copy parameters: ', err);
                        });
                    } else {
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = textToCopy;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        
                        // Provide visual feedback
                        const originalText = copyParamsButton.textContent;
                        copyParamsButton.textContent = 'Copied!';
                        setTimeout(() => {
                            copyParamsButton.textContent = originalText;
                        }, 2000);
                    }
                } catch (err) {
                    console.error('Error copying parameters: ', err);
                }
            });
        }
        
        if (moveUpParamsButton) {
            moveUpParamsButton.addEventListener('click', () => {
                const selectedIndex = paramsList ? paramsList.selectedIndex : -1;
                if (selectedIndex > 0) {
                    vscode.postMessage({
                        command: 'moveParam',
                        data: { fromIndex: selectedIndex, toIndex: selectedIndex - 1 }
                    });
                    
                    // Update selection to the new position and refresh button states
                    setTimeout(() => {
                        if (paramsList) {
                            paramsList.selectedIndex = selectedIndex - 1;
                            updateMoveButtonStates(paramsList, moveUpParamsButton, moveDownParamsButton);
                        }
                    }, 100);
                }
            });
        }
        
        if (moveDownParamsButton) {
            moveDownParamsButton.addEventListener('click', () => {
                const selectedIndex = paramsList ? paramsList.selectedIndex : -1;
                const listLength = paramsList ? paramsList.options.length : 0;
                if (selectedIndex >= 0 && selectedIndex < listLength - 1) {
                    vscode.postMessage({
                        command: 'moveParam',
                        data: { fromIndex: selectedIndex, toIndex: selectedIndex + 1 }
                    });
                    
                    // Update selection to the new position and refresh button states
                    setTimeout(() => {
                        if (paramsList) {
                            paramsList.selectedIndex = selectedIndex + 1;
                            updateMoveButtonStates(paramsList, moveUpParamsButton, moveDownParamsButton);
                        }
                    }, 100);
                }
            });
        }
        
        if (reverseParamsButton) {
            reverseParamsButton.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'reverseParam'
                });
            });
        }
        
        // Initialize move button states and add change listeners
        // This needs to be done after DOM is ready and updateMoveButtonStates is available
        setTimeout(() => {
            if (typeof updateMoveButtonStates === 'function') {
                // Columns
                if (columnsList && moveUpColumnsButton && moveDownColumnsButton) {
                    updateMoveButtonStates(columnsList, moveUpColumnsButton, moveDownColumnsButton);
                    columnsList.addEventListener('change', () => {
                        updateMoveButtonStates(columnsList, moveUpColumnsButton, moveDownColumnsButton);
                    });
                }
                
                // Buttons
                if (buttonsList && moveUpButtonsButton && moveDownButtonsButton) {
                    updateMoveButtonStates(buttonsList, moveUpButtonsButton, moveDownButtonsButton);
                    buttonsList.addEventListener('change', () => {
                        updateMoveButtonStates(buttonsList, moveUpButtonsButton, moveDownButtonsButton);
                    });
                }
                
                // Parameters
                if (paramsList && moveUpParamsButton && moveDownParamsButton) {
                    updateMoveButtonStates(paramsList, moveUpParamsButton, moveDownParamsButton);
                    paramsList.addEventListener('change', () => {
                        updateMoveButtonStates(paramsList, moveUpParamsButton, moveDownParamsButton);
                    });
                }
            }
        }, 100);
    }
    
    // Setup page browse button handlers for destinationTargetName fields
    function setupPageBrowseButtonHandlers() {
        // Use event delegation to handle lookup buttons for destinationTargetName fields
        document.addEventListener('click', (event) => {
            if (event.target.closest('.lookup-button')) {
                const button = event.target.closest('.lookup-button');
                if (button.disabled) return;
                
                const propKey = button.getAttribute('data-prop');
                if (propKey === 'destinationTargetName') {
                    // Find the corresponding input field
                    let inputField = button.parentElement.querySelector('input[type="text"]');
                    
                    // If not found (list view), try using data-field-id
                    if (!inputField) {
                        const fieldId = button.getAttribute('data-field-id');
                        if (fieldId) {
                            inputField = document.getElementById(fieldId);
                        }
                    }
                    
                    if (inputField) {
                        const currentValue = inputField.value;
                        createPageSearchModal(currentValue, inputField);
                    }
                } else if (propKey === 'targetChildObject') {
                    // Handle data object browse functionality for settings tab
                    let inputField = button.parentElement.querySelector('input[type="text"]');
                    
                    // If not found, try using data-field-id
                    if (!inputField) {
                        const fieldId = button.getAttribute('data-field-id');
                        if (fieldId) {
                            inputField = document.getElementById(fieldId);
                        }
                    }
                    
                    if (inputField) {
                        const currentValue = inputField.value;
                        createDataObjectSearchModal(currentValue, inputField);
                    }
                }
            }
        });
    }
    `;
}

module.exports = {
    getDOMInitialization
};

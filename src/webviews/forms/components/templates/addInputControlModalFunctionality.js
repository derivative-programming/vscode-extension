"use strict";

/**
 * File: addInputControlModalFunctionality.js
 * Purpose: Provides modal functionality for the Add Input Control modal in forms
 * Created: 2025-01-27
 */

/**
 * Creates the JavaScript functionality for the Add Input Control modal
 * @returns {string} JavaScript code as a string for the modal functionality
 */
function getAddInputControlModalFunctionality() {
    return `
// Function to create and show the Add Input Control modal
function createAddInputControlModal() {
    // Create modal dialog for adding input controls
    const modal = document.createElement("div");
    modal.className = "modal";
    
    // Import the modal HTML template
    const modalContent = getAddInputControlModalHtml();
    
    // Set the modal content
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Show the modal
    setTimeout(() => {
        modal.style.display = "flex";
        // Focus on the input control name input when modal opens (single input control tab is active by default)
        const inputControlNameInput = modal.querySelector("#inputControlName");
        if (inputControlNameInput) {
            inputControlNameInput.focus();
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
            
            // Set focus based on which tab is now active
            setTimeout(() => {
                if (tabId === 'singleAdd') {
                    const inputControlNameInput = modal.querySelector("#inputControlName");
                    if (inputControlNameInput) {
                        inputControlNameInput.focus();
                    }
                } else if (tabId === 'bulkAdd') {
                    const bulkInputControlsTextarea = modal.querySelector("#bulkInputControls");
                    if (bulkInputControlsTextarea) {
                        bulkInputControlsTextarea.focus();
                    }
                } else if (tabId === 'availProps') {
                    console.log('[DEBUG] Available Properties tab activated');
                    // Load available properties when this tab is activated
                    loadAvailableProperties(modal);
                } else if (tabId === 'lookups') {
                    console.log('[DEBUG] Lookups tab activated');
                    // Load lookup objects when this tab is activated
                    loadLookupObjects(modal);
                }
            }, 10);
        });
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
    
    // Add Enter key handling for single input control input
    const inputControlNameInput = modal.querySelector("#inputControlName");
    if (inputControlNameInput) {
        inputControlNameInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault(); // Prevent default Enter behavior
                const addButton = modal.querySelector("#addSingleInputControl");
                if (addButton && !addButton.disabled) {
                    addButton.click();
                }
            }
        });
    }
    
    // Validate input control name
    function validateInputControlName(name) {
        if (!name) {
            return "Input control name cannot be empty";
        }
        if (name.length > 100) {
            return "Input control name cannot exceed 100 characters";
        }
        if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
            return "Input control name must start with a letter and contain only letters and numbers";
        }
        if (currentParams.some(param => param.name === name)) {
            return "Input control with this name already exists";
        }
        return null; // Valid
    }
    
    // Add single input control button event listener
    modal.querySelector("#addSingleInputControl").addEventListener("click", function() {
        const inputControlName = modal.querySelector("#inputControlName").value.trim();
        const errorElement = modal.querySelector("#singleValidationError");
        
        const validationError = validateInputControlName(inputControlName);
        if (validationError) {
            errorElement.textContent = validationError;
            return;
        }
        
        // Add the new input control by sending individual add commands
        addNewInputControl(inputControlName);
        
        // Close the modal
        document.body.removeChild(modal);
    });
    
    // Add bulk input controls button event listener
    modal.querySelector("#addBulkInputControls").addEventListener("click", function() {
        const bulkInputControls = modal.querySelector("#bulkInputControls").value;
        const inputControlNames = bulkInputControls.split("\\n").map(name => name.trim()).filter(name => name);
        const errorElement = modal.querySelector("#bulkValidationError");
        
        // Validate all input control names
        const errors = [];
        const validInputControls = [];
        
        inputControlNames.forEach(name => {
            const validationError = validateInputControlName(name);
            if (validationError) {
                errors.push("\\"" + name + "\\": " + validationError);
            } else {
                validInputControls.push(name);
            }
        });
        
        if (errors.length > 0) {
            errorElement.innerHTML = errors.join("<br>");
            return;
        }
        
        // Add all valid input controls using individual commands
        validInputControls.forEach(name => {
            addNewInputControl(name);
        });
        
        // Close the modal
        document.body.removeChild(modal);
    });
    
    // Add selected properties button event listener
    const addPropsButton = modal.querySelector("#addSelectedProps");
    if (addPropsButton) {
        addPropsButton.addEventListener("click", function() {
            const selectedCheckboxes = modal.querySelectorAll('#availPropsContainer input[type="checkbox"]:checked');
            const errorElement = modal.querySelector("#propsValidationError");
            
            if (selectedCheckboxes.length === 0) {
                errorElement.textContent = "Please select at least one property.";
                return;
            }
            
            // Clear any previous error
            errorElement.textContent = "";
            
            try {
                console.log('[DEBUG] Adding property-based input controls');
                
                // First, collect all input control data to be created and check for duplicates
                const controlsToAdd = [];
                const duplicateControls = [];
                
                selectedCheckboxes.forEach(checkbox => {
                    const objectName = checkbox.getAttribute('data-object-name');
                    const propertyName = checkbox.getAttribute('data-property-name');
                    const dataType = checkbox.getAttribute('data-data-type');
                    const dataSize = checkbox.getAttribute('data-data-size');
                    const fullPath = checkbox.getAttribute('data-full-path');
                    const labelText = checkbox.getAttribute('data-label-text');
                    const isFKLookup = checkbox.getAttribute('data-is-fk-lookup') === 'true';
                    const fKObjectName = checkbox.getAttribute('data-fk-object-name');
                    
                    console.log('[DEBUG] Processing checkbox attributes:', {
                        objectName,
                        propertyName,
                        labelText,
                        fullPath,
                        rawLabelTextAttr: checkbox.getAttribute('data-label-text'),
                        labelTextLength: labelText ? labelText.length : 'null/undefined',
                        labelTextType: typeof labelText,
                        labelTextTrimmed: labelText && labelText.trim ? labelText.trim() : 'cannot trim'
                    });
                    
                    // For forms, we only handle regular properties (no lookup properties)
                    const controlName = objectName + propertyName;
                    const sourceObjName = objectName;
                    const sourcePropName = propertyName;
                    
                    // Check if input control already exists
                    const existingControls = getCurrentInputControls();
                    const controlExists = existingControls.some(ctrl => ctrl.name === controlName);
                    
                    if (controlExists) {
                        duplicateControls.push(controlName);
                    } else {
                        const controlData = {
                            name: controlName,
                            sourceObjectName: sourceObjName,
                            sourcePropertyName: sourcePropName,
                            sqlServerDBDataType: dataType || '',
                            sqlServerDBDataTypeSize: dataSize || '',
                            labelText: labelText && labelText.trim() ? labelText.trim() : propertyName, // Use labelText if it has content, otherwise use property name
                            isVisible: 'true' // Default to visible
                        };
                        
                        console.log('[DEBUG] Creating control data with labelText:', {
                            controlName: controlName,
                            rawLabelText: labelText,
                            rawLabelTextType: typeof labelText,
                            rawLabelTextLength: labelText ? labelText.length : 'null/undefined',
                            trimmedLabelText: labelText && labelText.trim ? labelText.trim() : labelText,
                            hasLabelTextContent: !!(labelText && labelText.trim && labelText.trim()),
                            fullPath: fullPath,
                            propertyName: propertyName,
                            finalLabelText: labelText && labelText.trim() ? labelText.trim() : propertyName,
                            willUseLabelText: !!(labelText && labelText.trim && labelText.trim())
                        });
                        
                        // Add FK properties if this is a FK lookup property
                        if (isFKLookup) {
                            controlData.isFKLookup = 'true';
                            controlData.fKObjectName = fKObjectName || '';
                            controlData.isFKList = 'false'; // Default value for FK list
                        }
                        
                        controlsToAdd.push(controlData);
                    }
                });
                
                // Show validation error if there are duplicates
                if (duplicateControls.length > 0) {
                    errorElement.textContent = "The following input controls already exist: " + duplicateControls.join(", ");
                    return;
                }
                
                console.log('[DEBUG] No duplicates found, proceeding with', controlsToAdd.length, 'controls');
                
                // Add all valid input controls with full property data
                controlsToAdd.forEach(controlData => {
                    addNewInputControlWithData(controlData);
                });
                
                // Close the modal
                document.body.removeChild(modal);
            } catch (error) {
                console.error("Error adding property-based input controls:", error);
                errorElement.textContent = "Error adding input controls. Please try again.";
            }
        });
    }
    
    // Add selected lookups button event listener
    const addLookupsButton = modal.querySelector("#addSelectedLookups");
    if (addLookupsButton) {
        addLookupsButton.addEventListener("click", function() {
            const selectedCheckboxes = modal.querySelectorAll('#lookupsContainer input[type="checkbox"]:checked');
            const errorElement = modal.querySelector("#lookupsValidationError");
            
            if (selectedCheckboxes.length === 0) {
                errorElement.textContent = "Please select at least one lookup object.";
                return;
            }
            
            // Clear any previous error
            errorElement.textContent = "";
            
            try {
                console.log('[DEBUG] Adding lookup-based input controls');
                
                // First, collect all lookup input control data to be created and check for duplicates
                const lookupsToAdd = [];
                const duplicateLookups = [];
                
                selectedCheckboxes.forEach(checkbox => {
                    const lookupObjectName = checkbox.getAttribute('data-lookup-object-name');
                    const controlName = lookupObjectName + 'Code';
                    
                    console.log('[DEBUG] Processing lookup object:', lookupObjectName, 'control name:', controlName);
                    
                    // Check if input control already exists
                    const existingControls = getCurrentInputControls();
                    const controlExists = existingControls.some(ctrl => ctrl.name === controlName);
                    
                    if (controlExists) {
                        duplicateLookups.push(controlName);
                    } else {
                        lookupsToAdd.push({
                            lookupObjectName: lookupObjectName,
                            controlName: controlName
                        });
                    }
                });
                
                // Show validation error if there are duplicates
                if (duplicateLookups.length > 0) {
                    errorElement.textContent = "The following input controls already exist: " + duplicateLookups.join(", ");
                    return;
                }
                
                console.log('[DEBUG] No duplicates found, proceeding with', lookupsToAdd.length, 'lookup controls');
                
                // Process each selected lookup object
                lookupsToAdd.forEach(lookupItem => {
                    // Create lookup data for the backend
                    const lookupData = {
                        lookupObjectName: lookupItem.lookupObjectName
                    };
                    
                    // Add the lookup input control
                    addNewInputControlWithLookupData(lookupData);
                });
                
                // Close the modal
                document.body.removeChild(modal);
            } catch (error) {
                console.error("Error adding lookup-based input controls:", error);
                errorElement.textContent = "Error adding lookup input controls. Please try again.";
            }
        });
    }
}

// Function to add a new input control (called from add input control modal)
function addNewInputControl(inputControlName) {
    // Send message to add a new parameter with the specified name
    vscode.postMessage({
        command: 'addParamWithName',
        data: {
            name: inputControlName
        }
    });
}

// Function to add a new input control with full property data (called from property-based addition)
function addNewInputControlWithData(controlData) {
    // Send message to add a new parameter with full property data
    vscode.postMessage({
        command: 'addParamWithData',
        data: controlData
    });
}

// Function to add a new input control with lookup FK data (called from lookup-based addition)
function addNewInputControlWithLookupData(lookupData) {
    // Send message to add a new parameter with lookup FK data
    vscode.postMessage({
        command: 'addParamWithLookupData',
        data: lookupData
    });
}

// Function to load available properties into the modal
function loadAvailableProperties(modal) {
    console.log('[DEBUG] Loading available properties for form');
    console.log('[DEBUG] Modal exists:', !!modal);
    console.log('[DEBUG] vscode API exists:', !!vscode);
    
    // Request available properties from the backend
    vscode.postMessage({
        command: 'getAvailablePropertiesForForm',
        data: {}
    });
    
    console.log('[DEBUG] Sent getAvailablePropertiesForForm message to backend');
    
    // Note: The response will be handled in the message listener
    // and will call populateAvailableProperties function
}

// Function to populate the properties container
function populateAvailableProperties(propertiesData) {
    console.log('[DEBUG] populateAvailableProperties called with data:', propertiesData);
    console.log('[DEBUG] Properties data length:', propertiesData ? propertiesData.length : 0);
    console.log('[DEBUG] Properties data structure:', propertiesData);
    
    const container = document.querySelector('#availPropsContainer');
    console.log('[DEBUG] Properties container found:', !!container);
    
    if (!container) {
        console.error('[DEBUG] Properties container not found!');
        return;
    }
    
    let html = '';
    
    if (!propertiesData || propertiesData.length === 0) {
        html = '<div style="padding: 20px; text-align: center; color: var(--vscode-descriptionForeground);">No properties available for this form.</div>';
        console.log('[DEBUG] No properties data available');
    } else {
        propertiesData.forEach((objectData, objectIndex) => {
            console.log('[DEBUG] Processing object ' + objectIndex + ':', objectData.objectName, 'with', objectData.properties ? objectData.properties.length : 0, 'properties');
            
            if (objectData.properties && objectData.properties.length > 0) {
                html += '<div class="object-group">';
                html += '<h4 class="object-header">' + objectData.objectName + '</h4>';
                
                objectData.properties.forEach((prop, propIndex) => {
                    console.log('[DEBUG] Processing property ' + propIndex + ':', prop.name, prop.dataType);
                    console.log('[DEBUG] Property labelText value:', prop.labelText);
                    console.log('[DEBUG] Property object:', prop);
                    
                    const checkboxId = 'prop_' + objectData.objectName + '_' + prop.name.replace(/\./g, '_');
                    const displayText = prop.labelText || prop.fullPath || (objectData.objectName + '.' + prop.name);
                    const dataTypeInfo = prop.dataType ? ' (' + prop.dataType + (prop.dataSize ? '(' + prop.dataSize + ')' : '') + ')' : '';
                    
                    console.log('[DEBUG] Display text for property:', displayText);
                    console.log('[DEBUG] Data attribute labelText will be:', (prop.labelText || ''));
                    
                    html += '<div class="property-item">';
                    html += '<input type="checkbox" class="property-checkbox" id="' + checkboxId + '"';
                    html += ' data-object-name="' + objectData.objectName + '"';
                    html += ' data-property-name="' + prop.name + '"';
                    html += ' data-full-path="' + (prop.fullPath || '') + '"';
                    html += ' data-label-text="' + (prop.labelText || '') + '"';
                    html += ' data-data-type="' + (prop.dataType || '') + '"';
                    html += ' data-data-size="' + (prop.dataSize || '') + '"';
                    html += ' data-is-fk-lookup="' + (prop.isFKLookup ? 'true' : 'false') + '"';
                    html += ' data-fk-object-name="' + (prop.fKObjectName || '') + '"';
                    html += '>';
                    html += '<label for="' + checkboxId + '" class="property-name">' + displayText + '</label>';
                    html += '<span class="property-type">' + dataTypeInfo + '</span>';
                    
                    if (prop.isFKLookup) {
                        html += '<span class="fk-lookup-indicator">FK</span>';
                    }
                    
                    html += '</div>';
                });
                
                html += '</div>';
            }
        });
    }
    
    container.innerHTML = html;
    console.log('[DEBUG] Properties container populated with HTML length:', html.length);
    console.log('[DEBUG] Container content preview:', html.substring(0, 200));
}

// Function to get current form input controls for validation
function getCurrentInputControls() {
    try {
        // First try to get from global currentParams variable
        if (typeof currentParams !== 'undefined' && Array.isArray(currentParams)) {
            console.log('[DEBUG] Using currentParams variable:', currentParams);
            return currentParams;
        }
        
        // Fallback: Get from the current list view
        const paramsList = document.getElementById('paramsList');
        const controls = [];
        
        console.log('[DEBUG] Getting current params, paramsList:', paramsList);
        
        if (paramsList && paramsList.options) {
            console.log('[DEBUG] Found paramsList with', paramsList.options.length, 'options');
            for (let i = 0; i < paramsList.options.length; i++) {
                const option = paramsList.options[i];
                console.log('[DEBUG] Param option:', option.value, option.text);
                controls.push({ name: option.value });
            }
        } else {
            console.warn('[DEBUG] paramsList not found or has no options');
        }
        
        console.log('[DEBUG] Returning controls:', controls);
        return controls;
    } catch (error) {
        console.error("Error getting current input controls:", error);
        return [];
    }
}

// Function to load lookup objects into the modal
function loadLookupObjects(modal) {
    console.log('[DEBUG] Loading lookup objects for form');
    console.log('[DEBUG] Modal exists:', !!modal);
    console.log('[DEBUG] vscode API exists:', !!vscode);
    
    // Request lookup objects from the backend
    vscode.postMessage({
        command: 'getLookupObjectsForForm',
        data: {}
    });
    
    console.log('[DEBUG] Sent getLookupObjectsForForm message to backend');
    
    // Note: The response will be handled in the message listener
    // and will call populateLookupObjects function
}

// Function to populate the lookup objects container
function populateLookupObjects(lookupData) {
    console.log('[DEBUG] populateLookupObjects called with data:', lookupData);
    console.log('[DEBUG] Lookup data length:', lookupData ? lookupData.length : 0);
    
    const container = document.querySelector('#lookupsContainer');
    console.log('[DEBUG] Lookups container found:', !!container);
    
    if (!container) {
        console.error('[DEBUG] Lookups container not found!');
        return;
    }
    
    let html = '';
    
    if (!lookupData || lookupData.length === 0) {
        html = '<div style="padding: 20px; text-align: center; color: var(--vscode-descriptionForeground);">No lookup objects available.</div>';
    } else {
        // Group by object type if needed, for now show all in one list
        html = '<div class="checkbox-grid">';
        
        lookupData.forEach(lookup => {
            const lookupObjectName = lookup.name || lookup.objectName;
            const description = lookup.description || '';
            
            html += \`
                <div class="checkbox-item">
                    <input type="checkbox" 
                           data-lookup-object-name="\${lookupObjectName}"
                           id="lookup_\${lookupObjectName}">
                    <label for="lookup_\${lookupObjectName}" class="property-name">\${lookupObjectName}</label>
                    \${description ? \`<span class="property-description">\${description}</span>\` : ''}
                </div>
            \`;
        });
        
        html += '</div>';
    }
    
    container.innerHTML = html;
    console.log('[DEBUG] Lookup objects populated, HTML length:', html.length);
}

// Make functions available globally for client script message handler
window.populateAvailableProperties = populateAvailableProperties;
window.populateLookupObjects = populateLookupObjects;
`;
}

module.exports = {
    getAddInputControlModalFunctionality
};

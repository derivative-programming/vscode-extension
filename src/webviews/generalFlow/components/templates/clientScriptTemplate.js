"use strict";
// generalFlow clientScriptTemplate - matching Page Init approach exactly

const { getAddInputControlModalHtml, getAddOutputVariableModalHtml } = require("./modalTemplates");
const { getDataObjectSearchModalHtml } = require("./dataObjectSearchModalTemplate");
const { getDataObjectSearchModalFunctionality } = require("./dataObjectSearchModalFunctionality");

/**
 * Generates JavaScript code for client-side functionality of General Flow view
 * Following the exact same pattern as Page Init for consistency
 */
function getClientScriptTemplate(params, outputVars, paramSchema, outputVarSchema, flowName, allDataObjects = []) {
    return `
        (function() {
            // Store current data (matching Page Init)
            let currentParams = ${JSON.stringify(params)};
            let currentOutputVars = ${JSON.stringify(outputVars)};

            // Schema data
            const paramSchema = ${JSON.stringify(paramSchema)};
            const outputVarSchema = ${JSON.stringify(outputVarSchema)};
            const flowName = ${JSON.stringify(flowName)};
            const allDataObjects = ${JSON.stringify(allDataObjects)};

            // Basic modal behavior (exact match to Page Init)
            const modal = { el: null };
            function openModal() {
                if (!modal.el) { modal.el = document.getElementById('addModal'); }
                if (modal.el) { modal.el.style.display = 'block'; }
            }
            function closeModal() {
                if (!modal.el) { modal.el = document.getElementById('addModal'); }
                if (modal.el) { modal.el.style.display = 'none'; }
            }

            document.addEventListener('click', (e) => {
                if (e.target && e.target.classList && e.target.classList.contains('close-button')) { closeModal(); }
            });

            // Add Input Param Modal Template Function
            function getAddInputControlModalHtml() {
                return \`${getAddInputControlModalHtml()}\`;
            }

            // Add Output Variable Modal Template Function  
            function getAddOutputVariableModalHtml() {
                return \`${getAddOutputVariableModalHtml()}\`;
            }

            // Data Object Search Modal Template Function
            function getDataObjectSearchModalHtml() {
                return \`${getDataObjectSearchModalHtml()}\`;
            }

            // Function to create and show the Add Input Param modal (matching Page Init pattern)
            function createAddInputControlModal() {
                // Create modal dialog for adding input params
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
                    // Focus on the input param name input when modal opens (single input param tab is active by default)
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
                
                // Add Enter key handling for single input param input
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
                
                // Validate input param name
                function validateInputControlName(name) {
                    if (!name) {
                        return "Input param name cannot be empty";
                    }
                    if (name.length > 100) {
                        return "Input param name cannot exceed 100 characters";
                    }
                    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
                        return "Input param name must start with a letter and contain only letters and numbers";
                    }
                    if (currentParams.some(param => param.name === name)) {
                        return "Input param with this name already exists";
                    }
                    return null; // Valid
                }
                
                // Function to add a new input param (called from add input param modal)
                function addNewInputControl(inputControlName) {
                    // Send message to add a new input param with the specified name
                    vscode.postMessage({
                        command: 'addParamWithName',
                        data: {
                            name: inputControlName
                        }
                    });
                }
                
                // Add single input param button event listener
                modal.querySelector("#addSingleInputControl").addEventListener("click", function() {
                    const inputControlName = modal.querySelector("#inputControlName").value.trim();
                    const errorElement = modal.querySelector("#singleValidationError");
                    
                    const validationError = validateInputControlName(inputControlName);
                    if (validationError) {
                        errorElement.textContent = validationError;
                        return;
                    }
                    
                    // Add the new input param by sending individual add commands
                    addNewInputControl(inputControlName);
                    
                    // Close the modal
                    document.body.removeChild(modal);
                });
                
                // Add bulk input params button event listener
                modal.querySelector("#addBulkInputControls").addEventListener("click", function() {
                    const bulkInputControls = modal.querySelector("#bulkInputControls").value;
                    const inputControlNames = bulkInputControls.split("\\n").map(name => name.trim()).filter(name => name);
                    const errorElement = modal.querySelector("#bulkValidationError");
                    
                    // Validate all input param names
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
                    
                    // Add all valid input params using individual commands
                    validInputControls.forEach(name => {
                        addNewInputControl(name);
                    });
                    
                    // Close the modal
                    document.body.removeChild(modal);
                });
            }

            // Function to create and show the Add Output Variable modal (exact match to Page Init pattern)
            function createAddOutputVariableModal() {
                // Create modal dialog for adding output variables
                const modal = document.createElement("div");
                modal.className = "modal";
                
                // Import the modal HTML template
                const modalContent = getAddOutputVariableModalHtml();
                
                // Set the modal content
                modal.innerHTML = modalContent;
                document.body.appendChild(modal);
                
                // Show the modal
                setTimeout(() => {
                    modal.style.display = "flex";
                    // Focus on the output variable name input when modal opens (single output variable tab is active by default)
                    const outputVariableNameInput = modal.querySelector("#outputVariableName");
                    if (outputVariableNameInput) {
                        outputVariableNameInput.focus();
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
                                const outputVariableNameInput = modal.querySelector("#outputVariableName");
                                if (outputVariableNameInput) {
                                    outputVariableNameInput.focus();
                                }
                            } else if (tabId === 'bulkAdd') {
                                const bulkOutputVariablesTextarea = modal.querySelector("#bulkOutputVariables");
                                if (bulkOutputVariablesTextarea) {
                                    bulkOutputVariablesTextarea.focus();
                                }
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
                
                // Add Enter key handling for single output variable input
                const outputVariableNameInput = modal.querySelector("#outputVariableName");
                if (outputVariableNameInput) {
                    outputVariableNameInput.addEventListener("keypress", function(event) {
                        if (event.key === "Enter") {
                            event.preventDefault(); // Prevent default Enter behavior
                            const addButton = modal.querySelector("#addSingleOutputVariable");
                            if (addButton && !addButton.disabled) {
                                addButton.click();
                            }
                        }
                    });
                }
                
                // Validate output variable name
                function validateOutputVariableName(name) {
                    if (!name) {
                        return "Output variable name cannot be empty";
                    }
                    if (name.length > 100) {
                        return "Output variable name cannot exceed 100 characters";
                    }
                    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
                        return "Output variable name must start with a letter and contain only letters and numbers";
                    }
                    if (currentOutputVars.some(outputVar => outputVar.name === name)) {
                        return "Output variable with this name already exists";
                    }
                    return null; // Valid
                }
                
                // Function to add a new output variable (called from add output variable modal)
                function addNewOutputVariable(outputVariableName) {
                    // Send message to add a new output variable with the specified name
                    vscode.postMessage({
                        command: 'addOutputVarWithName',
                        data: {
                            name: outputVariableName
                        }
                    });
                }
                
                // Add single output variable button event listener
                modal.querySelector("#addSingleOutputVariable").addEventListener("click", function() {
                    const outputVariableName = modal.querySelector("#outputVariableName").value.trim();
                    const errorElement = modal.querySelector("#singleValidationError");
                    
                    const validationError = validateOutputVariableName(outputVariableName);
                    if (validationError) {
                        errorElement.textContent = validationError;
                        return;
                    }
                    
                    // Add the new output variable by sending individual add commands
                    addNewOutputVariable(outputVariableName);
                    
                    // Close the modal
                    document.body.removeChild(modal);
                });
                
                // Add bulk output variables button event listener
                modal.querySelector("#addBulkOutputVariables").addEventListener("click", function() {
                    const bulkOutputVariables = modal.querySelector("#bulkOutputVariables").value;
                    const outputVariableNames = bulkOutputVariables.split("\\n").map(name => name.trim()).filter(name => name);
                    const errorElement = modal.querySelector("#bulkValidationError");
                    
                    // Validate all output variable names
                    const errors = [];
                    const validOutputVariables = [];
                    
                    outputVariableNames.forEach(name => {
                        const validationError = validateOutputVariableName(name);
                        if (validationError) {
                            errors.push("\\"" + name + "\\": " + validationError);
                        } else {
                            validOutputVariables.push(name);
                        }
                    });
                    
                    if (errors.length > 0) {
                        errorElement.innerHTML = errors.join("<br>");
                        return;
                    }
                    
                    // Add all valid output variables using individual commands
                    validOutputVariables.forEach(name => {
                        addNewOutputVariable(name);
                    });
                    
                    // Close the modal
                    document.body.removeChild(modal);
                });
            }

            // Copy General Flow Name Function (exact match to Page Init)
            function copyGeneralFlowName(flowName) {
                console.log('[DEBUG] GeneralFlowDetails - Copy flow name requested for:', JSON.stringify(flowName));
                
                if (!flowName) {
                    console.warn('[WARN] GeneralFlowDetails - Cannot copy: flow name not available');
                    return;
                }
                
                try {
                    // Copy to clipboard using the modern Clipboard API
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(flowName).then(() => {
                            console.log('General Flow name copied to clipboard:', flowName);
                            // Provide visual feedback
                            const copyButton = document.querySelector('.copy-general-flow-name-button .codicon');
                            if (copyButton) {
                                const originalClass = copyButton.className;
                                copyButton.className = 'codicon codicon-check';
                                setTimeout(() => {
                                    copyButton.className = originalClass;
                                }, 2000);
                            }
                        }).catch(err => {
                            console.error('Failed to copy General Flow name: ', err);
                        });
                    } else {
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = flowName;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        
                        // Provide visual feedback
                        const copyButton = document.querySelector('.copy-general-flow-name-button .codicon');
                        if (copyButton) {
                            const originalClass = copyButton.className;
                            copyButton.className = 'codicon codicon-check';
                            setTimeout(() => {
                                copyButton.className = originalClass;
                            }, 2000);
                        }
                    }
                } catch (err) {
                    console.error('Error copying General Flow name: ', err);
                }
            }

            // Make copyGeneralFlowName function globally available
            window.copyGeneralFlowName = copyGeneralFlowName;

            // Owner Object Details Function
            function openOwnerObjectDetails(objectName) {
                console.log('[DEBUG] GeneralFlowDetails - Open owner object details requested for object name:', JSON.stringify(objectName));
                
                if (vscode && objectName) {
                    vscode.postMessage({
                        command: 'openOwnerObjectDetails',
                        objectName: objectName
                    });
                } else {
                    console.warn('[WARN] GeneralFlowDetails - Cannot open owner object details: vscode API or object name not available');
                }
            }

            // Make openOwnerObjectDetails function globally available
            window.openOwnerObjectDetails = openOwnerObjectDetails;

            // Tab switching functionality (exact match to Page Init)
            function activateTab(tabName) {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                const tab = document.querySelector('.tab[data-tab="' + tabName + '"]');
                const content = document.getElementById(tabName);
                if (tab) tab.classList.add('active');
                if (content) content.classList.add('active');
            }
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    const name = tab.getAttribute('data-tab');
                    if (name) activateTab(name);
                });
            });

            // Ensure a default active tab on load (exact match to Page Init)
            activateTab('settings');

            // Keep move buttons in sync with selection (exact match to Page Init)
            function updateMoveButtonStates(listElement, moveUpButton, moveDownButton) {
                if (!listElement || !moveUpButton || !moveDownButton) return;
                
                const selectedIndex = listElement.selectedIndex;
                const hasSelection = selectedIndex >= 0;
                const isFirstItem = selectedIndex === 0;
                const isLastItem = selectedIndex === listElement.options.length - 1;
                
                // Disable both buttons if no selection
                if (!hasSelection) {
                    moveUpButton.disabled = true;
                    moveDownButton.disabled = true;
                } else {
                    // Enable/disable based on position
                    moveUpButton.disabled = isFirstItem;
                    moveDownButton.disabled = isLastItem;
                }
            }

            // Initialize Params list behavior (similar to Page Init output vars)
            const paramsList = document.getElementById('paramsList');
            const paramDetailsContainer = document.getElementById('paramDetailsContainer');
            if (paramsList && paramDetailsContainer) {
                paramsList.addEventListener('change', (event) => {
                    const selectedIndex = event.target.value;
                    const param = currentParams[selectedIndex];
                    if (!param) {
                        paramDetailsContainer.style.display = 'none';
                        const moveUpButton = document.getElementById('moveUpParamButton');
                        const moveDownButton = document.getElementById('moveDownParamButton');
                        if (moveUpButton && moveDownButton) {
                            updateMoveButtonStates(paramsList, moveUpButton, moveDownButton);
                        }
                        return;
                    }
                    paramDetailsContainer.style.display = 'block';

                    // Update form fields with param values (matching Page Init pattern)
                    Object.keys(paramSchema).forEach(paramKey => {
                        if (paramKey === 'name') return;
                        const fieldId = 'param' + paramKey;
                        const field = document.getElementById(fieldId);
                        const checkbox = document.getElementById(fieldId + 'Editable');
                        if (field && checkbox) {
                            const propertyExists = param.hasOwnProperty(paramKey) && param[paramKey] !== null && param[paramKey] !== undefined;
                            if (field.tagName === 'SELECT') {
                                if (propertyExists) {
                                    field.value = param[paramKey];
                                } else {
                                    const schema = paramSchema[paramKey] || {};
                                    if (schema.default !== undefined) {
                                        field.value = schema.default;
                                    }
                                }
                                field.disabled = !propertyExists;
                            } else {
                                field.value = propertyExists ? param[paramKey] : '';
                                field.readOnly = !propertyExists;
                            }
                            checkbox.checked = propertyExists;
                            if (propertyExists) {
                                checkbox.disabled = true;
                                checkbox.setAttribute('data-originally-checked', 'true');
                            } else {
                                checkbox.disabled = false;
                                checkbox.removeAttribute('data-originally-checked');
                            }
                            
                            // Update browse button state for sourceObjectName and fKObjectName fields
                            if (paramKey === 'sourceObjectName' || paramKey === 'fKObjectName') {
                                const browseButton = field.parentElement.querySelector('.lookup-button');
                                if (browseButton) {
                                    browseButton.disabled = !propertyExists;
                                    console.log('Initialized browse button state for', paramKey, 'disabled:', !propertyExists);
                                }
                            }
                        }
                    });

                    // After populating details, sync button states
                    const moveUpButton = document.getElementById('moveUpParamButton');
                    const moveDownButton = document.getElementById('moveDownParamButton');
                    if (moveUpButton && moveDownButton) {
                        updateMoveButtonStates(paramsList, moveUpButton, moveDownButton);
                    }
                });

                // Initialize toggle behavior for each param field (matching Page Init)
                Object.keys(paramSchema).forEach(paramKey => {
                    if (paramKey === 'name') return;
                    const fieldId = 'param' + paramKey;
                    const field = document.getElementById(fieldId);
                    const checkbox = document.getElementById(fieldId + 'Editable');
                    if (field && checkbox) {
                        checkbox.addEventListener('change', function() {
                            const selectedIndex = paramsList.value;
                            if (selectedIndex === '') return;
                            if (field.tagName === 'INPUT') { field.readOnly = !this.checked; } else if (field.tagName === 'SELECT') { field.disabled = !this.checked; }
                            
                            // Enable/disable browse button for sourceObjectName and fKObjectName fields
                            if (paramKey === 'sourceObjectName' || paramKey === 'fKObjectName') {
                                const browseButton = field.parentElement.querySelector('.lookup-button');
                                if (browseButton) {
                                    browseButton.disabled = !this.checked;
                                    console.log('Checkbox changed for', paramKey, 'checked:', this.checked, 'button disabled:', !this.checked);
                                }
                            }
                            
                            if (this.checked) {
                                this.disabled = true;
                                this.setAttribute('data-originally-checked', 'true');
                                if (field.tagName === 'SELECT' && (!field.value || field.value === '')) {
                                    if (field.options.length > 0) { field.value = field.options[0].value; }
                                }
                            }
                            vscode.postMessage({
                                command: 'updateParam',
                                data: {
                                    index: parseInt(selectedIndex),
                                    property: paramKey,
                                    exists: this.checked,
                                    value: this.checked ? field.value : null
                                }
                            });
                            const idx = parseInt(selectedIndex);
                            if (this.checked) { currentParams[idx][paramKey] = field.value; } else { delete currentParams[idx][paramKey]; }
                        });
                        
                        const updateInputHandler = function() {
                            const selectedIndex = paramsList.value;
                            if (selectedIndex === '' || !checkbox.checked) return;
                            vscode.postMessage({
                                command: 'updateParam',
                                data: { index: parseInt(selectedIndex), property: paramKey, exists: true, value: field.value }
                            });
                            const idx = parseInt(selectedIndex);
                            currentParams[idx][paramKey] = field.value;
                        };
                        
                        if (field.tagName === 'INPUT') {
                            field.addEventListener('input', updateInputHandler);
                        } else if (field.tagName === 'SELECT') {
                            field.addEventListener('change', updateInputHandler);
                        }
                    }
                });

                // Initialize details container to be hidden if no selection (matching Page Init)
                if (paramsList.selectedIndex === -1) {
                    paramDetailsContainer.style.display = 'none';
                }

                // Initialize move button states for params (matching Page Init)
                const moveUpParamButton = document.getElementById('moveUpParamButton');
                const moveDownParamButton = document.getElementById('moveDownParamButton');
                if (moveUpParamButton && moveDownParamButton) {
                    updateMoveButtonStates(paramsList, moveUpParamButton, moveDownParamButton);
                }
            }

            // Initialize Output Variables list behavior (exact match to Page Init)
            const outputVarsList = document.getElementById('outputVarsList');
            const outputVarDetailsContainer = document.getElementById('outputVarDetailsContainer');
            if (outputVarsList && outputVarDetailsContainer) {
                outputVarsList.addEventListener('change', (event) => {
                    const selectedIndex = event.target.value;
                    const outputVar = currentOutputVars[selectedIndex];
                    if (!outputVar) {
                        outputVarDetailsContainer.style.display = 'none';
                        const moveUpButton = document.getElementById('moveUpOutputVarButton');
                        const moveDownButton = document.getElementById('moveDownOutputVarButton');
                        if (moveUpButton && moveDownButton) {
                            updateMoveButtonStates(outputVarsList, moveUpButton, moveDownButton);
                        }
                        return;
                    }
                    outputVarDetailsContainer.style.display = 'block';

                    // Update form fields with output var values (matching Page Init)
                    Object.keys(outputVarSchema).forEach(outputVarKey => {
                        if (outputVarKey === 'name') return;
                        const fieldId = 'outputVar' + outputVarKey;
                        const field = document.getElementById(fieldId);
                        const checkbox = document.getElementById(fieldId + 'Editable');
                        if (field && checkbox) {
                            const propertyExists = outputVar.hasOwnProperty(outputVarKey) && outputVar[outputVarKey] !== null && outputVar[outputVarKey] !== undefined;
                            if (field.tagName === 'SELECT') {
                                if (propertyExists) {
                                    field.value = outputVar[outputVarKey];
                                } else {
                                    const schema = outputVarSchema[outputVarKey] || {};
                                    if (schema.default !== undefined) {
                                        field.value = schema.default;
                                    }
                                }
                                field.disabled = !propertyExists;
                            } else {
                                field.value = propertyExists ? outputVar[outputVarKey] : '';
                                field.readOnly = !propertyExists;
                            }
                            checkbox.checked = propertyExists;
                            if (propertyExists) {
                                checkbox.disabled = true;
                                checkbox.setAttribute('data-originally-checked', 'true');
                            } else {
                                checkbox.disabled = false;
                                checkbox.removeAttribute('data-originally-checked');
                            }
                            
                            // Update browse button state for sourceObjectName and fKObjectName fields
                            if (outputVarKey === 'sourceObjectName' || outputVarKey === 'fKObjectName') {
                                const browseButton = field.parentElement.querySelector('.lookup-button');
                                if (browseButton) {
                                    browseButton.disabled = !propertyExists;
                                    console.log('Initialized output var browse button state for', outputVarKey, 'disabled:', !propertyExists);
                                }
                            }
                        }
                    });

                    // After populating details, sync button states
                    const moveUpButton = document.getElementById('moveUpOutputVarButton');
                    const moveDownButton = document.getElementById('moveDownOutputVarButton');
                    if (moveUpButton && moveDownButton) {
                        updateMoveButtonStates(outputVarsList, moveUpButton, moveDownButton);
                    }
                });

                // Initialize toggle behavior for each output var field (exact match to Page Init)
                Object.keys(outputVarSchema).forEach(outputVarKey => {
                    if (outputVarKey === 'name') return;
                    const fieldId = 'outputVar' + outputVarKey;
                    const field = document.getElementById(fieldId);
                    const checkbox = document.getElementById(fieldId + 'Editable');
                    if (field && checkbox) {
                        checkbox.addEventListener('change', function() {
                            const selectedIndex = outputVarsList.value;
                            if (selectedIndex === '') return;
                            if (field.tagName === 'INPUT') { field.readOnly = !this.checked; } else if (field.tagName === 'SELECT') { field.disabled = !this.checked; }
                            
                            // Enable/disable browse button for sourceObjectName and fKObjectName fields
                            if (outputVarKey === 'sourceObjectName' || outputVarKey === 'fKObjectName') {
                                const browseButton = field.parentElement.querySelector('.lookup-button');
                                if (browseButton) {
                                    browseButton.disabled = !this.checked;
                                    console.log('Output var checkbox changed for', outputVarKey, 'checked:', this.checked, 'button disabled:', !this.checked);
                                }
                            }
                            
                            if (this.checked) {
                                this.disabled = true;
                                this.setAttribute('data-originally-checked', 'true');
                                if (field.tagName === 'SELECT' && (!field.value || field.value === '')) {
                                    if (field.options.length > 0) { field.value = field.options[0].value; }
                                }
                            }
                            vscode.postMessage({
                                command: 'updateOutputVar',
                                data: {
                                    index: parseInt(selectedIndex),
                                    property: outputVarKey,
                                    exists: this.checked,
                                    value: this.checked ? field.value : null
                                }
                            });
                            const idx = parseInt(selectedIndex);
                            if (this.checked) { currentOutputVars[idx][outputVarKey] = field.value; } else { delete currentOutputVars[idx][outputVarKey]; }
                        });
                        
                        const updateInputHandler = function() {
                            const selectedIndex = outputVarsList.value;
                            if (selectedIndex === '' || !checkbox.checked) return;
                            vscode.postMessage({
                                command: 'updateOutputVar',
                                data: { index: parseInt(selectedIndex), property: outputVarKey, exists: true, value: field.value }
                            });
                            const idx = parseInt(selectedIndex);
                            currentOutputVars[idx][outputVarKey] = field.value;
                        };
                        
                        if (field.tagName === 'INPUT') {
                            field.addEventListener('input', updateInputHandler);
                        } else if (field.tagName === 'SELECT') {
                            field.addEventListener('change', updateInputHandler);
                        }
                    }
                });

                // Initialize details container to be hidden if no selection (matching Page Init)
                if (outputVarsList.selectedIndex === -1) {
                    outputVarDetailsContainer.style.display = 'none';
                }

                // Initialize move button states for output variables (matching Page Init)
                const moveUpOutputVarButton = document.getElementById('moveUpOutputVarButton');
                const moveDownOutputVarButton = document.getElementById('moveDownOutputVarButton');
                if (moveUpOutputVarButton && moveDownOutputVarButton) {
                    updateMoveButtonStates(outputVarsList, moveUpOutputVarButton, moveDownOutputVarButton);
                }
            }

            // Direct button handlers (matching Page Init pattern exactly)
            document.getElementById('add-param-btn')?.addEventListener('click', function() {
                createAddInputControlModal();
            });

            document.getElementById('add-output-var-btn')?.addEventListener('click', function() {
                // Show the add output variable modal
                createAddOutputVariableModal();
            });

            // Copy list functionality (matching Page Init exactly)
            document.getElementById('copyParamButton')?.addEventListener('click', () => {
                const paramsList = document.getElementById('paramsList');
                if (!paramsList) return;
                const names = [];
                for (let i = 0; i < paramsList.options.length; i++) { names.push(paramsList.options[i].text); }
                const textToCopy = names.join('\\n');
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        const btn = document.getElementById('copyParamButton');
                        if (btn) { const t = btn.textContent; btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = t; }, 2000); }
                    });
                }
            });

            document.getElementById('copyOutputVarButton')?.addEventListener('click', () => {
                const outputVarsList = document.getElementById('outputVarsList');
                if (!outputVarsList) return;
                const names = [];
                for (let i = 0; i < outputVarsList.options.length; i++) { names.push(outputVarsList.options[i].text); }
                const textToCopy = names.join('\\n');
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        const btn = document.getElementById('copyOutputVarButton');
                        if (btn) { const t = btn.textContent; btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = t; }, 2000); }
                    });
                }
            });

            // Move functionality for params (exact match to Page Init)
            document.getElementById('moveUpParamButton')?.addEventListener('click', () => {
                const paramsList = document.getElementById('paramsList');
                if (!paramsList || !paramsList.value) return;
                const selectedIndex = parseInt(paramsList.value);
                if (selectedIndex > 0) { vscode.postMessage({ command: 'moveParam', data: { fromIndex: selectedIndex, toIndex: selectedIndex - 1 } }); }
            });

            document.getElementById('moveDownParamButton')?.addEventListener('click', () => {
                const paramsList = document.getElementById('paramsList');
                if (!paramsList || !paramsList.value) return;
                const selectedIndex = parseInt(paramsList.value);
                if (selectedIndex < currentParams.length - 1) { vscode.postMessage({ command: 'moveParam', data: { fromIndex: selectedIndex, toIndex: selectedIndex + 1 } }); }
            });

            // Move functionality for output vars (exact match to Page Init)
            document.getElementById('moveUpOutputVarButton')?.addEventListener('click', () => {
                const outputVarsList = document.getElementById('outputVarsList');
                if (!outputVarsList || !outputVarsList.value) return;
                const selectedIndex = parseInt(outputVarsList.value);
                if (selectedIndex > 0) { vscode.postMessage({ command: 'moveOutputVar', data: { fromIndex: selectedIndex, toIndex: selectedIndex - 1 } }); }
            });

            document.getElementById('moveDownOutputVarButton')?.addEventListener('click', () => {
                const outputVarsList = document.getElementById('outputVarsList');
                if (!outputVarsList || !outputVarsList.value) return;
                const selectedIndex = parseInt(outputVarsList.value);
                if (selectedIndex < currentOutputVars.length - 1) { vscode.postMessage({ command: 'moveOutputVar', data: { fromIndex: selectedIndex, toIndex: selectedIndex + 1 } }); }
            });

            // Reverse functionality (exact match to Page Init)
            document.getElementById('reverseParamButton')?.addEventListener('click', () => {
                vscode.postMessage({ command: 'reverseParam' });
            });

            document.getElementById('reverseOutputVarButton')?.addEventListener('click', () => {
                vscode.postMessage({ command: 'reverseOutputVar' });
            });

            // Settings tab behavior (exact match to Page Init)
            document.querySelectorAll('.setting-checkbox').forEach(chk => {
                chk.addEventListener('change', function() {
                    const prop = this.getAttribute('data-prop');
                    const isEnum = this.getAttribute('data-is-enum') === 'true';
                    const field = document.getElementById('setting-' + prop);
                    if (!field) return;
                    if (isEnum) { field.disabled = !this.checked; } else { field.readOnly = !this.checked; }
                    if (this.checked) {
                        this.disabled = true;
                        this.setAttribute('data-originally-checked', 'true');
                        if (isEnum && (!field.value || field.value === '')) { if (field.options.length > 0) field.value = field.options[0].value; }
                    }
                    vscode.postMessage({ command: 'updateSettings', data: { property: prop, exists: this.checked, value: this.checked ? field.value : null } });
                });
            });
            document.querySelectorAll('#settings input[type="text"], #settings select').forEach(field => {
                const handler = () => {
                    const name = field.getAttribute('name');
                    const isEnum = field.tagName === 'SELECT';
                    const chk = document.querySelector('.setting-checkbox[data-prop="' + name + '"]');
                    if (!chk || !chk.checked) return;
                    vscode.postMessage({ command: 'updateSettings', data: { property: name, exists: true, value: field.value } });
                };
                if (field.tagName === 'SELECT') { field.addEventListener('change', handler); } else { field.addEventListener('input', handler); field.addEventListener('change', handler); }
            });

            // Handle refresh messages from the extension (match Page Init behavior)
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'refreshParamsList': {
                        const paramsListEl = document.getElementById('paramsList');
                        if (!paramsListEl) break;
                        currentParams = Array.isArray(message.data) ? message.data : [];
                        const currentSelection = (message.newSelection != null) ? message.newSelection : paramsListEl.selectedIndex;
                        // Rebuild options
                        paramsListEl.innerHTML = '';
                        currentParams.forEach((p, i) => {
                            const opt = document.createElement('option');
                            opt.value = i; opt.textContent = p?.name || 'Unnamed Input Param';
                            paramsListEl.appendChild(opt);
                        });
                        // Restore selection and trigger change for details panel
                        if (currentSelection >= 0 && currentSelection < currentParams.length) {
                            paramsListEl.selectedIndex = currentSelection;
                            paramsListEl.dispatchEvent(new Event('change'));
                        }
                        // Sync move button states
                        const up = document.getElementById('moveUpParamButton');
                        const down = document.getElementById('moveDownParamButton');
                        if (up && down) { updateMoveButtonStates(paramsListEl, up, down); }
                        break;
                    }
                    case 'refreshOutputVarsList': {
                        const outputVarsListEl = document.getElementById('outputVarsList');
                        if (!outputVarsListEl) break;
                        currentOutputVars = Array.isArray(message.data) ? message.data : [];
                        const currentSelection = (message.newSelection != null) ? message.newSelection : outputVarsListEl.selectedIndex;
                        // Rebuild options
                        outputVarsListEl.innerHTML = '';
                        currentOutputVars.forEach((ov, i) => {
                            const opt = document.createElement('option');
                            opt.value = i; opt.textContent = ov?.name || 'Unnamed Output Variable';
                            outputVarsListEl.appendChild(opt);
                        });
                        // Restore selection and trigger change for details panel
                        if (currentSelection >= 0 && currentSelection < currentOutputVars.length) {
                            outputVarsListEl.selectedIndex = currentSelection;
                            outputVarsListEl.dispatchEvent(new Event('change'));
                        }
                        // Sync move button states
                        const up = document.getElementById('moveUpOutputVarButton');
                        const down = document.getElementById('moveDownOutputVarButton');
                        if (up && down) { updateMoveButtonStates(outputVarsListEl, up, down); }
                        break;
                    }
                }
            });

            // Include Data Object Search Modal functionality
            ${getDataObjectSearchModalFunctionality()}

            // DOM Event handling for browse buttons (data object lookup)
            document.addEventListener('click', function(event) {
                // Check if the clicked element is a lookup button or its child
                let button = event.target;
                if (button.classList.contains('codicon')) {
                    // If clicked on the icon, get the parent button
                    button = button.parentElement;
                }
                
                if (button && button.classList && button.classList.contains('lookup-button')) {
                    console.log('Browse button clicked:', button);
                    const propKey = button.getAttribute('data-prop');
                    console.log('Property key:', propKey);
                    
                    if (propKey === 'sourceObjectName' || propKey === 'fKObjectName') {
                        console.log('Handling sourceObjectName or fKObjectName browse');
                        // Handle data object browse functionality for input controls tab
                        let inputField = button.parentElement.querySelector('input[type="text"]');
                        
                        // If not found (list view), try using data-field-id
                        if (!inputField) {
                            const fieldId = button.getAttribute('data-field-id');
                            console.log('Using field ID:', fieldId);
                            if (fieldId) {
                                inputField = document.getElementById(fieldId);
                            }
                        }
                        
                        if (inputField) {
                            console.log('Input field found:', inputField);
                            const currentValue = inputField.value;
                            console.log('Current value:', currentValue);
                            console.log('All data objects:', allDataObjects);
                            createDataObjectSearchModal(currentValue, inputField);
                        } else {
                            console.error('Input field not found');
                        }
                    }
                } else {
                    console.log('Not a lookup button click');
                }
            });
        })();
    `;
}

module.exports = { getClientScriptTemplate };

"use strict";
// generalFlow clientScriptTemplate - completely independent implementation like Page Init

"use strict";
// generalFlow clientScriptTemplate - completely independent implementation like Page Init

// No Forms imports - General Flow now has complete independence

/**
 * Generates JavaScript code for client-side functionality of General Flow view
 */
function getClientScriptTemplate(params, outputVars, paramSchema, outputVarSchema, flowName, allDataObjects = []) {
    return `
        (function() {
            // Store current data
            let currentParams = ${JSON.stringify(params)};
            let currentOutputVars = ${JSON.stringify(outputVars)};
            let currentEditingIndex = -1;

            // Schema data
            const paramSchema = ${JSON.stringify(paramSchema)};
            const outputVarSchema = ${JSON.stringify(outputVarSchema)};
            const flowName = "${flowName || ''}";

            // Data object search data (not used yet but kept for parity)
            const allDataObjects = ${JSON.stringify(allDataObjects)};

            // Basic modal behavior (matching Page Init)
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

            // Tab functionality (matching Page Init)
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

            // Move button state management (matching Page Init)
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

            // Input style management (simplified from Forms version)
            function updateInputStyle(field, hasValue) {
                if (hasValue) {
                    field.style.fontWeight = '500';
                    field.style.color = 'var(--vscode-input-foreground)';
                } else {
                    field.style.fontWeight = '';
                    field.style.color = '';
                }
            }

            // Copy Flow Name functionality
            window.copyGeneralFlowName = function(name) {
                const value = name || flowName;
                if (!value) { return; }
                const applyFeedback = () => {
                    const icon = document.querySelector('.copy-page-init-name-button .codicon');
                    if (!icon) { return; }
                    const original = icon.className;
                    icon.className = 'codicon codicon-check';
                    setTimeout(() => { icon.className = original; }, 2000);
                };
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(value).then(applyFeedback).catch(applyFeedback);
                } else {
                    // Fallback
                    const ta = document.createElement('textarea');
                    ta.value = value; document.body.appendChild(ta); ta.select();
                    try { document.execCommand('copy'); } catch {}
                    document.body.removeChild(ta);
                    applyFeedback();
                }
            };

            // Modal functionality for input controls and output variables (matching Page Init)
            function createAddInputControlModal() {
                // Create modal dialog for adding input controls
                const modal = document.createElement("div");
                modal.className = "modal";
                
                // Set the modal content (get HTML from existing templates)
                modal.innerHTML = \`
<div class="modal-content">
    <span class="close-button">&times;</span>
    <h2>Add Input Control</h2>
    <div class="tabs">
        <div class="tab active" data-tab="singleAdd">Single Input Control</div>
        <div class="tab" data-tab="bulkAdd">Bulk Add</div>
    </div>
    <div id="singleAdd" class="tab-content active">
        <div class="form-row">
            <label for="inputControlName">Input Control Name:</label>
            <input type="text" id="inputControlName">
            <div class="field-note">Use Pascal case (Example: FirstName). No spaces are allowed in names. Alpha characters only. Maximum 100 characters.</div>
        </div>
        <div id="singleValidationError" class="validation-error"></div>
        <button id="addSingleInputControl">Add Input Control</button>
    </div>
    <div id="bulkAdd" class="tab-content">
        <div class="form-row">
            <label for="bulkInputControls">Input Control Names (one per line):</label>
            <textarea id="bulkInputControls" rows="5"></textarea>
            <div class="field-note">Use Pascal case (Example: FirstName). No spaces are allowed in names. Alpha characters only. Maximum 100 characters.</div>
        </div>
        <div id="bulkValidationError" class="validation-error"></div>
        <button id="addBulkInputControls">Add Input Controls</button>
    </div>
</div>\`;
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
                            event.preventDefault();
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
                    
                    // Add the new input control by sending command
                    vscode.postMessage({
                        command: 'addParamWithName',
                        data: {
                            name: inputControlName
                        }
                    });
                    
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
                        vscode.postMessage({
                            command: 'addParamWithName',
                            data: {
                                name: name
                            }
                        });
                    });
                    
                    // Close the modal
                    document.body.removeChild(modal);
                });
            }

            function createAddOutputVariableModal() {
                // Create modal dialog for adding output variables
                const modal = document.createElement("div");
                modal.className = "modal";
                
                // Set the modal content (get HTML from existing templates)
                modal.innerHTML = \`
<div class="modal-content">
    <span class="close-button">&times;</span>
    <h2>Add Output Variable</h2>
    <div class="tabs">
        <div class="tab active" data-tab="singleAdd">Single Output Variable</div>
        <div class="tab" data-tab="bulkAdd">Bulk Add</div>
    </div>
    <div id="singleAdd" class="tab-content active">
        <div class="form-row">
            <label for="outputVariableName">Output Variable Name:</label>
            <input type="text" id="outputVariableName">
            <div class="field-note">Use Pascal case (Example: FirstName). No spaces are allowed in names. Alpha characters only. Maximum 100 characters.</div>
        </div>
        <div id="singleValidationError" class="validation-error"></div>
        <button id="addSingleOutputVariable">Add Output Variable</button>
    </div>
    <div id="bulkAdd" class="tab-content">
        <div class="form-row">
            <label for="bulkOutputVariables">Output Variable Names (one per line):</label>
            <textarea id="bulkOutputVariables" rows="5"></textarea>
            <div class="field-note">Use Pascal case (Example: FirstName). No spaces are allowed in names. Alpha characters only. Maximum 100 characters.</div>
        </div>
        <div id="bulkValidationError" class="validation-error"></div>
        <button id="addBulkOutputVariables">Add Output Variables</button>
    </div>
</div>\`;
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
                            event.preventDefault();
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
                
                // Add single output variable button event listener
                modal.querySelector("#addSingleOutputVariable").addEventListener("click", function() {
                    const outputVariableName = modal.querySelector("#outputVariableName").value.trim();
                    const errorElement = modal.querySelector("#singleValidationError");
                    
                    const validationError = validateOutputVariableName(outputVariableName);
                    if (validationError) {
                        errorElement.textContent = validationError;
                        return;
                    }
                    
                    // Add the new output variable by sending command
                    vscode.postMessage({
                        command: 'addOutputVarWithName',
                        data: {
                            name: outputVariableName
                        }
                    });
                    
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
                        vscode.postMessage({
                            command: 'addOutputVarWithName',
                            data: {
                                name: name
                            }
                        });
                    });
                    
                    // Close the modal
                    document.body.removeChild(modal);
                });
            }

            // Direct button handlers matching Page Init patterns
            
            // Initialize list selection behavior for params and output vars (matching Page Init)
            const paramsList = document.getElementById('paramsList');
            const paramDetailsContainer = document.getElementById('paramDetailsContainer');
            if (paramsList && paramDetailsContainer) {
                paramsList.addEventListener('change', (event) => {
                    const selectedIndex = event.target.value;
                    const param = currentParams[selectedIndex];

                    // Only proceed if we have a valid param object
                    if (!param) {
                        paramDetailsContainer.style.display = 'none';
                        const moveUpButton = document.getElementById('moveUpParamsButton');
                        const moveDownButton = document.getElementById('moveDownParamsButton');
                        if (moveUpButton && moveDownButton) {
                            updateMoveButtonStates(paramsList, moveUpButton, moveDownButton);
                        }
                        return;
                    }
                    paramDetailsContainer.style.display = 'block';

                    // Update form fields with param values (similar to Page Init pattern)
                    Object.keys(paramSchema).forEach(paramKey => {
                        if (paramKey === 'name') return; // Skip name field as it's in the list
                        
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
                            
                            updateInputStyle(field, checkbox.checked);
                        }
                    });

                    // After populating details, sync button states
                    const moveUpButton = document.getElementById('moveUpParamsButton');
                    const moveDownButton = document.getElementById('moveDownParamsButton');
                    if (moveUpButton && moveDownButton) {
                        updateMoveButtonStates(paramsList, moveUpButton, moveDownButton);
                    }
                });

                // Initialize details container to be hidden if no selection (matching Page Init)
                if (paramsList && paramDetailsContainer && (!paramsList.value || paramsList.value === "")) {
                    paramDetailsContainer.style.display = 'none';
                }

                // Initialize move button states on load
                const moveUpButton = document.getElementById('moveUpParamsButton');
                const moveDownButton = document.getElementById('moveDownParamsButton');
                if (moveUpButton && moveDownButton) {
                    updateMoveButtonStates(paramsList, moveUpButton, moveDownButton);
                }
            }

            const outputVarsList = document.getElementById('outputVarsList');
            const outputVarDetailsContainer = document.getElementById('outputVarDetailsContainer');
            if (outputVarsList && outputVarDetailsContainer) {
                outputVarsList.addEventListener('change', (event) => {
                    const selectedIndex = event.target.value;
                    const outputVar = currentOutputVars[selectedIndex];

                    // Only proceed if we have a valid output variable object
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
                        if (outputVarKey === 'name') return; // Skip name field as it's in the list
                        
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
                            
                            updateInputStyle(field, checkbox.checked);
                        }
                    });

                    // After populating details, sync button states
                    const moveUpButton = document.getElementById('moveUpOutputVarButton');
                    const moveDownButton = document.getElementById('moveDownOutputVarButton');
                    if (moveUpButton && moveDownButton) {
                        updateMoveButtonStates(outputVarsList, moveUpButton, moveDownButton);
                    }
                });

                // Initialize details container to be hidden if no selection (matching Page Init)
                if (outputVarsList && outputVarDetailsContainer && (!outputVarsList.value || outputVarsList.value === "")) {
                    outputVarDetailsContainer.style.display = 'none';
                }

                // Initialize move button states on load
                const moveUpButton = document.getElementById('moveUpOutputVarButton');
                const moveDownButton = document.getElementById('moveDownOutputVarButton');
                if (moveUpButton && moveDownButton) {
                    updateMoveButtonStates(outputVarsList, moveUpButton, moveDownButton);
                }
            }

            // Direct button handlers matching Page Init exactly
            
            // Params buttons
            document.getElementById('copyParamsButton')?.addEventListener('click', () => {
                if (!paramsList) return;
                const names = [];
                for (let i = 0; i < paramsList.options.length; i++) { names.push(paramsList.options[i].text); }
                const textToCopy = names.join('\\n');
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        const btn = document.getElementById('copyParamsButton');
                        if (btn) { const t = btn.textContent; btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = t; }, 2000); }
                    });
                }
            });
            document.getElementById('moveUpParamsButton')?.addEventListener('click', () => {
                if (!paramsList || !paramsList.value) return;
                const selectedIndex = parseInt(paramsList.value);
                if (selectedIndex > 0) { vscode.postMessage({ command: 'moveParam', data: { fromIndex: selectedIndex, toIndex: selectedIndex - 1 } }); }
            });
            document.getElementById('moveDownParamsButton')?.addEventListener('click', () => {
                if (!paramsList || !paramsList.value) return;
                const selectedIndex = parseInt(paramsList.value);
                if (selectedIndex < currentParams.length - 1) { vscode.postMessage({ command: 'moveParam', data: { fromIndex: selectedIndex, toIndex: selectedIndex + 1 } }); }
            });
            document.getElementById('reverseParamsButton')?.addEventListener('click', () => {
                vscode.postMessage({ command: 'reverseParam' });
            });

            // Output vars buttons  
            document.getElementById('copyOutputVarButton')?.addEventListener('click', () => {
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
            document.getElementById('moveUpOutputVarButton')?.addEventListener('click', () => {
                if (!outputVarsList || !outputVarsList.value) return;
                const selectedIndex = parseInt(outputVarsList.value);
                if (selectedIndex > 0) { vscode.postMessage({ command: 'moveOutputVar', data: { fromIndex: selectedIndex, toIndex: selectedIndex - 1 } }); }
            });
            document.getElementById('moveDownOutputVarButton')?.addEventListener('click', () => {
                if (!outputVarsList || !outputVarsList.value) return;
                const selectedIndex = parseInt(outputVarsList.value);
                if (selectedIndex < currentOutputVars.length - 1) { vscode.postMessage({ command: 'moveOutputVar', data: { fromIndex: selectedIndex, toIndex: selectedIndex + 1 } }); }
            });
            document.getElementById('reverseOutputVarButton')?.addEventListener('click', () => {
                vscode.postMessage({ command: 'reverseOutputVar' });
            });

            // Add button handlers
            document.getElementById('add-param-btn')?.addEventListener('click', function() {
                createAddInputControlModal();
            });
            document.getElementById('add-output-var-btn')?.addEventListener('click', function() {
                createAddOutputVariableModal();
            });

            // Refresh Output Variables List function
            function refreshOutputVarsList(newOutputVars, newSelection = null) {
                const outputVarsList = document.getElementById('outputVarsList');
                if (outputVarsList) {
                    const currentSelection = newSelection !== null ? newSelection : outputVarsList.selectedIndex;
                    outputVarsList.innerHTML = '';
                    newOutputVars.forEach((outputVar, index) => {
                        const option = document.createElement('option');
                        option.value = index;
                        option.textContent = outputVar.name || 'Unnamed Output Variable';
                        outputVarsList.appendChild(option);
                    });
                    
                    // Update the current data array to match Page Init pattern
                    currentOutputVars = newOutputVars;
                    
                    // Restore selection if still valid
                    if (currentSelection >= 0 && currentSelection < newOutputVars.length) {
                        outputVarsList.selectedIndex = currentSelection;
                        // Trigger the change event to update the details view
                        outputVarsList.dispatchEvent(new Event('change'));
                    }
                    
                    // Update move button states
                    const moveUpButton = document.getElementById('moveUpOutputVarButton');
                    const moveDownButton = document.getElementById('moveDownOutputVarButton');
                    if (moveUpButton && moveDownButton) {
                        updateMoveButtonStates(outputVarsList, moveUpButton, moveDownButton);
                    }
                    
                    console.log('[DEBUG] General Flow output vars list refreshed with', newOutputVars.length, 'items');
                }
            }

            // Refresh Params List function
            function refreshParamsList(newParams, newSelection = null) {
                const paramsList = document.getElementById('paramsList');
                if (paramsList) {
                    const currentSelection = newSelection !== null ? newSelection : paramsList.selectedIndex;
                    paramsList.innerHTML = '';
                    newParams.forEach((param, index) => {
                        const option = document.createElement('option');
                        option.value = index;
                        option.textContent = param.name || 'Unnamed Parameter';
                        paramsList.appendChild(option);
                    });
                    
                    // Update the current data array to match Page Init pattern
                    currentParams = newParams;
                    
                    // Restore selection if still valid
                    if (currentSelection >= 0 && currentSelection < newParams.length) {
                        paramsList.selectedIndex = currentSelection;
                        // Trigger the change event to update the details view
                        paramsList.dispatchEvent(new Event('change'));
                    }
                    
                    // Update move button states
                    const moveUpButton = document.getElementById('moveUpParamsButton');
                    const moveDownButton = document.getElementById('moveDownParamsButton');
                    if (moveUpButton && moveDownButton) {
                        updateMoveButtonStates(paramsList, moveUpButton, moveDownButton);
                    }
                    
                    console.log('[DEBUG] General Flow params list refreshed with', newParams.length, 'items');
                }
            }
            
            // Ensure a default active tab on load
            activateTab('settings');

            // Settings tab behavior (matching Page Init)
            document.querySelectorAll('.setting-checkbox').forEach(chk => {
                chk.addEventListener('change', function() {
                    const prop = this.getAttribute('data-prop');
                    const isEnum = this.getAttribute('data-is-enum') === 'true';
                    const field = document.getElementById('setting-' + prop);
                    if (!field) return;
                    if (isEnum) { field.disabled = !this.checked; } else { field.readOnly = !this.checked; }
                    // Enable/disable related browse button if present (e.g., targetChildObject)
                    const browseBtn = document.querySelector('.lookup-button[data-prop="' + prop + '"]');
                    if (browseBtn) { browseBtn.disabled = !this.checked; }
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

            // Settings field handlers and styling (simplified from Forms version)
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
                        updateInputStyle(field, this.checked);
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
                        updateInputStyle(field, !!field.value);
                    };
                    if (field.tagName === 'SELECT') { field.addEventListener('change', updateInputHandler); } else { field.addEventListener('input', updateInputHandler); field.addEventListener('change', updateInputHandler); }
                }
            });

            // Output variable field handlers
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
                        updateInputStyle(field, this.checked);
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
                        updateInputStyle(field, !!field.value);
                    };
                    if (field.tagName === 'SELECT') { field.addEventListener('change', updateInputHandler); } else { field.addEventListener('input', updateInputHandler); field.addEventListener('change', updateInputHandler); }
                }
            });

            // Initialize move button states for output variables (matching Page Init)
            const outputVarsListForInit = document.getElementById('outputVarsList');
            const moveUpOutputVarButtonForInit = document.getElementById('moveUpOutputVarButton');
            const moveDownOutputVarButtonForInit = document.getElementById('moveDownOutputVarButton');
            
            if (outputVarsListForInit && moveUpOutputVarButtonForInit && moveDownOutputVarButtonForInit) {
                // Update button states on list selection changes
                outputVarsListForInit.addEventListener('change', () => {
                    updateMoveButtonStates(outputVarsListForInit, moveUpOutputVarButtonForInit, moveDownOutputVarButtonForInit);
                });
                
                // Initialize button states
                updateMoveButtonStates(outputVarsListForInit, moveUpOutputVarButtonForInit, moveDownOutputVarButtonForInit);
            }

            // Initialize move button states for params
            const paramsListForInit = document.getElementById('paramsList');
            const moveUpParamsButtonForInit = document.getElementById('moveUpParamsButton');
            const moveDownParamsButtonForInit = document.getElementById('moveDownParamsButton');
            
            if (paramsListForInit && moveUpParamsButtonForInit && moveDownParamsButtonForInit) {
                // Update button states on list selection changes
                paramsListForInit.addEventListener('change', () => {
                    updateMoveButtonStates(paramsListForInit, moveUpParamsButtonForInit, moveDownParamsButtonForInit);
                });
                
                // Initialize button states
                updateMoveButtonStates(paramsListForInit, moveUpParamsButtonForInit, moveDownParamsButtonForInit);
            }

            // Message handlers for list refresh updates
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'refreshParamsList':
                        refreshParamsList(message.data, message.newSelection);
                        break;
                    case 'refreshOutputVarsList':
                        refreshOutputVarsList(message.data, message.newSelection);
                        break;
                }
            });
        })();
    `;
}

module.exports = { getClientScriptTemplate };

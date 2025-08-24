"use strict";

const { getAddWorkflowTaskModalHtml } = require("./modalTemplates");
const { getAddWorkflowTaskModalFunctionality } = require("./addWorkflowTaskModalFunctionality");

function getClientScriptTemplate(workflowTasks, workflowTaskSchema, flowName, allDataObjects = []) {
    return `
        (function() {
            let currentWorkflowTasks = ${JSON.stringify(workflowTasks)};
            const workflowTaskSchema = ${JSON.stringify(workflowTaskSchema)};
            const flowName = ${JSON.stringify(flowName)};
            const allDataObjects = ${JSON.stringify(allDataObjects)};

            // Basic modal behavior
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

            // Add Workflow Task Modal Template Function
            function getAddWorkflowTaskModalHtml() {
                return \`${getAddWorkflowTaskModalHtml()}\`;
            }

            // Add Workflow Task Modal Functionality
            ${getAddWorkflowTaskModalFunctionality()}

            // Initialize list selection behavior similar to page inits
            const workflowTasksList = document.getElementById('workflowTasksList');
            const workflowTaskDetailsContainer = document.getElementById('workflowTaskDetailsContainer');
            if (workflowTasksList && workflowTaskDetailsContainer) {
                // Keep move buttons in sync with selection
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

                workflowTasksList.addEventListener('change', (event) => {
                    const selectedIndex = event.target.value;
                    const workflowTask = currentWorkflowTasks[selectedIndex];
                    if (!workflowTask) {
                        workflowTaskDetailsContainer.style.display = 'none';
                        const moveUpButton = document.getElementById('moveUpWorkflowTaskButton');
                        const moveDownButton = document.getElementById('moveDownWorkflowTaskButton');
                        if (moveUpButton && moveDownButton) {
                            updateMoveButtonStates(workflowTasksList, moveUpButton, moveDownButton);
                        }
                        return;
                    }
                    workflowTaskDetailsContainer.style.display = 'block';

                    Object.keys(workflowTaskSchema).forEach(workflowTaskKey => {
                        if (workflowTaskKey === 'name') return;
                        const fieldId = 'workflowTask' + workflowTaskKey;
                        const field = document.getElementById(fieldId);
                        const checkbox = document.getElementById(fieldId + 'Editable');
                        if (field && checkbox) {
                            const propertyExists = workflowTask.hasOwnProperty(workflowTaskKey) && workflowTask[workflowTaskKey] !== null && workflowTask[workflowTaskKey] !== undefined;
                            if (field.tagName === 'SELECT') {
                                if (propertyExists) {
                                    field.value = workflowTask[workflowTaskKey];
                                } else {
                                    const schema = workflowTaskSchema[workflowTaskKey] || {};
                                    if (schema.default !== undefined) {
                                        field.value = schema.default;
                                    }
                                }
                                field.disabled = !propertyExists;
                            } else {
                                field.value = propertyExists ? workflowTask[workflowTaskKey] : '';
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
                        }
                    });

                    // After populating details, sync button states
                    const moveUpButton = document.getElementById('moveUpWorkflowTaskButton');
                    const moveDownButton = document.getElementById('moveDownWorkflowTaskButton');
                    if (moveUpButton && moveDownButton) {
                        updateMoveButtonStates(workflowTasksList, moveUpButton, moveDownButton);
                    }
                });

                // Initialize toggle behavior for each field
                Object.keys(workflowTaskSchema).forEach(workflowTaskKey => {
                    if (workflowTaskKey === 'name') return;
                    const fieldId = 'workflowTask' + workflowTaskKey;
                    const field = document.getElementById(fieldId);
                    const checkbox = document.getElementById(fieldId + 'Editable');
                    if (field && checkbox) {
                        checkbox.addEventListener('change', function() {
                            const selectedIndex = workflowTasksList.value;
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
                                command: 'updateWorkflowTask',
                                data: {
                                    index: parseInt(selectedIndex),
                                    property: workflowTaskKey,
                                    exists: this.checked,
                                    value: this.checked ? field.value : null
                                }
                            });
                            const idx = parseInt(selectedIndex);
                            if (this.checked) { currentWorkflowTasks[idx][workflowTaskKey] = field.value; } else { delete currentWorkflowTasks[idx][workflowTaskKey]; }
                        });
                        const updateInputHandler = function() {
                            const selectedIndex = workflowTasksList.value;
                            if (selectedIndex === '' || !checkbox.checked) return;
                            vscode.postMessage({
                                command: 'updateWorkflowTask',
                                data: { index: parseInt(selectedIndex), property: workflowTaskKey, exists: true, value: field.value }
                            });
                            const idx = parseInt(selectedIndex);
                            currentWorkflowTasks[idx][workflowTaskKey] = field.value;
                        };
                        if (field.tagName === 'SELECT') { field.addEventListener('change', updateInputHandler); } else { field.addEventListener('input', updateInputHandler); field.addEventListener('change', updateInputHandler); }
                    }
                });

                if (workflowTasksList && workflowTaskDetailsContainer && (!workflowTasksList.value || workflowTasksList.value === "")) {
                    workflowTaskDetailsContainer.style.display = 'none';
                }

                // Initialize move button states on load
                const moveUpButton = document.getElementById('moveUpWorkflowTaskButton');
                const moveDownButton = document.getElementById('moveDownWorkflowTaskButton');
                if (moveUpButton && moveDownButton) {
                    updateMoveButtonStates(workflowTasksList, moveUpButton, moveDownButton);
                }
            }

            // Buttons
            document.getElementById('copyWorkflowTaskButton')?.addEventListener('click', () => {
                if (!workflowTasksList) return;
                const names = [];
                for (let i = 0; i < workflowTasksList.options.length; i++) { names.push(workflowTasksList.options[i].text); }
                // Important: use \\n here so the generated script contains a literal "\\n" and not an actual newline character
                const textToCopy = names.join('\\n');
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        const btn = document.getElementById('copyWorkflowTaskButton');
                        if (btn) { const t = btn.textContent; btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = t; }, 2000); }
                    });
                }
            });
            document.getElementById('moveUpWorkflowTaskButton')?.addEventListener('click', () => {
                if (!workflowTasksList || !workflowTasksList.value) return;
                const selectedIndex = parseInt(workflowTasksList.value);
                if (selectedIndex > 0) { vscode.postMessage({ command: 'moveWorkflowTask', data: { fromIndex: selectedIndex, toIndex: selectedIndex - 1 } }); }
            });
            document.getElementById('moveDownWorkflowTaskButton')?.addEventListener('click', () => {
                if (!workflowTasksList || !workflowTasksList.value) return;
                const selectedIndex = parseInt(workflowTasksList.value);
                if (selectedIndex < currentWorkflowTasks.length - 1) { vscode.postMessage({ command: 'moveWorkflowTask', data: { fromIndex: selectedIndex, toIndex: selectedIndex + 1 } }); }
            });
            document.getElementById('reverseWorkflowTaskButton')?.addEventListener('click', () => {
                vscode.postMessage({ command: 'reverseWorkflowTask' });
            });

            // Add workflow task button functionality
            document.getElementById('add-workflow-task-btn')?.addEventListener('click', function() {
                // Show the add workflow task modal
                createAddWorkflowTaskModal();
            });

            // Copy Workflow Name Function
            function copyWorkflowName(flowName) {
                console.log('[DEBUG] WorkflowDetails - Copy flow name requested for:', JSON.stringify(flowName));
                
                if (!flowName) {
                    console.warn('[WARN] WorkflowDetails - Cannot copy: flow name not available');
                    return;
                }
                
                try {
                    // Copy to clipboard using the modern Clipboard API
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(flowName).then(() => {
                            console.log('Workflow name copied to clipboard:', flowName);
                            // Provide visual feedback
                            const copyButton = document.querySelector('.copy-workflow-name-button .codicon');
                            if (copyButton) {
                                const originalClass = copyButton.className;
                                copyButton.className = 'codicon codicon-check';
                                setTimeout(() => {
                                    copyButton.className = originalClass;
                                }, 2000);
                            }
                        }).catch(err => {
                            console.error('Failed to copy Workflow name: ', err);
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
                        const copyButton = document.querySelector('.copy-workflow-name-button .codicon');
                        if (copyButton) {
                            const originalClass = copyButton.className;
                            copyButton.className = 'codicon codicon-check';
                            setTimeout(() => {
                                copyButton.className = originalClass;
                            }, 2000);
                        }
                    }
                } catch (err) {
                    console.error('Error copying Workflow name: ', err);
                }
            }

            // Make copyWorkflowName function globally available
            window.copyWorkflowName = copyWorkflowName;

            // Settings tab behavior
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

            // Tabs
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

            // Ensure a default active tab on load
            activateTab('settings');

            // Message handlers for list refresh updates
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'refreshWorkflowTasksList':
                        const workflowTasksList = document.getElementById('workflowTasksList');
                        if (workflowTasksList) {
                            currentWorkflowTasks = message.data;
                            const currentSelection = message.newSelection != null ? message.newSelection : workflowTasksList.selectedIndex;
                            workflowTasksList.innerHTML = '';
                            message.data.forEach((wt, i) => {
                                const opt = document.createElement('option');
                                opt.value = i; opt.textContent = wt.name || 'Unnamed Workflow Task';
                                workflowTasksList.appendChild(opt);
                            });
                            if (currentSelection >= 0 && currentSelection < message.data.length) {
                                workflowTasksList.selectedIndex = currentSelection;
                                workflowTasksList.dispatchEvent(new Event('change'));
                            }
                            // Ensure move buttons reflect the refreshed list
                            const moveUpButton = document.getElementById('moveUpWorkflowTaskButton');
                            const moveDownButton = document.getElementById('moveDownWorkflowTaskButton');
                            if (moveUpButton && moveDownButton) {
                                updateMoveButtonStates(workflowTasksList, moveUpButton, moveDownButton);
                            }
                        }
                        break;
                }
            });
        })();
    `;
}

module.exports = { getClientScriptTemplate };

"use strict";

const { getAddOutputVariableModalHtml } = require("./modalTemplates");
const { getAddOutputVariableModalFunctionality } = require("./addOutputVariableModalFunctionality");

function getClientScriptTemplate(outputVars, outputVarSchema, flowName, allDataObjects = []) {
    return `
        (function() {
            let currentOutputVars = ${JSON.stringify(outputVars)};
            const outputVarSchema = ${JSON.stringify(outputVarSchema)};
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

            // Add Output Variable Modal Template Function
            function getAddOutputVariableModalHtml() {
                return \`${getAddOutputVariableModalHtml()}\`;
            }

            // Add Output Variable Modal Functionality
            ${getAddOutputVariableModalFunctionality()}

            // Initialize list selection behavior similar to forms
            const outputVarsList = document.getElementById('outputVarsList');
            const outputVarDetailsContainer = document.getElementById('outputVarDetailsContainer');
            if (outputVarsList && outputVarDetailsContainer) {
                // Keep move buttons in sync with selection, like forms
                function updateMoveButtonStates(listElement) {
                    const moveUpBtn = document.getElementById('moveUpOutputVarButton');
                    const moveDownBtn = document.getElementById('moveDownOutputVarButton');
                    if (!listElement || !moveUpBtn || !moveDownBtn) return;
                    const idx = listElement.selectedIndex;
                    const length = listElement.options.length;
                    moveUpBtn.disabled = !(idx > 0);
                    moveDownBtn.disabled = !(idx >= 0 && idx < length - 1);
                }

                outputVarsList.addEventListener('change', (event) => {
                    const selectedIndex = event.target.value;
                    const outputVar = currentOutputVars[selectedIndex];
                    if (!outputVar) {
                        outputVarDetailsContainer.style.display = 'none';
                        updateMoveButtonStates(outputVarsList);
                        return;
                    }
                    outputVarDetailsContainer.style.display = 'block';

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
                        }
                    });

                    // After populating details, sync button states
                    updateMoveButtonStates(outputVarsList);
                });

                // Initialize toggle behavior for each field
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
                        if (field.tagName === 'SELECT') { field.addEventListener('change', updateInputHandler); } else { field.addEventListener('input', updateInputHandler); field.addEventListener('change', updateInputHandler); }
                    }
                });

                if (outputVarsList && outputVarDetailsContainer && (!outputVarsList.value || outputVarsList.value === "")) {
                    outputVarDetailsContainer.style.display = 'none';
                }

                // Initialize move button states on load
                updateMoveButtonStates(outputVarsList);
            }

            // Buttons
            document.getElementById('copyOutputVarButton')?.addEventListener('click', () => {
                if (!outputVarsList) return;
                const names = [];
                for (let i = 0; i < outputVarsList.options.length; i++) { names.push(outputVarsList.options[i].text); }
                // Important: use \\n here so the generated script contains a literal "\\n" and not an actual newline character
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

            // Add output variable button functionality
            document.getElementById('add-output-var-btn')?.addEventListener('click', function() {
                // Show the add output variable modal
                createAddOutputVariableModal();
            });

            // Copy Page Init Flow Name Function
            function copyPageInitFlowName(flowName) {
                console.log('[DEBUG] PageInitDetails - Copy flow name requested for:', JSON.stringify(flowName));
                
                if (!flowName) {
                    console.warn('[WARN] PageInitDetails - Cannot copy: flow name not available');
                    return;
                }
                
                try {
                    // Copy to clipboard using the modern Clipboard API
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(flowName).then(() => {
                            console.log('Page Init Flow name copied to clipboard:', flowName);
                            // Provide visual feedback
                            const copyButton = document.querySelector('.copy-page-init-name-button .codicon');
                            if (copyButton) {
                                const originalClass = copyButton.className;
                                copyButton.className = 'codicon codicon-check';
                                setTimeout(() => {
                                    copyButton.className = originalClass;
                                }, 2000);
                            }
                        }).catch(err => {
                            console.error('Failed to copy Page Init Flow name: ', err);
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
                        const copyButton = document.querySelector('.copy-page-init-name-button .codicon');
                        if (copyButton) {
                            const originalClass = copyButton.className;
                            copyButton.className = 'codicon codicon-check';
                            setTimeout(() => {
                                copyButton.className = originalClass;
                            }, 2000);
                        }
                    }
                } catch (err) {
                    console.error('Error copying Page Init Flow name: ', err);
                }
            }

            // Make copyPageInitFlowName function globally available
            window.copyPageInitFlowName = copyPageInitFlowName;

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
                    case 'refreshOutputVarsList':
                        const outputVarsList = document.getElementById('outputVarsList');
                        if (outputVarsList) {
                            currentOutputVars = message.data;
                            const currentSelection = message.newSelection != null ? message.newSelection : outputVarsList.selectedIndex;
                            outputVarsList.innerHTML = '';
                            message.data.forEach((ov, i) => {
                                const opt = document.createElement('option');
                                opt.value = i; opt.textContent = ov.name || 'Unnamed Output Variable';
                                outputVarsList.appendChild(opt);
                            });
                            if (currentSelection >= 0 && currentSelection < message.data.length) {
                                outputVarsList.selectedIndex = currentSelection;
                                outputVarsList.dispatchEvent(new Event('change'));
                            }
                            // Ensure move buttons reflect the refreshed list
                            updateMoveButtonStates(outputVarsList);
                        }
                        break;
                }
            });
        })();
    `;
}

module.exports = { getClientScriptTemplate };

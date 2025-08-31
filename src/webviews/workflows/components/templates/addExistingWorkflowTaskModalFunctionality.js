/**
 * addExistingWorkflowTaskModalFunctionality.js
 * Client-side modal functionality for selecting existing workflow tasks
 * Last modified: 2024-12-28
 */

function getAddExistingWorkflowTaskModalFunctionality() {
    return `
        // Add Existing Workflow Task Modal Functions
        function createAddExistingWorkflowTaskModal() {
            console.log('[DEBUG] Creating Add Existing Workflow Task modal');
            
            // Remove any existing modal
            const existingModal = document.getElementById('addExistingWorkflowTaskModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Request available workflow tasks from the extension
            vscode.postMessage({
                command: 'getAvailableWorkflowTasks'
            });

            // Listen for the response with available tasks
            const messageHandler = (event) => {
                if (event.data.command === 'availableWorkflowTasksResponse') {
                    window.removeEventListener('message', messageHandler);
                    const availableTasks = event.data.data || [];
                    showAddExistingWorkflowTaskModal(availableTasks);
                }
            };
            window.addEventListener('message', messageHandler);
        }

        function showAddExistingWorkflowTaskModal(availableTasks) {
            console.log('[DEBUG] Showing Add Existing Workflow Task modal with', availableTasks.length, 'tasks');
            console.log('[DEBUG] Available tasks structure:', availableTasks);
            
            // Filter out tasks that are already in the current workflow
            const currentTaskNames = currentWorkflowTasks.map(wt => wt.name).filter(name => name);
            const filteredTasks = availableTasks.filter(task => !currentTaskNames.includes(task.name));
            
            console.log('[DEBUG] Filtered to', filteredTasks.length, 'available tasks');

            const modal = document.createElement('div');
            modal.id = 'addExistingWorkflowTaskModal';
            modal.className = 'modal-overlay';
            modal.innerHTML = \`
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Add Existing Workflow Task</h3>
                        <button class="modal-close-btn" onclick="window.closeAddExistingWorkflowTaskModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        \${filteredTasks.length === 0 ? 
                            '<p class="no-tasks-message">No existing workflow tasks available to add.</p>' :
                            \`
                            <div class="form-group">
                                <label for="taskFilter">Filter tasks:</label>
                                <input type="text" id="taskFilter" placeholder="Type to filter tasks..." class="filter-input">
                            </div>
                            <div class="form-group">
                                <label for="availableTasksList">Select existing workflow tasks to add:</label>
                                <select id="availableTasksList" multiple size="10" class="existing-tasks-select">
                                    \${filteredTasks.map(task => 
                                        \`<option value="\${task.name || 'UnnamedTask'}">\${task.name || 'Unnamed Task'}</option>\`
                                    ).join('')}
                                </select>
                                <p class="help-text">Hold Ctrl (Cmd on Mac) to select multiple tasks</p>
                            </div>
                            \`
                        }
                    </div>
                    <div class="modal-footer">
                        \${filteredTasks.length > 0 ? 
                            '<button class="btn btn-primary" onclick="window.addSelectedExistingWorkflowTasks()">Add Selected Tasks</button>' : 
                            ''
                        }
                        <button class="btn btn-secondary" onclick="window.closeAddExistingWorkflowTaskModal()">Cancel</button>
                    </div>
                </div>
            \`;

            document.body.appendChild(modal);
            
            // Add filter functionality if tasks are available
            if (filteredTasks.length > 0) {
                const filterInput = document.getElementById('taskFilter');
                const tasksList = document.getElementById('availableTasksList');
                const originalOptions = Array.from(tasksList.options);
                
                filterInput.addEventListener('input', function() {
                    const filterText = this.value.toLowerCase();
                    
                    // Clear current options
                    tasksList.innerHTML = '';
                    
                    // Filter and re-add options
                    const matchingOptions = originalOptions.filter(option => 
                        option.textContent.toLowerCase().includes(filterText)
                    );
                    
                    matchingOptions.forEach(option => {
                        tasksList.appendChild(option.cloneNode(true));
                    });
                });
            }
            
            // Focus the select element if there are tasks
            if (filteredTasks.length > 0) {
                setTimeout(() => {
                    const selectElement = document.getElementById('availableTasksList');
                    if (selectElement) {
                        selectElement.focus();
                    }
                }, 100);
            }
        }

        function closeAddExistingWorkflowTaskModal() {
            const modal = document.getElementById('addExistingWorkflowTaskModal');
            if (modal) {
                modal.remove();
            }
        }

        function addSelectedExistingWorkflowTasks() {
            const selectElement = document.getElementById('availableTasksList');
            if (!selectElement) {
                console.error('[ERROR] Available tasks select element not found');
                return;
            }

            const selectedOptions = Array.from(selectElement.selectedOptions);
            if (selectedOptions.length === 0) {
                alert('Please select at least one workflow task to add.');
                return;
            }

            const selectedTaskNames = selectedOptions.map(option => option.value);
            console.log('[DEBUG] Adding existing workflow tasks with names:', selectedTaskNames);

            // Send message to extension to add the selected tasks
            vscode.postMessage({
                command: 'addExistingWorkflowTasksToWorkflow',
                data: {
                    workflowObjectId: currentWorkflowObjectId,
                    taskNames: selectedTaskNames
                }
            });

            // Close the modal
            closeAddExistingWorkflowTaskModal();
        }

        // Make functions globally available
        window.closeAddExistingWorkflowTaskModal = closeAddExistingWorkflowTaskModal;
        window.addSelectedExistingWorkflowTasks = addSelectedExistingWorkflowTasks;

        // Event listener for the Add Existing Workflow Task button
        document.getElementById('add-existing-workflow-task-btn')?.addEventListener('click', function() {
            createAddExistingWorkflowTaskModal();
        });
    `;
}

module.exports = { getAddExistingWorkflowTaskModalFunctionality };

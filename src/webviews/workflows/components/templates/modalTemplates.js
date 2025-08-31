"use strict";

/**
 * File: modalTemplates.js
 * Purpose: Provides modal template                       <div class="form-actions">
                        <button type="button" id="addBulkWorkflowTasks" class="primary-button">Add Tasks</button>
                        <button type="button" class="secondary-button cancel-button">Cancel</button>
                    </div>               <div class="form-actions">
                        <button type="button" id="addSingleWorkflowTask" class="primary-button">Add Task</button>
                        <button type="button" class="secondary-button cancel-button">Cancel</button>
                    </div>for the workflow details view
 * Created: 2025-08-24
 */

/**
 * Gets the modal HTML for adding workflow tasks
 * @param {Object} workflowTaskSchema Schema for workflow task properties
 * @returns {string} HTML for the add workflow task modal
 */
function getWorkflowTaskModalHtml(workflowTaskSchema) {
    return `
    <div id="addModal" class="modal" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add New Workflow Task</h2>
                <span class="close-button">&times;</span>
            </div>
            <div class="modal-body">
                <div class="tabs">
                    <div class="tab active" data-tab="singleAdd">Single Task</div>
                    <div class="tab" data-tab="bulkAdd">Bulk Tasks</div>
                </div>
                
                <div id="singleAdd" class="tab-content active">
                    <form id="singleWorkflowTaskForm">
                        <div class="form-row">
                            <label for="workflowTaskName">Task Name:</label>
                            <input type="text" id="workflowTaskName" name="name" placeholder="Enter task name" required>
                        </div>
                        <div id="singleValidationError" class="validation-error"></div>
                        <div class="form-actions">
                            <button type="button" id="addSingleWorkflowTask" class="primary-button">Add Task</button>
                            <button type="button" class="secondary-button close-button">Cancel</button>
                        </div>
                    </form>
                </div>
                
                <div id="bulkAdd" class="tab-content">
                    <form id="bulkWorkflowTaskForm">
                        <div class="form-row">
                            <label for="bulkWorkflowTasks">Task Names (one per line):</label>
                            <textarea id="bulkWorkflowTasks" name="bulkTasks" rows="10" placeholder="Task1\nTask2\nTask3"></textarea>
                        </div>
                        <div id="bulkValidationError" class="validation-error"></div>
                        <div class="form-actions">
                            <button type="button" id="addBulkWorkflowTasks" class="primary-button">Add Tasks</button>
                            <button type="button" class="secondary-button close-button">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>`;
}

/**
 * Gets the Add Workflow Task Modal HTML template
 * @returns {string} HTML template for the modal
 */
function getAddWorkflowTaskModalHtml() {
    return `
    <div class="modal-content">
        <div class="modal-header">
            <h2>Add New Workflow Task</h2>
            <span class="close-button">&times;</span>
        </div>
        <div class="modal-body">
            <div class="tabs">
                <div class="tab active" data-tab="singleAdd">Single Task</div>
                <div class="tab" data-tab="bulkAdd">Bulk Tasks</div>
            </div>
            
            <div id="singleAdd" class="tab-content active">
                <form id="singleWorkflowTaskForm">
                    <div class="form-row">
                        <label for="workflowTaskName">Task Name:</label>
                        <input type="text" id="workflowTaskName" name="name" placeholder="Enter task name" required>
                    </div>
                    <div id="singleValidationError" class="validation-error"></div>
                    <div class="form-actions">
                        <button type="button" id="addSingleWorkflowTask" class="primary-button">Add Task</button>
                        <button type="button" class="secondary-button cancel-button">Cancel</button>
                    </div>
                </form>
            </div>
            
            <div id="bulkAdd" class="tab-content">
                <form id="bulkWorkflowTaskForm">
                    <div class="form-row">
                        <label for="bulkWorkflowTasks">Task Names (one per line):</label>
                        <textarea id="bulkWorkflowTasks" name="bulkTasks" rows="10" placeholder="Task1\\nTask2\\nTask3"></textarea>
                    </div>
                    <div id="bulkValidationError" class="validation-error"></div>
                    <div class="form-actions">
                        <button type="button" id="addBulkWorkflowTasks" class="primary-button">Add Tasks</button>
                        <button type="button" class="secondary-button cancel-button">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>`;
}

module.exports = {
    getWorkflowTaskModalHtml,
    getAddWorkflowTaskModalHtml
};

"use strict";
const { getDetailViewStyles } = require("../../styles/detailsViewStyles");

function getMainTemplate(
    flow,
    workflowTaskCount,
    settingsHtml,
    workflowTaskListViewFields,
    workflowTaskModalHtml,
    clientScript,
    codiconsUri,
    ownerObject = null
) {
    const flowName = (flow && flow.name) || 'Unknown Workflow';
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workflow Details: ${flowName}</title>
    <link href="${codiconsUri}" rel="stylesheet" />
    <style>
        ${getDetailViewStyles()}
    </style>
    </head>
<body>
    <div class="header-container">
        <h1 class="header-title">Details for ${flowName} Workflow</h1>
        <button class="copy-workflow-name-button" onclick="copyWorkflowName('${flowName || ''}')" title="Copy Workflow Name">
            <i class="codicon codicon-copy"></i>
        </button>
    </div>

    ${ownerObject ? `
    <div class="owner-data-object-section">
        <span class="owner-data-object-label">Owner Data Object:</span>
        <span class="owner-data-object-name">${ownerObject.name || 'Unknown Object'}</span>
        <button class="edit-owner-button" onclick="openOwnerObjectDetails('${ownerObject.name || ''}')" title="Edit owner data object">
            <i class="codicon codicon-edit"></i>
        </button>
    </div>
    ` : ''}

    <div class="tabs" role="tablist">
        <div class="tab active" role="tab" tabindex="0" data-tab="settings">Settings</div>
        <div class="tab" role="tab" tabindex="0" data-tab="workflowTasks">Workflow Tasks (${workflowTaskCount})</div>
    </div>

    <div id="settings" class="tab-content active">
        ${settingsHtml}
    </div>

    <div id="workflowTasks" class="tab-content">
        <div class="view-icons" data-tab="workflowTasks">
            <div class="workflow-task-buttons">
                <button id="add-workflow-task-btn" class="add-prop-button">Add New Workflow Task</button>
                <button id="add-existing-workflow-task-btn" class="add-prop-button">Add Existing Workflow Task</button>
            </div>
        </div>

        <div id="workflowTasksListView" class="view-content active">
            <div class="list-container">
                <select id="workflowTasksList" size="10">
                    ${(flow.dynaFlowTask || []).map((workflowTask, index) => {
                        const name = (workflowTask && typeof workflowTask === 'object' && workflowTask.name) ? workflowTask.name : 'Unnamed Workflow Task';
                        return `<option value="${index}">${name}</option>`;
                    }).join('')}
                </select>
                <div class="list-buttons">
                    <button id="copyWorkflowTaskButton" class="copy-props-button">Copy List</button>
                    <button id="moveUpWorkflowTaskButton" class="move-button">Move Up</button>
                    <button id="moveDownWorkflowTaskButton" class="move-button">Move Down</button>
                    <button id="reverseWorkflowTaskButton" class="reverse-button">Reverse</button>
                </div>
            </div>
            <div id="workflowTaskDetailsContainer" class="details-container" style="display: none;">
                <form id="workflowTaskDetailsForm">
                    ${workflowTaskListViewFields}
                </form>
            </div>
        </div>
    </div>

    <!-- Modals for adding/editing items -->
    ${workflowTaskModalHtml}

    <script>
        // Initialize vscode messaging
        const vscode = acquireVsCodeApi();
        const flow = ${JSON.stringify(flow)};
        ${clientScript}
    </script>
</body>
</html>`;
}

module.exports = { getMainTemplate };

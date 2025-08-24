"use strict";
// generalFlow mainTemplate – touch for rebuild
const { getDetailViewStyles } = require("../../styles/detailsViewStyles");

function getMainTemplate(
    flow,
    paramCount,
    outputVarCount,
    settingsHtml,
    paramListViewFields,
    outputVarListViewFields,
    paramModalHtml,
    outputVarModalHtml,
    clientScript,
    codiconsUri,
    ownerObject = null
) {
    const flowName = flow && (flow.titleText || flow.name) ? (flow.titleText || flow.name) : 'Unknown Flow';
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>General Flow Details: ${flowName}</title>
    <link href="${codiconsUri}" rel="stylesheet" />
    <style>
        ${getDetailViewStyles()}
    </style>
</head>
<body>
    <div class="header-container">
        <h1 class="header-title">Details for ${flowName} General Flow</h1>
        <button class="copy-page-init-name-button" onclick="copyGeneralFlowName('${flowName || ''}')" title="Copy General Flow Name">
            <i class="codicon codicon-copy"></i>
        </button>
    </div>

    <div class="tabs">
        <div class="tab active" data-tab="settings">Settings</div>
        <div class="tab" data-tab="params">Input Controls (${paramCount})</div>
        <div class="tab" data-tab="outputVars">Output Variables (${outputVarCount})</div>
    </div>

    <div id="settings" class="tab-content active">
        ${settingsHtml}
    </div>

    <div id="params" class="tab-content">
        <div class="view-icons" data-tab="params">
            <button id="add-param-btn" class="add-prop-button">Add Input Control</button>
        </div>

        <div id="paramsListView" class="view-content active">
            <div class="list-container">
                <select id="paramsList" size="10">
                    ${(flow.objectWorkflowParam || []).map((param, index) => {
                        const name = (param && typeof param === 'object' && param.name) ? param.name : 'Unnamed Input Control';
                        return `<option value="${index}">${name}</option>`;
                    }).join('')}
                </select>
                <div class="list-buttons">
                    <button id="copyParamsButton" class="copy-props-button">Copy List</button>
                    <button id="moveUpParamsButton" class="move-button">Move Up</button>
                    <button id="moveDownParamsButton" class="move-button">Move Down</button>
                    <button id="reverseParamsButton" class="reverse-button">Reverse</button>
                </div>
            </div>
            <div id="paramDetailsContainer" class="details-container" style="display: none;">
                <form id="paramDetailsForm">
                    ${paramListViewFields}
                </form>
            </div>
        </div>
    </div>

    <div id="outputVars" class="tab-content">
        <div class="view-icons" data-tab="outputVars">
            <button id="add-output-var-btn" class="add-prop-button">Add Output Variable</button>
        </div>

        <div id="outputVarsListView" class="view-content active">
            <div class="list-container">
                <select id="outputVarsList" size="10">
                    ${(flow.objectWorkflowOutputVar || []).map((outputVar, index) => {
                        const name = (outputVar && typeof outputVar === 'object' && outputVar.name) ? outputVar.name : 'Unnamed Output Variable';
                        return `<option value="${index}">${name}</option>`;
                    }).join('')}
                </select>
                <div class="list-buttons">
                    <button id="copyOutputVarButton" class="copy-props-button">Copy List</button>
                    <button id="moveUpOutputVarButton" class="move-button">Move Up</button>
                    <button id="moveDownOutputVarButton" class="move-button">Move Down</button>
                    <button id="reverseOutputVarButton" class="reverse-button">Reverse</button>
                </div>
            </div>
            <div id="outputVarDetailsContainer" class="details-container" style="display: none;">
                <form id="outputVarDetailsForm">
                    ${outputVarListViewFields}
                </form>
            </div>
        </div>
    </div>

    <!-- No Modal HTML needed - created dynamically like Page Init -->

    <script>
        const vscode = acquireVsCodeApi();
        const flow = ${JSON.stringify(flow)};
        ${clientScript}
    </script>
</body>
</html>`;
}

module.exports = { getMainTemplate };

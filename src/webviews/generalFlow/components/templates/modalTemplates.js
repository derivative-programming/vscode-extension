"use strict";
// generalFlow modalTemplates - self-contained approach matching Page Init

function getAddInputControlModalHtml() {
    return `
<div class="modal-content">
    <span class="close-button">&times;</span>
    <h2>Add Input Param</h2>
    <div class="tabs">
        <div class="tab active" data-tab="singleAdd">Single Input Param</div>
        <div class="tab" data-tab="bulkAdd">Bulk Add</div>
    </div>
    <div id="singleAdd" class="tab-content active">
        <div class="form-row">
            <label for="inputControlName">Input Param Name:</label>
            <input type="text" id="inputControlName">
            <div class="field-note">Use Pascal case (Example: FirstName). No spaces are allowed in names. Alpha characters only. Maximum 100 characters.</div>
        </div>
        <div id="singleValidationError" class="validation-error"></div>
        <button id="addSingleInputControl">Add Input Param</button>
    </div>
    <div id="bulkAdd" class="tab-content">
        <div class="form-row">
            <label for="bulkInputControls">Input Param Names (one per line):</label>
            <textarea id="bulkInputControls" rows="5"></textarea>
            <div class="field-note">Use Pascal case (Example: FirstName). No spaces are allowed in names. Alpha characters only. Maximum 100 characters.</div>
        </div>
        <div id="bulkValidationError" class="validation-error"></div>
        <button id="addBulkInputControls">Add Input Params</button>
    </div>
</div>`;
}

function getAddOutputVariableModalHtml() {
    return `
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
</div>`;
}

function getParamModalHtml(paramSchema) {
    return `
<div id="addParamModal" class="modal" style="display:none;">
    ${getAddInputControlModalHtml()}
</div>`;
}

function getOutputVarModalHtml(outputVarSchema) {
    return `
<div id="addOutputVarModal" class="modal" style="display:none;">
    ${getAddOutputVariableModalHtml()}
</div>`;
}

module.exports = { getParamModalHtml, getOutputVarModalHtml, getAddInputControlModalHtml, getAddOutputVariableModalHtml };

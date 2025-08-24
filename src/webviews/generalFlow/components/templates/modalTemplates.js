"use strict";
// generalFlow modalTemplates reuse forms with complete functionality

const { getAddInputControlModalHtml } = require("../../../forms/components/templates/addInputControlModalTemplate");
const { getAddOutputVariableModalHtml } = require("../../../forms/components/templates/addOutputVariableModalTemplate");

function getParamModalHtml(paramSchema) {
    return `
<div id="addInputControlModal" class="modal" style="display:none;">
    ${getAddInputControlModalHtml()}
</div>`;
}

function getOutputVarModalHtml(outputVarSchema) {
    return `
<div id="addOutputVarModal" class="modal" style="display:none;">
    ${getAddOutputVariableModalHtml()}
</div>`;
}

module.exports = { getParamModalHtml, getOutputVarModalHtml };
